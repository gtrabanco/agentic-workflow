/**
 * Tests for the hybrid query mode behind the judge gate (unit 65, P7 —
 * AC15, AC17, AC18 query half, AC19).
 *
 * RRF fusion over the FTS5 and vector top-K; the keyword-only degradation
 * when no key exists and the provider-down degradation with its cause
 * declared (AC17); the model-mismatch degradation at query time (AC18); the
 * AC15 judge fixture (query shares no terms with the doc: hybrid top-3
 * returns it while keyword does not — no delta ⇒ hybrid does not ship);
 * the JS-cosine kNN runs over D4's float32-LE BLOBs (decision D11: no
 * second vec0 store).
 */

import { describe, it, before, after } from "node:test";
import { strictEqual, deepStrictEqual, ok, throws } from "node:assert";
import { mkdtempSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { parseDocArgs } from "../src/doc/grammar.mjs";
import { queryIndex } from "../src/doc/query.mjs";
import { syncIndex } from "../src/doc/sync.mjs";
import { embedPendingChunks } from "../src/doc/embeddings.mjs";

let root;

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

// Deterministic "semantic" embedder: meaning → direction, no shared terms
// required. The judge fixture's whole point lives in this mapping.
function semanticEmbedder(model = "judge-1") {
  const state = { calls: 0 };
  const vectorFor = (text) => {
    const t = text.toLowerCase();
    if (/transient|failure|handling/.test(t)) return [0.9, 0.1, 0.0];
    if (/backoff|retryable/.test(t)) return [1.0, 0.05, 0.0]; // same meaning, different words
    if (/rose|pruning|soil/.test(t)) return [0.0, 0.05, 1.0];
    return [0.33, 0.33, 0.34];
  };
  return {
    model,
    state,
    async embed(texts) {
      state.calls += 1;
      return texts.map(vectorFor);
    },
  };
}

before(async () => {
  root = mkdtempSync(join(tmpdir(), "doc-hybrid-"));
  git(["init", "-q"]);
  git(["config", "user.email", "t@example.test"]);
  git(["config", "user.name", "t"]);
  writeFileSync(
    join(root, "retry.md"),
    "# Resilience\n\nThe backoff policy for retryable errors uses exponential delays with jitter.\n",
  );
  writeFileSync(
    join(root, "garden.md"),
    "# Gardening\n\nRose pruning schedules depend on soil acidity and frost dates.\n",
  );
  git(["add", "-A"]);
  git(["commit", "-qm", "fixture"]);
  await syncIndex(root);
  await embedPendingChunks(root, semanticEmbedder());
});

after(() => {
  if (root && existsSync(root)) rmSync(root, { recursive: true, force: true });
});

// ── Grammar: --mode ──────────────────────────────────────────────────────

describe("hybrid grammar", () => {
  it("parses --mode hybrid on a query", () => {
    deepStrictEqual(parseDocArgs(["--query", "t", "--mode", "hybrid"]).mode, "hybrid");
    deepStrictEqual(parseDocArgs(["--mode", "keyword", "--query", "t"]).mode, "keyword");
  });

  it("defaults to keyword and rejects the flag elsewhere or with an unknown value", () => {
    strictEqual(parseDocArgs(["--query", "t"]).mode, "keyword");
    throws(() => parseDocArgs(["--query", "t", "--mode", "quantum"]), /usage/i);
    throws(() => parseDocArgs(["--sync", "--mode", "hybrid"]), /usage/i);
    throws(() => parseDocArgs(["--query", "t", "--mode"]), /usage/i);
  });
});

// ── AC15 — the judge fixture (ship / no-ship) ────────────────────────────

describe("judge fixture (AC15)", () => {
  it("keyword mode returns NOTHING for the no-shared-terms query", async () => {
    const env = await queryIndex(root, "transient failure handling", {}, { mode: "keyword" });
    deepStrictEqual(env.results, []);
  });

  it("hybrid mode returns the paraphrased doc in the top-3 — the delta that ships P2", async () => {
    const env = await queryIndex(root, "transient failure handling", {}, {
      mode: "hybrid",
      embedder: semanticEmbedder(),
    });
    ok(env.results.length >= 1, JSON.stringify(env.results));
    ok(env.results.slice(0, 3).some((r) => r.path === "retry.md"), JSON.stringify(env.results));
    // the unrelated doc does not beat the paraphrase
    if (env.results.length >= 2) {
      strictEqual(env.results[0].path, "retry.md");
    }
    // the measured delta, for Evidence: keyword results = 0, hybrid top-3 = retry.md
    deepStrictEqual(env.degradations, []);
  });

  it("fused rows stay envelope-valid: path,section,lines,score,meta", async () => {
    const env = await queryIndex(root, "transient failure handling", {}, {
      mode: "hybrid",
      embedder: semanticEmbedder(),
    });
    for (const r of env.results) {
      deepStrictEqual(Object.keys(r), ["path", "section", "lines", "score", "meta"]);
      ok(Number.isFinite(r.score));
    }
  });
});

// ── AC17 — degrade, never break ──────────────────────────────────────────

describe("hybrid degradation (AC17)", () => {
  it("no key ⇒ unavailable-embeddings-not-configured, keyword still answers, exit-0 ok", async () => {
    const env = await queryIndex(root, "backoff", {}, { mode: "hybrid", embedder: null });
    strictEqual(env.ok, true);
    deepStrictEqual(env.degradations, ["unavailable-embeddings-not-configured"]);
    // keyword mode still answers: the term literally exists in retry.md
    ok(env.results.some((r) => r.path === "retry.md"), JSON.stringify(env.results));
  });

  it("provider down ⇒ unavailable-embeddings-provider-down, keyword results survive", async () => {
    const dead = {
      model: "judge-1",
      async embed() {
        throw new Error("ECONNREFUSED");
      },
    };
    const env = await queryIndex(root, "backoff", {}, { mode: "hybrid", embedder: dead });
    strictEqual(env.ok, true);
    deepStrictEqual(env.degradations, ["unavailable-embeddings-provider-down"]);
    ok(env.results.some((r) => r.path === "retry.md"));
  });

  it("an unparseable provider error maps into the declared cause, never a crash", async () => {
    const dead = {
      model: "judge-1",
      async embed() {
        throw new Error("429 too many requests");
      },
    };
    const env = await queryIndex(root, "backoff", {}, { mode: "hybrid", embedder: dead });
    deepStrictEqual(env.degradations, ["unavailable-embeddings-provider-down"]);
  });
});

// ── AC18 query half — model mismatch degrades, never ranks cross-model ───

describe("hybrid model mismatch (AC18)", () => {
  it("configured model differs from the pinned store model ⇒ declared degradation, keyword answers", async () => {
    const env = await queryIndex(root, "backoff", {}, {
      mode: "hybrid",
      embedder: semanticEmbedder("judge-2"),
    });
    strictEqual(env.ok, true);
    deepStrictEqual(env.degradations, ["embeddings-model-mismatch"]);
    ok(env.results.some((r) => r.path === "retry.md")); // keyword path intact
  });
});

// ── AC19 — cost bound (write half is P6's 0-calls pin; timing in Evidence)

describe("hybrid cost", () => {
  it("hybrid makes exactly one provider call per query (the query embedding)", async () => {
    const e = semanticEmbedder();
    await queryIndex(root, "transient failure handling", {}, { mode: "hybrid", embedder: e });
    strictEqual(e.state.calls, 1);
  });
});
