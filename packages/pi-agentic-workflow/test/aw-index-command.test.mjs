// aw-index-command.test.mjs — the native `/aw-index` command (issue #443 S5/S9)
//
// What this suite owns: the name is registered by the extension itself (no
// SKILL.md, no catalogue entry), the handler runs the runner crate's own sync
// in the project directory, and the report it prints is rendered from the sync
// envelope's fields alone — pending count, pinned model, the four lastSync
// counts and the degradations. A missing store is not an error (the sync
// creates it), and a failed run is reported, never thrown.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { createExtension } from "../dist/extension/factory.js";
import { readCatalogue } from "../dist/routing/catalogue.js";
import { AW_INDEX_COMMAND, ADVANCE_COMMAND, SETTINGS_COMMAND, SETTINGS_COMMAND_ALIAS } from "../dist/routing/types.js";
import { renderIndexReport } from "../dist/extension/aw-index-command.js";
import { configFor, modelRef } from "./helpers/session.mjs";

const PKG_DIR = resolve(import.meta.dirname, "..");
const REPO_SKILLS = resolve(PKG_DIR, "..", "..", "skills");
const BUNDLE_SKILLS = join(PKG_DIR, "skills");

/** A registrar double that records every name Pi was handed. */
function recorder() {
  const registered = new Map();
  return {
    registered,
    registrar: {
      registerCommand: (name, options) => registered.set(name, options),
    },
  };
}

/** A sync envelope as `agentic-workflow doc --sync --json-only` prints it. */
function syncEnvelope(overrides = {}) {
  return {
    ok: true,
    command: "sync",
    results: [],
    degradations: [],
    store: {
      path: "/fixture/repo/.agentic-workflow/index/index.db",
      present: true,
      files: 630,
      chunks: 6574,
      lastSync: { files_scanned: 630, files_changed: 12, files_deleted: 0, embedded: 3422 },
      pending: 0,
      model: "qwen3-embedding",
      ...(overrides.store ?? {}),
    },
    ...(overrides.degradations ? { degradations: overrides.degradations } : {}),
  };
}

/**
 * `createExtension` over a one-skill tree, with the runner invocation injected
 * so the suite owns argv, cwd and exit status (the seams the shipped adapter
 * leaves to the runtime).
 */
function extensionOver({ run, bin = "bun", skillsDir } = {}) {
  const { registered, registrar } = recorder();
  const calls = { spawns: [], notify: [] };
  const noopContext = {
    cwd: "/fixture/repo",
    model: modelRef("anthropic/claude-sonnet-4-5"),
    isIdle: () => true,
    isProjectTrusted: () => true,
    notify: (message, kind) => calls.notify.push({ message, kind }),
    find: () => undefined,
    hasConfiguredAuth: () => false,
  };
  createExtension({
    registrar,
    surface: () => ({ sendUserMessage: () => {}, setModel: async () => true, getThinkingLevel: () => "medium", setThinkingLevel: () => {} }),
    skillsDir,
    agentDir: "/fixture/agent",
    hint: { pending: () => false, acknowledge: () => true },
    loadConfig: () => ({ ok: true, config: configFor({}), problems: [] }),
    settings: ({ ctx }) => ctx.notify("settings"),
    awIndex: {
      bin,
      run: (request) => {
        calls.spawns.push(request);
        return run ? run(request) : { status: 0, stdout: JSON.stringify(syncEnvelope()), stderr: "" };
      },
    },
  });
  return { registered, calls, noopContext };
}

function oneSkillTree() {
  const root = mkdtempSync(join(tmpdir(), "paw-aw-index-"));
  const skillsDir = join(root, "skills");
  mkdirSync(join(skillsDir, "synthetic"), { recursive: true });
  writeFileSync(
    join(skillsDir, "synthetic", "SKILL.md"),
    "---\nname: synthetic\ndescription: Synthetic fixture skill\nuser-invocable: true\n---\n\nRun synthetic.\n",
  );
  return { root, skillsDir };
}

test("S5: the extension registers /aw-index itself — no skill, no catalogue entry", () => {
  const tree = oneSkillTree();
  try {
    const { registered } = extensionOver({ skillsDir: tree.skillsDir });
    assert.deepEqual(
      [...registered.keys()],
      ["synthetic", ADVANCE_COMMAND, AW_INDEX_COMMAND, SETTINGS_COMMAND, SETTINGS_COMMAND_ALIAS],
      "the native door is registered beside /advance, not from a skill dir",
    );
    assert.equal(typeof registered.get(AW_INDEX_COMMAND).handler, "function");
    assert.ok(registered.get(AW_INDEX_COMMAND).description.length > 0);

    const names = readCatalogue(BUNDLE_SKILLS).commands.map((command) => command.name);
    assert.equal(names.includes(AW_INDEX_COMMAND), false, "no skill may claim the name");
    const repoSkills = readCatalogue(REPO_SKILLS).commands.map((command) => command.name);
    assert.equal(repoSkills.includes(AW_INDEX_COMMAND), false, "no SKILL.md ships for the command");
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
});

test("S5/S9: the handler runs the runner crate's sync in the project directory", async () => {
  const tree = oneSkillTree();
  try {
    const { registered, calls, noopContext } = extensionOver({ skillsDir: tree.skillsDir });
    await registered.get(AW_INDEX_COMMAND).handler("", noopContext);
    assert.equal(calls.spawns.length, 1);
    const spawn = calls.spawns[0];
    assert.equal(spawn.bin, "bun");
    assert.deepEqual(spawn.args.slice(-2), ["--sync", "--json-only"], "the sync is the only operation the command runs");
    assert.ok(spawn.args.includes("doc"), "the runner crate's doc entry point");
    assert.equal(spawn.cwd, "/fixture/repo", "the project directory, never the extension's own");
    assert.equal(calls.notify.at(-1).kind, "info");
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
});

test("S9: the report renders pending, the pinned model, the four lastSync counts and the degradations", async () => {
  const tree = oneSkillTree();
  try {
    const { registered, calls, noopContext } = extensionOver({ skillsDir: tree.skillsDir });
    await registered.get(AW_INDEX_COMMAND).handler("", noopContext);
    const report = calls.notify.at(-1).message;
    assert.match(report, /pending: 0/);
    assert.match(report, /model: qwen3-embedding/);
    assert.match(report, /scanned 630/);
    assert.match(report, /changed 12/);
    assert.match(report, /deleted 0/);
    assert.match(report, /embedded 3422/);
    assert.match(report, /degradations: none/);
    assert.match(report, /chunks: 6574/);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
});

test("S9: a partially embedded store reports its pending count and a null pin", async () => {
  const tree = oneSkillTree();
  try {
    const envelope = syncEnvelope({
      store: { pending: 3442, model: null },
      degradations: ["unavailable-embeddings-provider-down"],
    });
    const { registered, calls, noopContext } = extensionOver({
      skillsDir: tree.skillsDir,
      run: () => ({ status: 0, stdout: JSON.stringify(envelope), stderr: "" }),
    });
    await registered.get(AW_INDEX_COMMAND).handler("", noopContext);
    const report = calls.notify.at(-1).message;
    assert.match(report, /pending: 3442/);
    assert.match(report, /model: none/);
    assert.match(report, /degradations: unavailable-embeddings-provider-down/);
    assert.equal(calls.notify.at(-1).kind, "info", "a declared degradation is an answer, not an error");
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
});

test("S9: safe with no store — the sync creates it and the report still renders", async () => {
  const tree = oneSkillTree();
  try {
    const envelope = syncEnvelope({
      store: { present: true, files: 3, chunks: 4, lastSync: { files_scanned: 3, files_changed: 3, files_deleted: 0, embedded: 4 }, pending: 0, model: "m" },
    });
    const { registered, calls, noopContext } = extensionOver({
      skillsDir: tree.skillsDir,
      run: () => ({ status: 0, stdout: JSON.stringify(envelope), stderr: "" }),
    });
    await registered.get(AW_INDEX_COMMAND).handler("", noopContext);
    const report = calls.notify.at(-1).message;
    assert.match(report, /files: 3/);
    assert.match(report, /chunks: 4/);
    assert.equal(calls.notify.at(-1).kind, "info");
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
});

test("S5: a failed run is reported with its own words, never thrown", async () => {
  const tree = oneSkillTree();
  try {
    const { registered, calls, noopContext } = extensionOver({
      skillsDir: tree.skillsDir,
      run: () => ({ status: 1, stdout: "", stderr: "doc: fetch failed" }),
    });
    await registered.get(AW_INDEX_COMMAND).handler("", noopContext);
    assert.equal(calls.notify.at(-1).kind, "error");
    assert.match(calls.notify.at(-1).message, /fetch failed|exited 1/);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
});

test("S5: unparseable output is an error, never a silently empty report", async () => {
  const tree = oneSkillTree();
  try {
    const { registered, calls, noopContext } = extensionOver({
      skillsDir: tree.skillsDir,
      run: () => ({ status: 0, stdout: "not json", stderr: "" }),
    });
    await registered.get(AW_INDEX_COMMAND).handler("", noopContext);
    assert.equal(calls.notify.at(-1).kind, "error");
    assert.match(calls.notify.at(-1).message, /aw-index/);
  } finally {
    rmSync(tree.root, { recursive: true, force: true });
  }
});

test("S9: the renderer reads the envelope and nothing else", () => {
  const report = renderIndexReport(syncEnvelope());
  assert.deepEqual(Object.keys(syncEnvelope()), ["ok", "command", "results", "degradations", "store"]);
  assert.match(report, /pending: 0 · model: qwen3-embedding/);
  // A store without the additive fields still renders (an older runner).
  const legacy = renderIndexReport(syncEnvelope({ store: { pending: undefined, model: undefined } }));
  assert.match(legacy, /pending: unknown · model: none/);
});

test("S4/S6: the report renders the rejected set and the operator's next step", () => {
  const report = renderIndexReport(
    syncEnvelope({
      degradations: ["embeddings-request-rejected"],
      store: {
        pending: 3,
        rejected: {
          count: 1,
          failures: [
            { status: 400, message: "embeddings provider 400 Bad Request: Context length exceeded for model 'qwen3-embedding'" },
          ],
          chunks: ["docs/a.md#a"],
        },
      },
    }),
  );
  assert.match(report, /rejected: 1 chunk\(s\) · 400/);
  assert.match(report, /Context length exceeded/);
  assert.match(report, /--rebuild/);
  assert.match(report, /3 chunk\(s\) remain unembedded/);
});

test("S4: a clean run says rejected: none and claims no next step", () => {
  const report = renderIndexReport(syncEnvelope());
  assert.match(report, /rejected: none/);
  assert.doesNotMatch(report, /remain unembedded/);
});
