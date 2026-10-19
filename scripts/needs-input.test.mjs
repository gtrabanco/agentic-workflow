#!/usr/bin/env node
/**
 * Corpus for `scripts/needs-input.mjs` — the behavioural contract of the
 * needs-input dispatcher. Fixtures are embedded strings written to a temporary
 * directory at run time: no network, no committed fixtures directory.
 *
 * Every assertion is at the CLI boundary (exit code + stdout block), because
 * that is the contract the consumer skills paste.
 */

import test, { after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const DISPATCHER = fileURLToPath(new URL("./needs-input.mjs", import.meta.url));
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "needs-input-corpus-"));

after(() => fs.rmSync(TMP, { recursive: true, force: true }));

let counter = 0;

/** Write a unit folder (`SPEC.md` + optional `decisions.md`) and return it. */
function unit({ spec = null, ledger = null } = {}) {
  const dir = path.join(TMP, `unit-${++counter}`);
  fs.mkdirSync(dir, { recursive: true });
  if (spec !== null) fs.writeFileSync(path.join(dir, "SPEC.md"), spec);
  if (ledger !== null) fs.writeFileSync(path.join(dir, "decisions.md"), ledger);
  return dir;
}

/** Run the dispatcher; returns { status, stdout, stderr }. */
function run(...args) {
  const result = spawnSync(process.execPath, [DISPATCHER, ...args], { encoding: "utf8" });
  if (result.error && result.error.code === "ENOENT") return null;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const SPEC = `# fix/300-example

## Tasks

- P1 — Do the thing (validator: \`true\` exits 0)
- P2 — Do the other thing (validator: \`true\` exits 0)

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
`;

const HEADER = "open-questions@1\n"
  + "id | date | type | question | blocks | search-receipt | options | route\n";

function ledger(...rows) {
  return `${HEADER}${rows.join("\n")}\n`;
}

const OPEN_Q1 = "Q1 | 2026-10-19 | open-question | Which unit kind is this? | P3 cannot be cut without it | "
  + "`grep -rn \"unit kind\" docs/` → no hit; docs/fix/README.md:12 names two kinds | "
  + "feature (whole pipeline) | fix (plan-first pipeline) | design";

/** Extract the block body between the `open-questions@1` header and the footer. */
function body(stdout) {
  const lines = stdout.split("\n");
  const startIndex = lines.findIndex((line) => line === "open-questions@1");
  return lines.slice(startIndex > -1 ? startIndex : 0);
}

test("open question, no decision → block on stdout, exit 0", () => {
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1) }));

  assert.equal(result.status, 0, result.stderr);
  const lines = body(result.stdout);
  assert.equal(lines[0], "open-questions@1");
  assert.match(result.stdout, /^Unit: .*unit-\d+$/m);
  assert.match(result.stdout, /^Open questions: 1$/m);
  assert.match(result.stdout, /^- Q1 · design · Which unit kind is this\?$/m);
  assert.match(result.stdout, /^  Blocks: P3 cannot be cut without it$/m);
  assert.match(result.stdout, /^  Searched: `grep -rn "unit kind" docs\/` → no hit; docs\/fix\/README.md:12 names two kinds$/m);
  assert.match(result.stdout, /^  Options:$/m);
  assert.match(result.stdout, /^    - feature \(whole pipeline\)$/m);
  assert.match(result.stdout, /^    - fix \(plan-first pipeline\)$/m);
  assert.match(result.stdout, /^Route back: design$/m);
  assert.match(result.stdout, /^Continuation: no-decision-available$/m);
  assert.match(result.stdout, /^Decision: open$/m);
});

test("a decided question is not pending", () => {
  const D1 = "D1 | 2026-10-19 | decision | Q1 | human-owner | fix — the issue tracks a defect | feature: the blast radius is one script";
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1, D1) }));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Open questions: 0$/m);
  assert.match(result.stdout, /^Pending: none$/m);
  assert.match(result.stdout, /^Continuation: none$/m);
  assert.match(result.stdout, /^Decision: none$/m);
});

test("a later open-question row re-opens the loop", () => {
  const D1 = "D1 | 2026-10-19 | decision | Q1 | human-owner | fix | feature";
  const Q2 = "Q2 | 2026-10-19 | open-question | Which script owns the guard? | P3 cannot start | "
    + "`rg -l \"needs-input\" scripts/` → no hit | scripts/needs-input.mjs (one owner) | "
    + "extend unit-route.mjs (no new script) | design";
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1, D1, Q2) }));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Open questions: 1$/m);
  assert.match(result.stdout, /^- Q2 · design · Which script owns the guard\?$/m);
});

test("last row is the machine entry", () => {
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1) }));

  assert.equal(result.status, 0, result.stderr);
  const lines = body(result.stdout);
  assert.equal(lines[lines.length - 1], "");
  assert.match(lines[lines.length - 2], /^Decision: open$/);
});

test("--json emits the same computation as JSON", () => {
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1) }), "--json");

  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.block, "open-questions@1");
  assert.match(parsed.unit, /^unit-\d+$/);
  assert.equal(parsed.open_questions.length, 1);
  assert.equal(parsed.open_questions[0].id, "Q1");
  assert.equal(parsed.open_questions[0].route, "design");
  assert.deepEqual(parsed.open_questions[0].options, [
    "feature (whole pipeline)",
    "fix (plan-first pipeline)",
  ]);
  assert.equal(parsed.continuation, "no-decision-available");
  assert.equal(parsed.decision, "open");
});

test("no decisions.md → exit 0, nothing pending (the ledger is optional)", () => {
  const result = run(unit({ spec: SPEC }));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Open questions: 0$/m);
});

test("missing unit folder → fails closed", () => {
  const result = run(path.join(TMP, "does-not-exist"));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^NEEDS-INPUT FAIL — needs-input@1$/m);
  assert.match(result.stdout, /^Reason: missing-unit-doc$/m);
  assert.match(result.stdout, /^Continuation: no-decision-available$/m);
});

test("missing SPEC.md → fails closed", () => {
  const dir = unit({ ledger: ledger(OPEN_Q1) });
  const result = run(dir);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: missing-unit-doc$/m);
});

test("no --tasks argument → usage error, exit 2", () => {
  const result = run();

  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage: needs-input\.mjs <unit-dir>/);
});

test("unknown option → usage error, exit 2", () => {
  const result = run(unit({ spec: SPEC }), "--nope");

  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown option: --nope/);
});

test("malformed ledger: no @1 header → fails closed", () => {
  const result = run(unit({ spec: SPEC, ledger: `Q1 | 2026-10-19 | open-question | x | y | z | a | design\n` }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: malformed-ledger-header$/m);
  assert.match(result.stdout, /^Where: decisions\.md:1$/m);
});

test("malformed ledger: unknown entry type → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("Q9 | 2026-10-19 | question | x | y | z | a | design"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: malformed-entry$/m);
  assert.match(result.stdout, /^Where: decisions\.md:3$/m);
});

test("malformed ledger: wrong cell count → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("Q1 | 2026-10-19 | open-question | only four cells"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: malformed-entry$/m);
});

test("malformed ledger: open question without a search receipt → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("Q1 | 2026-10-19 | open-question | x | y | none | a | design"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: missing-search-receipt$/m);
  assert.match(result.stdout, /^Where: decisions\.md:3$/m);
});

test("malformed ledger: open question with no options → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("Q1 | 2026-10-19 | open-question | x | y | grep → no hit | none | design"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: missing-options$/m);
});

test("malformed ledger: unknown route → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("Q1 | 2026-10-19 | open-question | x | y | grep → no hit | a | implement"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: unknown-route$/m);
});

test("malformed ledger: decision addressed to an unknown question → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("D1 | 2026-10-19 | decision | Q7 | human-owner | fix | feature"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: unknown-question$/m);
});

test("malformed ledger: decision without human-owner authority → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger(OPEN_Q1, "D1 | 2026-10-19 | decision | Q1 | execute-phase | fix | feature"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: invalid-authority$/m);
});

test("duplicate question id → fails closed", () => {
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1, OPEN_Q1) }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: duplicate-id$/m);
});

test("the block is versioned and byte-stable across runs", () => {
  const dir = unit({ spec: SPEC, ledger: ledger(OPEN_Q1) });
  const first = run(dir);
  const second = run(dir);

  assert.equal(first.status, 0);
  assert.equal(first.stdout, second.stdout);
  assert.match(first.stdout, /^open-questions@1$/m);
});

test("an escaped pipe stays inside its cell instead of shifting the columns", () => {
  const matrix = "Q1 | 2026-10-19 | open-question | Which one? | P3 cannot start | "
    + "`rg \"a\\|b\" docs/` → docs/x.md:3: | two-tables (fits the page) | "
    + "one-table (breaks the page) | unit-lane";
  const result = run(unit({ spec: SPEC, ledger: ledger(matrix) }));

  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('  Searched: `rg "a|b" docs/` → docs/x.md:3:'), result.stdout);
  assert.match(result.stdout, /^    - two-tables \(fits the page\)$/m);
  assert.match(result.stdout, /^    - one-table \(breaks the page\)$/m);
  assert.match(result.stdout, /^Route back: unit-lane$/m);
});

test("fenced examples inside decisions.md are quoted text, never entries", () => {
  const quoted = `${HEADER}\n\`\`\`text\nQ9 | 2026-10-19 | open-question | fenced example | x | y | a | design\n\`\`\`\n${OPEN_Q1}\n`;
  const result = run(unit({ spec: SPEC, ledger: quoted }));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Open questions: 1$/m);
  assert.ok(!result.stdout.includes("Q9"), result.stdout);
});
