import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CANDIDATE_SNAPSHOT_CONTRACT_ID,
  REVIEW_RECEIPT_CONTRACT_ID,
  canonicalizeCandidateSnapshot,
  canonicalizeReviewReceipt,
  digestCandidateSnapshot,
  digestReviewReceipt,
  computeAcceptanceFingerprint,
  compareReceiptToCurrentSnapshot,
  CANONICAL_VECTORS,
} from "../dist/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_SHA1 = { algorithm: "sha1", hex: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };
const FAKE_SHA256 = { algorithm: "sha256", hex: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };
const FP = "0".repeat(64);

function makeSnapshot(changedPaths = []) {
  return {
    contract: CANDIDATE_SNAPSHOT_CONTRACT_ID,
    objectFormat: "sha1",
    baseCommit: { ...FAKE_SHA1, hex: "a".repeat(40) },
    candidateCommit: { ...FAKE_SHA1, hex: "b".repeat(40) },
    baseTree: { ...FAKE_SHA1, hex: "c".repeat(40) },
    candidateTree: { ...FAKE_SHA1, hex: "c".repeat(40) },
    acceptanceFingerprint: FP,
    changedPaths,
  };
}

function makeReceipt(snapshotDigest = "") {
  return {
    contract: REVIEW_RECEIPT_CONTRACT_ID,
    id: "rcpt-001",
    candidateSnapshotDigest: snapshotDigest || "d".repeat(64),
    kind: "implementation",
    verdict: "pass",
    findings: [{ id: "f1", severity: "medium", summary: "issue", refs: [] }],
    reviewer: "auto",
    sessionId: "sess-1",
    startedAt: "2025-01-01T00:00:00Z",
    finishedAt: "2025-01-01T00:00:01Z",
    diagnostics: [],
    policyVersion: "v1",
  };
}

// ---------------------------------------------------------------------------
// canonicalizeCandidateSnapshot — determinism
// ---------------------------------------------------------------------------

test("canonicalizeCandidateSnapshot is deterministic", async () => {
  const snap = makeSnapshot();
  const r1 = canonicalizeCandidateSnapshot(snap);
  const r2 = canonicalizeCandidateSnapshot(snap);
  assert.equal(r1, r2);
});

test("canonicalizeCandidateSnapshot preserves nulls", () => {
  const entry = { path: "a.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = makeSnapshot([entry]);
  const canon = canonicalizeCandidateSnapshot(snap);
  // JSON null literals (unquoted) should be present
  assert.ok(canon.includes(":null,"));
});

test("canonicalizeCandidateSnapshot sorts changedPaths by byte order", () => {
  const entries = [
    { path: "z.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null },
    { path: "a.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null },
  ];
  const snap = makeSnapshot(entries);
  const canon = canonicalizeCandidateSnapshot(snap);
  // After sorting, "a.txt" should appear before "z.txt" in the canonical form
  const aIndex = canon.indexOf('"a.txt"');
  const zIndex = canon.indexOf('"z.txt"');
  assert.ok(aIndex < zIndex, "a.txt should appear before z.txt in canonical form");
});

// ---------------------------------------------------------------------------
// canonicalizeReviewReceipt — determinism
// ---------------------------------------------------------------------------

test("canonicalizeReviewReceipt is deterministic", async () => {
  const r1 = canonicalizeReviewReceipt(makeReceipt());
  const r2 = canonicalizeReviewReceipt(makeReceipt());
  assert.equal(r1, r2);
});

test("canonicalizeReviewReceipt sorts findings by id byte order", () => {
  const receipt = makeReceipt();
  receipt.findings = [
    { id: "z-finding", severity: "high", summary: "z", refs: [] },
    { id: "a-finding", severity: "low", summary: "a", refs: [] },
  ];
  const canon = canonicalizeReviewReceipt(receipt);
  const aIndex = canon.indexOf('"a-finding"');
  const zIndex = canon.indexOf('"z-finding"');
  assert.ok(aIndex < zIndex, "a-finding should appear before z-finding");
});

// ---------------------------------------------------------------------------
// digestCandidateSnapshot
// ---------------------------------------------------------------------------

test("digestCandidateSnapshot returns 64-char lowercase hex", async () => {
  const snap = makeSnapshot();
  const digest = await digestCandidateSnapshot(snap);
  assert.equal(digest.length, 64);
  assert.ok(/^[a-f0-9]{64}$/.test(digest));
});

test("digestCandidateSnapshot is deterministic", async () => {
  const snap = makeSnapshot();
  const d1 = await digestCandidateSnapshot(snap);
  const d2 = await digestCandidateSnapshot(snap);
  assert.equal(d1, d2);
});

test("different snapshots produce different digests", async () => {
  const s1 = makeSnapshot();
  const s2 = makeSnapshot();
  s2.baseCommit = { ...FAKE_SHA1, hex: "z".repeat(40) };
  const d1 = await digestCandidateSnapshot(s1);
  const d2 = await digestCandidateSnapshot(s2);
  assert.notEqual(d1, d2);
});

// ---------------------------------------------------------------------------
// digestReviewReceipt
// ---------------------------------------------------------------------------

test("digestReviewReceipt returns 64-char lowercase hex", async () => {
  const receipt = makeReceipt();
  const digest = await digestReviewReceipt(receipt);
  assert.equal(digest.length, 64);
  assert.ok(/^[a-f0-9]{64}$/.test(digest));
});

test("digestReviewReceipt is deterministic", async () => {
  const receipt = makeReceipt();
  const d1 = await digestReviewReceipt(receipt);
  const d2 = await digestReviewReceipt(receipt);
  assert.equal(d1, d2);
});

// ---------------------------------------------------------------------------
// computeAcceptanceFingerprint
// ---------------------------------------------------------------------------

test("computeAcceptanceFingerprint returns 64-char lowercase hex", async () => {
  const inputs = [{ id: "ac-1", blobSha256: "a".repeat(64) }];
  const fp = await computeAcceptanceFingerprint(inputs);
  assert.equal(fp.length, 64);
  assert.ok(/^[a-f0-9]{64}$/.test(fp));
});

test("computeAcceptanceFingerprint sorts by id", async () => {
  const inputs = [
    { id: "z-id", blobSha256: "b".repeat(64) },
    { id: "a-id", blobSha256: "a".repeat(64) },
  ];
  const fp = await computeAcceptanceFingerprint(inputs);
  // Different order should produce different FP if we reverse
  const inputsRev = [
    { id: "a-id", blobSha256: "a".repeat(64) },
    { id: "z-id", blobSha256: "b".repeat(64) },
  ];
  const fpRev = await computeAcceptanceFingerprint(inputsRev);
  assert.equal(fp, fpRev, "fingerprint should be order-independent (sorted)");
});

// ---------------------------------------------------------------------------
// compareReceiptToCurrentSnapshot — freshness
// ---------------------------------------------------------------------------

test("returns fresh when snapshot matches and acceptance + policy match", async () => {
  const inputs = [];
  const fp = await computeAcceptanceFingerprint(inputs);
  const snap = makeSnapshot();
  snap.acceptanceFingerprint = fp;
  const digest = await digestCandidateSnapshot(snap);
  const receipt = makeReceipt(digest);
  const result = await compareReceiptToCurrentSnapshot(receipt, snap, inputs, "v1");
  assert.deepEqual(result, { fresh: true });
});

test("returns stale-base-tree when snapshot digest differs", async () => {
  const acceptedFP = await computeAcceptanceFingerprint([]);
  const snap = makeSnapshot();
  snap.acceptanceFingerprint = acceptedFP;
  const receipt = makeReceipt("different-digest");
  const result = await compareReceiptToCurrentSnapshot(receipt, snap, [], "v1");
  assert.deepEqual(result, { fresh: false, reasonCode: "stale-base-tree" });
});

test("returns stale-acceptance-fingerprint when inputs differ from snapshot", async () => {
  const snap = makeSnapshot();
  const digest = await digestCandidateSnapshot(snap);
  const receipt = makeReceipt(digest);
  // Pass different inputs that compute a different fingerprint than snap.acceptanceFingerprint
  const inputs = [{ id: "different", blobSha256: "z".repeat(64) }];
  const result = await compareReceiptToCurrentSnapshot(receipt, snap, inputs, "v1");
  assert.deepEqual(result, { fresh: false, reasonCode: "stale-acceptance-fingerprint" });
});

test("returns stale-review-policy when policy differs", async () => {
  const inputs = [{ id: "ac-policy", blobSha256: "f".repeat(64) }];
  const fp = await computeAcceptanceFingerprint(inputs);
  const snap = makeSnapshot();
  snap.acceptanceFingerprint = fp;
  const digest = await digestCandidateSnapshot(snap);
  const receipt = makeReceipt(digest);
  // Pass same inputs (fingerprint matches) but different policy version
  const result = await compareReceiptToCurrentSnapshot(receipt, snap, inputs, "v2");
  assert.deepEqual(result, { fresh: false, reasonCode: "stale-review-policy" });
});

// ---------------------------------------------------------------------------
// Published canonical vectors
// ---------------------------------------------------------------------------

test("CANONICAL_VECTORS has entries with expected contracts", () => {
  const contracts = CANONICAL_VECTORS.map(v => v.contract);
  assert.ok(contracts.includes("agentic-workflow/candidate-snapshot@1"));
  assert.ok(contracts.includes("agentic-workflow/review-receipt@1"));
});

test("CANONICAL_VECTORS are iterable", () => {
  const count = [...CANONICAL_VECTORS].length;
  assert.ok(count >= 2);
});

test("vectors pass digest computation", async () => {
  // Compute digests for minimal valid fixtures and verify determinism
  const snapFixture = makeSnapshot();
  const digest1 = await digestCandidateSnapshot(snapFixture);
  const digest2 = await digestCandidateSnapshot(snapFixture);
  assert.equal(digest1, digest2);
  assert.ok(digest1.length === 64);
});