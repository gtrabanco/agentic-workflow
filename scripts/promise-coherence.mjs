#!/usr/bin/env node
// cli-command: promise-coherence
/**
 * promise-coherence.mjs — this repository's caller for the crate's
 * `promise-coherence` command (issue #553). The claim re-measurement lives in
 * `packages/agentic-workflow/src/promise-coherence/index.mjs`; this file
 * forwards argv, this checkout's root and the exit code.
 *
 *   bun scripts/promise-coherence.mjs [zero or more explicit paths]
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { runCli } from "../packages/agentic-workflow/src/promise-coherence/index.mjs";

export * from "../packages/agentic-workflow/src/promise-coherence/index.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Run only as a program: an import must never run this repository's pass.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(runCli(process.argv.slice(2), { root: REPO }));
}
