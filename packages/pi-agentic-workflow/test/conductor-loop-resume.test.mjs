// conductor-loop-resume.test.mjs — run boundary rows and the reconcile gate
//
// S1: the loop runs the reconcile before continuing. S2/S4: every exit writes
// the run boundary so a death is detectable and the resume is auditable. S3:
// AMBIGUOUS halts before any invocation.

import { test } from "node:test";
import assert from "node:assert/strict";

const { runConductorLoop, DEFAULT_CONDUCTOR_CONFIG } = await import("../dist/conductor/index.js");

function makeEnv(crash = { verdict: "RESUMABLE", branches: [] }, overrides = {}) {
  return {
    skill: "workflow-status", state: "CONTINUE", summary: "ready",
    unit: { type: "fix", id: "284", issue: 284, branch: "feat/284-unattended-durability" },
    phase: { current: "P2", total: 8, completed: 1 },
    pr: { number: null, url: null, state: "none", head_sha: "abc123", merge_ready: null, ci: "green" },
    gates: { verification: "green", review_pending: false, audit_pending: false },
    findings: { fix_now: [], issues_filed: [], untriaged: 0, decisions_recorded: 0 },
    blockers: [], dependencies: { unmet: [], build_order: [] },
    recommendations: { product_audit: false, reason: null }, needs_input: null,
    next: { recommended: "/skill:execute-phase 284 P2", alternatives: [], tier: "strong" },
    detail: { repository_state: { status: "frozen", source_revision: "abc123" }, crash_recovery: crash },
    ...overrides,
  };
}

const INTERRUPTED = { runId: "r-1", pid: 4242, iteration: 1, lastInvocation: "/skill:execute-phase 284 P1" };

function buildDeps(overrides = {}) {
  const log = [];
  const sent = [];
  let stopAfter = 1;
  const deps = {
    runSensor: async () => ({ ok: true, envelope: makeEnv() }),
    decide: () => (stopAfter-- > 0
      ? { kind: "invoke", intent: "execute-phase", targets: ["284", "P2"], reasonCode: "invoke-proven-transition", evidenceRefs: [], detail: "" }
      : { kind: "stop", intent: "stop", targets: [], reasonCode: "stop-blocked", evidenceRefs: [], detail: "done" }),
    invocation: (d) => ({ ok: true, invocation: `/skill:${d.intent} ${d.targets.join(" ")}` }),
    sendUserMessage: async (inv) => { sent.push(inv); return { ok: true }; },
    gitProbe: async () => ({ porcelain: "", ahead: 0 }),
    appendRunLog: (line) => log.push(line),
    config: { ...DEFAULT_CONDUCTOR_CONFIG },
    attended: true,
    judgeUrgency: () => ({ verdict: "no-urgent" }),
    parkInFlight: async () => {},
    runMeta: () => ({ id: "r-9", pid: 777 }),
    resumePreflight: async () => null,
    resume: false,
    ...overrides,
  };
  return { deps, log, sent, setStopAfter: (n) => { stopAfter = n; } };
}

const kinds = (log) => log.map((l) => l.split(" — ")[1]);

test("L1: a plain run writes exactly one run/start and one run/stop around its iteration rows", async () => {
  const { deps, log } = buildDeps();
  await runConductorLoop(deps);
  assert.equal(kinds(log).filter((k) => k === "run/start").length, 1);
  assert.equal(kinds(log).filter((k) => k === "run/stop").length, 1);
  assert.equal(log[0].split(" — ")[1], "run/start");
  assert.equal(log[log.length - 1].split(" — ")[1], "run/stop");
  assert.ok(log[0].includes("r-9 pid=777"));
  assert.ok(!log.some((l) => /resume\//u.test(l)), "no reconcile row without an interruption");
});

test("L2: an interrupted RESUMABLE run writes detected + verdict and continues", async () => {
  const { deps, log, sent } = buildDeps({ resumePreflight: async () => INTERRUPTED });
  await runConductorLoop(deps);
  const rows = kinds(log);
  assert.ok(rows.includes("resume/detected"), "death row");
  assert.ok(rows.includes("resume/verdict:RESUMABLE"), "verdict row");
  assert.ok(sent.length >= 1, "the run continued");
  const detected = log.find((l) => /resume\/detected/u.test(l));
  assert.ok(detected.includes("r-1"), "names the interrupted run");
});

test("L3: an interrupted AMBIGUOUS run halts before ANY invocation and records the stop", async () => {
  const { deps, log, sent } = buildDeps({
    resumePreflight: async () => INTERRUPTED,
    runSensor: async () => ({ ok: true, envelope: makeEnv({ verdict: "AMBIGUOUS", branches: [{ branch: "feat/284-unattended-durability", evidence: "ticks ahead of commits", verdict: "AMBIGUOUS", resume_command: null }] }) }),
  });
  const result = await runConductorLoop(deps);
  assert.equal(sent.length, 0, "no silent continuation");
  assert.equal(result.stopCode, "stop-crash-ambiguous");
  const rows = kinds(log);
  assert.ok(rows.includes("resume/halted"));
  assert.equal(rows[rows.length - 1], "run/stop");
  assert.ok(log[log.length - 1].includes("stop-crash-ambiguous"));
});

test("L4: an interrupted CLEAN run resumes and says so", async () => {
  const { deps, log } = buildDeps({ resumePreflight: async () => INTERRUPTED, runSensor: async () => ({ ok: true, envelope: makeEnv({ verdict: "CLEAN", branches: [] }) }) });
  await runConductorLoop(deps);
  assert.ok(kinds(log).includes("resume/verdict:CLEAN"));
});

test("L5: --resume reconciles even with no interrupted journal", async () => {
  const { deps, log } = buildDeps({ resume: true });
  await runConductorLoop(deps);
  assert.ok(!kinds(log).includes("resume/detected"), "nothing died");
  assert.ok(kinds(log).includes("resume/verdict:RESUMABLE"), "the reconcile still ran");
});

test("L6: --resume with a missing verdict halts (fail closed, never a silent resume)", async () => {
  const noVerdict = { ...makeEnv(), detail: { repository_state: { status: "frozen", source_revision: "abc123" } } };
  const { deps, log, sent } = buildDeps({
    resume: true,
    runSensor: async () => ({ ok: true, envelope: noVerdict }),
  });
  const result = await runConductorLoop(deps);
  assert.equal(sent.length, 0);
  assert.equal(result.stopCode, "stop-crash-ambiguous");
  assert.ok(kinds(log).includes("resume/halted"));
});

test("L7: a throwing run writes run/start and no run/stop — that is the death the supervisor sees", async () => {
  const { deps, log } = buildDeps({ runSensor: () => { throw new Error("boom"); } });
  await assert.rejects(() => runConductorLoop(deps), /boom/u);
  assert.equal(kinds(log)[0], "run/start");
  assert.ok(!kinds(log).includes("run/stop"));
});

test("L8: the one-stage hand-off still returns CONTINUE and still writes its terminal row", async () => {
  const { deps, log } = buildDeps();
  const result = await runConductorLoop({ ...deps, maxInvokes: 1 });
  assert.equal(result.banner, "ADVANCE: CONTINUE");
  assert.equal(kinds(log).filter((k) => k === "run/stop").length, 1);
  assert.ok(log[log.length - 1].includes("continue"));
});
