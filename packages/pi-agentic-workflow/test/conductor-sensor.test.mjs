// conductor-sensor.test.mjs — AC3: spawn failure, non-JSON, schema-invalid, degraded → sensor-degraded; happy path

import { after, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";

const { runSensor } = await import("../dist/conductor/index.js");

/**
 * A real directory to sample. These cases used to pass `"/fixture"` — a path
 * that exists nowhere — because `resolveCwd` swallowed it and returned the
 * process cwd (the defect issue #678 fixes); with the refusal in place the cwd
 * has to be readable for the run to reach the sensor at all.
 */
const FIXTURE = fs.mkdtempSync(`${os.tmpdir()}/paw-sensor-fixture-`);

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
  const result = await runSensor(FIXTURE, tmp);
  assert.equal(result.ok, false); assert.equal(result.refusal, "sensor-degraded"); fs.unlinkSync(tmp);
});

test("AC3: invalid JSON → sensor-degraded", async () => {
  const tmp = writeSensor("console.log('{bad json');");
  const result = await runSensor(FIXTURE, tmp);
  assert.equal(result.ok, false); assert.equal(result.refusal, "sensor-degraded"); fs.unlinkSync(tmp);
});

test("AC3: schema-invalid (missing required key) → sensor-degraded", async () => {
  const env = makeValidEnv(); delete env.state;
  const tmp = writeSensor("console.log('```json\\n' + JSON.stringify(" + JSON.stringify(env) + ") + '\\n```\\n');");
  const result = await runSensor(FIXTURE, tmp);
  assert.equal(result.ok, false); assert.equal(result.refusal, "sensor-degraded"); fs.unlinkSync(tmp);
});

test("AC3: degraded envelope (degradations[]) → sensor-degraded", async () => {
  const env = makeValidEnv({ detail: { ...makeValidEnv().detail, degradations: ["git-not-available"] } });
  const tmp = writeSensor("console.log('```json\\n' + JSON.stringify(" + JSON.stringify(env) + ") + '\\n```\\n');");
  const result = await runSensor(FIXTURE, tmp);
  assert.equal(result.ok, false); assert.equal(result.refusal, "sensor-degraded"); fs.unlinkSync(tmp);
});

test("AC3: valid envelope → ok with envelope", async () => {
  const env = makeValidEnv();
  const tmp = writeSensor("console.log('```json\\n' + JSON.stringify(" + JSON.stringify(env) + ") + '\\n```\\n');");
  const result = await runSensor(FIXTURE, tmp);
  assert.ok(result.ok); assert.ok("envelope" in result); assert.equal(result.envelope.skill, "workflow-status"); fs.unlinkSync(tmp);
});

test("AC3: valid envelope with merge_ready → ok", async () => {
  const env = makeValidEnv({ pr: { ...makeValidEnv().pr, number: 42, merge_ready: true, state: "open" } });
  const tmp = writeSensor("console.log('```json\\n' + JSON.stringify(" + JSON.stringify(env) + ") + '\\n```\\n');");
  const result = await runSensor(FIXTURE, tmp);
  assert.ok(result.ok); assert.ok(result.envelope.pr.merge_ready); fs.unlinkSync(tmp);
});

// ---------------------------------------------------------------------------
// Issue #678 O6 — an unreadable cwd is a refusal, never a silent stand-in
// ---------------------------------------------------------------------------

test("an unreadable cwd refuses instead of sampling the process cwd", async () => {
  // The frozen failure (issue #678): `resolveCwd` swallowed an unreadable path
  // and returned `process.cwd()`, so the sensor reported another project's
  // counts as if they were this project's.
  const missing = "/nonexistent/issue-678-unreadable-cwd";
  const tmp = writeSensor("console.log('ran-in:' + process.cwd());");
  try {
    const result = await runSensor(missing, tmp);
    assert.equal(result.ok, false, "the run refuses");
    assert.equal(result.refusal, "sensor-degraded");
    assert.match(result.detail, /nonexistent/, "the refusal names the cwd it could not resolve");
    assert.doesNotMatch(result.detail, /ran-in/, "the sensor never ran in the process cwd");
  } finally {
    fs.unlinkSync(tmp);
  }
});

after(() => {
  fs.rmSync(FIXTURE, { recursive: true, force: true });
});
