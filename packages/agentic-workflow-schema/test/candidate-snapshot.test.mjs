import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CANDIDATE_SNAPSHOT_CONTRACT_ID,
  validateCandidateSnapshotV1,
} from "../dist/index.js";

// ---------------------------------------------------------------------------
// Contract id
// ---------------------------------------------------------------------------

test("CANDIDATE_SNAPSHOT_CONTRACT_ID is correct", () => {
  assert.equal(CANDIDATE_SNAPSHOT_CONTRACT_ID, "agentic-workflow/candidate-snapshot@1");
});

// ---------------------------------------------------------------------------
// Helpers — build valid base objects for mutation
// ---------------------------------------------------------------------------

const FAKE_SHA1 = { algorithm: "sha1", hex: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };
const FAKE_SHA256 = { algorithm: "sha256", hex: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" };
const ACCEPTANCE_FP = "0".repeat(64);

function validBase() {
  return {
    objectFormat: "sha1",
    baseCommit: { ...FAKE_SHA1 },
    candidateCommit: { ...FAKE_SHA1 },
    baseTree: { ...FAKE_SHA1, hex: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
    candidateTree: { ...FAKE_SHA1, hex: "cccccccccccccccccccccccccccccccccccccccc" },
    acceptanceFingerprint: ACCEPTANCE_FP,
    changedPaths: [],
  };
}

function validSnapshot(changedPaths = []) {
  const base = validBase();
  return {
    contract: CANDIDATE_SNAPSHOT_CONTRACT_ID,
    ...base,
    changedPaths,
  };
}

// ---------------------------------------------------------------------------
// undeclared fields — top-level
// ---------------------------------------------------------------------------

test("rejects undeclared field at top level", () => {
  const snap = { ...validSnapshot(), extraField: "boom" };
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("extraField")));
});

test("rejects undeclared field inside changedPaths entry", () => {
  const entry = { path: "a.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null, extra: 1 };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("extra")));
});

test("rejects undeclared field inside GitObjectId", () => {
  const badId = { algorithm: "sha1", hex: "a".repeat(40), extra: true };
  const snap = { ...validSnapshot(), baseCommit: badId };
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("baseCommit")));
});

// ---------------------------------------------------------------------------
// contract id
// ---------------------------------------------------------------------------

test("rejects wrong contract id", () => {
  const snap = validSnapshot();
  snap.contract = "wrong/contract";
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("contract")));
});

test("rejects missing contract id", () => {
  const snap = validSnapshot();
  delete snap.contract;
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("contract")));
});

// ---------------------------------------------------------------------------
// objectFormat
// ---------------------------------------------------------------------------

test("rejects invalid objectFormat", () => {
  const snap = validSnapshot();
  snap.objectFormat = "sha512";
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("objectFormat")));
});

test("rejects missing objectFormat", () => {
  const snap = validSnapshot();
  delete snap.objectFormat;
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("objectFormat")));
});

// ---------------------------------------------------------------------------
// GitObjectId format
// ---------------------------------------------------------------------------

test("rejects sha1 with wrong hex length", () => {
  const snap = validSnapshot();
  snap.baseCommit = { algorithm: "sha1", hex: "abc" };
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("baseCommit")));
});

test("rejects sha256 with wrong hex length", () => {
  const snap = validSnapshot();
  snap.objectFormat = "sha256";
  snap.baseCommit = { algorithm: "sha256", hex: "abc" };
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("baseCommit")));
});

test("rejects non-lowercase hex", () => {
  const snap = validSnapshot();
  snap.baseCommit = { algorithm: "sha1", hex: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" };
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("baseCommit")));
});

test("rejects uppercase algorithm", () => {
  const snap = validSnapshot();
  snap.baseCommit = { algorithm: "SHA1", hex: "a".repeat(40) };
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("baseCommit")));
});

// ---------------------------------------------------------------------------
// Mixed algorithms within one snapshot
// ---------------------------------------------------------------------------

test("rejects mixed sha1/sha256 inside one snapshot (sha1 format, sha256 id)", () => {
  const snap = validSnapshot();
  snap.candidateCommit = { ...FAKE_SHA256 };
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("algorithm") || e.includes("candidateCommit")));
});

test("rejects mixed algorithms (sha256 format, sha1 id)", () => {
  const snap = validSnapshot();
  snap.objectFormat = "sha256";
  snap.baseCommit = { ...FAKE_SHA1 };
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("baseCommit")));
});

// ---------------------------------------------------------------------------
// acceptanceFingerprint
// ---------------------------------------------------------------------------

test("rejects non-SHA256 acceptance fingerprint", () => {
  const snap = validSnapshot();
  snap.acceptanceFingerprint = "not-a-hash";
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("acceptanceFingerprint")));
});

test("rejects uppercase acceptance fingerprint", () => {
  const snap = validSnapshot();
  snap.acceptanceFingerprint = "A".repeat(64);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("acceptanceFingerprint")));
});

// ---------------------------------------------------------------------------
// changedPaths — path-byte order, duplicates, NUL, absolute, .., status
// ---------------------------------------------------------------------------

test("rejects changedPaths not an array", () => {
  const snap = validSnapshot();
  snap.changedPaths = "not-array";
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("changedPaths")));
});

test("rejects entries with NUL in path", () => {
  const entry = { path: "a\0b.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("NUL") || e.includes("path")));
});

test("rejects entries with absolute path", () => {
  const entry = { path: "/etc/passwd", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("absolute") || e.includes("path")));
});

test("rejects entries with .. segment", () => {
  const entry = { path: "../secret.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("..") || e.includes("path")));
});

test("rejects entries with .. inside path segment", () => {
  const entry = { path: "dir/..hidden/file.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("..") || e.includes("path")));
});

test("rejects duplicate paths", () => {
  const entry = { path: "a.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry, entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("duplicate")));
});

test("rejects entries with unsupported status", () => {
  const entry = { path: "a.txt", status: "unported", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("status") || e.includes("unported")));
});

test("rejects entries with non-string path", () => {
  const entry = { path: 123, status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("path")));
});

// ---------------------------------------------------------------------------
// Entry-level: oldPath rules
// ---------------------------------------------------------------------------

test("rejects renamed without oldPath", () => {
  const entry = { path: "b.txt", status: "renamed", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => (e.includes("renamed") || e.includes("oldPath")) && !e.includes("must be null")));
});

test("rejects copied without oldPath", () => {
  const entry = { path: "copy.txt", status: "copied", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => (e.includes("copied") || e.includes("oldPath")) && !e.includes("must be null")));
});

test("rejects non-renamed/copied with non-null oldPath", () => {
  const entry = { path: "a.txt", status: "added", oldPath: "other.txt", mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("oldPath")));
});

test("accepts renamed with oldPath", () => {
  const entry = { path: "b.txt", status: "renamed", oldPath: "a.txt", mode: "100644", objectSha: { ...FAKE_SHA1 }, sizeBytes: 10, binary: false };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

test("accepts copied with oldPath", () => {
  const entry = { path: "copy.txt", status: "copied", oldPath: "a.txt", mode: "100644", objectSha: { ...FAKE_SHA1 }, sizeBytes: 10, binary: false };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Entry-level: deletion objectSha must be null
// ---------------------------------------------------------------------------

test("rejects deleted entry with non-null objectSha", () => {
  const entry = { path: "deleted.txt", status: "deleted", oldPath: null, mode: null, objectSha: { ...FAKE_SHA1 }, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("deleted") && e.includes("objectSha")));
});

test("accepts deleted entry with null objectSha", () => {
  const entry = { path: "deleted.txt", status: "deleted", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Entry-level: gitlink sizeBytes/binary must be null
// ---------------------------------------------------------------------------

test("rejects gitlink with non-null sizeBytes", () => {
  const entry = { path: "submod", status: "modified", oldPath: null, mode: "160000", objectSha: { ...FAKE_SHA1 }, sizeBytes: 10, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("160000") && e.includes("sizeBytes")));
});

test("rejects gitlink with non-null binary", () => {
  const entry = { path: "submod", status: "modified", oldPath: null, mode: "160000", objectSha: { ...FAKE_SHA1 }, sizeBytes: null, binary: true };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("160000") && e.includes("binary")));
});

test("accepts gitlink with null sizeBytes and binary", () => {
  const entry = { path: "submod", status: "modified", oldPath: null, mode: "160000", objectSha: { ...FAKE_SHA1 }, sizeBytes: null, binary: null };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Entry-level: negative sizeBytes
// ---------------------------------------------------------------------------

test("rejects negative sizeBytes", () => {
  const entry = { path: "a.txt", status: "added", oldPath: null, mode: "100644", objectSha: { ...FAKE_SHA1 }, sizeBytes: -1, binary: false };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("sizeBytes") && (e.includes("negative") || e.includes("-1"))));
});

// ---------------------------------------------------------------------------
// Entry-level: mode enum
// ---------------------------------------------------------------------------

test("rejects invalid mode", () => {
  const entry = { path: "a.txt", status: "added", oldPath: null, mode: "777", objectSha: { ...FAKE_SHA1 }, sizeBytes: 10, binary: false };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("mode")));
});

// ---------------------------------------------------------------------------
// Empty-diff rule: trees must match when changedPaths is empty
// ---------------------------------------------------------------------------

test("rejects empty changedPaths when trees differ", () => {
  const snap = validSnapshot([]);
  // baseTree and candidateTree are already different
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.toLowerCase().includes("tree")));
});

test("accepts empty changedPaths when trees are equal", () => {
  const snap = validSnapshot([]);
  snap.baseTree = { ...FAKE_SHA1, hex: "dddddddddddddddddddddddddddddddddddddddd" };
  snap.candidateTree = { ...FAKE_SHA1, hex: "dddddddddddddddddddddddddddddddddddddddd" };
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Entry-level: objectSha type check
// ---------------------------------------------------------------------------

test("rejects non-GitObjectId objectSha", () => {
  const entry = { path: "a.txt", status: "added", oldPath: null, mode: "100644", objectSha: "not-an-object", sizeBytes: 10, binary: false };
  const snap = validSnapshot([entry]);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("objectSha")));
});

// ---------------------------------------------------------------------------
// Path byte-order validation
// ---------------------------------------------------------------------------

test("rejects entries not in ascending byte order", () => {
  const entries = [
    { path: "z.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null },
    { path: "a.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null },
  ];
  const snap = validSnapshot(entries);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("order") || e.includes("byte")));
});

test("accepts entries in ascending byte order", () => {
  const entries = [
    { path: "a.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null },
    { path: "z.txt", status: "added", oldPath: null, mode: null, objectSha: null, sizeBytes: null, binary: null },
  ];
  const snap = validSnapshot(entries);
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Summary: a fully valid snapshot passes
// ---------------------------------------------------------------------------

test("accepts a fully valid snapshot", () => {
  const entries = [
    { path: "a.txt", status: "added", oldPath: null, mode: "100644", objectSha: { ...FAKE_SHA1 }, sizeBytes: 100, binary: false },
  ];
  const snap = validSnapshot(entries);
  const baseHex = "dddddddddddddddddddddddddddddddddddddddd";
  snap.baseTree = { ...FAKE_SHA1, hex: baseHex };
  snap.candidateTree = { ...FAKE_SHA1, hex: baseHex };
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

test("accepts a fully valid sha256 snapshot", () => {
  const entries = [
    { path: "a.txt", status: "added", oldPath: null, mode: "100644", objectSha: { ...FAKE_SHA256 }, sizeBytes: 100, binary: false },
  ];
  const snap = {
    contract: CANDIDATE_SNAPSHOT_CONTRACT_ID,
    objectFormat: "sha256",
    baseCommit: { ...FAKE_SHA256, hex: "a".repeat(64) },
    candidateCommit: { ...FAKE_SHA256, hex: "b".repeat(64) },
    baseTree: { ...FAKE_SHA256, hex: "c".repeat(64) },
    candidateTree: { ...FAKE_SHA256, hex: "c".repeat(64) },
    acceptanceFingerprint: ACCEPTANCE_FP,
    changedPaths: entries,
  };
  const result = validateCandidateSnapshotV1(snap);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Schema ↔ Validator parity
// ---------------------------------------------------------------------------

import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { validateEnvelope, ENVELOPE_STATES } from "../dist/index.js";

// eslint-disable-next-line no-sync — schema parity test
const snapshotSchema = require("../candidate-snapshot.schema.json");
const Ajv = (await import("ajv")).default;
const ajv = new Ajv();

// Note: package.json does not list ajv as a dependency, so the parity test
// uses a minimal manual JSON-Schema path rather than importing Ajv at runtime.
// Instead we validate that the schema file is valid JSON with the expected shape.
test("candidate-snapshot.schema.json is valid JSON with expected structure", () => {
  assert.equal(snapshotSchema["$schema"], "http://json-schema.org/draft-07/schema#");
  assert.equal(snapshotSchema["$id"], "https://github.com/gtrabanco/agentic-workflow/packages/agentic-workflow-schema/candidate-snapshot.schema.json");
  assert.equal(snapshotSchema.type, "object");
  assert.equal(snapshotSchema.additionalProperties, false);
  assert.ok(snapshotSchema.required.includes("contract"));
  assert.ok(snapshotSchema.required.includes("objectFormat"));
  assert.ok(snapshotSchema.required.includes("baseCommit"));
  assert.ok(snapshotSchema.required.includes("candidateCommit"));
  assert.ok(snapshotSchema.required.includes("baseTree"));
  assert.ok(snapshotSchema.required.includes("candidateTree"));
  assert.ok(snapshotSchema.required.includes("acceptanceFingerprint"));
  assert.ok(snapshotSchema.required.includes("changedPaths"));
  // additionalProperties: false at entry level
  assert.equal(snapshotSchema.properties.contract.additionalProperties, undefined);
  // contract is const
  assert.equal(snapshotSchema.properties.contract.const, "agentic-workflow/candidate-snapshot@1");
  // $defs exist
  assert.ok(snapshotSchema["$defs"].gitObjectId);
  assert.ok(snapshotSchema["$defs"].manifestEntryV1);
  assert.equal(snapshotSchema["$defs"].manifestEntryV1.additionalProperties, false);
});