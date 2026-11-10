/**
 * correction-budget.test.mjs — the computed budget's contract (issue #437,
 * S5/S8): the batch size is measured from the corpus, the bound is computed,
 * `nimio` never consumes a round, and an exhausted budget stops with a typed
 * decision instead of a silent extra round.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  BUDGET_CONTRACT,
  MAX_BUDGET,
  computeBudget,
  measureBatchSize,
  openRowsOf,
} from "./correction-budget.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts", "correction-budget.mjs");

function run(args) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd: ROOT, encoding: "utf8" });
}

function field(stdout, name) {
  const match = stdout.match(new RegExp(`^${name} \\| (.*)$`, "m"));
  return match ? match[1] : null;
}

function tempUnit(name, ledger) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "correction-budget-"));
  const unitDir = path.join(dir, "docs", "fix", name);
  fs.mkdirSync(unitDir, { recursive: true });
  fs.writeFileSync(path.join(unitDir, "review-findings.md"), ledger);
  cleanupDirs.push({ dir });
  return { dir, unitDir };
}

function tempSpec(name, spec) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "correction-budget-"));
  const unitDir = path.join(dir, "docs", "fix", name);
  fs.mkdirSync(unitDir, { recursive: true });
  fs.writeFileSync(path.join(unitDir, "SPEC.md"), spec);
  cleanupDirs.push({ dir });
  return { dir, unitDir };
}

const cleanupDirs = [];

test.after(() => {
  for (const { dir } of cleanupDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {
      // best effort
    }
  }
  cleanupDirs.length = 0;
});

const LEDGER = `| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | scripts/a.mjs:1 | code | high | fix-now | fold into current unit | no |
| F2 | scripts/b.mjs:2 | code | med | fix-now | fold into current unit | no |
| F3 | docs/c.md:3 | docs | low | fix-now | fold into current unit | no |
| F4 | docs/d.md:4 | docs | med | fix-now | fold into current unit · fold aaaaaaa | yes |
`;

test("the batch size is measured from the corpus, never chosen", () => {
  const measured = measureBatchSize(ROOT);
  assert.ok(measured.batchSize >= 1);
  assert.ok(measured.sample >= 3, `expected a real sample, read ${measured.sample}`);
  assert.equal(measured.source, "findings-corpus");
});

test("--measure prints the measured constants and the sample size", () => {
  const result = run(["--measure"]);
  assert.equal(result.status, 0);
  assert.ok(Number(field(result.stdout, "batch-size")) >= 1);
  assert.ok(Number(field(result.stdout, "sample")) >= 3);
  assert.equal(field(result.stdout, "source"), "findings-corpus");
});

test("open rows: the fold ledger's open rows are read, folded ones are not", () => {
  const { unitDir } = tempUnit("1-x", LEDGER);
  const rows = openRowsOf(unitDir);
  assert.deepEqual(rows.map((row) => row.id), ["F1", "F2", "F3"]);
});

test("nimio: a below-floor finding is classified and never counts as a finding", () => {
  const { unitDir } = tempUnit("1-x", LEDGER);
  const budget = computeBudget({ rows: openRowsOf(unitDir), batchSize: 2, roundsSpent: 0 });
  assert.equal(budget.findings, 2);
  assert.equal(budget.nimio, 1);
  assert.deepEqual(budget.nimioRows.map((row) => row.id), ["F3"]);
  assert.ok(budget.nimioRows.every((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.noteDate)));
});

test("nimio: a report-only impact is below the floor even at a material severity", () => {
  const { unitDir } = tempSpec(
    "2-y",
    `## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|
| F1 | S1 · scripts/a.mjs:1 | code | WARNING | report-only | source | fold |
| F2 | S2 · scripts/b.mjs:2 | code | WARNING | blocking | source | fold |
`,
  );
  const budget = computeBudget({ rows: openRowsOf(unitDir), batchSize: 2, roundsSpent: 0 });
  assert.equal(budget.findings, 1);
  assert.equal(budget.nimio, 1);
});

test("the budget is bounded and computed from the measured batch size", () => {
  const rows = Array.from({ length: 7 }, (_, index) => ({
    id: `F${index + 1}`,
    path: `scripts/${index + 1}.mjs`,
    band: "material",
    impact: "",
    routeHead: "fold",
  }));
  const wide = computeBudget({ rows, batchSize: 1, roundsSpent: 0 });
  assert.equal(wide.budget, MAX_BUDGET);
  const narrow = computeBudget({ rows, batchSize: 7, roundsSpent: 0 });
  assert.equal(narrow.budget, 1);
  assert.equal(narrow.verdict, "PASS");
});

test("an exhausted budget stops with a typed NEEDS-YOUR-DECISION, never another round", () => {
  const rows = Array.from({ length: 6 }, (_, index) => ({
    id: `F${index + 1}`,
    path: `scripts/${index + 1}.mjs`,
    band: "material",
    impact: "",
    routeHead: "fold",
  }));
  const spent = computeBudget({ rows, batchSize: 2, roundsSpent: 3 });
  assert.equal(spent.verdict, "BUDGET-EXHAUSTED");
  assert.equal(spent.remaining, 0);
  assert.match(spent.stop, /^NEEDS-YOUR-DECISION: /);
});

test("the CLI refuses a budget already spent, exiting 1 with the block", () => {
  const { unitDir } = tempUnit("3-z", LEDGER);
  const result = run(["--unit", unitDir, "--rounds-spent", "9"]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, new RegExp(`^${BUDGET_CONTRACT}$`, "m"));
  assert.match(field(result.stdout, "stop") || "", /^NEEDS-YOUR-DECISION: /);
});

test("the CLI prints the block for a unit with an open correction", () => {
  const { unitDir } = tempUnit("4-w", LEDGER);
  const result = run(["--unit", unitDir, "--rounds-spent", "0"]);
  assert.equal(result.status, 0);
  assert.equal(field(result.stdout, "findings"), "2");
  assert.equal(field(result.stdout, "nimio"), "1");
  assert.equal(field(result.stdout, "verdict"), "PASS");
});

test("usage: a missing --unit is exit 2, never a silent measurement", () => {
  const result = run([]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage/);
});
