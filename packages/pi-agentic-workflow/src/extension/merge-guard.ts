/**
 * The merge guard — owner-only merges, enforced at the `tool_call` gate
 * (issue #278).
 *
 * On 2026-09-29 an agent session ran `gh pr merge` after an owner message that
 * waived only the *review* ("No hace falta una review para esto"), not the
 * merge. Merging is owner-only: prose already says so (`audit-pr` "never
 * merges") and prose demonstrably failed once, so the block lives here, in the
 * same Pi-free layer as the inline-receipt guard (issue #182) — a predicate the
 * shipped adapter binds to `tool_call`, unit-tested with no session.
 *
 * Same philosophy as `receipt-guard`: deterministic over clever. A bash command
 * that merely *mentions* `gh pr merge` (a search for the guard's own text) is
 * blocked like an invocation; the reason tells the agent to search `pr merge`
 * instead. This is a guard, not a wall — it covers what routes through Pi's
 * tool pipeline, exactly like the path-protection guard beside it.
 *
 * Pure on purpose: `index.ts` is the only file that imports Pi values, so this
 * predicate compiles and is tested with no session.
 */

/** The narrow slice of a Pi `tool_call` the guard reads. */
export interface ToolCallLike {
  toolName: string;
  command?: string | undefined;
}

/** The Pi `tool_call` result shape: `block` plus an actionable `reason`. */
export interface MergeGuardDecision {
  block: boolean;
  reason?: string;
}

/** `gh pr merge` as an invoked command, not as a quoted string elsewhere in it. */
const GH_PR_MERGE_RE = /\bgh\s+pr\s+merge\b/;
/** The REST merge endpoint and the GraphQL mutation, both under `gh api`. */
const GH_API_MERGE_RE = /\bgh\s+api\b[\s\S]*(?:pulls\/\d+\/merge\b|mergePullRequest\b)/;
/**
 * `git merge <args>` (optionally after `-C <path>` / `-c <name>`), at a word
 * boundary that is deliberately NOT `-`: `git merge-tree` and `git merge-base`
 * are read-only and the reconciliation flow depends on them (issue #275).
 */
const GIT_MERGE_RE = /(^|[\s;|&()])git\s+(?:-[Cc]\s+\S+\s+)*merge(?![\w-])(?=\s|$)/;

const GH_MERGE_REASON =
  "Merging is owner-only (merge guard, issue #278): a merge command from an agent session is blocked — a review waiver is not merge authorization. " +
  "Open or refresh the PR and hand its URL to the owner (`gh pr view <N> --json url -q .url`); if you were searching text, search `pr merge` instead of `gh pr merge`.";

const GIT_MERGE_REASON =
  "Merging is owner-only (merge guard, issue #278): `git merge` from an agent session is blocked. " +
  "Hand the branch to the owner for integration, or use the read-only forms (`git merge-tree`, `git merge-base`) and rebases, which stay allowed.";

/**
 * The `tool_call` gate. Blocks merge shapes on the `bash` tool only — every
 * other tool passes, and every non-merge command passes. Read-only git
 * (`merge-tree`, `merge-base`), rebases, and PR reads (`gh pr view`, checks,
 * comments) are deliberately out of scope; `gh pr comment` receipts remain the
 * receipt guard's domain.
 */
export function mergeGuard({ toolName, command }: ToolCallLike): MergeGuardDecision {
  if (toolName !== "bash") return { block: false };
  const text = command ?? "";
  if (GH_PR_MERGE_RE.test(text) || GH_API_MERGE_RE.test(text)) {
    return { block: true, reason: GH_MERGE_REASON };
  }
  if (GIT_MERGE_RE.test(text)) {
    return { block: true, reason: GIT_MERGE_REASON };
  }
  return { block: false };
}
