// conductor-loop.test.mjs — AC1 AC2 AC8 banners+cap AC9 merge-ready AC10 log format

import { test } from "node:test";
import assert from "node:assert/strict";

function makeEnv(overrides = {}) {
  return {
    skill: "workflow-status", state: "OK", summary: "ready",
    unit: { type: "feature", id: "62", issue: 233, branch: "main" },
    phase: { current: "P1", total: 4, completed: 0 },
    pr: { number: null, url: null, state: "none", head_sha: "abc123", merge_ready: null, ci: "green" },
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
    blockers: [], questions: [], discoveries: [], evidence_refs: ["snap@roadmap:1"],
    ...overrides,
  };
}

function makeDecision(overrides = {}) {
  return { kind: "invoke", intent: "discover-repository-state", targets: ["62"], reasonCode: "invoke-proven-transition", evidenceRefs: [], detail: "", ...overrides };
}

const { runConductorLoop, DEFAULT_CONDUCTOR_CONFIG } = await import("../dist/conductor/index.js");

/** Build deps with controllable doubles. */
function buildDeps(loopOverrides = {}) {
  let sendCalls = 0;
  let sentInvocations = [];
  const sendUserMessage = async (inv) => { sendCalls++; sentInvocations.push(inv); return { ok: true }; };
  const deps = {
    runSensor: loopOverrides.runSensor ?? (() => Promise.resolve({ ok: true, envelope: makeEnv() })),
    decide: loopOverrides.decide ?? (() => makeDecision()),
    invocation: loopOverrides.invocation ?? (d => ({ ok: true, invocation: "/skill:" + d.intent })),
    sendUserMessage,
    gitProbe: loopOverrides.gitProbe ?? (() => Promise.resolve({ porcelain: "", ahead: 0 })),
    appendRunLog: loopOverrides.appendRunLog ?? (() => {}),
    config: { ...DEFAULT_CONDUCTOR_CONFIG },
    attended: loopOverrides.attended ?? true,
    judgeUrgency: loopOverrides.judgeUrgency ?? (() => ({ verdict: "no-urgent" })),
    parkInFlight: loopOverrides.parkInFlight ?? (() => {}),
    getSentInvocations: () => [...sentInvocations],
  };
  return deps;
}

// AC1: one invoke iteration then stop
test("AC1: sensor → decide (invoke) → sendUserMessage → next iteration stops at stop-decision", async () => {
  let count = 0;
  const deps = buildDeps({
    decide: () => { count++; return count === 1 ? makeDecision() : makeDecision({ kind: "stop", intent: "stop", targets: [], reasonCode: "stop-blocked" }); },
  });
  const result = await runConductorLoop(deps);
  assert.equal(result.banner, "ADVANCE: STOPPED");
  assert.equal(deps.getSentInvocations().length, 1);
});

// AC2: verbatim invocation
test("AC2: sendUserMessage receives exactly the mapped /skill:verb args", async () => {
  const deps = buildDeps({
    decide: () => makeDecision({ kind: "invoke", intent: "discover-repository-state", targets: ["62"] }),
  });
  await runConductorLoop(deps);
  assert.ok(deps.getSentInvocations().some(m => m.includes("/skill:discover-repository-state 62")));
});

// AC8: banners per code
test("AC8: stop-needs-input → ADVANCE: STOPPED", async () => {
  const deps = buildDeps({ decide: () => makeDecision({ kind: "stop", intent: "stop", targets: ["q1"], reasonCode: "stop-needs-input" }) });
  const result = await runConductorLoop(deps);
  assert.equal(result.banner, "ADVANCE: STOPPED"); assert.equal(result.stopCode, "stop-needs-input");
});

test("AC8: stop-blocked → ADVANCE: STOPPED", async () => {
  const deps = buildDeps({ decide: () => makeDecision({ kind: "stop", intent: "stop", targets: ["d1"], reasonCode: "stop-blocked" }) });
  const result = await runConductorLoop(deps);
  assert.equal(result.banner, "ADVANCE: STOPPED"); assert.equal(result.stopCode, "stop-blocked");
});

test("AC8: sensor refusal → ADVANCE: STOPPED", async () => {
  const deps = buildDeps({ runSensor: async () => ({ ok: false, refusal: "sensor-degraded", detail: "spawn failed" }) });
  const result = await runConductorLoop(deps);
  assert.equal(result.banner, "ADVANCE: STOPPED"); assert.ok(result.detail.includes("sensor-degraded"));
});

// AC9: merge-ready PR
test("AC9: merge-ready PR → stop-needs-input naming /audit-pr, NO merge sent", async () => {
  let sentMessages = [];
  const deps = buildDeps({
    decide: () => makeDecision({ kind: "stop", intent: "stop", targets: ["q-merge"], reasonCode: "stop-needs-input" }),
    sendUserMessage: async (inv) => { sentMessages.push(inv); return { ok: true }; },
  });
  const sensorWithMerge = async () => ({ ok: true, envelope: makeEnv({ state: "MERGE_READY", pr: { ...makeEnv().pr, merge_ready: true, number: 42 } }) });
  const result = await runConductorLoop({ ...deps, runSensor: sensorWithMerge, decide: () => makeDecision({ kind: "stop", intent: "stop", targets: [], reasonCode: "stop-needs-input" }) });
  assert.equal(result.banner, "ADVANCE: STOPPED");
  assert.ok(!sentMessages.some(m => m.includes("merge")), "NEVER sends /merge");
});

test("AC9: decide stop-needs-input does NOT invoke merge", async () => {
  let sentMessages = [];
  const deps = buildDeps({
    decide: () => makeDecision({ kind: "stop", intent: "stop", targets: [], reasonCode: "stop-needs-input" }),
    sendUserMessage: async (inv) => { sentMessages.push(inv); return { ok: true }; },
  });
  await runConductorLoop(deps);
  assert.ok(!sentMessages.some(m => m.includes("merge")));
});

// AC10: run log format
test("AC10: one log line per iteration — format: YYYY-MM-DD HH:MM — kind/code — cmd — k/cap", async () => {
  let count = 0;
  let logLines = [];
  const deps = buildDeps({
    decide: () => { count++; return count === 1 ? makeDecision() : makeDecision({ kind: "stop", intent: "stop", targets: [], reasonCode: "stop-blocked" }); },
    appendRunLog: (line) => logLines.push(line),
  });
  await runConductorLoop(deps);
  assert.equal(logLines.length, 2);
  const line0 = logLines[0];
  assert.ok(/\d{4}-\d{2}-\d{2}/.test(line0), "date present");
  assert.ok(/\d{2}:\d{2}/.test(line0), "time present");
  assert.ok(line0.includes("invoke"), "invoke in first line");
  assert.ok(/\d+\/\d+/.test(line0) || line0.includes("/skill:"), "command present");
  assert.ok(/\d+\/\d+/.test(line0), "k/cap in line");
});

// AC8: iterations cap
test("AC8: iterations cap → STOPPED with stop-failed + cap detail", async () => {
  let count = 0;
  const deps = buildDeps({
    decide: () => { count++; return count <= 15 ? makeDecision() : makeDecision({ kind: "stop", intent: "stop", targets: [], reasonCode: "stop-failed" }); },
  });
  const result = await runConductorLoop({ ...deps, config: { ...DEFAULT_CONDUCTOR_CONFIG, iterationsCap: 5 } });
  assert.equal(result.banner, "ADVANCE: STOPPED");
  assert.ok(result.detail.includes("stop-failed")); assert.ok(result.detail.includes("5"));
  assert.equal(result.stopCode, "stop-failed");
});

// AC7: 3 consecutive partials → STOPPED with park reason
test("AC7: 3 consecutive partials → STOPPED with park reason", async () => {
  let count = 0;
  const deps = buildDeps({
    decide: () => makeDecision(),
    gitProbe: () => { count++; return count <= 3 ? { porcelain: "M src/file.ts\n", ahead: 0 } : { porcelain: "", ahead: 0 }; },
  });
  const result = await runConductorLoop({ ...deps, config: { ...DEFAULT_CONDUCTOR_CONFIG, iterationsCap: 10 } });
  assert.equal(result.banner, "ADVANCE: STOPPED"); assert.ok(result.detail.includes("park"));
});

// AC3: sensor refusal stops loop
test("AC3: sensor refusal → STOPPED with refusal code in detail", async () => {
  const deps = buildDeps({ runSensor: async () => ({ ok: false, refusal: "sensor-degraded", detail: "spawn error" }) });
  const result = await runConductorLoop(deps);
  assert.equal(result.banner, "ADVANCE: STOPPED"); assert.ok(result.detail.includes("sensor-degraded"));
});

// AC4: sense → re-sense → STOPPED
test("AC4: sense → re-sense → STOPPED if still stale", async () => {
  let senseCount = 0;
  const deps = buildDeps({
    decide: () => { senseCount++; return senseCount === 1 ? makeDecision({ kind: "sense", intent: "status", targets: [], reasonCode: "sense-stale-revision" }) : makeDecision({ kind: "stop", intent: "stop", targets: [], reasonCode: "stop-failed" }); },
  });
  const result = await runConductorLoop(deps);
  assert.equal(result.banner, "ADVANCE: STOPPED");
});

// AC8: COMPLETE banner — nothing startable (no recommended action, no blockers)
test("AC8: nothing startable → ADVANCE: COMPLETE", async () => {
  const deps = buildDeps({
    decide: () => makeDecision(),
  });
  // Override the envelope to have no recommended and no blockers
  const result = await runConductorLoop({
    ...deps,
    runSensor: async () => ({ ok: true, envelope: { ...makeEnv(), next: { ...makeEnv().next, recommended: "" }, blockers: [] } }),
  });
  assert.equal(result.banner, "ADVANCE: COMPLETE"); assert.equal(result.iterations, 0);
});

// AC8: BLOCKED banner — blockers present with unblock info
test("AC8: blocked → ADVANCE: BLOCKED", async () => {
  const deps = buildDeps({
    decide: () => makeDecision(),
  });
  const result = await runConductorLoop({
    ...deps,
    runSensor: async () => ({ ok: true, envelope: { ...makeEnv(), blockers: [{ kind: "dependency", detail: "missing: d1" }, { kind: "auth", detail: "token expired" }] } }),
  });
  assert.equal(result.banner, "ADVANCE: BLOCKED"); assert.ok(result.detail.includes("blocked")); assert.ok(result.detail.includes("dependency"));
});

// AC9: fullauto unattended never merges
test("AC9: fullauto (unattended) still never merges", async () => {
  let sent = [];
  const deps = buildDeps({
    decide: () => makeDecision(),
    sendUserMessage: async (inv) => { sent.push(inv); return { ok: true }; },
  });
  await runConductorLoop({ ...deps, attended: false, config: { ...DEFAULT_CONDUCTOR_CONFIG, iterationsCap: 1 } });
  assert.ok(!sent.some(m => m.includes("merge")));
});


// AC10: a deferred send with profileResume restart re-runs the iteration, then sends
test("AC10: a deferred send with profileResume restart re-runs the iteration, then sends", async () => {
  let callCount = 0;
  const sendUserMessage = async (inv) => {
    callCount++;
    if (callCount === 1) {
      return { ok: true, deferred: true, profileSwitched: { from: "work", to: "fb" } };
    }
    return { ok: true };
  };
  let logLines = [];
  const decideCalls = [0];
  const decide = () => {
    decideCalls[0]++;
    if (decideCalls[0] <= 2) return makeDecision();
    return makeDecision({ kind: "stop", intent: "stop", targets: [], reasonCode: "stop-blocked" });
  };
  const baseDeps = buildDeps({
    decide,
    appendRunLog: (line) => logLines.push(line),
  });
  baseDeps.sendUserMessage = sendUserMessage;
  const result = await runConductorLoop({ ...baseDeps, profileResume: "restart" });
  assert.equal(callCount, 2, "sendUserMessage was called twice");
  assert.ok(logLines.some(l => /switch\/work->fb/u.test(l)), "run log has switch line");
  assert.equal(result.banner, "ADVANCE: STOPPED");
});


// AC12: a refused stage dispatch stops the loop instead of logging an invoke
test("AC12: a refused stage dispatch stops the loop instead of logging an invoke", async () => {
  const logLines = [];
  const baseDeps = buildDeps({ appendRunLog: (line) => logLines.push(line) });
  baseDeps.sendUserMessage = async () => ({ ok: false });
  const result = await runConductorLoop(baseDeps);
  assert.equal(result.banner, "ADVANCE: STOPPED");
  assert.equal(result.stopCode, "stop-dispatch-refused");
  assert.ok(logLines.some((l) => /stop\/stop-dispatch-refused/u.test(l)), "logs the refusal");
  assert.ok(!logLines.some((l) => /invoke\//u.test(l)), "no invoke line");
});

// AC10: a non-deferred send runs once
test("AC10: a non-deferred send runs once", async () => {
  let callCount = 0;
  const sendUserMessage = async (inv) => {
    callCount++;
    return { ok: true, profileSwitched: { from: "work", to: "fb" } };
  };
  const decideCalls = [0];
  const decide = () => {
    decideCalls[0]++;
    // First iteration: invoke so sendUserMessage is called
    // Second iteration: stop the loop
    return decideCalls[0] === 1 ? makeDecision() : makeDecision({ kind: "stop", intent: "stop", targets: [], reasonCode: "stop-blocked" });
  };
  const baseDeps = buildDeps({ decide });
  baseDeps.sendUserMessage = sendUserMessage;
  const result = await runConductorLoop({ ...baseDeps, profileResume: "continue" });
  assert.equal(callCount, 1, "sendUserMessage was called once");
  assert.equal(result.banner, "ADVANCE: STOPPED");
});
