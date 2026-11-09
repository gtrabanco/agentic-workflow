#!/usr/bin/env node
/**
 * worktree-guard.mjs — the worktree audit (issue #476).
 *
 * The repository's rule: worktrees live inside the repository tree, on a unit
 * branch, and are removed when the unit closes. The incident: finished
 * sessions left worktrees behind — some detached, which pi-web lists as
 * "detached" — and they accumulated until the owner cleaned them by hand.
 * This gate audits `git worktree list --porcelain` and fails on the leftover
 * signatures:
 *
 *   PRUNABLE  the worktree's directory vanished (stale metadata)
 *   OUTSIDE   a non-primary worktree outside the repository tree (for this
 *             repository: outside the `.git/worktrees` home)
 *   DETACHED  a non-primary worktree with a detached HEAD (skipped while a
 *             rebase/merge/cherry-pick is in progress — the primary checkout
 *             is legitimately detached mid-operation)
 *   STALE     a non-primary worktree on a branch fully merged into the base
 *             (origin/main when it resolves, main otherwise) — the finished
 *             unit nobody removed; a dirty tree appends a dirty marker
 *
 * `--prune` fixes what it can: `git worktree prune` for vanished entries,
 * `git worktree remove` for clean ones, and a `SKIP — dirty; remove
 * manually` line for a dirty worktree (never removed, never forced). Branches
 * are never deleted — a removed branch worktree prints
 * `SUGGEST git branch -D <branch>` instead. The primary checkout is never a
 * finding and never removed.
 *
 * stdout: a `worktree-guard —` header with the worktree count, one
 * `FINDING <path> — <CODE>: <detail>` line per finding in path order, the
 * PRUNED/SKIP/SUGGEST lines when pruning, the remaining tally, then the
 * verdict. exit: 0 only when the verdict is `PASS`; 1 on findings; 2 on
 * usage. Its sibling suite is `scripts/worktree-guard.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const USAGE = `usage: worktree-guard [--repo <dir>] [--prune] [--json]

  --repo <dir>  the repository to audit (default: this one)
  --prune       remove what the audit flagged (vanished, clean outside/detached/
                stale worktrees); dirty worktrees are skipped, never forced
  --json        one JSON object instead of the fixed text block

stdout: one "FINDING <path> — <CODE>" line per finding, the PRUNED/SKIP/SUGGEST
lines when pruning, the tally, the verdict. exit: 0 pass · 1 findings · 2 usage`;

const IN_PROGRESS_MARKERS = ["rebase-merge", "rebase-apply", "MERGE_HEAD", "CHERRY_PICK_HEAD"];

function usage(message) {
  process.stderr.write(`worktree-guard: ${message}\n`);
  process.stderr.write(`${USAGE}\n`);
  process.exit(2);
}

export function parseArgs(argv) {
  let repo = null;
  let prune = false;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo") {
      const value = argv[index + 1];
      if (value === undefined) usage("--repo needs a directory");
      repo = path.resolve(value);
      index += 1;
    } else if (arg === "--prune") prune = true;
    else if (arg === "--json") json = true;
    else usage(`unknown argument ${arg}`);
  }
  return { repo: repo ?? DEFAULT_ROOT, prune, json };
}

function git(args, cwd) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

/** `git worktree list --porcelain` as structured entries. */
export function listWorktrees(repo) {
  const result = git(["worktree", "list", "--porcelain"], repo);
  if (result.status !== 0) usage(`${repo} is not a git repository (${(result.stderr ?? "").trim().split("\n")[0]})`);
  const entries = [];
  let current = null;
  for (const line of result.stdout.split("\n")) {
    if (line.startsWith("worktree ")) {
      current = { path: line.slice("worktree ".length).trim(), branch: null, detached: false, bare: false, prunable: null };
      entries.push(current);
    } else if (!current) continue;
    else if (line.startsWith("branch ")) current.branch = line.slice("branch ".length).trim();
    else if (line === "detached") current.detached = true;
    else if (line === "bare") current.bare = true;
    else if (line.startsWith("prunable ")) current.prunable = line.slice("prunable ".length).trim();
  }
  return entries.filter((entry) => !entry.bare);
}

/** Whether a git operation is in progress in `repo` (the primary checkout is
 *  legitimately detached mid-rebase). */
function operationInProgress(repo, gitDir) {
  return IN_PROGRESS_MARKERS.some((marker) => fs.existsSync(path.join(gitDir, marker)));
}

/** The base ref the staleness check merges against: origin/main when it
 *  resolves, main otherwise. Returns `{ ref, name }` or null. */
function baseRef(repo) {
  for (const candidate of [
    { ref: "refs/remotes/origin/main", name: "origin/main" },
    { ref: "refs/heads/main", name: "main" },
  ]) {
    if (git(["rev-parse", "--verify", "--quiet", candidate.ref], repo).status === 0) return candidate;
  }
  return null;
}

/** Whether `branchRef` is fully merged into `base` (ancestor or equal). */
function isMerged(branchRef, base, repo) {
  return git(["merge-base", "--is-ancestor", branchRef, base.ref], repo).status === 0;
}

/**
 * The worktree-administration file names that live inside a worktree whose
 * directory shares its path with the git metadata directory (this
 * repository.s worktree home): they are git-owned, never a human change, and
 * must not make a worktree read as dirty.
 */
const WORKTREE_ADMIN_FILES = new Set([
  "HEAD",
  "index",
  "commondir",
  "gitdir",
  "ORIG_HEAD",
  "FETCH_HEAD",
  "COMMIT_EDITMSG",
  "MERGE_HEAD",
  "CHERRY_PICK_HEAD",
  "REVERT_HEAD",
  "BISECT_LOG",
  "index.lock",
  "logs",
  "rebase-merge",
  "rebase-apply",
  "sequencer",
]);

/** Whether the worktree at `full` carries any human change: a tracked
 *  modification, or an untracked file that is not worktree administration. */
function isDirty(full) {
  if (git(["diff", "--quiet", "HEAD"], full).status === 1) return true;
  const others = git(["ls-files", "--others", "--exclude-standard"], full);
  if (others.status !== 0) return false;
  return others.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((name) => name.length > 0)
    .some((name) => !WORKTREE_ADMIN_FILES.has(name.split("/")[0]));
}

/** The audit itself: one finding per leftover signature. */
export function audit(repo) {
  const entries = listWorktrees(repo);
  const primary = entries[0];
  const legalHome = path.join(repo, ".git", "worktrees");
  const base = baseRef(repo);
  const gitDir = (git(["rev-parse", "--absolute-git-dir"], repo).stdout ?? "").trim();
  const inProgress = gitDir ? operationInProgress(repo, gitDir) : false;
  const findings = [];
  for (const entry of entries.slice(1)) {
    const rel = path.relative(repo, entry.path) || entry.path;
    if (entry.prunable || !fs.existsSync(entry.path)) {
      findings.push({ path: rel, code: "PRUNABLE", detail: entry.prunable ?? "the worktree directory is gone" });
      continue;
    }
    if (!entry.path.startsWith(legalHome + path.sep) && entry.path !== legalHome) {
      findings.push({ path: rel, code: "OUTSIDE", detail: `worktrees live under ${path.relative(repo, legalHome) || legalHome}` });
      continue;
    }
    if (entry.detached) {
      if (inProgress) continue;
      findings.push({ path: rel, code: "DETACHED", detail: "a detached worktree is a leftover, not a unit branch" });
      continue;
    }
    if (entry.branch && base && entry.branch !== base.ref && isMerged(entry.branch, base, repo)) {
      const branch = entry.branch.replace(/^refs\/heads\//, "");
      const dirty = isDirty(entry.path) ? " · dirty" : "";
      findings.push({
        path: rel,
        code: "STALE",
        detail: `branch ${branch} is merged into ${base.name}${dirty}`,
        branch,
        dirty: dirty.length > 0,
      });
    }
  }
  return { entries, primary, findings };
}

function main(argv) {
  const { repo, prune, json } = parseArgs(argv);
  const first = audit(repo);
  let pruned = [];
  let skipped = [];
  let suggestions = [];

  if (prune) {
    if (first.findings.some((finding) => finding.code === "PRUNABLE")) {
      git(["worktree", "prune"], repo);
    }
    for (const finding of first.findings) {
      if (finding.code === "PRUNABLE") continue; // handled by `git worktree prune`
      if (finding.dirty) {
        skipped.push(finding);
        continue;
      }
      const full = path.join(repo, finding.path);
      const result = git(["worktree", "remove", full], repo);
      if (result.status !== 0) {
        skipped.push({ ...finding, detail: `${finding.detail} — remove failed: ${(result.stderr ?? "").trim().split("\n")[0]}` });
        continue;
      }
      pruned.push(finding);
      if (finding.branch) suggestions.push(`SUGGEST git branch -D ${finding.branch}`);
    }
  }

  const remaining = prune ? audit(repo).findings : first.findings;
  const verdict = remaining.length === 0 ? "PASS" : "FAIL";
  if (json) {
    console.log(
      JSON.stringify({
        worktrees: first.entries.length,
        primary: path.relative(repo, first.primary.path) || first.primary.path,
        findings: remaining.map(({ path: findingPath, code, detail }) => ({ path: findingPath, code, detail })),
        pruned: pruned.map((finding) => finding.path),
        skipped: skipped.map((finding) => finding.path),
        verdict,
      }),
    );
  } else {
    console.log(`worktree-guard — ${first.entries.length} worktree(s) · primary ${path.relative(repo, first.primary.path) || first.primary.path}`);
    for (const finding of first.findings) {
      console.log(`FINDING ${finding.path} — ${finding.code}: ${finding.detail}`);
    }
    for (const finding of pruned) console.log(`PRUNED ${finding.path}`);
    for (const finding of skipped) console.log(`SKIP ${finding.path} — dirty; remove manually`);
    for (const line of suggestions) console.log(line);
    console.log(`worktree-guard: ${remaining.length} finding(s)`);
    console.log(`verdict: ${verdict}`);
  }
  process.exit(verdict === "PASS" ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
