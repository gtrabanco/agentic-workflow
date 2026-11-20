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
// Issue #626: the disposition is a `guard.gitIdentity` value, never a
// `gitIdentity.approved.agentGuard.mode` one. `BLOCK` names today's internal
// verdict for a `deny` disposition, so the whole #514 corpus keeps its meaning.
const ASK = (overrides = {}, mode = "ask") => guardOptions({ ...overrides }, CWD, SCRATCH, mode);
const BLOCK = (overrides = {}) => guardOptions({ ...overrides }, CWD, SCRATCH, "deny");
const ALLOW = (overrides = {}) => guardOptions({ ...overrides }, CWD, SCRATCH, "allow");

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

test("issue #626: an allow disposition passes the same writes untouched", () => {
  for (const command of [
    "git config user.email t@example.test",
    "git config user.name Fixture",
    "git config --unset user.name",
    "git config remove-section user",
    "git config --file /work/project/.git/config core.autocrlf true",
  ]) {
    assert.deepEqual(verdict(command, ALLOW()), "allow", command);
  }
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

/* ── reads are not writes: the positional rule (issue #618) ───────────── */

const IDENTITY_KEYS = ["user.name", "user.email", "user.signingkey", "commit.gpgsign", "tag.gpgsign", "gpg.format", "author.name", "committer.email"];

test("R1: the filed reproducer — one positional derives no write and passes", () => {
  assert.deepEqual(findGitConfigWrites("git config user.name"), []);
  assert.equal(verdict("git config user.name"), "allow");
  assert.equal(verdict("git config user.name", BLOCK()), "allow", "a read is not a write, so the headless posture has nothing to block");
});

test("R2: every identity key reads with one positional, in both postures", () => {
  for (const key of IDENTITY_KEYS) {
    assert.deepEqual(findGitConfigWrites(`git config ${key}`), [], key);
    assert.equal(verdict(`git config ${key}`), "allow", key);
    assert.equal(verdict(`git config ${key}`, BLOCK()), "allow", key);
  }
});

test("R3: a quoted key is the same read", () => {
  for (const command of ["git config 'user.name'", 'git config "user.email"', "git config 'commit.gpgsign'", "git config 'user.signingkey'"]) {
    assert.deepEqual(findGitConfigWrites(command), [], command);
    assert.equal(verdict(command), "allow", command);
  }
});

test("R4: a scope flag with one positional is a read in that scope, not a write", () => {
  for (const command of ["git config --global user.name", "git config --system user.email", "git config --worktree user.name", "git config --local user.email"]) {
    assert.deepEqual(findGitConfigWrites(command), [], command);
    assert.equal(verdict(command), "allow", command);
  }
});

test("R5: a file or type option with one positional is the same read", () => {
  for (const command of [
    "git config --file /tmp/aw618-fixture.gitconfig user.name",
    "git config --file /work/project/.git/config user.email",
    "git config -f /tmp/aw618-fixture.gitconfig commit.gpgsign",
    "git config --type=bool commit.gpgsign",
  ]) {
    assert.deepEqual(findGitConfigWrites(command), [], command);
    assert.equal(verdict(command), "allow", command);
  }
});

test("R6: the compound command that fired in the wild passes whole", () => {
  const command = "git config user.name; git config user.email; git config commit.gpgsign";
  assert.deepEqual(findGitConfigWrites(command), []);
  assert.equal(verdict(command), "allow");
  assert.equal(verdict(command, BLOCK()), "allow");
});

test("R7: the bare read and the recommended diagnostic agree", () => {
  for (const key of ["user.name", "user.email"]) {
    assert.equal(verdict(`git config ${key}`), "allow", "the bare read passes");
    assert.equal(verdict(`git config --show-origin --get-all ${key}`), "allow", "the form the refusal recommends passes too");
  }
});

test("W1: two positionals are still the implicit set write", () => {
  for (const command of ["git config user.name Fixture", "git config user.email t@example.test", "git config commit.gpgsign false"]) {
    assert.deepEqual(findGitConfigWrites(command), [{ verb: "set", key: command.split(" ")[2], scope: "local" }], command);
    assert.equal(verdict(command), "ask", command);
  }
});

test("W2: three positionals are still a write", () => {
  for (const command of ["git config user.name Fixture Person", "git config user.email t@example.test extra"]) {
    assert.equal(findGitConfigWrites(command).length, 1, command);
    assert.equal(verdict(command), "ask", command);
  }
});

test("W3: an empty value is a value, so it is a write", () => {
  assert.equal(findGitConfigWrites("git config user.name ''").length, 1);
  assert.equal(verdict("git config user.name ''"), "ask");
});

test("W4: a flag after the key is a value, exactly as git reads it", () => {
  for (const command of ["git config user.name --get", "git config user.name --unset", "git config user.name --local"]) {
    assert.equal(findGitConfigWrites(command).length, 1, command);
    assert.equal(verdict(command), "ask", command);
  }
});

/* ── what the shell runs, and what it only carries (issue #618 S7) ────── */

/** A heredoc body quoting the issue's own reproduction, one write per line and one compound line. */
const HEREDOC_BODY = [
  "## Reproduction steps",
  "",
  "- run `git config user.name` and read the value",
  "- git config user.email t@example.test; git config commit.gpgsign false",
  "",
];

function heredocCommand(open, close = "EOF") {
  return [`gh issue create --repo owner/project --title ISSUE --body-file - ${open}`, ...HEREDOC_BODY, close].join("\n");
}

test("H1: a quoted heredoc delimiter carries data, never commands", () => {
  const command = heredocCommand("<<'EOF'");
  assert.deepEqual(findGitConfigWrites(command), []);
  assert.equal(verdict(command, BLOCK()), "allow");
});

test("H2: a bare heredoc delimiter does the same", () => {
  const command = heredocCommand("<<EOF");
  assert.deepEqual(findGitConfigWrites(command), []);
  assert.equal(verdict(command, BLOCK()), "allow");
});

test("H3: a tab-stripped heredoc delimiter does the same", () => {
  const command = ["gh issue create --body-file - <<-EOF", ...HEREDOC_BODY.map((line) => `\t${line}`), "\tEOF"].join("\n");
  assert.deepEqual(findGitConfigWrites(command), []);
  assert.equal(verdict(command, BLOCK()), "allow");
});

test("H4: the live capture shape — a heredoc nested in a quoted command substitution", () => {
  const command = [`gh issue create --repo owner/project --title ISSUE --body "$(cat <<'EOF'`, ...HEREDOC_BODY, "EOF", `)"`].join("\n");
  assert.deepEqual(findGitConfigWrites(command), []);
  assert.equal(verdict(command, BLOCK()), "allow");
});

test("H5: a write on its own line is still a write — the newline is a statement boundary", () => {
  for (const command of ["git config user.email t@example.test\ngit status --porcelain", "cd /work/project\ngit config commit.gpgsign true"]) {
    assert.equal(findGitConfigWrites(command).length, 1, command);
    assert.equal(verdict(command), "ask", command);
  }
});

test("H6: the body ends at its terminator — a write after it is judged", () => {
  const command = ["cat <<'EOF' > /tmp/aw618-note.md", "git config user.name Fixture", "EOF", "git config user.email t@example.test"].join("\n");
  assert.deepEqual(findGitConfigWrites(command), [{ verb: "set", key: "user.email", scope: "local" }]);
  assert.equal(verdict(command), "ask");
});

test("H8: a heredoc with no terminator is ordinary text — bash runs the command anyway", () => {
  for (const command of ["cat <<EOF", "cat <<< 'note'", "echo 'a << b'", "echo \"a << b\" && git status --porcelain"]) {
    assert.deepEqual(findGitConfigWrites(command), [], command);
  }
});

test("B1: backtick substitution is a command, so a write inside it asks", () => {
  assert.equal(verdict("echo `git config user.email t@example.test`"), "ask");
  assert.equal(verdict("for k in x; do echo `git config commit.gpgsign false`; done"), "ask");
});

test("B2: the stated boundary — a backtick span inside a quoted string stays data", () => {
  assert.deepEqual(findGitConfigWrites('echo "`git config user.email t@example.test`"'), []);
});

test("normalizeGitIdentity fills the shipped values and refuses a foreign mode", () => {
  assert.deepEqual(normalizeGitIdentity(undefined, undefined), { enforce: "off", approved: {}, agentGuard: { mode: "ask", allow: [] } });
  assert.deepEqual(normalizeGitIdentity({ enforce: "nope", agentGuard: { allow: ["user.name", 7] } }, { default: "allow" }), {
    enforce: "off",
    approved: {},
    agentGuard: { mode: "allow", allow: ["user.name"] },
  });
  assert.equal(normalizeGitIdentity({ enforce: "commit-and-push" }).enforce, "commit-and-push");
  // Issue #546: the push scope and its commit-and-push combination are values,
  // never normalized away as foreign.
  assert.equal(normalizeGitIdentity({ enforce: "push-upstream" }).enforce, "push-upstream");
  assert.equal(normalizeGitIdentity({ enforce: "commit-and-push-upstream" }).enforce, "commit-and-push-upstream");
});

test("issue #626: the disposition is resolved from `guard`, and a retired mode is inert", () => {
  // The guard's own entry wins over the global default.
  assert.equal(normalizeGitIdentity({}, { default: "allow", gitIdentity: { mode: "deny" } }).agentGuard.mode, "deny");
  // A written `agentGuard.mode` is the retired key: it does not decide anything.
  assert.equal(normalizeGitIdentity({ agentGuard: { mode: "block" } }, undefined).agentGuard.mode, "ask");
  assert.equal(normalizeGitIdentity({ agentGuard: { mode: "allow" } }, undefined).agentGuard.mode, "ask");
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

/* ── the disposition on the wired path (issue #655) ───────────────────── */

// The mode is the project's configured posture (issue #626), and the applier is
// the only path the extension runs: `allow` stands down, `deny` refuses without
// asking, `ask` keeps the consent lifecycle. A headless session blocks in every
// mode except `allow` — an unanswered prompt is not consent, but a disposition
// that never asks has no prompt to wait for.
const ASKING_WRITES = [
  "git config user.name Fixture",
  "git config --global user.email t@example.test",
  "git config --unset user.signingkey",
];

test("M1 — `deny` refuses without opening a dialog, for every write that asks", async () => {
  for (const command of ASKING_WRITES) {
    const h = host();
    const result = await applyGitIdentityGuard(command, BLOCK(), h);
    assert.equal(h.asks.length, 0, `deny never opens a dialog: ${command}`);
    assert.equal(result.block, true, command);
    assert.match(result.reason, /show-origin/, `the write's own repair survives: ${command}`);
  }
});

test("M2 — a `deny` refusal names the disposition, so the silence is never read as a bug", async () => {
  const result = await applyGitIdentityGuard("git config user.name Fixture", BLOCK(), host());
  assert.match(result.reason, /guard\.gitIdentity\.mode/);
  assert.match(result.reason, /deny/);
  assert.match(result.reason, /--show-origin --get-all user\.name/, "the write's own repair survives");
});

test("M3 — `allow` stands down: no dialog, the write passes, nothing is remembered", async () => {
  const h = host();
  for (const command of ASKING_WRITES) {
    const result = await applyGitIdentityGuard(command, ALLOW(), h);
    assert.equal(result.block, false, command);
  }
  assert.equal(h.asks.length, 0, "allow asks nothing");
  assert.deepEqual(h.remembered, [], "allow stores no consent for a later switch back to ask");
});

test("M4 — a headless session blocks in every mode except `allow`", async () => {
  const allowed = { ...host(), interactive: false };
  const allowedResult = await applyGitIdentityGuard("git config user.email t@example.test", ALLOW(), allowed);
  assert.equal(allowedResult.block, false, "allow needs no dialog, so the missing UI is irrelevant");
  assert.equal(allowed.asks.length, 0);

  const denied = { ...host(), interactive: false };
  const deniedResult = await applyGitIdentityGuard("git config user.email t@example.test", BLOCK(), denied);
  assert.equal(deniedResult.block, true);
  assert.doesNotMatch(deniedResult.reason, /cannot ask/, "deny refuses on its own terms, not for want of a UI");
});

test("M5 — the pure decision and the applied verdict agree for every command × mode", async () => {
  const corpus = [
    ...ASKING_WRITES,
    "git config commit.gpgsign true",
    "git config user.email t@example.test; git config commit.gpgsign true",
    "git config core.autocrlf true",
    "git config --file /tmp/probe.gitconfig user.email t@example.test",
    "git config user.name",
    "git status --porcelain",
    "git config user.name Fixture # core.autocrlf false",
  ];
  let checked = 0;
  for (const command of corpus) {
    for (const mode of ["allow", "deny", "ask"]) {
      const options = guardOptions({ agentGuard: { allow: ["commit.gpgsign"] } }, CWD, SCRATCH, mode);
      const decision = decideGitConfigCall(command, options);
      const interactive = host();
      const applied = await applyGitIdentityGuard(command, options, interactive);
      const label = `${mode} · ${command}`;
      if (decision.action === "allow") {
        assert.equal(applied.block, false, label);
        assert.equal(interactive.asks.length, 0, label);
      } else if (decision.action === "block") {
        assert.equal(applied.block, true, label);
        assert.equal(interactive.asks.length, 0, label);
      } else {
        assert.equal(decision.action, "ask", label);
        assert.equal(applied.block, false, label);
        assert.equal(interactive.asks.length, 1, label);
      }
      const headless = { ...host(), interactive: false };
      const headlessVerdict = await applyGitIdentityGuard(command, options, headless);
      assert.equal(headless.asks.length, 0, label);
      assert.equal(headlessVerdict.block, decision.action !== "allow", label);
      checked += 1;
    }
  }
  assert.equal(checked, corpus.length * 3);
});

test("M6 — a stored consent never overrides `deny`", async () => {
  const h = { ...host(), approved: () => true };
  const result = await applyGitIdentityGuard("git config user.name Fixture", BLOCK(), h);
  assert.equal(result.block, true, "the disposition outranks a consent recorded under `ask`");
  assert.equal(h.asks.length, 0);
});

test("M7 — a write that needs no consent never reaches the disposition", async () => {
  const options = guardOptions({ agentGuard: { allow: ["user.name"] } }, CWD, SCRATCH, "deny");
  for (const command of [
    "git config user.name Fixture",
    "git config --file /tmp/probe.gitconfig user.email t@example.test",
    "git config core.autocrlf true",
    "git config --get user.name",
  ]) {
    const h = host();
    const result = await applyGitIdentityGuard(command, options, h);
    assert.equal(result.block, false, `deny changes how an asking write is answered, not which writes ask: ${command}`);
    assert.equal(h.asks.length, 0, command);
  }
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

function wiredContext(cwd, { hasUI = false, confirmed = true, notified = [], asked = [] } = {}) {
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
      confirm: async (question) => {
        asked.push(question);
        return confirmed;
      },
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

test("R9 wiring: a headless session runs a bare identity read — the whole call is no longer a write", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "identity-wiring-read-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const cwd = path.join(root, "repo");
  const agentDir = path.join(root, "agent");
  fs.mkdirSync(cwd, { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });

  const entry = await shippedEntry(cwd, agentDir);
  const toolCall = entry.handler("tool_call");
  for (const command of ["git config user.name", "git config user.name; git config user.email; git config commit.gpgsign"]) {
    assert.equal(await toolCall({ toolName: "bash", input: { command } }, wiredContext(cwd)), undefined, command);
  }
});

test("H7 wiring: a headless heredoc carrier of the same prose passes", async (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "identity-wiring-heredoc-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const cwd = path.join(root, "repo");
  const agentDir = path.join(root, "agent");
  fs.mkdirSync(cwd, { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });

  const entry = await shippedEntry(cwd, agentDir);
  const command = heredocCommand("<<'EOF'");
  assert.equal(await entry.handler("tool_call")({ toolName: "bash", input: { command } }, wiredContext(cwd)), undefined);
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

/** A project whose base config file declares one disposition (issue #626/#655). */
function dispositionProject(t, prefix, mode) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const cwd = path.join(root, "repo");
  const agentDir = path.join(root, "agent");
  fs.mkdirSync(path.join(cwd, ".pi"), { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });
  fs.writeFileSync(path.join(cwd, ".pi", "agentic-workflow.json"), JSON.stringify({ guard: { gitIdentity: { mode } } }));
  return { cwd, agentDir };
}

test("W1 — wiring: `guard.gitIdentity.mode: deny` blocks without a dialog, even where the host could ask", async (t) => {
  const { cwd, agentDir } = dispositionProject(t, "identity-wiring-deny-", "deny");
  const entry = await shippedEntry(cwd, agentDir);
  const asked = [];
  const decision = await entry.handler("tool_call")(
    { toolName: "bash", input: { command: "git config --global user.name Fixture" } },
    wiredContext(cwd, { hasUI: true, asked }),
  );
  assert.equal(decision.block, true);
  assert.equal(asked.length, 0, "deny opens no dialog");
  assert.match(decision.reason, /guard\.gitIdentity\.mode/);
  assert.equal(fs.existsSync(path.join(agentDir, "git-identity-consent.json")), false);
});

test("W2 — wiring: `guard.gitIdentity.mode: allow` passes the write untouched, with no dialog", async (t) => {
  const { cwd, agentDir } = dispositionProject(t, "identity-wiring-allow-", "allow");
  const entry = await shippedEntry(cwd, agentDir);
  const asked = [];
  const decision = await entry.handler("tool_call")(
    { toolName: "bash", input: { command: "git config --global user.name Fixture" } },
    wiredContext(cwd, { hasUI: true, asked }),
  );
  assert.equal(decision, undefined, "the call reaches the tool untouched");
  assert.equal(asked.length, 0, "allow opens no dialog");
  assert.equal(fs.existsSync(path.join(agentDir, "git-identity-consent.json")), false);
});
