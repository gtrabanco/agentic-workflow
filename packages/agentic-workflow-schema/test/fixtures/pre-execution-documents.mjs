// Feature 28 P1 — shared pre-execution fixtures.
//
// These builders live here, NOT in a test file: `node --test` runs every
// `test/*.test.mjs` in its own process, and a test file that imported another test
// file for a helper would execute the imported suite a second time inside the
// importer. One fixture module keeps the documents single-sourced and the run
// counts honest.
//
// `toySpec()` is the smallest SPEC whose Product half the selector accepts, so a
// test that means "a Product edit happened" can express it by changing one heading
// instead of hand-computing a digest.
import {
  PRE_EXECUTION_RECEIPT_CONTRACT_ID,
  PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
  buildPreExecutionArtifactSnapshot,
} from "../../dist/index.js";

export const DIGEST_A = "a".repeat(64);
export const DIGEST_B = "b".repeat(64);
export const PARENT = "c".repeat(64);
export const SHA1 = "0123456789abcdef0123456789abcdef01234567";
export const SHA256 = "f".repeat(64);
export const UNIT_ID = "28-evidence-grounded-spec-plan-review";
export const POLICY_VERSION = "2026-08-30";

/**
 * The smallest SPEC text whose Product half is complete.
 *
 * An override of `undefined` removes the section (that is how a test expresses a
 * missing heading); any other override replaces its body verbatim.
 */
export function toySpec(overrides = {}) {
  const parts = {
    title: "# Toy feature",
    Goal: "## Goal\n\nShip the thing.\n",
    Branch: "## Branch\n\n`feat/toy`\n",
    Size: "## Size\n\n`S` — small.\n",
    Dependencies: "## Dependencies\n\n- none\n",
    "Product half": "## Product half\n\n### Scope\n\n- **S1:** the thing.\n",
    "Design status": "## Design status\n\n`designed`\n",
  };
  let text = "";
  for (const [heading, body] of Object.entries({ ...parts, ...overrides })) {
    if (body === undefined) continue;
    if (heading === "title") {
      text = `${body}\n\n`;
      continue;
    }
    text += `${body}\n`;
  }
  return text;
}

/** Minimal valid SPEC-stage snapshot: one Product projection row, no contexts. */
export function specSnapshot(overrides = {}) {
  return {
    contract: PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
    stage: "spec",
    unitKind: "feature",
    unitId: UNIT_ID,
    sourceRevision: SHA1,
    artifactRevisionId: "rev-0001",
    artifacts: [
      {
        kind: "spec",
        path: `docs/features/${UNIT_ID}/SPEC.md`,
        selector: "spec-product-v1",
        byteLength: 2048,
        digest: DIGEST_A,
      },
    ],
    contexts: [],
    parentSpecSnapshotDigest: null,
    ...overrides,
  };
}

/** Minimal valid Plan-stage snapshot bound to a Product parent. */
export function planSnapshot(overrides = {}) {
  return specSnapshot({
    stage: "plan",
    parentSpecSnapshotDigest: DIGEST_A,
    // ACCEPTANCE.md sorts before SPEC.md in UTF-8 byte order: the canonical order
    // a snapshot must already be in.
    artifacts: [
      {
        kind: "acceptance",
        path: `docs/features/${UNIT_ID}/ACCEPTANCE.md`,
        selector: "whole-file",
        byteLength: 1024,
        digest: DIGEST_B,
      },
      {
        kind: "spec",
        path: `docs/features/${UNIT_ID}/SPEC.md`,
        selector: "whole-file",
        byteLength: 4096,
        digest: DIGEST_A,
      },
    ],
    ...overrides,
  });
}

/** The exact Product snapshot bytes a receipt binds, built from real text. */
export function boundSpec(overrides = {}) {
  return buildPreExecutionArtifactSnapshot({
    stage: "spec",
    unitKind: "feature",
    unitId: UNIT_ID,
    sourceRevision: SHA1,
    artifactRevisionId: "rev-0001",
    files: [
      { kind: "spec", path: `docs/features/${UNIT_ID}/SPEC.md`, content: toySpec() },
    ],
    contexts: [],
    ...overrides,
  });
}

/**
 * A structurally valid SPEC receipt.
 *
 * The first argument is the snapshot the receipt is meant to bind; it is ignored
 * on purpose — a test that wants a real binding computes the digest and passes it
 * through `overrides.snapshotDigest`, which is exactly how a wrong binding is
 * produced on purpose.
 */
export function receiptFor(_snapshot, overrides = {}) {
  return {
    contract: PRE_EXECUTION_RECEIPT_CONTRACT_ID,
    id: "review-0001",
    stage: "spec",
    snapshotDigest: DIGEST_A,
    verdict: "spec-review-pass",
    findings: [],
    reviewer: "reviewer-opaque-1",
    sessionId: "session-opaque-1",
    reviewerRole: "reviewer",
    authorId: "author-opaque-1",
    authorExclusion: "enforced",
    contextClean: true,
    modelDiversity: "cross-model",
    policyVersion: POLICY_VERSION,
    startedAt: "2026-08-30T00:00:00Z",
    finishedAt: "2026-08-30T00:05:00Z",
    parentReceipts: [],
    diagnostics: [],
    ...overrides,
  };
}

/** One finding row, overridable so each test states only what it varies. */
export function finding(overrides = {}) {
  return {
    id: "F-1",
    severity: "high",
    class: "product",
    claim: "The SPEC never names the failure state for a stale receipt.",
    evidenceRefs: [`docs/features/${UNIT_ID}/SPEC.md:412`],
    verification: "verified",
    resolution: "open",
    resolutionEvidence: null,
    ...overrides,
  };
}

/**
 * A SPEC-stage snapshot built from real text (the freshness comparator needs two
 * snapshots whose digests the implementation produced, not hand-written hex).
 */
export function specInput(overrides = {}) {
  return {
    stage: "spec",
    unitKind: "feature",
    unitId: "toy",
    sourceRevision: SHA1,
    artifactRevisionId: "rev-1",
    files: [{ kind: "spec", path: "docs/toy/SPEC.md", content: toySpec() }],
    contexts: [{ kind: "governing-issue", identifier: "#146", content: "issue body" }],
    ...overrides,
  };
}

/** The Plan-stage twin of `specInput`, bound to `parentSpecSnapshotDigest`. */
export function planInput(parentSpecSnapshotDigest = PARENT, overrides = {}) {
  return {
    stage: "plan",
    unitKind: "feature",
    unitId: "toy",
    sourceRevision: SHA1,
    artifactRevisionId: "rev-1",
    parentSpecSnapshotDigest,
    files: [
      { kind: "spec", path: "docs/toy/SPEC.md", content: toySpec() },
      { kind: "acceptance", path: "docs/toy/ACCEPTANCE.md", content: "# Acceptance\n" },
      { kind: "planning-evidence", path: "docs/toy/planning-evidence.md", content: "# Evidence\n" },
    ],
    contexts: [],
    ...overrides,
  };
}
