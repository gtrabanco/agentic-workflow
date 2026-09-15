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
import { PAGED_SELECT_NEXT, PAGED_SELECT_PREV, SELECT_OPTION_LIMIT } from "../dist/settings/picker.js";
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
        // The ordered chain builder asks "Model chain for <target>?" after every
        // model pick; default it to Done so a single-model route needs no extra
        // answer. A test that builds a chain provides an explicit chainAction slot.
        if (!Object.hasOwn(answers, title) && /^Model chain for .+\?$/u.test(title)) {
          return prompts.chainDone;
        }
        if (!Object.hasOwn(answers, title)) throw new Error(`no scripted select answer for: ${title}`);
        const value = answers[title];
        return Array.isArray(value) ? value.shift() : value;
      },
      pick: async (title, options, opts = {}) => {
        asked.push({ title, kind: "pick", options, opts });
        if (!Object.hasOwn(answers, title)) throw new Error(`no scripted pick answer for: ${title}`);
        const value = answers[title];
        // A multiple pick returns the whole selection; a single pick consumes a queue.
        if (opts.multiple) return Array.isArray(value) ? value : [value];
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

function consoleOver(files, { trusted = true, answers = {}, models, rich = true } = {}) {
  const collector = writeCollector();
  // P5 added the field chooser to every route edit. Default to "both" so the
  // pre-existing fixtures (which supply model + thinking answers) behave as
  // before; tests that exercise field independence override `prompts.fields`.
  const scripted = scriptedUi({ [prompts.fields]: prompts.fieldsBoth, ...answers });
  // `rich: false` strips the picker so the non-TUI fallback path is exercised
  // (OB-12): a console without a rich picker must still complete via select/input.
  const ui = rich
    ? scripted.ui
    : {
        select: scripted.ui.select,
        input: scripted.ui.input,
        confirm: scripted.ui.confirm,
        notify: scripted.ui.notify,
      };
  const result = runSettingsConsole({
    ui,
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

test("AC10: the view shows the keep-on-settle policy in force, and it follows the config", () => {
  const kept = loadConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({ [paths.global]: '{"onSettle":"keep"}' }),
  });
  const keepText = renderMergedConfig(kept, commands).join("\n");
  assert.match(keepText, /after a routed command settles: keep/u, "keep is the shipped default and is shown");

  const restored = loadConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({ [paths.global]: '{"onSettle":"restore"}' }),
  });
  const restoreText = renderMergedConfig(restored, commands).join("\n");
  assert.match(restoreText, /after a routed command settles: restore/u, "the view follows the effective policy, not a constant");
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

test("P4/OB-1: the model picker uses the rich seam and passes the value currently in force", async () => {
  const { outcome, scripted } = await run(
    { [paths.global]: '{"default":{"model":"anthropic/claude-opus-4-5","thinking":"high"}}' },
    {
      models: ["anthropic/claude-opus-4-5", "openai/gpt-5.2"],
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "design-feature",
        [prompts.modelPicked("design-feature")]: "openai/gpt-5.2",
        [prompts.thinking("design-feature")]: "high",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  const modelPick = scripted.asked.find((entry) => entry.title === prompts.modelPicked("design-feature"));
  assert.ok(modelPick, "the model question went to the rich picker");
  assert.equal(modelPick.kind, "pick", "the rich seam, not the plain select, handled the model question");
  assert.deepEqual(modelPick.opts, { initial: "anthropic/claude-opus-4-5" }, "the value in force is preselected");
  assert.ok(modelPick.options.includes("openai/gpt-5.2"), "the live-registry options are offered");
});

test("P4/OB-12: without a rich picker the console falls back to select/input and still completes", async () => {
  const { outcome, written, scripted } = await run(
    {},
    {
      rich: false,
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
  const modelQuestion = scripted.asked.find((entry) => entry.title === prompts.modelPicked("design-feature"));
  assert.equal(modelQuestion.kind, "select", "non-TUI falls back to the plain select");
  assert.ok(scripted.asked.every((entry) => entry.kind !== "pick"), "no rich picker was used");
  assert.deepEqual(JSON.parse(written.get(paths.global)), {
    commands: { "design-feature": { model: "openai/gpt-5.2", thinking: "low" } },
  });
});

// --- P5 / OB-3: current-value field editing, field independence, chain builder ---

test("AC4/OB-3: changing only the model asks no thinking question and keeps the current thinking", async () => {
  const { outcome, written, scripted } = await run(
    { [paths.global]: '{"default":{"model":"anthropic/claude-opus-4-5","thinking":"high"}}' },
    {
      models: ["anthropic/claude-opus-4-5", "openai/gpt-5.2"],
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setDefaultRoute, prompts.save, prompts.cancel],
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelPicked("the default route")]: "openai/gpt-5.2",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.ok(
    !scripted.asked.some((entry) => entry.title === prompts.thinking("the default route")),
    "changing only the model asks no thinking question",
  );
  assert.deepEqual(JSON.parse(written.get(paths.global)), { default: { model: "openai/gpt-5.2", thinking: "high" } });
});

test("AC4/OB-3: changing only the thinking asks no model question and keeps the current model", async () => {
  const { outcome, written, scripted } = await run(
    { [paths.global]: '{"default":{"model":"anthropic/claude-opus-4-5","thinking":"high"}}' },
    {
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setDefaultRoute, prompts.save, prompts.cancel],
        [prompts.fields]: prompts.fieldsThinking,
        [prompts.thinking("the default route")]: "low",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.ok(
    !scripted.asked.some((entry) => /Model for the default route\?|Which model for the default route\?/u.test(entry.title)),
    "changing only the thinking asks no model question",
  );
  assert.deepEqual(JSON.parse(written.get(paths.global)), { default: { model: "anthropic/claude-opus-4-5", thinking: "low" } });
});

test("AC3/OB-3: editing a route without changing it saves a byte-identical file", async () => {
  const pretty = (obj) => `${JSON.stringify(obj, null, 2)}\n`;
  const original = pretty({ commands: { "plan-feature": { model: "openai/gpt-5.2", thinking: "low" } } });
  const { outcome, written } = await run(
    { [paths.global]: original },
    {
      models: ["openai/gpt-5.2"],
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.fields]: prompts.fieldsBoth,
        [prompts.modelPicked("plan-feature")]: "openai/gpt-5.2",
        [prompts.thinking("plan-feature")]: "low",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(written.get(paths.global), original, "no change leaves the saved file byte-identical");
});

test("AC7/OB-3: the ordered chain builder saves the model as a chain in build order", async () => {
  const { outcome, written } = await run(
    {},
    {
      models: ["a/m1", "b/m2", "c/m3"],
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setDefaultRoute, prompts.save, prompts.cancel],
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelPicked("the default route")]: ["a/m1", "b/m2", "c/m3"],
        [prompts.chainAction("the default route")]: [
          prompts.chainAppend,
          prompts.chainAppend,
          prompts.chainDone,
        ],
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.deepEqual(JSON.parse(written.get(paths.global)), {
    default: { model: ["a/m1", "b/m2", "c/m3"], thinking: "inherit" },
  });
});

test("AC11/OB-14: the merged view renders a route's ordered model chain", async () => {
  const loaded = loadConfig({
    agentDir,
    cwd,
    projectTrusted: true,
    readFile: readFrom({ [paths.project]: '{"commands":{"plan-feature":{"model":["a/m1","b/m2"],"thinking":"inherit"}}}' }),
  });
  const text = renderMergedConfig(loaded, commands).join("\n");
  assert.ok(text.includes("plan-feature: a/m1 → b/m2 / inherit"), `chain rendered in order: ${text}`);
});

// --- P9 / OB-17 (amendment A1, F2): chain-edit visibility ---

test("AC14/OB-17: editing a chain route opens the builder seeded with the value in force (chain preserved on Done)", async () => {
  const { outcome, written, scripted } = await run(
    { [paths.global]: '{"default":{"model":["a/m1","b/m2"],"thinking":"high"}}' },
    {
      models: ["a/m1", "b/m2", "c/m3"],
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setDefaultRoute, prompts.save, prompts.cancel],
        [prompts.fields]: prompts.fieldsModel,
        [prompts.chainAction("the default route")]: [prompts.chainDone],
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  const saved = JSON.parse(written.get(paths.global));
  assert.deepEqual(saved.default.model, ["a/m1", "b/m2"], "Done with no change keeps the existing chain");
  const shown = scripted.notify.map((entry) => entry.message).join("\n");
  assert.match(shown, /a\/m1 → b\/m2/u, "the current chain is labelled in the edit flow");
});

test("AC14/OB-17: the seeded chain builder appends a fallback and remove-last trims the tail", async () => {
  const { outcome, written } = await run(
    { [paths.global]: '{"commands":{"plan-feature":{"model":["a/m1","b/m2"],"thinking":"inherit"}}}' },
    {
      models: ["a/m1", "b/m2", "c/m3"],
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.fields]: prompts.fieldsModel,
        [prompts.chainAction("plan-feature")]: [
          prompts.chainAppend,
          prompts.chainRemoveLast,
          prompts.chainAppend,
          prompts.chainDone,
        ],
        [prompts.modelPicked("plan-feature")]: ["c/m3", "d/m4"],
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  const saved = JSON.parse(written.get(paths.global));
  assert.deepEqual(saved.commands["plan-feature"].model, ["a/m1", "b/m2", "d/m4"], "append added a fallback, remove-last dropped c/m3, the seeded a/m1 + b/m2 tail survives; final = a/m1, b/m2, d/m4");
});

// --- P6 / OB-4: bulk apply and bulk clear ---

test("AC5/OB-4: one bulk apply assigns model+thinking to two commands, matching a single pass per command", async () => {
  const { outcome, written } = await run(
    {},
    {
      models: ["a/m1", "b/m2"],
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.bulkApply, prompts.save, prompts.cancel],
        [prompts.command]: ["plan-feature", "execute-phase"],
        [prompts.fields]: prompts.fieldsBoth,
        [prompts.modelPicked("plan-feature")]: "a/m1",
        [prompts.thinking("plan-feature")]: "high",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  const saved = JSON.parse(written.get(paths.global));
  assert.deepEqual(saved.commands, {
    "plan-feature": { model: "a/m1", thinking: "high" },
    "execute-phase": { model: "a/m1", thinking: "high" },
  }, "each selected command got the same single-pass route");
});

test("AC5/OB-4: one bulk clear removes several overrides in a single save", async () => {
  const { outcome, written } = await run(
    { [paths.project]: '{"commands":{"plan-feature":{"model":"a/m1"},"design-feature":{"model":"b/m2"}}}' },
    {
      trusted: true,
      answers: {
        [prompts.scope]: "Project",
        [prompts.menu]: [prompts.bulkClear, prompts.save, prompts.cancel],
        [prompts.command]: ["plan-feature", "design-feature"],
        [prompts.saveTo(paths.project)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  const saved = JSON.parse(written.get(paths.project));
  assert.equal(saved.commands, undefined, "clearing the last overrides persists no empty map");
});

test("AC5/OB-4: a bulk route using a registry-missing reference warns per command but still writes", async () => {
  const { outcome, written, scripted } = await run(
    {},
    {
      models: ["a/m1", "b/m2"],
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.bulkApply, prompts.save, prompts.cancel],
        [prompts.command]: ["plan-feature", "execute-phase"],
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelPicked("plan-feature")]: "Type another reference…",
        [prompts.model("plan-feature")]: "zzz/missing",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  const saved = JSON.parse(written.get(paths.global));
  assert.deepEqual(saved.commands, {
    "plan-feature": { model: "zzz/missing", thinking: "inherit" },
    "execute-phase": { model: "zzz/missing", thinking: "inherit" },
  }, "a missing reference still writes the route");
  const warnings = scripted.notify.filter((entry) => entry.message.includes("zzz/missing") && entry.kind === "warning");
  assert.equal(warnings.length, 2, `one advisory warning per selected command: ${JSON.stringify(warnings)}`);
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

test("AC10: set the settle keep/restore policy", async () => {
  const { written } = await run(
    {},
    {
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.settle, prompts.save, prompts.cancel],
        [prompts.settleChoice]: "restore",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.deepEqual(JSON.parse(written.get(paths.global)), { onSettle: "restore" });
});

test("AC10: setting the settle policy to keep is written explicitly, shadowing a lower scope", async () => {
  // The F4 rule applies to any policy: an explicit choice survives the save so it
  // can shadow a lower scope — including re-arming keep over a global restore.
  const { written } = await run(
    { [paths.global]: '{"onSettle":"restore"}' },
    {
      answers: {
        [prompts.scope]: "Project",
        [prompts.menu]: [prompts.settle, prompts.save, prompts.cancel],
        [prompts.settleChoice]: "keep",
        [prompts.saveTo(paths.project)]: true,
      },
    },
  );

  assert.deepEqual(JSON.parse(written.get(paths.project)), { onSettle: "keep" });
  const loaded = loadConfig({ agentDir, cwd, projectTrusted: true, readFile: readFrom({ [paths.global]: '{"onSettle":"restore"}', [paths.project]: written.get(paths.project) }) });
  assert.equal(loaded.config.onSettle, "keep", "the project keep wins over the global restore");
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
    [prompts.fields]: prompts.fieldsBoth,
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
      [prompts.fields]: prompts.fieldsBoth,
      [prompts.chainAction("the default route")]: prompts.chainDone,
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

test("AC10: a failed undo is told to the operator, not papered over", async () => {
  // The console calls the router; the router can say no (race: the turn settled
  // between the menu and the click). Printing "put back" anyway would lie.
  const scripted = scriptedUi({
    [prompts.scope]: "the global file (~)",
    [prompts.menu]: [prompts.undoInFlight, prompts.cancel],
    [prompts.discard]: false,
  });
  await runSettingsConsole({
    ui: scripted.ui,
    agentDir: "/fixture/agent",
    cwd: "/fixture/repo",
    projectTrusted: true,
    commands: ["plan-feature"],
    routing: { inFlight: () => true, undoInFlight: async () => false },
    readFile: () => null,
    writeFile: () => {},
  });
  assert.ok(
    scripted.notify.some(({ message, kind }) => /Nothing was in flight/i.test(message) && kind === "warning"),
    `the refusal is shown: ${JSON.stringify(scripted.notify)}`,
  );
});

// --- fix #214: the 24-option dialog cap (AC2-AC5, AC7) ---
// Pi-web rejects a select dialog offering more than 24 options (PE-001). The
// frozen names below are the AC2/AC3/AC4/AC5/AC7 validators' `-t` filters; every
// option dialog a test provokes is checked against the cap.

/** The trailing option `pickModelEntry` appends to every model dialog. */
const TYPED_OPTION = "Type another reference…";

/** 30 registry references across four providers (over the cap, provider dialog fits). */
const overCapModels = [
  ...Array.from({ length: 8 }, (_, i) => `alpha/m${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `beta/m${i + 1}`),
  ...Array.from({ length: 8 }, (_, i) => `delta/m${i + 1}`),
  ...Array.from({ length: 6 }, (_, i) => `gamma/m${i + 1}`),
];

/** 30 providers with one model each — the provider dialog itself exceeds the cap. */
const overCapProviders = Array.from({ length: 30 }, (_, i) => `prov${String(i + 1).padStart(2, "0")}/m1`);

/** 30 models from one provider — the model dialog pages within it. */
const singleProviderModels = Array.from({ length: 30 }, (_, i) => `solo/m${String(i + 1).padStart(2, "0")}`);

const optionDialogs = (scripted) => scripted.asked.filter((entry) => Array.isArray(entry.options));
const fitsCap = (scripted) => optionDialogs(scripted).every((entry) => entry.options.length <= SELECT_OPTION_LIMIT);

test("settings console model picker: provider-first two-step over 30 models", async () => {
  const { outcome, written, scripted } = await run(
    {},
    {
      models: overCapModels,
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelProvider("plan-feature")]: "delta",
        [prompts.modelPicked("plan-feature")]: "delta/m3",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(JSON.parse(written.get(paths.global)).commands["plan-feature"].model, "delta/m3");

  const providerDialog = scripted.asked.find((entry) => entry.title === prompts.modelProvider("plan-feature"));
  assert.ok(providerDialog, "the provider dialog is asked before the model list");
  assert.equal(providerDialog.kind, "pick", "the rich seam drives the provider dialog while it fits");
  assert.deepEqual(providerDialog.options, ["alpha", "beta", "delta", "gamma", TYPED_OPTION]);

  const modelDialog = scripted.asked.find((entry) => entry.title === prompts.modelPicked("plan-feature"));
  assert.ok(modelDialog, "the chosen provider's models come second");
  assert.ok(
    modelDialog.options.every((option) => option.startsWith("delta/") || option === TYPED_OPTION),
    `only the chosen provider's models are offered: ${JSON.stringify(modelDialog.options)}`,
  );
  assert.equal(modelDialog.options.at(-1), TYPED_OPTION, "TYPED is last");
  assert.ok(fitsCap(scripted), `every dialog is under the cap: ${JSON.stringify(optionDialogs(scripted))}`);
});

test("settings console model picker: provider-first two-step over 30 models in a pick-less UI", async () => {
  const { outcome, written, scripted } = await run(
    {},
    {
      rich: false,
      models: overCapModels,
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelProvider("plan-feature")]: "beta",
        [prompts.modelPicked("plan-feature")]: "beta/m5",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(JSON.parse(written.get(paths.global)).commands["plan-feature"].model, "beta/m5");
  const providerDialog = scripted.asked.find((entry) => entry.title === prompts.modelProvider("plan-feature"));
  assert.equal(providerDialog.kind, "select", "a pick-less UI drives the two-step through the select fallback (OB-12)");
  assert.ok(scripted.asked.every((entry) => entry.kind !== "pick"), "no rich picker is used");
  assert.equal(providerDialog.options.at(-1), TYPED_OPTION);
  assert.ok(fitsCap(scripted));
});

test("settings console model picker: provider-first two-step over 30 providers", async () => {
  const { outcome, written, scripted } = await run(
    {},
    {
      models: overCapProviders,
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelProvider("plan-feature")]: [PAGED_SELECT_NEXT, "prov25"],
        [prompts.modelPicked("plan-feature")]: "prov25/m1",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(JSON.parse(written.get(paths.global)).commands["plan-feature"].model, "prov25/m1");
  const pages = scripted.asked.filter((entry) => entry.title === prompts.modelProvider("plan-feature"));
  assert.equal(pages.length, 2, "the provider dialog itself paged");
  assert.ok(pages[0].options.includes(PAGED_SELECT_NEXT), "page 1 offers the pager");
  assert.ok(!pages[0].options.includes("prov25"), "prov25 is beyond page 1");
  assert.ok(pages[1].options.includes("prov25"), "the pager reached the page-2 providers");
  assert.ok(pages[1].options.includes(PAGED_SELECT_PREV), "page 2 offers PREV");
  assert.equal(pages[1].options.at(-1), TYPED_OPTION, "TYPED stays last on the paged provider dialog");
  assert.ok(fitsCap(scripted));
});

test("settings console model picker: pages within one provider over 30 models", async () => {
  const { outcome, written, scripted } = await run(
    {},
    {
      models: singleProviderModels,
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelProvider("plan-feature")]: "solo",
        [prompts.modelPicked("plan-feature")]: [PAGED_SELECT_NEXT, "solo/m25"],
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(JSON.parse(written.get(paths.global)).commands["plan-feature"].model, "solo/m25");
  const pages = scripted.asked.filter((entry) => entry.title === prompts.modelPicked("plan-feature"));
  assert.equal(pages.length, 2, "the model dialog paged within the provider");
  assert.ok(pages[0].options.includes(PAGED_SELECT_NEXT), "page 1 offers the pager");
  assert.ok(pages[1].options.includes("solo/m25"), "the pager reached the page-2 models");
  assert.ok(fitsCap(scripted));
});

test("settings console model picker: single-step preserved at 23 models", async () => {
  const models = Array.from({ length: 23 }, (_, i) => `alpha/m${i + 1}`);
  const { outcome, written, scripted } = await run(
    { [paths.global]: '{"default":{"model":"alpha/m1"}}' },
    {
      models,
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setDefaultRoute, prompts.save, prompts.cancel],
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelPicked("the default route")]: "alpha/m9",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(JSON.parse(written.get(paths.global)).default.model, "alpha/m9");
  assert.ok(
    !scripted.asked.some((entry) => entry.title === prompts.modelProvider("the default route")),
    "no provider dialog below the cap",
  );
  const modelDialog = scripted.asked.find((entry) => entry.title === prompts.modelPicked("the default route"));
  assert.equal(modelDialog.kind, "pick", "the single-step rich pick is preserved");
  assert.deepEqual(modelDialog.opts, { initial: "alpha/m1" }, "the value in force is preselected");
  assert.equal(modelDialog.options.length, 24, "23 models + TYPED fit one dialog");
  assert.equal(modelDialog.options.at(-1), TYPED_OPTION);
});

test("settings console model picker: single-step preserved at 23 models in a pick-less UI", async () => {
  const models = Array.from({ length: 23 }, (_, i) => `alpha/m${i + 1}`);
  const { outcome, scripted } = await run(
    {},
    {
      rich: false,
      models,
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelPicked("plan-feature")]: "alpha/m9",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  const modelDialog = scripted.asked.find((entry) => entry.title === prompts.modelPicked("plan-feature"));
  assert.equal(modelDialog.kind, "select", "the plain select fallback is preserved below the cap");
  assert.equal(modelDialog.options.length, 24);
  assert.equal(modelDialog.options.at(-1), TYPED_OPTION, "TYPED is last on the below-cap pick-less dialog too");
  assert.ok(fitsCap(scripted));
});

test("settings console model picker: Type another reference is the last option in every model dialog", async () => {
  const { scripted } = await run(
    {},
    {
      models: singleProviderModels,
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelProvider("plan-feature")]: "solo",
        [prompts.modelPicked("plan-feature")]: [PAGED_SELECT_NEXT, "solo/m25"],
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  const modelDialogs = scripted.asked.filter(
    (entry) => entry.title === prompts.modelProvider("plan-feature") || entry.title === prompts.modelPicked("plan-feature"),
  );
  assert.ok(modelDialogs.length >= 3, "the provider dialog plus both model pages were asked");
  assert.ok(modelDialogs.every((entry) => entry.options.at(-1) === TYPED_OPTION), "TYPED is last on every model dialog");
});

test("settings console model picker: bounded command selection over 30 commands", async () => {
  const commandSet = Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => [`cmd${String(i + 1).padStart(2, "0")}`, { model: "a/m1" }]),
  );
  const { outcome, written, scripted } = await run(
    { [paths.global]: JSON.stringify({ commands: commandSet }) },
    {
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.clearOverride, prompts.save, prompts.cancel],
        [prompts.command]: [PAGED_SELECT_NEXT, "cmd25"],
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  const saved = JSON.parse(written.get(paths.global));
  assert.ok(!saved.commands.cmd25, "the command picked from page 2 was removed");
  assert.equal(Object.keys(saved.commands).length, 29);
  const pages = scripted.asked.filter((entry) => entry.title === prompts.command);
  assert.equal(pages.length, 2, "the command list paged");
  assert.ok(pages[0].options.includes(PAGED_SELECT_NEXT), "page 1 offers the pager");
  assert.ok(pages[1].options.includes("cmd25"), "the pager reached page 2");
  assert.ok(fitsCap(scripted));
});

test("settings console model picker: bounded command multi-select rounds over 30 commands", async () => {
  const commandSet = Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => [`cmd${String(i + 1).padStart(2, "0")}`, { model: "a/m1" }]),
  );
  const { outcome, written, scripted } = await run(
    { [paths.global]: JSON.stringify({ commands: commandSet }) },
    {
      rich: false,
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.bulkApply, prompts.save, prompts.cancel],
        [prompts.command]: [PAGED_SELECT_NEXT, "cmd22", "cmd01"],
        [prompts.addAnother]: [true, false],
        [prompts.fields]: prompts.fieldsThinking,
        [prompts.thinking("cmd22")]: "low",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  const saved = JSON.parse(written.get(paths.global));
  assert.equal(saved.commands.cmd22.thinking, "low");
  assert.equal(saved.commands.cmd01.thinking, "low");
  const rounds = scripted.asked.filter((entry) => entry.title === prompts.command);
  assert.equal(rounds.length, 3, "two bounded rounds (page 2 of round 1, page 1 of round 2)");
  assert.ok(rounds[0].options.includes(PAGED_SELECT_NEXT), "round 1 page 1 offers the pager");
  assert.ok(rounds[1].options.includes("cmd22"), "round 1 reached page 2");
  assert.ok(rounds[2].options.includes("cmd01"), "round 2 starts a fresh bounded page");
  assert.ok(fitsCap(scripted));
});

// F7: the over-cap two-step's preselection and its TYPED-from-a-paged-dialog
// path were correct but uncovered — a regression there passed the whole suite.
// These cases seed the value in force and answer TYPED from a paged dialog, so
// `askProvider`'s and `askModelWithinProvider`'s `opts.initial` contract and
// `askModelOverCap`'s TYPED → text-input fallback fail loudly when broken.

test("settings console model picker: the over-cap two-step preselects the value in force at both steps", async () => {
  const { outcome, written, scripted } = await run(
    { [paths.global]: '{"commands":{"plan-feature":{"model":"beta/m5"}}}' },
    {
      models: overCapModels,
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelProvider("plan-feature")]: "beta",
        [prompts.modelPicked("plan-feature")]: "beta/m9",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(JSON.parse(written.get(paths.global)).commands["plan-feature"].model, "beta/m9");
  const providerDialog = scripted.asked.find((entry) => entry.title === prompts.modelProvider("plan-feature"));
  assert.deepEqual(providerDialog.opts, { initial: "beta" }, "the provider in force is preselected");
  const modelDialog = scripted.asked.find((entry) => entry.title === prompts.modelPicked("plan-feature"));
  assert.deepEqual(modelDialog.opts, { initial: "beta/m5" }, "the model in force is preselected within its provider");
});

test("settings console model picker: the over-cap two-step never leaks the value in force into another provider", async () => {
  const { outcome, written, scripted } = await run(
    { [paths.global]: '{"commands":{"plan-feature":{"model":"beta/m5"}}}' },
    {
      models: overCapModels,
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelProvider("plan-feature")]: "alpha",
        [prompts.modelPicked("plan-feature")]: "alpha/m2",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(JSON.parse(written.get(paths.global)).commands["plan-feature"].model, "alpha/m2");
  const providerDialog = scripted.asked.find((entry) => entry.title === prompts.modelProvider("plan-feature"));
  assert.deepEqual(providerDialog.opts, { initial: "beta" }, "the provider in force is still preselected");
  const modelDialog = scripted.asked.find((entry) => entry.title === prompts.modelPicked("plan-feature"));
  assert.deepEqual(modelDialog.opts, {}, "another provider's dialog preselects nothing");
});

test("settings console model picker: Type another reference from a paged dialog reaches the text input", async () => {
  const { outcome, written, scripted } = await run(
    {},
    {
      models: singleProviderModels,
      answers: {
        [prompts.scope]: "Global",
        [prompts.menu]: [prompts.setOverride, prompts.save, prompts.cancel],
        [prompts.command]: "plan-feature",
        [prompts.fields]: prompts.fieldsModel,
        [prompts.modelProvider("plan-feature")]: "solo",
        [prompts.modelPicked("plan-feature")]: [PAGED_SELECT_NEXT, TYPED_OPTION],
        [prompts.model("plan-feature")]: "custom/ref-9",
        [prompts.saveTo(paths.global)]: true,
      },
    },
  );

  assert.equal(outcome.status, "saved");
  assert.equal(JSON.parse(written.get(paths.global)).commands["plan-feature"].model, "custom/ref-9");
  const pages = scripted.asked.filter((entry) => entry.title === prompts.modelPicked("plan-feature"));
  assert.equal(pages.length, 2, "TYPED was answered from a paged (page-2) dialog");
  const asked = scripted.questions();
  assert.ok(asked.includes(prompts.model("plan-feature")), "TYPED fell through to the text input");
  assert.ok(fitsCap(scripted));
});
