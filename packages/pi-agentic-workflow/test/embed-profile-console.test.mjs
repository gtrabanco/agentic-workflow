// embed-profile-console.test.mjs — the materialization surface (issue #541 S4, S7).
//
// The console is where a NaN install (main package + preset) turns the preset's
// embedding profile into a project's committed index config: it shows, per key,
// whether the value came from the preset, the operator or the default, and it
// asks before it writes. Everything here is a scripted dialog over an in-memory
// filesystem — the suite owns every byte the console could touch.

import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";

import { runSettingsConsole, prompts } from "../dist/settings/console.js";
import { clearProviderPresets, registerProviderPreset } from "../dist/config/presets.js";

const agentDir = "/fixture/agent";
const cwd = "/fixture/repo";
const commands = ["execute-phase"];
const indexPath = join(cwd, ".agentic-workflow", "index.json");

const PROFILE = {
  baseUrl: "https://acme.example/v1",
  model: "acme-embed-1",
  envVar: "ACME_API_KEY",
  chunk_limit: 6000,
  pacing: { batchSize: 6, requestsPerMinute: 60 },
};

function registerPreset(provider = "acme", embedProfile = PROFILE) {
  registerProviderPreset({ provider, embedProfile, resolveProfile: () => ({ default: { model: `${provider}/big`, thinking: "inherit" } }) });
}

/** Answer queue keyed by prompt title; a title may hold a list consumed in order. */
function scriptedUi(answers) {
  const asked = [];
  const notify = [];
  const serve = (title, kind) => {
    asked.push({ title, kind });
    assert.ok(Object.hasOwn(answers, title), `no scripted ${kind} answer for: ${title}`);
    const value = answers[title];
    return Array.isArray(value) ? value.shift() : value;
  };
  return {
    asked,
    notify,
    questions: () => asked.map((entry) => entry.title),
    ui: {
      select: async (title) => serve(title, "select"),
      input: async (title) => serve(title, "input"),
      confirm: async (title) => serve(title, "confirm"),
      notify: (message, kind) => notify.push({ message, kind }),
    },
  };
}

function consoleOver(files, answers, { trusted = true } = {}) {
  const harness = scriptedUi(answers);
  const written = new Map();
  const result = runSettingsConsole({
    ui: harness.ui,
    agentDir,
    cwd,
    projectTrusted: trusted,
    commands,
    readFile: (path) => (path in files ? files[path] : null),
    writeFile: (path, text) => written.set(path, text),
  });
  return { ...harness, written, result };
}

/** Open the console on the project scope and pick the embed-profile action. */
const answersFor = (extra = {}) => ({
  [prompts.scope]: "Project",
  [prompts.menu]: [prompts.embedProfile, prompts.cancel],
  ...extra,
});

test("S7: the console reports every key's origin and writes only after an explicit yes", async () => {
  registerPreset();
  try {
    const files = { [join(cwd, ".pi", "pi-agentic-workflow.json")]: "{}" };
    const harness = consoleOver(files, answersFor({ [prompts.embedProfileConfirm]: true }));

    await harness.result;

    const report = harness.notify.find((entry) => /embedding profile/iu.test(entry.message));
    assert.ok(report, "the origin report is notified");
    assert.match(report.message, /provider\.model = acme-embed-1 · default/u);
    assert.match(report.message, /provider\.baseUrl = https:\/\/acme\.example\/v1 · default/u);
    assert.equal(harness.written.size, 1, "one file written");
    const text = harness.written.get(indexPath);
    assert.ok(text, "the write targets the project's index config");
    assert.deepEqual(JSON.parse(text).provider, PROFILE);
  } finally {
    clearProviderPresets();
  }
});

test("S4: a declined question writes nothing and says so", async () => {
  registerPreset();
  try {
    const files = { [join(cwd, ".pi", "pi-agentic-workflow.json")]: "{}" };
    const harness = consoleOver(files, answersFor({ [prompts.embedProfileConfirm]: false }));

    await harness.result;

    assert.equal(harness.written.size, 0, "a no is a no");
    assert.ok(
      harness.notify.some((entry) => /nothing was written/iu.test(entry.message)),
      "the operator is told the decision changed nothing",
    );
  } finally {
    clearProviderPresets();
  }
});

test("S4: an untrusted project refuses — the index config is committed project state", async () => {
  registerPreset();
  try {
    const files = { [join(cwd, ".pi", "pi-agentic-workflow.json")]: "{}" };
    const harness = consoleOver(
      files,
      { [prompts.scope]: "Global", [prompts.menu]: [prompts.embedProfile, prompts.cancel] },
      { trusted: false },
    );

    await harness.result;

    assert.equal(harness.written.size, 0);
    assert.ok(harness.notify.some((entry) => /untrusted/iu.test(entry.message)), "the refusal names the reason");
    assert.equal(harness.questions().includes(prompts.embedProfileConfirm), false, "it never asked to write");
  } finally {
    clearProviderPresets();
  }
});

test("S4: with no preset carrying a profile the console warns and writes nothing", async () => {
  registerProviderPreset({ provider: "plain", resolveProfile: () => ({ default: { model: "plain/1", thinking: "inherit" } }) });
  try {
    const files = { [join(cwd, ".pi", "pi-agentic-workflow.json")]: "{}" };
    const harness = consoleOver(files, answersFor());

    await harness.result;

    assert.equal(harness.written.size, 0);
    assert.ok(harness.notify.some((entry) => /no installed preset/iu.test(entry.message)));
    assert.equal(harness.questions().includes(prompts.embedProfileConfirm), false);
  } finally {
    clearProviderPresets();
  }
});

test("S4: two presets — the operator picks which profile to materialize", async () => {
  registerPreset("acme");
  registerPreset("globex", { ...PROFILE, baseUrl: "https://globex.example/v1", model: "globex-embed" });
  try {
    const files = { [join(cwd, ".pi", "pi-agentic-workflow.json")]: "{}" };
    const harness = consoleOver(
      files,
      answersFor({ [prompts.embedProfileProvider]: "globex", [prompts.embedProfileConfirm]: true }),
    );

    await harness.result;

    const text = harness.written.get(indexPath);
    assert.ok(text, "the chosen profile is the one written");
    assert.equal(JSON.parse(text).provider.model, "globex-embed");
  } finally {
    clearProviderPresets();
  }
});

test("S4: an index config the crate cannot read is refused, never overwritten", async () => {
  registerPreset();
  try {
    const files = {
      [join(cwd, ".pi", "pi-agentic-workflow.json")]: "{}",
      [indexPath]: '{"version": 1, "provider": {',
    };
    const harness = consoleOver(files, answersFor());

    await harness.result;

    assert.equal(harness.written.size, 0, "the operator's broken file survives");
    const error = harness.notify.find((entry) => entry.kind === "error");
    assert.ok(error, "the refusal is reported as an error");
    assert.match(error.message, /index\.json/u);
    assert.equal(harness.questions().includes(prompts.embedProfileConfirm), false);
  } finally {
    clearProviderPresets();
  }
});

test("S7: an already-materialized project reports nothing to fill and asks nothing", async () => {
  registerPreset();
  try {
    const files = {
      [join(cwd, ".pi", "pi-agentic-workflow.json")]: "{}",
      [indexPath]: JSON.stringify({ version: 1, provider: PROFILE }),
    };
    const harness = consoleOver(files, answersFor());

    await harness.result;

    assert.equal(harness.written.size, 0);
    assert.equal(harness.questions().includes(prompts.embedProfileConfirm), false, "nothing to write, nothing to ask");
    assert.ok(harness.notify.some((entry) => /nothing to fill/iu.test(entry.message)));
  } finally {
    clearProviderPresets();
  }
});
