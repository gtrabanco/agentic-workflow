/**
 * Canonical internal definition of the two staged-verification contracts.
 *
 * This module is the SINGLE source of the VerificationPlan v1 /
 * VerificationReceipt v1 structural contract: the closed field lists,
 * vocabularies, bounds, patterns and cross-field rules declared here are
 * consumed by
 *   - runtime validation (`validateStructure` below, used by the two public
 *     authoritative entries in `index.ts`), and
 *   - the deterministic Draft-07 structural projection generator
 *     (`scripts/generate-verification-schemas.mjs`).
 *
 * It is package-internal: it is not re-exported from the package root and the
 * published `exports` map does not expose it. The generated JSON Schemas are
 * structural projections of this definition, never a second semantic authority.
 */

/** Field-level pattern rule shared by runtime validation and the projection. */
export interface VerificationPatternRule {
  /** ECMA-262 source a valid value must match (negative lookaheads express prohibitions). */
  readonly regex: string;
  /** Runtime message tail; the field is always named through its path. */
  readonly message: string;
}

export type VerificationFieldType =
  | "const"
  | "enum"
  | "string"
  | "integer"
  | "boolean"
  | "stringArray"
  | "array"
  | "nullable";

/** One declared property of a contract object. */
export interface VerificationFieldSpec {
  readonly key: string;
  readonly type: VerificationFieldType;
  readonly description: string;
  /** `const` — the only permitted value. */
  readonly value?: string;
  /** `enum` — the closed vocabulary (also drives `notIn` cross rules). */
  readonly enum?: readonly string[];
  readonly minLength?: number;
  readonly maxLength?: number;
  /** Reject values containing NUL. */
  readonly nulFree?: boolean;
  /** Single pattern a valid string must match (digest/timestamp shapes). */
  readonly pattern?: string;
  /** Message tail used when `pattern` fails. */
  readonly patternExpectation?: string;
  readonly minimum?: number;
  readonly exclusiveMinimum?: number;
  /** `stringArray` — per-item bounds. */
  readonly itemMaxLength?: number;
  readonly itemNulFree?: boolean;
  readonly maxItems?: number;
  readonly minItems?: number;
  /** `array`/`object`-typed members: name of the nested object spec. */
  readonly specName?: string;
  /** `nullable` — the non-null member type. */
  readonly nullableOf?: "string" | "integer" | "object";
  /** `nullable` — exact message tail for the type failure. */
  readonly nullableExpectation?: string;
  /** Field-level pattern rules (path shapes). */
  readonly rules?: readonly VerificationPatternRule[];
}

export type VerificationRuleKind =
  | "exactly-one-non-null"
  | "null-when"
  | "non-null-when"
  | "unique"
  | "timestamp-order"
  | "calendar-roundtrip";

/** Cross-field rule declared once; projected whenever Draft-07 can express it. */
export interface VerificationCrossRule {
  readonly id: string;
  readonly description: string;
  /** false → enforced by the authoritative validator only, disclosed in the projection. */
  readonly projectable: boolean;
  readonly kind: VerificationRuleKind;
  /** Predicate over a sibling field's value. */
  readonly when?: {
    readonly field: string;
    readonly equals?: string;
    readonly in?: readonly string[];
    readonly notIn?: readonly string[];
  };
  /** Constrained fields (`exactly-one-non-null`, `null-when`, `non-null-when`, timestamp/ calendar rules). */
  readonly fields?: readonly string[];
  /** `null-when`/`non-null-when` message tail override. */
  readonly messageTail?: string;
  /** `unique` — the array field the rule scans. */
  readonly collection?: string;
}

/** One contract object: its fields and its cross-field rules. */
export interface VerificationObjectSpec {
  readonly description: string;
  readonly fields: readonly VerificationFieldSpec[];
  readonly rules: readonly VerificationCrossRule[];
}

/** A whole contract: root object spec, nested `$defs` specs, projection metadata. */
export interface VerificationContractSpec {
  readonly contractId: string;
  readonly fileName: string;
  readonly title: string;
  readonly description: string;
  /** The authoritative public runtime entry point for this contract. */
  readonly authority: string;
  /** Label used by undeclared-key diagnostics (`plan` / `receipt`). */
  readonly rootLabel: string;
  readonly root: VerificationObjectSpec;
  readonly objects: Readonly<Record<string, VerificationObjectSpec>>;
}

const NUL_MESSAGE = "must not contain NUL characters";
const ISO_8601_PATTERN = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$";
const LOWERCASE_64HEX_PATTERN = "^[a-f0-9]{64}$";

/** Contract ids, declared once; the package root re-exports them publicly. */
export const VERIFICATION_PLAN_CONTRACT_ID = "agentic-workflow/verification-plan@1" as const;
export const VERIFICATION_RECEIPT_CONTRACT_ID = "agentic-workflow/verification-receipt@1" as const;

/** Closed vocabularies, declared once; the root re-exports them publicly. */
export const VERIFICATION_STAGES = Object.freeze(["fast", "full"] as const);
export const VERIFICATION_COST_CLASSES = Object.freeze(["cheap", "moderate", "expensive"] as const);
export const VERIFICATION_COMMAND_STATUSES = Object.freeze(
  ["passed", "failed", "timed-out", "skipped", "infrastructure-error"] as const,
);
export const VERIFICATION_VERDICTS = Object.freeze(["pass", "fail", "incomplete"] as const);
const WORKING_DIRECTORY_POLICIES = ["candidate-root", "relative-path"] as const;

// ---------------------------------------------------------------------------
// VerificationPlan v1
// ---------------------------------------------------------------------------

const COMMAND_SPEC: VerificationObjectSpec = {
  description: "A single verification command within a plan.",
  fields: [
    {
      key: "id",
      type: "string",
      minLength: 1,
      maxLength: 1024,
      nulFree: true,
      description: "Stable, non-empty, NUL-free, at most 1024 chars, unique within the plan.",
    },
    { key: "stage", type: "enum", enum: VERIFICATION_STAGES, description: "Verification stage." },
    {
      key: "executable",
      type: "string",
      minLength: 1,
      nulFree: true,
      description: "Non-empty executable path; no NUL characters. Never a shell string.",
    },
    {
      key: "args",
      type: "stringArray",
      itemNulFree: true,
      description: "Ordered arguments; each without NUL.",
    },
    {
      key: "workingDirectoryPolicy",
      type: "enum",
      enum: WORKING_DIRECTORY_POLICIES,
      description: "Working directory policy.",
    },
    {
      key: "workingDirectory",
      type: "nullable",
      nullableOf: "string",
      nullableExpectation: "must be a string or null",
      minLength: 1,
      nulFree: true,
      rules: [
        { regex: "^(?!/)", message: 'must not be an absolute path (leading "/")' },
        { regex: "^(?![A-Za-z]:)", message: "must not be a Windows drive-letter path" },
        { regex: "^(?!.*\\\\)", message: "must not contain backslashes" },
        { regex: "^(?!.*(\\/|^)\\.\\.($|\\/))", message: 'must not contain ".." segments (path traversal)' },
      ],
      description: "Null iff candidate-root; validated relative path iff relative-path.",
    },
    {
      key: "timeoutMs",
      type: "integer",
      exclusiveMinimum: 0,
      description: "Positive integer timeout in milliseconds.",
    },
    {
      key: "stopOnFailure",
      type: "boolean",
      description: "Whether to stop executing subsequent commands on failure.",
    },
    {
      key: "costClass",
      type: "enum",
      enum: VERIFICATION_COST_CLASSES,
      description: "Project-declared cost class.",
    },
  ],
  rules: [
    {
      id: "working-directory-null-at-root",
      kind: "null-when",
      projectable: true,
      when: { field: "workingDirectoryPolicy", equals: "candidate-root" },
      fields: ["workingDirectory"],
      description: "workingDirectory is null when workingDirectoryPolicy is candidate-root.",
    },
    {
      id: "working-directory-set-for-relative-path",
      kind: "non-null-when",
      projectable: true,
      when: { field: "workingDirectoryPolicy", equals: "relative-path" },
      fields: ["workingDirectory"],
      messageTail: 'must be a non-empty string when workingDirectoryPolicy is "relative-path"',
      description: "workingDirectory is a validated relative path when workingDirectoryPolicy is relative-path.",
    },
  ],
};

// ---------------------------------------------------------------------------
// VerificationReceipt v1
// ---------------------------------------------------------------------------

const EVIDENCE_SPEC: VerificationObjectSpec = {
  description: "Bounded reference to captured evidence (stdout/stderr output).",
  fields: [
    {
      key: "ref",
      type: "string",
      minLength: 1,
      maxLength: 1024,
      nulFree: true,
      description: "Non-empty opaque pointer to stored evidence; NUL-free.",
    },
    {
      key: "bytes",
      type: "integer",
      minimum: 0,
      description: "Size of the captured evidence in bytes.",
    },
    {
      key: "sha256",
      type: "string",
      pattern: LOWERCASE_64HEX_PATTERN,
      patternExpectation: "must be a lowercase 64-hex string",
      description: "Lowercase 64-hex SHA-256 digest of the captured evidence.",
    },
  ],
  rules: [],
};

const RESULT_SPEC: VerificationObjectSpec = {
  description: "Per-command verification result.",
  fields: [
    {
      key: "commandId",
      type: "string",
      minLength: 1,
      maxLength: 1024,
      nulFree: true,
      description: "Must exist in the bound plan's commands; NUL-free, at most 1024 chars.",
    },
    {
      key: "status",
      type: "enum",
      enum: VERIFICATION_COMMAND_STATUSES,
      description: "The terminal status of this command execution.",
    },
    {
      key: "exitCode",
      type: "nullable",
      nullableOf: "integer",
      nullableExpectation: "must be an integer or null",
      description: "Per the D4 exit-code/signal matrix.",
    },
    {
      key: "signal",
      type: "nullable",
      nullableOf: "string",
      nullableExpectation: "must be a non-empty string or null",
      minLength: 1,
      maxLength: 1024,
      nulFree: true,
      description: "Per the D4 exit-code/signal matrix; NUL-free, at most 1024 chars.",
    },
    {
      key: "startedAt",
      type: "string",
      pattern: ISO_8601_PATTERN,
      patternExpectation: "must be an ISO-8601 UTC timestamp",
      description: "ISO-8601 UTC start timestamp.",
    },
    {
      key: "endedAt",
      type: "string",
      pattern: ISO_8601_PATTERN,
      patternExpectation: "must be an ISO-8601 UTC timestamp",
      description: "ISO-8601 UTC end timestamp, >= startedAt.",
    },
    {
      key: "stdout",
      type: "nullable",
      nullableOf: "object",
      specName: "EvidenceReferenceV1",
      nullableExpectation: "must be null or an object",
      description: "Bounded stdout evidence reference or null.",
    },
    {
      key: "stderr",
      type: "nullable",
      nullableOf: "object",
      specName: "EvidenceReferenceV1",
      nullableExpectation: "must be null or an object",
      description: "Bounded stderr evidence reference or null.",
    },
    {
      key: "skipReason",
      type: "nullable",
      nullableOf: "string",
      nullableExpectation: 'must be null or a non-empty string ≤ 1024 chars when status is "skipped"',
      minLength: 1,
      maxLength: 1024,
      nulFree: true,
      description: "Null on non-skipped rows; non-empty NUL-free string ≤ 1024 chars on skipped.",
    },
  ],
  rules: [
    {
      id: "d4-exactly-one-terminal-result",
      kind: "exactly-one-non-null",
      projectable: true,
      when: { field: "status", in: ["passed", "failed"] as const },
      fields: ["exitCode", "signal"],
      description:
        "D4 exit-code/signal matrix: passed/failed carry exactly one of exitCode (integer) or signal (non-empty string).",
    },
    {
      id: "d4-timed-out-has-no-exit-code",
      kind: "null-when",
      projectable: true,
      when: { field: "status", equals: "timed-out" },
      fields: ["exitCode"],
      description: "D4: timed-out carries exitCode null and an optional captured kill signal.",
    },
    {
      id: "d4-no-terminal-result",
      kind: "null-when",
      projectable: true,
      when: { field: "status", in: ["infrastructure-error", "skipped"] },
      fields: ["exitCode", "signal"],
      description: "D4: infrastructure-error and skipped carry neither exitCode nor signal.",
    },
    {
      id: "skip-reason-only-when-skipped",
      kind: "null-when",
      projectable: true,
      when: { field: "status", notIn: ["skipped"] },
      fields: ["skipReason"],
      messageTail: 'must be null when status is not "skipped"',
      description: "Non-skipped rows carry skipReason null.",
    },
    {
      id: "timestamp-order",
      kind: "timestamp-order",
      projectable: false,
      fields: ["startedAt", "endedAt"],
      description: "endedAt must not precede startedAt.",
    },
    {
      id: "timestamp-calendar-valid",
      kind: "calendar-roundtrip",
      projectable: false,
      fields: ["startedAt", "endedAt"],
      description: "ISO-8601 timestamps must be calendar-valid (rejects 2025-99-99T99:99:99Z).",
    },
  ],
};

/** VerificationPlan v1 root object: `contract` + non-empty `commands`. */
const PLAN_ROOT_SPEC: VerificationObjectSpec = {
  description: "An ordered, non-empty command list for staged verification (fast/full).",
  fields: [
    {
      key: "contract",
      type: "const",
      value: VERIFICATION_PLAN_CONTRACT_ID,
      description: "Contract identifier.",
    },
    {
      key: "commands",
      type: "array",
      specName: "VerificationCommandV1",
      minItems: 1,
      description: "Non-empty command list in declared order.",
    },
  ],
  rules: [
    {
      id: "unique-command-ids",
      kind: "unique",
      projectable: false,
      collection: "commands",
      fields: ["id"],
      description: "Command ids are unique within the plan.",
    },
  ],
};

/** VerificationReceipt v1 root object. */
const RECEIPT_ROOT_SPEC: VerificationObjectSpec = {
  description: "A verification receipt bound to a plan, candidate snapshot, and acceptance fingerprint.",
  fields: [
    {
      key: "contract",
      type: "const",
      value: VERIFICATION_RECEIPT_CONTRACT_ID,
      description: "Contract identifier.",
    },
    {
      key: "planDigest",
      type: "string",
      pattern: LOWERCASE_64HEX_PATTERN,
      patternExpectation: "must be a lowercase 64-hex string",
      description: "Lowercase 64-hex SHA-256 digest of the bound plan.",
    },
    {
      key: "candidateSnapshotDigest",
      type: "string",
      pattern: LOWERCASE_64HEX_PATTERN,
      patternExpectation: "must be a lowercase 64-hex string",
      description: "Lowercase 64-hex SHA-256 from #138's candidate-snapshot digest.",
    },
    {
      key: "acceptanceFingerprint",
      type: "string",
      pattern: LOWERCASE_64HEX_PATTERN,
      patternExpectation: "must be a lowercase 64-hex string",
      description: "Lowercase 64-hex acceptance fingerprint from #138.",
    },
    { key: "stageRequested", type: "enum", enum: VERIFICATION_STAGES, description: "Which stage was requested." },
    {
      key: "results",
      type: "array",
      specName: "VerificationResultV1",
      description: "Ordered per-command results.",
    },
    {
      key: "verdict",
      type: "enum",
      enum: VERIFICATION_VERDICTS,
      description: "Must equal deriveVerificationVerdict.",
    },
  ],
  rules: [
    {
      id: "unique-result-command-ids",
      kind: "unique",
      projectable: false,
      collection: "results",
      fields: ["commandId"],
      description: "Each declared command carries at most one result row.",
    },
  ],
};

export const VERIFICATION_CONTRACT: Readonly<{
  plan: VerificationContractSpec;
  receipt: VerificationContractSpec;
}> = Object.freeze({
  plan: Object.freeze({
    contractId: VERIFICATION_PLAN_CONTRACT_ID,
    fileName: "verification-plan.schema.json",
    title: "VerificationPlan v1",
    description: "An ordered, non-empty command list for staged verification (fast/full).",
    authority: "validateVerificationPlanV1",
    rootLabel: "plan",
    root: PLAN_ROOT_SPEC,
    objects: Object.freeze({ VerificationCommandV1: COMMAND_SPEC }),
  }),
  receipt: Object.freeze({
    contractId: VERIFICATION_RECEIPT_CONTRACT_ID,
    fileName: "verification-receipt.schema.json",
    title: "VerificationReceipt v1",
    description: "A verification receipt bound to a plan, candidate snapshot, and acceptance fingerprint.",
    authority: "validateVerificationReceiptAgainstPlan",
    rootLabel: "receipt",
    root: RECEIPT_ROOT_SPEC,
    objects: Object.freeze({
      EvidenceReferenceV1: EVIDENCE_SPEC,
      VerificationResultV1: RESULT_SPEC,
    }),
  }),
});

/**
 * Non-validating own-property projection of a contract value.
 *
 * `canonicalize*`/`digest*` run this first so a digest always describes the
 * normalized DTO — never an accidental prototype value or an undeclared field.
 * It performs no checks (callers validate first) and copies only declared own
 * properties, so the walk is one pass with no regex and no error buffers.
 */
export function projectStructure(
  contract: VerificationContractSpec,
  spec: VerificationObjectSpec,
  value: unknown,
): unknown {
  if (!isPlainRecord(value)) return value;
  const projected: Record<string, unknown> = {};
  for (const field of spec.fields) {
    if (!Object.prototype.hasOwnProperty.call(value, field.key)) continue;
    const raw = value[field.key];
    if (field.type === "array") {
      const nested = verificationObjectSpec(contract, field.specName ?? "");
      projected[field.key] = Array.isArray(raw)
        ? raw.map((item: unknown) => projectStructure(contract, nested, item))
        : raw;
    } else if (field.type === "nullable" && field.nullableOf === "object" && raw !== null) {
      const nested = verificationObjectSpec(contract, field.specName ?? "");
      projected[field.key] = projectStructure(contract, nested, raw);
    } else {
      projected[field.key] = raw;
    }
  }
  return projected;
}

/** Nested object spec by `$defs` name. */
function verificationObjectSpec(
  contract: VerificationContractSpec,
  defName: string,
): VerificationObjectSpec {
  const spec = contract.objects[defName];
  if (!spec) throw new Error(`unknown verification object ${defName}`);
  return spec;
}

/** A JSON object literal (or null-prototype object) — never an array or a class instance. */
function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value) as unknown;
  return proto === Object.prototype || proto === null;
}

function verificationFieldSpec(
  spec: VerificationObjectSpec,
  key: string,
): VerificationFieldSpec | undefined {
  return spec.fields.find((field) => field.key === key);
}

/**
 * True when a cross rule's `when` predicate matches the submitted sibling value.
 *
 * `notIn` only fires for values inside the sibling's declared vocabulary, so a
 * garbage enum value yields one vocabulary error instead of a cascade.
 */
function ruleApplies(
  spec: VerificationObjectSpec,
  rule: VerificationCrossRule,
  obj: Record<string, unknown>,
): boolean {
  const when = rule.when;
  if (!when) return true;
  if (!Object.prototype.hasOwnProperty.call(obj, when.field)) return false;
  const value = obj[when.field];
  if (typeof value !== "string") return false;
  if (when.equals !== undefined) return value === when.equals;
  if (when.in !== undefined) return when.in.includes(value);
  if (when.notIn !== undefined) {
    const vocabulary = verificationFieldSpec(spec, when.field)?.enum ?? [];
    return vocabulary.includes(value) && !when.notIn.includes(value);
  }
  return false;
}

/** Message tail a field's value must satisfy; `got:` is appended by `fail()`. */
function expectationFor(field: VerificationFieldSpec): string {
  switch (field.type) {
    case "const":
      return `must be "${field.value}"`;
    case "enum":
      return `must be one of ${(field.enum ?? []).join("|")}`;
    case "boolean":
      return "must be a boolean";
    case "string":
      return field.minLength === 1 ? "must be a non-empty string" : "must be a string";
    case "integer":
      return field.exclusiveMinimum === 0
        ? "must be a positive integer"
        : field.minimum !== undefined
          ? `must be an integer >= ${field.minimum}`
          : "must be an integer";
    case "stringArray":
    case "array":
      return "must be an array";
    case "nullable":
      return field.nullableExpectation ?? "must be present";
  }
}

function fail(errors: string[], path: string, expectation: string, value: unknown): void {
  errors.push(`${path} ${expectation} (got: ${typeof value === "string" ? JSON.stringify(value) : String(value)})`);
}

function checkString(
  field: VerificationFieldSpec,
  value: unknown,
  path: string,
  expectation: string,
  errors: string[],
): string | undefined {
  if (typeof value !== "string" || (field.minLength === 1 && value.length === 0)) {
    fail(errors, path, expectation, value);
    return undefined;
  }
  if (field.nulFree && value.includes("\0")) {
    errors.push(`${path} ${NUL_MESSAGE}`);
    return undefined;
  }
  if (field.maxLength !== undefined && value.length > field.maxLength) {
    errors.push(`${path} must be at most ${field.maxLength} characters`);
  }
  if (field.pattern !== undefined && !new RegExp(field.pattern).test(value)) {
    errors.push(`${path} ${field.patternExpectation ?? "must match the required format"}`);
    return undefined;
  }
  for (const rule of field.rules ?? []) {
    if (!new RegExp(rule.regex).test(value)) errors.push(`${path} ${rule.message}`);
  }
  return value;
}

function checkInteger(
  field: VerificationFieldSpec,
  value: unknown,
  path: string,
  expectation: string,
  errors: string[],
): number | undefined {
  const positive = field.exclusiveMinimum === 0;
  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail(errors, path, expectation, value);
    return undefined;
  }
  if (positive && value <= 0) {
    fail(errors, path, "must be a positive integer", value);
    return undefined;
  }
  if (field.minimum !== undefined && value < field.minimum) {
    errors.push(`${path} must be an integer >= ${field.minimum}`);
    return undefined;
  }
  return value;
}

/**
 * Validate one contract object against its spec, recording messages in
 * `errors`, and return its normalized own-property DTO — or `undefined` when
 * anything in this object (or below it) failed.
 *
 * Only own properties of declared keys are read, so inherited or prototype
 * values can never be mistaken for contract data; the returned object is a
 * fresh plain literal, so mutating the input afterwards cannot change it.
 */
export function validateStructure(
  contract: VerificationContractSpec,
  spec: VerificationObjectSpec,
  value: unknown,
  path: string,
  errors: string[],
): Record<string, unknown> | undefined {
  if (!isPlainRecord(value)) {
    errors.push(`${path === "" ? "value" : path} must be a plain JSON object`);
    return undefined;
  }

  const before = errors.length;
  const at = (key: string) => (path === "" ? key : `${path}.${key}`);

  for (const key of Object.keys(value)) {
    if (!spec.fields.some((field) => field.key === key)) {
      errors.push(`unexpected key: ${path === "" ? contract.rootLabel : path}.${key}`);
    }
  }

  const normalized: Record<string, unknown> = {};

  for (const field of spec.fields) {
    const fieldPath = at(field.key);
    if (!Object.prototype.hasOwnProperty.call(value, field.key)) {
      errors.push(`${fieldPath} ${expectationFor(field)}`);
      continue;
    }
    const raw = value[field.key];
    const expectation = expectationFor(field);

    switch (field.type) {
      case "const": {
        if (raw !== field.value) {
          fail(errors, fieldPath, expectation, raw);
        } else {
          normalized[field.key] = raw;
        }
        break;
      }
      case "enum": {
        const vocabulary = field.enum ?? [];
        if (!vocabulary.includes(raw as string)) {
          fail(errors, fieldPath, expectation, raw);
        } else {
          normalized[field.key] = raw;
        }
        break;
      }
      case "boolean": {
        if (typeof raw !== "boolean") {
          fail(errors, fieldPath, expectation, raw);
        } else {
          normalized[field.key] = raw;
        }
        break;
      }
      case "string": {
        const checked = checkString(field, raw, fieldPath, expectation, errors);
        if (checked !== undefined) normalized[field.key] = checked;
        break;
      }
      case "integer": {
        const checked = checkInteger(field, raw, fieldPath, expectation, errors);
        if (checked !== undefined) normalized[field.key] = checked;
        break;
      }
      case "stringArray": {
        if (!Array.isArray(raw)) {
          errors.push(`${fieldPath} must be an array`);
          break;
        }
        const items: string[] = [];
        for (let i = 0; i < raw.length; i++) {
          const item = raw[i];
          if (typeof item !== "string") {
            errors.push(`${fieldPath}[${i}] must be a string`);
            continue;
          }
          if (field.itemNulFree && item.includes("\0")) {
            errors.push(`${fieldPath}[${i}] ${NUL_MESSAGE}`);
            continue;
          }
          if (field.itemMaxLength !== undefined && item.length > field.itemMaxLength) {
            errors.push(`${fieldPath}[${i}] must be at most ${field.itemMaxLength} characters`);
            continue;
          }
          items.push(item);
        }
        normalized[field.key] = items;
        break;
      }
      case "array": {
        const nested = verificationObjectSpec(contract, field.specName ?? "");
        if (!Array.isArray(raw)) {
          errors.push(`${fieldPath} must be an array`);
          break;
        }
        if (field.minItems !== undefined && raw.length < field.minItems) {
          errors.push(`${fieldPath} must not be empty`);
          break;
        }
        if (field.maxItems !== undefined && raw.length > field.maxItems) {
          errors.push(`${fieldPath} must have at most ${field.maxItems} items`);
          break;
        }
        const children: unknown[] = [];
        for (let i = 0; i < raw.length; i++) {
          const child = validateStructure(contract, nested, raw[i], `${fieldPath}[${i}]`, errors);
          if (child) children.push(child);
        }
        normalized[field.key] = children;
        break;
      }
      case "nullable": {
        if (raw === null) {
          normalized[field.key] = null;
          break;
        }
        if (field.nullableOf === "string") {
          const checked = checkString(field, raw, fieldPath, expectation, errors);
          if (checked !== undefined) normalized[field.key] = checked;
          break;
        }
        if (field.nullableOf === "integer") {
          const checked = checkInteger(field, raw, fieldPath, expectation, errors);
          if (checked !== undefined) normalized[field.key] = checked;
          break;
        }
        if (!isPlainRecord(raw)) {
          errors.push(`${fieldPath} ${field.nullableExpectation ?? "must be null or an object"}`);
          break;
        }
        const nested = verificationObjectSpec(contract, field.specName ?? "");
        const child = validateStructure(contract, nested, raw, fieldPath, errors);
        if (child) normalized[field.key] = child;
        break;
      }
    }
  }

  for (const rule of spec.rules) {
    applyCrossRule(spec, rule, value, at, errors);
  }

  return errors.length === before ? normalized : undefined;
}

function applyCrossRule(
  spec: VerificationObjectSpec,
  rule: VerificationCrossRule,
  value: Record<string, unknown>,
  at: (key: string) => string,
  errors: string[],
): void {
  switch (rule.kind) {
    case "unique": {
      const collectionName = rule.collection ?? "";
      const collection = Array.isArray(value[collectionName]) ? (value[collectionName] as unknown[]) : [];
      const field = rule.fields?.[0] ?? "";
      const seen = new Set<string>();
      for (let i = 0; i < collection.length; i++) {
        const item = collection[i];
        if (!isPlainRecord(item)) continue;
        const key = item[field];
        if (typeof key !== "string" || key.length === 0) continue;
        if (seen.has(key)) {
          errors.push(`${at(collectionName)}[${i}].${field} "${key}" is a duplicate`);
        } else {
          seen.add(key);
        }
      }
      break;
    }
    case "exactly-one-non-null": {
      if (!ruleApplies(spec, rule, value)) break;
      const fields = rule.fields ?? [];
      const whenField = rule.when?.field ?? "";
      const present = fields.filter(
        (key) => Object.prototype.hasOwnProperty.call(value, key) && value[key] !== null,
      );
      if (present.length === fields.length) {
        errors.push(
          `${at(whenField)} is "${String(value[whenField])}" but both ${fields.join(" and ")} are present (need exactly one)`,
        );
      } else if (present.length === 0) {
        errors.push(
          `${at(whenField)} is "${String(value[whenField])}" but both ${fields.join(" and ")} are null/absent (need exactly one)`,
        );
      }
      break;
    }
    case "null-when": {
      if (!ruleApplies(spec, rule, value)) break;
      const whenField = rule.when?.field ?? "";
      for (const key of rule.fields ?? []) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
        if (value[key] !== null) {
          errors.push(
            `${at(key)} ${rule.messageTail ?? `must be null when ${whenField} is "${String(value[whenField])}"`}`,
          );
        }
      }
      break;
    }
    case "non-null-when": {
      if (!ruleApplies(spec, rule, value)) break;
      const whenField = rule.when?.field ?? "";
      for (const key of rule.fields ?? []) {
        const present = Object.prototype.hasOwnProperty.call(value, key) && value[key] !== null;
        if (!present) {
          errors.push(
            `${at(key)} ${rule.messageTail ?? `must not be null when ${whenField} is "${String(value[whenField])}"`}`,
          );
        }
      }
      break;
    }
    case "timestamp-order": {
      const [start, end] = rule.fields ?? [];
      if (!start || !end) break;
      const a = value[start];
      const b = value[end];
      if (typeof a === "string" && typeof b === "string" && new Date(b).getTime() < new Date(a).getTime()) {
        errors.push(`${at(end)} must be >= ${start}`);
      }
      break;
    }
    case "calendar-roundtrip": {
      for (const key of rule.fields ?? []) {
        const raw = value[key];
        if (typeof raw !== "string" || !new RegExp(ISO_8601_PATTERN).test(raw)) continue;
        const date = new Date(raw);
        const parts = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        const ok =
          Number.isFinite(date.getTime()) &&
          parts !== null &&
          date.getUTCFullYear() === Number(parts[1]) &&
          date.getUTCMonth() + 1 === Number(parts[2]) &&
          date.getUTCDate() === Number(parts[3]) &&
          date.getUTCHours() === Number(parts[4]) &&
          date.getUTCMinutes() === Number(parts[5]) &&
          date.getUTCSeconds() === Number(parts[6]);
        if (!ok) errors.push(`${at(key)} must be an ISO-8601 UTC timestamp`);
      }
      break;
    }
  }
}
