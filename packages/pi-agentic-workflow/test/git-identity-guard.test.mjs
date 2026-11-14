#!/usr/bin/env node
/**
 * git-identity-guard.test.mjs — the agent-side config-write guard (issue #514
 * S2). Every case is a command line a model could hand the bash tool and the
 * verdict the guard must return, plus the consent lifecycle that keeps the guard
 * from asking forever or from asking nobody.
 *
 * The guard is pure: no Pi value, no session, and the consent store is a file in
 * a temp directory. That is what lets the whole contract be asserted here instead
 * of against a live session.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  applyGitIdentityGuard,
  consentKey,
  decideGitConfigCall,
  findGitConfigWrites,
  guardOptions,
  isIdentityKey,
  normalizeGitIdentity,
  scratchDirs,
} from "../dist/guards/git-identity.js";
import { createGitIdentityConsentStore } from "../dist/guards/git-identity-consent.js";

const CWD = "/work/project";
const SCRATCH = scratchDirs({ TMPDIR: "/tmp" });
const ASK = (overrides = {}) => guardOptions({ agentGuard: { mode: "ask", allow: [] }, ...overrides }, CWD, SCRATCH);
const BLOCK = (overrides = {}) => guardOptions({ agentGuard: { mode: "block", allow: [] }, ...overrides }, CWD, SCRATCH);

const verdict = (command, options = ASK()) => decideGitConfigCall(command, options).action;

test("both syntaxes: a legacy flag write and a modern subcommand write both ask", () => {
  for (const command of [
    "git config user.email t@example.test",
    "git config user.name Fixture",
    "git config --unset user.name",
    "git config --unset-all user.email",
    "git config --replace-all user.signingkey ABC",
    "git config --add user.email second@example.test",
    "git config set user.name Fixture",
    "git config unset user.email",
    "git config remove-section user",
    "git config rename-section user account",
    "git config edit",
    "git config commit.gpgsign true",
    "git config gpg.format ssh",
    "git config user.signingkey ABCDEF",
  ]) {
    assert.deepEqual(verdict(command), "ask", command);
  }
});

test("a block-mode project never asks — it blocks the same writes", () => {
  assert.deepEqual(verdict("git config user.email t@example.test", BLOCK()), "block");
  assert.deepEqual(verdict("git config unset user.email", BLOCK()), "block");
});

test("read-only invocations and per-invocation -c passthrough pass", () => {
  for (const command of [
    "git config --get user.name",
    "git config --get-all user.email",
    "git config --get-regexp ^user",
    "git config --list",
    "git config -l --show-origin",
    "git config --show-origin --get-all user.name",
    "git config get user.email",
    "git config list --show-origin",
    "git -c user.name=one-off commit -m message",
    "git -c commit.gpgsign=false -c user.email=fixture@example.test commit -m message",
  ]) {
    assert.deepEqual(verdict(command), "allow", command);
  }
});

test("a read-only invocation still passes with the key named after the verb", () => {
  const writes = findGitConfigWrites("git config --get user.name");
  assert.deepEqual(writes, []);
});

test("scope escalation asks even for a non-identity key, and a scratch --file passes", () => {
  assert.deepEqual(verdict("git config --global user.name Example"), "ask");
  assert.deepEqual(verdict("git config --system core.autocrlf true"), "ask");
  assert.deepEqual(verdict("git config --worktree user.name Example"), "ask");
  assert.deepEqual(verdict("git config --file ~/.gitconfig user.email x@example.test"), "ask");
  assert.deepEqual(verdict("git config --file /work/project/.git/config user.name Example"), "ask");
  assert.deepEqual(verdict("git config --file /tmp/fixture.gitconfig user.email t@example.test"), "allow");
  assert.deepEqual(verdict("git config --file /var/tmp/fixture.gitconfig user.email t@example.test"), "allow");
});

test("the override allows a named local write and keeps every other rule", () => {
  const options = ASK({ agentGuard: { mode: "ask", allow: ["user.name", "User.Email"] } });
  assert.deepEqual(verdict("git config user.name Fixture", options), "allow");
  assert.deepEqual(verdict("git config user.email human@example.com", options), "allow");
  assert.deepEqual(verdict("git config user.signingkey ABC", options), "ask", "an unlisted key still asks");
  assert.deepEqual(verdict("git config --global user.name Fixture", options), "ask", "the allow list never opens a shared file");
  assert.deepEqual(verdict("git config --unset user.name", options), "ask", "the allow list never authorises a removal");
  assert.deepEqual(verdict("git config --file /tmp/x.gitconfig user.name Fixture", options), "allow", "scratch stays hermetic");
});

test("non-identity git operations always pass", () => {
  for (const command of [
    "git status --porcelain",
    "git commit -m message",
    "git push origin HEAD",
    "git config core.autocrlf true",
    "git config merge.docs-generated.driver 'node scripts/driver.mjs %O %A %B'",
    "git log --oneline -3",
    "bun test scripts/x.test.mjs",
  ]) {
    assert.deepEqual(verdict(command), "allow", command);
  }
});

test("a multi-write command is judged on its offending write, not its first", () => {
  assert.deepEqual(verdict("git config core.autocrlf true && git config user.email t@example.test"), "ask");
  assert.deepEqual(verdict("git config core.autocrlf true; git config core.filemode false"), "allow");
  const verdictBlocked = decideGitConfigCall("git config core.autocrlf true && git config user.email t@example.test", BLOCK());
  assert.equal(verdictBlocked.action, "block");
  assert.match(verdictBlocked.reason, /user\.email/);
});

test("the reason names the diagnosis and never the inverted repair form", () => {
  for (const command of ["git config user.email t@example.test", "git config --unset user.name", "git config --global gpg.format ssh"]) {
    const decision = decideGitConfigCall(command, ASK());
    assert.match(decision.reason, /git config --show-origin --get-all/);
    assert.doesNotMatch(decision.reason, /user\.name --unset/, "the inverted form must never be suggested");
  }
  const destructive = decideGitConfigCall("git config --unset user.name", ASK());
  assert.match(destructive.reason, /git config --unset user\.name/, "the correct form is stated for a removal");
});

test("the identity-key class is what the guard protects", () => {
  for (const key of ["user.name", "user.email", "user.signingkey", "commit.gpgsign", "tag.gpgsign", "gpg.format", "gpg.ssh.program", "author.name", "committer.email"]) {
    assert.equal(isIdentityKey(key), true, key);
  }
  for (const key of ["core.autocrlf", "merge.docs-generated.driver", "advice.detachedhead", null]) {
    assert.equal(isIdentityKey(key), false, String(key));
  }
});

test("the boundary is stated, not implied: variable indirection is not seen", () => {
  assert.deepEqual(findGitConfigWrites("c=config; git $c user.email t@example.test"), []);
  assert.deepEqual(verdict("c=config; git $c user.email t@example.test"), "allow");
});

test("normalizeGitIdentity fills the shipped values and refuses a foreign mode", () => {
  assert.deepEqual(normalizeGitIdentity(undefined), { enforce: "off", approved: {}, agentGuard: { mode: "ask", allow: [] } });
  assert.deepEqual(normalizeGitIdentity({ enforce: "nope", agentGuard: { mode: "nope", allow: ["user.name", 7] } }), {
    enforce: "off",
    approved: {},
    agentGuard: { mode: "ask", allow: ["user.name"] },
  });
  assert.equal(normalizeGitIdentity({ enforce: "commit-and-push" }).enforce, "commit-and-push");
  // Issue #546: the push scope and its commit-and-push combination are values,
  // never normalized away as foreign.
  assert.equal(normalizeGitIdentity({ enforce: "push-upstream" }).enforce, "push-upstream");
  assert.equal(normalizeGitIdentity({ enforce: "commit-and-push-upstream" }).enforce, "commit-and-push-upstream");
});

/* ── the consent lifecycle (O6) ───────────────────────────────────────── */

function tempStore(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "identity-consent-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return { path: path.join(dir, "state.json"), dir };
}

test("an approval is per project and per scope+key, and it persists", (t) => {
  const { path: file } = tempStore(t);
  const store = createGitIdentityConsentStore({ path: file, now: () => "2026-11-12T00:00:00Z" });
  assert.equal(store.approved("/work/project", "local:user.name"), false);
  assert.equal(store.remember("/work/project", "local:user.name"), true);
  assert.equal(store.approved("/work/project", "local:user.name"), true);
  assert.equal(store.approved("/work/project", "local:user.email"), false, "a key approval is not a blanket approval");
  assert.equal(store.approved("/work/other", "local:user.name"), false, "another project is not covered");
  const reread = createGitIdentityConsentStore({ path: file });
  assert.equal(reread.approved("/work/project", "local:user.name"), true, "the approval survives a new session");
});

test("a corrupt consent file is no approval, never a crash", (t) => {
  const { path: file } = tempStore(t);
  fs.writeFileSync(file, "{ not json");
  const store = createGitIdentityConsentStore({ path: file });
  assert.equal(store.approved("/work/project", "local:user.name"), false);
  assert.equal(store.remember("/work/project", "local:user.name"), true);
  assert.equal(store.approved("/work/project", "local:user.name"), true);
});

function host(overrides = {}) {
  const asks = [];
  const remembered = [];
  return {
    asks,
    remembered,
    interactive: true,
    approved: () => false,
    remember: (key) => {
      remembered.push(key);
      return true;
    },
    confirm: async (question) => {
      asks.push(question);
      return overrides.answer ?? true;
    },
    notify: () => {},
  };
}

test("a headless session blocks instead of asking, and says why", async () => {
  const h = { ...host(), interactive: false };
  const result = await applyGitIdentityGuard("git config user.email t@example.test", ASK(), h);
  assert.equal(result.block, true);
  assert.match(result.reason, /cannot ask/);
  assert.equal(h.asks.length, 0, "no prompt is possible headless");
});

test("an interactive approval is remembered and never asked twice", async () => {
  const h = host();
  const first = await applyGitIdentityGuard("git config user.name Fixture", ASK(), h);
  assert.equal(first.block, false);
  assert.equal(h.asks.length, 1);
  assert.deepEqual(h.remembered, ["local:user.name"]);

  const approved = new Set(h.remembered);
  const second = { ...host(), approved: (key) => approved.has(key), asks: [] };
  const again = await applyGitIdentityGuard("git config user.name Another", ASK(), second);
  assert.equal(again.block, false);
  assert.equal(second.asks.length, 0, "the stored consent answers the question");
});

test("a refused prompt blocks the write", async () => {
  const h = host({ answer: false });
  const result = await applyGitIdentityGuard("git config user.email t@example.test", ASK(), h);
  assert.equal(result.block, true);
  assert.match(result.reason, /Not approved/);
  assert.deepEqual(h.remembered, [], "a refusal is never persisted as consent");
});

test("the consent key names scope and key, so a value change is the same decision", () => {
  assert.equal(consentKey({ verb: "set", key: "user.name", scope: "local" }), "local:user.name");
  assert.equal(consentKey({ verb: "unset", key: "user.email", scope: "local" }), "local:user.email");
});

/* ── the shipped entry's tool_call wiring (S2) ────────────────────────── */

/** A Pi double: the entry registers its handlers here and returns nothing. */
function piDouble() {
  const handlers = new Map();
  const api = {
    on: (event, handler) => {
      if (!handlers.has(event)) handlers.set(event, []);
      handlers.get(event).push(handler);
    },
    registerCommand: () => {},
    getCommands: () => [],
    getMcpServers: () => [],
    sendUserMessage: () => {},
    setModel: () => {},
    getThinkingLevel: () => "off",
    setThinkingLevel: () => {},
  };
  return {
    api,
    handlers,
    handler: (event) => handlers.get(event)?.[0],
  };
}

function wiredContext(cwd, { hasUI = false, confirmed = true, notified = [] } = {}) {
  return {
    cwd,
    hasUI,
    mode: hasUI ? "tui" : "print",
    model: { provider: "anthropic", id: "claude-sonnet-4-5" },
    isIdle: () => true,
    isProjectTrusted: () => true,
    ui: {
      notify: (message, kind) => notified.push([message, kind]),
      select: () => undefined,
      input: () => undefined,
      confirm: async () => confirmed,
    },
    modelRegistry: { find: () => undefined, hasConfiguredAuth: () => false, getAll: () => [] },
  };
}

async function shippedEntry(cwd, agentDir) {
  const previous = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = agentDir;
  try {
    const { default: extension } = await import("../dist/extension/index.js");
    const double = piDouble();
    extension(double.api);
    return double;
  } finally {
    if (previous === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previous;
  }
}

test("wiring: a headless bash `git config user.email` write is blocked before it runs", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "identity-wiring-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const cwd = path.join(root, "repo");
  const agentDir = path.join(root, "agent");
  fs.mkdirSync(cwd, { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });

  const entry = await shippedEntry(cwd, agentDir);
  const toolCall = entry.handler("tool_call");
  const decision = await toolCall({ toolName: "bash", input: { command: "git config user.email t@example.test" } }, wiredContext(cwd));
  assert.equal(decision.block, true);
  assert.match(decision.reason, /show-origin/);
});

test("wiring: read-only and non-config bash calls pass the guard untouched", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "identity-wiring-ok-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const cwd = path.join(root, "repo");
  const agentDir = path.join(root, "agent");
  fs.mkdirSync(cwd, { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });

  const entry = await shippedEntry(cwd, agentDir);
  const toolCall = entry.handler("tool_call");
  for (const command of ["git config --get user.name", "git -c user.name=one-off commit -m x", "git status --porcelain"]) {
    assert.equal(await toolCall({ toolName: "bash", input: { command } }, wiredContext(cwd)), undefined, command);
  }
});

test("wiring: an interactive approval is asked once and remembered", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "identity-wiring-ask-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const cwd = path.join(root, "repo");
  const agentDir = path.join(root, "agent");
  fs.mkdirSync(cwd, { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });

  const entry = await shippedEntry(cwd, agentDir);
  const toolCall = entry.handler("tool_call");
  const notified = [];
  const first = await toolCall({ toolName: "bash", input: { command: "git config user.name Fixture" } }, wiredContext(cwd, { hasUI: true, notified }));
  assert.equal(first, undefined, "an approved write proceeds");
  assert.ok(notified.some(([message]) => /approved/.test(message)), "the approval is announced");

  const second = await toolCall({ toolName: "bash", input: { command: "git config user.name Another" } }, wiredContext(cwd, { hasUI: true }));
  assert.equal(second, undefined, "the stored consent answers the second question");
  assert.equal(fs.existsSync(path.join(agentDir, "git-identity-consent.json")), true);
});

test("wiring: a refused prompt blocks and persists nothing", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "identity-wiring-no-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const cwd = path.join(root, "repo");
  const agentDir = path.join(root, "agent");
  fs.mkdirSync(cwd, { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });

  const entry = await shippedEntry(cwd, agentDir);
  const decision = await entry.handler("tool_call")(
    { toolName: "bash", input: { command: "git config user.email t@example.test" } },
    wiredContext(cwd, { hasUI: true, confirmed: false }),
  );
  assert.equal(decision.block, true);
  assert.equal(fs.existsSync(path.join(agentDir, "git-identity-consent.json")), false);
});
