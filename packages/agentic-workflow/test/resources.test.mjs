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
import { mkdtempSync, writeFileSync, rmSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { detectHost, ResourcesError, RESOURCES_DETECT_CONTRACT_ID } from "../src/resources/detect.mjs";
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

// The CLI's kebab-case flags must reach the library as the camelCase keys the
// code reads — a flag the parser stores under the wrong key silently drops the
// operator's cap (caught live: `--memory-cap "1 of 64 GB"` derived "max").
test("CLI: the kebab-case cap flags reach the envelope", () => {
  const run = spawnSync(
    "bun",
    [BIN, "resources", "detect", "--json", "--memory-cap", "1 of 64 GB"],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stdout + run.stderr);
  const envelope = JSON.parse(run.stdout);
  assert.equal(envelope.memory.effectiveLimitBytes, 1024 ** 3, "the cap bounds the effective limit");
  assert.equal(envelope.derived.parallelism, "serial", "a forced-low envelope derives serial");
  assert.equal(envelope.caps.memoryCap, "1 of 64 GB");
});

test("CLI: --record-dir records the trial receipt (the anti-retry store)", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-admit-cli-rec-"));
  try {
    const run = spawnSync(
      "bun",
      [BIN, "resources", "admit", "--task", "rec-1", "--expect", JSON.stringify(EXPECT), "--record-dir", dir],
      { encoding: "utf8" },
    );
    assert.equal(run.status, 0, run.stdout + run.stderr);
    assert.ok(existsSync(join(dir, "receipts")), "the receipt lands under <record-dir>/receipts");
    assert.equal(readdirSync(join(dir, "receipts")).length, 1, "exactly one receipt file");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// ── S11 edge 2 — the runtime observation half (check-in with data, never a
//    silent kill; the S6 layer-A systemd trial envelope) ────────────────────

import { checkTrial, boundLine, parseDuration, CheckError } from "../src/resources/check.mjs";

test("admit accepts a machine expected_seconds and stamps recordedAt", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-check-"));
  try {
    const expect2 = { ...EXPECT, expected_seconds: 300 };
    const run = admitTrial({ task: "t7", expect: expect2, envelope: detectHost({ readings: bigHost }), recordDir: dir });
    assert.equal(run.verdict, "allow");
    const recorded = JSON.parse(readFileSync(join(dir, "receipts", `${run.receipt.digest.slice(0, 16)}.json`), "utf8"));
    assert.ok(Number.isFinite(Date.parse(recorded.recordedAt)), "recordedAt is an ISO stamp");
    assert.equal(recorded.expect.expected_seconds, 300);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("admit rejects a non-numeric expected_seconds", () => {
  assert.throws(
    () => admitTrial({ task: "t8", expect: { ...EXPECT, expected_seconds: "soon" }, envelope: detectHost({ readings: bigHost }) }),
    /expected_seconds/u,
  );
});

test("checkTrial refuses an unknown trial (exit-2 class)", () => {
  assert.throws(() => checkTrial({ task: "never-recorded", recordDir: mkdtempSync(join(tmpdir(), "aw-check-x-")) }), CheckError);
});

test("checkTrial: within the estimate reports moving, with the recorded prose expectation", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-check-"));
  try {
    admitTrial({ task: "t9", expect: { ...EXPECT, expected_seconds: 3600 }, envelope: detectHost({ readings: bigHost }), recordDir: dir });
    const r = checkTrial({ task: "t9", recordDir: dir, elapsedSeconds: 300 });
    assert.equal(r.verdict, "within-estimate");
    assert.match(r.message, /t9/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkTrial: over the estimate carries the check-in message with data (never a kill)", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-check-"));
  try {
    admitTrial({ task: "t10", expect: { expected_duration: "about 5 minutes", expected_seconds: 300, requirements: EXPECT.requirements }, envelope: detectHost({ readings: bigHost }), recordDir: dir });
    const r = checkTrial({ task: "t10", recordDir: dir, elapsedSeconds: 2820 });
    assert.equal(r.verdict, "over-estimate");
    assert.match(r.message, /t10/u);
    assert.match(r.message, /about 5 minutes/u);
    assert.match(r.message, /47m|2820s/u);
    assert.match(r.message, /wait explicitly|investigate|stop/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkTrial: a receipt without expected_seconds is unmeasurable, naming the field", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-check-"));
  try {
    admitTrial({ task: "t11", expect: EXPECT, envelope: detectHost({ readings: bigHost }), recordDir: dir });
    const r = checkTrial({ task: "t11", recordDir: dir, elapsedSeconds: 60 });
    assert.equal(r.verdict, "unmeasurable");
    assert.match(r.message, /expected_seconds/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkTrial: a bound-killed receipt reports the re-decide receipt, never a silent retry", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-check-"));
  try {
    admitTrial({ task: "t12", expect: { ...EXPECT, expected_seconds: 300 }, envelope: detectHost({ readings: bigHost }), recordDir: dir });
    const p = join(dir, "receipts");
    for (const name of readdirSync(p)) {
      const rec = JSON.parse(readFileSync(join(p, name), "utf8"));
      rec.verdict = "bound-kill";
      rec.peak = "7 GB";
      writeFileSync(join(p, name), JSON.stringify(rec, null, 2));
    }
    const r = checkTrial({ task: "t12", recordDir: dir, elapsedSeconds: 10 });
    assert.equal(r.verdict, "bound-killed");
    assert.match(r.message, /bound-kill|re-decide/u);
    assert.match(r.message, /7 GB/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("checkTrial: the pid reading is reported — advancing or stalled against the previous reading", () => {
  const within = checkTrial({
    task: "t",
    recordDir: mkdtempSync(join(tmpdir(), "aw-check-x-")),
    allowUnknownForPid: true,
    elapsedSeconds: 1,
    pid: { state: "R", cpuSeconds: 12.4, prevCpuSeconds: 10.0 },
  });
  assert.match(within.message, /advancing/u);
  const stalled = checkTrial({
    task: "t",
    recordDir: within.recordDir,
    allowUnknownForPid: true,
    elapsedSeconds: 1,
    pid: { state: "S", cpuSeconds: 12.4, prevCpuSeconds: 12.4 },
  });
  assert.match(stalled.message, /stalled/u);
  rmSync(within.recordDir, { recursive: true, force: true });
  rmSync(stalled.recordDir, { recursive: true, force: true });
});

test("boundLine emits the S6 layer-A systemd trial envelope and its receipt read, byte-stable", () => {
  const envelope = detectHost({ readings: bigHost, caps: { memoryCap: "7 of 64 GB", threadCap: "1 of 80 threads" } });
  const a = boundLine({ task: "t13", envelope, command: "bun test test/" });
  const b = boundLine({ task: "t13", envelope, command: "bun test test/" });
  assert.equal(a, b);
  assert.match(a, /systemd-run --user --scope/u);
  assert.match(a, /-p MemoryMax=7168M/u);
  assert.match(a, /-p MemoryHigh=6451M/u);
  assert.match(a, /-p CPUQuota=100%/u);
  assert.match(a, /--unit=task-.* bun test test\//u);
  assert.match(a, /systemctl --user show task-.*\.scope -p MemoryPeak,CPUPeak,ExecMainStatus/u);
});

test("parseDuration reads the machine forms and refuses the rest", () => {
  assert.equal(parseDuration("90s"), 90);
  assert.equal(parseDuration("47m"), 2820);
  assert.equal(parseDuration("2h"), 7200);
  assert.throws(() => parseDuration("about 5 minutes"), /duration/u);
});

test("CLI: resources check — unknown trial exits 2; over-estimate exits 0 with the verdict", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-check-cli-"));
  try {
    const unknown = spawnSync("bun", [BIN, "resources", "check", "--task", "ghost", "--record-dir", dir], { encoding: "utf8" });
    assert.equal(unknown.status, 2);
    assert.match(unknown.stderr, /RESOURCES REFUSAL —/u);

    admitTrial2(dir);
    const over = spawnSync(
      "bun",
      [BIN, "resources", "check", "--task", "cli-check", "--record-dir", dir, "--elapsed", "47m"],
      { encoding: "utf8" },
    );
    assert.equal(over.status, 0, over.stdout + over.stderr);
    assert.match(over.stdout, /"verdict": "over-estimate"/u);
    assert.match(over.stdout, /wait explicitly/u);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

function admitTrial2(dir) {
  const run = spawnSync(
    "bun",
    [BIN, "resources", "admit", "--task", "cli-check", "--expect", JSON.stringify({ expected_duration: "about 5 minutes", expected_seconds: 300, requirements: EXPECT.requirements }), "--record-dir", dir],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stdout + run.stderr);
}

test("CLI: resources bound prints the systemd envelope lines", () => {
  const run = spawnSync("bun", [BIN, "resources", "bound", "--task", "cli-bound", "--memory-cap", "7 of 64 GB", "--cmd", "bun test test/"], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stdout + run.stderr);
  assert.match(run.stdout, /systemd-run --user --scope/u);
  assert.match(run.stdout, /systemctl --user show/u);
});

test("CLI: resources bound refuses --json — it prints the shell envelope, never a JSON receipt", () => {
  const run = spawnSync(
    "bun",
    [BIN, "resources", "bound", "--task", "cli-bound", "--cmd", "bun test test/", "--json"],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 2, run.stdout + run.stderr);
  assert.match(run.stderr, /RESOURCES REFUSAL —/u);
  assert.match(run.stderr, /--json/u);
  assert.equal(run.stdout, "", "a refusal writes nothing on stdout");
});

test("CLI: a malformed brief is a refusal (exit 2), never a stack trace", () => {
  const cases = [
    { expected_duration: "1m", requirements: { memory: "12 TB" } }, // unit outside GB|MB|KB
    { expected_duration: "1m", requirements: { cpu: 2 } }, // unknown requirement key
    { expected_duration: "1m", requirements: { memory: "1 GB", threads: 0 } }, // bad thread count
    { expected_duration: "1m", requirements: { memory: "1 GB" }, expected_seconds: -1 }, // bad machine expectation
  ];
  for (const expect of cases) {
    const run = spawnSync("bun", [BIN, "resources", "admit", "--task", "cli-bad", "--expect", JSON.stringify(expect)], { encoding: "utf8" });
    assert.equal(run.status, 2, `${JSON.stringify(expect)}\n${run.stdout}${run.stderr}`);
    assert.match(run.stderr, /RESOURCES REFUSAL —/u);
    assert.doesNotMatch(run.stderr, /at admitTrial|Bun v/u, "a usage mistake is not a crash");
    assert.equal(run.stdout, "");
  }
  const notAnObject = spawnSync("bun", [BIN, "resources", "admit", "--task", "cli-bad", "--expect", "[]"], { encoding: "utf8" });
  assert.equal(notAnObject.status, 2, notAnObject.stdout + notAnObject.stderr);
  assert.match(notAnObject.stderr, /RESOURCES REFUSAL —/u);
});

test("admit's malformed-input throws are typed — the CLI maps them to a refusal", () => {
  const envelope = detectHost({ readings: bigHost });
  assert.throws(
    () => admitTrial({ task: "t-bad", expect: { expected_duration: "1m", requirements: { memory: "12 TB" } }, envelope }),
    ResourcesError,
  );
});
