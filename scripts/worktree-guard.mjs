#!/usr/bin/env node
/**
 * worktree-guard.mjs — the worktree audit (issue #476).
 *
 * The incident: finished sessions left worktrees behind — some detached,
 * which pi-web lists as "detached" — and they accumulated until the owner
 * cleaned them by hand. A second failure mode surfaced the same day: a
 * session mover severed the worktree `.git` link files, and the corrupted
 * worktrees then leaked their git-administration files (HEAD, gitdir, index,
 * commondir, logs/) into the working tree as untracked junk. This gate
 * audits `git worktree list --porcelain` and fails on the leftover
 * signatures:
 *
 *   CORRUPTED  a registered worktree whose directory lost its `.git` link
 *              file — the administration metadata then bleeds into the
 *              working tree; `--prune` repairs it with `git worktree repair`
 *              (non-destructive: working files and commits are never touched)
 *   PRUNABLE   the worktree's directory vanished (stale admin metadata)
 *   OUTSIDE    a non-primary worktree outside the legal home
 *              (`--home`, default `<repo>/.worktrees`)
 *   ADMIN_NAMESPACE
 *              a worktree whose path starts with `<repo>/.git/worktrees/` —
 *              git's private worktree-administration namespace, where any
 *              `git worktree prune` deletes the container recursively with
 *              the working tree and its uncommitted work inside it (exit 0,
 *              no warning). `--prune` never removes or moves one: relocating
 *              a live checkout underneath a running session is the
 *              collateral-damage class this finding closes
 *   DETACHED   a non-primary worktree with a detached HEAD (skipped while a
 *              rebase/merge/cherry-pick is in progress — the primary checkout
 *              is legitimately detached mid-operation)
 *   STALE      a non-primary worktree on a branch fully merged into the base
 *              (origin/main when it resolves, main otherwise) — the finished
 *              unit nobody removed; a dirty tree appends a dirty marker
 *
 * `--prune` fixes what it can: `git worktree repair` for corrupted links,
 * `git worktree prune` for vanished entries, `git worktree remove` for clean
 * leftovers, and a `SKIP — dirty; remove manually` line for a dirty worktree
 * (never removed, never forced). Branches are never deleted — a removed
 * branch worktree prints `SUGGEST git branch -D <branch>` instead. The
 * primary checkout is never a finding and never touched.
 *
 * stdout: a `worktree-guard —` header with the worktree count, one
 * `FINDING <path> — <CODE>: <detail>` line per finding in path order, the
 * REPAIRED/PRUNED/SKIP/SUGGEST lines when pruning, the remaining tally, then
 * the verdict. exit: 0 only when the verdict is `PASS`; 1 on findings; 2 on
 * usage. Its sibling suite is `scripts/worktree-guard.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const USAGE = `usage: worktree-guard [--repo <dir>] [--home <dir>] [--prune] [--json]

  --repo <dir>  the repository to audit (default: this one)
  --home <dir>  the legal worktree home (default: <repo>/.worktrees)
  --prune       fix what the audit flagged: repair corrupted links, prune
                vanished entries, remove clean leftovers; dirty worktrees are
                skipped, never forced
  --json        one JSON object instead of the fixed text block

stdout: one "FINDING <path> — <CODE>" line per finding, the REPAIRED/PRUNED/
SKIP/SUGGEST lines when pruning, the tally, the verdict.
exit: 0 pass · 1 findings · 2 usage`;

const IN_PROGRESS_MARKERS = ["rebase-merge", "rebase-apply", "MERGE_HEAD", "CHERRY_PICK_HEAD"];

function usage(message) {
  process.stderr.write(`worktree-guard: ${message}\n`);
  process.stderr.write(`${USAGE}\n`);
  process.exit(2);
}

export function parseArgs(argv) {
  let repo = null;
  let home = null;
  let prune = false;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo") {
      const value = argv[index + 1];
      if (value === undefined) usage("--repo needs a directory");
      repo = path.resolve(value);
      index += 1;
    } else if (arg === "--home") {
      const value = argv[index + 1];
      if (value === undefined) usage("--home needs a directory");
      home = path.resolve(value);
      index += 1;
    } else if (arg === "--prune") prune = true;
    else if (arg === "--json") json = true;
    else usage(`unknown argument ${arg}`);
  }
  return { repo: repo ?? DEFAULT_ROOT, home, prune, json };
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
 * The worktree-administration file names that bleed into a corrupted
 * worktree's working tree when the `.git` link is severed: they are
 * git-owned, never a human change, and must not make a worktree read as
 * dirty. A healthy worktree never shows them — their presence is what the
 * CORRUPTED finding reports.
 */
const WORKTREE_ADMIN_FILES = new Set([
  "HEAD",
  "index",
  "index.lock",
  "commondir",
  "gitdir",
  "logs",
  "ORIG_HEAD",
  "FETCH_HEAD",
  "COMMIT_EDITMSG",
  "MERGE_HEAD",
  "CHERRY_PICK_HEAD",
  "REVERT_HEAD",
  "BISECT_LOG",
  "rebase-merge",
  "rebase-apply",
  "sequencer",
]);

/** Whether the worktree at `full` carries any human change: a tracked
 *  modification, or an untracked file that is not leaked administration. */
function isDirty(full) {
  if (git(["diff", "--quiet", "HEAD", "--"], full).status === 1) return true;
  const others = git(["ls-files", "--others", "--exclude-standard"], full);
  if (others.status !== 0) return false;
  return others.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((name) => name.length > 0)
    .some((name) => !WORKTREE_ADMIN_FILES.has(name.split("/")[0]));
}

/** Whether the worktree at `full` lost its `.git` link file — the corruption
 *  whose symptom is the administration files bleeding into the tree. */
function isCorrupted(full) {
  return fs.existsSync(full) && !fs.existsSync(path.join(full, ".git"));
}

/** The main repository root behind the calling checkout (a linked worktree
 *  resolves to the common one): the legal-home default and the relative
 *  paths hang off it, never off the calling worktree. */
function mainRepoRoot(repo) {
  const common = (git(["rev-parse", "--path-format=absolute", "--git-common-dir"], repo).stdout ?? "").trim();
  return common ? path.dirname(common) : repo;
}

/** The audit itself: one finding per leftover signature, plus report-only
 *  lines for states that inform without blocking. */
export function audit(repo, home) {
  const root = mainRepoRoot(repo);
  const entries = listWorktrees(root);
  const primary = entries[0];
  const legalHome = home ?? path.join(root, ".worktrees");
  const adminNamespace = path.join(root, ".git", "worktrees");
  const base = baseRef(root);
  const gitDir = (git(["rev-parse", "--absolute-git-dir"], root).stdout ?? "").trim();
  const inProgress = gitDir ? operationInProgress(root, gitDir) : false;
  const findings = [];
  const reports = [];
  for (const entry of entries.slice(1)) {
    const rel = path.relative(root, entry.path) || entry.path;
    const dirExists = fs.existsSync(entry.path);
    if (entry.prunable || !dirExists) {
      // Git reports a vanished directory and a severed .git link with the
      // same prunable reason ("gitdir file points to non-existent location")
      // — but they are opposites: a vanished directory is a leftover whose
      // stale metadata a prune removes, while an existing directory that
      // lost its link is recoverable, and a naive prune here destroys the
      // admin metadata the repair needs. Corruption wins the branch.
      if (dirExists && isCorrupted(entry.path)) {
        findings.push({
          path: rel,
          code: "CORRUPTED",
          detail: "the .git link file is gone — git administration bleeds into the working tree",
        });
      } else {
        findings.push({ path: rel, code: "PRUNABLE", detail: entry.prunable ?? "the worktree directory is gone" });
      }
      continue;
    }
    if (isCorrupted(entry.path)) {
      findings.push({
        path: rel,
        code: "CORRUPTED",
        detail: "the .git link file is gone — git administration bleeds into the working tree",
      });
      continue;
    }
    // The lethal layout (issue #505): a working tree inside git's private
    // worktree-administration namespace. `git worktree prune` deletes the
    // container recursively — exit 0, no warning — so this blocks before the
    // OUTSIDE report-only branch can certify the path as a location the
    // owner chose.
    if (entry.path === adminNamespace || entry.path.startsWith(adminNamespace + path.sep)) {
      findings.push({
        path: rel,
        code: "ADMIN_NAMESPACE",
        detail: "inside .git/worktrees — a `git worktree prune` deletes the container recursively, destroying the tree and its uncommitted work",
      });
      continue;
    }
    // Report-only: the legal home is a convention, and the owner may keep
    // live unit worktrees elsewhere — what blocks is a leftover signature,
    // never a location the owner chose.
    if (!entry.path.startsWith(legalHome + path.sep) && entry.path !== legalHome) {
      reports.push({ path: rel, code: "OUTSIDE", detail: `outside the legal home ${legalHome}` });
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
  return { entries, primary, root, findings, reports };
}

function main(argv) {
  const { repo, home, prune, json } = parseArgs(argv);
  const first = audit(repo, home);
  const root = first.root;
  let repaired = [];
  let pruned = [];
  let skipped = [];
  let suggestions = [];

  if (prune) {
    for (const finding of first.findings) {
      if (finding.code === "PRUNABLE") continue; // handled by the one `git worktree prune` below
      if (finding.code === "ADMIN_NAMESPACE") {
        // Never removed, never moved: relocating a live checkout underneath
        // a running session is the collateral-damage class the finding
        // exists to stop. The relocation is the owner's manual call.
        skipped.push({
          ...finding,
          detail: "relocate manually with `git worktree move <path> <repo>/.worktrees/<flat-name>`; a live checkout is never moved or removed automatically",
        });
        continue;
      }
      if (finding.code === "CORRUPTED") {
        const full = path.join(root, finding.path);
        git(["worktree", "repair", full], root);
        if (isCorrupted(full)) {
          skipped.push({ ...finding, detail: `${finding.detail} — repair failed; recover manually` });
        } else {
          repaired.push(finding);
        }
        continue;
      }
      if (finding.dirty) {
        skipped.push({ ...finding, detail: "dirty; remove manually" });
        continue;
      }
      const full = path.join(root, finding.path);
      let result = git(["worktree", "remove", full], root);
      if (result.status !== 0 && !isDirty(full)) {
        // The refusal is the worktree's own leaked git-administration junk
        // (untracked by definition), never a human change — isDirty already
        // proved there is none. Force is safe and the junk is git-owned.
        result = git(["worktree", "remove", "--force", full], root);
      }
      if (result.status !== 0) {
        skipped.push({ ...finding, detail: `${finding.detail} — remove failed: ${(result.stderr ?? "").trim().split("\n")[0]}` });
        continue;
      }
      pruned.push(finding);
      if (finding.branch) suggestions.push(`SUGGEST git branch -D ${finding.branch}`);
    }
    if (first.findings.some((finding) => finding.code === "PRUNABLE")) {
      git(["worktree", "prune"], root);
    }
  }

  const remaining = prune ? audit(repo, home).findings : first.findings;
  const reports = prune ? audit(repo, home).reports : first.reports;
  const verdict = remaining.length === 0 ? "PASS" : "FAIL";
  if (json) {
    console.log(
      JSON.stringify({
        worktrees: first.entries.length,
        primary: path.relative(root, first.primary.path) || first.primary.path,
        findings: remaining.map(({ path: findingPath, code, detail }) => ({ path: findingPath, code, detail })),
        reports: reports.map(({ path: reportPath, code, detail }) => ({ path: reportPath, code, detail })),
        repaired: repaired.map((finding) => finding.path),
        pruned: pruned.map((finding) => finding.path),
        skipped: skipped.map((finding) => finding.path),
        verdict,
      }),
    );
  } else {
    console.log(`worktree-guard — ${first.entries.length} worktree(s) · primary ${path.relative(root, first.primary.path) || first.primary.path}`);
    for (const finding of first.findings) {
      console.log(`FINDING ${finding.path} — ${finding.code}: ${finding.detail}`);
    }
    for (const finding of repaired) console.log(`REPAIRED ${finding.path}`);
    for (const report of reports) console.log(`REPORT ${report.path} — ${report.code}: ${report.detail}`);
    for (const finding of pruned) console.log(`PRUNED ${finding.path}`);
    for (const finding of skipped) console.log(`SKIP ${finding.path} — ${finding.detail}`);
    for (const line of suggestions) console.log(line);
    console.log(`worktree-guard: ${remaining.length} finding(s)`);
    console.log(`verdict: ${verdict}`);
  }
  process.exit(verdict === "PASS" ? 0 : 1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2));
}
