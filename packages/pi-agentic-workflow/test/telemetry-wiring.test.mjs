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
import { mergeConfigs } from "../dist/config/merge.js";
import { BASE_CONFIG_SECTIONS, validateSectionValue } from "@gtrabanco/agentic-workflow-schema";
import { tempRoot } from "../../../scripts/temp-root.mjs";

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

function project() {
  const root = tempRoot("telemetry-wiring-");
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
    ...("changedPaths" in overrides ? { changedPaths: overrides.changedPaths } : {}),
    sessionStartSha: overrides.sessionStartSha ?? (() => "abc123"),
    sessionId: overrides.sessionId,
    now: clock,
    date: () => "2026-11-03",
    source: overrides.source,
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
  const { instance, written } = wiring({ changedPaths: () => 7 });
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
  assert.equal(written[0].changed_paths, 7, "the injected counter is used when the caller owns git");
  assert.match(written[0].source, /^pi:session=instance-[0-9a-f-]{36}$/, "a caller that named no session gets a fresh identity, never a shared constant");
  fire("session_shutdown");
  assert.equal(written.length, 1, "a second shutdown is not a second row");
});

test("the sample names the session it measured, so two sessions are two rows", () => {
  const { instance, written } = wiring({ sessionId: () => "s-42" });
  const { pi, fire } = fakePi();
  instance.register(pi);
  instance.noteCommand("execute-phase", ["383"]);
  fire("session_start", {}, { sessionManager: { getSessionId: () => "s-42" } });
  fire("turn_end", { message: { usage: { totalTokens: 10 } } });
  fire("session_shutdown");
  assert.equal(written[0].source, "pi:session=s-42");
});

test("the session id comes from the start context when the caller injected none", () => {
  const { instance, written } = wiring();
  const { pi, fire } = fakePi();
  instance.register(pi);
  instance.noteCommand("execute-phase", ["383"]);
  fire("session_start", {}, { sessionManager: { getSessionId: () => "s-from-ctx" } });
  fire("turn_end", { message: { usage: { totalTokens: 10 } } });
  fire("session_shutdown");
  assert.equal(written[0].source, "pi:session=s-from-ctx");
});

test("the path count is the session's own work, measured when the sample is written", () => {
  const root = tempRoot("telemetry-paths-");
  const run = (...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
  run("init", "-q");
  run("config", "user.email", "t@example.com");
  run("config", "user.name", "t");
  fs.mkdirSync(path.join(root, "docs/fix/383-measured-acceptance"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/fix/383-measured-acceptance/SPEC.md"), "# fix/383-measured-acceptance\n");
  run("add", ".");
  run("commit", "-qm", "base");

  const { instance, written } = wiring({ root, sessionStartSha: () => run("rev-parse", "HEAD").trim() });
  const { pi, fire } = fakePi();
  instance.register(pi);
  fire("session_start");
  instance.noteCommand("execute-phase", ["383"]); // dispatched on a clean tree

  for (let index = 0; index < 3; index += 1) fs.writeFileSync(path.join(root, `f${index}.txt`), "x\n");
  run("add", ".");
  run("commit", "-qm", "the session's own work");

  fire("turn_end", { message: { usage: { totalTokens: 10 } } });
  fire("session_shutdown");
  assert.equal(written[0].changed_paths, 3, "the command ran on a clean tree; the three paths are what the session did after it");
});

test("two wirings with no session id still cannot share a source", () => {
  const root = project();
  const sample = (instance) => {
    const written = [];
    const { pi, fire } = fakePi();
    instance.register(pi);
    instance.noteCommand("execute-phase", ["383"]);
    fire("session_start");
    fire("turn_end", { message: { usage: { totalTokens: 10 } } });
    fire("session_shutdown");
    return written;
  };
  const build = (sinks) => createTelemetryWiring({ root, enabled: true, sinks, changedPaths: () => 3, sessionStartSha: () => "abc", now: () => 1_000, date: () => "2026-11-03" });
  const written = [];
  const sink = { name: "recording", write: (value) => written.push(value) };
  sample(build([sink]));
  sample(build([sink]));
  assert.equal(written.length, 2);
  assert.notEqual(
    written[0].source,
    written[1].source,
    "a caller that never named a session still gets one identity per session, so two identical samples cannot merge",
  );
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
  const section = BASE_CONFIG_SECTIONS.find((entry) => entry.key === "telemetry");
  assert.deepEqual(validateSectionValue(section, { enabled: true }), []);
  assert.equal(validateSectionValue(section, { off: true }).length, 1, "an unknown telemetry key is a validation failure, not a silent no-op");
  assert.equal(validateSectionValue(section, { enabled: "yes" }).length, 1, "a non-boolean is refused");
  assert.equal(mergeConfigs({}, {}).telemetry.enabled, false, "a fresh install measures nothing");
});

test("a session's own scope is counted from git: its commits plus what is still uncommitted", () => {
  const root = tempRoot("telemetry-scope-");
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
