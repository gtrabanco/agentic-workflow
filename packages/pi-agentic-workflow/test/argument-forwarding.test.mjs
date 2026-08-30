// argument-forwarding.test.mjs — AC4 (SPEC S3)
//
// The alias must behave exactly like typing the skill command itself: the
// argument string reaches `/skill:<name>` whole, in order, with nothing added,
// lowercased, split, or re-joined. The invocation form comes from Pi's own skill
// commands (`/skill:name args`, docs/skills.md) expanded via
// `sendUserMessage(..., { expandPromptTemplates: true })`.

import { test } from "node:test";
import assert from "node:assert/strict";

import { createSession, configFor } from "./helpers/session.mjs";

const dispatchCase = async (args) => {
  const session = createSession();
  const outcome = await session.dispatch({ name: "plan-feature", skill: "plan-feature" }, args);
  assert.equal(outcome.status, "dispatched");
  return session.log.sendUserMessage;
};

test("AC4: /plan-feature 27-pi-agentic-workflow forwards the skill and its argument verbatim", async () => {
  const sent = await dispatchCase("27-pi-agentic-workflow");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].content, "/skill:plan-feature 27-pi-agentic-workflow");
  assert.equal(sent[0].opts.expandPromptTemplates, true, "the skill body must be expanded, not quoted back");
});

test("AC4: argument tokens keep their order and content", async () => {
  const sent = await dispatchCase("--from-issue 146 --scaffold");
  assert.equal(sent[0].content, "/skill:plan-feature --from-issue 146 --scaffold");
  assert.equal(sent[0].content.split(" ").slice(1).join(" "), "--from-issue 146 --scaffold");
});

test("AC4: a quoted argument with spaces survives intact", async () => {
  const args = 'fix "roadmap numbering collision" now';
  const sent = await dispatchCase(args);
  assert.equal(sent[0].content, `/skill:plan-feature ${args}`);
});

test("AC4: internal spacing is the operator's, not ours to normalise", async () => {
  const sent = await dispatchCase("27-pi-agentic-workflow   --fix");
  assert.equal(sent[0].content, "/skill:plan-feature 27-pi-agentic-workflow   --fix");
});

test("AC4: no arguments dispatches the bare skill command", async () => {
  const sent = await dispatchCase("");
  assert.equal(sent[0].content, "/skill:plan-feature");
});

test("AC4: the routed model is applied before the skill is dispatched", async () => {
  const session = createSession({
    config: configFor({ commands: { "plan-feature": { model: "openai/gpt-5.2", thinking: "high" } } }),
    models: { "openai/gpt-5.2": { auth: true } },
  });

  const outcome = await session.dispatch({ name: "plan-feature", skill: "plan-feature" }, "27-pi-agentic-workflow");
  assert.equal(outcome.status, "dispatched");
  assert.deepEqual(session.log.setModel, ["openai/gpt-5.2"]);
  assert.deepEqual(session.log.setThinkingLevel, ["high"]);
  assert.equal(session.log.sendUserMessage[0].content, "/skill:plan-feature 27-pi-agentic-workflow");
});
