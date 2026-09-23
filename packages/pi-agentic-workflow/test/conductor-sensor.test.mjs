// conductor-sensor.test.mjs — AC3: spawn failure, non-JSON, schema-invalid, degraded → sensor-degraded; happy path

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const { runSensor } = await import("../dist/conductor/index.js");

function writeSensor(content) {
  const tmp = "/tmp/fake-sensor-" + Date.now() + ".sh";
  fs.writeFileSync(tmp, "#!/usr/bin/env node\n" + content + "\n", { mode: 0o755 });
  return tmp;
}

function makeValidEnv(overrides = {}) {
  return {
    skill: "workflow-status", state: "OK", summary: "ready",
    unit: { type: "feature", id: "62", issue: 233, branch: "feat/62" },
    phase: { current: "P1", total: 4, completed: 0 },
    pr: { number: null, url: null, state: "none", head_sha: "abc123def456", merge_ready: null, ci: "green" },
    gates: { verification: "green", review_pending: false, audit_pending: false },
    findings: { fix_now: [], issues_filed: [], untriaged: 0, decisions_recorded: 0 },
    blockers: [], dependencies: { unmet: [], build_order: [] },
    recommendations: { product_audit: false, reason: null },
    needs_input: null,
    next: { recommended: "/discover-repository-state", alternatives: [], tier: "strong" },
    detail: { repository_state: { status: "frozen", source_revision: "abc123" }, ...overrides.detail },
    ...overrides,
  };
}

test("AC3: spawn failure → sensor-degraded", async () => {
  const result = await runSensor("/nonexistent", "/usr/bin/false");
  assert.equal(result.ok, false); assert.equal(result.refusal, "sensor-degraded");
  assert.ok(typeof result.detail === "string" && result.detail.length > 0);
});

test("AC3: non-JSON output → sensor-degraded", async () => {
  const tmp = writeSensor("console.log('not-json');");
  const result = await runSensor("/fixture", tmp);
  assert.equal(result.ok, false); assert.equal(result.refusal, "sensor-degraded"); fs.unlinkSync(tmp);
});

test("AC3: invalid JSON → sensor-degraded", async () => {
  const tmp = writeSensor("console.log('{bad json');");
  const result = await runSensor("/fixture", tmp);
  assert.equal(result.ok, false); assert.equal(result.refusal, "sensor-degraded"); fs.unlinkSync(tmp);
});

test("AC3: schema-invalid (missing required key) → sensor-degraded", async () => {
  const env = makeValidEnv(); delete env.state;
  const tmp = writeSensor("console.log('```json\\n' + JSON.stringify(" + JSON.stringify(env) + ") + '\\n```\\n');");
  const result = await runSensor("/fixture", tmp);
  assert.equal(result.ok, false); assert.equal(result.refusal, "sensor-degraded"); fs.unlinkSync(tmp);
});

test("AC3: degraded envelope (degradations[]) → sensor-degraded", async () => {
  const env = makeValidEnv({ detail: { ...makeValidEnv().detail, degradations: ["git-not-available"] } });
  const tmp = writeSensor("console.log('```json\\n' + JSON.stringify(" + JSON.stringify(env) + ") + '\\n```\\n');");
  const result = await runSensor("/fixture", tmp);
  assert.equal(result.ok, false); assert.equal(result.refusal, "sensor-degraded"); fs.unlinkSync(tmp);
});

test("AC3: valid envelope → ok with envelope", async () => {
  const env = makeValidEnv();
  const tmp = writeSensor("console.log('```json\\n' + JSON.stringify(" + JSON.stringify(env) + ") + '\\n```\\n');");
  const result = await runSensor("/fixture", tmp);
  assert.ok(result.ok); assert.ok("envelope" in result); assert.equal(result.envelope.skill, "workflow-status"); fs.unlinkSync(tmp);
});

test("AC3: valid envelope with merge_ready → ok", async () => {
  const env = makeValidEnv({ pr: { ...makeValidEnv().pr, number: 42, merge_ready: true, state: "open" } });
  const tmp = writeSensor("console.log('```json\\n' + JSON.stringify(" + JSON.stringify(env) + ") + '\\n```\\n');");
  const result = await runSensor("/fixture", tmp);
  assert.ok(result.ok); assert.ok(result.envelope.pr.merge_ready); fs.unlinkSync(tmp);
});
