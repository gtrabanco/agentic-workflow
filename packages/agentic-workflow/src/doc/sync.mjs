/**
 * Incremental sync engine for the `doc` retrieval index (unit 65, P4).
 *
 * Change detection is hash-based (per-file sha256 from the canonical
 * manifest, AC10): only files whose hash changed — or that disappeared —
 * are reprocessed. Deletions reap every chunk of the removed file, and the
 * external-content FTS5 table is kept in step by triggers, so no orphan
 * chunk or ghost row survives (AC11). Determinism (AC12): the canonical
 * manifest export written per sync is byte-identical for an unchanged
 * corpus — sorted keys, git HEAD, no timestamps.
 *
 * Freshness invariant (AC9): `ensureFresh` compares the stored manifest
 * (hashes + git HEAD) against the live corpus on every call; a stale store
 * gets an inline incremental sync before the caller answers.
 */

import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { openDatabase } from "./sqlite.mjs";
import { storePath, storePresent, manifestExportPath } from "./store.mjs";
import { loadConfig } from "./config.mjs";
import { collectManifest, canonicalJson } from "./manifest.mjs";
import { scanChunks } from "./chunks.mjs";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS chunks (
  chunk_id TEXT UNIQUE NOT NULL,
  path TEXT NOT NULL,
  section TEXT,
  line_start INTEGER NOT NULL,
  line_end INTEGER NOT NULL,
  meta TEXT NOT NULL,
  body TEXT NOT NULL,
  embedding BLOB,
  emb_model TEXT
);
CREATE INDEX IF NOT EXISTS chunks_path ON chunks(path);
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(body, content='chunks', content_rowid='rowid');
CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, body) VALUES (new.rowid, new.body);
END;
CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, body) VALUES ('delete', old.rowid, old.body);
END;
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`;

/** Read the manifest persisted in the store's meta table (null if absent). */
export function storedManifest(db) {
  try {
    const row = db.prepare("select value from meta where key = 'manifest'").get();
    return row ? JSON.parse(row.value) : null;
  } catch {
    return null;
  }
}

/** Counts for `--status`: `{files, chunks}` over the store at `root`. */
export async function storeStats(root) {
  const { db } = await openDatabase(storePath(root));
  const files = db.prepare("select count(distinct path) as n from chunks").get().n;
  const chunks = db.prepare("select count(*) as n from chunks").get().n;
  db.close();
  return { files, chunks };
}

/**
 * One incremental sync pass over the tracked markdown corpus at `root`.
 * Returns `{filesScanned, filesChanged, filesDeleted, chunks}`.
 */
export async function syncIndex(root) {
  loadConfig(root); // config errors surface here too (usage/IO), even in sync
  const manifest = collectManifest(root);
  const { db } = await openDatabase(storePath(root));
  db.exec(SCHEMA);

  const stored = storedManifest(db);
  const oldFiles = stored?.files ?? {};
  const changed = [];
  const deleted = [];
  for (const [path, info] of Object.entries(manifest.files)) {
    if (oldFiles[path] === undefined || oldFiles[path].sha256 !== info.sha256) changed.push(path);
  }
  for (const path of Object.keys(oldFiles)) {
    if (manifest.files[path] === undefined) deleted.push(path);
  }

  const reap = db.prepare("DELETE FROM chunks WHERE path = ?");
  const insert = db.prepare(
    "INSERT INTO chunks (chunk_id, path, section, line_start, line_end, meta, body) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  for (const path of deleted) reap.run(path);
  for (const path of changed) {
    reap.run(path);
    const rows = scanChunks(readFileSync(join(root, path), "utf8"), path);
    for (const c of rows) {
      insert.run(c.id, c.path, c.section, c.lines[0], c.lines[1], JSON.stringify(c.meta), c.body);
    }
  }

  // Persist + export the canonical manifest (AC12's compared artifact).
  db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('manifest', ?)").run(canonicalJson(manifest));
  db.close();
  writeFileSync(manifestExportPath(root), `${canonicalJson(manifest)}\n`);

  const stats = await storeStats(root);
  return {
    filesScanned: Object.keys(manifest.files).length,
    filesChanged: changed.length,
    filesDeleted: deleted.length,
    chunks: stats.chunks,
  };
}

/**
 * Freshness invariant (AC9): manifest hashes + git HEAD checked against the
 * store; stale or missing ⇒ inline incremental sync before answering.
 * Returns `{fresh, synced}`.
 */
export async function ensureFresh(root) {
  const current = collectManifest(root);
  if (storePresent(root)) {
    const { db } = await openDatabase(storePath(root));
    const stored = storedManifest(db);
    db.close();
    if (stored !== null && canonicalJson(stored) === canonicalJson(current)) {
      return { fresh: true, synced: false };
    }
  }
  await syncIndex(root);
  return { fresh: false, synced: true };
}

/**
 * `--rebuild`: discard the disposable cache entirely (db + WAL/SHM + the
 * manifest export) and resync from scratch. Returns the fresh sync counts
 * with `rebuilt: true`.
 */
export async function rebuildIndex(root) {
  const base = storePath(root);
  rmSync(base, { force: true });
  rmSync(`${base}-wal`, { force: true });
  rmSync(`${base}-shm`, { force: true });
  rmSync(manifestExportPath(root), { force: true });
  const r = await syncIndex(root);
  return { rebuilt: true, ...r };
}
