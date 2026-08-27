// P9 — verification semantics: complete `stopOnFailure` sequencing + attribution
// (F65, SPEC S4/D3/AC2) and the AC5 authoritative-entry + determinism evidence
// for the published canonical vectors (F72).
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
import { planVector, receiptVector } from "./fixtures/verification-vectors.mjs";

function command(id, stage, stopOnFailure) {
  return {
    id,
    stage,
    executable: "npm",
    args: ["test"],
    workingDirectoryPolicy: "candidate-root",
    workingDirectory: null,
    timeoutMs: 30000,
    stopOnFailure,
    costClass: "cheap",
  };
}

// Declared order: lint (fast, stops) → test (fast) → build (fast) → deploy (full).
const PLAN = {
  contract: VERIFICATION_PLAN_CONTRACT_ID,
  commands: [command("lint", "fast", true), command("test", "fast", false), command("build", "fast", false), command("deploy", "full", true)],
};

function row(commandId, status, skipReason = null) {
  const ran = status === "passed" || status === "failed";
  return {
    commandId,
    status,
    exitCode: ran ? (status === "passed" ? 0 : 1) : null,
    signal: null,
    startedAt: "2025-01-01T00:00:00Z",
    endedAt: "2025-01-01T00:00:01Z",
    stdout: null,
    stderr: null,
    skipReason,
  };
}

async function receiptFor(results, verdict, stageRequested = "full") {
  return {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: await digestVerificationPlan(PLAN),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested,
    results,
    verdict,
  };
}

// ---------------------------------------------------------------------------
// F65 — valid fail-fast chains
// ---------------------------------------------------------------------------

test("accepts the canonical fail-fast chain: every later row skipped with the trigger id", async () => {
  const receipt = await receiptFor(
    [
      row("lint", "failed"),
      row("test", "skipped", "lint"),
      row("build", "skipped", "lint"),
      row("deploy", "skipped", "lint"),
    ],
    "fail",
  );
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true, describeDiagnostics(result));
  assert.equal(deriveVerificationVerdict(receipt, PLAN), "fail");
});

test("accepts a chain that stops early — a later command with NO row stays representable", async () => {
  // D7: missing rows are not a schema error; they surface as incompleteness.
  const receipt = await receiptFor(
    [row("lint", "failed"), row("test", "skipped", "lint")],
    "incomplete",
  );
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true, describeDiagnostics(result));
});

test("accepts a non-passed row after a failing command that does NOT stop on failure", async () => {
  // `test`/`build` declare stopOnFailure: false, so a run may keep going; only a
  // trigger (non-passed row of a stopOnFailure command) freezes the rest.
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [command("lint", "fast", false), command("test", "fast", false)],
  };
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: await digestVerificationPlan(plan),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [row("lint", "failed"), row("test", "passed")],
    verdict: "fail",
  };
  const result = await validateVerificationReceiptAgainstPlan(receipt, plan);
  assert.equal(result.ok, true, describeDiagnostics(result));
});

// ---------------------------------------------------------------------------
// F65 — sequencing violations (red before this phase: all four were accepted)
// ---------------------------------------------------------------------------

test("rejects a passed row that ran after the stopOnFailure trigger", async () => {
  const receipt = await receiptFor(
    [row("lint", "failed"), row("test", "passed"), row("build", "skipped", "lint"), row("deploy", "skipped", "lint")],
    "fail",
  );
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false, "a row after the stop cannot have executed");
  assertDiagnosticOn(result, "invalid-fail-fast", "status");
});

test("rejects a second non-passed row after the trigger — the run already stopped", async () => {
  const receipt = await receiptFor(
    [row("lint", "failed"), row("test", "failed"), row("build", "skipped", "lint"), row("deploy", "skipped", "lint")],
    "fail",
  );
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, false);
  assertDiagnosticOn(result, "invalid-fail-fast", "status");
});

test("rejects timed-out and infrastructure-error rows after the trigger", async () => {
  for (const status of ["timed-out", "infrastructure-error"]) {
    const receipt = await receiptFor(
      [row("lint", "failed"), row("test", status), row("build", "skipped", "lint"), row("deploy", "skipped", "lint")],
      "fail",
    );
    const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
    assert.equal(result.ok, false, `${status} after the stop must be rejected`);
  }
});

test("rejects a skipped row after the trigger attributed to another command", async () => {
  // The receipt below was ACCEPTED before F65: `test` is earlier than `build`,
  // non-passed and stopOnFailure, so D3's per-row check approved `build`'s reason —
  // but the run stopped at `lint`, so `test` never ran and cannot be the reason.
  const plan = {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [command("lint", "fast", true), command("test", "fast", true), command("build", "fast", false), command("deploy", "full", false)],
  };
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: await digestVerificationPlan(plan),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [
      row("lint", "failed"),
      row("test", "failed"),          // ran after the stop -> sequencing violation
      row("build", "skipped", "test"), // attributed to a command that never ran
      row("deploy", "skipped", "lint"),
    ],
    verdict: "fail",
  };
  const result = await validateVerificationReceiptAgainstPlan(receipt, plan);
  assert.equal(result.ok, false, describeDiagnostics(result));
  assertDiagnosticOn(result, "invalid-fail-fast", "skipReason");
});

test("an unattributed skip after the trigger stays valid but incomplete (D3 null rule)", async () => {
  // D3: a skipped row MAY carry null and then yields verdict `incomplete` — the
  // sequencing rule must not turn a representable gap into an invalid receipt.
  const receipt = await receiptFor(
    [row("lint", "failed"), row("test", "skipped"), row("build", "skipped", "lint"), row("deploy", "skipped", "lint")],
    "incomplete",
  );
  const result = await validateVerificationReceiptAgainstPlan(receipt, PLAN);
  assert.equal(result.ok, true, describeDiagnostics(result));
});

test("a timeout is a trigger too — later rows must be skipped with its id", async () => {
  const timedOut = await receiptFor(
    [row("lint", "timed-out"), row("test", "skipped", "lint"), row("build", "skipped", "lint"), row("deploy", "skipped", "lint")],
    "fail",
  );
  assert.equal((await validateVerificationReceiptAgainstPlan(timedOut, PLAN)).ok, true);

  // Self-attribution (`test` naming itself) is not the trigger id.
  const drifted = { ...timedOut, results: [row("lint", "timed-out"), row("test", "skipped", "test"), ...timedOut.results.slice(2)] };
  const bad = await validateVerificationReceiptAgainstPlan(drifted, PLAN);
  assert.equal(bad.ok, false, "self-attribution must be rejected");
});

// ---------------------------------------------------------------------------
// F72 — AC5: authoritative entries + determinism on the published vectors
// ---------------------------------------------------------------------------

test("both published vectors pass their authoritative public entries", async () => {
  const plan = planVector();
  const planRes = validateVerificationPlanV1(plan);
  assert.equal(planRes.ok, true, "plan vector must pass the sole plan entry");

  const receipt = receiptVector(await digestVerificationPlan(planRes.plan));
  const receiptRes = await validateVerificationReceiptAgainstPlan(receipt, planRes.plan);
  assert.equal(receiptRes.ok, true, "receipt vector must pass the sole receipt entry");
  assert.equal(receiptRes.receipt.verdict, "pass");
});

test("vector payloads are the ones the published digests lock", async () => {
  assert.equal(VERIFICATION_CANONICAL_VECTORS[0].digest, await digestVerificationPlan(planVector()));
  assert.equal(VERIFICATION_CANONICAL_VECTORS[1].digest, await digestVerificationReceipt(receiptVector(await digestVerificationPlan(planVector()))));
});

test("repeated canonicalize, digest and verdict calls are deeply equal", async () => {
  const plan = planVector();
  const receipt = receiptVector(await digestVerificationPlan(plan));

  assert.deepStrictEqual(canonicalizeVerificationPlan(plan), canonicalizeVerificationPlan(plan));
  assert.deepStrictEqual(canonicalizeVerificationReceipt(receipt), canonicalizeVerificationReceipt(receipt));
  assert.deepStrictEqual(await digestVerificationPlan(plan), await digestVerificationPlan(plan));
  assert.deepStrictEqual(await digestVerificationReceipt(receipt), await digestVerificationReceipt(receipt));
  assert.deepStrictEqual(deriveVerificationVerdict(receipt, plan), deriveVerificationVerdict(receipt, plan));
  assert.deepStrictEqual(deriveVerificationVerdict(receipt, plan), "pass");
});

test("repeated freshness comparisons are deeply equal", async () => {
  const plan = planVector();
  const receipt = receiptVector(await digestVerificationPlan(plan));
  const first = await compareVerificationReceiptToCurrent(receipt, plan, "a".repeat(64), "b".repeat(64));
  const second = await compareVerificationReceiptToCurrent(receipt, plan, "a".repeat(64), "b".repeat(64));
  assert.deepStrictEqual(second, first);
  assert.deepStrictEqual(first, { fresh: true });
});

test("canonical calls do not mutate the submitted vectors", async () => {
  const plan = planVector();
  const receipt = receiptVector(await digestVerificationPlan(plan));
  const planBefore = JSON.parse(JSON.stringify(plan));
  const receiptBefore = JSON.parse(JSON.stringify(receipt));
  canonicalizeVerificationPlan(plan);
  canonicalizeVerificationReceipt(receipt);
  await digestVerificationPlan(plan);
  await digestVerificationReceipt(receipt);
  await deriveVerificationVerdict(receipt, plan);
  assert.deepStrictEqual(plan, planBefore);
  assert.deepStrictEqual(receipt, receiptBefore);
});
