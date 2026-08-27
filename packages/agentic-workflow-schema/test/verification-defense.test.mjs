// F91/F92 (review @8213ebd): the canonical helpers are the digest authority for
// already-validated DTOs, and the public authorities return redacted D16
// diagnostics — neither may silently absorb, or loudly leak, out-of-contract
// input. Written RED FIRST against `8213ebd`.
//
// F91: `canonicalizeVerificationPlan/Receipt` + `digestVerificationPlan/Receipt`
//   enforce no D14 budget today (SPEC §Canonical core states the precondition —
//   "inputs must first pass their validators" — but does not enforce it), so a
//   naive caller can stream an unbounded unvalidated payload through the
//   digest path. The fold refuses out-of-contract cardinality BEFORE any
//   serialization and the canonical byte budget at serialization time, with a
//   named TypeError that never echoes the submitted content.
// F92: both public validators walk a hostile object with live getters on an
//   unreachable property and let the attacker-chosen exception escape. The fold
//   maps any unexpected walk failure to exactly one redacted `invalid-type`
//   row, and the freshness predicate — whose SPEC contract is "throws nothing" —
//   returns `stale-plan` instead of throwing.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canonicalizeVerificationPlan,
  canonicalizeVerificationReceipt,
  compareVerificationReceiptToCurrent,
  digestVerificationPlan,
  digestVerificationReceipt,
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  VERIFICATION_CANONICAL_VECTORS,
  VERIFICATION_LIMITS,
} from "../dist/index.js";
import { planVector, receiptVector } from "./fixtures/verification-vectors.mjs";

const BUDGET = "D14";
const SECRET = "BOOM-secret-message";

/** A plan with `count` shape-plausible commands (the guard must fire on the
 *  declared cardinality, so the item content does not need to validate). */
function widePlan(count) {
  const base = planVector();
  base.commands = Array.from({ length: count }, (_, i) => ({
    ...base.commands[0],
    id: `cmd-${String(i).padStart(4, "0")}`,
  }));
  return base;
}

/** A receipt carrying `count` result rows (shape-plausible; unbound is fine —
 *  the cardinality guard runs before any binding check). */
function wideReceipt(count) {
  const base = receiptVector("0".repeat(64));
  base.results = Array.from({ length: count }, (_, i) => ({
    ...base.results[0],
    commandId: `cmd-${String(i).padStart(4, "0")}`,
  }));
  return base;
}

/** A plan whose canonical form crosses planBytes through one oversized field. */
function fatPlan() {
  const base = planVector();
  base.commands[0].executable = "a".repeat(VERIFICATION_LIMITS.planBytes + 1024);
  return base;
}

/** A receipt whose canonical form crosses receiptBytes. */
function fatReceipt() {
  const base = receiptVector("0".repeat(64));
  base.results[0].commandId = "b".repeat(VERIFICATION_LIMITS.receiptBytes + 1024);
  return base;
}

/** A valid plan object with one DECLARED root field that throws when read —
 *  not a JSON document: no `JSON.parse` result can carry it (F92's input-domain
 *  point). The getter must sit on a declared key or the walk never reads it. */
function hostilePlan() {
  const pv = validateVerificationPlanV1(planVector());
  assert.equal(pv.ok, true, "the fixture plan must be valid");
  const value = pv.plan;
  Object.defineProperty(value, "commands", {
    configurable: true,
    enumerable: true,
    get() {
      throw new Error(SECRET);
    },
  });
  return value;
}

/** A hostile receipt for the same probe (getter on an inner result row). */
function hostileReceipt() {
  const rv = validateVerificationPlanV1(planVector());
  const base = receiptVector("0".repeat(64));
  Object.defineProperty(base.results[0], "endedAt", {
    configurable: true,
    get() {
      throw new Error(SECRET);
    },
  });
  assert.equal(rv.ok, true);
  return base;
}

test("F91: canonicalizeVerificationPlan refuses an over-capacity plan BEFORE serialization", () => {
  assert.throws(
    () => canonicalizeVerificationPlan(widePlan(VERIFICATION_LIMITS.commands + 1)),
    (error) =>
      error instanceof TypeError &&
      /at most 128 commands/.test(error.message) &&
      !error.message.includes(SECRET),
  );
});

test("F91: canonicalizeVerificationReceipt refuses an over-capacity receipt", () => {
  assert.throws(
    () => canonicalizeVerificationReceipt(wideReceipt(VERIFICATION_LIMITS.results + 1)),
    (error) => error instanceof TypeError && /at most 128 results/.test(error.message),
  );
});

test("F91: the canonical byte budget is refused too (name never echoes the payload)", () => {
  assert.throws(
    () => canonicalizeVerificationPlan(fatPlan()),
    (error) =>
      error instanceof TypeError &&
      error.message.includes(BUDGET) &&
      !error.message.includes("aaaa"),
  );
  assert.throws(
    () => canonicalizeVerificationReceipt(fatReceipt()),
    (error) => error instanceof TypeError && error.message.includes(BUDGET),
  );
});

test("F91: the digest authorities inherit the guard (rejects, never hashes oversized input)", async () => {
  await assert.rejects(() => digestVerificationPlan(widePlan(VERIFICATION_LIMITS.commands + 1)), TypeError);
  await assert.rejects(() => digestVerificationReceipt(wideReceipt(VERIFICATION_LIMITS.results + 1)), TypeError);
});

test("F91: a contract-current plan/receipt still canonicalizes and digests", async () => {
  const canonical = canonicalizeVerificationPlan(planVector());
  assert.ok(canonical.startsWith("{"), "valid input flows through untouched");
  // The digest must still EQUAL the published vector — the guard may not
  // perturb the canonical form of contract-current input.
  const digest = await digestVerificationPlan(planVector());
  assert.equal(digest, VERIFICATION_CANONICAL_VECTORS[0].digest);
});

test("F92: the plan authority maps a hostile getter failure to ONE redacted invalid-type row", () => {
  const result = validateVerificationPlanV1(hostilePlan());
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.length, 1, `expected exactly one row: ${JSON.stringify(result.diagnostics)}`);
  assert.equal(result.diagnostics[0].code, "invalid-type");
  assert.equal(result.diagnostics[0].path, "");
  assert.ok(!JSON.stringify(result).includes(SECRET), "the attacker's exception text never crosses D16");
});

test("F92: the receipt authority maps a hostile getter failure to ONE redacted invalid-type row", async () => {
  const result = await validateVerificationReceiptAgainstPlan(hostileReceipt(), planVector());
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.length, 1, `expected exactly one row: ${JSON.stringify(result.diagnostics)}`);
  assert.equal(result.diagnostics[0].code, "invalid-type");
  // The getter sits on results[0].endedAt — the DEEPEST frame that owns the
  // read catches it, so the pointer names the row, not the document root.
  assert.equal(result.diagnostics[0].path, "/results/0");
  assert.ok(!JSON.stringify(result).includes(SECRET));
});

test("F92: the freshness predicate throws nothing on hostile input — it answers stale-plan", async () => {
  const hostile = hostilePlan();
  const result = await compareVerificationReceiptToCurrent(
    receiptVector("0".repeat(64)),
    hostile,
    "0".repeat(64),
    "0".repeat(64),
  );
  assert.deepEqual(result, { fresh: false, reasonCode: "stale-plan" });
});
