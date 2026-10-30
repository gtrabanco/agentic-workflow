/**
 * Shared plumbing for the pure `tool_call` guards (`merge-guard`,
 * `history-guard`, `ci-guard`, `cost-guard`): the input shape, the
 * explicit-authorization token, and command segmentation.
 *
 * Pure on purpose: no session, no fs, no Pi — unit-tested with no session,
 * exactly like the guards themselves.
 */

/** The narrow slice of a Pi `tool_call` the guards read. */
export interface ToolCallLike {
  toolName: string;
  command?: string | undefined;
  path?: string | undefined;
}

/** The Pi `tool_call` result shape: `block` plus an actionable `reason`. */
export interface GuardDecision {
  block: boolean;
  reason?: string;
}

/**
 * The explicit-authorization tokens, one per guard capability:
 *
 *   AW_ALLOW=merge  owner-only merges ("Sí, mergea la PR", "Mergea rama B en rama A")
 *   AW_ALLOW=force  a forced/deleting push ("Sí, usa force") — never a push to `main`
 *   AW_ALLOW=ci     creating or triggering CI workflows
 *   AW_ALLOW=cost   running a test estimated above the token budget
 *
 * Only an owner instruction in the same turn lets a guard through, and the
 * authorization must travel with the command it enables: the token is the
 * command's first word (`AW_ALLOW=merge git merge ...`) or follows `env `
 * (`env AW_ALLOW=ci gh workflow run x`). Anywhere else — mid-command, in a
 * search string, in a chained command, in an export — it authorizes nothing,
 * so a command cannot smuggle the token for a later or different action.
 */
const AW_ALLOW_RE = /(?:^|env\s+)AW_ALLOW=([a-z]+(?:,[a-z]+)*)/u;

export function explicitAllow(text: string): Set<string> {
  return new Set(AW_ALLOW_RE.exec(text ?? "")?.[1]?.split(",") ?? []);
}

/**
 * Split a command into shell segments so a flag is never attributed across
 * commands: `docker build -f Dockerfile . && git push origin feat/x` must read
 * as a docker flag plus a clean push, not as a force push.
 */
export function splitSegments(text: string): string[] {
  return String(text ?? "").split(/[;|&\n]/u);
}
