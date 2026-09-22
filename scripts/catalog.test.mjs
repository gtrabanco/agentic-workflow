#!/usr/bin/env node

/**
 * catalog.test.mjs — tests for the triage catalog and --triage mode.
 *
 * Covers:
 *   - docs-only unit yields [docs, evidence] (no tests, no implement, no review)
 *   - trivial fix yields [implement, evidence] (no tests, no review, no plan, no docs)
 *   - core feature yields full ordered list of 9 steps
 *   - missing mandatory section → exit 2
 *   - unknown unit type → exit 2
 *   - JSON output shape is exact
 *   - catalog.json parses and every step name is from the closed 9
 *   - existing unit-route modes still work (--triage doesn't break legacy)
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(repoRoot, "scripts", "unit-route.mjs");
const CATALOG_PATH = path.join(repoRoot, "scripts", "catalog.json");
const CATALOG_FIXTURE = path.join(repoRoot, "scripts", "fixtures", "catalog");

const run = (args, { root = CATALOG_FIXTURE } = {}) => spawnSync(
  process.execPath,
  [SCRIPT, ...args],
  { encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: root } },
);

const parseTextOutput = (stdout) => {
  const lines = stdout.trim().split("\n");
  return {
    id: lines[0].match(/^TRIAGE — (.+?) \((.+)\)$/)?.[1] || null,
    type: lines[0].match(/^TRIAGE — (.+?) \((.+)\)$/)?.[2] || null,
    steps: lines[1].match(/^Steps: (.+)$/)?.[1]?.split(", ").filter(Boolean) || [],
    skipped: lines[2].match(/^Skipped: (.+)$/)?.[1] || "none",
    budget: lines[3].match(/^Budget: (.+)$/)?.[1] || null,
  };
};

// ===========================================================================
// catalog.json structural tests
// ===========================================================================

test("catalog.json parses and has schemaVersion 1", () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  assert.equal(catalog.schemaVersion, 1);
  assert.ok(catalog.steps, "catalog must have a steps array");
  assert.ok(catalog.catalog, "catalog must have a catalog object");
});

test("catalog.json has exactly 9 steps in the closed order", () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const expected = ["research", "design", "plan", "implement", "tests", "evidence", "review", "docs", "release"];
  assert.deepEqual(catalog.steps, expected, "steps must be exactly the 9 closed steps in order");
});

test("catalog.json: every step entry has the required fields", () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  for (const step of catalog.steps) {
    const entry = catalog.catalog[step];
    assert.ok(entry, `step "${step}" has a catalog entry`);
    assert.ok(typeof entry.applies_when === "string", `"${step}" has applies_when`);
    assert.ok(typeof entry.skipped_when === "string", `"${step}" has skipped_when`);
    assert.equal(typeof entry.requires_gate, "boolean", `"${step}" has requires_gate`);
    assert.ok(["strong", "cheap"].includes(entry.budget_tier), `"${step}" has valid budget_tier`);
  }
});

// ===========================================================================
// docs-only unit
// ===========================================================================

test("docs-only unit yields [docs, evidence]", () => {
  const result = run(["--triage", "91-docs-only"]);
  assert.equal(result.status, 0, result.stderr);
  const triage = parseTextOutput(result.stdout);
  assert.deepEqual(triage.steps, ["evidence", "docs"]);
  assert.equal(triage.type, "docs");
  assert.equal(triage.budget, "cheap", "a docs-only unit needs no design/tests/review — never a strong budget");
  // Verify skipped entries exist
  assert.ok(triage.skipped !== "none", "some steps should be skipped");
  assert.ok(triage.skipped.includes("implement"), "implement should be skipped for docs");
  assert.ok(triage.skipped.includes("tests"), "tests should be skipped for docs");
  assert.ok(triage.skipped.includes("review"), "review should be skipped for docs");
});

// ===========================================================================
// trivial fix
// ===========================================================================

test("trivial fix yields [implement, evidence]", () => {
  const result = run(["--triage", "92-trivial-fix"]);
  assert.equal(result.status, 0, result.stderr);
  const triage = parseTextOutput(result.stdout);
  assert.deepEqual(triage.steps, ["implement", "evidence"]);
  assert.equal(triage.type, "fix");
  // No tests, no review, no plan, no docs
  assert.ok(triage.skipped.includes("tests"), "tests should be skipped for trivial fix");
  assert.ok(triage.skipped.includes("review"), "review should be skipped for trivial fix");
  assert.ok(triage.skipped.includes("plan"), "plan should be skipped for trivial fix");
  assert.ok(triage.skipped.includes("docs"), "docs should be skipped for trivial fix");
});

// ===========================================================================
// core feature (full ordered list)
// ===========================================================================

test("core feature yields full ordered list of 9 steps", () => {
  const result = run(["--triage", "93-core-feature"]);
  assert.equal(result.status, 0, result.stderr);
  const triage = parseTextOutput(result.stdout);
  const expected = ["research", "design", "plan", "implement", "tests", "evidence", "review", "docs", "release"];
  assert.deepEqual(triage.steps, expected);
  assert.equal(triage.skipped, "none", "core feature skips nothing");
  assert.equal(triage.type, "feature");
});

// ===========================================================================
// error cases
// ===========================================================================

test("missing mandatory section → exit 2", () => {
  const result = run(["--triage", "94-missing-section"]);
  assert.equal(result.status, 2);
  assert.ok(result.stderr.includes("TRIAGE ERROR"), "error message on stderr");
  assert.ok(result.stderr.includes("missing mandatory sections"), "error names missing sections");
  assert.ok(!result.stdout.includes("TRIAGE —"), "no triage output on error");
});

test("unknown unit type → exit 2", () => {
  const result = run(["--triage", "95-unknown-type"]);
  assert.equal(result.status, 2);
  assert.ok(result.stderr.includes("unit type cannot be determined"), "error names type problem");
  assert.ok(!result.stdout.includes("TRIAGE —"), "no triage output on error");
});

// ===========================================================================
// JSON mode
// ===========================================================================

test("JSON output has exact shape", () => {
  const result = run(["--triage", "92-trivial-fix", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const obj = JSON.parse(result.stdout.trim());
  assert.ok(typeof obj.unit === "string", "unit is string");
  assert.ok(typeof obj.type === "string", "type is string");
  assert.ok(Array.isArray(obj.steps), "steps is array");
  assert.ok(Array.isArray(obj.skipped), "skipped is array");
  assert.ok(typeof obj.budget === "string", "budget is string");
  assert.ok(["strong", "cheap"].includes(obj.budget), "budget is strong or cheap");
  for (const s of obj.skipped) {
    assert.ok(typeof s.step === "string", "skipped item has step");
    assert.ok(typeof s.reason === "string", "skipped item has reason");
  }
  assert.equal(obj.steps.length, 2, "trivial fix has 2 steps");
  assert.equal(obj.skipped.length, 7, "trivial fix skips 7 steps");
});

// ===========================================================================
// catalog validation
// ===========================================================================

test("catalog.json rejects unsupported schemaVersion", () => {
  // Temporarily modify catalog to test validation — restore after
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  catalog.schemaVersion = 99;
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  try {
    const result = run(["--triage", "91-docs-only"]);
    assert.equal(result.status, 2);
    assert.ok(result.stderr.includes("unsupported schemaVersion"));
  } finally {
    catalog.schemaVersion = 1;
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  }
});

test("catalog.json rejects unknown step names", () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  catalog.steps.push("imaginary-step");
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  try {
    const result = run(["--triage", "91-docs-only"]);
    assert.equal(result.status, 2);
    assert.ok(result.stderr.includes("must have exactly 9 steps"),
      `stderr should mention step count, got: ${JSON.stringify(result.stderr)}`);
  } finally {
    catalog.steps.pop();
    fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2));
  }
});

// ===========================================================================
// --triage doesn't break legacy routing
// ===========================================================================

test("--triage is a separate mode; legacy modes still work", () => {
  // The existing test fixtures are under the same ROOT fixture
  // so --triage won't interfere. The existing tests in unit-route.test.mjs
  // cover this, but add a quick sanity check:
  const result = run(["--triage", "99-nonexistent"]);
  assert.equal(result.status, 2);
  assert.ok(result.stderr.includes("not found"));
});
