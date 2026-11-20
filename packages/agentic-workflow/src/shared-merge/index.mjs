/**
 * shared-merge — the shared-document merge drivers' command (issue #498, moved
 * into the universal CLI by #630 and registered here by #553).
 *
 * The mechanics, the class map and the printed vocabulary are
 * `writer/shared-merge.mjs`'s; this module is the command's thin forward and
 * names the runnable entry an armed checkout's driver line must carry — the
 * package's own `bin/shared-merge.mjs` by default, or the caller's entry when a
 * project ships its own script.
 *
 *   agentic-workflow shared-merge --install [--repo <dir>]
 *   agentic-workflow shared-merge <class> <base> <ours> <theirs> [marker-size] [path]
 *
 * exit: 0 resolved or armed · 1 the merge is left conflicted · 2 usage or a
 * refused install.
 */

import { fileURLToPath } from "node:url";

import { main as run } from "../writer/shared-merge.mjs";

const DEFAULT_ENTRY = fileURLToPath(new URL("../../bin/shared-merge.mjs", import.meta.url));

export function main(argv = process.argv.slice(2), options = {}) {
  return run(argv, { entry: options.entry ?? DEFAULT_ENTRY });
}

export * from "../writer/shared-merge.mjs";
