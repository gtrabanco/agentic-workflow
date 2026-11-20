#!/usr/bin/env node
// cli-command: test-impact
/**
 * test-impact.mjs — this repository's caller for the crate's `test-impact`
 * command (issue #553, which decided the seam S4 left open: a CLI subcommand,
 * never a project-local script). The symbol/path/sibling/LSP union and the
 * fixed block live in `packages/agentic-workflow/src/test-impact/index.mjs`.
 *
 *   bun scripts/test-impact.mjs --base <rev> [--paths <p>…] [--references <file>]
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { main } from "../packages/agentic-workflow/src/test-impact/index.mjs";

export * from "../packages/agentic-workflow/src/test-impact/index.mjs";

// Run only as a program: the sibling suite imports the classifiers, and an
// import must never dispatch this repository's command.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
