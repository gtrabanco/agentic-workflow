/**
 * Canonical internal definition of the two pre-execution evidence contracts.
 *
 * This module is the SINGLE source of the `PreExecutionArtifactSnapshot v1` and
 * `PreExecutionReviewReceipt v1` structural contract: the closed field lists,
 * vocabularies, bounds, patterns, cross-field rules and named runtime-only
 * semantics declared here are consumed by
 *   - the two authoritative runtime entries in `index.ts` (which reuse
 *     `validateStructure`/`projectStructure` from `verification-contract.ts`, so
 *     the package keeps ONE structural engine), and
 *   - the deterministic Draft-07 structural projection generator
 *     (`scripts/generate-pre-execution-schemas.mjs`).
 *
 * It is package-internal: it is not re-exported from the package root and the
 * published `exports` map does not expose it. The generated JSON Schemas are
 * structural projections of this definition, never a second semantic authority
 * (AD-007). The rules listed in `RUNTIME_RULES` are deliberately not expressible
 * in Draft-07; the projections disclose them instead of implying they are checked.
 *
 * Feature 28, phase P1. The contracts prove what an independent reviewer read
 * BEFORE implementation; they never replace the candidate `ReviewReceipt v1`
 * (feature 25) or the staged `VerificationReceipt v1` (feature 26).
 */

import type {
  VerificationContractSpec,
  VerificationDiagnosticCodeV1,
  VerificationObjectSpec,
} from "./verification-contract.js";


// ---------------------------------------------------------------------------
// Contract identities and closed vocabularies (declared once)
// ---------------------------------------------------------------------------

export const PRE_EXECUTION_SNAPSHOT_CONTRACT_ID =
  "agentic-workflow/pre-execution-artifact-snapshot@1" as const;
export const PRE_EXECUTION_RECEIPT_CONTRACT_ID =
  "agentic-workflow/pre-execution-review-receipt@1" as const;

/** The two artifact-selection modes. `spec-product-v1` is the Product projection. */
export const PRE_EXECUTION_SELECTORS = Object.freeze(["whole-file", "spec-product-v1"] as const);

/** The reviewed stage. A fix unit has no SPEC stage (D6). */
export const PRE_EXECUTION_STAGES = Object.freeze(["spec", "plan"] as const);

/** The unit family the snapshot belongs to. */
export const PRE_EXECUTION_UNIT_KINDS = Object.freeze(["feature", "fix"] as const);

/**
 * The review-policy version a receipt is bound to. A policy bump rotates the
 * `stale-policy` axis: a receipt produced under a different version no longer
 * blesses a verdict. This is the ONE authority the pre-execution snapshot CLI
 * reads instead of a hardcoded literal (known-issue 24 / review finding F49).
 */
export const PRE_EXECUTION_POLICY_VERSION = "v1" as const;

/**
 * The artifact roles a pre-execution snapshot may bind. Deliberately excludes
 * execution progress (`progress.md`), raw exploration history, and findings
 * resolution: none of them are Plan authority (SPEC Design §2).
 */
export const PRE_EXECUTION_ARTIFACT_KINDS = Object.freeze([
  "spec",
  "acceptance",
  "plan",
  "tasks",
  "testing",
  "decisions",
  "architecture-notes",
  "planning-evidence",
  "obligations",
] as const);

/** Authoritative sources a reviewer was allowed to read besides the artifacts. */
export const PRE_EXECUTION_CONTEXT_KINDS = Object.freeze([
  "roadmap-row",
  "governing-issue",
  "normalized-repository-state",
  "architectural-invariants",
  "dependency-unit",
  "project-guide",
] as const);

/**
 * A context is either present (and bound by digest) or explicitly absent (and
 * bound by `null`). "I did not look" is not representable, which is the point:
 * an unknown stays owned by a named row instead of becoming a silent assumption.
 */
export const PRE_EXECUTION_CONTEXT_PRESENCE = Object.freeze(["present", "absent"] as const);

/** The five public review verdicts. There is no generic "approve" verb. */
export const PRE_EXECUTION_VERDICTS = Object.freeze([
  "spec-review-pass",
  "spec-review-fail",
  "plan-review-pass",
  "plan-review-fail",
  "needs-design",
] as const);

/** Severities mirror the candidate-review ladder; `info` is the only immaterial one. */
export const PRE_EXECUTION_FINDING_SEVERITIES = Object.freeze([
  "info", "low", "medium", "high", "critical",
] as const);

/** The five root-cause owners a finding can be routed to (SPEC Design §4). */
export const PRE_EXECUTION_FINDING_CLASSES = Object.freeze([
  "product", "plan", "source", "environment", "runtime",
] as const);

export const PRE_EXECUTION_FINDING_VERIFICATION = Object.freeze(["verified", "unverified"] as const);
export const PRE_EXECUTION_FINDING_RESOLUTIONS = Object.freeze(["open", "resolved", "dismissed"] as const);
export const PRE_EXECUTION_REVIEW_ROLES = Object.freeze([
  "reviewer", "critic", "synthesizer", "arbiter",
] as const);
/** The reviewer roles allowed to carry parent receipts (topology, not rank). */
export const PARENT_CAPABLE_REVIEWER_ROLES = Object.freeze([
  "critic", "synthesizer", "arbiter",
] as const);
export const PRE_EXECUTION_PARENT_ROLES = Object.freeze(["critic", "synthesis", "arbitration"] as const);
export const PRE_EXECUTION_AUTHOR_EXCLUSIONS = Object.freeze(["enforced", "not-enforceable"] as const);
/** Truthful diversity reporting: a same-model review is never labelled diverse. */
type Stage = (typeof PRE_EXECUTION_STAGES)[number];
type Verdict = (typeof PRE_EXECUTION_VERDICTS)[number];

/** Which verdicts belong to which stage. There is no generic "approve". */
export const VERDICTS_BY_STAGE: Readonly<Record<Stage, readonly Verdict[]>> =
  Object.freeze({
    spec: ["spec-review-pass", "spec-review-fail", "needs-design"],
    // fix/162 Decision 11: the machine map no longer sanctions a plan-stage
    // needs-design — ONLY review-spec may emit it. The flat PRE_EXECUTION_VERDICTS
    // keeps the token (review-spec still emits it), and no persisted plan-stage
    // needs-design receipt exists, so the narrowing invalidates nothing historical.
    plan: ["plan-review-pass", "plan-review-fail"],
  });

export const PRE_EXECUTION_MODEL_DIVERSITY = Object.freeze([
  "same-model", "cross-model", "not-applicable",
] as const);

/**
 * Bounded usability. Every number the validator enforces lives here and is
 * published, so a consumer sizes fixtures without restating a literal.
 *
 * The byte budgets are reachable *below* the shape ceilings on purpose: a
 * snapshot of `artifacts` rows whose paths each sit at `pathChars` is already
 * larger than `snapshotBytes`, so the payload budget is the first refusal a wide
 * document earns and the diagnostic ceiling is never spent on it.
 */
export const PRE_EXECUTION_LIMITS = Object.freeze({
  artifacts: 32,
  contexts: 16,
  findings: 64,
  evidencePerFinding: 8,
  parentReceipts: 8,
  receiptDiagnostics: 8,
  unitIdChars: 128,
  revisionIdChars: 128,
  idChars: 128,
  pathChars: 1024,
  identifierChars: 160,
  claimChars: 2048,
  evidenceChars: 1024,
  resolutionEvidenceChars: 2048,
  policyChars: 64,
  diagnosticChars: 512,
  artifactBytes: 4 * 1024 * 1024,
  snapshotBytes: 32 * 1024,
  receiptBytes: 64 * 1024,
  /** Shared ceiling of the one package-wide diagnostic sink. */
  diagnostics: 50,
} as const);

/**
 * The rules a Draft-07 projection cannot express. The generator lists these ids,
 * with their human-readable claim, in the projection `$comment`, so an editor
 * that validates against the projection knows exactly what it did NOT check.
 */
/**
 * The rules the runtime enforces that Draft-07 cannot express, named and claimed.
 * The generator appends the ids of every non-projectable cross-field rule it
 * finds in the definition, so this list and the rule tables must agree — the
 * projection test fails if a rule is enforced but undisclosed.
 */
export const PRE_EXECUTION_RUNTIME_RULES = Object.freeze({
  snapshot: [
    { id: "stage-required-artifacts", claim: "stage drives the required artifact set" },
    { id: "selector-requires-product-stage", claim: "spec-product-v1 requires stage spec on the spec row" },
    { id: "artifact-order-is-canonical", claim: "artifact rows are ordered by UTF-8 path bytes" },
    { id: "one-row-per-kind", claim: "each artifact kind appears at most once" },
    { id: "context-order-is-canonical", claim: "context rows are ordered by kind then identifier" },
    { id: "one-context-per-identity", claim: "each (kind, identifier) context appears once" },
    { id: "fix-has-no-product-stage", claim: "unitKind fix cannot carry a SPEC-stage snapshot" },
  ],
  receipt: [
    { id: "finding-requires-evidence", claim: "every finding carries at least one evidence reference" },
    { id: "pass-requires-resolved-material-findings", claim: "PASS cannot coexist with an open or unverified material finding" },
    { id: "dismissal-requires-counter-evidence", claim: "only recorded counter-evidence dismisses a finding" },
    { id: "author-exclusion-where-enforced", claim: "an enforcing runtime rejects a reused author identity" },
    { id: "pass-requires-clean-context", claim: "PASS requires context-clean evidence" },
    { id: "unique-parent-digests", claim: "parent receipt digests are unique" },
    { id: "receipt-bound-to-snapshot", claim: "the verdict must bind the exact snapshot digest" },
  ],
} as const);

// ---------------------------------------------------------------------------
// Shared field vocabulary
// ---------------------------------------------------------------------------

const NUL_MESSAGE = "must not contain NUL characters";
const ISO_8601_PATTERN = "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d+)?Z$";
const LOWERCASE_64HEX_PATTERN = "^[a-f0-9]{64}$";
/** A git object id is either the historical SHA-1 or a SHA-256 length. */
const SOURCE_REVISION_PATTERN = "^[a-f0-9]{40}$|^[a-f0-9]{64}$";
/**
 * Opaque, bounded, transport-safe identifiers (`28-unit`, `rev-0002`,
 * `docs/fix/74-unit`, `review-0001`). They are compared, never resolved, so no path
 * normalization applies — but a leading `-` and every control character are refused,
 * because these values cross CLI and JSON boundaries on the way to a driver.
 */
const OPAQUE_ID_PATTERN = "^[A-Za-z0-9][A-Za-z0-9._:/-]*$";
const RELATIVE_PATH_RULES = [
  { regex: "^(?!$)", message: "must not be empty" },
  { regex: "^(?!/)", message: 'must not be an absolute path (leading "/")' },
  { regex: "^(?![A-Za-z]:)", message: "must not be a Windows drive-letter path" },
  { regex: "^(?!.*\\\\)", message: "must not contain backslashes" },
  { regex: "^(?!.*(\\/|^)\\.\\.?($|\\/))", message: 'must not contain "." or ".." segments' },
  { regex: "^(?!.*\\/$)", message: "must not end with a separator" },
  { regex: "^(?!.*//)", message: "must not contain an empty segment" },
];

function opaqueId(key: string, description: string, maxLength = PRE_EXECUTION_LIMITS.idChars) {
  return {
    key,
    type: "string" as const,
    minLength: 1,
    maxLength,
    nulFree: true,
    pattern: OPAQUE_ID_PATTERN,
    violationCode: "invalid-value" as VerificationDiagnosticCodeV1,
    description: `${description} Opaque: compared, never parsed, and never echoed back by a diagnostic.`,
  };
}

// ---------------------------------------------------------------------------
// PreExecutionArtifactSnapshot v1
// ---------------------------------------------------------------------------

const ARTIFACT_ROW_SPEC: VerificationObjectSpec = {
  description: "One artifact bound into a pre-execution snapshot.",
  fields: [
    {
      key: "kind",
      type: "enum",
      enum: PRE_EXECUTION_ARTIFACT_KINDS,
      description: "Artifact role inside the stage's authoritative set.",
    },
    {
      key: "path",
      type: "string",
      // Non-empty is expressed as a pattern, not `minLength`: an un-named file is
      // a malformed PATH (`invalid-value`), not a capacity failure, and a driver
      // routing on the code must be able to tell the two apart.
      maxLength: PRE_EXECUTION_LIMITS.pathChars,
      nulFree: true,
      rules: RELATIVE_PATH_RULES,
      violationCode: "invalid-value",
      description: `Normalized repository-relative path; at most ${PRE_EXECUTION_LIMITS.pathChars} characters.`,
    },
    {
      key: "selector",
      type: "enum",
      enum: PRE_EXECUTION_SELECTORS,
      description: "How the bound bytes were selected out of the file.",
    },
    {
      key: "byteLength",
      type: "integer",
      minimum: 0,
      maximum: PRE_EXECUTION_LIMITS.artifactBytes,
      description: `UTF-8 length of the SELECTION (a Product projection is smaller than its file), at most ${PRE_EXECUTION_LIMITS.artifactBytes} bytes.`,
    },
    {
      key: "digest",
      type: "string",
      minLength: 64,
      maxLength: 64,
      nulFree: true,
      pattern: LOWERCASE_64HEX_PATTERN,
      violationCode: "invalid-value",
      description: "Lowercase SHA-256 of the selected bytes.",
    },
  ],
  // Path/kind uniqueness and byte ordering are properties of the COLLECTION, so
  // they are declared on the snapshot root (see `SNAPSHOT_ROOT_SPEC`) — a row
  // cannot see its siblings.
  rules: [],
};

const CONTEXT_ROW_SPEC: VerificationObjectSpec = {
  description: "One authoritative context the reviewer was allowed to rely on.",
  fields: [
    { key: "kind", type: "enum", enum: PRE_EXECUTION_CONTEXT_KINDS, description: "Context authority." },
    {
      key: "identifier",
      type: "string",
      minLength: 1,
      maxLength: PRE_EXECUTION_LIMITS.identifierChars,
      nulFree: true,
      // A leading `#` is legal HERE and nowhere else: `#146` is how a governing
      // issue gets named in this ecosystem, and refusing it would push reviewers
      // into writing the less checkable "146".
      pattern: "^[#A-Za-z0-9][A-Za-z0-9._:/#-]*$",
      violationCode: "invalid-value",
      description: `Stable identifier (a roadmap row, an issue number such as #146, a snapshot id); at most ${PRE_EXECUTION_LIMITS.identifierChars} characters.`,
    },
    { key: "presence", type: "enum", enum: PRE_EXECUTION_CONTEXT_PRESENCE, description: "Whether the authority exists." },
    {
      key: "digest",
      type: "nullable",
      nullableOf: "string",
      minLength: 64,
      maxLength: 64,
      nulFree: true,
      pattern: LOWERCASE_64HEX_PATTERN,
      violationCode: "invalid-value",
      description: "Lowercase SHA-256 of the context bytes when present; exactly null when absent.",
    },
  ],
  rules: [
    {
      id: "present-context-has-digest",
      description: "A present context binds a digest.",
      projectable: true,
      kind: "non-null-when",
      when: { field: "presence", equals: "present" },
      fields: ["digest"],
    },
    {
      id: "absent-context-has-null-digest",
      description: "An absent context binds exactly `null`.",
      projectable: true,
      kind: "null-when",
      when: { field: "presence", equals: "absent" },
      fields: ["digest"],
    },
  ],
};

const SNAPSHOT_ROOT_SPEC: VerificationObjectSpec = {
  description: "The exact artifact set one independent reviewer read.",
  fields: [
    {
      key: "contract",
      type: "const",
      value: PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
      violationCode: "invalid-value",
      description: "Contract identifier.",
    },
    { key: "stage", type: "enum", enum: PRE_EXECUTION_STAGES, description: "Reviewed stage." },
    { key: "unitKind", type: "enum", enum: PRE_EXECUTION_UNIT_KINDS, description: "Unit family." },
    opaqueId("unitId", `Roadmap or fix-unit identity; at most ${PRE_EXECUTION_LIMITS.unitIdChars} characters.`, PRE_EXECUTION_LIMITS.unitIdChars),
    {
      key: "sourceRevision",
      type: "string",
      minLength: 40,
      maxLength: 64,
      nulFree: true,
      pattern: SOURCE_REVISION_PATTERN,
      violationCode: "invalid-value",
      description: "Exact repository revision the artifacts were read at (SHA-1 or SHA-256 object id).",
    },
    opaqueId("artifactRevisionId", `Authoring-owned revision identity; at most ${PRE_EXECUTION_LIMITS.revisionIdChars} characters.`, PRE_EXECUTION_LIMITS.revisionIdChars),
    {
      key: "artifacts",
      type: "array",
      specName: "PreExecutionArtifactRowV1",
      minItems: 1,
      maxItems: PRE_EXECUTION_LIMITS.artifacts,
      description: `Ordered artifact rows; 1..${PRE_EXECUTION_LIMITS.artifacts}, ordered by UTF-8 path bytes.`,
    },
    {
      key: "contexts",
      type: "array",
      specName: "PreExecutionContextBindingV1",
      maxItems: PRE_EXECUTION_LIMITS.contexts,
      description: `Authoritative context bindings; 0..${PRE_EXECUTION_LIMITS.contexts}, ordered by kind then identifier.`,
    },
    {
      key: "parentSpecSnapshotDigest",
      type: "nullable",
      nullableOf: "string",
      minLength: 64,
      maxLength: 64,
      nulFree: true,
      pattern: LOWERCASE_64HEX_PATTERN,
      violationCode: "invalid-value",
      description: "Digest of the reviewed Product snapshot: required for a feature Plan snapshot, exactly null at the SPEC stage and for a fix unit (it has no Product half to bind, D6).",
    },
  ],
  rules: [
    {
      id: "spec-stage-has-no-parent",
      description: "A SPEC snapshot is the root of its own lineage.",
      projectable: true,
      kind: "null-when",
      when: { field: "stage", equals: "spec" },
      fields: ["parentSpecSnapshotDigest"],
    },
    {
      id: "plan-stage-requires-parent",
      description: "A Plan snapshot of a FEATURE unit binds the exact reviewed Product snapshot.",
      projectable: true,
      kind: "non-null-when",
      // RS14: the only sanctioned `stage: spec` binding is `spec-product-v1`, and a
      // fix SPEC has no `Size`/`Product half`/`Design status` to project — so a fix
      // unit can never produce the parent this rule used to demand, and its
      // `review-plan` was blocked by construction. The parent is lineage over a
      // Product review that exists, which means `stage == plan AND unitKind == feature`.
      when: {
        allOf: [
          { field: "stage", equals: "plan" },
          { field: "unitKind", equals: "feature" },
        ],
      },
      fields: ["parentSpecSnapshotDigest"],
    },
    {
      id: "fix-unit-has-no-product-parent",
      description: "A fix unit has no Product snapshot, so its Plan snapshot binds no parent.",
      projectable: true,
      kind: "null-when",
      // The other half of the narrowed rule, stated as a prohibition rather than a
      // permission: a fix receipt that named a parent would claim a Product review
      // that no clean-context reviewer ever ran (D6).
      when: { field: "unitKind", equals: "fix" },
      fields: ["parentSpecSnapshotDigest"],
    },
    {
      id: "unique-artifact-paths",
      description: "One artifact row per repository path.",
      projectable: false,
      kind: "unique",
      collection: "artifacts",
      fields: ["path"],
      code: "duplicate-id",
    },
  ],
};

// ---------------------------------------------------------------------------
// PreExecutionReviewReceipt v1
// ---------------------------------------------------------------------------

const FINDING_SPEC: VerificationObjectSpec = {
  description: "One structured review finding.",
  fields: [
    opaqueId("id", "Stable finding identity, unique inside the receipt."),
    { key: "severity", type: "enum", enum: PRE_EXECUTION_FINDING_SEVERITIES, description: "Severity ladder shared with candidate review; `info` is the only immaterial row." },
    { key: "class", type: "enum", enum: PRE_EXECUTION_FINDING_CLASSES, description: "Root-cause owner the finding routes to." },
    {
      key: "claim",
      type: "string",
      minLength: 1,
      maxLength: PRE_EXECUTION_LIMITS.claimChars,
      nulFree: true,
      description: `What the reviewer asserts is missing or wrong; at most ${PRE_EXECUTION_LIMITS.claimChars} characters.`,
    },
    {
      key: "evidenceRefs",
      type: "stringArray",
      minItems: 1,
      maxItems: PRE_EXECUTION_LIMITS.evidencePerFinding,
      itemNulFree: true,
      itemMaxLength: PRE_EXECUTION_LIMITS.evidenceChars,
      description: `Non-empty file:line references; at most ${PRE_EXECUTION_LIMITS.evidencePerFinding}. A claim without evidence is not a finding.`,
    },
    { key: "verification", type: "enum", enum: PRE_EXECUTION_FINDING_VERIFICATION, description: "Whether the claim was checked against the artifact." },
    { key: "resolution", type: "enum", enum: PRE_EXECUTION_FINDING_RESOLUTIONS, description: "Resolution state inside the owning author's repair." },
    {
      key: "resolutionEvidence",
      type: "nullable",
      nullableOf: "string",
      minLength: 1,
      maxLength: PRE_EXECUTION_LIMITS.resolutionEvidenceChars,
      nulFree: true,
      description: "Counter-evidence or repair pointer. Required to dismiss or resolve a finding.",
    },
  ],
  rules: [
    {
      id: "dismissal-needs-counter-evidence",
      description: "A dismissed finding records the evidence that falsifies it.",
      projectable: true,
      kind: "non-null-when",
      when: { field: "resolution", in: ["dismissed", "resolved"] },
      fields: ["resolutionEvidence"],
      code: "invalid-evidence",
    },
  ],
};

const PARENT_RECEIPT_SPEC: VerificationObjectSpec = {
  description: "One optional parent review receipt in a critique/synthesis topology.",
  fields: [
    { key: "role", type: "enum", enum: PRE_EXECUTION_PARENT_ROLES, description: "Parent role. No quorum or majority meaning is attached to this list." },
    {
      key: "receiptDigest",
      type: "string",
      minLength: 64,
      maxLength: 64,
      nulFree: true,
      pattern: LOWERCASE_64HEX_PATTERN,
      violationCode: "invalid-value",
      description: "Lowercase SHA-256 digest of the parent receipt.",
    },
  ],
  rules: [],
};

const RECEIPT_ROOT_SPEC: VerificationObjectSpec = {
  description: "An independent, content-bound verdict on one pre-execution snapshot.",
  fields: [
    {
      key: "contract",
      type: "const",
      value: PRE_EXECUTION_RECEIPT_CONTRACT_ID,
      violationCode: "invalid-value",
      description: "Contract identifier. Candidate and verification receipts carry other ids and are refused here.",
    },
    opaqueId("id", "Stable receipt identity."),
    { key: "stage", type: "enum", enum: PRE_EXECUTION_STAGES, description: "Stage the verdict belongs to." },
    {
      key: "snapshotDigest",
      type: "string",
      minLength: 64,
      maxLength: 64,
      nulFree: true,
      pattern: LOWERCASE_64HEX_PATTERN,
      violationCode: "invalid-value",
      description: "Digest of the exact snapshot that was reviewed.",
    },
    { key: "verdict", type: "enum", enum: PRE_EXECUTION_VERDICTS, description: "One of the five public verdicts." },
    {
      key: "findings",
      type: "array",
      specName: "PreExecutionReviewFindingV1",
      maxItems: PRE_EXECUTION_LIMITS.findings,
      description: `Structured findings; at most ${PRE_EXECUTION_LIMITS.findings}. A PASS never carries an open or unverified material row.`,
    },
    opaqueId("reviewer", "Reviewer identity as the runtime knows it."),
    opaqueId("sessionId", "Session identity of the context-clean review."),
    { key: "reviewerRole", type: "enum", enum: PRE_EXECUTION_REVIEW_ROLES, description: "Role this receipt played in the review topology." },
    opaqueId("authorId", "Identity of the artifact author the exclusion rule compares against."),
    { key: "authorExclusion", type: "enum", enum: PRE_EXECUTION_AUTHOR_EXCLUSIONS, description: "Whether the runtime can actually observe author identity." },
    { key: "contextClean", type: "boolean", description: "The review ran in a context that did not author the artifact." },
    { key: "modelDiversity", type: "enum", enum: PRE_EXECUTION_MODEL_DIVERSITY, description: "Truthful diversity label; never inferred from plurality." },
    {
      key: "policyVersion",
      type: "string",
      minLength: 1,
      maxLength: PRE_EXECUTION_LIMITS.policyChars,
      nulFree: true,
      description: `Review policy version the verdict was produced under; at most ${PRE_EXECUTION_LIMITS.policyChars} characters.`,
    },
    {
      key: "startedAt",
      type: "string",
      minLength: 20,
      maxLength: 40,
      nulFree: true,
      pattern: ISO_8601_PATTERN,
      violationCode: "invalid-value",
      description: "UTC start of the review.",
    },
    {
      key: "finishedAt",
      type: "string",
      minLength: 20,
      maxLength: 40,
      nulFree: true,
      pattern: ISO_8601_PATTERN,
      violationCode: "invalid-value",
      description: "UTC end of the review.",
    },
    {
      key: "parentReceipts",
      type: "array",
      specName: "PreExecutionParentReceiptV1",
      maxItems: PRE_EXECUTION_LIMITS.parentReceipts,
      description: `Optional bounded critique/synthesis/arbitration parents; at most ${PRE_EXECUTION_LIMITS.parentReceipts}. Presence is topology, not a vote.`,
    },
    {
      key: "diagnostics",
      type: "stringArray",
      maxItems: PRE_EXECUTION_LIMITS.receiptDiagnostics,
      itemNulFree: true,
      itemMaxLength: PRE_EXECUTION_LIMITS.diagnosticChars,
      description: `Reviewer-side notes; at most ${PRE_EXECUTION_LIMITS.receiptDiagnostics} rows of ${PRE_EXECUTION_LIMITS.diagnosticChars} characters.`,
    },
  ],
  rules: [
    // The verdict/stage compatibility matrix, declared once from the two closed
    // vocabularies and rendered into the projection: `plan-review-pass` is not a
    // SPEC verdict wearing different clothes, it is a claim about a different
    // artifact set, so the pair is refused as a stage error (`invalid-stage`).
    // One logical rule over two stage branches — both projection blocks carry
    // the same `[verdict-stage-matrix]` marker, each `if` discriminates its stage.
    ...PRE_EXECUTION_STAGES.map((stage) => ({
      id: "verdict-stage-matrix",
      description: `A ${stage.toUpperCase()}-stage receipt carries only ${stage} verdicts.`,
      projectable: true,
      kind: "enum-when" as const,
      when: { field: "stage", equals: stage },
      fields: ["verdict"],
      values: VERDICTS_BY_STAGE[stage],
      code: "invalid-stage" as const,
    })),
    // Parent topology, declared once and enforced by the shared walk (the
    // former inline check is this rule pair, not a second authority):
    //   - shaped — parents only exist inside a critique/synthesis/arbitration
    //     topology, so their presence narrows the reviewer role;
    //   - restrained — a plain reviewer receipt carries no parents at all.
    // Both report `invalid-topology` at the role/collection pointer.
    {
      id: "parent-topology-shaped",
      description: "Parent receipts require a critic, synthesizer, or arbiter reviewer role.",
      projectable: true,
      // Binding-time: a well-formed receipt may record the topology; only the
      // authority that blesses a verdict refuses to act on it.
      enforcement: "binding" as const,
      kind: "enum-when" as const,
      when: { field: "parentReceipts", minItems: 1 },
      fields: ["reviewerRole"],
      values: PARENT_CAPABLE_REVIEWER_ROLES,
      code: "invalid-topology" as const,
    },
    {
      id: "parent-topology-restrained",
      description: "A plain reviewer receipt carries no parent receipts.",
      projectable: true,
      enforcement: "binding" as const,
      kind: "maximum-when" as const,
      when: { field: "reviewerRole", equals: "reviewer" },
      fields: ["parentReceipts"],
      maximum: 0,
      code: "invalid-topology" as const,
    },
    // The Draft-07 floor for parent identity: no two rows are the same value.
    // The digest-level authority below (`unique-parent-receipts`) stays
    // runtime-only and strictly stronger.
    {
      id: "parent-identities-unique",
      description: "Parent receipts are unique rows; digests are unique too (runtime rule).",
      projectable: true,
      kind: "unique-items" as const,
      collection: "parentReceipts",
      code: "duplicate-id" as const,
    },
    {
      id: "timestamp-order",
      description: "A review cannot finish before it started.",
      projectable: false,
      kind: "timestamp-order",
      fields: ["startedAt", "finishedAt"],
    },
    {
      id: "calendar-roundtrip",
      description: "Timestamps name a real UTC instant.",
      projectable: false,
      kind: "calendar-roundtrip",
      fields: ["startedAt", "finishedAt"],
    },
    {
      id: "unique-finding-ids",
      description: "One row per finding identity.",
      projectable: false,
      kind: "unique",
      collection: "findings",
      fields: ["id"],
      code: "duplicate-id",
    },
    {
      id: "unique-parent-receipts",
      description: "One row per parent receipt digest.",
      projectable: false,
      kind: "unique",
      collection: "parentReceipts",
      fields: ["receiptDigest"],
      code: "duplicate-id",
    },
  ],
};

// ---------------------------------------------------------------------------
// The published definition
// ---------------------------------------------------------------------------

/**
 * One contract definition: the shared structural shape plus the runtime-only rules
 * the generator must disclose (Draft-07 cannot express them, so a projection that
 * stayed silent would imply a check it never performs).
 */
export interface PreExecutionContractSpec extends VerificationContractSpec {
  readonly runtimeRules: readonly { readonly id: string; readonly claim: string }[];
}

/**
 * The two pre-execution contracts in the shape the shared structural engine and
 * the projection generator consume. `authority` names the runtime entry that owns
 * validity — and for the receipt, PASS — which the projections repeat in `$comment`.
 */
export const PRE_EXECUTION_CONTRACT: Readonly<{
  snapshot: PreExecutionContractSpec;
  receipt: PreExecutionContractSpec;
}> = Object.freeze({
  snapshot: Object.freeze({
    contractId: PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
    fileName: "pre-execution-artifact-snapshot.schema.json",
    title: "PreExecutionArtifactSnapshot v1",
    description:
      "The exact artifact set, authoritative contexts, source revision and authoring revision one independent pre-execution reviewer read.",
    authority: "validatePreExecutionArtifactSnapshotV1",
    rootLabel: "snapshot",
    root: SNAPSHOT_ROOT_SPEC,
    objects: Object.freeze({
      PreExecutionArtifactRowV1: ARTIFACT_ROW_SPEC,
      PreExecutionContextBindingV1: CONTEXT_ROW_SPEC,
    }),
    runtimeRules: PRE_EXECUTION_RUNTIME_RULES.snapshot,
  }),
  receipt: Object.freeze({
    contractId: PRE_EXECUTION_RECEIPT_CONTRACT_ID,
    fileName: "pre-execution-review-receipt.schema.json",
    title: "PreExecutionReviewReceipt v1",
    description:
      "A content-bound verdict on one pre-execution snapshot, with structured findings, reviewer identities, and an optional critique/synthesis topology.",
    authority: "validatePreExecutionReceiptAgainstSnapshot",
    rootLabel: "receipt",
    root: RECEIPT_ROOT_SPEC,
    objects: Object.freeze({
      PreExecutionReviewFindingV1: FINDING_SPEC,
      PreExecutionParentReceiptV1: PARENT_RECEIPT_SPEC,
    }),
    runtimeRules: PRE_EXECUTION_RUNTIME_RULES.receipt,
  }),
});
