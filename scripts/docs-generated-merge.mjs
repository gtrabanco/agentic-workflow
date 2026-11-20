#!/usr/bin/env node
// cli-command: docs-generated-merge
/**
 * docs-generated-merge.mjs — this repository's caller for the crate's
 * `docs-generated-merge` command (issue #553). The driver, the install path and
 * the covered surfaces live in
 * `packages/agentic-workflow/src/docs-generated-merge/index.mjs`.
 *
 * The driver line this repository arms names *this* file — it is an entry git
 * can run, and it lives inside the checkout, so the armed command stays
 * relocatable — which is why `driverCommand` is re-exported bound to it.
 *
 *   bun scripts/docs-generated-merge.mjs --install [--repo <dir>]
 *   bun scripts/docs-generated-merge.mjs <base> <ours> <theirs> [marker-size] [path]
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { driverCommand as crateDriverCommand, main } from "../packages/agentic-workflow/src/docs-generated-merge/index.mjs";

export * from "../packages/agentic-workflow/src/docs-generated-merge/index.mjs";

const ENTRY = fileURLToPath(import.meta.url);

/** The driver line an armed checkout runs: this entry, never the crate module. */
export function driverCommand(root) {
  return crateDriverCommand(root, ENTRY);
}

// Run only as a program: the sibling suite imports the module's bindings, and an
// import must never dispatch this repository's command.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2), { entry: ENTRY }));
}
