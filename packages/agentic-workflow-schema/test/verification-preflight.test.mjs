// F99 — refusal work must be bounded by the declared limits, not by the payload.
//
// Measured at 3112e34 before the fold: a 10,000-command plan cost 103.8 ms and a
// 200,000-command plan cost 1,729 ms (448 MB RSS) — every one of them refused with
// the SAME root `limit-exceeded` row, because the D14 byte budget was measured by
// serializing the entire submitted document first, and the F97 snapshot then walked
// it a second time. Refusal cost that scales with attacker-supplied size is a
// denial-of-service surface on a validation entry point.
//
// The fold sequences both entries as: bounded capture → exact byte budget on the
// snapshot → full validation walk. The capture accumulates the canonical size as it
// copies and aborts on the budget, so an illegal payload is refused after touching
// ~the budget's worth of it, and the one-read snapshot contract (F97) still holds.
//
// Written RED FIRST against `c42104c`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
  VERIFICATION_LIMITS,
  validateVerificationPlanV1,
  validateVerificationReceiptAgainstPlan,
  canonicalizeVerificationPlan,
} from "../dist/index.js";
import {
  assertDiagnosticAt,
  assertOnlyDiagnostic,
  hasDiagnostic,
} from "./fixtures/verification-diagnostics.mjs";

const SECRET = "PREFLIGHT-BOOM-secret";
/** The bound F99 names: a cardinality-illegal payload is refused in ≤ 50 ms. */
const REFUSAL_BOUND_MS = 50;

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

function planOf(count) {
  return {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: Array.from({ length: count }, (_, i) => command({ id: `c${i}` })),
  };
}

function receiptOf(count) {
  return {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest: "a".repeat(64),
    candidateSnapshotDigest: "e".repeat(64),
    acceptanceFingerprint: "f".repeat(64),
    stageRequested: "full",
    results: Array.from({ length: count }, (_, i) => ({
      commandId: `c${i}`,
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

// The bound F99 names is refusal work versus payload size, not interpreter
// warm-up: every timed call below runs after the entry paths are compiled.
validateVerificationPlanV1(planOf(4));
await validateVerificationReceiptAgainstPlan(receiptOf(4), planOf(4));

/**
 * Timed entry call — the fixture build stays outside the measurement, and the
 * reported time is the MINIMUM of three runs: a 200,000-object fixture build
 * hands its GC bill to whichever sample follows it, and the quantity F99 bounds
 * is the entry's own work, not the allocator's.
 */
async function timed(label, run) {
  let result;
  let elapsed = Number.POSITIVE_INFINITY;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const started = performance.now();
    result = await run();
    elapsed = Math.min(elapsed, performance.now() - started);
  }
  process.stdout.write(`  ${label}: ${elapsed.toFixed(2)} ms (min of 3)\n`);
  return { result, elapsed };
}

test("F99: a 200,000-command plan is refused limit-exceeded within 50 ms", async () => {
  const payload = planOf(200_000);
  const { result, elapsed } = await timed("200k plan refusal", () =>
    Promise.resolve(validateVerificationPlanV1(payload)),
  );
  assert.ok(elapsed <= REFUSAL_BOUND_MS, `200,000 commands refused in ${elapsed.toFixed(2)} ms (bound ${REFUSAL_BOUND_MS} ms)`);
  assertOnlyDiagnostic(result, "limit-exceeded", "", "200k-command plan");
});

test("F99: a 10,000-command plan is refused within the same bound", async () => {
  const payload = planOf(10_000);
  const { result, elapsed } = await timed("10k plan refusal", () =>
    Promise.resolve(validateVerificationPlanV1(payload)),
  );
  assert.ok(elapsed <= REFUSAL_BOUND_MS, `10,000 commands refused in ${elapsed.toFixed(2)} ms`);
  assertOnlyDiagnostic(result, "limit-exceeded", "", "10k-command plan");
});

test("F99: a 200,000-row receipt is refused by the receipt entry within 50 ms", async () => {
  const payload = receiptOf(200_000);
  const { result, elapsed } = await timed("200k receipt refusal", () =>
    validateVerificationReceiptAgainstPlan(payload, planOf(1)),
  );
  assert.ok(elapsed <= REFUSAL_BOUND_MS, `200,000 rows refused in ${elapsed.toFixed(2)} ms`);
  assertOnlyDiagnostic(result, "limit-exceeded", "", "200k-row receipt");
});

test("F99: the refusal stops at the budget — it never walks the whole payload", async () => {
  // Element 4,000 carries an accessor that would report `invalid-type` if it were
  // ever read. Answering `limit-exceeded` instead proves the entry bounded its own
  // work rather than discovering the oversize only after a full traversal.
  const payload = planOf(200_000);
  Object.defineProperty(payload.commands, 4_000, {
    configurable: true,
    enumerable: true,
    get() {
      throw new Error(SECRET);
    },
  });
  const result = validateVerificationPlanV1(payload);
  assertOnlyDiagnostic(result, "limit-exceeded", "", "budget-aborted plan");
  assert.ok(!JSON.stringify(result).includes(SECRET), "the attacker's text never crosses D16");
});

test("F99: a payload over capacity but inside the byte budget keeps its own pointer", () => {
  // The budget row outranks a shape ceiling only when the budget is what broke.
  // 129 ordinary commands stay far below 256 KiB; the aggregate-budget row this
  // fixture also earns is today's behaviour, and the leading row is still the
  // cardinality one at /commands — never the root byte-budget row.
  const result = validateVerificationPlanV1(planOf(VERIFICATION_LIMITS.commands + 1));
  assertDiagnosticAt(result, "limit-exceeded", "/commands", "129-command plan");
  assert.ok(!hasDiagnostic(result, "limit-exceeded", ""), "the byte budget must not fire inside the byte budget");
});

test("F99: a multibyte document is measured in bytes, not UTF-16 units", () => {
  // One CJK char costs 1 UTF-16 unit but 3 UTF-8 bytes, so a document whose
  // canonical form stays well under planBytes UNITS can still cross the budget
  // in BYTES. The refusal must come from the exact byte measure and answer one
  // root row like every oversized payload.
  const multibyte = planOf(1);
  multibyte.commands[0].args = Array.from(
    { length: 23 },
    () => "\u3042".repeat(VERIFICATION_LIMITS.argChars),
  );

  const canonical = canonicalOf(multibyte);
  assert.ok(canonical.length < VERIFICATION_LIMITS.planBytes,
    "fixture: the canonical form stays under the budget in UTF-16 units");
  assert.ok(encode(canonical).length > VERIFICATION_LIMITS.planBytes,
    "fixture: the canonical form crosses the budget in UTF-8 bytes");
  assertOnlyDiagnostic(validateVerificationPlanV1(multibyte), "limit-exceeded", "", "multibyte over-byte plan");

  // Mirror risk: a small fully-multibyte document must never be refused for
  // anything its unit count says.
  const small = planOf(1);
  small.commands[0].executable = "\u30c6\u30b9\u30c8";
  assert.equal(validateVerificationPlanV1(small).ok, true, "a small multibyte plan is valid");
});

/**
 * Independent oracle for the canonical form — the same shape the contract's
 * serializer emits (sorted keys, compact separators), computed here so the
 * fixture's units/bytes split does not trust the code under test.
 */
function canonicalOf(value) {
  if (value === null) return "null";
  const kind = typeof value;
  if (kind === "string" || kind === "number" || kind === "boolean") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return "[" + value.map(canonicalOf).join(",") + "]";
  }
  const keys = Object.keys(value).sort();
  const fields = keys.map((key) => `${JSON.stringify(key)}:${canonicalOf(value[key])}`);
  return "{" + fields.join(",") + "}";
}

const encode = (text) => new TextEncoder().encode(text);

test("F99: a payload over BOTH ceilings still answers exactly one root row", () => {
  const wide = planOf(VERIFICATION_LIMITS.commands + 1);
  for (const c of wide.commands) c.args = ["a".repeat(VERIFICATION_LIMITS.argChars), "b".repeat(VERIFICATION_LIMITS.argChars)];
  assertOnlyDiagnostic(validateVerificationPlanV1(wide), "limit-exceeded", "", "over-budget 129-command plan");
});

test("F99: the preflight bound is independent of the submitted nesting width", async () => {
  // 200k arguments on a single command trips the same budget from the other side.
  const payload = planOf(1);
  payload.commands[0].args = Array.from({ length: 200_000 }, (_, i) => `a-${i}`);
  const { result, elapsed } = await timed("200k-arg refusal", () =>
    Promise.resolve(validateVerificationPlanV1(payload)),
  );
  assert.ok(elapsed <= REFUSAL_BOUND_MS, `200,000 args refused in ${elapsed.toFixed(2)} ms`);
  assertOnlyDiagnostic(result, "limit-exceeded", "", "200k-arg plan");
});
