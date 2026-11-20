#!/usr/bin/env node
// test-obligation: protects=docs/workflow/REPOSITORY_STATE.md,skills/resolve-repository-state/references/STATE_CONTRACT.md obligations=contract,regression

/**
 * repository-state.test.mjs — the freshness contract and its reader (issue #646
 * S1).
 *
 * The failure this pins is not hypothetical: the committed snapshot froze F011
 * and AD-002 as current ("English-only, interim, feature 57 restores them per
 * release") three months after the owner reversed that decision on 2026-10-27,
 * and `WORKFLOW_INVARIANTS.md` ordered every architecture-touching session to
 * consume the snapshot *before* the tree. No mechanism could see it.
 *
 * The corpus below therefore reproduces the pre-fix shape as a failing check
 * before the fix exists: `F-646-1` is the F011/AD-002 contradiction (a fact
 * frozen at 2026-08-30, a decision dated 2026-11-19 that supersedes it) and its
 * required answer is `stale`, never consumption. `F-646-2`…`F-646-6` are the
 * refusal states a reader owes: a snapshot with no freshness date, a `stale`
 * fact with no supersession record, an undated decision, a ragged row, and an
 * empty table each answer a named fault instead of a guess.
 *
 * Fixtures are written under `tempRoot()` — one tracked temp root per test file,
 * cleaned unconditionally on exit (`scripts/temp-root.mjs`).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  CONTRACT_ID,
  FACT_STATUSES,
  FRESHNESS_VERDICTS,
  REASON_CODES,
  parseSnapshot,
  readRepositoryState,
} from "./repository-state.mjs";
import { tempRoot } from "./temp-root.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts", "repository-state.mjs");
const CONTRACT = path.join(ROOT, "skills", "resolve-repository-state", "references", "STATE_CONTRACT.md");
const LIVE = path.join(ROOT, "docs", "workflow", "REPOSITORY_STATE.md");

const scratch = tempRoot("aw646-state-");
let fixtureIndex = 0;

/** Write one fixture snapshot and answer its path. */
function fixture(text) {
  fixtureIndex += 1;
  const file = path.join(scratch, `snapshot-${fixtureIndex}.md`);
  fs.writeFileSync(file, text, "utf8");
  return file;
}

/** The pre-fix bytes: the F011/AD-002 contradiction, dated as the fossil was. */
const FOSSIL = `# Normalized Repository State

## Snapshot

| Field | Value |
|---|---|
| Snapshot ID | \`2026-08-30-first-pass-convergence\` |
| Source revision | \`ea646795aedfcbd9ecc7a89b30dc5e5efe6e3d14\` (\`main\`) |
| Status | \`frozen\` |
| Covers through | 2026-08-30 |
| Created at | 2026-08-30 |

## Repository facts

| ID | Statement | Evidence | Status |
|---|---|---|---|
| F011 | Human workflow documentation is English-only (interim, 2026-09-15): the bilingual \`.es.md\` siblings were removed repo-wide; feature 57 restores them per release. | \`AGENTS.md\`; \`docs/ROADMAP.md\` row 57 | frozen |

## Accepted decisions

| ID | Decision | Decided | Rationale | Evidence |
|---|---|---|---|---|
| AD-002 | Human docs are English-only until feature 57 restores per-release bilingual siblings. | 2026-08-30 | Removes the per-commit translation duty. | \`AGENTS.md\` |
| AD-011 | Documentation is English-only permanently; bilingualism moved to the web layer. | 2026-11-19 | Supersedes AD-002. | \`AGENTS.md\` § Working rules |
`;

/** The same shape, honest: the newer decision is the snapshot's own coverage. */
const FRESH = FOSSIL.replace("Covers through | 2026-08-30", "Covers through | 2026-11-20")
  .replace("| AD-011 | Documentation is English-only permanently; bilingualism moved to the web layer. | 2026-11-19", "| AD-011 | Documentation is English-only permanently; bilingualism moved to the web layer. | 2026-11-20");

const run = (args) => spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", env: { ...process.env, TZ: "UTC" } });

// ── the frozen-failure corpus ───────────────────────────────────────────────

test("F-646-1 a decision dated after covers-through answers stale, never consumption", () => {
  const file = fixture(FOSSIL);
  const state = readRepositoryState({ file, today: "2026-11-20" });
  assert.equal(state.verdict, "stale");
  assert.equal(state.contract, CONTRACT_ID);
  const contradiction = state.reasons.find((reason) => reason.code === "contradicted-by");
  assert.ok(contradiction, `the contradiction is named: ${JSON.stringify(state.reasons)}`);
  assert.match(contradiction.detail, /AD-011/);
  assert.match(contradiction.detail, /2026-11-19/);
  // the fossil fact is not silently rewritten: the reader reports, it never edits
  assert.equal(fs.readFileSync(file, "utf8"), FOSSIL);

  const result = run([file]);
  assert.equal(result.status, 1, "a stale snapshot is a failing exit");
  assert.match(result.stdout, /verdict: stale/);
  assert.match(result.stdout, /REASON contradicted-by/);
});

test("F-646-2 a snapshot with no covers-through is refused, not assumed fresh", () => {
  const file = fixture(FOSSIL.replace("| Covers through | 2026-08-30 |\n", ""));
  assert.throws(() => parseSnapshot(fs.readFileSync(file, "utf8")), /covers-through/);
  const result = run([file]);
  assert.equal(result.status, 1);
  assert.match(`${result.stdout}${result.stderr}`, /covers-through/);
});

test("F-646-3 a stale fact with no superseded-by refuses closed", () => {
  const file = fixture(FOSSIL.replace("| F011 | Human", "| F011 | Human").replace("| frozen |", "| stale |"));
  assert.throws(() => readRepositoryState({ file, today: "2026-11-20" }), /superseded-by/);
  const result = run([file]);
  assert.equal(result.status, 1);
  assert.match(`${result.stdout}${result.stderr}`, /superseded-by/);
});

test("F-646-4 an expired snapshot answers stale with the age, and the TTL is declared", () => {
  const file = fixture(FRESH);
  const inside = readRepositoryState({ file, today: "2026-11-20", ttlDays: 30 });
  assert.equal(inside.verdict, "fresh", JSON.stringify(inside.reasons));
  const outside = readRepositoryState({ file, today: "2027-06-01", ttlDays: 30 });
  assert.equal(outside.verdict, "stale");
  const expired = outside.reasons.find((reason) => reason.code === "expired");
  assert.ok(expired, JSON.stringify(outside.reasons));
  assert.match(expired.detail, /193 days/);
  const result = run(["--ttl-days", "0", LIVE]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /REASON expired/);
});

test("F-646-5 a decision dated on or before covers-through leaves the verdict fresh", () => {
  const state = readRepositoryState({ file: fixture(FRESH), today: "2026-11-20" });
  assert.equal(state.verdict, "fresh");
  assert.deepEqual(state.reasons, []);
  const result = run([fixture(FRESH)]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /verdict: fresh/);
});

test("F-646-6 an undated decision or a ragged row is a named fault, not a skipped row", () => {
  const undated = fixture(FOSSIL.replace("| 2026-11-19 | Supersedes AD-002.", "|  | Supersedes AD-002."));
  assert.throws(() => readRepositoryState({ file: undated, today: "2026-11-20" }), /undated-decision/);
  const ragged = fixture(FOSSIL.replace("| AD-002 | Human docs are English-only until feature 57 restores per-release bilingual siblings. | 2026-08-30 | Removes the per-commit translation duty. | `AGENTS.md` |", "| AD-002 | Human docs are English-only. | 2026-08-30 | Removes the per-commit translation duty. |"));
  assert.throws(() => readRepositoryState({ file: ragged, today: "2026-11-20" }), /ragged-row/);
  const missing = fixture(FOSSIL.slice(0, FOSSIL.indexOf("## Repository facts")));
  assert.throws(() => parseSnapshot(fs.readFileSync(missing, "utf8")), /facts/);
});

// ── the contract's own surfaces ─────────────────────────────────────────────

test("the published vocabularies are the reader's, and the grammar block agrees", () => {
  assert.deepEqual([...FRESHNESS_VERDICTS], ["fresh", "stale"]);
  assert.deepEqual([...FACT_STATUSES], ["frozen", "stale"]);
  assert.ok(REASON_CODES.includes("contradicted-by"));
  assert.ok(REASON_CODES.includes("expired"));

  const contract = fs.readFileSync(CONTRACT, "utf8");
  assert.match(contract, new RegExp(`\\n\\\`\\\`\\\`text\\n${CONTRACT_ID}\\n`), "the contract publishes its own block");
  for (const field of ["covers-through", "decided", "superseded-by"]) {
    assert.match(contract, new RegExp(field), `the block names ${field}`);
  }
  for (const verdict of FRESHNESS_VERDICTS) assert.match(contract, new RegExp(verdict), `the block names ${verdict}`);
});

test("the committed snapshot is fresh, dated and free of the retired interim claim", () => {
  const state = readRepositoryState({ file: LIVE, today: "2026-11-20" });
  assert.equal(state.verdict, "fresh", JSON.stringify(state.reasons));
  assert.match(state.coversThrough, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(state.facts.length >= 10, `the snapshot carries its facts: ${state.facts.length}`);
  assert.ok(state.decisions.length >= 8, `the snapshot carries its accepted decisions: ${state.decisions.length}`);
  assert.ok(!fs.readFileSync(LIVE, "utf8").includes("feature 57 restores"), "the fossil interim claim is gone");
  const result = run([LIVE]);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  assert.match(result.stdout, /^repository-state — /m);
});

test("the reader is read-only: it never writes the snapshot it judges", () => {
  const file = fixture(FOSSIL);
  const before = fs.statSync(file).mtimeMs;
  run([file]);
  assert.equal(fs.statSync(file).mtimeMs, before);
  assert.equal(fs.readFileSync(file, "utf8"), FOSSIL);
});
