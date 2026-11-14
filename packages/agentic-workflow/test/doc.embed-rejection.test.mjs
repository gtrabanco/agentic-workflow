/**
 * Rejection containment in the embeddings write path (fix #540, P3/P5).
 *
 * The frozen-failure corpus from issue #540: a non-retryable provider `400`
 * (`Context length exceeded …`) used to end the *whole* embed pass, so every
 * `--sync` re-aborted at the same pending chunk and the backfill could never
 * complete. The rules asserted here:
 *
 *   S2  — a non-retryable non-rate-limit failure ends its batch, never the pass;
 *   S2a — the skipped chunks are named by path/section and an oversized chunk is
 *         dropped alone, never dragging well-sized chunks with it;
 *   S4  — the provider's own status and body excerpt reach the caller;
 *   S5  — one request never carries more characters than the request budget.
 *
 * Everything is driven through the existing seams (`opts.pacing`,
 * `opts.maxRequestChars`, `sleep`, `now`, `random`) so no test reaches the
 * network and no test reads the live repository.
 */

import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok, rejects } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { embedPendingChunks, makeOpenAIProvider } from "../src/doc/embeddings.mjs";
import { syncIndex } from "../src/doc/sync.mjs";
import { storePath } from "../src/doc/store.mjs";
import { openDatabase } from "../src/doc/sqlite.mjs";

const GIT_ID = ["-c", "user.name=t", "-c", "user.email=t@example.test", "-c", "commit.gpgsign=false"];

/** A throwaway git repo carrying `files` (path → markdown). */
function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), "doc-reject-"));
  execFileSync("git", [...GIT_ID, "init", "-q"], { cwd: dir });
  for (const [rel, body] of Object.entries(files)) writeFileSync(join(dir, rel), body);
  execFileSync("git", [...GIT_ID, "add", "-A"], { cwd: dir });
  execFileSync("git", [...GIT_ID, "commit", "-qm", "fixture"], { cwd: dir });
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
  return { now: () => t, sleep: async (ms) => { t += ms; } };
}

/** A provider error carrying the machine-readable status the policy branches on. */
function providerError(status, message) {
  const error = new Error(message ?? `embeddings provider ${status}`);
  error.status = status;
  return error;
}

/** A provider that records every batch and refuses the ones `refuse` selects. */
function recordingProvider({ model = "mock-1", refuse = () => null } = {}) {
  const state = { calls: 0, batches: [] };
  return {
    model,
    state,
    async embed(texts) {
      state.calls += 1;
      state.batches.push([...texts]);
      const refusal = refuse(texts, state.calls);
      if (refusal !== null) throw refusal;
      return texts.map((_, i) => [i + 1, i + 2, i + 3]);
    },
  };
}

function embedOptions(clock, extra = {}) {
  return { sleep: clock.sleep, now: clock.now, random: () => 0, ...extra };
}

async function pendingBodies(dir) {
  const { db } = await openDatabase(storePath(dir));
  const rows = db.prepare("select path, section, body from chunks where embedding is null order by path, rowid").all();
  db.close();
  return rows.map((r) => ({ path: r.path, section: r.section }));
}

// ── S2 — a non-retryable 4xx ends the batch, never the pass ──────────────

describe("S2 rejection containment", () => {
  it("S2: a 400 on the second batch skips it and the pass completes with the survivors", async () => {
    const dir = fixture(manyFiles(4));
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      // The third file's batch is refused — a deterministic input rejection.
      const provider = recordingProvider({
        refuse: (texts) => (texts[0].includes("File 2") ? providerError(400, "400 Bad Request: Context length exceeded") : null),
      });
      const result = await embedPendingChunks(dir, provider, embedOptions(clock));
      strictEqual(result.embedded, 3, "the three well-sized batches land");
      strictEqual(result.calls, 4, "the refused batch is not retried");
      deepStrictEqual(await pendingBodies(dir), [{ path: "f002.md", section: "File 2" }]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S2a: the rejected chunks are named by path and section", async () => {
    const dir = fixture({
      "a.md": "# Alpha\nalpha body\n",
      "b.md": "# Beta\nbeta body\n",
    });
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const provider = recordingProvider({
        refuse: (texts) => (texts[0].includes("Beta") ? providerError(400, "400 Bad Request: input too large") : null),
      });
      const result = await embedPendingChunks(dir, provider, embedOptions(clock));
      strictEqual(result.rejected.length, 1);
      strictEqual(result.rejected[0].status, 400);
      deepStrictEqual(result.rejected[0].chunks, [{ path: "b.md", section: "Beta" }]);
      ok(/input too large/.test(result.rejected[0].message), result.rejected[0].message);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S2: a rejection on every batch still completes the pass, leaving the store pending and unchanged", async () => {
    const dir = fixture(manyFiles(3));
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const provider = recordingProvider({ refuse: () => providerError(401, "401 Unauthorized") });
      const result = await embedPendingChunks(dir, provider, embedOptions(clock));
      strictEqual(result.embedded, 0);
      strictEqual(result.rejected.length, 3, "one entry per rejected batch");
      strictEqual((await pendingBodies(dir)).length, 3, "nothing was written");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S2: a retryable failure whose ladder is exhausted still aborts the pass (the provider is really down)", async () => {
    const dir = fixture(manyFiles(2));
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const provider = recordingProvider({ refuse: () => providerError(503, "503 Service Unavailable") });
      await rejects(
        () => embedPendingChunks(dir, provider, embedOptions(clock, { pacing: { maxAttempts: 2, requestsPerMinute: 60000 } })),
        /503/,
      );
      strictEqual(provider.state.calls, 2, "one 503 + one retry, then the pass stops");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S2: a network error with no status still aborts the pass", async () => {
    const dir = fixture(manyFiles(1));
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const provider = recordingProvider({ refuse: () => new Error("ECONNREFUSED") });
      await rejects(() => embedPendingChunks(dir, provider, embedOptions(clock)), /ECONNREFUSED/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ── S5 — the request budget ──────────────────────────────────────────────

describe("S5 request budget", () => {
  it("S5: no request carries more characters than the budget", async () => {
    const dir = fixture(manyFiles(6));
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const provider = recordingProvider();
      const budget = 40; // each fixture body is ~24 chars, so at most one fits with the next
      await embedPendingChunks(dir, provider, embedOptions(clock, { maxRequestChars: budget }));
      ok(provider.state.batches.length >= 3, `batches=${provider.state.batches.length}`);
      for (const batch of provider.state.batches) {
        const chars = batch.reduce((n, text) => n + text.length, 0);
        ok(chars <= budget, `a request carried ${chars} chars over a ${budget}-char budget`);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S5: a chunk larger than the budget is sent alone and dropped alone", async () => {
    const dir = fixture({
      "small.md": "# Small\nshort body\n",
      "big.md": `# Big\n${"x".repeat(400)}\n`,
    });
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const budget = 200;
      const provider = recordingProvider({
        refuse: (texts) => (texts.reduce((n, t) => n + t.length, 0) > budget ? providerError(400, "400 Bad Request") : null),
      });
      const result = await embedPendingChunks(dir, provider, embedOptions(clock, { maxRequestChars: budget }));
      strictEqual(result.embedded, 1, "the well-sized chunk embeds");
      strictEqual(result.rejected.length, 1);
      deepStrictEqual(result.rejected[0].chunks, [{ path: "big.md", section: "Big" }], "the oversized chunk is dropped alone");
      const bigRequest = provider.state.batches.find((b) => b.some((t) => t.includes("x".repeat(50))));
      strictEqual(bigRequest.length, 1, "the oversized chunk never shares its request");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ── S4 — the provider's own status and body reach the caller ─────────────

/** The rejection's error object — `assert.rejects` resolves to `undefined`. */
async function catchError(fn) {
  try {
    await fn();
  } catch (error) {
    return error;
  }
  throw new Error("expected the call to reject; it resolved");
}

/** A fetch double returning one fixed response, so no network is reached. */
function fakeFetch(response) {
  const calls = [];
  return {
    calls,
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return response;
    },
  };
}

describe("S4 provider diagnostics", () => {
  it("S4: the thrown error carries the response body excerpt and the status", async () => {
    const body =
      '{"error":{"message":"Context length exceeded for model \'qwen3-embedding\': maximum context length is 32768 tokens"}}';
    const { fetchImpl } = fakeFetch({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      headers: { get: () => null },
      text: async () => body,
    });
    const provider = makeOpenAIProvider({ baseUrl: "http://provider.test/v1", apiKey: "k", model: "m", fetchImpl });
    const error = await catchError(() => provider.embed(["a".repeat(10)]));
    strictEqual(error.status, 400);
    ok(/Context length exceeded/.test(error.message), error.message);
    ok(/32768 tokens/.test(error.message), "the budget the provider named must survive");
  });

  it("S4: a response whose body cannot be read still names the status", async () => {
    const { fetchImpl } = fakeFetch({
      ok: false,
      status: 403,
      statusText: "Forbidden",
      headers: { get: () => null },
      text: async () => {
        throw new Error("body already consumed");
      },
    });
    const provider = makeOpenAIProvider({ baseUrl: "http://provider.test/v1", apiKey: "k", model: "m", fetchImpl });
    const error = await catchError(() => provider.embed(["x"]));
    strictEqual(error.status, 403);
    ok(/403/.test(error.message), error.message);
  });

  it("S4: a successful call is untouched by the diagnostic path", async () => {
    const { fetchImpl, calls } = fakeFetch({
      ok: true,
      status: 200,
      statusText: "OK",
      headers: { get: () => null },
      json: async () => ({ data: [{ embedding: [1, 2, 3] }] }),
    });
    const provider = makeOpenAIProvider({ baseUrl: "http://provider.test/v1", apiKey: "k", model: "m", fetchImpl });
    deepStrictEqual(await provider.embed(["x"]), [[1, 2, 3]]);
    strictEqual(calls.length, 1);
    strictEqual(calls[0].url, "http://provider.test/v1/embeddings");
  });
});
