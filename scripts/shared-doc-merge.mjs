#!/usr/bin/env node
// cli-command: shared-merge
/**
 * shared-doc-merge.mjs — this repository's caller for the crate's `shared-merge`
 * command (issue #553). The mechanics are
 * `packages/agentic-workflow/src/writer/shared-merge.mjs` (moved there by issue
 * #630), and the command is `src/shared-merge/index.mjs`.
 *
 * The armed driver line names *this* file — an entry git can run, inside the
 * checkout, so the armed command stays relocatable — which is why
 * `driverCommand` is re-exported bound to it.
 *
 *   bun scripts/shared-doc-merge.mjs --install [--repo <dir>]
 *   bun scripts/shared-doc-merge.mjs <class> <base> <ours> <theirs> [marker-size] [path]
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { driverCommand as crateDriverCommand, main } from "../packages/agentic-workflow/src/shared-merge/index.mjs";

export * from "../packages/agentic-workflow/src/shared-merge/index.mjs";

const ENTRY = fileURLToPath(import.meta.url);

/** The driver line an armed checkout runs: this entry, never the crate module. */
export function driverCommand(root, cls) {
  return crateDriverCommand(root, cls, ENTRY);
}

// Run only as a program: the sibling suite imports the module's bindings, and an
// import must never dispatch this repository's command.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2), { entry: ENTRY }));
}
