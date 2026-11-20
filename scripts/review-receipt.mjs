#!/usr/bin/env node
// cli-command: review-receipt
/**
 * review-receipt.mjs — this repository's caller for the crate's `review-receipt` command
 * (issue #553). The logic lives in
 * `packages/agentic-workflow/src/review-receipt/index.mjs`; this file forwards argv,
 * this checkout's root and the exit code, so the repository's gate and its
 * sibling suite judge the module a target project gets.
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { main } from "../packages/agentic-workflow/src/review-receipt/index.mjs";

export * from "../packages/agentic-workflow/src/review-receipt/index.mjs";

const REPO = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Run only as a program: the sibling suite imports the module's bindings, and an
// import must never dispatch this repository's command.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const code = main(process.argv.slice(2));
  if (code && typeof code.then === "function") {
    code.then((value) => process.exit(value ?? process.exitCode ?? 0));
  } else {
    process.exit(code ?? process.exitCode ?? 0);
  }
}
