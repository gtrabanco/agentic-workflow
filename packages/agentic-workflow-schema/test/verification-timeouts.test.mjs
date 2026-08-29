// P12 / AC10 + D14 — command timeout ceilings and aggregate stage budgets.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv from "ajv";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  VERIFICATION_LIMITS,
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  digestVerificationPlan,
} from "../dist/index.js";
import {
  assertDiagnosticAt,
  assertDiagnosticOn,
  assertOnlyDiagnostic,
  describeDiagnostics,
} from "./fixtures/verification-diagnostics.mjs";

const MINUTE = 60_000;

function command(overrides = {}) {
  return {
    id: "cmd",
    stage: "fast",
    executable: "npm",
    args: ["test"],
    workingDirectoryPolicy: "candidate-root",
    workingDirectory: null,
    timeoutMs: MINUTE,
    stopOnFailure: false,
    costClass: "cheap",
    ...overrides,
  };
}

const planOf = (commands) => ({ contract: VERIFICATION_PLAN_CONTRACT_ID, commands });
const row = (commandId) => ({
  commandId,
  status: "passed",
  exitCode: 0,
  signal: null,
  startedAt: "2025-01-01T00:00:00Z",
  endedAt: "2025-01-01T00:00:01Z",
  stdout: null,
  stderr: null,
  skipReason: null,
});

/** Ajv-compiled structural projection — the parity half of AC10. */
const projection = (() => {
  const schema = JSON.parse(
    readFileSync(new URL("../verification-plan.schema.json", import.meta.url), "utf8"),
  );
  return new Ajv({ strict: true }).compile(schema);
})();
const projectionOk = (value) => projection(structuredClone(value)) === true;

// ---------------------------------------------------------------------------
// Metadata (task: export frozen timeout-limit metadata)
// ---------------------------------------------------------------------------

test("the D14 timeout ceilings are published once, in milliseconds", () => {
  assert.equal(VERIFICATION_LIMITS.fastCommandTimeoutMs, 10 * MINUTE);
  assert.equal(VERIFICATION_LIMITS.fastStageTimeoutMs, 15 * MINUTE);
  assert.equal(VERIFICATION_LIMITS.fullCommandTimeoutMs, 60 * MINUTE);
  assert.equal(VERIFICATION_LIMITS.fullStageTimeoutMs, 120 * MINUTE);
  assert.ok(Object.isFrozen(VERIFICATION_LIMITS));
  // Each stage budget must admit at least one command at its own ceiling, and the
  // fast pair is deliberately tight: D14's 10/15 min means one 10-minute fast
  // command leaves 5 minutes for the rest of the stage.
  assert.ok(VERIFICATION_LIMITS.fastStageTimeoutMs >= VERIFICATION_LIMITS.fastCommandTimeoutMs);
  assert.ok(VERIFICATION_LIMITS.fullStageTimeoutMs >= VERIFICATION_LIMITS.fullCommandTimeoutMs);
  assert.equal(VERIFICATION_LIMITS.fullStageTimeoutMs, 2 * VERIFICATION_LIMITS.fullCommandTimeoutMs,
    "the full stage fits exactly two maximum-length commands");
});

// ---------------------------------------------------------------------------
// Per-command ceilings (boundary pairs)
// ---------------------------------------------------------------------------

test("fast command timeout: exactly 10 min accepted, 1 ms over refused", () => {
  const at = planOf([command({ timeoutMs: VERIFICATION_LIMITS.fastCommandTimeoutMs })]);
  assert.equal(validateVerificationPlanV1(at).ok, true, describeDiagnostics(validateVerificationPlanV1(at)));
  assertOnlyDiagnostic(
    validateVerificationPlanV1(planOf([command({ timeoutMs: VERIFICATION_LIMITS.fastCommandTimeoutMs + 1 })])),
    "limit-exceeded", "/commands/0/timeoutMs",
  );
});

test("full command timeout: exactly 60 min accepted, 1 ms over refused", () => {
  const at = planOf([command({ stage: "full", timeoutMs: VERIFICATION_LIMITS.fullCommandTimeoutMs })]);
  assert.equal(validateVerificationPlanV1(at).ok, true, describeDiagnostics(validateVerificationPlanV1(at)));
  assertOnlyDiagnostic(
    validateVerificationPlanV1(planOf([command({ stage: "full", timeoutMs: VERIFICATION_LIMITS.fullCommandTimeoutMs + 1 })])),
    "limit-exceeded", "/commands/0/timeoutMs",
  );
});

test("the fast ceiling is stage-scoped: 11 min is fine for a full command", () => {
  const eleven = 11 * MINUTE;
  assert.equal(validateVerificationPlanV1(planOf([command({ stage: "full", timeoutMs: eleven })])).ok, true);
  assertDiagnosticOn(validateVerificationPlanV1(planOf([command({ stage: "fast", timeoutMs: eleven })])),
    "limit-exceeded", "timeoutMs");
});

test("each command answers for its own ceiling, the stage budget for its sum", () => {
  const over = VERIFICATION_LIMITS.fastCommandTimeoutMs + 1;
  const result = validateVerificationPlanV1(planOf([
    command({ id: "a", timeoutMs: over }),
    command({ id: "b", timeoutMs: MINUTE }),
    command({ id: "c", timeoutMs: over }),
  ]));
  assertDiagnosticAt(result, "limit-exceeded", "/commands/0/timeoutMs");
  assertDiagnosticAt(result, "limit-exceeded", "/commands/2/timeoutMs");
  // 600001 + 60000 + 600001 = 1,260,002 ms, so the 900,000 ms fast-stage budget is
  // also broken — a different rule, reported as its own row at the crossing point.
  assertDiagnosticAt(result, "budget-exceeded", "/commands/2/timeoutMs");
  assert.equal(result.diagnostics.length, 3, "the in-budget sibling stays silent");
});

// ---------------------------------------------------------------------------
// Aggregate stage budgets (boundary pairs)
// ---------------------------------------------------------------------------

test("fast aggregate budget: exactly 15 min accepted, 1 ms over refused", () => {
  const half = VERIFICATION_LIMITS.fastStageTimeoutMs / 2;
  assert.equal(validateVerificationPlanV1(planOf([
    command({ id: "a", timeoutMs: half }),
    command({ id: "b", timeoutMs: half }),
  ])).ok, true);
  assertDiagnosticAt(
    validateVerificationPlanV1(planOf([
      command({ id: "a", timeoutMs: half }),
      command({ id: "b", timeoutMs: half + 1 }),
    ])),
    "budget-exceeded", "/commands/1/timeoutMs",
  );
});

test("full aggregate budget: exactly 2 h accepted, 1 ms over refused", () => {
  const third = VERIFICATION_LIMITS.fullStageTimeoutMs / 3;
  assert.equal(validateVerificationPlanV1(planOf(
    ["a", "b", "c"].map((id) => command({ id, stage: "full", timeoutMs: third })),
  )).ok, true);
  assertDiagnosticAt(
    validateVerificationPlanV1(planOf([
      command({ id: "a", stage: "full", timeoutMs: third }),
      command({ id: "b", stage: "full", timeoutMs: third }),
      command({ id: "c", stage: "full", timeoutMs: third + 1 }),
    ])),
    "budget-exceeded", "/commands/2/timeoutMs",
  );
});

test("the budget row names the command that crossed, not the whole list", () => {
  const each = 400_000; // 400k, 800k, 1.2M → the third command crosses 900k
  assert.ok(each < VERIFICATION_LIMITS.fastCommandTimeoutMs, "each command is individually in budget");
  assertDiagnosticAt(
    validateVerificationPlanV1(planOf(["a", "b", "c"].map((id) => command({ id, timeoutMs: each })))),
    "budget-exceeded", "/commands/2/timeoutMs",
  );
});

test("stage budgets are per-stage: a full plan of 15-min fast work is legal", () => {
  const fastTotal = VERIFICATION_LIMITS.fastStageTimeoutMs; // exactly the fast budget
  const fullTotal = VERIFICATION_LIMITS.fullStageTimeoutMs; // exactly the full budget
  const plan = planOf([
    command({ id: "f1", timeoutMs: fastTotal / 2 }),
    command({ id: "f2", timeoutMs: fastTotal / 2 }),
    command({ id: "u1", stage: "full", timeoutMs: fullTotal / 3 }),
    command({ id: "u2", stage: "full", timeoutMs: fullTotal / 3 }),
    command({ id: "u3", stage: "full", timeoutMs: fullTotal / 3 }),
  ]);
  // 16.5 min of declared work in total — over one budget, inside each stage's own.
  assert.ok(fastTotal + fullTotal > VERIFICATION_LIMITS.fastStageTimeoutMs);
  assert.equal(validateVerificationPlanV1(plan).ok, true, describeDiagnostics(validateVerificationPlanV1(plan)));
});

test("the plan budget propagates through the receipt authority", async () => {
  const pv = validateVerificationPlanV1(planOf([command({ id: "solo" })]));
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: await digestVerificationPlan(pv.plan),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [row("solo")],
    verdict: "pass",
  };
  const overBudgetPlan = planOf([
    command({ id: "a", timeoutMs: VERIFICATION_LIMITS.fastCommandTimeoutMs }),
    command({ id: "b", timeoutMs: VERIFICATION_LIMITS.fastCommandTimeoutMs }),
  ]);
  const result = await validateVerificationReceiptAgainstPlan(receipt, overBudgetPlan);
  assertOnlyDiagnostic(result, "budget-exceeded", "/commands/1/timeoutMs", "over-budget plan bound to a receipt");
});

// ---------------------------------------------------------------------------
// Projection parity (task: project command ceilings, disclose aggregate sums)
// ---------------------------------------------------------------------------

test("the projection carries both command ceilings, including the stage condition", () => {
  const schema = JSON.parse(
    readFileSync(new URL("../verification-plan.schema.json", import.meta.url), "utf8"),
  );
  const timeout = schema.$defs.VerificationCommandV1.properties.timeoutMs;
  assert.equal(timeout.maximum, VERIFICATION_LIMITS.fullCommandTimeoutMs, "the loose ceiling is the field maximum");
  const condition = JSON.stringify(schema.$defs.VerificationCommandV1);
  assert.ok(
    condition.includes(String(VERIFICATION_LIMITS.fastCommandTimeoutMs)),
    `the fast ceiling is projected too: ${condition.slice(0, 400)}`,
  );
  // The sums cannot be expressed in Draft-07, so they are disclosed instead.
  assert.match(schema.$comment, /unique-command-ids/);
  assert.match(schema.$comment, /fast-stage-aggregate-budget/);
  assert.match(schema.$comment, /full-stage-aggregate-budget/);
});

test("projection and authoritative validator agree on every timeout boundary", () => {
  const boundaries = [
    ["fast", VERIFICATION_LIMITS.fastCommandTimeoutMs - 1],
    ["fast", VERIFICATION_LIMITS.fastCommandTimeoutMs],
    ["fast", VERIFICATION_LIMITS.fastCommandTimeoutMs + 1],
    ["fast", VERIFICATION_LIMITS.fullCommandTimeoutMs - 1],
    ["fast", VERIFICATION_LIMITS.fullCommandTimeoutMs],
    ["full", VERIFICATION_LIMITS.fullCommandTimeoutMs - 1],
    ["full", VERIFICATION_LIMITS.fullCommandTimeoutMs],
    ["full", VERIFICATION_LIMITS.fullCommandTimeoutMs + 1],
  ];
  for (const [stage, timeoutMs] of boundaries) {
    // One command per payload: the aggregate budget must not shadow the ceiling.
    const value = planOf([command({ id: "only", stage, timeoutMs })]);
    const runtime = validateVerificationPlanV1(value);
    assert.equal(
      projectionOk(value),
      runtime.ok,
      `${stage}@${timeoutMs}: projection said ${projectionOk(value)}, validator said ${runtime.ok} [${describeDiagnostics(runtime)}]`,
    );
    if (!runtime.ok) assertDiagnosticOn(runtime, "limit-exceeded", "timeoutMs", `${stage}@${timeoutMs}`);
  }
});
