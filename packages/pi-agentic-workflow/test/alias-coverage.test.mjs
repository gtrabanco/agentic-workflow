// alias-coverage.test.mjs — AC3 (SPEC S1, S2, S3, D-P9) + the P2 carry-in
//
// Three contracts: every bundled public skill gets exactly one command named
// after its own frontmatter `name:`; composed internals get none; and
// `agentic-workflow-settings` exists. The last group closes the loop the config
// schema cannot: a route whose command name does not exist must be reported, not
// silently ignored.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readCatalogue, readSkillMeta } from "../dist/routing/catalogue.js";
import { createExtension } from "../dist/extension/factory.js";
import { SETTINGS_COMMAND } from "../dist/routing/types.js";
import { createRouter } from "../dist/routing/dispatch.js";
import { configFor, modelRef } from "./helpers/session.mjs";
import { listSkills, parseSkillFrontmatter } from "../scripts/bundle-skills.mjs";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const repoSkills = resolve(PKG_DIR, "..", "..", "skills");
const bundleSkills = join(PKG_DIR, "skills");

const skillFile = (name, { invocable = true, description } = {}) =>
  `---\nname: ${name}\n${description ? `description: ${description}\n` : ""}${invocable ? "" : "user-invocable: false\n"}---\n\nRun ${name}.\n`;

/** Collect what a registrar was asked to register. */
function recorder() {
  const registered = new Map();
  return {
    registered,
    registrar: {
      registerCommand: (name, options) => registered.set(name, options),
    },
  };
}

function extensionOver(skillsDir, { config = configFor({}) } = {}) {
  const { registered, registrar } = recorder();
  const calls = { send: [], notify: [] };
  const state = { model: modelRef("anthropic/claude-sonnet-4-5"), thinking: "medium", idle: true, trusted: true };
  const surface = () => ({
    sendUserMessage: (content) => calls.send.push(content),
    setModel: async (model) => {
      state.model = model;
      return true;
    },
    getThinkingLevel: () => state.thinking,
    setThinkingLevel: (level) => {
      state.thinking = level;
    },
  });
  const noopContext = {
    cwd: "/fixture/repo",
    model: state.model,
    isIdle: () => state.idle,
    isProjectTrusted: () => state.trusted,
    notify: (message) => calls.notify.push(message),
    find: () => undefined,
    hasConfiguredAuth: () => false,
  };
  const handle = createExtension({
    registrar,
    surface,
    skillsDir,
    agentDir: "/fixture/agent",
    hint: { pending: () => false, acknowledge: () => true },
    loadConfig: () => ({ ok: true, config, problems: [] }),
    settings: ({ ctx }) => ctx.notify("settings"),
  });
  return { ...handle, registered, calls, noopContext };
}

test("AC3: every bundled user-invocable skill registers one command, named after its frontmatter name", () => {
  const source = listSkills(repoSkills);
  const expected = source.filter((skill) => skill.userInvocable).map((skill) => skill.name).sort();
  const catalogue = readCatalogue(bundleSkills);
  const names = catalogue.commands.map((command) => command.name).sort();

  assert.ok(expected.length >= 15, `the real bundle should expose a dozen-plus commands, got ${expected.length}`);
  assert.deepEqual(names, expected);
  assert.equal(new Set(names).size, names.length, "no command name is claimed twice");
});

test("AC3: `agentic-workflow-settings` is registered alongside the skill aliases", () => {
  const root = mkdtempSync(join(tmpdir(), "paw-alias-"));
  try {
    const skillsDir = join(root, "skills");
    mkdirSync(join(skillsDir, "plan-feature"), { recursive: true });
    writeFileSync(join(skillsDir, "plan-feature", "SKILL.md"), skillFile("plan-feature", { description: "Plan a feature" }));

    const { registered } = extensionOver(skillsDir);
    assert.deepEqual([...registered.keys()], ["plan-feature", SETTINGS_COMMAND]);
    assert.equal(registered.get("plan-feature").description, "Plan a feature");
    assert.equal(typeof registered.get(SETTINGS_COMMAND).handler, "function");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC3 / D-P9: composed internal skills are bundled but never callable", () => {
  const internals = listSkills(repoSkills).filter((skill) => !skill.userInvocable).map((skill) => skill.name);
  assert.ok(internals.length > 0, "the real bundle does contain composed internals");

  const catalogue = readCatalogue(bundleSkills);
  const names = catalogue.commands.map((command) => command.name);
  for (const internal of internals) {
    assert.ok(!names.includes(internal), `${internal} is user-invocable: false and must not get a command`);
  }
});

test("AC3: a command dispatches the skill directory it came from, not its own name", () => {
  const root = mkdtempSync(join(tmpdir(), "paw-alias-skillname-"));
  try {
    const skillsDir = join(root, "skills");
    // Directory name differs from the frontmatter name: the alias is the name,
    // the expanded invocation must be the skill Pi loaded.
    mkdirSync(join(skillsDir, "review-pack"), { recursive: true });
    writeFileSync(join(skillsDir, "review-pack", "SKILL.md"), skillFile("review-code"));

    const { registered, calls, noopContext } = extensionOver(skillsDir);
    registered.get("review-code").handler("", noopContext);
    assert.deepEqual(calls.send, ["/skill:review-pack"]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC3: catalogue problems are reported once, on the first command of the session", () => {
  const root = mkdtempSync(join(tmpdir(), "paw-alias-issues-"));
  try {
    const skillsDir = join(root, "skills");
    mkdirSync(join(skillsDir, "alpha"), { recursive: true });
    writeFileSync(join(skillsDir, "alpha", "SKILL.md"), skillFile("alpha"));
    mkdirSync(join(skillsDir, "beta"), { recursive: true });
    writeFileSync(join(skillsDir, "beta", "SKILL.md"), skillFile("alpha"));
    mkdirSync(join(skillsDir, "no-file"), { recursive: true });

    const { registered, calls, noopContext } = extensionOver(skillsDir);
    assert.deepEqual([...registered.keys()], ["alpha", SETTINGS_COMMAND]);
    assert.equal(calls.notify.length, 0, "nothing is reported before a command runs");

    registered.get("alpha").handler("", noopContext);
    registered.get("alpha").handler("", noopContext);
    const reports = calls.notify.filter((message) => message.includes("skills/"));
    assert.equal(reports.length, 2, `both packaging problems, once each: ${JSON.stringify(reports)}`);
    assert.match(reports[0], /no-file[\s\S]*no readable SKILL.md|alpha[\s\S]*already claimed/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("P2 carry-in: a configured route whose command does not exist is reported, not silently ignored", async () => {
  const router = createRouter({
    surface: () => ({
      sendUserMessage: () => {},
      setModel: async () => true,
      getThinkingLevel: () => "medium",
      setThinkingLevel: () => {},
    }),
    loadConfig: () => ({
      ok: true,
      problems: [],
      config: configFor({ commands: { "plan-featue": { model: "openai/gpt-5.2" } } }),
    }),
    hint: { pending: () => false, acknowledge: () => true },
    settingsCommand: SETTINGS_COMMAND,
    knownCommands: new Set(["plan-feature", SETTINGS_COMMAND]),
  });

  const notes = [];
  const ctx = {
    cwd: "/fixture/repo",
    model: modelRef("anthropic/claude-sonnet-4-5"),
    isIdle: () => true,
    isProjectTrusted: () => true,
    notify: (message) => notes.push(message),
    find: (provider, id) => ({ provider, id }),
    hasConfiguredAuth: () => true,
  };

  await router.dispatch({ name: "plan-feature", skill: "plan-feature" }, "", ctx);
  const typo = notes.find((message) => message.includes("match no command"));
  assert.ok(typo, `expected a typo report in ${JSON.stringify(notes)}`);
  assert.match(typo, /plan-featue/u);
  assert.match(typo, /agentic-workflow-settings/u);

  notes.length = 0;
  await router.dispatch({ name: "plan-feature", skill: "plan-feature" }, "", ctx);
  assert.deepEqual(notes, [], "the report is once per session, not once per command");
});

test("the runtime scanner agrees with the bundler on every real skill", () => {
  const dirs = readdirSync(repoSkills, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  let checked = 0;
  for (const dir of dirs) {
    let text = null;
    try {
      text = readFileSync(join(repoSkills, dir, "SKILL.md"), "utf8");
    } catch {
      continue;
    }
    checked += 1;
    const bundler = parseSkillFrontmatter(text);
    const runtime = readSkillMeta(text, dir);
    assert.equal(runtime.userInvocable, bundler.userInvocable, `${dir}: user-invocable verdict drifted between bundler and catalogue`);
    assert.equal(runtime.name, bundler.name ?? dir, `${dir}: command-name verdict drifted between bundler and catalogue`);
  }
  assert.equal(checked, dirs.length, "every skill directory in the source tree has a SKILL.md");
});

// The most faithful form of AC3: hand the compiled entry — the file Pi actually
// loads — a session double and check what it registers. Type-level compatibility
// with `ExtensionAPI` is enforced by `tsc`; this is the runtime half.

test("AC3: the shipped entry registers the full alias set against a Pi-shaped API", async () => {
  const root = mkdtempSync(join(tmpdir(), "paw-entry-"));
  const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = join(root, "agent");
  try {
    const { default: extension } = await import("../dist/extension/index.js");
    const { registered, registrar } = recorder();
    const surfaceCalls = [];

    const pi = {
      registerCommand: (name, options) => registrar.registerCommand(name, options),
      sendUserMessage: (content, options) => surfaceCalls.push(["sendUserMessage", content, options]),
      setModel: async (model) => surfaceCalls.push(["setModel", model]) || true,
      getThinkingLevel: () => "medium",
      setThinkingLevel: (level) => surfaceCalls.push(["setThinkingLevel", level]),
      on: (type, handler) => surfaceCalls.push(["on", type, typeof handler]),
    };

    extension(pi);

    const expected = readCatalogue(bundleSkills).commands.map((command) => command.name).sort();
    const names = [...registered.keys()].filter((name) => name !== SETTINGS_COMMAND).sort();
    assert.deepEqual(names, expected);
    assert.ok(registered.has(SETTINGS_COMMAND), "the settings command comes from the entry too");
    assert.deepEqual(
      surfaceCalls.filter(([call]) => call === "on").map(([, type]) => type).sort(),
      ["agent_settled", "model_select", "thinking_level_select"],
      "the entry subscribes to the lifecycle events routing depends on",
    );

    // Running a real alias through the real entry must reach Pi's dispatcher.
    const ctx = {
      cwd: root,
      model: { provider: "anthropic", id: "claude-sonnet-4-5" },
      isIdle: () => true,
      isProjectTrusted: () => true,
      ui: { notify: () => {} },
      modelRegistry: { find: () => undefined, hasConfiguredAuth: () => false },
    };
    await registered.get("plan-feature").handler("--next", ctx);
    const sent = surfaceCalls.find(([call, arg]) => call === "sendUserMessage" && arg === "/skill:plan-feature --next");
    assert.ok(sent, `the entry dispatched to Pi: ${JSON.stringify(surfaceCalls)}`);
    assert.equal(sent[2].expandPromptTemplates, true);
  } finally {
    if (previousAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previousAgentDir;
    rmSync(root, { recursive: true, force: true });
  }
});
