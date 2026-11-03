// session-telemetry.test.mjs — issue #383 (S4, S4a, S4b): the session
// accumulator that turns pi's own numbers into one unit sample.
//
// The corpus is the four failure shapes the accumulator exists to prevent:
// counting a session span as work, counting a hung tool as model time, emitting
// a second sample for one session, and letting one broken sink cost the others
// their row. Every case injects the clock, so nothing here depends on how long
// the suite takes.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createSessionTelemetry, unitFromCommand } from "../dist/session-telemetry.js";

/** A clock the test owns, in milliseconds. */
function clockAt(start = 0) {
  let value = start;
  return {
    now: () => value,
    set: (next) => {
      value = next;
    },
    advance: (by) => {
      value += by;
    },
  };
}

const DATE = "2026-11-03";

/** An accumulator with one recording sink, over a clock the caller owns. */
function accumulator(overrides = {}) {
  const clock = overrides.clock ?? clockAt();
  const written = [];
  const telemetry = createSessionTelemetry({
    enabled: true,
    unit: "383-measured-acceptance",
    tier: "standard",
    changedPaths: 12,
    sinks: [{ name: "recording", write: (sample) => written.push(sample) }],
    now: clock.now,
    date: () => DATE,
    source: "pi:session=abc",
    ...overrides,
  });
  return { telemetry, written, clock };
}

test("disabled telemetry counts nothing and emits nothing — absence, never an estimate", () => {
  const { telemetry, written } = accumulator({ enabled: false });
  telemetry.onTurnStart({ timestamp: 0 });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 500 } } });
  telemetry.onToolEnd({ durationMs: 90_000 });
  assert.equal(telemetry.peek(), null);
  assert.equal(telemetry.flush(), null);
  assert.deepEqual(written, []);
});

test("tokens and turns accumulate across turns from the provider's own usage", () => {
  const { telemetry, written } = accumulator();
  telemetry.onTurnStart({ timestamp: 0 });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 100 } } });
  telemetry.onTurnStart({ timestamp: 10 });
  telemetry.onTurnEnd({ message: { usage: { input: 150, output: 50, cacheRead: 50 } } });
  const sample = telemetry.flush();
  assert.equal(sample.tokens, 350, "a usage record without totalTokens sums its parts");
  assert.equal(sample.turns, 2);
  assert.equal(written.length, 1);
});

test("model time is the turn window minus the tools it ran", () => {
  const clock = clockAt(0);
  const { telemetry, clock: same } = accumulator({ clock });
  telemetry.onTurnStart({ timestamp: 0 });
  same.set(400);
  telemetry.onToolEnd({ durationMs: 400 });
  same.set(1000);
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  const sample = telemetry.flush();
  assert.equal(sample.model_ms, 600, "1000 ms of window, 400 ms of tool: the model spent 600");
  assert.equal(sample.tool_ms, 400);
});

test("a hung tool reports as tool time, never as work", () => {
  const clock = clockAt(0);
  const { telemetry } = accumulator({ clock });
  telemetry.onTurnStart({ timestamp: 0 });
  clock.set(900_000);
  telemetry.onToolEnd({ durationMs: 900_000 });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  const sample = telemetry.flush();
  assert.equal(sample.model_ms, 0, "a command waiting on a network is not the model thinking");
  assert.equal(sample.tool_ms, 900_000);
});

test("the gap between two turns adds nothing, however long it is", () => {
  const clock = clockAt(0);
  const { telemetry } = accumulator({ clock });
  telemetry.onTurnStart({ timestamp: 0 });
  clock.set(50);
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  clock.set(10_000_000);
  telemetry.onTurnStart({ timestamp: 10_000_000 });
  clock.set(10_000_030);
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  const sample = telemetry.flush();
  assert.equal(sample.model_ms, 80, "50 ms plus 30 ms — a person away for days adds zero");
});

test("one session emits exactly one sample", () => {
  const { telemetry, written } = accumulator();
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  assert.notEqual(telemetry.flush(), null);
  assert.equal(telemetry.flush(), null, "a second flush is a no-op, not a second row");
  assert.equal(written.length, 1);
});

test("one broken sink costs the others nothing, and never blocks shutdown", () => {
  const clock = clockAt(0);
  const good = [];
  const telemetry = createSessionTelemetry({
    enabled: true,
    unit: "383-measured-acceptance",
    tier: "standard",
    sinks: [
      { name: "broken", write: () => { throw new Error("publisher down"); } },
      { name: "recording", write: (sample) => good.push(sample) },
    ],
    now: clock.now,
    date: () => DATE,
  });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  const sample = telemetry.flush();
  assert.equal(good.length, 1, "the sink after the broken one still received the sample");
  assert.equal(sample.unit, "383-measured-acceptance");
});

test("the sample is content-free: a unit id and numbers, nothing a model said", () => {
  const { telemetry } = accumulator();
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10, input: 4, output: 6 } } });
  const sample = telemetry.flush();
  assert.deepEqual(Object.keys(sample).sort(), [
    "changed_paths", "model_ms", "observed", "source", "tier", "tokens", "tool_ms", "turns", "unit",
  ]);
  for (const [key, value] of Object.entries(sample)) {
    if (["unit", "tier", "observed", "source"].includes(key)) {
      assert.equal(typeof value, "string", `${key} is the only kind of string a sample carries`);
      continue;
    }
    assert.equal(typeof value, "number", `${key} is a number`);
  }
  assert.match(sample.observed, /^\d{4}-\d{2}-\d{2}$/);
});

test("a unit is resolved from the command invocation, deterministically, or not at all", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "telemetry-unit-"));
  fs.mkdirSync(path.join(root, "docs/fix/383-measured-acceptance"), { recursive: true });
  fs.mkdirSync(path.join(root, "docs/features/12-a-feature"), { recursive: true });

  assert.equal(unitFromCommand(root, "execute-phase", ["383", "P2"]), "383-measured-acceptance");
  assert.equal(unitFromCommand(root, "execute-phase", ["383-measured-acceptance"]), "383-measured-acceptance");
  assert.equal(unitFromCommand(root, "unit-lane", ["from-issue", "12"]), "12-a-feature");
  assert.equal(unitFromCommand(root, "execute-phase", ["999"]), null, "an issue with no unit dir invents nothing");
  assert.equal(unitFromCommand(root, "log-session", ["383"]), null, "only unit-scoped commands name a unit");
  assert.equal(unitFromCommand(root, "execute-phase", ["--fix"]), null);
});
