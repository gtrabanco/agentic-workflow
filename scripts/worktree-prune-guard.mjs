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
 *   ask               print `Prune <N> stale worktrees? [y/N]: ` on stderr
 *                     with the true candidate count and proceed only on an
 *                     affirmative answer. When no answer can arrive — a stdin
 *                     that already ended, a closed device, or the explicit
 *                     no-TTY opt-out — it refuses rather than hang on a
 *                     prompt nobody reads
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
 * It never *targets* a working tree: the candidate list is directories that are
 * already gone, so `git worktree prune` reclaims administration metadata and a
 * present tree outside git's admin namespace — its uncommitted files included —
 * is untouched by every policy. One measured limit the policy does not cover:
 * an entry under `.git/worktrees/` that is not a valid registration (a checkout
 * dropped into git's private namespace) is deleted recursively by git's own
 * prune, live tree and files included. The docs record exactly that, and
 * `IR8`/the `ADMIN_NAMESPACE` finding — never this policy — is what keeps
 * worktrees out of there. Every candidate is listed before the policy decision
 * so the operator sees what the decision is about; lost work outside that
 * namespace means the directory vanished first — the `CORRUPTED` finding,
 * whose fix is `git worktree repair`.
 *
 * stdout: the `worktree-prune-guard —` header, one `PRUNE <path>` line per
 * candidate (the listing precedes the decision; there is no path flag:
 * `git worktree remove` reads its argument from the deny text), and the
 * verdict — `DENIED` · `DECLINED` · `DRY-RUN` · `NO-OP` · `PRUNED`. The refusal
 * or abort text is written once, on stderr; `--json` emits exactly one envelope
 * on stdout (its listing goes to stderr) instead of the text block.
 * exit: 0 the prune ran, there was nothing to prune, or a dry run · git's own
 * status when the delegate fails · 1 refused by policy or declined at the
 * prompt · 2 usage.
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
exit: 0 prune ran / nothing to prune · git's own status on a failed prune ·
1 refused by policy · 2 usage`;

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
 *  other (that is how a script or a CI job says yes), so only a stdin that
 *  already ended, is destroyed, or is the explicit no-TTY opt-out refuses; an
 *  answer channel that may still deliver bytes is worth waiting for. */
function canPrompt() {
  if (process.env.WORKTREE_PRUNE_GUARD_NO_TTY === "1") return false;
  return !process.stdin.destroyed && !process.stdin.readableEnded;
}

/** The `[y/N]` question. Resolves `true`/`false` for an explicit answer and
 *  `null` when the input closes without one — a question whose stream ends must
 *  settle the promise (external verify B3 froze the hang it caused otherwise),
 *  so the caller refuses instead of waiting on a prompt nobody reads. */
function ask(candidates) {
  return new Promise((resolve) => {
    const question = `Prune ${candidates.length} stale worktrees? [y/N]: `;
    const reader = createInterface({ input: process.stdin, output: process.stderr, terminal: false });
    let settled = false;
    const finish = (answer) => {
      if (settled) return;
      settled = true;
      resolve(answer);
    };
    reader.question(question, (answer) => {
      finish(/^y(es)?$/i.test(answer.trim()));
      reader.close();
    });
    reader.on("close", () => finish(null));
  });
}

async function main(argv) {
  const { repo, dryRun, json } = parseArgs(argv);
  const policy = resolvePolicy(repo);
  const candidates = pruneCandidates(repo);

  // AC5: every path the guard may prune is listed before the policy decision,
  // so the operator sees what the decision is about. Text mode keeps the
  // receipt on stdout; the machine envelope keeps stdout to exactly one JSON
  // object and carries its listing on stderr.
  if (json) {
    for (const candidate of candidates) process.stderr.write(`PRUNE ${candidate}\n`);
  } else {
    console.log(`worktree-prune-guard — policy "${policy}" · ${candidates.length} candidate(s)`);
    for (const candidate of candidates) console.log(`PRUNE ${candidate}`);
  }

  let verdict;
  let pruned = false;
  let message = "";

  if (policy === "deny") {
    verdict = "DENIED";
    message = [
      `ERROR: git worktree prune is blocked by policy "${policy}".`,
      "To remove a worktree manually: git worktree remove /path/to/worktree",
      `To change this policy: git config ${POLICY_KEY} ask|allow|deny`,
    ].join("\n");
  } else if (policy === "ask" && candidates.length > 0 && !dryRun) {
    const NO_ANSWER = `no interactive terminal: policy "ask" cannot prompt, refusing. Run --dry-run to list the candidates, or set policy to allow.`;
    if (!canPrompt()) {
      verdict = "DENIED";
      message = NO_ANSWER;
    } else {
      const answer = await ask(candidates);
      if (answer === null) {
        verdict = "DENIED";
        message = NO_ANSWER;
      } else if (!answer) {
        verdict = "DECLINED";
        message = "aborted — nothing pruned.";
      }
    }
  }

  if (verdict === undefined) {
    if (dryRun) {
      verdict = "DRY-RUN";
    } else if (candidates.length === 0) {
      verdict = "NO-OP";
    } else {
      const result = git(["worktree", "prune"], repo);
      if (result.status !== 0) {
        process.stderr.write(`worktree-prune-guard: git worktree prune failed (${(result.stderr ?? "").trim()})\n`);
        // AC4: the delegate's own status passes through, never a mapped code.
        process.exit(result.status ?? 1);
      }
      pruned = true;
      verdict = "PRUNED";
    }
  }

  const failed = verdict === "DENIED" || verdict === "DECLINED";
  if (failed) process.stderr.write(`${message}\n`);
  if (json) {
    console.log(JSON.stringify({ policy, candidates, pruned, verdict }));
  } else {
    console.log(`verdict: ${verdict}`);
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main(process.argv.slice(2));
}
