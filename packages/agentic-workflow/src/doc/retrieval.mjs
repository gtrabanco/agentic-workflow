/**
 * Retrieval operations for `agentic-workflow doc` (unit 65).
 *
 * Each operation keeps the envelope contract fixed while its engine grows:
 *   sync    — incremental sync engine: runs syncIndex and reports
 *             files_scanned / files_changed / files_deleted in the store value;
 *             embeds the pending chunks when a provider is configured
 *   query   — FTS5 keyword core behind ensureFresh (AC9), offline (AC13),
 *             with the AC14 structured session-log filters
 *   status  — informational store report; never syncs
 *   rebuild — discard the disposable cache, resync from scratch **and embed**
 *             the pending chunks in the same pass (fix #540 S6)
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
 *
 * Fix #540: the effective chunk limit is resolved once for both chunking ops
 * (`effectiveChunkLimit`): a configured provider with no explicit
 * `provider.chunk_limit` chunks to the request budget, so the shipped
 * configuration cannot emit a request the provider must refuse. A provider that
 * *rejects* a request is no longer reported as provider-down: the rejected
 * chunks are skipped, the rest embed, and the envelope's additive
 * `store.rejected` carries the provider's status and body excerpt for the
 * operator to read (`embeddings-request-rejected`).
 */

import { buildEnvelope } from "./envelope.mjs";
import { storePath } from "./store.mjs";
import { syncIndex, rebuildIndex } from "./sync.mjs";
import { queryIndex, statusIndex, storeValue } from "./query.mjs";
import { loadConfig, effectiveChunkLimit } from "./config.mjs";
import { resolveEmbedConfig, embedPendingChunks, embeddingStats, resolvePacing, openEmbedLease, pacedProvider, LeaseLostError } from "./embeddings.mjs";
import { NO_FEEDBACK } from "../feedback/index.mjs";

/** How many failure shapes and chunk locators the envelope repeats before summarising. */
const REJECTION_DETAIL_LIMIT = 10;

/**
 * The additive `store.rejected` record: what the provider said, and which chunks
 * it cost. `count` is the whole truth (every skipped chunk); `failures` and
 * `chunks` are the bounded detail an operator reads first, with `omitted` naming
 * how much did not fit — never a silent truncation.
 */
function rejectionRecord(rejected) {
  const failures = [];
  const chunks = [];
  let count = 0;
  for (const entry of rejected) {
    count += entry.chunks.length;
    const key = `${entry.status ?? "-"}\u0000${entry.message}`;
    if (failures.length < REJECTION_DETAIL_LIMIT && !failures.some((f) => f.key === key)) {
      failures.push({ key, status: entry.status ?? null, message: entry.message });
    }
    for (const chunk of entry.chunks) {
      if (chunks.length < REJECTION_DETAIL_LIMIT) chunks.push(`${chunk.path}#${chunk.section ?? ""}`);
    }
  }
  return {
    count,
    failures: failures.map(({ key, ...rest }) => rest),
    chunks,
    omitted: Math.max(0, count - chunks.length),
  };
}

/**
 * The embed half both chunking ops share: the resolved provider (or the injected
 * seam) embeds the pending chunks, and the result becomes the envelope's
 * `embedded` count, its degradations and its rejection detail. A retryable
 * failure whose ladder is exhausted still answers
 * `unavailable-embeddings-provider-down` and keeps the run `ok: true` (AC17);
 * a rejected request answers `embeddings-request-rejected` and keeps the count of
 * what did land. `onProgress(done, total)` is an optional callback the caller
 * uses to report progress over the wall-clock duration of the embed pass,
 * `pacing` is the resolved policy the provider's request timeout comes from
 * (issue #718 S3) — resolved once here so the pass and its provider agree — and
 * `leaseOwner` hands down the owner token of a lease the caller took before the
 * scan (issue #718, the pre-scan fence), so this call heartbeats it and never
 * re-acquires or releases it.
 */
async function embedPass(root, { embedCfg, embedder, declareKeywordOnly, onProgress, pacing, leaseOwner }) {
  const provider = embedder !== undefined ? embedder : pacedProvider(embedCfg, pacing);
  if (provider === null) {
    // AC17's root: keyword-only is a declared state, never a silent one. A
    // `--rebuild` is the documented escape hatch (a model or limit change), and a
    // `--sync` that had pending chunks now states the corpus it leaves behind
    // (issue #718 S6) — a warm one stays silent, because there is nothing to say.
    return { embedded: 0, degradations: declareKeywordOnly ? ["unavailable-embeddings-not-configured"] : [], rejected: null };
  }
  try {
    const result = await embedPendingChunks(root, provider, { onProgress, pacing, leaseOwner });
    if (result.leaseHeld === true) {
      // Another pass owns the store's pending set (issue #718 S5): this run spent
      // nothing, the chunks stay pending, and the cause is declared instead of
      // reporting a healthy pass that embedded 0.
      return { embedded: 0, degradations: ["unavailable-embeddings-lease-held"], rejected: null };
    }
    if (result.skipped === true) {
      // Model mismatch: keep the frozen key and declare the cause (AC18, D3).
      return { embedded: 0, degradations: ["embeddings-model-mismatch"], rejected: null };
    }
    return {
      embedded: result.embedded,
      degradations: result.rejected.length > 0 ? ["embeddings-request-rejected"] : [],
      rejected: result.rejected.length > 0 ? rejectionRecord(result.rejected) : null,
    };
  } catch {
    // A retryable failure that never recovered, or a transport error: the
    // provider really is down, so keyword results survive (AC17).
    return { embedded: 0, degradations: ["unavailable-embeddings-provider-down"], rejected: null };
  }
}

/**
 * Run one retrieval operation. `grammar` is parseDocArgs' output;
 * `ctx.rootDir` is the project root the store and config resolve against.
 * `ctx.embedder` overrides the resolved provider (the seam the suites use to
 * exercise the write path without a network). Returns the canonical envelope
 * (async: the engines are async).
 */
export async function runDocOp(grammar, ctx = {}) {
  const root = ctx.rootDir ?? process.cwd();
  // Issue #424: the channel a CLI hands in. Absent, every call is a no-op, so
  // an embedded caller (the pi package's renderer, a suite) keeps its silence.
  const feedback = ctx.feedback ?? NO_FEEDBACK;

  if (grammar.op === "sync" || grammar.op === "rebuild") {
    const cfg = loadConfig(root);
    // D10: the provider decides whether a chunk limit is safe to leave unset,
    // and `ctx.embedder` counts as configured even without a config provider.
    const embedCfg = resolveEmbedConfig({ config: cfg, env: process.env });
    const providerConfigured = ctx.embedder !== undefined || embedCfg.configured;
    const maxChunkChars = effectiveChunkLimit({ config: cfg, providerConfigured, env: process.env });
    const exclusions = cfg.index?.excludes;
    // The provider's request timeout is one of the pacing knobs, so the policy is
    // resolved once for the pass and handed to the provider it paces (issue #718
    // S3) — resolved before the scan because the lease's TTL derives from it.
    const pacing = resolvePacing({ config: cfg, env: process.env });
    // Issue #718 S5 — the pre-scan fence (external-verify 2026-11-27, A4/A5): a
    // `--sync` pass owns the store from before the scan writes a byte. A pass
    // that finds a live lease performs no scan write — it cannot die contending
    // for the scan lock (`database is locked`), and a late re-chunk of its own
    // cannot land beside the owner's embedded rows with nobody left to repair
    // them — and it declares the lease instead. Rebuild stays embed-stage-only:
    // its discard deletes the store file, so no lease row could span it (D9).
    let lease = null;
    // The fenced answer, shared by the pre-scan acquisition and the mid-scan loss
    // (review F1): one shape, so a pass that took no part in the store never reads
    // as a healthy one.
    const fencedEnvelope = async (detail) => {
      feedback.start();
      // One open answers the record, the pending count and the pin; an absent
      // store keeps the shape the caller always read (review-change fix/718 cycle 1).
      const storeRecord = await storeValue(root, { withPending: true });
      feedback.detail(detail);
      return buildEnvelope({
        command: "sync",
        results: [],
        degradations: ["unavailable-embeddings-lease-held"],
        store: {
          ...storeRecord,
          pending: storeRecord.pending ?? 0,
          model: storeRecord.model ?? null,
          lastSync: { files_scanned: 0, files_changed: 0, files_deleted: 0, embedded: 0 },
        },
      });
    };
    if (grammar.op === "sync") {
      lease = await openEmbedLease(root, pacing);
      if (lease === null) return fencedEnvelope("embed: lease held by another pass — no scan, no spend");
    }
    try {
      // The three stages a reader waits on, timed by the channel: the chunk pass,
      // the provider round-trips, and the store's own count.
      let r;
      try {
        r = await feedback.stage("scan", () =>
          grammar.op === "rebuild"
            ? rebuildIndex(root, {
                maxChunkChars,
                exclusions,
                onProgress: (done, total, path) => feedback.progress({ done, total, unit: "files", detail: path }),
              })
            : syncIndex(root, {
                maxChunkChars,
                exclusions,
                // The scan heartbeats the pass' lease on its own connection,
                // once per reaped or re-chunked file (PE-019), and stops the scan
                // the moment another pass owns the row (review F1).
                leaseOwner: lease?.owner,
                onProgress: (done, total, path) => feedback.progress({ done, total, unit: "files", detail: path }),
              }),
        );
      } catch (error) {
        if (!(error instanceof LeaseLostError)) throw error;
        return fencedEnvelope("embed: lease lost mid-scan — the scan rolled back, no spend");
      }

      // The progress seam is forwarded for **both** chunking ops: a rebuild
      // embeds the same pending set, so a silent one is the same frozen screen.
      // The pending count is read *before* the pass (issue #718 S6) — a sync that had
      // work to embed and no key used to leave a keyword-only corpus unstated —
      // and only where no provider can embed: a configured pass never reads it
      // (review-change fix/718 cycle 1).
      const pendingBefore = providerConfigured ? 0 : (await embeddingStats(root)).pending;
      const pass = await feedback.stage("embed", () =>
        embedPass(root, {
          embedCfg,
          embedder: ctx.embedder,
          declareKeywordOnly: grammar.op === "rebuild" || pendingBefore > 0,
          pacing,
          leaseOwner: lease?.owner,
          onProgress: (done, total) => feedback.progress({ done, total, unit: "chunks" }),
        }),
      );
      feedback.detail(
        `embed: provider=${providerConfigured ? "configured" : "none"} embedded=${pass.embedded} degradations=[${pass.degradations.join(",")}]`,
      );
      const degradations = [];
      if (r.truncated > 0) degradations.push("chunk-too-large");
      for (const value of pass.degradations) if (!degradations.includes(value)) degradations.push(value);

      // D3: the pending count and the pinned model are additive inside the
      // envelope's open `store` record — the native /aw-index report renders
      // from these fields alone, and no top-level key or degradation value is
      // added to the frozen contract.
      const stats = await feedback.stage("stats", () => embeddingStats(root));
      const record = { path: storePath(root), present: true, files: r.filesScanned, chunks: r.chunks, pending: stats.pending, model: stats.model };
      const withRejection = (value) => (pass.rejected === null ? value : { ...value, rejected: pass.rejected });
      const store =
        grammar.op === "sync"
          ? withRejection({
              ...record,
              lastSync: {
                files_scanned: r.filesScanned,
                files_changed: r.filesChanged,
                files_deleted: r.filesDeleted,
                embedded: pass.embedded,
              },
            })
          : // A rebuild now embeds in the same pass, so it states what it left
            // behind: the pinned model, what it embedded, and what stays pending (S6).
            withRejection({ ...record, embedded: pass.embedded });
      return buildEnvelope({
        command: grammar.op,
        results: [],
        degradations,
        store,
      });
    } finally {
      lease?.release();
    }
  }

  if (grammar.op === "query") {
    feedback.start();
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
    feedback.start();
    return statusIndex(root);
  }

  throw new Error(`usage: unknown doc op "${grammar.op}"`);
}
