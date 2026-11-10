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
 *
 * D20 (issue #470): reads the `provider.chunk_limit` config and passes it to
 * syncIndex; the `truncated` count adds the `chunk-too-large` degradation when
 * any chunk was shortened.
 *
 * D21: reads the `index.excludes` config and passes it to syncIndex so
 * irrelevant paths (`.agentic-workflow/`, `node_modules/`, and whatever the
 * project configures) leave the corpus.
 */

import { buildEnvelope } from "./envelope.mjs";
import { storePath } from "./store.mjs";
import { syncIndex, rebuildIndex } from "./sync.mjs";
import { queryIndex, statusIndex } from "./query.mjs";
import { loadConfig } from "./config.mjs";
import { resolveEmbedConfig, makeOpenAIProvider, embedPendingChunks, embeddingStats } from "./embeddings.mjs";

/**
 * Run one retrieval operation. `grammar` is parseDocArgs' output;
 * `ctx.rootDir` is the project root the store and config resolve against.
 * `ctx.embedder` overrides the resolved provider (the seam the suites use to
 * exercise the write path without a network). Returns the canonical envelope
 * (async: the engines are async).
 */
export async function runDocOp(grammar, ctx = {}) {
  const root = ctx.rootDir ?? process.cwd();

  if (grammar.op === "sync") {
    // D20/D21: read the chunk limit and the exclusion list from the config and
    // pass both to syncIndex.
    const cfg = loadConfig(root);
    const maxChunkChars = cfg.provider?.chunk_limit ?? 0;
    const exclusions = cfg.index?.excludes;
    const r = await syncIndex(root, { maxChunkChars, exclusions });
    // P6: when a provider is configured (D10), embed pending chunks in the
    // same pass; otherwise the store answers keyword-only (AC17's root). The
    // pass is resilient (issue #443 S3): pacing, retry/backoff and a pin the
    // first landed batch writes, so a 429 no longer aborts the run.
    const embedCfg = resolveEmbedConfig({ config: cfg, env: process.env });
    const provider = ctx.embedder !== undefined ? ctx.embedder : embedCfg.configured ? makeOpenAIProvider(embedCfg) : null;
    let embedded = 0;
    let degradations = [];
    if (r.truncated > 0) {
      degradations.push("chunk-too-large");
    }
    if (provider !== null) {
      try {
        const result = await embedPendingChunks(root, provider);
        if (result.skipped === true) {
          // Model mismatch: keep the frozen key and declare the cause.
          // (AC18: embeddings-model-mismatch; D3 frozen key set.)
          degradations = ["embeddings-model-mismatch"];
        } else {
          embedded = result.embedded;
        }
      } catch (e) {
        // AC17: provider-down ⇒ declared cause, ok:true, keyword results survive.
        // Only add if not already present (the chunk-too-large degradation
        // can coexist with provider-down).
        if (!degradations.includes("unavailable-embeddings-provider-down")) {
          degradations.push("unavailable-embeddings-provider-down");
        }
        embedded = 0;
      }
    }
    // D3: the pending count and the pinned model are additive inside the
    // envelope's open `store` record — the native /aw-index report renders
    // from these fields alone, and no top-level key or degradation value is
    // added to the frozen contract.
    const stats = await embeddingStats(root);
    return buildEnvelope({
      command: "sync",
      results: [],
      degradations,
      store: {
        path: storePath(root),
        present: true,
        files: r.filesScanned,
        chunks: r.chunks,
        pending: stats.pending,
        model: stats.model,
        lastSync: {
          files_scanned: r.filesScanned,
          files_changed: r.filesChanged,
          files_deleted: r.filesDeleted,
          embedded,
        },
      },
    });
  }

  if (grammar.op === "query") {
    return queryIndex(
      root,
      grammar.query,
      { since: grammar.since, until: grammar.until, file: grammar.file },
      // An absent mode is forwarded as absent so the query path resolves it at
      // run time (issue #443 S2, D2) — never defaulted here.
      { mode: grammar.mode },
    );
  }

  if (grammar.op === "status") {
    return statusIndex(root);
  }

  if (grammar.op === "rebuild") {
    // D20/D21: rebuild honors the same config surfaces the sync pass reads.
    const cfg = loadConfig(root);
    const r = await rebuildIndex(root, {
      maxChunkChars: cfg.provider?.chunk_limit ?? 0,
      exclusions: cfg.index?.excludes,
    });
    return buildEnvelope({
      command: "rebuild",
      results: [],
      degradations: [],
      store: { path: storePath(root), present: true, files: r.filesScanned, chunks: r.chunks },
    });
  }

  throw new Error(`usage: unknown doc op "${grammar.op}"`);
}
