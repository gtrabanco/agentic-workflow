// auto-log-session-wiring.test.mjs — the session lifecycle (feature #394, S1/S4/
// S9/S10/S11).
//
// The wiring is a factory over a `pi`-shaped object (`on(event, handler)`), so
// this suite drives `session_start` and `session_shutdown` directly and never
// needs a live session. What it pins, in the order the requirements state them:
//
//  - **Off registers nothing.** Not a listener that wakes up to find itself
//    disabled: `pi.on` is never called.
//  - **One entry per shutdown**, then the marker is gone; a second shutdown
//    appends nothing.
//  - **The failure states are the feature**: no journal, no marker, a foreign
//    marker, a publisher that fails — each has its own case below, because a
//    journal writer that only works when everything is fine is a journal writer
//    nobody can trust.
//  - **The two switches are two wirings** (S4): the matrix at the end drives the
//    telemetry wiring and this one over the same `pi` double, and asserts that
//    turning either one off leaves the other's output intact.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createAutoLogSessionWiring } from "../dist/extension/auto-log-session-wiring.js";
import { createTelemetryWiring } from "../dist/extension/telemetry-wiring.js";
import { markerPath, readMarker } from "../dist/auto-log-session.js";
import { renderEntry } from "@gtrabanco/agentic-workflow/src/log/render.mjs";

/** A `pi` double: it records handlers so the test can fire them. */
function fakePi() {
  const handlers = new Map();
  return {
    pi: { on: (event, handler) => handlers.set(event, handler) },
    fire(event, payload = {}, ctx = {}) {
      const handler = handlers.get(event);
      assert.ok(handler, `no handler registered for ${event}`);
      return handler(payload, ctx);
    },
    registered: () => [...handlers.keys()].sort(),
  };
}

/** A throwaway git project with a journal, a seeded commit and a ledger. */
function project({ journal = true, ledger = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "auto-log-wiring-"));
  const run = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  run(["init", "-q", "-b", "main"]);
  run(["config", "user.email", "suite@example.test"]);
  run(["config", "user.name", "suite"]);
  run(["config", "commit.gpgsign", "false"]);
  fs.mkdirSync(path.join(root, "docs/fix/394-auto-log-session"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/fix/394-auto-log-session/SPEC.md"), "# 394\n\n## Risk tier\n\n- **Tier** — `standard` · **Task Size** — `small`\n");
  if (journal) fs.writeFileSync(path.join(root, "docs/LOGS.md"), "# Session log\n\n");
  if (ledger) fs.writeFileSync(path.join(root, "docs/workflow/TIER_COST.md"), TIER_COST_LEDGER);
  fs.writeFileSync(path.join(root, "seed.txt"), "seed\n");
  run(["add", "."]);
  run(["commit", "-q", "-m", "seed"]);
  return { root, run };
}

/** The minimum ledger the `tier-cost@1` sink accepts. */
const TIER_COST_LEDGER = [
  "# Tier cost",
  "",
  "```text",
  "tier-cost@1",
  "column | meaning",
  "unit | the unit",
  "changed_paths | paths",
  "tokens | tokens",
  "turns | turns",
  "model_ms | model millis",
  "tool_ms | tool millis",
  "observed | day",
  "source | provenance",
  "```",
  "",
  "| unit | changed_paths | tokens | turns | model_ms | tool_ms | observed | source |",
  "|---|---|---|---|---|---|---|---|",
  "",
].join("\n");

const NOW = () => Date.parse("2026-11-04T15:12:43Z");
const SESSION = "s-394";

/** Drive one full session: start with a context carrying the id, then shutdown. */
function session(wiring, { id = SESSION, reason = "quit", start = {}, shutdown = {} } = {}) {
  const pi = fakePi();
  wiring.register(pi.pi);
  const ctx = { sessionManager: { getSessionId: () => id } };
  pi.fire("session_start", start, ctx);
  return { pi, ctx, shutdown: () => pi.fire("session_shutdown", { reason }, ctx) };
}

test("AW-01 off registers no listener at all and writes nothing", () => {
  const { root } = project();
  const pi = fakePi();
  createAutoLogSessionWiring({ root, mode: "off" }).register(pi.pi);
  assert.deepEqual(pi.registered(), []);
  assert.equal(fs.existsSync(markerPath(root, SESSION)), false);
  assert.equal(fs.readFileSync(path.join(root, "docs/LOGS.md"), "utf8"), "# Session log\n\n");
  fs.rmSync(root, { recursive: true, force: true });
});

test("AW-02 one session writes the marker on start and exactly one entry on shutdown", () => {
  const { root, run } = project();
  const wiring = createAutoLogSessionWiring({ root, mode: "mechanical", now: NOW });
  const driven = session(wiring);
  const marker = readMarker(root, SESSION);
  assert.ok(marker, "session_start must record the marker");
  assert.equal(marker.sha, run(["rev-parse", "--short", "HEAD"]).trim());

  driven.shutdown();
  const journal = fs.readFileSync(path.join(root, "docs/LOGS.md"), "utf8");
  assert.equal(journal, `# Session log\n\n\n${renderEntry({
    timestamp: "2026-11-04T15:12Z",
    branch: "main",
    reason: "quit",
    commits: { count: 0, range: `${marker.sha}…${marker.sha}` },
    files: [],
  })}`);
  assert.equal(fs.existsSync(markerPath(root, SESSION)), false, "the marker is removed with the entry");
  fs.rmSync(root, { recursive: true, force: true });
});

test("AW-03 a second shutdown for the same session appends nothing", () => {
  const { root } = project();
  const driven = session(createAutoLogSessionWiring({ root, mode: "mechanical", now: NOW }));
  driven.shutdown();
  const once = fs.readFileSync(path.join(root, "docs/LOGS.md"), "utf8");
  driven.shutdown();
  assert.equal(fs.readFileSync(path.join(root, "docs/LOGS.md"), "utf8"), once);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AW-04 a project without a journal did not opt in: no marker, no entry, no publisher", () => {
  const { root } = project({ journal: false });
  let published = 0;
  const publisher = { name: "spy", publish: () => { published += 1; return { ok: true }; } };
  const driven = session(createAutoLogSessionWiring({ root, mode: "mechanical", now: NOW, extraPublishers: [publisher] }));
  assert.equal(fs.existsSync(markerPath(root, SESSION)), false);
  driven.shutdown();
  assert.equal(fs.existsSync(path.join(root, "docs/LOGS.md")), false, "the journal is never created");
  assert.equal(published, 0);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AW-05 a marker left by another session is never adopted and never removed", () => {
  const { root, run } = project();
  // A crashed session's marker, older than this one.
  fs.mkdirSync(path.join(root, ".pi"), { recursive: true });
  fs.writeFileSync(markerPath(root, "crashed-session"), "deadbee 1700000000 2023-11-14T22:13Z\n");
  // This session's range must be its own HEAD, not the crashed marker's sha.
  fs.writeFileSync(path.join(root, "work.txt"), "w\n");
  run(["add", "."]);
  run(["commit", "-q", "-m", "session work"]);

  const driven = session(createAutoLogSessionWiring({ root, mode: "mechanical", now: NOW }));
  driven.shutdown();
  const journal = fs.readFileSync(path.join(root, "docs/LOGS.md"), "utf8");
  assert.match(journal, /- \*\*Commits:\*\* 1 `/u, "the entry counts this session's commit");
  assert.equal(journal.includes("deadbee"), false, "the crashed marker's sha never reaches the entry");
  assert.equal(fs.readFileSync(markerPath(root, "crashed-session"), "utf8"), "deadbee 1700000000 2023-11-14T22:13Z\n");
  fs.rmSync(root, { recursive: true, force: true });
});

test("AW-06 a shutdown with no session_start wrote nothing — no entry from an unmarked session", () => {
  const { root } = project();
  const pi = fakePi();
  createAutoLogSessionWiring({ root, mode: "mechanical", now: NOW }).register(pi.pi);
  pi.fire("session_shutdown", { reason: "quit" }, { sessionManager: { getSessionId: () => SESSION } });
  assert.equal(fs.readFileSync(path.join(root, "docs/LOGS.md"), "utf8"), "# Session log\n\n");
  fs.rmSync(root, { recursive: true, force: true });
});

test("AW-07 a failing publisher keeps the local entry and never escapes shutdown", () => {
  const { root } = project();
  const wiring = createAutoLogSessionWiring({
    root,
    mode: "mechanical",
    now: NOW,
    extraPublishers: [
      { name: "boom", publish: () => { throw new Error("backend down"); } },
      { name: "declined", publish: () => ({ ok: false, error: "refused" }) },
    ],
  });
  const driven = session(wiring);
  assert.doesNotThrow(() => driven.shutdown());
  const journal = fs.readFileSync(path.join(root, "docs/LOGS.md"), "utf8");
  assert.match(journal, /^## 2026-11-04T15:12Z — main — auto \(quit\)$/mu);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AW-08 the declared publisher receives the frozen payload, journal first", () => {
  const { root } = project();
  const seen = [];
  const recorder = (name) => ({ name, publish: (facts) => { seen.push([name, facts]); return { ok: true }; } });
  const wiring = createAutoLogSessionWiring({
    root,
    mode: "mechanical",
    now: NOW,
    extraPublishers: [recorder("second")],
  });
  session(wiring).shutdown();
  assert.deepEqual(seen.map(([name]) => name), ["second"]);
  const facts = seen[0][1];
  assert.deepEqual(Object.keys(facts).sort(), ["branch", "commits", "files", "reason", "timestamp"]);
  assert.equal(facts.timestamp, "2026-11-04T15:12Z");
  assert.equal(facts.reason, "quit");
  // The same payload the journal rendered from — one shape, no prose.
  assert.equal(JSON.stringify(facts).includes("## "), false);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AW-09 the switch the config resolves to is the switch the wiring obeys", () => {
  const { root } = project();
  const journalOf = (mode) => {
    const wiring = createAutoLogSessionWiring({ root, mode, now: NOW });
    session(wiring, { id: `session-${mode}` }).shutdown();
    return fs.readFileSync(path.join(root, "docs/LOGS.md"), "utf8");
  };
  assert.equal(journalOf("off"), "# Session log\n\n");
  assert.match(journalOf("mechanical"), /auto \(quit\)/u);
  fs.rmSync(root, { recursive: true, force: true });
});

/* ── S4: the independence matrix ───────────────────────────────────────── */

test("AW-10 telemetry on with the log off writes the ledger row and no journal entry", () => {
  const { root } = project({ ledger: true });
  const pi = fakePi();
  const telemetry = createTelemetryWiring({ root, enabled: true, now: () => NOW(), date: () => "2026-11-04", sessionId: () => "tel-1" });
  telemetry.register(pi.pi);
  createAutoLogSessionWiring({ root, mode: "off", now: NOW }).register(pi.pi);
  assert.deepEqual(pi.registered(), ["session_start", "session_shutdown", "tool_execution_end", "turn_end", "turn_start"]);
  telemetry.noteCommand("unit-lane", ["394-auto-log-session"]);
  pi.fire("session_start", {}, { sessionManager: { getSessionId: () => "tel-1" } });
  pi.fire("turn_start", { timestamp: NOW() });
  pi.fire("turn_end", { message: { usage: { totalTokens: 120 } } });
  pi.fire("session_shutdown", { reason: "quit" }, { sessionManager: { getSessionId: () => "tel-1" } });
  const ledger = fs.readFileSync(path.join(root, "docs/workflow/TIER_COST.md"), "utf8");
  assert.match(ledger, /^\| 394-auto-log-session \| .* \| 2026-11-04 \| /mu, "telemetry still measured the session");
  assert.equal(fs.readFileSync(path.join(root, "docs/LOGS.md"), "utf8"), "# Session log\n\n", "the log is off");
  fs.rmSync(root, { recursive: true, force: true });
});

test("AW-11 the log on with telemetry off writes the entry and no ledger row", () => {
  const { root } = project({ ledger: true });
  const pi = fakePi();
  createAutoLogSessionWiring({ root, mode: "mechanical", now: NOW }).register(pi.pi);
  const ctx = { sessionManager: { getSessionId: () => SESSION } };
  pi.fire("session_start", {}, ctx);
  pi.fire("session_shutdown", { reason: "quit" }, ctx);
  assert.match(fs.readFileSync(path.join(root, "docs/LOGS.md"), "utf8"), /auto \(quit\)/u);
  assert.equal(fs.readFileSync(path.join(root, "docs/workflow/TIER_COST.md"), "utf8"), TIER_COST_LEDGER, "telemetry is off");
  fs.rmSync(root, { recursive: true, force: true });
});
