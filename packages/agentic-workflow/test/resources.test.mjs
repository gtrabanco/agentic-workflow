/**
 * resources.test.mjs — issue #260 AC3/AC4: the deterministic resource layer
 * (`agentic-workflow resources detect|admit`).
 *
 * Self-detecting host envelope with conservative defaults (owner decision 6,
 * 2026-10-28) and progress-led admission (2026-10-27 refinement): every spawn
 * is a bounded, observable trial — expectations declared, requirements checked
 * against the envelope and the operator's explicit caps, refuse-over-spawn-into
 * a dying host, and a bound-kill receipt blocks an identical re-run (anti-retry)
 * unless the task spec changes. Written red-first: the module did not exist
 * when this landed.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { detectHost, RESOURCES_DETECT_CONTRACT_ID } from "../src/resources/detect.mjs";
import { admitTrial, ADMIT_CONTRACT_ID } from "../src/resources/admit.mjs";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));

const GB = 1024 ** 3;

// Injected readings — the tests never depend on the host they run on.
const bigHost = {
  memTotalBytes: 64 * GB,
  memAvailableBytes: 48 * GB,
  cgroupLimitBytes: null,
  cgroupCurrentBytes: 0,
  cores: 32,
};
const smallVps = {
  memTotalBytes: 4 * GB,
  memAvailableBytes: 1.5 * GB,
  cgroupLimitBytes: null,
  cgroupCurrentBytes: 0,
  cores: 2,
};

test("detect derives an envelope with conservative defaults from injected readings", () => {
  const envelope = detectHost({ readings: bigHost });
  assert.equal(envelope.contract, RESOURCES_DETECT_CONTRACT_ID);
  assert.equal(envelope.memory.totalBytes, 64 * GB);
  assert.equal(envelope.memory.availableBytes, 48 * GB);
  assert.equal(envelope.memory.effectiveLimitBytes, 64 * GB);
  assert.equal(envelope.cores, 32);
  assert.equal(envelope.derived.parallelism, "max");
  // serial on the small host: ≤4 GB or ≤2 cores
  const small = detectHost({ readings: smallVps });
  assert.equal(small.derived.parallelism, "serial");
  assert.equal(small.memory.effectiveLimitBytes, 4 * GB);
});

test("detect is byte-stable for the same readings", () => {
  assert.equal(
    JSON.stringify(detectHost({ readings: bigHost })),
    JSON.stringify(detectHost({ readings: bigHost })),
  );
});

test("detect honors a cgroup limit tighter than the host memory", () => {
  const envelope = detectHost({
    readings: { ...bigHost, cgroupLimitBytes: 7 * GB, cgroupCurrentBytes: 2 * GB },
  });
  assert.equal(envelope.memory.effectiveLimitBytes, 7 * GB);
  assert.equal(envelope.memory.cgroupLimitBytes, 7 * GB);
  // the derived parallelism reads the effective limit, not the raw host
  assert.equal(envelope.derived.parallelism, 2);
});

test("detect applies the operator's explicit caps (decision 6)", () => {
  const envelope = detectHost({
    readings: bigHost,
    caps: { parallelism: "auto", memoryCap: "12 of 64 GB", threadCap: "2 of 80 threads" },
  });
  assert.equal(envelope.memory.effectiveLimitBytes, 12 * GB);
  assert.equal(envelope.threads, 2);
  assert.equal(envelope.caps.memoryCap, "12 of 64 GB");
  assert.equal(envelope.caps.threadCap, "2 of 80 threads");
  assert.equal(envelope.derived.parallelism, 2);
});

test("detect: explicit serial wins; an unknown cap string is a refusal", () => {
  assert.equal(detectHost({ readings: bigHost, caps: { parallelism: "serial" } }).derived.parallelism, "serial");
  assert.throws(() => detectHost({ readings: bigHost, caps: { memoryCap: "12 GB" } }), /memoryCap/u);
  assert.throws(() => detectHost({ readings: bigHost, caps: { parallelism: 0 } }), /parallelism/u);
});

const EXPECT = {
  expected_duration: "about 5 minutes",
  requirements: { memory: "2 GB", threads: 1 },
};

test("admit refuses a spawn with no declared expectations (the 2026-10-27 blindness)", () => {
  const envelope = detectHost({ readings: bigHost });
  const refusal = admitTrial({ task: "t1", expect: {}, envelope });
  assert.equal(refusal.verdict, "refuse");
  assert.match(refusal.reason, /expected_duration/u);
  const noReqs = admitTrial({ task: "t1", expect: { expected_duration: "5 min" }, envelope });
  assert.equal(noReqs.verdict, "refuse");
  assert.match(noReqs.reason, /requirements/u);
});

test("admit refuses a requirement over the declared cap or the envelope", () => {
  const envelope = detectHost({ readings: bigHost, caps: { memoryCap: "12 of 64 GB" } });
  const refusal = admitTrial({
    task: "t2",
    expect: { expected_duration: "5 min", requirements: { memory: "16 GB", threads: 1 } },
    envelope,
  });
  assert.equal(refusal.verdict, "refuse");
  assert.match(refusal.reason, /16 GB/u);
  assert.ok(refusal.receipt.requirementBytes > refusal.receipt.capBytes, JSON.stringify(refusal.receipt));

  const threads = admitTrial({
    task: "t3",
    expect: { expected_duration: "5 min", requirements: { memory: "1 GB", threads: 8 } },
    envelope: detectHost({ readings: smallVps }),
  });
  assert.equal(threads.verdict, "refuse");
});

test("admit allows a bounded trial that fits, with a receipt", () => {
  const envelope = detectHost({ readings: bigHost, caps: { memoryCap: "12 of 64 GB", threadCap: "2 of 80 threads" } });
  const allow = admitTrial({ task: "t4", expect: EXPECT, envelope });
  assert.equal(allow.verdict, "allow");
  assert.equal(allow.contract, ADMIT_CONTRACT_ID);
  assert.ok(allow.receipt.task === "t4" && allow.receipt.digest.length === 64);
});

test("admit's anti-retry: an identical re-run after a bound-kill is blocked; a changed spec is not", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-admit-"));
  const envelope = detectHost({ readings: bigHost });
  try {
    // Simulate a recorded bound-kill receipt (the runtime's MemoryMax discovery).
    const first = admitTrial({ task: "t5", expect: EXPECT, envelope, recordDir: dir });
    assert.equal(first.verdict, "allow");
    const receiptsDir = join(dir, "receipts");
    assert.ok(existsSync(receiptsDir), "the trial receipt is recorded");
    const receiptPath = join(receiptsDir, `${first.receipt.digest.slice(0, 16)}.json`);
    const recorded = JSON.parse(readFileSync(receiptPath, "utf8"));
    assert.equal(recorded.verdict, "allow");

    // The runtime turns the receipt into a bound-kill outcome (MemoryMax hit).
    recorded.verdict = "bound-kill";
    recorded.peak = "7 GB";
    writeFileSync(receiptPath, JSON.stringify(recorded, null, 2));

    const retry = admitTrial({ task: "t5", expect: EXPECT, envelope, recordDir: dir });
    assert.equal(retry.verdict, "refuse");
    assert.match(retry.reason, /bound-kill/u);
    assert.equal(retry.receipt.priorTask, "t5");

    // A changed spec (split the task) is a new decision, not a retry.
    const changed = admitTrial({
      task: "t5",
      expect: { ...EXPECT, requirements: { memory: "1 GB", threads: 1 } },
      envelope,
      recordDir: dir,
    });
    assert.equal(changed.verdict, "allow");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("admit without a record dir never persists and never blocks", () => {
  const envelope = detectHost({ readings: bigHost });
  const a = admitTrial({ task: "t6", expect: EXPECT, envelope });
  const b = admitTrial({ task: "t6", expect: EXPECT, envelope });
  assert.equal(a.verdict, "allow");
  assert.equal(b.verdict, "allow");
  assert.equal(a.receipt.digest, b.receipt.digest);
});

// ── CLI ──────────────────────────────────────────────────────────────────

test("CLI: resources detect prints the envelope and is structurally stable", () => {
  const a = spawnSync("bun", [BIN, "resources", "detect", "--json"], { encoding: "utf8" });
  assert.equal(a.status, 0, a.stdout + a.stderr);
  const envelope = JSON.parse(a.stdout);
  assert.equal(envelope.contract, RESOURCES_DETECT_CONTRACT_ID);
  assert.ok(envelope.memory.totalBytes > 0);
  // Byte-stability holds for the same readings (asserted on injected readings);
  // live MemAvailable moves between runs by nature, so the CLI assertion is
  // structural: the shape, keys and derived rule are identical.
  const b = spawnSync("bun", [BIN, "resources", "detect", "--json"], { encoding: "utf8" });
  const second = JSON.parse(b.stdout);
  assert.deepEqual(Object.keys(second), Object.keys(envelope));
  assert.deepEqual(Object.keys(second.memory), Object.keys(envelope.memory));
  assert.equal(second.derived.parallelism, envelope.derived.parallelism);
});

test("CLI: resources admit refuses without expectations and allows a fitting trial", () => {
  const refusal = spawnSync(
    "bun",
    [BIN, "resources", "admit", "--task", "cli-1", "--expect", "{}"],
    { encoding: "utf8" },
  );
  assert.equal(refusal.status, 2);
  assert.match(refusal.stderr, /RESOURCES REFUSAL —/u);
  assert.match(refusal.stderr, /expected_duration/u);

  const dir = mkdtempSync(join(tmpdir(), "aw-admit-cli-"));
  try {
    const allow = spawnSync(
      "bun",
      [
        BIN,
        "resources",
        "admit",
        "--task",
        "cli-1",
        "--expect",
        JSON.stringify(EXPECT),
        "--record-dir",
        dir,
      ],
      { encoding: "utf8" },
    );
    assert.equal(allow.status, 0, allow.stdout + allow.stderr);
    assert.match(allow.stdout, /"verdict": "allow"/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("CLI: resources detect refuses an unknown subcommand or flag", () => {
  const bad = spawnSync("bun", [BIN, "resources", "explode"], { encoding: "utf8" });
  assert.equal(bad.status, 2);
  assert.match(bad.stderr, /RESOURCES REFUSAL —/u);
});
