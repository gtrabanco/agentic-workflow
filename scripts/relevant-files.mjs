#!/usr/bin/env node
// cli-command: relevant-files
/**
 * relevant-files.mjs — this repository's caller for the crate's
 * `relevant-files` command (issue #553). The read-set parsing, the discipline
 * and the exit contract live in
 * `packages/agentic-workflow/src/relevant-files/index.mjs`; this file forwards
 * argv and the exit code, so the repository's gate and its sibling suite keep
 * running the identical module a target project gets from the CLI.
 *
 *   bun scripts/relevant-files.mjs <unit-doc> --phase P<k>|all
 *   bun scripts/relevant-files.mjs <unit-doc> [--changed a,b | --base <ref>]
 */

import process from "node:process";

import { main } from "../packages/agentic-workflow/src/relevant-files/index.mjs";

export * from "../packages/agentic-workflow/src/relevant-files/index.mjs";

process.exit(main(process.argv.slice(2)));
