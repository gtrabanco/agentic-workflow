/**
 * The history guard — published history is owner-written, decided by git
 * itself (`git push --dry-run`), not by enumerating spellings.
 *
 * AGENTS.md → Working rules states the way this repository integrates work:
 * short branches off `main`, `main` only advances through a PR, and when `main`
 * moves the conflicted branch is handed back for the owner to integrate. A
 * local `git rebase` is a private rewrite; the moment it is pushed it rewrites
 * commits a reviewer, another session or a CI artifact may already be building
 * on, so the block sits where the rewrite becomes public — on `git push`.
 *
 * The outcome, not the spelling, is what is judged. Every direct `git push`
 * runs first as `git push --dry-run` (the same arguments, plus `--dry-run` —
 * git resolves flags and refspecs itself), and the printed outcome decides: a
 * `(forced update)`, a `[deleted]` ref, or a destination of `main` declines
 * the push. One mechanism covers every force flag spelling and `+`/`:ref`
 * refspec, because the answer comes from git, not from this file. When the
 * dry-run cannot run (offline — where a real push would fail anyway), a simple
 * text check on the push's own segment is the fallback.
 *
 * The guard is config-gated (`guards.history`): off by default for every
 * project, enabled where an operator asks for it. The only way through is an
 * explicit owner instruction in the same turn, carried as the command's first
 * word: `AW_ALLOW=force` — which never enables a push to `main`, because main
 * advances only through a PR.
 *
 * What is deliberately out of scope: payloads hidden inside scripts or
 * interpreter one-liners that never spell `git push` in the command text, and
 * a git alias invoked as `git fp` — the dry-run sees what git is told to push,
 * not what an alias named `fp` expands to. The dry-run sees what git sees; it
 * cannot see what a script builds at runtime, and no text predicate honestly
 * can. The residual risk is documented, not chased with a regex zoo.
 */

import { spawnSync } from "node:child_process";
import { explicitAllow, splitSegments, type GuardDecision, type ToolCallLike } from "./guard-util.js";

/** A direct `git push` (optionally after `-C <path>` / `-c <name=value>`). */
const GIT_PUSH_RE = /(?:^|[\s;|&])git\s+(?:-[Cc]\s+\S+\s+)*push(?![\w-])(?=\s|$)/u;

/** The REST twin of a force push: `gh api` moving a ref with `force`. */
const GH_API_FORCE_REF_RE = /\bgh\s+api\b[\s\S]*refs\/heads\/[\s\S]*\bforce\b/u;

/** Offline fallback — the flags that make a push rewrite or delete. */
const FALLBACK_REWRITE_RE =
  /(?:^|\s)(?:--force(?:-with-lease(?:=\S*)?|-if-includes)?|--mirror|--all|--branches|--delete)(?=\s|$)/u;
const FALLBACK_SHORT_RE = /(?:^|\s)-[a-z]*[fd][a-z]*(?=\s|$)/u;
const FALLBACK_REFSPEC_RE = /(?:^|\s)[+:]\S+|^:\S+/u;
const FALLBACK_MAIN_RE = /(?:^|[\s:])(?:refs\/heads\/)?main(?=\s|$)/u;

/** The outcome a dry-run can report for one push. */
export type PushOutcome = "clean" | "forced" | "deleted" | "main" | "unknown";

export interface PushRunnerResult {
  status: number;
  stdout: string;
  stderr: string;
}

export type PushRunner = (args: string[]) => PushRunnerResult;

/** The default runner: git in the session's working directory. */
export function spawnPushRunner(cwd: string): PushRunner {
  return (args: string[]) => {
    const result = spawnSync("git", ["push", "--dry-run", ...args], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 30_000,
    });
    return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  };
}

/** Shell-tokenize the arguments of one push segment (quotes stripped). */
export function pushArgs(segment: string): string[] {
  const rest = segment.replace(/^[\s]*git\s+(?:-[Cc]\s+\S+\s+)*push(?![\w-])\s?/u, "");
  return rest
    .split(/\s+/u)
    .filter((token) => token !== "")
    .map((token) => token.replace(/^["'`]|["'`]$/gu, ""));
}

/** Read the outcome git printed for one dry-run. */
export function readPushOutcome(result: PushRunnerResult): PushOutcome {
  if (result.status !== 0) return "unknown";
  for (const line of result.stdout.split("\n")) {
    if (/\(forced update\)/u.test(line)) return "forced";
    if (/\[deleted\]/u.test(line)) return "deleted";
    const arrow = /->\s*(\S+)\s*$/u.exec(line.trim());
    if (arrow) {
      const ref = arrow[1].replace(/^refs\/heads\//u, "");
      if (ref === "main") return "main";
    }
  }
  return "clean";
}

/** The offline fallback, scoped to one push segment. */
function fallbackOutcome(segment: string): PushOutcome {
  const args = pushArgs(segment);
  const text = args.join(" ");
  if (FALLBACK_REWRITE_RE.test(` ${text} `) || FALLBACK_SHORT_RE.test(` ${text} `) || FALLBACK_REFSPEC_RE.test(` ${text} `)) {
    return "forced";
  }
  if (FALLBACK_MAIN_RE.test(` ${text} `)) return "main";
  return "unknown";
}

/**
 * The `tool_call` gate. `enabled` comes from the config (`guards.history`);
 * the guard is a no-op while disabled. `runner`/`cwd` are injectable so the
 * suite never touches the network.
 */
export function historyGuard(
  { toolName, command }: ToolCallLike,
  enabled = true,
  { runner, cwd = process.cwd(), offlineFallback = fallbackOutcome }: {
    runner?: PushRunner;
    cwd?: string;
    offlineFallback?: (segment: string) => PushOutcome;
  } = {},
): GuardDecision {
  if (!enabled || toolName !== "bash") return { block: false };
  const text = command ?? "";
  const allow = explicitAllow(text);

  // `gh api` forcing a ref update is a push by other means; the dry-run never
  // sees it, so the text is the only witness.
  if (!allow.has("force") && GH_API_FORCE_REF_RE.test(text)) {
    return { block: true, reason: `${HISTORY_REASON} (blocked: \`gh api\` forcing a ref update)` };
  }

  for (const segment of splitSegments(text)) {
    if (!GIT_PUSH_RE.test(segment)) continue;
    const args = pushArgs(segment);
    const run = runner ?? spawnPushRunner(cwd);
    let outcome = readPushOutcome(run(args));
    if (outcome === "unknown") outcome = offlineFallback(segment);

    if (outcome === "forced" || outcome === "deleted") {
      if (!allow.has("force")) {
        return { block: true, reason: `${HISTORY_REASON} (git reports: ${outcome === "forced" ? "a forced update" : "a ref delete"})` };
      }
    }
    if (outcome === "main") {
      // `force` never enables main: main advances only through a PR.
      return { block: true, reason: `${HISTORY_REASON} (blocked: a push whose destination is \`main\`)` };
    }
  }
  return { block: false };
}

export const HISTORY_REASON =
  "Published history is owner-written (AGENTS.md → Working rules): an agent session does not rewrite, delete or force commits that are already pushed, and never pushes `main` — main advances only through a PR. " +
  "The push was declined by asking git what it would do (`git push --dry-run`). " +
  "Only an explicit owner instruction in this turn (\"Sí, usa force\") enables it, carried as the command's first word: `AW_ALLOW=force` — which never enables a push to `main`. " +
  "A conflict with `main` is resolved by handing the branch back: the owner runs the integration.";
