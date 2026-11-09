// conductor-journal.test.mjs — the run journal: rows, boundary, interrupted run
//
// S1 (the resume entry needs a death signal) and S4 (the resume must be
// auditable: death -> restart -> resumed iteration). The journal is a hint, not
// an authority: it only answers "did the last run reach a terminal row?".

import { test } from "node:test";
import assert from "node:assert/strict";

const {
  formatJournalRow,
  parseJournalRow,
  readJournal,
  interruptedRun,
} = await import("../dist/conductor/index.js");

const ROW = (kind, code, detail, k, cap) =>
  `${"2026-11-09 15:04"} — ${kind}/${code} — ${detail} — ${k}/${cap}`;

test("J1: a row parses into date, kind/code, detail and k/cap", () => {
  const row = parseJournalRow(ROW("invoke", "invoke-proven-transition", "/skill:execute-phase 284 P1", 2, 12));
  assert.ok(row);
  assert.equal(row.kind, "invoke");
  assert.equal(row.code, "invoke-proven-transition");
  assert.equal(row.detail, "/skill:execute-phase 284 P1");
  assert.equal(row.iteration, 2);
  assert.equal(row.cap, 12);
});

test("J2: a detail cell that itself carries the separator keeps its whole text", () => {
  const row = parseJournalRow(ROW("invoke", "invoke-x", "/skill:audit-pr 42 — dry run", 1, 12));
  assert.ok(row);
  assert.equal(row.detail, "/skill:audit-pr 42 — dry run");
  assert.equal(row.iteration, 1);
});

test("J3: prose, blank lines and truncated rows are not journal rows", () => {
  assert.equal(parseJournalRow(""), null);
  assert.equal(parseJournalRow("some operator note"), null);
  assert.equal(parseJournalRow("2026-11-09 15:04 — invoke — only three cells"), null);
  assert.equal(parseJournalRow("2026-11-09 15:04 — invoke/x — detail — not/cap"), null);
});

test("J4: readJournal keeps order and skips unparseable lines", () => {
  const text = [
    ROW("run", "start", "r-1 pid=4242", 0, 12),
    "free-form operator note",
    ROW("invoke", "invoke-a", "/skill:execute-phase 284 P1", 1, 12),
    ROW("run", "stop", "stop-blocked", 1, 12),
  ].join("\n");
  const rows = readJournal(text);
  assert.deepEqual(rows.map((r) => `${r.kind}/${r.code}`), ["run/start", "invoke/invoke-a", "run/stop"]);
});

test("J5: a start with no later stop is an interrupted run, with its last invocation", () => {
  const rows = readJournal([
    ROW("run", "start", "r-1 pid=4242", 0, 12),
    ROW("invoke", "invoke-a", "/skill:execute-phase 284 P1", 1, 12),
    ROW("sense", "sense-stale-revision", "re-sense", 2, 12),
  ].join("\n"));
  const interrupted = interruptedRun(rows);
  assert.ok(interrupted);
  assert.equal(interrupted.runId, "r-1");
  assert.equal(interrupted.pid, 4242);
  assert.equal(interrupted.iteration, 1);
  assert.equal(interrupted.lastInvocation, "/skill:execute-phase 284 P1");
});

test("J6: a completed run is not interrupted", () => {
  const rows = readJournal([
    ROW("run", "start", "r-1 pid=4242", 0, 12),
    ROW("invoke", "invoke-a", "/skill:execute-phase 284 P1", 1, 12),
    ROW("run", "stop", "continue", 1, 12),
  ].join("\n"));
  assert.equal(interruptedRun(rows), null);
});

test("J7: only the LAST run decides — an old interrupted run followed by a completed one is clean", () => {
  const rows = readJournal([
    ROW("run", "start", "r-1 pid=1", 0, 12),
    ROW("run", "start", "r-2 pid=2", 0, 12),
    ROW("invoke", "invoke-a", "/skill:execute-phase 284 P1", 1, 12),
    ROW("run", "stop", "stop-blocked", 1, 12),
  ].join("\n"));
  assert.equal(interruptedRun(rows), null);
});

test("J8: an empty or legacy-only journal is not interrupted", () => {
  assert.equal(interruptedRun(readJournal("")), null);
  assert.equal(interruptedRun(readJournal([
    ROW("invoke", "invoke-a", "/skill:discover-repository-state", 1, 12),
    ROW("stop", "stop-nothing-startable", "nothing-startable", 1, 12),
  ].join("\n"))), null);
});

test("J9: an interrupted resume that halted for a human is itself terminal", () => {
  const rows = readJournal([
    ROW("run", "start", "r-1 pid=4242", 0, 12),
    ROW("resume", "halted", "AMBIGUOUS", 0, 12),
    ROW("run", "stop", "stop-crash-ambiguous", 0, 12),
  ].join("\n"));
  assert.equal(interruptedRun(rows), null);
});

test("J10: formatJournalRow is the one row writer — same grammar, injected clock", () => {
  const line = formatJournalRow("run", "start", "r-9 pid=7", 0, 12, new Date(2026, 10, 9, 15, 4));
  assert.equal(line, "2026-11-09 15:04 — run/start — r-9 pid=7 — 0/12");
  assert.deepEqual(parseJournalRow(line), {
    at: "2026-11-09 15:04",
    kind: "run",
    code: "start",
    detail: "r-9 pid=7",
    iteration: 0,
    cap: 12,
    raw: line,
  });
});
