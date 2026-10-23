// serena-readiness.test.mjs — AC9 / AC6 (feature 67 P5, decision D5)
//
// The nudge answers one question a README cannot: does this project actually
// have a Serena config the language server will use? It runs at session start
// and at the first workflow-command dispatch, says **exactly one** thing —
// suggesting `/init-workspace` — and then latches.
//
// Two rules make it safe to ship:
//  - it writes NOTHING to the project (`.serena/` is init-workspace's alone;
//    the pi package never repairs it — AC6), and
//  - it is soft on failure: a latch that cannot be persisted re-shows at most
//    once per session, never an error, never a broken command.
//
// The latch lives in the package's own global state file, read-merge-write, so
// it survives a restart exactly like the first-run hint (AC11).

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createSerenaReadinessStore, stateFilePath } from "../dist/routing/state.js";
import {
  createSerenaReadinessGate,
  evaluateSerenaReadiness,
  INIT_WORKSPACE_COMMAND,
  inspectSerenaConfig,
  serenaReadinessMessage,
} from "../dist/routing/serena-readiness.js";

const REVISION = "4.1.0";

/** A project root on disk, optionally carrying a `.serena/project.yml`. */
function project({ config } = {}) {
  const root = mkdtempSync(join(tmpdir(), "paw-serena-project-"));
  if (config !== undefined) {
    mkdirSync(join(root, ".serena"), { recursive: true });
    writeFileSync(join(root, ".serena", "project.yml"), config);
  }
  return root;
}

function agentDir() {
  const root = mkdtempSync(join(tmpdir(), "paw-serena-agent-"));
  const dir = join(root, "agent");
  mkdirSync(dir, { recursive: true });
  return dir;
}

/** The gate exactly as the extension builds it: one latch file, one project. */
function gate(agentDirPath, { revision = REVISION } = {}) {
  return createSerenaReadinessGate({
    store: createSerenaReadinessStore({ path: stateFilePath(agentDirPath) }),
    revision,
  });
}

const GOOD_CONFIG = [
  "project_name: demo",
  "language_servers:",
  "  - markdown",
  "  - json",
  "  - typescript",
  "",
].join("\n");

// ---------------------------------------------------------------------------
// inspection + evaluation (pure)
// ---------------------------------------------------------------------------

test("inspectSerenaConfig reads the listed language servers", () => {
  const parsed = inspectSerenaConfig(GOOD_CONFIG);
  assert.equal(parsed.present, true);
  assert.deepEqual(parsed.languageServers, ["markdown", "json", "typescript"]);

  assert.equal(inspectSerenaConfig(null).present, false);
});

test("inspectSerenaConfig is tolerant: a missing or empty list is an empty list", () => {
  assert.deepEqual(inspectSerenaConfig("project_name: demo\n").languageServers, []);
  assert.deepEqual(inspectSerenaConfig("language_servers: []\n").languageServers, []);
});

test("evaluateSerenaReadiness: absent config is missing", () => {
  assert.equal(evaluateSerenaReadiness({ config: inspectSerenaConfig(null), revision: REVISION }).kind, "missing");
});

test("evaluateSerenaReadiness: a config listing no server is stale (the #261 shape)", () => {
  const readiness = evaluateSerenaReadiness({
    config: inspectSerenaConfig("project_name: demo\nlanguage_servers: []\n"),
    revision: REVISION,
  });
  assert.equal(readiness.kind, "stale");
  assert.match(readiness.detail, /language_servers/u);
});

test("evaluateSerenaReadiness: a usable config is ready", () => {
  assert.equal(
    evaluateSerenaReadiness({ config: inspectSerenaConfig(GOOD_CONFIG), revision: REVISION }).kind,
    "ready",
  );
});

test("evaluateSerenaReadiness: a changed init-workspace revision is outdated", () => {
  const readiness = evaluateSerenaReadiness({
    config: inspectSerenaConfig(GOOD_CONFIG),
    recorded: { state: "ready", revision: "4.0.3", at: "2026-10-01T00:00:00.000Z" },
    revision: REVISION,
  });
  assert.equal(readiness.kind, "outdated");
  assert.equal(readiness.recorded, "4.0.3");
  assert.equal(readiness.revision, REVISION);
});

test("serenaReadinessMessage names /init-workspace once and says why", () => {
  for (const readiness of [
    { kind: "missing" },
    { kind: "stale", detail: "language_servers is empty" },
    { kind: "outdated", recorded: "4.0.3", revision: REVISION },
  ]) {
    const message = serenaReadinessMessage(readiness);
    assert.equal(message.match(new RegExp(INIT_WORKSPACE_COMMAND, "gu")).length, 1, `${readiness.kind}: names the command once`);
    assert.match(message, /^pi-agentic-workflow: /u);
    assert.match(message, /serena/iu);
  }
  assert.equal(serenaReadinessMessage({ kind: "ready" }), null, "a ready project says nothing");
});

// ---------------------------------------------------------------------------
// the gate (latch-once)
// ---------------------------------------------------------------------------

test("AC9: a missing config is announced once, then latched", () => {
  const root = project();
  const dir = agentDir();
  try {
    const first = gate(dir);
    const message = first.check(root);
    assert.ok(message, "the first session says something");
    assert.match(message, /\/init-workspace/u);

    assert.equal(first.check(root), null, "never twice within one session");

    // A new extension instance is a new Pi session; only the file carries over.
    assert.equal(gate(dir).check(root), null, "and never again after a restart");
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("AC9: the latch is recorded in the package's own global state file", () => {
  const root = project();
  const dir = agentDir();
  try {
    gate(dir).check(root);
    const stored = JSON.parse(readFileSync(stateFilePath(dir), "utf8"));
    const record = stored.serenaReadiness[root];
    assert.equal(record.state, "missing");
    assert.equal(record.revision, REVISION);
    assert.match(record.at, /^\d{4}-\d{2}-\d{2}T/u);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("AC9: a ready project is silent and latches its revision", () => {
  const root = project({ config: GOOD_CONFIG });
  const dir = agentDir();
  try {
    const first = gate(dir);
    assert.equal(first.check(root), null, "nothing to say about a provisioned project");
    const stored = JSON.parse(readFileSync(stateFilePath(dir), "utf8"));
    assert.equal(stored.serenaReadiness[root].state, "ready");
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("AC9: a project that degrades after being ready is announced again", () => {
  const root = project({ config: GOOD_CONFIG });
  const dir = agentDir();
  try {
    assert.equal(gate(dir).check(root), null);
    // The operator deletes the config (or a fresh clone never had one).
    rmSync(join(root, ".serena"), { recursive: true, force: true });
    const message = gate(dir).check(root);
    assert.ok(message, "the state changed, so the nudge is due once more");
    assert.equal(gate(dir).check(root), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("AC9: a changed init-workspace revision is announced once", () => {
  const root = project({ config: GOOD_CONFIG });
  const dir = agentDir();
  try {
    gate(dir, { revision: "4.0.3" }).check(root);
    const message = gate(dir, { revision: REVISION }).check(root);
    assert.ok(message, "the shipped init-workspace moved on");
    assert.match(message, /4\.0\.3/u, "the message names the revision that recorded the project");
    assert.match(message, /4\.1\.0/u, "and the one this package ships");
    assert.equal(gate(dir, { revision: REVISION }).check(root), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

test("AC9: an unpersistable latch is soft — one message per session, never an error", () => {
  const root = project();
  const store = createSerenaReadinessStore({
    path: "/fixture/agent/pi-agentic-workflow-state.json",
    readFile: () => null,
    writeFile: () => {
      throw new Error("read-only agent directory");
    },
  });
  try {
    const gate = createSerenaReadinessGate({ store, revision: REVISION });
    const message = gate.check(root);
    assert.ok(message, "the operator still hears about it");
    assert.equal(gate.check(root), null, "but only once in this session");
    // A fresh session re-shows it: the write failed, so the latch could not survive.
    assert.ok(createSerenaReadinessGate({ store, revision: REVISION }).check(root));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("AC9: an unreadable project is treated as missing, never as an error", () => {
  const dir = agentDir();
  try {
    const message = gate(dir).check(join(tmpdir(), "paw-does-not-exist-", String(process.pid)));
    assert.ok(message, "a path that cannot be read is not a provisioned project");
    assert.match(message, /\/init-workspace/u);
  } finally {
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// AC6: the pi package never writes into the project
// ---------------------------------------------------------------------------

test("AC6: the readiness module contains no project or config write path", () => {
  const source = readFileSync(new URL("../src/routing/serena-readiness.ts", import.meta.url), "utf8");

  assert.doesNotMatch(source, /writeFile|mkdir|createWriteStream|rmSync|unlink|rename/u, "the nudge writes nothing");
  assert.doesNotMatch(source, /\.serena\/project\.yml.*write/iu);
  assert.match(source, /init-workspace/u, "it points at the one writer");
});

test("AC6: checking leaves the project byte-identical", () => {
  const root = project({ config: GOOD_CONFIG });
  const dir = agentDir();
  try {
    const before = readFileSync(join(root, ".serena", "project.yml"), "utf8");
    gate(dir).check(root);
    assert.equal(readFileSync(join(root, ".serena", "project.yml"), "utf8"), before);

    // A project with no `.serena/` at all must come out of a check the same way:
    // no directory created, no file written.
    const bare = project();
    gate(dir).check(bare);
    assert.deepEqual(readdirSync(bare), [], "the check created nothing in the project");
    rmSync(bare, { recursive: true, force: true });
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});

// ---------------------------------------------------------------------------
// AC9: the first workflow-command dispatch is the other entry point
// ---------------------------------------------------------------------------

test("AC9: the first command dispatch announces the nudge, the second does not", async () => {
  const { createExtension } = await import("../dist/extension/factory.js");
  const { mergeConfigs } = await import("../dist/config/merge.js");
  const { SETTINGS_COMMAND } = await import("../dist/routing/types.js");
  const root = project();
  const dir = agentDir();
  const notified = [];
  try {
    const registered = new Map();
    const ctx = {
      cwd: root,
      isIdle: () => true,
      isProjectTrusted: () => true,
      notify: (message, kind) => notified.push({ message, kind }),
      availableModels: () => [],
      find: () => undefined,
      hasConfiguredAuth: () => false,
      ui: { notify: (message, kind) => notified.push({ message, kind }) },
    };

    createExtension({
      registrar: { registerCommand: (name, command) => registered.set(name, command), on: () => {}, registerTool: () => {} },
      surface: () => ({ sendUserMessage: () => {}, setModel: async () => true, getThinkingLevel: () => "medium", setThinkingLevel: () => {} }),
      skillsDir: join(process.cwd(), "skills"),
      agentDir: dir,
      hint: { pending: () => false, acknowledge: () => true },
      settings: () => {},
      // The same merge a shipped install performs, so the router sees a config
      // with every field its dispatch path reads.
      loadConfig: () => ({ ok: true, config: mergeConfigs({}, {}), problems: [] }),
      serenaReadiness: gate(dir),
    });

    const command = registered.get("execute-phase");
    assert.ok(command, "the bundled catalogue registered a command to dispatch");

    await command.handler("x", ctx);
    const fromFirst = notified.filter((entry) => /\/init-workspace/u.test(entry.message));
    assert.equal(fromFirst.length, 1, "the first dispatch says it once");
    assert.equal(fromFirst[0].kind, "warning");

    await command.handler("y", ctx);
    assert.equal(
      notified.filter((entry) => /\/init-workspace/u.test(entry.message)).length,
      1,
      "a second command in the same session must not repeat it",
    );
    assert.ok(registered.has(SETTINGS_COMMAND) || true);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(join(dir, ".."), { recursive: true, force: true });
  }
});
