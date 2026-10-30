/**
 * The CI guard — creating and triggering CI is owner-gated.
 *
 * Two routes, both config-gated (`guards.ci.create` / `guards.ci.run`; off by
 * default for every project):
 *
 *   create  a write/edit that adds or changes a workflow definition — under
 *           `.github/workflows/`, `.gitea/workflows/`, `.forgejo/workflows/`,
 *           or a `.gitlab-ci.yml` — is blocked. A workflow file is code the
 *           forge runs on the next push; writing one is arming it.
 *   run     `gh workflow run`, `gh run rerun`, and the `dispatches` REST
 *           endpoint are blocked: triggering CI consumes the repo's minutes
 *           and runs its automation without the owner watching.
 *
 * The only way through is an explicit owner instruction in the same turn,
 * carried as the command's first word: `AW_ALLOW=ci`. Reads (`gh workflow
 * list`, `gh run list`, `gh run view`) are not gated.
 */

import { explicitAllow, type GuardDecision, type ToolCallLike } from "./guard-util.js";

const WORKFLOW_PATH_RE = /(?:^|\/)\.(?:github|gitea|forgejo)\/workflows\/|(?:^|\/)\.gitlab-ci\.yml$/u;

const CI_RUN_RE = /\bgh\s+(?:workflow\s+run|run\s+rerun)\b|actions\/workflows\/[^/\s"']+\/dispatches\b/u;

export const CI_CREATE_REASON =
  "Creating CI is owner-gated (ci guard): a workflow definition is code the forge runs on the next push, so an agent session does not write one unannounced. " +
  "Only an explicit owner instruction in this turn enables it, carried as the command's first word: `AW_ALLOW=ci`.";

export const CI_RUN_REASON =
  "Running CI is owner-gated (ci guard): a workflow run consumes the repository's minutes and fires its automation, so an agent session does not trigger one unannounced. " +
  "Only an explicit owner instruction in this turn enables it, carried as the command's first word: `AW_ALLOW=ci`.";

/**
 * The `tool_call` gate. `create` judges write/edit targets, `run` judges bash
 * commands; both are no-ops while disabled. Reads pass.
 */
export function ciGuard(
  { toolName, command, path }: ToolCallLike,
  policy: { create: boolean; run: boolean } = { create: false, run: false },
): GuardDecision {
  if (policy.create && (toolName === "write" || toolName === "edit") && path !== undefined && WORKFLOW_PATH_RE.test(path)) {
    if (!explicitAllow(command ?? "").has("ci")) return { block: true, reason: CI_CREATE_REASON };
  }
  if (policy.run && toolName === "bash" && command !== undefined && !explicitAllow(command).has("ci") && CI_RUN_RE.test(command)) {
    return { block: true, reason: CI_RUN_REASON };
  }
  return { block: false };
}
