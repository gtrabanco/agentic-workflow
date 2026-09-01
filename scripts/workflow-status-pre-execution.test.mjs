#!/usr/bin/env node

/**
 * Feature 28 / P11 — AC20 (obligation O20): a clean unit and a never-reviewed
 * unit must be two different facts.
 *
 *   1. a zero-finding review that carries its durable mark reports `review-ran`;
 *   2. a findings ledger with no mark does NOT — its presence proves nothing.
 *
 * Both are proven here as computed decisions over fixture state, exactly as
 * AC20 words them ("the two fixtures required by AC20 are computed decisions,
 * not assertions that a file exists"). The fixture state is not hand-written:
 * the mark row is built from the shape `pre-execution-review`'s `LEDGERS.md`
 * declares, so this suite binds that normative surface to the decision and goes
 * red the moment the shape, its owner, or the sensor's keying drifts. Case 3 is
 * the negative control that stops the mark from being a rubber stamp: a mark
 * bound to a revision that is not the unit's head is a stale mark, never proof.
 *
 * Validators named: AC17 → scripts/pre-execution-quality.test.mjs,
 * AC18 → scripts/ledger-ownership.test.mjs, AC20 → this file.
 *
 * The repo root is re-pointable so the same suite can be run against a tree
 * extracted before this phase landed (`git archive <sha> | tar -x`) to prove it
 * fails there. Point it with WORKFLOW_STATUS_PRE_EXECUTION_REPO.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = process.env.WORKFLOW_STATUS_PRE_EXECUTION_REPO
  ? path.resolve(process.env.WORKFLOW_STATUS_PRE_EXECUTION_REPO)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");

const LEDGERS_REL = "skills/pre-execution-review/references/LEDGERS.md";
const SENSOR_CORE_REL = "skills/workflow-status/references/SENSOR_CORE.md";
const PRE_EXECUTION_REL = "skills/workflow-status/references/PRE_EXECUTION.md";
const TEMPLATE_RELS = ["docs/features/_TEMPLATE/LEDGERS.md", "docs/fix/_TEMPLATE/LEDGERS.md"];

/** The fold ledger's fixed columns, owned by `review-change`'s PERSIST_AND_DECIDE.md. */
const FOLD_COLUMNS = ["id", "file:line", "axis", "severity", "class", "route", "folded"];
const COL = Object.fromEntries(FOLD_COLUMNS.map((c, i) => [c, i]));

const HEAD_SHA = "3f2a9c8d7e6b5a4c3d2e1f0a9b8c7d6e5f4a3b2c";
const OLD_SHA = "b4c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1";

// --- the declared shape, read from the file that owns it ----------------------

const cellsOf = (line) => line.split("|").map((cell) => cell.trim());

/** Read the durable review mark's declared row shape out of its owner document. */
function declareMark(ledgerText) {
  const block = /```text\n(review-mark@1\n[\s\S]*?)\n```/.exec(ledgerText)?.[1];
  if (!block) {
    throw new Error(`${LEDGERS_REL} declares no review-mark@1 row shape — a clean review has nothing to write`);
  }
  const [, header, row] = block.split("\n");
  const columns = cellsOf(header);
  const values = cellsOf(row);
  if (columns.join("|") !== FOLD_COLUMNS.join("|")) {
    throw new Error(`${LEDGERS_REL} declares the mark outside the fold ledger's columns: ${columns.join(" | ")}`);
  }
  if (values.length !== columns.length) throw new Error(`${LEDGERS_REL}: the mark row does not fill every column`);
  const shaIndex = values.findIndex((v) => v.includes("<40-hex sha>"));
  if (shaIndex === -1) throw new Error(`${LEDGERS_REL}: the mark binds no revision, so it cannot go stale`);
  return { columns, values, id: values[COL.id], folded: values[COL.folded], shaColumn: columns[shaIndex], shaIndex };
}

let mark = null;
let shapeFault = null;
try {
  mark = declareMark(read(LEDGERS_REL));
} catch (error) {
  shapeFault = error;
}
/** Every fixture-built decision needs the shape; fail the test that lacks it. */
const requireShape = () => {
  if (shapeFault) throw shapeFault;
  return mark;
};

// --- fixture state: rows built from the declared shape ------------------------

/** The mark row for one reviewed revision, assembled from the declared cells. */
const markRow = (sha) => {
  const shape = requireShape();
  return `| ${shape.values.map((cell, i) => (i === shape.shaIndex ? `HEAD ${sha}` : cell)).join(" | ")} |`;
};

/** A finding row, i.e. what a review that found something writes. */
const findingRow = (id, file, { folded = "no", axis = "code", severity = "high", cls = "fix-now", route = "fold" } = {}) =>
  `| ${id} | ${file} | ${axis} | ${severity} | ${cls} | ${route} | ${folded} |`;

/** A unit's `review-findings.md` ledger as fixture state. */
const foldLedger = (rows) => [
  `| ${FOLD_COLUMNS.join(" | ")} |`,
  `|${FOLD_COLUMNS.map(() => "---").join("|")}|`,
  ...rows,
].join("\n");

const ledgerRows = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\|/.test(line) && !/^\|[\s|:-]*\|?$/.test(line) && !/^\|\s*id\s*\|/.test(line))
    .map((line) => cellsOf(line.replace(/^\||\|\s*$/g, "")));

// --- the sensor's own decisions, computed over that state ---------------------

/** step 8: does this unit carry a review mark for the state it is in now? */
function reviewState(ledgerText, headSha) {
  const shape = requireShape();
  const marks = ledgerRows(ledgerText).filter((row) => row[COL.id] === shape.id);
  if (marks.length === 0) return { ran: false, reason: "no-mark" };
  const bound = /HEAD ([0-9a-f]{40})\b/.exec(marks[marks.length - 1][COL[shape.shaColumn]]);
  if (!bound) return { ran: false, reason: "malformed-mark" };
  return bound[1] === headSha
    ? { ran: true, reason: "mark-current", marks: marks.length }
    : { ran: false, reason: "stale-mark", marks: marks.length };
}

/** step 9: the fix-now projection, unchanged — a mark is not a finding. */
const fixNowItems = (ledgerText) =>
  ledgerRows(ledgerText)
    .filter((row) => /^F\d+$/.test(row[COL.id]) && row[COL.class] === "fix-now" && row[COL.folded] === "no")
    .map((row) => row[COL.id]);

/** the three per-unit flags step 8 derives, with the PR audit marker it also reads */
function qualityGates({ ledgerText, headSha, auditSha = null, prHeadSha = null }) {
  const review = reviewState(ledgerText, headSha);
  const auditBound = Boolean(auditSha && auditSha === prHeadSha);
  return {
    review_pending: !review.ran,
    audit_pending: !auditBound,
    merge_ready: review.ran && auditBound,
    reason: review.reason,
  };
}

// --- the two AC20 cases, plus the control that keeps the mark honest ---------

test("AC20 fixture 1 — a zero-finding review carrying the durable mark reports review-ran", () => {
  const shape = requireShape();
  // The whole artifact a clean review leaves: the mark, and nothing else.
  const ledgerText = foldLedger([markRow(HEAD_SHA)]);

  assert.equal(reviewState(ledgerText, HEAD_SHA).ran, true, "the mark is the review-ran proof");
  assert.equal(reviewState(ledgerText, HEAD_SHA).reason, "mark-current");
  assert.deepEqual(fixNowItems(ledgerText), [], "a mark is not a finding — nothing enters fix_now[]");
  assert.equal(qualityGates({ ledgerText, headSha: HEAD_SHA }).review_pending, false);
  assert.match(shape.id, /^[A-Z][A-Z0-9-]+$/, "the mark id is a fixed sentinel, never a finding id");
});

test("AC20 fixture 2 — a findings ledger with no durable mark is not review-ran", () => {
  const ledgerText = foldLedger([
    findingRow("F1", "skills/foo/SKILL.md:10", { folded: "yes" }),
    findingRow("F2", "skills/foo/SKILL.md:22", { folded: "no" }),
  ]);

  const state = reviewState(ledgerText, HEAD_SHA);
  assert.equal(state.ran, false, "ledger presence proves nothing about any review");
  assert.equal(state.reason, "no-mark");
  const gates = qualityGates({ ledgerText, headSha: HEAD_SHA });
  assert.equal(gates.review_pending, true);
  assert.equal(gates.merge_ready, false);
  // Everything the ledger does prove stays proven: the open finding still folds.
  assert.deepEqual(fixNowItems(ledgerText), ["F2"]);
  // And the never-reviewed unit reads identically — the sensor reports the
  // missing mark, not a verdict about history.
  assert.deepEqual(reviewState(foldLedger([]), HEAD_SHA), reviewState(ledgerText, HEAD_SHA));
});

test("negative control — a mark bound to an older head is stale, never review-ran", () => {
  // Findings folded at an earlier state, a mark from the review that produced
  // them, then commits landed: newest mark ≠ current head.
  const ledgerText = foldLedger([
    findingRow("F1", "skills/foo/SKILL.md:10", { folded: "yes" }),
    markRow(OLD_SHA),
  ]);

  const state = reviewState(ledgerText, HEAD_SHA);
  assert.equal(state.ran, false);
  assert.equal(state.reason, "stale-mark");
  assert.equal(qualityGates({ ledgerText, headSha: HEAD_SHA, auditSha: OLD_SHA, prHeadSha: HEAD_SHA }).review_pending, true);
  // The same ledger read at the revision the mark names does report review-ran:
  // the mark is state-bound, not unit-bound.
  assert.equal(reviewState(ledgerText, OLD_SHA).ran, true);
  // A fresh act at the current head is what clears the gate — marks append, so
  // the older one remains as history and the newest one is the one read.
  const rerun = foldLedger([
    findingRow("F1", "skills/foo/SKILL.md:10", { folded: "yes" }),
    markRow(OLD_SHA),
    markRow(HEAD_SHA),
  ]);
  assert.equal(reviewState(rerun, HEAD_SHA).ran, true);
  assert.equal(reviewState(rerun, HEAD_SHA).marks, 2);
});

test("the mark's shape has one owner, and the map plus both projections name its writer", () => {
  const shape = requireShape();
  const ledgers = read(LEDGERS_REL);
  assert.match(ledgers, /\u00a78 owns/, "LEDGERS.md cites POLICY.md \u00a78 for when an act marks");
  assert.doesNotMatch(ledgers, /\bsame act\b|are one act|MARK REPLAY/, "\u00a78 stays the only owner of the write rule");
  assert.notEqual(shape.folded, "no", "a mark never enters a `folded: no` read");
  assert.doesNotMatch(shape.id, /^F\d+$/, "the annotator's F<n> row pattern must not match a mark");

  // The shape is stated once. A citation of the grammar id elsewhere is allowed —
  // one-line pointers are the convention — so the scan looks for a second
  // *declaration*: the marker together with its column header and its row.
  const definition = "review-mark@1\nid | file:line | axis | severity | class | route | folded\nREVIEW-RAN";
  const stated = [];
  for (const dir of ["skills", "docs"]) {
    for (const entry of fs.readdirSync(path.join(repoRoot, dir), { recursive: true })) {
      const rel = path.join(dir, entry).toString();
      if (!entry.toString().endsWith(".md") || !fs.statSync(path.join(repoRoot, rel)).isFile()) continue;
      if (read(rel).replace(/[ \t]+/g, " ").includes(definition)) stated.push(rel);
    }
  }
  assert.deepEqual(stated, [LEDGERS_REL], `the mark shape is defined in more than one file: ${stated.join(", ")}`);

  // The writer the map declares for it, in the authority and both copies.
  const ownerCells = [LEDGERS_REL, ...TEMPLATE_RELS].map((rel) => {
    const row = read(rel)
      .split("\n")
      .find((line) => /review-findings\.md/.test(line) && line.includes("review-change:"));
    const ownerIndex = row.trim().startsWith("review-findings") ? 2 : 1;
    return cellsOf(row)[ownerIndex].replace(/\s+/g, " ").trim();
  });
  assert.ok(ownerCells[0].includes("review-change:review-mark"), "the map declares no writer for the mark");
  assert.deepEqual([...new Set(ownerCells)].length, 1, `map and projections disagree: ${ownerCells.join(" / ")}`);
});

test("SENSOR_CORE keys step 8 on the mark and no longer reads ledger presence", () => {
  requireShape();
  const sensor = read(SENSOR_CORE_REL);
  const step8 = /(8\. \*\*Pending quality gates\.\*\*[\s\S]*?)9\. \*\*Fix-now fold ledger/.exec(sensor)?.[1];
  assert.ok(step8, "step 8 is gone from the sensor core");
  assert.match(step8, /durable review mark/);
  assert.match(step8, new RegExp(mark.id), "step 8 does not name the mark row it reads");
  assert.match(step8, /LEDGERS\.md/, "step 8 does not cite the file that owns the mark's shape");
  assert.match(step8, /current\s*\n?\s*head/, "step 8 lost the freshness keying");
  assert.doesNotMatch(step8, /rows at all|IS that artifact|presence, with/, "step 8 still reads ledger presence as proof");
  assert.match(step8, /presence is never that proof/);
  // Everything else step 8 owned is still owned: the audit marker and the flags.
  assert.match(step8, /comment marker on the PR/);
  assert.match(step8, /`review_pending`[\s\S]*`audit_pending`[\s\S]*`merge_ready`/);
  assert.doesNotMatch(sensor, /review-mark@1/, "the sensor restates the mark's row shape instead of citing its owner");
  // step 9's projection is untouched by the new row kind.
  assert.match(sensor, /read only its\s*\n?\s*`folded: no` rows/);
});

test("PRE_EXECUTION states the same keying, and reports a missing mark as a gate", () => {
  requireShape();
  const doc = read(PRE_EXECUTION_REL);
  assert.match(doc, /durable review mark/);
  assert.match(doc, new RegExp(mark.id));
  assert.match(doc, /LEDGERS\.md/, "no citation of the file that owns the shape");
  assert.match(doc, /current head/, "no freshness keying");
  assert.match(doc, /no\s*\n?\s*mark leaves the unit review-pending/);
  assert.doesNotMatch(doc, /review-mark@1/, "PRE_EXECUTION restates the mark's row shape");
  assert.doesNotMatch(doc, /presence of .*ledger.*proves/, "PRE_EXECUTION reads ledger presence as proof");
  // The step-6a sensing this file owns is unchanged: labels and legacy route.
  assert.match(doc, /\| `current` \| stage PASS verdict/);
  assert.match(doc, /### Legacy units/);
});
