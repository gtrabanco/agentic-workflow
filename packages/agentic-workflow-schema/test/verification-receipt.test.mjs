import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertDiagnosticAt,
  assertDiagnosticOn,
  assertOnlyDiagnostic,
  codesOf,
  describeDiagnostics,
} from "./fixtures/verification-diagnostics.mjs";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  VERIFICATION_COMMAND_STATUSES,
  VERIFICATION_VERDICTS,
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  digestVerificationPlan,
} from "../dist/index.js";
import { VERIFICATION_CONTRACT } from "../dist/verification-contract.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** The plan every receipt in this suite is bound to. */
function makePlan() {
  return {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      {
        id: "lint",
        stage: "fast",
        executable: "npm",
        args: ["run", "lint"],
        workingDirectoryPolicy: "candidate-root",
        workingDirectory: null,
        timeoutMs: 30000,
        stopOnFailure: false,
        costClass: "cheap",
      },
    ],
  };
}

/** Two-command plan whose first entry fails fast — needed for skip attribution. */
function makeFailFastPlan() {
  const plan = makePlan();
  plan.commands.unshift({
    ...plan.commands[0],
    id: "setup",
    args: ["run", "setup"],
    stopOnFailure: true,
  });
  return plan;
}

function resultFor(overrides) {
  return {
    commandId: "lint",
    status: "passed",
    exitCode: 0,
    signal: null,
    startedAt: "2025-01-01T00:00:00Z",
    endedAt: "2025-01-01T00:00:01Z",
    stdout: null,
    stderr: null,
    skipReason: null,
    ...overrides,
  };
}

const PLAN = makePlan();
validateVerificationPlanV1(PLAN);
const PLAN_DIGEST = await digestVerificationPlan(makePlan());

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

test("the canonical definition names the published projection file", () => {
  assert.equal(VERIFICATION_CONTRACT.receipt.fileName, "verification-receipt.schema.json");
});

// ---------------------------------------------------------------------------
// Structural validation: undeclared fields
// ---------------------------------------------------------------------------

test("rejects undeclared top-level fields", async () => {
  const receipt = makeValidReceipt();
  const bad = { ...receipt, extra: true };
  const result = await validateVerificationReceiptAgainstPlan(bad, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticAt(result, "unknown-field", "");
});

test("rejects undeclared fields in results", async () => {
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
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticAt(result, "unknown-field", "/results/0");
});

test("rejects wrong contract id", async () => {
  const receipt = makeValidReceipt();
  const result = await validateVerificationReceiptAgainstPlan({ ...receipt, contract: "wrong/contract@0" }, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "contract");
});

// ---------------------------------------------------------------------------
// Digest formats
// ---------------------------------------------------------------------------

test("rejects invalid planDigest (not 64-hex)", async () => {
  const receipt = makeValidReceipt();
  const result = await validateVerificationReceiptAgainstPlan({ ...receipt, planDigest: "not-a-digest" }, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "planDigest");
});

test("rejects invalid candidateSnapshotDigest (not 64-hex)", async () => {
  const receipt = makeValidReceipt();
  const result = await validateVerificationReceiptAgainstPlan({ ...receipt, candidateSnapshotDigest: "abc" }, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "candidateSnapshotDigest");
});

test("rejects invalid acceptanceFingerprint (not 64-hex)", async () => {
  const receipt = makeValidReceipt();
  const result = await validateVerificationReceiptAgainstPlan({ ...receipt, acceptanceFingerprint: "ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ" }, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "acceptanceFingerprint");
});

test("rejects uppercase hex digests", async () => {
  const receipt = makeValidReceipt();
  const result = await validateVerificationReceiptAgainstPlan({ ...receipt, planDigest: "A".repeat(64) }, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "planDigest");
});

// ---------------------------------------------------------------------------
// stageRequested vocabulary
// ---------------------------------------------------------------------------

test("rejects invalid stageRequested", async () => {
  const receipt = makeValidReceipt();
  const result = await validateVerificationReceiptAgainstPlan({ ...receipt, stageRequested: "ultra" }, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "stageRequested");
});

// ---------------------------------------------------------------------------
// Duplicate result command-id rejection
// ---------------------------------------------------------------------------

test("rejects duplicate result command ids", async () => {
  const receipt = makeValidReceipt();
  receipt.results = [
    { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
    { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:03Z", stdout: null, stderr: null, skipReason: null },
  ];
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "duplicate-id", "commandId");
});

test("reject commandId with NUL (F50)", async () => {
  const receipt = makeValidReceipt();
  receipt.results = [{
    commandId: "li\u0000nt", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null,
  }];
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "commandId");
});

test("reject signal with NUL (F50)", async () => {
  const receipt = makeValidReceipt();
  receipt.results = [{
    commandId: "lint", status: "timed-out", exitCode: null, signal: "SIG\u0000TERM", startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null,
  }];
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "signal");
});

test("reject skipReason with NUL (F50)", async () => {
  const receipt = makeValidReceipt();
  receipt.results = [{
    commandId: "lint", status: "skipped", exitCode: null, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: "lint\u0000x",
  }];
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "skipReason");
});

// ---------------------------------------------------------------------------
// Status vocabulary
// ---------------------------------------------------------------------------

test("rejects invalid status", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].status = "cancelled";
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "status");
});

// ---------------------------------------------------------------------------
// D4 — exitCode/signal matrix
// ---------------------------------------------------------------------------

test("passed: requires exactly one of exitCode or signal", async () => {
  // Both present — only one allowed
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "passed", exitCode: 0, signal: "SIGTERM",
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  let result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-exit-state", "status");

  // Both null
  receipt.results[0] = {
    commandId: "lint", status: "passed", exitCode: null, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-exit-state", "status");
});

test("passed: valid with exitCode only", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "passed", exitCode: 0, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true);
});

test("passed: valid with signal only", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "passed", exitCode: null, signal: "SIGINT",
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true);
});

test("failed: exactly one of exitCode or signal", async () => {
  // Both null — invalid
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "failed", exitCode: null, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  let result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);

  // exitCode present — valid (a failed row makes the derived verdict `fail`, D2)
  receipt.verdict = "fail";
  receipt.results[0] = {
    commandId: "lint", status: "failed", exitCode: 1, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true);

  // signal present — valid
  receipt.results[0] = {
    commandId: "lint", status: "failed", exitCode: null, signal: "SIGKILL",
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true);
});

test("timed-out: exitCode null, signal nullable", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "timed-out", exitCode: null, signal: "SIGTERM",
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  receipt.verdict = "fail";
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true);
});

test("infrastructure-error: both exitCode and signal null", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0] = {
    commandId: "lint", status: "infrastructure-error", exitCode: null, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: null,
  };
  receipt.verdict = "fail";
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true);
});

test("skipped: both exitCode and signal null", async () => {
  // Bound to the fail-fast plan so the skip carries a valid D3 attribution and
  // only the D4 skipped-row matrix is under test.
  const plan = makeFailFastPlan();
  const receipt = makeValidReceipt();
  receipt.planDigest = await digestVerificationPlan(plan);
  receipt.results = [
    {
      commandId: "setup", status: "failed", exitCode: 1, signal: null,
      startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
      stdout: null, stderr: null, skipReason: null,
    },
    {
      commandId: "lint", status: "skipped", exitCode: null, signal: null,
      startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:02Z",
      stdout: null, stderr: null, skipReason: "setup",
    },
  ];
  receipt.verdict = "fail";
  const result = await validateVerificationReceiptAgainstPlan(receipt, plan);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// ISO-8601 UTC timestamps with endedAt >= startedAt
// ---------------------------------------------------------------------------

test("rejects non-UTC timestamp", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].startedAt = "2025-01-01T00:00:00";
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "startedAt");
});

test("rejects startedAt > endedAt", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].startedAt = "2025-01-01T00:00:02Z";
  receipt.results[0].endedAt = "2025-01-01T00:00:01Z";
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-value", "endedAt");
});

test("accepts equal timestamps", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].startedAt = "2025-01-01T00:00:00Z";
  receipt.results[0].endedAt = "2025-01-01T00:00:00Z";
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// D5 — evidence bounds
// ---------------------------------------------------------------------------

test("rejects empty evidence ref", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "", bytes: 10, sha256: "a".repeat(64) };
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "limit-exceeded", "ref");
});

test("rejects evidence ref > 1024 chars", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "x".repeat(1025), bytes: 10, sha256: "a".repeat(64) };
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "limit-exceeded", "ref");
});

test("rejects evidence bytes < 0", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "evidence-1", bytes: -1, sha256: "a".repeat(64) };
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "limit-exceeded", "bytes");
});

test("rejects evidence sha256 not 64-hex", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "evidence-1", bytes: 10, sha256: "invalid" };
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-evidence", "sha256"); // D5 content rule owns its own code
});

test("accepts valid evidence reference", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "evidence-1", bytes: 1024, sha256: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789" };
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true);
});

test("accepts evidence ref exactly 1024 chars", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].stdout = { ref: "x".repeat(1024), bytes: 0, sha256: "0".repeat(64) };
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Skip reason rules
// ---------------------------------------------------------------------------

test("rejects non-null skipReason on non-skipped row", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].status = "passed";
  receipt.results[0].skipReason = "some reason";
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-skip", "skipReason");
});

test("accepts null skipReason on non-skipped row", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].status = "passed";
  receipt.results[0].skipReason = null;
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true);
});

test("rejects empty skipReason", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].status = "skipped";
  receipt.results[0].skipReason = "";
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "limit-exceeded", "skipReason");
});

test("rejects skipReason > 1024 chars", async () => {
  const receipt = makeValidReceipt();
  receipt.results[0].status = "skipped";
  receipt.results[0].skipReason = "x".repeat(1025);
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "limit-exceeded", "skipReason");
});

test("accepts valid skipReason", async () => {
  // D3: a non-null skip reason is the stable id of an earlier, non-passed
  // command that declares stopOnFailure.
  const plan = makeFailFastPlan();
  const receipt = makeValidReceipt();
  receipt.planDigest = await digestVerificationPlan(plan);
  receipt.results = [
    {
      commandId: "setup", status: "failed", exitCode: 1, signal: null,
      startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
      stdout: null, stderr: null, skipReason: null,
    },
    {
      commandId: "lint", status: "skipped", exitCode: null, signal: null,
      startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:02Z",
      stdout: null, stderr: null, skipReason: "setup",
    },
  ];
  receipt.verdict = "fail";
  const result = await validateVerificationReceiptAgainstPlan(receipt, plan);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Valid receipt
// ---------------------------------------------------------------------------

test("accepts a fully valid receipt", async () => {
  const receipt = makeValidReceipt();
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
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
    planDigest: PLAN_DIGEST,
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