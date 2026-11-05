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
import { STEPS, hookBody, parseImpactVerdict, peerFloor, stepEnv } from "./local-gate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE = path.join(ROOT, "scripts", "local-gate.mjs");

const gate = (args, options = {}) =>
  spawnSync(process.execPath, [GATE, ...args], { cwd: options.cwd ?? ROOT, encoding: "utf8" });

/** A throwaway checkout: the hook installer only needs a `.git` directory. */
function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "local-gate-"));
  fs.mkdirSync(path.join(dir, ".git", "hooks"), { recursive: true });
  return dir;
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
  assert.deepEqual(planned, STEPS.map((step) => step.id));
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

test("fail-fast stops at the first red: the second step never starts", () => {
  const dir = sandbox();
  try {
    // Both scripts are absent from the sandbox, so the first step fails on a
    // missing module — the observable is whether the second one was announced.
    const result = gate(["--only", "root-suite,version-parity-content", "--repo", dir]);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /\[1\/2\] root-suite/);
    assert.doesNotMatch(result.stdout, /\[2\/2\]/);
    assert.match(result.stderr, /FAILED at root-suite/);
    assert.match(result.stderr, /Root suites/, "the failure names the workflow job it mirrors");
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
    assert.deepEqual(plannedSteps(result.stdout), ["version-parity-content"],
      "only the offline non-test step survives an empty impact set");
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
      STEPS.filter((step) => !step.network).map((step) => step.id),
      "the optimization only exists when a base proves it",
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
