// src/config/embed-profile.ts
// The provider preset's doc-index embedding profile → a project's committed
// index config (issue #541 S2, S4, S7).
//
// Three rules, and the crate owns two of them:
//
//   * **Precedence is per key.** A value the project's `index.json` already
//     carries always wins — the operator's instruction is nearer than any
//     preset — so a materialization only fills keys that are *absent*, and it
//     never rewrites a value it wrote itself on an earlier run (a second run
//     writes nothing). `pacing` is decided knob by knob, not as a block.
//   * **Validation is the crate's.** The candidate body is judged by
//     `validateIndexConfigObject` from `@gtrabanco/agentic-workflow` before a
//     byte is written, so a bad preset value is refused rather than staged, and
//     this package keeps no copy of the schema.
//   * **Origin is reported, never inferred from anything else.** A key's origin
//     is derived by comparing the value in force with the preset's: equal ⇒
//     `preset` (the statement is true whether the value was written by this
//     module or by hand), different ⇒ `user`, absent ⇒ `default` (the crate's
//     shipped value is what runs).
//
// Nothing here names a provider: the profile is data handed in by the seam.

import { readFileSync } from "node:fs";

import type { IndexConfig, PacingConfig, ProviderConfig } from "@gtrabanco/agentic-workflow/src/doc/config.mjs";
import {
  DEFAULT_MAX_REQUEST_CHARS,
  DEFAULT_PACING,
  MAX_REQUEST_CHARS_ENV,
  configPath,
  validateIndexConfigObject,
} from "@gtrabanco/agentic-workflow/src/doc/config.mjs";

/** Where one value in force came from (the closed set the report renders). */
export const EMBED_PROFILE_ORIGINS = Object.freeze(["preset", "user", "default"] as const);
export type EmbedProfileOrigin = (typeof EMBED_PROFILE_ORIGINS)[number];

/** One key of the provider block, as the operator reads it. */
export interface EmbedProfileRow {
  /** Dotted path inside the config, e.g. `provider.pacing.batchSize`. */
  readonly key: string;
  readonly origin: EmbedProfileOrigin;
  /** The value in force today, rendered (`(none — keyword-only)` when absent). */
  readonly inForce: string;
  /** The preset's value for this key, rendered, or `null` when it declares none. */
  readonly presetValue: string | null;
  /** Whether the write fills this key (only an absent key the preset declares). */
  readonly willWrite: boolean;
}

/** The plan: what the file holds, where each value came from, what a write fills. */
export interface EmbedProfilePlan {
  readonly provider: string;
  readonly path: string;
  /** Whether the file exists at all. */
  readonly present: boolean;
  readonly rows: readonly EmbedProfileRow[];
  /** Dotted keys the write would fill, in the report's order. */
  readonly fills: readonly string[];
  /** The merged provider block a write would stage. */
  readonly next: ProviderConfig;
  /** What the file's provider block holds today, or `null` when absent. */
  readonly current: ProviderConfig | null;
  /** Every other top-level block the file carries, preserved verbatim on write. */
  readonly siblings: Omit<IndexConfig, "provider">;
}

/** Why a materialization refused — the surface names this, tests pin it. */
export type EmbedProfileRefusalReason = "invalid-index-config" | "invalid-profile" | "write-failed";

/** A refusal that left every byte untouched. */
export class EmbedProfileRefusal extends Error {
  readonly reason: EmbedProfileRefusalReason;

  constructor(reason: EmbedProfileRefusalReason, message: string) {
    super(message);
    this.name = "EmbedProfileRefusal";
    this.reason = reason;
  }
}

/** The profile plus the id of the preset that carries it. */
export interface EmbedProfileEntry {
  readonly provider: string;
  readonly profile: ProviderConfig;
}

export interface EmbedProfileDeps {
  readonly root: string;
  readonly entry: EmbedProfileEntry;
  /** Reads one absolute path's text, or `null` when the file is absent. */
  readonly readFile: (path: string) => string | null;
}

/** The scalar provider keys, in the order the report and the write use. */
const PROVIDER_KEYS = ["baseUrl", "model", "envVar", "chunk_limit", "max_request_chars"] as const;

/** The pacing knobs the crate declares (its own closed set, never a copy here). */
const PACING_KEYS = Object.keys(DEFAULT_PACING) as (keyof PacingConfig)[];

/** The dotted key of one provider field, or of one pacing knob. */
const providerKey = (name: string): string => `provider.${name}`;
const pacingKey = (name: string): string => `provider.pacing.${name}`;

/** A JSON value rendered the way the report prints it. */
function renderValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

/** The crate's shipped value for a key, or `null` when the crate has no default. */
function shippedDefault(name: string): string | null {
  if (name === "max_request_chars") return String(DEFAULT_MAX_REQUEST_CHARS);
  if (name in DEFAULT_PACING) return String(DEFAULT_PACING[name as keyof PacingConfig]);
  return null;
}

/** The read + parse half: the file's body, or `null` when the file is absent. */
function readIndexConfig(path: string, readFile: (path: string) => string | null): IndexConfig | null {
  const text = readFile(path);
  if (text === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new EmbedProfileRefusal(
      "invalid-index-config",
      `${path} is not valid JSON (${error instanceof Error ? error.message : String(error)}) — fix it before a profile can be applied`,
    );
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new EmbedProfileRefusal("invalid-index-config", `${path} must be a JSON object`);
  }
  return parsed as IndexConfig;
}

/**
 * Read the project's index config and work out what a materialization would do.
 * Pure with respect to the filesystem beyond the injected `readFile`; an
 * unparseable file is refused here, before any question is asked.
 */
export function planEmbedProfile({ root, entry, readFile }: EmbedProfileDeps): EmbedProfilePlan {
  const path = configPath(root);
  const body = readIndexConfig(path, readFile);
  const current = body?.provider ?? null;
  // A `provider` that is present but not an object (`"provider": "acme"`, an
  // array, `true`) cannot be merged per key at all: refuse it here, where the
  // reason is visible, instead of building a candidate the crate would then
  // reject with a message about a key nobody names.
  if (current !== null && (typeof current !== "object" || Array.isArray(current))) {
    throw new EmbedProfileRefusal(
      "invalid-index-config",
      `${path} has a provider block that is not an object (${JSON.stringify(current)}) — fix it before a profile can be applied`,
    );
  }
  const preset = entry.profile;

  const rows: EmbedProfileRow[] = [];
  const fills: string[] = [];
  const next: ProviderConfig = {};
  // Copy the operator's block first, so nothing they wrote can be dropped by a
  // merge that only ever adds keys.
  if (current !== null) Object.assign(next, structuredClone(current));

  const decide = (key: string, presetValue: unknown, currentValue: unknown, shipped: string | null): void => {
    const declared = presetValue !== undefined;
    if (currentValue !== undefined) {
      const same = JSON.stringify(currentValue) === JSON.stringify(presetValue);
      rows.push({
        key,
        origin: declared && same ? "preset" : "user",
        inForce: renderValue(currentValue),
        presetValue: declared ? renderValue(presetValue) : null,
        willWrite: false,
      });
      return;
    }
    // Absent from the file: either the preset declares it (and the write fills
    // it) or the crate's shipped default is what runs today.
    rows.push({
      key,
      origin: "default",
      inForce: shipped ?? "(none — keyword-only)",
      presetValue: declared ? renderValue(presetValue) : null,
      willWrite: declared,
    });
    if (declared) fills.push(key);
  };

  for (const name of PROVIDER_KEYS) {
    if (preset[name] !== undefined) decide(providerKey(name), preset[name], current?.[name], shippedDefault(name));
  }
  const currentPacing = current?.pacing ?? {};
  const presetPacing = preset.pacing ?? {};
  for (const name of PACING_KEYS) {
    if (presetPacing[name] !== undefined) {
      decide(pacingKey(name), presetPacing[name], currentPacing[name], shippedDefault(name));
    }
  }
  // Keys only the operator declared: reported as theirs, never touched.
  for (const name of Object.keys(current ?? {})) {
    if (name === "pacing") continue;
    if (preset[name as keyof ProviderConfig] !== undefined || current?.[name as keyof ProviderConfig] === undefined) continue;
    decide(providerKey(name), undefined, current?.[name as keyof ProviderConfig], null);
  }
  for (const name of Object.keys(currentPacing)) {
    if (name in presetPacing || currentPacing[name as keyof PacingConfig] === undefined) continue;
    decide(pacingKey(name), undefined, currentPacing[name as keyof PacingConfig], null);
  }

  // Build the block the write stages: the operator's values, plus the absent
  // keys the preset declares — per provider key and per pacing knob.
  for (const name of PROVIDER_KEYS) {
    if (preset[name] === undefined || current?.[name] !== undefined) continue;
    (next as Record<string, unknown>)[name] = preset[name];
  }
  const mergedPacing: PacingConfig = { ...(next.pacing ?? {}) };
  for (const name of PACING_KEYS) {
    if (presetPacing[name] === undefined || currentPacing[name] !== undefined) continue;
    mergedPacing[name] = presetPacing[name];
  }
  if (Object.keys(mergedPacing).length > 0) next.pacing = mergedPacing;

  return {
    provider: entry.provider,
    path,
    present: body !== null,
    rows,
    fills,
    next,
    current: current === null ? null : structuredClone(current),
    siblings: body === null ? {} : (({ provider: _provider, ...rest }) => rest)(body),
  };
}

/** What a write did: the text it staged (or `null` when there was nothing to do). */
export interface EmbedProfileWrite {
  readonly path: string;
  readonly wrote: boolean;
  readonly text: string | null;
  readonly plan: EmbedProfilePlan;
}

/**
 * Stage the plan into the file. The candidate body is validated by the crate
 * **first** — a body the loader would refuse never reaches the disk — and the
 * file keeps every other top-level block exactly as the operator wrote it. A new
 * file states the config `version` the loader expects; an existing one keeps
 * whatever it had.
 */
export function applyEmbedProfile({
  root,
  plan,
  writeFile,
}: {
  root: string;
  plan: EmbedProfilePlan;
  writeFile: (path: string, text: string) => void;
}): EmbedProfileWrite {
  if (plan.fills.length === 0) return { path: plan.path, wrote: false, text: null, plan };

  // A new file states the config `version` the loader expects; an existing file
  // keeps every block it already carries, byte for byte apart from `provider`.
  const body: IndexConfig = plan.present
    ? { ...structuredClone(plan.siblings), provider: plan.next }
    : { version: 1, provider: plan.next };

  try {
    validateIndexConfigObject(root, body);
  } catch (error) {
    throw new EmbedProfileRefusal(
      "invalid-profile",
      `refusing to write ${plan.path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const text = `${JSON.stringify(body, null, 2)}\n`;
  try {
    writeFile(plan.path, text);
  } catch (error) {
    throw new EmbedProfileRefusal(
      "write-failed",
      `could not write ${plan.path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  return { path: plan.path, wrote: true, text, plan };
}

/**
 * The report an operator reads: one line per key, the value in force and where
 * it came from, then what a write would do (or that there is nothing to do).
 */
export function renderEmbedProfileReport(plan: EmbedProfilePlan): string[] {
  const lines = [
    `doc-index embedding profile — ${plan.provider}`,
    `  ${plan.path}${plan.present ? "" : " (absent — the file is created on write)"}`,
    ...plan.rows.map((row) => {
      const preset =
        row.presetValue === null
          ? " (no preset value)"
          : row.origin === "preset"
            ? ""
            : ` (preset: ${row.presetValue})`;
      return `  ${row.key} = ${row.inForce} · ${row.origin}${preset}`;
    }),
  ];
  lines.push(
    plan.fills.length === 0
      ? "  nothing to fill — every key the preset declares already has a value"
      : `  ${plan.fills.length} key(s) to fill from the preset · ${plan.rows.length - plan.fills.length} kept as written`,
  );
  return lines;
}

// ---------------------------------------------------------------------------
// Default-on resolution (issue #719 S1/S4)
// ---------------------------------------------------------------------------
//
// A session that carries the preset and the provider's key variable but no
// committed provider block used to answer keyword-only until somebody
// discovered the preset, materialized it and ran a sync. The resolver removes
// that ceremony without a crate change and without rewriting anything:
//
//   * the crate already resolves a provider from three direct env vars, and the
//     **key variable is the whole gate** — the preset names it
//     (`envVar`, `NAN_API_KEY` for NaN) and nothing else is needed once
//     `baseUrl` + `model` come from the profile;
//   * the committed `index.json` is a decision surface, so a provider block an
//     operator wrote always wins and is never merged into — the default only
//     applies to an **absent** block (`provider` unset or `null`);
//   * the values are exported into the host process, which every spawned runner
//     child inherits, so `doc --sync` and `doc --query` resolve the provider
//     env-only. No file is written: the materialization route stays opt-in.

/**
 * The crate's direct env-var names, spelled here because the crate keeps its
 * copy private (`embeddings.mjs`'s `DIRECT_ENV`). These three names *are* the
 * crate's public surface — `AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_URL/MODEL/
 * API_KEY` is the documented env-only provider path — so the resolver names them
 * once and every caller imports this object instead of re-typing a string.
 */
export const EMBED_DIRECT_ENV = Object.freeze({
  baseUrl: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_URL",
  model: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MODEL",
  apiKey: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_API_KEY",
});

/** Re-exported so a caller names the budget variable without importing the crate
 *  (the console and the wiring both read it). */
export { MAX_REQUEST_CHARS_ENV as EMBED_MAX_REQUEST_CHARS_ENV };

/** Why the default-on decision went the way it did — the closed reason set. */
export const EMBED_DEFAULT_ON_REASONS = Object.freeze([
  "default-on",
  "explicit-provider-block",
  "no-provider-key",
  "operator-environment",
  "unreadable-config",
] as const);
export type EmbedDefaultOnReason = (typeof EMBED_DEFAULT_ON_REASONS)[number];

/** The decision: whether to inject, why, and the exact variables to export. */
export interface EmbedDefaultOnPlan {
  readonly provider: string;
  readonly reason: EmbedDefaultOnReason;
  /** True only when every variable in `env` may be exported. */
  readonly inject: boolean;
  /** The variables to export; empty whenever `inject` is false. */
  readonly env: Readonly<Record<string, string>>;
  /** The operator-facing line the extension prints when the default applies. */
  readonly detail: string | null;
}

export interface EmbedDefaultOnDeps {
  readonly entry: EmbedProfileEntry;
  readonly root: string;
  /**
   * Where the preset's `envVar` key is read from; defaults to `process.env`.
   * Kept separate from `processEnv` so a caller can inject a credential without
   * pretending it already lives in the process.
   */
  readonly env?: Record<string, string | undefined>;
  /**
   * The process surface the exported variables land in, and the one an operator's
   * own exports are read from. Defaults to `process.env` — production passes
   * nothing.
   */
  readonly processEnv?: Record<string, string | undefined>;
  /**
   * Reads one absolute path's text, or `null` when the file is absent. Defaults
   * to the real filesystem: the extension load is the production caller and it
   * has no file seam of its own, so the resolver owns the default read and a
   * suite injects its own bytes.
   */
  readonly readFile?: (path: string) => string | null;
}

/** The provider block the file holds, `null` when absent, or the refusal text. */
function readProviderBlock(
  path: string,
  readFile: (path: string) => string | null,
): { ok: true; provider: ProviderConfig | null } | { ok: false; detail: string } {
  const text = readFile(path);
  if (text === null) return { ok: true, provider: null };
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { ok: false, detail: `${path} is not valid JSON (${error instanceof Error ? error.message : String(error)})` };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, detail: `${path} must be a JSON object` };
  }
  const provider = (parsed as IndexConfig).provider;
  // `null`/absent is the crate's own keyword-only default; anything else — even
  // an empty object — is a block the operator wrote, so it withholds the default.
  return { ok: true, provider: provider ?? null };
}

/** The default read: a file's text, `null` when it does not exist, a refusal when it cannot be read. */
function readTextFileOrNull(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Decide whether the preset's profile applies to this project by default.
 * Pure with respect to the filesystem beyond the injected `readFile` and to the
 * process beyond the injected `env`.
 */
export function planEmbedDefaultOn({
  entry,
  root,
  env = process.env,
  processEnv = process.env,
  readFile = readTextFileOrNull,
}: EmbedDefaultOnDeps): EmbedDefaultOnPlan {
  const profile = entry.profile;
  const withholds = (reason: EmbedDefaultOnReason, detail: string | null): EmbedDefaultOnPlan => ({
    provider: entry.provider,
    reason,
    inject: false,
    env: {},
    detail,
  });

  const path = configPath(root);
  const read = readProviderBlock(path, readFile);
  if (!read.ok) return withholds("unreadable-config", read.detail);
  if (read.provider !== null) return withholds("explicit-provider-block", null);

  // The key variable is the gate (`envVar`); an empty or whitespace value is an
  // absent credential, never one this resolver makes up.
  const keyName = profile.envVar;
  const apiKey = keyName ? env[keyName]?.trim() : undefined;
  if (!keyName || !apiKey) return withholds("no-provider-key", null);
  if (!profile.baseUrl || !profile.model) return withholds("no-provider-key", null);

  // An operator who exported the crate's own variables already chose a provider;
  // a partial set is still their choice, and half-injecting around it would
  // produce a mixture nobody asked for.
  const exported = Object.values(EMBED_DIRECT_ENV).filter((name) => (processEnv[name] ?? "") !== "");
  if (exported.length > 0) return withholds("operator-environment", null);

  const variables: Record<string, string> = {
    [EMBED_DIRECT_ENV.baseUrl]: profile.baseUrl,
    [EMBED_DIRECT_ENV.model]: profile.model,
    [EMBED_DIRECT_ENV.apiKey]: apiKey,
  };
  // Tuning parity (D3): the preset's measured chunk × batch pair is what one
  // request may carry, and the crate adopts the request budget as the chunk limit
  // when no explicit `chunk_limit` is configured — so the pair travels as the
  // budget, with no crate change and no new env name.
  const chunkLimit = profile.chunk_limit;
  const batchSize = profile.pacing?.batchSize;
  if (typeof chunkLimit === "number" && typeof batchSize === "number" && chunkLimit > 0 && batchSize > 0) {
    variables[MAX_REQUEST_CHARS_ENV] = String(chunkLimit * batchSize);
  }

  return {
    provider: entry.provider,
    reason: "default-on",
    inject: true,
    env: variables,
    detail: `${entry.provider} doc-index embeddings resolved by default (${profile.baseUrl}, ${profile.model}) — no index.json provider block was found`,
  };
}

/** What applying the plan did to the process surface. */
export interface EmbedDefaultOnResult {
  readonly applied: boolean;
  readonly plan: EmbedDefaultOnPlan;
}

/**
 * Apply the plan to the process environment — the one impure step, and the only
 * thing the extension load has to do. Idempotent: a variable already carrying the
 * plan's value is not rewritten, so a second load in the same process reports
 * `applied: false` instead of re-exporting. A plan whose `env` is empty never
 * touches the process.
 */
export function applyEmbedDefaultOn(deps: EmbedDefaultOnDeps): EmbedDefaultOnResult {
  const target = deps.processEnv ?? process.env;
  const plan = planEmbedDefaultOn({ ...deps, processEnv: target });
  if (!plan.inject) return { applied: false, plan };
  let changed = false;
  for (const [name, value] of Object.entries(plan.env)) {
    if (target[name] === value) continue;
    target[name] = value;
    changed = true;
  }
  return { applied: changed, plan };
}
