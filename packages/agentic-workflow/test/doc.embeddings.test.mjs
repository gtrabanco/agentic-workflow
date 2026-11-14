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
import { embedPendingChunks, storedEmbeddingModel, resolvePacing, DEFAULT_PACING } from "../src/doc/embeddings.mjs";
import { syncIndex } from "../src/doc/sync.mjs";
import { storePath } from "../src/doc/store.mjs";
import { openDatabase } from "../src/doc/sqlite.mjs";

let root;

function git(args) {
  return execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.test", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8" });
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

async function chunkEmbeddings(root) {  const { db } = await openDatabase(storePath(root));
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

// ── S3/S9/S10 — sync resilience: pacing, retry, resume (issue #443) ───────
//
// The defects these cover: `embedPendingChunks` called `provider.embed` with no
// try/catch, no retry, no pacing and no batch cap, and wrote the pinned-model
// meta only after the whole pass — one 429 aborted the run and left the store
// 38 % embedded and unpinned (issue #443 background).

/** A throwaway git repo carrying `files` (path → markdown). */
function resilienceFixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "doc-pace-"));
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.test", "-c", "commit.gpgsign=false", "init", "-q"], { cwd: dir });
  for (const [rel, body] of Object.entries(files)) writeFileSync(join(dir, rel), body);
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.test", "-c", "commit.gpgsign=false", "add", "-A"], { cwd: dir });
  execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@example.test", "-c", "commit.gpgsign=false", "commit", "-qm", "fixture"], { cwd: dir });
  return dir;
}

/** `count` single-section files — one chunk each, so one batch each. */
function manyFiles(count) {
  const files = {};
  for (let i = 0; i < count; i += 1) files[`f${String(i).padStart(3, "0")}.md`] = `# File ${i}\nbody ${i}\n`;
  return files;
}

/** A virtual clock so a paced run is measured without waiting. */
function virtualClock() {
  let t = 0;
  const sleeps = [];
  return {
    sleeps,
    now: () => t,
    sleep: async (ms) => {
      sleeps.push(ms);
      t += ms;
    },
  };
}

/** A provider that records every batch it was handed. */
function recordingEmbedder(model = "mock-1") {
  const state = { calls: 0, batches: [] };
  return {
    model,
    state,
    async embed(texts) {
      state.calls += 1;
      state.batches.push([...texts]);
      return texts.map((_, i) => [i + 1, i + 2, i + 3]);
    },
  };
}

/** A 429/500 carrying the machine-readable status the retry policy branches on. */
function providerError(status, message) {
  const error = new Error(message ?? `embeddings provider ${status}`);
  error.status = status;
  return error;
}

describe("S10 pacing resolution (D4)", () => {
  it("S10: resolves the provider's published limits as defaults", () => {
    deepStrictEqual(resolvePacing({}), { ...DEFAULT_PACING });
    strictEqual(DEFAULT_PACING.batchSize, 32);
    strictEqual(DEFAULT_PACING.requestsPerMinute, 60);
  });

  it("S10: a config value overrides its default and leaves the rest alone", () => {
    const pacing = resolvePacing({ config: { provider: { pacing: { batchSize: 8, requestsPerMinute: 120 } } } });
    strictEqual(pacing.batchSize, 8);
    strictEqual(pacing.requestsPerMinute, 120);
    strictEqual(pacing.maxAttempts, DEFAULT_PACING.maxAttempts);
  });

  it("S10: an environment override wins over the config, per parameter", () => {
    const pacing = resolvePacing({
      config: { provider: { pacing: { batchSize: 8 } } },
      env: {
        AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BATCH_SIZE: "5",
        AGENTIC_WORKFLOW_DOC_EMBEDDINGS_MAX_ATTEMPTS: "2",
      },
    });
    strictEqual(pacing.batchSize, 5);
    strictEqual(pacing.maxAttempts, 2);
  });

  it("S10: a non-positive or unparseable value is refused by name, never paced as NaN", () => {
    for (const value of ["0", "-1", "abc", ""]) {
      throws(
        () => resolvePacing({ env: { AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BATCH_SIZE: value } }),
        /AGENTIC_WORKFLOW_DOC_EMBEDDINGS_BATCH_SIZE|batchSize/,
        `accepted ${JSON.stringify(value)}`,
      );
    }
    throws(() => resolvePacing({ config: { provider: { pacing: { requestsPerMinute: 1.5 } } } }), /requestsPerMinute/);
  });
});

describe("S3/S9 sync resilience (D5)", () => {
  it("S3: survives a provider that 429s every 20th batch — the run completes, everything is embedded, the pin is written", async () => {
    const dir = resilienceFixture(manyFiles(20));
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const inner = recordingEmbedder("mock-retry");
      const flaky = {
        model: inner.model,
        async embed(texts) {
          inner.state.calls += 1;
          if (inner.state.calls % 20 === 0) throw providerError(429, "429 too many requests");
          inner.state.batches.push([...texts]);
          return texts.map((_, i) => [i + 1, i + 2, i + 3]);
        },
      };
      const result = await embedPendingChunks(dir, flaky, { sleep: clock.sleep, now: clock.now, random: () => 0 });
      strictEqual(result.embedded, 20);
      strictEqual(inner.state.calls, 21, "the 20th request is retried once");
      strictEqual(await storedEmbeddingModel(dir), "mock-retry");
      const { db } = await openDatabase(storePath(dir));
      const pending = db.prepare("select count(*) as n from chunks where embedding is null").get().n;
      db.close();
      strictEqual(pending, 0);
      ok(clock.sleeps.length >= 1, "the retry must back off before it re-sends");

      // AC19 bound unchanged: a warm store makes 0 API calls.
      const warm = recordingEmbedder("mock-retry");
      const again = await embedPendingChunks(dir, warm, { sleep: clock.sleep, now: clock.now, random: () => 0 });
      strictEqual(again.calls, 0);
      strictEqual(warm.state.calls, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S3: one request never carries more texts than batchSize (the provider's 32-text cap)", async () => {
    const sections = Array.from({ length: 40 }, (_, i) => `## Section ${i}\nbody ${i}\n`).join("\n");
    const dir = resilienceFixture({ "big.md": `# Big\nintro\n\n${sections}` });
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const e = recordingEmbedder("mock-cap");
      await embedPendingChunks(dir, e, { sleep: clock.sleep, now: clock.now, random: () => 0, pacing: { batchSize: 32 } });
      ok(e.state.batches.length >= 2, `batches=${e.state.batches.length}`);
      for (const batch of e.state.batches) ok(batch.length <= 32, `batch of ${batch.length}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S3: requests are paced at the configured rate — the recorded waits respect the interval", async () => {
    const dir = resilienceFixture(manyFiles(3));
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const e = recordingEmbedder("mock-pace");
      await embedPendingChunks(dir, e, { sleep: clock.sleep, now: clock.now, random: () => 0, pacing: { requestsPerMinute: 60 } });
      strictEqual(e.state.calls, 3);
      deepStrictEqual(clock.sleeps, [1000, 1000]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S9: a run that stops part-way is resumed — the re-run embeds only the remainder", async () => {
    const dir = resilienceFixture(manyFiles(6));
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      // Batch 3 exhausts its ladder on a retryable 503 — the provider is down, so
      // the pass stops (issue #540 narrowed this to retryable failures only).
      // Batches 1-2 landed and are committed, so the store's own pending
      // predicate is the resume point.
      const failing = {
        model: "mock-resume",
        calls: 0,
        async embed(texts) {
          this.calls += 1;
          if (this.calls === 3) throw providerError(503, "503 service unavailable");
          return texts.map((_, i) => [i + 1, i + 2, i + 3]);
        },
      };
      await rejects(() => embedPendingChunks(dir, failing, { sleep: clock.sleep, now: clock.now, random: () => 0, pacing: { maxAttempts: 1 } }), /503/);
      const { db } = await openDatabase(storePath(dir));
      const landed = db.prepare("select chunk_id, body from chunks where embedding is not null order by chunk_id").all();
      const pending = db.prepare("select chunk_id, body from chunks where embedding is null order by path, rowid").all();
      db.close();
      strictEqual(landed.length, 2, "the two landed batches stay committed");
      strictEqual(pending.length, 4);

      const resumed = recordingEmbedder("mock-resume");
      const result = await embedPendingChunks(dir, resumed, { sleep: clock.sleep, now: clock.now, random: () => 0 });
      strictEqual(resumed.state.calls, pending.length, "one request per remaining chunk, none re-sent");
      strictEqual(result.embedded, pending.length);
      // The already-embedded rows were never part of a re-sent batch.
      const resent = new Set(resumed.state.batches.flat());
      for (const row of landed) strictEqual(resent.has(row.body), false, "an embedded chunk was re-sent");
      for (const row of pending) strictEqual(resent.has(row.body), true, "a pending chunk was skipped");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S3: a partially successful pass pins the model that produced the stored vectors", async () => {
    const dir = resilienceFixture(manyFiles(4));
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const failing = {
        model: "mock-pin",
        calls: 0,
        async embed(texts) {
          this.calls += 1;
          if (this.calls >= 2) throw providerError(500, "500 server error");
          return texts.map((_, i) => [i + 1, i + 2, i + 3]);
        },
      };
      await rejects(() => embedPendingChunks(dir, failing, { sleep: clock.sleep, now: clock.now, random: () => 0, pacing: { maxAttempts: 2 } }));
      strictEqual(await storedEmbeddingModel(dir), "mock-pin", "the first landed batch must pin the store");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S3: a non-retryable provider error is not retried and never aborts the pass (issue #540 S2)", async () => {
    const dir = resilienceFixture(manyFiles(2));
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const bad = {
        model: "mock-bad",
        calls: 0,
        async embed() {
          this.calls += 1;
          throw providerError(401, "401 unauthorized");
        },
      };
      const result = await embedPendingChunks(dir, bad, {
        sleep: clock.sleep,
        now: clock.now,
        random: () => 0,
        // A backoff would spend 7000 ms before a second attempt, so `sleeps`
        // below isolates the pacing interval from a retry.
        pacing: { baseDelayMs: 7000, requestsPerMinute: 60 },
      });
      strictEqual(result.embedded, 0);
      strictEqual(result.rejected.length, 2, "one rejected batch per file");
      strictEqual(bad.calls, 2, "one attempt per batch: a 401 is never retried");
      deepStrictEqual(clock.sleeps, [1000], "only the pacing interval (60 rpm) — no backoff was spent; " + JSON.stringify(clock.sleeps));
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S3: Retry-After is honoured when the provider names it", async () => {
    const dir = resilienceFixture(manyFiles(2));
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const provider = {
        model: "mock-after",
        calls: 0,
        async embed(texts) {
          this.calls += 1;
          if (this.calls === 1) {
            const error = providerError(429, "429 too many requests");
            error.retryAfter = 3;
            throw error;
          }
          return texts.map((_, i) => [i + 1, i + 2, i + 3]);
        },
      };
      await embedPendingChunks(dir, provider, { sleep: clock.sleep, now: clock.now, random: () => 0, pacing: { requestsPerMinute: 60000 } });
      strictEqual(provider.calls, 3); // one 429 + one retry + the second file
      ok(clock.sleeps.includes(3000), `sleeps=${JSON.stringify(clock.sleeps)}`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
