// AC4 / F63 — freshness reachability matrix.
//
// `compareVerificationReceiptToCurrent` must return exactly one D1 reason code on
// a REACHABLE and DISJOINT condition, in the fixed check order frozen by the
// SPEC (§ Stage, verdict, and freshness semantics):
//
//   plan digest → candidate-snapshot digest → acceptance fingerprint
//     → a missing fast-stage result (`incomplete-missing-results`)
//     → an unjustified skip (`incomplete-unjustified-skip`)
//     → a missing full-stage result (`incomplete-stage-coverage`)
//     → { fresh: true }
//
// Every case below is a ONE-DIMENSION mutation of the fresh baseline, so each
// code is proven reachable from a condition no other code answers, and undoing
// that single mutation restores `{ fresh: true }`.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  VERIFICATION_FRESHNESS_CODES,
  digestVerificationPlan,
  compareVerificationReceiptToCurrent,
} from "../dist/index.js";

const CANDIDATE = "e".repeat(64);
const ACCEPTANCE = "f".repeat(64);

function command(id, stage) {
  return {
    id,
    stage,
    executable: "npm",
    args: ["test"],
    workingDirectoryPolicy: "candidate-root",
    workingDirectory: null,
    timeoutMs: 30000,
    stopOnFailure: false,
    costClass: "cheap",
  };
}

// lint/test are fast-stage, deploy is full-stage: the stage of the MISSING
// command is what separates `incomplete-missing-results` from
// `incomplete-stage-coverage` — not the requested stage of the receipt.
const PLAN = {
  contract: VERIFICATION_PLAN_CONTRACT_ID,
  commands: [command("lint", "fast"), command("test", "fast"), command("deploy", "full")],
};

function result(commandId, status = "passed", skipReason = null) {
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

/** Baseline: complete, current, every row passed. */
async function baseline(overrides = {}) {
  const planDigest = await digestVerificationPlan(PLAN);
  return {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: CANDIDATE,
    acceptanceFingerprint: ACCEPTANCE,
    stageRequested: "full",
    results: [result("lint"), result("test"), result("deploy")],
    verdict: "pass",
    ...overrides,
  };
}

const compare = (receipt, candidate = CANDIDATE, acceptance = ACCEPTANCE) =>
  compareVerificationReceiptToCurrent(receipt, PLAN, candidate, acceptance);

/** Proves the mutation is the ONLY reason for the outcome. */
async function assertSingleMutation(code, overrides) {
  const stale = await baseline(overrides);
  assert.deepStrictEqual(await compare(stale), { fresh: false, reasonCode: code });
  assert.deepStrictEqual(await compare(await baseline()), { fresh: true },
    `${code} must disappear once its single mutated dimension is restored`);
}

// ---------------------------------------------------------------------------
// { fresh: true } — reachable and deterministic
// ---------------------------------------------------------------------------

test("fresh: complete current full receipt is fresh", async () => {
  assert.deepStrictEqual(await compare(await baseline()), { fresh: true });
});

test("fresh: determination — repeated comparisons of the same inputs are deeply equal", async () => {
  const receipt = await baseline();
  const first = await compare(receipt);
  const second = await compare(receipt);
  assert.deepStrictEqual(second, first);
  assert.deepStrictEqual(first, { fresh: true });
});

test("fresh: vacuous fast receipt (D9) is fresh — nothing fast is missing", async () => {
  // A plan whose fast set is empty: the fast receipt owes no rows at all (D9).
  const fullOnlyPlan = { contract: VERIFICATION_PLAN_CONTRACT_ID, commands: [command("deploy", "full")] };
  const receipt = {
    ...(await baseline()),
    planDigest: await digestVerificationPlan(fullOnlyPlan),
    stageRequested: "fast",
    results: [],
  };
  assert.deepStrictEqual(
    await compareVerificationReceiptToCurrent(receipt, fullOnlyPlan, CANDIDATE, ACCEPTANCE),
    { fresh: true });
});

// ---------------------------------------------------------------------------
// The three stale conditions (first precedence block)
// ---------------------------------------------------------------------------

test("stale-plan: the receipt's plan binding is not the digest of this plan", async () => {
  await assertSingleMutation("stale-plan", { planDigest: "a".repeat(64) });
});

test("stale-candidate-snapshot: the candidate advanced after the run", async () => {
  const receipt = await baseline();
  assert.deepStrictEqual(await compare(receipt, "a".repeat(64), ACCEPTANCE),
    { fresh: false, reasonCode: "stale-candidate-snapshot" });
  assert.deepStrictEqual(await compare(receipt), { fresh: true });
});

test("stale-acceptance-fingerprint: the acceptance set changed after the run", async () => {
  const receipt = await baseline();
  assert.deepStrictEqual(await compare(receipt, CANDIDATE, "a".repeat(64)),
    { fresh: false, reasonCode: "stale-acceptance-fingerprint" });
  assert.deepStrictEqual(await compare(receipt), { fresh: true });
});

test("stale precedence: plan before candidate before acceptance", async () => {
  assert.deepStrictEqual(await compare(await baseline({ planDigest: "a".repeat(64) }), "b".repeat(64), "c".repeat(64)),
    { fresh: false, reasonCode: "stale-plan" });
  assert.deepStrictEqual(await compare(await baseline(), "b".repeat(64), "c".repeat(64)),
    { fresh: false, reasonCode: "stale-candidate-snapshot" });
  assert.deepStrictEqual(await compare(await baseline(), CANDIDATE, "c".repeat(64)),
    { fresh: false, reasonCode: "stale-acceptance-fingerprint" });
});

// F63 core: while any binding is unverified the predicate never reports an
// incompleteness — the stale block and the incomplete block are disjoint.
test("stale and incomplete are disjoint: stale bindings mask every incomplete condition", async () => {
  const degraded = {
    stageRequested: "full",
    results: [result("lint"), result("test", "skipped")], // missing full row + unjustified skip
    verdict: "incomplete",
  };
  assert.deepStrictEqual(
    await compare(await baseline({ ...degraded, planDigest: "a".repeat(64) })),
    { fresh: false, reasonCode: "stale-plan" });
  assert.deepStrictEqual(await compare(await baseline(degraded), "a".repeat(64), ACCEPTANCE),
    { fresh: false, reasonCode: "stale-candidate-snapshot" });
  assert.deepStrictEqual(await compare(await baseline(degraded), CANDIDATE, "a".repeat(64)),
    { fresh: false, reasonCode: "stale-acceptance-fingerprint" });
});

// ---------------------------------------------------------------------------
// The three incomplete conditions (second precedence block, fixed order)
// ---------------------------------------------------------------------------

test("incomplete-missing-results: fast receipt missing a fast-stage row", async () => {
  const receipt = await baseline({
    stageRequested: "fast",
    results: [result("lint")],
    verdict: "incomplete",
  });
  assert.deepStrictEqual(await compare(receipt), { fresh: false, reasonCode: "incomplete-missing-results" });
});

test("incomplete-missing-results: a full receipt missing a FAST-stage row is a missing result (F62)", async () => {
  await assertSingleMutation("incomplete-missing-results", {
    results: [result("test"), result("deploy")],
    verdict: "incomplete",
  });
});

test("incomplete-unjustified-skip: a skipped row without a reason", async () => {
  await assertSingleMutation("incomplete-unjustified-skip", {
    results: [result("lint"), result("test"), result("deploy", "skipped")],
    verdict: "incomplete",
  });
});

test("incomplete-stage-coverage: a full receipt missing a FULL-stage row (F63)", async () => {
  await assertSingleMutation("incomplete-stage-coverage", {
    results: [result("lint"), result("test")],
    verdict: "incomplete",
  });
});

test("incomplete precedence: missing results before unjustified skip before stage coverage", async () => {
  // missing fast row + unjustified skip → incomplete-missing-results
  assert.deepStrictEqual(
    await compare(await baseline({
      results: [result("lint", "skipped"), result("deploy")], verdict: "incomplete",
    })),
    { fresh: false, reasonCode: "incomplete-missing-results" });
  // unjustified skip + missing full row → incomplete-unjustified-skip
  assert.deepStrictEqual(
    await compare(await baseline({
      results: [result("lint"), result("test", "skipped")], verdict: "incomplete",
    })),
    { fresh: false, reasonCode: "incomplete-unjustified-skip" });
});

// ---------------------------------------------------------------------------
// Matrix closure — the six codes answer six different conditions
// ---------------------------------------------------------------------------

test("matrix: every D1 code is reachable and no code answers two dimensions", async () => {
  const cases = [
    ["stale-plan", await baseline({ planDigest: "a".repeat(64) }), CANDIDATE, ACCEPTANCE],
    ["stale-candidate-snapshot", await baseline(), "a".repeat(64), ACCEPTANCE],
    ["stale-acceptance-fingerprint", await baseline(), CANDIDATE, "a".repeat(64)],
    ["incomplete-missing-results", await baseline({
      results: [result("test"), result("deploy")], verdict: "incomplete",
    }), CANDIDATE, ACCEPTANCE],
    ["incomplete-unjustified-skip", await baseline({
      results: [result("lint"), result("test"), result("deploy", "skipped")], verdict: "incomplete",
    }), CANDIDATE, ACCEPTANCE],
    ["incomplete-stage-coverage", await baseline({
      results: [result("lint"), result("test")], verdict: "incomplete",
    }), CANDIDATE, ACCEPTANCE],
  ];

  const observed = [];
  for (const [expected, receipt, candidate, acceptance] of cases) {
    const out = await compare(receipt, candidate, acceptance);
    assert.equal(out.fresh, false, `${expected} must not report fresh`);
    assert.equal(out.reasonCode, expected);
    observed.push(out.reasonCode);
  }
  assert.deepEqual([...new Set(observed)].sort(), [...VERIFICATION_FRESHNESS_CODES].sort(),
    "each of the six codes answers exactly one distinct condition");
});

test("malformed inputs never throw and cannot establish the plan binding (stale-plan)", async () => {
  const receipt = await baseline();
  const badPlan = { ...PLAN, commands: [{ ...PLAN.commands[0], timeoutMs: 10n }] };
  assert.deepStrictEqual(
    await compareVerificationReceiptToCurrent(receipt, badPlan, CANDIDATE, ACCEPTANCE),
    { fresh: false, reasonCode: "stale-plan" });
  assert.deepStrictEqual(
    await compareVerificationReceiptToCurrent({ ...receipt, results: "nope" }, PLAN, CANDIDATE, ACCEPTANCE),
    { fresh: false, reasonCode: "stale-plan" });
});
