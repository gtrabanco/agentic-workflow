// The Pi adapter — `src/extension/index.ts`, compiled to the file Pi loads.
//
// Everything else in this suite drives `createRouter` against a session double.
// That is the right split for the rules, and it left the unit's headline
// guarantees (AC7's operator guard, AC8's restore, AC13's trust gate) verified
// only *inside* the double: the end review deleted all three event listeners,
// hardcoded `projectTrusted: true` and `cwd: process.cwd()`, and passed an empty
// command list to the console — with the whole suite green.
//
// These tests call the shipped entry with a Pi-shaped API, fire the lifecycle it
// subscribes to, and assert what Pi would actually do.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { SETTINGS_COMMAND } from "../dist/routing/types.js";
import { readCatalogue } from "../dist/routing/catalogue.js";
import { prompts } from "../dist/settings/console.js";
import { createExtension } from "../dist/extension/factory.js";

const bundleSkills = join(import.meta.dirname, "..", "skills");

/** Let every already-started `settle()` run to completion. */
const flush = () => new Promise((resolve) => setImmediate(resolve));

/** A Pi-shaped API that records the handlers instead of registering them. */
function piDouble(options = {}) {
  const calls = { setModel: [], setThinkingLevel: [], sendUserMessage: [], notify: [] };
  // Stateful like a session: `setThinkingLevel` moves the level the router reads
  // back, so settle's "only write when it differs" guard is exercised too.
  const state = { thinking: options.thinking ?? "medium" };
  const handlers = new Map();
  const registered = new Map();
  const recorder = {
    registerCommand: (name, command) => registered.set(name, command),
  };
  const api = {
    registerCommand: (name, command) => {
      registered.set(name, { ...command, name });
      recorder.registerCommand(name, command);
    },
    sendUserMessage: (content, sendOptions) => calls.sendUserMessage.push([content, sendOptions]),
    setModel: async (model) => {
      calls.setModel.push(model);
      return options.rejectModelSwitch ? false : true;
    },
    getThinkingLevel: () => state.thinking,
    setThinkingLevel: (level) => {
      calls.setThinkingLevel.push(level);
      state.thinking = level;
    },
    on: (type, handler) => handlers.set(type, handler),
  };
  // Pi applies an operator's choice to the session and *then* emits the event, so
  // the doubles below do the same: mutate, then notify. Otherwise the router's
  // "only write when it differs" guard sees a session that never moved.
  const operatorSelectsThinking = (level) => {
    state.thinking = level;
    handlers.get("thinking_level_select")({ level });
  };
  const operatorSelectsModel = (model) => {
    state.model = model;
    handlers.get("model_select")({ model });
  };
  return { api, calls, handlers, registered, operatorSelectsThinking, operatorSelectsModel };
}

/**
 * One isolated extension instance: its own agent dir (where the global config and
 * the hint state live) and its own repo cwd (where `.pi/` would live), so the
 * adapter's real file reads are exercised without touching this machine's `~/.pi`.
 */
async function shippedEntry({ globalConfig, projectConfig, ...piOptions } = {}) {
  const root = mkdtempSync(join(tmpdir(), "paw-adapter-"));
  const agentDir = join(root, "agent");
  const cwd = join(root, "repo");
  mkdirSync(agentDir, { recursive: true });
  mkdirSync(cwd, { recursive: true });
  if (globalConfig) writeFileSync(join(agentDir, "pi-agentic-workflow.json"), JSON.stringify(globalConfig));
  if (projectConfig) {
    mkdirSync(join(cwd, ".pi"), { recursive: true });
    writeFileSync(join(cwd, ".pi", "pi-agentic-workflow.json"), JSON.stringify(projectConfig));
  }

  const double = piDouble(piOptions);
  const previous = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = agentDir;
  try {
    const { default: extension } = await import("../dist/extension/index.js");
    extension(double.api);
  } finally {
    if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previous;
  }

  /** The `ExtensionContext` Pi would hand a command handler or an event. */
  const context = (over = {}) => ({
    cwd,
    model: over.model ?? { provider: "anthropic", id: "claude-sonnet-4-5" },
    isIdle: () => over.isIdle ?? true,
    isProjectTrusted: () => over.trusted ?? true,
    ui: { notify: (message, kind) => double.calls.notify.push([message, kind]), select: () => undefined, input: () => undefined, confirm: () => undefined },
    modelRegistry: {
      find: (provider, modelId) =>
        provider === "openai" && modelId === "gpt-5.2" ? { provider: "openai", id: "gpt-5.2" } : undefined,
      hasConfiguredAuth: () => true,
      getAll: () => [{ provider: "openai", id: "gpt-5.2" }],
    },
    ...over.extra,
  });

  const cleanup = () => rmSync(root, { recursive: true, force: true });
  return { ...double, cwd, agentDir, context, cleanup, readState: () => readFileSync(join(agentDir, "pi-agentic-workflow.json"), "utf8") };
}

test("AC13 through the adapter: the project config is read from Pi's cwd, and only while the project is trusted", async () => {
  // A route that exists only in `<cwd>/.pi/…`: if the adapter hardcoded
  // `projectTrusted: true` or `cwd: process.cwd()`, one of the two assertions
  // below stops holding.
  const entry = await shippedEntry({
    projectConfig: { commands: { "plan-feature": { model: "openai/gpt-5.2" } } },
  });
  try {
    const untrusted = entry.context({ trusted: false });
    await entry.registered.get("plan-feature").handler("", untrusted);
    assert.deepEqual(entry.calls.setModel, [], "an untrusted project must not be able to steer the model");
    assert.deepEqual(
      entry.calls.sendUserMessage.map(([content]) => content),
      ["/skill:plan-feature"],
      "the command still runs, unrouted",
    );

    await entry.registered.get("plan-feature").handler("", entry.context({ trusted: true }));
    assert.deepEqual(
      entry.calls.setModel.map((model) => `${model.provider}/${model.id}`),
      ["openai/gpt-5.2"],
      "the same file, trusted, does route it",
    );
  } finally {
    entry.cleanup();
  }
});

test("AC7/AC8 through the adapter: the listener guards and the restore are the ones that run", async () => {
  const entry = await shippedEntry({ globalConfig: { default: { model: "openai/gpt-5.2", thinking: "high" } } });
  try {
    const before = { provider: "anthropic", id: "claude-sonnet-4-5" };
    const handlerCtx = entry.context({ model: before });
    handlerCtx.isProjectTrusted = () => false; // the route lives in the global file
    await entry.registered.get("plan-feature").handler("x", handlerCtx);
    assert.equal(entry.calls.setModel.length, 1, "the turn applied a model");
    assert.deepEqual(entry.calls.setThinkingLevel, ["high"], "and the level the route named");

    // Our own `setModel` also fires `model_select` in Pi. Treated as an operator
    // switch, AC8's restore would be cancelled by the router's own action.
    // Our own switch: Pi emits `model_select` for `setModel` too, and the event
    // carries the model we just applied.
    entry.operatorSelectsModel({ provider: "openai", id: "gpt-5.2" });
    // Pi's `agent_settled` handler is fire-and-forget (`void router.settle(...)`),
    // so the restore is observed after the microtask queue drains, not by awaiting
    // a handler that never returns the promise.
    entry.handlers.get("agent_settled")(undefined, entry.context({ model: { provider: "openai", id: "gpt-5.2" } }));
    await flush();
    assert.deepEqual(
      entry.calls.setModel.map((model) => `${model.provider}/${model.id}`),
      ["openai/gpt-5.2", "anthropic/claude-sonnet-4-5"],
      "the session is put back after the turn",
    );
    assert.deepEqual(
      entry.calls.setThinkingLevel,
      ["high", "medium"],
      "then the level the session held before is put back — the restore is not cancelled by our own switch",
    );
  } finally {
    entry.cleanup();
  }
});

test("AC7 through the adapter: a model the operator picked mid-turn is left in place", async () => {
  const entry = await shippedEntry({ globalConfig: { default: { model: "openai/gpt-5.2" } } });
  try {
    await entry.registered.get("plan-feature").handler("", entry.context());
    const operatorModel = { provider: "anthropic", id: "claude-opus-4-5" };
    entry.operatorSelectsModel(operatorModel);
    entry.handlers.get("agent_settled")(undefined, entry.context({ model: operatorModel }));
    await flush();
    assert.equal(entry.calls.setModel.length, 1, "only the route's switch — nothing is restored over the operator");
    assert.ok(
      entry.calls.notify.some(([message]) => message.includes("leaving the model you chose")),
      `backing off is said out loud: ${JSON.stringify(entry.calls.notify)}`,
    );
  } finally {
    entry.cleanup();
  }
});

test("AC10 through the adapter: the console is offered the commands that were registered", async () => {
  const entry = await shippedEntry();
  try {
    const asked = [];
    // Answer: edit the global file, then set a command override — recording what
    // the console offered at each step.
    const answers = ["the global file (~", prompts.setOverride];
    const ctx = entry.context();
    ctx.ui.select = async (title, options) => {
      asked.push([title, options]);
      return answers.shift();
    };
    ctx.ui.input = async (title) => {
      asked.push([title, []]);
      return undefined; // cancel the model reference → back to the menu → cancel
    };
    ctx.ui.confirm = async () => false;
    await entry.registered.get(SETTINGS_COMMAND).handler("", ctx);

    const titles = asked.map(([title]) => title);
    assert.ok(titles.some((title) => /which file/i.test(title)), `the console opened on its own questions: ${JSON.stringify(titles)}`);
    const commandQuestion = asked.find(([title]) => /which command/i.test(title));
    assert.ok(commandQuestion, "it reaches the command list");
    const names = readCatalogue(bundleSkills).commands.map((command) => command.name);
    const offered = commandQuestion[1].join("\n");
    for (const name of names) {
      assert.ok(offered.includes(name), `${name} is missing from the console's command list`);
    }
  } finally {
    entry.cleanup();
  }
});

test("AC13 through the factory: an untrusted project is never read, even when the file exists on disk", async () => {
  // The same rule as above, but through `createRouter` with the *real* loader and
  // a spy on the injected reader, so a regression in the loader's trust gate (as
  // opposed to the adapter's) is also caught.
  const root = mkdtempSync(join(tmpdir(), "paw-factory-trust-"));
  try {
    const agentDir = join(root, "agent");
    const cwd = join(root, "repo");
    mkdirSync(join(cwd, ".pi"), { recursive: true });
    mkdirSync(agentDir, { recursive: true });
    writeFileSync(join(cwd, ".pi", "pi-agentic-workflow.json"), JSON.stringify({ default: { model: "openai/gpt-5.2" } }));
    const readPaths = [];
    const double = piDouble();
    const { router } = createExtension({
      registrar: { registerCommand: () => {} },
      surface: () => double.api,
      skillsDir: bundleSkills,
      agentDir,
      hint: { pending: () => false, acknowledge: () => {} },
      loadConfig: (ctx) =>
        createLoader({ agentDir, cwd: ctx.cwd, projectTrusted: ctx.isProjectTrusted(), readPaths })(),
    });
    const ctx = {
      cwd,
      isIdle: () => true,
      isProjectTrusted: () => false,
      notify: () => {},
      find: (provider, modelId) => (provider === "openai" && modelId === "gpt-5.2" ? { provider, id: modelId } : undefined),
      hasConfiguredAuth: () => true,
      availableModels: () => [{ provider: "openai", id: "gpt-5.2" }],
    };
    await router.dispatch({ name: "plan-feature", skill: "plan-feature" }, "", ctx);
    assert.deepEqual(readPaths, [join(agentDir, "pi-agentic-workflow.json")], "the project file is not opened");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// Real loader, with the read list recorded.
const { loadConfig } = await import("../dist/config/load.js");
function createLoader({ agentDir, cwd, projectTrusted, readPaths }) {
  return () =>
    loadConfig({
      agentDir,
      cwd,
      projectTrusted,
      readFile: (path) => {
        readPaths.push(path);
        try {
          return readFileSync(path, "utf8");
        } catch (error) {
          if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
          throw error;
        }
      },
    });
}

test("AC7 through the adapter: a level the operator moved mid-turn survives the restore", async () => {
  // Without the `thinking_level_select` listener the router would restore the
  // pre-turn level over the operator's choice — the same guard as the model arm,
  // reached through the code Pi runs.
  const entry = await shippedEntry({ thinking: "medium", globalConfig: { default: { thinking: "low" } } });
  try {
    await entry.registered.get("plan-feature").handler("", entry.context());
    assert.deepEqual(entry.calls.setThinkingLevel, ["low"], "the route moved the level");

    entry.operatorSelectsThinking("xhigh");
    entry.handlers.get("agent_settled")(undefined, entry.context());
    await flush();

    assert.deepEqual(
      entry.calls.setThinkingLevel,
      ["low"],
      `nothing is written back over the operator's level, got ${JSON.stringify(entry.calls.setThinkingLevel)}`,
    );
  } finally {
    entry.cleanup();
  }
});
