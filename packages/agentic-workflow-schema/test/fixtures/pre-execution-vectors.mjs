// Feature 28 P1 — shared canonical-vector payloads for the pre-execution contracts.
//
// These are exactly the documents whose digests the published
// `PRE_EXECUTION_CANONICAL_VECTORS` entries lock. They live here so the digest
// tests, the Ajv projection-parity tests, and the authoritative-entry tests all
// consume ONE definition instead of restating payloads — a restated fixture could
// silently disagree with the published vector.
//
// The payloads are LITERAL JSON documents, not builder output: a digest locked
// against a document the builder produced would also drift the moment the builder
// changed, which is exactly the signal these vectors exist to emit. The set is
// self-consistent: the Plan snapshot binds the SPEC snapshot's real digest, and
// each receipt binds its own stage's snapshot, so the four entries demonstrate the
// lineage they are named after rather than being four unrelated blobs.
//
// `PRE_EXECUTION_VECTORS.limits` is the same published ceiling object the runtime
// enforces; the projection test reads it so a limit cannot be renamed in one place
// and quietly left out of the other.
import {
  PRE_EXECUTION_LIMITS,
  PRE_EXECUTION_RECEIPT_CONTRACT_ID,
  PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
  digestPreExecutionArtifactSnapshot,
  digestPreExecutionReviewReceipt,
} from "../../dist/index.js";

const SNAPSHOT_SPEC_DESCRIPTION =
  "SPEC-stage snapshot binding one Product projection and one governing issue";
const SNAPSHOT_PLAN_DESCRIPTION =
  "Plan-stage snapshot bound to a Product parent with SPEC, ACCEPTANCE, and TASKS rows";
const RECEIPT_SPEC_DESCRIPTION =
  "SPEC-stage review receipt with a clean PASS and no findings";
const RECEIPT_PLAN_DESCRIPTION =
  "Plan-stage arbiter receipt carrying two findings and one critic parent digest";

/** Row digests are declared bindings: the package never reads a file to check them. */
const SPEC_PROJECTION_DIGEST = "9f2c4b0a7d1e5f36a8c0d2e4f6081a2b3c4d5e6f708192a3b4c5d6e7f8091a2b";
const ACCEPTANCE_DIGEST = "5e1f0a9b8c7d6e5f4031223344556677889900aabbccddeeff00112233445566";
const TASKS_DIGEST = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
const PLAN_PARENT_RECEIPT_DIGEST = "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
const SOURCE_REVISION = "0123456789abcdef0123456789abcdef01234567";
const UNIT_ID = "28-evidence-grounded-spec-plan-review";
const POLICY_VERSION = "2026-08-30";

const specSnapshotValue = {
  contract: PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
  stage: "spec",
  unitKind: "feature",
  unitId: UNIT_ID,
  sourceRevision: SOURCE_REVISION,
  artifactRevisionId: "rev-0001",
  artifacts: [
    Object.freeze({
      kind: "spec",
      path: `docs/features/${UNIT_ID}/SPEC.md`,
      selector: "spec-product-v1",
      byteLength: 4211,
      digest: SPEC_PROJECTION_DIGEST,
    }),
  ],
  contexts: [
    Object.freeze({
      kind: "governing-issue",
      identifier: "#146",
      presence: "present",
      digest: ACCEPTANCE_DIGEST,
    }),
  ],
  parentSpecSnapshotDigest: null,
};

const planSnapshotValue = {
  contract: PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
  stage: "plan",
  unitKind: "feature",
  unitId: UNIT_ID,
  sourceRevision: SOURCE_REVISION,
  artifactRevisionId: "rev-0002",
  artifacts: [
    Object.freeze({
      kind: "acceptance",
      path: `docs/features/${UNIT_ID}/ACCEPTANCE.md`,
      selector: "whole-file",
      byteLength: 1512,
      digest: ACCEPTANCE_DIGEST,
    }),
    Object.freeze({
      kind: "spec",
      path: `docs/features/${UNIT_ID}/SPEC.md`,
      selector: "whole-file",
      byteLength: 12890,
      digest: SPEC_PROJECTION_DIGEST,
    }),
    Object.freeze({
      kind: "tasks",
      path: `docs/features/${UNIT_ID}/TASKS.md`,
      selector: "whole-file",
      byteLength: 6033,
      digest: TASKS_DIGEST,
    }),
  ],
  contexts: [],
  parentSpecSnapshotDigest: null, // replaced with the real Product digest below
};

const specReceiptValue = {
  contract: PRE_EXECUTION_RECEIPT_CONTRACT_ID,
  id: "spec-review-0001",
  stage: "spec",
  snapshotDigest: null, // replaced with the real Product snapshot digest below
  verdict: "spec-review-pass",
  findings: [],
  reviewer: "reviewer-independent-1",
  sessionId: "session-spec-review-1",
  reviewerRole: "reviewer",
  authorId: "author-planner-1",
  authorExclusion: "enforced",
  contextClean: true,
  modelDiversity: "cross-model",
  policyVersion: POLICY_VERSION,
  startedAt: "2026-08-30T09:00:00Z",
  finishedAt: "2026-08-30T09:12:00Z",
  parentReceipts: [],
  diagnostics: [],
};

/**
 * The Plan vector is deliberately not a tidy document: findings are declared in
 * descending-id order and the parent list is unsorted, so the locked digest is a
 * regression test for the canonical ordering (findings by id, parents by digest)
 * and not merely for the field projection.
 */
const planReceiptValue = {
  contract: PRE_EXECUTION_RECEIPT_CONTRACT_ID,
  id: "plan-review-0002",
  stage: "plan",
  snapshotDigest: null, // replaced with the real Plan snapshot digest below
  verdict: "plan-review-pass",
  findings: [
    Object.freeze({
      id: "F-2",
      severity: "medium",
      class: "plan",
      claim: "P4 does not name the gate that proves second-cycle convergence.",
      evidenceRefs: [`docs/features/${UNIT_ID}/TASKS.md:118`],
      verification: "verified",
      resolution: "resolved",
      resolutionEvidence: "TASKS P4 Done-when now binds the convergence fixture.",
    }),
    Object.freeze({
      id: "F-1",
      severity: "info",
      class: "source",
      claim: "The roadmap row and the SPEC agree on dependency ids.",
      evidenceRefs: ["docs/features/ROADMAP.md:28"],
      verification: "verified",
      resolution: "resolved",
      resolutionEvidence: "Re-read at rev-0002; no change.",
    }),
  ],
  reviewer: "reviewer-independent-2",
  sessionId: "session-plan-review-2",
  reviewerRole: "arbiter",
  authorId: "author-planner-1",
  authorExclusion: "enforced",
  contextClean: true,
  modelDiversity: "same-model",
  policyVersion: POLICY_VERSION,
  startedAt: "2026-08-30T10:00:00Z",
  finishedAt: "2026-08-30T10:18:00Z",
  // Replaced with the real digest of the SPEC receipt below: the parent list is a
  // lineage record, so it must name a receipt that exists in this set.
  parentReceipts: [
    { role: "critic", receiptDigest: PLAN_PARENT_RECEIPT_DIGEST },
  ],
  diagnostics: ["critic pass recorded before arbitration"],
};

// ESM is strict, so the binding fields are filled before anything is frozen: a
// frozen literal could not carry the real digests at all.
const specSnapshotDigest = await digestPreExecutionArtifactSnapshot(specSnapshotValue);
planSnapshotValue.parentSpecSnapshotDigest = specSnapshotDigest;
const planSnapshotDigest = await digestPreExecutionArtifactSnapshot(planSnapshotValue);
specReceiptValue.snapshotDigest = specSnapshotDigest;
const specReceiptDigest = await digestPreExecutionReviewReceipt(specReceiptValue);
planReceiptValue.snapshotDigest = planSnapshotDigest;
planReceiptValue.parentReceipts[0].receiptDigest = specReceiptDigest;

Object.freeze(specSnapshotValue);
Object.freeze(planSnapshotValue);
Object.freeze(specReceiptValue);
Object.freeze(planReceiptValue);

/** description → `{ contract, value }`, keyed exactly as the published vectors name it. */
const vectors = Object.freeze({
  [SNAPSHOT_SPEC_DESCRIPTION]: Object.freeze({
    contract: PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
    value: specSnapshotValue,
  }),
  [SNAPSHOT_PLAN_DESCRIPTION]: Object.freeze({
    contract: PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
    value: planSnapshotValue,
  }),
  [RECEIPT_SPEC_DESCRIPTION]: Object.freeze({
    contract: PRE_EXECUTION_RECEIPT_CONTRACT_ID,
    value: specReceiptValue,
  }),
  [RECEIPT_PLAN_DESCRIPTION]: Object.freeze({
    contract: PRE_EXECUTION_RECEIPT_CONTRACT_ID,
    value: planReceiptValue,
  }),
});

export default vectors;

/** The vectors plus the published limits they were cut against. */
export const PRE_EXECUTION_VECTORS = Object.freeze({
  ...vectors,
  limits: PRE_EXECUTION_LIMITS,
  digests: Object.freeze({
    specSnapshot: specSnapshotDigest,
    planSnapshot: planSnapshotDigest,
    specReceipt: specReceiptDigest,
  }),
});

export {
  SNAPSHOT_SPEC_DESCRIPTION,
  SNAPSHOT_PLAN_DESCRIPTION,
  RECEIPT_SPEC_DESCRIPTION,
  RECEIPT_PLAN_DESCRIPTION,
};
