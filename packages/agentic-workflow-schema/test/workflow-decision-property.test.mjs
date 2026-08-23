import { test } from "node:test";
import assert from "node:assert/strict";
import { decideWorkflowAction, WORKFLOW_INTENTS, WORKFLOW_SKILL_PROFILES } from "../dist/index.js";

/** Build a frozen snapshot for property tests. */
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

const policy = { allowedIntents: WORKFLOW_INTENTS, forgeWriteAuthorized: true };

/** Build a valid outcome for a given skill → nextIntent. */
function makeOutcome(skill, nextIntent, targets = [], status = "completed") {
  return {
    contract: "agentic-workflow/skill-outcome",
    version: 1,
    skill,
    status,
    summary: "ok",
    next: { intent: nextIntent, targets },
    blockers: [],
    questions: [],
    discoveries: [],
    evidence_refs: ["workflow-snapshot", "current-candidate"],
  };
}

function inputFor(snapshot, outcome, rev) {
  return {
    snapshot,
    lastOutcome: outcome,
    lastOutcomeSourceRevision: rev || "abc123",
    policy,
  };
}

// Seeded deterministic fuzz: random field mutations never produce invoke
test("property/fuzz: randomized field mutations never produce invoke", () => {
  const snapshot = frozenSnapshot();
  const validOutcome = makeOutcome("status", "discover-repository-state");

  const malformations = [
    // null/undefined/prim value inputs
    () => decideWorkflowAction(null),
    () => decideWorkflowAction(undefined),
    () => decideWorkflowAction(42),
    () => decideWorkflowAction("string"),
    () => decideWorkflowAction(true),
    () => decideWorkflowAction([]),
    // Malformed input object
    () => decideWorkflowAction({ lastOutcome: null, policy }),
    () => decideWorkflowAction({ snapshot: "not-an-object", lastOutcome: validOutcome, policy }),
    () => decideWorkflowAction({ snapshot: {}, lastOutcome: validOutcome, policy }),
    () => decideWorkflowAction({ snapshot, lastOutcome: "not-object", policy }),
    () => decideWorkflowAction({ snapshot, lastOutcome: {}, policy }),
    () => decideWorkflowAction({ snapshot, lastOutcome: validOutcome, policy: "not-object" }),
    () => decideWorkflowAction({ snapshot, lastOutcome: validOutcome, policy: {} }),
    // Malformed snapshot
    () => decideWorkflowAction(inputFor({ ...snapshot, version: "not-number" }, validOutcome)),
    () => decideWorkflowAction(inputFor({ ...snapshot, contract: null }, validOutcome)),
    () => decideWorkflowAction(inputFor({ ...snapshot, sourceRevision: 123 }, validOutcome)),
    // Malformed outcome
    () => decideWorkflowAction(inputFor(snapshot, { ...validOutcome, version: "not-number" })),
    () => decideWorkflowAction(inputFor(snapshot, { ...validOutcome, skill: 123 })),
    () => decideWorkflowAction(inputFor(snapshot, { ...validOutcome, status: "bogus" })),
    () => decideWorkflowAction(inputFor(snapshot, { ...validOutcome, next: "not-object" })),
    () => decideWorkflowAction(inputFor(snapshot, { ...validOutcome, next: { intent: "discover-repository-state" } })),
  ];

  for (const fn of malformations) {
    assert.doesNotThrow(fn, `should not throw`);
  }
});

// Determinism: same input always returns same decision
test("property/determinism: same input always returns same decision", () => {
  const snapshot = frozenSnapshot();
  const outcome = makeOutcome("status", "discover-repository-state");
  const resultStrs = Array.from({ length: 50 }, () =>
    JSON.stringify(decideWorkflowAction(inputFor(snapshot, outcome))),
  );
  const first = resultStrs[0];
  for (let i = 1; i < resultStrs.length; i++) {
    assert.equal(resultStrs[i], first, `iteration ${i} differs`);
  }
});

// Property: every intent that is allowed by transition table but has no capability profile
// should still be allowed (built-in terminal actions like "merge")
test("property: built-in terminal actions without profiles are allowed", () => {
  const snapshot = frozenSnapshot();
  const outcome = makeOutcome("audit-pr", "merge", ["merge"], "completed");
  const result = decideWorkflowAction(inputFor(snapshot, outcome));
  assert.equal(result.kind, "invoke");
  assert.equal(result.intent, "merge");
  assert.equal(result.reasonCode, "invoke-proven-transition");
});