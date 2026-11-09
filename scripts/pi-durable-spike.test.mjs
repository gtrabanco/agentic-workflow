// pi-durable-spike.test.mjs — issue #284 P2, the offline half of the spike.
//
// The substrate (`@earendil-works/pi-durable`) is experimental and is not a
// dependency of this repository, so the suite pins what can hold without it:
// the argv contract, the pure lane planner, the ledger summariser, the
// substrate refusal, and the receipt shape. The recorded lane run against the
// real substrate lives in `docs/research/284-pi-durable-spike.md`; one case
// below replays it when `PI_DURABLE_DIR` points at a scratch install.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const {
  SpikeRefusal,
  parseSpikeArgs,
  planLane,
  summarizeLedger,
  renderReceipt,
  loadPiDurable,
  SPIKE_CONTRACT_ID,
} = await import("./pi-durable-spike.mjs");

test("SP1: the argv contract — stages collect, the kill knobs parse, unknown flags refuse", () => {
  const parsed = parseSpikeArgs(["--dir", "/tmp/x", "--stage", "a", "--stage", "b", "--kill-after", "1", "--kill-during", "b", "--json"]);
  assert.deepEqual(parsed.stages, ["a", "b"]);
  assert.equal(parsed.killAfter, 1);
  assert.equal(parsed.killDuring, "b");
  assert.equal(parsed.json, true);
  assert.throws(() => parseSpikeArgs(["--stage", "a"]), /--dir is required/u);
  assert.throws(() => parseSpikeArgs(["--dir", "/tmp/x"]), /at least one --stage/u);
  assert.throws(() => parseSpikeArgs(["--dir", "/tmp/x", "--stage", "a", "--nope"]), /unknown argument/u);
  assert.throws(() => parseSpikeArgs(["--dir", "/tmp/x", "--stage", "a", "--kill-after", "x"]), /non-negative/u);
  assert.throws(() => parseSpikeArgs(["--dir"]), /needs a value/u);
});

test("SP2: the lane planner is positional and idempotent — a recorded stage is never next again", () => {
  const stages = ["s1", "s2", "s3"];
  assert.deepEqual(planLane(stages, []), { done: 0, next: "s1", complete: false });
  assert.deepEqual(planLane(stages, ["s1"]), { done: 1, next: "s2", complete: false });
  assert.deepEqual(planLane(stages, ["s1", "s2", "s3"]), { done: 3, next: null, complete: true });
  // A duplicate record is not progress: the plan stays where the unique prefix ended.
  assert.deepEqual(planLane(stages, ["s1", "s1"]), { done: 2, next: "s3", complete: false });
});

test("SP3: the ledger summariser counts phase invocations per stage and names re-executions", () => {
  const text = [
    JSON.stringify({ stage: "s1", pid: 1 }),
    JSON.stringify({ stage: "s2", pid: 1 }),
    JSON.stringify({ stage: "s2", pid: 2 }),
    '{"stage": "s3", "pi', // torn by the kill, not an invocation
  ].join("\n");
  const ledger = summarizeLedger(text, ["s1", "s2", "s3"]);
  assert.equal(ledger.phases, 3);
  assert.deepEqual(ledger.per_stage, { s1: 1, s2: 2, s3: 0 });
  assert.deepEqual(ledger.reexecuted, ["s2"]);
  assert.deepEqual(ledger.pids, [1, 2]);
});

test("SP4: an absent substrate is a refusal naming the install line — never a silent fallback", async () => {
  const empty = mkdtempSync(join(tmpdir(), "aw-spike-empty-"));
  try {
    await assert.rejects(
      () => loadPiDurable({ PI_DURABLE_DIR: empty, PATH: process.env.PATH }),
      (error) => {
        assert.ok(error instanceof SpikeRefusal);
        assert.match(error.message, /not resolvable/u);
        assert.match(error.message, /bun add @earendil-works\/pi-durable@/u);
        return true;
      },
    );
  } finally {
    rmSync(empty, { recursive: true, force: true });
  }
});

test("SP5: the receipt is the fixed spike contract, no free-form field", () => {
  const receipt = renderReceipt({
    stages: ["s1", "s2"],
    ledger: summarizeLedger(`${JSON.stringify({ stage: "s1", pid: 7 })}\n`, ["s1", "s2"]),
    store: "/tmp/store",
    substrate: "pi-durable",
  });
  assert.equal(receipt.contract, SPIKE_CONTRACT_ID);
  assert.deepEqual(Object.keys(receipt), ["contract", "substrate", "store", "stages", "phases", "per_stage", "reexecuted", "pids"]);
  assert.equal(receipt.phases, 1);
});

test("SP6: with a scratch substrate installed, a killed lane resumes without re-running a committed stage", async (t) => {
  if (!process.env.PI_DURABLE_DIR) {
    t.skip("PI_DURABLE_DIR is not set — the real lane run is recorded in docs/research/284-pi-durable-spike.md");
    return;
  }
  const { runLane } = await import("./pi-durable-spike.mjs");
  const dir = mkdtempSync(join(tmpdir(), "aw-spike-lane-"));
  try {
    const args = { dir, stages: ["s1", "s2", "s3"], killAfter: null, killDuring: null, json: true };
    const first = await runLane({ ...args, killDuring: "s2" });
    assert.equal(first.resumed, false);
    assert.deepEqual(first.receipt.reexecuted, ["s2"], "the in-flight phase re-runs — at-least-once");
    const second = await runLane(args);
    assert.equal(second.resumed, true);
    assert.deepEqual(second.receipt.per_stage, { s1: 1, s2: 2, s3: 1 }, "committed stages are never re-run");
    assert.deepEqual(second.receipt.reexecuted, ["s2"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
