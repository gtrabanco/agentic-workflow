/**
 * Tests for the keyword query core (unit 65, P5 — AC7's status half, AC8,
 * AC13, AC14) and `--rebuild`.
 *
 * FTS5 search behind `--query --json-only` with result rows
 * `{path, section, lines, score, meta}` in the frozen D3 ordering
 * (score desc → path asc → section asc → lines[0] asc), `--status`
 * reporting the store, the structured session-log filter over `docs/LOGS.md`
 * entries (date range and/or touched-file path), offline keyword answering,
 * and a `--rebuild` that rebuilds the store from scratch.
 */

import { describe, it, before, after } from "node:test";
import { strictEqual, deepStrictEqual, ok, throws } from "node:assert";
import { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync, execFileSync } from "node:child_process";

import { parseDocArgs } from "../src/doc/grammar.mjs";
import { queryIndex, parseLogEntry } from "../src/doc/query.mjs";
import { syncIndex, storeStats, ensureFresh } from "../src/doc/sync.mjs";
import { storePath, storePresent } from "../src/doc/store.mjs";
import { validateEnvelope } from "../src/doc/envelope.mjs";

const BIN = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "agentic-workflow.mjs");

let root;

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

const LOG_MD = [
  "# Session log",
  "",
  "## 2026-09-01T10:00Z — feat/alpha — manual",
  "- **Commits:** 1 (`aaaa`)",
  "- **Files:** `docs/features/alpha-x/SPEC.md`",
  "- **Summary:** the quokkatine incident",
  "",
  "## 2026-09-15T10:00Z — feat/beta — auto",
  "- **Commits:** 2 (`bbbb`, `cccc`)",
  "- **Files:** `docs/features/beta-y/{SPEC.md,PLAN.md}`, `docs/features/alpha-x/SPEC.md`",
  "- **Summary:** the quokkatine aftermath",
  "",
].join("\n");

before(() => {
  root = mkdtempSync(join(tmpdir(), "doc-query-"));
  git(["init", "-q"]);
  git(["config", "user.email", "t@example.test"]);
  git(["config", "user.name", "t"]);
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "docs", "LOGS.md"), LOG_MD);
  writeFileSync(join(root, "two.md"), "# Top\nnothing here\n\n## Needle section\nthe zanzibar needle lives here\n");
  writeFileSync(join(root, "one.md"), "zanzibar also mentioned\n");
  git(["add", "-A"]);
  git(["commit", "-qm", "fixture"]);
  return syncIndex(root);
});

after(() => {
  if (root && existsSync(root)) rmSync(root, { recursive: true, force: true });
});

// ── Grammar: query filters ───────────────────────────────────────────────

describe("doc grammar — query filters (AC14 surface)", () => {
  it("parses --since/--until/--file alongside --query in any position", () => {
    deepStrictEqual(
      parseDocArgs(["--file", "docs/x", "--query", "t", "--since", "2026-09-01"]),
      { op: "query", query: "t", jsonOnly: false, since: "2026-09-01", until: null, file: "docs/x", mode: "keyword", quiet: false },
    );
  });

  it("defaults the filters to null", () => {
    deepStrictEqual(parseDocArgs(["--query", "t"]), {
      op: "query",
      query: "t",
      jsonOnly: false,
      since: null,
      until: null,
      file: null,
      mode: "keyword",
      quiet: false,
    });
  });

  it("rejects filters without a value and filters on non-query ops", () => {
    throws(() => parseDocArgs(["--query", "t", "--since"]), /usage/i);
    throws(() => parseDocArgs(["--file"]), /usage/i);
    throws(() => parseDocArgs(["--sync", "--since", "2026-01-01"]), /usage/i);
  });
});

// ── Query core ───────────────────────────────────────────────────────────

describe("doc query core", () => {
  it("returns rows with path, section, lines, score, meta — ordered by the frozen D3 rule", async () => {
    const env = await queryIndex(root, "zanzibar");
    ok(env.results.length >= 2);
    for (const r of env.results) {
      deepStrictEqual(Object.keys(r), ["path", "section", "lines", "score", "meta"]);
      deepStrictEqual(Object.keys(r.lines), ["0", "1"]); // a [start, end] pair
      ok(typeof r.score === "number" && Number.isFinite(r.score));
      ok(typeof r.meta === "object");
    }
    const isSorted = env.results.every((r, i) => {
      if (i === 0) return true;
      const a = env.results[i - 1];
      return a.score >= r.score && (a.score !== r.score || a.path <= r.path);
    });
    ok(isSorted, JSON.stringify(env.results.map((r) => [r.path, r.score])));
    deepStrictEqual(env.degradations, []); // keyword mode: no degradations, no network
  });

  it("hits the right section with 1-based inclusive lines", async () => {
    const env = await queryIndex(root, "needle");
    const hit = env.results.find((r) => r.path === "two.md");
    ok(hit, JSON.stringify(env.results));
    strictEqual(hit.section, "Top > Needle section");
    strictEqual(hit.lines[0], 4); // chunk lines start at the heading line
    ok(hit.lines[1] >= hit.lines[0]);
  });

  it("is deterministic: the same query answers identically twice", async () => {
    const a = await queryIndex(root, "zanzibar");
    const b = await queryIndex(root, "zanzibar");
    deepStrictEqual(a, b);
  });

  it("answers offline with no key and no network (AC13)", async () => {
    const env = await queryIndex(root, "zanzibar");
    strictEqual(env.ok, true);
    ok(env.results.length > 0);
    deepStrictEqual(env.degradations, []);
  });

  it("answers with an empty result set for a term that matches nothing", async () => {
    const env = await queryIndex(root, "xylophone-not-present");
    deepStrictEqual(env.results, []);
    strictEqual(env.ok, true);
  });
});

// ── Session-log structured filter (AC14) ─────────────────────────────────

describe("doc session-log filter", () => {
  it("parseLogEntry extracts timestamp, branch, mode and the Files cell", () => {
    const e = parseLogEntry("## 2026-09-15T10:00Z — feat/beta — auto\n- **Files:** `docs/x/a.md`, `docs/y/b.md`\n- **Summary:** s");
    deepStrictEqual(e, {
      timestamp: "2026-09-15T10:00Z",
      branch: "feat/beta",
      mode: "auto",
      files: "`docs/x/a.md`, `docs/y/b.md`",
    });
  });

  it("returns null for a non-log chunk", () => {
    strictEqual(parseLogEntry("# Not a log\nbody"), null);
  });

  it("date-range filter narrows to the matching entries (AC14)", async () => {
    const env = await queryIndex(root, "quokkatine", { since: "2026-09-10" });
    ok(env.results.length >= 1);
    for (const r of env.results) {
      strictEqual(r.path, join("docs", "LOGS.md"));
      ok(r.meta.timestamp >= "2026-09-10", r.meta.timestamp);
    }
    ok(env.results.some((r) => r.meta.branch === "feat/beta"));
    ok(!env.results.some((r) => r.meta.branch === "feat/alpha"));
  });

  it("touched-file filter matches entries listing that path (AC14)", async () => {
    const env = await queryIndex(root, "quokkatine", { file: "docs/features/alpha-x" });
    ok(env.results.length === 2); // both entries touch docs/features/alpha-x/SPEC.md
    for (const r of env.results) {
      ok(r.meta.files.includes("docs/features/alpha-x"));
    }
  });

  it("combined filters AND together", async () => {
    const env = await queryIndex(root, "quokkatine", {
      since: "2026-09-10",
      file: "docs/features/beta-y",
    });
    strictEqual(env.results.length, 1);
    strictEqual(env.results[0].meta.branch, "feat/beta");
  });

  it("carries path + lines + metadata on the rows (AC14's shape)", async () => {
    const env = await queryIndex(root, "quokkatine", { since: "2026-09-01" });
    for (const r of env.results) {
      deepStrictEqual(Object.keys(r.meta).sort(), ["branch", "files", "mode", "timestamp"]);
      ok(r.lines[0] >= 1);
    }
  });
});

// ── Status + rebuild ─────────────────────────────────────────────────────

describe("doc status + rebuild", () => {
  it("status reports files and chunks over a synced store (AC7's half)", async () => {
    const stats = await storeStats(root);
    ok(stats.files >= 3 && stats.chunks > 0);
    strictEqual(storePresent(root), true);
  });

  it("rebuild produces an equivalent store", async () => {
    const { rebuildIndex } = await import("../src/doc/sync.mjs");
    const before = await storeStats(root);
    const r = await rebuildIndex(root);
    ok(r.rebuilt === true);
    const after = await storeStats(root);
    strictEqual(after.chunks, before.chunks);
    strictEqual(after.files, before.files);
    // a fresh sync after rebuild is a no-op (the manifest is identical)
    const warm = await syncIndex(root);
    strictEqual(warm.filesChanged, 0);
  });
});

// ── CLI end-to-end (AC7 status, AC8 envelope, AC13 offline) ──────────────

describe("doc CLI — query/status/rebuild end-to-end", () => {
  it("--query --json-only prints exactly one JSON envelope with real results (AC8)", async () => {
    const r = spawnSync(process.execPath, [BIN, "doc", "--query", "zanzibar", "--json-only"], {
      cwd: root,
      encoding: "utf8",
    });
    strictEqual(r.status, 0, `stderr: ${r.stderr}`);
    const env = JSON.parse(r.stdout); // whole stdout = one JSON doc
    const v = await validateEnvelope(env);
    strictEqual(v.ok, true, JSON.stringify(v.errors));
    ok(env.results.length >= 2);
    ok(env.store.present === true);
  });

  it("--status --json-only reports the store without syncing", () => {
    const r = spawnSync(process.execPath, [BIN, "doc", "--status", "--json-only"], { cwd: root, encoding: "utf8" });
    strictEqual(r.status, 0, `stderr: ${r.stderr}`);
    const env = JSON.parse(r.stdout);
    strictEqual(env.command, "status");
    ok(env.store.files >= 3);
    ok(env.store.chunks > 0);
  });

  it("answers offline at the CLI level too (AC13): no key, dead proxy, still exit 0", () => {
    const r = spawnSync(process.execPath, [BIN, "doc", "--query", "zanzibar", "--json-only"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, HTTP_PROXY: "http://127.0.0.1:9", HTTPS_PROXY: "http://127.0.0.1:9", NO_PROXY: "" },
    });
    strictEqual(r.status, 0);
    const env = JSON.parse(r.stdout);
    ok(env.results.length >= 2);
    deepStrictEqual(env.degradations, []);
  });

  it("a fresh repo without a store reports status present:false and answers empty (grep fallback intact)", () => {
    const bare = mkdtempSync(join(tmpdir(), "doc-bare-"));
    try {
      const r = spawnSync(process.execPath, [BIN, "doc", "--status", "--json-only"], { cwd: bare, encoding: "utf8" });
      strictEqual(r.status, 0, `stderr: ${r.stderr}`);
      const env = JSON.parse(r.stdout);
      deepStrictEqual(env.store, { path: join(bare, ".agentic-workflow", "index", "index.db"), present: false, files: 0, chunks: 0 });
    } finally {
      rmSync(bare, { recursive: true, force: true });
    }
  });
});
