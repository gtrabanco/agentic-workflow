#!/usr/bin/env node
/**
 * run-root-suite.test.mjs — the sibling suite of `scripts/run-root-suite.mjs`.
 *
 * The root gate is the slowest step a contributor waits on, so its contract is
 * a bounded worker pool, not one sequential process: the suites are distributed
 * over one worker per CPU (capped with `--jobs`), each worker runs the
 * identical per-file invocation, and `--bail` stops the dispatch at the first
 * red — killing the suites still in flight instead of letting them burn a core
 * on a tree already known to be broken.
 *
 * The pool is exercised with a scripted spawn, so the scheduling contract is
 * proven without paying for real suites; two integration cases run the script
 * end-to-end against the cheapest real suite to pin the wire format (the
 * header line, the per-suite PASS line, the verbatim exit status).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path, { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  argvFor,
  defaultJobs,
  parseArgs,
  readAllowlist,
  runSuites,
  testBudgetFor,
} from "./run-root-suite.mjs";
import { tempRoot } from "./temp-root.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts", "run-root-suite.mjs");

/**
 * A scripted per-suite spawn: each named suite resolves with its step's status
 * after `delay` ms, and a `signal` abort resolves early as a kill.
 */
function fakeSpawn(script = new Map()) {
  const started = [];
  let inflight = 0;
  let maxInflight = 0;
  const spawnSuite = (file, signal) =>
    new Promise((resolve) => {
      started.push(file);
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      const step = script.get(file) ?? {};
      const finish = () => {
        inflight -= 1;
        resolve({ status: step.status ?? 0 });
      };
      if (!step.delay) {
        finish();
        return;
      }
      const timer = setTimeout(finish, step.delay);
      signal?.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          inflight -= 1;
          resolve({ status: null, killed: true });
        },
        { once: true },
      );
    });
  return { spawnSuite, started, get maxInflight() { return maxInflight; } };
}

/* --------------------------------------------------------------- parseArgs */

// Superseded by issue #493 (S2, S3): parseArgs also carries the suite-level
// execution bounds — the wall-clock suite timeout and the per-worker memory cap.
test("parseArgs: no arguments means every suite, no bail, the default worker count and the default bounds", () => {
  const parsed = parseArgs([]);
  assert.deepEqual(parsed, {
    bail: false,
    jobs: null,
    selected: [],
    suiteTimeoutMs: 120_000,
    suiteMemCapMb: 1536,
  });
});

test("parseArgs: --bail, --jobs and a suite subset are all read", () => {
  const parsed = parseArgs(["--bail", "--jobs", "4", "scripts/a.test.mjs", "scripts/b.test.mjs"]);
  assert.deepEqual(parsed, {
    bail: true,
    jobs: 4,
    selected: ["scripts/a.test.mjs", "scripts/b.test.mjs"],
    suiteTimeoutMs: 120_000,
    suiteMemCapMb: 1536,
  });
});

test("parseArgs: --suite-timeout and --suite-mem-cap override the bounds", () => {
  const parsed = parseArgs(["--suite-timeout", "5", "--suite-mem-cap", "256"]);
  assert.equal(parsed.suiteTimeoutMs, 5_000);
  assert.equal(parsed.suiteMemCapMb, 256);
});

test("parseArgs: --suite-timeout refuses zero, negatives, non-numbers and a missing value", () => {
  for (const argv of [["--suite-timeout", "0"], ["--suite-timeout", "-5"], ["--suite-timeout", "soon"], ["--suite-timeout"]]) {
    assert.throws(() => parseArgs(argv), undefined, `expected a refusal for ${JSON.stringify(argv)}`);
  }
});

test("parseArgs: --suite-mem-cap refuses zero, negatives, non-numbers and a missing value", () => {
  for (const argv of [["--suite-mem-cap", "0"], ["--suite-mem-cap", "-64"], ["--suite-mem-cap", "lots"], ["--suite-mem-cap"]]) {
    assert.throws(() => parseArgs(argv), undefined, `expected a refusal for ${JSON.stringify(argv)}`);
  }
});

test("parseArgs: a bare `--` separator is tolerated and dropped", () => {
  const parsed = parseArgs(["--", "scripts/a.test.mjs"]);
  assert.deepEqual(parsed.selected, ["scripts/a.test.mjs"]);
});

test("parseArgs: --jobs refuses zero, negatives, non-numbers and a missing value", () => {
  for (const argv of [["--jobs", "0"], ["--jobs", "-2"], ["--jobs", "many"], ["--jobs"]]) {
    assert.throws(() => parseArgs(argv), undefined, `expected a refusal for ${JSON.stringify(argv)}`);
  }
});

test("defaultJobs is at least one", () => {
  assert.ok(defaultJobs() >= 1);
});

/* ------------------------------------------------------------------- pool */

test("every selected suite runs exactly once when all pass", async () => {
  const fake = fakeSpawn();
  const suites = ["a", "b", "c", "d"];
  const exit = await runSuites({ suites, jobs: 2, spawnSuite: fake.spawnSuite });
  assert.equal(exit, 0);
  assert.deepEqual([...fake.started].sort(), suites);
});

test("the worker count bounds concurrency", async () => {
  const fake = fakeSpawn(new Map([["a", { delay: 20 }], ["b", { delay: 20 }], ["c", { delay: 20 }]]));
  const exit = await runSuites({ suites: ["a", "b", "c"], jobs: 2, spawnSuite: fake.spawnSuite });
  assert.equal(exit, 0);
  assert.equal(fake.maxInflight, 2, "two suites, two workers — both in flight, never three");
});

test("jobs above the suite count never spawns idle workers beyond the work", async () => {
  const fake = fakeSpawn();
  await runSuites({ suites: ["a", "b"], jobs: 8, spawnSuite: fake.spawnSuite });
  assert.deepEqual([...fake.started].sort(), ["a", "b"]);
});

test("--bail stops the dispatch at the first red and kills the in-flight suites", async () => {
  const fake = fakeSpawn(new Map([
    ["inflight", { delay: 30_000 }],
  ]));
  const results = [];
  const exit = await runSuites({
    // Two workers: the first takes the instant red, the second the in-flight
    // suite — so the suites after the red are provably never dispatched.
    suites: ["fast-red", "inflight", "never-1", "never-2"],
    jobs: 2,
    bail: true,
    spawnSuite: (file, signal) => {
      if (file === "fast-red") return Promise.resolve({ status: 1 });
      return fake.spawnSuite(file, signal);
    },
    onResult: (file, result) => results.push([file, result.status]),
  });
  assert.equal(exit, 1, "the first failing status is forwarded verbatim");
  assert.deepEqual(fake.started, ["inflight"], "the suites after the red never start");
  assert.ok(results.some(([file, status]) => file === "inflight" && status === null), "the in-flight suite was killed, not awaited");
  assert.ok(results.some(([file, status]) => file === "fast-red" && status === 1));
});

test("without --bail every suite runs even after a red, and the first failing status wins", async () => {
  const fake = fakeSpawn(new Map([
    ["b", { delay: 10, status: 3 }],
    ["d", { delay: 20, status: 7 }],
  ]));
  const exit = await runSuites({ suites: ["a", "b", "c", "d"], jobs: 2, spawnSuite: fake.spawnSuite });
  assert.equal(exit, 3, "the first failure in completion order, not the last");
  assert.deepEqual([...fake.started].sort(), ["a", "b", "c", "d"]);
});

test("jobs below one is clamped to one, not a zero-worker hang", async () => {
  const fake = fakeSpawn();
  const exit = await runSuites({ suites: ["a"], jobs: 0, spawnSuite: fake.spawnSuite });
  assert.equal(exit, 0);
  assert.deepEqual(fake.started, ["a"]);
});

/* -------------------------------------------------------------- allowlist */

test("readAllowlist: a missing file is an empty allowlist, not an error", () => {
  const allowlist = readAllowlist(join(tempRoot("root-suite-allow-"), "absent.json"));
  assert.equal(allowlist.size, 0);
});

test("readAllowlist: every entry carries its own budget, reason and measured cost", () => {
  const dir = tempRoot("root-suite-allow-");
  const file = join(dir, "test-timeout-allowlist.json");
  writeFileSync(
    file,
    JSON.stringify([
      { path: "scripts/slow.test.mjs", timeoutMs: 60_000, reason: "full-history git walks", measured: "41.2s max per test, 2026-11-10" },
    ]),
  );
  const allowlist = readAllowlist(file);
  assert.equal(allowlist.size, 1);
  assert.deepEqual(allowlist.get("scripts/slow.test.mjs"), {
    timeoutMs: 60_000,
    reason: "full-history git walks",
    measured: "41.2s max per test, 2026-11-10",
  });
});

test("readAllowlist: malformed JSON, a bare entry, a missing reason or measured cost, and a non-suite path are all refused", () => {
  const dir = tempRoot("root-suite-allow-");
  const refusals = [
    ["malformed", "not json at all"],
    ["not-an-object-list", JSON.stringify({ scripts: [] })],
    ["missing-reason", JSON.stringify([{ path: "scripts/a.test.mjs", timeoutMs: 60_000, measured: "41s" }])],
    ["missing-measured", JSON.stringify([{ path: "scripts/a.test.mjs", timeoutMs: 60_000, reason: "git walks" }])],
    ["missing-timeout", JSON.stringify([{ path: "scripts/a.test.mjs", reason: "git walks", measured: "41s" }])],
    ["not-a-suite", JSON.stringify([{ path: "src/index.ts", timeoutMs: 60_000, reason: "git walks", measured: "41s" }])],
  ];
  for (const [name, content] of refusals) {
    const file = join(dir, `${name}.json`);
    writeFileSync(file, content);
    assert.throws(() => readAllowlist(file), undefined, `expected a refusal for ${name}`);
  }
});

/* ------------------------------------------------------- per-test budget */

test("the per-test budget defaults to 10s and lands in the child's own runner flags", () => {
  assert.deepEqual(argvFor("scripts/a.test.mjs", false, 10_000, "bun"), ["test", "--timeout=10000", "scripts/a.test.mjs"]);
  assert.deepEqual(argvFor("scripts/a.test.mjs", true, 10_000, "bun"), ["test", "--timeout=10000", "--bail=1", "scripts/a.test.mjs"]);
  assert.deepEqual(argvFor("scripts/a.test.mjs", false, 10_000, "node"), ["--test", "--test-timeout=10000", "scripts/a.test.mjs"]);
});

test("testBudgetFor: an allowlisted suite gets its own budget, everything else the 10s default", () => {
  const allowlist = new Map([["scripts/slow.test.mjs", { timeoutMs: 60_000, reason: "r", measured: "m" }]]);
  assert.equal(testBudgetFor("scripts/slow.test.mjs", allowlist), 60_000);
  assert.equal(testBudgetFor("scripts/fast.test.mjs", allowlist), 10_000);
  assert.equal(testBudgetFor("scripts/fast.test.mjs", new Map()), 10_000);
});

/* -------------------------------------------------- execution bounds (live) */

/** A suite whose only test never resolves while keeping the event loop alive
 *  (a keep-alive timer, no test completion): past the suite bound, the runner's
 *  own per-test timer (10 s by default) has not fired, so only the gate's
 *  external, signal-based killer can end it — the verdict must be named
 *  (`SUITE TIMEOUT`), never a silent pass (issue #493 S2, S7). */
function writeHangingFixture(dir) {
  const file = join(dir, "hang.test.mjs");
  writeFileSync(
    file,
    'import { test } from "node:test";\n' +
      'test("never resolves", () => new Promise(() => setInterval(() => {}, 1_000)));\n',
  );
  return file;
}

/** A suite that grows ~1.5 GB a few MB at a time and never finishes — the
 *  watchdog (250 ms sampling) must catch it long before the allocation lands
 *  when the cap is armed; without the cap it runs until the outer bound. */
function writeAllocatingFixture(dir) {
  const file = join(dir, "alloc.test.mjs");
  writeFileSync(
    file,
    'import { test } from "node:test";\n' +
      'const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));\n' +
      'test("grows past the cap", async () => { const buffers = []; for (let i = 0; i < 192; i += 1) { buffers.push(Buffer.alloc(8 * 1024 * 1024, 1)); await pause(20); } await new Promise(() => {}); });\n',
  );
  return file;
}

test("end-to-end: a suite that hangs past the suite bound dies with a named SUITE TIMEOUT verdict", () => {
  const fixture = writeHangingFixture(tempRoot("root-suite-hang-"));
  const result = spawnSync(
    process.execPath,
    [SCRIPT, "--jobs", "1", "--suite-timeout", "2", fixture],
    { cwd: ROOT, encoding: "utf8", timeout: 30_000 },
  );
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /SUITE TIMEOUT/, "the verdict is named, never a silent pass");
  assert.match(result.stdout, /FAIL .*hang\.test\.mjs/);
});

test("end-to-end: a suite that allocates past the memory cap dies with a named SUITE MEMORY CAP verdict", () => {
  const fixture = writeAllocatingFixture(tempRoot("root-suite-alloc-"));
  const result = spawnSync(
    process.execPath,
    [SCRIPT, "--jobs", "1", "--suite-mem-cap", "512", fixture],
    { cwd: ROOT, encoding: "utf8", timeout: 60_000 },
  );
  assert.notEqual(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /SUITE MEMORY CAP/, "the verdict is named, never a silent pass");
  assert.match(result.stdout, /FAIL .*alloc\.test\.mjs/);
});

/* ------------------------------------------------------------ integration */

test("end-to-end: one cheap real suite, two workers, green and reported", () => {
  const result = spawnSync(process.execPath, [SCRIPT, "--jobs", "2", "scripts/workspace-lock-policy.test.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120_000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /root gate: 1 suite\(s\)/, "the header names the plan");
  assert.match(result.stdout, /PASS scripts\/workspace-lock-policy\.test\.mjs/);
});

test("end-to-end: a suite that does not exist fails the gate verbatim", () => {
  const result = spawnSync(process.execPath, [SCRIPT, "--jobs", "2", "scripts/no-such-suite.test.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120_000,
  });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /FAIL scripts\/no-such-suite\.test\.mjs/);
});
