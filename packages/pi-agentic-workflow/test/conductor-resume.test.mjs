// conductor-resume.test.mjs — the reconcile verdict and the resume decision
//
// S1: the resume runs the crash reconcile first and continues only on
// CLEAN/RESUMABLE. S3: AMBIGUOUS halts for a human. The verdict is read from
// the sensor (ground truth recomputation), never re-derived here.

import { test } from "node:test";
import assert from "node:assert/strict";

const { crashVerdict, decideResume, parseAdvanceFlags } = await import("../dist/conductor/index.js");

function envelopeWith(crash) {
  return {
    detail: crash === undefined ? { repository_state: { status: "frozen" } } : { crash_recovery: crash },
  };
}

const BRANCH = {
  branch: "feat/284-unattended-durability",
  evidence: "2 dirty file(s); ledger points at P2/P8",
  verdict: "RESUMABLE",
  resume_command: "/skill:execute-phase 284 P2",
};

test("R1: RESUMABLE is read with its branch's resume command", () => {
  const verdict = crashVerdict(envelopeWith({ verdict: "RESUMABLE", branches: [BRANCH] }));
  assert.equal(verdict.verdict, "RESUMABLE");
  assert.equal(verdict.resumeCommand, "/skill:execute-phase 284 P2");
});

test("R2: CLEAN is read and carries no resume command", () => {
  const verdict = crashVerdict(envelopeWith({ verdict: "CLEAN", branches: [] }));
  assert.equal(verdict.verdict, "CLEAN");
  assert.equal(verdict.resumeCommand, null);
});

test("R3: AMBIGUOUS is read (worst wins, branches may carry several verdicts)", () => {
  const verdict = crashVerdict(envelopeWith({
    verdict: "AMBIGUOUS",
    branches: [{ branch: "feat/x", evidence: "ticks ahead of commits", verdict: "AMBIGUOUS", resume_command: null }],
  }));
  assert.equal(verdict.verdict, "AMBIGUOUS");
  assert.equal(verdict.resumeCommand, null);
});

test("R4: a missing crash_recovery section fails closed to AMBIGUOUS", () => {
  assert.equal(crashVerdict(envelopeWith(undefined)).verdict, "AMBIGUOUS");
  assert.equal(crashVerdict({ detail: null }).verdict, "AMBIGUOUS");
  assert.equal(crashVerdict(null).verdict, "AMBIGUOUS");
});

test("R5: an unknown verdict string fails closed to AMBIGUOUS", () => {
  assert.equal(crashVerdict(envelopeWith({ verdict: "clean-ish", branches: [] })).verdict, "AMBIGUOUS");
  assert.equal(crashVerdict(envelopeWith({ verdict: 3, branches: [] })).verdict, "AMBIGUOUS");
});

test("R6: no interrupted run and no --resume means no reconcile at all", () => {
  const decision = decideResume({ interrupted: null, forced: false, verdict: "CLEAN", resumeCommand: null, recommended: "/skill:unit-lane 284" });
  assert.equal(decision.action, "proceed");
  assert.equal(decision.reasonCode, null);
});

test("R7: an interrupted run classified AMBIGUOUS halts before any invocation", () => {
  const decision = decideResume({
    interrupted: { runId: "r-1", pid: 42, iteration: 2, lastInvocation: "/skill:execute-phase 284 P1" },
    forced: true,
    verdict: "AMBIGUOUS",
    resumeCommand: null,
    recommended: "/skill:workflow-status",
  });
  assert.equal(decision.action, "halt");
  assert.equal(decision.reasonCode, "stop-crash-ambiguous");
  assert.match(decision.detail, /r-1/);
  assert.match(decision.detail, /AMBIGUOUS/);
});

test("R8: RESUMABLE proceeds and names the resume command", () => {
  const decision = decideResume({
    interrupted: { runId: "r-1", pid: 42, iteration: 2, lastInvocation: "/skill:execute-phase 284 P1" },
    forced: false,
    verdict: "RESUMABLE",
    resumeCommand: "/skill:execute-phase 284 P2",
    recommended: "/skill:execute-phase 284 P2",
  });
  assert.equal(decision.action, "proceed");
  assert.equal(decision.reasonCode, "resume-resumable");
  assert.equal(decision.resumeCommand, "/skill:execute-phase 284 P2");
});

test("R9: CLEAN proceeds with a clean reason code", () => {
  const decision = decideResume({
    interrupted: { runId: "r-1", pid: 42, iteration: 2, lastInvocation: null },
    forced: false,
    verdict: "CLEAN",
    resumeCommand: null,
    recommended: "/skill:unit-lane 284",
  });
  assert.equal(decision.action, "proceed");
  assert.equal(decision.reasonCode, "resume-clean");
});

test("R10: --resume with no interruption still reconciles (the entry's contract)", () => {
  const decision = decideResume({ interrupted: null, forced: true, verdict: "RESUMABLE", resumeCommand: "/skill:execute-phase 284 P2", recommended: "/skill:execute-phase 284 P2" });
  assert.equal(decision.action, "proceed");
  assert.equal(decision.reasonCode, "resume-resumable");
});

test("R11: the advance flags parse from the command's argv text", () => {
  assert.deepEqual(parseAdvanceFlags("--resume --continue"), { resume: true, printSupervisor: false, continueLoop: true, attended: true });
  assert.deepEqual(parseAdvanceFlags("--fullauto"), { resume: false, printSupervisor: false, continueLoop: false, attended: false });
  assert.deepEqual(parseAdvanceFlags("--unattended --print-supervisor"), { resume: false, printSupervisor: true, continueLoop: false, attended: false });
  assert.deepEqual(parseAdvanceFlags(""), { resume: false, printSupervisor: false, continueLoop: false, attended: true });
});
