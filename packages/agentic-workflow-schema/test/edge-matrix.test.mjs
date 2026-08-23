import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CANDIDATE_SNAPSHOT_CONTRACT_ID,
  REVIEW_RECEIPT_CONTRACT_ID,
  validateCandidateSnapshotV1,
  digestCandidateSnapshot,
  compareReceiptToCurrentSnapshot,
  computeAcceptanceFingerprint,
} from "../dist/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_SHA1 = { algorithm: "sha1", hex: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };
const FP = "0".repeat(64);

function hex(n) {
  // Generate a valid 40-char hex string, offset by n for uniqueness
  return Array(40).fill(0).map((_, i) => "abcdef"[(i + n) % 6]).join("");
}

function makeSnapshot(changedPaths = [], opts = {}) {
  return {
    contract: CANDIDATE_SNAPSHOT_CONTRACT_ID,
    objectFormat: "sha1",
    baseCommit: opts.baseCommit || { ...FAKE_SHA1, hex: hex(0) },
    candidateCommit: opts.candidateCommit || { ...FAKE_SHA1, hex: hex(1) },
    baseTree: opts.baseTree || { ...FAKE_SHA1, hex: hex(2) },
    candidateTree: opts.candidateTree || { ...FAKE_SHA1, hex: hex(2) },
    acceptanceFingerprint: opts.acceptanceFingerprint || FP,
    changedPaths,
  };
}

function makeReceipt(snapshotDigest = "", opts = {}) {
  return {
    contract: REVIEW_RECEIPT_CONTRACT_ID,
    id: opts.id || "rcpt-001",
    candidateSnapshotDigest: snapshotDigest || "d".repeat(64),
    kind: opts.kind || "implementation",
    verdict: opts.verdict || "pass",
    findings: opts.findings || [{ id: "f1", severity: "medium", summary: "issue", refs: [] }],
    reviewer: opts.reviewer || "auto",
    sessionId: opts.sessionId || "sess-1",
    startedAt: opts.startedAt || "2025-01-01T00:00:00Z",
    finishedAt: opts.finishedAt || "2025-01-01T00:00:01Z",
    diagnostics: opts.diagnostics || [],
    policyVersion: opts.policyVersion || "v1",
  };
}

// ---------------------------------------------------------------------------
// > 32 changed paths
// ---------------------------------------------------------------------------

test("validates a snapshot with > 32 changed paths", () => {
  const entries = [];
  for (let i = 0; i < 33; i++) {
    entries.push({
      path: `${String(i).padStart(2, "0")}.txt`,
      status: "added",
      oldPath: null,
      mode: "100644",
      objectSha: { ...FAKE_SHA1, hex: hex(i) },
      sizeBytes: i * 100,
      binary: i > 10,
    });
  }
  const snap = makeSnapshot(entries);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

test("digest and compare work with > 32 paths", async () => {
  const entries = [];
  for (let i = 0; i < 50; i++) {
    entries.push({
      path: `${String(i).padStart(2, "0")}.txt`,
      status: "modified",
      oldPath: null,
      mode: "100644",
      objectSha: { ...FAKE_SHA1, hex: hex(i) },
      sizeBytes: i * 200,
      binary: false,
    });
  }
  const snap = makeSnapshot(entries);
  const digest = await digestCandidateSnapshot(snap);
  assert.equal(digest.length, 64);
});

// ---------------------------------------------------------------------------
// > 4 MiB file
// ---------------------------------------------------------------------------

test("validates a manifest with > 4 MiB file", () => {
  const entry = {
    path: "large.bin",
    status: "added",
    oldPath: null,
    mode: "100644",
    objectSha: { ...FAKE_SHA1, hex: hex(0) },
    sizeBytes: 4 * 1024 * 1024 + 1024, // > 4 MiB
    binary: false,
  };
  const snap = makeSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Binary content
// ---------------------------------------------------------------------------

test("validates binary content in manifest", () => {
  const entry = {
    path: "binary.dat",
    status: "added",
    oldPath: null,
    mode: "100644",
    objectSha: { ...FAKE_SHA1, hex: hex(1) },
    sizeBytes: 1024,
    binary: true,
  };
  const snap = makeSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// renamed / copied / type-changed oldPath rules
// ---------------------------------------------------------------------------

test("validates renamed with oldPath", () => {
  const entry = {
    path: "new-name.txt",
    status: "renamed",
    oldPath: "old-name.txt",
    mode: "100644",
    objectSha: { ...FAKE_SHA1, hex: hex(2) },
    sizeBytes: 512,
    binary: false,
  };
  const snap = makeSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

test("validates copied with oldPath", () => {
  const entry = {
    path: "copy.txt",
    status: "copied",
    oldPath: "original.txt",
    mode: "100644",
    objectSha: { ...FAKE_SHA1, hex: hex(3) },
    sizeBytes: 256,
    binary: false,
  };
  const snap = makeSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

test("validates type-changed with oldPath: null", () => {
  const entry = {
    path: "regular.txt",
    status: "type-changed",
    oldPath: null,
    mode: "100644",
    objectSha: { ...FAKE_SHA1, hex: hex(4) },
    sizeBytes: 100,
    binary: false,
  };
  const snap = makeSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Base advancement → stale
// ---------------------------------------------------------------------------

test("detects base change via digest mismatch (candidate unchanged)", async () => {
  const acceptedFP = await computeAcceptanceFingerprint([]);
  const snap1 = makeSnapshot([], { baseCommit: { ...FAKE_SHA1, hex: hex(0) }, candidateCommit: { ...FAKE_SHA1, hex: hex(1) }, acceptanceFingerprint: acceptedFP });
  const digest1 = await digestCandidateSnapshot(snap1);
  const receipt = makeReceipt(digest1);

  // Base changed
  const snap2 = makeSnapshot([], { baseCommit: { ...FAKE_SHA1, hex: hex(99) }, candidateCommit: { ...FAKE_SHA1, hex: hex(1) }, acceptanceFingerprint: acceptedFP });
  const result = await compareReceiptToCurrentSnapshot(receipt, snap2, [], "v1");
  assert.deepEqual(result, { fresh: false, reasonCode: "stale-base-tree" });
});

// ---------------------------------------------------------------------------
// Candidate mutation → stale
// ---------------------------------------------------------------------------

test("detects candidate change via digest mismatch (base unchanged)", async () => {
  const acceptedFP = await computeAcceptanceFingerprint([]);
  const snap1 = makeSnapshot([], { baseCommit: { ...FAKE_SHA1, hex: hex(0) }, candidateCommit: { ...FAKE_SHA1, hex: hex(1) }, acceptanceFingerprint: acceptedFP });
  const digest1 = await digestCandidateSnapshot(snap1);
  const receipt = makeReceipt(digest1);

  // Candidate changed
  const snap2 = makeSnapshot([], { baseCommit: { ...FAKE_SHA1, hex: hex(0) }, candidateCommit: { ...FAKE_SHA1, hex: hex(99) }, acceptanceFingerprint: acceptedFP });
  const result = await compareReceiptToCurrentSnapshot(receipt, snap2, [], "v1");
  assert.deepEqual(result, { fresh: false, reasonCode: "stale-base-tree" });
});

// ---------------------------------------------------------------------------
// Full revert → stale
// ---------------------------------------------------------------------------

test("detects full revert (candidate reverted to base, manifest changed)", async () => {
  const acceptedFP = await computeAcceptanceFingerprint([]);
  const snap1 = makeSnapshot([{ path: "file.txt", status: "added", oldPath: null, mode: "100644", objectSha: { ...FAKE_SHA1, hex: hex(0) }, sizeBytes: 100, binary: false }], { acceptanceFingerprint: acceptedFP });
  const digest1 = await digestCandidateSnapshot(snap1);
  const receipt = makeReceipt(digest1);

  // Full revert: manifest cleared
  const snap2 = makeSnapshot([], { acceptanceFingerprint: acceptedFP });
  const result = await compareReceiptToCurrentSnapshot(receipt, snap2, [], "v1");
  assert.deepEqual(result, { fresh: false, reasonCode: "stale-base-tree" });
});

// ---------------------------------------------------------------------------
// Symlink / submodule modes
// ---------------------------------------------------------------------------

test("validates symlink mode (120000)", () => {
  const entry = {
    path: "link",
    status: "added",
    oldPath: null,
    mode: "120000",
    objectSha: { ...FAKE_SHA1, hex: hex(0) },
    sizeBytes: null,
    binary: null,
  };
  const snap = makeSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

test("validates submodule mode (160000)", () => {
  const entry = {
    path: "submod",
    status: "added",
    oldPath: null,
    mode: "160000",
    objectSha: { ...FAKE_SHA1, hex: hex(1) },
    sizeBytes: null,
    binary: null,
  };
  const snap = makeSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Empty diff rule
// ---------------------------------------------------------------------------

test("empty diff valid only when trees match", () => {
  const snap = makeSnapshot([], { baseTree: { ...FAKE_SHA1, hex: hex(5) }, candidateTree: { ...FAKE_SHA1, hex: hex(5) } });
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

test("empty diff with different trees is rejected", () => {
  const snap = makeSnapshot([], { baseTree: { ...FAKE_SHA1, hex: hex(6) }, candidateTree: { ...FAKE_SHA1, hex: hex(7) } });
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.toLowerCase().includes("tree")));
});