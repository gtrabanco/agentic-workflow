// Feature 31 P2 — the derived review-loop cap refusal (AC5, O5/O15).
//
// Proves the decider's three behaviours: after two consecutive unconverged
// review→repair→re-review cycles a `review-spec`/`review-plan` proposal stops
// with `stop-review-loop-cap` and the human route named; a PASS reset (count
// below 2) leaves the next cycle allowed; a `needs-design` outcome still routes
// to `design-feature`. The counting rule itself is pinned against the shared
// `deriveReviewLoopCycles` helper the sensor projects, so the decider's input and
// the sensor's output cannot drift.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WORKFLOW_INTENTS,
  WORKFLOW_DECISION_STOP_CODES,
  decideWorkflowAction,
} from "../dist/index.js";
import {
  deriveReviewLoopCycles,
  parseReceipts,
} from "../../../scripts/pre-execution-contract.mjs";

function frozenSnapshot() {
  return {
    contract: "agentic-workflow/workflow-snapshot",
    version: 1,
    sourceRevision: "abc123",
    repository: { branch: "main", headSha: "def456", dirty: false },
    repositoryState: "frozen",
    unit: null,
    phase: { current: null, total: null, completed: null, names: [] },
    provenance: [],
    contradictions: [],
    unknowns: [],
  };
}

function outcomeFor(skill, nextIntent, targets = []) {
  return {
    contract: "agentic-workflow/skill-outcome",
    version: 1,
    skill,
    status: "completed",
    summary: "ok",
    next: { intent: nextIntent, targets },
    blockers: [],
    questions: [],
    discoveries: [],
    evidence_refs: ["snapshot@docs/roadmap.md:1", "workflow-snapshot", "pre-execution-review"],
  };
}

const policy = { allowedIntents: WORKFLOW_INTENTS, forgeWriteAuthorized: true };

const inputFor = (skill, nextIntent, reviewLoopCycles) => ({
  snapshot: frozenSnapshot(),
  lastOutcome: outcomeFor(skill, nextIntent),
  lastOutcomeSourceRevision: "abc123",
  policy,
  reviewLoopCycles,
});

test("stop-review-loop-cap is a published stop code and the vocabulary keeps its spelling", () => {
  assert.ok(WORKFLOW_DECISION_STOP_CODES.includes("stop-review-loop-cap"));
  assert.deepEqual([...WORKFLOW_DECISION_STOP_CODES], [
    "stop-blocked",
    "stop-needs-input",
    "stop-failed",
    "stop-contradiction",
    "stop-policy-denied",
    "stop-forbidden-transition",
    "stop-review-loop-cap",
  ]);
});

test("two consecutive unconverged cycles refuse a third review-spec invocation", () => {
  const decision = decideWorkflowAction(inputFor("design-feature", "review-spec", { spec: 2 }));
  assert.equal(decision.kind, "stop");
  assert.equal(decision.intent, "ask-human");
  assert.equal(decision.reasonCode, "stop-review-loop-cap");
  assert.match(decision.detail, /design-feature/, "the human route is named");
});

test("two consecutive unconverged cycles refuse a third review-plan invocation", () => {
  const decision = decideWorkflowAction(inputFor("plan-feature", "review-plan", { plan: 2 }));
  assert.equal(decision.kind, "stop");
  assert.equal(decision.intent, "ask-human");
  assert.equal(decision.reasonCode, "stop-review-loop-cap");
  assert.match(decision.detail, /design-feature/);
});

test("a PASS reset leaves the next cycle allowed", () => {
  for (const cycles of [0, 1]) {
    const decision = decideWorkflowAction(inputFor("design-feature", "review-spec", { spec: cycles }));
    assert.notEqual(decision.reasonCode, "stop-review-loop-cap",
      `count ${cycles} must not trigger the cap · ${JSON.stringify(decision)}`);
  }
  // The other stage's count never blocks this stage.
  const decision = decideWorkflowAction(inputFor("design-feature", "review-spec", { plan: 5 }));
  assert.notEqual(decision.reasonCode, "stop-review-loop-cap");
});

test("a needs-design outcome still routes to design-feature under the cap", () => {
  const decision = decideWorkflowAction(inputFor("review-spec", "design-feature", { spec: 2 }));
  assert.notEqual(decision.reasonCode, "stop-review-loop-cap",
    "the cap bounds review invocations, never the human route");
  assert.equal(decision.kind, "invoke");
  assert.equal(decision.intent, "design-feature");
});

test("an absent count never triggers the cap", () => {
  const decision = decideWorkflowAction(inputFor("design-feature", "review-spec", undefined));
  assert.notEqual(decision.reasonCode, "stop-review-loop-cap");
});

// ---------------------------------------------------------------------------
// The counting rule, pinned against the helper the sensor projects
// ---------------------------------------------------------------------------

const receiptBlock = (stage, verdict, id) => [
  `## Pre-execution review receipt v1 — ${stage}`,
  `- Review: ${id} · Snapshot: ${"a".repeat(64)} · Verdict: ${verdict}`,
  "",
].join("\n");

test("the derived count is the consecutive FAIL receipts since the last PASS", () => {
  const receipts = parseReceipts([
    receiptBlock("spec", "spec-review-fail", "s1"),
    receiptBlock("spec", "spec-review-fail", "s2"),
    receiptBlock("plan", "plan-review-fail", "p1"),
    receiptBlock("spec", "spec-review-pass", "s3"),
    receiptBlock("plan", "plan-review-pass", "p2"),
    receiptBlock("spec", "spec-review-fail", "s4"),
    receiptBlock("plan", "plan-review-fail", "p3"),
    receiptBlock("plan", "plan-review-fail", "p4"),
  ].join("\n"));
  assert.deepEqual(deriveReviewLoopCycles(receipts), { spec: 1, plan: 2 });
});

test("a stage with no receipt reads zero, and a non-FAIL/non-PASS verdict neither resets nor increments", () => {
  assert.deepEqual(deriveReviewLoopCycles(parseReceipts("")), { spec: 0, plan: 0 });
  const receipts = parseReceipts([
    receiptBlock("spec", "spec-review-fail", "s1"),
    receiptBlock("spec", "needs-design", "s2"),
    receiptBlock("spec", "spec-review-fail", "s3"),
  ].join("\n"));
  assert.deepEqual(deriveReviewLoopCycles(receipts), { spec: 2, plan: 0 });
});
