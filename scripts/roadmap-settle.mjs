#!/usr/bin/env node
// cli-command: roadmap-settle
/**
 * roadmap-settle.mjs — this repository's caller for the crate's
 * `roadmap-settle` command (issue #553). The comparison, the codes and the
 * exit contract live in `packages/agentic-workflow/src/roadmap-settle/index.mjs`;
 * this file forwards argv, this checkout's root and the exit code.
 *
 *   bun scripts/roadmap-settle.mjs [--json]
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { main } from "../packages/agentic-workflow/src/roadmap-settle/index.mjs";

export * from "../packages/agentic-workflow/src/roadmap-settle/index.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Run only as a program: the sibling suite imports the module's bindings, and an
// import must never dispatch this repository's command.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2), { root: REPO }));
}
