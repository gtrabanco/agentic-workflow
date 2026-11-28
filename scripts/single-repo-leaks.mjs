#!/usr/bin/env node
// cli-command: single-repo-leaks
/**
 * single-repo-leaks.mjs — this repository's caller for the crate's
 * `single-repo-leaks` command (issue #717). The logic lives in
 * `packages/agentic-workflow/src/single-repo-leaks/index.mjs`; this file forwards
 * argv, this checkout's root and the exit code, so the repository's gate and its
 * sibling suite judge the module a target project gets.
 *
 * The root passed here is the product root: the probe distinguishes a path this
 * repository carries from one the measured project carries, and this caller is
 * the one that knows where the product tree is.
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { main } from "../packages/agentic-workflow/src/single-repo-leaks/index.mjs";

export * from "../packages/agentic-workflow/src/single-repo-leaks/index.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Run only as a program: the sibling suite imports the module's bindings, and an
// import must never dispatch this repository's command.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const code = await main(process.argv.slice(2), { root: REPO });
  process.exit(code ?? process.exitCode ?? 0);
}
