/**
 * budgets.route-ceilings.test.mjs — issue #498 resident findings, triage route
 * "fix-now": the `budgets` writer (`ceilingRebase`) must target the keys its
 * reader consumes.
 *
 * The triage reproducer (finding 2): `ceilingRebase` writes `estimateMax`/
 * `linesMax`, but the route checker (`check-skill-context --routes`) reads
 * `routeEstimateMax`/`routeLinesMax` — a rebase against a route carrying the
 * route keys wrote a dead key and answered `ok: true`: a writer that lies.
 *
 * The contract under test:
 *   - a route-scoped rebase names the keys its route carries; `routeEstimateMax`
 *     / `routeLinesMax` are honored (created if absent, shrink-guarded like the
 *     original pair, growth source recorded);
 *   - passing `estimateMax`/`linesMax` against a route whose shape is the
 *     route-key shape is a REFUSAL (the no-op lie, made loud), thrown before
 *     any byte moves — the same before-mutation guarantee the writer already
 *     holds for the route-missing case;
 *   - the legacy shape (routes carrying only `estimateMax`) keeps working.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ceilingRebase } from "../src/edit/Budgets.mjs";

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), "aw-budgets-routes-"));
  const path = join(dir, "b.json");
  const route = { skills: ["a"], routeEstimateMax: 1000, routeLinesMax: 500, sources: {} };
  writeFileSync(path, JSON.stringify({ routes: { "a:x": route } }, null, 2) + "\n", "utf8");
  return {
    path,
    read: () => JSON.parse(readFileSync(path, "utf8")).routes["a:x"],
    release: () => rmSync(dir, { recursive: true, force: true }),
  };
}

test("a route-key rebase writes routeEstimateMax — the key the checker reads", () => {
  const s = scratch();
  try {
    const receipt = ceilingRebase(s.path, "a:x", undefined, undefined, "growth declared", { routeEstimateMax: 1520 });
    assert.equal(receipt.ok, true);
    const route = s.read();
    assert.equal(route.routeEstimateMax, 1520, "the checker-read key moved");
    assert.equal(route.routeLinesMax, 500, "the untouched route key stayed");
    assert.equal(route.estimateMax, undefined, "no dead key appeared");
    assert.match(route.sources.ceilingRebase, /growth declared/);
  } finally {
    s.release();
  }
});

test("routeLinesMax is honored the same way", () => {
  const s = scratch();
  try {
    const receipt = ceilingRebase(s.path, "a:x", undefined, undefined, "growth declared", { routeLinesMax: 640 });
    assert.equal(receipt.ok, true);
    assert.equal(s.read().routeLinesMax, 640);
    assert.equal(s.read().routeEstimateMax, 1000);
  } finally {
    s.release();
  }
});

test("a routeEstimateMax shrink refuses without a growth source, before mutation", () => {
  const s = scratch();
  try {
    const receipt = ceilingRebase(s.path, "a:x", undefined, undefined, "", { routeEstimateMax: 900 });
    assert.equal(receipt.ok, false);
    assert.equal(s.read().routeEstimateMax, 1000, "nothing moved");
  } finally {
    s.release();
  }
});

test("FINDING 2 — passing estimateMax against a route-key route refuses loudly, before mutation", () => {
  const s = scratch();
  try {
    assert.throws(
      () => ceilingRebase(s.path, "a:x", 2000, undefined, "growth declared"),
      (error) => {
        assert.match(error.message, /routeEstimateMax/);
        assert.match(error.message, /a:x/);
        return true;
      },
    );
    const route = s.read();
    assert.equal(route.routeEstimateMax, 1000, "nothing moved");
    assert.equal(route.estimateMax, undefined, "no dead key was written");
    assert.equal(route.sources.ceilingRebase, undefined, "no growth source recorded for a refused rebase");
  } finally {
    s.release();
  }
});

test("the legacy shape (a route carrying only estimateMax) keeps working", () => {
  const dir = mkdtempSync(join(tmpdir(), "aw-budgets-legacy-"));
  const path = join(dir, "b.json");
  try {
    writeFileSync(path, JSON.stringify({ routes: { "b:y": { estimateMax: 100, linesMax: 40, sources: {} } } }, null, 2) + "\n", "utf8");
    const receipt = ceilingRebase(path, "b:y", 220, 44, "growth declared");
    assert.equal(receipt.ok, true);
    const route = JSON.parse(readFileSync(path, "utf8")).routes["b:y"];
    assert.equal(route.estimateMax, 220);
    assert.equal(route.linesMax, 44);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
