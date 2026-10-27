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
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { runProbe, inFlightDocs } from "./vocabulary-probe.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURE_ROOT = path.join(ROOT, "scripts", "fixtures", "vocabulary-probe", "tree");

/** The violations of one run, by vocabulary, for readable assertions. */
const violationsOf = (result, vocab) => result.violations.filter((violation) => violation.vocab === vocab);

test("#315 F40: the `kept deferred <date>` reproducer fails the probe naming file:line and token", () => {
  const result = runProbe(FIXTURE_ROOT);
  // The non-vacuity guarantee lives on this frozen corpus, never on the
  // repository's transient roadmap state (review F1): a settled head scans
  // nothing, and that is the rule working, not the probe being broken.
  assert.equal(result.documentsChecked, 2, "both fixture unit docs are in the corpus");
  assert.deepEqual(
    [...result.documents].sort(),
    [
      "docs/features/90-off-vocab-future/SPEC.md",
      "docs/features/91-clean-future/SPEC.md",
    ].sort(),
    "the corpus is exactly the docs the fixture roadmap still calls in flight",
  );
  assert.equal(result.verdict, "BLOCKED: future-status-token");
  assert.equal(result.exitCode, 1);
  const violations = violationsOf(result, "future-status");
  assert.equal(violations.length, 1, "exactly the off-vocabulary row is refused");
  assert.match(violations[0].file, /90-off-vocab-future\/SPEC\.md$/);
  assert.equal(violations[0].line, 9, "the finding names the row's own line");
  assert.match(violations[0].token, /kept deferred 2026-10-26/);
  const block = result.lines.join("\n");
  assert.match(block, /^Vocabulary-probe: future-status .*90-off-vocab-future\/SPEC\.md:9 — `kept deferred 2026-10-26`$/m);
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

test("#315 F6: a fenced off-vocabulary quote is the fold's evidence, not a violation", () => {
  // The clean fixture quotes the F40 token inside a fenced block. Reading the
  // section through the shared fence-aware reader keeps it out of the corpus;
  // an inline fence walk that lost the open/close pairing would flag it and
  // this case goes red — the durable check for the dead/duplicated walks F4/F6.
  const clean = runProbe(FIXTURE_ROOT).violations.filter((violation) => /91-clean-future/.test(violation.file));
  assert.deepEqual(clean, [], "the fenced `kept deferred` quote is exempt");
});

test("the repository's own head is in vocabulary", () => {
  const result = runProbe(ROOT);
  assert.equal(result.verdict, "PASS", `live violations: ${result.lines.join(" | ")}`);
  assert.equal(result.exitCode, 0);
  // F1 (review cycle 1): the pin used to be `documentsChecked >= 1`, which
  // gated the suite on the release step's own roadmap write — `done · [#N]`
  // is the prescribed state once the PR exists, and a validator must never
  // gate on a surface another workflow actor mutates. The corpus rule is now
  // pinned against an independent reading of the indexes instead.
  assert.deepEqual(
    [...result.documents].sort(),
    [...corpusFromTheIndexes(ROOT)].sort(),
    "the probe scanned exactly the unit docs the indexes still call in flight",
  );
});

test("the corpus rule is the documented one, re-derived from the indexes", () => {
  // An independent oracle for decision D3: a row is in flight when its status
  // cell is not settled and its doc exists and carries a dated progress entry.
  const derived = corpusFromTheIndexes(ROOT);
  const probe = inFlightDocs(ROOT).map((doc) => doc.file);
  assert.deepEqual([...probe].sort(), [...derived].sort(), "the probe's corpus matches the re-derived set");
});

/**
 * The in-flight corpus read straight off the two indexes — the test's own
 * parse of the published row shape, deliberately not the probe's code.
 */
function corpusFromTheIndexes(root) {
  const settled = /done|discarded|superseded/i;
  const dated = /\d{4}-\d{2}-\d{2} \d{2}:\d{2} — /;
  const rows = [];
  const roadmap = path.join(root, "docs/features/ROADMAP.md");
  if (existsSync(roadmap)) {
    for (const line of readFileSync(roadmap, "utf8").split(/\r?\n/)) {
      const row = /^\|\s*(\d+)\s*\|\s*`([a-z0-9-]+)`\s*\|\s*([^|]+)\|/.exec(line);
      if (row === null || settled.test(row[3])) continue;
      rows.push(`docs/features/${row[1]}-${row[2]}/SPEC.md`);
    }
  }
  const index = path.join(root, "docs/fix/README.md");
  if (existsSync(index)) {
    for (const line of readFileSync(index, "utf8").split(/\r?\n/)) {
      const row = /^\|\s*\[#(\d+)\]\([^)]*\)\s*\|\s*([a-z0-9-]+)\s*\|\s*`?([a-z-]+)`?/.exec(line);
      if (row === null || /done/i.test(row[3])) continue;
      rows.push(`docs/fix/${row[1]}-${row[2]}/SPEC.md`);
    }
  }
  return rows.filter((file) => {
    const absolute = path.join(root, file);
    return existsSync(absolute) && dated.test(readFileSync(absolute, "utf8"));
  });
}

test("closed units are not scanned (append-only evidence holds, decision D3)", () => {
  const result = runProbe(ROOT);
  for (const violation of result.violations) {
    assert.doesNotMatch(violation.file, /79-spec-by-reference/, "unit 79's recorded debt is never a live violation");
  }
});
