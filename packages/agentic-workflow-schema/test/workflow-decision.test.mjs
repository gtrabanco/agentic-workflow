import { test } from "node:test";
import assert from "node:assert/strict";
import {
  WORKFLOW_INTENTS,
  WORKFLOW_TRANSITION_TABLE,
  WORKFLOW_DECISION_SENSE_CODES,
  WORKFLOW_DECISION_STOP_CODES,
  WORKFLOW_DECISION_INVOKE_CODES,
} from "../dist/index.js";

// Exhaustiveness: every intent is covered somewhere in the transition table
// (as a row key, an allowed next intent, or an explicit recommendation/merge rule).
// Every row key is a valid workflow intent.

test("P1 exhaustiveness: all intents covered", () => {
  const covered = new Set();

  // Row keys → covered
  for (const row of WORKFLOW_TRANSITION_TABLE) {
    covered.add(row.key);
  }

  // Allowed next intents → covered
  for (const row of WORKFLOW_TRANSITION_TABLE) {
    for (const next of row.allowed) {
      covered.add(next);
    }
  }

  const allIntentSet = new Set(WORKFLOW_INTENTS);
  const uncovered = [...allIntentSet].filter((i) => !covered.has(i));

  assert.equal(uncovered.length, 0,
    `All intents should be covered (row key, allowed next, or recommendation). `
    + `Uncovered: ${uncovered.join(", ") || "none"}`);
});

test("P1 exhaustiveness: every row key is a known intent", () => {
  const known = new Set(WORKFLOW_INTENTS);
  const badKeys = [];

  for (const row of WORKFLOW_TRANSITION_TABLE) {
    if (!known.has(row.key)) {
      badKeys.push(row.key);
    }
  }

  assert.equal(badKeys.length, 0,
    `Every row key must be a known intent. Bad keys: ${badKeys.join(", ") || "none"}`);
});

test("P1 reason codes are frozen arrays", () => {
  assert.equal(Object.isFrozen(WORKFLOW_DECISION_SENSE_CODES), true);
  assert.equal(Object.isFrozen(WORKFLOW_DECISION_STOP_CODES), true);
  assert.equal(Object.isFrozen(WORKFLOW_DECISION_INVOKE_CODES), true);
});

test("P1 transition table is frozen", () => {
  assert.equal(Object.isFrozen(WORKFLOW_TRANSITION_TABLE), true);
});

// Every row has non-empty allowed when it should (sense-initial is the only empty-row case)
test("P1 row keys cover profiled skills and none", () => {
  const rowKeys = new Set(WORKFLOW_TRANSITION_TABLE.map((r) => r.key));

  // Verify the explicit row keys match the spec design:
  // none, init-workspace, status, discover-repository-state,
  // resolve-repository-state, design-feature, plan-feature, plan-fix,
  // triage-issue, execute-phase, review-change, loop-review-fold, audit-pr, merge
  const expectedKeys = [
    "none",
    "init-workspace",
    "status",
    "discover-repository-state",
    "resolve-repository-state",
    "design-feature",
    "plan-feature",
    "plan-fix",
    "triage-issue",
    "execute-phase",
    "review-change",
    "loop-review-fold",
    "audit-pr",
    "merge",
  ];

  assert.equal(rowKeys.size, expectedKeys.length,
    `Expected ${expectedKeys.length} rows, got ${rowKeys.size}`);

  for (const key of expectedKeys) {
    assert.ok(rowKeys.has(key), `Row key present: ${key}`);
  }
});