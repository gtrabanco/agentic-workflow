// ledger-commit.test.mjs — issue #727 S1a: the teardown commits the ledger it
// just wrote, with zero model tokens and without failing the session.
//
// Two halves, one contract. `createLedgerCommit` composes the spawn (the crate
// command, at the runtime that launched pi, with a bounded wait); the wiring
// calls it once per teardown, after the final flush, so a host kept alive between
// prompts only ever commits the rows it actually emitted. Every case injects its
// seam: no case spawns a real crate, and no case writes the repository.

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { createLedgerCommit } from "../dist/ledger-commit.js";
import { createTelemetryWiring } from "../dist/extension/telemetry-wiring.js";

const sandbox = () => fs.mkdtempSync(path.join(os.tmpdir(), "pi-ledger-commit-"));

function recorders() {
  const lines = [];
  const writes = [];
  return {
    lines,
    writes,
    report: (message) => lines.push(message),
    sink: {
      name: "recorder",
      write(sample) {
        writes.push(sample);
      },
    },
    ledgerCommit: {
      commit() {
        writes.push({ teardown: true });
        return { status: "committed" };
      },
    },
  };
}

test("the teardown commits the ledger alone through the crate command at the runtime that launched pi", () => {
  const root = sandbox();
  const calls = [];
  const commit = createLedgerCommit({
    root,
    program: "bun",
    script: "/crate/bin/agentic-workflow.mjs",
    env: { AGENTIC_WORKFLOW_RUNTIME: "bun" },
    spawn: (program, argv, options) => {
      calls.push({ program, argv, options });
      return { status: 0, stdout: JSON.stringify({ contract: "machine-ledger-commit@1", status: "committed", paths: ["docs/workflow/TIER_COST.md"] }), stderr: "" };
    },
    report: () => {},
  });

  const outcome = commit.commit();

  assert.equal(outcome.status, "committed");
  assert.equal(calls.length, 1, "exactly one child per teardown");
  assert.equal(calls[0].program, "bun", "the runtime that launched pi runs the child");
  assert.deepEqual(calls[0].argv, ["/crate/bin/agentic-workflow.mjs", "telemetry", "commit", "--class", "telemetry"]);
  assert.equal(calls[0].options.cwd, root, "the project root is the child's cwd");
  assert.equal(calls[0].options.env.AGENTIC_WORKFLOW_RUNTIME, "bun");
  assert.equal(calls[0].options.timeout, 10000, "a teardown never waits unbounded");
});

test("the wiring commits after the final flush, once per session", () => {
  const root = sandbox();
  // The unit comes from the command's argument resolved against the project's
  // own trees, so the fixture carries the unit directory it names.
  fs.mkdirSync(path.join(root, "docs", "fix", "727-machine-ledger-commits"), { recursive: true });
  const recorder = recorders();
  const events = new Map();
  const pi = { on: (name, handler) => events.set(name, [...(events.get(name) ?? []), handler]) };
  const wiring = createTelemetryWiring({
    root,
    enabled: true,
    sinks: [recorder.sink],
    ledgerCommit: recorder.ledgerCommit,
    changedPaths: () => 2,
    sessionStartSha: () => "abc",
    sessionId: () => "session-727",
    now: () => 1_000,
    date: () => "2026-11-26",
  });
  wiring.noteCommand("execute-phase", ["727"]);
  wiring.register(pi);

  for (const handler of events.get("session_start") ?? []) handler({}, {});
  for (const handler of events.get("session_shutdown") ?? []) handler({}, {});
  // A host that fires the event twice still commits once: the session's rows
  // left memory at the first flush, and a second commit has nothing to carry.
  for (const handler of events.get("session_shutdown") ?? []) handler({}, {});

  assert.equal(recorder.writes.filter((entry) => entry.teardown === true).length, 1, "one commit per teardown");
  const last = recorder.writes[recorder.writes.length - 1];
  assert.equal(last.teardown, true, "the commit is the last thing the teardown does — the row is written first");
  assert.ok(
    recorder.writes.some((entry) => entry.unit === "727-machine-ledger-commits"),
    "the flush wrote the session's own row before the commit ran",
  );
});

test("an absent crate reports once and never throws", () => {
  const root = sandbox();
  const lines = [];
  const commit = createLedgerCommit({ root, script: null, report: (message) => lines.push(message) });
  const first = commit.commit();
  const second = commit.commit();
  assert.equal(first.status, "skipped");
  assert.equal(second.status, "skipped");
  assert.equal(lines.length, 1, "one line per session, never one per attempt");
  assert.match(lines[0], /@gtrabanco\/agentic-workflow is not installed/u);
});

test("a failing spawn is reported, never thrown", () => {
  const root = sandbox();
  const lines = [];
  const commit = createLedgerCommit({
    root,
    program: "node",
    script: "/crate/bin/agentic-workflow.mjs",
    spawn: () => ({ status: null, stdout: "", stderr: "", error: new Error("EAGAIN") }),
    report: (message) => lines.push(message),
  });
  const outcome = commit.commit();
  assert.equal(outcome.status, "failed");
  assert.equal(lines.length, 1);
  assert.match(lines[0], /EAGAIN|failed/u);
});

test("a disabled telemetry switch registers no commit", () => {
  const root = sandbox();
  const recorder = recorders();
  const events = new Map();
  const pi = { on: (name, handler) => events.set(name, [...(events.get(name) ?? []), handler]) };
  const wiring = createTelemetryWiring({ root, enabled: false, sinks: [recorder.sink], ledgerCommit: recorder.ledgerCommit });
  wiring.register(pi);
  assert.equal(events.size, 0, "off registers no listener at all");
  assert.equal(recorder.writes.length, 0);
});
