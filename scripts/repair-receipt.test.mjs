#!/usr/bin/env node
// test-obligation: protects=scripts/repair-receipt.mjs,packages/agentic-workflow/src/repair-receipt/index.mjs obligations=contract,failure-path,state-integrity
/**
 * repair-receipt.test.mjs — issue #698: the fold's REPAIR-RECEIPT becomes a
 * machine-consumable currency, and every failing condition fails closed.
 *
 * The prose block already promised the route vocabulary (`skills/fold-findings`);
 * no runtime consumed it. This suite proves the runtime: the typed marker, the
 * route derivation over the facts a consumer re-derives, and the end-to-end
 * judgement in a throwaway repository — including the fix-334 F2 delta (a gate
 * receipt staled only by ceremony bookkeeping stays gate currency).
 *
 * Cases (owner ids in the planning ledger):
 *   O5  the marker encodes the route and every piece of evidence it checked
 *   O6  a repaired, gate-green, acceptance-stable head is merge currency
 *   O7  an open blocker / a moved AC hash / a red gate / a source delta are no currency
 *   O8  a stale gate receipt staled only by ceremony bookkeeping stays gate currency
 *   O9  a ceremony-only repair derives RE-REVIEW-SKIPPED; docs-only derives OPTIONAL
 *   O12 emit refuses a head it cannot read and posts no commit
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  REPAIR_CLASSES,
  REPAIR_ROUTES,
  REPAIR_MARKER_RE,
  latestRepairReceipt,
  parseRepairReceipt,
  renderRepairBody,
  deriveRoute,
  judgeRepair,
  repairScopeDigest,
} from "./repair-receipt.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SCRIPT = fileURLToPath(new URL("./repair-receipt.mjs", import.meta.url));
const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);
const SHA_C = "c".repeat(40);
const DIGEST = "d".repeat(64);

function run(cwd, ...args) {
  const result = spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: "utf8" });
  return { code: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}

/** A facts object the judge consumes; each case overrides one fact. */
function facts(overrides = {}) {
  return {
    classKind: "ceremony",
    paths: ["docs/features/698-toy-unit/planning-obligations.md"],
    openBlocking: 0,
    freeze: null,
    acMatch: true,
    gateOk: true,
    gateStalePaths: [],
    ...overrides,
  };
}

function derivedOf(overrides = {}) {
  const base = facts(overrides);
  return {
    classKind: base.classKind,
    scope: repairScopeDigest({ reviewed: SHA_A, head: SHA_B, paths: base.paths }),
    acHash: DIGEST,
    gateDigest: DIGEST,
    openBlocking: base.openBlocking,
    freeze: base.freeze,
    acMatch: base.acMatch,
    gateOk: base.gateOk,
    gateStalePaths: base.gateStalePaths,
  };
}

test("the marker encodes the route and every piece of evidence it checked", () => {
  const body = renderRepairBody({
    sha: SHA_B,
    unit: "698-toy-unit",
    reviewed: SHA_A,
    scope: DIGEST,
    classKind: "ceremony",
    route: "RE-REVIEW-SKIPPED",
    ac: DIGEST,
    gate: DIGEST,
    open: 0,
  });
  const parsed = parseRepairReceipt(body);
  assert.equal(parsed.sha, SHA_B);
  assert.equal(parsed.unit, "698-toy-unit");
  assert.equal(parsed.reviewed, SHA_A);
  assert.equal(parsed.scope, DIGEST);
  assert.equal(parsed.classKind, "ceremony");
  assert.equal(parsed.route, "RE-REVIEW-SKIPPED");
  assert.equal(parsed.ac, DIGEST);
  assert.equal(parsed.gate, DIGEST);
  assert.equal(parsed.open, 0);

  // Every attribute is a closed shape: a 39-hex sha, an off-vocabulary class,
  // an off-vocabulary route or a non-hex digest satisfies no reader.
  for (const broken of [
    body.replace(`sha=${SHA_B}`, `sha=${SHA_B.slice(1)}`),
    body.replace(`class=ceremony`, `class=workflow`),
    body.replace(`route=RE-REVIEW-SKIPPED`, `route=SKIPPED`),
    body.replace(`scope=${DIGEST}`, `scope=${DIGEST.slice(1)}`),
  ]) {
    assert.equal(parseRepairReceipt(broken), null);
  }
  assert.deepEqual([...REPAIR_CLASSES], ["ceremony", "docs-only"]);
  assert.deepEqual([...REPAIR_ROUTES], ["RE-REVIEW-SKIPPED", "RE-REVIEW-OPTIONAL", "RE-REVIEW-REQUIRED", "REPLAN-ROUTE", "PRODUCT-ROUTE"]);
  assert.match(body, REPAIR_MARKER_RE);
});

test("a ceremony-only repair derives RE-REVIEW-SKIPPED; docs-only derives OPTIONAL", () => {
  assert.equal(deriveRoute(facts()), "RE-REVIEW-SKIPPED");
  assert.equal(deriveRoute(facts({ classKind: "docs-only", paths: ["docs/ROADMAP.md"] })), "RE-REVIEW-OPTIONAL");
  assert.equal(deriveRoute(facts({ freeze: "replan" })), "REPLAN-ROUTE");
  assert.equal(deriveRoute(facts({ freeze: "product" })), "PRODUCT-ROUTE");
});

test("a repaired, gate-green, acceptance-stable head is merge currency", () => {
  const derived = derivedOf();
  const body = renderRepairBody({
    sha: SHA_B, unit: "698-toy-unit", reviewed: SHA_A, scope: derived.scope,
    classKind: derived.classKind, route: "RE-REVIEW-SKIPPED", ac: derived.acHash, gate: derived.gateDigest, open: 0,
  });
  const judged = judgeRepair({ marker: parseRepairReceipt(body), headSha: SHA_B, derived });
  assert.equal(judged.current, true);
  assert.equal(judged.currency, true);
  assert.equal(judged.route, "RE-REVIEW-SKIPPED");
  // OPTIONAL is currency too (the fold's advisory branch), never a fresh review.
  const optional = judgeRepair({ marker: { ...parseRepairReceipt(body), route: "RE-REVIEW-OPTIONAL" }, headSha: SHA_B, derived });
  assert.equal(optional.currency, true);
});

test("an open blocker is no currency", () => {
  const derived = derivedOf({ openBlocking: 1, classKind: "docs-only" });
  const body = renderRepairBody({ sha: SHA_B, unit: "698-toy-unit", reviewed: SHA_A, scope: derived.scope, classKind: "ceremony", route: "RE-REVIEW-SKIPPED", ac: DIGEST, gate: DIGEST, open: 0 });
  const judged = judgeRepair({ marker: parseRepairReceipt(body), headSha: SHA_B, derived });
  assert.equal(judged.currency, false);
  assert.equal(judged.route, "RE-REVIEW-REQUIRED");
});

test("a moved acceptance hash is no currency", () => {
  const derived = derivedOf({ acMatch: false });
  const body = renderRepairBody({ sha: SHA_B, unit: "698-toy-unit", reviewed: SHA_A, scope: derived.scope, classKind: "ceremony", route: "RE-REVIEW-SKIPPED", ac: DIGEST, gate: DIGEST, open: 0 });
  assert.equal(judgeRepair({ marker: parseRepairReceipt(body), headSha: SHA_B, derived }).currency, false);
});

test("a red gate is no currency", () => {
  const derived = derivedOf({ gateOk: false });
  const body = renderRepairBody({ sha: SHA_B, unit: "698-toy-unit", reviewed: SHA_A, scope: derived.scope, classKind: "ceremony", route: "RE-REVIEW-SKIPPED", ac: DIGEST, gate: DIGEST, open: 0 });
  assert.equal(judgeRepair({ marker: parseRepairReceipt(body), headSha: SHA_B, derived }).currency, false);
});

test("a source-bearing delta is no currency", () => {
  const derived = derivedOf({ classKind: null, paths: ["packages/agentic-workflow/src/core.mjs"] });
  const body = renderRepairBody({ sha: SHA_B, unit: "698-toy-unit", reviewed: SHA_A, scope: derived.scope, classKind: "ceremony", route: "RE-REVIEW-SKIPPED", ac: DIGEST, gate: DIGEST, open: 0 });
  assert.equal(judgeRepair({ marker: parseRepairReceipt(body), headSha: SHA_B, derived }).currency, false);
});

test("a stale gate receipt staled only by ceremony bookkeeping stays gate currency", () => {
  const derived = derivedOf({ gateOk: true, gateStalePaths: ["docs/features/698-toy-unit/review-findings.md", "docs/LOGS.md"] });
  const body = renderRepairBody({ sha: SHA_B, unit: "698-toy-unit", reviewed: SHA_A, scope: derived.scope, classKind: "ceremony", route: "RE-REVIEW-SKIPPED", ac: DIGEST, gate: DIGEST, open: 0 });
  const judged = judgeRepair({ marker: parseRepairReceipt(body), headSha: SHA_B, derived });
  assert.equal(judged.currency, true);
  assert.match(judged.reason, /gate/i);
  // A docs-only path in a stale gate delta is not gated evidence: no currency.
  const notGated = derivedOf({ gateStalePaths: ["docs/workflow/SETUP.md"] });
  assert.equal(judgeRepair({ marker: parseRepairReceipt(body), headSha: SHA_B, derived: { ...notGated, scope: derived.scope } }).currency, false);
});

test("the newest marker wins and an absent one judges nothing", () => {
  const one = renderRepairBody({ sha: SHA_A, unit: "698-toy-unit", reviewed: SHA_A, scope: DIGEST, classKind: "ceremony", route: "RE-REVIEW-SKIPPED", ac: DIGEST, gate: DIGEST, open: 0 });
  const two = one.replace(`sha=${SHA_A}`, `sha=${SHA_B}`);
  assert.equal(latestRepairReceipt([{ body: one }, { body: two }]).sha, SHA_B);
  assert.equal(latestRepairReceipt([{ body: "no marker here" }]), null);
});

test("emit refuses a head it cannot read and posts no commit", () => {
  const cwd = mkdtempSync(join(tmpdir(), "repair-emit-"));
  try {
    const git = (...args) => spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", ...args], { cwd, encoding: "utf8" });
    git("init", "-q");
    mkdirSync(join(cwd, "docs", "features", "698-toy-unit"), { recursive: true });
    writeFileSync(join(cwd, "docs", "features", "698-toy-unit", "SPEC.md"), "# 698 — toy\n");
    git("add", "-A");
    git("commit", "-qm", "base");
    const head = git("rev-parse", "HEAD").stdout.trim();
    const refusal = run(cwd, "emit", "--unit", "698-toy-unit", "--reviewed", "0".repeat(40), "--dry-run");
    assert.equal(refusal.code, 1);
    assert.match(refusal.stderr, /reviewed|ancestor|sha/i);
    const untouched = git("rev-parse", "HEAD").stdout.trim();
    assert.equal(untouched, head);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
