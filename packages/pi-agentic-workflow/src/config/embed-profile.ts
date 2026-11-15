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

import type { IndexConfig, PacingConfig, ProviderConfig } from "@gtrabanco/agentic-workflow/src/doc/config.mjs";
import {
  DEFAULT_MAX_REQUEST_CHARS,
  DEFAULT_PACING,
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
