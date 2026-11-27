// test-obligation: protects=packages/agentic-workflow/src/doc/embeddings.mjs,packages/agentic-workflow/src/doc/retrieval.mjs,packages/agentic-workflow/src/doc/sync.mjs obligations=contract,failure-path,boundary
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

  // external-verify 2026-11-27, A4/A5: the fence sat at the embed stage, so a
  // fenced pass had already scanned — on a fresh store both launches scanned
  // (one died `database is locked`, or its late re-chunk wiped the winner's
  // rows with nothing left to repair them). The pass owns the store from
  // before the scan (O12).
  it("S5: a live lease fences the scan — a fenced sync performs no scan write", async () => {
    const dir = fixture(2);
    try {
      await writeLease(dir, "other-terminal", Date.now());
      const env = await runDocOp({ op: "sync" }, { rootDir: dir, embedder: recorder("mock-1") });
      deepStrictEqual(env.degradations, ["unavailable-embeddings-lease-held"]);
      strictEqual(env.store.lastSync.files_scanned, 0, "the fenced run never scans");
      strictEqual(env.store.lastSync.files_changed, 0, "the fenced run never chunks");
      strictEqual(env.store.lastSync.embedded, 0, "the fenced run embeds nothing");
      strictEqual(env.store.files, 0, "the corpus never entered the store");
      const { db } = await openDatabase(storePath(dir));
      const chunksTable = db
        .prepare("select count(*) as n from sqlite_master where type='table' and name='chunks'")
        .get().n;
      db.close();
      strictEqual(chunksTable, 0, "the fenced run wrote no scan schema");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S5: a fenced keyword-only sync declares the lease, not a second truth", async () => {
    const dir = fixture(2);
    try {
      await writeLease(dir, "other-terminal", Date.now());
      const env = await runDocOp({ op: "sync" }, { rootDir: dir });
      deepStrictEqual(env.degradations, ["unavailable-embeddings-lease-held"]);
      strictEqual(env.store.lastSync.files_scanned, 0, "the fenced keyword sync never scans");
      strictEqual(env.store.lastSync.embedded, 0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("S5: a sync starting during a live pass returns fenced without scanning, and the winner releases", async () => {
    const dir = fixture(3);
    try {
      await syncIndex(dir);
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      let started;
      const startedP = new Promise((resolve) => {
        started = resolve;
      });
      const gated = {
        model: "mock-1",
        async embed(texts) {
          started();
          await gate;
          return texts.map((_, i) => [i + 1, 0, 0]);
        },
      };
      const winnerP = runDocOp({ op: "sync" }, { rootDir: dir, embedder: gated });
      await startedP;

      const loser = await runDocOp({ op: "sync" }, { rootDir: dir, embedder: recorder("mock-1") });
      deepStrictEqual(loser.degradations, ["unavailable-embeddings-lease-held"]);
      strictEqual(loser.store.lastSync.files_scanned, 0, "the loser does not re-scan the store the pass owns");

      release();
      const winner = await winnerP;
      deepStrictEqual(winner.degradations, []);
      strictEqual(winner.store.pending, 0, "the owner embeds every chunk");

      const { db } = await openDatabase(storePath(dir));
      const row = db.prepare("select owner from doc_lease where name = 'embed'").get() ?? null;
      db.close();
      strictEqual(row, null, "the winning run releases its lease");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  // review-change cycle 1 (F1, V1's reproducer): a live pass that loses its row
  // to a takeover used to keep embedding with no signal — the owner-scoped
  // heartbeat matched 0 rows and nobody read `changes` — so two passes paid the
  // provider for the same chunks. The pass now stops spending and declares the
  // cause, and the scan stage is fenced the same way.
  it("F1: a pass that loses its lease mid-flight stops embedding and declares the cause", async () => {
    const dir = fixture(4);
    try {
      await syncIndex(dir);
      const clock = virtualClock();
      let release;
      const gate = new Promise((resolve) => {
        release = resolve;
      });
      let started;
      const startedP = new Promise((resolve) => {
        started = resolve;
      });
      const loser = recorder("mock-1", async () => {
        started();
        await gate;
      });
      const pass = embedPendingChunks(dir, loser, { ...clock, pacing: PACED, random: () => 0 });
      await startedP;

      // A second pass takes the row over while the first one is in flight.
      const { db } = await openDatabase(storePath(dir));
      const taken = db
        .prepare("update doc_lease set owner = 'them', heartbeat = ? where name = 'embed'")
        .run(Date.now());
      db.close();
      strictEqual(taken.changes, 1, "the takeover landed on a live row");

      release();
      const result = await pass;
      strictEqual(result.leaseHeld, true, "the loser learns it no longer owns the store");
      strictEqual(loser.state.calls, 1, "no further request is spent after the lease is lost");

      const { db: left } = await openDatabase(storePath(dir));
      const pending = left.prepare("select count(*) as n from chunks where embedding is null").get().n;
      left.close();
      ok(pending > 0, "the chunks it never sent stay pending instead of silently matching the owner's work");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("F1: a scan that no longer owns the lease aborts instead of writing beside the owner", async () => {
    const dir = fixture(2);
    try {
      // A lease the caller believes it holds, whose row belongs to another pass.
      await writeLease(dir, "them", Date.now());
      const scanned = await syncIndex(dir, { leaseOwner: "a-forgotten-owner" }).then(
        () => {
          throw new Error("the scan should not have finished under a lease it does not own");
        },
        (error) => error,
      );
      strictEqual(scanned.name, "LeaseLostError", "the scan reports the lost lease by name");

      const { db } = await openDatabase(storePath(dir));
      const rows = db.prepare("select count(*) as n from chunks").get().n;
      db.close();
      strictEqual(rows, 0, "the aborted scan wrote nothing");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
