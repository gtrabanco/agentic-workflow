// restore-after-settle.test.mjs — AC7 (read-verified) + AC8 (SPEC S7, S14, D-P7, D-P14)
//
// The lifecycle contract has three parts, and the third is the one that bites in
// real use: snapshot before applying, apply before dispatching, and put it back
// on `agent_settled` — unless the operator changed the model during the routed
// turn, in which case their choice wins and nothing is restored.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createSession, configFor } from "./helpers/session.mjs";

const COMMAND = { name: "design-feature", skill: "design-feature" };
const ROUTED = { "design-feature": { model: "openai/gpt-5.2", thinking: "max" } };
const AVAILABLE = { "openai/gpt-5.2": { auth: true } };

/** A session with a known starting point, routed through `ROUTED`. */
function routedSession(options = {}) {
  return createSession({
    config: configFor({ commands: ROUTED }),
    models: AVAILABLE,
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "low",
    ...options,
  });
}

test("AC7: the route is applied before the skill is dispatched, in Pi's order", async () => {
  const session = routedSession();
  const outcome = await session.dispatch(COMMAND, "27-pi-agentic-workflow");
  assert.equal(outcome.status, "dispatched");
  assert.equal(outcome.routed, true);

  assert.deepEqual(session.log.sequence, [
    "setModel:openai/gpt-5.2",
    "setThinkingLevel:max",
    "sendUserMessage:/skill:design-feature 27-pi-agentic-workflow",
  ]);
});

test("AC8: after settle, the session model id and thinking level equal the pre-dispatch snapshot", async () => {
  const session = routedSession();

  await session.dispatch(COMMAND, "x");
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "openai/gpt-5.2");
  assert.equal(session.state.thinking, "max", "the routed turn really did run on a different model");

  await session.settle();
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5");
  assert.equal(session.state.thinking, "low");
});

test("AC8: thinking is restored after the model, so a model switch cannot leave it moved", async () => {
  const session = routedSession();
  await session.dispatch(COMMAND, "x");
  session.log.setThinkingLevel.length = 0;

  await session.settle();
  assert.deepEqual(session.log.setThinkingLevel, ["low"], "only the snapshot level is applied, once");
});

test("AC7: an explicit inherit route never snapshots and never restores", async () => {
  const session = createSession({ initialModel: "anthropic/claude-opus-4-5", initialThinking: "low" });

  const outcome = await session.dispatch(COMMAND, "x");
  assert.equal(outcome.status, "dispatched");
  assert.equal(outcome.routed, false);
  assert.deepEqual(session.log.setModel, []);
  assert.deepEqual(session.log.setThinkingLevel, []);

  await session.settle();
  assert.equal(session.state.model.provider, "anthropic");
  assert.equal(session.state.thinking, "low");
});

test("AC7: a thinking-only route restores the level and never touches the model", async () => {
  const session = createSession({
    config: configFor({ commands: { "design-feature": { thinking: "xhigh" } } }),
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "low",
  });

  const outcome = await session.dispatch(COMMAND, "x");
  assert.equal(outcome.routed, true);
  assert.deepEqual(session.log.setModel, []);
  assert.equal(session.state.thinking, "xhigh");

  await session.settle();
  assert.equal(session.state.thinking, "low");
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5");
});

test("AC7: a model the operator selects during the routed turn is not overwritten", async () => {
  const session = routedSession();
  await session.dispatch(COMMAND, "x");

  session.operatorSelectsModel("anthropic/claude-haiku-4-5");
  await session.settle();

  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-haiku-4-5");
  assert.match(session.notifications().join("\n"), /leaving the model you chose/iu);
});

test("AC7: our own switch is not mistaken for the operator's", async () => {
  const session = routedSession();
  await session.dispatch(COMMAND, "x");
  // The double already replayed Pi's `model_select` for the routed switch above.
  await session.settle();
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5");
});

test("AC7: an operator thinking-level change survives the restore while the model does not", async () => {
  const session = routedSession();
  await session.dispatch(COMMAND, "x");

  session.operatorSelectsThinkingLevel("off");
  await session.settle();

  assert.equal(session.state.thinking, "off", "their level wins");
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5", "the routed model is still cleaned up");
});

test("AC7: settle without a routed turn is a no-op", async () => {
  const session = routedSession();
  await session.settle();
  assert.deepEqual(session.log.setModel, []);
  assert.deepEqual(session.log.setThinkingLevel, []);
  assert.deepEqual(session.log.notify, []);
});

test("AC7: two settled turns do not stack restores", async () => {
  const session = routedSession();
  await session.dispatch(COMMAND, "one");
  await session.settle();
  session.log.setModel.length = 0;

  await session.settle();
  assert.deepEqual(session.log.setModel, [], "the second settle has nothing left to restore");
});
