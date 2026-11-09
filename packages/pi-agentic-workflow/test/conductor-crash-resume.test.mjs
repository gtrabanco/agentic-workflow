// conductor-crash-resume.test.mjs — the frozen-failure reproducer
//
// S2: `kill -9` in the middle of a multi-iteration advance run → the supervisor
// restarts it → the run completes with zero human interaction. S3: an AMBIGUOUS
// reconcile halts and the journal records it. S4: the resume is auditable and
// no phase runs twice.
//
// The conductor under the kill is the package's real loop: real `runSensor`
// spawn (the fixture's stub `scripts/workflow-status.mjs`), real journal file,
// real reconcile gate. Only the stage executor and the sensor data are scripted.

import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const { renderSupervisorScript } = await import("../dist/conductor/index.js");

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNNER = join(HERE, "fixtures", "advance-runner.mjs");
const scratch = mkdtempSync(join(tmpdir(), "aw-crash-resume-"));
process.on("exit", () => rmSync(scratch, { recursive: true, force: true }));

const SENSOR_STUB = `#!/usr/bin/env bun
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const stages = ["stage-1", "stage-2", "stage-3"];
let done = 0;
try {
  done = readdirSync(join(root, "receipts")).filter((f) => f.endsWith(".done")).length;
} catch {}
const verdictPath = join(root, "verdict.json");
const crash = existsSync(verdictPath)
  ? JSON.parse(readFileSync(verdictPath, "utf8"))
  : { verdict: "RESUMABLE", branches: [{ branch: "feat/284-unattended-durability", evidence: "ledger points at P1", verdict: "RESUMABLE", resume_command: "/skill:stage-1" }] };
const nextStage = stages[done] ?? "";
const envelope = {
  contract: "agentic-workflow/envelope",
  version: 2,
  skill: "workflow-status",
  state: nextStage ? "CONTINUE" : "OK",
  summary: "fixture sensor",
  unit: { type: "fix", id: "284", issue: 284, branch: "feat/284-unattended-durability" },
  phase: { current: String(done + 1), total: 3, completed: done },
  pr: { number: null, url: null, state: "none", head_sha: "fixture", merge_ready: null, ci: "none" },
  gates: { verification: "green", review_pending: false, audit_pending: false },
  findings: { fix_now: [], issues_filed: [], untriaged: 0, decisions_recorded: 0 },
  blockers: [],
  dependencies: { unmet: [], build_order: [] },
  recommendations: { product_audit: false, reason: null },
  needs_input: null,
  next: { recommended: nextStage ? "/skill:" + nextStage : "", alternatives: [], tier: "strong" },
  detail: {
    crash_recovery: { verdict: crash.verdict, branches: crash.branches ?? [] },
    repository_state: { status: "frozen", source_revision: "fixture" },
  },
};
process.stdout.write(JSON.stringify(envelope));
`;

/** Provision a fixture project: the sensor stub, the fake pi, the supervisor. */
function fixture(name, verdict = null) {
  const dir = mkdtempSync(join(scratch, `${name}-`));
  mkdirSync(join(dir, "scripts"), { recursive: true });
  writeFileSync(join(dir, "scripts", "workflow-status.mjs"), SENSOR_STUB, "utf8");
  mkdirSync(join(dir, "receipts"), { recursive: true });
  if (verdict) writeFileSync(join(dir, "verdict.json"), JSON.stringify(verdict), "utf8");

  const fakePi = join(dir, "fake-pi.sh");
  writeFileSync(fakePi, `#!/bin/sh
exec bun "$RUNNER" "$@"
`, "utf8");
  chmodSync(fakePi, 0o755);

  const logPath = ".agentic-workflow/advance-run.log";
  mkdirSync(join(dir, ".agentic-workflow"), { recursive: true });
  writeFileSync(join(dir, logPath), "", "utf8");
  const supervisor = renderSupervisorScript({
    cwd: dir,
    piBin: fakePi,
    advanceArgs: "--resume --continue",
    runLogPath: logPath,
    restartCap: 3,
    backoffSeconds: 0,
  });
  const supervisorPath = join(dir, "supervisor.sh");
  writeFileSync(supervisorPath, supervisor, "utf8");
  return { dir, supervisorPath, logPath: join(dir, logPath) };
}

function runSupervisor({ dir, supervisorPath }, env = {}) {
  const out = spawnSync("sh", [supervisorPath], {
    encoding: "utf8",
    env: { ...process.env, ADVANCE_DIR: dir, RUNNER, ...env },
    timeout: 120_000,
  });
  return out;
}

const invocations = (dir) => {
  const p = join(dir, "invocations.log");
  return existsSync(p) ? readFileSync(p, "utf8").split("\n").filter(Boolean) : [];
};
const journalRows = (logPath) =>
  readFileSync(logPath, "utf8").split("\n").filter(Boolean).map((line) => {
    const cells = line.split(" — ");
    return { kind: cells[1], detail: cells[2], iteration: cells[3] };
  });

test("CR1: SIGKILL mid-run → supervisor restarts → the run finishes with one invocation per stage", () => {
  const fx = fixture("kill");
  const out = runSupervisor(fx, { KILL_AFTER_RECEIPT: "1" });
  assert.equal(out.status, 0, `supervisor exited ${out.status}: ${out.stderr}`);
  assert.deepEqual(invocations(fx.dir), ["/skill:stage-1", "/skill:stage-2", "/skill:stage-3"], "no stage ran twice");

  const rows = journalRows(fx.logPath);
  const kinds = rows.map((r) => r.kind);
  assert.equal(kinds.filter((k) => k === "run/start").length, 2, "two attempts: the killed one and the resumed one");
  assert.equal(kinds.filter((k) => k === "run/stop").length, 1, "the killed attempt left no terminal row");
  assert.ok(kinds.includes("supervisor/restart"), "the restart is auditable");
  assert.ok(kinds.includes("resume/detected"), "the death is named");
  assert.ok(kinds.includes("resume/verdict:RESUMABLE"), "the reconcile verdict is recorded");

  const detected = rows.find((r) => r.kind === "resume/detected");
  assert.match(detected.detail, /r-\d+/u, "names the interrupted run id");
  const stop = rows[rows.length - 1];
  assert.equal(stop.kind, "run/stop");
});

test("CR2: an AMBIGUOUS reconcile halts before any stage and the journal records the stop", () => {
  const fx = fixture("ambiguous", {
    verdict: "AMBIGUOUS",
    branches: [{ branch: "feat/284-unattended-durability", evidence: "ticks ahead of commits", verdict: "AMBIGUOUS", resume_command: null }],
  });
  const out = runSupervisor(fx);
  assert.equal(out.status, 3, "a human-decision stop is a distinct exit for the operator");
  assert.deepEqual(invocations(fx.dir), [], "no silent continuation");

  const rows = journalRows(fx.logPath);
  assert.ok(rows.some((r) => r.kind === "resume/halted"), "the halt is recorded");
  assert.ok(rows.some((r) => r.kind === "run/stop" && r.detail === "stop-crash-ambiguous"), "the stop code is recorded");
});
