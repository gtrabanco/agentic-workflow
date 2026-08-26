import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  validateVerificationPlanV1,
  validateVerificationReceiptV1,
  deriveVerificationVerdict,
  compareVerificationReceiptToCurrent,
  digestVerificationPlan,
} from "../dist/index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePlan(commands) {
  return { contract: VERIFICATION_PLAN_CONTRACT_ID, commands };
}

function makePlanCommand(opts = {}) {
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

function makeResult(cmdId, status, opts = {}) {
  // D4 matrix: passed/failed need exactly one of exitCode/signal;
  // timed-out: exitCode null, signal nullable; infra-error: both null; skipped: both null
  let exitCode = undefined;
  let signal = undefined;
  if (opts.hasOwnProperty("exitCode")) exitCode = opts.exitCode;
  if (opts.hasOwnProperty("signal")) signal = opts.signal;
  // Set defaults only if neither was provided
  if (exitCode === undefined && signal === undefined) {
    switch (status) {
      case "passed": exitCode = 0; signal = null; break;
      case "failed": exitCode = 1; signal = null; break;
      case "timed-out": exitCode = null; signal = "SIGTERM"; break;
      case "infrastructure-error": exitCode = null; signal = null; break;
      case "skipped": exitCode = null; signal = null; break;
    }
  }
  // Ensure both fields are present (even if null/undefined in opts)
  if (exitCode === undefined) exitCode = null;
  if (signal === undefined) signal = null;
  return {
    commandId: cmdId,
    status,
    exitCode,
    signal,
    startedAt: opts.startedAt || "2025-01-01T00:00:00Z",
    endedAt: opts.endedAt || "2025-01-01T00:00:01Z",
    stdout: opts.stdout || null,
    stderr: opts.stderr || null,
    skipReason: opts.skipReason ?? (status === "skipped" ? null : null),
  };
}

// ---------------------------------------------------------------------------
// Fast success + fast fail-fast scenarios
// ---------------------------------------------------------------------------

test("scenario: fast success — plan fast only, all passed → verdict pass", async () => {
  const plan = makePlan([
    makePlanCommand({ id: "lint", stage: "fast" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "fast",
    results: [makeResult("lint", "passed")],
    verdict: "pass",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "pass");
});

test("scenario: fast fail-fast — lint failed → verdict fail", async () => {
  const plan = makePlan([
    makePlanCommand({ id: "lint", stage: "fast", stopOnFailure: true }),
    makePlanCommand({ id: "test", stage: "fast" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "fast",
    results: [
      makeResult("lint", "failed"),
      // test is skipped because lint failed with stopOnFailure
      makeResult("test", "skipped", { skipReason: "lint" }),
    ],
    verdict: "fail",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "fail");
});

// ---------------------------------------------------------------------------
// Full success + full fail-fast with D3 skip attribution
// ---------------------------------------------------------------------------

test("scenario: full success — all passed → verdict pass", async () => {
  const plan = makePlan([
    makePlanCommand({ id: "lint", stage: "fast" }),
    makePlanCommand({ id: "build", stage: "full" }),
    makePlanCommand({ id: "test", stage: "full" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "full",
    results: [
      makeResult("lint", "passed"),
      makeResult("build", "passed"),
      makeResult("test", "passed"),
    ],
    verdict: "pass",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "pass");
});

test("scenario: full fail-fast — build failed, test skipped with D3 attribution", async () => {
  const plan = makePlan([
    makePlanCommand({ id: "lint", stage: "fast" }),
    makePlanCommand({ id: "build", stage: "full", stopOnFailure: true }),
    makePlanCommand({ id: "test", stage: "full" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "full",
    results: [
      makeResult("lint", "passed"),
      makeResult("build", "failed"),
      makeResult("test", "skipped", { skipReason: "build" }),
    ],
    verdict: "fail",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "fail");
});

// ---------------------------------------------------------------------------
// Timeout + infrastructure-error: distinct statuses, verdict fail
// ---------------------------------------------------------------------------

test("scenario: timeout — distinct from failure, verdict fail", async () => {
  const plan = makePlan([makePlanCommand({ id: "test", stage: "full" })]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "full",
    results: [makeResult("test", "timed-out", { signal: "SIGTERM" })],
    verdict: "fail",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "fail");
});

test("scenario: infrastructure-error — distinct from failure, verdict fail", async () => {
  const plan = makePlan([makePlanCommand({ id: "test", stage: "full" })]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "full",
    results: [makeResult("test", "infrastructure-error", { exitCode: null, signal: null })],
    verdict: "fail",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "fail");
});

// ---------------------------------------------------------------------------
// Skipped-with-reason vs skipped-without-reason
// ---------------------------------------------------------------------------

test("scenario: skipped with valid reason → fail (not incomplete)", async () => {
  const plan = makePlan([
    makePlanCommand({ id: "lint", stage: "fast", stopOnFailure: true }),
    makePlanCommand({ id: "test", stage: "fast" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "fast",
    results: [
      makeResult("lint", "failed"),
      makeResult("test", "skipped", { skipReason: "lint" }),
    ],
    verdict: "fail",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "fail");
});

test("scenario: skipped without reason → incomplete", async () => {
  const plan = makePlan([makePlanCommand({ id: "lint", stage: "fast" })]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "fast",
    results: [makeResult("lint", "skipped", { skipReason: null })],
    verdict: "pass",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "incomplete");
});

// ---------------------------------------------------------------------------
// Missing results + coverage gap
// ---------------------------------------------------------------------------

test("scenario: missing results → incomplete-missing-results", async () => {
  const plan = makePlan([
    makePlanCommand({ id: "lint", stage: "fast" }),
    makePlanCommand({ id: "test", stage: "fast" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "fast",
    results: [makeResult("lint", "passed")], // test missing
    verdict: "pass",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "incomplete");
  const freshness = await compareVerificationReceiptToCurrent(receipt, plan, "a".repeat(64), "b".repeat(64));
  assert.deepStrictEqual(freshness, { fresh: false, reasonCode: "incomplete-missing-results" });
});

test("scenario: requested-full coverage gap → incomplete-missing-results (D1 order)", async () => {
  // A full receipt that does not cover every declared command returns
  // incomplete-missing-results (checked first per SPEC D1 order before
  // incomplete-unjustified-skip → incomplete-stage-coverage).
  const plan = makePlan([
    makePlanCommand({ id: "lint", stage: "fast" }),
    makePlanCommand({ id: "deploy", stage: "full" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "full",
    results: [
      makeResult("lint", "passed"),
      // Missing deploy (full) command → missing-results
    ],
    verdict: "pass",
  };
  // deriveVerificationVerdict checks full required set (all commands) → incomplete
  assert.equal(deriveVerificationVerdict(receipt, plan), "incomplete");
  const freshness = await compareVerificationReceiptToCurrent(receipt, plan, "a".repeat(64), "b".repeat(64));
  assert.deepStrictEqual(freshness, { fresh: false, reasonCode: "incomplete-missing-results" });
});

// ---------------------------------------------------------------------------
// D9 — Vacuous fast stage
// ---------------------------------------------------------------------------

test("scenario: vacuous fast (no fast commands, fast receipt) → pass", async () => {
  const plan = makePlan([
    makePlanCommand({ id: "deploy", stage: "full" }),
  ]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "fast",
    results: [],
    verdict: "pass",
  };
  assert.equal(deriveVerificationVerdict(receipt, plan), "pass");
});

// ---------------------------------------------------------------------------
// Stale scenarios
// ---------------------------------------------------------------------------

test("scenario: stale candidate snapshot", async () => {
  const plan = makePlan([makePlanCommand({ id: "lint", stage: "fast" })]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64), // mismatch
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "fast",
    results: [makeResult("lint", "passed")],
    verdict: "pass",
  };
  const freshness = await compareVerificationReceiptToCurrent(receipt, plan, "c".repeat(64), "b".repeat(64));
  assert.deepStrictEqual(freshness, { fresh: false, reasonCode: "stale-candidate-snapshot" });
});

test("scenario: stale acceptance fingerprint", async () => {
  const plan = makePlan([makePlanCommand({ id: "lint", stage: "fast" })]);
  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64), // valid hex, differs from the current value below
    stageRequested: "fast",
    results: [makeResult("lint", "passed")],
    verdict: "pass",
  };
  const freshness = await compareVerificationReceiptToCurrent(receipt, plan, "a".repeat(64), "c".repeat(64));
  assert.deepStrictEqual(freshness, { fresh: false, reasonCode: "stale-acceptance-fingerprint" });
});

test("scenario: stale plan", async () => {
  const plan = makePlan([makePlanCommand({ id: "lint", stage: "fast" })]);
  await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "c".repeat(64), // valid hex, differs from digestVerificationPlan(plan)
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "fast",
    results: [makeResult("lint", "passed")],
    verdict: "pass",
  };
  const freshness = await compareVerificationReceiptToCurrent(receipt, plan, "a".repeat(64), "b".repeat(64));
  assert.deepStrictEqual(freshness, { fresh: false, reasonCode: "stale-plan" });
});

// ---------------------------------------------------------------------------
// Path-traversal + duplicate-id rejection through full pipeline
// ---------------------------------------------------------------------------

test("scenario: path traversal rejected in plan validation", () => {
  const plan = makePlan([
    makePlanCommand({ id: "cmd1", stage: "fast", workingDirectoryPolicy: "relative-path", workingDirectory: "../parent" }),
  ]);
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("..") || e.includes("travers")), result.errors.join(", "));
});

test("scenario: duplicate command id rejected in plan validation", () => {
  const plan = makePlan([
    makePlanCommand({ id: "dup", stage: "fast" }),
    makePlanCommand({ id: "dup", stage: "full" }),
  ]);
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("duplicate")), result.errors.join(", "));
});

test("scenario: validate → canonicalize → digest → compare pipeline works end-to-end", async () => {
  const plan = makePlan([
    makePlanCommand({ id: "lint", stage: "fast" }),
    makePlanCommand({ id: "test", stage: "full" }),
  ]);
  const planResult = validateVerificationPlanV1(plan);
  assert.equal(planResult.ok, true);

  const planDigest = await digestVerificationPlan(plan);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "full",
    results: [
      makeResult("lint", "passed"),
      makeResult("test", "passed"),
    ],
    verdict: "pass",
  };
  const receiptResult = validateVerificationReceiptV1(receipt);
  assert.equal(receiptResult.ok, true);

  const verdict = deriveVerificationVerdict(receipt, plan);
  assert.equal(verdict, "pass");

  const freshness = await compareVerificationReceiptToCurrent(receipt, plan, "a".repeat(64), "b".repeat(64));
  assert.deepStrictEqual(freshness, { fresh: true });
});