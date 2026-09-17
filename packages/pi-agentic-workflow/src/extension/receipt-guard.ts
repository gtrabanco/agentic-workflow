/**
 * The inline-receipt guard and the dirty-worktree notice — the two Pi-free
 * decisions the extension's lifecycle adapter binds (issue #182).
 *
 * `review-change` and `audit-pr` used to post their PR receipts through a bash
 * heredoc: a model assembled the marker inline, ran `gh pr comment --body "…"`,
 * re-read the thread and retried. Nothing proved the receipt landed, so a review
 * could print `REVIEW-PASS` while the PR had no current marker. Two scripts now
 * own that mechanically — `scripts/review-receipt.mjs emit` and
 * `scripts/audit-pr-gate.mjs comment` — each posting the body from standard input,
 * re-reading the PR and exiting 0 only when the marker names the reviewed head.
 * This guard blocks the inline path before it runs, so the unverifiable route is
 * impossible rather than discouraged.
 *
 * Pure on purpose: `index.ts` is the only file that imports Pi values, so these
 * predicates compile and are tested with no session.
 */

/** The narrow slice of a Pi `tool_call` the guard reads. */
export interface ToolCallLike {
  toolName: string;
  command?: string | undefined;
}

/** The Pi `tool_call` result shape: `block` plus an actionable `reason`. */
export interface ReceiptGuardDecision {
  block: boolean;
  reason?: string;
}

/** `gh pr comment` as an invoked command, not as a quoted string elsewhere in it. */
const GH_PR_COMMENT_RE = /\bgh\s+pr\s+comment\b/;
const REVIEW_MARKER = "review-change:pass";
const AUDIT_MARKER = "audit-pr:merge-ready";
const BODY_FILE_FLAG = "--body-file";

const REVIEW_REASON =
  "`gh pr comment` with an inline `review-change:pass` body is blocked: inline receipt bodies are unverifiable, so nothing proves the marker landed on the PR. " +
  "Use `bun scripts/review-receipt.mjs emit --pr <N> --head <40-hex> …` instead — it posts the receipt, re-reads the PR, and exits 0 only when the marker names the reviewed head.";

const AUDIT_REASON =
  "`gh pr comment` with an inline `audit-pr:merge-ready` body is blocked: inline receipt bodies are unverifiable, so nothing proves the marker landed on the PR. " +
  "Use `bun scripts/audit-pr-gate.mjs comment --pr <N> --head <40-hex> …` instead — it posts the comment idempotently and confirms the marker names the audited head.";

/**
 * The `tool_call` gate. Blocks exactly one shape: a bash command that invokes
 * `gh pr comment` and carries a receipt marker as inline text. A `--body-file`
 * invocation is the scripts' own path and is allowed; a command that merely
 * mentions a marker (editing the skill docs) is allowed; every non-bash tool is
 * allowed.
 */
export function receiptGuard({ toolName, command }: ToolCallLike): ReceiptGuardDecision {
  if (toolName !== "bash") return { block: false };
  const text = command ?? "";
  if (!GH_PR_COMMENT_RE.test(text)) return { block: false };
  if (text.includes(BODY_FILE_FLAG)) return { block: false };
  if (text.includes(REVIEW_MARKER)) return { block: true, reason: REVIEW_REASON };
  if (text.includes(AUDIT_MARKER)) return { block: true, reason: AUDIT_REASON };
  return { block: false };
}

/** How many porcelain lines the warning quotes before summarising the rest. */
const WARNING_PREVIEW = 5;

/**
 * The `agent_settled` notice. `porcelain` is `git status --porcelain` output;
 * an empty (or whitespace-only) string stays silent, and a non-empty one yields
 * one concise warning naming what is dirty. Decision only — the adapter runs
 * git and delivers the message.
 */
export function dirtyWorktreeWarning(porcelain: string): string | undefined {
  const lines = String(porcelain ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return undefined;
  const preview = lines.slice(0, WARNING_PREVIEW).join(", ");
  const rest = lines.length > WARNING_PREVIEW ? `, +${lines.length - WARNING_PREVIEW} more` : "";
  return `Uncommitted changes in the worktree (${lines.length}): ${preview}${rest} — commit or stash before this change is reviewed.`;
}
