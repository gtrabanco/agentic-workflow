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

// --- F1/F2 fold: Pi re-derives the thinking level inside `setModel`, so a route
// that names only a model still moves it. These were written against Pi's source
// (`agent-session.js`: `_getThinkingLevelForModelSwitch` → `setThinkingLevel`) and
// the session double now mirrors that side effect.

test("AC8: a route that only names a model still puts the thinking level back", async () => {
  const session = createSession({
    config: configFor({ commands: { "design-feature": { model: "openai/gpt-5.2" } } }),
    models: AVAILABLE,
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "high",
    // Switching to gpt-5.2 moves the level, exactly like Pi's per-model default.
    modelThinking: { "openai/gpt-5.2": "medium" },
  });

  await session.dispatch(COMMAND, "x");
  assert.equal(session.state.thinking, "medium", "the double reproduces Pi's side effect");

  await session.settle();
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5");
  assert.equal(session.state.thinking, "high", "restoring the model is not restoring the session");
});

test("AC7/AC8: settle applies the model first and the thinking level last", async () => {
  const session = createSession({
    config: configFor({ commands: { "design-feature": { model: "openai/gpt-5.2", thinking: "max" } } }),
    models: AVAILABLE,
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "low",
    defaultThinking: "minimal",
  });

  await session.dispatch(COMMAND, "x");
  session.log.sequence.length = 0;
  await session.settle();

  const restore = session.log.sequence.filter((entry) => entry.startsWith("setModel:") || entry.startsWith("setThinkingLevel:"));
  // The middle entry is Pi's side effect, not ours: restoring the model
  // re-derived thinking to the global default. The snapshot level going LAST is
  // what makes the session equal its start, and it is the only thing that can.
  assert.deepEqual(
    restore,
    ["setModel:anthropic/claude-opus-4-5", "setThinkingLevel:minimal", "setThinkingLevel:low"],
    "model first, then the level the switch moved, then the snapshot level last",
  );
  assert.equal(session.state.thinking, "low");
});

test("AC7: a late `model_select` carrying the model we applied is still our own switch", async () => {
  const session = routedSession();
  await session.dispatch(COMMAND, "x");

  // Pi emits the event inside `setModel`, but a queued duplicate can land after
  // the turn is registered; treating it as the operator's would skip the restore.
  session.router.noteModelSelect({ provider: "openai", id: "gpt-5.2" });
  await session.settle();

  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5");
  assert.deepEqual(session.notifications().filter((m) => /leaving the model you chose/iu.test(m)), []);
});

test("AC7: a late `thinking_level_select` for the level our own switch derived is not an operator change", async () => {
  const session = createSession({
    config: configFor({ commands: { "design-feature": { model: "openai/gpt-5.2" } } }),
    models: AVAILABLE,
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "high",
    modelThinking: { "openai/gpt-5.2": "medium" },
  });

  await session.dispatch(COMMAND, "x");
  assert.equal(session.state.thinking, "medium");

  // Pi applies the derived level inside `setModel`, before this turn is even
  // registered; a duplicate landing afterwards must not be read as the operator
  // having chosen it, or AC8's restore would be skipped.
  session.router.noteThinkingLevelSelect("medium");
  await session.settle();

  assert.equal(session.state.thinking, "high", "our own derived level is not the operator's choice");
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5");
});

test("AC7: when the operator moves only the thinking level, the model comes back and their level stays", async () => {
  const session = createSession({
    config: configFor({ commands: { "design-feature": { model: "openai/gpt-5.2", thinking: "max" } } }),
    models: AVAILABLE,
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "low",
  });

  await session.dispatch(COMMAND, "x");
  session.operatorSelectsThinkingLevel("xhigh");
  await session.settle();

  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5", "the model is restored");
  assert.equal(session.state.thinking, "xhigh", "the level they picked is not overwritten by the model restore");
});

// --- Pass-2 fold: N-3, Pi clamps a level the model cannot run, and announces the
// *effective* one a microtask later. Recording what we *asked for* made that
// announcement look like an operator move, so the restore preserved the clamp
// instead of putting the operator's level back.

test("AC8: a clamped thinking level is still the router's own write, not an operator move", async () => {
  const session = createSession({
    config: configFor({ default: { model: "openai/gpt-5.2", thinking: "max" } }),
    models: { "openai/gpt-5.2": true },
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "low",
    // The routed model cannot run `max`: Pi writes the clamped level and announces
    // *that* one. The session's own model can run `low`, so a correct restore has
    // somewhere to land.
    supportedThinking: { "openai/gpt-5.2": ["off", "low", "medium"] },
  });

  await session.dispatch(COMMAND, "x");
  assert.equal(session.state.thinking, "medium", "Pi clamped what we asked for");

  await session.settle();
  assert.equal(session.state.thinking, "low", "the operator's level comes back; the clamp was our own write");
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5");
});

test("AC8: an operator who really did move the level still wins over a clamped route", async () => {
  const session = createSession({
    config: configFor({ default: { model: "openai/gpt-5.2", thinking: "max" } }),
    models: { "openai/gpt-5.2": true },
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "off",
    supportedThinking: { "openai/gpt-5.2": ["off", "low", "medium"] },
  });

  await session.dispatch(COMMAND, "x");
  // Deliberately not `medium`: the level the clamp left behind is indistinguishable
  // from our own write, so an operator who re-selected it is not a change we can see.
  session.operatorSelectsThinkingLevel("low");
  await session.settle();

  assert.equal(session.state.thinking, "low", "their choice, not our clamped write and not the pre-turn level");
});

test("AC8: a routed turn that never settles has an operator release, and it restores like a settle", async () => {
  // Pi starts a routed turn inside an action that swallows failures, and `prompt()`
  // can throw before the loop runs (compaction in progress, no model, no
  // credentials) — so `agent_settled` is not guaranteed to arrive. `isIdle()` cannot
  // stand in for that proof (the test above "in-flight wins over an idle-looking
  // session" is why), so the latch is released by the operator, through the console.
  const session = routedSession();
  await session.dispatch(COMMAND, "x");
  assert.equal(session.router.inFlight(), true, "the router owns the latch the console offers to release");

  session.state.idle = true; // the turn never started: the session is quiet again
  const blocked = await session.dispatch(COMMAND, "");
  assert.equal(blocked.status, "refused", "idleness alone does not release it — the operator does");

  assert.equal(await session.router.undoInFlight(session.ctx), true);
  assert.equal(session.router.inFlight(), false);
  assert.equal(session.state.thinking, "low", "the abandoned turn's level was put back");
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5", "and its model");

  const second = await session.dispatch(COMMAND, "");
  assert.equal(second.status, "dispatched", "the next command runs instead of refusing forever");

  assert.equal(await session.settle().then(() => session.router.undoInFlight(session.ctx)), false, "nothing to undo once it settled");
});

test("AC12: the in-flight refusal names the way out", async () => {
  const session = routedSession();
  await session.dispatch(COMMAND, "x");
  const second = await session.dispatch(COMMAND, "");
  assert.equal(second.status, "refused");
  assert.match(second.message, /undo it with \/agentic-workflow-settings/u);
});
