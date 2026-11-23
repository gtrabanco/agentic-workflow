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
import { spawn, spawnSync } from "node:child_process";
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

/** A throwaway git repository (branch main, one seed commit) plus helpers.
 *  A thenable `run` (the ordering case) keeps the fixture alive until it
 *  settles: a sync finally-arm could not wait for it. */
function withRepo(run) {
  const root = fs.mkdtempSync(path.join(tmpBase, "worktree-prune-guard-"));
  const cleanup = () => fs.rmSync(root, { recursive: true, force: true });
  let outcome;
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
    outcome = run({ root, git });
  } catch (error) {
    cleanup();
    throw error;
  }
  if (outcome && typeof outcome.then === "function") return outcome.finally(cleanup);
  cleanup();
  return outcome;
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

/** Run the guard as a user would, with an explicit stdin for the `ask` cases.
 *  The 10 s bound turns a hang into a red assertion instead of a stuck suite. */
function runGuard(root, args, { input = "", env = {}, timeout = 10_000 } = {}) {
  const result = spawnSync(process.execPath, [GUARD, "--repo", root, ...args], {
    cwd: root,
    encoding: "utf8",
    input,
    timeout,
    env: { ...process.env, ...env },
  });
  assert.notEqual(result.stderr, undefined);
  // A missing module is the red-first state: surface it as a failure, never a pass.
  assert.ok(
    !/ERR_MODULE_NOT_FOUND|Cannot find module/.test(result.stderr),
    `guard module is missing:\n${result.stderr}`,
  );
  return { status: result.status, signal: result.signal, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

const DENY_MESSAGE = /ERROR: git worktree prune is blocked by policy "deny"\./;
const REMOVE_HINT = /To remove a worktree manually: git worktree remove \/path\/to\/worktree/;
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
    assert.match(stderr, /Prune 2 stale worktrees\? \[y\/N\]: /);
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
    const { status, stdout } = runGuard(root, []);
    assert.equal(status, 0);
    // A verdict is a claim about what happened: nothing was pruned, so the
    // receipt must not say PRUNED.
    assert.match(stdout, /verdict: NO-OP/);
    assert.ok(!/verdict: PRUNED/.test(stdout), "no candidate is never a PRUNED verdict");
  });
});

// --- O5: the guard never targets a working tree ---------------------------

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
    assert.ok(stdout.includes(`PRUNE ${vanished}`), `the candidate ${vanished} is listed before the decision`);
    const listed = spawnSync("git", ["worktree", "list", "--porcelain"], { cwd: root, encoding: "utf8" });
    assert.ok(listed.stdout.includes(path.basename(vanished)), "--dry-run must not prune");
  });
});

// --- correction batch for the 2026-11-23 EXTERNAL VERIFY receipt ----------
// The receipt's own reproducers are the corpus: B3 (hang), B5 (exact texts),
// B6 (listing order), A1 (status passthrough), A2 (honest verdict), A3 (one
// copy of the refusal), B1 (the recorded admin-namespace limit).

test("the refusal text is written once, on stderr, and stdout stays a machine receipt", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "deny"]);
    addVanishedWorktree(root, git, "gone");
    const { status, stdout, stderr } = runGuard(root, []);
    assert.equal(status, 1);
    assert.match(stderr, /ERROR: git worktree prune is blocked by policy "deny"\./);
    assert.match(stderr, REMOVE_HINT);
    assert.match(stderr, POLICY_HINT);
    assert.ok(!/ERROR: git worktree prune is blocked/.test(stdout), "the refusal text is never duplicated onto stdout");
    assert.match(stdout, /worktree-prune-guard — policy "deny"/);
    assert.match(stdout, /verdict: DENIED/);
  });
});

test("ask with no answer on stdin refuses instead of hanging", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "ask"]);
    addVanishedWorktree(root, git, "gone");
    const { status, signal, stderr } = runGuard(root, [], { input: "" });
    assert.equal(status, 1, `refused with exit 1, never a hang (status=${status}, signal=${signal})`);
    assert.match(stderr, /no interactive terminal/);
    assert.ok(!/aborted/.test(stderr), "nothing was answered, so the refusal is the no-answer one");
  });
});

test("ask lists every candidate before the prompt", async () => {
  await withRepo(async ({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "ask"]);
    const first = addVanishedWorktree(root, git, "wt-one");
    const second = addVanishedWorktree(root, git, "wt-two");
    const child = spawn(process.execPath, [GUARD, "--repo", root], {
      cwd: root,
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += String(chunk);
    });
    const prompted = new Promise((resolve) => {
      child.stderr.on("data", (chunk) => {
        stderr += String(chunk);
        if (/Prune 2 stale worktrees\?/.test(stderr)) resolve(true);
      });
      setTimeout(() => resolve(false), 5000);
      child.on("close", () => resolve(false));
    });
    const exited = new Promise((resolve) => child.on("close", (code) => resolve(code)));
    try {
      assert.equal(await prompted, true, `the prompt was written (stderr: ${JSON.stringify(stderr)})`);
      await new Promise((resolve) => setTimeout(resolve, 100));
      assert.match(
        stdout,
        /PRUNE /,
        `every candidate is listed before the prompt (stdout at prompt time: ${JSON.stringify(stdout)})`,
      );
      child.stdin.write("y\n");
      child.stdin.end();
      const code = await Promise.race([exited, new Promise((resolve) => setTimeout(() => resolve("timeout"), 8000))]);
      assert.equal(code, 0, `a confirmed prune exits 0 (code=${code})`);
      const listed = spawnSync("git", ["worktree", "list", "--porcelain"], { cwd: root, encoding: "utf8" });
      assert.ok(!listed.stdout.includes(path.basename(first)), "the confirmed prune reclaims wt-one");
      assert.ok(!listed.stdout.includes(path.basename(second)), "the confirmed prune reclaims wt-two");
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
  });
});

test("the delegated prune's exit status is passed through unchanged", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "allow"]);
    addVanishedWorktree(root, git, "gone");
    // A shim that is git for every probe but `worktree prune`, which fails 7:
    // the guard must return 7 — git's own status, not a mapped code.
    const shimDir = fs.mkdtempSync(path.join(tmpBase, "worktree-prune-guard-shim-"));
    try {
      const realGit = spawnSync("sh", ["-c", "command -v git"], { encoding: "utf8" }).stdout.trim();
      assert.ok(realGit.length > 0, "the real git resolves");
      const shim = path.join(shimDir, "git");
      fs.writeFileSync(
        shim,
        `#!/bin/sh\nif [ "$1" = "worktree" ] && [ "$2" = "prune" ]; then\n  echo "shim: prune refused" >&2\n  exit 7\nfi\nexec "${realGit}" "$@"\n`,
        { mode: 0o755 },
      );
      const { status, stderr } = runGuard(root, [], { env: { PATH: `${shimDir}:${process.env.PATH}` } });
      assert.equal(status, 7, `git's own status passes through (status=${status}, stderr=${stderr})`);
    } finally {
      fs.rmSync(shimDir, { recursive: true, force: true });
    }
  });
});

test("a stray live tree inside .git/worktrees is taken down by the delegated prune — the recorded limit", () => {
  withRepo(({ root, git }) => {
    git(["config", "aw.worktreePrunePolicy", "allow"]);
    const stray = path.join(root, ".git", "worktrees", "fix", "493-x");
    git(["worktree", "add", "-b", "feat-stray", stray]);
    fs.writeFileSync(path.join(stray, "precious.txt"), "uncommitted work\n");
    const outside = addWorktree(root, git, "outside");
    fs.writeFileSync(path.join(outside, "precious.txt"), "uncommitted work\n");
    const vanished = addVanishedWorktree(root, git, "vanished");
    const { status, stdout } = runGuard(root, []);
    assert.equal(status, 0);
    assert.ok(stdout.includes(vanished), "the real candidate is listed");
    assert.ok(!stdout.includes(stray), "a present tree is never listed as a candidate");
    // Measured limit (external verify B1, 2026-11-23): the delegated
    // `git worktree prune` removes non-registration entries under
    // `.git/worktrees/` recursively — the stray checkout goes with them. The
    // docs record exactly this; IR8/ADMIN_NAMESPACE is what keeps trees out.
    assert.equal(
      fs.existsSync(path.join(stray, "precious.txt")),
      false,
      "recorded limit: git's prune destroys the stray entry",
    );
    assert.equal(fs.existsSync(path.join(outside, "precious.txt")), true, "a tree outside the admin namespace survives");
  });
});
