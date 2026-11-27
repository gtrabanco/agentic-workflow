// test-obligation: protects=packages/agentic-workflow/src/doc/embeddings.mjs,packages/agentic-workflow/src/doc/retrieval.mjs obligations=contract,failure-path,boundary
/**
 * The embed lease (issue #718 S5): one pass owns the store's pending set.
 *
 * Nothing fenced two concurrent `doc --sync` runs before this: each selected the
 * same pending rows and paid the provider twice for byte-identical work. The
 * store now carries an advisory row (owner + heartbeat) taken atomically before
 * the pending set is read; a pass that finds it live embeds nothing and declares
 * `unavailable-embeddings-lease-held`, a pass that finds it stale takes it over,
 * and a pass that ends releases it.
 */

import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

import { embedPendingChunks } from "../src/doc/embeddings.mjs";
import { syncIndex } from "../src/doc/sync.mjs";
import { openDatabase } from "../src/doc/sqlite.mjs";
import { storePath } from "../src/doc/store.mjs";
import { runDocOp } from "../src/doc/retrieval.mjs";

const GIT = ["-c", "user.name=t", "-c", "user.email=t@example.test", "-c", "commit.gpgsign=false"];

/** A throwaway git repo with `count` one-chunk markdown files. */
function fixture(count) {
  const dir = mkdtempSync(join(tmpdir(), "doc-718-lease-"));
  execFileSync("git", [...GIT, "init", "-q"], { cwd: dir });
  for (let i = 0; i < count; i += 1) {
    writeFileSync(join(dir, `f${String(i).padStart(2, "0")}.md`), `# File ${i}\nbody ${i}\n`);
  }
  execFileSync("git", [...GIT, "add", "-A"], { cwd: dir });
  execFileSync("git", [...GIT, "commit", "-qm", "fixture"], { cwd: dir });
  return dir;
}

/** A provider that records every batch, optionally gated before answering. */
function recorder(model = "mock-1", onCall = null) {
  const state = { calls: 0, batches: [] };
  return {
    model,
    state,
    async embed(texts) {
      state.calls += 1;
      state.batches.push([...texts]);
      if (onCall) await onCall(state.calls);
      return texts.map((_, i) => [i + 1, 0, 0]);
    },
  };
}

/** A clock that never waits: pacing and backoff advance virtual time. */
function virtualClock() {
  let now = 1_000_000;
  return {
    now: () => now,
    sleep: async (ms) => {
      now += ms;
    },
  };
}

/** The lease row a dead or concurrent pass left behind. */
async function writeLease(dir, owner, heartbeat) {
  const { db } = await openDatabase(storePath(dir));
  try {
    db.exec(
      "create table if not exists doc_lease (name text primary key, owner text not null, heartbeat integer not null)",
    );
    db.prepare("insert or replace into doc_lease (name, owner, heartbeat) values ('embed', ?, ?)").run(owner, heartbeat);
  } finally {
    db.close();
  }
}

const PACED = { requestsPerMinute: 60000 };

describe("the embed lease (issue #718 S5)", () => {
  it("S5: two interleaved passes make one pass' worth of provider calls", async () => {
    const dir = fixture(4);
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      let started;
      const firstCall = new Promise((resolve) => {
        started = resolve;
      });
      const winner = recorder("mock-1", async () => {
        started();
        await gate;
      });
      const pass = embedPendingChunks(dir, winner, { ...clock, pacing: PACED, random: () => 0 });
      await firstCall;

      const fenced = recorder("mock-1");
      const loser = await embedPendingChunks(dir, fenced, { ...clock, pacing: PACED, random: () => 0 });
      strictEqual(loser.leaseHeld, true, "the second pass is fenced");
      strictEqual(loser.embedded, 0);
      strictEqual(fenced.state.calls, 0, "the fenced pass spent nothing against the provider");

      release();
      const result = await pass;
      strictEqual(result.embedded, 4, "the owner embeds every chunk");
      strictEqual(winner.state.calls, 4, "one request per file, once");

      const { db } = await openDatabase(storePath(dir));
      const pending = db.prepare("select count(*) as n from chunks where embedding is null").get().n;
      db.close();
      strictEqual(pending, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S5: a completed pass releases the lease, so the next pass embeds what is left", async () => {
    const dir = fixture(2);
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const first = recorder("mock-1");
      const done = await embedPendingChunks(dir, first, { ...clock, pacing: PACED, random: () => 0 });
      strictEqual(done.embedded, 2);

      const second = recorder("mock-1");
      const again = await embedPendingChunks(dir, second, { ...clock, pacing: PACED, random: () => 0 });
      strictEqual(again.leaseHeld, undefined, "a finished pass leaves no lease behind");
      strictEqual(again.embedded, 0, "a warm store has nothing to embed");
      strictEqual(second.state.calls, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S5: a pass releases its lease even when the provider throws", async () => {
    const dir = fixture(2);
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      const dead = {
        model: "mock-1",
        async embed() {
          throw new Error("ECONNREFUSED");
        },
      };
      await embedPendingChunks(dir, dead, { ...clock, pacing: { ...PACED, maxAttempts: 1 }, random: () => 0 }).then(
        () => {
          throw new Error("the pass should have rejected");
        },
        () => undefined,
      );

      const recovered = recorder("mock-1");
      const result = await embedPendingChunks(dir, recovered, { ...clock, pacing: PACED, random: () => 0 });
      strictEqual(result.leaseHeld, undefined, "a failed pass does not fence the store");
      strictEqual(result.embedded, 2);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S5: a lease whose heartbeat is older than the TTL is taken over", async () => {
    const dir = fixture(2);
    try {
      await syncIndex(dir);
      await writeLease(dir, "dead-pass", 0);
      const clock = virtualClock();
      const fresh = recorder("mock-1");
      const result = await embedPendingChunks(dir, fresh, { ...clock, pacing: PACED, random: () => 0 });
      strictEqual(result.embedded, 2, "a crashed pass never fences the store forever");
      strictEqual(fresh.state.calls, 2);

      const { db } = await openDatabase(storePath(dir));
      const row = db.prepare("select owner from doc_lease where name = 'embed'").get() ?? null;
      db.close();
      strictEqual(row, null, "the takeover's own lease is released at the end");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S5: a live lease declares unavailable-embeddings-lease-held in the sync envelope", async () => {
    const dir = fixture(2);
    try {
      await syncIndex(dir);
      await writeLease(dir, "other-terminal", Date.now());
      const env = await runDocOp({ op: "sync" }, { rootDir: dir, embedder: recorder("mock-1") });
      deepStrictEqual(env.degradations, ["unavailable-embeddings-lease-held"]);
      strictEqual(env.store.lastSync.embedded, 0, "the fenced run embeds nothing");
      ok(env.store.pending > 0, "and still reports the remainder");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
