import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VERIFICATION_RECEIPT_CONTRACT_ID,
  VERIFICATION_COMMAND_STATUSES,
  VERIFICATION_VERDICTS,
  VERIFICATION_RECEIPT_SCHEMA_PATH,
  validateVerificationReceiptV1,
} from "../dist/index.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Contract ID and vocabulary tests
// ---------------------------------------------------------------------------

test("exports the receipt contract ID", () => {
  assert.equal(VERIFICATION_RECEIPT_CONTRACT_ID, "agentic-workflow/verification-receipt@1");
});

test("exports VERIFICATION_COMMAND_STATUSES with 5 values", () => {
  assert.deepStrictEqual(VERIFICATION_COMMAND_STATUSES, ["passed", "failed", "timed-out", "skipped", "infrastructure-error"]);
});

test("exports VERIFICATION_VERDICTS with 3 values", () => {
  assert.deepStrictEqual(VERIFICATION_VERDICTS, ["pass", "fail", "incomplete"]);
});

test("exports VERIFICATION_RECEIPT_SCHEMA_PATH", () => {
  assert.equal(VERIFICATION_RECEIPT_SCHEMA_PATH, "./verification-receipt.schema.json");
});

// ---------------------------------------------------------------------------
// Structural validation: undeclared fields
// ---------------------------------------------------------------------------

test("rejects undeclared top-level fields", () => {
  const receipt = makeValidReceipt();
  const bad = { ...receipt, extra: true };
  const result = validateVerificationReceiptV1(bad);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("extra")), result.errors.join(", "));
});

test("rejects undeclared fields in results", () => {
  const receipt = makeValidReceipt();
  receipt.results = [{
    commandId: "lint",
    status: "passed",
    exitCode: 0,
    signal: null,
    startedAt: "2025-01-01T00:00:00Z",
    endedAt: "2025-01-01T00:00:01Z",
    stdout: null,
    stderr: null,
    skipReason: null,
    extraField: true,
  }];
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("extraField")), result.errors.join(", "));
});

test("rejects wrong contract id", () => {
  const receipt = makeValidReceipt();
  const result = validateVerificationReceiptV1({ ...receipt, contract: "wrong/contract@0" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("contract")), result.errors.join(", "));
});

// ---------------------------------------------------------------------------
// Digest formats
// ---------------------------------------------------------------------------

test("rejects invalid planDigest (not 64-hex)", () => {
  const receipt = makeValidReceipt();
  const result = validateVerificationReceiptV1({ ...receipt, planDigest: "not-a-digest" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("planDigest")), result.errors.join(", "));
});

test("rejects invalid candidateSnapshotDigest (not 64-hex)", () => {
  const receipt = makeValidReceipt();
  const result = validateVerificationReceiptV1({ ...receipt, candidateSnapshotDigest: "abc" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("candidateSnapshotDigest")), result.errors.join(", "));
});

test("rejects invalid acceptanceFingerprint (not 64-hex)", () => {
  const receipt = makeValidReceipt();
  const result = validateVerificationReceiptV1({ ...receipt, acceptanceFingerprint: "ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("acceptanceFingerprint")), result.errors.join(", "));
});

test("rejects uppercase hex digests", () => {
  const receipt = makeValidReceipt();
  const result = validateVerificationReceiptV1({ ...receipt, planDigest: "A".repeat(64) });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("planDigest")), result.errors.join(", "));
});

// ---------------------------------------------------------------------------
// stageRequested vocabulary
// ---------------------------------------------------------------------------

test("rejects invalid stageRequested", () => {
  const receipt = makeValidReceipt();
  const result = validateVerificationReceiptV1({ ...receipt, stageRequested: "ultra" });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("stageRequested")), result.errors.join(", "));
});

// ---------------------------------------------------------------------------
// Duplicate result command-id rejection
// ---------------------------------------------------------------------------

test("rejects duplicate result command ids", () => {
  const receipt = makeValidReceipt();
  receipt.results = [
    { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
    { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:03Z", stdout: null, stderr: null, skipReason: null },
  ];
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("duplicate")), result.errors.join(", "));
});

// ---------------------------------------------------------------------------
// Status vocabulary
// ---------------------------------------------------------------------------

test("rejects invalid status", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].status = "cancelled";
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("status")), result.errors.join(", "));
});

// ---------------------------------------------------------------------------
// D4 — exitCode/signal matrix
// ---------------------------------------------------------------------------

test("passed: requires exactly one of exitCode or signal", () => {
  // Both present — only one allowed
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "passed", exitCode: 0, signal: "SIGTERM",
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  let result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("exitCode") || e.includes("signal")), result.errors.join(", "));

  // Both null
  receipt.results[0] = {
    commandId: "lint", status: "passed", exitCode: null, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("exitCode") || e.includes("signal")), result.errors.join(", "));
});

test("passed: valid with exitCode only", () => {
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "passed", exitCode: 0, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

test("passed: valid with signal only", () => {
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "passed", exitCode: null, signal: "SIGINT",
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

test("failed: exactly one of exitCode or signal", () => {
  // Both null — invalid
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "failed", exitCode: null, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  let result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);

  // exitCode present — valid
  receipt.results[0] = {
    commandId: "lint", status: "failed", exitCode: 1, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);

  // signal present — valid
  receipt.results[0] = {
    commandId: "lint", status: "failed", exitCode: null, signal: "SIGKILL",
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

test("timed-out: exitCode null, signal nullable", () => {
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "timed-out", exitCode: null, signal: "SIGTERM",
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

test("infrastructure-error: both exitCode and signal null", () => {
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "infrastructure-error", exitCode: null, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

test("skipped: both exitCode and signal null", () => {
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "skipped", exitCode: null, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: "dependency failed",
  };
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// ISO-8601 UTC timestamps with endedAt >= startedAt
// ---------------------------------------------------------------------------

test("rejects non-UTC timestamp", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].startedAt = "2025-01-01T00:00:00";
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("startedAt") || e.includes("timestamp")), result.errors.join(", "));
});

test("rejects startedAt > endedAt", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].startedAt = "2025-01-01T00:00:02Z";
  receipt.results[0].endedAt = "2025-01-01T00:00:01Z";
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("endedAt") || e.includes("startedAt")), result.errors.join(", "));
});

test("accepts equal timestamps", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].startedAt = "2025-01-01T00:00:00Z";
  receipt.results[0].endedAt = "2025-01-01T00:00:00Z";
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// D5 — evidence bounds
// ---------------------------------------------------------------------------

test("rejects empty evidence ref", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "", bytes: 10, sha256: "a".repeat(64) };
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("ref")), result.errors.join(", "));
});

test("rejects evidence ref > 1024 chars", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "x".repeat(1025), bytes: 10, sha256: "a".repeat(64) };
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("ref")), result.errors.join(", "));
});

test("rejects evidence bytes < 0", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "evidence-1", bytes: -1, sha256: "a".repeat(64) };
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("bytes")), result.errors.join(", "));
});

test("rejects evidence sha256 not 64-hex", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "evidence-1", bytes: 10, sha256: "invalid" };
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("sha256")), result.errors.join(", "));
});

test("accepts valid evidence reference", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "evidence-1", bytes: 1024, sha256: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789" };
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

test("accepts evidence ref exactly 1024 chars", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "x".repeat(1024), bytes: 0, sha256: "0".repeat(64) };
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Skip reason rules
// ---------------------------------------------------------------------------

test("rejects non-null skipReason on non-skipped row", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].status = "passed";
  receipt.results[0].skipReason = "some reason";
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("skipReason")), result.errors.join(", "));
});

test("accepts null skipReason on non-skipped row", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].status = "passed";
  receipt.results[0].skipReason = null;
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

test("rejects empty skipReason", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].status = "skipped";
  receipt.results[0].skipReason = "";
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("skipReason")), result.errors.join(", "));
});

test("rejects skipReason > 1024 chars", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].status = "skipped";
  receipt.results[0].skipReason = "x".repeat(1025);
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("skipReason")), result.errors.join(", "));
});

test("accepts valid skipReason", () => {
  const receipt = makeValidReceipt();
  receipt.results[0].status = "skipped";
  receipt.results[0].exitCode = null;
  receipt.results[0].signal = null;
  receipt.results[0].skipReason = "lint";
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Valid receipt
// ---------------------------------------------------------------------------

test("accepts a fully valid receipt", () => {
  const receipt = makeValidReceipt();
  const result = validateVerificationReceiptV1(receipt);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Schema structure
// ---------------------------------------------------------------------------

test("schema is valid JSON with expected structure", () => {
  const schemaPath = join(__dirname, "../verification-receipt.schema.json");
  const s = JSON.parse(readFileSync(schemaPath, "utf-8"));
  assert.equal(s["$schema"], "http://json-schema.org/draft-07/schema#");
  assert.equal(s.type, "object");
  assert.equal(s.additionalProperties, false);
  assert.ok(s.required.includes("contract"));
  assert.ok(s.required.includes("planDigest"));
  assert.ok(s.required.includes("candidateSnapshotDigest"));
  assert.ok(s.required.includes("acceptanceFingerprint"));
  assert.ok(s.required.includes("stageRequested"));
  assert.ok(s.required.includes("results"));
  assert.ok(s["$defs"]);
  assert.ok(s["$defs"].EvidenceReferenceV1);
  assert.ok(s["$defs"].VerificationResultV1);
  assert.equal(s["$defs"].EvidenceReferenceV1.additionalProperties, false);
  assert.equal(s["$defs"].VerificationResultV1.additionalProperties, false);
});

// ---------------------------------------------------------------------------
// Helper: create a minimal valid receipt
// ---------------------------------------------------------------------------

function makeValidReceipt() {
  return {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "d".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      {
        commandId: "lint",
        status: "passed",
        exitCode: 0,
        signal: null,
        startedAt: "2025-01-01T00:00:00Z",
        endedAt: "2025-01-01T00:00:01Z",
        stdout: null,
        stderr: null,
        skipReason: null,
      },
    ],
    verdict: "pass",
  };
}