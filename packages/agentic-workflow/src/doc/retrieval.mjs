/**
 * Retrieval operations for `agentic-workflow doc` (unit 65).
 *
 * Each operation grows its real behavior without changing the envelope
 * contract:
 *   P3 — store, config, canonical manifest (store value becomes concrete)
 *   P4 — incremental sync engine: `--sync` runs syncIndex and reports
 *        files_scanned / files_changed / files_deleted in the store value
 *   P5 — FTS5 query core + status reporting (results become real rows)
 * Degradations are emitted per-op as those engines land, from D3's closed
 * vocabulary only.
 */

import { buildEnvelope } from "./envelope.mjs";
import { storePath, storePresent } from "./store.mjs";
import { syncIndex } from "./sync.mjs";

/**
 * Run one retrieval operation. `grammar` is parseDocArgs' output;
 * `ctx.rootDir` is the project root the store and config resolve against.
 * Returns the canonical envelope (async: the sync engine is async).
 */
export async function runDocOp(grammar, ctx = {}) {
  const root = ctx.rootDir ?? process.cwd();

  if (grammar.op === "sync") {
    const r = await syncIndex(root);
    return buildEnvelope({
      command: "sync",
      results: [],
      degradations: [],
      store: {
        path: storePath(root),
        present: true,
        files: r.filesScanned,
        chunks: r.chunks,
        lastSync: {
          files_scanned: r.filesScanned,
          files_changed: r.filesChanged,
          files_deleted: r.filesDeleted,
        },
      },
    });
  }

  // P5 wires query (via ensureFresh, AC9) and status; rebuild rides P5 too.
  return buildEnvelope({
    command: grammar.op,
    results: [],
    degradations: [],
    store: { path: storePath(root), present: storePresent(root) },
  });
}
