/**
 * Tests for the embeddings write path (unit 65, P6 — AC16, AC18, and the
 * write half of AC19/AC17).
 *
 * Provider config with pi-style precedence (CLI > environment > config >
 * default, D10), float32-LE vectors behind a format tag with a pinned model
 * column, re-embedding only the chunks of a changed file asserted by mock
 * API call counts (AC16), zero API calls on a warm sync (AC19's write half),
 * and the model-mismatch fail-closed rule (no cross-model store, AC18's
 * write half — the query side degrades in P7).
 */

import { describe, it, before, after } from "node:test";
import { strictEqual, deepStrictEqual, ok, throws, rejects } from "node:assert";
import { mkdtempSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { encodeVector, decodeVector, VECTOR_TAG } from "../src/doc/embeddings.mjs";
import { resolveEmbedConfig, makeOpenAIProvider } from "../src/doc/embeddings.mjs";
import { embedPendingChunks, storedEmbeddingModel } from "../src/doc/embeddings.mjs";
import { syncIndex } from "../src/doc/sync.mjs";
import { storePath } from "../src/doc/store.mjs";
import { openDatabase } from "../src/doc/sqlite.mjs";

let root;

function git(args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" });
}

function mockEmbedder(model, dim = 3) {
  const state = { calls: 0, batches: [] };
  return {
    model,
    state,
    async embed(texts) {
      state.calls += 1;
      state.batches.push(texts.length);
      return texts.map((_, i) => Array.from({ length: dim }, (_, j) => (i + 1) * 0.1 + j * 0.01));
    },
  };
}

before(() => {
  root = mkdtempSync(join(tmpdir(), "doc-embed-"));
  git(["init", "-q"]);
  git(["config", "user.email", "t@example.test"]);
  git(["config", "user.name", "t"]);
  writeFileSync(join(root, "a.md"), "# Alpha\nalpha body\n\n## Alpha two\nmore\n");
  writeFileSync(join(root, "b.md"), "# Beta\nbeta body\n");
  git(["add", "-A"]);
  git(["commit", "-qm", "fixture"]);
});

after(() => {
  if (root && existsSync(root)) rmSync(root, { recursive: true, force: true });
});

// ── Vector encoding (D4: float32-LE behind a format tag) ─────────────────

describe("vector encoding", () => {
  it("roundtrips float32 values through the tagged little-endian blob", () => {
    const v = [1.5, -2.25, 0.000001, 12345.678];
    const blob = encodeVector(v);
    ok(blob instanceof Uint8Array);
    strictEqual(blob.subarray(0, VECTOR_TAG.length).toString("binary"), VECTOR_TAG);
    const back = decodeVector(blob);
    strictEqual(back.length, v.length);
    for (let i = 0; i < v.length; i++) ok(Math.abs(back[i] - v[i]) < 1e-3, `slot ${i}: ${back[i]} vs ${v[i]}`); // float32 precision
  });

  it("refuses to decode a blob without the format tag (never guess the layout)", () => {
    throws(() => decodeVector(new Uint8Array([1, 2, 3, 4])), /tag/i);
  });

  it("encodes little-endian deterministically", () => {
    const a = encodeVector([0.5]);
    const b = encodeVector([0.5]);
    deepStrictEqual([...a], [...b]);
    // 0.5 float32 LE = 00 00 00 3f after the tag
    const payload = a.subarray(VECTOR_TAG.length);
    deepStrictEqual([...payload], [0, 0, 0, 0x3f]);
  });
});

// ── Provider resolution (D10 precedence) ─────────────────────────────────

describe("embed config resolution", () => {
  const CONFIG = { provider: { baseUrl: "cfg-url", model: "cfg-model", envVar: "MINE" } };

  it("resolves from config + the config-named env var for the key", () => {
    const c = resolveEmbedConfig({ config: CONFIG, env: { MINE: "env-key" } });
    deepStrictEqual(c, { configured: true, baseUrl: "cfg-url", model: "cfg-model", apiKey: "env-key" });
  });

  it("direct pi-style env vars override the config fields", () => {
    const c = resolveEmbedConfig({
      config: CONFIG,
      env: {
        MINE: "env-key",
        AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BASE_URL: "env-url",
        AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MODEL: "env-model",
      },
    });
    deepStrictEqual(c, { configured: true, baseUrl: "env-url", model: "env-model", apiKey: "env-key" });
  });

  it("CLI beats environment beats config (D10 order)", () => {
    const c = resolveEmbedConfig({
      config: CONFIG,
      env: { MINE: "env-key", AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MODEL: "env-model" },
      cli: { baseUrl: "cli-url", model: "cli-model", apiKey: "cli-key" },
    });
    deepStrictEqual(c, { configured: true, baseUrl: "cli-url", model: "cli-model", apiKey: "cli-key" });
  });

  it("absent everywhere ⇒ not configured (never a hard failure, AC17's root)", () => {
    deepStrictEqual(resolveEmbedConfig({ config: { provider: null }, env: {} }).configured, false);
    deepStrictEqual(resolveEmbedConfig({ config: CONFIG, env: {} }).configured, false); // key missing
    deepStrictEqual(resolveEmbedConfig({ config: {}, env: {} }).configured, false);
  });
});

// ── Write path: incremental embeddings (AC16) ────────────────────────────

describe("embeddings write path", () => {
  it("absent provider ⇒ sync embeds nothing and exits clean", async () => {
    const r = await syncIndex(root);
    const { db } = await openDatabase(storePath(root));
    const embedded = db.prepare("select count(*) as n from chunks where embedding is not null").get().n;
    db.close();
    strictEqual(embedded, 0);
    ok(r.filesScanned >= 2);
  });

  it("first embed batches per file and stores tagged blobs under the pinned model", async () => {
    const e = mockEmbedder("mock-1");
    const r = await embedPendingChunks(root, e);
    // two files with chunks → one call per file (batches, not per chunk)
    strictEqual(r.model, "mock-1");
    ok(r.calls >= 1 && r.calls <= 2, `calls=${r.calls}`);
    strictEqual(await storedEmbeddingModel(root), "mock-1");
    const { db } = await openDatabase(storePath(root));
    const rows = db.prepare("select embedding, emb_model from chunks where embedding is not null").all();
    db.close();
    ok(rows.length >= 3);
    for (const row of rows) {
      strictEqual(row.emb_model, "mock-1");
      // byte-wise tag check (bun returns plain Uint8Array, not Buffer)
      ok(
        VECTOR_TAG.split("").every((ch, i) => row.embedding[i] === ch.charCodeAt(0)),
      );
      ok(decodeVector(row.embedding).length > 0);
    }
  });

  it("warm sync makes 0 API calls (AC19's write half)", async () => {
    const e = mockEmbedder("mock-1");
    const r = await embedPendingChunks(root, e);
    strictEqual(r.calls, 0);
    strictEqual(r.embedded, 0);
  });

  it("changing one file re-embeds only that file's chunks (AC16)", async () => {
    const before = await chunkEmbeddings(root);
    const e = mockEmbedder("mock-1");
    writeFileSync(join(root, "b.md"), "# Beta\nbeta body changed\nnew section here\n");
    git(["add", "-A"]);
    git(["commit", "-qm", "change b"]);
    await syncIndex(root); // no embedder: pure content sync
    const r = await embedPendingChunks(root, e);
    strictEqual(r.calls, 1); // one batch — b.md's chunks only
    strictEqual(r.embedded, 1); // b.md's single section chunk
    const after = await chunkEmbeddings(root);
    // untouched file's vectors are byte-identical
    for (const [id, blob] of Object.entries(before)) {
      if (id.startsWith("a.md")) deepStrictEqual([...after[id]], [...blob]);
    }
    // changed file's chunks got fresh vectors
    ok(after["b.md#beta"].length > 0);
  });

  it("model mismatch fails closed: no re-embed, no cross-model store (AC18 write half)", async () => {
    const e2 = mockEmbedder("mock-2");
    const r = await embedPendingChunks(root, e2);
    strictEqual(r.skipped, true);
    strictEqual(r.reason, "embeddings-model-mismatch");
    strictEqual(e2.state.calls, 0); // never called
    const { db } = await openDatabase(storePath(root));
    const models = db.prepare("select distinct emb_model from chunks where embedding is not null").all();
    db.close();
    deepStrictEqual(models.map((m) => m.emb_model), ["mock-1"]); // old model only, consistent
  });

  it("a store rebuilt under the new model embeds everything under it", async () => {
    const { rebuildIndex } = await import("../src/doc/sync.mjs");
    const e3 = mockEmbedder("mock-3");
    await rebuildIndex(root);
    const r = await embedPendingChunks(root, e3);
    ok(r.embedded >= 3);
    ok(r.calls >= 1);
    strictEqual(await storedEmbeddingModel(root), "mock-3");
    const { db } = await openDatabase(storePath(root));
    const models = db.prepare("select distinct emb_model from chunks where embedding is not null").all();
    db.close();
    deepStrictEqual(models.map((m) => m.emb_model), ["mock-3"]);
  });
});

async function chunkEmbeddings(root) {
  const { db } = await openDatabase(storePath(root));
  const rows = db.prepare("select chunk_id, embedding from chunks where embedding is not null").all();
  db.close();
  return Object.fromEntries(rows.map((r) => [r.chunk_id, r.embedding]));
}

// makeOpenAIProvider is exercised for shape only — no network in tests.
describe("openai-compatible provider", () => {
  it("builds a provider with the pinned model and a batched embed function", async () => {
    const p = makeOpenAIProvider({ baseUrl: "http://127.0.0.1:9", apiKey: "k", model: "m", fetchImpl: async () => { throw new Error("offline"); } });
    strictEqual(p.model, "m");
    await rejects(() => p.embed(["x"]), /offline/); // dead endpoint throws, never silently returns junk
  });
});
