/**
 * Pre-execution evidence contracts — the feature 28 runtime surface.
 *
 * `PreExecutionArtifactSnapshot v1` records the EXACT artifact set, authoritative
 * contexts, source revision and authoring revision an independent reviewer read;
 * `PreExecutionReviewReceipt v1` records that reviewer's content-bound verdict on
 * one snapshot. Together they make "the Product was reviewed before the Plan was
 * written" a checkable claim instead of a hopeful sentence in a progress log.
 *
 * What lives here, and what deliberately does not:
 *   - Every structural rule is declared once in `pre-execution-contract.ts` and
 *     enforced by the ONE package-wide structural engine (`validateStructure`),
 *     so this module adds semantics, not a second walker.
 *   - The package never reads the filesystem or Git. The selector and the builder
 *     consume caller-supplied text and caller-supplied revisions, so a reviewer can
 *     bind a document from any source (forge API, shallow clone, editor buffer) and
 *     a digest can never describe bytes other than the ones it was handed.
 *   - These contracts are not the candidate review receipt (feature 25) and not the
 *     staged verification receipt (feature 26): a pre-execution PASS authorizes
 *     WRITING code, never merging it. A substitute from either family is refused by
 *     contract-id mismatch before any content is compared.
 *
 * Feature 28, phase P1. Diagnostics follow the package's D16 rule: a frozen code
 * plus an RFC 6901 pointer, never the submitted value.
 */

import {
  VERIFICATION_DIAGNOSTIC_CODES,
  applyCrossRule,
  captureVerificationInput,
  createVerificationDiagnosticSink,
  projectStructure,
  validateStructure,
  type VerificationContractSpec,
  type VerificationDiagnosticSink,
  type VerificationInputCapture,
} from "./verification-contract.js";
import {
  PRE_EXECUTION_ARTIFACT_KINDS,
  PRE_EXECUTION_AUTHOR_EXCLUSIONS,
  PRE_EXECUTION_CONTEXT_KINDS,
  PRE_EXECUTION_CONTEXT_PRESENCE,
  PRE_EXECUTION_CONTRACT,
  PRE_EXECUTION_FINDING_CLASSES,
  PRE_EXECUTION_FINDING_RESOLUTIONS,
  PRE_EXECUTION_FINDING_SEVERITIES,
  PRE_EXECUTION_FINDING_VERIFICATION,
  PRE_EXECUTION_LIMITS,
  PRE_EXECUTION_MODEL_DIVERSITY,
  PRE_EXECUTION_PARENT_ROLES,
  PRE_EXECUTION_RECEIPT_CONTRACT_ID,
  PRE_EXECUTION_REVIEW_ROLES,
  PRE_EXECUTION_SELECTORS,
  PRE_EXECUTION_STAGES,
  PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
  PRE_EXECUTION_UNIT_KINDS,
  PRE_EXECUTION_VERDICTS,
} from "./pre-execution-contract.js";
import {
  PRE_EXECUTION_CANONICAL_VECTORS,
  type PreExecutionCanonicalVector,
} from "./pre-execution-vectors.js";
import {
  canonicalizeContractInput,
  canonicalJSONValue,
  utf8Bytes,
  utf8ByteCompare,
} from "./canonical-json.js";
import { sha256Hex, sha256HexSync } from "./sha256.js";

// ---------------------------------------------------------------------------
// Published identities, vocabularies, and types
// ---------------------------------------------------------------------------

export {
  PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
  PRE_EXECUTION_RECEIPT_CONTRACT_ID,
  PRE_EXECUTION_STAGES,
  PRE_EXECUTION_UNIT_KINDS,
  PRE_EXECUTION_SELECTORS,
  PRE_EXECUTION_ARTIFACT_KINDS,
  PRE_EXECUTION_CONTEXT_KINDS,
  PRE_EXECUTION_CONTEXT_PRESENCE,
  PRE_EXECUTION_VERDICTS,
  PRE_EXECUTION_FINDING_SEVERITIES,
  PRE_EXECUTION_FINDING_CLASSES,
  PRE_EXECUTION_FINDING_VERIFICATION,
  PRE_EXECUTION_FINDING_RESOLUTIONS,
  PRE_EXECUTION_REVIEW_ROLES,
  PRE_EXECUTION_PARENT_ROLES,
  PRE_EXECUTION_AUTHOR_EXCLUSIONS,
  PRE_EXECUTION_MODEL_DIVERSITY,
  PRE_EXECUTION_LIMITS,
  PRE_EXECUTION_CANONICAL_VECTORS,
};

export type { PreExecutionCanonicalVector };
export { PRE_EXECUTION_RUNTIME_RULES } from "./pre-execution-contract.js";

/** The one selector a SPEC-stage snapshot may bind: the Product projection (D2). */
export const PRE_EXECUTION_SNAPSHOT_SELECTOR = "spec-product-v1" as const;

export type PreExecutionStage = (typeof PRE_EXECUTION_STAGES)[number];
export type PreExecutionUnitKind = (typeof PRE_EXECUTION_UNIT_KINDS)[number];
export type PreExecutionSelector = (typeof PRE_EXECUTION_SELECTORS)[number];
export type PreExecutionArtifactKind = (typeof PRE_EXECUTION_ARTIFACT_KINDS)[number];
export type PreExecutionContextKind = (typeof PRE_EXECUTION_CONTEXT_KINDS)[number];
export type PreExecutionContextPresence = (typeof PRE_EXECUTION_CONTEXT_PRESENCE)[number];
export type PreExecutionVerdict = (typeof PRE_EXECUTION_VERDICTS)[number];
export type PreExecutionFindingSeverity = (typeof PRE_EXECUTION_FINDING_SEVERITIES)[number];
export type PreExecutionFindingClass = (typeof PRE_EXECUTION_FINDING_CLASSES)[number];
export type PreExecutionFindingVerification = (typeof PRE_EXECUTION_FINDING_VERIFICATION)[number];
export type PreExecutionFindingResolution = (typeof PRE_EXECUTION_FINDING_RESOLUTIONS)[number];
export type PreExecutionReviewerRole = (typeof PRE_EXECUTION_REVIEW_ROLES)[number];
export type PreExecutionParentRole = (typeof PRE_EXECUTION_PARENT_ROLES)[number];
export type PreExecutionAuthorExclusion = (typeof PRE_EXECUTION_AUTHOR_EXCLUSIONS)[number];
export type PreExecutionModelDiversity = (typeof PRE_EXECUTION_MODEL_DIVERSITY)[number];

/**
 * The closed diagnostic vocabulary of this contract family: the package-wide D16
 * codes (so a driver that already routes on them keeps working unchanged) plus the
 * pre-execution refusals no existing code describes. Adding a member is a reviewed,
 * versioned change, and no code ever names a submitted value.
 */
export const PRE_EXECUTION_DIAGNOSTIC_CODES = Object.freeze([
  ...VERIFICATION_DIAGNOSTIC_CODES,
  "missing-artifact-kind",
  "invalid-artifact-set",
  "invalid-selector",
  "invalid-author",
  "invalid-context",
  "invalid-topology",
  "stale-snapshot",
  "stale-policy",
] as const);
export type PreExecutionDiagnosticCode = (typeof PRE_EXECUTION_DIAGNOSTIC_CODES)[number];

/** One refusal row: a frozen code and the pointer to the offending location. */
export interface PreExecutionDiagnostic {
  readonly code: PreExecutionDiagnosticCode;
  /** RFC 6901 pointer over declared property names and decimal indices; `""` is the root. */
  readonly path: string;
}

/**
 * The freshness/authority answers of `comparePreExecutionReceiptToSnapshot`.
 * Exactly one fires per call, in the documented precedence, and the comparison
 * never throws: an input it cannot read is answered with a code.
 */
export const PRE_EXECUTION_FRESHNESS_CODES = Object.freeze([
  "invalid-stage",
  "invalid-unit",
  "stale-policy",
  "stale-context",
  "stale-source-revision",
  "stale-parent",
  "stale-artifact-revision",
  "stale-artifact-content",
  "missing-receipt-snapshot",
] as const);
export type PreExecutionFreshnessCode = (typeof PRE_EXECUTION_FRESHNESS_CODES)[number];

/** The Product-half headings the selector binds, in required order. */
export const SPEC_PRODUCT_REQUIRED_HEADINGS = Object.freeze([
  "Goal",
  "Branch",
  "Size",
  "Dependencies",
  "Product half",
  "Design status",
] as const);

/** One artifact bound into a snapshot, by the exact bytes the reviewer read. */
export interface PreExecutionArtifactRow {
  readonly kind: PreExecutionArtifactKind;
  readonly path: string;
  readonly selector: PreExecutionSelector;
  readonly byteLength: number;
  readonly digest: string;
}

/** One authoritative context: present and bound by digest, or explicitly absent. */
export interface PreExecutionContextBinding {
  readonly kind: PreExecutionContextKind;
  readonly identifier: string;
  readonly presence: PreExecutionContextPresence;
  readonly digest: string | null;
}

/** The exact artifact set one independent reviewer read. */
export interface PreExecutionArtifactSnapshotV1 {
  readonly contract: typeof PRE_EXECUTION_SNAPSHOT_CONTRACT_ID;
  readonly stage: PreExecutionStage;
  readonly unitKind: PreExecutionUnitKind;
  readonly unitId: string;
  readonly sourceRevision: string;
  readonly artifactRevisionId: string;
  readonly artifacts: readonly PreExecutionArtifactRow[];
  readonly contexts: readonly PreExecutionContextBinding[];
  readonly parentSpecSnapshotDigest: string | null;
}

/** One structured review finding. */
export interface PreExecutionFinding {
  readonly id: string;
  readonly severity: PreExecutionFindingSeverity;
  readonly class: PreExecutionFindingClass;
  readonly claim: string;
  readonly evidenceRefs: readonly string[];
  readonly verification: PreExecutionFindingVerification;
  readonly resolution: PreExecutionFindingResolution;
  readonly resolutionEvidence: string | null;
}

/** One optional parent receipt: topology, never a vote. */
export interface PreExecutionParentReceipt {
  readonly role: PreExecutionParentRole;
  readonly receiptDigest: string;
}

/** An independent, content-bound verdict on one pre-execution snapshot. */
export interface PreExecutionReviewReceiptV1 {
  readonly contract: typeof PRE_EXECUTION_RECEIPT_CONTRACT_ID;
  readonly id: string;
  readonly stage: PreExecutionStage;
  readonly snapshotDigest: string;
  readonly verdict: PreExecutionVerdict;
  readonly findings: readonly PreExecutionFinding[];
  readonly reviewer: string;
  readonly sessionId: string;
  readonly reviewerRole: PreExecutionReviewerRole;
  readonly authorId: string;
  readonly authorExclusion: PreExecutionAuthorExclusion;
  readonly contextClean: boolean;
  readonly modelDiversity: PreExecutionModelDiversity;
  readonly policyVersion: string;
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly parentReceipts: readonly PreExecutionParentReceipt[];
  readonly diagnostics: readonly string[];
}

/** Result of a snapshot validation; `snapshot` is present only when `ok`. */
export interface PreExecutionSnapshotValidationResult {
  readonly ok: boolean;
  readonly snapshot?: PreExecutionArtifactSnapshotV1;
  readonly diagnostics: readonly PreExecutionDiagnostic[];
  readonly truncated: boolean;
}

/** Result of a receipt validation; `receipt` is present only when `ok`. */
export interface PreExecutionReceiptValidationResult {
  readonly ok: boolean;
  readonly receipt?: PreExecutionReviewReceiptV1;
  readonly diagnostics: readonly PreExecutionDiagnostic[];
  readonly truncated: boolean;
}

/** Verdict of the freshness comparison. */
export type PreExecutionFreshnessResult =
  | { readonly fresh: true }
  | { readonly fresh: false; readonly reasonCode: PreExecutionFreshnessCode };

// ---------------------------------------------------------------------------
// Shared plumbing: one sink, one capture, one structural engine
// ---------------------------------------------------------------------------

const DIGEST_PATTERN = /^[a-f0-9]{64}$/;

/**
 * The bounded row collector shared by every entry point below.
 *
 * Structural rows come from the package-wide engine sink (which only ever emits
 * the shared D16 codes); the semantic layer adds this family's refusals. One
 * ceiling covers both, so an oversized document can never spend more than
 * `PRE_EXECUTION_LIMITS.diagnostics` allocations, and `truncated` reports the
 * truth across the whole run rather than per stage.
 */
function createCollector(limit: number = PRE_EXECUTION_LIMITS.diagnostics) {
  const rows: PreExecutionDiagnostic[] = [];
  let dropped = 0;
  const add = (code: PreExecutionDiagnosticCode, path: string): void => {
    if (rows.length < limit) rows.push({ code, path });
    else dropped += 1;
  };
  return {
    add,
    /** Fold one engine pass in, keeping the dropped-row count exact. */
    addEngine(sink: VerificationDiagnosticSink): void {
      const total = sink.count();
      const held = sink.finish();
      for (const row of held.diagnostics) add(row.code, row.path);
      dropped += total - held.diagnostics.length;
    },
    failed(): boolean {
      return rows.length + dropped > 0;
    },
    finish(): { diagnostics: readonly PreExecutionDiagnostic[]; truncated: boolean } {
      return {
        diagnostics: Object.freeze(rows.map((row) => Object.freeze({ code: row.code, path: row.path }))),
        truncated: dropped > 0,
      };
    },
  };
}

type PreExecutionCollector = ReturnType<typeof createCollector>;

function refused(collector: PreExecutionCollector) {
  const { diagnostics, truncated } = collector.finish();
  return { ok: false as const, diagnostics, truncated };
}

function accepted<T>(label: "snapshot" | "receipt", value: T) {
  return {
    ok: true as const,
    [label]: value,
    diagnostics: Object.freeze([]) as readonly PreExecutionDiagnostic[],
    truncated: false as const,
  };
}

/**
 * One bounded structural run: capture under the payload budget, then walk the
 * captured snapshot (never the submission), so the budget, the walk, and the
 * semantics below all decide on one document. Returns the normalized DTO or
 * `null` with every refusal row already in the collector.
 */
function structuralRun(
  contract: VerificationContractSpec,
  value: unknown,
  budgetBytes: number,
  collector: PreExecutionCollector,
): Record<string, unknown> | null {
  const captured: VerificationInputCapture = captureVerificationInput(value, budgetBytes);
  if (!captured.ok) {
    collector.add(captured.code, captured.pointer);
    return null;
  }
  if (!captured.measureExact) {
    let canonical: string | null = null;
    try {
      canonical = canonicalJSONValue(captured.value);
    } catch {
      canonical = null; // an unserializable leaf is the walk's `invalid-type` answer
    }
    if (canonical !== null && utf8Bytes(canonical) > budgetBytes) {
      collector.add("limit-exceeded", "");
      return null;
    }
  }
  const sink = createVerificationDiagnosticSink();
  const document = validateStructure(contract, contract.root, captured.value, "", sink);
  collector.addEngine(sink);
  if (sink.count() > 0 || document === undefined) return null;
  return document;
}

// ---------------------------------------------------------------------------
// selectSpecProduct — the deterministic Product projection (D2)
// ---------------------------------------------------------------------------

/** Why a Product projection could not be cut. Names a heading, never a document. */
export interface SpecProductSelectorError {
  readonly code:
    | "selector-title-missing"
    | "selector-heading-missing"
    | "selector-heading-duplicate"
    | "selector-heading-order";
  readonly heading: string;
}

/** The bytes a SPEC-stage snapshot binds, or the one defect that stopped the cut. */
export type SpecProductSelection =
  | { readonly ok: true; readonly content: string; readonly byteLength: number; readonly digest: string }
  | { readonly ok: false; readonly errors: readonly SpecProductSelectorError[] };

const LEVEL_TWO_HEADING = /^## (.*)$/;
const LEVEL_ONE_HEADING = /^# (.*)$/;
const FENCE_LINE = /^ {0,3}(`{3,}|~{3,})/;

function selectionError(code: SpecProductSelectorError["code"], heading: string): SpecProductSelection {
  return { ok: false, errors: Object.freeze([Object.freeze({ code, heading })]) };
}

/**
 * Cut the Product projection out of a SPEC document.
 *
 * The selection is byte-exact and total: the level-1 title and the required
 * level-2 sections (Goal, Branch, Size, Dependencies, Product half, Design
 * status), ending at the first boundary heading after Design status, with trailing
 * blank lines removed and exactly one final newline. Everything the selector does
 * NOT take — Amendments, the Engineering half, later appendices — stays outside
 * Product authority, so a Plan-phase write can never rotate a Product digest and
 * silently erase a recorded review (the property AC2 and S6 test).
 *
 * Determinism rules that make the digest trustworthy:
 *   - line endings normalize to LF first, so a CRLF checkout and an LF editor
 *     select identical bytes;
 *   - fenced blocks are inert: a `## Goal` inside a template is neither a duplicate
 *     heading nor a section boundary, and fenced content still belongs to the
 *     section containing it (under-binding would leave edits unchecked);
 *   - heading text is compared EXACTLY — no trimming, no case folding, no
 *     substring — so `## Goals`, `### Goal` and `## Goal ` all fail closed;
 *   - the FIRST defect in the fixed order title → missing → duplicate → order is
 *     reported alone, because every later position is already suspect.
 *
 * No I/O: the caller supplies the text it read.
 */
export function selectSpecProduct(text: unknown): SpecProductSelection {
  if (typeof text !== "string") return selectionError("selector-title-missing", "<title>");
  const lines = text.replace(/\r\n?/g, "\n").split("\n");

  const headings: { name: string; line: number }[] = [];
  let titleLine = -1;
  let insideFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (FENCE_LINE.test(line)) {
      insideFence = !insideFence;
      continue;
    }
    if (insideFence) continue;
    const two = LEVEL_TWO_HEADING.exec(line);
    if (two !== null) {
      headings.push({ name: two[1], line: i });
      continue;
    }
    if (titleLine === -1) {
      const one = LEVEL_ONE_HEADING.exec(line);
      if (one !== null && one[1].length > 0) titleLine = i;
    }
  }

  if (titleLine === -1) return selectionError("selector-title-missing", "<title>");

  for (const required of SPEC_PRODUCT_REQUIRED_HEADINGS) {
    if (!headings.some((heading) => heading.name === required)) {
      return selectionError("selector-heading-missing", required);
    }
  }

  const seen = new Set<string>();
  for (const heading of headings) {
    if (!(SPEC_PRODUCT_REQUIRED_HEADINGS as readonly string[]).includes(heading.name)) continue;
    if (seen.has(heading.name)) return selectionError("selector-heading-duplicate", heading.name);
    seen.add(heading.name);
  }

  let highest = -1;
  for (const heading of headings) {
    const index = (SPEC_PRODUCT_REQUIRED_HEADINGS as readonly string[]).indexOf(heading.name);
    if (index === -1) continue;
    if (index < highest) return selectionError("selector-heading-order", heading.name);
    highest = index;
  }

  // The projection ends at the first boundary heading (level 1 or 2) after the
  // Design-status section opens — never inside a fence.
  let designLine = -1;
  for (const heading of headings) if (heading.name === "Design status") designLine = heading.line;
  let end = lines.length;
  insideFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (FENCE_LINE.test(lines[i])) {
      insideFence = !insideFence;
      continue;
    }
    if (insideFence || i <= designLine) continue;
    if (LEVEL_TWO_HEADING.test(lines[i]) || LEVEL_ONE_HEADING.test(lines[i])) {
      end = i;
      break;
    }
  }

  const selected = lines.slice(0, end);
  while (selected.length > 0 && selected[selected.length - 1].trim() === "") selected.pop();
  const content = `${selected.join("\n")}\n`;
  return Object.freeze({
    ok: true as const,
    content,
    byteLength: utf8Bytes(content),
    digest: sha256HexSync(content),
  });
}

// ---------------------------------------------------------------------------
// PreExecutionArtifactSnapshot v1 — semantics the projection cannot state
// ---------------------------------------------------------------------------

/** The rows each stage REQUIRES. A fix unit has no Product half (D6). */
const REQUIRED_ARTIFACTS: Readonly<Record<PreExecutionStage, readonly PreExecutionArtifactKind[]>> =
  Object.freeze({ spec: ["spec"], plan: ["spec", "acceptance"] });

function snapshotSemantics(document: Record<string, unknown>, collector: PreExecutionCollector): void {
  const stage = document.stage as PreExecutionStage;
  const rows = document.artifacts as readonly PreExecutionArtifactRow[];
  const contexts = document.contexts as PreExecutionContextBinding[];

  if (stage === "spec" && document.unitKind === "fix") {
    // D6: a fix unit has no Product half to review, so `spec` is not a valid stage
    // for it — the same bytes at the plan stage ARE the fix path.
    collector.add("invalid-value", "/stage");
  }

  const kinds = new Set<string>();
  let previousPath: string | null = null;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const at = `/artifacts/${i}`;
    if (kinds.has(row.kind)) collector.add("duplicate-id", `${at}/kind`);
    kinds.add(row.kind);
    if (previousPath !== null && utf8ByteCompare(previousPath, row.path) >= 0) {
      collector.add("invalid-order", `${at}/path`);
    }
    previousPath = row.path;

    if (stage === "spec") {
      // The SPEC stage binds exactly one row: the Product projection of the SPEC
      // file. Binding the whole file would put the Engineering half — which the
      // plan phase is about to rewrite — under a review that only authorized it.
      if (row.kind !== "spec" || row.selector !== PRE_EXECUTION_SNAPSHOT_SELECTOR) {
        collector.add("invalid-value", `${at}/selector`);
      }
    } else if (row.selector === PRE_EXECUTION_SNAPSHOT_SELECTOR) {
      // A projection is a Product authority; the Plan stage binds whole files.
      collector.add("invalid-value", `${at}/selector`);
    }
  }

  if (stage === "spec" && rows.length !== 1) collector.add("invalid-artifact-set", "/artifacts");
  for (const required of REQUIRED_ARTIFACTS[stage]) {
    if (!kinds.has(required)) collector.add("missing-artifact-kind", "/artifacts");
  }

  const identities = new Set<string>();
  let previousContext: string | null = null;
  for (let i = 0; i < contexts.length; i++) {
    const context = contexts[i];
    const identity = `${context.kind}\u0000${context.identifier}`;
    if (identities.has(identity)) collector.add("duplicate-id", `/contexts/${i}/identifier`);
    identities.add(identity);
    const ordered = `${context.kind}\u0000${context.identifier}`;
    if (previousContext !== null && utf8ByteCompare(previousContext, ordered) >= 0) {
      collector.add("invalid-order", `/contexts/${i}`);
    }
    previousContext = ordered;
  }
}

/**
 * The authoritative snapshot validator (feature 28 AC1).
 *
 * Enforces, in one pass and from the canonical definition: the contract id, the
 * closed stage/unit/artifact/selector/context vocabularies, the exact 40- or
 * 64-hex source revision and 64-hex digest shapes, normalized repository-relative
 * paths, the declared-field-only DTO at every level (prototype and undeclared keys
 * are never contract data), the published cardinality and length ceilings, the
 * payload budget, and the stage matrix Draft-07 cannot express: `spec` binds one
 * Product-projection row and no parent, `plan` binds at least the whole SPEC and
 * ACCEPTANCE and its parent snapshot digest, a fix unit has no `spec` stage, rows
 * are unique per kind and byte-ordered by path, and context identities are unique
 * and byte-ordered.
 *
 * The input domain is JSON documents. A value outside it (a throwing getter, say)
 * is refused as one redacted `invalid-type` row rather than escaping as an
 * exception, and no diagnostic ever carries a submitted value.
 */
export function validatePreExecutionArtifactSnapshotV1(value: unknown): PreExecutionSnapshotValidationResult {
  const collector = createCollector();
  const document = structuralRun(
    PRE_EXECUTION_CONTRACT.snapshot,
    value,
    PRE_EXECUTION_LIMITS.snapshotBytes,
    collector,
  );
  if (document === null) return refused(collector);
  snapshotSemantics(document, collector);
  if (collector.failed()) return refused(collector);
  return accepted("snapshot", document as unknown as PreExecutionArtifactSnapshotV1);
}

/**
 * True when `value` is a valid snapshot. The freshness comparator needs the yes/no
 * answer for two documents per call and never their DTOs, so it uses this instead
 * of copying fields it will not read.
 */
function isValidSnapshot(value: unknown): boolean {
  const collector = createCollector();
  const document = structuralRun(
    PRE_EXECUTION_CONTRACT.snapshot,
    value,
    PRE_EXECUTION_LIMITS.snapshotBytes,
    collector,
  );
  if (document === null) return false;
  snapshotSemantics(document, collector);
  return !collector.failed();
}

// ---------------------------------------------------------------------------
// buildPreExecutionArtifactSnapshot — stage-aware set from caller bytes
// ---------------------------------------------------------------------------

/** One document the reviewer read, as text plus where it came from. */
export interface PreExecutionArtifactInput {
  readonly kind: PreExecutionArtifactKind;
  readonly path: string;
  readonly content: string;
  /**
   * How to select the bound bytes. Defaults to the Product projection for a
   * `spec` row of a SPEC-stage snapshot and to `whole-file` everywhere else.
   */
  readonly selector?: PreExecutionSelector;
}

/**
 * One authoritative context, supplied as the bytes the reviewer read (`content`)
 * or as an explicit absence. Both branches are rows: "there is no governing
 * issue" is a recorded fact, not a skipped field.
 */
export interface PreExecutionContextInput {
  readonly kind: PreExecutionContextKind;
  readonly identifier: string;
  readonly content?: string;
  readonly presence?: PreExecutionContextPresence;
}

/** Input to the artifact-set builder. Every field is caller-owned; nothing is read. */
export interface PreExecutionSnapshotBuildInput {
  readonly stage: PreExecutionStage;
  readonly unitKind: PreExecutionUnitKind;
  readonly unitId: string;
  readonly sourceRevision: string;
  readonly artifactRevisionId: string;
  readonly files: readonly PreExecutionArtifactInput[];
  readonly contexts?: readonly PreExecutionContextInput[];
  readonly parentSpecSnapshotDigest?: string | null;
}

function defaultSelector(
  stage: PreExecutionStage,
  kind: PreExecutionArtifactKind,
): PreExecutionSelector {
  return stage === "spec" && kind === "spec" ? PRE_EXECUTION_SNAPSHOT_SELECTOR : "whole-file";
}

/**
 * Build the canonical artifact set for a stage from bytes the caller supplied.
 *
 * This is the only sanctioned way to produce a snapshot: it derives every digest
 * and `byteLength` from the text it is handed, orders artifact rows by UTF-8 path
 * bytes and context rows by (kind, identifier), defaults the parent binding to
 * `null` at the SPEC stage, and then feeds the result through
 * `validatePreExecutionArtifactSnapshotV1`. That last step is the guarantee: a
 * builder can never return a snapshot its own validator would refuse, and a
 * hand-assembled object is not how a reviewer gets one.
 *
 * A `spec-product-v1` row binds the PROJECTION, so Engineering-half and Amendments
 * writes do not move its digest; a `whole-file` row binds the exact bytes. A
 * rejected selection fails the build with the selector's own reason under
 * `invalid-selector` rather than producing a partial binding.
 */
export function buildPreExecutionArtifactSnapshot(
  input: PreExecutionSnapshotBuildInput,
): PreExecutionSnapshotValidationResult {
  const collector = createCollector();
  if (input === null || typeof input !== "object" || !Array.isArray(input.files)) {
    collector.add("invalid-type", "");
    return refused(collector);
  }

  const stage = input.stage;
  const artifacts: PreExecutionArtifactRow[] = [];
  for (let i = 0; i < input.files.length; i++) {
    const file = input.files[i];
    const at = `/files/${i}`;
    if (file === null || typeof file !== "object") {
      collector.add("invalid-type", at);
      continue;
    }
    if (typeof file.content !== "string") {
      // The builder binds bytes it was given; there is no read behind it.
      collector.add("missing-field", `${at}/content`);
      continue;
    }
    if (typeof file.path !== "string" || file.path.length === 0) {
      collector.add("invalid-value", `${at}/path`);
      continue;
    }
    if (!(PRE_EXECUTION_ARTIFACT_KINDS as readonly string[]).includes(file.kind)) {
      collector.add("invalid-value", `${at}/kind`);
      continue;
    }
    const selector = file.selector ?? defaultSelector(stage, file.kind);
    if (!(PRE_EXECUTION_SELECTORS as readonly string[]).includes(selector)) {
      collector.add("invalid-selector", `${at}/selector`);
      continue;
    }
    let content = file.content;
    if (selector === PRE_EXECUTION_SNAPSHOT_SELECTOR) {
      const selected = selectSpecProduct(content);
      if (!selected.ok) {
        collector.add("invalid-selector", `${at}/content`);
        continue;
      }
      content = selected.content;
    }
    artifacts.push(Object.freeze({
      kind: file.kind,
      path: file.path,
      selector,
      byteLength: utf8Bytes(content),
      digest: sha256HexSync(content),
    }));
  }

  const contexts: PreExecutionContextBinding[] = [];
  const suppliedContexts = input.contexts ?? [];
  if (!Array.isArray(suppliedContexts)) {
    collector.add("invalid-type", "/contexts");
  } else {
    for (let i = 0; i < suppliedContexts.length; i++) {
      const context = suppliedContexts[i];
      const at = `/contexts/${i}`;
      if (context === null || typeof context !== "object") {
        collector.add("invalid-type", at);
        continue;
      }
      if (!(PRE_EXECUTION_CONTEXT_KINDS as readonly string[]).includes(context.kind)) {
        collector.add("invalid-value", `${at}/kind`);
        continue;
      }
      if (typeof context.identifier !== "string" || context.identifier.length === 0) {
        collector.add("invalid-value", `${at}/identifier`);
        continue;
      }
      const hasContent = typeof context.content === "string";
      if (hasContent && context.presence === "absent") {
        // A row cannot claim an authority is missing and bind its bytes at once.
        collector.add("invalid-context", at);
        continue;
      }
      if (!hasContent && context.presence !== "absent") {
        collector.add("missing-field", `${at}/content`);
        continue;
      }
      contexts.push(Object.freeze({
        kind: context.kind,
        identifier: context.identifier,
        presence: hasContent ? "present" : "absent",
        digest: hasContent ? sha256HexSync(context.content as string) : null,
      }));
    }
  }

  if (collector.failed()) return refused(collector);

  artifacts.sort((a, b) => utf8ByteCompare(a.path, b.path));
  contexts.sort((a, b) => utf8ByteCompare(a.kind, b.kind) || utf8ByteCompare(a.identifier, b.identifier));

  return validatePreExecutionArtifactSnapshotV1({
    contract: PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
    stage,
    unitKind: input.unitKind,
    unitId: input.unitId,
    sourceRevision: input.sourceRevision,
    artifactRevisionId: input.artifactRevisionId,
    artifacts,
    contexts,
    parentSpecSnapshotDigest: stage === "spec" ? null : input.parentSpecSnapshotDigest ?? null,
  });
}

// ---------------------------------------------------------------------------
// Canonical form and digests
// ---------------------------------------------------------------------------

/**
 * D6 — canonical serialization of a validated `PreExecutionArtifactSnapshot v1`.
 *
 * Sorted keys, compact separators, declared own-properties only, and the input
 * domain is the JSON data model: an undeclared field, a prototype value, or a leaf
 * no validator would accept (a function, a BigInt, `NaN`) is a named refusal, so a
 * digest can never describe bytes the contract would reject. Artifact and context
 * order is PRESERVED, never re-sorted here: the canonical order is a contract rule
 * the validator enforces, so the serializer stays a pure projection.
 */
export function canonicalizePreExecutionArtifactSnapshot(
  snapshot: PreExecutionArtifactSnapshotV1,
): string {
  return canonicalizeContractInput(snapshot, PRE_EXECUTION_CONTRACT.snapshot, {
    collectionField: "artifacts",
    maxItems: PRE_EXECUTION_LIMITS.artifacts,
    budgetBytes: PRE_EXECUTION_LIMITS.snapshotBytes,
    family: "pre-execution",
    label: "snapshot",
  });
}

/**
 * D6 — canonical serialization of a validated `PreExecutionReviewReceipt v1`.
 *
 * Findings are re-emitted in UTF-8 byte order of their stable ids and parent
 * receipts in byte order of their digests: the ORDER two independent reviewers
 * happened to append them in carries no meaning, so it must not change a digest
 * either. (Artifact and context rows are the opposite case — their order IS a
 * contract rule the validator enforces — so the snapshot serializer preserves it.)
 */
export function canonicalizePreExecutionReviewReceipt(
  receipt: PreExecutionReviewReceiptV1,
): string {
  const findings = Array.isArray(receipt?.findings)
    ? [...receipt.findings].sort((a, b) =>
        utf8ByteCompare(String(a?.id ?? ""), String(b?.id ?? "")))
    : receipt?.findings;
  const parentReceipts = Array.isArray(receipt?.parentReceipts)
    ? [...receipt.parentReceipts].sort((a, b) =>
        utf8ByteCompare(String(a?.receiptDigest ?? ""), String(b?.receiptDigest ?? "")))
    : receipt?.parentReceipts;
  return canonicalizeContractInput(
    { ...receipt, findings, parentReceipts },
    PRE_EXECUTION_CONTRACT.receipt,
    {
      collectionField: "findings",
      maxItems: PRE_EXECUTION_LIMITS.findings,
      budgetBytes: PRE_EXECUTION_LIMITS.receiptBytes,
      family: "pre-execution",
      label: "receipt",
    },
  );
}

/** D6 — digest of a validated snapshot (inherits the canonical-input guards). */
export async function digestPreExecutionArtifactSnapshot(
  snapshot: PreExecutionArtifactSnapshotV1,
): Promise<string> {
  return sha256Hex(canonicalizePreExecutionArtifactSnapshot(snapshot));
}

/** D6 — digest of a validated receipt (inherits the canonical-input guards). */
export async function digestPreExecutionReviewReceipt(
  receipt: PreExecutionReviewReceiptV1,
): Promise<string> {
  return sha256Hex(canonicalizePreExecutionReviewReceipt(receipt));
}

// ---------------------------------------------------------------------------
// PreExecutionReviewReceipt v1 — semantics
// ---------------------------------------------------------------------------

/** A PASS verdict of either stage. Everything else may report freely. */
function isPassVerdict(verdict: PreExecutionVerdict): boolean {
  return verdict === "spec-review-pass" || verdict === "plan-review-pass";
}

/**
 * The receipt rules that run with or without a snapshot in hand: the finding rows
 * whose meaning Draft-07 cannot carry.
 *
 * A finding with no evidence reference is an opinion, so the contract refuses it
 * (`invalid-evidence`); the engine already refuses a duplicate finding id, a
 * reversal of the review window, a timestamp that names a non-existent instant, and
 * a verdict from the wrong stage — the matrix is declared once, in
 * `PRE_EXECUTION_RECEIPT_CONTRACT.rules`, and applied by the shared structural pass.
 */
function receiptSemantics(document: Record<string, unknown>, collector: PreExecutionCollector): void {
  const findings = document.findings as readonly PreExecutionFinding[];
  for (let i = 0; i < findings.length; i++) {
    if (findings[i].evidenceRefs.length === 0) {
      collector.add("invalid-evidence", `/findings/${i}/evidenceRefs`);
    }
  }
}

/**
 * The authoritative receipt validator that does NOT bind a snapshot (feature 28
 * AC1): the contract id, the closed verdict/severity/class/verification/resolution/
 * role vocabularies, the stage/verdict matrix, opaque bounded identities, UTC
 * calendar-valid ordered timestamps, the bounded finding and parent-receipt sets
 * with unique ids, digests, and rows, and the payload budget.
 *
 * It proves a receipt is WELL-FORMED. The parent topology is deliberately not
 * part of that answer — a plain reviewer may record a critique lineage — and
 * cannot prove the claim a PASS makes — that the bound snapshot is the current
 * one and nothing material is still open — so it is never the gate;
 * `validatePreExecutionReceiptAgainstSnapshot` is.
 */
export function validatePreExecutionReviewReceiptV1(value: unknown): PreExecutionReceiptValidationResult {
  const collector = createCollector();
  const document = structuralRun(
    PRE_EXECUTION_CONTRACT.receipt,
    value,
    PRE_EXECUTION_LIMITS.receiptBytes,
    collector,
  );
  if (document === null) return refused(collector);
  receiptSemantics(document, collector);
  if (collector.failed()) return refused(collector);
  return accepted("receipt", document as unknown as PreExecutionReviewReceiptV1);
}

/**
 * The ONLY authority that blesses a pre-execution verdict (feature 28 AC1/AC2).
 *
 * On top of the structural pass it binds the receipt to a snapshot and to the
 * policy it was reviewed under, then enforces what a PASS actually claims:
 *
 *   1. the receipt must bind THIS snapshot — same stage, current `policyVersion`,
 *      and a `snapshotDigest` equal to the digest of the snapshot (`stale-snapshot`
 *      otherwise, so a rotated document cannot be blessed by an older reading);
 *   2. when the runtime can observe authorship, a reviewer cannot be its own author
 *      (`invalid-author`); where it cannot, the receipt says so in
 *      `authorExclusion: "not-enforceable"` and the limit stays visible instead of
 *      being laundered into a PASS;
 *   3. `contextClean` is mandatory for a PASS and never for a FAIL: a contaminated
 *      reviewer may still report what it found;
 *   4. a PASS may not carry a material finding that is still open or unverified
 *      (`verdict-mismatch`) — `info` severity is the only immaterial row.
 *
 * The parent-topology rule (parents require a critic/synthesizer/arbiter role,
 * `invalid-topology`) is part of the canonical definition itself — the shared
 * structural walk enforces it for the standalone validator too, so there is no
 * second, binding-only copy. `modelDiversity` is deliberately absent from this
 * list: it is reported truthfully and never converted into a threshold, because
 * plurality of identical models is not independence. There is no quorum to
 * satisfy, and no numeric approval model to reverse-engineer from a parent list.
 */
export async function validatePreExecutionReceiptAgainstSnapshot(
  receipt: unknown,
  snapshot: unknown,
  policyVersion: string,
): Promise<PreExecutionReceiptValidationResult> {
  const collector = createCollector();
  const document = structuralRun(
    PRE_EXECUTION_CONTRACT.receipt,
    receipt,
    PRE_EXECUTION_LIMITS.receiptBytes,
    collector,
  );
  if (document === null) return refused(collector);
  // The parent topology is a definition rule with `binding` enforcement: the
  // plain structural walk skipped it (a well-formed receipt may record the
  // topology), and THIS authority — the only one that blesses a verdict —
  // applies it here over the same captured document.
  const bindingSink = createVerificationDiagnosticSink();
  for (const rule of PRE_EXECUTION_CONTRACT.receipt.root.rules) {
    if (rule.enforcement === "binding") {
      applyCrossRule(PRE_EXECUTION_CONTRACT.receipt.root, rule, document, "", bindingSink);
    }
  }
  collector.addEngine(bindingSink);
  receiptSemantics(document, collector);
  if (collector.failed()) return refused(collector);

  if (!isValidSnapshot(snapshot)) {
    // Nothing verifiable was reviewed: the binding, not the artifact fields, is
    // what failed, so the answer is one row on the receipt's own pointer.
    collector.add("stale-snapshot", "/snapshotDigest");
    return refused(collector);
  }

  const bound = document as unknown as PreExecutionReviewReceiptV1;
  const reviewed = snapshot as PreExecutionArtifactSnapshotV1;
  if (bound.stage !== reviewed.stage) collector.add("invalid-stage", "/stage");
  if (bound.policyVersion !== policyVersion) collector.add("stale-policy", "/policyVersion");
  else if (await digestPreExecutionArtifactSnapshot(reviewed) !== bound.snapshotDigest) {
    collector.add("stale-snapshot", "/snapshotDigest");
  }

  if (bound.authorExclusion === "enforced" && bound.authorId === bound.reviewer) {
    collector.add("invalid-author", "/authorId");
  }
  if (isPassVerdict(bound.verdict) && !bound.contextClean) {
    collector.add("invalid-context", "/contextClean");
  }
  if (isPassVerdict(bound.verdict)) {
    for (let i = 0; i < bound.findings.length; i++) {
      const finding = bound.findings[i];
      const material = finding.severity !== "info";
      if (material && (finding.resolution === "open" || finding.verification === "unverified")) {
        collector.add("verdict-mismatch", `/findings/${i}`);
      }
    }
  }

  if (collector.failed()) return refused(collector);
  return accepted("receipt", bound);
}

// ---------------------------------------------------------------------------
// Freshness — one deterministic answer per comparison
// ---------------------------------------------------------------------------

const FRESH: PreExecutionFreshnessResult = Object.freeze({ fresh: true } as const);

function stale(reasonCode: PreExecutionFreshnessCode): PreExecutionFreshnessResult {
  return Object.freeze({ fresh: false as const, reasonCode });
}

/**
 * Is the approval recorded in `receipt` still the approval of the CURRENT document?
 *
 * Pure, deterministic, and total: it throws nothing and returns exactly one verdict
 * in this fixed precedence —
 *
 *   1. `missing-receipt-snapshot` — the receipt does not bind the reviewed snapshot
 *      (including a receipt or snapshot it cannot read at all);
 *   2. `invalid-stage` / `invalid-unit` — the two snapshots are not the same review
 *      target, which no content comparison can repair;
 *   3. `stale-policy` — the review policy moved under the approval;
 *   4. `stale-context` — an authority the reviewer relied on changed;
 *   5. `stale-source-revision` — the repository revision the artifacts were read at
 *      changed;
 *   6. `stale-parent` — the Product snapshot a Plan approval descends from changed
 *      (lineage, so a Product rewrite erases the descendant approval);
 *   7. `stale-artifact-content` — a bound artifact's bytes changed;
 *   8. `stale-artifact-revision` — the authoring revision rotated with identical
 *      bytes, which is why content is checked first: a mutate-then-revert with a
 *      rotated `artifactRevisionId` still lands here and an older PASS never
 *      resurrects (S6);
 *   9. otherwise `{ fresh: true }`.
 *
 * Every dimension is reported alone because a caller routes on it: a stale context
 * asks a sensor to re-read, a stale artifact asks the reviewer to re-read, and a
 * rotated revision asks the author for a new review. Collapsing them into "stale"
 * would leave a driver guessing which is why the codes are named per dimension.
 */
export async function comparePreExecutionReceiptToSnapshot(
  receipt: unknown,
  reviewedSnapshot: unknown,
  currentSnapshot: unknown,
  policyVersion: string,
): Promise<PreExecutionFreshnessResult> {
  if (!isValidSnapshot(reviewedSnapshot) || !isValidSnapshot(currentSnapshot)) {
    // The reviewed side cannot be the thing a receipt bound, and an unreadable
    // current document cannot be the thing that was approved; in both cases there
    // is no content comparison to make, so the binding answer comes first.
    return typeof reviewedSnapshot === "object" && reviewedSnapshot !== null
      ? stale("stale-artifact-content")
      : stale("missing-receipt-snapshot");
  }
  const reviewed = reviewedSnapshot as PreExecutionArtifactSnapshotV1;
  const current = currentSnapshot as PreExecutionArtifactSnapshotV1;

  let reviewedDigest: string;
  try {
    reviewedDigest = await digestPreExecutionArtifactSnapshot(reviewed);
  } catch {
    return stale("missing-receipt-snapshot");
  }
  const record = readReceiptBinding(receipt);
  if (record === null || record.snapshotDigest !== reviewedDigest) return stale("missing-receipt-snapshot");

  if (reviewed.stage !== current.stage) return stale("invalid-stage");
  if (reviewed.unitKind !== current.unitKind || reviewed.unitId !== current.unitId) {
    return stale("invalid-unit");
  }
  if (record.policyVersion !== policyVersion) return stale("stale-policy");
  if (!sameContexts(reviewed.contexts, current.contexts)) return stale("stale-context");
  if (reviewed.sourceRevision !== current.sourceRevision) return stale("stale-source-revision");
  if (reviewed.parentSpecSnapshotDigest !== current.parentSpecSnapshotDigest) return stale("stale-parent");
  if (!sameArtifacts(reviewed.artifacts, current.artifacts)) return stale("stale-artifact-content");
  if (reviewed.artifactRevisionId !== current.artifactRevisionId) return stale("stale-artifact-revision");
  return FRESH;
}

/**
 * The two receipt fields the comparison needs, read defensively.
 *
 * A malformed receipt is not an error here: it is a receipt that binds no snapshot,
 * which is exactly `missing-receipt-snapshot`. Field names are the only thing read,
 * and no submitted value is carried out of the answer.
 */
function readReceiptBinding(receipt: unknown): { snapshotDigest: string; policyVersion: string } | null {
  if (receipt === null || typeof receipt !== "object" || Array.isArray(receipt)) return null;
  const candidate = receipt as Record<string, unknown>;
  if (candidate.contract !== PRE_EXECUTION_RECEIPT_CONTRACT_ID) return null;
  if (typeof candidate.snapshotDigest !== "string" || !DIGEST_PATTERN.test(candidate.snapshotDigest)) {
    return null;
  }
  if (typeof candidate.policyVersion !== "string") return null;
  return { snapshotDigest: candidate.snapshotDigest, policyVersion: candidate.policyVersion };
}

function sameArtifacts(
  a: readonly PreExecutionArtifactRow[],
  b: readonly PreExecutionArtifactRow[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];
    if (
      left.kind !== right.kind
      || left.path !== right.path
      || left.selector !== right.selector
      || left.byteLength !== right.byteLength
      || left.digest !== right.digest
    ) {
      return false;
    }
  }
  return true;
}

function sameContexts(
  a: readonly PreExecutionContextBinding[],
  b: readonly PreExecutionContextBinding[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const left = a[i];
    const right = b[i];
    if (
      left.kind !== right.kind
      || left.identifier !== right.identifier
      || left.presence !== right.presence
      || left.digest !== right.digest
    ) {
      return false;
    }
  }
  return true;
}
