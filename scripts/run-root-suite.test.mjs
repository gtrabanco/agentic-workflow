#!/usr/bin/env node
// test-obligation: protects=scripts/run-root-suite.mjs obligations=contract,failure-path,boundary

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
import { mkdirSync, readdirSync, utimesSync, writeFileSync } from "node:fs";
import path, { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  argvFor,
  defaultJobs,
  dispatchReport,
  ensureSchemaBuild,
  parseArgs,
  prepareSchemaRuntime,
  readAllowlist,
  readSchemaDistState,
  relativeToCwd,
  runSuites,
  suites,
  SCHEMA_PACKAGE_DIR,
  schemaBuildManager,
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
    dir: "scripts",
    cwd: ".",
    suiteTimeoutMs: 120_000,
    suiteMemCapMb: 1536,
    testTimeoutMs: 10_000,
  });
});

test("parseArgs: --bail, --jobs and a suite subset are all read", () => {
  const parsed = parseArgs(["--bail", "--jobs", "4", "scripts/a.test.mjs", "scripts/b.test.mjs"]);
  assert.deepEqual(parsed, {
    bail: true,
    jobs: 4,
    selected: ["scripts/a.test.mjs", "scripts/b.test.mjs"],
    dir: "scripts",
    cwd: ".",
    suiteTimeoutMs: 120_000,
    suiteMemCapMb: 1536,
    testTimeoutMs: 10_000,
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

test("S9: the two measured spawn-heavy suites carry their declared budget in the shipped allowlist", () => {
  // Both spawn the shipped ceremony CLI per case, so their cost is the spawn
  // itself: under the gate's 6-worker pool with concurrent sessions on the
  // box they crossed the 10s per-test budget (10035/10058ms and 10051ms on
  // 2026-11-15) while measuring ~2.1s idle (owner amendment S9).
  const allowlist = readAllowlist();
  for (const file of ["scripts/ceremony-passive.test.mjs", "scripts/ceremony-unit-plan.test.mjs"]) {
    assert.equal(testBudgetFor(file, allowlist), 30_000, `${file} crossed the 10s per-test budget under load — its measured budget must be declared`);
    const entry = allowlist.get(file);
    assert.ok(entry.reason.trim(), `${file} declares why it needs the budget`);
    assert.ok(entry.measured.trim(), `${file} declares what was measured`);
  }
});

test("S14: the load-inflated sensor suite carries its declared budget in the shipped allowlist", () => {
  // Six real workflow-status spawns per case (fixture git walk + shimmed gh +
  // envelope parse); under the push gate with five concurrent local-gates on
  // this box it crossed the 10s per-test budget (10026.89ms on 2026-11-16,
  // load 15.9) while the same file measures 18.2s for 29 tests in a green
  // jobs-4 gate run (owner-routed S14, SPEC L4).
  const file = "scripts/next-step-ranking.test.mjs";
  const allowlist = readAllowlist();
  assert.equal(testBudgetFor(file, allowlist), 30_000, `${file} crossed the 10s per-test budget under load — its measured budget must be declared`);
  const entry = allowlist.get(file);
  assert.ok(entry, `${file} must be in the shipped allowlist`);
  assert.ok(entry.reason.trim(), `${file} declares why it needs the budget`);
  assert.ok(entry.measured.trim(), `${file} declares what was measured`);
});

test("the suite spawned by the runner inherits no ambient git tracing (owner-routed S15)", async () => {
  // Imported here rather than at the top so this case fails on its own evidence
  // while the S14 case above still reports its budget assertion.
  const { suiteChildEnv } = await import("./run-root-suite.mjs");
  assert.equal(typeof suiteChildEnv, "function", "the runner publishes its suite-env builder");
  const saved = { ...process.env };
  try {
    process.env.GIT_TRACE = "1";
    process.env.GIT_TRACE2 = "/tmp/trace2";
    const index = String(process.env.GIT_CONFIG_COUNT ?? "0");
    const env = suiteChildEnv();
    assert.equal(env.GIT_TRACE, undefined, "GIT_TRACE must not reach a suite");
    assert.equal(env.GIT_TRACE2, undefined, "GIT_TRACE2 must not reach a suite");
    assert.equal(env.GIT_DIR, undefined, "the locator contract still holds through this builder");
    assert.equal(env[`GIT_CONFIG_KEY_${index}`], "commit.gpgsign", "the gate's own config still lands");
    assert.equal(env[`GIT_CONFIG_VALUE_${index}`], "false");
    assert.equal(env[`GIT_CONFIG_KEY_${Number(index) + 1}`], "user.name", "the fixture identity lands after the signing layer");
    assert.equal(env[`GIT_CONFIG_KEY_${Number(index) + 2}`], "user.email", "the fixture identity carries a non-routable email");
    assert.ok(env[`GIT_CONFIG_VALUE_${Number(index) + 2}`].endsWith(".invalid"), "the fixture email is non-routable");
    assert.equal(env.NODE_TEST_CONTEXT, undefined, "a suite never inherits its parent's test-runner context");
    assert.equal(env.PATH, process.env.PATH, "the rest of the environment is inherited");
  } finally {
    for (const name of ["GIT_TRACE", "GIT_TRACE2"]) delete process.env[name];
    Object.assign(process.env, saved);
  }
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

test("end-to-end: a suite killed by --bail reports KILLED, never FAIL, and keeps its partial output out of the log (S9)", () => {
  // The first red aborts the dispatch and SIGKILLs what is still in flight:
  // that suite is collateral of the first failure, not a second one — it used
  // to print FAIL over all-green output, which reads as a second defect
  // (owner amendment S9).
  const dir = tempRoot("root-suite-bailkill-");
  const red = join(dir, "red.test.mjs");
  const hang = join(dir, "hang.test.mjs");
  writeFileSync(red, 'import { test } from "node:test";\ntest("fails at once", () => { throw new Error("boom"); });\n');
  writeFileSync(
    hang,
    'import { test } from "node:test";\nconsole.log("PARTIAL-MARKER");\ntest("never resolves", () => new Promise(() => setInterval(() => {}, 1_000)));\n',
  );
  const result = spawnSync(
    process.execPath,
    [SCRIPT, "--bail", "--jobs", "2", red, hang],
    { cwd: ROOT, encoding: "utf8", timeout: 60_000 },
  );
  assert.notEqual(result.status, 0, `the first red exits non-zero (stdout: ${result.stdout})`);
  assert.match(result.stdout, /KILLED .*hang\.test\.mjs/, "a bail-killed suite is named KILLED");
  assert.ok(!/FAIL .*hang\.test\.mjs/.test(result.stdout), "a bail-killed suite is never FAIL");
  assert.ok(!result.stdout.includes("PARTIAL-MARKER"), "a killed suite's partial output stays out of the log");
});

/* ------------------------------------------------------ schema dist state */

/**
 * A throwaway checkout skeleton: `<root>/packages/agentic-workflow-schema/<rel>`
 * for every entry. Sizes and mtimes are set by the case that needs them, so the
 * predicate is exercised without touching this repository's own build output.
 */
function schemaTree(files) {
  const root = tempRoot("root-suite-dist-");
  const packageDir = join(root, "packages", "agentic-workflow-schema");
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(path.dirname(join(packageDir, rel)), { recursive: true });
    writeFileSync(join(packageDir, rel), content);
  }
  return { root, packageDir };
}

/** Pin one path's mtime, so "older than its sources" is stated, never raced. */
function stamp(file, secondsSinceEpoch) {
  utimesSync(file, secondsSinceEpoch, secondsSinceEpoch);
}

test("readSchemaDistState: an absent dist entry is 'missing', not a rebuild of nothing", () => {
  const { packageDir } = schemaTree({ "src/index.ts": "export const a = 1;\n" });
  const state = readSchemaDistState({ packageDir });
  assert.equal(state.status, "missing");
  assert.match(state.detail, /dist\/index\.js/);
});

test("readSchemaDistState: a source without its emitted module is 'stale' — a half-built dist is never current", () => {
  const { packageDir } = schemaTree({
    "src/index.ts": "export * from './a.js';\n",
    "src/a.ts": "export const a = 1;\n",
    "dist/index.js": "export * from './a.js';\n",
    "dist/a.d.ts": "export declare const a = 1;\n",
  });
  const state = readSchemaDistState({ packageDir });
  assert.equal(state.status, "stale");
  assert.match(state.detail, /dist[\\/]a\.js/);
});

test("readSchemaDistState: an output older than its sources is 'stale', and the newer source is named", () => {
  const { packageDir } = schemaTree({
    "src/index.ts": "export const a = 1;\n",
    "dist/index.js": "export const a = 1;\n",
  });
  stamp(join(packageDir, "dist", "index.js"), 1_000_000);
  stamp(join(packageDir, "src", "index.ts"), 2_000_000);
  const state = readSchemaDistState({ packageDir });
  assert.equal(state.status, "stale");
  assert.match(state.detail, /src[\\/]index\.ts/);
});

test("readSchemaDistState: a build newer than every source is 'fresh' — the tree a build just left", () => {
  const { packageDir } = schemaTree({
    "src/index.ts": "export const a = 1;\n",
    "tsconfig.json": "{}\n",
    "dist/index.js": "export const a = 1;\n",
  });
  stamp(join(packageDir, "src", "index.ts"), 1_000_000);
  stamp(join(packageDir, "tsconfig.json"), 1_000_000);
  stamp(join(packageDir, "dist", "index.js"), 2_000_000);
  assert.equal(readSchemaDistState({ packageDir }).status, "fresh");
});

test("SCHEMA_PACKAGE_DIR is the package this repository's suites read", () => {
  assert.equal(SCHEMA_PACKAGE_DIR, join(ROOT, "packages", "agentic-workflow-schema"));
});

/* ------------------------------------------------------- the build seam */

test("schemaBuildManager: the runner's own runtime picks the package manager", () => {
  assert.equal(schemaBuildManager("/home/agent/.bun/bin/bun"), "bun");
  assert.equal(schemaBuildManager("/usr/bin/node"), "npm");
});

test("ensureSchemaBuild: runs the package's declared build script in the package directory", () => {
  const calls = [];
  const outcome = ensureSchemaBuild({
    manager: "bun",
    spawn: (bin, args, options) => {
      calls.push({ bin, args, cwd: options.cwd });
      return { status: 0, stdout: "$ tsc\n", stderr: "" };
    },
  });
  assert.deepEqual(calls, [{ bin: "bun", args: ["run", "build"], cwd: SCHEMA_PACKAGE_DIR }]);
  assert.equal(outcome.outcome, "built");
});

test("ensureSchemaBuild: an absent package manager is 'unavailable' — the dispatch is never blocked by a toolchain", () => {
  const outcome = ensureSchemaBuild({
    manager: "npm",
    spawn: () => ({ status: null, error: Object.assign(new Error("spawn npm ENOENT"), { code: "ENOENT" }) }),
  });
  assert.equal(outcome.outcome, "unavailable");
  assert.match(outcome.detail, /npm/);
});

test("ensureSchemaBuild: a build that ran and failed is 'failed' and carries the compiler's own output", () => {
  const outcome = ensureSchemaBuild({
    manager: "bun",
    spawn: () => ({ status: 2, stdout: "src/x.ts(1,1): error TS1005: ';' expected.\n", stderr: "" }),
  });
  assert.equal(outcome.outcome, "failed");
  assert.equal(outcome.status, 2);
  assert.match(outcome.output, /error TS1005/);
});

// The injected seam above proves the decision, never the default: a suite that
// only passes fakes cannot see a default that does not exist. This drives the
// real spawn against a throwaway package, so the manager resolution, the argv
// and the cwd are exercised end to end with nothing of this repository touched.
test("ensureSchemaBuild: the default spawn really runs the package's build script", () => {
  const { packageDir } = schemaTree({
    "package.json": JSON.stringify({
      name: "fixture-schema",
      version: "0.0.0",
      scripts: { build: "node -e \"require('node:fs').mkdirSync('dist',{recursive:true});require('node:fs').writeFileSync('dist/index.js','export const built = true;')\"" },
    }),
  });
  const outcome = ensureSchemaBuild({ packageDir });
  assert.equal(outcome.outcome, "built", outcome.output || outcome.detail);
  assert.equal(readSchemaDistState({ packageDir }).status, "fresh", "the built tree is current, so the decision would skip the next rebuild");
});

test("ensureSchemaBuild: a manager that does not exist is 'unavailable' for real", () => {
  const { packageDir } = schemaTree({});
  const outcome = ensureSchemaBuild({ manager: "not-a-real-package-manager-xyz", packageDir });
  assert.equal(outcome.outcome, "unavailable");
  assert.match(outcome.detail, /ENOENT/);
});

/* ------------------------------------------------ the dispatch decision */

test("prepareSchemaRuntime: a current build is not rebuilt — the gate's own tree pays nothing", () => {
  let built = false;
  const decision = prepareSchemaRuntime({
    state: { status: "fresh", detail: "" },
    build: () => {
      built = true;
      return { outcome: "built" };
    },
  });
  assert.equal(decision.action, "current");
  assert.equal(built, false);
});

test("prepareSchemaRuntime: a stale build is rebuilt before the pool starts", () => {
  const decision = prepareSchemaRuntime({
    state: { status: "stale", detail: "src/index.ts is newer than the build" },
    build: () => ({ outcome: "built", manager: "bun", ms: 450 }),
  });
  assert.equal(decision.action, "rebuilt");
  assert.equal(decision.manager, "bun");
});

test("prepareSchemaRuntime: a missing build is rebuilt too — the fresh-clone case", () => {
  const decision = prepareSchemaRuntime({
    state: { status: "missing", detail: "dist/index.js is absent" },
    build: () => ({ outcome: "built", manager: "npm", ms: 900 }),
  });
  assert.equal(decision.action, "rebuilt");
});

test("prepareSchemaRuntime: an unavailable toolchain is reported and the suites still run", () => {
  const decision = prepareSchemaRuntime({
    state: { status: "stale", detail: "dist is older than src" },
    build: () => ({ outcome: "unavailable", detail: "npm is not available (ENOENT)" }),
  });
  assert.equal(decision.action, "unavailable");
  assert.match(decision.detail, /npm is not available/);
});

test("prepareSchemaRuntime: a failed build is reported with its output, never swallowed", () => {
  const decision = prepareSchemaRuntime({
    state: { status: "stale", detail: "dist is older than src" },
    build: () => ({ outcome: "failed", status: 2, output: "error TS1005" }),
  });
  assert.equal(decision.action, "failed");
  assert.equal(decision.output, "error TS1005");
});

/* --------------------------------------------------------- the report */

test("dispatchReport: a current build says nothing and stops nothing", () => {
  assert.deepEqual(dispatchReport({ action: "current" }), { lines: [], stop: false });
});

test("dispatchReport: a rebuild is one line naming the build it replaced", () => {
  const report = dispatchReport({ action: "rebuilt", state: { status: "stale" }, manager: "bun", ms: 450 });
  assert.equal(report.stop, false);
  assert.equal(report.lines.length, 1);
  assert.match(report.lines[0], /^root gate: schema dist rebuilt in 0\.5s/);
});

test("dispatchReport: an unavailable toolchain names the manual command and the dispatch continues", () => {
  const report = dispatchReport({
    action: "unavailable",
    state: { status: "missing" },
    manager: "npm",
    detail: "npm is not available (ENOENT)",
  });
  assert.equal(report.stop, false, "an unprovisioned tree keeps today's behaviour");
  assert.equal(report.lines.length, 1);
  assert.match(report.lines[0], /schema dist is missing/);
  assert.match(report.lines[0], /bun run build/);
  assert.match(report.lines[0], /npm is not available/);
});

test("dispatchReport: a package that does not compile prints the compiler's output and stops the run", () => {
  const report = dispatchReport({
    action: "failed",
    state: { status: "stale" },
    manager: "bun",
    status: 2,
    output: "src/x.ts(1,1): error TS1005: ';' expected.",
  });
  assert.equal(report.stop, true, "a tree that does not compile never reports contract results");
  assert.ok(report.lines.some((line) => line.includes("error TS1005")), "the compiler's own words reach the reader");
  assert.ok(report.lines.some((line) => /^root gate: the schema package does not build/.test(line)));
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
  // The schema-build report is stderr on purpose: stdout stays the machine
  // receipt a caller reads, and the header keeps its first line.
  assert.ok(result.stdout.startsWith("root gate: 1 suite(s)"), `the header opens stdout, not the build report: ${result.stdout.slice(0, 120)}`);
  assert.doesNotMatch(result.stdout, /root gate: schema/, "the build report never lands on stdout");
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

/* ------------------------------------------------- the pooled package suite */

// Issue #598 S4: the crate suite is the gate's dominant cost and it ran its 77
// files through one process. The pool, the per-test budget and the external
// bounds are the same instrument the root gate already uses, so the second
// suite tree is a flag — never a second runner.

test("--dir, --cwd and --test-timeout select a second suite tree, and the defaults keep the root gate as it was", () => {
  const defaults = parseArgs([]);
  assert.equal(defaults.dir, "scripts", "the root gate's tree is the default");
  assert.equal(defaults.cwd, ".", "the root gate spawns from the repository root");
  assert.equal(defaults.testTimeoutMs, 10_000);

  const crate = parseArgs(["--dir", "packages/agentic-workflow/test", "--cwd", "packages/agentic-workflow", "--test-timeout", "30"]);
  assert.equal(crate.dir, "packages/agentic-workflow/test");
  assert.equal(crate.cwd, "packages/agentic-workflow");
  assert.equal(crate.testTimeoutMs, 30_000, "the crate's suites declare 30 s per test");
});

test("--test-timeout refuses zero, negatives, non-numbers and a missing value", () => {
  for (const value of ["0", "-1", "ten", undefined]) {
    assert.throws(() => parseArgs(value === undefined ? ["--test-timeout"] : ["--test-timeout", value]), undefined, `expected a refusal for ${value}`);
  }
});

test("suites() reads the tree it is given, sorted, and only that tree's suites", () => {
  const root = suites("scripts");
  assert.ok(root.length >= 100, "the root tree is the one the gate dispatches");
  assert.ok(root.every((file) => file.startsWith("scripts/") && file.endsWith(".test.mjs")));
  assert.deepEqual(root, [...root].sort());

  const dir = "packages/agentic-workflow/test";
  const crate = suites(dir);
  const onDisk = readdirSync(path.join(ROOT, dir)).filter((name) => name.endsWith(".test.mjs")).sort();
  assert.deepEqual(crate, onDisk.map((name) => `${dir}/${name}`), "one entry per suite file, no helper and no fixture");
  assert.ok(crate.length > 50);
});

test("a suite is spawned from the declared cwd with the path relative to it", () => {
  assert.equal(relativeToCwd("packages/agentic-workflow/test/a.test.mjs", "packages/agentic-workflow"), "test/a.test.mjs");
  assert.equal(relativeToCwd("scripts/a.test.mjs", "."), "scripts/a.test.mjs");
  assert.equal(relativeToCwd("packages/a/test/x.test.mjs", "packages/a"), "test/x.test.mjs");
});

test("the declared per-test budget is the child's own flag, on both runtimes", () => {
  assert.equal(testBudgetFor("packages/a/test/x.test.mjs", new Map(), 30_000), 30_000, "a caller's budget is the default for a tree with no allowlist entry");
  assert.equal(testBudgetFor("scripts/x.test.mjs", new Map([["scripts/x.test.mjs", { timeoutMs: 60_000 }]]), 30_000), 60_000, "an allowlisted suite keeps its own budget");
  assert.deepEqual(argvFor("test/x.test.mjs", false, 30_000, "bun"), ["test", "--timeout=30000", "test/x.test.mjs"]);
  assert.deepEqual(argvFor("test/x.test.mjs", false, 30_000, "node"), ["--test", "--test-timeout=30000", "test/x.test.mjs"]);
});

/* ------------------------------------------ the --dir and header contract */

// Issue #598, external-verify B2/B3 (correction corpus, `## Log` E11): an
// explicit `--dir` that names nothing must be refused before dispatch — a
// green gate that ran zero suites is the silent skip AC-S8 forbids — the
// default invocation's header keeps the base shape byte-for-byte, and an
// absolute `--dir` runs its tree from wherever the runner is invoked.

test("--dir naming a missing directory is a usage error, never a zero-suite success", () => {
  const result = spawnSync(process.execPath, [SCRIPT, "--dir", "does-not-exist"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120_000,
  });
  assert.equal(result.status, 2, result.stdout + result.stderr);
  assert.match(result.stderr, /--dir does-not-exist/);
  assert.doesNotMatch(result.stdout, /0 suite\(s\)/, "a missing tree never reports a run");
});

test("the default header carries no tree segment, and --dir scripts keeps the base shape", () => {
  const plain = spawnSync(process.execPath, [SCRIPT, "--jobs", "2", "scripts/workspace-lock-policy.test.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120_000,
  });
  assert.equal(plain.status, 0, plain.stdout + plain.stderr);
  assert.ok(plain.stdout.startsWith("root gate: 1 suite(s) · "), `the default header stays base-shaped: ${plain.stdout.slice(0, 100)}`);
  assert.doesNotMatch(plain.stdout, /suite\(s\) from/, "no tree segment for the default tree");

  const explicit = spawnSync(process.execPath, [SCRIPT, "--dir", "scripts", "--jobs", "2", "scripts/workspace-lock-policy.test.mjs"], {
    cwd: ROOT,
    encoding: "utf8",
    timeout: 120_000,
  });
  assert.equal(explicit.status, 0, explicit.stdout + explicit.stderr);
  assert.ok(explicit.stdout.startsWith("root gate: 1 suite(s) · "), `--dir scripts prints the default tree: ${explicit.stdout.slice(0, 100)}`);
  assert.doesNotMatch(explicit.stdout, /suite\(s\) from/);
});

test("an absolute --dir runs that tree, from any invocation cwd, and the header names it", () => {
  const dir = tempRoot("run-root-suite-abs-");
  writeFileSync(join(dir, "one.test.mjs"), 'import { test } from "node:test";\ntest("ok", () => {});\n');
  const result = spawnSync(process.execPath, [SCRIPT, "--dir", dir], {
    cwd: dir,
    encoding: "utf8",
    timeout: 120_000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.ok(result.stdout.includes(`1 suite(s) from ${dir} · `), `the header names the absolute tree: ${result.stdout.slice(0, 120)}`);
  assert.match(result.stdout, /PASS .*one\.test\.mjs/);
});

test("--dir and --cwd refuse an empty value at parse time", () => {
  assert.throws(() => parseArgs(["--dir", ""]), /--dir needs a directory/);
  assert.throws(() => parseArgs(["--cwd", ""]), /--cwd needs a directory/);
});
