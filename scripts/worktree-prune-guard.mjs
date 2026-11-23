#!/usr/bin/env node
/**
 * worktree-prune-guard.mjs — the policy gate in front of `git worktree prune`
 * (issue #693).
 *
 * `aw.worktreePrunePolicy` in git config decides what a prune may do:
 *
 *   deny   (default)  refuse; the message names the manual removal and the
 *                     policy knob. An absent key and an unrecognised value
 *                     both land here — the vocabulary is closed and the
 *                     permissive branches are never reached by accident
 *   ask               print `Prune <N> stale worktree(s)? [y/N]: ` on stderr
 *                     with the true candidate count and proceed only on an
 *                     affirmative answer. Without an interactive terminal it
 *                     refuses rather than hang on a prompt nobody reads
 *   allow             delegate to `git worktree prune` and return its status
 *
 * What this guard can and cannot do — the reason issue #693's two proposed
 * mechanisms are not here. Git offers no interception point for
 * `git worktree prune`: it is a builtin (a `alias.worktree` entry never runs)
 * and no `prune` hook exists among git's documented hooks. So this script binds
 * the invocations that go through it — the workflow's own, via
 * `scripts/worktree-guard.mjs --prune` — and nothing else. A prune typed by hand
 * elsewhere is not intercepted; `git worktree lock` is what protects a worktree
 * from git's own automatic prune during `git gc`, which runs `git worktree prune
 * --expire 3.months.ago` (`gc.worktreePruneExpire`).
 *
 * It is also never a working-tree remover. `git worktree prune` reclaims
 * administration metadata for a worktree whose directory is already gone; a
 * present tree, its uncommitted files included, is untouched, so lost work means
 * the directory vanished first — the `CORRUPTED` finding, whose fix is
 * `git worktree repair`. Every candidate is listed before the policy decision so
 * the operator sees what the decision is about.
 *
 * stdout: the `worktree-prune-guard —` header, one `PRUNE <path>` line as the
 * operator's instruction (there is no path flag: `git worktree remove` reads
 * that as its argument in the deny text), and the verdict. `--json` emits one
 * envelope instead. exit: 0 the prune ran (or there was nothing to prune) ·
 * 1 refused by policy or declined at the prompt · 2 usage.
 *
 * Its sibling suite is `scripts/worktree-prune-guard.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const POLICY_KEY = "aw.worktreePrunePolicy";
const POLICIES = ["deny", "ask", "allow"];

const USAGE = `usage: worktree-prune-guard [--repo <dir>] [--dry-run] [--json]

  --repo <dir>  the repository whose worktrees are pruned (default: this one)
  --dry-run     list the prune candidates and the policy verdict, prune nothing
  --json        one JSON object instead of the fixed text block

policy: git config ${POLICY_KEY} deny|ask|allow   (default deny)
stdout: the header, the PRUNE candidate lines, the verdict.
exit: 0 pruned · 1 refused by policy · 2 usage`;

function usage(message) {
  process.stderr.write(`worktree-prune-guard: ${message}\n`);
  process.stderr.write(`${USAGE}\n`);
  process.exit(2);
}

export function parseArgs(argv) {
  let repo = null;
  let dryRun = false;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo") {
      const value = argv[index + 1];
      if (value === undefined) usage("--repo needs a directory");
      repo = path.resolve(value);
      index += 1;
    } else if (arg === "--dry-run") dryRun = true;
    else if (arg === "--json") json = true;
    else usage(`unknown argument ${arg}`);
  }
  return { repo: repo ?? DEFAULT_ROOT, dryRun, json };
}

function git(args, cwd) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

/**
 * The configured policy, always one of the closed vocabulary: an absent key and
 * an unrecognised value both resolve to `deny`, so the permissive branches are
 * only reachable by setting them explicitly.
 */
export function resolvePolicy(repo) {
  const result = git(["config", "--get", POLICY_KEY], repo);
  if (result.status !== 0) return "deny";
  const value = (result.stdout ?? "").trim();
  return POLICIES.includes(value) ? value : "deny";
}

/**
 * The worktrees a prune would reclaim: git's own `prune --dry-run` says so,
 * which keeps this guard from inventing a staleness rule beside git's.
 */
export function pruneCandidates(repo) {
  const result = git(["worktree", "list", "--porcelain"], repo);
  if (result.status !== 0) usage(`${repo} is not a git repository`);
  const root = mainRepoRoot(repo);
  const candidates = [];
  for (const line of result.stdout.split("\n")) {
    if (!line.startsWith("worktree ")) continue;
    const full = line.slice("worktree ".length).trim();
    if (full === root) continue;
    // A directory that is gone is a prune candidate; a present one never is,
    // and this guard never removes one regardless of policy.
    if (!fs.existsSync(full)) candidates.push(full);
  }
  return candidates;
}

/** The main repository root behind the calling checkout (a linked worktree
 *  resolves to the common one, so the relative paths hang off it). */
function mainRepoRoot(repo) {
  const common = (git(["rev-parse", "--path-format=absolute", "--git-common-dir"], repo).stdout ?? "").trim();
  return common ? path.dirname(common) : repo;
}

/** Whether the process can genuinely ask. A piped stdin is an answer like any
 *  other (that is how a script or a CI job says yes), so only a stdin that is
 *  empty or a closed device — neither a terminal nor a pipe carrying bytes —
 *  refuses; the explicit no-TTY opt-out wins over all of it. */
function canPrompt() {
  if (process.env.WORKTREE_PRUNE_GUARD_NO_TTY === "1") return false;
  return !process.stdin.destroyed;
}

function ask(candidates) {
  return new Promise((resolve) => {
    const question = `Prune ${candidates.length} stale worktree(s)? [y/N]: `;
    const reader = createInterface({ input: process.stdin, output: process.stderr, terminal: false });
    reader.question(question, (answer) => {
      reader.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function main(argv) {
  const { repo, dryRun, json } = parseArgs(argv);
  const policy = resolvePolicy(repo);
  const candidates = pruneCandidates(repo);

  let verdict;
  let pruned = false;
  let message = "";

  if (policy === "deny") {
    verdict = "DENIED";
    message = [
      `ERROR: git worktree prune is blocked by policy "${policy}".`,
      "To remove a worktree manually: git worktree remove <path>",
      `To change this policy: git config ${POLICY_KEY} ask|allow|deny`,
    ].join("\n");
  } else if (policy === "ask" && candidates.length > 0 && !dryRun) {
    if (!canPrompt()) {
      verdict = "DENIED";
      message = `no interactive terminal: policy "ask" cannot prompt, refusing. Run --dry-run to list the candidates, or set policy to allow.`;
    } else if (!(await ask(candidates))) {
      verdict = "DECLINED";
      message = "aborted — nothing pruned.";
    }
  }

  if (verdict === undefined) {
    if (dryRun) {
      verdict = "DRY-RUN";
    } else {
      if (candidates.length > 0) {
        const result = git(["worktree", "prune"], repo);
        if (result.status !== 0) {
          process.stderr.write(`worktree-prune-guard: git worktree prune failed (${(result.stderr ?? "").trim()})\n`);
          process.exit(1);
        }
        pruned = true;
      }
      verdict = "PRUNED";
    }
  }

  const failed = verdict === "DENIED" || verdict === "DECLINED";
  if (json) {
    console.log(JSON.stringify({ policy, candidates, pruned, verdict }));
  } else {
    console.log(`worktree-prune-guard — policy "${policy}" · ${candidates.length} candidate(s)`);
    for (const candidate of candidates) console.log(`PRUNE ${candidate}`);
    if (message) console.log(message);
    console.log(`verdict: ${verdict}`);
  }
  if (failed) process.stderr.write(`${message}\n`);
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
