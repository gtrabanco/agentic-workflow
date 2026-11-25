// embed-default-on.test.mjs — issue #719 S1/S4, finding F1 (decision D5).
//
// The default-on doc-index resolution belongs to the package that owns the
// profile, not to a registry read in the main package's extension load. Pi
// resolves which extension loads first by an implementation detail it does not
// promise, so a main-package load that consults the preset registry can find it
// empty and silently answer keyword-only — the exact failure this unit exists to
// remove. Here the donor applies its own entry, in the same module graph that
// registers it, so the profile exists by construction whatever the load order is.
//
// Obligation tag:
//   test-obligation@1 surface=packages/pi-nan-agentic-workflow/src/extension #719
//   kinds=behavioral,contract,negative
//   obligations=donor-triggers-default,donor-withholds-on-block,donor-withholds-without-key,
//               donor-idempotent-under-withdrawal,donor-reports-its-decision
//
// Justification lines name the independent obligation each case covers, never
// the implementation under test.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { clearProviderPresets, getEmbedProfiles } from "@gtrabanco/pi-agentic-workflow/dist/config/presets.js";
import { NAN_EMBED_PROFILE } from "../dist/embed-profile.js";
import extension, { applyEmbedDefault, resetEmbedDefaultReports } from "../dist/extension.js";

/** The crate's direct env names, as the main package publishes them. */
const DIRECT = {
  baseUrl: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_URL",
  model: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MODEL",
  apiKey: "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_API_KEY",
};
const BUDGET = "AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MAX_REQUEST_CHARS";

const SCRATCH = [];
function scratch(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  SCRATCH.push(dir);
  return dir;
}
process.on("exit", () => {
  for (const dir of SCRATCH) rmSync(dir, { recursive: true, force: true });
});

/** A project whose `.agentic-workflow/index.json` is exactly `body` (null ⇒ absent). */
function projectWith(body) {
  const root = scratch("nan-default-on-");
  if (body !== null) {
    mkdirSync(join(root, ".agentic-workflow"), { recursive: true });
    writeFileSync(join(root, ".agentic-workflow", "index.json"), `${JSON.stringify(body, null, 2)}\n`);
  }
  return root;
}

/** The smallest host the entry survives: no commands, no tools, no session. */
function piStub() {
  return {
    registerCommand: () => {},
    on: () => {},
    registerTool: () => {},
    getCommands: () => [],
    getMcpServers: () => [],
  };
}

test("donor: the module's own graph registers and applies, with no other package's load order involved", () => {
  clearProviderPresets();
  const root = projectWith(null);
  const previousCwd = process.cwd();
  const savedKey = process.env.NAN_API_KEY;
  const saved = Object.fromEntries([DIRECT.baseUrl, DIRECT.model, DIRECT.apiKey, BUDGET].map((name) => [name, process.env[name]]));
  process.chdir(root);
  process.env.NAN_API_KEY = "sk-nan";
  try {
    // Nothing registered this profile from outside: the shop is bare.
    assert.deepEqual(getEmbedProfiles(), [], "the fixture starts with an empty registry");

    extension(piStub());

    assert.deepEqual(
      getEmbedProfiles().map((entry) => entry.provider),
      ["nan"],
      "the donor registers its own profile, from its own module",
    );
    assert.equal(
      process.env[DIRECT.model],
      NAN_EMBED_PROFILE.model,
      "and applies it in the same call — no other package ran first",
    );
  } finally {
    process.chdir(previousCwd);
    if (savedKey === undefined) delete process.env.NAN_API_KEY;
    else process.env.NAN_API_KEY = savedKey;
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    clearProviderPresets();
  }
});

test("donor: loading the extension applies the profile from an absent block and a present key", () => {
  clearProviderPresets();
  const root = projectWith(null);
  const previousCwd = process.cwd();
  const savedKey = process.env.NAN_API_KEY;
  const saved = Object.fromEntries([DIRECT.baseUrl, DIRECT.model, DIRECT.apiKey, BUDGET].map((name) => [name, process.env[name]]));
  // A bare provider surface: this row's fixture is the absent-block + present-key
  // case, and an export another in-process row left behind is not part of it.
  for (const name of [DIRECT.baseUrl, DIRECT.model, DIRECT.apiKey, BUDGET]) delete process.env[name];
  process.chdir(root);
  process.env.NAN_API_KEY = "sk-nan";
  try {
    extension(piStub());

    assert.equal(process.env[DIRECT.apiKey], "sk-nan", "the key is the one the process carries");
    assert.equal(process.env[DIRECT.baseUrl], NAN_EMBED_PROFILE.baseUrl, "the profile resolved by default");
    assert.equal(process.env[DIRECT.model], NAN_EMBED_PROFILE.model);
    assert.equal(process.env[BUDGET], String(NAN_EMBED_PROFILE.chunk_limit * NAN_EMBED_PROFILE.pacing.batchSize));
  } finally {
    process.chdir(previousCwd);
    if (savedKey === undefined) delete process.env.NAN_API_KEY;
    else process.env.NAN_API_KEY = savedKey;
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    clearProviderPresets();
  }
});

test("donor: an explicit provider block withholds the default, and the committed file is untouched", () => {
  clearProviderPresets();
  const block = { baseUrl: "https://acme.example/v1", model: "acme-embed-1", envVar: "ACME_API_KEY" };
  const root = projectWith({ version: 1, provider: block });
  const path = join(root, ".agentic-workflow", "index.json");
  const before = readFileSync(path);
  const previousCwd = process.cwd();
  const savedKey = process.env.NAN_API_KEY;
  const saved = Object.fromEntries([DIRECT.baseUrl, DIRECT.model, DIRECT.apiKey, BUDGET].map((name) => [name, process.env[name]]));
  process.chdir(root);
  process.env.NAN_API_KEY = "sk-nan";
  try {
    extension(piStub());

    // The withhold is real, not the absence of a trigger: the same project with
    // the block removed resolves — so what stopped it here is the block.
    assert.equal(process.env[DIRECT.baseUrl], saved[DIRECT.baseUrl], "not one variable was exported");
    assert.equal(process.env[DIRECT.model], saved[DIRECT.model]);
    assert.ok(readFileSync(path).equals(before), "the operator's block is the instruction, byte for byte");
    rmSync(join(root, ".agentic-workflow"), { recursive: true, force: true });
    extension(piStub());
    assert.equal(process.env[DIRECT.model], NAN_EMBED_PROFILE.model, "the very next load, block gone, resolves it");
  } finally {
    process.chdir(previousCwd);
    if (savedKey === undefined) delete process.env.NAN_API_KEY;
    else process.env.NAN_API_KEY = savedKey;
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    clearProviderPresets();
  }
});

test("donor: without the key nothing is exported — the keyword-only session stays supported", () => {
  clearProviderPresets();
  const root = projectWith(null);
  const previousCwd = process.cwd();
  const savedKey = process.env.NAN_API_KEY;
  const saved = Object.fromEntries([DIRECT.baseUrl, DIRECT.model, DIRECT.apiKey, BUDGET].map((name) => [name, process.env[name]]));
  // A bare provider surface: whatever earlier rows left behind is not this row's fixture.
  for (const name of [DIRECT.baseUrl, DIRECT.model, DIRECT.apiKey, BUDGET]) delete process.env[name];
  delete process.env.NAN_API_KEY;
  process.chdir(root);
  try {
    extension(piStub());

    assert.equal(process.env[DIRECT.baseUrl], undefined, "no key, no provider, no fault");
    assert.equal(process.env[DIRECT.model], undefined);
    // The trigger is live and the key is what stops it: the same project with a
    // key resolves, so this hold is the absent credential and nothing else.
    process.env.NAN_API_KEY = "sk-nan";
    extension(piStub());
    assert.equal(process.env[DIRECT.model], NAN_EMBED_PROFILE.model, "with the key present the same load resolves it");
  } finally {
    process.chdir(previousCwd);
    if (savedKey !== undefined) process.env.NAN_API_KEY = savedKey;
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    clearProviderPresets();
  }
});

test("donor: a provider block written after the injection wins in the same session", () => {
  clearProviderPresets();
  const root = projectWith(null);
  const previousCwd = process.cwd();
  const savedKey = process.env.NAN_API_KEY;
  const saved = Object.fromEntries([DIRECT.baseUrl, DIRECT.model, DIRECT.apiKey, BUDGET].map((name) => [name, process.env[name]]));
  process.chdir(root);
  process.env.NAN_API_KEY = "sk-nan";
  try {
    extension(piStub());
    assert.equal(process.env[DIRECT.model], NAN_EMBED_PROFILE.model, "the first load resolved the default");

    // The operator writes their own block without leaving the session.
    mkdirSync(join(root, ".agentic-workflow"), { recursive: true });
    writeFileSync(
      join(root, ".agentic-workflow", "index.json"),
      `${JSON.stringify({ version: 1, provider: { baseUrl: "https://acme.example/v1", model: "acme-embed-1", envVar: "ACME_API_KEY" } }, null, 2)}\n`,
    );
    extension(piStub());

    assert.equal(process.env[DIRECT.baseUrl], saved[DIRECT.baseUrl], "the resolver's own trio is withdrawn");
    assert.equal(process.env[DIRECT.model], saved[DIRECT.model], "so the operator's block is what runs");
  } finally {
    process.chdir(previousCwd);
    if (savedKey === undefined) delete process.env.NAN_API_KEY;
    else process.env.NAN_API_KEY = savedKey;
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    clearProviderPresets();
  }
});

// ---------------------------------------------------------------------------
// The decision is reported, not kept silent (F7, D6)
// ---------------------------------------------------------------------------
//
// `plan.detail` was a written promise with no reader: the resolver carried an
// operator-facing line and an `unreadable-config` refusal text that nothing ever
// printed. The "0 embedding tokens used" mystery this unit exists to remove was a
// silence problem, so the seam reports — but only a plan that carries detail, and
// only once per process. A keyword-only session is a supported state, never a
// fault to announce per load.

test("donor: an applied default is reported once, with the resolver's own line", () => {
  clearProviderPresets();
  const root = projectWith(null);
  const previousCwd = process.cwd();
  const savedKey = process.env.NAN_API_KEY;
  const saved = Object.fromEntries([DIRECT.baseUrl, DIRECT.model, DIRECT.apiKey, BUDGET].map((name) => [name, process.env[name]]));
  for (const name of [DIRECT.baseUrl, DIRECT.model, DIRECT.apiKey, BUDGET]) delete process.env[name];
  process.chdir(root);
  process.env.NAN_API_KEY = "sk-nan";
  const reports = [];
  try {
    resetEmbedDefaultReports(); // this row owns its own dialect of "the same line"
    applyEmbedDefault({ report: (line, kind) => reports.push({ line, kind }) });
    assert.equal(reports.length, 1, "the operator hears it once");
    assert.match(reports[0].line, /doc-index embeddings resolved by default/u, "and hears what happened");
    assert.match(reports[0].line, /qwen3-embedding/u, "naming the provider the session now uses");
    assert.equal(reports[0].kind, "info");

    applyEmbedDefault({ report: (line, kind) => reports.push({ line, kind }) });
    assert.equal(reports.length, 1, "a second load in the same process stays silent");
  } finally {
    process.chdir(previousCwd);
    if (savedKey === undefined) delete process.env.NAN_API_KEY;
    else process.env.NAN_API_KEY = savedKey;
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    clearProviderPresets();
  }
});

test("donor: an unreadable config is reported as a warning carrying the error text", () => {
  clearProviderPresets();
  const root = scratch("nan-default-on-unreadable-");
  mkdirSync(join(root, ".agentic-workflow", "index.json"), { recursive: true });
  const previousCwd = process.cwd();
  const savedKey = process.env.NAN_API_KEY;
  process.chdir(root);
  process.env.NAN_API_KEY = "sk-nan";
  const reports = [];
  try {
    resetEmbedDefaultReports();
    applyEmbedDefault({ report: (line, kind) => reports.push({ line, kind }) });
    assert.equal(reports.length, 1, "a refusal is never silent — the operator has to act on it");
    assert.equal(reports[0].kind, "warning");
    assert.match(reports[0].line, /EISDIR/u, "and it carries the error text, not a generic failure");
  } finally {
    process.chdir(previousCwd);
    if (savedKey === undefined) delete process.env.NAN_API_KEY;
    else process.env.NAN_API_KEY = savedKey;
    clearProviderPresets();
  }
});

test("donor: a withhold that carries no detail stays silent", () => {
  clearProviderPresets();
  const root = projectWith({ version: 1, provider: { baseUrl: "https://acme.example/v1", model: "m", envVar: "ACME_API_KEY" } });
  const previousCwd = process.cwd();
  const savedKey = process.env.NAN_API_KEY;
  process.chdir(root);
  process.env.NAN_API_KEY = "sk-nan";
  const reports = [];
  try {
    resetEmbedDefaultReports();
    applyEmbedDefault({ report: (line, kind) => reports.push({ line, kind }) });
    assert.deepEqual(reports, [], "an operator's own block is not news");
  } finally {
    process.chdir(previousCwd);
    if (savedKey === undefined) delete process.env.NAN_API_KEY;
    else process.env.NAN_API_KEY = savedKey;
    clearProviderPresets();
  }
});
