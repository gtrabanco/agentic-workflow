// on-settle-keep.test.mjs — the `onSettle: "keep"` policy (shipped default)
//
// The default after a routed command is that the routed model and thinking level
// STAY in the open chat window, so a follow-up edit or question keeps running on
// the model that planned it. The operator changes it manually when they want
// something cheaper (e.g. qwen3.6 for a quick doubt).
//
// The restore-on-settle contract (AC8) is now an explicit opt-in; this suite pins
// the keep behavior that a fresh install ships with. Restore is covered by
// `restore-after-settle.test.mjs`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createSession, configFor } from "./helpers/session.mjs";

const COMMAND = { name: "design-feature", skill: "design-feature" };
const ROUTED = { "design-feature": { model: "openai/gpt-5.2", thinking: "max" } };
const AVAILABLE = { "openai/gpt-5.2": { auth: true } };

test("keep: the routed model and thinking level stay after the turn settles", async () => {
  const session = createSession({
    config: configFor({ commands: ROUTED }),
    models: AVAILABLE,
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "low",
  });

  const outcome = await session.dispatch(COMMAND, "x");
  assert.equal(outcome.status, "dispatched");
  assert.equal(outcome.routed, true);
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "openai/gpt-5.2");
  assert.equal(session.state.thinking, "max");

  await session.settle();

  // Nothing is put back: the window keeps the model that did the planning.
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "openai/gpt-5.2");
  assert.equal(session.state.thinking, "max");
  assert.deepEqual(session.log.setModel, ["openai/gpt-5.2"], "only the routed switch, no restore");
});

test("keep: a follow-up unrooted prompt stays on the routed model", async () => {
  // The operator's actual scenario: GLM plans, then they edit what it planned.
  // The session must still be on GLM so the edit keeps running on GLM.
  const session = createSession({
    config: configFor({ commands: ROUTED }),
    models: AVAILABLE,
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "low",
  });
  await session.dispatch(COMMAND, "x");
  await session.settle();

  // Simulate the operator now just asking a question — no route involved.
  const second = await session.dispatch({ name: "inherit-route", skill: "inherit-route" }, "edit the plan");
  // An unrouted command has no route and no entry in `ROUTED`; it maps to the
  // default route, which is the shipped `inherit` — so nothing is switched.
  assert.equal(second.status, "dispatched");
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "openai/gpt-5.2", "the follow-up ran on the same routed model");
});

test("keep: an operator mid-turn model change is left in place (nothing to restore)", async () => {
  const session = createSession({
    config: configFor({ commands: ROUTED }),
    models: AVAILABLE,
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "low",
  });
  await session.dispatch(COMMAND, "x");

  // Operator switches to their cheaper doubt model mid-turn.
  session.operatorSelectsModel("anthropic/claude-haiku-4-5");
  await session.settle();

  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-haiku-4-5");
  // No restore even under keep, and no "leaving the model you chose" notice either,
  // because keep never attempts to restore anything.
  assert.deepEqual(session.log.setModel, ["openai/gpt-5.2"]);
});

test("keep: a thinking-only route keeps the routed level", async () => {
  const session = createSession({
    config: configFor({ commands: { "design-feature": { thinking: "xhigh" } } }),
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "low",
  });

  await session.dispatch(COMMAND, "x");
  await session.settle();

  assert.equal(session.state.thinking, "xhigh", "the routed level stays");
  assert.deepEqual(session.log.setModel, [], "no model was ever routed");
});

test("keep: an inherit (unrouted) turn still settles as a no-op", async () => {
  const session = createSession({
    config: configFor({}),
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "low",
  });

  const outcome = await session.dispatch(COMMAND, "x");
  assert.equal(outcome.routed, false);
  await session.settle();
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5");
  assert.equal(session.state.thinking, "low");
  assert.deepEqual(session.log.setModel, []);
});

test("keep: a routed turn that changes nothing stays put after a dispatch whose send throws", async () => {
  // The rollback path is policy-independent: a failed send means the turn never
  // started, so the session is put back regardless of `onSettle`. This pins that
  // keep does not leak a model for a command that never ran.
  const session = createSession({
    config: configFor({ commands: ROUTED }),
    models: AVAILABLE,
    initialModel: "anthropic/claude-opus-4-5",
    initialThinking: "low",
    sendThrows: true,
  });

  const outcome = await session.dispatch(COMMAND, "x");
  assert.equal(outcome.status, "refused");
  assert.equal(outcome.reason, "dispatch-failed");
  assert.equal(`${session.state.model.provider}/${session.state.model.id}`, "anthropic/claude-opus-4-5");
  assert.equal(session.state.thinking, "low");
});
