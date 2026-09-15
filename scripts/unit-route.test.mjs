#!/usr/bin/env node

/**
 * Fix 224 / P1 — `scripts/unit-route.mjs`, the deterministic unit router.
 *
 * Red-first pins for the closed route table, the bounded read set, the
 * fail-closed exit contract, determinism/read-only behaviour, the committed
 * unit-37 dogfood fixture (SPEC PE-013) and the stdout sanitizer (AC12).
 *
 * The router is read-only; every fixture is either the committed tree at
 * `scripts/fixtures/unit-route/` or a copy of it under `os.tmpdir()`.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(repoRoot, "scripts", "unit-route.mjs");
const FIXTURE = path.join(repoRoot, "scripts", "fixtures", "unit-route");

const run = (args, { root = FIXTURE, cwd = repoRoot } = {}) => spawnSync(
  process.execPath,
  [SCRIPT, ...args],
  { cwd, encoding: "utf8", env: root ? { ...process.env, UNIT_ROUTE_REPO: root } : process.env },
);

const routeLine = (stdout) => /^route: (\S+)$/m.exec(stdout)?.[1] ?? null;
const rowLine = (stdout) => /^rows: (.*)$/m.exec(stdout)?.[1] ?? null;
const readSet = (stdout) => {
  const block = /read-set \((\d+)\):\n([\s\S]*?)\nfingerprint: /.exec(stdout);
  if (!block) return null;
  const entries = block[2].split("\n").filter((line) => line.startsWith("  ") && !line.startsWith("  …"));
  const remainder = /  … and (\d+) more/.exec(block[2]);
  return { count: Number(block[1]), entries: entries.map((line) => line.trim()), remainder: remainder ? Number(remainder[1]) : 0 };
};

// ===========================================================================
// AC1 — the closed route table, first match winning
// ===========================================================================

test("AC1: replan wins over a co-resident fold and decision row", () => {
  const result = run(["10-replan-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "replan");
  assert.equal(rowLine(result.stdout), "F1 F2 F3", "the router lists every open row without being told an id");
});

test("AC1: decision fires when no row routes to the plan owner", () => {
  const result = run(["12-decision-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "decision");
});

test("AC1: a plain fix-now row routes to the fold", () => {
  const result = run(["11-fold-unit"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "fold");
  assert.equal(readSet(result.stdout).count, 1, "the fold reads its own ledger");
});

test("AC1: a unit with no open row routes to execute", () => {
  for (const unit of ["13-execute-unit", "14-empty-unit"]) {
    const result = run([unit]);
    assert.equal(result.status, 0, `${unit}: ${result.stderr}`);
    assert.equal(routeLine(result.stdout), "execute", unit);
    assert.equal(rowLine(result.stdout), "none", unit);
  }
});

test("AC1: a tracked issue with no unit folder routes to plan-from-issue", () => {
  const result = run(["20"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "plan-from-issue");
  assert.match(result.stdout, /^next: \/plan-fix 20$/m);
});

// ===========================================================================
// AC2 — the bounded read set is derived from the selected rows only
// ===========================================================================

test("AC2: the read set carries the unit surfaces and the selected rows' cited paths", () => {
  const result = run(["37-phase-lint-script"]);
  assert.equal(result.status, 0, result.stderr);
  const set = readSet(result.stdout);
  assert.deepEqual(set.entries, [
    "docs/features/37-phase-lint-script/ACCEPTANCE.md",
    "docs/features/37-phase-lint-script/SPEC.md",
    "docs/features/37-phase-lint-script/review-findings.md",
    "docs/features/38-workflow-status-sensor-script/PLAN.md",
    "docs/features/38-workflow-status-sensor-script/TASKS.md",
    "docs/fix/_TEMPLATE/SPEC.md",
    "scripts/phase-lint.mjs",
  ]);
  assert.ok(!set.entries.includes("docs/LOGS.md"), "a path cited only by a FOLDED row is not in the replan read set");
});

test("F14: a brace-composed citation resolves to every file it names", () => {
  // Row F92's file cell cites two artifacts in one composed citation
  // (`…/38-workflow-status-sensor-script/{PLAN.md:29,TASKS.md:55}`). The delimiter
  // classes stopped at the `{`, so only the composed directory was found and the
  // isDir guard dropped it — two cited paths silently missing from the set AC2
  // promises ("each cited repository path").
  const result = run(["37-phase-lint-script"]);
  assert.equal(result.status, 0, result.stderr);
  const set = readSet(result.stdout);
  for (const cited of [
    "docs/features/38-workflow-status-sensor-script/PLAN.md",
    "docs/features/38-workflow-status-sensor-script/TASKS.md",
  ]) {
    assert.ok(set.entries.includes(cited), `${cited} is on the read set`);
  }
});

test("AC2: the set is deduped, sorted and capped with an explicit remainder line", () => {
  const result = run(["40-cited-paths"]);
  assert.equal(result.status, 0, result.stderr);
  const set = readSet(result.stdout);
  assert.equal(set.count, 23, "3 unit surfaces + 20 distinct cited files");
  assert.equal(set.entries.length, 12, "the printed set is capped at 12");
  assert.equal(set.remainder, 11, "the remainder is explicit, never silently dropped");
  assert.deepEqual(set.entries, [...set.entries].sort(), "the set is sorted");
});

// ===========================================================================
// AC3 — failure states fail closed
// ===========================================================================

test("AC3: an unknown unit exits 1 and prints no route", () => {
  const result = run(["999"]);
  assert.equal(result.status, 1);
  assert.equal(routeLine(result.stdout), null);
  assert.match(result.stderr, /unknown unit: 999/);
});

test("AC3: extra arguments exit 1 and print no route", () => {
  const result = run(["10-replan-unit", "extra"]);
  assert.equal(result.status, 1);
  assert.equal(routeLine(result.stdout), null);
  assert.match(result.stderr, /exactly one argument/);
});

test("AC3: an ambiguous unit exits 2 and prints no route", () => {
  const result = run(["30"]);
  assert.equal(result.status, 2);
  assert.equal(routeLine(result.stdout), null);
  assert.match(result.stderr, /ambiguous unit: 30 matches/);
});

test("F6: --help and -h print the usage contract on stdout and exit 0", () => {
  // Both standard help flags used to be read as unit tokens and answered with a
  // misleading `unknown unit: --help` on stderr, exit 1 — a first-contact defect on
  // the unit's own entry point. Help is a request for the contract, not a failure.
  for (const flag of ["--help", "-h"]) {
    const result = run([flag]);
    assert.equal(result.status, 0, `${flag}: ${result.stderr}`);
    assert.match(result.stdout, /^usage: node scripts\/unit-route\.mjs/m, flag);
    assert.match(result.stdout, /Exit codes/i, `${flag}: the exit-code contract is named`);
    assert.match(result.stdout, /replan/, `${flag}: the closed route table is named`);
    assert.equal(result.stderr, "", `${flag}: help is not an error`);
    assert.equal(routeLine(result.stdout), null, `${flag}: help prints no route`);
  }
});

// ===========================================================================
// AC4 — deterministic and read-only
// ===========================================================================

test("AC4: two consecutive runs print byte-identical stdout", () => {
  const first = run(["224-deterministic-replan-routing"], { root: null });
  const second = run(["224-deterministic-replan-routing"], { root: null });
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, second.stdout);
});

test("AC4: a run leaves `git status --porcelain` unchanged", () => {
  const before = execFileSync("git", ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" });
  const result = run(["224-deterministic-replan-routing"], { root: null });
  assert.equal(result.status, 0, result.stderr);
  const after = execFileSync("git", ["status", "--porcelain"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(after, before, "the router writes nothing");
});

// ===========================================================================
// AC5 — the committed dogfood fixture
// ===========================================================================

test("AC5: the unit-37 fixture answers replan and lists the plan-routed ids", () => {
  const result = run(["37-phase-lint-script"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "replan");
  assert.equal(rowLine(result.stdout), "F83 F85 F88 F90 F92", "the plan-routed open rows, no id passed in");
  assert.match(result.stdout, /^open-rows: 5$/m);
});

// ===========================================================================
// AC12 — one sanitizer over every echoed value
// ===========================================================================

test("AC12/S7: long and shell-shaped cells are sanitized, never echoed as a ledger line", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "unit-route-hostile-"));
  fs.cpSync(FIXTURE, root, { recursive: true });
  const dir = path.join(root, "docs", "features", "90-hostile-unit");
  fs.mkdirSync(dir, { recursive: true });
  const longId = `F9-${"A".repeat(400)}`;
  const longRow = `| ${longId} | scripts/evil.mjs:1 | code | med | fix-now | replan-in-unit: plan owner re-cuts the phase | no |`;
  const shellRow = "| F10 | scripts/evil2.mjs:1 | code | med | fix-now | replan-in-unit: $(rm -rf /) `curl evil` <img src=x onerror=alert(1)> | no |";
  fs.writeFileSync(path.join(dir, "review-findings.md"), `| id | file:line | axis | severity | class | route | folded |\n|---|---|---|---|---|---|---|\n${longRow}\n${shellRow}\n`);

  const result = run(["90-hostile-unit"], { root });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(routeLine(result.stdout), "replan");
  assert.ok(!result.stdout.includes(longRow), "no verbatim ledger line reaches stdout");
  assert.ok(!result.stdout.includes(shellRow), "no verbatim ledger line reaches stdout");
  assert.ok(!result.stdout.includes(longId), "the long id is truncated by the sanitizer");
  assert.match(result.stdout, /F9-AAAA/, "the id keeps its truncated prefix");
  assert.match(result.stdout, /…/, "truncation is visible, never silent");
  assert.ok(!result.stdout.includes("rm -rf"), "the route cell's shell-shaped text is never echoed at all");
  assert.match(result.stdout, /^rows: F9-AA.* F10$/m, "both open ids are listed on one sanitized line");
});
