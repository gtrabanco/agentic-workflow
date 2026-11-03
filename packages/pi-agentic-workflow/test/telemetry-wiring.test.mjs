// telemetry-wiring.test.mjs — issue #383 P5: the accumulator has to be attached
// to a real session or the ledger stays empty forever.
//
// The wiring is a pure factory over a `pi`-shaped object (`on(event, handler)`),
// so the corpus drives the five lifecycle events directly and never needs a live
// Pi. What it pins: `off` registers nothing, the unit comes from the command that
// was dispatched, and one session emits one sample.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createTelemetryWiring, sessionChangedPaths } from "../dist/extension/telemetry-wiring.js";
import { execFileSync } from "node:child_process";
import { parseConfigFile } from "../dist/config/schema.js";
import { mergeConfigs } from "../dist/config/merge.js";

/** A `pi` double: it records handlers so the test can fire them. */
function fakePi() {
  const handlers = new Map();
  return {
    pi: { on: (event, handler) => handlers.set(event, handler) },
    fire(event, payload = {}) {
      const handler = handlers.get(event);
      assert.ok(handler, `no handler registered for ${event}`);
      return handler(payload);
    },
    registered: () => [...handlers.keys()].sort(),
  };
}

function project() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "telemetry-wiring-"));
  fs.mkdirSync(path.join(root, "docs/fix/383-measured-acceptance"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/fix/383-measured-acceptance/SPEC.md"), "# fix/383-measured-acceptance\n\n## Risk tier\n\n- **Tier** — `standard` · **Task Size** — `small`\n");
  return root;
}

/** A wiring over a recording sink and a clock the test owns. */
function wiring(overrides = {}) {
  const written = [];
  const clock = overrides.clock ?? (() => 1_000);
  const instance = createTelemetryWiring({
    root: overrides.root ?? project(),
    enabled: overrides.enabled ?? true,
    sinks: [{ name: "recording", write: (sample) => written.push(sample) }],
    changedPaths: overrides.changedPaths ?? (() => 7),
    sessionStartSha: () => "abc123",
    now: clock,
    date: () => "2026-11-03",
    source: "pi:session=abc",
  });
  return { instance, written };
}

test("off registers nothing at all — absence, not a listener that does nothing", () => {
  const { instance } = wiring({ enabled: false });
  const { pi, registered } = fakePi();
  instance.register(pi);
  assert.deepEqual(registered(), []);
});

test("on registers the five lifecycle events", () => {
  const { instance } = wiring();
  const { pi, registered } = fakePi();
  instance.register(pi);
  assert.deepEqual(registered(), ["session_shutdown", "session_start", "tool_execution_end", "turn_end", "turn_start"]);
});

test("the unit comes from the dispatched command, and one session emits one sample", () => {
  const { instance, written } = wiring();
  const { pi, fire } = fakePi();
  instance.register(pi);
  instance.noteCommand("execute-phase", ["383", "P2"]);

  fire("session_start");
  fire("turn_start", { timestamp: 1_000 });
  fire("tool_execution_end", { durationMs: 200 });
  fire("turn_end", { message: { usage: { totalTokens: 750 } } });
  fire("session_shutdown");

  assert.equal(written.length, 1);
  assert.equal(written[0].unit, "383-measured-acceptance");
  assert.equal(written[0].tokens, 750);
  assert.equal(written[0].turns, 1);
  assert.equal(written[0].tool_ms, 200);
  assert.equal(written[0].changed_paths, 7);
  fire("session_shutdown");
  assert.equal(written.length, 1, "a second shutdown is not a second row");
});

test("a session that named no unit emits nothing — no invented row", () => {
  const { instance, written } = wiring();
  const { pi, fire } = fakePi();
  instance.register(pi);
  instance.noteCommand("log-session", []);
  fire("turn_end", { message: { usage: { totalTokens: 10 } } });
  fire("session_shutdown");
  assert.deepEqual(written, []);
});

test("a command with no resolvable unit directory leaves the previous unit unset", () => {
  const { instance, written } = wiring();
  const { pi, fire } = fakePi();
  instance.register(pi);
  instance.noteCommand("execute-phase", ["999"]);
  fire("turn_end", { message: { usage: { totalTokens: 10 } } });
  fire("session_shutdown");
  assert.deepEqual(written, [], "an issue with no unit dir is not a unit");
});

test("the switch is one boolean, off by default, and a stray key is refused", () => {
  assert.equal(parseConfigFile('{"telemetry":{"enabled":true}}').config.telemetry.enabled, true);
  const refused = parseConfigFile('{"telemetry":{"off":true}}');
  assert.equal(refused.ok, false, "an unknown telemetry key is a parse failure, not a silent no-op");
  assert.match(refused.issues.map((issue) => issue.message).join(" "), /unknown telemetry key "off"/);
  assert.equal(parseConfigFile('{"telemetry":{"enabled":"yes"}}').ok, false, "a non-boolean is refused");
  assert.equal(mergeConfigs(parseConfigFile("{}").config, parseConfigFile("{}").config).telemetry.enabled, false, "a fresh install measures nothing");
});

test("a session's own scope is counted from git: its commits plus what is still uncommitted", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "telemetry-scope-"));
  const run = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
  run("init", "-q");
  run("config", "user.email", "t@example.com");
  run("config", "user.name", "t");
  fs.writeFileSync(path.join(root, "a.txt"), "a\n");
  run("add", ".");
  run("commit", "-qm", "one");
  const start = run("rev-parse", "HEAD").trim();

  assert.equal(sessionChangedPaths(root, start), 0, "a session that changed nothing counts nothing");
  fs.writeFileSync(path.join(root, "b.txt"), "b\n");
  run("add", ".");
  run("commit", "-qm", "two");
  fs.writeFileSync(path.join(root, "c.txt"), "c\n");
  assert.equal(sessionChangedPaths(root, start), 2, "committed b plus uncommitted c — the session's own scope, not the branch's");
});
