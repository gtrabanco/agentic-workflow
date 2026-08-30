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
