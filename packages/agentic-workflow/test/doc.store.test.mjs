/**
 * Tests for the `doc` retrieval store, config and canonical manifest (P3).
 *
 * Scope (unit 65, P3, D4): the gitignored store location
 * `.agentic-workflow/index/index.db`, the committed config
 * `.agentic-workflow/index.json` (defaults when absent), the dual-runtime
 * SQLite adapter, and the canonical manifest export (sorted keys, per-file
 * sha256 + git HEAD, no timestamps) that AC12's byte-for-byte assertion runs
 * over. Sync/query behavior is P4/P5 scope and NOT asserted here.
 */

import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok, throws } from "node:assert";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

import {
  storePath,
  storePresent,
  ensureStore,
  MANIFEST_EXPORT_NAME,
} from "../src/doc/store.mjs";
import {
  buildManifest,
  canonicalJson,
  manifestHash,
  collectManifest,
} from "../src/doc/manifest.mjs";
import { loadConfig, configPath, DEFAULT_CONFIG } from "../src/doc/config.mjs";
import { runtimeName, openDatabase } from "../src/doc/sqlite.mjs";

const PACKAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = join(PACKAGE_ROOT, "..", "..");

// ── Store location (D4) ──────────────────────────────────────────────────

describe("doc store", () => {
  it("resolves the store under .agentic-workflow/index/index.db", () => {
    ok(storePath("/r").endsWith(join(".agentic-workflow", "index", "index.db")));
  });

  it("reports absence before creation", () => {
    const tmp = mkdtempSync(join(tmpdir(), "doc-store-"));
    try {
      strictEqual(storePresent(tmp), false);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("creates the store idempotently as a real SQLite database", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "doc-store-"));
    try {
      await ensureStore(tmp);
      strictEqual(storePresent(tmp), true);
      const { db, kind } = await openDatabase(storePath(tmp));
      strictEqual(kind, runtimeName());
      // Both runtimes expose exec + prepare; a trivial query proves the file
      // is a real SQLite database, not a placeholder.
      db.exec("create table probe(x)");
      db.close();
      await ensureStore(tmp); // second run is a no-op, not an error
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("names the manifest export sidecar inside the gitignored index dir", () => {
    strictEqual(MANIFEST_EXPORT_NAME, "manifest.json");
    ok(storePath("/r").replace(/index\.db$/, MANIFEST_EXPORT_NAME).includes(join(".agentic-workflow", "index")));
  });
});

// ── SQLite adapter (dual runtime) ────────────────────────────────────────

describe("doc sqlite adapter", () => {
  it("reports the running runtime", () => {
    ok(["bun", "node"].includes(runtimeName()));
  });

  it("opens an in-memory database and runs FTS5 on the running runtime", async () => {
    const { db, kind } = await openDatabase(":memory:");
    ok(kind === runtimeName());
    db.exec("create virtual table t using fts5(doc)");
    db.close();
  });
});

// ── Config (D4/D10 committed surface) ────────────────────────────────────

describe("doc config", () => {
  it("defaults when the config file is absent (never a hard failure)", () => {
    const tmp = mkdtempSync(join(tmpdir(), "doc-config-"));
    try {
      const cfg = loadConfig(tmp);
      deepStrictEqual(cfg, DEFAULT_CONFIG);
      strictEqual(cfg.provider, null); // keyword-only until a provider is configured (D10)
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("loads and merges a present config file", () => {
    const tmp = mkdtempSync(join(tmpdir(), "doc-config-"));
    try {
      mkdirSync(join(tmp, ".agentic-workflow"), { recursive: true });
      writeFileSync(
        configPath(tmp),
        JSON.stringify({ version: 1, provider: { baseUrl: "https://example.test/v1", model: "m", envVar: "K" } }),
      );
      const cfg = loadConfig(tmp);
      strictEqual(cfg.provider.baseUrl, "https://example.test/v1");
      strictEqual(cfg.store.path, DEFAULT_CONFIG.store.path); // default kept when unspecified
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("rejects an unparseable config file as usage/IO (exit 1 territory)", () => {
    const tmp = mkdtempSync(join(tmpdir(), "doc-config-"));
    try {
      mkdirSync(join(tmp, ".agentic-workflow"), { recursive: true });
      writeFileSync(configPath(tmp), "{not json");
      throws(() => loadConfig(tmp), /index\.json/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("rejects an unknown config version (fail closed, never guess)", () => {
    const tmp = mkdtempSync(join(tmpdir(), "doc-config-"));
    try {
      mkdirSync(join(tmp, ".agentic-workflow"), { recursive: true });
      writeFileSync(configPath(tmp), JSON.stringify({ version: 99 }));
      throws(() => loadConfig(tmp), /version/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

// ── Canonical manifest (AC12 surface) ────────────────────────────────────

describe("doc manifest", () => {
  const FILES = [
    { path: "b.md", sha256: "bbb", bytes: 2 },
    { path: "a.md", sha256: "aaa", bytes: 1 },
  ];

  it("builds with sorted keys, version and head — no timestamps", () => {
    const m = buildManifest({ head: "deadbeef", files: FILES });
    deepStrictEqual(Object.keys(m), ["files", "head", "version"]);
    deepStrictEqual(Object.keys(m.files), ["a.md", "b.md"]); // sorted, not input order
    strictEqual(m.version, 1);
    strictEqual(m.head, "deadbeef");
    ok(!JSON.stringify(m).match(/timestamp|mtime|generatedAt/i));
  });

  it("canonicalJson is deterministic and key-sorted at every level", () => {
    const a = canonicalJson({ z: 1, a: { y: 2, b: 3 } });
    const b = canonicalJson({ a: { b: 3, y: 2 }, z: 1 });
    strictEqual(a, b);
    strictEqual(a, '{"a":{"b":3,"y":2},"z":1}');
  });

  it("manifestHash is stable for identical content and differs for different content", () => {
    const h1 = manifestHash(buildManifest({ head: "h", files: FILES }));
    const h2 = manifestHash(buildManifest({ head: "h", files: [...FILES].reverse() }));
    const h3 = manifestHash(buildManifest({ head: "h2", files: FILES }));
    strictEqual(h1, h2);
    ok(h1 !== h3);
  });

  it("collectManifest is deterministic over the live repo (AC12's two-run shape)", async () => {
    const m1 = collectManifest(REPO_ROOT);
    const m2 = collectManifest(REPO_ROOT);
    strictEqual(canonicalJson(m1), canonicalJson(m2)); // byte-for-byte via canonical form
    strictEqual(m1.version, 1);
    // head is a real git sha
    const head = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT }).toString().trim();
    strictEqual(m1.head, head);
    // the corpus is tracked markdown, including this repo's skills
    ok(Object.keys(m1.files).length > 10);
    ok(Object.keys(m1.files).some((p) => p.startsWith("skills/") && p.endsWith(".md")));
    // per-file sha256 matches the working tree bytes
    const probe = "README.md";
    const { createHash } = await import("node:crypto");
    const digest = createHash("sha256").update(readFileSync(join(REPO_ROOT, probe))).digest("hex");
    strictEqual(m1.files[probe].sha256, digest);
    ok(Object.keys(m1.files[probe]).length === 2); // sha256 + bytes only
  });
});
