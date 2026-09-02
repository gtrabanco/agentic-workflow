#!/usr/bin/env node

/**
 * Feature 28 / P11 + P16 (finding F38) — AC20 (obligation O20): a clean unit and a
 * never-reviewed unit must be two different facts.
 *
 *   1. a zero-finding review that carries its durable mark reports `review-ran`;
 *   2. a findings ledger with no mark does NOT — its presence proves nothing;
 *   3. a bound input moved after the mark → stale, never proof.
 *
 * All three are computed decisions over fixture state, exactly as AC20 words them
 * ("the two fixtures required by AC20 are computed decisions, not assertions that a
 * file exists"). The fixture state is not hand-written either: the mark row is built
 * from the shape `pre-execution-review`'s `LEDGERS.md` declares, and the state it is
 * decided over is a **real git repository under `os.tmpdir()`** whose revisions come
 * from commits this file makes — the same discipline `scripts/pre-execution-sensor.test.mjs`
 * states for the digest sensor ("no test may commit into the repository it is
 * checking"). P16's fold (finding F38) is what moved the head here out of a constant:
 * a fixture that *injected* `headSha` could only ever exercise the branch where the
 * mark names the head, so it proved an unreachable state and stayed green while no
 * real review turn could ever produce that answer.
 *
 * The rule applied to that git state is not this file's either: `declareCurrencyRule`
 * reads the mechanical test out of `SENSOR_CORE.md` step 8 and applies what the
 * sensor actually orders. Run against the tree before the F38 fold
 * (`git archive <sha> | tar -x`, `WORKFLOW_STATUS_PRE_EXECUTION_REPO=<dir>`) the
 * document still keys currency on equality with the current head, so case 1 goes red
 * on the reachability of `mark-current` itself — which is the defect, not a paraphrase
 * of it. A regression of step 8 back to head-equality re-breaks this suite.
 *
 * Validators named: AC17 → scripts/pre-execution-quality.test.mjs,
 * AC18 → scripts/ledger-ownership.test.mjs, AC20 → this file.
 *
 * The repo root is re-pointable so the same suite can be run against a tree
 * extracted before this phase landed to prove it fails there. Point it with
 * WORKFLOW_STATUS_PRE_EXECUTION_REPO.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
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

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

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

// --- the sensor's currency rule, read out of the document that orders it ------

const STEP8 = /(8\. \*\*Pending quality gates\.\*\*[\s\S]*?)9\. \*\*Fix-now fold ledger/;

/**
 * Which mechanical test does step 8 order for "is this mark still current?"
 * Exactly two forms are legal, and each is applied to real git state below:
 * `head-equality` (the sha the mark names *is* HEAD) and `bound-input-ancestry`
 * (the sha is an ancestor of HEAD and no later commit touched a bound input).
 * A step 8 that names neither leaves the sensor with no test to run, which is a
 * failure of this suite, not a licence to invent one here.
 */
function declareCurrencyRule(sensorText) {
  const step8 = STEP8.exec(sensorText)?.[1];
  if (!step8) throw new Error(`${SENSOR_CORE_REL}: step 8 is gone — nothing keys the review-run proof`);
  const flat = step8.replace(/\s+/g, " ");
  if (/ancestor/.test(flat) && /no commit after it touched a bound input/.test(flat)) {
    return { kind: "bound-input-ancestry", text: flat };
  }
  if (/is the unit's current\s+head|is the unit's current head/.test(flat)) {
    return { kind: "head-equality", text: flat };
  }
  throw new Error(`${SENSOR_CORE_REL} step 8 states no mechanical currency test the sensor can apply`);
}

const currencyRule = declareCurrencyRule(read(SENSOR_CORE_REL));

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

// --- a real repository: the revisions are commits, and this file makes them ---

const unitDir = (unit) => `docs/features/${unit}`;
const LEDGER_REL = (unit) => `${unitDir(unit)}/review-findings.md`;
const SPEC_REL = (unit) => `${unitDir(unit)}/SPEC.md`;

/**
 * The paths a plan-stage review binds. Not written here: `SNAPSHOT.md` names this set
 * in prose and `scripts/pre-execution-snapshot.mjs` implements it as `STAGE_ARTIFACTS`,
 * so the file names are read out of that table — a stage gaining an artifact moves this
 * fixture with it instead of letting the fixture quietly test a smaller set. The table
 * is read as text, not imported: `dist/` is a gitignored build output, and a red-first
 * run against `git archive <sha>` has no built schema to load.
 */
function boundInputsFor(unit, snapshotSource) {
  const plan = /plan:\s*\[([\s\S]*?)\n\s*\],/.exec(snapshotSource)?.[1];
  if (!plan) throw new Error("pre-execution-snapshot.mjs declares no plan-stage artifact table");
  const files = [...plan.matchAll(/file:\s*"([^"]+)"/g)].map((m) => m[1]);
  if (!files.length) throw new Error("the plan-stage artifact table names no file");
  return files.map((file) => `${unitDir(unit)}/${file}`);
}

const SNAPSHOT_BUILDER_REL = "scripts/pre-execution-snapshot.mjs";
const boundTable = () => read(SNAPSHOT_BUILDER_REL);

/**
 * A toy repository holding one review unit: the artifacts a review binds, plus the
 * fold ledger the durable mark lives in. Every revision below is a commit this file
 * makes — the states under test are reachable ones.
 */
function makeReviewRepo(t, unit = "99-toy") {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-status-mark-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  git(dir, "-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "init", "-q", "-b", "main");
  const write = (rel, text) => {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  };
  const commit = (message) => {
    git(dir, "add", "-A");
    git(dir, "-c", "user.name=fixture", "-c", "user.email=fixture@example.invalid", "commit", "-q", "-m", message);
    return git(dir, "rev-parse", "HEAD");
  };

  write(SPEC_REL(unit), `# ${unit}\n\n## Goal\n\nShip the thing.\n`);
  write(`${unitDir(unit)}/ACCEPTANCE.md`, "# Acceptance\n\n- A1 the thing ships.\n");
  write(`${unitDir(unit)}/TASKS.md`, `## P1 \u2014 Implementation\n\n- [x] Ship it.\n`);
  const first = commit(`docs(${unit}): the planning artifacts a review binds`);

  return {
    dir,
    unit,
    ledger: () => fs.readFileSync(path.join(dir, LEDGER_REL(unit)), "utf8"),
    head: () => git(dir, "rev-parse", "HEAD"),
    /** The review turn's terminal act: write the rows, commit them, return the new head. */
    commitLedger: (rows, message = "docs(review): record the review") => {
      write(LEDGER_REL(unit), foldLedger(rows));
      return commit(message);
    },
    /** A commit that moves a bound input — the only kind of commit that ages a mark. */
    commitBoundChange: (message = "docs(spec): a bound input moved") => {
      write(SPEC_REL(unit), `# ${unit}\n\n## Goal\n\nShip the thing, and its export.\n`);
      return commit(message);
    },
    /** What a mark's currency is tested against: the artifact set the review bound. */
    boundInputs: boundInputsFor(unit, boundTable()),
    first,
  };
}

// --- the sensor's own decisions, computed over that state ---------------------

/** step 8's currency test, applied as the sensor's document orders it. */
function markIsCurrent(repo, markSha) {
  const head = repo.head();
  if (currencyRule.kind === "head-equality") return markSha === head;
  let named;
  try {
    named = git(repo.dir, "rev-parse", "--verify", "--quiet", `${markSha}^{commit}`);
  } catch {
    return false; // a mark naming a revision outside this history binds nothing
  }
  return git(repo.dir, "log", "--format=%H", `${named}..${head}`, "--", ...repo.boundInputs).trim() === "";
}

/** step 8: does this unit carry a review mark for the state it is in now? */
function reviewState(ledgerText, repo) {
  const shape = requireShape();
  const marks = ledgerRows(ledgerText).filter((row) => row[COL.id] === shape.id);
  if (marks.length === 0) return { ran: false, reason: "no-mark" };
  const bound = /HEAD ([0-9a-f]{40})\b/.exec(marks[marks.length - 1][COL[shape.shaColumn]]);
  if (!bound) return { ran: false, reason: "malformed-mark" };
  return markIsCurrent(repo, bound[1])
    ? { ran: true, reason: "mark-current", marks: marks.length }
    : { ran: false, reason: "stale-mark", marks: marks.length };
}

/** step 9: the fix-now projection, unchanged — a mark is not a finding. */
const fixNowItems = (ledgerText) =>
  ledgerRows(ledgerText)
    .filter((row) => /^F\d+$/.test(row[COL.id]) && row[COL.class] === "fix-now" && row[COL.folded] === "no")
    .map((row) => row[COL.id]);

/** the three per-unit flags step 8 derives, with the PR audit marker it also reads */
function qualityGates({ ledgerText, repo, auditSha = null, prHeadSha = null }) {
  const review = reviewState(ledgerText, repo);
  const auditBound = Boolean(auditSha && auditSha === prHeadSha);
  return {
    review_pending: !review.ran,
    audit_pending: !auditBound,
    merge_ready: review.ran && auditBound,
    reason: review.reason,
  };
}

// --- the three AC20 states, plus the control that keeps the mark honest ------

const REVIEWED = [
  findingRow("F1", "skills/foo/SKILL.md:10", { folded: "yes" }),
  findingRow("F2", "skills/foo/SKILL.md:22"),
];

test("AC20 fixture 1 — the mark a real review turn leaves is current at the head that carries it", (t) => {
  const shape = requireShape();
  const repo = makeReviewRepo(t);
  // The review runs at `repo.first`; its terminal act writes the mark and commits
  // it, which is how POLICY.md §8 orders the act. So the sha the mark names is
  // HEAD's parent by construction, and only step 8's rule decides the answer.
  const markCommit = repo.commitLedger([markRow(repo.first)]);
  assert.notEqual(markCommit, repo.first, "marking is a commit, so the head moved: this is what a real review leaves");

  const state = reviewState(repo.ledger(), repo);
  assert.equal(
    state.reason,
    "mark-current",
    `step 8 keys currency on "${currencyRule.kind}", which no real review turn can satisfy: the commit that carries ` +
      `the mark moves the head the mark is compared against, so ${SENSOR_CORE_REL} can never report review-ran for a ` +
      `unit reviewed at the revision it names, and AC20's mark-present fixture is unreachable.`,
  );
  assert.equal(state.ran, true, "the mark is the review-ran proof");
  assert.equal(qualityGates({ ledgerText: repo.ledger(), repo }).review_pending, false);
  assert.deepEqual(fixNowItems(repo.ledger()), [], "a mark is not a finding — nothing enters fix_now[]");
  assert.match(shape.id, /^[A-Z][A-Z0-9-]+$/, "the mark id is a fixed sentinel, never a finding id");
});

test("AC20's three states are three computed answers, each created by a commit this fixture makes", (t) => {
  const repo = makeReviewRepo(t);
  // (a) markless — a findings ledger with rows, committed, no mark anywhere.
  repo.commitLedger(REVIEWED, "docs(review): the findings this review filed");
  const reviewedAt = repo.head();
  const markless = reviewState(repo.ledger(), repo);
  assert.equal(markless.reason, "no-mark");
  assert.equal(markless.ran, false, "ledger presence proves nothing about any review");
  // Everything the ledger does prove stays proven: the open finding still folds.
  assert.deepEqual(fixNowItems(repo.ledger()), ["F2"]);
  // and a never-reviewed unit reads identically — the sensor reports the missing
  // mark, never a verdict about history.
  assert.deepEqual(reviewState(foldLedger([]), repo), markless);

  // (b) current-mark — the same ledger marked at the revision it now holds.
  repo.commitLedger([...REVIEWED, markRow(reviewedAt)], "docs(review): mark the review that ran");
  const current = reviewState(repo.ledger(), repo);
  assert.equal(current.reason, "mark-current", `the rule step 8 states (${currencyRule.kind}) does not survive the commit that carries its own mark`);
  assert.equal(current.ran, true);

  // (c) stale-mark — a bound input moves afterwards: the reviewed bytes changed.
  repo.commitBoundChange();
  const stale = reviewState(repo.ledger(), repo);
  assert.equal(stale.reason, "stale-mark");
  assert.equal(stale.ran, false);
  assert.equal(qualityGates({ ledgerText: repo.ledger(), repo }).review_pending, true);
  assert.equal(qualityGates({ ledgerText: repo.ledger(), repo }).merge_ready, false);

  assert.deepEqual(
    [markless.reason, current.reason, stale.reason],
    ["no-mark", "mark-current", "stale-mark"],
    "AC20 needs three distinguishable states, and the sensor's own rule must reach all three",
  );
});

test("a mark survives its own commit because the fold ledger is not a bound input", (t) => {
  const repo = makeReviewRepo(t);
  assert.ok(
    !repo.boundInputs.includes(LEDGER_REL(repo.unit)),
    "the fold ledger must not be a bound input: the mark's own commit would age the mark on arrival",
  );
  assert.ok(
    repo.boundInputs.includes(SPEC_REL(repo.unit)) && repo.boundInputs.includes(`${unitDir(repo.unit)}/TASKS.md`),
    "the bound set is not the snapshot's artifact set, so this case no longer tests the sensor's rule",
  );
  assert.equal(new Set(repo.boundInputs).size, repo.boundInputs.length, "the bound set carries a duplicate");
  const markCommit = repo.commitLedger([markRow(repo.first)]);
  assert.equal(
    git(repo.dir, "log", "--format=%H", `${repo.first}..${markCommit}`, "--", ...repo.boundInputs).trim(),
    "",
    "the mark's commit touched a bound input, so this fixture no longer isolates the rule",
  );
  assert.equal(markIsCurrent(repo, repo.first), true, `under step 8's "${currencyRule.kind}" rule a freshly committed mark must be current`);
});

test("negative control — a mark naming a revision outside this history is stale, never review-ran", (t) => {
  const repo = makeReviewRepo(t);
  const foreign = "b4c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1";
  const ledgerText = foldLedger([...REVIEWED, markRow(foreign)]);
  repo.commitLedger([...REVIEWED, markRow(foreign)]);
  const state = reviewState(ledgerText, repo);
  assert.equal(state.ran, false);
  assert.equal(state.reason, "stale-mark");
  assert.equal(qualityGates({ ledgerText, repo, auditSha: foreign, prHeadSha: repo.head() }).review_pending, true);
  // The same ledger read at the revision its mark names does report review-ran:
  // the mark is state-bound, not unit-bound.
  repo.commitLedger([...REVIEWED, markRow(repo.first)], "docs(review): mark the reviewed revision");
  assert.equal(reviewState(repo.ledger(), repo).ran, true);
  // Marks append: the older one stays as history, the newest one is what is read.
  const rerun = foldLedger([markRow(foreign), markRow(repo.head())]);
  assert.equal(reviewState(rerun, repo).ran, true);
  assert.equal(reviewState(rerun, repo).marks, 2);
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

test("SENSOR_CORE keys step 8 on the mark and states a currency a real review survives", () => {
  requireShape();
  const sensor = read(SENSOR_CORE_REL);
  const step8 = STEP8.exec(sensor)?.[1];
  assert.ok(step8, "step 8 is gone from the sensor core");
  assert.match(step8, /durable review mark/);
  assert.match(step8, new RegExp(mark.id), "step 8 does not name the mark row it reads");
  assert.match(step8, /LEDGERS\.md/, "step 8 does not cite the file that owns the mark's shape");
  // F38: the keying must be the ordering rule, its mechanical form named, and the
  // bound set cited to its owner rather than restated here.
  assert.equal(currencyRule.kind, "bound-input-ancestry", "step 8 keys the mark on equality with the head that carries it");
  assert.match(step8, /git log\s*`?<mark-sha>\.\.HEAD\s*--\s*<bound paths>`?/, "step 8 names no mechanical currency test");
  assert.match(step8, /SNAPSHOT\.md/, "step 8 does not cite the owner of the bound paths");
  assert.doesNotMatch(step8, /is the unit's\s+current\s+head/, "step 8 restored head-equality, which no review turn satisfies");
  assert.doesNotMatch(step8, /rows at all|IS that artifact|presence, with/, "step 8 still reads ledger presence as proof");
  assert.match(step8, /presence is never that proof/);
  // Everything else step 8 owned is still owned: the audit marker and the flags.
  assert.match(step8, /comment marker on the PR/);
  assert.match(step8, /`review_pending`[\s\S]*`audit_pending`[\s\S]*`merge_ready`/);
  assert.doesNotMatch(sensor, /review-mark@1/, "the sensor restates the mark's row shape instead of citing its owner");
  // step 9's projection is untouched by the new row kind.
  assert.match(sensor, /read only its\s+`folded: no` rows/);
});

test("PRE_EXECUTION cites step 8's currency and reports a missing mark as a gate", () => {
  requireShape();
  const doc = read(PRE_EXECUTION_REL);
  assert.match(doc, /durable review mark/);
  assert.match(doc, new RegExp(mark.id));
  assert.match(doc, /LEDGERS\.md/, "no citation of the file that owns the shape");
  // One owner per rule: the projection cites step 8's currency rule instead of
  // restating a keying, so the head-equality wording must be gone from here too.
  assert.match(doc, /step 8's currency rule/, "PRE_EXECUTION states no pointer to the rule it applies");
  assert.doesNotMatch(doc, /is the unit's current head/, "PRE_EXECUTION restates a second currency rule");
  assert.match(doc, /no\s+mark leaves the unit\s+review-pending/);
  assert.doesNotMatch(doc, /review-mark@1/, "PRE_EXECUTION restates the mark's row shape");
  assert.doesNotMatch(doc, /presence of .*ledger.*proves/, "PRE_EXECUTION reads ledger presence as proof");
  // The step-6a sensing this file owns is unchanged: labels and legacy route.
  assert.match(doc, /\| `current` \| stage PASS verdict/);
  assert.match(doc, /### Legacy units/);
});
