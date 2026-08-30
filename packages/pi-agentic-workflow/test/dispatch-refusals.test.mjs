// dispatch-refusals.test.mjs — AC12 (SPEC S10, D-P15, D-E5)
//
// A refusal must be total: no skill expansion, no model change, no thinking
// change — the session is exactly as it was. That is the whole point of refusing
// instead of "best effort" routing.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createSession, configFor } from "./helpers/session.mjs";

const COMMAND = { name: "plan-feature", skill: "plan-feature" };

/** The `commands` block a routed session is configured with. */
const routedCommands = { "plan-feature": { model: "openai/gpt-5.2", thinking: "high" } };
const AVAILABLE = { "openai/gpt-5.2": { auth: true } };

/** Everything a refused dispatch must leave untouched. */
function assertUntouched(session) {
  assert.deepEqual(session.log.sendUserMessage, [], "no skill expansion was sent");
  assert.deepEqual(session.log.setModel, [], "no model was selected");
  assert.deepEqual(session.log.setThinkingLevel, [], "no thinking level was set");
}

test("AC12: a busy agent is refused before anything happens", async () => {
  const session = createSession({ config: configFor({ commands: routedCommands }), models: AVAILABLE, idle: false });
  const outcome = await session.dispatch(COMMAND, "27-pi-agentic-workflow", { isIdle: () => false });

  assert.equal(outcome.status, "refused");
  assert.equal(outcome.reason, "busy");
  assert.match(outcome.message, /busy/u);
  assert.match(outcome.message, /\/plan-feature/u);
  assertUntouched(session);
});

test("AC12: a second routed command is refused while the first turn is in flight", async () => {
  const session = createSession({ config: configFor({ commands: routedCommands }), models: AVAILABLE });

  const first = await session.dispatch(COMMAND, "one");
  assert.equal(first.status, "dispatched");
  assert.equal(first.routed, true);

  const second = await session.dispatch({ name: "execute-phase", skill: "execute-phase" }, "P3", { isIdle: () => true });
  assert.equal(second.status, "refused", "in-flight wins over an idle-looking session");
  assert.equal(second.reason, "routed-turn-in-flight");
  assert.match(second.message, /plan-feature is still routed/u);
  assert.equal(session.log.sendUserMessage.length, 1, "only the first turn was dispatched");
  assert.deepEqual(session.log.setModel, ["openai/gpt-5.2"], "the second command changed nothing");
});

test("AC12: an in-flight routed turn is cleared by settle, so commands run again", async () => {
  const session = createSession({ config: configFor({ commands: routedCommands }), models: AVAILABLE });

  await session.dispatch(COMMAND, "one");
  await session.settle();
  const again = await session.dispatch(COMMAND, "two", { isIdle: () => true });
  assert.equal(again.status, "dispatched");
});

test("AC12: a present-but-invalid config file refuses every dispatch with the offending path", async () => {
  const session = createSession({
    ok: false,
    problems: [
      { scope: "global", path: "$.commands.plan-featue", message: 'unknown config key "commands.plan-featue"' },
      { scope: "project", path: "$.default.thinking", message: "must be \"inherit\" or one of off, minimal, low, medium, high, xhigh, max" },
    ],
    config: configFor({ commands: routedCommands }),
    models: AVAILABLE,
  });

  const outcome = await session.dispatch(COMMAND, "27-pi-agentic-workflow");
  assert.equal(outcome.status, "refused");
  assert.equal(outcome.reason, "invalid-config");
  assert.match(outcome.message, /global config, \$\.commands\.plan-featue/u);
  assert.match(outcome.message, /project config, \$\.default\.thinking/u);
  assert.match(outcome.message, /nothing was dispatched/iu);
  assertUntouched(session);
});

test("AC12: refusal is decided per dispatch, so editing a broken file needs no restart", async () => {
  const broken = { ok: false, problems: [{ scope: "project", path: "$", message: "invalid JSON: unexpected end" }], config: configFor({}) };
  const fixed = { ok: true, problems: [], config: configFor({ commands: routedCommands }) };
  let loaded = broken;

  const session = createSession({ models: AVAILABLE, loadConfig: () => loaded });
  const refused = await session.dispatch(COMMAND, "one");
  assert.equal(refused.status, "refused");
  assert.equal(session.state.model.provider, "anthropic");

  loaded = fixed;
  const accepted = await session.dispatch(COMMAND, "two");
  assert.equal(accepted.status, "dispatched");
  assert.equal(session.state.model.provider, "openai", "the repaired route applies immediately");
});
