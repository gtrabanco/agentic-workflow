// P11 / AC10 + D16 — payload budgets and the bounded, redacted diagnostic contract.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  VERIFICATION_LIMITS,
  VERIFICATION_DIAGNOSTIC_CODES,
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  canonicalizeVerificationPlan,
  canonicalizeVerificationReceipt,
  digestVerificationPlan,
} from "../dist/index.js";

// A maximum-capacity plan must ALSO fit the tightest D14 stage budget, so the
// shared fixture timeout is sized for capacity: 7031 ms × 128 = 899,968 ≤ 900,000.
const fixtureTimeoutMs = Math.floor(VERIFICATION_LIMITS.fastStageTimeoutMs / VERIFICATION_LIMITS.commands);
import {
  assertDiagnosticAt,
  assertDiagnosticOn,
  assertOnlyDiagnostic,
  assertRedacted,
  codesOf,
  describeDiagnostics,
} from "./fixtures/verification-diagnostics.mjs";

const bytes = (text) => new TextEncoder().encode(text).length;

function command(overrides = {}) {
  return {
    id: "cmd",
    stage: "fast",
    executable: "npm",
    args: ["test"],
    workingDirectoryPolicy: "candidate-root",
    workingDirectory: null,
    timeoutMs: fixtureTimeoutMs,
    stopOnFailure: false,
    costClass: "cheap",
    ...overrides,
  };
}

const planOf = (commands) => ({ contract: VERIFICATION_PLAN_CONTRACT_ID, commands });
const row = (commandId, status = "passed") => ({
  commandId,
  status,
  exitCode: status === "passed" ? 0 : null,
  signal: null,
  startedAt: "2025-01-01T00:00:00Z",
  endedAt: "2025-01-01T00:00:01Z",
  stdout: null,
  stderr: null,
  skipReason: null,
});

/**
 * A plan whose canonical form is EXACTLY `target` UTF-8 bytes while every shape
 * ceiling holds: one command carrying 64 arguments, the last one tuned to land on
 * the budget. `args` of 4096 chars × 64 is ~256 KiB, so the byte budget is the
 * first ceiling a wide-but-legal payload can hit.
 */
function planAtCanonicalBytes(target) {
  const build = (pad) =>
    planOf([
      command({
        args: Array.from({ length: VERIFICATION_LIMITS.argsPerCommand }, (_, i) =>
          i === VERIFICATION_LIMITS.argsPerCommand - 1 ? "x".repeat(pad) : "a".repeat(VERIFICATION_LIMITS.argChars),
        ),
      }),
    ]);
  // Canonical length grows 1:1 with the padding, so one measurement locates it.
  const base = bytes(canonicalizeVerificationPlan(build(0)));
  const pad = target - base;
  assert.ok(pad > 0 && pad <= VERIFICATION_LIMITS.argChars, `cannot reach ${target} bytes (pad ${pad})`);
  const filled = build(pad);
  assert.equal(bytes(canonicalizeVerificationPlan(filled)), target, "fixture must land exactly on the budget");
  return filled;
}

// ---------------------------------------------------------------------------
// Canonical byte budgets (D14)
// ---------------------------------------------------------------------------

test("plan: a canonical form of exactly planBytes is accepted", () => {
  const at = planAtCanonicalBytes(VERIFICATION_LIMITS.planBytes);
  assert.equal(validateVerificationPlanV1(at).ok, true, describeDiagnostics(validateVerificationPlanV1(at)));
});

test("plan: one byte beyond planBytes is rejected by the budget alone", () => {
  const over = planAtCanonicalBytes(VERIFICATION_LIMITS.planBytes + 1);
  assertOnlyDiagnostic(validateVerificationPlanV1(over), "limit-exceeded", "", "over-budget plan");
});

test("the byte budget is enforced before any plan-bound scan (no diagnostic flood)", async () => {
  // An oversized plan is the entry point's first failure, so its diagnostics are
  // propagated verbatim — never extended by the per-result semantic pass.
  const over = planAtCanonicalBytes(VERIFICATION_LIMITS.planBytes + 1);
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "a".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: Array.from({ length: 40 }, (_, i) => row(`ghost-${i}`)),
    verdict: "pass",
  };
  const result = await validateVerificationReceiptAgainstPlan(receipt, over);
  assertOnlyDiagnostic(result, "limit-exceeded", "", "40 unknown rows must add no diagnostics");
});

test("the byte budget outranks every shape ceiling — one row, root path", async () => {
  // 129 commands of maximum arg width violates BOTH the cardinality ceiling and
  // the byte budget. The budget is measured first, so it is the only answer.
  const wide = planOf(
    Array.from({ length: VERIFICATION_LIMITS.commands + 1 }, (_, i) =>
      command({ id: `c${i}`, args: ["a".repeat(VERIFICATION_LIMITS.argChars), "b".repeat(VERIFICATION_LIMITS.argChars)] }),
    ),
  );
  assertOnlyDiagnostic(validateVerificationPlanV1(wide), "limit-exceeded", "", "over-budget plan with 129 commands");

  const maxRow = (i) => ({
    commandId: `c${i}`.padEnd(VERIFICATION_LIMITS.idChars, "z"),
    status: "timed-out",
    exitCode: null,
    signal: "S".repeat(VERIFICATION_LIMITS.pathChars),
    startedAt: "2025-01-01T00:00:00Z",
    endedAt: "2025-01-01T00:00:01Z",
    stdout: { ref: "r".repeat(VERIFICATION_LIMITS.evidenceRefChars), bytes: 0, sha256: "a".repeat(64) },
    stderr: { ref: "s".repeat(VERIFICATION_LIMITS.evidenceRefChars), bytes: 0, sha256: "b".repeat(64) },
    skipReason: null,
  });
  const wideReceipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "a".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: Array.from({ length: 200 }, (_, i) => maxRow(i)),
    verdict: "pass",
  };
  assert.ok(
    bytes(canonicalizeVerificationReceipt(wideReceipt)) > VERIFICATION_LIMITS.receiptBytes,
    "the fixture must really cross the receipt budget",
  );
  assertOnlyDiagnostic(
    await validateVerificationReceiptAgainstPlan(wideReceipt, planOf([command()])),
    "limit-exceeded", "", "over-budget receipt with 150 rows",
  );

  // Under the budget the ceiling that owns the field still answers for itself.
  const smallButTooMany = { ...wideReceipt, results: Array.from({ length: 129 }, (_, i) => row(`c${i}`)) };
  assertDiagnosticAt(
    await validateVerificationReceiptAgainstPlan(smallButTooMany, planOf([command()])),
    "limit-exceeded", "/results",
  );
});

test("receipt: a shape-legal maximum-capacity receipt stays inside receiptBytes", async () => {
  const pv = validateVerificationPlanV1(planOf(
    Array.from({ length: VERIFICATION_LIMITS.results }, (_, i) => command({ id: `c${i}` })),
  ));
  assert.equal(pv.ok, true);
  const results = pv.plan.commands.map((c) => ({
    ...row(c.id),
    stdout: { ref: "r".repeat(VERIFICATION_LIMITS.evidenceRefChars), bytes: 0, sha256: "a".repeat(64) },
    stderr: { ref: "s".repeat(VERIFICATION_LIMITS.evidenceRefChars), bytes: 0, sha256: "b".repeat(64) },
  }));
  const receipt = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: await digestVerificationPlan(pv.plan),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results,
    verdict: "pass",
  };
  const size = bytes(canonicalizeVerificationReceipt(receipt));
  assert.ok(size < VERIFICATION_LIMITS.receiptBytes, `max-capacity receipt is ${size} bytes vs ${VERIFICATION_LIMITS.receiptBytes}`);
  const res = await validateVerificationReceiptAgainstPlan(receipt, pv.plan);
  assert.equal(res.ok, true, describeDiagnostics(res));
});

test("receipt: the skip-reason ceiling is the rule that answers one char past it", async () => {
  const pv = validateVerificationPlanV1(planOf([command({ id: "solo", stopOnFailure: true })]));
  const base = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: await digestVerificationPlan(pv.plan),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    verdict: "pass",
  };
  // The skip-reason ceiling is proven by which rule answers each side: at exactly
  // 1024 chars the length bound passes (only the D3 reference rule can complain),
  // one char beyond it is the bound that fires.
  const at1024 = "x".repeat(VERIFICATION_LIMITS.skipReasonChars);
  const skip = (reason) => ({
    ...base,
    results: [{ ...row("solo", "skipped"), skipReason: reason }],
    verdict: "incomplete",
  });
  const inside = await validateVerificationReceiptAgainstPlan(skip(at1024), pv.plan);
  assert.equal(inside.ok, false);
  assert.ok(
    !inside.diagnostics.some((d) => d.code === "limit-exceeded" && d.path.endsWith("/skipReason")),
    `1024 chars must satisfy the length bound — [${describeDiagnostics(inside)}]`,
  );
  assertDiagnosticOn(inside, "unknown-command", "skipReason", "a reason must name a declared command");
  assertDiagnosticOn(
    await validateVerificationReceiptAgainstPlan(skip(at1024 + "y"), pv.plan),
    "limit-exceeded", "skipReason", "skip reason beyond the ceiling",
  );
});

// ---------------------------------------------------------------------------
// Diagnostic ceiling, truncation flag and redaction (D16 / F71)
// ---------------------------------------------------------------------------

test("receipt: an evidence reference is accepted at the ceiling and rejected one over", async () => {
  const pv = validateVerificationPlanV1(planOf([command({ id: "solo" })]));
  const ref = (n) => ({ ref: "r".repeat(n), bytes: 0, sha256: "a".repeat(64) });
  const base = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: await digestVerificationPlan(pv.plan),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    verdict: "pass",
  };
  assert.equal(
    (await validateVerificationReceiptAgainstPlan(
      { ...base, results: [{ ...row("solo"), stdout: ref(VERIFICATION_LIMITS.evidenceRefChars) }] }, pv.plan)).ok,
    true,
  );
  assertDiagnosticOn(
    await validateVerificationReceiptAgainstPlan(
      { ...base, results: [{ ...row("solo"), stdout: ref(VERIFICATION_LIMITS.evidenceRefChars + 1) }] }, pv.plan),
    "limit-exceeded", "ref", "evidence ref beyond the ceiling",
  );
});

/** `n` commands each carrying exactly one violation (an unknown stage value). */
const planWithViolations = (n) =>
  planOf(Array.from({ length: n }, (_, i) => command({ id: `c${i}`, stage: "not-a-stage" })));

test("diagnostics stop at the published ceiling and say so", () => {
  const limit = VERIFICATION_LIMITS.diagnostics;
  assert.equal(limit, 50);

  const under = validateVerificationPlanV1(planWithViolations(limit - 1));
  assert.equal(under.diagnostics.length, limit - 1);
  assert.equal(under.truncated, false);

  const exact = validateVerificationPlanV1(planWithViolations(limit));
  assert.equal(exact.diagnostics.length, limit);
  assert.equal(exact.truncated, false, "exactly at the ceiling nothing was dropped");

  const beyond = validateVerificationPlanV1(planWithViolations(limit + 1));
  assert.equal(beyond.diagnostics.length, limit, "the ceiling is a hard allocation bound");
  assert.equal(beyond.truncated, true);
  assert.equal(beyond.diagnostics.at(-1).path, `/commands/${limit - 1}/stage`, "rows stay in document order");
});

test("diagnostics are redacted rows: code + path, never a message or a value", () => {
  const sentinel = "SENTINEL-submitted-value-9d3f";
  const result = validateVerificationPlanV1({
    contract: sentinel,
    [sentinel]: "leak",
    commands: [command({ id: sentinel, stage: sentinel, costClass: sentinel })],
  });
  assert.equal(result.ok, false);
  assertRedacted(result);
  const wire = JSON.stringify(result.diagnostics);
  assert.ok(!wire.includes(sentinel), `no diagnostic may echo a submitted value: ${wire}`);
  assert.equal(wire.includes("message"), false, "a diagnostic row has no message field");
});

test("every emitted code belongs to the published closed vocabulary", () => {
  const fixtures = [
    validateVerificationPlanV1(null),
    validateVerificationPlanV1({}),
    validateVerificationPlanV1(planOf([])),
    validateVerificationPlanV1(planOf([command({ id: "a" }), command({ id: "a" })])),
    validateVerificationPlanV1(planOf([command({ timeoutMs: 0 })])),
    validateVerificationPlanV1(planOf([command({ args: null })])),
    validateVerificationPlanV1(planOf([command({ workingDirectoryPolicy: "relative-path", workingDirectory: "../x" })])),
  ];
  for (const failure of fixtures) {
    assert.equal(failure.ok, false);
    assertRedacted(failure);
    for (const code of codesOf(failure)) {
      assert.ok(VERIFICATION_DIAGNOSTIC_CODES.includes(code), `unpublished diagnostic code ${code}`);
    }
  }
});

test("VERIFICATION_DIAGNOSTIC_CODES is frozen and matches the SPEC vocabulary", () => {
  assert.ok(Object.isFrozen(VERIFICATION_DIAGNOSTIC_CODES));
  assert.deepEqual([...VERIFICATION_DIAGNOSTIC_CODES], [
    "invalid-type", "missing-field", "unknown-field", "invalid-value",
    "limit-exceeded", "duplicate-id", "unknown-command", "invalid-order",
    "invalid-stage", "invalid-exit-state", "invalid-evidence", "invalid-skip",
    "invalid-fail-fast", "digest-mismatch", "verdict-mismatch", "budget-exceeded",
  ]);
  assert.throws(() => { VERIFICATION_DIAGNOSTIC_CODES.push("extra"); }, { name: "TypeError" });
});

// ---------------------------------------------------------------------------
// Semantic rules keep their own codes (not the structural ones)
// ---------------------------------------------------------------------------

test("semantic rejections report their own codes and pointers", async () => {
  const pv = validateVerificationPlanV1(planOf([command({ id: "solo" })]));
  const good = {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: await digestVerificationPlan(pv.plan),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: [row("solo")],
    verdict: "pass",
  };
  assertDiagnosticAt(await validateVerificationReceiptAgainstPlan({ ...good, planDigest: "0".repeat(64) }, pv.plan),
    "digest-mismatch", "/planDigest");
  assertDiagnosticAt(await validateVerificationReceiptAgainstPlan({ ...good, verdict: "fail" }, pv.plan),
    "verdict-mismatch", "/verdict");
  assertDiagnosticAt(await validateVerificationReceiptAgainstPlan({ ...good, results: [row("ghost")] }, pv.plan),
    "unknown-command", "/results/0/commandId");
  assertDiagnosticAt(await validateVerificationReceiptAgainstPlan({ ...good, results: [row("solo"), row("solo")] }, pv.plan),
    "duplicate-id", "/results/1/commandId");

  // A fast-stage receipt that carries a FULL-stage row answers `invalid-stage`.
  const mixed = validateVerificationPlanV1(planOf([
    command({ id: "quick", stage: "fast" }),
    command({ id: "heavy", stage: "full" }),
  ]));
  const mixedDigest = await digestVerificationPlan(mixed.plan);
  assertDiagnosticAt(await validateVerificationReceiptAgainstPlan({
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: mixedDigest,
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "fast",
    results: [row("quick"), row("heavy")],
    verdict: "pass",
  }, mixed.plan), "invalid-stage", "/results/1/commandId");

  // A `full` receipt whose rows are out of declared order answers `invalid-order`.
  assertDiagnosticAt(await validateVerificationReceiptAgainstPlan({
    ...good,
    planDigest: await digestVerificationPlan(mixed.plan),
    stageRequested: "full",
    results: [row("heavy"), row("quick")],
  }, mixed.plan), "invalid-order", "/results/1/commandId");

  // Structural failures return first and alone: no semantic row is appended.
  assertDiagnosticAt(
    await validateVerificationReceiptAgainstPlan({ ...good, extra: true }, pv.plan),
    "unknown-field", "",
  );
});

test("payload bounds are projected where Draft-07 can express them", () => {
  const receiptSchema = JSON.parse(readFileSync(new URL("../verification-receipt.schema.json", import.meta.url), "utf8"));
  const result = receiptSchema.$defs.VerificationResultV1;
  assert.equal(result.properties.skipReason.oneOf.find((b) => b.type === "string").maxLength, VERIFICATION_LIMITS.skipReasonChars);
  assert.equal(receiptSchema.$defs.EvidenceReferenceV1.properties.ref.maxLength, VERIFICATION_LIMITS.evidenceRefChars);
  // The ceilings that Draft-07 cannot express are disclosed instead of faked.
  for (const file of ["verification-plan.schema.json", "verification-receipt.schema.json"]) {
    const comment = JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), "utf8")).$comment;
    assert.match(comment, /payload budget: runtime-only/);
    assert.match(comment, /diagnostics: runtime-only \(at most 50 /);
    assert.match(comment, /values: never returned/);
  }
});

// ---------------------------------------------------------------------------
// Every published code must answer to a real rule (no dangling vocabulary).
// ---------------------------------------------------------------------------

/** One malformed payload per diagnostic code, produced through the public entries. */
async function failurePerCode() {
  const failures = [];
  const push = async (result) => {
    assert.equal(result.ok, false, "each battery fixture must be rejected");
    failures.push(result);
    return result;
  };

  const drop = (c) => {
    const { costClass, ...rest } = c;
    return rest;
  };

  await push(validateVerificationPlanV1(planOf([command({ timeoutMs: "30000" })]))); // invalid-type
  await push(validateVerificationPlanV1(planOf([drop(command())]))); // missing-field
  await push(validateVerificationPlanV1({ ...planOf([command()]), junk: 1 })); // unknown-field
  await push(validateVerificationPlanV1(planOf([command({ stage: "bogus" })]))); // invalid-value
  await push(
    validateVerificationPlanV1(planOf(Array.from({ length: VERIFICATION_LIMITS.commands + 1 }, (_, i) => command({ id: `c${i}` })))),
  ); // limit-exceeded
  await push(validateVerificationPlanV1(planOf([command({ id: "a" }), command({ id: "a" })]))); // duplicate-id

  const two = validateVerificationPlanV1(planOf([
    command({ id: "one", stopOnFailure: true }),
    command({ id: "two", stage: "full" }),
  ]));
  const digest = await digestVerificationPlan(two.plan);
  const bound = (overrides) => validateVerificationReceiptAgainstPlan(
    {
      contract: VERIFICATION_RECEIPT_CONTRACT_ID,
      planDigest: digest,
      candidateSnapshotDigest: "e".repeat(64),
      acceptanceFingerprint: "f".repeat(64),
      stageRequested: "full",
      results: [row("one"), row("two")],
      verdict: "pass",
      ...overrides,
    },
    two.plan,
  );

  await push(await bound({ results: [row("ghost")] })); // unknown-command
  await push(await bound({ results: [row("two"), row("one")] })); // invalid-order
  await push(await bound({ stageRequested: "fast" })); // invalid-stage: a full-stage row in a fast receipt
  await push(await bound({ results: [{ ...row("one", "failed"), exitCode: 1, signal: "SIGKILL" }, row("two")] })); // invalid-exit-state (D4 both non-null)
  await push(await bound({ results: [{ ...row("one"), stdout: { ref: "r", bytes: 0, sha256: "NOT-HEX" } }] })); // invalid-evidence
  await push(await bound({ results: [row("one"), { ...row("two", "skipped"), skipReason: "one" }] })); // invalid-skip: a passed command cannot justify a skip
  await push(await bound({
    results: [{ ...row("one", "failed"), exitCode: 1 }, row("two")],
  })); // invalid-fail-fast
  await push(await bound({ planDigest: "0".repeat(64) })); // digest-mismatch
  await push(await bound({ verdict: "fail" })); // verdict-mismatch
  await push(validateVerificationPlanV1(planOf(
    Array.from({ length: 4 }, (_, i) => command({ id: `b${i}`, timeoutMs: 400_000 })),
  ))); // budget-exceeded: four 400s fast commands break the 900s stage budget
  return failures;
}

test("every published diagnostic code has an emitter", async () => {
  const failures = await failurePerCode();
  const emitted = new Set();
  for (const failure of failures) {
    assertRedacted(failure);
    for (const code of codesOf(failure)) {
      assert.ok(VERIFICATION_DIAGNOSTIC_CODES.includes(code), `unpublished code ${code}`);
      emitted.add(code);
    }
  }
  const silent = VERIFICATION_DIAGNOSTIC_CODES.filter((code) => !emitted.has(code));
  // Since P12 wired `budget-exceeded` to the D14 aggregate stage budgets, no
  // published code may be silent: a vocabulary entry nothing can emit is a
  // contract lie, not a spare (the F63 lesson from P8, generalized).
  assert.deepEqual(silent, [], "every published diagnostic code has a rule behind it");
});
