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

export const BASE_CONFIG_FILE = "agentic-workflow.json";
export const CONFIG_EXTENSIONS_DIR = "config-extensions";

const LOG_SESSION_MAX_ARGV = 32;
const LOG_SESSION_MAX_TIMEOUT_MS = 60_000;
const PATH_GLOB_MAX_LENGTH = 512;
const PATH_REQUIREMENTS = ["none", "justification", "approval"] as const;
const GIT_IDENTITY_ALLOW_MAX = 64;
const PATH_OPERATIONS = ["create", "modify", "delete", "rename"] as const;
const PATH_PHASE_STATES = ["pre-freeze", "post-freeze", "always"] as const;

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
        publisher: {
          type: "object",
          additionalProperties: false,
          required: ["command"],
          properties: {
            command: { type: "array", items: { type: "string", minLength: 1 }, minItems: 1, maxItems: LOG_SESSION_MAX_ARGV },
            timeoutMs: { type: "integer", minimum: 1, maximum: LOG_SESSION_MAX_TIMEOUT_MS },
          },
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
    },
    requirements: {
      type: "object",
      additionalProperties: false,
      properties: Object.fromEntries(
        PATH_PHASE_STATES.map((state) => [
          state,
          {
            type: "object",
            additionalProperties: false,
            properties: Object.fromEntries(
              PATH_OPERATIONS.map((operation) => [operation, { type: "string", enum: [...PATH_REQUIREMENTS] }]),
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
 * per-machine form of `signingKey`. `agentGuard` is the model-facing half:
 * `mode: "block"` never asks, and `allow` names the writes a project permits
 * without disabling the guard.
 */
const GIT_IDENTITY_SCHEMA: JsonSchema = publish({
  type: "object",
  additionalProperties: false,
  description: "The approved commit identity and the agent-side config-write guard.",
  properties: {
    enforce: {
      type: "string",
      enum: ["off", "commit", "push", "push-upstream", "commit-and-push", "commit-and-push-upstream"],
    },
    approved: {
      type: "object",
      additionalProperties: false,
      description: "Only the declared facts are verified; an absent field is not checked.",
      properties: {
        name: { type: "string", minLength: 1, description: "git user.name, matched case-insensitively." },
        email: { type: "string", minLength: 3, description: "git user.email, matched case-insensitively." },
        fullName: { type: "string", minLength: 1, description: "The legal name a signing key's UID must carry." },
        format: { type: "string", enum: ["openpgp", "ssh"] },
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
      properties: {
        mode: { type: "string", enum: ["ask", "block"] },
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

function requirementMatrixDefault(): Record<string, unknown> {
  return {};
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

/** The feature sections every agentic-workflow install shares, tool-agnostic. */
export const BASE_CONFIG_SECTIONS: readonly ConfigSectionSpec[] = [
  {
    key: "logSession",
    category: "feature",
    file: BASE_CONFIG_FILE,
    path: ["logSession"],
    description: "Automatic session logging: a boolean-like switch and an optional publisher command.",
    schema: LOG_SESSION_SCHEMA,
    defaults: { enabled: false, publisher: null },
  },
  {
    key: "memory",
    category: "feature",
    file: BASE_CONFIG_FILE,
    path: ["memory"],
    description: "Memory-substrate consent (the Engram MCP registration is ask-first).",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: { engram: { type: "boolean" } },
    },
    defaults: { engram: false },
  },
  {
    key: "telemetry",
    category: "feature",
    file: BASE_CONFIG_FILE,
    path: ["telemetry"],
    description: "Per-unit cost measurement. Opt-in; absent or false measures nothing.",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: { enabled: { type: "boolean" } },
    },
    defaults: { enabled: false },
  },
  {
    key: "guards",
    category: "feature",
    file: BASE_CONFIG_FILE,
    path: ["guards"],
    description: "Tool-safety guard switches and the token ceiling.",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        merge: { type: "boolean" },
        history: { type: "boolean" },
        ci: { type: "boolean" },
        cost: {
          type: "object",
          additionalProperties: false,
          properties: { maxTokens: { type: "integer", minimum: 1 } },
        },
      },
    },
    defaults: { merge: false, history: false, ci: false, cost: { maxTokens: 500_000 } },
  },
  {
    key: "gitIdentity",
    category: "feature",
    file: BASE_CONFIG_FILE,
    path: ["gitIdentity"],
    description: "Approved commit identity (name, email, legal name, signing key) and the agent config-write guard.",
    schema: GIT_IDENTITY_SCHEMA,
    defaults: { enforce: "off", approved: {}, agentGuard: { mode: "ask", allow: [] } },
  },
  {
    key: "advance",
    category: "feature",
    file: BASE_CONFIG_FILE,
    path: ["advance"],
    description: "Conductor knobs: iteration ceiling, sensitive/security path sets, run-log path.",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        iterationsCap: { type: "integer", minimum: 1 },
        sensitivePaths: { type: "array", items: { type: "string", minLength: 1 } },
        securityPaths: { type: "array", items: { type: "string", minLength: 1 } },
        runLogPath: { type: "string", minLength: 1 },
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
    file: BASE_CONFIG_FILE,
    path: ["pathProtection"],
    description: "Path-protection override: extra globs and raised requirements (never a lowering).",
    schema: PATH_PROTECTION_SCHEMA,
    defaults: requirementMatrixDefault(),
    merge: mergePathProtectionOverrides,
  },
];

const BASE_KEYS = new Set(BASE_CONFIG_SECTIONS.map((section) => section.key));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function keyPath(base: string, key: string): string {
  return /^[a-z][a-z0-9-]*$/u.test(key) ? `${base}.${key}` : `${base}[${JSON.stringify(key)}]`;
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

/** Drop the keys the schema refuses and report every removed path. */
export function sanitizeJsonSchema(schema: JsonSchema, value: unknown, path: string, removed: string[]): unknown {
  if (schema.anyOf !== undefined) {
    const branch = schema.anyOf.find((candidate) => validateJsonSchema(candidate, value, path).length === 0)
      ?? (isRecord(value) ? schema.anyOf.find((candidate) => candidate.type === "object") : undefined);
    return branch === undefined ? value : sanitizeJsonSchema(branch, value, path, removed);
  }
  if (Array.isArray(value) && schema.items !== undefined) {
    return value.map((item, index) => sanitizeJsonSchema(schema.items as JsonSchema, item, `${path}[${index}]`, removed));
  }
  if (!isRecord(value) || schema.properties === undefined) return value;
  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    const child = schema.properties[key];
    if (child !== undefined) out[key] = sanitizeJsonSchema(child, entry, keyPath(path, key), removed);
    else if (schema.additionalProperties === false) removed.push(keyPath(path, key));
    else out[key] = entry;
  }
  return out;
}

export function sanitizeSectionValue(section: ConfigSectionSpec, value: unknown): { value: unknown; removed: string[] } {
  const removed: string[] = [];
  return { value: sanitizeJsonSchema(section.schema, value, section.key, removed), removed };
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
  if (typeof value.key !== "string" || !/^[a-z][a-z0-9-]*$/u.test(value.key)) {
    issues.push({ path: "key", message: "must be a lower-case section key" });
  } else if (BASE_KEYS.has(value.key)) {
    issues.push({ path: "key", message: `"${value.key}" is a base feature section and cannot be redefined` });
  }
  if (typeof value.file !== "string" || !/^[a-z0-9][a-z0-9._-]*\.json$/u.test(value.file)) {
    issues.push({ path: "file", message: "must be a bare .json file name (no directory)" });
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
