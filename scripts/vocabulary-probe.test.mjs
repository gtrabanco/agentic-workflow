#!/usr/bin/env node

/**
 * vocabulary-probe.test.mjs — the validator probe's suite (unit 84, issue #315
 * S1, the F40 class).
 *
 * The frozen-failure corpus: the F40 defect (`kept deferred <date>` — a Future
 * status token outside the published vocabulary, still live at
 * `docs/features/79-spec-by-reference/SPEC.md:161,168` when this unit opened)
 * must fail the probe in a fixture naming `file:line`, and the clean fixture
 * must pass. The probe also runs against the repository itself: the head stays
 * in vocabulary.
 */

import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runProbe } from "./vocabulary-probe.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_ROOT = path.join(ROOT, "scripts", "fixtures", "vocabulary-probe", "tree");

/** The violations of one run, by vocabulary, for readable assertions. */
const violationsOf = (result, vocab) => result.violations.filter((violation) => violation.vocab === vocab);

test("#315 F40: the `kept deferred <date>` reproducer fails the probe naming file:line and token", () => {
  const result = runProbe(FIXTURE_ROOT);
  assert.equal(result.verdict, "BLOCKED: future-status-token");
  assert.equal(result.exitCode, 1);
  const violations = violationsOf(result, "future-status");
  assert.equal(violations.length, 1, "exactly the off-vocabulary row is refused");
  assert.match(violations[0].file, /90-off-vocab-future\/SPEC\.md$/);
  assert.equal(violations[0].line, 7, "the finding names the row's own line");
  assert.match(violations[0].token, /kept deferred 2026-10-26/);
  const block = result.lines.join("\n");
  assert.match(block, /^Vocabulary-probe: future-status .*90-off-vocab-future\/SPEC\.md:7$/m);
  assert.match(block, /kept deferred 2026-10-26/);
});

test("#315 F40 sibling: an off-vocabulary findings severity (`medium` vs the published `med`) fails", () => {
  const result = runProbe(FIXTURE_ROOT);
  const violations = violationsOf(result, "finding-severity");
  assert.equal(violations.length, 1);
  assert.match(violations[0].file, /90-off-vocab-future\/SPEC\.md$/);
  assert.match(violations[0].token, /^medium$/);
});

test("the clean fixture document passes every declared vocabulary", () => {
  const result = runProbe(FIXTURE_ROOT);
  for (const violation of result.violations) {
    assert.doesNotMatch(violation.file, /91-clean-future/, `the clean fixture is never named: ${violation.file}`);
  }
});

test("the repository's own head is in vocabulary", () => {
  const result = runProbe(ROOT);
  assert.equal(result.verdict, "PASS", `live violations: ${result.lines.join(" | ")}`);
  assert.equal(result.exitCode, 0);
  assert.ok(result.documentsChecked >= 1, "the probe scanned at least the in-flight unit docs");
});

test("closed units are not scanned (append-only evidence holds, decision D3)", () => {
  const result = runProbe(ROOT);
  for (const violation of result.violations) {
    assert.doesNotMatch(violation.file, /79-spec-by-reference/, "unit 79's recorded debt is never a live violation");
  }
});
