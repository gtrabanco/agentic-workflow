// flow-command.test.mjs — the two lane entries: `/flow` and `/draft` (issue #669)
//
// What this suite owns: the extension registers both names as first-class
// commands (no SKILL.md, no catalogue entry), `/draft` always sends
// `--stop-after plan` and drops `--yes`, the driver's halt is printed instead of
// dispatched, and a proceeding answer hands the driver's `next:` line to the
// router verbatim. The runner invocation is injected, so the suite owns argv,
// cwd and exit status.

import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

import { createExtension } from "../dist/extension/factory.js";
import { DRAFT_COMMAND, FLOW_COMMAND, driverArgs, parseDecision, registerFlowCommands } from "../dist/extension/flow-command.js";
import { ADVANCE_COMMAND, SETTINGS_COMMAND } from "../dist/routing/types.js";
import { modelRef } from "./helpers/session.mjs";

/** A registrar double that records every name Pi was handed. */
function recorder() {
  const registered = new Map();
  return {
    registered,
    registrar: { registerCommand: (name, options) => registered.set(name, options) },
  };
}

const CTX = {
  cwd: "/fixture/repo",
  model: modelRef("anthropic/claude-sonnet-4-5"),
  isIdle: () => true,
  isProjectTrusted: () => true,
  notify: () => {},
  find: () => undefined,
  hasConfiguredAuth: () => false,
};

/** The driver's printed block, as `agentic-workflow flow` writes it. */
const proceeding = [
  "FLOW — 901-flow-fixture",
  "unit: 901-flow-fixture",
  "unit-type: feature",
  "next-step: implement",
  "next: /execute-phase 901-flow-fixture P1 (tier: cheap)",
  "stop: none",
  "session: phase-per-turn",
].join("\n");

const halted = [
  "FLOW — 901-flow-fixture",
  "unit: 901-flow-fixture",
  "next-step: halt",
  "next: /flow 901-flow-fixture",
  "stop: after-plan (rule: tier-high)",
  "session: phase-per-turn",
  "",
  "APPROVAL — 901-flow-fixture",
  "unit: 901-flow-fixture",
  "plan: 2 phases — P1, P2",
  "continue: /flow 901-flow-fixture",
].join("\n");

/** One registered handler over an injected runner and dispatch. */
function harness({ status = 0, stdout = proceeding, stderr = "" } = {}) {
  const { registered, registrar } = recorder();
  const spawns = [];
  const dispatched = [];
  registerFlowCommands(registrar, {
    launch: async (args) => ({ source: "test", program: "bun", argv: ["bun", "agentic-workflow", ...args] }),
    run: (request) => {
      spawns.push(request);
      return { status, stdout, stderr };
    },
    dispatch: async (command) => {
      dispatched.push(command);
      return true;
    },
  });
  return { registered, spawns, dispatched };
}

test("the extension registers /flow and /draft beside the other native commands", () => {
  const { registered, registrar } = recorder();
  createExtension({
    registrar,
    surface: () => ({ sendUserMessage: () => {}, setModel: async () => true, getThinkingLevel: () => "medium", setThinkingLevel: () => {} }),
    skillsDir: resolve(import.meta.dirname, "..", "skills"),
    agentDir: "/fixture/agent",
    hint: { pending: () => false, acknowledge: () => true },
    settings: () => undefined,
  });
  assert.ok(registered.has(FLOW_COMMAND), "/flow is registered");
  assert.ok(registered.has(DRAFT_COMMAND), "/draft is registered");
  assert.ok(registered.has(ADVANCE_COMMAND), "the unattended conductor is still registered");
  assert.ok(registered.has(SETTINGS_COMMAND), "the settings console is still registered");
  assert.equal(FLOW_COMMAND, "flow");
  assert.equal(DRAFT_COMMAND, "draft");
});

test("the driver arguments: draft forces --stop-after plan and drops --yes", () => {
  assert.deepEqual(driverArgs("draft", "901-flow-fixture"), ["--stop-after", "plan", "901-flow-fixture"]);
  assert.deepEqual(driverArgs("draft", "901-flow-fixture --yes"), ["--stop-after", "plan", "901-flow-fixture"]);
  assert.deepEqual(driverArgs("draft", "901-flow-fixture --yes --retriage"), ["--stop-after", "plan", "901-flow-fixture", "--retriage"]);
  assert.deepEqual(driverArgs("flow", "901-flow-fixture --yes"), ["901-flow-fixture", "--yes"]);
  assert.deepEqual(driverArgs("flow", ""), []);
});

test("the decision parser reads the driver's block, not a paraphrase of it", () => {
  assert.deepEqual(parseDecision(proceeding), {
    next: "/execute-phase 901-flow-fixture P1 (tier: cheap)",
    nextStep: "implement",
    stop: "none",
    session: "phase-per-turn",
  });
  assert.deepEqual(parseDecision(halted).stop, "after-plan (rule: tier-high)");
  assert.equal(parseDecision(""), null, "an empty answer decides nothing");
});

test("a proceeding answer hands the driver's next line to the router verbatim", async () => {
  const { registered, spawns, dispatched } = harness();
  await registered.get(FLOW_COMMAND).handler("901-flow-fixture", CTX);
  assert.deepEqual(spawns[0].argv.slice(1), ["flow", "901-flow-fixture"], "the runner runs the flow subcommand for the unit");
  assert.deepEqual(dispatched, ["/execute-phase 901-flow-fixture P1 (tier: cheap)"]);
});

test("a halt prints the block and dispatches nothing", async () => {
  const notices = [];
  const { registered, dispatched } = harness({ stdout: halted });
  await registered.get(FLOW_COMMAND).handler("901-flow-fixture", { ...CTX, notify: (message, kind) => notices.push({ message, kind }) });
  assert.deepEqual(dispatched, [], "a stop is never dispatched past");
  assert.ok(notices.some((entry) => entry.message.includes("APPROVAL — 901-flow-fixture")), "the approval block is what the operator reads");
});

test("/draft never dispatches a step past the plan, whatever the driver answers", async () => {
  const { registered, dispatched } = harness({ stdout: proceeding });
  await registered.get(DRAFT_COMMAND).handler("901-flow-fixture", CTX);
  assert.deepEqual(dispatched, [], "an implement answer is not a draft's to run");
});

test("/draft dispatches the planning step it was handed", async () => {
  const planning = proceeding.replace("next-step: implement", "next-step: plan").replace("next: /execute-phase 901-flow-fixture P1 (tier: cheap)", "next: /unit-lane 901-flow-fixture");
  const { registered, spawns, dispatched } = harness({ stdout: planning });
  await registered.get(DRAFT_COMMAND).handler("901-flow-fixture", CTX);
  assert.deepEqual(spawns[0].argv.slice(1), ["flow", "--stop-after", "plan", "901-flow-fixture"], "the draft entry is the explicit stop");
  assert.deepEqual(dispatched, ["/unit-lane 901-flow-fixture"]);
});

test("a driver refusal is reported as an error and dispatches nothing", async () => {
  const notices = [];
  const { registered, dispatched } = harness({ status: 1, stdout: "", stderr: "FLOW REFUSAL — unknown unit: 999-nope\n" });
  await registered.get(FLOW_COMMAND).handler("999-nope", { ...CTX, notify: (message, kind) => notices.push({ message, kind }) });
  assert.deepEqual(dispatched, []);
  assert.ok(notices.some((entry) => entry.kind === "error" && entry.message.includes("FLOW REFUSAL — unknown unit")), "the refusal is surfaced verbatim");
});

// external-verify A2 (2026-11-28): the guard judges the operator's own tokens,
// so the draft's forced `--stop-after plan` can never mask a missing unit.
test("a door without a unit is refused by the door, before the runner runs", async () => {
  const cases = [
    [FLOW_COMMAND, ""],
    [DRAFT_COMMAND, ""],
    [DRAFT_COMMAND, "--yes"],
    [DRAFT_COMMAND, "--stop-after design"],
  ];
  for (const [entry, args] of cases) {
    const notices = [];
    const { registered, spawns, dispatched } = harness();
    await registered.get(entry).handler(args, { ...CTX, notify: (message, kind) => notices.push({ message, kind }) });
    assert.equal(spawns.length, 0, `no runner launch for /${entry} with '${args}' (got ${spawns.length})`);
    assert.deepEqual(dispatched, [], `nothing dispatched for /${entry} with '${args}'`);
    assert.ok(
      notices.some((entry) => entry.kind === "warning" && entry.message.includes("needs a unit")),
      `the door warns 'needs a unit' for /${entry} '${args}'`,
    );
  }
});
