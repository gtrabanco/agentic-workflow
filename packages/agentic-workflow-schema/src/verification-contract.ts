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

// Function-level import (used only inside `applyCrossRule`, never at module
// init): the canonical serializer is the shared authority in
// `canonical-json.ts`, which itself imports this module's capture primitives.
import { canonicalJSONValue } from "./canonical-json.js";

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
  readonly minimum?: number;
  /** Ceiling for an integer field (D14 per-command timeout). */
  readonly maximum?: number;
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
  /**
   * Specific code reported instead of the generic `invalid-value` when this
   * field's *content* rule (pattern, NUL-free, const/enum vocabulary) fails.
   * Capacity ceilings keep `limit-exceeded` and type errors keep `invalid-type`,
   * so this only specializes "well-formed value" rules (D5 evidence references).
   */
  readonly violationCode?: VerificationDiagnosticCodeV1;
  /** Field-level pattern rules (path shapes). */
  readonly rules?: readonly VerificationPatternRule[];
}

export type VerificationRuleKind =
  | "exactly-one-non-null"
  | "null-when"
  | "non-null-when"
  | "unique"
  | "timestamp-order"
  | "calendar-roundtrip"
  /** `fields` must stay ≤ `maximum` while `when` holds (a numeric field's value or an array field's length). */
  | "maximum-when"
  /** Sum of `fields` over `collection` items matching `when` stays ≤ `maximum`. */
  | "stage-aggregate-budget"
  /** `collection` must be `uniqueItems` as a Draft-07 floor (a family may enforce a stronger key offline). */
  | "unique-items"
  /**
   * While `when` holds, each field in `fields` must be one of `values`. This is the
   * one form of "a sibling field narrows my vocabulary" Draft 07 can state, so a
   * consumer's editor refuses e.g. a SPEC-stage receipt carrying a Plan verdict
   * instead of letting it pass a structural validation it cannot survive.
   */
  | "enum-when";

/** Cross-field rule declared once; projected whenever Draft-07 can express it. */
export interface VerificationCrossRule {
  readonly id: string;
  readonly description: string;
  /**
   * D16 code to report instead of this kind's default (see `CROSS_RULE_DEFAULT_CODE`).
   * A contract family may pin one of its OWN codes here (the pre-execution family
   * pins `invalid-topology`), so the declared type accepts any string while the
   * shared engine keeps its closed vocabulary for the codes it emits itself.
   */
  readonly code?: VerificationDiagnosticCodeV1 | (string & {});
  /** false → enforced by the authoritative validator only, disclosed in the projection. */
  readonly projectable: boolean;
  /**
   * Where the runtime enforces the rule. Default `"walk"`: every structural pass
   * (so a well-formedness validator refuses it too). `"binding"` marks a rule a
   * well-formed document may violate — the projection still renders it, but only
   * the family's binding authority (which blesses a verdict) applies it, so a
   * recorded topology a plain review carried is refused exactly where it would
   * be acted on.
   */
  readonly enforcement?: "walk" | "binding";
  readonly kind: VerificationRuleKind;
  /** Predicate over a sibling field's value. */
  readonly when?: {
    readonly field: string;
    readonly equals?: string;
    readonly in?: readonly string[];
    readonly notIn?: readonly string[];
    /** Predicate holds while the sibling array carries at least this many rows. */
    readonly minItems?: number;
  };
  /** Constrained fields (`exactly-one-non-null`, `null-when`, `non-null-when`, timestamp/ calendar rules). */
  readonly fields?: readonly string[];
  /** `unique` — the array field the rule scans. */
  readonly collection?: string;
  /** `maximum-when` / `stage-aggregate-budget` — the declared ceiling. */
  readonly maximum?: number;
  /** `enum-when` — the only values each `fields` entry may take while `when` holds. */
  readonly values?: readonly string[];
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
export const WORKING_DIRECTORY_POLICIES = ["candidate-root", "relative-path"] as const;

/**
 * D14 — bounded usability: the SHAPE ceilings (cardinality + string length).
 *
 * Every number the validator enforces is read from this object, and the same
 * object is published publicly so a consumer can size fixtures without
 * restating a literal. `VERIFICATION_LIMITS` is extended with the payload
 * budgets by P11 and the timeout budgets by P12; the canonical plan/receipt
 * byte budgets and the aggregate stage sums are enforced at runtime and are
 * listed here once those phases land.
 */
export const VERIFICATION_LIMITS = Object.freeze({
  commands: 128,
  results: 128,
  argsPerCommand: 64,
  idChars: 128,
  pathChars: 1024,
  argChars: 4096,
  skipReasonChars: 1024,
  evidenceRefChars: 1024,
  planBytes: 256 * 1024,
  receiptBytes: 512 * 1024,
  // D14 time bounds, in milliseconds: 10/15 minutes for the fast stage and
  // 60/120 minutes for the full stage (per command / whole stage).
  fastCommandTimeoutMs: 10 * 60_000,
  fastStageTimeoutMs: 15 * 60_000,
  fullCommandTimeoutMs: 60 * 60_000,
  fullStageTimeoutMs: 120 * 60_000,
  diagnostics: 50,
} as const);

/**
 * D16 — the closed diagnostic vocabulary. Every validation failure row carries
 * exactly one of these codes plus an RFC 6901 path; adding a code is a reviewed,
 * versioned contract change, and no code ever names the submitted value.
 */
export const VERIFICATION_DIAGNOSTIC_CODES = Object.freeze([
  "invalid-type",
  "missing-field",
  "unknown-field",
  "invalid-value",
  "limit-exceeded",
  "duplicate-id",
  "unknown-command",
  "invalid-order",
  "invalid-stage",
  "invalid-exit-state",
  "invalid-evidence",
  "invalid-skip",
  "invalid-fail-fast",
  "digest-mismatch",
  "verdict-mismatch",
  "budget-exceeded",
] as const);

export type VerificationDiagnosticCodeV1 = (typeof VERIFICATION_DIAGNOSTIC_CODES)[number];

/** One D16 failure row: a frozen code and the pointer to the offending location. */
export interface VerificationDiagnosticV1 {
  readonly code: VerificationDiagnosticCodeV1;
  /** RFC 6901 pointer over declared property names and decimal indices; `""` is the document root. */
  readonly path: string;
}

/**
 * Bounded diagnostic collector (D14/D16).
 *
 * Allocation is capped at `VERIFICATION_LIMITS.diagnostics`: past the ceiling the
 * sink counts rows instead of building them, so an oversized payload can never
 * make the validator allocate one diagnostic per byte it disliked. `count()` is
 * the total number of failures seen (held + dropped) and is what the structural
 * walk uses to decide whether anything failed — never the capped length.
 */
export interface VerificationDiagnosticSink {
  push(code: VerificationDiagnosticCodeV1, path: string): void;
  /** Failures seen so far, including the ones the ceiling dropped. */
  count(): number;
  /** Freeze the held rows and report whether the ceiling truncated them. */
  finish(): { readonly diagnostics: readonly VerificationDiagnosticV1[]; readonly truncated: boolean };
}

export function createVerificationDiagnosticSink(
  limit: number = VERIFICATION_LIMITS.diagnostics,
): VerificationDiagnosticSink {
  const rows: VerificationDiagnosticV1[] = [];
  let dropped = 0;
  return {
    push(code, path) {
      if (rows.length < limit) rows.push({ code, path });
      else dropped += 1;
    },
    count() {
      return rows.length + dropped;
    },
    finish() {
      return {
        diagnostics: Object.freeze(rows.map((row) => Object.freeze({ code: row.code, path: row.path }))),
        truncated: dropped > 0,
      };
    },
  };
}

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
      maxLength: VERIFICATION_LIMITS.idChars,
      nulFree: true,
      description: `Stable, non-empty, NUL-free, at most ${VERIFICATION_LIMITS.idChars} chars, unique within the plan.`,
    },
    { key: "stage", type: "enum", enum: VERIFICATION_STAGES, description: "Verification stage." },
    {
      key: "executable",
      type: "string",
      minLength: 1,
      maxLength: VERIFICATION_LIMITS.pathChars,
      nulFree: true,
      description: `Non-empty executable path; NUL-free, at most ${VERIFICATION_LIMITS.pathChars} chars. Never a shell string.`,
    },
    {
      key: "args",
      type: "stringArray",
      itemNulFree: true,
      maxItems: VERIFICATION_LIMITS.argsPerCommand,
      itemMaxLength: VERIFICATION_LIMITS.argChars,
      description: `Ordered arguments; at most ${VERIFICATION_LIMITS.argsPerCommand} items, each NUL-free and at most ${VERIFICATION_LIMITS.argChars} chars.`,
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
      minLength: 1,
      maxLength: VERIFICATION_LIMITS.pathChars,
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
      // The stage-independent ceiling; `fast-command-timeout` tightens it for the
      // fast stage, exactly as the projection's conditional fragment does (AC10).
      maximum: VERIFICATION_LIMITS.fullCommandTimeoutMs,
      description: `Positive integer timeout in milliseconds; at most ${VERIFICATION_LIMITS.fullCommandTimeoutMs} (full stage) or ${VERIFICATION_LIMITS.fastCommandTimeoutMs} (fast stage).`,
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
      id: "fast-command-timeout",
      kind: "maximum-when",
      projectable: true,
      when: { field: "stage", equals: "fast" },
      fields: ["timeoutMs"],
      maximum: VERIFICATION_LIMITS.fastCommandTimeoutMs,
      description: `A fast-stage command times out within ${VERIFICATION_LIMITS.fastCommandTimeoutMs} ms (D14).`,
    },
    {
      id: "working-directory-set-for-relative-path",
      kind: "non-null-when",
      projectable: true,
      when: { field: "workingDirectoryPolicy", equals: "relative-path" },
      fields: ["workingDirectory"],
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
      maxLength: VERIFICATION_LIMITS.evidenceRefChars,
      nulFree: true,
      violationCode: "invalid-evidence",
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
      violationCode: "invalid-evidence",
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
      maxLength: VERIFICATION_LIMITS.idChars,
      nulFree: true,
      description: `Must exist in the bound plan's commands; NUL-free, at most ${VERIFICATION_LIMITS.idChars} chars.`,
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
      description: "Per the D4 exit-code/signal matrix.",
    },
    {
      key: "signal",
      type: "nullable",
      nullableOf: "string",
      minLength: 1,
      // F50 hardening, not a D14 limit: the SPEC's ceiling list does not name
      // `signal`, so this bound stays local to the field it protects.
      maxLength: 1024,
      nulFree: true,
      description: "Per the D4 exit-code/signal matrix; NUL-free, at most 1024 chars.",
    },
    {
      key: "startedAt",
      type: "string",
      pattern: ISO_8601_PATTERN,
      description: "ISO-8601 UTC start timestamp.",
    },
    {
      key: "endedAt",
      type: "string",
      pattern: ISO_8601_PATTERN,
      description: "ISO-8601 UTC end timestamp, >= startedAt.",
    },
    {
      key: "stdout",
      type: "nullable",
      nullableOf: "object",
      specName: "EvidenceReferenceV1",
      description: "Bounded stdout evidence reference or null.",
    },
    {
      key: "stderr",
      type: "nullable",
      nullableOf: "object",
      specName: "EvidenceReferenceV1",
      description: "Bounded stderr evidence reference or null.",
    },
    {
      key: "skipReason",
      type: "nullable",
      nullableOf: "string",
      minLength: 1,
      maxLength: VERIFICATION_LIMITS.skipReasonChars,
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
      code: "invalid-exit-state",
      when: { field: "status", equals: "timed-out" },
      fields: ["exitCode"],
      description: "D4: timed-out carries exitCode null and an optional captured kill signal.",
    },
    {
      id: "d4-no-terminal-result",
      kind: "null-when",
      projectable: true,
      code: "invalid-exit-state",
      when: { field: "status", in: ["infrastructure-error", "skipped"] },
      fields: ["exitCode", "signal"],
      description: "D4: infrastructure-error and skipped carry neither exitCode nor signal.",
    },
    {
      id: "skip-reason-only-when-skipped",
      kind: "null-when",
      projectable: true,
      code: "invalid-skip",
      when: { field: "status", notIn: ["skipped"] },
      fields: ["skipReason"],
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
      maxItems: VERIFICATION_LIMITS.commands,
      description: `Non-empty command list of at most ${VERIFICATION_LIMITS.commands} commands, in declared order.`,
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
    {
      id: "fast-stage-aggregate-budget",
      kind: "stage-aggregate-budget",
      projectable: false,
      collection: "commands",
      when: { field: "stage", equals: "fast" },
      fields: ["timeoutMs"],
      maximum: VERIFICATION_LIMITS.fastStageTimeoutMs,
      description: `Declared fast-stage timeouts sum to at most ${VERIFICATION_LIMITS.fastStageTimeoutMs} ms (D14).`,
    },
    {
      id: "full-stage-aggregate-budget",
      kind: "stage-aggregate-budget",
      projectable: false,
      collection: "commands",
      when: { field: "stage", equals: "full" },
      fields: ["timeoutMs"],
      maximum: VERIFICATION_LIMITS.fullStageTimeoutMs,
      description: `Declared full-stage timeouts sum to at most ${VERIFICATION_LIMITS.fullStageTimeoutMs} ms (D14).`,
    },
  ],
}

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
      description: "Lowercase 64-hex SHA-256 digest of the bound plan.",
    },
    {
      key: "candidateSnapshotDigest",
      type: "string",
      pattern: LOWERCASE_64HEX_PATTERN,
      description: "Lowercase 64-hex SHA-256 from #138's candidate-snapshot digest.",
    },
    {
      key: "acceptanceFingerprint",
      type: "string",
      pattern: LOWERCASE_64HEX_PATTERN,
      description: "Lowercase 64-hex acceptance fingerprint from #138.",
    },
    { key: "stageRequested", type: "enum", enum: VERIFICATION_STAGES, description: "Which stage was requested." },
    {
      key: "results",
      type: "array",
      specName: "VerificationResultV1",
      maxItems: VERIFICATION_LIMITS.results,
      description: `Ordered per-command results; at most ${VERIFICATION_LIMITS.results} rows in declared order.`,
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

/**
 * F97 — the submitted accessor that cannot be observed as plain data.
 *
 * Carries the RFC 6901 pointer of the frame that owns the failing read plus the
 * D16 code that frame earns: `invalid-type` for a walk failure (F92 parity) or
 * `limit-exceeded` for the canonical byte budget (F99). The message never names
 * the submitted key or value.
 */
class VerificationInputCaptureError extends Error {
  constructor(
    readonly pointer: string,
    readonly code: VerificationDiagnosticCodeV1 = "invalid-type",
  ) {
    super(code === "limit-exceeded" ? "verification input: over canonical byte budget" : "verification input: unreadable accessor");
    this.name = "VerificationInputCaptureError";
  }
}

/**
 * F99 — running canonical-size accumulator of one capture.
 *
 * `size` is the exact UTF-16 length of the document's canonical form (the same
 * fragments `canonicalJSONValue` emits: sorted keys, compact separators), so
 * `size > budget` is a *sound* over-budget verdict — a UTF-8 encoding is never
 * shorter than its UTF-16 length. Once an unsupported leaf or a non-plain object
 * makes the canonical form undefined, `applicable` drops and the size is no
 * longer charged: the structural walk refuses those documents itself.
 */
interface CaptureContext {
  readonly budget: number | null;
  size: number;
  applicable: boolean;
  /** Seen a non-ASCII character: bytes can exceed units, so the exact UTF-8 measure must run. */
  nonAscii: boolean;
}

/** True when the fragment survives canonical serialization as pure ASCII. */
function isAscii(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) > 0x7f) return false;
  }
  return true;
}

function charge(context: CaptureContext, units: number): void {
  if (!context.applicable) return;
  context.size += units;
  if (context.budget !== null && context.size > context.budget) {
    throw new VerificationInputCaptureError("", "limit-exceeded");
  }
}

/** UTF-16 length of a leaf's canonical fragment — the unit `canonicalJSONValue` emits. */
function canonicalLeafUnits(value: string | number | boolean): number {
  return JSON.stringify(value).length;
}

/**
 * F97 — capture one submitted value as data, reading every accessor exactly once.
 *
 * Plain objects become own-enumerable-key copies, arrays become element copies, and
 * every container is frozen, so no later pass can observe a different document than
 * the one the entry decided on. Two submissions are deliberately NOT rewritten by the
 * capture, because the structural walk — not the capture — owns every refusal:
 *   - a non-plain object (class instance, array-like prototype) is copied by
 *     reference, so its frame still refuses it as `invalid-type`;
 *   - an unsupported leaf (function, symbol, bigint, `undefined`, non-finite number)
 *     is copied as submitted, so the field check still refuses it.
 * An accessor that throws is reported at the frame that owns the read.
 */
function captureContractValue(value: unknown, pointer: string, context: CaptureContext): unknown {
  if (value === null) {
    charge(context, 4);
    return null;
  }
  if (typeof value === "string") {
    if (!context.nonAscii) context.nonAscii = !isAscii(value);
    charge(context, canonicalLeafUnits(value));
    return value;
  }
  if (typeof value === "boolean") {
    charge(context, canonicalLeafUnits(value));
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      // The canonical serializer has no form for it: the budget can no longer be
      // measured exactly, and the walk owns the refusal (F91-era behaviour).
      context.applicable = false;
      return value;
    }
    charge(context, canonicalLeafUnits(value));
    return value;
  }
  if (typeof value !== "object") {
    // function / symbol / bigint / undefined — outside the canonical form.
    context.applicable = false;
    return value;
  }

  if (Array.isArray(value)) {
    const items: unknown[] = [];
    for (let index = 0; index < value.length; index += 1) {
      let item: unknown;
      try {
        item = Object.freeze(captureContractValue(value[index], `${pointer}/${index}`, context));
      } catch (failure) {
        throw failure instanceof VerificationInputCaptureError
          ? failure
          : new VerificationInputCaptureError(pointer);
      }
      items.push(item);
    }
    charge(context, 2 + Math.max(items.length - 1, 0));
    return Object.freeze(items);
  }

  const proto = Object.getPrototypeOf(value);
  if (proto !== Object.prototype && proto !== null) {
    // Copied by reference; its canonical size is unknowable and its frame is
    // refused by the walk, so the measure is no longer exact from here on.
    context.applicable = false;
    return value;
  }

  const source = value as Record<string, unknown>;
  const keys = Object.keys(source);
  const captured: Record<string, unknown> = {};
  let keyUnits = 0;
  for (const key of keys) {
    let item: unknown;
    try {
      item = Object.freeze(captureContractValue(source[key], `${pointer}/${key}`, context));
    } catch (failure) {
      // The frame that owns the read answers for it — the same pointer rule F92
      // established for a walk failure, and it also bounds a self-referential
      // submission (the recursion's RangeError lands on the frame that opened it).
      throw failure instanceof VerificationInputCaptureError
        ? failure
        : new VerificationInputCaptureError(pointer);
    }
    if (!context.nonAscii) context.nonAscii = !isAscii(key);
    keyUnits += JSON.stringify(key).length + 1;
    // `defineProperty`, never assignment: a submitted own `__proto__` key (what
    // `JSON.parse` produces) is an ordinary data property, but plain assignment
    // would hit the inherited `Object.prototype.__proto__` setter and drop the key
    // the structural pass exists to refuse (P7).
    Object.defineProperty(captured, key, {
      value: item,
      enumerable: true,
      writable: false,
      configurable: false,
    });
  }
  charge(context, 2 + keyUnits + Math.max(keys.length - 1, 0));
  return Object.freeze(captured);
}

/**
 * Capture the submitted document once, optionally bounded by `budgetBytes` of
 * canonical form (F99): the capture aborts as soon as the running UTF-16 size
 * passes the budget, so an illegal payload costs about the budget's worth of
 * work instead of its own size. The abort reports the ROOT pointer — the byte
 * budget outranks every shape ceiling and answers one root-path row (D16/F77).
 *
 * `measureExact` says whether the running size IS the canonical byte size: the
 * document is pure ASCII (escapes are ASCII) and every leaf was measurable. A
 * caller may then skip its own byte measure; anything else falls back to it.
 */
export type VerificationInputCapture =
  | {
      readonly ok: true;
      readonly value: unknown;
      readonly measureExact: boolean;
    }
  | { readonly ok: false; readonly code: VerificationDiagnosticCodeV1; readonly pointer: string };

export function captureVerificationInput(
  value: unknown,
  budgetBytes?: number,
): VerificationInputCapture {
  const context: CaptureContext = {
    budget: budgetBytes ?? null,
    size: 0,
    applicable: true,
    nonAscii: false,
  };
  try {
    return {
      ok: true,
      value: Object.freeze(captureContractValue(value, "", context)),
      measureExact: context.applicable && !context.nonAscii,
    };
  } catch (failure) {
    if (failure instanceof VerificationInputCaptureError) {
      return { ok: false, code: failure.code, pointer: failure.pointer };
    }
    return { ok: false, code: "invalid-type", pointer: "" };
  }
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
  // A `minItems` predicate reads an ARRAY sibling, not a string one; the two
  // predicate families never mix on one rule.
  if (when.minItems !== undefined) {
    return Array.isArray(value) && value.length >= when.minItems;
  }
  if (typeof value !== "string") return false;
  if (when.equals !== undefined) return value === when.equals;
  if (when.in !== undefined) return when.in.includes(value);
  if (when.notIn !== undefined) {
    const vocabulary = verificationFieldSpec(spec, when.field)?.enum ?? [];
    return vocabulary.includes(value) && !when.notIn.includes(value);
  }
  return false;
}

/**
 * Diagnostic code for a value that is not the declared shape of `field`: a
 * const/enum mismatch is a wrong VALUE of an otherwise correct type, everything
 * else is a type failure. D16 keeps the row to code + path, so a submitted value
 * is never carried out of the validator.
 */
function typeCode(field: VerificationFieldSpec): VerificationDiagnosticCodeV1 {
  return field.type === "const" || field.type === "enum" ? "invalid-value" : "invalid-type";
}

/** Specialize a value-content failure to the field's own code (D5 evidence). */
function valueCode(field: VerificationFieldSpec): VerificationDiagnosticCodeV1 {
  return field.violationCode ?? "invalid-value";
}

/**
 * Compiled-pattern memo.
 *
 * Every pattern validated here is declared once in the frozen field-spec table
 * above, so re-parsing it per string field of every walked document was pure
 * repeat work; the cache holds that fixed handful of entries for the process
 * lifetime. Safe to share instances: these patterns are compiled without `g`/`y`,
 * so `test()` carries no lastIndex state between calls.
 */
const _compiledPatterns = new Map<string, RegExp>();

function compiledPattern(pattern: string): RegExp {
  let re = _compiledPatterns.get(pattern);
  if (re === undefined) {
    re = new RegExp(pattern);
    _compiledPatterns.set(pattern, re);
  }
  return re;
}

function checkString(
  field: VerificationFieldSpec,
  value: unknown,
  path: string,
  sink: VerificationDiagnosticSink,
): string | undefined {
  if (typeof value !== "string") {
    sink.push(typeCode(field), path);
    return undefined;
  }
  if (field.minLength !== undefined && value.length < field.minLength) {
    sink.push("limit-exceeded", path);
    return undefined;
  }
  if (field.nulFree && value.includes("\0")) {
    sink.push(valueCode(field), path);
    return undefined;
  }
  if (field.maxLength !== undefined && value.length > field.maxLength) {
    sink.push("limit-exceeded", path);
  }
  if (field.pattern !== undefined && !compiledPattern(field.pattern).test(value)) {
    sink.push(valueCode(field), path);
    return undefined;
  }
  for (const rule of field.rules ?? []) {
    if (!compiledPattern(rule.regex).test(value)) sink.push(valueCode(field), path);
  }
  return value;
}

function checkInteger(
  field: VerificationFieldSpec,
  value: unknown,
  path: string,
  sink: VerificationDiagnosticSink,
): number | undefined {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    sink.push("invalid-type", path);
    return undefined;
  }
  // A declared bound that Draft-07 can express is a limit failure; the positivity
  // rule for `timeoutMs` is a value rule, which is what the projection states as
  // `exclusiveMinimum`.
  if (field.exclusiveMinimum !== undefined && value <= field.exclusiveMinimum) {
    sink.push("limit-exceeded", path);
    return undefined;
  }
  if (field.minimum !== undefined && value < field.minimum) {
    sink.push("limit-exceeded", path);
    return undefined;
  }
  if (field.maximum !== undefined && value > field.maximum) {
    sink.push("limit-exceeded", path);
    return undefined;
  }
  return value;
}

/**
 * Validate one contract object against its spec, recording D16 diagnostics in
 * `sink`, and return its normalized own-property DTO — or `undefined` when
 * anything in this object (or below it) failed.
 *
 * Only own properties of declared keys are read, so inherited or prototype
 * values can never be mistaken for contract data; the returned object is a
 * fresh plain literal, so mutating the input afterwards cannot change it.
 *
 * Every path is an RFC 6901 JSON Pointer built from declared contract property
 * names and decimal array indices (`/commands/3/id`; `""` is the document root),
 * so a diagnostic identifies the offending location without naming — let alone
 * echoing — the submitted value.
 */
export function validateStructure(
  contract: VerificationContractSpec,
  spec: VerificationObjectSpec,
  value: unknown,
  path: string,
  sink: VerificationDiagnosticSink,
): Record<string, unknown> | undefined {
  // F92 — the walk reads only declared keys of a JSON document (the input
  // domain every public authority documents). An object outside that domain —
  // a live getter that throws, not constructible by JSON.parse — must never
  // smuggle an attacker-chosen exception past the D16 contract: the failure
  // is refused here as exactly one redacted `invalid-type` row on this frame.
  // Because the throw is caught by the frame that owns the read, nested rows
  // report their own pointer (e.g. `/results/0`) and nothing else re-throws.
  try {
    return validateStructureFields(contract, spec, value, path, sink);
  } catch {
    sink.push("invalid-type", path);
    return undefined;
  }
}

function validateStructureFields(
  contract: VerificationContractSpec,
  spec: VerificationObjectSpec,
  value: unknown,
  path: string,
  sink: VerificationDiagnosticSink,
): Record<string, unknown> | undefined {
  if (!isPlainRecord(value)) {
    sink.push("invalid-type", path);
    return undefined;
  }

  const before = sink.count();
  const at = (key: string) => `${path}/${key}`;

  for (const key of Object.keys(value)) {
    if (!spec.fields.some((field) => field.key === key)) {
      // The path names the CONTAINER, never the submitted key: an undeclared key
      // is input data, and D16 allows only contract property names and indices in
      // a pointer (so a probe like `__proto__` cannot echo itself back out).
      sink.push("unknown-field", path);
    }
  }

  const normalized: Record<string, unknown> = {};

  for (const field of spec.fields) {
    const fieldPath = at(field.key);
    if (!Object.prototype.hasOwnProperty.call(value, field.key)) {
      sink.push("missing-field", fieldPath);
      continue;
    }
    const raw = value[field.key];

    switch (field.type) {
      case "const": {
        if (raw !== field.value) sink.push(valueCode(field), fieldPath);
        else normalized[field.key] = raw;
        break;
      }
      case "enum": {
        const vocabulary = field.enum ?? [];
        if (!vocabulary.includes(raw as string)) sink.push(valueCode(field), fieldPath);
        else normalized[field.key] = raw;
        break;
      }
      case "boolean": {
        if (typeof raw !== "boolean") sink.push("invalid-type", fieldPath);
        else normalized[field.key] = raw;
        break;
      }
      case "string": {
        const checked = checkString(field, raw, fieldPath, sink);
        if (checked !== undefined) normalized[field.key] = checked;
        break;
      }
      case "integer": {
        const checked = checkInteger(field, raw, fieldPath, sink);
        if (checked !== undefined) normalized[field.key] = checked;
        break;
      }
      case "stringArray": {
        if (!Array.isArray(raw)) {
          sink.push("invalid-type", fieldPath);
          break;
        }
        // Cardinality first: the ceiling is expressible in Draft-07, so the
        // projection and this validator must agree (AC10).
        if (field.maxItems !== undefined && raw.length > field.maxItems) {
          sink.push("limit-exceeded", fieldPath);
          break;
        }
        const items: string[] = [];
        for (let i = 0; i < raw.length; i++) {
          const item = raw[i];
          if (typeof item !== "string") {
            sink.push("invalid-type", `${fieldPath}/${i}`);
            continue;
          }
          if (field.itemNulFree && item.includes("\0")) {
            sink.push("invalid-value", `${fieldPath}/${i}`);
            continue;
          }
          if (field.itemMaxLength !== undefined && item.length > field.itemMaxLength) {
            sink.push("limit-exceeded", `${fieldPath}/${i}`);
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
          sink.push("invalid-type", fieldPath);
          break;
        }
        if (field.minItems !== undefined && raw.length < field.minItems) {
          sink.push("limit-exceeded", fieldPath);
          break;
        }
        if (field.maxItems !== undefined && raw.length > field.maxItems) {
          sink.push("limit-exceeded", fieldPath);
          break;
        }
        const children: unknown[] = [];
        for (let i = 0; i < raw.length; i++) {
          const child = validateStructure(contract, nested, raw[i], `${fieldPath}/${i}`, sink);
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
          const checked = checkString(field, raw, fieldPath, sink);
          if (checked !== undefined) normalized[field.key] = checked;
          break;
        }
        if (field.nullableOf === "integer") {
          const checked = checkInteger(field, raw, fieldPath, sink);
          if (checked !== undefined) normalized[field.key] = checked;
          break;
        }
        if (!isPlainRecord(raw)) {
          sink.push("invalid-type", fieldPath);
          break;
        }
        const nested = verificationObjectSpec(contract, field.specName ?? "");
        const child = validateStructure(contract, nested, raw, fieldPath, sink);
        if (child) normalized[field.key] = child;
        break;
      }
    }
  }

  for (const rule of spec.rules) {
    // Binding-only rules describe how a verdict may be ACTED ON, not what
    // well-formed data is: the plain walk skips them, the binding authority
    // applies them explicitly over the same captured document.
    if (rule.enforcement === "binding") continue;
    applyCrossRule(spec, rule, value, path, sink);
  }

  return sink.count() === before ? normalized : undefined;
}

/** Fallback code per rule kind; a spec may name a narrower one with `code`. */
const CROSS_RULE_DEFAULT_CODE: Readonly<Record<VerificationRuleKind, VerificationDiagnosticCodeV1>> = Object.freeze({
  "exactly-one-non-null": "invalid-exit-state",
  "null-when": "invalid-value",
  "non-null-when": "invalid-value",
  unique: "duplicate-id",
  "timestamp-order": "invalid-value",
  "calendar-roundtrip": "invalid-value",
  "maximum-when": "limit-exceeded",
  "stage-aggregate-budget": "budget-exceeded",
  "unique-items": "duplicate-id",
  "enum-when": "invalid-value",
});

/**
 * Apply one cross-field rule to a captured, normalized document. Exported for a
 * family's binding authority, which re-applies the `binding`-enforcement rules
 * the shared walk deliberately skipped.
 */
export function applyCrossRule(
  spec: VerificationObjectSpec,
  rule: VerificationCrossRule,
  value: Record<string, unknown>,
  path: string,
  sink: VerificationDiagnosticSink,
): void {
  const code = (rule.code ?? CROSS_RULE_DEFAULT_CODE[rule.kind]) as VerificationDiagnosticCodeV1;
  const at = (key: string) => `${path}/${key}`;

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
        if (seen.has(key)) sink.push(code, `${at(collectionName)}/${i}/${field}`);
        else seen.add(key);
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
      // One row at the discriminator: the combination of its value with the
      // nullness of `fields` is the violation, and D16 forbids naming the values.
      if (present.length === fields.length || present.length === 0) sink.push(code, at(whenField));
      break;
    }
    case "null-when": {
      if (!ruleApplies(spec, rule, value)) break;
      for (const key of rule.fields ?? []) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) continue;
        if (value[key] !== null) sink.push(code, at(key));
      }
      break;
    }
    case "non-null-when": {
      if (!ruleApplies(spec, rule, value)) break;
      for (const key of rule.fields ?? []) {
        const present = Object.prototype.hasOwnProperty.call(value, key) && value[key] !== null;
        if (!present) sink.push(code, at(key));
      }
      break;
    }
    case "enum-when": {
      if (!ruleApplies(spec, rule, value)) break;
      const allowed = rule.values ?? [];
      for (const key of rule.fields ?? []) {
        const raw = value[key];
        // A non-string is refused by the field's own type/vocabulary check; this
        // rule only narrows the set of well-formed values.
        if (typeof raw === "string" && !allowed.includes(raw)) sink.push(code, at(key));
      }
      break;
    }
    case "maximum-when": {
      if (!ruleApplies(spec, rule, value)) break;
      for (const key of rule.fields ?? []) {
        const raw = value[key];
        // A numeric field is compared by value; an array field by row count, so
        // one kind states both "at most N" shapes (e.g. an empty-array ceiling).
        const count = typeof raw === "number" ? raw : Array.isArray(raw) ? raw.length : undefined;
        if (count !== undefined && rule.maximum !== undefined && count > rule.maximum) {
          sink.push(code, at(key));
        }
      }
      break;
    }
    case "unique-items": {
      // The Draft-07 floor: no two rows of `collection` are the same VALUE. A
      // family that needs key-level uniqueness declares its own stronger rule
      // (the pre-execution receipt pins digest uniqueness beside this floor).
      const collectionName = rule.collection ?? "";
      const collection = Array.isArray(value[collectionName]) ? (value[collectionName] as unknown[]) : [];
      const seen = new Set<string>();
      for (let i = 0; i < collection.length; i++) {
        const item = collection[i];
        if (!isPlainRecord(item)) continue;
        // Canonical form, not JSON.stringify: two own-property copies of one
        // row may carry different key orders but must mean one identity. A row
        // outside the canonical domain is refused by the field walk anyway, so
        // it is skipped here instead of masking those rows with a throw.
        let key: string;
        try {
          key = canonicalJSONValue(item);
        } catch {
          continue;
        }
        if (seen.has(key)) sink.push(code, `${at(collectionName)}/${i}`);
        else seen.add(key);
      }
      break;
    }
    case "stage-aggregate-budget": {
      // Sum the stage's declared timeouts in declared order and report the ONE
      // command that crossed — the earliest pointer that explains the overflow.
      const collectionName = rule.collection ?? "";
      const collection = Array.isArray(value[collectionName]) ? (value[collectionName] as unknown[]) : [];
      const discriminator = rule.when?.field ?? "";
      const stage = rule.when?.equals ?? "";
      const field = rule.fields?.[0] ?? "";
      const ceiling = rule.maximum;
      if (ceiling === undefined || !discriminator || !stage || !field) break;
      let total = 0;
      for (let i = 0; i < collection.length; i++) {
        const item = collection[i];
        if (!isPlainRecord(item) || item[discriminator] !== stage) continue;
        const timeout = item[field];
        if (typeof timeout !== "number") continue;
        total += timeout;
        if (total > ceiling) {
          sink.push(code, `${at(collectionName)}/${i}/${field}`);
          break;
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
        sink.push(code, at(end));
      }
      break;
    }
    case "calendar-roundtrip": {
      for (const key of rule.fields ?? []) {
        const raw = value[key];
        if (typeof raw !== "string" || !compiledPattern(ISO_8601_PATTERN).test(raw)) continue;
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
        if (!ok) sink.push(code, at(key));
      }
      break;
    }
  }
}
