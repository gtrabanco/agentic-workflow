#!/usr/bin/env node
// cli-command: session-close
/**
 * session-close.mjs — this repository's caller for the crate's `session-close`
 * command (issue #553). The facts, the append-only proof and the alone-commit
 * live in `packages/agentic-workflow/src/session-close/index.mjs`, and the
 * crate's command is what the pi handler resolves in a project that ships no
 * `scripts/` tree (S5).
 *
 *   bun scripts/session-close.mjs render --summary "<…>" [--decisions "<…>"] [--next "<…>"]
 *   bun scripts/session-close.mjs close
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { main } from "../packages/agentic-workflow/src/session-close/index.mjs";

export * from "../packages/agentic-workflow/src/session-close/index.mjs";

// Run only as a program: the sibling suite imports the renderers, and an import
// must never dispatch this repository's command.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
