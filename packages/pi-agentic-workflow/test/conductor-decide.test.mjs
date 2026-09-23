// conductor-decide.test.mjs — AC4: sense/stop/invoke mapping

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  decideWorkflowAction,
  WORKFLOW_INTENTS,
  WORKFLOW_DECISION_SENSE_CODES,
  WORKFLOW_DECISION_STOP_CODES,
  WORKFLOW_DECISION_INVOKE_CODES,
} from "@gtrabanco/agentic-workflow-schema";

const { decideFromEnvelope } = await import("../dist/conductor/index.js");

function makeEnv(overrides = {}) {
  return {
    skill: "workflow-status", state: "OK", summary: "ready",
    unit: { type: "feature", id: "62", issue: 233, branch: "main" },
    phase: { current: "P1", total: 4, completed: 0 },
    pr: { number: null, url: null, state: "none", head_sha: "abc", merge_ready: null, ci: "green" },
    gates: { verification: "green", review_pending: false, audit_pending: false },
    findings: { fix_now: [], issues_filed: [], untriaged: 0, decisions_recorded: 0 },
    blockers: [], dependencies: { unmet: [], build_order: [] },
    recommendations: { product_audit: false, reason: null }, needs_input: null,
    next: { recommended: "/discover-repository-state", alternatives: [], tier: "strong" },
    detail: { repository_state: { status: "frozen", source_revision: "abc123" } },
    ...overrides,
  };
}

function makeOutcome(overrides = {}) {
  return {
    contract: "agentic-workflow/skill-outcome", version: 1, skill: "workflow-status",
    status: "completed", summary: "ok",
    next: { intent: "discover-repository-state", targets: ["62"] },
    blockers: [], questions: [], discoveries: [],
    evidence_refs: ["snapshot@docs/roadmap.md:1"], ...overrides,
  };
}

function makePolicy() {
  return { allowedIntents: WORKFLOW_INTENTS, forgeWriteAuthorized: true };
}

test("AC4: invoke → kind=invoke", () => {
  const decision = decideFromEnvelope({ envelope: makeEnv(), lastOutcome: makeOutcome(), lastOutcomeSourceRevision: "abc123", policy: makePolicy() });
  assert.equal(decision.kind, "invoke"); assert.ok(WORKFLOW_INTENTS.includes(decision.intent));
  assert.equal(decision.reasonCode, "invoke-proven-transition");
});

test("AC4: sense → kind=sense", () => {
  const decision = decideFromEnvelope({ envelope: makeEnv(), lastOutcome: makeOutcome(), lastOutcomeSourceRevision: "stale-rev", policy: makePolicy() });
  assert.equal(decision.kind, "sense"); assert.equal(decision.intent, "status");
  assert.ok(WORKFLOW_DECISION_SENSE_CODES.includes(decision.reasonCode));
});

test("AC4: stop-blocked → kind=stop", () => {
  const decision = decideFromEnvelope({ envelope: makeEnv(), lastOutcome: makeOutcome({ status: "blocked", blockers: [{ kind: "dependency", id: "d1", scope: "unit", detail: "missing" }] }), lastOutcomeSourceRevision: "abc123", policy: makePolicy() });
  assert.equal(decision.kind, "stop"); assert.equal(decision.reasonCode, "stop-blocked");
  assert.ok(Array.isArray(decision.targets));
});

test("AC4: stop-needs-input → kind=stop", () => {
  const decision = decideFromEnvelope({ envelope: makeEnv(), lastOutcome: makeOutcome({ status: "needs-input", questions: [{ id: "q1", question: "what?", options: ["a"] }] }), lastOutcomeSourceRevision: "abc123", policy: makePolicy() });
  assert.equal(decision.kind, "stop"); assert.equal(decision.reasonCode, "stop-needs-input");
});

test("AC4: stop-failed → kind=stop", () => {
  const decision = decideFromEnvelope({ envelope: makeEnv(), lastOutcome: makeOutcome({ status: "failed", discoveries: [{ kind: "defect", scope: "current-unit", summary: "build broken", evidence_refs: [], proposed_intent: "status" }] }), lastOutcomeSourceRevision: "abc123", policy: makePolicy() });
  assert.equal(decision.kind, "stop"); assert.equal(decision.reasonCode, "stop-failed");
});

test("AC4: stop-contradiction → kind=stop", () => {
  const decision = decideFromEnvelope({ envelope: makeEnv({ detail: { ...makeEnv().detail, repository_state: { status: "contradicted", source_revision: "abc123" } } }), lastOutcome: makeOutcome(), lastOutcomeSourceRevision: "abc123", policy: makePolicy() });
  assert.equal(decision.kind, "stop"); assert.equal(decision.reasonCode, "stop-contradiction");
});

test("AC4: stop for unlisted transition → kind=sense", () => {
  const decision = decideFromEnvelope({ envelope: makeEnv(), lastOutcome: makeOutcome({ next: { intent: "bogus-intent", targets: [] } }), lastOutcomeSourceRevision: "abc123", policy: makePolicy() });
  assert.equal(decision.kind, "sense"); assert.equal(decision.reasonCode, "sense-unlisted-transition");
});

test("AC4: null lastOutcome → sense (not throw)", () => {
  assert.doesNotThrow(() => {
    const decision = decideFromEnvelope({ envelope: makeEnv(), lastOutcome: null, lastOutcomeSourceRevision: null, policy: makePolicy() });
    assert.equal(decision.kind, "sense");
  });
});

test("AC4: malformed envelope never throws", () => {
  assert.doesNotThrow(() => {
    const decision = decideFromEnvelope({ envelope: null, lastOutcome: null, lastOutcomeSourceRevision: null, policy: makePolicy() });
  });
});

test("AC4: null policy never throws", () => {
  assert.doesNotThrow(() => {
    decideFromEnvelope({ envelope: makeEnv(), lastOutcome: null, lastOutcomeSourceRevision: null, policy: null });
  });
});

test("AC4: undefined reviewLoopCycles treated as zero", () => {
  const decision = decideFromEnvelope({ envelope: makeEnv(), lastOutcome: makeOutcome(), lastOutcomeSourceRevision: "abc123", policy: makePolicy(), reviewLoopCycles: undefined });
  assert.ok(["invoke", "sense", "stop"].includes(decision.kind));
});
