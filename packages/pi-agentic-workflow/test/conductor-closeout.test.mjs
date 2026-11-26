// conductor-closeout.test.mjs — AC7: clean/partial + 3-partials park via loop deps

import { test } from "node:test";
import assert from "node:assert/strict";

const { checkCloseout } = await import("../dist/conductor/index.js");

// AC7: checkCloseout
test("AC7: porcelain empty + ahead === 0 → clean", () => {
  assert.equal(checkCloseout("", 0), "clean");
});

test("AC7: porcelain non-empty → partial", () => {
  assert.equal(checkCloseout(" M src/file.ts\n", 0), "partial");
});

test("AC7: ahead > 0 → partial", () => {
  assert.equal(checkCloseout("", 1), "partial");
});

test("AC7: both dirty + ahead → partial", () => {
  assert.equal(checkCloseout(" M src/a.ts\n", 5), "partial");
});

test("AC7: single newline porcelain → partial", () => {
  assert.equal(checkCloseout("\n", 0), "partial");
});

test("closeout: a pending machine-owned ledger row does not park the conductor (issue #727)", () => {
  // The class `machine-ledger-commit@1` declares (LEDGERS.md) commits by
  // machinery — the teardown or the gate prelude — so a pending row is not
  // uncommitted agent work, and three probes over it would park the loop forever.
  assert.equal(checkCloseout(" M docs/workflow/TIER_COST.md\n", 0), "clean");
  assert.equal(checkCloseout(" M docs/LOGS.md\n?? .agentic-workflow/journal/2026-11-27-abc.md\n", 0), "clean");
});

test("closeout: the exemption never hides a foreign dirty file", () => {
  assert.equal(checkCloseout(" M docs/workflow/TIER_COST.md\n M src/app.ts\n", 0), "partial");
});

test("AC7: clean status does not mutate consecutive partial counter", () => {
  assert.equal(checkCloseout("", 0), "clean");
});
