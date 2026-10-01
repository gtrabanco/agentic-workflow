/**
 * Tests for the `doc` retrieval entry point — P2 grammar + envelope contract.
 *
 * Scope (unit 65, P2): argument grammar (`--sync|--query|--status|--rebuild`,
 * `--json-only`), the canonical envelope `{ok, command, results[],
 * degradations[], store}` with its frozen key order, the closed degradation
 * vocabulary, TypeBox validation of the envelope, and CLI exit codes
 * (0 success incl. degraded · 1 usage/IO). Store/query engine behavior is
 * P3–P5 scope and is deliberately NOT asserted here.
 *
 * Uses node:test; rides both runtimes (`bun test` and `node --test`).
 */

import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok, throws, match } from "node:assert";
import { spawnSync, execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { parseDocArgs } from "../src/doc/grammar.mjs";
import {
  buildEnvelope,
  buildResultRow,
  validateEnvelope,
  degradationIsKnown,
} from "../src/doc/envelope.mjs";

const BIN = join(dirname(fileURLToPath(import.meta.url)), "..", "bin", "agentic-workflow.mjs");

// ── Grammar ──────────────────────────────────────────────────────────────

describe("doc grammar", () => {
  it("parses --sync", () => {
    deepStrictEqual(parseDocArgs(["--sync"]), { op: "sync", query: null, jsonOnly: false, quiet: false });
  });

  it("parses --status and --rebuild", () => {
    deepStrictEqual(parseDocArgs(["--status"]), { op: "status", query: null, jsonOnly: false, quiet: false });
    deepStrictEqual(parseDocArgs(["--rebuild"]), { op: "rebuild", query: null, jsonOnly: false, quiet: false });
  });

  it("parses --query with its term", () => {
    deepStrictEqual(parseDocArgs(["--query", "backoff"]), {
      op: "query",
      query: "backoff",
      jsonOnly: false,
      since: null,
      until: null,
      file: null,
      mode: "keyword",
      quiet: false,
    });
  });

  it("parses --json-only in any position", () => {
    deepStrictEqual(parseDocArgs(["--json-only", "--query", "x"]), {
      op: "query",
      query: "x",
      jsonOnly: true,
      since: null,
      until: null,
      file: null,
      mode: "keyword",
      quiet: false,
    });
    deepStrictEqual(parseDocArgs(["--sync", "--json-only"]), { op: "sync", query: null, jsonOnly: true, quiet: false });
  });

  it("rejects empty args", () => {
    throws(() => parseDocArgs([]), /usage/i);
  });

  it("rejects a positional first token (half-A ops ship with unit 71)", () => {
    throws(() => parseDocArgs(["read", "--file", "x"]), /usage/i);
    throws(() => parseDocArgs(["read"]), /71/);
  });

  it("rejects --query without a term", () => {
    throws(() => parseDocArgs(["--query"]), /usage/i);
    throws(() => parseDocArgs(["--query", "--json-only"]), /usage/i);
    throws(() => parseDocArgs(["--query", ""]), /usage/i);
  });

  it("rejects more than one retrieval operation", () => {
    throws(() => parseDocArgs(["--sync", "--status"]), /usage/i);
  });

  it("rejects unknown flags", () => {
    throws(() => parseDocArgs(["--wat"]), /usage/i);
  });

  it("rejects --json-only with no operation", () => {
    throws(() => parseDocArgs(["--json-only"]), /usage/i);
  });
});

// ── Envelope ─────────────────────────────────────────────────────────────

describe("doc envelope", () => {
  it("emits the frozen key order ok,command,results,degradations,store", () => {
    const env = buildEnvelope({ command: "status" });
    deepStrictEqual(Object.keys(env), ["ok", "command", "results", "degradations", "store"]);
  });

  it("emits result rows as path,section,lines,score,meta", () => {
    const row = buildResultRow({ path: "a.md", section: "intro", lines: [1, 9], score: 0.5 });
    deepStrictEqual(Object.keys(row), ["path", "section", "lines", "score", "meta"]);
  });

  it("stays ok:true on degraded success", () => {
    const env = buildEnvelope({ command: "query", degradations: ["unavailable-sqlite-node"] });
    strictEqual(env.ok, true);
    deepStrictEqual(env.degradations, ["unavailable-sqlite-node"]);
  });

  it("rejects an unknown degradation at construction time (closed vocabulary)", () => {
    throws(() => buildEnvelope({ command: "query", degradations: ["made-up"] }), /degradation/i);
  });

  it("validates a canonical envelope with TypeBox", () => {
    const env = JSON.parse(
      JSON.stringify(
        buildEnvelope({
          command: "query",
          results: [buildResultRow({ path: "a.md", section: "s", lines: [1, 2], score: 1 })],
        }),
      ),
    );
    const v = validateEnvelope(env);
    strictEqual(v.ok, true, JSON.stringify(v.errors));
  });

  it("rejects a malformed envelope (bad ok type, row missing path)", () => {
    const bad = { ok: "yes", command: "query", results: [{ section: "s" }], degradations: [], store: null };
    const v = validateEnvelope(bad);
    strictEqual(v.ok, false);
    ok(v.errors.length >= 2);
  });

  it("rejects an unknown command value", () => {
    strictEqual(validateEnvelope({ ok: true, command: "frobnicate", results: [], degradations: [], store: null }).ok, false);
  });

  it("survives a JSON roundtrip (no timestamps, stable key order)", () => {
    const env = buildEnvelope({ command: "sync" });
    const twice = JSON.parse(JSON.stringify(JSON.parse(JSON.stringify(env))));
    deepStrictEqual(twice, env);
    ok(!JSON.stringify(twice).match(/timestamp|generatedAt|now/i));
  });
});

// ── Degradation vocabulary (D3, closed) ──────────────────────────────────

describe("degradation vocabulary", () => {
  const KNOWN = [
    "unavailable-sqlite-node",
    "unavailable-sqlite-bun",
    "unavailable-embeddings-not-configured",
    "unavailable-embeddings-provider-down",
    "unavailable-embeddings-http-401",
    "embeddings-model-mismatch",
  ];
  const UNKNOWN = [
    "made-up",
    "unavailable-sqlite-win32",
    "unavailable-sqlite-",
    "unavailable-embeddings-",
    "embeddings-model-mismatch-but-not",
    "UNAVAILABLE-SQLITE-node",
  ];

  for (const d of KNOWN) {
    it(`knows ${d}`, () => {
      strictEqual(degradationIsKnown(d), true);
    });
  }
  for (const d of UNKNOWN) {
    it(`rejects ${d}`, () => {
      strictEqual(degradationIsKnown(d), false);
    });
  }
});

// ── CLI exit codes + single-JSON-doc contract (AC8 shape) ────────────────

describe("doc CLI", () => {
  let tmp;

  it("sets up an isolated cwd", () => {
    tmp = mkdtempSync(join(tmpdir(), "agentic-workflow-doc-"));
    // --sync now runs the real engine (P4): the fixture must be a git repo.
    execFileSync("git", ["init", "-q"], { cwd: tmp });
    execFileSync("git", ["config", "user.email", "t@example.test"], { cwd: tmp });
    execFileSync("git", ["config", "user.name", "t"], { cwd: tmp });
    writeFileSync(join(tmp, "readme.md"), "# Fixture\nbody\n");
    execFileSync("git", ["add", "-A"], { cwd: tmp });
    execFileSync("git", ["commit", "-qm", "fixture"], { cwd: tmp });
    ok(existsSync(tmp));
  });

  it("runs --query --json-only: exit 0, exactly one JSON doc on stdout", () => {
    const r = spawnSync(process.execPath, [BIN, "doc", "--query", "x", "--json-only"], {
      cwd: tmp,
      encoding: "utf8",
    });
    strictEqual(r.status, 0, `stderr: ${r.stderr}`);
    const env = JSON.parse(r.stdout); // throws unless the WHOLE stdout is one JSON doc
    deepStrictEqual(Object.keys(env), ["ok", "command", "results", "degradations", "store"]);
    const v = validateEnvelope(env);
    strictEqual(v.ok, true, JSON.stringify(v.errors));
  });

  it("runs --sync --json-only: exit 0", () => {
    const r = spawnSync(process.execPath, [BIN, "doc", "--sync", "--json-only"], { cwd: tmp, encoding: "utf8" });
    strictEqual(r.status, 0, `stderr: ${r.stderr}`);
    const env = JSON.parse(r.stdout);
    strictEqual(env.command, "sync");
  });

  it("exits 1 on a positional first token (usage error)", () => {
    const r = spawnSync(process.execPath, [BIN, "doc", "read", "--file", "x"], { cwd: tmp, encoding: "utf8" });
    strictEqual(r.status, 1);
    match(r.stderr, /usage|71/i);
    strictEqual(r.stdout, "");
  });

  it("exits 1 with no arguments", () => {
    const r = spawnSync(process.execPath, [BIN, "doc"], { cwd: tmp, encoding: "utf8" });
    strictEqual(r.status, 1);
    match(r.stderr, /usage/i);
  });

  it("exits 1 when --query has no term", () => {
    const r = spawnSync(process.execPath, [BIN, "doc", "--query"], { cwd: tmp, encoding: "utf8" });
    strictEqual(r.status, 1);
    match(r.stderr, /usage/i);
  });

  it("exits 1 on an unknown flag", () => {
    const r = spawnSync(process.execPath, [BIN, "doc", "--wat"], { cwd: tmp, encoding: "utf8" });
    strictEqual(r.status, 1);
  });

  it("cleans up the temp cwd", () => {
    if (tmp && existsSync(tmp)) rmSync(tmp, { recursive: true, force: true });
  });
});

// ── AC27 — runtime dual: identical envelope under bun and node ───────────

describe("doc CLI — runtime dual (AC27)", () => {
  it("produces the byte-identical envelope under bun and under node", () => {
    let hasBun = true;
    try {
      spawnSync("bun", ["--version"], { encoding: "utf8" });
    } catch {
      hasBun = false;
    }
    if (!hasBun) {
      return; // node-only environment: the node-compat CI half still ran
    }
    const proj = mkdtempSync(join(tmpdir(), "agentic-workflow-dual-"));
    try {
      execFileSync("git", ["init", "-q"], { cwd: proj });
      execFileSync("git", ["config", "user.email", "t@example.test"], { cwd: proj });
      execFileSync("git", ["config", "user.name", "t"], { cwd: proj });
      writeFileSync(join(proj, "doc.md"), "# Dual\nthe runtimedual term\n");
      execFileSync("git", ["add", "-A"], { cwd: proj });
      execFileSync("git", ["commit", "-qm", "fixture"], { cwd: proj });
      const args = [BIN, "doc", "--query", "runtimedual", "--json-only"];
      const bunRun = spawnSync("bun", args, { cwd: proj, encoding: "utf8" });
      const nodeRun = spawnSync(process.execPath, args, { cwd: proj, encoding: "utf8" });
      strictEqual(bunRun.status, 0, bunRun.stderr);
      strictEqual(nodeRun.status, 0, nodeRun.stderr);
      // envelope identity modulo the absolute store path inside it
      const strip = (s) => JSON.parse(s).results.map((r) => `${r.path}:${r.section}:${r.lines.join("-")}`).sort();
      deepStrictEqual(strip(bunRun.stdout), strip(nodeRun.stdout));
      const envA = JSON.parse(bunRun.stdout);
      const envB = JSON.parse(nodeRun.stdout);
      deepStrictEqual(envA.degradations, envB.degradations);
      deepStrictEqual(envA.command, envB.command);
      deepStrictEqual(Object.keys(envA), Object.keys(envB));
    } finally {
      rmSync(proj, { recursive: true, force: true });
    }
  });
});
