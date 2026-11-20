#!/usr/bin/env node
/**
 * docs-generated-merge.mjs — the crate's entry of the generated-projection
 * merge driver (fix #420, issue #553).
 *
 * A project that installs this package but ships no `scripts/` tree arms this
 * file: the driver line `.gitattributes`-armed checkouts run must name a file
 * git can execute, and the mechanics live in
 * `src/docs-generated-merge/index.mjs` — one implementation, two entries.
 *
 *   agentic-workflow docs-generated-merge --install [--repo <dir>]
 *   agentic-workflow docs-generated-merge <base> <ours> <theirs> [marker-size] [path]
 *
 * The second form is what git expands `%O %A %B %L %P` into, so the armed
 * driver command runs this file directly.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../src/docs-generated-merge/index.mjs";

const ENTRY = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === ENTRY) {
  main(process.argv.slice(2), { entry: ENTRY });
}
