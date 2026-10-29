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
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "unit-route.mjs");
const CATALOG_PATH = path.join(REPO_ROOT, "scripts", "catalog.json");
const CATALOG_FIXTURE = path.join(REPO_ROOT, "scripts", "fixtures", "catalog");

/** The sandbox a test gets: the fixture tree plus its own copy of the catalog. */
let sandbox;
let copies = 0;

/**
 * One triage run against a root. `UNIT_ROUTE_REPO` re-points the routing at the
 * fixture tree; `UNIT_ROUTE_CATALOG` re-points the catalog at the sandbox copy,
 * so a validation test mutates its own bytes and never the tracked
 * `scripts/catalog.json`.
 */
const run = (args, { root = CATALOG_FIXTURE, catalog = CATALOG_PATH } = {}) => spawnSync(
  process.execPath,
  [SCRIPT, ...args],
  { encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: root, ...(catalog ? { UNIT_ROUTE_CATALOG: catalog } : {}) } },
);

/**
 * Mutate a throwaway copy of the catalog, run triage against it, let the caller
 * assert, then drop the copy. Serialized bytes the same way `catalog.json` ships
 * them, so a failure diff reads like the real file.
 */
function withCatalog(mutate, assertions) {
  const copy = path.join(sandbox, `catalog-${++copies}.json`);
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  mutate(catalog);
  fs.writeFileSync(copy, JSON.stringify(catalog, null, 2));
  try {
    assertions(run(["--triage", "91-docs-only"], { catalog: copy }));
  } finally {
    fs.rmSync(copy, { force: true });
  }
}

const parseTextOutput = (stdout) => {
  return {
    id: /^TRIAGE — (.+?) \((.+)\)$/m.exec(stdout)?.[1] || null,
    type: /^TRIAGE — (.+?) \((.+)\)$/m.exec(stdout)?.[2] || null,
    steps: /^Steps: (.+)$/m.exec(stdout)?.[1]?.split(", ").filter(Boolean) || [],
    tiers: Object.fromEntries(
      [...(/^Tiers: (.+)$/m.exec(stdout)?.[1]?.matchAll(/([a-z]+): (cheap|strong)/g) ?? [])]
        .map((match) => [match[1], match[2]]),
    ),
    skipped: /^Skipped: (.+)$/m.exec(stdout)?.[1] || "none",
    budget: /^Budget: (.+)$/m.exec(stdout)?.[1] || null,
  };
};

// Every validation test writes its mutated catalog into a fresh sandbox and
// drops it again; nothing here ever touches the tracked file.
before(() => {
  sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-test-"));
});

after(() => {
  fs.rmSync(sandbox, { recursive: true, force: true });
});

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
  // #291 AC4: the aggregate is derived from the step tiers, not a second rule —
  // `evidence` carries the catalog's strong tier, so a docs-only unit's budget
  // is strong even though no design/tests/review step applies.
  assert.equal(triage.budget, "strong", "the budget derives from the step tiers (evidence is strong)");
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
  // #291 AC4: derived aggregate — implement (cheap, decision D1) + evidence (strong).
  assert.equal(triage.budget, "strong");
});

// ===========================================================================
// #291 AC4 — per-step budget tiers reach the triage output
// ===========================================================================

test("triage output carries each selected step's budget_tier from catalog.json", () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const result = run(["--triage", "93-core-feature"]);
  assert.equal(result.status, 0, result.stderr);
  const triage = parseTextOutput(result.stdout);
  assert.deepEqual(triage.tiers, Object.fromEntries(
    triage.steps.map((step) => [step, catalog.catalog[step].budget_tier]),
  ));
});

test("the implement step's tier is cheap (decision D1, issue #291)", () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  assert.equal(catalog.catalog.implement.budget_tier, "cheap");
});

test("the aggregate budget is derived from the step tiers, not a second rule", () => {
  const result = run(["--triage", "91-docs-only", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  const json = JSON.parse(result.stdout);
  const anyStrong = json.steps.some((step) => json.tiers[step] === "strong");
  assert.equal(json.budget, anyStrong ? "strong" : "cheap");
  assert.ok(json.tiers, "the JSON payload carries the per-step tiers");
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
  withCatalog(
    (catalog) => {
      catalog.schemaVersion = 99;
    },
    (result) => {
      assert.equal(result.status, 2);
      assert.ok(result.stderr.includes("unsupported schemaVersion"));
    },
  );
});

test("catalog.json rejects unknown step names", () => {
  withCatalog(
    (catalog) => {
      catalog.steps.push("imaginary-step");
    },
    (result) => {
      assert.equal(result.status, 2);
      assert.ok(result.stderr.includes("must have exactly 9 steps"),
        `stderr should mention step count, got: ${JSON.stringify(result.stderr)}`);
    },
  );
});

test("the tracked catalog is byte-identical after the validation tests ran", () => {
  // The defect these tests used to carry: they wrote the real catalog in place
  // and restored it in a `finally`, so any suite reading the file across that
  // window — the parallel root gate included — saw `schemaVersion: 99` or ten
  // steps. A validation test that mutates shared state is not testing the
  // validator, it is racing it.
  const before = fs.readFileSync(CATALOG_PATH, "utf8");
  withCatalog(
    (catalog) => {
      catalog.schemaVersion = 99;
      catalog.steps.push("imaginary-step");
    },
    () => {},
  );
  assert.equal(fs.readFileSync(CATALOG_PATH, "utf8"), before,
    "a catalog validation test must not touch the tracked scripts/catalog.json");
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
