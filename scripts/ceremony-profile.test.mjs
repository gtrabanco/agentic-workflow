#!/usr/bin/env node

/**
 * ceremony-profile.test.mjs — the dispatcher/catalog check for
 * `ceremony-profile@1` (issue #436, unit docs/fix/436-ceremony-profile/).
 *
 * Written red-first: neither the runtime module nor the router check existed
 * when this corpus landed. It pins:
 *
 *  - **No profile declared → byte-identical behavior** (the §2/§6
 *    differential): no `Profile:` line, no `profile` key — the full-ceremony
 *    adopter is exactly the no-profile behavior.
 *  - **Skip with a recorded receipt, never emit, never error** (S3): a
 *    profile-discarded step moves from `Steps` to `Skipped` carrying the
 *    receipt, exit 0.
 *  - **Anti-gaming is code** (S5): a `paid` declaration on a step the catalog
 *    already skips earns a no-expansion refusal receipt; the gate-bearing and
 *    lane-core steps carry no piece, so no profile can discard them; a
 *    malformed block fails closed with a named diagnostic, exit 2.
 *  - **Minimal adopter runs without errors** (S6): every omission is a
 *    receipt.
 *
 * Fixtures live in `scripts/fixtures/ceremony-profile/<scenario>/` — one
 * project tree per scenario; `UNIT_ROUTE_REPO` re-points the router at each.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { CEREMONY_PROFILE_PIECES } from "./ceremony-profile.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "unit-route.mjs");
const FIXTURES = path.join(REPO_ROOT, "scripts", "fixtures", "ceremony-profile");
const CATALOG_PATH = path.join(REPO_ROOT, "scripts", "catalog.json");

function scenario(name) {
  return path.join(FIXTURES, name);
}

function runTriage(name, args = []) {
  const result = spawnSync(process.execPath, [SCRIPT, "--triage", "900-check-unit", ...args], {
    cwd: REPO_ROOT,
    env: { ...process.env, UNIT_ROUTE_REPO: scenario(name) },
    encoding: "utf8",
  });
  return { code: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

function readFixtureUnit(type, scope) {
  return `---
type: ${type}
scope: ${scope}
---

# 900-check-unit — ceremony profile fixture

## Objective

Exercise the dispatcher/catalog check for the ceremony profile.

## Why

The profile decides which steps a project pays.

## User outcome

Steps undeclared by the profile are skipped with recorded receipts.

## Acceptance criteria

1. A profile-discarded step is skipped with a receipt.
2. No profile keeps today's block.

## Impact

Nothing outside this fixture.

## Non-goals

None.

## Future cost

None.

## Applicable tests

This suite.

## Known pre-existing issues

none

## Tasks

- P1 — exercise the check (validator: \`bun test scripts/ceremony-profile.test.mjs\` exits 0)

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

## Progress log

## Next

Run the suite.

## References

issue: 436
`;
}

const SCENARIOS = [
  ["no-profile", null],
  ["full-paid", ["docs-step: paid", "captures: paid", "review-passes: a11y, seo, design, brand, security, perf, debt, code, verify", "publish-gate: paid", "test-policy: paid"]],
  ["docs-discarded", ["docs-step: discarded"]],
  ["no-expansion", ["docs-step: paid", "publish-gate: paid"]],
  ["minimal", ["docs-step: discarded", "captures: discarded", "review-passes: none", "publish-gate: discarded", "test-policy: discarded"]],
  ["malformed-unknown-piece", ["docs-step: paid", "tool-pass: paid"]],
  ["malformed-bad-version", ["docs-step: paid"]],
  ["review-narrowed", ["review-passes: a11y"]],
];

for (const [name, profileLines] of SCENARIOS) {
  const unitType = name === "no-expansion" || name === "minimal" ? "docs" : "feature";
  const dir = scenario(name);
  fs.mkdirSync(path.join(dir, "docs", "fix", "900-check-unit"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs", "fix", "900-check-unit", "SPEC.md"), readFixtureUnit(unitType, "standard"));
  if (profileLines !== null) {
    const version = name === "malformed-bad-version" ? "ceremony-profile@2" : "ceremony-profile@1";
    const block = [version, ...profileLines].join("\n");
    const guide = [
      "# Fixture guide",
      "",
      "## Project charter",
      "",
      "This project pays its chosen slice of the ceremony.",
      "",
      "```text",
      block,
      "```",
      "",
    ].join("\n");
    fs.writeFileSync(path.join(dir, "AGENTS.md"), guide);
  }
}

test.after(() => {
  fs.rmSync(FIXTURES, { recursive: true, force: true });
});

const NO_PROFILE_STEPS = "Steps: design, implement, tests, evidence, review, docs, release";

test("no profile declared: the triage block is today's block, byte for byte (no Profile line, no json key)", () => {
  const plain = runTriage("no-profile");
  assert.equal(plain.code, 0, plain.stderr);
  assert.ok(plain.stdout.includes(NO_PROFILE_STEPS), plain.stdout);
  assert.ok(!plain.stdout.includes("Profile:"), plain.stdout);
  const json = runTriage("no-profile", ["--json"]);
  assert.equal(json.code, 0);
  const answer = JSON.parse(json.stdout);
  assert.equal("profile" in answer, false);
});

test("a fully-paid profile cannot expand ceremony: the step list is the no-profile list", () => {
  const plain = runTriage("full-paid");
  assert.equal(plain.code, 0, plain.stderr);
  assert.ok(plain.stdout.includes(NO_PROFILE_STEPS), plain.stdout);
  assert.match(plain.stdout, /Profile: 0 applied, 0 refused \(ceremony-profile@1 — AGENTS\.md ## Project charter\)/);
});

test("a discarded step is skipped with a recorded receipt, never emitted, never an error", () => {
  const plain = runTriage("docs-discarded");
  assert.equal(plain.code, 0, plain.stderr);
  assert.ok(!plain.stdout.includes("Steps: design, implement, tests, evidence, review, docs, release"), plain.stdout);
  assert.ok(
    plain.stdout.includes("docs: ceremony-profile@1: docs-step discarded by project charter"),
    plain.stdout,
  );
  assert.match(plain.stdout, /Profile: 1 applied, 0 refused/);
  const json = runTriage("docs-discarded", ["--json"]);
  assert.equal(json.code, 0);
  const answer = JSON.parse(json.stdout);
  assert.equal(answer.profile.contract, "ceremony-profile@1");
  assert.equal(answer.profile.source, "AGENTS.md ## Project charter");
  assert.deepEqual(answer.profile.applied, [
    { piece: "docs-step", step: "docs", receipt: "ceremony-profile@1: docs-step discarded by project charter" },
  ]);
  assert.deepEqual(answer.profile.refused, []);
  assert.equal(answer.steps.includes("docs"), false);
});

test("a paid declaration on a step the catalog already skips earns a no-expansion refusal", () => {
  const plain = runTriage("no-expansion");
  assert.equal(plain.code, 0, plain.stderr);
  assert.match(plain.stdout, /Profile: 0 applied, 1 refused/);
  const json = runTriage("no-expansion", ["--json"]);
  const answer = JSON.parse(json.stdout);
  assert.equal(answer.profile.applied.length, 0);
  assert.equal(answer.profile.refused.length, 1);
  assert.equal(answer.profile.refused[0].piece, "publish-gate");
  assert.match(answer.profile.refused[0].receipt, /no-expansion: release is already skipped by the catalog/);
});

test("a narrowed review-passes list is a recorded receipt; the review step itself is never discardable", () => {
  const plain = runTriage("review-narrowed");
  assert.equal(plain.code, 0, plain.stderr);
  assert.ok(plain.stdout.includes("review"), plain.stdout);
  assert.ok(plain.stdout.split("\n").some((line) => line.startsWith("Steps:")), plain.stdout);
  const json = runTriage("review-narrowed", ["--json"]);
  const answer = JSON.parse(json.stdout);
  assert.equal(answer.steps.includes("review"), true);
  const narrowed = answer.profile.applied.find((entry) => entry.piece === "review-passes");
  assert.ok(narrowed, JSON.stringify(answer.profile));
  assert.match(narrowed.receipt, /narrowed to a11y/);
});

test("the minimal adopter runs without errors: every omission is a receipt, exit 0", () => {
  const plain = runTriage("minimal");
  assert.equal(plain.code, 0, plain.stderr);
  const json = runTriage("minimal", ["--json"]);
  const answer = JSON.parse(json.stdout);
  assert.equal(answer.steps.includes("docs"), false);
  assert.equal(answer.steps.includes("evidence"), true);
  const docsReceipt = answer.profile.applied.find((entry) => entry.piece === "docs-step");
  assert.ok(docsReceipt, JSON.stringify(answer.profile));
});

test("a malformed profile fails closed with a named diagnostic, exit 2", () => {
  for (const name of ["malformed-unknown-piece", "malformed-bad-version"]) {
    const run = runTriage(name);
    assert.equal(run.code, 2, `${name}: stdout=${run.stdout} stderr=${run.stderr}`);
    assert.match(run.stderr, /CEREMONY PROFILE ERROR/, name);
    assert.match(run.stderr, /Project charter/, name);
  }
});

test("the catalog declares no piece for the steps no profile may discard", () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const declaration = catalog.ceremonyProfile;
  assert.ok(declaration, "catalog carries the ceremonyProfile declaration");
  assert.equal(declaration.schemaVersion, 1);
  assert.equal(declaration.contract, "ceremony-profile@1");
  const mapped = Object.entries(declaration.stepPieces);
  assert.ok(mapped.length > 0);
  for (const [step, piece] of mapped) {
    assert.ok((CEREMONY_PROFILE_PIECES).includes(piece), `${step} → unknown piece ${piece}`);
    assert.ok(!["evidence", "plan", "implement", "review"].includes(step), `${step} must never be profile-discardable`);
  }
  assert.equal(declaration.stepPieces.docs, "docs-step");
  assert.equal(declaration.stepPieces.tests, "test-policy");
  assert.equal(declaration.stepPieces.release, "publish-gate");
});
