// session-telemetry.test.mjs — issue #383 (S4, S4a, S4b): the session
// accumulator that turns pi's own numbers into one unit sample.
//
// The corpus is the four failure shapes the accumulator exists to prevent:
// counting a session span as work, counting a hung tool as model time, emitting
// two samples for one settled run — a later run boundary owns the next sample —
// and letting one broken sink cost the others their row. Every case injects the
// clock, so nothing here depends on how long the suite takes.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createSessionTelemetry, phaseFromCommand, unitFromCommand } from "../dist/session-telemetry.js";
import { readFileSync } from "node:fs";
import { tempRoot } from "../../../scripts/temp-root.mjs";

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

// --- the run boundary (#623 S4/S6) -----------------------------------------
//
// A session that never tears down still has run boundaries, and the accumulator
// is the only place that knows whether a boundary has something new to say: it
// holds the cumulative counters, and a re-emission of the same value must not be
// written twice. The sink stays dumb (one write is one sample), so the guard
// lives here, beside the state it compares.

test("a run boundary emits the cumulative sample, and an unchanged re-emission writes nothing", () => {
  const { telemetry, written } = accumulator();
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  const first = telemetry.emit();
  assert.equal(first.tokens, 10, "the boundary emits what the session has measured so far");
  assert.equal(written.length, 1);
  assert.equal(telemetry.emit(), null, "an emission identical to the last one is a re-emission, not a new sample");
  assert.equal(written.length, 1);
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 5 } } });
  const second = telemetry.emit();
  assert.equal(second.tokens, 15, "the next boundary's sample is cumulative: 10 + 5");
  assert.equal(written.length, 2);
  assert.equal(telemetry.emit(), null, "and its own re-emission is dropped too");
});

test("the final flush adds no second copy of the sample a run boundary already wrote", () => {
  const { telemetry, written } = accumulator();
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  telemetry.emit();
  assert.equal(telemetry.flush(), null, "the last run's sample is already on the sinks");
  assert.equal(written.length, 1);
  assert.equal(telemetry.emit(), null, "the session is closed: a later boundary writes nothing");
});
test("a boundary that measured nothing emits nothing", () => {
  const { telemetry, written } = accumulator({ enabled: false });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  assert.equal(telemetry.emit(), null);
  assert.deepEqual(written, []);
});

test("one broken sink costs the others nothing, and never blocks shutdown", () => {
  const clock = clockAt(0);
  const good = [];
  const telemetry = createSessionTelemetry({
    enabled: true,
    unit: "383-measured-acceptance",
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

// --- the degraded report (#690 S3) -----------------------------------------
//
// The broken-sink case above proved the accumulator survives a refusal; it could
// not prove anyone heard it, because `writeCurrent` swallowed the failure in a
// bare `catch {}`. These cases pin the report: which sink refused, why, and that
// reporting it costs no other destination its sample.

test("a sink that refuses its sample is reported with its name and the reason", () => {
  const clock = clockAt(0);
  const good = [];
  const failures = [];
  const telemetry = createSessionTelemetry({
    enabled: true,
    unit: "690-telemetry-attr",
    sinks: [
      { name: "tier-cost-ledger", write: () => { throw new Error("no tier-cost@2 block"); } },
      { name: "jsonl", write: (sample) => good.push(sample) },
    ],
    onSinkError: (failure) => failures.push(failure),
    now: clock.now,
    date: () => DATE,
  });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  telemetry.flush();

  assert.deepEqual(failures.map((failure) => failure.sink), ["tier-cost-ledger"], "the refusal names the sink that lost the sample");
  assert.match(String(failures[0].error.message), /no tier-cost@2 block/, "and carries the refusal's own reason");
  assert.equal(good.length, 1, "the destination that could write still received the sample");
});

test("a reporter that throws itself costs no other sink its sample", () => {
  const clock = clockAt(0);
  const good = [];
  const telemetry = createSessionTelemetry({
    enabled: true,
    unit: "690-telemetry-attr",
    sinks: [
      { name: "broken", write: () => { throw new Error("publisher down"); } },
      { name: "recording", write: (sample) => good.push(sample) },
    ],
    onSinkError: () => {
      throw new Error("the report channel is down too");
    },
    now: clock.now,
    date: () => DATE,
  });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });

  assert.equal(telemetry.flush().unit, "690-telemetry-attr", "the emission still answers the sample it took");
  assert.equal(good.length, 1, "one broken destination, one broken reporter — the healthy sink is untouched");
});

test("every refusing sink is reported, once per sink, and none is invented", () => {
  const clock = clockAt(0);
  const failures = [];
  const written = [];
  const telemetry = createSessionTelemetry({
    enabled: true,
    unit: "690-telemetry-attr",
    sinks: [
      { name: "first", write: () => { throw new Error("refused"); } },
      { name: "recording", write: (sample) => written.push(sample) },
      { name: "second", write: () => { throw new Error("refused too"); } },
    ],
    onSinkError: (failure) => failures.push(failure.sink),
    now: clock.now,
    date: () => DATE,
  });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  telemetry.flush();

  assert.deepEqual(failures, ["first", "second"], "one report per refusing sink, in declaration order");
  assert.equal(written.length, 1, "a sink that wrote is never reported");
});

test("the sample is content-free: a unit id and numbers, nothing a model said", () => {
  const { telemetry } = accumulator();
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10, input: 4, output: 6 } } });
  const sample = telemetry.flush();
  assert.deepEqual(Object.keys(sample).sort(), [
    "cache_read_tokens", "cache_write_tokens", "changed_paths", "input_tokens", "model",
    "model_ms", "observed", "output_tokens", "phase", "reasoning_tokens", "source",
    "tokens", "tool_ms", "turns", "unit", "version",
  ]);
  for (const [key, value] of Object.entries(sample)) {
    if (["unit", "observed", "source", "phase", "version", "model"].includes(key)) {
      assert.ok(value === null || typeof value === "string", `${key} is a string or an unnamed value`);
      continue;
    }
    assert.equal(typeof value, "number", `${key} is a number`);
  }
  assert.match(sample.observed, /^\d{4}-\d{2}-\d{2}$/);
});

test("the path count is taken when the sample is written, not when the accumulator was built", () => {
  let touched = 0;
  const { telemetry } = accumulator({ changedPaths: () => touched });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  touched = 13; // the work happened after the accumulator existed, which is the normal case
  assert.equal(telemetry.flush().changed_paths, 13, "a snapshot taken at build time would report 0 for every session's own work");
});

test("the provenance string is resolved at emit time, so one builder can name each session", () => {
  let session = "s-1";
  const written = [];
  const telemetry = createSessionTelemetry({
    enabled: true,
    unit: "383-measured-acceptance",
    changedPaths: 0,
    sinks: [{ name: "recording", write: (sample) => written.push(sample) }],
    now: () => 0,
    date: () => DATE,
    source: () => `pi:session=${session}`,
  });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  assert.equal(telemetry.flush().source, "pi:session=s-1");
  assert.equal(written[0].source, "pi:session=s-1");
  session = "s-2";
  assert.equal(written[0].source, "pi:session=s-1", "the sample already emitted is not re-read");
});

test("a unit is resolved from the command invocation, deterministically, or not at all", () => {
  const root = tempRoot("telemetry-unit-");
  fs.mkdirSync(path.join(root, "docs/fix/383-measured-acceptance"), { recursive: true });
  fs.mkdirSync(path.join(root, "docs/features/12-a-feature"), { recursive: true });

  assert.equal(unitFromCommand(root, "execute-phase", ["383", "P2"]), "383-measured-acceptance");
  assert.equal(unitFromCommand(root, "execute-phase", ["383-measured-acceptance"]), "383-measured-acceptance");
  assert.equal(unitFromCommand(root, "unit-lane", ["from-issue", "12"]), "12-a-feature");
  assert.equal(unitFromCommand(root, "execute-phase", ["999"]), null, "an issue with no unit dir invents nothing");
  assert.equal(unitFromCommand(root, "log-session", ["383"]), null, "only unit-scoped commands name a unit");
  assert.equal(unitFromCommand(root, "execute-phase", ["--fix"]), null);
});

// --- the breakdown (#504 S1) -----------------------------------------------
//
// #383 collapsed every provider field into `tokens`. These cases pin the
// widening: the total stays what it always was and each provider field is
// carried beside it, so a cost regression can be attributed to what actually
// grew (output against input, cache against uncached, reasoning).

test("the provider's five fields are carried beside the total, never instead of it", () => {
  const { telemetry } = accumulator();
  telemetry.onTurnEnd({ message: { usage: { input: 800, output: 300, cacheRead: 250, cacheWrite: 100, reasoning: 50 } } });
  const sample = telemetry.flush();
  assert.equal(sample.input_tokens, 800);
  assert.equal(sample.output_tokens, 300);
  assert.equal(sample.cache_read_tokens, 250);
  assert.equal(sample.cache_write_tokens, 100);
  assert.equal(sample.reasoning_tokens, 50);
  assert.equal(sample.tokens, 1_500, "the total is the parts' sum when the provider names no total");
});

test("the breakdown accumulates across turns, like the total it belongs to", () => {
  const { telemetry } = accumulator();
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 100, input: 60, output: 40 } } });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 300, input: 100, output: 200, cacheRead: 7 } } });
  const sample = telemetry.flush();
  assert.equal(sample.tokens, 400, "the provider's own total wins when it names one");
  assert.equal(sample.input_tokens, 160);
  assert.equal(sample.output_tokens, 240);
  assert.equal(sample.cache_read_tokens, 7);
  assert.equal(sample.cache_write_tokens, 0, "a field no turn carried stays a zero, never absent");
  assert.equal(sample.reasoning_tokens, 0);
});

test("a turn with no usage at all leaves every count at zero — absence, never an estimate", () => {
  const { telemetry } = accumulator();
  telemetry.onTurnEnd({ message: {} });
  telemetry.onTurnEnd({});
  const sample = telemetry.flush();
  assert.equal(sample.tokens, 0);
  assert.equal(sample.input_tokens, 0);
  assert.equal(sample.output_tokens, 0);
  assert.equal(sample.turns, 2, "the turns still counted: the session turned twice and spent nothing measured");
});

// --- the phase (#504 S1/S2) -------------------------------------------------

test("a phase is the dispatched command's own name, and only a registered label is one", () => {
  assert.equal(phaseFromCommand("execute-phase"), "execute-phase");
  assert.equal(phaseFromCommand("review-change"), "review-change");
  assert.equal(phaseFromCommand("aw-settings"), "aw-settings", "a native command has a label too");
  assert.equal(phaseFromCommand("log-session-typo"), null, "an unregistered name is no phase, never a guess");
  assert.equal(phaseFromCommand(""), null);
});

test("the sample names its phase, and leaves it unnamed when the caller gave none", () => {
  const { telemetry } = accumulator({ phase: "execute-phase" });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  assert.equal(telemetry.flush().phase, "execute-phase");

  const plain = accumulator();
  plain.telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  assert.equal(plain.telemetry.flush().phase, null, "a sample built without a phase says so instead of inventing one");
});

// --- the version (#504 S1) --------------------------------------------------

test("the version is the package's own, read at emit time, never a literal", () => {
  const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const { telemetry } = accumulator({ version: undefined });
  telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  assert.equal(telemetry.flush().version, manifest.version, "the sample names the package that produced it");

  const injected = accumulator({ version: "9.9.9" });
  injected.telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  assert.equal(injected.telemetry.flush().version, "9.9.9", "the suite can own the value, like the clock");
});

// --- the model (#504 S5, D1) ------------------------------------------------

test("the model is the one that served the most turns, first seen on a tie", () => {
  const { telemetry } = accumulator();
  telemetry.onTurnEnd({ message: { model: "glm5.3-flash", usage: { totalTokens: 10 } } });
  telemetry.onTurnEnd({ message: { model: "deepseek-v4-flash", usage: { totalTokens: 10 } } });
  telemetry.onTurnEnd({ message: { model: "deepseek-v4-flash", usage: { totalTokens: 10 } } });
  assert.equal(telemetry.flush().model, "deepseek-v4-flash", "two turns against one: the majority names the sample");

  const tie = accumulator();
  tie.telemetry.onTurnEnd({ message: { model: "first", usage: { totalTokens: 10 } } });
  tie.telemetry.onTurnEnd({ message: { model: "second", usage: { totalTokens: 10 } } });
  assert.equal(tie.telemetry.flush().model, "first", "a tie resolves deterministically to the first model seen");

  const unnamed = accumulator();
  unnamed.telemetry.onTurnEnd({ message: { usage: { totalTokens: 10 } } });
  assert.equal(unnamed.telemetry.flush().model, null, "a turn that named no model gets no invented one");
});
