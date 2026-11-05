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
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { defaultJobs, parseArgs, runSuites } from "./run-root-suite.mjs";

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

test("parseArgs: no arguments means every suite, no bail, and the default worker count", () => {
  const parsed = parseArgs([]);
  assert.deepEqual(parsed, { bail: false, jobs: null, selected: [] });
});

test("parseArgs: --bail, --jobs and a suite subset are all read", () => {
  const parsed = parseArgs(["--bail", "--jobs", "4", "scripts/a.test.mjs", "scripts/b.test.mjs"]);
  assert.deepEqual(parsed, { bail: true, jobs: 4, selected: ["scripts/a.test.mjs", "scripts/b.test.mjs"] });
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
