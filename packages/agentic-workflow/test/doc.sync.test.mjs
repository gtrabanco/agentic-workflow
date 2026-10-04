/**
 * Tests for the incremental sync engine (unit 65, P4b — AC9/AC10/AC11/AC12).
 *
 * Hash-based change detection (`files_scanned`/`files_changed`/`files_deleted`),
 * deletion reaping (no orphan chunks), the canonical manifest export written
 * per sync (AC12 compares two runs byte-for-byte), and the freshness
 * invariant (manifest hash + HEAD checked, stale ⇒ inline incremental sync).
 * Query mechanics are P5 scope and NOT asserted here.
 */

import { describe, it, before, after } from "node:test";
import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { mkdtempSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { syncIndex, ensureFresh, storedManifest, storeStats } from "../src/doc/sync.mjs";
import { storePath, storePresent, manifestExportPath } from "../src/doc/store.mjs";
import { canonicalJson } from "../src/doc/manifest.mjs";
import { openDatabase } from "../src/doc/sqlite.mjs";

let root;
const A_MD = ["# Alpha", "alpha body"].join("\n");
const B_MD = ["# Beta", "beta body with the zanzibar term"].join("\n");
const C_MD = ["# Gamma", "gamma body"].join("\n");

function git(args, cwd = root) {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

function ftsSearch(db, term) {
  return db
    .prepare(
      "select c.path, c.section, c.line_start, c.line_end from chunks_fts f join chunks c on c.rowid = f.rowid where chunks_fts match ? order by c.path, c.rowid",
    )
    .all(`"${term}"`); // quote: FTS5 reads bare hyphens as column filters
}

before(() => {
  root = mkdtempSync(join(tmpdir(), "doc-sync-"));
  git(["init", "-q"]);
  git(["config", "user.email", "t@example.test"]);
  git(["config", "user.name", "t"]);
  for (const [name, body] of [["a.md", A_MD], ["b.md", B_MD], ["c.md", C_MD]]) {
    writeFileSync(join(root, name), body);
  }
  git(["add", "-A"]);
  git(["commit", "-qm", "fixture"]);
});

after(() => {
  if (root && existsSync(root)) rmSync(root, { recursive: true, force: true });
});

describe("doc sync engine", () => {
  it("first sync scans everything and creates the store + manifest export (AC7's half)", async () => {
    const r = await syncIndex(root);
    deepStrictEqual(
      { filesScanned: r.filesScanned, filesChanged: r.filesChanged, filesDeleted: r.filesDeleted },
      { filesScanned: 3, filesChanged: 3, filesDeleted: 0 },
    );
    strictEqual(storePresent(root), true);
    ok(storePath(root).includes(join(".agentic-workflow", "index")));
    const stats = await storeStats(root);
    ok(stats.chunks > 0);
    ok(existsSync(manifestExportPath(root)));
    ok(manifestExportPath(root).includes(join(".agentic-workflow", "index", "manifest.json")));
  });

  it("warm sync changes nothing and the manifest export is byte-identical (AC12)", async () => {
    const before = readFileSync(manifestExportPath(root), "utf8");
    const r = await syncIndex(root);
    strictEqual(r.filesChanged, 0);
    strictEqual(r.filesDeleted, 0);
    const afterBytes = readFileSync(manifestExportPath(root), "utf8");
    strictEqual(afterBytes, before);
    // the export is the canonical form: sorted keys, no timestamps
    strictEqual(afterBytes.trim(), canonicalJson(storedManifest(await openStoreDb())));
    ok(!afterBytes.match(/timestamp|generatedAt/i));
  });

  it("changing 1 of N files reprocesses only that file (AC10)", async () => {
    const db = await openStoreDb();
    const beforeRows = db.prepare("select chunk_id, body from chunks where path = 'a.md' order by rowid").all();
    db.close();

    writeFileSync(join(root, "b.md"), `${B_MD}\nsentinel-novelterm appended`);
    const r = await syncIndex(root);
    deepStrictEqual(
      { filesScanned: r.filesScanned, filesChanged: r.filesChanged, filesDeleted: r.filesDeleted },
      { filesScanned: 3, filesChanged: 1, filesDeleted: 0 },
    );
    // the change is searchable
    const db2 = await openStoreDb();
    const hits = ftsSearch(db2, "sentinel-novelterm");
    ok(hits.length >= 1 && hits[0].path === "b.md");
    // untouched file's chunks are byte-identical
    const afterRows = db2.prepare("select chunk_id, body from chunks where path = 'a.md' order by rowid").all();
    deepStrictEqual(afterRows, beforeRows);
    db2.close();
  });

  it("deletions reap every orphan chunk (AC11)", async () => {
    unlinkSync(join(root, "c.md"));
    git(["add", "-A"]);
    git(["commit", "-qm", "delete c"]);
    const r = await syncIndex(root);
    strictEqual(r.filesDeleted, 1);
    strictEqual(r.filesChanged, 0);
    const db = await openStoreDb();
    strictEqual(db.prepare("select count(*) as n from chunks where path = 'c.md'").get().n, 0);
    // no fts ghost either (external-content table is trigger-reaped)
    const ghost = db.prepare("select count(*) as n from chunks_fts where chunks_fts match 'gamma'").get();
    ok(ghost.n === 0, JSON.stringify(ghost));
    db.close();
  });

  it("freshness invariant: a hand edit that fires no hook is picked up in the same pass (AC9)", async () => {
    writeFileSync(join(root, "a.md"), `${A_MD}\npullcase-freshness`);
    await ensureFresh(root);
    const db = await openStoreDb();
    const hits = ftsSearch(db, "pullcase-freshness");
    ok(hits.length >= 1 && hits[0].path === "a.md");
    db.close();
  });

  it("storedManifest exposes the canonical manifest (head + per-file sha256)", async () => {
    const m = storedManifest(await openStoreDb());
    strictEqual(m.version, 1);
    const head = git(["rev-parse", "HEAD"]).trim();
    strictEqual(m.head, head);
    deepStrictEqual(Object.keys(m.files).sort(), ["a.md", "b.md"]);
  });
});

async function openStoreDb() {
  return (await openDatabase(storePath(root))).db;
}

// ── F18: a configured store.path works end-to-end (store AND manifest sidecar) ──

describe("doc sync — configured store.path", () => {
  it("syncs, answers status, and keeps the manifest sidecar beside the configured store", async () => {
    const cfgRoot = mkdtempSync(join(tmpdir(), "doc-storepath-"));
    try {
      execFileSync("git", ["init", "-q"], { cwd: cfgRoot });
      execFileSync("git", ["config", "user.email", "t@example.test"], { cwd: cfgRoot });
      execFileSync("git", ["config", "user.name", "t"], { cwd: cfgRoot });
      writeFileSync(join(cfgRoot, "a.md"), "# Alpha\nalpha body\n");
      mkdirSync(join(cfgRoot, ".agentic-workflow"));
      writeFileSync(
        join(cfgRoot, ".agentic-workflow", "index.json"),
        JSON.stringify({ version: 1, store: { path: ".agentic-workflow/custom/store.db" }, provider: null }),
      );
      execFileSync("git", ["add", "-A"], { cwd: cfgRoot });
      execFileSync("git", ["commit", "-qm", "fixture"], { cwd: cfgRoot });

      const r = await syncIndex(cfgRoot); // red: ENOENT on the hardcoded manifest dir
      strictEqual(r.filesScanned, 1);
      ok(existsSync(join(cfgRoot, ".agentic-workflow", "custom", "store.db")), "store honours config.store.path"),
      ok(
        existsSync(join(cfgRoot, ".agentic-workflow", "custom", "manifest.json")),
        "manifest sidecar lives beside the configured store, not the default dir",
      );
      strictEqual(storePath(cfgRoot), join(cfgRoot, ".agentic-workflow", "custom", "store.db"));
      const stats = await storeStats(cfgRoot);
      ok(stats.chunks > 0, "status answers from the configured store");
    } finally {
      rmSync(cfgRoot, { recursive: true, force: true });
    }
  });
});
