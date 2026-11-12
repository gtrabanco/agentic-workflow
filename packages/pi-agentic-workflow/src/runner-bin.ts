/**
 * runner-bin — where the runtime commands live.
 *
 * The workflow's sensors and guards ship inside `@gtrabanco/agentic-workflow`
 * (feature 91, issue #352), not in a project's `scripts/`. Every spawn in this
 * package therefore names this one path plus the subcommand, so a project that
 * installed the skills needs nothing else, and this package never guesses a
 * project-relative script location.
 */

import { createRequire } from "node:module";

let resolved: string | null = null;

/**
 * The absolute path of the runner's bin, resolved once from this package's own
 * dependency — the copy the installed release actually carries.
 */
export function runnerBin(): string {
  // The documented local/canary override (skills/runner-contract/references/
  // RUNNER.md): a bare path runs that build instead of the installed release, so
  // a test or a pre-release check never has to touch the resolved dependency.
  const override = process.env.AGENTIC_WORKFLOW_RUNNER;
  if (typeof override === "string" && override !== "" && !override.includes(" ")) return override;
  if (resolved === null) {
    resolved = createRequire(import.meta.url).resolve("@gtrabanco/agentic-workflow/bin/agentic-workflow.mjs");
  }
  return resolved;
}
