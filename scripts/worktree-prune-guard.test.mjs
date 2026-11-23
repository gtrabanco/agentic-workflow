#!/usr/bin/env node
// test-obligation: protects=scripts/worktree-prune-guard.mjs obligations=contract,failure-path

/**
 * worktree-prune-guard.test.mjs — the fixture corpus for
 * `scripts/worktree-prune-guard.mjs` (issue #693).
 *
 * The guard reads `aw.worktreePrunePolicy` from git config and gates a worktree
 * prune with it: `deny` (the absent-key and unrecognised-value default) refuses
 * with the blocked message, `ask` prompts with the true candidate count and
 * proceeds only on an affirmative answer, `allow` delegates to
 * `git worktree prune` and returns its status unchanged.
 *
 * What the fixtures pin about git itself (measured, git 2.47.3 — see the unit
 * doc's PE-001/PE-005): a prune reclaims administration metadata only, and only
 * for a worktree whose directory is already gone. The one case that plants a
 * live worktree with an uncommitted file asserts the file survives a prune under
 * `allow` — the guard must never become a working-tree remover.
 *
 * Every case builds a throwaway git repository (signing neutralized,
 * `mktemp -d` under `TMPDIR || /var/tmp`, removed in a `finally`).
 *
 * Usage
 *   bun test scripts/worktree-prune-guard.test.mjs     (the per-file bun-first rule)
 *   node --test scripts/worktree-prune-guard.test.mjs  (the guaranteed fallback)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUARD = path.join(repoRoot, "scripts/worktree-prune-guard.mjs");
const tmpBase = process.env.TMPDIR || "/var/tmp";

const IDENTITY = [
  "-c",
  "user.name=fixture",
  "-c",
  "user.email=fixture@example.invalid",
  "-c",
  "commit.gpgsign=false",
];

/** A throwaway git repository (branch main, one seed commit) plus helpers. */
function withRepo(run) {
  const root = fs.mkdtempSync(path.join(tmpBase, "worktree-prune-guard-"));
  try {
    const git = (args, opts = {}) => {
      const result = spawnSync("git", [...IDENTITY, ...args], { cwd: root, encoding: "utf8", ...opts });
      assert.equal(result.status, 0, `git ${args.join(" ")} failed:\n${result.stderr}`);
      return result.stdout;
    };
    git(["init", "-b", "main"]);
    fs.writeFileSync(path.join(root, "README.md"), "# fixture\n");
    git(["add", "."]);
    git(["commit", "-m", "chore: fixture seed"]);
    return run({ root, git });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/** A linked worktree under `<root>/wts/<name>` on its own branch. */
function addWorktree(root, git, name) {
  const target = path.join(root, "wts", name);
  git(["worktree", "add", "-q", "-b", `feat-${name}`, target]);
  return target;
}

/** Register a worktree, then remove its directory: the prunable state. */
function addVanishedWorktree(root, git, name) {
  const target = addWorktree(root, git, name);
  fs.rmSync(target, { recursive: true, force: true });
  return target;
}

/** Run the guard as a user would, with an explicit stdin for the `ask` cases. */
function runGuard(root, args, { input = "", env = {} } = {}) {
  const result = spawnSync(process.execPath, [GUARD, "--repo", root, ...args], {
    cwd: root,
    encoding: "utf8",
    input,
    env: { ...process.env, ...env },
  });
  assert.notEqual(result.stderr, undefined);
  // A missing module is the red-first state: surface it as a failure, never a pass.
  assert.ok(
    !/ERR_MODULE_NOT_FOUND|Cannot find module/.test(result.stderr),
    `guard module is missing:\n${result.stderr}`,
  );
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

const DENY_MESSAGE = /ERROR: git worktree prune is blocked by policy "deny"\./;
const REMOVE_HINT = /To remove a worktree manually: git worktree remove <path>/;
const POLICY_HINT = /To change this policy: git config aw\.worktreePrunePolicy ask\|allow\|deny/;

// --- O1: the closed policy vocabulary -------------------------------------

test("an absent aw.worktreePrunePolicy resolves to deny", () => {
  withRepo(({ root }) => {
    const { status, stderr } = runGuard(root, []);
    assert.equal(status, 1);
    assert.match(stderr, DENY_MESSAGE);
  });
});

test("an unrecognised aw.worktreePrunePolicy resolves to deny", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "yesterday"]);
    const { status, stderr } = runGuard(root, []);
    assert.equal(status, 1);
    assert.match(stderr, DENY_MESSAGE);
  });
});

// --- O2: the deny refusal --------------------------------------------------

test("deny prints the exact blocked message with both hints and touches nothing", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "deny"]);
    const vanished = addVanishedWorktree(root, git, "gone");
    const { status, stderr } = runGuard(root, []);
    assert.equal(status, 1);
    assert.match(stderr, DENY_MESSAGE);
    assert.match(stderr, REMOVE_HINT);
    assert.match(stderr, POLICY_HINT);
    // The refusal happened before git: the stale admin entry is still registered.
    const listed = spawnSync("git", ["worktree", "list", "--porcelain"], { cwd: root, encoding: "utf8" });
    assert.ok(listed.stdout.includes(path.basename(vanished)), "the refusal must not prune");
  });
});

test("--json reports the refusal as a machine envelope", () => {
  withRepo(({ root }) => {
    const { status, stdout } = runGuard(root, ["--json"]);
    assert.equal(status, 1);
    const envelope = JSON.parse(stdout);
    assert.equal(envelope.policy, "deny");
    assert.equal(envelope.verdict, "DENIED");
  });
});

// --- O3: the ask prompt ----------------------------------------------------

test("ask prints the candidate count and refuses on a bare newline", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "ask"]);
    addVanishedWorktree(root, git, "one");
    addVanishedWorktree(root, git, "two");
    const { status, stderr } = runGuard(root, [], { input: "\n" });
    assert.equal(status, 1);
    assert.match(stderr, /Prune 2 stale worktree\(s\)\? \[y\/N\]: /);
    assert.match(stderr, /aborted/);
  });
});

test("ask proceeds on y and reclaims the vanished entry", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "ask"]);
    const vanished = addVanishedWorktree(root, git, "gone");
    const { status } = runGuard(root, [], { input: "y\n" });
    assert.equal(status, 0);
    const listed = spawnSync("git", ["worktree", "list", "--porcelain"], { cwd: root, encoding: "utf8" });
    assert.ok(!listed.stdout.includes(path.basename(vanished)), "the confirmed prune reclaims the entry");
  });
});

test("ask without a TTY refuses instead of hanging on a prompt nobody reads", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "ask"]);
    addVanishedWorktree(root, git, "gone");
    const { status, stderr } = runGuard(root, [], { env: { WORKTREE_PRUNE_GUARD_NO_TTY: "1" } });
    assert.equal(status, 1);
    assert.match(stderr, /no interactive terminal/);
  });
});

// --- O4: the allow delegation ---------------------------------------------

test("allow delegates to git worktree prune and reclaims the vanished entry", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "allow"]);
    const vanished = addVanishedWorktree(root, git, "gone");
    const { status } = runGuard(root, []);
    assert.equal(status, 0);
    const listed = spawnSync("git", ["worktree", "list", "--porcelain"], { cwd: root, encoding: "utf8" });
    assert.ok(!listed.stdout.includes(path.basename(vanished)), "allow delegates the real prune");
  });
});

test("allow with nothing to prune is a no-op and exits 0", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "allow"]);
    const { status } = runGuard(root, []);
    assert.equal(status, 0);
  });
});

// --- O5: the guard never removes a working tree ---------------------------

test("a live worktree's uncommitted file survives a prune under allow", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "allow"]);
    const live = addWorktree(root, git, "live");
    const precious = path.join(live, "precious.txt");
    fs.writeFileSync(precious, "uncommitted work\n");
    const { status } = runGuard(root, []);
    assert.equal(status, 0);
    assert.ok(fs.existsSync(precious), "the uncommitted file must survive");
    assert.ok(fs.existsSync(live), "the live worktree must survive");
  });
});

test("--dry-run lists the candidates and prunes nothing under allow", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "allow"]);
    const vanished = addVanishedWorktree(root, git, "gone");
    const { status, stdout } = runGuard(root, ["--dry-run"]);
    assert.equal(status, 0);
    assert.match(stdout, new RegExp(`PRUNE ${path.basename(vanished)}`));
    const listed = spawnSync("git", ["worktree", "list", "--porcelain"], { cwd: root, encoding: "utf8" });
    assert.ok(listed.stdout.includes(path.basename(vanished)), "--dry-run must not prune");
  });
});
