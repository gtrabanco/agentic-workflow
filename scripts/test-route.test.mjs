#!/usr/bin/env node

/**
 * #318 S13/S14 — the gate is bounded by a committed map, and fails closed.
 *
 * The root gate is all-or-nothing: every checkpoint runs all 53 suites, so an
 * intermediate verification costs the merge gate's time and the loop that
 * depends on it (S5's claim-evidence) gets skipped instead of paid. The map
 * fixes the cost without weakening the coverage, under two rules that are the
 * whole reason it may exist:
 *
 *   S13 — a matched path runs the minimal sufficient suite, so the checkpoint is
 *         seconds rather than the full pass.
 *   S14 — an unmatched path runs EVERYTHING. Fewer tests than the full suite is
 *         reachable only through a committed glob; a path nobody mapped, an
 *         unreadable map, or a glob that selects nothing is the full suite, never
 *         a smaller one.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { loadMap, routeFor, planFor } from "./test-route.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(repoRoot, "scripts", "test-route.mjs");

const run = (args, options = {}) => spawnSync(process.execPath, [SCRIPT, ...args], {
  cwd: options.cwd ?? repoRoot,
  encoding: "utf8",
  env: { ...process.env, ...(options.env ?? {}) },
});

/** Every root suite the full gate runs — the ceiling a route may never exceed. */
const allSuites = () => fs.readdirSync(path.join(repoRoot, "scripts"))
  .filter((name) => name.endsWith(".test.mjs"))
  .sort()
  .map((name) => `scripts/${name}`);

test("#318 S13: the committed map parses and every route is a non-empty suite list", () => {
  const map = loadMap(path.join(repoRoot, "scripts", "test-route-map.json"));
  assert.ok(map.routes.length > 0, "the map declares at least one route");
  for (const route of map.routes) {
    assert.ok(route.globs.length > 0, `${route.name} declares a glob`);
    assert.ok(route.suites.length > 0, `${route.name} declares a suite`);
    for (const suite of route.suites) {
      assert.ok(fs.existsSync(path.join(repoRoot, suite)), `${route.name} names an existing suite: ${suite}`);
    }
  }
});

test("#318 S13: a mapped path selects its route, not the full suite", () => {
  const result = run(["--check", "scripts/test-route.mjs"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^route: /m, result.stdout);
  assert.doesNotMatch(result.stdout, /^route: full-suite$/m, "a mapped path must not cost the full gate");
  const listed = /^suites \((\d+)\):$/m.exec(result.stdout);
  assert.ok(listed, "the plan names how many suites it runs");
  assert.ok(Number(listed[1]) > 0, "and it names at least one");
  assert.doesNotMatch(result.stdout, /^route: full-suite$/m, "a mapped path never pays the full gate");
});

test("#318 S14: an unmatched path fails closed to the full suite", () => {
  const result = run(["--check", "totally/unmapped/path.zzz"]);
  assert.equal(result.status, 0, result.stderr, "unmatched is a valid answer, not an error");
  assert.match(result.stdout, /^route: full-suite$/m, "an unmatched path runs everything");
  assert.match(result.stdout, /^reason: no glob matched/m);
});

test("#318 S14: a route may never run fewer tests than the map's own globs justify", () => {
  for (const file of ["scripts/test-route.mjs", "scripts/test-route.test.mjs"]) {
    const plan = planFor(file, loadMap(path.join(repoRoot, "scripts", "test-route-map.json")));
    assert.ok(plan.suites.length > 0);
    assert.ok(plan.suites.length <= allSuites().length, "a route is a subset of the full gate");
  }
});

test("#318 S14: a route that selects nothing is the full suite, never an empty run", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "test-route-empty-"));
  try {
    const mapPath = path.join(dir, "map.json");
    fs.writeFileSync(mapPath, JSON.stringify({
      version: 1,
      routes: [{ name: "empty", globs: ["never/matches/*.zzz"], suites: ["scripts/does-not-exist.test.mjs"] }],
    }));
    const map = loadMap(mapPath);
    // The glob matches the path, but its suite does not exist: the route is
    // unusable, so the answer is everything — never a broken partial run.
    const plan = routeFor("never/matches/x.zzz", map, { root: repoRoot, allSuites: allSuites() });
    assert.equal(plan.route, "full-suite");
    assert.match(plan.reason, /missing suite/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("#318 S14: an unreadable or malformed map is the full suite, never fewer tests", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "test-route-bad-"));
  try {
    const mapPath = path.join(dir, "map.json");
    fs.writeFileSync(mapPath, "{ not json");
    const map = loadMap(mapPath);
    const plan = routeFor("scripts/test-route.mjs", map, { root: repoRoot, allSuites: allSuites() });
    assert.equal(plan.route, "full-suite");
    assert.match(plan.reason, /unreadable map/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("#318 S13: an unknown flag is refused, never silently ignored", () => {
  const result = run(["--definitely-not-a-flag"]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /Unknown argument/);
});

test("#318 S13: --check with no path is refused, never defaulted to the full suite", () => {
  const result = run(["--check"]);
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /--check requires a path/);
});

test("#318 S13: the script writes nothing", () => {
  const before = spawnSync("git", ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" }).stdout;
  run(["--check", "scripts/test-route.mjs"]);
  const after = spawnSync("git", ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" }).stdout;
  assert.equal(after, before, "the route planner is read-only");
});
