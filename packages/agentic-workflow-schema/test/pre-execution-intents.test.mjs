// Feature 28 P1 — suite for the additive workflow vocabulary: the two review
// intents, their capability profiles, the evidence token they require, and the
// deterministic transition fixtures that make the design → review → plan → review
// → execute chain provable without changing any existing intent's meaning.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SKILL_REQUIRED_EVIDENCE,
  WORKFLOW_INTENTS,
  WORKFLOW_SKILL_PROFILES,
  WORKFLOW_TRANSITION_TABLE,
  decideWorkflowAction,
} from "../dist/index.js";

const policy = { allowedIntents: WORKFLOW_INTENTS, forgeWriteAuthorized: true };

/** The evidence a driver carries once workflow-status has run. */
const FULL_EVIDENCE = [
  "workflow-snapshot",
  "pre-execution-review",
  "current-candidate",
  "verification",
  "issue-state",
  "pull-request-state",
  "snapshot@docs/features/ROADMAP.md:1",
];

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

function outcome(skill, nextIntent, evidence = FULL_EVIDENCE) {
  return {
    contract: "agentic-workflow/skill-outcome",
    version: 1,
    skill,
    status: "completed",
    summary: "fixture",
    next: { intent: nextIntent, targets: ["28-evidence-grounded-spec-plan-review"] },
    blockers: [],
    questions: [],
    discoveries: [],
    evidence_refs: evidence,
  };
}

function decide(lastOutcome) {
  return decideWorkflowAction({
    snapshot: frozenSnapshot(),
    lastOutcome,
    lastOutcomeSourceRevision: "abc123",
    policy,
  });
}

const rowFor = (key) => WORKFLOW_TRANSITION_TABLE.find((row) => row.key === key);
const profileFor = (skill) => WORKFLOW_SKILL_PROFILES.find((profile) => profile.skill === skill);

test("the two review intents are declared, in planning order", () => {
  assert.ok(WORKFLOW_INTENTS.includes("review-spec"));
  assert.ok(WORKFLOW_INTENTS.includes("review-plan"));
  assert.deepEqual([...WORKFLOW_INTENTS].slice(4, 8),
    ["design-feature", "review-spec", "plan-feature", "review-plan"],
    "the new intents sit next to the planning hops they gate");
});

test("the pre-execution evidence token joins the closed vocabulary", () => {
  assert.ok(SKILL_REQUIRED_EVIDENCE.includes("pre-execution-review"));
  for (const prior of ["workflow-snapshot", "current-candidate", "verification", "independent-review",
    "audit", "issue-state", "pull-request-state"]) {
    assert.ok(SKILL_REQUIRED_EVIDENCE.includes(prior), `${prior} still declared`);
  }
});

test("both review profiles are read-only reviewers that require the pre-execution evidence", () => {
  for (const skill of ["review-spec", "review-plan"]) {
    const profile = profileFor(skill);
    assert.ok(profile, `${skill} has no built-in profile`);
    assert.equal(profile.output, "skill-outcome-v1");
    assert.equal(profile.nativeFallback, "none");
    assert.equal(profile.capabilities.role, "reviewer");
    assert.equal(profile.capabilities.reasoning, "critical");
    assert.deepEqual([...profile.capabilities.effects], ["repository-read"],
      `${skill} reads and records; it never edits the artifact it judges`);
    assert.deepEqual([...profile.capabilities.requiredEvidence], ["workflow-snapshot", "pre-execution-review"]);
  }
});

test("design → review-spec → plan → review-plan → execute is a provable chain", () => {
  const hops = [
    ["design-feature", "review-spec"],
    ["review-spec", "plan-feature"],
    ["plan-feature", "review-plan"],
    ["review-plan", "execute-phase"],
  ];
  for (const [skill, intent] of hops) {
    const decision = decide(outcome(skill, intent));
    assert.equal(decision.kind, "invoke", `${skill} → ${intent} · ${JSON.stringify(decision)}`);
    assert.equal(decision.intent, intent);
    assert.equal(decision.reasonCode, "invoke-proven-transition");
  }
});

test("a review skill may not skip forward past its own gate", () => {
  const skip = decide(outcome("review-spec", "execute-phase"));
  assert.equal(skip.kind, "sense", "SPEC review never invokes execution directly");
  assert.equal(skip.reasonCode, "sense-unlisted-transition");

  const planSkip = decide(outcome("review-plan", "audit-pr"));
  assert.equal(planSkip.kind, "sense", "Plan review never reaches the merge audit directly");

  const undesigned = decide(outcome("design-feature", "review-plan"));
  assert.equal(undesigned.kind, "sense", "engineering review requires an engineering plan first");
});

test("a review verdict may return work to its owner", () => {
  assert.equal(decide(outcome("review-spec", "design-feature")).intent, "design-feature");
  assert.equal(decide(outcome("review-plan", "design-feature")).intent, "design-feature",
    "a Plan review may discover the Product itself was wrong");
  assert.equal(decide(outcome("review-plan", "plan-feature")).intent, "plan-feature");
  assert.equal(decide(outcome("plan-fix", "review-plan")).intent, "review-plan",
    "the fix path has a Plan stage and no Product stage (D6)");
});

test("without the pre-execution evidence token, the review hop cannot be invoked", () => {
  const withoutToken = decide(outcome("design-feature", "review-spec", ["workflow-snapshot"]));
  assert.equal(withoutToken.kind, "sense");
  assert.equal(withoutToken.reasonCode, "sense-missing-evidence");
});

test("the new rows stay target-bounded and never authorize a forge write", () => {
  for (const key of ["review-spec", "review-plan"]) {
    const row = rowFor(key);
    assert.ok(row, `${key} has no transition row`);
    assert.ok(!row.allowed.includes("merge"), `${key} never merges`);
    assert.ok(!row.allowed.includes("audit-pr"), `${key} never audits its own candidate`);
    assert.ok(row.allowed.includes("ask-human") && row.allowed.includes("stop"));
  }
});

test("existing decisions keep their exact verdicts after the addition", () => {
  assert.deepEqual(
    decide(outcome("status", "discover-repository-state")),
    {
      kind: "invoke",
      intent: "discover-repository-state",
      targets: ["28-evidence-grounded-spec-plan-review"],
      reasonCode: "invoke-proven-transition",
      evidenceRefs: FULL_EVIDENCE,
      detail: "invoke-proven-transition: discover-repository-state to [28-evidence-grounded-spec-plan-review]",
    },
  );
  assert.deepEqual(
    decide(outcome("audit-pr", "merge")),
    {
      kind: "invoke",
      intent: "merge",
      targets: ["28-evidence-grounded-spec-plan-review"],
      reasonCode: "invoke-proven-transition",
      evidenceRefs: FULL_EVIDENCE,
      detail: "invoke-proven-transition: merge to [28-evidence-grounded-spec-plan-review]",
    },
  );
  assert.deepEqual(
    decide(outcome("plan-fix", "triage-issue")),
    {
      kind: "invoke",
      intent: "triage-issue",
      targets: ["28-evidence-grounded-spec-plan-review"],
      reasonCode: "invoke-proven-transition",
      evidenceRefs: FULL_EVIDENCE,
      detail: "invoke-proven-transition: triage-issue to [28-evidence-grounded-spec-plan-review]",
    },
  );
  const forbidden = decide(outcome("init-workspace", "audit-pr"));
  assert.equal(forbidden.kind, "sense");
  assert.equal(forbidden.reasonCode, "sense-unlisted-transition");
});
