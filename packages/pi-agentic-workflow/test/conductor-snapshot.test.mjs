// conductor-snapshot.test.mjs — AC11: envelope→WorkflowSnapshot pure mapping

import { test } from "node:test";
import assert from "node:assert/strict";

const { snapshotFromEnvelope } = await import("../dist/conductor/index.js");

function makeEnv(overrides = {}) {
  return {
    skill: "workflow-status", state: "OK", summary: "ready",
    unit: { type: "feature", id: "62-pi-native-conductor", issue: 233, branch: "feat/62" },
    phase: { current: "P1", total: 4, completed: 0 },
    pr: { number: null, url: null, state: "none", head_sha: "sha-from-pr", merge_ready: null, ci: "green" },
    gates: { verification: "green", review_pending: false, audit_pending: false },
    findings: { fix_now: [], issues_filed: [], untriaged: 0, decisions_recorded: 0 },
    blockers: [], dependencies: { unmet: [], build_order: [] },
    recommendations: { product_audit: false, reason: null }, needs_input: null,
    next: { recommended: "/discover-repository-state", alternatives: [], tier: "strong" },
    detail: { repository_state: { status: "frozen", source_revision: "src-rev-123" } },
    ...overrides,
  };
}

// AC11: mapping table
test("AC11: repository state → snapshot.repositoryState", () => {
  const snap = snapshotFromEnvelope(makeEnv({ detail: { repository_state: { status: "draft", source_revision: "x" } } }));
  assert.equal(snap.repositoryState, "draft");
});

test("AC11: unit.type → snapshot.unit.kind", () => {
  const snap = snapshotFromEnvelope(makeEnv({ unit: { type: "fix", id: "42-bug", issue: 42, branch: null } }));
  assert.ok(snap.unit); assert.equal(snap.unit.kind, "fix"); assert.equal(snap.unit.id, "42-bug");
});

test("AC11: unit.type=feature", () => {
  const snap = snapshotFromEnvelope(makeEnv({ unit: { type: "feature", id: "10-my-feature", issue: null, branch: null } }));
  assert.equal(snap.unit.kind, "feature"); assert.equal(snap.unit.id, "10-my-feature");
});

test("AC11: phase → snapshot.phase", () => {
  const snap = snapshotFromEnvelope(makeEnv({ phase: { current: "P3", total: 5, completed: 2 } }));
  assert.equal(snap.phase.current, "P3"); assert.equal(snap.phase.total, 5); assert.equal(snap.phase.completed, 2);
});

test("AC11: repository branch, headSha from pr, dirty=false", () => {
  const snap = snapshotFromEnvelope(makeEnv());
  assert.equal(snap.repository.branch, "feat/62");
  assert.equal(snap.repository.headSha, "sha-from-pr");
  assert.equal(snap.repository.dirty, false);
});

test("AC11: headSha falls back to source_revision when pr.head_sha is null", () => {
  const env = makeEnv({ pr: { ...makeEnv().pr, head_sha: null } });
  env.detail.repository_state.source_revision = "fallback-sha";
  assert.equal(snapshotFromEnvelope(env).repository.headSha, "fallback-sha");
});

test("AC11: sourceRevision from detail.repository_state.source_revision", () => {
  assert.equal(snapshotFromEnvelope(makeEnv()).sourceRevision, "src-rev-123");
});

test("AC11: provenance with envelope source", () => {
  const snap = snapshotFromEnvelope(makeEnv());
  assert.equal(snap.provenance.length, 1);
  assert.equal(snap.provenance[0].field, "envelope");
  assert.equal(snap.provenance[0].source, "workflow-status");
  assert.equal(snap.provenance[0].line, 0);
});

test("AC11: null unit → snapshot.unit is null", () => {
  assert.equal(snapshotFromEnvelope(makeEnv({ unit: null })).unit, null);
});

// AC11: purity
test("AC11: pure function — same input produces deepEqual snapshots", () => {
  const env = makeEnv();
  const snap1 = snapshotFromEnvelope(env);
  const snap2 = snapshotFromEnvelope(env);
  assert.equal(JSON.stringify(snap1), JSON.stringify(snap2));
});

test("AC11: different inputs produce different snapshots", () => {
  const env1 = makeEnv({ unit: { type: "feature", id: "one", issue: null, branch: null } });
  const env2 = makeEnv({ unit: { type: "feature", id: "two", issue: null, branch: null } });
  assert.notEqual(JSON.stringify(snapshotFromEnvelope(env1)), JSON.stringify(snapshotFromEnvelope(env2)));
});
