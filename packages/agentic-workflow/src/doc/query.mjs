/**
 * Keyword query core for the `doc` retrieval index (unit 65, P5).
 *
 * Every query answers after the freshness invariant (AC9: `ensureFresh`),
 * fully offline — no network, no API key (AC13). FTS5 keyword search with
 * result rows `{path, section, lines, score, meta}` in the frozen D3
 * ordering (score desc → path asc → section asc → lines[0] asc; `score` is
 * the negated FTS5 bm25 rank, higher is better).
 *
 * The structured session-log filter (AC14) narrows to `docs/LOGS.md`
 * entries — `log-session` owns that entry shape and the index consumes it
 * as-is: the `## <ISO timestamp> — <branch> — mode` heading and the
 * `- **Files:**` cell become queryable metadata, never an index-side edit.
 */

import { join } from "node:path";
import { decodeVector } from "./embeddings.mjs";
import { openDatabase } from "./sqlite.mjs";
import { storePath, storePresent } from "./store.mjs";
import { ensureFresh } from "./sync.mjs";
import { storedEmbeddingModel, resolveEmbedConfig, makeOpenAIProvider } from "./embeddings.mjs";
import { buildEnvelope, buildResultRow } from "./envelope.mjs";
import { loadConfig } from "./config.mjs";

const LOGS_PATH = "docs/LOGS.md";
const MAX_RESULTS = 20;
const MATCH_POOL = 200; // candidate pool before filters and the top-K cut

/** Quote every token as an FTS5 phrase and AND them — hyphens stay literal. */
export function ftsQueryFor(term) {
  const tokens = String(term).split(/\s+/).map((t) => t.trim()).filter((t) => t !== "");
  if (tokens.length === 0) return null;
  return tokens.map((t) => `"${t.replace(/"/g, '""')}"`).join(" AND ");
}

/**
 * Parse a `docs/LOGS.md` entry chunk body into queryable metadata
 * `{timestamp, branch, mode, files}` — null when the chunk is not a log
 * entry (the shape is log-session's; consumed as-is, D-log).
 */
export function parseLogEntry(body) {
  const lines = String(body).split(/\r?\n/);
  const heading = lines[0]?.match(/^##\s+(\S+)\s+—\s+(\S+)\s+—\s+(.+)$/);
  if (!heading) return null;
  let files = null;
  for (const line of lines.slice(1)) {
    const f = line.match(/^-\s+\*\*Files:\*\*\s+(.+)$/);
    if (f) {
      files = f[1].trim();
      break;
    }
  }
  return { timestamp: heading[1], branch: heading[2], mode: heading[3].trim(), files };
}

function logEntryMatches(entry, filters) {
  if (filters.since !== undefined && filters.since !== null) {
    if (entry.timestamp < filters.since) return false;
  }
  if (filters.until !== undefined && filters.until !== null) {
    if (entry.timestamp > filters.until) return false;
  }
  if (filters.file !== undefined && filters.file !== null) {
    const cell = (entry.files ?? "").replace(/`/g, "");
    if (!cell.includes(filters.file)) return false;
  }
  return true;
}

async function storeValue(root) {
  if (!storePresent(root)) {
    return { path: storePath(root), present: false, files: 0, chunks: 0 };
  }
  const { db } = await openDatabase(storePath(root));
  // Check if the chunks table exists (AC11: schema-less store is not an error —
  // it just means sync hasn't run yet, so the table is missing).
  const tableExists = db
    .prepare(
      "select count(*) as n from sqlite_master where type='table' and name='chunks'",
    )
    .get().n;
  if (tableExists === 0) {
    db.close();
    return { path: storePath(root), present: true, files: 0, chunks: 0 };
  }
  const files = db.prepare("select count(distinct path) as n from chunks").get().n;
  const chunks = db.prepare("select count(*) as n from chunks").get().n;
  db.close();
  return { path: storePath(root), present: true, files, chunks };
}

/**
 * Run one query. `filters` carries the optional AC14 structured filter
 * `{since, until, file}`; when any is present, results narrow to matching
 * `docs/LOGS.md` entries. `opts.mode` is `"keyword"` (default) or
 * `"hybrid"` (P7); `opts.embedder` overrides the resolved provider for
 * tests. Returns the canonical query envelope — degraded hybrid answers
 * keyword-only with the cause declared (AC17/AC18), exit-0 ok throughout.
 */
export async function queryIndex(root, term, filters = {}, opts = {}) {
  const mode = opts.mode ?? "keyword";
  await ensureFresh(root);
  const store = await storeValue(root);

  const match = ftsQueryFor(term);
  const keywordRows = [];
  if (match !== null) {
    const { db } = await openDatabase(storePath(root));
    const rows = db
      .prepare(
        `select c.chunk_id, c.path, c.section, c.line_start, c.line_end, c.meta, c.body, bm25(chunks_fts) as rank
         from chunks_fts join chunks c on c.rowid = chunks_fts.rowid
         where chunks_fts match ?
         order by rank, c.path, c.section, c.line_start
         limit ${MATCH_POOL}`,
      )
      .all(match);
    db.close();
    keywordRows.push(...rows);
  }

  const hasLogFilters = filters.since != null || filters.until != null || filters.file != null;

  if (mode === "hybrid") {
    const provider = opts.embedder !== undefined ? opts.embedder : realProviderOrNull(root);
    if (provider === null) {
      // AC17: no key ⇒ declared degradation, keyword still answers.
      return buildEnvelope({
        command: "query",
        results: toResults(keywordRows, hasLogFilters, filters),
        degradations: ["unavailable-embeddings-not-configured"],
        store,
      });
    }
    const pinned = await storedEmbeddingModel(root);
    if (pinned !== null && pinned !== provider.model) {
      // AC18: never rank across models.
      return buildEnvelope({
        command: "query",
        results: toResults(keywordRows, hasLogFilters, filters),
        degradations: ["embeddings-model-mismatch"],
        store,
      });
    }
    const { db } = await openDatabase(storePath(root));
    const embeddedCount = db.prepare("select count(*) as n from chunks where embedding is not null").get().n;
    if (embeddedCount === 0) {
      db.close();
      return buildEnvelope({
        command: "query",
        results: toResults(keywordRows, hasLogFilters, filters),
        degradations: ["unavailable-embeddings-not-indexed"],
        store,
      });
    }
    // F39: the store-wide pin is not enough — a row embedded under a foreign
    // model (or left unmodelled by an older schema) must fail closed too.
    const foreignRows = db
      .prepare(
        "select count(*) as n from chunks where embedding is not null and (emb_model is null or emb_model is not ?)",
      )
      .get(provider.model).n;
    if (foreignRows > 0) {
      db.close();
      return buildEnvelope({
        command: "query",
        results: toResults(keywordRows, hasLogFilters, filters),
        degradations: ["embeddings-model-mismatch"],
        store,
      });
    }
    try {
      const [queryVector] = await provider.embed([term]);
      const vectorRows = vectorTopK(db, queryVector, MATCH_POOL);
      const fused = fuseRrf(keywordRows, vectorRows);
      // F46: chunk bodies are huge (≈9 MB across this repo's corpus) and are
      // needed only for log-entry rows (the AC14 metadata). Fetch them for the
      // fused candidates that can reach a result row — never for the whole scan.
      for (const r of fused) {
        if (r.path === LOGS_PATH && r.body === undefined) {
          r.body = db.prepare("select body from chunks where chunk_id = ?").get(r.chunk_id)?.body ?? "";
        }
      }
      const results = toResults(
        fused.map((r) => ({ ...r, rank: -r.fusedScore })),
        hasLogFilters,
        filters,
      );
      return buildEnvelope({ command: "query", results, degradations: [], store });
    } catch (e) {
      // F40: a stored vector whose dimensionality differs from the query
      // vector is corrupt or foreign-shaped — degrade, never truncate-and-rank.
      if (e instanceof VectorShapeMismatch) {
        return buildEnvelope({
          command: "query",
          results: toResults(keywordRows, hasLogFilters, filters),
          degradations: ["embeddings-model-mismatch"],
          store,
        });
      }
      // AC17: provider down ⇒ declared cause, keyword results survive.
      return buildEnvelope({
        command: "query",
        results: toResults(keywordRows, hasLogFilters, filters),
        degradations: ["unavailable-embeddings-provider-down"],
        store,
      });
    } finally {
      db.close();
    }
  }

  const results = toResults(keywordRows, hasLogFilters, filters);
  return buildEnvelope({ command: "query", results, degradations: [], store });
}

/** Map ranked store rows to result rows, applying the AC14 log filters. */
function toResults(rows, hasLogFilters, filters) {
  const results = [];
  for (const r of rows) {
    let meta = {};
    try {
      meta = JSON.parse(r.meta);
    } catch {
      meta = {};
    }
    const isLog = r.path === LOGS_PATH;
    if (isLog) {
      const entry = r.body === undefined ? null : parseLogEntry(r.body); // F46: parsed once per row
      if (hasLogFilters) {
        if (entry === null || !logEntryMatches(entry, filters)) continue;
        meta = entry;
      } else if (entry !== null) {
        meta = entry;
      }
    } else if (hasLogFilters) {
      continue; // structured filters narrow to log entries by definition
    }
    const score = r.fusedScore !== undefined ? r.fusedScore : -r.rank;
    results.push(
      buildResultRow({
        path: r.path,
        section: r.section,
        lines: [r.line_start, r.line_end],
        score,
        meta,
      }),
    );
    if (results.length >= MAX_RESULTS) break;
  }
  return results;
}

/** Status reporting — informational, never syncs. */
export async function statusIndex(root) {
  const store = await storeValue(root);
  return buildEnvelope({ command: "status", results: [], store });
}

// ── Hybrid mode (P7) ───────────────────────────────────────────────────

const RRF_K = 60;

/** A stored vector's dimensionality differs from the query vector (F40). */
class VectorShapeMismatch extends Error {}

function cosine(a, b) {
  if (a.length !== b.length) {
    // F40: truncating to the shorter vector ranked confidently on garbage;
    // a shape mismatch is a corrupt or foreign-model vector — fail closed.
    throw new VectorShapeMismatch(`vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = a.length;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** JS-cosine kNN over D4's float32-LE BLOBs (decision D11 — no second vec0 store). */
function vectorTopK(db, queryVector, pool) {
  // F46: the scan scores vectors — it must NOT drag every chunk's body
  // (megabytes) out of SQLite per query; bodies are fetched lazily for the
  // few fused candidates that need them.
  const rows = db
    .prepare(
      "select chunk_id, path, section, line_start, line_end, meta, embedding from chunks where embedding is not null",
    )
    .all();
  const scored = rows.map((r) => ({ ...r, sim: cosine(decodeVector(r.embedding), queryVector) }));
  scored.sort((a, b) => b.sim - a.sim || (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return scored.slice(0, pool);
}

/** Reciprocal-rank fusion over the keyword and vector lists. */
function fuseRrf(keywordRows, vectorRows) {
  const fused = new Map();
  keywordRows.forEach((r, i) => {
    fused.set(r.chunk_id, { row: r, score: 1 / (RRF_K + i + 1) });
  });
  vectorRows.forEach((r, i) => {
    const contribution = 1 / (RRF_K + i + 1);
    const existing = fused.get(r.chunk_id);
    if (existing) existing.score += contribution;
    else fused.set(r.chunk_id, { row: r, score: contribution });
  });
  return [...fused.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        (a.row.path < b.row.path ? -1 : a.row.path > b.row.path ? 1 : 0) ||
        (a.row.section ?? "").localeCompare(b.row.section ?? "") ||
        a.row.line_start - b.row.line_start,
    )
    .map((e) => ({ ...e.row, fusedScore: e.score }));
}

function realProviderOrNull(root) {
  const cfg = resolveEmbedConfig({ config: loadConfig(root), env: process.env });
  return cfg.configured ? makeOpenAIProvider(cfg) : null;
}
