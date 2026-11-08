#!/usr/bin/env node
/**
 * The gate, run locally — the same checks the remote workflow runs, in the same
 * order, with independent steps running concurrently in a bounded worker pool.
 *
 * Owner decision (AGENTS.md → Verification → "Where the gate runs"): the gate
 * is local-first. `.github/workflows/root-suite.yml` is manual only and runs
 * this script, so a push spends no runner minutes and the command a contributor
 * runs before pushing is byte-for-byte the command CI runs.
 *
 * Concurrency: `jobs` workers (one per CPU capped at 4 by default, `--jobs`
 * overrides) pull the next step whose prerequisites — the `DEPS` graph — have
 * all passed. The graph exists because table order no longer serializes the
 * steps: `schema-build`'s tsc writes dist/, and both the schema node-compat
 * step (its own tsc writes the same tree) and every suite that resolves dist
 * at import time depend on it. With bail — the default — the first red stops
 * the dispatch: in-flight steps finish and nothing new starts, so a red never
 * sends dependents against a broken prerequisite. `--no-bail` runs every
 * runnable step and reports the failed ones plus their skipped dependents.
 *
 * Fail-fast is the default because that is what a local run is for: the first
 * red is the one to fix, and every later step would test a tree already known
 * to be broken. `--no-bail` runs the whole list and reports every red instead.
 *
 * A step marked `network: true` reads the registry (pin drift, advisories) or
 * installs a third-party tarball (`pi-compat-guard`). The `pre-push` hook runs
 * with `--skip-network`: a registry that happens to be unreachable must not
 * block a push over a fact no commit changed. A full run before a merge keeps
 * them.
 *
 * A step marked `tests: true` runs a test suite (or the build the suites
 * resolve). The pre-push hook passes `--push-base <rev>`: the gate then runs
 * `scripts/test-impact.mjs` against the push range and, when the verdict is
 * `empty` (no executable path changed — prose and assets only), skips exactly
 * those steps. A `targeted` verdict, a refusal, or an absent test-impact
 * script all run the full gate — a skip is never inferred from a failed look
 * (unit 100).
 *
 * Usage
 *   bun scripts/local-gate.mjs                   # every step, fail-fast
 *   bun scripts/local-gate.mjs --list            # step ids, one per line
 *   bun scripts/local-gate.mjs --only a,b        # a subset, in table order
 *   bun scripts/local-gate.mjs --skip-network    # the offline subset
 *   bun scripts/local-gate.mjs --push-base <rev> # skip test steps on an empty impact verdict
 *   bun scripts/local-gate.mjs --jobs 2          # cap the worker count
 *   bun scripts/local-gate.mjs --no-bail         # run everything, report all
 *   bun scripts/local-gate.mjs --dry-run         # print the plan, run nothing
 *   bun scripts/local-gate.mjs --install-hook    # write .git/hooks/pre-push
 *   bun scripts/local-gate.mjs --install-hook --force   # replace a foreign hook
 *   bun scripts/local-gate.mjs --repo <dir>      # gate another checkout
 *
 * Exit: 0 all selected steps passed; 1 the first failed step; 2 usage error.
 *
 * Its sibling suite is `scripts/local-gate.test.mjs`.
 */

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { scrubGitLocator } from "./git-env.mjs";

const SCRIPT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BUN = process.env.AGENTIC_WORKFLOW_BUN ?? "bun";
const NODE = process.env.AGENTIC_WORKFLOW_NODE ?? "node";
const HOOK_MARKER = "scripts/local-gate.mjs --skip-network";

/**
 * The lowest version a consumer may install, read from a peer range.
 *
 * The two legs of the compatibility guard answer two different defects, and
 * neither replaces the other:
 *
 *   the floor   catches `src/` using an API that only exists above the declared
 *               floor — invisible to a `latest` run, and fatal for a consumer
 *               who installs the floor the manifest promises;
 *   `latest`    catches an upstream breaking change, which the floor run cannot
 *               see and which a range with no ceiling (`>=x.y.z`) accepts by
 *               construction.
 *
 * The floor is READ, never typed: a literal drifts from the manifest, and the
 * stale one this gate carried (`0.99.1`, below a `>=1.1.0` floor) was proving
 * compatibility with a version the package no longer claims. A spec with no
 * lower bound (a tag, `*`, a floating range) returns null and the step refuses
 * to run — a guard silently pinned to the wrong version proves nothing.
 */
export function peerFloor(spec) {
  const match = /^(?:>=|\^|~|=)?\s*(\d+\.\d+(?:\.\d+)?)/.exec(String(spec ?? "").trim());
  return match ? match[1] : null;
}

/** The pi peer the guard pins both legs against: the package under test requires
 * both, and they are published in lockstep, so one version string installs both. */
const PI_PEER = "@earendil-works/pi-coding-agent";
const PI_TUI = "@earendil-works/pi-tui";

/**
 * Every workspace package under the root manifest's `workspaces` patterns, by
 * published name. The compat guard needs the directory a dependency lives in,
 * and the workspace is the only place that answers it without a registry.
 */
export function workspacePackageDirs(root) {
  const dirs = new Map();
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  } catch {
    return dirs;
  }
  for (const pattern of manifest.workspaces ?? []) {
    if (!String(pattern).endsWith("/*")) continue;
    const base = path.join(root, String(pattern).slice(0, -2));
    let entries;
    try {
      entries = fs.readdirSync(base, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dir = path.join(base, entry.name);
      try {
        const workspace = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
        if (typeof workspace.name === "string") dirs.set(workspace.name, dir);
      } catch {
        // A directory without a manifest is not a workspace package.
      }
    }
  }
  return dirs;
}

/**
 * The npm install specs for one compat leg: the pi peers at the leg's version,
 * plus the package's own runtime dependencies, linked from their workspace
 * directories.
 *
 * Both halves are load-bearing. Without the peers there is no floor to test;
 * without the dependencies every `@gtrabanco/agentic-workflow/src/…` import in
 * `src/` resolves to nothing and `tsc` reports the guard's own blind spot as
 * five TS2307 — the failure this function exists to remove (issue #429). They
 * are linked from the folder rather than installed from the registry because
 * the source under test is this checkout, whose sibling packages may not be
 * published yet: a published pin would fail for a version skew the guard is not
 * asking about. A dependency with no workspace sibling comes back in `missing`
 * for the caller to report — a dropped dependency turns back into the silent
 * TS2307 above.
 */
export function piCompatInstalls(manifest, leg, workspaceDirByName) {
  const specs = [`${PI_PEER}@${leg}`, `${PI_TUI}@${leg}`];
  const missing = [];
  for (const name of Object.keys(manifest.dependencies ?? {})) {
    const dir = workspaceDirByName.get(name);
    if (!dir) {
      missing.push(name);
      continue;
    }
    specs.push(`${name}@file:${dir}`);
  }
  return { specs, missing };
}

/**
 * One row per check the remote gate carried before it became manual-only. The
 * `mirrors` field names the former job so a reader can trace a step back to the
 * workflow it replaced; `release-workflows.test.mjs` pins the id set.
 */
export const STEPS = [
  {
    id: "workspace-install",
    title: "Workspace install (frozen lockfile)",
    cwd: ".",
    argv: [BUN, "install", "--frozen-lockfile"],
    network: true,
    mirrors: "root-suite job — the per-package setup steps",
  },
  {
    id: "schema-build",
    title: "Build the schema package (the suites resolve its dist/)",
    cwd: "packages/agentic-workflow-schema",
    argv: [BUN, "run", "build"],
    tests: true,
    mirrors: "root-suite job — Build the schema package",
  },
  {
    id: "crate-suite-bun",
    title: "Crate suite (bun runtime)",
    cwd: "packages/agentic-workflow",
    argv: [BUN, "run", "test"],
    tests: true,
    mirrors: "root-suite job — Crate suite (bun runtime)",
  },
  {
    id: "crate-suite-node",
    title: "Crate suite (node runtime)",
    cwd: "packages/agentic-workflow",
    argv: [BUN, "run", "test:node"],
    tests: true,
    mirrors: "root-suite job — Crate suite (node runtime) and crate-node-compat",
  },
  {
    id: "root-suite",
    title: "Root suites (scripts/*.test.mjs)",
    cwd: ".",
    argv: [process.execPath, "scripts/run-root-suite.mjs", "--bail"],
    tests: true,
    mirrors: "root-suite job — Root suites",
  },
  {
    id: "version-parity-content",
    title: "Pi package version-parity gate (content — offline)",
    cwd: ".",
    argv: [NODE, "scripts/version-parity-gate.mjs", "--content"],
    tests: false,
    mirrors: "root-suite job — Pi package version-parity gate",
  },
  {
    id: "docs-generated-projection",
    title: "Generated docs projection is current (offline)",
    cwd: ".",
    argv: [NODE, "scripts/docs-generate.mjs", "--check"],
    tests: false,
    mirrors: "no former remote job — the projection staleness has no remote twin",
  },
  {
    id: "journal-carrier-check",
    title: "Journal fragment carrier is conforming (offline)",
    cwd: ".",
    argv: [NODE, "packages/agentic-workflow/bin/agentic-workflow.mjs", "journal", "aggregate", "--check"],
    // Not a `tests:` step on purpose: the pre-push hook skips test-bearing steps
    // on an empty test-impact verdict, and a prose-only push is exactly the push
    // that can carry a malformed fragment into `main` (issue #452 S3).
    tests: false,
    mirrors: "no former remote job — the carrier lint rides the pre-push offline subset and CI",
  },
  {
    id: "schema-node-compat",
    title: "Schema package (node runtime — the guaranteed fallback)",
    cwd: "packages/agentic-workflow-schema",
    argv: [BUN, "run", "test:node"],
    tests: true,
    mirrors: "schema-node-compat job",
  },
  {
    id: "pi-node-compat",
    title: "Pi package (node runtime — the guaranteed fallback)",
    cwd: "packages/pi-agentic-workflow",
    argv: [BUN, "run", "test:node"],
    tests: true,
    mirrors: "pi-node-compat job",
  },
  {
    id: "pi-compat-guard",
    title: "Type-check src against the declared peer floor and latest",
    run: piCompatGuard,
    network: true,
    mirrors: "pi-compat-guard job",
  },
  {
    id: "dependency-pin-gate",
    title: "Dependency-pin gate (registry — degraded when unreachable)",
    cwd: ".",
    argv: [NODE, "scripts/version-parity-gate.mjs", "--pins"],
    network: true,
    mirrors: "dependency-pin-gate job",
  },
  {
    id: "dependency-advisories",
    title: "Dependency advisories (OSV — report-only, never fails the gate)",
    cwd: ".",
    argv: [NODE, "scripts/dependency-advisory-pass.mjs"],
    network: true,
    mirrors: "dependency-pin-gate job",
  },
];

/**
 * The prerequisite ids per step id. The gate runs its steps in a bounded worker
 * pool, so steps that would race on the same bytes are held apart by the graph
 * instead of by table order: `schema-build`'s tsc writes dist/, and both the
 * schema node-compat step (its own tsc writes the same tree) and every suite
 * that resolves dist at import time depend on it. `schema-node-compat` also
 * waits for `root-suite`: its tsc re-emits the dist the root suites read
 * through the spawned crate CLI, and a reader between two emissions imports a
 * half-written module. `pi-compat-guard` links the package's workspace
 * dependencies into its scratch project (issue #429), so it reads the schema's
 * `dist/` types too and waits for the build that emits them. Every id must name
 * a declared
 * step, the map is closed over STEPS, and the graph is acyclic — all pinned by
 * `scripts/local-gate.test.mjs`.
 */
export const DEPS = {
  "workspace-install": [],
  "schema-build": ["workspace-install"],
  "crate-suite-bun": ["workspace-install", "schema-build"],
  "crate-suite-node": ["workspace-install", "schema-build"],
  "root-suite": ["workspace-install", "schema-build"],
  "version-parity-content": [],
  "docs-generated-projection": [],
  "journal-carrier-check": ["workspace-install"],
  "schema-node-compat": ["workspace-install", "schema-build", "root-suite"],
  "pi-node-compat": ["workspace-install"],
  "pi-compat-guard": ["schema-build"],
  "dependency-pin-gate": [],
  "dependency-advisories": [],
};

/** The default worker count: one per CPU, capped at 4 — the steps are full
 * suites that already parallelize internally, so more workers than that mainly
 * adds memory pressure on a laptop. */
export function defaultJobs() {
  return Math.min(4, Math.max(1, os.availableParallelism?.() ?? os.cpus().length));
}

/**
 * The dependency-aware worker pool: `jobs` workers pull the next step whose
 * prerequisites have all passed, so independent steps overlap while a step's
 * dependents wait. A prerequisite that is not in the selection (filtered out by
 * `--only` or `--skip-network`) counts as satisfied — a filtered step can never
 * be a deadlock.
 *
 * `bail` (the default) stops dispatching after the first red — in-flight steps
 * finish, nothing new starts, dependents of the red are never run. Without it,
 * every runnable step is attempted and a failed step's transitive dependents
 * are skipped and reported, never run against a broken prerequisite.
 *
 * `runStep` is `async (step) => exit`. Note for in-tree callers: the one `run:`
 * step (`pi-compat-guard`) shells out synchronously and blocks the event loop
 * for its duration — workers stall behind it, which is why it stays a network
 * step the push hook skips.
 */
export async function scheduleSteps(runnable, runStep, { jobs = defaultJobs(), bail = true, deps = DEPS } = {}) {
  const byId = new Map(runnable.map((step) => [step.id, step]));
  const statuses = new Map(); // id -> "passed" | "failed" | "skipped"
  const running = new Set();
  const failures = [];
  const skipped = [];
  let stop = false;
  let firstExit = null;
  let waiters = [];
  const notify = () => {
    const pending = waiters;
    waiters = [];
    for (const resolve of pending) resolve();
  };
  const wait = () => new Promise((resolve) => {
    waiters.push(resolve);
  });

  const prerequisites = (step) => (deps[step.id] ?? []).filter((id) => byId.has(id));
  const pickReady = () =>
    runnable.find(
      (step) =>
        !statuses.has(step.id) &&
        !running.has(step.id) &&
        prerequisites(step).every((id) => statuses.get(id) === "passed"),
    );

  const skipDependents = (failedId) => {
    let changed = true;
    while (changed) {
      changed = false;
      for (const step of runnable) {
        if (statuses.has(step.id)) continue;
        const blocked = prerequisites(step).some((id) => {
          const status = statuses.get(id);
          return status === "failed" || status === "skipped";
        });
        if (blocked) {
          statuses.set(step.id, "skipped");
          skipped.push(step);
          changed = true;
        }
      }
    }
  };

  const worker = async () => {
    for (;;) {
      if (stop) return;
      const step = pickReady();
      if (!step) {
        if (running.size === 0) return;
        await wait();
        continue;
      }
      // The worker owns its step: it awaits the run, so the number of
      // in-flight steps never exceeds the worker count and the pool cannot
      // resolve while a dispatched step is still in flight.
      running.add(step.id);
      let exit;
      try {
        exit = await runStep(step);
      } catch {
        exit = 1;
      }
      running.delete(step.id);
      if (exit === 0) {
        statuses.set(step.id, "passed");
      } else {
        statuses.set(step.id, "failed");
        failures.push(step);
        if (firstExit === null) firstExit = 1;
        if (bail) stop = true;
        else skipDependents(step.id);
      }
      notify();
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, jobs) }, worker));
  return { failures, skipped, statuses, status: failures.length > 0 ? 1 : 0 };
}

/**
 * One step as a promise: command steps spawn asynchronously and capture their
 * output, so parallel steps never interleave bytes mid-line — each step's
 * output prints atomically after its completion line. `run:` steps execute in
 * process and stream directly (they manage their own output).
 */
async function runStepAsync(step, root, onSpawnOutput) {
  if (step.run) return step.run({ root });
  return await new Promise((resolve) => {
    const child = spawn(step.argv[0], step.argv.slice(1), {
      cwd: path.join(root, step.cwd ?? "."),
      stdio: ["ignore", "pipe", "pipe"],
      env: stepEnv(),
    });
    const out = [];
    const err = [];
    child.stdout.on("data", (chunk) => out.push(chunk));
    child.stderr.on("data", (chunk) => err.push(chunk));
    child.on("error", (error) => {
      onSpawnOutput(Buffer.from(`local-gate: could not run ${step.argv[0]}: ${error.message}\n`), Buffer.alloc(0));
      resolve(1);
    });
    child.on("close", (code) => {
      onSpawnOutput(Buffer.concat(out), Buffer.concat(err));
      resolve(code ?? 1);
    });
  });
}

const USAGE = [
  "usage: bun scripts/local-gate.mjs [--list] [--only <id,id>] [--skip-network]",
  "                                    [--push-base <rev>] [--no-bail] [--jobs <n>] [--dry-run]",
  "                                    [--install-hook [--force]] [--repo <dir>]",
  "       (node fallback, same argv)",
].join("\n");

function usage(message) {
  process.stderr.write(`local-gate: ${message}\n${USAGE}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const options = {
    root: SCRIPT_ROOT,
    only: null,
    skipNetwork: false,
    pushBase: null,
    bail: true,
    jobs: null,
    dryRun: false,
    list: false,
    installHook: false,
    force: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo") {
      const value = argv[index + 1];
      if (!value) usage("--repo needs a directory");
      options.root = path.resolve(value);
      index += 1;
    } else if (arg === "--only") {
      const value = argv[index + 1];
      if (!value) usage("--only needs a comma-separated step list");
      options.only = value.split(",").map((id) => id.trim()).filter(Boolean);
      index += 1;
    } else if (arg === "--push-base") {
      const value = argv[index + 1];
      if (!value) usage("--push-base needs a revision");
      options.pushBase = value;
      index += 1;
    } else if (arg === "--skip-network") {
      options.skipNetwork = true;
    } else if (arg === "--no-bail") {
      options.bail = false;
    } else if (arg === "--jobs") {
      const value = argv[index + 1];
      if (value === undefined || !/^\d+$/.test(value) || Number(value) < 1) {
        usage(`--jobs needs a positive integer${value === undefined ? "" : `, got ${JSON.stringify(value)}`}`);
      }
      options.jobs = Number(value);
      index += 1;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--list") {
      options.list = true;
    } else if (arg === "--install-hook") {
      options.installHook = true;
    } else if (arg === "--force") {
      options.force = true;
    } else {
      usage(`unknown argument ${arg}`);
    }
  }
  return options;
}

/** The one check that is not a single command: the two pi legs of `tsc --noEmit`. */
function piCompatGuard({ root }) {
  const pkg = path.join(root, "packages/pi-agentic-workflow");
  const manifest = JSON.parse(fs.readFileSync(path.join(pkg, "package.json"), "utf8"));
  const spec = manifest.peerDependencies?.[PI_PEER];
  const floor = peerFloor(spec);
  if (!floor) {
    process.stderr.write(
      `local-gate: ${PI_PEER} peer spec ${JSON.stringify(spec)} carries no lower bound — the floor leg has nothing to test\n`,
    );
    return 1;
  }
  const dirs = workspacePackageDirs(root);
  for (const leg of [floor, "latest"]) {
    const { specs, missing } = piCompatInstalls(manifest, leg, dirs);
    if (missing.length > 0) {
      process.stderr.write(
        `local-gate: ${missing.join(", ")} declared as a dependency with no workspace sibling — \`src/\` would type-check against a project where it resolves to nothing\n`,
      );
      return 1;
    }
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-compat-"));
    try {
      fs.cpSync(path.join(pkg, "src"), path.join(tmp, "src"), { recursive: true });
      for (const file of ["tsconfig.json", "package.json"]) {
        fs.copyFileSync(path.join(pkg, file), path.join(tmp, file));
      }
      process.stdout.write(`    pi leg ${leg}: installing…\n`);
      const install = spawnSync(
        "npm",
        ["install", "--ignore-scripts", "--no-save", "--no-package-lock", ...specs],
        { cwd: tmp, stdio: "inherit", env: stepEnv() },
      );
      if (install.status !== 0) return install.status ?? 1;
      const tsc = spawnSync(path.join(tmp, "node_modules", ".bin", "tsc"), ["--noEmit"], { cwd: tmp, stdio: "inherit", env: stepEnv() });
      if (tsc.status !== 0) return tsc.status ?? 1;
      process.stdout.write(`    pi leg ${leg}: tsc --noEmit clean\n`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
  return 0;
}

/**
 * The `verdict:` line of the fixed `TEST IMPACT —` block `scripts/test-impact.mjs`
 * prints. Anything else — no block, an empty value — is not a verdict, and no
 * verdict never means skip.
 */
export function parseImpactVerdict(stdout) {
  const match = /^verdict:\s*(\S.*?)\s*$/m.exec(String(stdout ?? ""));
  return match ? match[1] : null;
}

/**
 * The impact half of `--push-base`: run the gated checkout's own test-impact
 * script against the base and read its verdict. A missing script, a non-zero
 * exit or an unreadable block all answer `null` — the caller then runs the
 * full gate, because a skip is only ever earned by a proven `empty`.
 */
function checkImpact(root, base) {
  const script = path.join(root, "scripts", "test-impact.mjs");
  if (!fs.existsSync(script)) {
    return { verdict: null, detail: `scripts/test-impact.mjs is absent from ${root}` };
  }
  const result = spawnSync(process.execPath, [script, "--base", base], {
    cwd: root,
    encoding: "utf8",
    env: stepEnv(),
  });
  const verdict = result.status === 0 ? parseImpactVerdict(result.stdout) : null;
  const firstLine = (result.stdout || result.stderr || "").split("\n").find((line) => line.trim()) ?? "";
  return { verdict, detail: result.status === 0 ? firstLine : `${script} exited ${result.status ?? "?"}: ${firstLine}` };
}

/** The hook body: banner, escape hatch, then the offline subset of this gate. */
export function hookBody() {
  return `#!/usr/bin/env bash
# Local gate on push — installed by \`bun scripts/local-gate.mjs --install-hook\`.
# Owner: AGENTS.md → Verification → "Where the gate runs".
#
# Runs the offline subset: a registry that happens to be unreachable must not
# block a push over a fact no commit changed. Run the full gate before merging.
#
# The push range is also checked with scripts/test-impact.mjs: when no
# executable path changed (prose and assets only), the test steps are skipped —
# anything unprovable runs the full gate. Unit 100.
#
# Escape hatch (record why in the PR): AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1

set -u

if [ "\${AGENTIC_WORKFLOW_SKIP_LOCAL_GATE:-}" = "1" ]; then
  echo "local gate: SKIPPED by AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1" >&2
  exit 0
fi

root="\$(git rev-parse --show-toplevel)" || exit 1

# One base per push: the remote tip of the single non-delete ref being pushed.
# A new branch (zero remote sha) falls back to the merge-base with the remote
# default branch; several refs, or anything unresolvable, leaves base empty and
# the gate runs every step.
base=""
while read -r _local_ref local_sha _remote_ref remote_sha; do
  case "\$local_sha" in *[!0]*) ;; *) continue ;; esac
  case "\$remote_sha" in *[!0]*) ;; *) continue ;; esac
  if [ -z "\$base" ]; then
    base="\$remote_sha"
  else
    base=""
    break
  fi
done
if [ -z "\$base" ]; then
  default_branch="\$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || echo origin/main)"
  base="\$(git merge-base HEAD "\$default_branch" 2>/dev/null || true)"
fi

if command -v bun >/dev/null 2>&1; then
  if [ -n "\$base" ]; then
    exec bun "\$root/scripts/local-gate.mjs" --skip-network --push-base "\$base"
  fi
  exec bun "\$root/scripts/local-gate.mjs" --skip-network
fi
if [ -n "\$base" ]; then
  exec node "\$root/scripts/local-gate.mjs" --skip-network --push-base "\$base"
fi
exec node "\$root/scripts/local-gate.mjs" --skip-network
`;
}

function installHook({ root, force }) {
  const hooks = path.join(root, ".git", "hooks");
  if (!fs.existsSync(path.join(root, ".git"))) usage(`${root} is not a git checkout`);
  fs.mkdirSync(hooks, { recursive: true });
  const target = path.join(hooks, "pre-push");
  const body = hookBody();

  if (fs.existsSync(target)) {
    const current = fs.readFileSync(target, "utf8");
    if (current === body) {
      process.stdout.write(`local-gate: ${target} already installed\n`);
      return 0;
    }
    if (!current.includes(HOOK_MARKER) && !force) {
      usage(`${target} exists and is not this gate's hook — re-run with --force to replace it`);
    }
  }

  fs.writeFileSync(target, body, { mode: 0o755 });
  fs.chmodSync(target, 0o755);
  process.stdout.write(`local-gate: installed ${target}\n`);
  process.stdout.write(`local-gate: full gate before a merge: bun scripts/local-gate.mjs\n`);
  return 0;
}

/** The steps this run selects, in table order. */
function selectSteps(options) {
  if (options.only) {
    const known = new Set(STEPS.map((step) => step.id));
    for (const id of options.only) {
      if (!known.has(id)) usage(`unknown step ${id} (--list prints the ids)`);
    }
    const wanted = new Set(options.only);
    return STEPS.filter((step) => wanted.has(step.id));
  }
  return STEPS;
}

/**
 * The environment a step inherits. The `pre-push` hook runs this gate with
 * `GIT_DIR` exported, and a suite that `git init`s a fixture directory under it
 * re-initializes the caller's repository instead (see `scripts/git-env.mjs`);
 * the locator variables are stripped once, here, so no fixture has to know.
 */
export function stepEnv() {
  return scrubGitLocator();
}

async function main(argv) {
  const options = parseArgs(argv);

  if (options.list) {
    for (const step of STEPS) process.stdout.write(`${step.id}\n`);
    return 0;
  }
  if (options.installHook) return installHook(options);

  const selected = selectSteps(options);

  // The impact gate (unit 100): a proven-empty push range skips the test
  // steps; every other answer — targeted, a refusal, an absent script — runs
  // the full selection.
  const skippedByImpact = [];
  if (options.pushBase) {
    const impact = checkImpact(options.root, options.pushBase);
    if (impact.verdict === "empty") {
      skippedByImpact.push(...selected.filter((step) => step.tests));
      process.stdout.write(
        `local-gate: skipping ${skippedByImpact.length} test step(s) — test-impact: empty since ${options.pushBase}` +
          `: ${skippedByImpact.map((step) => step.id).join(", ")}\n`,
      );
    } else {
      const detail = impact.verdict === null ? "could not be proven empty" : `verdict ${impact.verdict}`;
      process.stdout.write(
        `local-gate: the push range ${detail} (${impact.detail}) — the test step(s) run\n`,
      );
    }
  }

  const skipped = selected.filter((step) => options.skipNetwork && step.network);
  const runnable = selected.filter(
    (step) => !(options.skipNetwork && step.network) && !skippedByImpact.includes(step),
  );

  if (runnable.length === 0) {
    process.stdout.write("local-gate: nothing to run — every selected step is skipped\n");
    return 0;
  }

  process.stdout.write(
    `local-gate: ${runnable.length} step(s) · jobs ${options.jobs ?? defaultJobs()} · fail-fast ${options.bail ? "on" : "off"}\n`,
  );
  if (skipped.length > 0) {
    process.stdout.write(`local-gate: skipping ${skipped.length} network step(s): ${skipped.map((step) => step.id).join(", ")}\n`);
  }

  if (options.dryRun) {
    for (const step of runnable) process.stdout.write(`plan: ${step.id} — ${step.title}\n`);
    return 0;
  }

  const started = Date.now();
  const total = runnable.length;
  let dispatched = 0;
  const onSpawnOutput = (stdout, stderr) => {
    if (stdout.length > 0) process.stdout.write(stdout);
    if (stderr.length > 0) process.stderr.write(stderr);
  };
  const result = await scheduleSteps(
    runnable,
    async (step) => {
      dispatched += 1;
      const stepStarted = Date.now();
      process.stdout.write(`\n[${total - runnable.length + dispatched}/${total}] ${step.id} — ${step.title}\n`);
      const exit = await runStepAsync(step, options.root, onSpawnOutput);
      const verdict = exit === 0 ? "exit 0" : `exit ${exit}`;
      process.stdout.write(`${step.id}: ${verdict} in ${Math.round((Date.now() - stepStarted) / 1000)}s\n`);
      return exit;
    },
    { jobs: options.jobs ?? defaultJobs(), bail: options.bail },
  );

  const seconds = Math.round((Date.now() - started) / 1000);
  if (result.failures.length > 0) {
    const failed = result.failures.map((step) => step.id).join(", ");
    if (options.bail) {
      const first = result.failures[0];
      process.stderr.write(`\nlocal-gate: FAILED at ${first.id} (${first.mirrors})\n`);
      process.stderr.write(`local-gate: fix it, then re-run \`bun scripts/local-gate.mjs\`\n`);
    } else {
      for (const step of result.failures) {
        process.stderr.write(`local-gate: FAILED ${step.id} (${step.mirrors})\n`);
      }
      if (result.skipped.length > 0) {
        process.stderr.write(
          `local-gate: skipped ${result.skipped.length} dependent step(s): ${result.skipped.map((step) => step.id).join(", ")}\n`,
        );
      }
    }
    return 1;
  }
  if (dispatched < total) {
    process.stderr.write(`local-gate: not run: ${runnable.filter((step) => !result.statuses.has(step.id)).map((step) => step.id).join(", ")}\n`);
    return 1;
  }
  process.stdout.write(`\nlocal-gate: PASS — ${total} step(s) in ${seconds}s\n`);
  return 0;
}

// Run only as a program: the sibling suite imports the step table.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
