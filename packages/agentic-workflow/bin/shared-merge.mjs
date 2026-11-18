#!/usr/bin/env node
/**
 * shared-merge.mjs — the crate's entry of the shared-document merge drivers
 * (issue #630).
 *
 * A project that installs this package but ships no `scripts/` tree arms this
 * file: `agentic-workflow telemetry merge-install` resolves it when the root
 * script is absent, so "the driver is installable by the universal CLI" is true
 * for every install shape, not only for a replicated repository. The mechanics
 * are `src/writer/shared-merge.mjs` — one implementation, two entries.
 *
 *   node_modules/@gtrabanco/agentic-workflow/bin/shared-merge.mjs --install [--repo <dir>]
 *   node_modules/@gtrabanco/agentic-workflow/bin/shared-merge.mjs <class> <base> <ours> <theirs> [marker-size] [path]
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

import { main } from "../src/writer/shared-merge.mjs";

const ENTRY = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === ENTRY) {
  main(process.argv.slice(2), { entry: ENTRY });
}
