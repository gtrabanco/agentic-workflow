#!/usr/bin/env node
/**
 * The migration window is closed (owner decision D4, issue #319).
 *
 * `docs/ROADMAP.md` is the only index a reader resolves. A repository that
 * still carries the pre-move path must be
 * **refused with a `roadmap-moved` pointer at its new home** — never parsed as
 * an empty index, never a stack trace, never a green verdict. This suite runs
 * every deterministic consumer against such a tree and pins that refusal,
 * because "fails closed" is a property of the whole machinery, not of one
 * module.
 *
 * Consumers pinned here: the router, the sensor, the unit cycle, the
 * vocabulary probe, the settle validator, the ceremony CLI and the crate's
 * `roadmap check`. The schema package's snapshot compiler is pinned in its own
 * suite (`packages/agentic-workflow-schema/test/machine-contract.test.mjs`),
 * where the built runtime exists.
 *
 * Two consumers are deliberately absent, each for its own reason:
 * `unit-route --triage` never reads the index (it routes a document by its own
 * sections), and `promise-coherence` is a repo-local gate over its own
 * checkout — it accepts no `--root`, so it cannot be pointed at a pre-move
 * tree. Its defensive catch around the same shared reader is exercised by the
 * vocabulary probe case below.
 *
 * Usage: node --test scripts/roadmap-moved.test.mjs
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The pre-move path, never spelled literally here: this file is inside `scripts/`. */
const LEGACY = ["docs", "features", "ROADMAP.md"].join("/");

const ROADMAP = [
  "# Roadmap",
  "",
  "| NN | Slug | Status | Depends on | Summary |",
  "|----|------|--------|------------|---------|",
  "| 90 | `alpha` | in-progress | — | a unit with no folder |",
  "",
].join("\n");

const FIXES = [
  "# Active fixes",
  "",
  "| Issue | Topic | Status | Notes |",
  "|---|---|---|---|",
  "| [#91](https://example.invalid/issues/91) | `beta` | in-progress | x |",
  "",
].join("\n");

/** The repo's own fix template: a unit doc triage accepts, so the refusal is the roadmap read. */
const UNIT_SPEC = fs.readFileSync(path.join(REPO, "docs", "fix", "_TEMPLATE", "SPEC.md"), "utf8");

/** A repository that only ever had the pre-319 layout. */
function preMoveTree() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "roadmap-moved-"));
  const write = (relative, content) => {
    const abs = path.join(root, relative);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf8");
  };
  write(LEGACY, ROADMAP);
  write("docs/fix/README.md", FIXES);
  write("docs/fix/91-beta/SPEC.md", UNIT_SPEC);
  write("docs/workflow/REPOSITORY_STATE.md", "# Normalized repository state\n\nStatus: frozen\n\nSnapshot: fix-1\n");
  // `unit-cycle --repo` requires a checkout that carries `scripts/`; the refusal
  // under test is the roadmap read, not that precondition.
  write("scripts/.keep", "");
  return root;
}

function run(args, { cwd, env = {} } = {}) {
  return spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    env: { ...process.env, ...env },
  });
}

const tree = preMoveTree();
test.after(() => fs.rmSync(tree, { recursive: true, force: true }));

/**
 * Every consumer's refusal: non-zero exit, the closed code on stderr (or in the
 * ceremony's JSON block), and no stdout that a driver could mistake for a
 * successful read.
 */
function assertRefused(result, label, { stdoutEmpty = true } = {}) {
  assert.notEqual(result.status, 0, `${label} must refuse the pre-move path (got exit 0)`);
  assert.match(`${result.stderr}${result.stdout}`, /roadmap-moved/, `${label} must name the closed code`);
  assert.match(`${result.stderr}${result.stdout}`, /docs\/ROADMAP\.md/, `${label} must point at the new path`);
  assert.doesNotMatch(`${result.stderr}`, /^\s+at .*\(.*:\d+:\d+\)/m, `${label} must not print a stack trace`);
  if (stdoutEmpty) assert.equal(result.stdout.trim(), "", `${label} must not print an index-derived document`);
}

test("the router refuses a pre-move repository", () => {
  const result = run([path.join(REPO, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "unit-route", "90"], { cwd: tree, env: { UNIT_ROUTE_REPO: tree } });
  assertRefused(result, "unit-route");
});

test("the sensor refuses and prints no envelope", () => {
  const result = run([path.join(REPO, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "workflow-status", "--json-only"], { cwd: tree });
  assertRefused(result, "workflow-status");
});

test("the unit cycle refuses instead of guessing a roadmap row", () => {
  const result = run([path.join(REPO, "scripts", "unit-cycle.mjs"), "--repo", tree, "90"], { cwd: tree });
  assertRefused(result, "unit-cycle");
});

test("a coherence probe pointed at a pre-move tree refuses instead of reporting a coherent corpus", () => {
  assertRefused(run([path.join(REPO, "scripts", "vocabulary-probe.mjs"), "--root", tree], { cwd: REPO }), "vocabulary-probe");
});

test("the settle validator refuses as a usage error", () => {
  const result = run([path.join(REPO, "scripts", "roadmap-settle.mjs"), "--root", tree], { cwd: REPO });
  assert.equal(result.status, 2, "settle answers a usage-level refusal");
  assert.match(result.stderr, /roadmap-moved/);
  assert.match(result.stderr, /docs\/ROADMAP\.md/);
});

test("the ceremony CLI blocks instead of deriving unit statuses", () => {
  const result = run([path.join(REPO, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "ceremony", "unit", "list"], { cwd: tree });
  assert.equal(result.status, 2, "a moved index is the ceremony's blocked class");
  assert.match(result.stdout, /"roadmap-moved"/, "the block names the closed code");
  assert.match(result.stdout, /docs\/ROADMAP\.md/, "the block points at the new path");
});

test("the crate's roadmap check refuses instead of reading the pre-move file", () => {
  const result = run(
    [path.join(REPO, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "roadmap", "check", "docs/fix/91-beta/SPEC.md"],
    { cwd: tree },
  );
  assert.equal(result.status, 2, "the crate refuses with its usage class");
  assert.match(result.stderr, /roadmap-moved/);
  assert.equal(result.stdout.trim(), "");
});
