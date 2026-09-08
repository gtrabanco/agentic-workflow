// unavailable-stop.test.mjs — AC9 (SPEC S8, D-P13)
//
// A configured model the session cannot actually use is the dangerous case: if
// it silently fell back, the operator would believe the strong model ran. The
// default is therefore `stop` — refuse before touching anything — and the
// message has to name the command, the route, and where to fix it.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createSession, configFor } from "./helpers/session.mjs";

const COMMAND = { name: "review-change", skill: "review-change" };
const MISSING = { commands: { "review-change": { model: "anthropic/claude-opus-4-5" } } };

const withRoute = (policy) =>
  configFor({ ...MISSING, ...(policy ? { onUnavailableRoute: policy } : {}) });

test("AC9: an unknown model stops by default, naming command, route, and the settings command", async () => {
  const session = createSession({ config: withRoute() });

  const outcome = await session.dispatch(COMMAND, "the diff");
  assert.equal(outcome.status, "refused");
  assert.equal(outcome.reason, "unavailable-route");
  assert.match(outcome.message, /\/review-change/u);
  assert.match(outcome.message, /anthropic\/claude-opus-4-5/u);
  assert.match(outcome.message, /\/agentic-workflow-settings/u);
  assert.match(outcome.message, /not in the model registry/u);

  assert.deepEqual(session.log.sendUserMessage, [], "nothing was dispatched");
  assert.deepEqual(session.log.setModel, []);
  assert.deepEqual(session.log.setThinkingLevel, []);
  assert.equal(session.state.thinking, "medium", "the session is untouched");
  assert.ok(session.log.notify.some((entry) => entry.kind === "error"), "the operator was told, as an error");
});

test("AC9: a known model without credentials stops too", async () => {
  const session = createSession({
    config: withRoute(),
    models: { "anthropic/claude-opus-4-5": { auth: false } },
  });

  const outcome = await session.dispatch(COMMAND, "x");
  assert.equal(outcome.status, "refused");
  assert.match(outcome.message, /no configured credentials/u);
  assert.deepEqual(session.log.setModel, []);
  assert.deepEqual(session.log.sendUserMessage, []);
});

test("AC9: a model that fails to be selected stops as well", async () => {
  const session = createSession({
    config: configFor({ commands: { "review-change": { model: "anthropic/claude-opus-4-5", thinking: "high" } } }),
    models: { "anthropic/claude-opus-4-5": { auth: true } },
    selectFails: true,
  });

  const outcome = await session.dispatch(COMMAND, "x");
  assert.equal(outcome.status, "refused");
  assert.equal(outcome.reason, "unavailable-route");
  assert.match(outcome.message, /could not be selected/u);
  assert.deepEqual(session.log.sendUserMessage, []);
  assert.deepEqual(session.log.setThinkingLevel, [], "the thinking level is not applied for a route that never ran");
});

test("AC9: onUnavailableRoute `inherit` dispatches on the session model instead", async () => {
  const session = createSession({
    config: withRoute("inherit"),
    initialModel: "openai/gpt-5.2",
  });

  const outcome = await session.dispatch(COMMAND, "x");
  assert.equal(outcome.status, "dispatched");
  assert.equal(outcome.routed, false, "the turn ran on the model the session already had");
  assert.deepEqual(session.log.setModel, []);
  assert.deepEqual(session.log.sendUserMessage.map((entry) => entry.content), ["/skill:review-change x"]);
  assert.ok(
    session.notifications().some((message) => /runs on the current session model/u.test(message)),
    "the fallback is announced, not silent",
  );
});

test("AC9: `inherit` still reports the unavailable route", async () => {
  const session = createSession({ config: withRoute("inherit"), models: { "anthropic/claude-opus-4-5": { auth: false } } });
  await session.dispatch(COMMAND, "x");
  const note = session.notifications().find((message) => message.includes("anthropic/claude-opus-4-5"));
  assert.ok(note, "the operator learns which route was unavailable");
  assert.match(note, /no configured credentials/u);
  assert.match(note, /\/agentic-workflow-settings/u);
});

test("AC9: an explicit `inherit` route never fails closed on availability", async () => {
  const session = createSession({
    config: configFor({ commands: { "review-change": { model: "inherit", thinking: "inherit" } } }),
    // No models scripted at all: there is nothing to look up, and nothing to check.
    models: {},
  });

  const outcome = await session.dispatch(COMMAND, "x");
  assert.equal(outcome.status, "dispatched");
  assert.equal(outcome.routed, false);
});

test("AC9: a thinking-only route is not an availability problem", async () => {
  const session = createSession({
    config: configFor({ commands: { "review-change": { thinking: "high" } } }),
    models: {},
  });

  const outcome = await session.dispatch(COMMAND, "x");
  assert.equal(outcome.status, "dispatched");
  assert.equal(outcome.routed, true);
  assert.deepEqual(session.log.setModel, []);
  assert.deepEqual(session.log.setThinkingLevel, ["high"]);
});

test("AC9: a failed selection under the inherit policy dispatches on the session model", async () => {
  // The blocker paths (`not in registry`, `no credentials`) and the select path
  // meet different branches; only the select path has its own inherit notify.
  const session = createSession({
    config: configFor({
      commands: { "review-change": { model: "anthropic/claude-opus-4-5" } },
      onUnavailableRoute: "inherit",
    }),
    models: { "anthropic/claude-opus-4-5": { auth: true } },
    initialModel: "openai/gpt-5.2",
    selectFails: true,
  });

  const outcome = await session.dispatch(COMMAND, "x");
  assert.equal(outcome.status, "dispatched", "inherit means the command still runs");
  assert.equal(outcome.routed, false, "nothing was applied, so nothing needs restoring");
  assert.deepEqual(session.log.sendUserMessage.map((entry) => entry.content), ["/skill:review-change x"]);
  assert.ok(
    session.notifications().some((message) => /could not be selected, so it runs on the current session model/u.test(message)),
    `the failed select is announced: ${JSON.stringify(session.notifications())}`,
  );
  assert.ok(session.notifications().some((message) => /\/agentic-workflow-settings/u.test(message)));
});

// --- AC7/OB-8/OB-9/OB-10: ordered model fallback chain (issue #154, root cause E) ---
// `model` may be an ordered chain; dispatch probes in order with only
// ctx.find + hasConfiguredAuth (no session mutation) and applies the first
// usable entry. An exhausted chain refuses (stop) or runs the session model
// (inherit), naming every candidate and why it was skipped.

const CHAIN = { name: "review-change", skill: "review-change" };

test("AC7/OB-8: a chain applies its first resolving + authed entry exactly once", async () => {
  const session = createSession({
    config: configFor({ commands: { "review-change": { model: ["good/m1", "a/m2"] } } }),
    models: { "good/m1": { auth: true }, "a/m2": { auth: true } },
  });

  const outcome = await session.dispatch(CHAIN, "x");
  assert.equal(outcome.status, "dispatched");
  assert.equal(outcome.routed, true);
  assert.deepEqual(session.log.setModel, ["good/m1"], "exactly the first usable entry, one call");
  assert.deepEqual(session.log.sendUserMessage.map((entry) => entry.content), ["/skill:review-change x"]);
});

test("AC7/OB-8: a chain skips a no-auth entry and applies the next usable one", async () => {
  const session = createSession({
    config: configFor({ commands: { "review-change": { model: ["noauth/m1", "good/m2"] } } }),
    models: { "noauth/m1": { auth: false }, "good/m2": { auth: true } },
  });

  const outcome = await session.dispatch(CHAIN, "x");
  assert.equal(outcome.status, "dispatched");
  assert.deepEqual(session.log.setModel, ["good/m2"], "the first usable entry wins");
});

test("AC7/OB-8: a chain swallows an unknown first entry and applies the next", async () => {
  const session = createSession({
    config: configFor({ commands: { "review-change": { model: ["unknown/m1", "good/m2"] } } }),
    models: { "good/m2": { auth: true } },
  });

  const outcome = await session.dispatch(CHAIN, "x");
  assert.equal(outcome.status, "dispatched");
  assert.deepEqual(session.log.setModel, ["good/m2"]);
});

test("AC7/OB-9: an exhausted chain under stop refuses naming every candidate and reason", async () => {
  const session = createSession({
    config: configFor({ commands: { "review-change": { model: ["missing/m1", "noauth/m2"] } } }),
    models: { "noauth/m2": { auth: false } },
  });

  const outcome = await session.dispatch(CHAIN, "x");
  assert.equal(outcome.status, "refused");
  assert.equal(outcome.reason, "unavailable-route");
  assert.match(outcome.message, /missing\/m1/u);
  assert.match(outcome.message, /noauth\/m2/u);
  assert.match(outcome.message, /not in the model registry/u);
  assert.match(outcome.message, /no configured credentials/u);
  assert.match(outcome.message, /\/agentic-workflow-settings/u);
  assert.deepEqual(session.log.setModel, [], "probing never calls setModel");
  assert.deepEqual(session.log.sendUserMessage, []);
  assert.deepEqual(session.log.setThinkingLevel, []);
});

test("AC7/OB-9: an exhausted chain under inherit runs the session model, naming the skips", async () => {
  const session = createSession({
    config: configFor({
      commands: { "review-change": { model: ["missing/m1", "noauth/m2"] } },
      onUnavailableRoute: "inherit",
    }),
    models: { "noauth/m2": { auth: false } },
    initialModel: "openai/gpt-5.2",
  });

  const outcome = await session.dispatch(CHAIN, "x");
  assert.equal(outcome.status, "dispatched");
  assert.equal(outcome.routed, false);
  assert.deepEqual(session.log.setModel, [], "probing never calls setModel");
  assert.deepEqual(session.log.sendUserMessage.map((entry) => entry.content), ["/skill:review-change x"]);
  const note = session.notifications().find((message) => message.includes("missing/m1") && message.includes("noauth/m2"));
  assert.ok(note, `the explanation names both candidates: ${JSON.stringify(session.notifications())}`);
  assert.match(note, /no configured credentials/u);
  assert.match(note, /not in the model registry/u);
  assert.match(note, /\/agentic-workflow-settings/u);
});

test("AC7/OB-10: probing a chain never changes session state; setModel is exactly once in the applied case", async () => {
  const session = createSession({
    config: configFor({ commands: { "review-change": { model: ["good/m1", "b/m2"] } } }),
    models: { "good/m1": { auth: true }, "b/m2": { auth: true } },
  });

  await session.dispatch(CHAIN, "x");
  assert.equal(session.log.setModel.length, 1, "setModel at most once per routed turn");
  assert.deepEqual(session.log.setModel, ["good/m1"]);
});

test("AC7/OB-10: a failed chain selection does not re-probe nor add a second setModel call", async () => {
  const session = createSession({
    config: configFor({ commands: { "review-change": { model: ["good/m1", "a/m2"] } } }),
    models: { "good/m1": { auth: true }, "a/m2": { auth: true } },
    selectFails: true,
  });

  const outcome = await session.dispatch(CHAIN, "x");
  assert.equal(outcome.status, "refused");
  assert.equal(outcome.reason, "unavailable-route");
  assert.deepEqual(session.log.setModel, ["good/m1"], "the single chosen entry, once — no fall-through");
  assert.deepEqual(session.log.sendUserMessage, []);
});
