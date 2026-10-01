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
import { openDatabase } from "./sqlite.mjs";
import { storePath, storePresent } from "./store.mjs";
import { ensureFresh } from "./sync.mjs";
import { buildEnvelope, buildResultRow } from "./envelope.mjs";

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
  const files = db.prepare("select count(distinct path) as n from chunks").get().n;
  const chunks = db.prepare("select count(*) as n from chunks").get().n;
  db.close();
  return { path: storePath(root), present: true, files, chunks };
}

/**
 * Run one keyword query. `filters` carries the optional AC14 structured
 * filter `{since, until, file}`; when any is present, results narrow to
 * matching `docs/LOGS.md` entries. Returns the canonical query envelope.
 */
export async function queryIndex(root, term, filters = {}) {
  await ensureFresh(root);
  const store = await storeValue(root);

  const match = ftsQueryFor(term);
  if (match === null) {
    return buildEnvelope({ command: "query", results: [], store });
  }

  const { db } = await openDatabase(storePath(root));
  const rows = db
    .prepare(
      `select c.path, c.section, c.line_start, c.line_end, c.meta, c.body, bm25(chunks_fts) as rank
       from chunks_fts join chunks c on c.rowid = chunks_fts.rowid
       where chunks_fts match ?
       order by rank, c.path, c.section, c.line_start
       limit ${MATCH_POOL}`,
    )
    .all(match);
  db.close();

  const hasLogFilters = filters.since != null || filters.until != null || filters.file != null;
  const results = [];
  for (const r of rows) {
    const isLog = r.path === LOGS_PATH;
    let meta = {};
    try {
      meta = JSON.parse(r.meta);
    } catch {
      meta = {};
    }
    if (isLog && (hasLogFilters || parseLogEntry(r.body) !== null)) {
      const entry = parseLogEntry(r.body);
      if (entry === null) continue;
      if (hasLogFilters && !logEntryMatches(entry, filters)) continue;
      meta = entry;
    } else if (hasLogFilters) {
      continue; // structured filters narrow to log entries by definition
    }
    results.push(
      buildResultRow({
        path: r.path,
        section: r.section,
        lines: [r.line_start, r.line_end],
        score: -r.rank,
        meta,
      }),
    );
    if (results.length >= MAX_RESULTS) break;
  }

  return buildEnvelope({ command: "query", results, store });
}

/** Status reporting — informational, never syncs. */
export async function statusIndex(root) {
  const store = await storeValue(root);
  return buildEnvelope({ command: "status", results: [], store });
}
