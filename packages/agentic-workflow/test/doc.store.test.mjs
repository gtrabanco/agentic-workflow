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
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, symlinkSync } from "node:fs";
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
import {
  loadConfig,
  configPath,
  DEFAULT_CONFIG,
  DEFAULT_MAX_REQUEST_CHARS,
  effectiveChunkLimit,
  resolveMaxRequestChars,
} from "../src/doc/config.mjs";
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

// ── store.path containment (F36/F37) ────────────────────────────────────

// F37: a configured store.path outside `.agentic-workflow/` is accepted and
// leaves `git status --porcelain` dirty after --sync (AC7 broken) — the
// configured store must stay inside the ignored directory. F36: when the
// configured leaf does not exist yet, the old lexical fallback let a
// symlinked INTERMEDIATE directory pass containment, so --rebuild's rmSync
// could replace a pre-existing file outside the repository.
describe("doc config — store.path containment (F36/F37)", () => {
  function configWith(storePath) {
    const tmp = mkdtempSync(join(tmpdir(), "doc-contain-"));
    mkdirSync(join(tmp, ".agentic-workflow"));
    writeFileSync(
      join(tmp, ".agentic-workflow", "index.json"),
      JSON.stringify({ version: 1, store: { path: storePath }, provider: null }),
    );
    return tmp;
  }

  it("rejects an in-repo store.path outside .agentic-workflow/ (F37)", () => {
    const tmp = configWith("custom/store.db");
    try {
      throws(() => loadConfig(tmp), /\.agentic-workflow\//);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("rejects .. traversal and absolute paths outside the root", () => {
    for (const p of ["../outside.db", "/etc/index.db"]) {
      const tmp = configWith(p);
      try {
        throws(() => loadConfig(tmp), /\.agentic-workflow\//);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    }
  });

  it("accepts a store.path inside .agentic-workflow/, nested or not", () => {
    for (const p of [".agentic-workflow/index/index.db", ".agentic-workflow/custom/store.db"]) {
      const tmp = configWith(p);
      try {
        strictEqual(loadConfig(tmp).store.path, p);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    }
  });

  it("rejects a symlinked intermediate directory when the leaf does not exist (F36)", () => {
    const tmp = configWith(".agentic-workflow/esc/victim.db");
    const outside = mkdtempSync(join(tmpdir(), "doc-esc-"));
    try {
      // the leaf (.agentic-workflow/esc/victim.db) does NOT exist; its
      // intermediate dir is a symlink escaping the repository root
      symlinkSync(outside, join(tmp, ".agentic-workflow", "esc"), "dir");
      throws(() => loadConfig(tmp), /\.agentic-workflow\//);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("rejects a symlinked .agentic-workflow directory itself (fail closed)", () => {
    const tmp = mkdtempSync(join(tmpdir(), "doc-contain-"));
    const outside = mkdtempSync(join(tmpdir(), "doc-esc-"));
    try {
      rmSync(join(tmp, ".agentic-workflow"), { force: true });
      symlinkSync(outside, join(tmp, ".agentic-workflow"), "dir");
      writeFileSync(
        join(outside, "index.json"),
        JSON.stringify({ version: 1, store: { path: ".agentic-workflow/index/index.db" }, provider: null }),
      );
      throws(() => loadConfig(tmp), /\.agentic-workflow\//);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it("rejects a symlinked .agentic-workflow even with NO config — containment covers the merged default too (F50)", () => {
    const tmp = mkdtempSync(join(tmpdir(), "doc-contain-"));
    const outside = mkdtempSync(join(tmpdir(), "doc-esc-"));
    try {
      symlinkSync(outside, join(tmp, ".agentic-workflow"), "dir");
      // No index.json anywhere: the absent-config branch must still run the
      // containment check over the DEFAULT store path, or --sync writes (and
      // --rebuild's rmSync destroys) outside the repository through the symlink.
      throws(() => loadConfig(tmp), /\.agentic-workflow\//);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });
});

// ── Embedding request budget (fix #540, S5) ──────────────────────────────

describe("doc config — embedding request budget", () => {
  /** A throwaway repo carrying one `index.json` provider block. */
  function configWith(provider) {
    const tmp = mkdtempSync(join(tmpdir(), "doc-budget-"));
    mkdirSync(join(tmp, ".agentic-workflow"));
    writeFileSync(join(tmp, ".agentic-workflow", "index.json"), JSON.stringify({ version: 1, provider }));
    return tmp;
  }

  it("accepts provider.max_request_chars as a positive integer", () => {
    const tmp = configWith({ baseUrl: "u", model: "m", envVar: "K", max_request_chars: 4096 });
    try {
      strictEqual(loadConfig(tmp).provider.max_request_chars, 4096);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("refuses a non-positive or unparseable max_request_chars by name", () => {
    for (const value of [0, -1, "abc", 1.5]) {
      const tmp = configWith({ baseUrl: "u", model: "m", envVar: "K", max_request_chars: value });
      try {
        throws(() => loadConfig(tmp), /max_request_chars/, `accepted ${JSON.stringify(value)}`);
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
    }
  });

  it("refuses a chunk_limit above the request budget — a chunk the provider could never receive", () => {
    const tmp = configWith({ baseUrl: "u", model: "m", envVar: "K", chunk_limit: 200000, max_request_chars: 90000 });
    try {
      throws(() => loadConfig(tmp), /chunk_limit.*max_request_chars/s);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("accepts a chunk_limit at or below the budget", () => {
    const tmp = configWith({ baseUrl: "u", model: "m", envVar: "K", chunk_limit: 4000, max_request_chars: 90000 });
    try {
      strictEqual(loadConfig(tmp).provider.chunk_limit, 4000);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("the effective chunk limit is the request budget when a provider is configured and no chunk_limit is set", () => {
    const tmp = configWith({ baseUrl: "u", model: "m", envVar: "K" });
    try {
      const cfg = loadConfig(tmp);
      strictEqual(effectiveChunkLimit({ config: cfg, providerConfigured: true }), DEFAULT_MAX_REQUEST_CHARS);
      strictEqual(effectiveChunkLimit({ config: cfg, providerConfigured: false }), 0, "the keyword-only path keeps unlimited");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("an explicit chunk_limit wins over the budget on the configured path", () => {
    const tmp = configWith({ baseUrl: "u", model: "m", envVar: "K", chunk_limit: 4000 });
    try {
      strictEqual(effectiveChunkLimit({ config: loadConfig(tmp), providerConfigured: true }), 4000);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("the budget resolves from the config and an environment override, refusing a bad override by name", () => {
    const tmp = configWith({ baseUrl: "u", model: "m", envVar: "K", max_request_chars: 4096 });
    try {
      const cfg = loadConfig(tmp);
      strictEqual(resolveMaxRequestChars({ config: cfg, env: {} }), 4096);
      strictEqual(
        resolveMaxRequestChars({ config: cfg, env: { AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MAX_REQUEST_CHARS: "2048" } }),
        2048,
      );
      throws(
        () => resolveMaxRequestChars({ config: cfg, env: { AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MAX_REQUEST_CHARS: "0" } }),
        /MAX_REQUEST_CHARS|maxRequestChars/,
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
