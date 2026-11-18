#!/usr/bin/env node
/**
 * journal-corpus.test.mjs — the journal carrier's sibling suite (issue #616).
 *
 * The failure this unit closes is a gap, so its frozen reproducer is the reader
 * that did not exist: the session journal — `docs/LOGS.md` plus the
 * `.agentic-workflow/journal/` fragments — was read by no corpus carrier, no
 * audit dimension and no gate. This suite was observed RED against that tree
 * (the import below names the missing module) before any implementation landed.
 *
 * What it pins, one case per rule:
 *
 *  - **The receipt.** One block, three signal kinds, every row carrying its
 *    `file:line` and a digest of its own bytes — the `findings-corpus@1`
 *    contract the journal joins.
 *  - **Both carriers.** The aggregated journal and the pending fragments, and
 *    the declared `insufficient-input` verdict when neither exists.
 *  - **The join.** A journal row resolves onto the findings corpus by
 *    `(unit, F<n>)` through the corpus's own `buildCorpus`; a class is a
 *    resolved row, and everything else is `unjoined` with its reason.
 *  - **The attribution.** A recurring joined class reuses the corpus's
 *    `axis → phase` map and its inventory destination; an unknown axis is
 *    `unmapped`, never guessed.
 *  - **The boundary.** The reader writes nothing and decides no threshold.
 *
 * Run: `bun test scripts/journal-corpus.test.mjs`
 * (fallback `node --test scripts/journal-corpus.test.mjs`).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { renderEntry } from "../packages/agentic-workflow/src/log/render.mjs";
import { renderEntryBlock } from "../packages/agentic-workflow/src/journal/block.mjs";
import {
  DEFAULT_RECURRENCE,
  FRAGMENTS_REL,
  JOURNAL_CORPUS_CONTRACT,
  LOG_REL,
  SIGNAL_KINDS,
  buildJournalCorpus,
  parseEntryHeading,
  parseJournalText,
  renderReceipt,
  unitOfBranch,
} from "./journal-corpus.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repoRoot, "scripts", "journal-corpus.mjs");
const fixtureCli = path.join(repoRoot, "scripts", "product-audit-journal-fixture.mjs");
const read = (relative) => fs.readFileSync(path.join(repoRoot, relative), "utf8");

/** A throwaway project root; the caller removes it in `finally`. */
const scratch = () => fs.mkdtempSync(path.join(os.tmpdir(), "journal-corpus-"));
const clean = (dir) => fs.rmSync(dir, { recursive: true, force: true });

const write = (root, relative, text) => {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
};

/** The migrated findings carrier, in the shape the corpus already reads. */
const findingsTable = (rows) =>
  [
    "## Findings",
    "",
    "| id | S# / file:line | axis | severity | impact | class | route |",
    "|---|---|---|---|---|---|---|",
    ...rows.map((row) => `| ${row.id} | ${row.ref} | ${row.axis} | ${row.severity} | ${row.impact} | ${row.klass} | fold |`),
    "",
  ].join("\n");

const ROW_F1 = { id: "F1", ref: "S1 · `scripts/example.mjs`:12", axis: "code", severity: "WARNING", impact: "blocking", klass: "fix-now" };
const ROW_F2 = { id: "F2", ref: "S1 · `scripts/other.mjs`:7", axis: "spec-drift", severity: "SUGGESTION", impact: "report-only", klass: "fix-now" };

/**
 * One project carrying both carriers: two journal entries on one unit (rework),
 * a correcting line naming F1 (a joined class), a refutation naming F2 (an
 * admitted false positive) and a correction naming nothing (unjoined).
 */
function seededProject(dir) {
  write(dir, "docs/features/1-fixture-unit/SPEC.md", `# 1 — fixture-unit\n\n${findingsTable([ROW_F1, ROW_F2])}`);
  write(
    dir,
    LOG_REL,
    [
      "# Session log",
      "",
      "## 2026-11-01T10:00:00Z — feat/1-fixture-unit — manual",
      "- **Commits:** 1",
      "- **Summary:** first pass.",
      "- **Correction:** the verdict in F1 was read against bytes a merge had already replaced.",
      "",
      "## 2026-11-02T11:00:00Z — feat/1-fixture-unit — manual",
      "- **Commits:** 2",
      "- **Summary:** F2 was refuted with counter-evidence; the concurrent commit discarded it.",
      "- **Correction:** the owner chose a different route.",
      "",
    ].join("\n"),
  );
}

/* ------------------------------------------------------------------ rules */

test("the carrier publishes its contract id and its closed signal kinds", () => {
  assert.equal(JOURNAL_CORPUS_CONTRACT, "journal-corpus@1");
  assert.deepEqual(SIGNAL_KINDS, ["corrections", "sessions", "false-positive"]);
  assert.equal(LOG_REL, "docs/LOGS.md");
  assert.equal(FRAGMENTS_REL, ".agentic-workflow/journal");
  assert.equal(DEFAULT_RECURRENCE, 2);
});

test("the entry reader accepts every stamp shape the journals and renderers produce", () => {
  const shapes = [
    "## 2026-11-09 — feat/388-example — manual",
    "## 2026-09-16T08:00Z — feat/52-example — manual",
    "## 2026-11-04T01:40:45Z — feat/103-example — manual",
    "## 2026-11-18T20:35:00.035Z — main — manual",
    "## 20261107T133500Z — feat/435-example — narrative",
  ];
  for (const line of shapes) {
    const parsed = parseEntryHeading(line);
    assert.ok(parsed !== null, `${line} must parse as an entry heading`);
    assert.ok(parsed.branch.length > 0);
  }
  assert.equal(parseEntryHeading("## What happened"), null);
  assert.equal(parseEntryHeading("## feat/65-doc-toolchain — manual"), null);
  assert.equal(parseEntryHeading("### 2026-11-09 — feat/x — manual"), null);
  assert.equal(parseEntryHeading("- **Summary:** not a heading"), null);
});

test("the entry reader keeps a label that itself carries the separator", () => {
  const parsed = parseEntryHeading("## 2026-11-09T18:11:04Z — feat-408-mechanization-inventory — Unit 107 correction: close verifier blocker B3");
  assert.equal(parsed.branch, "feat-408-mechanization-inventory");
});

test("both renderers' bytes parse back, so the writer and the audit cannot disagree", () => {
  const narrative = renderEntryBlock({
    timestamp: "2026-11-18T10:00:00Z",
    branch: "feat/616-journal-carrier",
    commits: { count: 2, range: "aaaaaaa…bbbbbbb" },
    files: "scripts/journal-corpus.mjs",
    summary: "the narrative block",
    decisions: "one",
    next: "two",
  });
  const mechanical = renderEntry({
    timestamp: "2026-11-18T10:00Z",
    branch: "feat/616-journal-carrier",
    reason: "exit",
    commits: { count: 1, range: "ccccccc…ddddddd" },
    files: ["docs/LOGS.md"],
  });
  const narrativeParsed = parseJournalText(narrative, { file: "fragment.md", carrier: "fragment" });
  const mechanicalParsed = parseJournalText(mechanical, { file: "LOGS.md", carrier: "log" });
  assert.equal(narrativeParsed.entries.length, 1);
  assert.equal(mechanicalParsed.entries.length, 1);
  assert.equal(narrativeParsed.entries[0].branch, "feat/616-journal-carrier");
  assert.equal(mechanicalParsed.entries[0].branch, "feat/616-journal-carrier");
  assert.equal(unitOfBranch("feat/616-journal-carrier"), "616-journal-carrier");
});

test("a fenced `## ` line is prose inside the entry, never a second entry", () => {
  const text = [
    "## 2026-11-01T10:00:00Z — main — manual",
    "- **Summary:** the block below is quoted, not a heading",
    "```text",
    "## 2026-01-01 — not-an-entry — manual",
    "```",
    "",
  ].join("\n");
  const parsed = parseJournalText(text, { file: "LOGS.md", carrier: "log" });
  assert.equal(parsed.entries.length, 1);
});

test("a correcting line is one row with its provenance and its own digest", () => {
  const text = [
    "## 2026-11-01T10:00:00Z — feat/1-fixture-unit — manual",
    "- **Summary:** nothing to see.",
    "- **Correction:** F1 was read against superseded bytes.",
    "",
  ].join("\n");
  const parsed = parseJournalText(text, { file: "docs/LOGS.md", carrier: "log" });
  assert.equal(parsed.rows.length, 1);
  const [row] = parsed.rows;
  assert.equal(row.kind, "correction");
  assert.equal(row.provenance, "docs/LOGS.md:3");
  assert.equal(row.digest.length, 12);
  assert.equal(row.finding, "F1");
  assert.equal(row.carrier, "log");
  const summaryOnly = parseJournalText(text.replace("- **Correction:**", "- **Next:**"), { file: "f", carrier: "log" });
  assert.equal(summaryOnly.rows.length, 0);
});

test("a refutation needs both a marker and a finding id to become a row", () => {
  const text = [
    "## 2026-11-01T10:00:00Z — feat/1-fixture-unit — manual",
    "- **Summary:** F2 was refuted with counter-evidence.",
    "- **Decisions:** the shape was discarded, but no id is named here.",
    "",
  ].join("\n");
  const parsed = parseJournalText(text, { file: "f", carrier: "log" });
  assert.equal(parsed.rows.length, 1);
  assert.equal(parsed.rows[0].kind, "refuted");
  assert.equal(parsed.rows[0].finding, "F2");
});

test("the join resolves a journal row onto the corpus row it names, with both carriers", () => {
  const dir = scratch();
  try {
    seededProject(dir);
    const result = buildJournalCorpus(dir);
    const joined = result.rows.filter((row) => row.joined !== null);
    assert.equal(joined.length, 2, "both the correction and the refutation name a row this unit carries");
    const correction = joined.find((row) => row.kind === "correction");
    assert.match(correction.joined, /^docs\/features\/1-fixture-unit\/SPEC\.md:\d+$/);
    assert.equal(correction.unit, "1-fixture-unit");
    assert.equal(correction.date, "2026-11-01T10:00:00Z");
    assert.equal(correction.axis, "code");
    assert.equal(correction.klass, "fix-now");
  } finally {
    clean(dir);
  }
});

test("a class is the corpus row it resolves; a resolvable-less correction is unjoined with its reason", () => {
  const dir = scratch();
  try {
    seededProject(dir);
    const result = buildJournalCorpus(dir);
    const classes = result.signals.corrections.map((signal) => signal.class);
    assert.deepEqual(classes, ["code×fix-now", "unjoined"]);
    const unjoined = result.signals.corrections.find((signal) => signal.class === "unjoined");
    assert.equal(unjoined.n, 1);
    assert.match(unjoined.reason, /names no finding id/i);
    const refuted = result.rows.find((row) => row.kind === "refuted");
    assert.equal(refuted.class, "spec-drift×fix-now");
  } finally {
    clean(dir);
  }
});

test("a journal row that names no unit is unjoined instead of guessed", () => {
  const dir = scratch();
  try {
    write(dir, LOG_REL, "## 2026-11-01T10:00:00Z — main — manual\n- **Summary:** F1 was refuted.\n");
    const result = buildJournalCorpus(dir);
    assert.equal(result.rows.length, 1);
    assert.equal(result.signals.falsePositives[0].joined, null);
    assert.match(result.signals.falsePositives[0].reason, /no unit/i);
  } finally {
    clean(dir);
  }
});

test("the receipt states the join cardinality the audit's dedup rule rests on", () => {
  const dir = scratch();
  try {
    seededProject(dir);
    const result = buildJournalCorpus(dir);
    assert.equal(result.join.rows, 3);
    assert.equal(result.join.corpusRows, 2);
    assert.equal(result.join.clusters, 0);
    assert.equal(result.join.unjoined, 1);
    assert.match(renderReceipt(result), /^join \| rows 3 · corpus-rows 2 · clusters 0 · unjoined 1$/m);
  } finally {
    clean(dir);
  }
});

test("two journal rows on one corpus row cluster, so one finding cites both carriers", () => {
  const dir = scratch();
  try {
    seededProject(dir);
    fs.appendFileSync(
      path.join(dir, LOG_REL),
      "## 2026-11-03T12:00:00Z — feat/1-fixture-unit — manual\n- **Summary:** F2 was refuted a second time.\n",
    );
    const result = buildJournalCorpus(dir);
    assert.equal(result.join.clusters, 1, "two rows onto one corpus row is the cluster");
    assert.equal(result.join.corpusRows, 2);
  } finally {
    clean(dir);
  }
});

test("a recurring joined class reuses the corpus's phase map and its inventory destination", () => {
  const dir = scratch();
  try {
    seededProject(dir);
    fs.appendFileSync(
      path.join(dir, LOG_REL),
      [
        "## 2026-11-03T12:00:00Z — feat/1-fixture-unit — manual",
        "- **Correction:** F1 was read against superseded bytes a second time.",
        "- **Correction:** F2 too was read against superseded bytes.",
        "",
      ].join("\n"),
    );
    const result = buildJournalCorpus(dir);
    const attributed = result.attributes.map((row) => `${row.axis}×${row.klass} · n ${row.n} · ${row.phase}`);
    assert.deepEqual(attributed, ["code×fix-now · n 2 · gate", "spec-drift×fix-now · n 2 · design"]);
    for (const row of result.attributes) assert.match(row.proposal, /^docs\/workflow\/GATE_INVENTORY\.md/);
    assert.match(renderReceipt(result), /^attribute — code × fix-now · n 2 · phase gate · propose docs\/workflow\/GATE_INVENTORY\.md/m);
  } finally {
    clean(dir);
  }
});

test("an axis the corpus map does not know reads unmapped, never bucketed", () => {
  const dir = scratch();
  try {
    write(
      dir,
      "docs/features/1-fixture-unit/SPEC.md",
      `# 1 — fixture-unit\n\n${findingsTable([{ ...ROW_F1, id: "F1", axis: "quux" }])}`,
    );
    write(dir, LOG_REL, "## 2026-11-01T10:00:00Z — feat/1-fixture-unit — manual\n- **Correction:** F1 again.\n");
    const result = buildJournalCorpus(dir, { recurrence: 1 });
    assert.equal(result.attributes.length, 1);
    assert.equal(result.attributes[0].phase, "unmapped");
    assert.equal(result.attributes[0].proposal, null);
    assert.match(renderReceipt(result), /phase unmapped · propose none/);
  } finally {
    clean(dir);
  }
});

test("sessions per unit is a count with no threshold, and the trunk never becomes a unit", () => {
  const dir = scratch();
  try {
    write(
      dir,
      LOG_REL,
      [
        "## 2026-11-01T10:00:00Z — feat/1-fixture-unit — manual",
        "- **Summary:** one.",
        "## 2026-11-02T10:00:00Z — feat-1-fixture-unit — manual",
        "- **Summary:** two.",
        "## 2026-11-02T11:00:00Z — main — manual",
        "- **Summary:** triage.",
        "## 2026-11-02T12:00:00Z — main — manual",
        "- **Summary:** triage again.",
        "",
      ].join("\n"),
    );
    const result = buildJournalCorpus(dir);
    assert.deepEqual(
      result.signals.sessions.map((signal) => `${signal.unit}:${signal.sessions}`),
      ["1-fixture-unit:2"],
    );
    assert.ok(result.totalSignals >= 1);
  } finally {
    clean(dir);
  }
});

test("the receipt is deterministic: the same tree twice is the same bytes", () => {
  const dir = scratch();
  try {
    seededProject(dir);
    const first = renderReceipt(buildJournalCorpus(dir));
    const second = renderReceipt(buildJournalCorpus(dir));
    assert.equal(first, second);
  } finally {
    clean(dir);
  }
});

test("carriers are declared: both absent is insufficient-input, one absent is named", () => {
  const empty = scratch();
  const fragmentsOnly = scratch();
  try {
    const absent = spawnSync(process.execPath, [cli, empty], { encoding: "utf8" });
    assert.equal(absent.status, 1, "a project with neither carrier must not report a vacuous clean");
    assert.match(absent.stdout, /insufficient-input/);

    const narrative = renderEntryBlock({
      timestamp: "2026-11-18T10:00:00Z",
      branch: "main",
      commits: { count: 0, range: null },
      files: "—",
      summary: "a pending fragment",
    });
    write(fragmentsOnly, `${FRAGMENTS_REL}/20261118T100000Z-main-narrative-local.md`, narrative);
    const partial = spawnSync(process.execPath, [cli, fragmentsOnly], { encoding: "utf8" });
    assert.equal(partial.status, 0);
    assert.match(partial.stdout, /^log \| absent · docs\/LOGS\.md$/m);
    assert.match(partial.stdout, /^fragments \| \.agentic-workflow\/journal · files 1$/m);
  } finally {
    clean(empty);
    clean(fragmentsOnly);
  }
});

test("the reader writes nothing: the carrier bytes are identical after a run", () => {
  const dir = scratch();
  try {
    seededProject(dir);
    const before = fs.readFileSync(path.join(dir, LOG_REL), "utf8");
    const result = spawnSync(process.execPath, [cli, dir], { encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.equal(fs.readFileSync(path.join(dir, LOG_REL), "utf8"), before);
    assert.deepEqual(fs.readdirSync(dir).sort(), ["docs"]);
  } finally {
    clean(dir);
  }
});

test("the seeded fixture yields one signal per class and its clean twin yields zero", () => {
  const dir = scratch();
  try {
    const built = spawnSync(process.execPath, [fixtureCli, dir], { encoding: "utf8" });
    assert.equal(built.status, 0, built.stderr);
    const seeded = buildJournalCorpus(path.join(dir, "seeded"));
    assert.equal(seeded.signals.corrections.length, 1, "one correction class");
    assert.equal(seeded.signals.sessions.length, 1, "one rework unit");
    assert.equal(seeded.signals.falsePositives.length, 1, "one admitted false positive");
    assert.equal(seeded.totalSignals, 3);
    const cleanTwin = buildJournalCorpus(path.join(dir, "clean"));
    assert.equal(cleanTwin.totalSignals, 0);
    assert.match(renderReceipt(cleanTwin), /^verdict \| clean$/m);
  } finally {
    clean(dir);
  }
});

/* --------------------------------------------------------------- the prose */

test("the dimension table carries the Journal signals row and its producer", () => {
  const dimensions = read("skills/product-audit/references/AUDIT_DIMENSIONS.md");
  assert.match(dimensions, /\*\*Journal signals\*\*/);
  assert.match(dimensions, /bun scripts\/journal-corpus\.mjs <repo>/);
  assert.match(dimensions, /journal-corpus@1/);
  assert.match(dimensions, /## Journal-signal sweep \(pass-only-if\)/);
  assert.match(dimensions, /receipt-quoted/i);
  assert.match(dimensions, /non-mechanizable remainder/i);
  assert.match(dimensions, /unjoined/);
  assert.match(dimensions, /product-audit-journal-fixture\.mjs/);
});

test("the grammar block is published once, with its closed shapes", () => {
  const dimensions = read("skills/product-audit/references/AUDIT_DIMENSIONS.md");
  const block = /```text\njournal-corpus@1\n([\s\S]*?)```/.exec(dimensions);
  assert.ok(block !== null, "the reference must publish the journal-corpus@1 block");
  const body = block[1];
  for (const row of ["receipt", "carrier", "correction", "refuted", "class", "join", "signal", "dedup", "attribute", "verdict"]) {
    assert.match(body, new RegExp(`^${row} \\|`, "m"), `the block declares the ${row} row`);
  }
  assert.match(body, /corrections · class <class> · n <k>/);
  assert.match(body, /sessions · unit <u> · sessions <n>/);
  assert.match(body, /false-positive/);
});

test("the audit process consumes the producer in its pre-pass", () => {
  const process = read("skills/product-audit/references/AUDIT_PROCESS.md");
  assert.match(process, /bun scripts\/journal-corpus\.mjs/);
});

test("the grammar is a registered normative surface, claimed by a gate row", () => {
  assert.match(
    read("AGENTS.md"),
    /journal-corpus-grammar \| skills\/product-audit\/references\/AUDIT_DIMENSIONS\.md \| block:journal-corpus@1/,
  );
  const inventory = read("docs/workflow/GATE_INVENTORY.md");
  assert.match(inventory, /^\| journal-corpus \|/m);
  assert.match(inventory, /journal-corpus-grammar/);
});
