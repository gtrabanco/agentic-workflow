/**
 * Retrieval operations for `agentic-workflow doc` (unit 65).
 *
 * Each operation keeps the envelope contract fixed while its engine grows:
 *   sync    — incremental sync engine: runs syncIndex and reports
 *             files_scanned / files_changed / files_deleted in the store value
 *   query   — FTS5 keyword core behind ensureFresh (AC9), offline (AC13),
 *             with the AC14 structured session-log filters
 *   status  — informational store report; never syncs
 *   rebuild — discard the disposable cache and resync from scratch
 * Degradations come only from D3's closed vocabulary, as engines grow into
 * the hybrid mode (P6/P7).
 */

import { buildEnvelope } from "./envelope.mjs";
import { storePath } from "./store.mjs";
import { syncIndex, rebuildIndex } from "./sync.mjs";
import { queryIndex, statusIndex } from "./query.mjs";

/**
 * Run one retrieval operation. `grammar` is parseDocArgs' output;
 * `ctx.rootDir` is the project root the store and config resolve against.
 * Returns the canonical envelope (async: the engines are async).
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

  if (grammar.op === "query") {
    return queryIndex(root, grammar.query, {
      since: grammar.since,
      until: grammar.until,
      file: grammar.file,
    });
  }

  if (grammar.op === "status") {
    return statusIndex(root);
  }

  if (grammar.op === "rebuild") {
    const r = await rebuildIndex(root);
    return buildEnvelope({
      command: "rebuild",
      results: [],
      degradations: [],
      store: { path: storePath(root), present: true, files: r.filesScanned, chunks: r.chunks },
    });
  }

  throw new Error(`usage: unknown doc op "${grammar.op}"`);
}
