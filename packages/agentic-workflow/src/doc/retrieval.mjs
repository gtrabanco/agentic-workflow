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
import { loadConfig } from "./config.mjs";
import { resolveEmbedConfig, makeOpenAIProvider, embedPendingChunks } from "./embeddings.mjs";

/**
 * Run one retrieval operation. `grammar` is parseDocArgs' output;
 * `ctx.rootDir` is the project root the store and config resolve against.
 * Returns the canonical envelope (async: the engines are async).
 */
export async function runDocOp(grammar, ctx = {}) {
  const root = ctx.rootDir ?? process.cwd();

  if (grammar.op === "sync") {
    const r = await syncIndex(root);
    // P6: when a provider is configured (D10), embed pending chunks in the
    // same pass; otherwise the store answers keyword-only (AC17's root).
    const cfg = resolveEmbedConfig({ config: loadConfig(root), env: process.env });
    let embedded = null;
    let degradations = [];
    if (cfg.configured) {
      try {
        embedded = await embedPendingChunks(root, makeOpenAIProvider(cfg));
        if (embedded.skipped === true) {
          // Model mismatch: keep the frozen key and declare the cause.
          // (AC18: embeddings-model-mismatch; D3 frozen key set.)
          degradations = [embedded.reason || "embeddings-model-mismatch"];
          embedded = { embedded: 0 };
        }
      } catch (e) {
        // AC17: provider-down ⇒ declared cause, ok:true, keyword results survive.
        degradations = ["unavailable-embeddings-provider-down"];
        embedded = { embedded: 0 };
      }
    }
    return buildEnvelope({
      command: "sync",
      results: [],
      degradations,
      store: {
        path: storePath(root),
        present: true,
        files: r.filesScanned,
        chunks: r.chunks,
        lastSync: {
          files_scanned: r.filesScanned,
          files_changed: r.filesChanged,
          files_deleted: r.filesDeleted,
          embedded: embedded === null ? 0 : embedded.embedded,
        },
      },
    });
  }

  if (grammar.op === "query") {
    return queryIndex(
      root,
      grammar.query,
      { since: grammar.since, until: grammar.until, file: grammar.file },
      { mode: grammar.mode ?? "keyword" },
    );
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
