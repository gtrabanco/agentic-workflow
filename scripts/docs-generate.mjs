#!/usr/bin/env node
// cli-command: docs-generate
/**
 * docs-generate.mjs — this repository's caller for the crate's `docs-generate`
 * command (issue #553). The projection, the emitters and the drift report live
 * in `packages/agentic-workflow/src/docs-generate/index.mjs`; this file forwards
 * argv, this checkout's root and the exit code, so the repository's gate step
 * and its sibling suite judge the same module a target project gets.
 *
 *   bun scripts/docs-generate.mjs [--check | --dry-run] [--root <dir>]
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { main } from "../packages/agentic-workflow/src/docs-generate/index.mjs";

export * from "../packages/agentic-workflow/src/docs-generate/index.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Run only as a program: the sibling suite imports the module's bindings, and an
// import must never dispatch this repository's command.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2), { root: REPO }));
}
