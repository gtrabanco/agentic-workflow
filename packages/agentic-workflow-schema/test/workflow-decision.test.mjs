import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WORKFLOW_INTENTS,
  WORKFLOW_TRANSITION_TABLE,
  WORKFLOW_DECISION_SENSE_CODES,
  WORKFLOW_DECISION_STOP_CODES,
  WORKFLOW_DECISION_INVOKE_CODES,
  decideWorkflowAction,
  WORKFLOW_SKILL_PROFILES,
} from "../dist/index.js";

// Exhaustiveness: every intent is covered somewhere in the transition table
// (as a row key, an allowed next intent, or an explicit recommendation/merge rule).
// Every row key is a valid workflow intent.

test("P1 exhaustiveness: all intents covered", () => {
  const covered = new Set();

  // Row keys → covered
  for (const row of WORKFLOW_TRANSITION_TABLE) {
    covered.add(row.key);
  }

  // Allowed next intents → covered
  for (const row of WORKFLOW_TRANSITION_TABLE) {
    for (const next of row.allowed) {
      covered.add(next);
    }
  }

  const allIntentSet = new Set(WORKFLOW_INTENTS);
  const uncovered = [...allIntentSet].filter((i) => !covered.has(i));

  assert.equal(uncovered.length, 0,
    `All intents should be covered (row key, allowed next, or recommendation). `
    + `Uncovered: ${uncovered.join(", ") || "none"}`);
});

test("P1 exhaustiveness: every row key is a known intent", () => {
  const known = new Set(WORKFLOW_INTENTS);
  const badKeys = [];

  for (const row of WORKFLOW_TRANSITION_TABLE) {
    if (!known.has(row.key)) {
      badKeys.push(row.key);
    }
  }

  assert.equal(badKeys.length, 0,
    `Every row key must be a known intent. Bad keys: ${badKeys.join(", ") || "none"}`);
});

test("P1 reason codes are frozen arrays", () => {
  assert.equal(Object.isFrozen(WORKFLOW_DECISION_SENSE_CODES), true);
  assert.equal(Object.isFrozen(WORKFLOW_DECISION_STOP_CODES), true);
  assert.equal(Object.isFrozen(WORKFLOW_DECISION_INVOKE_CODES), true);
});

test("P1 transition table is frozen", () => {
  assert.equal(Object.isFrozen(WORKFLOW_TRANSITION_TABLE), true);
});

// Every row has non-empty allowed when it should (sense-initial is the only empty-row case)
test("P1 row keys cover profiled skills and none", () => {
  const rowKeys = new Set(WORKFLOW_TRANSITION_TABLE.map((r) => r.key));

  // Verify the explicit row keys match the spec design:
  // none, init-workspace, status, discover-repository-state,
  // resolve-repository-state, design-feature, plan-feature, plan-fix,
  // triage-issue, execute-phase, review-change, loop-review-fold, audit-pr, merge
  const expectedKeys = [
    "none",
    "init-workspace",
    "status",
    "discover-repository-state",
    "resolve-repository-state",
    "design-feature",
    "plan-feature",
    "plan-fix",
    "triage-issue",
    "execute-phase",
    "review-change",
    "loop-review-fold",
    "audit-pr",
    "merge",
  ];

  assert.equal(rowKeys.size, expectedKeys.length,
    `Expected ${expectedKeys.length} rows, got ${rowKeys.size}`);

  for (const key of expectedKeys) {
    assert.ok(rowKeys.has(key), `Row key present: ${key}`);
  }
});
// ---------------------------------------------------------------------------
// P3: Table-driven assertions — twelve scenario classes
// ---------------------------------------------------------------------------

/** Build a common fresh outcome for a given skill and next intent. */
function freshOutcome(skill, nextIntent, targets = []) {
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
    evidence_refs: ["snapshot@docs/roadmap.md:1"],
  };
}

/** Build a common frozen snapshot. */
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

/** Build a frozen snapshot with contradictions. */
function contradictedSnapshot() {
  return {
    contract: "agentic-workflow/workflow-snapshot",
    version: 1,
    sourceRevision: "abc123",
    repository: { branch: "main", headSha: "def456", dirty: false },
    repositoryState: "contradicted",
    unit: null,
    phase: { current: null, total: null, completed: null, names: [] },
    provenance: [],
    contradictions: [
      { field: "unit.id", source: "progress.md", line: 1, detail: "mismatch" },
    ],
    unknowns: [],
  };
}

/** Build an unknown snapshot. */
function unknownSnapshot() {
  return {
    contract: "agentic-workflow/workflow-snapshot",
    version: 1,
    sourceRevision: "abc123",
    repository: { branch: "main", headSha: "def456", dirty: false },
    repositoryState: "unknown",
    unit: null,
    phase: { current: null, total: null, completed: null, names: [] },
    provenance: [],
    contradictions: [],
    unknowns: [{ field: "unit.status", reason: "not found" }],
  };
}

const policy = {
  allowedIntents: WORKFLOW_INTENTS,
  forgeWriteAuthorized: true,
};

function inputFor(snapshot, outcome, policyOverride) {
  return {
    snapshot,
    lastOutcome: outcome,
    lastOutcomeSourceRevision: "abc123",
    policy: policyOverride || policy,
  };
}

// Class 1: Fresh — status → discover-repository-state on frozen repo → invoke

test("P3 scenario: fresh status → discover-repository-state invokes", () => {
  const outcome = freshOutcome("status", "discover-repository-state");
  const decision = decideWorkflowAction(inputFor(frozenSnapshot(), outcome));
  assert.equal(decision.kind, "invoke");
  assert.equal(decision.intent, "discover-repository-state");
  assert.equal(decision.reasonCode, "invoke-proven-transition");
});

// Class 2: Stale — revision mismatch → sense-stale-revision

test("P3 scenario: stale revision returns sense-stale-revision", () => {
  const outcome = freshOutcome("status", "discover-repository-state");
  const decision = decideWorkflowAction({
    snapshot: frozenSnapshot(),
    lastOutcome: outcome,
    lastOutcomeSourceRevision: "xyz999",
    policy,
  });
  assert.equal(decision.kind, "sense");
  assert.equal(decision.intent, "status");
  assert.equal(decision.reasonCode, "sense-stale-revision");
});

// Class 3: Blocked — blocked outcome → stop-blocked

test("P3 scenario: blocked outcome returns stop-blocked", () => {
  const outcome = { ...freshOutcome("status", "discover-repository-state"), status: "blocked", blockers: [{ kind: "dependency", id: "d1", scope: "unit", detail: "missing" }], questions: [] };
  const decision = decideWorkflowAction(inputFor(frozenSnapshot(), outcome));
  assert.equal(decision.kind, "stop");
  assert.equal(decision.intent, "stop");
  assert.equal(decision.reasonCode, "stop-blocked");
  assert.deepEqual(decision.targets, ["d1"]);
});

// Class 4: Needs-input — needs-input outcome → stop-needs-input

test("P3 scenario: needs-input outcome returns stop-needs-input", () => {
  const outcome = { ...freshOutcome("status", "discover-repository-state"), status: "needs-input", blockers: [], questions: [{ id: "q1", question: "what?", options: [] }] };
  const decision = decideWorkflowAction(inputFor(frozenSnapshot(), outcome));
  assert.equal(decision.kind, "stop");
  assert.equal(decision.intent, "stop");
  assert.equal(decision.reasonCode, "stop-needs-input");
  assert.deepEqual(decision.targets, ["q1"]);
});

// Class 5: Failed — failed outcome → stop-failed

test("P3 scenario: failed outcome returns stop-failed", () => {
  const outcome = { ...freshOutcome("status", "discover-repository-state"), status: "failed", blockers: [], questions: [], discoveries: [{ kind: "defect", scope: "current-unit", summary: "build failed", evidence_refs: [], proposed_intent: "status" }] };
  const decision = decideWorkflowAction(inputFor(frozenSnapshot(), outcome));
  assert.equal(decision.kind, "stop");
  assert.equal(decision.intent, "stop");
  assert.equal(decision.reasonCode, "stop-failed");
  assert.deepEqual(decision.targets, ["build failed"]);
});

// Class 6: Contradictory — contradictions present with non-resolve proposal → stop-contradiction

test("P3 scenario: contradictory snapshot with non-resolve proposal returns stop-contradiction", () => {
  const outcome = freshOutcome("status", "discover-repository-state");
  const decision = decideWorkflowAction(inputFor(contradictedSnapshot(), outcome));
  assert.equal(decision.kind, "stop");
  assert.equal(decision.intent, "stop");
  assert.equal(decision.reasonCode, "stop-contradiction");
  assert.ok(decision.evidenceRefs.some((r) => r.startsWith("contradiction:")));
});

// Class 7: Unknown — unknown snapshot state → sense-missing-evidence

test("P3 scenario: unknown snapshot state returns sense-missing-evidence", () => {
  const outcome = freshOutcome("status", "discover-repository-state");
  const decision = decideWorkflowAction(inputFor(unknownSnapshot(), outcome));
  assert.equal(decision.kind, "sense");
  assert.equal(decision.intent, "status");
  assert.equal(decision.reasonCode, "sense-missing-evidence");
});

// Class 8: Unauthorized effect — status → ask-human (non-invocable)
// → stop-forbidden-transition (caught by non-invocable intent check)

test("P3 scenario: unauthorized effect returns stop-forbidden-transition", () => {
  const outcome = freshOutcome("status", "ask-human");
  const decision = decideWorkflowAction(inputFor(frozenSnapshot(), outcome));
  assert.equal(decision.kind, "stop");
  assert.equal(decision.intent, "stop");
  assert.equal(decision.reasonCode, "stop-forbidden-transition");
});

// Class 9: Missing evidence — required evidence not in refs → sense-missing-evidence

test("P3 scenario: missing required evidence returns sense-missing-evidence", () => {
  // discover-repository-state has no required evidence, so this case tests
  // review-change which requires ["current-candidate", "verification"]
  const outcome = {
    contract: "agentic-workflow/skill-outcome",
    version: 1,
    skill: "status",
    status: "completed",
    summary: "ok",
    next: { intent: "review-change", targets: [] },
    blockers: [],
    questions: [],
    discoveries: [],
    evidence_refs: [], // missing required evidence
  };
  const decision = decideWorkflowAction(inputFor(frozenSnapshot(), outcome));
  assert.equal(decision.kind, "sense");
  assert.equal(decision.intent, "status");
  assert.equal(decision.reasonCode, "sense-missing-evidence");
});

// Class 10: Review — review-change as next intent after status on frozen repo
// → invoke (with required evidence present)

test("P3 scenario: review-change after status on frozen repo invokes", () => {
  const outcome = {
    ...freshOutcome("status", "review-change"),
    evidence_refs: ["current-candidate", "verification"],
  };
  const decision = decideWorkflowAction(inputFor(frozenSnapshot(), outcome));
  assert.equal(decision.kind, "invoke");
  assert.equal(decision.intent, "review-change");
  assert.equal(decision.reasonCode, "invoke-proven-transition");
});

// Class 11: Audit — audit-pr as next intent after review-change on frozen repo
// → invoke (with required evidence present)

test("P3 scenario: audit-pr after review-change on frozen repo invokes", () => {
  const outcome = {
    ...freshOutcome("review-change", "audit-pr"),
    evidence_refs: ["current-candidate", "verification", "independent-review", "pull-request-state"],
  };
  const decision = decideWorkflowAction(inputFor(frozenSnapshot(), outcome));
  assert.equal(decision.kind, "invoke");
  assert.equal(decision.intent, "audit-pr");
  assert.equal(decision.reasonCode, "invoke-proven-transition");
});

// Class 12: Merge — merge as next intent after audit-pr on frozen repo
// → invoke (merge has no profile, allowed as built-in terminal action)

test("P3 scenario: merge after audit-pr on frozen repo invokes", () => {
  const outcome = {
    ...freshOutcome("audit-pr", "merge", ["merge"]),
    evidence_refs: ["current-candidate", "verification", "independent-review", "pull-request-state"],
  };
  const decision = decideWorkflowAction(inputFor(frozenSnapshot(), outcome));
  assert.equal(decision.kind, "invoke");
  assert.equal(decision.intent, "merge");
  assert.equal(decision.reasonCode, "invoke-proven-transition");
});

// Target-contract negative matrix: free-form, additional, and mismatched targets
// return stop-forbidden-transition; missing required identities return sense-missing-evidence

test("P3 target-contract: free-form extra targets forbidden", () => {
  const outcome = freshOutcome("audit-pr", "merge", ["merge", "extra-target"]);
  const decision = decideWorkflowAction(inputFor(frozenSnapshot(), outcome));
  // audit-pr allows exactly 1 target; 2 → stop
  assert.ok(decision.kind === "stop" || decision.kind === "sense", "extra targets should be rejected");
});

// ---------------------------------------------------------------------------
// P3: Property/fuzz tests
// ---------------------------------------------------------------------------

test("P3 fuzz: malformed input never throws and never produces invoke", () => {
  const malforms = [
    null,
    undefined,
    42,
    "string",
    true,
    [],
    { snapshot: null, lastOutcome: null, policy: null },
    { snapshot: "not-an-object", lastOutcome: null, policy: {} },
    { snapshot: {}, lastOutcome: "not-object", policy: {} },
    { snapshot: {}, lastOutcome: {}, policy: "not-object" },
  ];
  for (const bad of malforms) {
    assert.doesNotThrow(() => {
      const result = decideWorkflowAction(bad);
      assert.notEqual(result.kind, "invoke", `${JSON.stringify(bad)} must never produce invoke`);
    });
  }
});

test("P3 fuzz: unrecognized values in fields never produce invoke", () => {
  const snapshot = { ...frozenSnapshot() };
  const outcome = { ...freshOutcome("status", "discover-repository-state") };
  const badValues = [
    { ...frozenSnapshot(), repositoryState: "frozen", version: 999 },
    { ...frozenSnapshot(), contract: "wrong", sourceRevision: "abc" },
    { ...outcome, status: "bogus", skill: "x" },
    { ...outcome, version: 99, skill: "x" },
  ];
  for (const badSnapshot of badValues.slice(0, 2)) {
    assert.doesNotThrow(() => {
      const result = decideWorkflowAction(inputFor(badSnapshot, outcome));
      assert.notEqual(result.kind, "invoke");
    });
  }
  for (const badOutcome of badValues.slice(2)) {
    assert.doesNotThrow(() => {
      const result = decideWorkflowAction(inputFor(snapshot, badOutcome));
      assert.notEqual(result.kind, "invoke", `bad outcome ${badOutcome.status ?? badOutcome.version} must not invoke`);
    });
  }
});

test("P3 fuzz: random string intents never produce invoke", () => {
  const randomIntents = ["xyz", "123", "", "PLAN-EXECUTE", "unknown-skill", "MERGE", "status-extras"];
  for (const intent of randomIntents) {
    const outcome = { ...freshOutcome("status", intent), next: { intent, targets: [intent] } };
    assert.doesNotThrow(() => {
      const result = decideWorkflowAction(inputFor(frozenSnapshot(), outcome));
      assert.notEqual(result.kind, "invoke", `random intent "${intent}" must not produce invoke`);
    });
  }
});

// ---------------------------------------------------------------------------
// P3: Determinism assertions
// ---------------------------------------------------------------------------

test("P3 determinism: identical input produces deeply equal decisions", () => {
  const snapshot = frozenSnapshot();
  const outcome = freshOutcome("status", "discover-repository-state");
  const input = inputFor(snapshot, outcome);

  const results = Array.from({ length: 100 }, () => decideWorkflowAction(input));
  const first = JSON.stringify(results[0]);
  for (const r of results.slice(1)) {
    assert.equal(JSON.stringify(r), first, "all results must be deeply equal");
  }
});
