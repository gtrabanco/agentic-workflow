#!/usr/bin/env node

/**
 * local-gate.test.mjs — the sibling suite of `scripts/local-gate.mjs`.
 *
 * The gate's own contract is what keeps the local-first decision from rotting:
 * the step table must still carry one row per check the manual workflow used to
 * run (so nothing silently disappears), fail-fast must actually stop, and the
 * `pre-push` hook must be installable, idempotent and refusable.
 *
 * The heavy steps are never run here: every case drives `--list`, an argument
 * error, or `--install-hook` against a throwaway checkout.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { DEPS, GATE_RESULT_SCHEMA, OUTPUT_TAIL_BYTES, STEPS, gateResultDocument, hookBody, parseImpactVerdict, peerFloor, piCompatInstalls, scheduleSteps, stepEnv, workspacePackageDirs } from "./local-gate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE = path.join(ROOT, "scripts", "local-gate.mjs");

const gate = (args, options = {}) =>
  spawnSync(process.execPath, [GATE, ...args], { cwd: options.cwd ?? ROOT, encoding: "utf8" });

/** A commit identity for every fixture invocation — no fixture writes the
 *  caller's git configuration (`scripts/git-config-writes.test.mjs`). */
const FIXTURE_IDENTITY = ["-c", "user.name=Fixture Human", "-c", "user.email=fixture@example.com", "-c", "commit.gpgsign=false"];

/** A throwaway checkout. The hook installer asks git where the hooks live, so a
 *  fixture is a real repository — a directory that merely holds a `.git`
 *  directory is not a checkout, and the installer says so (issue #580). */
function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "local-gate-"));
  const init = spawnSync("git", ["init", "-q", "-b", "main", dir], { encoding: "utf8" });
  assert.equal(init.status, 0, init.stderr);
  return dir;
}

/** A throwaway repository with one commit and a stub gate, so a hook run proves
 *  which argv the gate receives and whether the gate ran at all. */
function hookSandbox() {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "local-gate-hook-"));
  const dir = path.join(parent, "repo");
  fs.mkdirSync(dir);
  const git = (args) => {
    const result = spawnSync("git", [...FIXTURE_IDENTITY, ...args], { cwd: dir, encoding: "utf8" });
    assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
    return result.stdout.trim();
  };
  git(["init", "-q", "-b", "main"]);
  fs.writeFileSync(path.join(dir, "file.txt"), "one\n");
  git(["add", "."]);
  git(["commit", "-q", "-m", "one"]);
  const recorded = path.join(parent, "argv.txt");
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  fs.writeFileSync(
    path.join(dir, "scripts", "local-gate.mjs"),
    `import fs from "node:fs";\nfs.writeFileSync(${JSON.stringify(recorded)}, process.argv.slice(2).join(" "));\n`,
  );
  return { parent, dir, git, recorded, hook: path.join(dir, ".git", "hooks", "pre-push") };
}

const ZERO_SHA = "0".repeat(40);
const SOME_SHA = "1".repeat(40);

/** The ref line `pre-push` delivers for one pushed ref. */
function refLine(localRef, localSha, remoteRef, remoteSha) {
  return `${localRef} ${localSha} ${remoteRef} ${remoteSha}\n`;
}

/** Run the installed hook the way git does: the remote as `$1`, the refs on stdin. */
function runHook(fixture, stdin) {
  return spawnSync("bash", [fixture.hook, "origin", "git@example.test:fixture/repo.git"], {
    cwd: fixture.dir,
    encoding: "utf8",
    input: stdin,
  });
}

/** A throwaway checkout that is a real git repository carrying the shipped
 *  secret-scan step, so a gate-level run proves the step refuses a tree it
 *  judges. Identity travels per invocation with `git -c` — no fixture writes
 *  git configuration (`scripts/git-config-writes.test.mjs`). */
function secretSandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "local-gate-secret-"));
  fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
  // The shipped step runs the template's one implementation (issue #552), so the
  // fixture stages the module where the step's argv names it. The shipped
  // allowlist narrows the suite's own known-secret fixture, so the fixture
  // checkout carries the suite too — otherwise the entry would read as stale in
  // the very tree the gate is judging.
  const hooksRel = path.join("template", ".agentic-workflow", "hooks");
  fs.mkdirSync(path.join(dir, hooksRel), { recursive: true });
  fs.copyFileSync(path.join(ROOT, hooksRel, "secret-scan.mjs"), path.join(dir, hooksRel, "secret-scan.mjs"));
  for (const name of ["secret-scan.test.mjs", "secret-scan-allowlist.json"]) {
    fs.copyFileSync(path.join(ROOT, "scripts", name), path.join(dir, "scripts", name));
  }
  const git = (args) => {
    const result = spawnSync(
      "git",
      ["-c", "user.name=Fixture Human", "-c", "user.email=fixture@example.com", "-c", "commit.gpgsign=false", ...args],
      { cwd: dir, encoding: "utf8" },
    );
    assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
    return result.stdout;
  };
  git(["init", "-q", "-b", "main"]);
  return { dir, git };
}

test("a step never inherits the caller's repository locator", () => {
  // `git push` exports GIT_DIR to its pre-push hook; a fixture that `git init`s
  // a throwaway directory then re-initializes the caller's repository. The gate
  // strips the locator variables once, for every step.
  const saved = { ...process.env };
  try {
    process.env.GIT_DIR = "/real/.git";
    process.env.GIT_WORK_TREE = "/real";
    process.env.GIT_INDEX_FILE = "/real/.git/index";
    const env = stepEnv();
    assert.equal(env.GIT_DIR, undefined, "GIT_DIR must not reach a step");
    assert.equal(env.GIT_WORK_TREE, undefined, "GIT_WORK_TREE must not reach a step");
    assert.equal(env.GIT_INDEX_FILE, undefined, "GIT_INDEX_FILE must not reach a step");
    assert.equal(env.PATH, process.env.PATH, "the rest of the environment is inherited");
  } finally {
    for (const name of ["GIT_DIR", "GIT_WORK_TREE", "GIT_INDEX_FILE"]) delete process.env[name];
    Object.assign(process.env, saved);
  }
});

test("a step never inherits the caller's ambient git tracing", () => {
  // The same seam, the reported incident's path: `GIT_TRACE=1 git push` reaches
  // the hook's environment, the gate spawns every suite from it, and a suite
  // that pins an empty stderr fails on git's own trace lines (2026-11-16).
  const saved = { ...process.env };
  try {
    process.env.GIT_TRACE = "1";
    process.env.GIT_TRACE2 = "/tmp/trace2";
    const env = stepEnv();
    assert.equal(env.GIT_TRACE, undefined, "GIT_TRACE must not reach a step");
    assert.equal(env.GIT_TRACE2, undefined, "GIT_TRACE2 must not reach a step");
    assert.equal(env.PATH, process.env.PATH, "the rest of the environment is inherited");
  } finally {
    for (const name of ["GIT_TRACE", "GIT_TRACE2"]) delete process.env[name];
    Object.assign(process.env, saved);
  }
});

/* ------------------------------------------------------------------ table */

test("every former remote check survives as a step, and the ids are unique", () => {
  const ids = STEPS.map((step) => step.id);
  assert.equal(new Set(ids).size, ids.length, "a duplicated id would run one check twice");
  assert.deepEqual(ids, [
    "workspace-install",
    "schema-build",
    "crate-suite-bun",
    "crate-suite-node",
    "root-suite",
    "version-parity-content",
    "docs-generated-projection",
    "journal-carrier-check",
    "log-immutability",
    "push-identity",
    "secret-scan",
    "temp-hygiene",
    "tmp-gc",
    "worktree-guard",
    "rigidity-review",
    "schema-node-compat",
    "pi-node-compat",
    "pi-compat-guard",
    "dependency-pin-gate",
    "dependency-advisories",
  ]);
});

test("every step names its former job, so a reader can trace it back", () => {
  for (const step of STEPS) {
    assert.ok(step.title?.length > 0, `${step.id} carries a title`);
    assert.ok(step.mirrors?.length > 0, `${step.id} names the workflow job it replaced`);
    assert.ok(step.run || Array.isArray(step.argv), `${step.id} is runnable`);
  }
});

test("every command step points at a file or script this repository carries", () => {
  for (const step of STEPS) {
    if (!step.argv) continue;
    const cwd = path.join(ROOT, step.cwd ?? ".");
    assert.ok(fs.existsSync(cwd), `${step.id}'s working directory exists`);
    const target = step.argv[1];
    if (target && target.endsWith(".mjs")) {
      assert.ok(fs.existsSync(path.join(cwd, target)), `${step.id} runs ${target}, which exists`);
    }
  }
});

test("journal-carrier-check fails on a malformed fixture carrier and moves no byte", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "journal-carrier-"));
  try {
    const carrier = path.join(dir, ".agentic-workflow", "journal");
    fs.mkdirSync(carrier, { recursive: true });
    fs.writeFileSync(
      path.join(carrier, "20261108T121830Z-main-manual-narrative-local.md"),
      "## 2026-11-08T12:18:30Z — main — manual\n- **Summary:** the incident's shape\n",
    );
    const step = STEPS.find((candidate) => candidate.id === "journal-carrier-check");
    assert.ok(step, "the carrier check is a declared gate step");
    const result = spawnSync(step.argv[0], [...step.argv.slice(1), "--dir", dir], {
      cwd: ROOT,
      encoding: "utf8",
      env: stepEnv(),
    });
    assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /^JOURNAL REFUSAL — 1 non-conforming fragment/u);
    assert.match(result.stderr, /main-manual-narrative-local\.md/u);
    assert.deepEqual(fs.readdirSync(carrier), ["20261108T121830Z-main-manual-narrative-local.md"], "validate-only: nothing consumed");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------- the secret scan step */

test("the secret-scan step is offline, non-test-bearing and never dropped for want of a range", () => {
  // S8's marker pair and S2's offline placement: the prose-only push is the leak
  // path, so an empty impact verdict must not skip the scan, and a hook that can
  // prove no base must not lose the step — the script resolves its own range.
  const step = STEPS.find((candidate) => candidate.id === "secret-scan");
  assert.ok(step, "the scan is a declared step");
  assert.equal(step.tests, false, "a secret is exactly what a prose-only push can carry");
  assert.ok(!step.network, "a secret must never wait on a registry to be caught");
  assert.notEqual(step.pushBase, true, "a range-bound step is dropped when no base is proven");
  assert.deepEqual(DEPS["secret-scan"], [], "the scan reads the range, never another step's output");
});

test("a tree carrying a secret fails the gate through the shipped step", () => {
  const { dir, git } = secretSandbox();
  try {
    fs.writeFileSync(path.join(dir, "seed.txt"), "nothing to see here\n");
    git(["add", "-A"]);
    git(["commit", "-q", "-m", "seed: a clean tree"]);
    const clean = gate(["--only", "secret-scan", "--repo", dir, "--skip-network"]);
    assert.equal(clean.status, 0, `a clean tree passes the step: ${clean.stdout}${clean.stderr}`);

    // The payload is composed here so this suite carries no literal secret; the
    // step judges the fixture tree, not this file.
    const payload = ["d4f1a2b3", "c4d5e6f7", "a8b9c0d1", "e2f3a4b5"].join("");
    fs.writeFileSync(path.join(dir, "app.env"), `API_TOKEN="${payload}"\n`);
    git(["add", "-A"]);
    git(["commit", "-q", "-m", "feat: a leak"]);
    const leaked = gate(["--only", "secret-scan", "--repo", dir, "--skip-network"]);
    assert.equal(leaked.status, 1, `the gate must refuse the tree: ${leaked.stdout}${leaked.stderr}`);
    assert.match(leaked.stdout, /FINDING app\.env:1 — credential-assignment/);
    assert.match(leaked.stderr, /FAILED at secret-scan/);
    assert.match(leaked.stdout, /secret-scan: exit 1/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the network steps are exactly the ones that read the registry or install a tarball", () => {
  const network = STEPS.filter((step) => step.network).map((step) => step.id);
  assert.deepEqual(network, [
    "workspace-install",
    "pi-compat-guard",
    "dependency-pin-gate",
    "dependency-advisories",
  ]);
});

/* -------------------------------------------------------------- selection */

test("--list prints every step id in table order", () => {
  const result = gate(["--list"]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.stdout.trim().split("\n"), STEPS.map((step) => step.id));
});

test("--dry-run prints the selection in table order and runs nothing", () => {
  const result = gate(["--only", "root-suite,workspace-install", "--skip-network", "--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /1 step\(s\)/, "only the offline step of the two remains");
  assert.match(result.stdout, /plan: root-suite — /);
  assert.doesNotMatch(result.stdout, /plan: workspace-install/, "the skipped network step is not planned");
});

test("--dry-run plans every step when no filter is given", () => {
  const result = gate(["--dry-run"]);
  assert.equal(result.status, 0, result.stderr);
  const planned = [...result.stdout.matchAll(/^plan: (\S+)/gm)].map((match) => match[1]);
  // A range-bound step has nothing to verify without a push range: the full run
  // drops it rather than failing on an absent base (issue #514 S4).
  assert.deepEqual(planned, STEPS.filter((step) => !step.pushBase).map((step) => step.id));
});

test("an unknown step id is a usage error that names the flag", () => {
  const result = gate(["--only", "does-not-exist"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown step does-not-exist/);
  assert.match(result.stderr, /--list/);
});

test("an unknown flag is a usage error", () => {
  const result = gate(["--nope"]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown argument --nope/);
});

test("a network-only selection under --skip-network runs nothing and says so", () => {
  const result = gate(["--only", "dependency-pin-gate", "--skip-network"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /nothing to run/);
});

/* ------------------------------------------------------------- fail-fast */

test("fail-fast stops dispatching at the first red", () => {
  const dir = sandbox();
  try {
    // Both scripts are absent from the sandbox, so the first step fails on a
    // missing module. Steps without a shared dependency dispatch concurrently,
    // so the observable is the verdict, not the banner order.
    const result = gate(["--only", "root-suite,version-parity-content", "--repo", dir]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /\[1\/2\] (root-suite|version-parity-content)/);
    // The two steps share no dependency, so both dispatch concurrently and
    // whichever red lands first owns the "FAILED at" line — that identity is
    // a race, the verdict is not.
    assert.match(result.stderr, /FAILED at (root-suite|version-parity-content)/);
    assert.match(result.stderr, /fix it, then re-run/, "the failure names the workflow job it mirrors");
    assert.doesNotMatch(result.stdout, /PASS/, "a red run never prints the PASS verdict");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("--no-bail runs the whole selection and reports every red", () => {
  const dir = sandbox();
  try {
    const result = gate(["--only", "root-suite,version-parity-content", "--repo", dir, "--no-bail"]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /\[1\/2\] root-suite/);
    assert.match(result.stdout, /\[2\/2\] version-parity-content/);
    assert.match(result.stderr, /FAILED root-suite/);
    assert.match(result.stderr, /FAILED version-parity-content/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* ------------------------------------------------------------- parallel steps */

/* The gate runs its steps in a bounded worker pool (one worker per CPU by
 * default, `--jobs` caps it), with a dependency graph that keeps the steps
 * whose outputs race apart from ever running at the same time. The heavy steps
 * are still never run here: these cases drive the exported scheduler with a
 * mock runner, so no suite, install or registry read happens. */

test("the dependency map is closed over the step table, acyclic and self-free", () => {
  const ids = new Set(STEPS.map((step) => step.id));
  for (const [id, deps] of Object.entries(DEPS)) {
    assert.ok(ids.has(id), `DEPS names ${id}, which is not a declared step`);
    for (const dep of deps) {
      assert.ok(ids.has(dep), `${id} depends on ${dep}, which is not a declared step`);
      assert.notEqual(dep, id, `${id} cannot depend on itself`);
    }
  }
  for (const step of STEPS) {
    assert.ok(Array.isArray(DEPS[step.id]), `${step.id} is missing from DEPS — the map is closed`);
  }
  // DFS from every id: no cycle may come back.
  const visiting = new Set();
  const done = new Set();
  const visit = (id) => {
    if (done.has(id)) return;
    assert.ok(!visiting.has(id), `the dependency graph has a cycle through ${id}`);
    visiting.add(id);
    for (const dep of DEPS[id] ?? []) visit(dep);
    visiting.delete(id);
    done.add(id);
  };
  for (const id of ids) visit(id);
});

test("the dist producer and every step that reads or rebuilds dist depend on schema-build", () => {
  // schema-build's tsc writes dist/; schema-node-compat's own tsc writes the
  // same tree, the suites resolve dist at import time, and pi-compat-guard
  // links the schema package from the folder and reads the very same types
  // (issue #429). Concurrent runs would race on the same bytes — the graph is
  // what keeps them apart.
  for (const consumer of ["schema-node-compat", "crate-suite-bun", "crate-suite-node", "root-suite", "pi-compat-guard"]) {
    assert.ok(DEPS[consumer].includes("schema-build"), `${consumer} must wait for schema-build`);
  }
  assert.deepEqual(DEPS["schema-build"], ["workspace-install"], "the build itself waits only for the install");
  for (const consumer of ["schema-build", "crate-suite-bun", "crate-suite-node", "schema-node-compat", "pi-node-compat"]) {
    assert.ok(DEPS[consumer].includes("workspace-install"), `${consumer} must wait for the frozen-lockfile install`);
  }
});

test("the schema dist writer waits for the root-suite reader that spawns the crate CLI", () => {
  // schema-node-compat's tsc rewrites packages/agentic-workflow-schema/dist;
  // the root suites spawn the crate CLI, whose workspace import resolves that
  // same dist. Under the worker pool the two steps would overlap, and a reader
  // between two tsc emissions sees a half-written dist
  // ('does not provide an export named ...') — observed, intermittent. The
  // writer therefore waits for the reader.
  assert.ok(
    DEPS["schema-node-compat"].includes("root-suite"),
    "schema-node-compat must run after root-suite, or a root suite can import a half-written dist",
  );
});

test("S9: every dist writer is chained and no reader overlaps a writer", () => {
  // The DEPS comment above promises exactly this ("a reader between two
  // emissions imports a half-written module"), but only schema-node-compat
  // carried the edge: the crate steps' package scripts re-run that tsc while
  // root-suite spawns the CLI that imports it, the two crate steps are
  // siblings (so their two tsc runs overlap each other), and pi-compat-guard /
  // pi-node-compat read the very same dist with no writer edge at all
  // (owner amendment S9, 2026-11-15).
  assert.ok(DEPS["crate-suite-bun"].includes("root-suite"), "crate-suite-bun re-emits dist while root-suite reads it — it must wait for the reader");
  assert.ok(DEPS["crate-suite-node"].includes("crate-suite-bun"), "the two package-script tsc runs must never overlap each other");
  assert.ok(DEPS["schema-node-compat"].includes("crate-suite-node"), "schema-node-compat's own tsc waits for the last crate writer");
  assert.ok(DEPS["pi-compat-guard"].includes("schema-node-compat"), "pi-compat-guard reads the schema's types after the last writer");
  assert.ok(DEPS["pi-node-compat"].includes("schema-node-compat"), "pi-node-compat imports the schema package after the last writer");
  assert.deepEqual(DEPS["root-suite"], ["workspace-install", "schema-build"], "root-suite keeps its slot: the common red must not wait behind the crate suites");
});

test("S9: --jobs auto sizes the pool from the load, capped at the default", async () => {
  const { autoJobs } = await import("./local-gate.mjs");
  assert.equal(typeof autoJobs, "function", "autoJobs is exported for the hook's sizing policy");
  assert.equal(autoJobs(0.2, 6, 4), 4, "an idle machine keeps the default");
  assert.equal(autoJobs(3, 6, 4), 2, "half the cores busy halves the pool");
  assert.equal(autoJobs(6, 6, 4), 1, "a saturated machine runs one worker");
  assert.equal(autoJobs(12.5, 6, 4), 1, "load above the core count still one worker");
  assert.equal(autoJobs(0.1, 1, 1), 1, "never below one worker");
});

test("S9: the gate accepts --jobs auto as a bounded worker count", () => {
  const result = gate(["--only", "version-parity-content", "--jobs", "auto", "--skip-network"]);
  assert.equal(result.status, 0, `--jobs auto is a legal value (status ${result.status}: ${result.stderr})`);
});

test("S9: the push hook passes an explicit, overridable jobs budget on every exec line", () => {
  const body = hookBody();
  assert.match(body, /jobs_flag="--jobs \$\{AGENTIC_WORKFLOW_GATE_JOBS:-auto\}"/, "the hook sizes itself from the load, overridable per machine");
  assert.equal((body.match(/\$jobs_flag/g) ?? []).length, 4, "all four exec lines carry the jobs budget");
});

/** A mock runner: each step's duration and exit status come from its row. */
function mockRunner(timeline) {
  const events = [];
  let running = 0;
  let maxObserved = 0;
  const runStep = async (step) => {
    const row = { ms: 5, exit: 0, ...timeline[step.id] };
    events.push({ id: step.id, event: "start", running: running + 1 });
    running += 1;
    maxObserved = Math.max(maxObserved, running);
    await new Promise((resolve) => setTimeout(resolve, row.ms));
    running -= 1;
    events.push({ id: step.id, event: "end", exit: row.exit });
    return row.exit;
  };
  return { runStep, events, peak: () => maxObserved };
}

const stepsOf = (...ids) => ids.map((id) => ({ id, title: id, argv: ["mock"] }));

test("scheduleSteps never starts a step before its dependencies passed", async () => {
  const graph = { a: [], b: ["a"], c: [] };
  const mock = mockRunner({ a: { ms: 30 }, b: { ms: 5 }, c: { ms: 5 } });
  const result = await scheduleSteps(stepsOf("c", "b", "a"), mock.runStep, { jobs: 3, deps: graph });
  assert.equal(result.failures.length, 0);
  const bStart = mock.events.findIndex((e) => e.id === "b" && e.event === "start");
  const aEnd = mock.events.findIndex((e) => e.id === "a" && e.event === "end");
  assert.ok(bStart > aEnd, "b started before its dependency a finished");
});

test("scheduleSteps caps concurrency at the worker count", async () => {
  const graph = { a: [], b: [], c: [], d: [] };
  const mock = mockRunner({});
  await scheduleSteps(stepsOf("a", "b", "c", "d"), mock.runStep, { jobs: 2, deps: graph });
  assert.ok(mock.peak() <= 2, `observed ${mock.peak()} concurrent steps with jobs=2`);
});

test("scheduleSteps with bail stops dispatching after the first red", async () => {
  const graph = { a: [], b: [], c: ["b"] };
  const mock = mockRunner({ a: { ms: 5 }, b: { ms: 10, exit: 1 }, c: { ms: 5 } });
  const result = await scheduleSteps(stepsOf("a", "b", "c"), mock.runStep, { jobs: 3, deps: graph, bail: true });
  assert.equal(result.status, 1);
  assert.ok(result.failures.some((step) => step.id === "b"));
  assert.equal(mock.events.some((e) => e.id === "c"), false, "the dependent of a failed step started under bail");
});

test("without bail a failed step's dependents are skipped, transitively, and the rest still run", async () => {
  const graph = { a: [], b: ["a"], c: ["b"], d: [] };
  const mock = mockRunner({ a: { ms: 5, exit: 1 }, b: { ms: 5 }, c: { ms: 5 }, d: { ms: 5 } });
  const result = await scheduleSteps(stepsOf("a", "b", "c", "d"), mock.runStep, { jobs: 2, deps: graph, bail: false });
  assert.equal(result.status, 1);
  assert.deepEqual(result.skipped.map((step) => step.id), ["b", "c"], "skipped = the failed step's transitive dependents");
  assert.ok(result.failures.some((step) => step.id === "a"));
  assert.ok(mock.events.some((e) => e.id === "d"), "an unrelated step was skipped too");
});

test("a dependency outside the selection is satisfied, never a deadlock", async () => {
  // --only and --skip-network remove steps from the selection; a step whose
  // prerequisite was filtered out cannot wait for it forever.
  const graph = { a: ["missing"], b: [] };
  const mock = mockRunner({});
  const result = await scheduleSteps(stepsOf("a", "b"), mock.runStep, { jobs: 2, deps: graph });
  assert.equal(result.failures.length, 0);
  assert.ok(mock.events.some((e) => e.id === "a"));
});

test("--jobs accepts a positive integer and refuses everything else", () => {
  assert.equal(gate(["--only", "version-parity-content", "--jobs", "2", "--skip-network"]).status, 0);
  const zero = gate(["--jobs", "0"]);
  assert.equal(zero.status, 2);
  assert.match(zero.stderr, /--jobs needs a positive integer/);
  const junk = gate(["--jobs", "four"]);
  assert.equal(junk.status, 2);
  assert.match(junk.stderr, /--jobs needs a positive integer/);
});

/* ------------------------------------------------------------ pi floor */

test("peerFloor reads the lower bound of every shape a peer spec legitimately uses", () => {
  assert.equal(peerFloor(">=1.1.0"), "1.1.0");
  assert.equal(peerFloor("^2.3.4"), "2.3.4");
  assert.equal(peerFloor("~2.3.4"), "2.3.4");
  assert.equal(peerFloor("=2.3.4"), "2.3.4");
  assert.equal(peerFloor("2.3.4"), "2.3.4");
  assert.equal(peerFloor(">=1.1.0 <3"), "1.1.0", "a two-sided range floors at its lower bound");
  assert.equal(peerFloor("  >= 1.2 "), "1.2", "a partial release is still a floor");
});

test("peerFloor refuses a spec with no lower bound instead of testing the wrong version", () => {
  for (const spec of ["*", "latest", "next", "", null, undefined]) {
    assert.equal(peerFloor(spec), null, `${JSON.stringify(spec)} has no floor to test`);
  }
});

// The guard copies `src/` into a scratch project and installs what `src/
// imports`. Forgetting the package's own dependencies type-checks against a
// project where their specifiers resolve to nothing (issue #429 advisory):
// every `@gtrabanco/agentic-workflow/src/…` import became TS2307.
test("the guard installs the package's own workspace dependencies, linked from the folder", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "packages/pi-agentic-workflow/package.json"), "utf8"));
  const dirs = workspacePackageDirs(ROOT);
  const { specs, missing } = piCompatInstalls(manifest, "1.1.0", dirs);
  assert.deepEqual(missing, [], "a @gtrabanco dependency with no workspace sibling is reported, never skipped");
  assert.ok(specs.includes("@earendil-works/pi-coding-agent@1.1.0"), "the pi peer is installed at the leg under test");
  assert.ok(specs.includes("@earendil-works/pi-tui@1.1.0"), "the tui peer travels with the pi peer");
  for (const [name, spec] of Object.entries(manifest.dependencies ?? {})) {
    if (dirs.has(name)) {
      const entry = specs.find((e) => e.startsWith(`${name}@file:`));
      assert.ok(entry, `${name} is installed from the folder, not from a published version that may lag src/`);
      assert.equal(entry, `${name}@file:${dirs.get(name)}`, "the spec names the workspace directory itself");
    } else {
      assert.ok(specs.includes(`${name}@${spec}`), `${name} (third-party) installs at its declared spec`);
    }
  }
});

test("a workspace dependency with no sibling is reported, never silently dropped", () => {
  const { specs, missing } = piCompatInstalls({ dependencies: { "@gtrabanco/not-a-sibling": "1.0.0" } }, "2.0.0", new Map());
  assert.deepEqual(missing, ["@gtrabanco/not-a-sibling"]);
  assert.equal(specs.filter((entry) => entry.startsWith("@gtrabanco/not-a-sibling")).length, 0);
});

// Issue #260 added the first third-party runtime dependency (the pinned
// pi-extensible-workflows substrate): it has no workspace sibling and its
// published version is exactly what consumers install, so the guard installs
// it at the declared spec instead of refusing the whole guard. Only workspace
// packages need the folder link — their src/ is what our src/ imports.
test("a third-party dependency installs at its declared spec, not a refusal", () => {
  const dirs = new Map([["@gtrabanco/agentic-workflow", "/ws/packages/agentic-workflow"]]);
  const { specs, missing } = piCompatInstalls(
    { dependencies: { "@gtrabanco/agentic-workflow": "4.10.0", "pi-extensible-workflows": "6.3.0" } },
    "1.1.0",
    dirs,
  );
  assert.deepEqual(missing, [], "a published dependency is not a missing workspace sibling");
  assert.ok(specs.includes("pi-extensible-workflows@6.3.0"), "installed at the pinned spec the consumers get");
  assert.ok(specs.includes("@gtrabanco/agentic-workflow@file:/ws/packages/agentic-workflow"), "workspace siblings still link from the folder");
});

test("the guard's floor leg is the floor the pi manifest declares, not a typed literal", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "packages/pi-agentic-workflow/package.json"), "utf8"));
  const floor = peerFloor(manifest.peerDependencies?.["@earendil-works/pi-coding-agent"]);
  assert.equal(floor, "1.1.0", "a manifest floor the guard cannot read is a guard testing nothing");
  assert.match(
    fs.readFileSync(path.join(ROOT, "packages/pi-agentic-workflow/README.md"), "utf8"),
    new RegExp(`peer floor Pi ${floor.replaceAll(".", "\\.")}`),
    "the README floor sentence and the guard's floor leg are one fact",
  );
});

/* ------------------------------------------------------------------ hook */

test("--install-hook writes an executable pre-push that runs the offline subset", () => {
  const dir = sandbox();
  try {
    const result = gate(["--install-hook", "--repo", dir]);
    assert.equal(result.status, 0, result.stderr);
    const hook = path.join(dir, ".git", "hooks", "pre-push");
    const body = fs.readFileSync(hook, "utf8");
    assert.equal(body, hookBody());
    assert.ok((fs.statSync(hook).mode & 0o111) !== 0, "the hook is executable, or git ignores it");
    assert.match(body, /scripts\/local-gate\.mjs" --skip-network/);
    assert.match(body, /AGENTIC_WORKFLOW_SKIP_LOCAL_GATE/);
    assert.match(body, /git rev-parse --show-toplevel/, "the hook works from any subdirectory");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("an older gate-owned hook is replaced without --force (issue #580)", () => {
  const dir = sandbox();
  try {
    assert.equal(gate(["--install-hook", "--repo", dir]).status, 0);
    const hook = path.join(dir, ".git", "hooks", "pre-push");
    // The body an earlier release installed: still this gate's hook, one line behind.
    const stale = fs.readFileSync(hook, "utf8").replace("${AGENTIC_WORKFLOW_GATE_JOBS:-auto}", "auto");
    assert.notEqual(stale, hookBody(), "the fixture must differ from the current body");
    fs.writeFileSync(hook, stale);
    const replaced = gate(["--install-hook", "--repo", dir]);
    assert.equal(replaced.status, 0, `an older body is still this gate's hook: ${replaced.stdout}${replaced.stderr}`);
    assert.equal(fs.readFileSync(hook, "utf8"), hookBody());
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("--install-hook is idempotent", () => {
  const dir = sandbox();
  try {
    assert.equal(gate(["--install-hook", "--repo", dir]).status, 0);
    const again = gate(["--install-hook", "--repo", dir]);
    assert.equal(again.status, 0, again.stderr);
    assert.match(again.stdout, /already installed/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a foreign pre-push hook is refused without --force and replaced with it", () => {
  const dir = sandbox();
  try {
    const hook = path.join(dir, ".git", "hooks", "pre-push");
    fs.writeFileSync(hook, "#!/bin/sh\necho mine\n");
    const refused = gate(["--install-hook", "--repo", dir]);
    assert.equal(refused.status, 2);
    assert.match(refused.stderr, /--force/);
    assert.equal(fs.readFileSync(hook, "utf8"), "#!/bin/sh\necho mine\n", "the refusal leaves the foreign hook alone");

    const forced = gate(["--install-hook", "--repo", dir, "--force"]);
    assert.equal(forced.status, 0, forced.stderr);
    assert.equal(fs.readFileSync(hook, "utf8"), hookBody());
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("--install-hook outside a git checkout is a usage error", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "local-gate-nogit-"));
  try {
    const result = gate(["--install-hook", "--repo", dir]);
    assert.equal(result.status, 2);
    assert.match(result.stderr, /not a git checkout/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the hook body never carries a hard-coded checkout path", () => {
  const body = hookBody();
  assert.doesNotMatch(body, new RegExp(ROOT.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), "the hook resolves its root at run time");
});

/* ------------------------------------------------- impact-gated test steps */

/** The step ids a prose-only push must skip — the suites and the build their suites resolve. */
const TEST_STEP_IDS = [
  "schema-build",
  "crate-suite-bun",
  "crate-suite-node",
  "root-suite",
  "schema-node-compat",
  "pi-node-compat",
];

test("the test-bearing steps are exactly the suites and the build their suites resolve", () => {
  const marked = STEPS.filter((step) => step.tests).map((step) => step.id);
  assert.deepEqual(marked, TEST_STEP_IDS);
  for (const step of STEPS.filter((step) => !step.network)) {
    assert.equal(typeof step.tests, "boolean", `${step.id} declares its tests marker`);
  }
});

test("parseImpactVerdict reads the fixed TEST IMPACT block and nothing else", () => {
  assert.equal(
    parseImpactVerdict([
      "TEST IMPACT — empty",
      "verdict: empty",
      "tier: rg",
      "changed: 1",
      "executable: 0",
      "suites (0):",
      "symbols:",
      "reason: no executable path changed — record this verdict, run no TDD ceremony, invent no test",
    ].join("\n")),
    "empty",
  );
  assert.equal(parseImpactVerdict("TEST IMPACT — targeted\nverdict: targeted\ntier: rg\n"), "targeted");
  assert.equal(parseImpactVerdict("some other tool's stdout\nverdict: maybe"), "maybe");
  assert.equal(parseImpactVerdict(""), null, "no block, no verdict");
  assert.equal(parseImpactVerdict("TEST IMPACT —\nverdict:\n"), null, "an empty value is not a verdict");
});

/** A fixture checkout whose optional stub test-impact answers with a scripted verdict. */
function impactSandbox(stubBody) {
  const dir = sandbox();
  if (stubBody !== null) {
    fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
    fs.writeFileSync(path.join(dir, "scripts", "test-impact.mjs"), stubBody);
  }
  return dir;
}

const plannedSteps = (stdout) =>
  stdout
    .split("\n")
    .filter((line) => line.startsWith("plan: "))
    .map((line) => line.replace(/^plan: ([\w-]+).*/, "$1"));

test("--push-base with an empty verdict plans the gate without the test steps", () => {
  const dir = impactSandbox("process.stdout.write('TEST IMPACT — empty\\nverdict: empty\\n');\n");
  try {
    const result = gate([
      "--repo", dir, "--push-base", "HEAD", "--dry-run", "--skip-network",
    ]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(plannedSteps(result.stdout), [
      "version-parity-content",
      "docs-generated-projection",
      "journal-carrier-check",
      "log-immutability",
      "push-identity",
      "secret-scan",
      "temp-hygiene",
      "tmp-gc",
      "worktree-guard",
      "rigidity-review",
    ], "only the offline non-test steps survive an empty impact set");
    assert.match(result.stdout, /skipping .*test step/, "the skip names what it skipped and why");
    assert.match(result.stdout, /test-impact/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("--push-base with a targeted verdict (or any non-empty answer) runs every step", () => {
  const offlineIds = STEPS.filter((step) => !step.network).map((step) => step.id);
  for (const verdict of ["targeted", "something-else"]) {
    const dir = impactSandbox(`process.stdout.write('verdict: ${verdict}\\n');\n`);
    try {
      const result = gate(["--repo", dir, "--push-base", "HEAD", "--dry-run", "--skip-network"]);
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(plannedSteps(result.stdout), offlineIds);
      assert.match(result.stdout, /test step/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }
});

test("a refusing test-impact (non-zero exit) degrades to the full gate — never to a silent skip", () => {
  const dir = impactSandbox("process.exit(1);\n");
  try {
    const result = gate(["--repo", dir, "--push-base", "HEAD", "--dry-run", "--skip-network"]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(
      plannedSteps(result.stdout),
      STEPS.filter((step) => !step.network).map((step) => step.id),
    );
    assert.match(result.stdout, /could not be proven empty/, "the degrade says why the full gate ran");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a checkout with no test-impact script at all degrades to the full gate", () => {
  const dir = impactSandbox(null);
  try {
    const result = gate(["--repo", dir, "--push-base", "HEAD", "--dry-run", "--skip-network"]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(
      plannedSteps(result.stdout),
      STEPS.filter((step) => !step.network).map((step) => step.id),
    );
    assert.match(result.stdout, /could not be proven empty/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("without --push-base no impact check runs and every offline step is planned", () => {
  const dir = impactSandbox("process.stdout.write('verdict: empty\\n');\n");
  try {
    const result = gate(["--repo", dir, "--dry-run", "--skip-network"]);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(
      plannedSteps(result.stdout),
      STEPS.filter((step) => !step.network && !step.pushBase).map((step) => step.id),
      "the optimization only exists when a base proves it; a range-bound step has no range here",
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the hook reads the push refs from stdin and passes a proven base to the gate", () => {
  const body = hookBody();
  assert.match(body, /while read/, "pre-push delivers the refs on stdin");
  assert.match(body, /if \[ -n "\$base" \]/, "the gate gets --push-base only when a base was proven");
  assert.match(body, /--push-base "\$base"/);
  assert.match(body, /merge-base/, "a new branch falls back to the remote default branch");
});

/* ------------------------------------------------------- the machine result */

test("gateResultDocument keeps the step table's facts and marks an unattempted step not-run", () => {
  const document = gateResultDocument({
    steps: [
      { id: "root-suite", title: "Root suites" },
      { id: "schema-build", title: "Build" },
      { id: "docs", title: "Docs" },
    ],
    statuses: new Map([["root-suite", "passed"], ["schema-build", "failed"]]),
    exits: new Map([["root-suite", 0], ["schema-build", 1]]),
    durations: new Map([["root-suite", 12]]),
    outputs: new Map([["schema-build", {
      stdout: "x".repeat(OUTPUT_TAIL_BYTES + 10),
      stderr: "not ok 1 - the failing case\n",
    }]]),
    bail: true,
    jobs: 2,
    durationMs: 40,
    status: 1,
  });
  assert.equal(document.schema, GATE_RESULT_SCHEMA);
  assert.equal(document.status, 1);
  assert.equal(document.bail, true);
  assert.equal(document.jobs, 2);
  assert.deepEqual(document.steps.map((step) => step.status), ["passed", "failed", "not-run"]);
  assert.equal(document.steps[2].exit_code, null, "a step that never ran has no exit code");
  assert.equal(document.steps[1].stdout_tail.length, OUTPUT_TAIL_BYTES, "the kept tail is bounded");
  assert.match(document.steps[1].stderr_tail, /not ok 1/u);
});

test("--json writes the machine result beside the human log", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "local-gate-json-"));
  const target = path.join(dir, "result.json");
  try {
    const result = gate(["--only", "version-parity-content", "--json", target]);
    assert.equal(result.status, 0, result.stderr);
    const document = JSON.parse(fs.readFileSync(target, "utf8"));
    assert.equal(document.schema, GATE_RESULT_SCHEMA);
    assert.equal(document.steps.length, 1);
    assert.equal(document.steps[0].id, "version-parity-content");
    assert.equal(document.steps[0].status, "passed");
    assert.equal(document.steps[0].exit_code, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* ------------------------------------------------- issue #546 — the remote */

test("the hook passes the pushed remote to the gate (S3)", () => {
  const body = hookBody();
  assert.match(body, /remote="\$\{1:-\}"/, "pre-push delivers the remote name as its first argument");
  assert.match(body, /remote_flag="--remote \$remote"/, "the remote is resolved once, before the stdin loop runs");
  assert.match(body, /remote get-url "\$remote"/, "a name git does not know stays unnamed");
  assert.match(body, /--skip-network \$remote_flag/, "both runtimes pass it to the gate");
});

test("--remote reaches the range-bound step (S3)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "local-gate-remote-"));
  try {
    fs.mkdirSync(path.join(dir, ".git"), { recursive: true });
    fs.mkdirSync(path.join(dir, "scripts"), { recursive: true });
    const captured = path.join(dir, "argv.txt");
    fs.writeFileSync(
      path.join(dir, "scripts", "push-identity-check.mjs"),
      `import fs from "node:fs";\nfs.writeFileSync(${JSON.stringify(captured)}, process.argv.slice(2).join(" "));\n`,
    );
    const result = gate(["--only", "push-identity", "--repo", dir, "--push-base", "HEAD", "--remote", "upstream"]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const argv = fs.readFileSync(captured, "utf8");
    assert.match(argv, /--base HEAD/, "the proven range still reaches the step");
    assert.match(argv, /--remote upstream/, "the pushed remote reaches the step");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the installed hook fails the push, naming both runtimes, when neither is installed (S6)", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "local-gate-runtime-"));
  try {
    const init = spawnSync("git", ["init", "-q", dir], { encoding: "utf8" });
    assert.equal(init.status, 0, init.stderr);
    assert.equal(gate(["--install-hook", "--repo", dir]).status, 0);
    const hook = path.join(dir, ".git", "hooks", "pre-push");
    // A `PATH` carrying git and nothing else: the shape of a machine where the
    // gate's runtimes are not installed.
    const bin = path.join(dir, "bin");
    fs.mkdirSync(bin, { recursive: true });
    for (const name of ["git", "sh", "dirname", "uname"]) {
      const found = spawnSync("sh", ["-c", `command -v ${name}`], { encoding: "utf8" }).stdout.trim();
      if (found) fs.symlinkSync(found, path.join(bin, name));
    }
    const bash = spawnSync("sh", ["-c", "command -v bash"], { encoding: "utf8" }).stdout.trim() || "/bin/bash";
    const run = spawnSync(bash, [hook], {
      cwd: dir,
      encoding: "utf8",
      input: refLine("refs/heads/main", SOME_SHA, "refs/heads/main", ZERO_SHA),
      env: { PATH: bin, HOME: dir },
    });
    assert.equal(run.status, 1, `the push must not be let through: ${run.stdout}${run.stderr}`);
    assert.match(run.stderr, /bun/, "the message names bun");
    assert.match(run.stderr, /node/, "the message names node");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* ------------------------------- issue #580 — no ref to publish, worktrees */

test("a push that publishes nothing runs no range step (issue #580)", () => {
  const fixture = hookSandbox();
  try {
    assert.equal(gate(["--install-hook", "--repo", fixture.dir]).status, 0);
    const run = runHook(fixture, "");
    assert.equal(run.status, 0, `a push with nothing to send must be let through: ${run.stdout}${run.stderr}`);
    assert.match(run.stderr, /nothing to publish/, "the hook says why it has no range");
    assert.equal(fs.existsSync(fixture.recorded), false, "the gate never ran: a push that sends no ref update has no range");
  } finally {
    fs.rmSync(fixture.parent, { recursive: true, force: true });
  }
});

test("a deletion-only push publishes nothing (issue #580)", () => {
  const fixture = hookSandbox();
  try {
    assert.equal(gate(["--install-hook", "--repo", fixture.dir]).status, 0);
    const run = runHook(fixture, refLine("refs/heads/gone", ZERO_SHA, "refs/heads/gone", SOME_SHA));
    assert.equal(run.status, 0, `a deletion publishes no commit: ${run.stdout}${run.stderr}`);
    assert.match(run.stderr, /nothing to publish/);
    assert.equal(fs.existsSync(fixture.recorded), false, "the gate never ran");
  } finally {
    fs.rmSync(fixture.parent, { recursive: true, force: true });
  }
});

test("a single new branch keeps the merge-base fallback (issue #580)", () => {
  const fixture = hookSandbox();
  try {
    const base = fixture.git(["rev-parse", "HEAD"]);
    fs.writeFileSync(path.join(fixture.dir, "file.txt"), "two\n");
    fixture.git(["add", "."]);
    fixture.git(["commit", "-q", "-m", "two"]);
    fixture.git(["update-ref", "refs/remotes/origin/main", base]);
    assert.equal(gate(["--install-hook", "--repo", fixture.dir]).status, 0);
    const head = fixture.git(["rev-parse", "HEAD"]);
    const run = runHook(fixture, refLine("refs/heads/topic", head, "refs/heads/topic", ZERO_SHA));
    assert.equal(run.status, 0, run.stdout + run.stderr);
    const argv = fs.readFileSync(fixture.recorded, "utf8");
    assert.match(argv, new RegExp(`--push-base ${base}`), "a branch with no remote ref is judged against the mainline merge-base");
  } finally {
    fs.rmSync(fixture.parent, { recursive: true, force: true });
  }
});

test("several publishable refs leave the base unproven (issue #580)", () => {
  const fixture = hookSandbox();
  try {
    const mainline = fixture.git(["rev-parse", "HEAD"]);
    fs.writeFileSync(path.join(fixture.dir, "file.txt"), "two\n");
    fixture.git(["add", "."]);
    fixture.git(["commit", "-q", "-m", "two"]);
    // A resolvable mainline, so the fallback the case forbids is available to take.
    fixture.git(["update-ref", "refs/remotes/origin/main", mainline]);
    const head = fixture.git(["rev-parse", "HEAD"]);
    assert.equal(gate(["--install-hook", "--repo", fixture.dir]).status, 0);
    const stdin = refLine("refs/heads/a", SOME_SHA, "refs/heads/a", head) + refLine("refs/heads/b", SOME_SHA, "refs/heads/b", head);
    const run = runHook(fixture, stdin);
    assert.equal(run.status, 0, run.stdout + run.stderr);
    const argv = fs.readFileSync(fixture.recorded, "utf8");
    assert.equal(argv.includes("--push-base"), false, "no single proven base: the range-bound steps stay dropped");
    assert.match(argv, /--skip-network/, "the offline subset still runs");
  } finally {
    fs.rmSync(fixture.parent, { recursive: true, force: true });
  }
});

test("--install-hook installs the shared hook from a worktree (issue #580)", () => {
  const fixture = hookSandbox();
  const tree = path.join(fixture.parent, "tree");
  try {
    fixture.git(["worktree", "add", "-q", tree, "-b", "topic"]);
    const result = gate(["--install-hook", "--repo", tree]);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const shared = path.join(fixture.dir, ".git", "hooks", "pre-push");
    assert.equal(fs.readFileSync(shared, "utf8"), hookBody(), "a worktree's hooks live in the shared git dir");
  } finally {
    fs.rmSync(fixture.parent, { recursive: true, force: true });
  }
});
