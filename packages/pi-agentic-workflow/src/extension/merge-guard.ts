/**
 * The merge guard — owner-only merges at the `tool_call` gate (issue #278).
 *
 * On 2026-09-29 an agent session ran `gh pr merge` after an owner message that
 * waived only the *review* ("No hace falta una review para esto"), not the
 * merge. Merging is owner-only, and the direct routes are self-evident — a
 * command that *is* a merge needs no simulation and no spelling census:
 *
 *   `git merge <ref>`   the command is a merge (read-only forms —
 *                       `merge-tree`, `merge-base`, `merge-file` — stay out).
 *   `gh pr merge`       the command merges the PR.
 *   `gh api` merge      the REST endpoint (`pulls/N/merge`) and the GraphQL
 *                       mutations (`mergePullRequest`, `mergeBranch`,
 *                       `enablePullRequestAutoMerge`) — the same merge by
 *                       other syntax, still self-evident.
 *   `git pull`          fetch + merge by default; only `--rebase`/`--ff-only`
 *                       (no merge commit) pass.
 *
 * The guard is config-gated (`guards.merge`): off by default for every
 * project, enabled where an operator asks for it. The only way through is an
 * explicit owner instruction in the same turn, carried as the command's first
 * word: `AW_ALLOW=merge`.
 *
 * What is deliberately out of scope: merges hidden inside scripts or
 * interpreter one-liners. A text predicate that chased every wrapper would
 * grow a regex zoo and still miss the file it never read; the direct routes
 * above are the honest boundary.
 */

import { explicitAllow, splitSegments, type GuardDecision, type ToolCallLike } from "./guard-util.js";

/** `git merge` at a word boundary — `merge-tree`/`merge-base`/`merge-file` stay out. */
const GIT_MERGE_RE = /(?:^|[\s;|&])git\s+(?:-[Cc]\s+\S+\s+)*merge(?![\w-])(?=\s|$)/u;

/** `git pull` — merge by default. */
const GIT_PULL_RE = /(?:^|[\s;|&])git\s+(?:-[Cc]\s+\S+\s+)*pull(?![\w-])(?=\s|$)/u;

/** pull flags that make it a rebase or a fast-forward-only update: no merge commit. */
const PULL_NO_MERGE_RE = /(?:^|\s)(?:--rebase(?:=(?!=false)\S*)?|--ff-only|-[a-z]*r[a-z]*)(?=\s|$)/u;

/** pull flags that force the merge form back on. */
const PULL_MERGE_RE = /(?:^|\s)(?:--no-rebase|--rebase=false)(?=\s|$)/u;

const GH_PR_MERGE_RE = /\bgh\s+pr\s+merge\b/u;

/** The REST endpoint and GraphQL mutations that are a merge by other syntax. */
const GH_API_MERGE_RE =
  /\bgh\s+api\b[\s\S]*(?:pulls\/\d+\/merge\b|\b(?:mergePullRequest|mergeBranch|enablePullRequestAutoMerge)\b)/u;

/** The merge shape one command segment carries, or null. */
function mergeShape(segment: string): string | null {
  if (GH_PR_MERGE_RE.test(segment)) return "`gh pr merge`";
  if (GH_API_MERGE_RE.test(segment)) return "a `gh api` merge endpoint or mutation";
  if (GIT_MERGE_RE.test(segment)) return "`git merge`";
  if (GIT_PULL_RE.test(segment)) {
    if (PULL_MERGE_RE.test(segment)) return "`git pull` in its merge form";
    if (!PULL_NO_MERGE_RE.test(segment)) {
      return "`git pull` in its merge form (use `git pull --rebase`, `--ff-only`, or `git fetch` + ask)";
    }
  }
  return null;
}

export const MERGE_REASON =
  "Merging is owner-only (merge guard, issue #278): a merge command from an agent session is blocked — a review waiver is not merge authorization. " +
  "Only an explicit owner instruction in this turn (\"Sí, mergea la PR\" / \"Mergea rama B en rama A\") enables it, carried as the command's first word: `AW_ALLOW=merge`. " +
  "Otherwise: resolve the files, report, and hand the branch to the owner (`gh pr view <N> --json url -q .url`). " +
  "If you were searching text, search `pr merge` instead of `gh pr merge`.";

/**
 * The `tool_call` gate. Blocks merge shapes on the `bash` tool only — every
 * other tool passes, and every non-merge command passes. `enabled` comes from
 * the config (`guards.merge`); the guard is a no-op while disabled.
 */
export function mergeGuard({ toolName, command }: ToolCallLike, enabled = true): GuardDecision {
  if (!enabled || toolName !== "bash") return { block: false };
  const text = command ?? "";
  if (explicitAllow(text).has("merge")) return { block: false };
  for (const segment of splitSegments(text)) {
    const shape = mergeShape(segment);
    if (shape) return { block: true, reason: `${MERGE_REASON} (blocked: ${shape})` };
  }
  return { block: false };
}
