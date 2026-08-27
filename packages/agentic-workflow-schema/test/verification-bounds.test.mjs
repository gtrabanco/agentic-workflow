// P10 / AC10 / D14 — shape bounds: every cardinality and string ceiling at the
// exact limit and one unit beyond. Bounds are declared ONCE in the canonical
// definition (`src/verification-contract.ts`) and published as the frozen
// `VERIFICATION_LIMITS` metadata; the Draft-07 files are projections of them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  VERIFICATION_LIMITS,
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  digestVerificationPlan,
} from "../dist/index.js";

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function command(overrides = {}) {
  return {
    id: "cmd",
    stage: "fast",
    executable: "npm",
    args: ["test"],
    workingDirectoryPolicy: "candidate-root",
    workingDirectory: null,
    timeoutMs: 30000,
    stopOnFailure: false,
    costClass: "cheap",
    ...overrides,
  };
}

const plan = (commands) => ({ contract: VERIFICATION_PLAN_CONTRACT_ID, commands });

function commands(n, prefix = "cmd") {
  return Array.from({ length: n }, (_, i) => command({ id: `${prefix}-${i}` }));
}

async function fullReceiptFor(validPlan, rows) {
  return {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: await digestVerificationPlan(validPlan),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: rows,
    verdict: "pass",
  };
}

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

/** Every ceiling must be reported by the rule that owns it, not by luck. */
function assertRejected(result, expectedText, label) {
  assert.equal(result.ok, false, `${label} must be rejected`);
  assert.ok(
    result.errors.some((e) => e.includes(expectedText)),
    `${label}: no error mentioned "${expectedText}" — got ${result.errors.join(" | ")}`,
  );
}

// ---------------------------------------------------------------------------
// Cardinality ceilings: commands, results, args per command
// ---------------------------------------------------------------------------

test("commands: exactly VERIFICATION_LIMITS.commands (128) is accepted", async () => {
  const p = plan(commands(VERIFICATION_LIMITS.commands));
  assert.equal(validateVerificationPlanV1(p).ok, true);
});

test("commands: one beyond the ceiling is rejected (129)", async () => {
  const res = validateVerificationPlanV1(plan(commands(VERIFICATION_LIMITS.commands + 1)));
  assertRejected(res, `at most ${VERIFICATION_LIMITS.commands}`, "129 commands");
});

test("results: exactly the ceiling is accepted through the receipt entry", async () => {
  const p = plan(commands(VERIFICATION_LIMITS.results));
  const pv = validateVerificationPlanV1(p);
  assert.equal(pv.ok, true);
  const rows = pv.plan.commands.map((c) => row(c.id));
  const res = await validateVerificationReceiptAgainstPlan(await fullReceiptFor(pv.plan, rows), pv.plan);
  assert.equal(res.ok, true, (res.errors || []).join(" | "));
});

test("results: one beyond the ceiling is rejected by the structural bound (129)", async () => {
  const p = plan([command({ id: "solo" })]);
  const pv = validateVerificationPlanV1(p);
  const rows = Array.from({ length: VERIFICATION_LIMITS.results + 1 }, () => row("solo"));
  const res = await validateVerificationReceiptAgainstPlan(await fullReceiptFor(pv.plan, rows), pv.plan);
  assertRejected(res, `at most ${VERIFICATION_LIMITS.results}`, "129 results");
});

test("args: exactly argsPerCommand (64) is accepted, one beyond (65) is rejected", async () => {
  const at = command({ args: Array.from({ length: VERIFICATION_LIMITS.argsPerCommand }, (_, i) => `a${i}`) });
  assert.equal(validateVerificationPlanV1(plan([at])).ok, true);
  const over = command({ args: Array.from({ length: VERIFICATION_LIMITS.argsPerCommand + 1 }, (_, i) => `a${i}`) });
  assertRejected(validateVerificationPlanV1(plan([over])), `at most ${VERIFICATION_LIMITS.argsPerCommand} items`, "65 args");
});

// ---------------------------------------------------------------------------
// String ceilings: ids, executable, working directory, single argument
// ---------------------------------------------------------------------------

test("id: 128 chars accepted, 129 rejected (D14 idChars)", async () => {
  const at = "x".repeat(VERIFICATION_LIMITS.idChars);
  const over = "x".repeat(VERIFICATION_LIMITS.idChars + 1);
  assert.equal(validateVerificationPlanV1(plan([command({ id: at })])).ok, true);
  assertRejected(validateVerificationPlanV1(plan([command({ id: over })])), `${VERIFICATION_LIMITS.idChars} characters`, "129-char id");
});

test("commandId: bounded by the same idChars ceiling as plan ids", async () => {
  const at = "x".repeat(VERIFICATION_LIMITS.idChars);
  const pv = validateVerificationPlanV1(plan([command({ id: at })]));
  assert.equal(pv.ok, true);
  assert.equal((await validateVerificationReceiptAgainstPlan(await fullReceiptFor(pv.plan, [row(at)]), pv.plan)).ok, true);

  const p2 = validateVerificationPlanV1(plan([command({ id: "ok" })]));
  const over = "x".repeat(VERIFICATION_LIMITS.idChars + 1);
  const res = await validateVerificationReceiptAgainstPlan(await fullReceiptFor(p2.plan, [row(over)]), p2.plan);
  assertRejected(res, `${VERIFICATION_LIMITS.idChars} characters`, "129-char commandId");
});

test("executable: 1024 chars accepted, 1025 rejected (D14 pathChars)", async () => {
  const at = command({ executable: "/usr/bin/tool".padEnd(VERIFICATION_LIMITS.pathChars, "x") });
  assert.equal(validateVerificationPlanV1(plan([at])).ok, true);
  const over = command({ executable: "/usr/bin/tool".padEnd(VERIFICATION_LIMITS.pathChars + 1, "x") });
  assertRejected(validateVerificationPlanV1(plan([over])), `${VERIFICATION_LIMITS.pathChars} characters`, "1025-char executable");
});

test("workingDirectory: 1024 chars accepted, 1025 rejected (D14 pathChars)", async () => {
  const rel = (n) => "a".repeat(n);
  const at = command({ workingDirectoryPolicy: "relative-path", workingDirectory: rel(VERIFICATION_LIMITS.pathChars) });
  assert.equal(validateVerificationPlanV1(plan([at])).ok, true);
  const over = command({ workingDirectoryPolicy: "relative-path", workingDirectory: rel(VERIFICATION_LIMITS.pathChars + 1) });
  assertRejected(validateVerificationPlanV1(plan([over])), `${VERIFICATION_LIMITS.pathChars} characters`, "1025-char workingDirectory");
});

test("arg: 4096 chars accepted, 4097 rejected, NUL still rejected (D14 argChars)", async () => {
  const at = command({ args: ["x".repeat(VERIFICATION_LIMITS.argChars)] });
  assert.equal(validateVerificationPlanV1(plan([at])).ok, true);
  const over = command({ args: ["x".repeat(VERIFICATION_LIMITS.argChars + 1)] });
  assertRejected(validateVerificationPlanV1(plan([over])), `${VERIFICATION_LIMITS.argChars} characters`, "4097-char arg");
  assertRejected(validateVerificationPlanV1(plan([command({ args: ["bad\0arg"] })])), "NUL", "NUL arg");
});

// ---------------------------------------------------------------------------
// Published metadata + generated projection parity
// ---------------------------------------------------------------------------

test("VERIFICATION_LIMITS is frozen and carries the approved shape ceilings", () => {
  assert.ok(VERIFICATION_LIMITS, "shape metadata must be published");
  assert.ok(Object.isFrozen(VERIFICATION_LIMITS), "VERIFICATION_LIMITS must be frozen");
  assert.deepEqual(
    {
      commands: VERIFICATION_LIMITS.commands,
      results: VERIFICATION_LIMITS.results,
      argsPerCommand: VERIFICATION_LIMITS.argsPerCommand,
      idChars: VERIFICATION_LIMITS.idChars,
      pathChars: VERIFICATION_LIMITS.pathChars,
      argChars: VERIFICATION_LIMITS.argChars,
    },
    { commands: 128, results: 128, argsPerCommand: 64, idChars: 128, pathChars: 1024, argChars: 4096 },
  );
  assert.throws(() => { VERIFICATION_LIMITS.commands = 999; }, { name: "TypeError" });
});

test("every Draft-07-expressible shape bound is projected into the schemas", () => {
  const planSchema = JSON.parse(readFileSync(new URL("../verification-plan.schema.json", import.meta.url), "utf8"));
  const receiptSchema = JSON.parse(readFileSync(new URL("../verification-receipt.schema.json", import.meta.url), "utf8"));
  const cmd = planSchema.$defs.VerificationCommandV1;

  assert.equal(planSchema.properties.commands.maxItems, VERIFICATION_LIMITS.commands);
  assert.equal(planSchema.properties.commands.minItems, 1);
  assert.equal(receiptSchema.properties.results.maxItems, VERIFICATION_LIMITS.results);
  assert.equal(cmd.properties.id.maxLength, VERIFICATION_LIMITS.idChars);
  assert.equal(cmd.properties.executable.maxLength, VERIFICATION_LIMITS.pathChars);
  // workingDirectory is nullable, so the projection puts the string bounds on the
  // non-null branch of `oneOf`.
  const wdBranches = cmd.properties.workingDirectory.oneOf ?? [cmd.properties.workingDirectory];
  const wdString = wdBranches.find((branch) => branch.type === "string");
  assert.ok(wdString, "workingDirectory projection must keep a string branch");
  assert.equal(wdString.maxLength, VERIFICATION_LIMITS.pathChars);
  assert.equal(cmd.properties.args.maxItems, VERIFICATION_LIMITS.argsPerCommand);
  assert.equal(cmd.properties.args.items.maxLength, VERIFICATION_LIMITS.argChars);
  assert.equal(receiptSchema.$defs.VerificationResultV1.properties.commandId.maxLength, VERIFICATION_LIMITS.idChars);
});

test("the definition reads its bounds from the published limits (no second number)", () => {
  // The validator messages must agree with the metadata: one source for the number.
  const cases = [
    [plan(commands(VERIFICATION_LIMITS.commands + 1)), VERIFICATION_LIMITS.commands],
    [plan([command({ id: "x".repeat(VERIFICATION_LIMITS.idChars + 1) })]), VERIFICATION_LIMITS.idChars],
    [plan([command({ args: ["x".repeat(VERIFICATION_LIMITS.argChars + 1)] })]), VERIFICATION_LIMITS.argChars],
  ];
  for (const [value, bound] of cases) {
    const res = validateVerificationPlanV1(value);
    assert.equal(res.ok, false);
    assert.ok(res.errors.some((e) => e.includes(String(bound))), `expected ${bound} in ${res.errors.join(" | ")}`);
  }
});
