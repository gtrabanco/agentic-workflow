/**
 * The unified config machine contract (issue #427).
 *
 * Three layers meet here and nowhere else:
 *  - the base feature sections the framework owns (`logSession`, `memory`,
 *    `telemetry`, `guards`, `advance`, `pathProtection`);
 *  - the extension contract a package ships (its own section, its own file);
 *  - the fill-in resolver: project over global, then shipped defaults only for
 *    keys the operator left UNDEFINED (never a deep merge of defaults).
 *
 * The package stays dependency-free: the validator is the subset of JSON Schema
 * this contract publishes, and the emitted `config.schema.json` is generated
 * from the same descriptors a runtime uses, so the two cannot drift.
 */

import { CONTENT_AUTHOR_ASSOCIATIONS } from "./content-guard.js";
import { DOC_RETENTION_DEFAULTS, DOC_RETENTION_MODES, DOC_RETENTION_SCHEMA } from "./doc-retention.js";

export type ConfigCategory = "feature" | "pi";

export interface JsonSchema {
  $schema?: string;
  $id?: string;
  title?: string;
  type?: string | readonly string[];
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  required?: readonly string[];
  enum?: readonly unknown[];
  const?: unknown;
  items?: JsonSchema;
  minItems?: number;
  maxItems?: number;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  anyOf?: readonly JsonSchema[];
  oneOf?: readonly JsonSchema[];
  description?: string;
  default?: unknown;
}

export interface ConfigSectionSpec {
  key: string;
  category: ConfigCategory;
  file: string;
  /** `[key]` for a section inside the base file; `[]` for an extension file root. */
  path: readonly string[];
  description: string;
  schema: JsonSchema;
  defaults: Record<string, unknown>;
  /** A section-specific project-over-global merge; absent means deep-merge. */
  merge?: (globalValue: unknown, projectValue: unknown) => unknown;
}

export interface ConfigIssue {
  path: string;
  message: string;
}

export const CONFIG_EXTENSION_CONTRACT = "config-extension@1";

/** What a package ships (and the CLI discovers) to publish its own section. */
export interface ConfigExtensionDescriptor {
  contract: typeof CONFIG_EXTENSION_CONTRACT;
  key: string;
  file: string;
  description: string;
  schema: JsonSchema;
  defaults: Record<string, unknown>;
}

/**
 * The base config's canonical identity (#740 S4): the stem, never a file name.
 * A scope directory carries `<stem>.json`, `<stem>.jsonc` or `<stem>.json5`, and
 * every reader resolves the stem with the same precedence.
 */
export const BASE_CONFIG_STEM = "agentic-workflow";

/** The extensions a config file may carry, in resolution order (#740 S2). */
export const CONFIG_FILE_EXTENSIONS = Object.freeze([".json", ".jsonc", ".json5"] as const);

/** The extension a new config file is created with (#740 S3). */
export const DEFAULT_CONFIG_EXTENSION = ".json5";

export const CONFIG_EXTENSIONS_DIR = "config-extensions";

/** Every file name a stem may occupy, in silent precedence order. */
export function configFileCandidates(stem: string): string[] {
  return CONFIG_FILE_EXTENSIONS.map((extension) => `${stem}${extension}`);
}

/**
 * The file a stem occupies: the first candidate the caller's `exists` predicate
 * reports, or the create name when none does. The predicate takes the file NAME
 * so each host resolves inside its own scope directory (or over its own seam).
 */
export function resolveConfigFileName(stem: string, exists: (fileName: string) => boolean): string {
  for (const candidate of configFileCandidates(stem)) {
    if (exists(candidate)) return candidate;
  }
  return `${stem}${DEFAULT_CONFIG_EXTENSION}`;
}

const LOG_SESSION_MAX_ARGV = 32;
const LOG_SESSION_MAX_TIMEOUT_MS = 60_000;
const PATH_GLOB_MAX_LENGTH = 512;
const PATH_REQUIREMENTS = ["none", "justification", "approval"] as const;
const GIT_IDENTITY_ALLOW_MAX = 64;
const PATH_OPERATIONS = ["create", "modify", "delete", "rename"] as const;
const PATH_PHASE_STATES = ["pre-freeze", "post-freeze", "always"] as const;

/**
 * The guard disposition vocabulary (issue #626). One publisher, three values:
 *
 *   * `allow` — the guard stands down and the action runs untouched;
 *   * `deny` — the guard refuses without asking, and its reason teaches the
 *     supported route;
 *   * `ask` — the guard asks the operator when the host has a UI, and answers
 *     `deny` when it cannot ask (a headless session is never asked).
 *
 * `deny` replaces the retired `block` spelling: `block` named the mechanism, not
 * the decision, and read as "stops" rather than "refuses".
 */
export const GUARD_MODES = Object.freeze(["allow", "deny", "ask"] as const);
export type GuardMode = (typeof GUARD_MODES)[number];

/**
 * The guards whose disposition is configurable, in the order the reference
 * table documents them (issue #626). A guard not named here has no disposition
 * on purpose: `pathProtection` is tighten-only and `contentGuard` is always on,
 * so neither can be turned off from config.
 */
export const GUARD_NAMES = Object.freeze(["gitIdentity", "toolChoice", "receipt"] as const);
export type GuardName = (typeof GUARD_NAMES)[number];

/** What every carrier reads: the global default plus each guard resolved. */
export interface ResolvedGuardConfig extends Record<GuardName, GuardMode> {
  default: GuardMode;
}

const publish = (schema: JsonSchema): JsonSchema => ({ ...schema });

const LOG_SESSION_SCHEMA: JsonSchema = publish({
  anyOf: [
    { type: "boolean" },
    { type: "integer", enum: [0, 1] },
    { type: "string", enum: ["on", "off"] },
    {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean", description: "Append the mechanical entry to docs/LOGS.md." },
        // `null` is the shipped "no publisher": the resolver normalizes any
        // non-object to null, so the schema accepts exactly what the default
        // materializes and what `config list` reports.
        publisher: {
          description: "The publisher command run at the session boundary; null means no publisher.",
          anyOf: [
            { type: "null" },
            {
              type: "object",
              additionalProperties: false,
              required: ["command"],
              properties: {
                command: {
                  type: "array",
                  items: { type: "string", minLength: 1 },
                  minItems: 1,
                  maxItems: LOG_SESSION_MAX_ARGV,
                  description: "The command and its arguments, run without a shell.",
                },
                timeoutMs: {
                  type: "integer",
                  minimum: 1,
                  maximum: LOG_SESSION_MAX_TIMEOUT_MS,
                  description: "How long the publisher may run before it is abandoned, in milliseconds.",
                },
              },
            },
          ],
        },
      },
    },
  ],
});

const PATH_PROTECTION_SCHEMA: JsonSchema = publish({
  type: "object",
  additionalProperties: false,
  description: "A tighten-only override: the shipped floor is always kept.",
  properties: {
    protectedGlobs: {
      type: "array",
      items: { type: "string", minLength: 1, maxLength: PATH_GLOB_MAX_LENGTH },
      description: "Extra globs to protect, on top of the shipped floor.",
    },
    requirements: {
      type: "object",
      additionalProperties: false,
      description: "Per phase and operation requirement overrides; a value raises the floor, never lowers it.",
      properties: Object.fromEntries(
        PATH_PHASE_STATES.map((state) => [
          state,
          {
            type: "object",
            additionalProperties: false,
            description: `Requirements for ${state} writes (none, justification or approval).`,
            properties: Object.fromEntries(
              PATH_OPERATIONS.map((operation) => [
                operation,
                {
                  type: "string",
                  enum: [...PATH_REQUIREMENTS],
                  description: `The requirement for a ${operation} ${state === "always" ? "at any phase" : `in the ${state} phase`}.`,
                },
              ]),
            ),
          } satisfies JsonSchema,
        ]),
      ),
    },
  },
});

/**
 * The approved identity a project publishes for its commits (issue #514).
 *
 * `enforce` is what the carriers act on: `off` is inert (the shipped default, so
 * an unconfigured project is never blocked), `commit` enables the pre-commit
 * hook, `push` enables the push-range check on any remote,
 * `push-upstream` enables it only on the branch's tracked upstream remote, and
 * the `commit-and-push*` pair is both halves with the same scope (issue #546).
 * `approved` declares only the facts a project wants verified; an absent field
 * is not checked. `signing` decides what a signature means to the project
 * (`required`, `allowed`, `off` for a sign-off workflow) and `signingKeys` is the
 * per-machine form of `signingKey`. `agentGuard.allow` names the config writes a
 * project permits without asking; the guard's own disposition is
 * `guard.gitIdentity.mode` (issue #626), never a second `mode` here.
 */
const GIT_IDENTITY_SCHEMA: JsonSchema = publish({
  type: "object",
  additionalProperties: false,
  description: "The approved commit identity and the agent-side config-write guard.",
  properties: {
    enforce: {
      type: "string",
      enum: ["off", "commit", "push", "push-upstream", "commit-and-push", "commit-and-push-upstream"],
      description: "When the identity check runs: off, commit, push, push-upstream, or the commit-and-push pair.",
    },
    approved: {
      type: "object",
      additionalProperties: false,
      description: "Only the declared facts are verified; an absent field is not checked.",
      properties: {
        name: { type: "string", minLength: 1, description: "git user.name, matched case-insensitively." },
        email: { type: "string", minLength: 3, description: "git user.email, matched case-insensitively." },
        fullName: { type: "string", minLength: 1, description: "The legal name a signing key's UID must carry." },
        format: { type: "string", enum: ["openpgp", "ssh"], description: "The signing key format: openpgp or ssh." },
        signingKey: { type: "string", minLength: 1, description: "The resolved signing key: key id, fingerprint or path." },
        signingKeys: {
          type: "array",
          items: { type: "string", minLength: 1 },
          minItems: 1,
          description: "The per-machine keys: a resolved key matching any of these is approved (issue #546).",
        },
        signing: {
          type: "string",
          enum: ["required", "allowed", "off"],
          description:
            "required: a commit must carry a signature from an approved key. allowed (default): signing is optional, and a resolved key is verified when one resolves. off: the project approves unsigned commits, so a signed one is refused.",
        },
      },
    },
    agentGuard: {
      type: "object",
      additionalProperties: false,
      description: "The model-facing half of the identity guard: the config keys the agent may write without asking.",
      properties: {
        allow: {
          type: "array",
          items: { type: "string", minLength: 1 },
          maxItems: GIT_IDENTITY_ALLOW_MAX,
          description: "Config keys the agent may write without asking (e.g. user.name).",
        },
      },
    },
  },
});

/**
 * The guard dispositions (issue #626): one global default and one entry per
 * guard, each a single `mode`. The shape is deliberately flat — a guard that
 * needs an option other than its disposition owns a section of its own and
 * never grows a second `mode` here.
 */
const GUARD_SECTION_SCHEMA: JsonSchema = publish({
  type: "object",
  additionalProperties: false,
  description:
    "One disposition per guard: allow (the guard stands down), deny (it refuses without asking) or ask (it asks when the host has a UI, and denies when it cannot). `default` is what every guard falls back to; a guard's own `mode` overrides it. Guards that can be configured here: gitIdentity, toolChoice, receipt. Always on and not configurable: pathProtection (tighten-only) and contentGuard (no bypass).",
  properties: {
    default: {
      type: "string",
      enum: [...GUARD_MODES],
      description: "The disposition every guard falls back to when its own entry declares no mode. Shipped: ask.",
    },
    gitIdentity: {
      type: "object",
      additionalProperties: false,
      description:
        "The agent-side `git config` write guard (issue #514). `ask` can really ask; a session with no UI is refused in every mode except `allow`.",
      properties: { mode: { type: "string", enum: [...GUARD_MODES], description: "This guard's disposition; absent falls back to guard.default." } },
    },
    toolChoice: {
      type: "object",
      additionalProperties: false,
      description: "The command-time `rg`/`bun` carrier (issue #610). This guard cannot ask, so `ask` answers as `deny`.",
      properties: { mode: { type: "string", enum: [...GUARD_MODES], description: "This guard's disposition; absent falls back to guard.default." } },
    },
    receipt: {
      type: "object",
      additionalProperties: false,
      description: "The inline PR-receipt guard (issue #182). This guard cannot ask, so `ask` answers as `deny`.",
      properties: { mode: { type: "string", enum: [...GUARD_MODES], description: "This guard's disposition; absent falls back to guard.default." } },
    },
  },
});

/**
 * The `guard` section as every carrier reads it: the global default, then each
 * guard resolved to the value its own entry declares or, failing that, the
 * default. A value the schema refuses is never honoured — the shipped `ask`
 * stands, so a typo can never silently allow a guard.
 */
export function normalizeGuard(value: unknown): ResolvedGuardConfig {
  const section = isRecord(value) ? value : {};
  const read = (candidate: unknown): GuardMode | undefined =>
    (GUARD_MODES as readonly unknown[]).includes(candidate) ? (candidate as GuardMode) : undefined;
  const fallback = read(section.default) ?? "ask";
  const resolved: ResolvedGuardConfig = { default: fallback } as ResolvedGuardConfig;
  for (const name of GUARD_NAMES) {
    const entry = section[name];
    resolved[name] = (isRecord(entry) ? read(entry.mode) : undefined) ?? fallback;
  }
  return resolved;
}

function requirementMatrixDefault(): Record<string, unknown> {
  return {};
}

/**
 * The author-provenance policy for third-party forge content (issue #470).
 *
 * There is no `enabled` switch on purpose: a bypass is exactly the setting the
 * layer exists to deny, and an unconfigured project must run the strictest
 * policy (trusted roles only) rather than nothing. A project that needs a wider
 * role set or a named login widens it here, explicitly and visibly.
 */
const CONTENT_GUARD_SCHEMA: JsonSchema = publish({
  type: "object",
  additionalProperties: false,
  description: "Author-provenance policy for third-party forge content: which authors are ingested as readable content.",
  properties: {
    trustedRoles: {
      type: "array",
      items: { type: "string", enum: [...CONTENT_AUTHOR_ASSOCIATIONS] },
      maxItems: CONTENT_AUTHOR_ASSOCIATIONS.length,
      description: "The author associations whose content may be ingested; every other association is excluded and declared.",
    },
    allowLogins: {
      type: "array",
      items: { type: "string", minLength: 1 },
      description: "Logins admitted regardless of association — an explicit, reviewable exception list.",
    },
    denyLogins: {
      type: "array",
      items: { type: "string", minLength: 1 },
      description: "Logins excluded regardless of association; a deny always beats an allow.",
    },
  },
});

/**
 * One provided list, or `null` when it is not one: a side that cannot be read is
 * never filtered into something that looks legal. `undefined` (absent) reads as
 * the empty list, which is what the union below means by "nothing declared".
 */
function readList(value: unknown): string[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value)) return null;
  if (value.some((entry) => typeof entry !== "string")) return null;
  return value;
}

/**
 * Content guard merges by tightening, never by replacement: `trustedRoles`
 * intersects (a project may narrow what a global value admitted, never widen
 * it), the login lists union, and a side that is absent passes the other through.
 * An unknown key is passed through untouched so strict validation reports it
 * instead of the merge swallowing it — and so is a *value* it cannot read: this
 * merge runs before validation, so filtering `[123]` or `"everyone"` into `[]`
 * handed the validator a legal, intentional-looking lockdown and the policy
 * narrowed in silence. An unreadable side wins unchanged, validation refuses the
 * section whole, and the caller gets the strictest default with a declared
 * reason.
 */
export function mergeContentGuardOverrides(globalValue: unknown, projectValue: unknown): unknown {
  if (!isRecord(globalValue) && !isRecord(projectValue)) return {};
  const globalRecord = isRecord(globalValue) ? globalValue : {};
  const projectRecord = isRecord(projectValue) ? projectValue : {};
  const out: Record<string, unknown> = {};

  if (globalRecord.trustedRoles !== undefined || projectRecord.trustedRoles !== undefined) {
    const globalRoles = readList(globalRecord.trustedRoles);
    const projectRoles = readList(projectRecord.trustedRoles);
    if (globalRoles === null) out.trustedRoles = globalRecord.trustedRoles;
    else if (projectRoles === null) out.trustedRoles = projectRecord.trustedRoles;
    else {
      out.trustedRoles = globalRecord.trustedRoles === undefined
        ? [...new Set(projectRoles)]
        : projectRecord.trustedRoles === undefined
          ? [...new Set(globalRoles)]
          : [...new Set(globalRoles.filter((role) => projectRoles.includes(role)))];
    }
  }
  for (const key of ["allowLogins", "denyLogins"]) {
    if (globalRecord[key] === undefined && projectRecord[key] === undefined) continue;
    const globalLogins = readList(globalRecord[key]);
    const projectLogins = readList(projectRecord[key]);
    if (globalLogins === null) out[key] = globalRecord[key];
    else if (projectLogins === null) out[key] = projectRecord[key];
    else out[key] = [...new Set([...globalLogins, ...projectLogins])];
  }
  for (const [key, value] of Object.entries(projectRecord)) if (!(key in out)) out[key] = value;
  for (const [key, value] of Object.entries(globalRecord)) if (!(key in out)) out[key] = value;
  return out;
}

const REQUIREMENT_RANK = new Map(PATH_REQUIREMENTS.map((value, index) => [value, index]));

/**
 * Path protection merges by tightening, never by replacement: globs union and a
 * requirement takes the higher rank. The generic deep merge would let a project
 * silently drop a global glob or lower a requirement, which is exactly the
 * weakening the policy forbids.
 */
export function mergePathProtectionOverrides(globalValue: unknown, projectValue: unknown): unknown {
  if (!isRecord(globalValue)) return projectValue;
  if (!isRecord(projectValue)) return globalValue;
  const out: Record<string, unknown> = { ...globalValue, ...projectValue };
  const globalGlobs = Array.isArray(globalValue.protectedGlobs) ? globalValue.protectedGlobs : [];
  const projectGlobs = Array.isArray(projectValue.protectedGlobs) ? projectValue.protectedGlobs : [];
  if (globalGlobs.length > 0 || projectGlobs.length > 0) {
    out.protectedGlobs = [...new Set([...globalGlobs, ...projectGlobs])];
  }
  const globalRequirements = isRecord(globalValue.requirements) ? globalValue.requirements : {};
  const projectRequirements = isRecord(projectValue.requirements) ? projectValue.requirements : {};
  const requirements: Record<string, unknown> = {};
  for (const state of PATH_PHASE_STATES) {
    const globalRow = isRecord(globalRequirements[state]) ? globalRequirements[state] : {};
    const projectRow = isRecord(projectRequirements[state]) ? projectRequirements[state] : {};
    const row: Record<string, unknown> = {};
    for (const operation of PATH_OPERATIONS) {
      const a = globalRow[operation];
      const b = projectRow[operation];
      const best = a === undefined ? b : b === undefined ? a : (REQUIREMENT_RANK.get(b as never) ?? 0) >= (REQUIREMENT_RANK.get(a as never) ?? 0) ? b : a;
      if (best !== undefined) row[operation] = best;
    }
    if (Object.keys(row).length > 0) requirements[state] = row;
  }
  if (Object.keys(requirements).length > 0) out.requirements = requirements;
  return out;
}

/**
 * The batch scheduler's lane vocabulary (issue #716).
 *
 * The producer turns a path into a lane key, and until this section existed the
 * only keys it could produce were this repository's own trees — so every other
 * project degraded to `surface-unknown`, one `general` lane and fully serial
 * execution. The declaration is data, never a new envelope field: `lane.surface`
 * stays the bounded string `batch-plan@4` already validates (decision D8).
 *
 * An empty list is the shipped posture and means *undeclared*: the shipped roots
 * are recognized and the project's own directories answer for everything else.
 * A non-empty list is authoritative for the project, because a project that
 * declares its lanes has said which trees may run beside each other. Each entry
 * is one project-relative directory; a wildcard, an absolute path or a
 * metavariable is refused rather than silently resolved to something else.
 */
export const BATCH_SCHEDULER_SCHEMA: JsonSchema = publish({
  type: "object",
  additionalProperties: false,
  properties: {
    surfaces: {
      type: "array",
      maxItems: 64,
      description:
        "This project's lane trees, one project-relative directory per entry (`src/pages`, `apps/web`). Empty means undeclared: the shipped roots plus the project's own directories answer.",
      items: { type: "string", minLength: 1, maxLength: 200, pattern: "^[^/*<>][^<>*]*$" },
    },
  },
});

/**
 * The owner's default answer at the lane's Relay seam (issue #722).
 *
 * When pi-web is present and the unit's packet is `bootstrap-needed` or `draft`,
 * the lane asks the owner one question — relay legs, or the inline per-phase
 * hand-off — and stops for the answer. This vocabulary is only the **preselected**
 * answer: neither value skips the question, and neither can bypass pi-web's own
 * `dispatch_relay` consent gate, which is why no `auto` value exists.
 */
export const RELAY_SEAMS = Object.freeze(["ask", "inline"] as const);
export type RelaySeam = (typeof RELAY_SEAMS)[number];
/** Absent or refused means the question stays open. */
export const RELAY_SEAM_DEFAULT: RelaySeam = "ask";

/**
 * A reader's normalization: only `inline` selects the inline preselection, so a
 * missing, malformed or retired value can never quietly turn the question off.
 */
export function normalizeRelaySeam(value: unknown): RelaySeam {
  return value === "inline" ? "inline" : RELAY_SEAM_DEFAULT;
}

/** The feature sections every agentic-workflow install shares, tool-agnostic. */
export const BASE_CONFIG_SECTIONS: readonly ConfigSectionSpec[] = [
  {
    key: "logSession",
    category: "feature",
    file: BASE_CONFIG_STEM,
    path: ["logSession"],
    description: "Automatic session logging: a boolean-like switch and an optional publisher command.",
    schema: LOG_SESSION_SCHEMA,
    defaults: { enabled: false, publisher: null },
  },
  {
    key: "memory",
    category: "feature",
    file: BASE_CONFIG_STEM,
    path: ["memory"],
    description: "Memory-substrate consent (the Engram MCP registration is ask-first).",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: { engram: { type: "boolean", description: "Opt in to the Engram MCP registration; false writes nothing." } },
    },
    defaults: { engram: false },
  },
  {
    key: "telemetry",
    category: "feature",
    file: BASE_CONFIG_STEM,
    path: ["telemetry"],
    description: "Per-unit cost measurement. On by default — the sample stays local and anonymized (no prompt text, no model output, no diff, no file content); false opts a project out.",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        enabled: { type: "boolean", description: "Measure the per-unit cost sample locally; false opts the project out." },
        // #504 S3: the per-session JSONL destination, relative to the project
        // root. One switch (`enabled`) and one path — a consent gate, a sampling
        // rate or a remote destination is not a key this section carries.
        jsonFile: {
          type: "string",
          minLength: 1,
          description: "Per-session JSONL destination, relative to the project root.",
        },
      },
    },
    defaults: { enabled: true, jsonFile: ".pi/.telemetry/sessions.jsonl" },
  },
  {
    key: "guard",
    category: "feature",
    file: BASE_CONFIG_STEM,
    path: ["guard"],
    description:
      "Guard dispositions — allow, deny or ask — as one global default plus one override per guard (gitIdentity, toolChoice, receipt). A refused value falls back to the shipped ask.",
    schema: GUARD_SECTION_SCHEMA,
    defaults: { default: "ask" },
  },
  {
    key: "gitIdentity",
    category: "feature",
    file: BASE_CONFIG_STEM,
    path: ["gitIdentity"],
    description: "Approved commit identity (name, email, legal name, signing key) and the agent config-write guard.",
    schema: GIT_IDENTITY_SCHEMA,
    defaults: { enforce: "off", approved: {}, agentGuard: { allow: [] } },
  },
  {
    key: "advance",
    category: "feature",
    file: BASE_CONFIG_STEM,
    path: ["advance"],
    description: "Conductor knobs: iteration ceiling, sensitive/security path sets, run-log path.",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        iterationsCap: { type: "integer", minimum: 1, description: "The conductor's iteration ceiling per run." },
        sensitivePaths: {
          type: "array",
          items: { type: "string", minLength: 1 },
          description: "Globs that raise the conductor's caution for a touched path.",
        },
        securityPaths: {
          type: "array",
          items: { type: "string", minLength: 1 },
          description: "Globs that join the conductor's security path set.",
        },
        runLogPath: { type: "string", minLength: 1, description: "The advance run log, relative to the project root." },
      },
    },
    defaults: {
      iterationsCap: 12,
      sensitivePaths: [],
      securityPaths: [],
      runLogPath: ".agentic-workflow/advance-run.log",
    },
  },
  {
    key: "pathProtection",
    category: "feature",
    file: BASE_CONFIG_STEM,
    path: ["pathProtection"],
    description: "Path-protection override: extra globs and raised requirements (never a lowering).",
    schema: PATH_PROTECTION_SCHEMA,
    defaults: requirementMatrixDefault(),
    merge: mergePathProtectionOverrides,
  },
  {
    key: "contentGuard",
    category: "feature",
    file: BASE_CONFIG_STEM,
    path: ["contentGuard"],
    description: "Author-provenance policy for third-party forge content: trusted roles plus allow/deny login lists (tighten-only).",
    schema: CONTENT_GUARD_SCHEMA,
    defaults: { trustedRoles: ["OWNER", "MEMBER", "COLLABORATOR"], allowLogins: [], denyLogins: [] },
    merge: mergeContentGuardOverrides,
  },
  {
    key: "docRetention",
    category: "feature",
    file: BASE_CONFIG_STEM,
    path: ["docRetention"],
    description: "Document retention: whether a merged unit's process artifacts are trimmed into the gitignored archive, and how the archive is kept (issue #651).",
    schema: DOC_RETENTION_SCHEMA,
    defaults: DOC_RETENTION_DEFAULTS,
  },
  {
    key: "batchScheduler",
    category: "feature",
    file: BASE_CONFIG_STEM,
    path: ["batchScheduler"],
    description: "The batch scheduler's lane vocabulary: this project's own tree roots, so a tree that is not this repository's layout plans in parallel lanes instead of degrading to surface-unknown (issue #716).",
    schema: BATCH_SCHEDULER_SCHEMA,
    defaults: { surfaces: [] },
  },
  {
    key: "relay",
    category: "feature",
    file: BASE_CONFIG_STEM,
    path: ["relay"],
    description: "The owner's default answer at the lane's Relay seam: ask (the question stays open) or inline (preselect the inline per-phase hand-off). Absent means ask; neither value skips the question or bypasses pi-web's own dispatch consent gate (issue #722).",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        seam: {
          type: "string",
          enum: [...RELAY_SEAMS],
          description: "The answer the lane's relay-or-inline question preselects: ask or inline; absent means ask, and inline never skips the question.",
        },
      },
    },
    defaults: { seam: RELAY_SEAM_DEFAULT },
  },
];

const BASE_KEYS = new Set(BASE_CONFIG_SECTIONS.map((section) => section.key));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The reported path of a violated key. A key the CLI accepts as a dotted segment
 * (camelCase or kebab-case, starting lower-case) stays dotted — `config validate`
 * and `config get` must name the same node the same way — and anything else
 * (`agentGuard` is camelCase, so it stays dotted too) falls back to the bracket
 * form so the path is never ambiguous.
 */
function keyPath(base: string, key: string): string {
  return /^[a-z][a-zA-Z0-9]*(-[a-z0-9]+)*$/u.test(key) ? `${base}.${key}` : `${base}[${JSON.stringify(key)}]`;
}

function typeName(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function matchesType(value: unknown, type: string): boolean {
  if (type === "integer") return typeof value === "number" && Number.isInteger(value);
  if (type === "number") return typeof value === "number";
  if (type === "array") return Array.isArray(value);
  if (type === "object") return isRecord(value);
  if (type === "null") return value === null;
  return typeof value === type;
}

/** Strict JSON-Schema-subset validation. No coercion: a string never becomes a boolean. */
export function validateJsonSchema(schema: JsonSchema, value: unknown, path: string): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  // JSON5 reads `NaN` and `±Infinity`, but the standard-JSON writer renders both
  // as `null` — a silent value change. Refuse it at the validation boundary
  // instead of writing a lie (#740 S5).
  if (typeof value === "number" && !Number.isFinite(value)) {
    issues.push({ path, message: "must be a finite number; Infinity and NaN do not survive the JSON writer" });
    return issues;
  }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => matchesType(value, type))) {
      issues.push({ path, message: `expected ${types.join(" | ")}, got ${typeName(value)}` });
      return issues;
    }
  }
  if (schema.const !== undefined && value !== schema.const) {
    issues.push({ path, message: `expected ${JSON.stringify(schema.const)}` });
    return issues;
  }
  if (schema.enum !== undefined && !schema.enum.some((entry) => entry === value)) {
    issues.push({ path, message: `expected one of ${schema.enum.map((entry) => JSON.stringify(entry)).join(", ")}` });
    return issues;
  }
  if (schema.anyOf !== undefined) {
    const results = schema.anyOf.map((branch) => validateJsonSchema(branch, value, path));
    if (!results.some((branchIssues) => branchIssues.length === 0)) {
      issues.push({ path, message: "does not match any allowed shape" });
    }
    return issues;
  }
  if (schema.oneOf !== undefined) {
    const matches = schema.oneOf.filter((branch) => validateJsonSchema(branch, value, path).length === 0);
    if (matches.length !== 1) issues.push({ path, message: `must match exactly one allowed shape (matched ${matches.length})` });
    return issues;
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      issues.push({ path, message: `must be at least ${schema.minLength} characters` });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      issues.push({ path, message: `must be at most ${schema.maxLength} characters` });
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, "u").test(value)) {
      issues.push({ path, message: `must match ${schema.pattern}` });
    }
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) issues.push({ path, message: `must be >= ${schema.minimum}` });
    if (schema.maximum !== undefined && value > schema.maximum) issues.push({ path, message: `must be <= ${schema.maximum}` });
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      issues.push({ path, message: `must have at least ${schema.minItems} item(s)` });
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      issues.push({ path, message: `must have at most ${schema.maxItems} item(s)` });
    }
    if (schema.items !== undefined) {
      value.forEach((item, index) => issues.push(...validateJsonSchema(schema.items as JsonSchema, item, `${path}[${index}]`)));
    }
  }
  if (isRecord(value) && (schema.properties !== undefined || schema.required !== undefined || schema.additionalProperties !== undefined)) {
    const properties = schema.properties ?? {};
    for (const required of schema.required ?? []) {
      if (value[required] === undefined) issues.push({ path: keyPath(path, required), message: "is required" });
    }
    for (const [key, entry] of Object.entries(value)) {
      const child = properties[key];
      if (child !== undefined) {
        issues.push(...validateJsonSchema(child, entry, keyPath(path, key)));
      } else if (schema.additionalProperties === false) {
        issues.push({ path: keyPath(path, key), message: `unknown key "${key}" (allowed: ${Object.keys(properties).join(", ") || "none"})` });
      } else if (typeof schema.additionalProperties === "object") {
        issues.push(...validateJsonSchema(schema.additionalProperties, entry, keyPath(path, key)));
      }
    }
  }
  return issues;
}

export function validateSectionValue(section: ConfigSectionSpec, value: unknown): ConfigIssue[] {
  return validateJsonSchema(section.schema, value, section.key);
}

/**
 * Salvage one value against a schema: drop every member or item that no longer
 * validates, keep the valid siblings, and report every dropped path (#740 S7).
 * A value that cannot be salvaged — a mutated shape, or a container whose bounds
 * the drops would break — is dropped whole.
 */
function salvageValue(
  schema: JsonSchema,
  value: unknown,
  path: string,
  removed: string[],
): { kept: boolean; value: unknown } {
  if (schema.anyOf !== undefined) {
    const exact = schema.anyOf.find((branch) => validateJsonSchema(branch, value, path).length === 0);
    if (exact !== undefined) return salvageValue(exact, value, path, removed);
    const objectBranch = isRecord(value)
      ? schema.anyOf.find((branch) => branch.type === "object" && branch.properties !== undefined)
      : undefined;
    if (objectBranch !== undefined) {
      const salvaged = salvageValue(objectBranch, value, path, removed);
      if (salvaged.kept && validateJsonSchema(schema, salvaged.value, path).length === 0) return salvaged;
    }
    if (validateJsonSchema(schema, value, path).length === 0) return { kept: true, value };
    removed.push(path);
    return { kept: false, value: undefined };
  }
  if (schema.oneOf !== undefined) {
    if (validateJsonSchema(schema, value, path).length === 0) return { kept: true, value };
    removed.push(path);
    return { kept: false, value: undefined };
  }
  if (Array.isArray(value) && schema.items !== undefined) {
    const dropped: string[] = [];
    const items: unknown[] = [];
    value.forEach((item, index) => {
      const child = salvageValue(schema.items as JsonSchema, item, `${path}[${index}]`, dropped);
      if (child.kept) items.push(child.value);
    });
    // The bounds are the array's own contract: if the drops broke them, the
    // array cannot be salvaged and the caller drops it whole instead.
    if (validateJsonSchema({ ...schema, items: undefined }, items, path).length === 0) {
      removed.push(...dropped);
      return { kept: true, value: items };
    }
    removed.push(path);
    return { kept: false, value: undefined };
  }
  if (isRecord(value) && (schema.properties !== undefined || schema.required !== undefined || schema.additionalProperties !== undefined)) {
    const properties = schema.properties ?? {};
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      const childPath = keyPath(path, key);
      const child = properties[key];
      if (child !== undefined) {
        const salvaged = salvageValue(child, entry, childPath, removed);
        if (salvaged.kept) out[key] = salvaged.value;
        continue;
      }
      if (schema.additionalProperties === false) {
        removed.push(childPath);
        continue;
      }
      if (typeof schema.additionalProperties === "object") {
        const salvaged = salvageValue(schema.additionalProperties, entry, childPath, removed);
        if (salvaged.kept) out[key] = salvaged.value;
        continue;
      }
      out[key] = entry;
    }
    // A required key the operator never wrote is not invented here: only a value
    // that validates on its own is kept, so a container left invalid is dropped.
    if (validateJsonSchema({ ...schema, required: undefined }, out, path).length === 0) return { kept: true, value: out };
    removed.push(path);
    return { kept: false, value: undefined };
  }
  if (validateJsonSchema(schema, value, path).length === 0) return { kept: true, value };
  removed.push(path);
  return { kept: false, value: undefined };
}

/** Drop every key and item the schema refuses — unknown or no longer valid — and report every removed path. */
export function sanitizeJsonSchema(schema: JsonSchema, value: unknown, path: string, removed: string[]): unknown {
  const salvaged = salvageValue(schema, value, path, removed);
  return salvaged.kept ? salvaged.value : undefined;
}

export function sanitizeSectionValue(section: ConfigSectionSpec, value: unknown): { value: unknown; removed: string[] } {
  const removed: string[] = [];
  const salvaged = salvageValue(section.schema, value, section.key, removed);
  return { value: salvaged.kept ? salvaged.value : undefined, removed };
}

/** Shallow fill: a default applies only where the operator's key is UNDEFINED. */
export function fillDefaults(value: unknown, defaults: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = isRecord(value) ? { ...value } : {};
  for (const [key, fallback] of Object.entries(defaults)) {
    if (out[key] === undefined) out[key] = structuredClone(fallback);
  }
  return out;
}

function mergeValues(globalValue: unknown, projectValue: unknown): unknown {
  if (isRecord(globalValue) && isRecord(projectValue)) {
    const out: Record<string, unknown> = { ...globalValue };
    for (const [key, entry] of Object.entries(projectValue)) out[key] = mergeValues(out[key], entry);
    return out;
  }
  return projectValue === undefined ? globalValue : projectValue;
}

function valueAt(document: Record<string, unknown> | undefined, path: readonly string[]): unknown {
  let cursor: unknown = document;
  for (const key of path) {
    if (!isRecord(cursor)) return undefined;
    cursor = cursor[key];
  }
  return cursor;
}

export function effectiveSections(
  sections: readonly ConfigSectionSpec[],
  extensions: readonly ConfigExtensionDescriptor[] = [],
): { sections: ConfigSectionSpec[]; issues: ConfigIssue[] } {
  const issues: ConfigIssue[] = [];
  const seen = new Set<string>();
  const out: ConfigSectionSpec[] = [];
  for (const section of sections) {
    if (seen.has(section.key)) {
      issues.push({ path: section.key, message: `duplicate config section "${section.key}"` });
      continue;
    }
    seen.add(section.key);
    out.push(section);
  }
  for (const extension of extensions) {
    const descriptorIssues = validateConfigExtension(extension);
    if (descriptorIssues.length > 0) {
      issues.push(...descriptorIssues.map((issue) => ({ path: `extension:${extension.key}`, message: issue.message })));
      continue;
    }
    if (seen.has(extension.key)) {
      issues.push({ path: extension.key, message: `duplicate config section "${extension.key}"` });
      continue;
    }
    seen.add(extension.key);
    out.push({
      key: extension.key,
      category: "pi",
      file: extension.file,
      path: [],
      description: extension.description,
      schema: extension.schema,
      defaults: extension.defaults,
    });
  }
  return { sections: out, issues };
}

export interface ConfigDocuments {
  [fileName: string]: Record<string, unknown> | undefined;
}

export interface ResolveConfigInput {
  sections: readonly ConfigSectionSpec[];
  extensions?: readonly ConfigExtensionDescriptor[];
  global: ConfigDocuments;
  project: ConfigDocuments;
}

export interface ResolvedConfig {
  ok: boolean;
  config: Record<string, unknown>;
  issues: ConfigIssue[];
  sections: ConfigSectionSpec[];
}

/**
 * Resolve every section: project over global, then defaults for absent keys,
 * then strict validation. A broken section resolves to its shipped default and
 * contributes an issue; it never crashes and never invents a partial value.
 */
export function resolveConfigDocuments(input: ResolveConfigInput): ResolvedConfig {
  const selected = effectiveSections(input.sections, input.extensions ?? []);
  const issues: ConfigIssue[] = [...selected.issues];
  const config: Record<string, unknown> = {};
  for (const section of selected.sections) {
    const globalValue = valueAt(input.global[section.file], section.path);
    const projectValue = valueAt(input.project[section.file], section.path);
    const merged = globalValue === undefined && projectValue === undefined
      ? undefined
      : section.merge !== undefined
        ? section.merge(globalValue, projectValue)
        : mergeValues(globalValue, projectValue);
    const sectionIssues = merged === undefined ? [] : validateSectionValue(section, merged);
    if (sectionIssues.length > 0) {
      issues.push(...sectionIssues);
      config[section.key] = structuredClone(section.defaults);
    } else if (merged === undefined) {
      config[section.key] = structuredClone(section.defaults);
    } else {
      const normalized = section.key === "logSession" ? normalizeLogSession(merged) : merged;
      config[section.key] = fillDefaults(normalized, section.defaults);
    }
  }
  return { ok: issues.length === 0, config, issues, sections: selected.sections };
}

export function validateConfigExtension(value: unknown): ConfigIssue[] {
  if (!isRecord(value)) return [{ path: "$", message: "an extension descriptor must be an object" }];
  const issues: ConfigIssue[] = [];
  if (value.contract !== CONFIG_EXTENSION_CONTRACT) {
    issues.push({ path: "contract", message: `must be "${CONFIG_EXTENSION_CONTRACT}"` });
  }
  if (typeof value.key !== "string" || !/^[a-z][a-zA-Z0-9-]*$/u.test(value.key)) {
    issues.push({ path: "key", message: "must be a lower-case section key (camelCase or kebab-case)" });
  } else if (BASE_KEYS.has(value.key)) {
    issues.push({ path: "key", message: `"${value.key}" is a base feature section and cannot be redefined` });
  }
  const file = value.file;
  if (typeof file !== "string" || !/^[a-z0-9][a-z0-9._-]*$/u.test(file)) {
    issues.push({ path: "file", message: "must be a bare config stem (no directory, no extension)" });
  } else if (CONFIG_FILE_EXTENSIONS.some((extension) => file.endsWith(extension))) {
    issues.push({ path: "file", message: "must be the config stem, not a file name: drop the extension (#740 S4)" });
  }
  if (typeof value.description !== "string" || value.description.trim() === "") {
    issues.push({ path: "description", message: "must be a non-empty string" });
  }
  if (!isRecord(value.schema)) issues.push({ path: "schema", message: "must be a JSON Schema object" });
  if (!isRecord(value.defaults)) issues.push({ path: "defaults", message: "must be an object" });
  return issues;
}

/** One file, one object schema, every section named and nothing else allowed. */
export function composeConfigSchema(sections: readonly ConfigSectionSpec[], extensions: readonly ConfigExtensionDescriptor[] = []): JsonSchema {
  const selected = effectiveSections(sections, extensions);
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://github.com/gtrabanco/agentic-workflow/config.schema.json",
    title: "agentic-workflow config",
    type: "object",
    additionalProperties: false,
    properties: Object.fromEntries(selected.sections.map((section) => [section.key, section.schema])),
  };
}

/** Normalize the operator's boolean-like `logSession` value into the effective pair. */
export function normalizeLogSession(value: unknown): {
  enabled: boolean;
  publisher: { command: string[]; timeoutMs: number } | null;
} {
  if (isRecord(value)) {
    const enabled = value.enabled === true;
    const publisher = isRecord(value.publisher) && Array.isArray(value.publisher.command)
      ? {
          command: [...(value.publisher.command as string[])],
          timeoutMs: typeof value.publisher.timeoutMs === "number" ? value.publisher.timeoutMs : 5000,
        }
      : null;
    return { enabled, publisher };
  }
  const enabled = value === true || value === 1 || value === "on";
  return { enabled, publisher: null };
}
