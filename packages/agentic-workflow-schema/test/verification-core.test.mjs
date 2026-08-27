import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertDiagnosticAt,
  assertDiagnosticOn,
  assertOnlyDiagnostic,
  codesOf,
  describeDiagnostics,
} from "./fixtures/verification-diagnostics.mjs";
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_STAGES,
  VERIFICATION_COST_CLASSES,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  VERIFICATION_COMMAND_STATUSES,
  VERIFICATION_VERDICTS,
  VERIFICATION_FRESHNESS_CODES,
  VERIFICATION_LIMITS,
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  deriveVerificationVerdict,
  canonicalizeVerificationPlan,
  canonicalizeVerificationReceipt,
  digestVerificationPlan,
  digestVerificationReceipt,
  compareVerificationReceiptToCurrent,
  VERIFICATION_CANONICAL_VECTORS,
} from "../dist/index.js";

// A maximum-capacity plan must ALSO fit the tightest D14 stage budget, so the
// shared fixture timeout is sized for capacity: 7031 ms × 128 = 899,968 ≤ 900,000.
const fixtureTimeoutMs = Math.floor(VERIFICATION_LIMITS.fastStageTimeoutMs / VERIFICATION_LIMITS.commands);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlan(commands) {
  return {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands,
  };
}

function makeValidPlanCommand(opts = {}) {
  return {
    id: opts.id || "cmd1",
    stage: opts.stage || "fast",
    executable: opts.executable || "npm",
    args: opts.args || ["test"],
    workingDirectoryPolicy: opts.workingDirectoryPolicy || "candidate-root",
    workingDirectory: opts.workingDirectory || null,
    timeoutMs: opts.timeoutMs || fixtureTimeoutMs,
    stopOnFailure: opts.stopOnFailure || false,
    costClass: opts.costClass || "cheap",
  };
}

function makeValidPlan() {
  return makePlan([
    makeValidPlanCommand({ id: "lint", stage: "fast", costClass: "cheap" }),
    makeValidPlanCommand({ id: "test", stage: "full", costClass: "moderate" }),
  ]);
}

function makeValidReceipt(commands) {
  return {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "d".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: commands.map((cmd) => ({
      commandId: cmd.id,
      status: "passed",
      exitCode: 0,
      signal: null,
      startedAt: "2025-01-01T00:00:00Z",
      endedAt: "2025-01-01T00:00:01Z",
      stdout: null,
      stderr: null,
      skipReason: null,
    })),
    verdict: "pass",
  };
}

// ---------------------------------------------------------------------------
// validateVerificationReceiptAgainstPlan
// ---------------------------------------------------------------------------

test("rejects result commandId not in plan", async () => {
  const plan = makeValidPlan();
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "nonexistent", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  const result = await validateVerificationReceiptAgainstPlan(receipt, plan);
  assert.equal(result.ok, false);
  assertDiagnosticAt(result, "unknown-command", "/results/0/commandId");
});

test("rejects result commandId outside declared order", async () => {
  // Results must appear in plan's declared order: lint (idx 0), test (idx 1)
  const plan = makeValidPlan();
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "test", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:03Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  const result = await validateVerificationReceiptAgainstPlan(receipt, plan);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-order", "commandId");
});

test("rejects a full-stage result carried by a fast-stage receipt (F66)", async () => {
  // D7: a fast receipt may carry results ONLY for fast commands. The fixture must
  // actually submit the full-stage `build` row — the version of this test named
  // "rejects full-command result" never did, so the rule had zero coverage.
  const planWithMixed = makePlan([
    makeValidPlanCommand({ id: "lint", stage: "fast" }),
    makeValidPlanCommand({ id: "build", stage: "full" }),
  ]);
  const planDigest = await digestVerificationPlan(planWithMixed);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "fast",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      { commandId: "build", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:03Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  const result = await validateVerificationReceiptAgainstPlan(receipt, planWithMixed);
  assert.equal(result.ok, false);
  assertDiagnosticAt(result, "invalid-stage", "/results/1/commandId");
});

test("accepts a fast-stage receipt that carries only fast-stage rows", async () => {
  // Companion to the F66 rejection: the same mixed plan with the full row omitted
  // stays valid (a fast receipt owes nothing to full-stage commands).
  const planWithMixed = makePlan([
    makeValidPlanCommand({ id: "lint", stage: "fast" }),
    makeValidPlanCommand({ id: "build", stage: "full" }),
  ]);
  const planDigest = await digestVerificationPlan(planWithMixed);
  const mixedReceipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "fast",
    results: [
      {
        commandId: "lint",
        status: "passed",
        exitCode: 0, signal: null,
        startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
        stdout: null, stderr: null, skipReason: null,
      },
    ],
    verdict: "pass",
  };
  const result = await validateVerificationReceiptAgainstPlan(mixedReceipt, planWithMixed);
  assert.equal(result.ok, true); // fast receipt with only fast result is valid
});

test("planDigest must match", async () => {
  const plan = makeValidPlan();
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "a".repeat(64), // wrong digest
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  const result = await validateVerificationReceiptAgainstPlan(receipt, plan);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "digest-mismatch", "planDigest");
});

test("stored verdict must match deriveVerificationVerdict", async () => {
  // A receipt with verdict "pass" but it should be "fail"
  const plan = makeValidPlan();
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      { commandId: "test", status: "failed", exitCode: 1, signal: null, startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:03Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass", // wrong — should be "fail"
  };
  const result = await validateVerificationReceiptAgainstPlan(receipt, plan);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "verdict-mismatch", "verdict");
});

test("accepts valid plan-bound receipt", async () => {
  const plan = makeValidPlan();
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      { commandId: "test", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:03Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  const result = await validateVerificationReceiptAgainstPlan(receipt, plan);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// deriveVerificationVerdict (D2)
// ---------------------------------------------------------------------------

test("all passed → pass", () => {
  const plan = makeValidPlan();
  const receipt = makeValidReceipt([{ id: "lint", stage: "fast" }, { id: "test", stage: "full" }]);
  receipt.stageRequested = "full";
  const result = deriveVerificationVerdict(receipt, plan);
  assert.equal(result, "pass");
});

test("one failed → fail", () => {
  const plan = makeValidPlan();
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "d".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      { commandId: "test", status: "failed", exitCode: 1, signal: null, startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:03Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "fail");
});

test("timed-out → fail", () => {
  const plan = makeValidPlan();
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "d".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "timed-out", exitCode: null, signal: "SIGTERM", startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      { commandId: "test", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:03Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "fail");
});

test("infrastructure-error → fail", () => {
  const plan = makeValidPlan();
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "d".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "infrastructure-error", exitCode: null, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      { commandId: "test", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:03Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "fail");
});

test("skipped without reason → incomplete", () => {
  const plan = makeValidPlan();
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "d".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "skipped", exitCode: null, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      { commandId: "test", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:03Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "incomplete");
});

test("skipped with reason on a required row without an attributed failure → fail, never pass (F47)", () => {
  // D2: pass requires every required result row to be "passed". A required row that
  // is skipped-with-reason must not vacuously yield "pass" when no failure row exists.
  const plan = makePlan([
    makeValidPlanCommand({ id: "lint", stage: "fast" }),
    makeValidPlanCommand({ id: "test", stage: "full", stopOnFailure: true }),
  ]);
  const receipt = makeValidReceipt(plan.commands);
  receipt.results[1] = {
    commandId: "test", status: "skipped", exitCode: null, signal: null,
    startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z",
    stdout: null, stderr: null, skipReason: "lint",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "fail");
});

test("missing result row (fast stage) → incomplete", () => {
  const plan = makePlan([
    makeValidPlanCommand({ id: "lint", stage: "fast" }),
    makeValidPlanCommand({ id: "test", stage: "fast" }),
  ]);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "d".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "fast",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      // test result missing → incomplete
    ],
    verdict: "pass",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "incomplete");
});

test("missing result row (full stage) → incomplete", () => {
  const plan = makeValidPlan();
  const receipt = makeValidReceipt([{ id: "lint", stage: "fast" }]);
  receipt.stageRequested = "full";
  // Missing "test" command result
  assert.equal(deriveVerificationVerdict(receipt, plan), "incomplete");
});

test("vacuous fast stage (no fast commands, fast receipt) → pass", () => {
  // Plan with only full commands, fast-stage receipt with zero results
  const plan = makePlan([
    makeValidPlanCommand({ id: "deploy", stage: "full" }),
  ]);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "d".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "fast",
    results: [],
    verdict: "pass",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "pass");
});

// ---------------------------------------------------------------------------
// Canonical + digest
// ---------------------------------------------------------------------------

test("canonicalizePlan preserves nulls and sorts keys", () => {
  const plan = makeValidPlan();
  const canonical = canonicalizeVerificationPlan(plan);
  const parsed = JSON.parse(canonical);
  // Keys should be sorted
  const keys = Object.keys(parsed);
  assert.ok(keys[0] < keys[1], "Keys should be sorted");
});

test("canonicalizePlan with nested null", () => {
  const plan = makePlan([
    { ...makeValidPlanCommand({ id: "c1" }), workingDirectory: null },
  ]);
  const canonical = canonicalizeVerificationPlan(plan);
  assert.ok(canonical.includes('"workingDirectory":null'), "Should preserve nulls");
});

test("canonicalizeReceipt preserves nulls and sorts keys", () => {
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "d".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  const canonical = canonicalizeVerificationReceipt(receipt);
  const parsed = JSON.parse(canonical);
  const keys = Object.keys(parsed);
  assert.ok(keys[0] < keys[1], "Keys should be sorted");
});

test("canonical forms are deterministic", () => {
  const plan = makeValidPlan();
  const c1 = canonicalizeVerificationPlan(plan);
  const c2 = canonicalizeVerificationPlan(plan);
  assert.deepStrictEqual(c1, c2);
});

test("digestPlan returns 64-char lowercase hex", async () => {
  const plan = makeValidPlan();
  const digest = await digestVerificationPlan(plan);
  assert.ok(/^[a-f0-9]{64}$/.test(digest), "Should be 64-char lowercase hex");
});

test("digestReceipt returns 64-char lowercase hex", async () => {
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "d".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  const digest = await digestVerificationReceipt(receipt);
  assert.ok(/^[a-f0-9]{64}$/.test(digest), "Should be 64-char lowercase hex");
});

test("digests are deterministic", async () => {
  const plan = makeValidPlan();
  const d1 = await digestVerificationPlan(plan);
  const d2 = await digestVerificationPlan(plan);
  assert.deepStrictEqual(d1, d2);
});

test("different plans produce different digests", async () => {
  const plan1 = makePlan([makeValidPlanCommand({ id: "a" })]);
  const plan2 = makePlan([makeValidPlanCommand({ id: "b" })]);
  const d1 = await digestVerificationPlan(plan1);
  const d2 = await digestVerificationPlan(plan2);
  assert.notStrictEqual(d1, d2);
});

// ---------------------------------------------------------------------------
// compareVerificationReceiptToCurrent — freshness
// ---------------------------------------------------------------------------

test("fresh: all digests match and all results present", async () => {
  const plan = makeValidPlan();
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      { commandId: "test", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:02Z", endedAt: "2025-01-01T00:00:03Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  const result = await compareVerificationReceiptToCurrent(receipt, plan, "e".repeat(64), "f".repeat(64));
  assert.deepStrictEqual(result, { fresh: true });
});

test("stale-plan: plan digest differs", async () => {
  const plan = makeValidPlan();
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "a".repeat(64), // different
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [],
    verdict: "pass",
  };
  const result = await compareVerificationReceiptToCurrent(receipt, plan, "e".repeat(64), "f".repeat(64));
  assert.deepStrictEqual(result, { fresh: false, reasonCode: "stale-plan" });
});

test("stale-candidate-snapshot: digest differs", async () => {
  const plan = makeValidPlan();
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64), // different
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [],
    verdict: "pass",
  };
  const result = await compareVerificationReceiptToCurrent(receipt, plan, "e".repeat(64), "f".repeat(64));
  assert.deepStrictEqual(result, { fresh: false, reasonCode: "stale-candidate-snapshot" });
});

test("stale-acceptance-fingerprint: fingerprint differs", async () => {
  const plan = makeValidPlan();
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "a".repeat(64), // different
    stageRequested: "full",
    results: [],
    verdict: "pass",
  };
  const result = await compareVerificationReceiptToCurrent(receipt, plan, "e".repeat(64), "f".repeat(64));
  assert.deepStrictEqual(result, { fresh: false, reasonCode: "stale-acceptance-fingerprint" });
});

test("incomplete-missing-results: missing result rows", async () => {
  const plan = makePlan([
    makeValidPlanCommand({ id: "lint", stage: "fast" }),
    makeValidPlanCommand({ id: "test", stage: "fast" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "fast",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      // test missing
    ],
    verdict: "pass",
  };
  const result = await compareVerificationReceiptToCurrent(receipt, plan, "e".repeat(64), "f".repeat(64));
  assert.deepStrictEqual(result, { fresh: false, reasonCode: "incomplete-missing-results" });
});

test("incomplete-unjustified-skip: skipped without reason", async () => {
  const plan = makePlan([
    makeValidPlanCommand({ id: "lint", stage: "fast" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "fast",
    results: [
      { commandId: "lint", status: "skipped", exitCode: null, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  const result = await compareVerificationReceiptToCurrent(receipt, plan, "e".repeat(64), "f".repeat(64));
  assert.deepStrictEqual(result, { fresh: false, reasonCode: "incomplete-unjustified-skip" });
});

test("fresh: complete fast receipt is fresh even when full commands exist in plan", async () => {
  // Fast stage only requires fast commands; the delivery gate requires full,
  // so a complete fast receipt is fresh but cannot satisfy delivery (gate check).
  const plan = makePlan([
    makeValidPlanCommand({ id: "lint", stage: "fast" }),
    makeValidPlanCommand({ id: "deploy", stage: "full" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "fast",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  const result = await compareVerificationReceiptToCurrent(receipt, plan, "e".repeat(64), "f".repeat(64));
  assert.deepStrictEqual(result, { fresh: true });
});

test("incomplete-stage-coverage: full receipt missing a full-stage command", async () => {
  // SPEC § Stage/verdict/freshness: `incomplete-missing-results` answers a missing
  // FAST-stage result, `incomplete-stage-coverage` a missing FULL-stage result on a
  // requested-full receipt. AC4 requires both codes on reachable, disjoint
  // conditions (F63) — the earlier `incomplete-missing-results` expectation here made
  // `incomplete-stage-coverage` unreachable and contradicted the frozen manifest.
  const plan = makePlan([
    makeValidPlanCommand({ id: "lint", stage: "fast" }),
    makeValidPlanCommand({ id: "deploy", stage: "full" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      // Missing deploy (full) command → incomplete-stage-coverage
    ],
    verdict: "pass",
  };
  const result = await compareVerificationReceiptToCurrent(receipt, plan, "e".repeat(64), "f".repeat(64));
  assert.deepStrictEqual(result, { fresh: false, reasonCode: "incomplete-stage-coverage" });
});

test("full receipt with coverage gap AND unjustified skip returns incomplete-unjustified-skip (D1 order)", async () => {
  // SPEC fixed check order: incomplete-missing-results → incomplete-unjustified-skip
  // → incomplete-stage-coverage. A full receipt degraded on BOTH dimensions returns
  // the earliest-in-order code: the only missing row is a FULL-stage command
  // (stage-coverage, checked last), so the unjustified skip on `lint` wins (F42).
  const plan = makePlan([
    makeValidPlanCommand({ id: "lint", stage: "fast" }),
    makeValidPlanCommand({ id: "deploy", stage: "full" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      // skipped without reason → incomplete-unjustified-skip (checked before
      // stage-coverage, which is what the missing deploy row would answer)
      { commandId: "lint", status: "skipped", exitCode: null, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
      // deploy (full) result missing → incomplete-stage-coverage (checked last)
    ],
    verdict: "incomplete",
  };
  const result = await compareVerificationReceiptToCurrent(receipt, plan, "e".repeat(64), "f".repeat(64));
  assert.deepStrictEqual(result, { fresh: false, reasonCode: "incomplete-unjustified-skip" });
});

test("compareVerificationReceiptToCurrent throws nothing on non-JSON-serializable plans (F40)", async () => {
  // A BigInt field makes canonicalJSONValue/JSON.stringify throw; the SPEC promises
  // the predicate is pure and throws nothing, so validation must reject it first
  // and return a stable freshness code instead. The code is the FIRST precedence
  // point (`stale-plan`): an input that fails its own contract cannot establish the
  // plan binding, and reporting an incompleteness would claim a verified binding.
  const plan = makePlan([makeValidPlanCommand()]);
  const badPlan = { ...plan, commands: [{ ...plan.commands[0], timeoutMs: 10n }] };
  const receipt = makeValidReceipt(plan.commands);
  const result = await compareVerificationReceiptToCurrent(receipt, badPlan, "e".repeat(64), "f".repeat(64));
  assert.deepStrictEqual(result, { fresh: false, reasonCode: "stale-plan" });
});

// ---------------------------------------------------------------------------
// VERIFICATION_CANONICAL_VECTORS
// ---------------------------------------------------------------------------

test("VERIFICATION_CANONICAL_VECTORS has entries", () => {
  assert.ok(VERIFICATION_CANONICAL_VECTORS.length > 0);
});

test("vectors have expected shape", () => {
  for (const v of VERIFICATION_CANONICAL_VECTORS) {
    assert.ok(typeof v.contract === "string");
    assert.ok(typeof v.digest === "string");
    assert.ok(typeof v.description === "string");
  }
});

test("vector digests are well-formed lowercase 64-hex", () => {
  for (const v of VERIFICATION_CANONICAL_VECTORS) {
    assert.ok(v.digest.length > 0, `Vector ${v.contract} must have non-empty digest`);
    assert.ok(/^[a-f0-9]{64}$/.test(v.digest), `Vector ${v.contract} digest must be lowercase 64-hex`);
  }
});

test("vector payloads validate against the published JSON Schemas (AC5 JSON-Schema path)", () => {
  // AC5: vectors pass identically on the TypeScript path and the JSON-Schema path.
  // The canonical fixtures whose digests equal the published vectors must also
  // satisfy the shipped draft-07 schemas (ajv), not just the TS validators.
  const ajv = new Ajv({ strict: true });
  const planSchema = JSON.parse(readFileSync(new URL("../verification-plan.schema.json", import.meta.url), "utf8"));
  const receiptSchema = JSON.parse(readFileSync(new URL("../verification-receipt.schema.json", import.meta.url), "utf8"));
  const validatePlan = ajv.compile(planSchema);
  const validateReceipt = ajv.compile(receiptSchema);

  const planFixture = planVector();
  const receiptFixture = receiptVector(computePlanDigest());
  assert.equal(validatePlan(planFixture), true, "vector plan payload must pass JSON-Schema path: " + JSON.stringify(validatePlan.errors));
  assert.equal(validateReceipt(receiptFixture), true, "vector receipt payload must pass JSON-Schema path: " + JSON.stringify(validateReceipt.errors));
});

test("exports VERIFICATION_FRESHNESS_CODES with 6 codes", () => {
  assert.ok(Array.isArray(VERIFICATION_FRESHNESS_CODES));
  assert.equal(VERIFICATION_FRESHNESS_CODES.length, 6);
  assert.deepStrictEqual(
    VERIFICATION_FRESHNESS_CODES,
    [
      "stale-plan",
      "stale-candidate-snapshot",
      "stale-acceptance-fingerprint",
      "incomplete-missing-results",
      "incomplete-unjustified-skip",
      "incomplete-stage-coverage",
    ],
  );
});

// ---------------------------------------------------------------------------
// F36 — Runtime immutability of exported vocabulary arrays
// ---------------------------------------------------------------------------

// Every exported verification vocabulary must be frozen — asserted over the
// whole namespace, so a newly added vocabulary array cannot ship unfrozen.
test("exported vocabulary arrays are frozen at runtime", async () => {
  const namespace = await import("../dist/index.js");
  const arrays = Object.entries(namespace)
    .filter(([name, value]) => /^VERIFICATION_/.test(name) && Array.isArray(value))
    .map(([name]) => name);
  assert.ok(arrays.length >= 4, `found ${arrays.join(", ")}`);
  for (const name of arrays) {
    assert.ok(Object.isFrozen(namespace[name]), `${name} must be frozen`);
  }
});

test("mutating frozen vocabulary arrays throws in strict mode", async () => {
  const namespace = await import("../dist/index.js");
  const frozen = Object.entries(namespace)
    .filter(([name, value]) => /^VERIFICATION_/.test(name) && Array.isArray(value))
    .map(([, value]) => value);
  for (const arr of frozen) {
    assert.throws(
      () => { arr.push("__mutate_me__"); },
      { name: "TypeError" },
      `Expected ${arr.toString()} to throw on mutation`,
    );
  }
});

// ---------------------------------------------------------------------------
// F32 — Canonical vector digest tests
// ---------------------------------------------------------------------------

import { createHash } from "node:crypto";
import { planVector, receiptVector } from "./fixtures/verification-vectors.mjs";

function computePlanDigest() {
  const canon = canonicalizeVerificationPlan(planVector());
  return createHash("sha256").update(canon).digest("hex");
}

function computeReceiptDigest(planDigest) {
  const canon = canonicalizeVerificationReceipt(receiptVector(planDigest));
  return createHash("sha256").update(canon).digest("hex");
}

test("vector digests match independently computed values", () => {
  const planDigest = computePlanDigest();
  const expectedPlanDigest = VERIFICATION_CANONICAL_VECTORS[0].digest;
  assert.equal(planDigest, expectedPlanDigest, "Plan vector digest must match independently computed value");

  const recvDigest = computeReceiptDigest(planDigest);
  const expectedRecvDigest = VERIFICATION_CANONICAL_VECTORS[1].digest;
  assert.equal(recvDigest, expectedRecvDigest, "Receipt vector digest must match independently computed value");
});

test("vector entries are deeply frozen (immutable digest)", () => {
  for (const v of VERIFICATION_CANONICAL_VECTORS) {
    assert.ok(Object.isFrozen(v), `Vector entry for ${v.contract} must be deeply frozen`);
  }
});