// F97 — a validation entry must decide on ONE document and bless THAT document.
//
// Reproduced at 3112e34: a live getter whose value changes between reads made the
// entries answer with the value one pass observed and return a DTO carrying the
// value another pass observed. `stage`/`timeoutMs` flipping on the third read
// blessed `timeoutMs: 600001` on a `fast` command (an AC10 ceiling breach); `id`
// flipping on the third read blessed duplicate command ids (a `unique-command-ids`
// breach). The byte-budget pass, the field checks, the cross-rules and the DTO copy
// each read the submitted object again, so any accessor with side effects could
// separate the decision from the blessed data.
//
// The fold: both public entries capture the submitted document ONCE into a frozen
// own-property snapshot; the budget measure, the structural walk, the cross-rules
// and the DTO all consume that snapshot only.
//
// Four properties are pinned:
//   1. SELF-CONSISTENCY — an entry never blesses a document its own rules refuse:
//      re-validating the DTO it returned answers identically.
//   2. SINGLE READ — every submitted accessor is read at most once per entry call,
//      so there is never a second observation to disagree with.
//   3. FIRST OBSERVATION WINS — a blessed DTO carries the snapshot values and no
//      live accessor, so what ships is what was checked.
//   4. F92 PARITY — a throwing getter still surfaces as exactly one redacted
//      `invalid-type` row: code + RFC 6901 pointer, never the attacker's message.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  VERIFICATION_CANONICAL_VECTORS,
  VERIFICATION_LIMITS,
} from "../dist/index.js";
import { planVector, receiptVector } from "./fixtures/verification-vectors.mjs";

const LIMITS = VERIFICATION_LIMITS;
const POINTER = /^(?:|\/(?:[A-Za-z][A-Za-z0-9]*|\d+)(?:\/(?:[A-Za-z][A-Za-z0-9]*|\d+))*)$/;
const over = (chars) => "x".repeat(chars + 1);
const SECRET = "BOOM-secret-message";

const PLAN_DIGEST = VERIFICATION_CANONICAL_VECTORS[0].digest;
const EVIDENCE = () => ({ ref: "ci://logs/step-1", bytes: 128, sha256: "c".repeat(64) });

/** The published vector with both evidence slots filled: every accessor is live. */
function receiptFixture() {
  const receipt = receiptVector(PLAN_DIGEST);
  receipt.results[0].stdout = EVIDENCE();
  receipt.results[0].stderr = EVIDENCE();
  return receipt;
}

/** Every plan accessor, addressed from the fixture root, with a rule-breaching value. */
const PLAN_CASES = [
  ["contract", over(64)],
  ["commands", Array.from({ length: LIMITS.commands + 1 }, (_, i) => ({
    ...planVector().commands[0],
    id: `cmd-${String(i).padStart(4, "0")}`,
  }))],
  ["commands/id", over(LIMITS.idChars)],
  ["commands/stage", "sideways"],
  ["commands/executable", over(LIMITS.pathChars)],
  ["commands/args", "not-an-array"],
  ["commands/workingDirectoryPolicy", "wherever"],
  ["commands/workingDirectory", over(LIMITS.pathChars)],
  ["commands/timeoutMs", LIMITS.fastCommandTimeoutMs + 1],
  ["commands/costClass", "priceless"],
  ["commands/stopOnFailure", "yes"],
];

/** Every receipt accessor, addressed from the fixture root, with a rule-breaching value. */
const RECEIPT_CASES = [
  ["contract", over(64)],
  ["planDigest", "0".repeat(63)],
  ["candidateSnapshotDigest", "0".repeat(63)],
  ["acceptanceFingerprint", "0".repeat(63)],
  ["results", Array.from({ length: LIMITS.results + 1 }, (_, i) => ({
    ...receiptFixture().results[0],
    commandId: `cmd-${String(i).padStart(4, "0")}`,
  }))],
  ["results/commandId", "ghost"],
  ["results/status", "sideways"],
  ["results/exitCode", 1.5],
  ["results/signal", 7],
  ["results/startedAt", "yesterday"],
  ["results/endedAt", "2020-01-01T00:00:00Z"],
  ["results/stdout", 42],
  ["results/stdout/ref", over(LIMITS.evidenceRefChars)],
  ["results/stdout/bytes", -1],
  ["results/stdout/sha256", "z".repeat(64)],
  ["results/stderr", 42],
  ["results/stderr/ref", over(LIMITS.evidenceRefChars)],
  ["results/stderr/bytes", -1],
  ["results/stderr/sha256", "z".repeat(64)],
  ["results/skipReason", over(LIMITS.skipReasonChars)],
  ["stageRequested", "sideways"],
  ["verdict", "sideways"],
];

/**
 * Fixture-relative accessor path → document path. The corpora name a field once
 * (`commands/timeoutMs`); the document addresses its row by index
 * (`/commands/0/timeoutMs`), because that is the pointer D16 publishes.
 */
const documentPath = (pointer) => {
  const [first, ...rest] = pointer.split("/");
  return rest.length === 0 ? `/${first}` : `/${first}/0/${rest.join("/")}`;
};

const parentOf = (path) => path.split("/").slice(0, -1).join("/");
const keyOf = (path) => path.split("/").pop();
const nodeAt = (root, path) =>
  path === "" ? root : path.split("/").filter(Boolean).reduce((n, seg) => n[seg], root);

/** Swap a declared accessor for a getter that walks `values` one per read. */
function arm(root, path, values) {
  const holder = nodeAt(root, parentOf(path));
  const key = keyOf(path);
  let reads = 0;
  Object.defineProperty(holder, key, {
    configurable: true,
    enumerable: true,
    get() {
      const value = values[Math.min(reads, values.length - 1)];
      reads += 1;
      return value;
    },
  });
  return { reads: () => reads };
}

/** Good/bad alternate, so no read position can be assumed safe. */
const flip = (good, bad) => [good, bad, good, bad, good, bad];

function assertRefusalIsRedacted(result, name) {
  assert.equal(result.ok, false, `${name} returned no refusal for a hostile document`);
  assert.equal(typeof result.truncated, "boolean", `${name} lost the D16 truncation flag`);
  assert.ok(result.diagnostics.length > 0, `${name} refused without a diagnostic`);
  for (const row of result.diagnostics) {
    assert.equal(typeof row.code, "string", `${name}: code must be a vocabulary string`);
    assert.match(row.path, POINTER, `${name}: ${row.path} is not an RFC 6901 pointer`);
    assert.deepEqual(Object.keys(row).sort(), ["code", "path"],
      `${name}: a diagnostic row is code + path only — never a message or a value (D16)`);
  }
}

/** Property 1 — whatever the entry blesses, the same entry agrees it blesses. */
async function assertDecidesOnOneDocument(result, revalidate, name) {
  if (!result.ok) {
    assertRefusalIsRedacted(result, name);
    return;
  }
  const again = await revalidate();
  assert.equal(again.ok, true,
    `${name}: the entry blessed a DTO its own rules refuse — the decision was made on another document`);
  assert.deepEqual(again, result,
    `${name}: re-validating the blessed DTO changed the answer`);
}

/** Property 3 — no live accessor may survive the capture into the caller's DTO. */
function assertNoAccessors(node, seen = new Set()) {
  if (node === null || typeof node !== "object" || seen.has(node)) return;
  seen.add(node);
  for (const [key, value] of Object.entries(node)) {
    const descriptor = Object.getOwnPropertyDescriptor(node, key);
    assert.equal(descriptor.get, undefined, `the blessed DTO still carries a live getter at ${key}`);
    assert.equal(descriptor.set, undefined, `the blessed DTO still carries a setter at ${key}`);
    assertNoAccessors(value, seen);
  }
}

/** Every declared accessor of a fixture, arrays descended once. */
function declaredPaths(root, prefix = "", out = []) {
  if (Array.isArray(root)) {
    const first = root[0];
    if (first !== null && typeof first === "object") declaredPaths(first, `${prefix}/0`, out);
    return out;
  }
  if (root === null || typeof root !== "object") return out;
  for (const [key, value] of Object.entries(root)) {
    const path = `${prefix}/${key}`;
    out.push(path);
    if (value !== null && typeof value === "object") declaredPaths(value, path, out);
  }
  return out;
}

test("F97: the hostile corpus covers every accessor both contracts expose", () => {
  const planCovered = new Set(PLAN_CASES.map(([p]) => documentPath(p)));
  const receiptCovered = new Set(RECEIPT_CASES.map(([p]) => documentPath(p)));
  const planFixture = planVector();
  const receiptFixtureDocument = receiptFixture();
  // `/commands/0` and `/results/0` are the row frames the corpora address through
  // their fields, not accessors a caller can arm independently.
  const uncovered = (fixture, covered) =>
    declaredPaths(fixture).filter((p) => !covered.has(p) && !/\/0$/.test(p));
  assert.deepEqual(uncovered(planFixture, planCovered), [], "uncovered plan accessor");
  assert.deepEqual(uncovered(receiptFixtureDocument, receiptCovered), [], "uncovered receipt accessor");
});

test("F97: the plan entry blesses only the document its own rules checked", async () => {
  for (const [pointer, bad] of PLAN_CASES) {
    const path = documentPath(pointer);
    const plan = planVector();
    const good = nodeAt(plan, path);
    arm(plan, path, flip(good, bad));
    const result = validateVerificationPlanV1(plan);
    await assertDecidesOnOneDocument(
      result,
      () => Promise.resolve(validateVerificationPlanV1(result.plan)),
      `plan ${pointer}`,
    );
  }
});

test("F97: the receipt entry blesses only the receipt its own rules checked", async () => {
  for (const [pointer, bad] of RECEIPT_CASES) {
    const path = documentPath(pointer);
    const receipt = receiptFixture();
    const good = nodeAt(receipt, path);
    arm(receipt, path, flip(good, bad));
    const result = await validateVerificationReceiptAgainstPlan(receipt, planVector());
    await assertDecidesOnOneDocument(
      result,
      () => validateVerificationReceiptAgainstPlan(result.receipt, planVector()),
      `receipt ${pointer}`,
    );
  }
});

test("F97: the receipt entry decides on one plan as well", async () => {
  for (const [pointer, bad] of PLAN_CASES) {
    const path = documentPath(pointer);
    const plan = planVector();
    const good = nodeAt(plan, path);
    arm(plan, path, flip(good, bad));
    const result = await validateVerificationReceiptAgainstPlan(receiptFixture(), plan);
    if (result.ok) {
      assert.equal(result.receipt.planDigest, PLAN_DIGEST,
        `plan ${pointer}: a hostile plan cannot bless a different binding`);
      assert.equal(result.receipt.verdict, "pass",
        `plan ${pointer}: a hostile plan cannot bless a different verdict`);
      continue;
    }
    assertRefusalIsRedacted(result, `receipt entry, plan ${pointer}`);
  }
});

test("F97: each entry reads every submitted accessor at most once", async () => {
  const watched = [];
  // Holders are resolved against the pristine document BEFORE any getter exists:
  // walking `/commands/0/...` after arming `/commands` would make this harness the
  // noisiest reader in the room.
  const install = (root, cases) => {
    const targets = cases.map(([pointer]) => {
      const path = documentPath(pointer);
      return { pointer, holder: nodeAt(root, parentOf(path)), key: keyOf(path) };
    });
    for (const { pointer, holder, key } of targets) {
      const original = holder[key];
      let reads = 0;
      Object.defineProperty(holder, key, {
        configurable: true,
        enumerable: true,
        get() {
          reads += 1;
          return original;
        },
      });
      watched.push({ pointer, reads: () => reads });
    }
  };
  const plan = planVector();
  const receipt = receiptFixture();
  install(plan, PLAN_CASES);
  install(receipt, RECEIPT_CASES);

  // One document per entry call: the watched plan answers the plan entry, the
  // watched receipt answers the receipt entry against a clean plan. Sharing one
  // watched document across both calls would count two legitimate captures.
  assert.equal(validateVerificationPlanV1(plan).ok, true, "the watched plan must still validate");
  assert.equal((await validateVerificationReceiptAgainstPlan(receipt, planVector())).ok, true,
    "the watched receipt must still validate");
  assert.ok(watched.length > 30, "the corpus must be large enough to mean something");

  for (const { pointer, reads } of watched) {
    assert.ok(reads() <= 1,
      `${pointer} was read ${reads()} times — a second observation can differ from the first`);
  }
});

test("F97: a blessed DTO carries the snapshot and no live accessor", async () => {
  const plan = planVector();
  arm(plan, "/commands/0/timeoutMs", flip(30000, LIMITS.fastCommandTimeoutMs + 1));
  const pv = validateVerificationPlanV1(plan);
  assert.equal(pv.ok, true, "the first observation is contract-current");
  assertNoAccessors(pv.plan);

  const receipt = receiptFixture();
  arm(receipt, "/results/0/exitCode", flip(0, 1.5));
  const rv = await validateVerificationReceiptAgainstPlan(receipt, planVector());
  assert.equal(rv.ok, true, "the first observation is contract-current");
  assertNoAccessors(rv.receipt);
});

test("F97 reproduction: the fast-stage ceiling cannot be breached by a flipping timeout", () => {
  const plan = planVector();
  arm(plan, "/commands/0/timeoutMs", flip(30000, LIMITS.fastCommandTimeoutMs + 1));
  const result = validateVerificationPlanV1(plan);
  if (result.ok) {
    assert.equal(result.plan.commands[0].timeoutMs, 30000,
      "the entry blessed a timeout it never checked against the fast ceiling");
    assert.equal(result.plan.commands[0].stage, "fast");
  } else {
    assertRefusalIsRedacted(result, "flipping timeoutMs");
  }
});

test("F97 reproduction: duplicate command ids cannot slip past the unique rule", () => {
  const plan = planVector();
  plan.commands.push({ ...plan.commands[0], id: "test", costClass: "moderate" });
  arm(plan, "/commands/1/id", flip("test", "lint"));
  const result = validateVerificationPlanV1(plan);
  if (result.ok) {
    const ids = result.plan.commands.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, `the entry blessed duplicate ids: ${ids.join(",")}`);
    assert.deepEqual(ids, ["lint", "test"], "the DTO must carry the first observation");
  } else {
    assertRefusalIsRedacted(result, "flipping id");
  }
});

test("F97 reproduction: a flipping stage cannot re-scope an aggregate budget", () => {
  const plan = planVector();
  plan.commands.push({ ...plan.commands[0], id: "test", stage: "full", timeoutMs: 60000 });
  arm(plan, "/commands/1/stage", flip("full", "fast"));
  const result = validateVerificationPlanV1(plan);
  if (result.ok) {
    assert.deepEqual(result.plan.commands.map((c) => c.stage), ["fast", "full"],
      "the DTO stages differ from the stages the aggregate budget summed");
  } else {
    assertRefusalIsRedacted(result, "flipping stage");
  }
});

test("F97 reproduction: a flipping verdict cannot bless a receipt the rows contradict", async () => {
  const receipt = receiptFixture();
  receipt.results[0].status = "failed";
  receipt.results[0].exitCode = 1;
  receipt.verdict = "fail";
  const plan = planVector();
  plan.commands[0].stopOnFailure = true;
  arm(receipt, "/verdict", flip("fail", "pass"));
  const result = await validateVerificationReceiptAgainstPlan(receipt, plan);
  if (result.ok) {
    assert.equal(result.receipt.verdict, "fail",
      "the entry blessed a verdict it derived from another document");
  } else {
    assertRefusalIsRedacted(result, "flipping verdict");
  }
});

test("F92 parity: a getter that throws at the plan root is one redacted invalid-type row", () => {
  const plan = planVector();
  Object.defineProperty(plan, "commands", {
    configurable: true,
    enumerable: true,
    get() {
      throw new Error(SECRET);
    },
  });
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.length, 1, JSON.stringify(result.diagnostics));
  assert.deepEqual({ ...result.diagnostics[0] }, { code: "invalid-type", path: "" });
  assert.ok(!JSON.stringify(result).includes("BOOM"), "the attacker's text never crosses D16");
});

test("F92 parity: a throwing getter inside a command names that command", () => {
  const plan = planVector();
  Object.defineProperty(plan.commands[0], "executable", {
    configurable: true,
    enumerable: true,
    get() {
      throw new Error(SECRET);
    },
  });
  const result = validateVerificationPlanV1(plan);
  assert.equal(result.diagnostics.length, 1, JSON.stringify(result.diagnostics));
  assert.deepEqual({ ...result.diagnostics[0] }, { code: "invalid-type", path: "/commands/0" });
  assert.ok(!JSON.stringify(result).includes("BOOM"));
});

test("F92 parity: a throwing getter inside a result row names that row", async () => {
  const receipt = receiptFixture();
  Object.defineProperty(receipt.results[0], "endedAt", {
    configurable: true,
    enumerable: true,
    get() {
      throw new Error(SECRET);
    },
  });
  const result = await validateVerificationReceiptAgainstPlan(receipt, planVector());
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.length, 1, JSON.stringify(result.diagnostics));
  assert.deepEqual({ ...result.diagnostics[0] }, { code: "invalid-type", path: "/results/0" });
  assert.ok(!JSON.stringify(result).includes("BOOM"));
});

test("F92 parity: a throwing getter on the plan a receipt is checked against is refused too", async () => {
  const plan = planVector();
  Object.defineProperty(plan.commands[0], "timeoutMs", {
    configurable: true,
    enumerable: true,
    get() {
      throw new Error(SECRET);
    },
  });
  const result = await validateVerificationReceiptAgainstPlan(receiptFixture(), plan);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.length, 1, JSON.stringify(result.diagnostics));
  assert.deepEqual({ ...result.diagnostics[0] }, { code: "invalid-type", path: "/commands/0" });
  assert.ok(!JSON.stringify(result).includes("BOOM"));
});
