// cost-guard.test.mjs — tests estimated above the token budget are owner-gated.
//
// Operators declare patterns and their estimated cost in tokens
// (`guards.expensiveTests`), plus a ceiling; `maxTokens: 0` gates every match.
// The estimate is a number the operator wrote, not a measurement — it answers
// "may this run unattended?", never "how much did it cost?".

import { test } from "node:test";
import assert from "node:assert/strict";

import { costGuard, estimatedCost } from "../dist/extension/cost-guard.js";

const bash = (command) => ({ toolName: "bash", command });
const PATTERNS = [
  { match: "\\bbun run mutation\\b", tokens: 120_000 },
  { match: "\\bpi\\s+-p\\b", tokens: 50_000 },
];
const BUDGET = { maxTokens: 100_000, patterns: PATTERNS };

test("a command estimated above the ceiling is blocked, and the reason carries both numbers", () => {
  const decision = costGuard(bash("bun run mutation"), BUDGET);
  assert.equal(decision.block, true);
  assert.match(decision.reason, /120000 tokens, budget: 100000/u);
  assert.match(decision.reason, /AW_ALLOW=cost/u);
});

test("a command at or under the ceiling passes", () => {
  assert.equal(costGuard(bash("pi -p 'summarize docs'"), BUDGET).block, false);
});

test("maxTokens: 0 gates every match", () => {
  assert.equal(costGuard(bash("pi -p hi"), { maxTokens: 0, patterns: PATTERNS }).block, true);
});

test("unmatched commands pass, and the gate is a no-op without patterns", () => {
  assert.equal(costGuard(bash("bun test test/"), BUDGET).block, false);
  assert.equal(costGuard(bash("bun run mutation"), { maxTokens: 0, patterns: [] }).block, false);
});

test("the highest matching estimate wins", () => {
  const patterns = [{ match: "expensive", tokens: 10 }, { match: "expensive .+", tokens: 500 }];
  assert.equal(estimatedCost("run expensive suite now", patterns), 500);
});

test("a non-bash tool passes", () => {
  assert.equal(costGuard({ toolName: "write", command: "bun run mutation" }, BUDGET).block, false);
});

test("AW_ALLOW=cost enables the run it was granted for", () => {
  assert.equal(costGuard(bash("AW_ALLOW=cost bun run mutation"), BUDGET).block, false);
});
