// stateflow-dispatch.test.mjs — issue #174: the router's state-flow consult.
//
// The router consults the lifecycle once per dispatch, after its own guards
// pass and before the skill prompt is sent; a `"refuse-missing"` outcome is a
// total refusal (no send, no model change — the AC12 shape); a
// `"noop-missing"` warning is said once; and a `"none"` outcome leaves the
// dispatch exactly as it was. The lifecycle here is a mock — its own rules are
// stateflow-lifecycle.test.mjs's, and the shipped binding is the adapter
// suite's. Written red-first (issue #174 P3).

import { test } from "node:test";
import assert from "node:assert/strict";

import { createSession, configFor } from "./helpers/session.mjs";

const COMMAND = { name: "execute-phase", skill: "execute-phase" };
const OTHER = { name: "design-feature", skill: "design-feature" };

/** A mock lifecycle recording the consults and scripting the outcomes. */
function mockLifecycle(outcomeFor = () => ({ status: "none" })) {
  const calls = { start: [], settle: [] };
  return {
    calls,
    start(command, config) {
      calls.start.push({ command, config });
      return outcomeFor(command, config);
    },
    settle(aborted) {
      calls.settle.push(aborted);
      return calls.start.length > 0;
    },
    ownsEpisode: () => false,
  };
}

const enabledStateFlow = {
  enabled: true,
  backend: "pi-state-flow",
  commands: ["execute-phase", "fold-findings"],
  stopOn: "command_settled",
  onBackendMissing: "noop",
};

function sessionWith(lifecycle, configExtra = {}) {
  return createSession({
    config: configFor({ ...configExtra, stateFlow: enabledStateFlow }),
    stateFlow: lifecycle,
  });
}

test("the router consults the lifecycle with the command name and the loaded stateFlow config", async () => {
  const lifecycle = mockLifecycle();
  const session = sessionWith(lifecycle);
  const outcome = await session.dispatch(COMMAND, "P1");
  assert.equal(outcome.status, "dispatched");
  assert.equal(lifecycle.calls.start.length, 1);
  assert.equal(lifecycle.calls.start[0].command, "execute-phase");
  assert.deepEqual(lifecycle.calls.start[0].config, enabledStateFlow);
});

test("a started episode does not disturb the dispatch: the skill prompt is still sent", async () => {
  const lifecycle = mockLifecycle(() => ({ status: "started" }));
  const session = sessionWith(lifecycle);
  const outcome = await session.dispatch(COMMAND, "P1");
  assert.equal(outcome.status, "dispatched");
  assert.deepEqual(
    session.log.sendUserMessage.map((send) => send.content),
    ["/skill:execute-phase P1"],
  );
  assert.deepEqual(session.log.setModel, [], "no model change unless a route says so");
});

test("a refuse-missing lifecycle outcome is a total refusal with the state-flow reason", async () => {
  const lifecycle = mockLifecycle(() => ({ status: "refuse-missing" }));
  const session = sessionWith(lifecycle);
  const outcome = await session.dispatch(COMMAND, "P1");
  assert.equal(outcome.status, "refused");
  assert.equal(outcome.reason, "state-flow-backend-missing");
  assert.match(outcome.message, /pi-state-flow/u);
  assert.match(outcome.message, /onBackendMissing/u);
  assert.deepEqual(session.log.sendUserMessage, [], "no skill expansion was sent");
  assert.deepEqual(session.log.setModel, []);
  assert.deepEqual(session.log.setThinkingLevel, []);
});

test("a noop-missing outcome with warn=true warns once and the command still runs", async () => {
  let call = 0;
  const lifecycle = mockLifecycle(() => (++call === 1 ? { status: "noop-missing", warn: true } : { status: "noop-missing", warn: false }));
  const session = sessionWith(lifecycle);
  const first = await session.dispatch(COMMAND, "P1");
  assert.equal(first.status, "dispatched");
  const second = await session.dispatch(COMMAND, "P2");
  assert.equal(second.status, "dispatched");
  const warnings = session.log.notify.filter((entry) => entry.kind === "warning");
  assert.equal(warnings.length, 1, `exactly one warning: ${JSON.stringify(session.log.notify)}`);
  assert.match(warnings[0].message, /pi-state-flow/u);
  assert.match(warnings[0].message, /once/u);
});

test("a noop-missing outcome with warn=false is silent", async () => {
  const lifecycle = mockLifecycle(() => ({ status: "noop-missing", warn: false }));
  const session = sessionWith(lifecycle);
  await session.dispatch(COMMAND, "P1");
  assert.deepEqual(session.log.notify, []);
});

test("a restarted outcome does not disturb the dispatch either", async () => {
  const lifecycle = mockLifecycle(() => ({ status: "restarted" }));
  const session = sessionWith(lifecycle);
  const outcome = await session.dispatch(COMMAND, "P2");
  assert.equal(outcome.status, "dispatched");
  assert.deepEqual(session.log.sendUserMessage.map((send) => send.content), ["/skill:execute-phase P2"]);
});

test("a dispatch whose send fails clears the episode it just started", async () => {
  const lifecycle = mockLifecycle(() => ({ status: "started" }));
  const session = createSession({
    config: configFor({ stateFlow: enabledStateFlow }),
    stateFlow: lifecycle,
    sendThrows: true,
  });
  const outcome = await session.dispatch(COMMAND, "P1");
  assert.equal(outcome.status, "refused");
  assert.equal(outcome.reason, "dispatch-failed");
  assert.deepEqual(lifecycle.calls.settle, [true], "the never-started turn still clears the episode");
});

test("the lifecycle is consulted for every command — it owns the allowlist gate", async () => {
  const lifecycle = mockLifecycle();
  const session = sessionWith(lifecycle);
  await session.dispatch(OTHER, "");
  assert.equal(lifecycle.calls.start.length, 1, "consulted (and the mock returns none)");
  assert.equal(lifecycle.calls.start[0].command, "design-feature");
  assert.deepEqual(session.log.sendUserMessage.map((send) => send.content), ["/skill:design-feature"]);
});
