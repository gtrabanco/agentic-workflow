// Feature 28 / fix-162 — the `impossible-timeline` freshness guard.
//
// The receipt's own recorded timeline is an anti-forgery assertion: a back-dated
// receipt (finish predating its recorded source revision's commit date beyond the
// published skew) cannot be honest. The schema publishes the vocabulary member,
// the skew constant, and the pure predicate; the git-backed sensor evaluates the
// documented slot, and `scripts/pre-execution-attribution.test.mjs` documents the
// composition. This suite pins the pure surface and its fail-open behaviour.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRE_EXECUTION_FRESHNESS_CODES,
  PRE_EXECUTION_RECEIPT_TIMELINE_SKEW_MS,
  isImpossibleReceiptTimeline,
} from "../dist/index.js";

test("impossible-timeline is a published freshness code, directly after stale-policy", () => {
  assert.ok(PRE_EXECUTION_FRESHNESS_CODES.includes("impossible-timeline"), "member present");
  const i = PRE_EXECUTION_FRESHNESS_CODES.indexOf("impossible-timeline");
  assert.equal(PRE_EXECUTION_FRESHNESS_CODES[i - 1], "stale-policy",
    "the member is inserted directly after stale-policy (the documented slot)");
  assert.equal(Object.isFrozen(PRE_EXECUTION_FRESHNESS_CODES), true);
});

test("the published timeline skew constant is 5 minutes (300_000 ms)", () => {
  assert.equal(PRE_EXECUTION_RECEIPT_TIMELINE_SKEW_MS, 300_000);
});

test("the predicate flags a back-dated finish (earlier than commit - skew) as impossible", () => {
  const commitDate = "2026-09-04T09:00:00Z";
  const finishedAt = "2026-09-04T13:02:00Z"; // would be late, but see below
  // back-dated: finish ~20 h BEFORE the commit date, well beyond the skew
  const backDated = "2026-09-03T13:02:00Z";
  assert.equal(isImpossibleReceiptTimeline({ finishedAt: backDated, sourceCommitDate: commitDate }), true);
  // honest: finish after the commit date
  assert.equal(isImpossibleReceiptTimeline({ finishedAt, sourceCommitDate: commitDate }), false);
});

test("the predicate answers false (not impossible) for a finish within the skew before the commit", () => {
  // 2 minutes before the commit — inside the 5-minute skew → tolerated (fail-open)
  const commitDate = "2026-09-04T09:00:00Z";
  const finishedAt = "2026-09-04T08:58:00Z";
  assert.equal(isImpossibleReceiptTimeline({ finishedAt, sourceCommitDate: commitDate }), false);
});

test("the predicate is fail-open: missing or unparsable stamps answer null, never throw", () => {
  const commitDate = "2026-09-04T09:00:00Z";
  assert.equal(isImpossibleReceiptTimeline({ finishedAt: null, sourceCommitDate: commitDate }), null);
  assert.equal(isImpossibleReceiptTimeline({ finishedAt: undefined, sourceCommitDate: commitDate }), null);
  assert.equal(isImpossibleReceiptTimeline({ finishedAt: "not-a-date", sourceCommitDate: commitDate }), null);
  assert.equal(isImpossibleReceiptTimeline({ finishedAt: "2026-09-03T13:02:00Z", sourceCommitDate: null }), null);
  assert.equal(isImpossibleReceiptTimeline({ finishedAt: "2026-09-03T13:02:00Z", sourceCommitDate: "garbage" }), null);
  assert.equal(isImpossibleReceiptTimeline({ finishedAt: "2026-09-03T13:02:00Z", sourceCommitDate: commitDate, skewMs: -1 }), null);
});
