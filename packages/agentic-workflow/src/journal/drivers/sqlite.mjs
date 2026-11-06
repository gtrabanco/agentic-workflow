/**
 * sqlite.mjs — the REFERENCE store driver (issue #374 in-scope 4): one driver
 * proving the contract is real for a non-file store, deliberately minimal —
 * "it exists to falsify 'the contract only works for files', not to be the
 * enterprise solution".
 *
 * Two boundaries it must not cross (unit decision D8):
 *
 *  - **The doc index's store is not this store.** Feature 65 pins that only
 *    its entry point opens `.agentic-workflow/index/`; this driver reuses the
 *    runtime adapter (`doc/sqlite.mjs` — `bun:sqlite` primary, `node:sqlite`
 *    floor) but owns a different database at
 *    `.agentic-workflow/journal-store/entries.db`.
 *  - **The carrier directory is not its home.** The aggregator refuses any
 *    carrier file whose name is not a fragment (fix/405 D9), so a database
 *    inside `.agentic-workflow/journal/` would block every aggregation.
 *
 * Insert-only by construction (D3): the table has no UPDATE or DELETE on any
 * code path — a correction is a new row with a new id, matching the journal's
 * own "a wrong past line gets a new correcting line" rule. Arrival order is
 * the row id (D9). Consumer metadata rides a JSON column verbatim (AC5): the
 * driver never opens it, never strips a key.
 *
 * The methods are async (the adapter's dynamic import is); the contract allows
 * a promise — the conformance harness awaits, the sync Markdown driver is the
 * mechanical writer's half.
 */

import path from "node:path";

import { openDatabase } from "../../doc/sqlite.mjs";
import { normalizeEntry } from "../entry.mjs";
import { DriverError, matchesPredicate, normalizePredicate, renderEntryBlock } from "../driver.mjs";

/** The reference store's directory, relative to the project root (D8). */
export const SQLITE_JOURNAL_STORE_DIR = ".agentic-workflow/journal-store";

/** The reference store's default database file. */
export const SQLITE_JOURNAL_STORE_DB = "entries.db";

const CREATE_TABLE = `
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  branch TEXT NOT NULL,
  kind TEXT NOT NULL,
  summary TEXT,
  reason TEXT,
  commits_count INTEGER,
  commits_range TEXT,
  files_json TEXT,
  metadata_json TEXT NOT NULL DEFAULT '{}'
)`;

const INSERT = `
INSERT INTO entries (timestamp, branch, kind, summary, reason, commits_count, commits_range, files_json, metadata_json)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

function rowToEntry(row) {
  let metadata;
  try {
    metadata = JSON.parse(row.metadata_json);
  } catch {
    throw new DriverError(`entry ${row.id}: the stored metadata_json does not parse — refusing instead of losing the consumer fields`);
  }
  let files;
  try {
    files = row.files_json === null ? undefined : JSON.parse(row.files_json);
  } catch {
    throw new DriverError(`entry ${row.id}: the stored files_json does not parse — refusing instead of losing the paths`);
  }
  return {
    contract: "agentic-workflow/journal-entry",
    version: 1,
    timestamp: row.timestamp,
    branch: row.branch,
    kind: row.kind,
    ...(row.summary !== null && row.summary !== undefined ? { summary: row.summary } : {}),
    ...(row.reason !== null && row.reason !== undefined ? { reason: row.reason } : {}),
    ...(row.commits_count !== null && row.commits_count !== undefined ? { commits: { count: row.commits_count, range: row.commits_range } } : {}),
    ...(files !== undefined ? { files } : {}),
    ...(metadata !== undefined && Object.keys(metadata).length > 0 ? { metadata } : {}),
  };
}

/**
 * The reference SQLite store driver. Options: `root` (project root,
 * required), `dbPath` (relative to `root`; the default
 * `.agentic-workflow/journal-store/entries.db`).
 */
export function createSqliteDriver(options) {
  const root = options?.root;
  if (typeof root !== "string" || root === "") throw new DriverError("createSqliteDriver: root is required");
  const dbPath = path.join(root, options?.dbPath ?? path.join(SQLITE_JOURNAL_STORE_DIR, SQLITE_JOURNAL_STORE_DB));
  let db = null;

  async function store() {
    if (db !== null) return db;
    const opened = await openDatabase(dbPath);
    opened.db.exec(CREATE_TABLE);
    db = opened.db;
    return db;
  }

  async function loadAll() {
    const handle = await store();
    const rows = handle.prepare("SELECT * FROM entries ORDER BY id").all();
    return rows.map(rowToEntry);
  }

  return {
    name: "sqlite",
    async append(entry) {
      const checked = normalizeEntry(entry);
      if (!checked.ok) return { ok: false, error: checked.errors.join("; ") };
      const block = checked.entry;
      const handle = await store();
      const result = handle.prepare(INSERT).run(
        block.timestamp,
        block.branch,
        block.kind,
        block.summary ?? null,
        block.reason ?? null,
        block.commits !== undefined ? block.commits.count : null,
        block.commits !== undefined ? block.commits.range : null,
        block.files !== undefined ? JSON.stringify(block.files) : null,
        block.metadata !== undefined ? JSON.stringify(block.metadata) : "{}",
      );
      return { ok: true, target: "store", id: Number(result.lastInsertRowid) };
    },

    async query(predicate) {
      const normalized = normalizePredicate(predicate);
      if (!normalized.ok) return { ok: false, error: normalized.error };
      const entries = (await loadAll()).filter((entry) => matchesPredicate(entry, normalized.predicate));
      return { ok: true, entries };
    },

    async render(range) {
      const normalized = normalizePredicate({ dateRange: range ?? {} });
      if (!normalized.ok) return { ok: false, error: normalized.error };
      const rendered = (await loadAll())
        .filter((entry) => matchesPredicate(entry, normalized.predicate))
        .map((entry) => renderEntryBlock(entry))
        .join("\n");
      return { ok: true, rendered };
    },
  };
}
