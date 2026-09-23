// conductor-urgency.test.mjs — AC5: all five rows table-driven

import { test } from "node:test";
import assert from "node:assert/strict";

const { judgeUrgency } = await import("../dist/conductor/index.js");

function makeEnv(overrides = {}) {
  return {
    skill: "workflow-status", state: "OK", summary: "ok",
    unit: { type: "feature", id: "62", issue: 233, branch: "main" },
    phase: { current: "P1", total: 4, completed: 0 },
    pr: { number: null, url: null, state: "none", head_sha: "abc", merge_ready: null, ci: "green" },
    gates: { verification: "green", review_pending: false, audit_pending: false },
    findings: { fix_now: [], issues_filed: [], untriaged: 0, decisions_recorded: 0 },
    blockers: [], dependencies: { unmet: [], build_order: [] },
    recommendations: { product_audit: false, reason: null }, needs_input: null,
    next: { recommended: "/discover-repository-state", alternatives: [], tier: "strong" },
    detail: {
      repository_state: { status: "frozen", source_revision: "abc123" },
      urgent: {
        issues: [{ number: 99, title: "hotfix", label: "fix-next" }],
        interruptibility: { unit: "62", phase: "P1", dirty: true, tasks_from_boundary: 3 },
      },
    },
    ...overrides,
  };
}

test("AC5: no urgent issues → no-urgent", () => {
  const env = makeEnv({ detail: { ...makeEnv().detail, urgent: { issues: [], interruptibility: { unit: "62", phase: "P1", dirty: true, tasks_from_boundary: 3 } } } });
  const result = judgeUrgency(env);
  assert.equal(result.verdict, "no-urgent"); assert.ok(!result.issue);
});

test("AC5: fix-next label → finish-first (queue head, never interrupt)", () => {
  const env = makeEnv({ detail: { ...makeEnv().detail, urgent: { issues: [{ number: 42, title: "quick fix", label: "fix-next" }], interruptibility: { unit: "62", phase: "P1", dirty: true, tasks_from_boundary: 3 } } } });
  const result = judgeUrgency(env);
  assert.equal(result.verdict, "finish-first"); assert.equal(result.issue, 42);
  assert.ok(result.reason.includes("fix-next")); assert.ok(!result.reason.includes("interrupt"));
});

test("AC5: interruptibility.dirty === false → interrupt-now", () => {
  const env = makeEnv({ detail: { ...makeEnv().detail, urgent: { issues: [{ number: 42, title: "hotfix", label: "urgent" }], interruptibility: { unit: "62", phase: "P1", dirty: false, tasks_from_boundary: 3 } } } });
  const result = judgeUrgency(env);
  assert.equal(result.verdict, "interrupt-now"); assert.equal(result.issue, 42);
});

test("AC5: tasks_from_boundary ≤ 1 → finish-first", () => {
  const env = makeEnv({ detail: { ...makeEnv().detail, urgent: { issues: [{ number: 42, title: "hotfix", label: "urgent" }], interruptibility: { unit: "62", phase: "P1", dirty: true, tasks_from_boundary: 1 } } } });
  const result = judgeUrgency(env);
  assert.equal(result.verdict, "finish-first");
});

test("AC5: ambiguous middle (fix-next absent, dirty true, tasks>1) → finish-first fail-safe", () => {
  const env = makeEnv({ detail: { ...makeEnv().detail, urgent: { issues: [{ number: 42, title: "hotfix", label: "urgent" }], interruptibility: { unit: "62", phase: "P1", dirty: true, tasks_from_boundary: 3 } } } });
  const result = judgeUrgency(env);
  assert.equal(result.verdict, "finish-first");
  assert.ok(result.reason.includes("fail-safe") || result.reason.includes("finish-first"));
});

test("AC5: verdict is one of the three known values", () => {
  const valid = new Set(["no-urgent", "interrupt-now", "finish-first"]);
  assert.ok(valid.has(judgeUrgency(makeEnv()).verdict));
});

test("AC5: reason is always present", () => {
  assert.ok(typeof judgeUrgency(makeEnv()).reason === "string" && judgeUrgency(makeEnv()).reason.length > 0);
});

test("AC5: no-urgent does not carry issue number", () => {
  const env = makeEnv({ detail: { ...makeEnv().detail, urgent: { issues: [], interruptibility: { unit: "62", phase: "P1", dirty: true, tasks_from_boundary: 3 } } } });
  const result = judgeUrgency(env);
  assert.equal(result.verdict, "no-urgent"); assert.equal(result.issue, undefined);
});
