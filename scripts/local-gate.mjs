#!/usr/bin/env node
/**
 * The gate, run locally — the same checks the remote workflow runs, in the same
 * order, stopping at the first failing step.
 *
 * Owner decision (AGENTS.md → Verification → "Where the gate runs"): the gate
 * is local-first. `.github/workflows/root-suite.yml` is manual only and runs
 * this script, so a push spends no runner minutes and the command a contributor
 * runs before pushing is byte-for-byte the command CI runs.
 *
 * Fail-fast is the default because that is what a local run is for: the first
 * red is the one to fix, and every later step would test a tree already known
 * to be broken. `--no-bail` runs the whole list and reports every red instead.
 *
 * A step marked `network: true` reads the registry (pin drift, advisories) or
 * installs a third-party tarball (`pi-compat-guard`). The `pre-push` hook runs
 * with `--skip-network`: a checkout whose registry is unreachable must not
 * block a push over a fact no commit changed. A full run before a merge keeps
 * them.
 *
 * Usage
 *   bun scripts/local-gate.mjs                   # every step, fail-fast
 *   bun scripts/local-gate.mjs --list            # step ids, one per line
 *   bun scripts/local-gate.mjs --only a,b        # a subset, in table order
 *   bun scripts/local-gate.mjs --skip-network    # the offline subset
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

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

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
    mirrors: "root-suite job — Build the schema package",
  },
  {
    id: "crate-suite-bun",
    title: "Crate suite (bun runtime)",
    cwd: "packages/agentic-workflow",
    argv: [BUN, "run", "test"],
    mirrors: "root-suite job — Crate suite (bun runtime)",
  },
  {
    id: "crate-suite-node",
    title: "Crate suite (node runtime)",
    cwd: "packages/agentic-workflow",
    argv: [BUN, "run", "test:node"],
    mirrors: "root-suite job — Crate suite (node runtime) and crate-node-compat",
  },
  {
    id: "root-suite",
    title: "Root suites (scripts/*.test.mjs)",
    cwd: ".",
    argv: [process.execPath, "scripts/run-root-suite.mjs", "--bail"],
    mirrors: "root-suite job — Root suites",
  },
  {
    id: "version-parity-content",
    title: "Pi package version-parity gate (content — offline)",
    cwd: ".",
    argv: [NODE, "scripts/version-parity-gate.mjs", "--content"],
    mirrors: "root-suite job — Pi package version-parity gate",
  },
  {
    id: "schema-node-compat",
    title: "Schema package (node runtime — the guaranteed fallback)",
    cwd: "packages/agentic-workflow-schema",
    argv: [BUN, "run", "test:node"],
    mirrors: "schema-node-compat job",
  },
  {
    id: "pi-node-compat",
    title: "Pi package (node runtime — the guaranteed fallback)",
    cwd: "packages/pi-agentic-workflow",
    argv: [BUN, "run", "test:node"],
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

const USAGE = [
  "usage: bun scripts/local-gate.mjs [--list] [--only <id,id>] [--skip-network]",
  "                                    [--no-bail] [--dry-run] [--install-hook [--force]]",
  "                                    [--repo <dir>]",
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
    bail: true,
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
    } else if (arg === "--skip-network") {
      options.skipNetwork = true;
    } else if (arg === "--no-bail") {
      options.bail = false;
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
  for (const leg of [floor, "latest"]) {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-compat-"));
    try {
      fs.cpSync(path.join(pkg, "src"), path.join(tmp, "src"), { recursive: true });
      for (const file of ["tsconfig.json", "package.json"]) {
        fs.copyFileSync(path.join(pkg, file), path.join(tmp, file));
      }
      process.stdout.write(`    pi leg ${leg}: installing…\n`);
      const install = spawnSync(
        "npm",
        [
          "install",
          "--ignore-scripts",
          "--no-save",
          "--no-package-lock",
          `${PI_PEER}@${leg}`,
          `${PI_TUI}@${leg}`,
        ],
        { cwd: tmp, stdio: "inherit" },
      );
      if (install.status !== 0) return install.status ?? 1;
      const tsc = spawnSync(path.join(tmp, "node_modules", ".bin", "tsc"), ["--noEmit"], { cwd: tmp, stdio: "inherit" });
      if (tsc.status !== 0) return tsc.status ?? 1;
      process.stdout.write(`    pi leg ${leg}: tsc --noEmit clean\n`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
  return 0;
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
# Escape hatch (record why in the PR): AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1

set -u

if [ "\${AGENTIC_WORKFLOW_SKIP_LOCAL_GATE:-}" = "1" ]; then
  echo "local gate: SKIPPED by AGENTIC_WORKFLOW_SKIP_LOCAL_GATE=1" >&2
  exit 0
fi

root="\$(git rev-parse --show-toplevel)" || exit 1

if command -v bun >/dev/null 2>&1; then
  exec bun "\$root/scripts/local-gate.mjs" --skip-network
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

function runStep(step, root) {
  if (step.run) return step.run({ root });
  const result = spawnSync(step.argv[0], step.argv.slice(1), {
    cwd: path.join(root, step.cwd ?? "."),
    stdio: "inherit",
  });
  if (result.error) {
    process.stderr.write(`local-gate: could not run ${step.argv[0]}: ${result.error.message}\n`);
    return 1;
  }
  return result.status ?? 1;
}

function main(argv) {
  const options = parseArgs(argv);

  if (options.list) {
    for (const step of STEPS) process.stdout.write(`${step.id}\n`);
    return 0;
  }
  if (options.installHook) return installHook(options);

  const selected = selectSteps(options);
  const skipped = selected.filter((step) => options.skipNetwork && step.network);
  const runnable = selected.filter((step) => !(options.skipNetwork && step.network));

  if (runnable.length === 0) {
    process.stdout.write("local-gate: nothing to run — every selected step is network-only\n");
    return 0;
  }

  process.stdout.write(`local-gate: ${runnable.length} step(s) · fail-fast ${options.bail ? "on" : "off"}\n`);
  if (skipped.length > 0) {
    process.stdout.write(`local-gate: skipping ${skipped.length} network step(s): ${skipped.map((step) => step.id).join(", ")}\n`);
  }

  if (options.dryRun) {
    for (const step of runnable) process.stdout.write(`plan: ${step.id} — ${step.title}\n`);
    return 0;
  }

  const started = Date.now();
  const failures = [];
  for (const [index, step] of runnable.entries()) {
    process.stdout.write(`\n[${index + 1}/${runnable.length}] ${step.id} — ${step.title}\n`);
    const status = runStep(step, options.root);
    if (status === 0) continue;
    failures.push(step);
    if (options.bail) {
      process.stderr.write(`\nlocal-gate: FAILED at ${step.id} (${step.mirrors})\n`);
      process.stderr.write(`local-gate: fix it, then re-run \`bun scripts/local-gate.mjs\`\n`);
      return 1;
    }
  }

  const seconds = Math.round((Date.now() - started) / 1000);
  if (failures.length > 0) {
    for (const step of failures) process.stderr.write(`local-gate: FAILED ${step.id} (${step.mirrors})\n`);
    return 1;
  }
  process.stdout.write(`\nlocal-gate: PASS — ${runnable.length} step(s) in ${seconds}s\n`);
  return 0;
}

// Run only as a program: the sibling suite imports the step table.
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
