#!/usr/bin/env node
/**
 * shared-doc-merge.mjs — the root entry of the shared-document merge drivers
 * (issue #498), and the command `.gitattributes`-armed checkouts and
 * `docs/workflow/*`'s instructions name.
 *
 * The mechanics are the crate's (`packages/agentic-workflow/src/writer/shared-merge.mjs`,
 * moved there by issue #630 so the universal CLI can arm a driver in a project
 * that ships no `scripts/` tree). This file is the entry, not a second copy:
 * it re-exports the published vocabulary the root suites and the drift gate
 * read, and it tells the arming which file the armed command must name.
 *
 *   bun scripts/shared-doc-merge.mjs --install [--repo <dir>]
 *   bun scripts/shared-doc-merge.mjs <class> <base> <ours> <theirs> [marker-size] [path]
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../packages/agentic-workflow/src/writer/shared-merge.mjs";

export * from "../packages/agentic-workflow/src/writer/shared-merge.mjs";

const ENTRY = fileURLToPath(import.meta.url);

// Run only as a program: the sibling suite imports the class map, the refusal
// vocabulary and the driver line.
if (process.argv[1] && path.resolve(process.argv[1]) === ENTRY) {
  main(process.argv.slice(2), { entry: ENTRY });
}
