import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_STAGES,
  VERIFICATION_COST_CLASSES,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  VERIFICATION_COMMAND_STATUSES,
  VERIFICATION_VERDICTS,
  VERIFICATION_WORKING_DIRECTORY_POLICIES,
  VERIFICATION_STAGE_REQUESTS,
  VERIFICATION_FRESHNESS_CODES,
  validateVerificationPlanV1,
  validateVerificationReceiptV1,
  validateVerificationReceiptAgainstPlan,
  deriveVerificationVerdict,
  canonicalizeVerificationPlan,
  canonicalizeVerificationReceipt,
  digestVerificationPlan,
  digestVerificationReceipt,
  compareVerificationReceiptToCurrent,
  VERIFICATION_CANONICAL_VECTORS,
} from "../dist/index.js";

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
    timeoutMs: opts.timeoutMs || 30000,
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
  const result = validateVerificationReceiptAgainstPlan({ plan, receipt });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("nonexistent")), result.errors.join(", "));
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
  const result = validateVerificationReceiptAgainstPlan({ plan, receipt });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("order")), result.errors.join(", "));
});

test("rejects full-command result in fast-stage receipt", async () => {
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
  const result = validateVerificationReceiptAgainstPlan({ plan: planWithMixed, receipt: mixedReceipt });
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
  const result = validateVerificationReceiptAgainstPlan({ plan, receipt });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("planDigest") || e.includes("digest")), result.errors.join(", "));
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
  const result = validateVerificationReceiptAgainstPlan({ plan, receipt });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("verdict")), result.errors.join(", "));
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
  const result = validateVerificationReceiptAgainstPlan({ plan, receipt });
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

test("incomplete-stage-coverage: full receipt missing declared command", async () => {
  // A full receipt missing a required command returns incomplete-stage-coverage.
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
      // Missing deploy (full) command
    ],
    verdict: "pass",
  };
  const result = await compareVerificationReceiptToCurrent(receipt, plan, "e".repeat(64), "f".repeat(64));
  assert.deepStrictEqual(result, { fresh: false, reasonCode: "incomplete-stage-coverage" });
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

test("vector plans pass validation", () => {
  for (const v of VERIFICATION_CANONICAL_VECTORS) {
    assert.ok(v.digest.length > 0, `Vector ${v.contract} must have non-empty digest`);
    assert.ok(/^[a-f0-9]{64}$/.test(v.digest), `Vector ${v.contract} digest must be lowercase 64-hex`);
  }
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

test("exported vocabulary arrays are frozen at runtime", () => {
  assert.ok(Object.isFrozen(VERIFICATION_STAGES));
  assert.ok(Object.isFrozen(VERIFICATION_COST_CLASSES));
  assert.ok(Object.isFrozen(VERIFICATION_WORKING_DIRECTORY_POLICIES));
  assert.ok(Object.isFrozen(VERIFICATION_COMMAND_STATUSES));
  assert.ok(Object.isFrozen(VERIFICATION_VERDICTS));
  assert.ok(Object.isFrozen(VERIFICATION_STAGE_REQUESTS));
});

test("mutating frozen vocabulary arrays throws in strict mode", () => {
  const frozen = [
    VERIFICATION_STAGES,
    VERIFICATION_COST_CLASSES,
    VERIFICATION_WORKING_DIRECTORY_POLICIES,
    VERIFICATION_COMMAND_STATUSES,
    VERIFICATION_VERDICTS,
    VERIFICATION_STAGE_REQUESTS,
  ];
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

function computePlanDigest() {
  const fixture = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      { id: "lint", stage: "fast", executable: "npm", args: ["run", "lint"], workingDirectoryPolicy: "candidate-root", workingDirectory: null, timeoutMs: 30000, stopOnFailure: false, costClass: "cheap" },
    ],
  };
  const canon = canonicalizeVerificationPlan(fixture);
  return createHash("sha256").update(canon).digest("hex");
}

function computeReceiptDigest(planDigest) {
  const fixture = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "full",
    results: [
      { commandId: "lint", status: "passed", exitCode: 0, signal: null, startedAt: "2025-01-01T00:00:00Z", endedAt: "2025-01-01T00:00:01Z", stdout: null, stderr: null, skipReason: null },
    ],
    verdict: "pass",
  };
  const canon = canonicalizeVerificationReceipt(fixture);
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