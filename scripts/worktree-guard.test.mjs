#!/usr/bin/env node
/**
 * worktree-guard.test.mjs — the fixture corpus for `scripts/worktree-guard.mjs`
 * (issue #476).
 *
 * The guard audits `git worktree list`: corrupted links (`CORRUPTED` — a
 * registered worktree whose `.git` link file vanished, the failure whose
 * symptom is git administration bleeding into the working tree), entries
 * whose directory vanished (`PRUNABLE`), worktrees outside the legal home
 * (`OUTSIDE`), detached HEADs (`DETACHED`, skipped while a rebase/merge is in
 * progress) and the leftover signature of a finished unit: a clean tree on a
 * branch already merged into the base (`STALE`). `--prune` fixes what it can
 * — `git worktree repair` for corrupted links (non-destructive), `git
 * worktree prune` for vanished entries, `git worktree remove` for clean ones
 * — never deletes a branch and never touches the primary checkout; a dirty
 * worktree is reported, never removed.
 *
 * The fixtures model a healthy layout: worktrees live under `<root>/wts`
 * (the `--home` the cases pass), so each worktree carries its own `.git`
 * link file and the git administration stays in the repository's
 * `.git/worktrees` — the collision that produces the corrupted state is what
 * the CORRUPTED cases create deliberately. Every case builds a throwaway git
 * repository (the `run-root-suite` fixture pattern — signing neutralized,
 * `mktemp -d` under `TMPDIR || /var/tmp`, removed in a `finally`). The
 * shipped tree is never scanned from this suite; the local-gate step
 * (`worktree-guard`) does that on every push.
 *
 * Usage
 *   bun test scripts/worktree-guard.test.mjs     (the per-file bun-first rule)
 *   node --test scripts/worktree-guard.test.mjs  (the guaranteed fallback)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUARD = path.join(repoRoot, "scripts/worktree-guard.mjs");
const tmpBase = process.env.TMPDIR || "/var/tmp";

/** A throwaway git repository (branch main, one seed commit) plus helpers. */
function withRepo(run) {
  const root = fs.mkdtempSync(path.join(tmpBase, "worktree-guard-"));
  try {
    const git = (args, opts = {}) => {
      const result = spawnSync("git", args, { cwd: root, encoding: "utf8", ...opts });
      assert.equal(result.status, 0, `git ${args.join(" ")} failed:\n${result.stderr}`);
      return result.stdout;
    };
    git(["init", "-b", "main"]);
    git(["config", "user.email", "fixture@example.invalid"]);
    git(["config", "user.name", "fixture"]);
    git(["config", "commit.gpgsign", "false"]);
    fs.writeFileSync(path.join(root, "README.md"), "# fixture\n");
    git(["add", "."]);
    git(["commit", "-m", "chore: fixture seed"]);
    return run({ root, git });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/** Add a healthy worktree inside the fixture's legal home (`<root>/wts`):
 *  its own `.git` link file, git administration in `<root>/.git/worktrees`. */
function addWorktree(git, root, name, args = []) {
  const target = path.join(root, "wts", name);
  git(["worktree", "add", ...args, target]);
  return target;
}

function guard(root, args = []) {
  const result = spawnSync(process.execPath, [GUARD, "--repo", root, "--home", path.join(root, "wts"), ...args], {
    encoding: "utf8",
  });
  assert.equal(result.status !== null, true, `the guard spawned (stderr: ${result.stderr})`);
  return result;
}

test("a clean worktree on an unmerged branch inside the legal home is healthy", () => {
  withRepo(({ root, git }) => {
    const live = addWorktree(git, root, "live", ["-b", "feat/live"]);
    assert.equal(fs.existsSync(path.join(live, ".git")), true, "the worktree carries its .git link");
    git(["-C", live, "commit", "--allow-empty", "-m", "wip"]);
    const result = guard(root);
    assert.equal(result.status, 0, `exit 0 (stdout: ${result.stdout})`);
    assert.match(result.stdout, /verdict: PASS/);
    assert.match(result.stdout, /2 worktree\(s\)/);
  });
});

test("a worktree whose .git link is severed is a CORRUPTED finding --prune repairs", () => {
  withRepo(({ root, git }) => {
    const target = addWorktree(git, root, "severed", ["-b", "feat/severed"]);
    git(["-C", target, "commit", "--allow-empty", "-m", "wip"]);
    fs.rmSync(path.join(target, ".git"));
    const result = guard(root);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /FINDING .* — CORRUPTED/);

    const fixed = guard(root, ["--prune"]);
    assert.equal(fixed.status, 0, `the repair is non-destructive and succeeds (stdout: ${fixed.stdout})`);
    assert.match(fixed.stdout, /REPAIRED/);
    assert.equal(fs.existsSync(path.join(target, ".git")), true, "the .git link is back");
    assert.equal(git(["-C", target, "rev-parse", "HEAD"]).trim().length, 40, "the worktree resolves HEAD again");
  });
});

test("a worktree whose directory vanished is a PRUNABLE finding", () => {
  withRepo(({ root, git }) => {
    // Outside the legal home: only then do the admin metadata outlive the
    // directory (inside the home the two are separate, and a vanished
    // directory leaves the registration dangling either way).
    const vanished = path.join(root, "vanished-wt");
    git(["worktree", "add", "-b", "feat/vanished", vanished]);
    fs.rmSync(vanished, { recursive: true, force: true });
    const result = guard(root);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /FINDING .* — PRUNABLE/);
    assert.match(result.stdout, /verdict: FAIL/);
  });
});

test("a detached worktree inside the legal home is a DETACHED finding", () => {
  withRepo(({ root, git }) => {
    addWorktree(git, root, "detached", ["--detach"]);
    const result = guard(root);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /FINDING .* — DETACHED/);
  });
});

test("a worktree outside the legal home is a report-only line, never a finding", () => {
  withRepo(({ root, git }) => {
    const outside = path.join(root, "outside-wt");
    git(["worktree", "add", "-b", "feat/outside", outside]);
    const result = guard(root);
    assert.equal(result.status, 0, `a location the owner chose never blocks (stdout: ${result.stdout})`);
    assert.match(result.stdout, /REPORT .* — OUTSIDE/);
    assert.match(result.stdout, /verdict: PASS/);
  });
});

test("a clean worktree on a branch merged into the base is a STALE finding", () => {
  withRepo(({ root, git }) => {
    const target = addWorktree(git, root, "done", ["-b", "feat/done"]);
    git(["-C", target, "commit", "--allow-empty", "-m", "merged work"]);
    git(["merge", "-q", "--ff-only", "feat/done"]);
    const result = guard(root);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /FINDING .* — STALE: branch feat\/done is merged into main/);
  });
});

test("a dirty worktree carries a dirty marker and --prune never removes it", () => {
  withRepo(({ root, git }) => {
    const target = addWorktree(git, root, "dirty", ["-b", "feat/dirty"]);
    fs.writeFileSync(path.join(target, "scratch.txt"), "untracked\n");
    git(["merge", "-q", "--ff-only", "feat/dirty"]);
    const result = guard(root, ["--prune"]);
    assert.equal(result.status, 1, `a dirty finding is not fixable (stdout: ${result.stdout})`);
    assert.match(result.stdout, /FINDING .* — STALE: branch feat\/dirty is merged into main · dirty/);
    assert.match(result.stdout, /SKIP .* — dirty; remove manually/);
    assert.equal(fs.existsSync(target), true, "the dirty worktree stays");
  });
});

test("--prune repairs the corrupted link and removes prunable, detached, outside and stale worktrees", () => {
  withRepo(({ root, git }) => {
    const severed = addWorktree(git, root, "severed", ["-b", "feat/severed"]);
    git(["-C", severed, "commit", "--allow-empty", "-m", "wip"]);
    fs.rmSync(path.join(severed, ".git"));
    const vanished = path.join(root, "vanished-wt");
    git(["worktree", "add", "-b", "feat/vanished", vanished]);
    fs.rmSync(vanished, { recursive: true, force: true });
    const detached = addWorktree(git, root, "detached", ["--detach"]);
    const outside = path.join(root, "outside-wt");
    git(["worktree", "add", "-b", "feat/outside", outside]);
    const done = addWorktree(git, root, "done", ["-b", "feat/done"]);
    git(["merge", "-q", "--ff-only", "feat/done"]);

    const result = guard(root, ["--prune"]);
    assert.equal(result.status, 0, `every fixable finding is fixed (stdout: ${result.stdout})`);
    assert.match(result.stdout, /verdict: PASS/);
    assert.match(result.stdout, /REPAIRED/);
    assert.equal(fs.existsSync(path.join(severed, ".git")), true, "the corrupted link is repaired");
    assert.equal(fs.existsSync(detached), false, "the detached worktree is removed");
    assert.equal(fs.existsSync(outside), true, "the outside worktree is report-only and stays");
    assert.equal(fs.existsSync(done), false, "the stale worktree is removed");
    assert.match(result.stdout, /SUGGEST git branch -D feat\/done/, "the branch-delete suggestion names the branch");

    const after = guard(root);
    assert.equal(after.status, 0, `a re-run after the prune is clean (stdout: ${after.stdout})`);
  });
});

test("--json emits one JSON object with the findings", () => {
  withRepo(({ root, git }) => {
    addWorktree(git, root, "detached", ["--detach"]);
    const result = guard(root, ["--json"]);
    assert.equal(result.status, 1);
    const parsed = JSON.parse(result.stdout);
    assert.equal(parsed.verdict, "FAIL");
    assert.equal(parsed.findings.length, 1);
    assert.equal(parsed.findings[0].code, "DETACHED");
  });
});

test("an unknown flag is a usage error", () => {
  withRepo(({ root }) => {
    assert.equal(guard(root, ["--bogus"]).status, 2);
  });
});

test("a target that is not a git repository is a usage error", () => {
  const notRepo = fs.mkdtempSync(path.join(tmpBase, "worktree-guard-nogit-"));
  try {
    const result = spawnSync(process.execPath, [GUARD, "--repo", notRepo], { encoding: "utf8" });
    assert.equal(result.status, 2);
  } finally {
    fs.rmSync(notRepo, { recursive: true, force: true });
  }
});

test("os.tmpdir() is a real directory this suite may rely on", () => {
  assert.equal(fs.existsSync(os.tmpdir()), true);
});
