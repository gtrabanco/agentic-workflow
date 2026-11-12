// log-session-command.test.mjs — the code door and the settled turn
// (issue #429, S2/S3/S4/S5; obligations O3, O4, O6, O8, O9, O13).
//
// What this suite owns that the core suite cannot: the name `/log-session` is
// claimed exactly once (Pi would suffix a duplicate into `/log-session:1`), the
// handler's directive carries the writer's bytes unmodified, the prose door's
// commands are the same two commands, a dispatch that never ran claims no
// invocation, and the settled turn says the miss out loud.
//
// The differential pin is here too: every *other* catalogue command must still
// send `/skill:<name>` with its arguments verbatim. Nothing that was asked for
// is allowed to ride along in the change.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

import { createExtension } from "../dist/extension/factory.js";
import { readCatalogue } from "../dist/routing/catalogue.js";
import {
  LOG_SESSION_COMMAND,
  createInvocationWatch,
  registerLogSessionCommand,
} from "../dist/extension/log-session-command.js";
import { invocationMarkerPath, planInvocation } from "../dist/log-session-invocation.js";
import { JOURNAL_DIR } from "@gtrabanco/agentic-workflow/src/journal/fragment.mjs";
import { runtimeBin } from "../dist/runtime.js";
import { ADVANCE_COMMAND, AW_INDEX_COMMAND, SETTINGS_COMMAND, SETTINGS_COMMAND_ALIAS } from "../dist/routing/types.js";
import { configFor, modelRef } from "./helpers/session.mjs";
import { sandboxGitEnv } from "./git-sandbox.mjs";

const PKG_DIR = resolve(import.meta.dirname, "..");
const BUNDLE_SKILLS = join(PKG_DIR, "skills");
const WRITER_SOURCE = resolve(PKG_DIR, "..", "..", "scripts", "session-close.mjs");
const WRITER_MODULES = [
  "packages/agentic-workflow/src/journal/fragment.mjs",
  "packages/agentic-workflow/src/journal/block.mjs",
  "packages/agentic-workflow/src/log/render.mjs",
];
const SESSION = "429-command";

const skillFile = (name) =>
  `---\nname: ${name}\ndescription: The ${name} door.\nuser-invocable: true\n---\n\nRun ${name}.\n`;

/** A registrar double that records every name Pi was handed. */
function recorder() {
  const registered = new Map();
  const names = [];
  return {
    registered,
    names,
    registrar: {
      registerCommand: (name, options) => {
        names.push(name);
        registered.set(name, options);
      },
    },
  };
}

/**
 * `createExtension` over a skills tree, with the writer run injectable — the
 * seams the shipped adapter leaves to the runtime, this suite owns.
 */
function extensionOver(skillsDir, { cwd = "/fixture/repo", logSession = {}, config = configFor({}) } = {}) {
  const { registered, names, registrar } = recorder();
  const calls = { send: [], notify: [] };
  const state = { model: modelRef("anthropic/claude-sonnet-4-5"), thinking: "medium", idle: true, trusted: true };
  const surface = () => ({
    sendUserMessage: (content, options) => calls.send.push({ content, options }),
    setModel: async () => true,
    getThinkingLevel: () => state.thinking,
    setThinkingLevel: (level) => {
      state.thinking = level;
    },
  });
  const handle = createExtension({
    registrar,
    surface,
    skillsDir,
    agentDir: "/fixture/agent",
    hint: { pending: () => false, acknowledge: () => true },
    loadConfig: () => ({ ok: true, config, problems: [] }),
    settings: ({ ctx }) => ctx.notify("settings"),
    logSession,
  });
  const context = (over = {}) => ({
    cwd,
    model: state.model,
    isIdle: () => state.idle,
    isProjectTrusted: () => state.trusted,
    notify: (message, kind) => calls.notify.push({ message, kind }),
    ui: { select: async () => undefined, input: async () => undefined, confirm: async () => undefined, notify: () => {}, pick: async () => undefined },
    availableModels: () => [state.model],
    find: () => undefined,
    hasConfiguredAuth: () => false,
    sessionId: SESSION,
    ...over,
  });
  return { ...handle, registered, names, calls, context, state };
}

/** A skills tree with the log-session door and one ordinary command beside it. */
function skillsTree(names = ["log-session", "review-code"]) {
  const root = mkdtempSync(join(tmpdir(), "log-session-skills-"));
  const skillsDir = join(root, "skills");
  for (const name of names) {
    mkdirSync(join(skillsDir, name), { recursive: true });
    writeFileSync(join(skillsDir, name, "SKILL.md"), skillFile(name));
  }
  return { root, skillsDir };
}

/** A throwaway git project; `writer` copies this repository's own script in. */
function project({ journal = false, carrier = false, writer = false } = {}) {
  const root = mkdtempSync(join(tmpdir(), "log-session-command-"));
  const git = (args) => execFileSync("git", ["-c", "user.name=suite", "-c", "user.email=suite@example.test", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8", env: sandboxGitEnv() });
  git(["init", "-q", "-b", "test-branch"]);
  mkdirSync(join(root, "docs"), { recursive: true });
  if (journal) writeFileSync(join(root, "docs/LOGS.md"), "# Session log\n\nentry bytes\n");
  if (carrier) mkdirSync(join(root, JOURNAL_DIR), { recursive: true });
  if (writer) {
    mkdirSync(join(root, "scripts"), { recursive: true });
    writeFileSync(join(root, "scripts/session-close.mjs"), readFileSync(WRITER_SOURCE, "utf8"));
    // The writer imports the crate's one block owner and fragment predicate
    // (issue #452), so a project that ships the script ships those modules
    // beside it — the fixture copies exactly what the script resolves.
    for (const rel of WRITER_MODULES) {
      mkdirSync(join(root, dirname(rel)), { recursive: true });
      writeFileSync(join(root, rel), readFileSync(resolve(PKG_DIR, "..", "..", rel), "utf8"));
    }
  }
  writeFileSync(join(root, "seed.txt"), "seed\n");
  git(["add", "."]);
  git(["commit", "-q", "-m", "seed"]);
  return { root, git };
}

const cleanup = (...roots) => roots.forEach((root) => rmSync(root, { recursive: true, force: true }));

// ---------------------------------------------------------------------------
// O3 — one name, claimed once, by code
// ---------------------------------------------------------------------------

test("O3: one command named log-session, and it is the code handler", async () => {
  const tree = skillsTree();
  const repo = project({ journal: true });
  try {
    const { registered, names, calls, context } = extensionOver(tree.skillsDir, { cwd: repo.root });
    assert.equal(names.filter((name) => name === LOG_SESSION_COMMAND).length, 1, "Pi would suffix a second registration into /log-session:1");
    assert.deepEqual(
      names.slice().sort(),
      [LOG_SESSION_COMMAND, "review-code", ADVANCE_COMMAND, AW_INDEX_COMMAND, SETTINGS_COMMAND, SETTINGS_COMMAND_ALIAS].sort(),
    );
    assert.ok(readCatalogue(tree.skillsDir).commands.some((command) => command.name === LOG_SESSION_COMMAND), "the catalogue keeps the entry, so routing and the console still know the name");

    await registered.get(LOG_SESSION_COMMAND).handler("", context());
    const sent = calls.send.find((entry) => entry.content.startsWith("/skill:log-session"));
    assert.ok(sent, "the prose door is still what the model receives");
    assert.notEqual(sent.content, "/skill:log-session", "with the resolved values carried along");
    assert.match(sent.content, new RegExp(`\\.pi/\\.session-${SESSION}\\.log-session`), "the record it wrote is named in the message");
    assert.equal(existsSync(invocationMarkerPath(repo.root, SESSION)), true);
  } finally {
    cleanup(tree.root, repo.root);
  }
});

test("O3: every other catalogue command still dispatches its skill with its arguments verbatim", async () => {
  const tree = skillsTree();
  try {
    const { registered, calls, context } = extensionOver(tree.skillsDir);
    await registered.get("review-code").handler("--from-issue 146", context());
    assert.deepEqual(calls.send.map((entry) => entry.content), ["/skill:review-code --from-issue 146"]);
    assert.equal(calls.send[0].options.expandPromptTemplates, true, "the routing chain is the one that already shipped");
  } finally {
    cleanup(tree.root);
  }
});

test("O3: registerLogSessionCommand is the single binding site for the name", () => {
  const { registered, names, registrar } = recorder();
  registerLogSessionCommand(registrar, {
    command: { name: LOG_SESSION_COMMAND, skill: LOG_SESSION_COMMAND },
    dispatch: async () => ({ status: "dispatched", routed: false, hintShown: false }),
    plan: () => {
      throw new Error("the seam, not the writer");
    },
  });
  assert.deepEqual(names, [LOG_SESSION_COMMAND]);
  assert.equal(typeof registered.get(LOG_SESSION_COMMAND).handler, "function");
});

// ---------------------------------------------------------------------------
// O4 — the writer's bytes, unmodified
// ---------------------------------------------------------------------------

test("O4: the facts block is the writer's stdout, byte for byte", async () => {
  const tree = skillsTree();
  const repo = project({ journal: true, writer: true });
  try {
    const direct = spawnSync(process.execPath, [join(repo.root, "scripts/session-close.mjs"), "render", "--kind", "auto"], {
      cwd: repo.root,
      encoding: "utf8",
      env: sandboxGitEnv(),
    });
    assert.equal(direct.status, 0, `the writer itself failed: ${direct.stderr}`);

    // Byte identity: the bytes the writer printed are the bytes the model reads,
    // with nothing added, trimmed or re-formatted between the two.
    const through = extensionOver(tree.skillsDir, { cwd: repo.root, logSession: { run: () => ({ status: 0, stdout: direct.stdout, stderr: "" }) } });
    await through.registered.get(LOG_SESSION_COMMAND).handler("", through.context());
    assert.ok(through.calls.send[0].content.includes(direct.stdout.trimEnd()), "the directive carries the writer's own answer, untouched");
    assert.equal(through.registered.get(LOG_SESSION_COMMAND) !== undefined, true);

    // Not a re-derivation: run the writer twice, independently, and the fact
    // cells agree — the heading's second is the one thing either run owns.
    const real = extensionOver(tree.skillsDir, { cwd: repo.root });
    await real.registered.get(LOG_SESSION_COMMAND).handler("", real.context());
    const record = JSON.parse(readFileSync(invocationMarkerPath(repo.root, SESSION), "utf8"));
    assert.equal(cells(direct.stdout), cells(record.facts), "the handler's run and a direct run state the same commits and files");
    assert.match(record.facts, /^## \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z — test-branch — auto\n/u, "the heading is the writer's shape, branch and all");
  } finally {
    cleanup(tree.root, repo.root);
  }
});

/** The writer's fact cells — everything the entry states except its own second. */
function cells(facts) {
  return facts
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => line.replace(/^## \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/u, "## <stamp>"))
    .join("\n");
}

test("O4: the writer is spawned through the resolved runtime with a sandboxed git env", async () => {
  const tree = skillsTree();
  const repo = project({ journal: true, writer: true });
  const seen = [];
  try {
    const run = (bin, args, options) => {
      seen.push({ bin, args, cwd: options.cwd, env: options.env });
      return { status: 0, stdout: "## stub facts\n- **Commits:** 0\n- **Files:** —\n", stderr: "" };
    };
    const { registered, calls, context } = extensionOver(tree.skillsDir, { cwd: repo.root, logSession: { run } });
    await registered.get(LOG_SESSION_COMMAND).handler("", context());

    assert.equal(seen.length, 1, "one writer run per invocation");
    assert.equal(seen[0].bin, runtimeBin(), "the runtime that launched pi runs the script (bun first, never hardcoded)");
    assert.deepEqual(seen[0].args, [join(repo.root, "scripts/session-close.mjs"), "render", "--kind", "auto"]);
    assert.equal(seen[0].cwd, repo.root, "the script reads the project it was invoked in");
    assert.ok(Object.keys(seen[0].env).includes("AGENTIC_WORKFLOW_RUNTIME"), "the child inherits the runtime decision");
    assert.equal(seen[0].env.GIT_DIR, undefined, "and no ambient git location variable decides where it looks");
    assert.match(calls.send[0].content, /## stub facts/u, "the stub's bytes are what the model reads");
  } finally {
    cleanup(tree.root, repo.root);
  }
});

// ---------------------------------------------------------------------------
// O8 — nothing is claimed for a turn that never ran
// ---------------------------------------------------------------------------

test("O8: a refused dispatch writes no record", async () => {
  const tree = skillsTree();
  const repo = project({ journal: true, writer: true });
  try {
    const { registered, calls, context, state } = extensionOver(tree.skillsDir, { cwd: repo.root });
    // The agent is busy: the router refuses before anything is sent.
    state.idle = false;
    await registered.get(LOG_SESSION_COMMAND).handler("", context());

    assert.equal(existsSync(invocationMarkerPath(repo.root, SESSION)), false, "a refused invocation claims nothing");
    assert.equal(calls.send.length, 0, "and nothing reached the model");
    assert.ok(calls.notify.length > 0, "the refusal is said out loud");
  } finally {
    cleanup(tree.root, repo.root);
  }
});

test("O8: a plan that cannot record claims no invocation", async () => {
  const tree = skillsTree(["log-session"]);
  try {
    const { registered, calls, context } = extensionOver(tree.skillsDir, {
      logSession: {
        plan: () => {
          throw new Error("the record could not be written");
        },
      },
    });
    await registered.get(LOG_SESSION_COMMAND).handler("", context());

    assert.equal(calls.send.length, 0, "no directive is sent for a run that recorded nothing");
    assert.deepEqual(calls.notify.map((entry) => entry.kind), ["error"]);
    assert.match(calls.notify[0].message, /could not be written/);
  } finally {
    cleanup(tree.root);
  }
});

// ---------------------------------------------------------------------------
// O5/O9 — the carrier and the shared writer path, at the door
// ---------------------------------------------------------------------------

test("O9: the directive names the skill's own writer commands", async () => {
  const tree = skillsTree();
  const repo = project({ journal: true, carrier: true, writer: true });
  try {
    const { registered, calls, context } = extensionOver(tree.skillsDir, { cwd: repo.root });
    await registered.get(LOG_SESSION_COMMAND).handler("", context());
    const sent = calls.send[0].content;

    const skill = readFileSync(join(BUNDLE_SKILLS, "log-session", "SKILL.md"), "utf8");
    const ops = (text) => [...text.matchAll(/scripts\/session-close\.mjs (\w+)/g)].map((match) => match[1]).sort();
    const skillOps = [...new Set(ops(skill))];
    const directiveOps = [...new Set(ops(sent))];
    assert.ok(skillOps.includes("render") && skillOps.includes("close"), `the prose door names ${skillOps.join(", ")}`);
    assert.deepEqual(directiveOps, skillOps, "one shared writer path: the code door adds no command and drops none");

    assert.match(sent, new RegExp(`${JOURNAL_DIR}/[^\\s]+\\.md`), "and the carrier's fragment path is the resolved one");
    assert.equal(readdirSync(join(repo.root, JOURNAL_DIR)).length, 0, "the carrier still holds nothing but what was in it: the handler wrote no entry");
  } finally {
    cleanup(tree.root, repo.root);
  }
});

// ---------------------------------------------------------------------------
// O6 — the settled turn says the miss
// ---------------------------------------------------------------------------

test("O6: the miss is named once, an entry that lands clears it, a re-invocation reports again", async () => {
  const repo = project({ journal: true });
  try {
    const watch = createInvocationWatch();
    planInvocation({ root: repo.root, sessionId: SESSION });

    const first = watch.check(repo.root, SESSION);
    assert.match(first, /no entry was written/u);
    assert.match(first, /docs\/LOGS\.md/, "it names the target it waited for");
    assert.equal(watch.check(repo.root, SESSION), null, "the same miss is said once per session");

    writeFileSync(join(repo.root, "docs/LOGS.md"), readFileSync(join(repo.root, "docs/LOGS.md"), "utf8") + "\n## entry\n");
    assert.equal(watch.check(repo.root, SESSION), null, "a delivered entry is silence, and it clears the record");
    assert.equal(existsSync(invocationMarkerPath(repo.root, SESSION)), false);

    planInvocation({ root: repo.root, sessionId: SESSION });
    assert.match(watch.check(repo.root, SESSION), /no entry was written/u, "a second invocation is a new fact to report");
  } finally {
    cleanup(repo.root);
  }
});

test("O6: an unreadable record is named and kept, never dropped by a guess", async () => {
  const repo = project({ journal: true });
  try {
    const file = invocationMarkerPath(repo.root, SESSION);
    mkdirSync(join(repo.root, ".pi"), { recursive: true });
    writeFileSync(file, "not json at all\n");
    const watch = createInvocationWatch();

    const notice = watch.check(repo.root, SESSION);
    assert.match(notice, /does not parse/u);
    assert.equal(existsSync(file), true, "a record the harness cannot read is not this turn's to delete");
    assert.equal(watch.check(repo.root, SESSION), null, "said once");
  } finally {
    cleanup(repo.root);
  }
});

test("O6: a session with no record stays silent", () => {
  const repo = project({ journal: true });
  try {
    assert.equal(createInvocationWatch().check(repo.root, "quiet-session"), null);
  } finally {
    cleanup(repo.root);
  }
});

// ---------------------------------------------------------------------------
// The shipped adapter: the settled event is where the notice is delivered
// ---------------------------------------------------------------------------

test("the shipped entry binds the settled turn to the invocation notice", async () => {
  const root = mkdtempSync(join(tmpdir(), "log-session-adapter-"));
  const agentDir = join(root, "agent");
  const cwd = join(root, "repo");
  mkdirSync(agentDir, { recursive: true });
  mkdirSync(join(cwd, "docs"), { recursive: true });
  writeFileSync(join(cwd, "docs/LOGS.md"), "# Session log\n\nentry bytes\n");
  const previous = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = agentDir;
  const handlers = new Map();
  const notifications = [];
  const api = {
    registerCommand: () => {},
    sendUserMessage: () => {},
    setModel: async () => true,
    getThinkingLevel: () => "medium",
    setThinkingLevel: () => {},
    on: (type, handler) => handlers.set(type, handler),
    getMcpServers: () => [],
  };
  try {
    const { default: extension } = await import("../dist/extension/index.js");
    extension(api);
    const context = {
      cwd,
      mode: "tui",
      hasUI: true,
      ui: { notify: (message) => notifications.push(message), select: async () => undefined, input: async () => undefined, confirm: async () => undefined, custom: async () => undefined },
      sessionManager: { getSessionId: () => SESSION },
      modelRegistry: { getAll: () => [], find: () => undefined, hasConfiguredAuth: () => false },
      model: undefined,
      isIdle: () => true,
      isProjectTrusted: () => true,
      signal: undefined,
      abort: () => {},
      hasPendingMessages: () => false,
      shutdown: () => {},
      getContextUsage: () => undefined,
      compact: () => {},
      getSystemPrompt: () => "",
    };
    handlers.get("session_start")({}, context);
    assert.equal(existsSync(invocationMarkerPath(cwd, SESSION)), false, "starting a session logs nothing");

    planInvocation({ root: cwd, sessionId: SESSION });
    handlers.get("agent_settled")({}, context);
    assert.ok(
      notifications.some((message) => /no entry was written/u.test(message)),
      `the settled turn says it: ${JSON.stringify(notifications)}`,
    );

    writeFileSync(join(cwd, "docs/LOGS.md"), readFileSync(join(cwd, "docs/LOGS.md"), "utf8") + "\n## entry\n");
    planInvocation({ root: cwd, sessionId: "second" });
    handlers.get("agent_settled")({}, context);
    assert.equal(existsSync(invocationMarkerPath(cwd, "second")), true, "a later invocation of the same session is a new report");
  } finally {
    if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previous;
    rmSync(root, { recursive: true, force: true });
  }
});
