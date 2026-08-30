// settings-console.test.mjs — AC10 (SPEC S4, S11, D-P8) · view/save state transitions
//
// The console edits ONE file at a time but must always show the MERGED result,
// because "what will this command actually run on?" is the only question an
// operator has. Written red-first: `src/settings/*` did not exist when this
// landed. Prompts come from the module's own `prompts` table, so a renamed
// question fails these tests instead of silently re-sequencing them.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readConfigFile, writeConfigFile } from "../dist/settings/store.js";

import { runSettingsConsole, prompts } from "../dist/settings/console.js";
import { renderMergedConfig } from "../dist/settings/view.js";
import { loadConfig, configFilePaths } from "../dist/config/load.js";
import { SETTINGS_COMMAND } from "../dist/routing/types.js";

const agentDir = "/fixture/agent";
const cwd = "/fixture/repo";
const paths = configFilePaths(agentDir, cwd);
const commands = ["design-feature", "execute-phase", "plan-feature"];

/** Answer queue keyed by the exact prompt title; arrays are consumed in order. */
function scriptedUi(answers) {
  const asked = [];
  const notify = [];
  const take = (title, kind) => {
    asked.push({ title, kind });
    if (!Object.hasOwn(answers, title)) throw new Error(`no scripted ${kind} answer for: ${title}`);
    const value = answers[title];
    return Array.isArray(value) ? value.shift() : value;
  };
  return {
    asked,
    notify,
    ui: {
      select: async (title, options) => {
        asked.push({ title, kind: "select", options });
        if (!Object.hasOwn(answers, title)) throw new Error(`no scripted select answer for: ${title}`);
        const value = answers[title];
        return Array.isArray(value) ? value.shift() : value;
      },
      input: async (title) => take(title, "input"),
      confirm: async (title) => take(title, "confirm"),
      notify: (message, kind) => notify.push({ message, kind }),
    },
    questions: () => asked.map((entry) => entry.title),
  };
}

const readFrom = (map) => (path) => (path in map ? map[path] : null);

function writeCollector() {
  const written = new Map();
  return { written, writeFile: (path, text) => written.set(path, text) };
}

function consoleOver(files, { trusted = true, answers = {}, models } = {}) {
  const collector = writeCollector();
  const scripted = scriptedUi(answers);
  const result = runSettingsConsole({
    ui: scripted.ui,
    agentDir,
    cwd,
    projectTrusted: trusted,
    commands,
    ...(models ? { models } : {}),
    readFile: readFrom(files),
    writeFile: collector.writeFile,
  });
  return { ...collector, scripted, result };
}

const run = async (files, options) => {
  const harness = consoleOver(files, options);
  return { outcome: await harness.result, ...harness };
};

test("AC10: the view renders the merged config, with an empty override list as inherit", () => {
  const text = renderMergedConfig(loadConfig({ agentDir, cwd, projectTrusted: true, readFile: readFrom({}) }), commands).join("\n");

  assert.match(text, /routing/iu);
  assert.match(text, /inherit/u);
  assert.match(text, /no per-command overrides/iu);
  assert.match(text, /stop/iu, "the effective fallback policy is shown");
});

// Pass-2 fold (F14): the summary's fallback line was the one rendered value no
// test varied, so a hard-coded `stop` passed. The line is only honest if it
// follows the merged config — that is the whole point of opening on "what is in
// effect right now".
test("AC10: the view's fallback line follows the effective policy, not a constant", () => {
  const inherit = loadConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({ [paths.global]: '{"onUnavailableRoute":"inherit"}' }),
  });
  const text = renderMergedConfig(inherit, commands).join("\n");

  assert.equal(inherit.config.onUnavailableRoute, "inherit", "the merged policy really is the non-default one");
  assert.match(text, /when a configured model is unavailable: inherit/u, "the view reports what the config says");
  assert.doesNotMatch(text, /unavailable: stop/u, "and never a remembered default");
});

test("AC10: the view shows project values winning over global ones per command", () => {
  const loaded = loadConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({
      [paths.global]: '{"default":{"model":"anthropic/claude-opus-4-5","thinking":"high"},"commands":{"design-feature":{"model":"anthropic/claude-sonnet-4-5"}}}',
      [paths.project]: '{"commands":{"design-feature":{"thinking":"max"}}}',
    }),
  });
  const text = renderMergedConfig(loaded, commands).join("\n");

  assert.match(text, /design-feature: anthropic\/claude-sonnet-4-5 \/ max/u);
  assert.match(text, /default: anthropic\/claude-opus-4-5 \/ high/u);
});

test("AC10: set the default route and save it to the global file", async () => {
  const { outcome, written, scripted } = await run(
    {},
    {
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setDefaultRoute, prompts.save, prompts.cancel],
        [prompts.model("the default route")]: "openai/gpt-5.2",
        [prompts.thinking("the default route")]: "high",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(outcome.scope, "global");
  assert.equal(outcome.path, paths.global);
  assert.deepEqual(JSON.parse(written.get(paths.global)), { default: { model: "openai/gpt-5.2", thinking: "high" } });
  assert.match(
    scripted.notify.map((entry) => entry.message).join("\n"),
    /routing/iu,
    "the merged view was shown before any edit",
  );
});

test("AC10: set a per-command override and keep the rest of the file", async () => {
  const { outcome, written } = await run(
    { [paths.global]: '{"default":{"model":"openai/gpt-5.2","thinking":"low"},"onUnavailableRoute":"inherit"}' },
    {
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.model("plan-feature")]: "openai/gpt-5.6-sol",
        [prompts.thinking("plan-feature")]: "max",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  const saved = JSON.parse(written.get(paths.global));
  assert.deepEqual(saved.commands, { "plan-feature": { model: "openai/gpt-5.6-sol", thinking: "max" } });
  assert.deepEqual(saved.default, { model: "openai/gpt-5.2", thinking: "low" }, "untouched keys survive");
  assert.equal(saved.onUnavailableRoute, "inherit");
});

test("AC10: a command chosen from the registry list is written as its exact reference", async () => {
  const { outcome, written } = await run(
    {},
    {
      models: ["anthropic/claude-opus-4-5", "openai/gpt-5.2"],
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "design-feature",
        [prompts.modelPicked("design-feature")]: "openai/gpt-5.2",
        [prompts.thinking("design-feature")]: "low",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.deepEqual(JSON.parse(written.get(paths.global)), {
    commands: { "design-feature": { model: "openai/gpt-5.2", thinking: "low" } },
  });
});

test("AC10: clearing a per-command override removes only that command", async () => {
  const { outcome, written } = await run(
    { [paths.project]: '{"commands":{"plan-feature":{"model":"openai/gpt-5.2"},"design-feature":{"thinking":"low"}}}' },
    {
      trusted: true,
      answers: {
        [prompts.scope]: "Project",
        [prompts.menu]: [prompts.clearOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.saveTo(paths.project)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(outcome.scope, "project");
  assert.deepEqual(JSON.parse(written.get(paths.project)), { commands: { "design-feature": { thinking: "low" } } });
});

// Pass-2 fold (F15): the console builds a cleaned file for validation and for the
// result, and `saveScope` must write THAT, not the draft. Clearing the last
// override is the case that shows the difference — an empty map is what the
// draft holds, and a config file must not start carrying keys that mean nothing.
test("AC10: clearing the last override persists no empty map", async () => {
  const { written } = await run(
    { [paths.project]: '{"commands":{"plan-feature":{"model":"openai/gpt-5.2"}}}' },
    {
      trusted: true,
      answers: {
        [prompts.scope]: "Project",
        [prompts.menu]: [prompts.clearOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.saveTo(paths.project)]: true,
      },
    },
  );

  const saved = JSON.parse(written.get(paths.project));
  assert.deepEqual(saved, {}, "the cleaned draft reaches the disk — no `\"commands\": {}` residue");

  // What the console wrote is what the dispatcher reads back: inherit, not an error.
  const loaded = loadConfig({ agentDir, cwd, projectTrusted: true, readFile: readFrom({ [paths.project]: written.get(paths.project) }) });
  assert.equal(loaded.ok, true);
  assert.deepEqual(loaded.config.commands, {}, "an emptied override map is absent, not present-and-empty");
});

test("AC10: set the unavailable-route policy", async () => {
  const { written } = await run(
    {},
    {
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.policy, prompts.save, prompts.cancel],
        [prompts.policyChoice]: "inherit",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.deepEqual(JSON.parse(written.get(paths.global)), { onUnavailableRoute: "inherit" });
});

test("AC10: a project edit is refused while the project is untrusted", async () => {
  const { outcome, written, scripted } = await run(
    {},
    {
      trusted: false,
      answers: {
        [prompts.scope]: ["Project", "Global"],
        [prompts.menu]: [prompts.save, prompts.cancel],
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved", "the operator was offered the global scope instead");
  assert.equal(outcome.scope, "global");
  assert.equal(written.has(paths.project), false, "nothing was written into the untrusted project");
  assert.equal(scripted.asked.filter((entry) => entry.title === prompts.scope).length, 2, "the scope was offered again after the refusal");
  assert.match(scripted.notify.map((entry) => entry.message).join("\n"), /untrusted|not trusted/iu);
});

test("AC10: a typed model that is not provider/modelId is rejected before anything is written", async () => {
  const { outcome, written, scripted } = await run(
    {},
    {
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setDefaultRoute, prompts.cancel],
        [prompts.model("the default route")]: "not-a-usable-model-reference",
      },
    },
  );

  assert.equal(outcome.status, "cancelled");
  assert.equal(written.size, 0);
  const shown = scripted.notify.map((entry) => entry.message).join("\n");
  assert.match(shown, /provider\/modelId/u);
  assert.match(shown, /\$\.default\.model/u, "the rejection names the field path");
});

test("AC10: a scope whose file does not parse cannot be overwritten", async () => {
  const { outcome, written, scripted } = await run(
    { [paths.global]: '{"onUnavailableRoute":"always"}' },
    {
      answers: {
        [prompts.scope]: ["Global", "Project"],
        [prompts.menu]: [prompts.save, prompts.cancel],
        [prompts.saveTo(paths.project)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(outcome.scope, "project", "the broken global file was left alone");
  assert.equal(written.has(paths.global), false);
  assert.match(scripted.notify.map((entry) => entry.message).join("\n"), /\$\.onUnavailableRoute/u);
});

test("AC10: leaving without saving writes nothing, and asks before discarding edits", async () => {
  const { outcome, written, scripted } = await run(
    { [paths.global]: '{"default":{"model":"openai/gpt-5.2"}}' },
    {
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setDefaultRoute, prompts.cancel],
        [prompts.model("the default route")]: "openai/gpt-5.6-sol",
        [prompts.thinking("the default route")]: "off",
        [prompts.discard]: true,
      },
    },
  );

  assert.equal(outcome.status, "cancelled");
  assert.equal(written.size, 0);
  assert.ok(scripted.asked.some((entry) => entry.title === prompts.discard), "edits were not dropped silently");
});

test("AC10: cancelling a clean draft does not nag about discarding", async () => {
  const { outcome, scripted } = await run(
    {},
    { answers: { [prompts.scope]: "Global", [prompts.menu]: prompts.cancel } },
  );

  assert.equal(outcome.status, "cancelled");
  assert.equal(scripted.asked.some((entry) => entry.title === prompts.discard), false);
});

test("AC10: closing the scope question leaves the session untouched", async () => {
  const { outcome, written } = await run({}, { answers: { [prompts.scope]: undefined } });
  assert.equal(outcome.status, "cancelled");
  assert.equal(written.size, 0);
});

test("AC3/AC10: the settings command is the one the alias set advertises", async () => {
  assert.equal(SETTINGS_COMMAND, "agentic-workflow-settings");
  const { scripted } = await run({}, { answers: { [prompts.scope]: "Global", [prompts.menu]: prompts.cancel } });
  assert.ok(scripted.questions().includes(prompts.scope), "the registered command opens this console");
});

test("AC10: the shipped writer creates the directory, keeps the file private, and reads it back", () => {
  const dir = mkdtempSync(join(tmpdir(), "paw-store-"));
  const path = join(dir, ".pi", "pi-agentic-workflow.json");
  const text = '{"default":{"model":"openai/gpt-5.2","thinking":"low"}}\n';

  assert.equal(readConfigFile(path), null, "absent is not an error");
  writeConfigFile(path, text);
  assert.equal(readConfigFile(path), text);
  assert.equal(statSync(path).mode & 0o777, 0o600);
});

test("AC10: what the console saves is what the dispatcher reads", async () => {
  const agent = mkdtempSync(join(tmpdir(), "paw-agent-"));
  const project = mkdtempSync(join(tmpdir(), "paw-proj-"));
  const scripted = scriptedUi({
    [prompts.scope]: "Global",
    [prompts.menu]: [prompts.setDefaultRoute, prompts.save, prompts.cancel],
    [prompts.model("the default route")]: "openai/gpt-5.6-sol",
    [prompts.thinking("the default route")]: "medium",
    [prompts.saveTo(configFilePaths(agent, project).global)]: true,
  });

  const outcome = await runSettingsConsole({
    ui: scripted.ui,
    agentDir: agent,
    cwd: project,
    projectTrusted: true,
    commands,
    readFile: readConfigFile,
    writeFile: writeConfigFile,
  });
  assert.equal(outcome.status, "saved");

  const loaded = loadConfig({ agentDir: agent, cwd: project, projectTrusted: true });
  assert.equal(loaded.ok, true);
  assert.deepEqual(loaded.config.default, { model: "openai/gpt-5.6-sol", thinking: "medium" });
  assert.equal(readFileSync(configFilePaths(agent, project).global, "utf8").includes("openai/gpt-5.6-sol"), true);
});

test("AC10: a console that throws reports the failure instead of rejecting", async () => {
  const { createExtension } = await import("../dist/extension/factory.js");
  const notified = [];
  const registered = new Map();
  const ctx = {
    cwd,
    isProjectTrusted: () => true,
    notify: (message, kind) => notified.push([message, kind]),
    availableModels: () => [],
    find: () => undefined,
    hasConfiguredAuth: () => false,
    ui: { notify: (message, kind) => notified.push([message, kind]) },
  };
  createExtension({
    registrar: { registerCommand: (name, command) => registered.set(name, command), on: () => {}, registerTool: () => {} },
    surface: () => ({ notify: (message, kind) => notified.push([message, kind]) }),
    skillsDir: join(process.cwd(), "skills"),
    agentDir,
    hint: { shouldShow: () => false, markShown: () => {} },
    settings: () => {
      throw new Error("EACCES: permission denied, open '/fixture/agent/pi-agentic-workflow.json'");
    },
    loadConfig: () => ({
      ok: true,
      config: { default: { model: "inherit", thinking: "inherit" }, commands: {}, onUnavailableRoute: "stop" },
      problems: [],
    }),
  });

  await registered.get(SETTINGS_COMMAND).handler("", ctx);
  assert.equal(notified.length, 1);
  assert.match(notified[0][0], /Settings could not be opened/u);
  assert.match(notified[0][0], /EACCES/u, "the operator sees why");
  assert.equal(notified[0][1], "error");
});

test("AC10: the shipped command, run through the real entry, writes the real global file", async () => {
  const root = mkdtempSync(join(tmpdir(), "paw-entry-settings-"));
  const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = join(root, "agent");
  try {
    const { default: extension } = await import("../dist/extension/index.js");
    const registered = new Map();
    extension({
      registerCommand: (name, options) => registered.set(name, options),
      sendUserMessage: () => {},
      setModel: async () => true,
      getThinkingLevel: () => "medium",
      setThinkingLevel: () => {},
      on: () => {},
    });

    const answer = {
      [prompts.scope]: "Global",
      [prompts.menu]: [prompts.setDefaultRoute, prompts.save, prompts.cancel],
      // The registry has one model, so the entry path offers it as a list.
      [prompts.modelPicked("the default route")]: "anthropic/claude-sonnet-4-5",
      [prompts.thinking("the default route")]: "low",
      [prompts.saveTo(join(root, "agent", "pi-agentic-workflow.json"))]: true,
    };
    const shown = [];
    const ctx = {
      cwd: root,
      model: { provider: "anthropic", id: "claude-sonnet-4-5" },
      isIdle: () => true,
      isProjectTrusted: () => true,
      ui: {
        notify: (message) => shown.push(message),
        select: async (title) => take(answer, title),
        input: async (title) => take(answer, title),
        confirm: async (title) => take(answer, title),
      },
      modelRegistry: {
        find: () => undefined,
        hasConfiguredAuth: () => false,
        getAll: () => [{ provider: "anthropic", id: "claude-sonnet-4-5" }],
      },
    };

    await registered.get("agentic-workflow-settings").handler("", ctx);

    const globalFile = configFilePaths(join(root, "agent"), root).global;
    assert.deepEqual(JSON.parse(readFileSync(globalFile, "utf8")), {
      default: { model: "anthropic/claude-sonnet-4-5", thinking: "low" },
    });
    assert.equal(
      loadConfig({ agentDir: join(root, "agent"), cwd: root, projectTrusted: true }).config.default.model,
      "anthropic/claude-sonnet-4-5",
      "the next command reads what this one wrote",
    );
    assert.match(shown.join("\n"), /no per-command overrides/iu, "the console opened on the merged view");
  } finally {
    if (previousAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previousAgentDir;
    rmSync(root, { recursive: true, force: true });
  }
});

/** Consume one scripted answer, mirroring the harness above for the real entry. */
function take(answer, title) {
  const value = answer[title];
  if (value === undefined) throw new Error(`no scripted answer for: ${title}`);
  return Array.isArray(value) ? value.shift() : value;
}

// --- F4 fold: an explicit choice must survive the save. `clean()` used to elide
// by VALUE (inherit-only routes, the "stop" policy), which silently discarded
// exactly the overrides an operator picks to shadow a lower scope — including
// re-arming the fail-closed policy from a project file. Proven by probe before
// the fix: saving `stop` at project scope over a global `inherit` wrote "{}" and
// the effective policy stayed `inherit`.

test("AC10: an explicit inherit override is written, because it shadows a lower scope", async () => {
  const { outcome, written } = await run(
    {
      [paths.global]: '{"default":{"model":"openai/gpt-5.2","thinking":"high"}}',
      [paths.project]: "{}",
    },
    {
      answers: {
        [prompts.scope]: "Project",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "design-feature",
        [prompts.model("design-feature")]: "inherit",
        [prompts.thinking("design-feature")]: "inherit",
        [prompts.saveTo(paths.project)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.deepEqual(JSON.parse(written.get(paths.project)), {
    commands: { "design-feature": { model: "inherit", thinking: "inherit" } },
  });
  const loaded = loadConfig({ agentDir, cwd, projectTrusted: true, readFile: readFrom({ ...globalOnly(), [paths.project]: written.get(paths.project) }) });
  assert.deepEqual(loaded.config.commands["design-feature"], { model: "inherit", thinking: "inherit" }, "the override is what takes effect");
});

test("AC10: re-arming the fail-closed policy from the project file is written", async () => {
  const { outcome, written } = await run(
    { [paths.global]: '{"onUnavailableRoute":"inherit"}', [paths.project]: "{}" },
    {
      answers: {
        [prompts.scope]: "Project",
        [prompts.menu]: [prompts.policy, prompts.save, prompts.cancel],
        [prompts.policyChoice]: "stop",
        [prompts.saveTo(paths.project)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.deepEqual(JSON.parse(written.get(paths.project)), { onUnavailableRoute: "stop" });
  const loaded = loadConfig({ agentDir, cwd, projectTrusted: true, readFile: readFrom({ ...globalOnly(), [paths.project]: written.get(paths.project) }) });
  assert.equal(loaded.config.onUnavailableRoute, "stop", "fail-closed is back in force");
});

test("AC10: saving a draft nobody edited reproduces the file instead of emptying it", async () => {
  const existing = '{"default":{"model":"openai/gpt-5.2","thinking":"inherit"},"commands":{"plan-feature":{"model":"inherit","thinking":"low"}}}';
  const { written } = await run(
    { [paths.global]: existing },
    {
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.save, prompts.cancel],
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.deepEqual(JSON.parse(written.get(paths.global)), JSON.parse(existing), "a save never loses what it did not change");
});

function globalOnly() {
  return { [paths.global]: '{"default":{"model":"openai/gpt-5.2","thinking":"high"}}' };
}

// --- Pass-2 fold: N-2/N-4. The console is the only surface with room to explain a
// routed turn that never settled, so `inFlight()` lives here rather than being dead
// code, and the escape has to appear only when there is something to escape.

test("AC10: the undo appears while a routed turn holds the latch and puts the session back", async () => {
  let inFlight = true;
  let undid = 0;
  const scripted = scriptedUi({
    [prompts.scope]: "the global file (~)",
    [prompts.menu]: [prompts.undoInFlight, prompts.cancel],
    [prompts.discard]: false,
  });
  const result = await runSettingsConsole({
    ui: scripted.ui,
    agentDir: "/fixture/agent",
    cwd: "/fixture/repo",
    projectTrusted: true,
    commands: ["plan-feature"],
    routing: {
      inFlight: () => inFlight,
      undoInFlight: async () => {
        undid += 1;
        inFlight = false;
        return true;
      },
    },
    readFile: () => null,
    writeFile: () => {},
  });

  const menu = scripted.asked.find(({ title }) => title === prompts.menu);
  assert.ok(menu.options.includes(prompts.undoInFlight), "the release is offered while the latch is held");
  assert.equal(undid, 1, "and choosing it releases the latch");
  assert.ok(
    scripted.notify.some(({ message }) => /put back/i.test(message)),
    `with a word about what happened: ${JSON.stringify(scripted.notify)}`,
  );
  assert.equal(result.status, "cancelled", "undoing a routing is not an edit to the file");
});

test("AC10: with nothing in flight the console does not offer an undo", async () => {
  const scripted = scriptedUi({ [prompts.scope]: "the global file (~)", [prompts.menu]: prompts.cancel });
  await runSettingsConsole({
    ui: scripted.ui,
    agentDir: "/fixture/agent",
    cwd: "/fixture/repo",
    projectTrusted: true,
    commands: ["plan-feature"],
    routing: {
      inFlight: () => false,
      undoInFlight: async () => {
        throw new Error("the undo was offered when nothing was in flight");
      },
    },
    readFile: () => null,
    writeFile: () => {},
  });
  const menu = scripted.asked.find(({ title }) => title === prompts.menu);
  assert.ok(menu, "the menu was reached");
  assert.ok(!menu.options.includes(prompts.undoInFlight), "an option that can do nothing is noise");
});
