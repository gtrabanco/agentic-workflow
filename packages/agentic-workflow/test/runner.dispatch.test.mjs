/**
 * runner.dispatch.test.mjs — issue #352 P1: the runner's module tree and its
 * closed dispatch table.
 *
 * The migration's contract is that the crate answers what the repository scripts
 * answered. The per-command behaviour is carried by the suites that travel with
 * their modules (`runner.sensors`, `runner.ceremony-p0`, `runner.ceremony-p1p2`,
 * `runner.unit-route`); this suite pins the layer beneath them — the modules
 * load from inside the published tree, the project root resolves from the
 * caller's working directory instead of the module's own, the catalog the
 * router validates ships with the package, and the table is the whole surface.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const src = (rel) => here(`../src/runner/${rel}`);

test("the support closure loads from inside the published tree", async () => {
  const phases = await import(src("unit-doc-phases.mjs"));
  assert.equal(typeof phases.parseUnitDocPhases, "function", "unit-doc-phases parses a unit doc");
  assert.equal(typeof phases.sectionBounds, "function", "unit-doc-phases locates a section");

  const tiers = await import(src("risk-tiers.mjs"));
  assert.deepEqual(tiers.RISK_TIER_KINDS, ["passive", "standard", "high"], "risk tiers come from the pinned schema package");
  assert.equal(typeof tiers.classifyTier, "function");

  const capabilities = await import(src("capabilities.mjs"));
  assert.equal(typeof capabilities.CAPABILITY_CONTRACT_ID, "string");

  const profile = await import(src("ceremony-profile.mjs"));
  assert.equal(typeof profile.readCeremonyProfile, "function");

  const route = await import(src("unit-route.mjs"));
  assert.equal(typeof route.run, "function", "the router exposes its CLI entry");
});

test("the project root follows the caller's working directory, not the module's", async () => {
  const { gitRoot } = await import(src("root.mjs"));
  const worktree = fileURLToPath(new URL("../../..", import.meta.url));
  assert.equal(gitRoot(join(worktree, "docs", "features")), worktree.replace(/\/$/u, ""), "a nested directory resolves to its worktree");
  assert.equal(gitRoot(worktree.replace(/\/$/u, "")), worktree.replace(/\/$/u, ""), "the worktree resolves to itself");
  const scratch = mkdtempSync(join(tmpdir(), "runner-root-"));
  try {
    mkdirSync(join(scratch, "inner"));
    assert.equal(gitRoot(join(scratch, "inner")), join(scratch, "inner"), "a non-repository directory is its own root");
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test("the router's catalog ships with the package and keeps its closed step list", () => {
  const catalogPath = src("catalog.json");
  assert.ok(existsSync(catalogPath), "the bundled catalog is part of the published tree");
  const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
  assert.equal(catalog.schemaVersion, 1);
  assert.deepEqual(catalog.steps, ["research", "design", "plan", "implement", "tests", "evidence", "review", "docs", "release"]);
});

test("the dispatch table is the whole surface and a foreign name is refused", async () => {
  const { isRunnerCommand, RUNNER_COMMANDS } = await import(src("cli.mjs"));
  assert.equal(isRunnerCommand("invented-command"), false, "a name outside the table is not a runner command");
  assert.deepEqual(
    Object.keys(RUNNER_COMMANDS),
    ["unit-route", "phase-lint", "diff-guard", "workflow-status", "pre-execution-snapshot", "needs-input", "ledger-provenance", "ceremony"],
    "the shell-visible half of the runner is exactly these commands: the router, the six sensors, and the ceremony registry",
  );
  for (const [name, handler] of Object.entries(RUNNER_COMMANDS)) {
    assert.equal(typeof handler, "function", `${name} is a function`);
  }
});

test("every sensor exposes its entry and none of them executes on import", async () => {
  const sensors = [
    ["phase-lint", "phase-lint.mjs"],
    ["diff-guard", "diff-guard.mjs"],
    ["workflow-status", "workflow-status.mjs"],
    ["pre-execution-snapshot", "pre-execution-snapshot.mjs"],
    ["needs-input", "needs-input.mjs"],
    ["ledger-provenance", "ledger-provenance.mjs"],
  ];
  for (const [name, file] of sensors) {
    // Importing is the whole assertion: a module that ran itself at import time
    // would answer a usage block into this test's own stdout, which is exactly
    // the defect the split from a script into a library removes.
    const module = await import(src(`sensors/${file}`));
    assert.equal(typeof module.run, "function", `${name} exposes its CLI entry`);
  }
});

test("the bin answers the router and refuses an unknown service in the closed world", () => {
  const bin = here("../bin/agentic-workflow.mjs");
  const routed = spawnSync(process.execPath, [bin, "unit-route", "--triage", "91-distributable-ceremony-runner", "--json"], { encoding: "utf8" });
  assert.equal(routed.status, 0, routed.stderr);
  const block = JSON.parse(routed.stdout);
  assert.equal(block.unit, "91-distributable-ceremony-runner");
  assert.ok(Array.isArray(block.steps) && block.steps.length === 9, "the triage still prints its nine-step block");

  const refused = spawnSync(process.execPath, [bin, "invented-command"], { encoding: "utf8" });
  assert.equal(refused.status, 2, "an unknown service is the closed-world exit 2");
  assert.match(refused.stderr, /Unknown service: invented-command/u);
});
