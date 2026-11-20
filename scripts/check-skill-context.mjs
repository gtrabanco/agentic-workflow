#!/usr/bin/env node
// cli-command: skill-context
/**
 * check-skill-context.mjs — this repository's caller for the crate's
 * `skill-context` command (issue #553). The measurement and the ceilings live in
 * `packages/agentic-workflow/src/skill-context/index.mjs`; this file forwards
 * argv, this checkout's root and the exit code, so the gate step and the sibling
 * suite judge the module a target project gets.
 *
 *   bun scripts/check-skill-context.mjs [<skill>…] [--routes] [--documents] [--json]
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { main } from "../packages/agentic-workflow/src/skill-context/index.mjs";

export * from "../packages/agentic-workflow/src/skill-context/index.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Run only as a program: an import must never measure this repository's tree.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2), { root: REPO }) ?? process.exitCode ?? 0);
}
