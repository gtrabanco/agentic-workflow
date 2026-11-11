/**
 * writer.merge.test.mjs — issue #498 (feature 498 shared-writer-driver): the
 * merge library the file-class git merge drivers run on.
 *
 * Frozen-failure corpus:
 *   FF-3 — two branches each inserting a different roadmap row merge
 *          mechanically into the union (issue #498 AC3).
 *   FF-4 — two branches flipping the same row's status surface a real
 *          conflict, never silently resolved (issue #498 AC3).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  unionTableRows,
  numericRowKey,
  issueRowKey,
  structuralJsonMerge,
  unionLogEntries,
} from "../src/writer/merges.mjs";

const BASE = [
  "# Index",
  "",
  "intro prose",
  "",
  "| NN | slug | status | notes |",
  "|---|---|---|---|",
  "| 1 | alpha | idea | first |",
  "| 2 | beta | idea | second |",
  "",
  "closing prose",
].join("\n");

const oursInsert = BASE.replace("closing prose", "| 7 | gamma | idea | ours |\nclosing prose");
const theirsInsert = BASE.replace("closing prose", "| 8 | delta | idea | theirs |\nclosing prose");

test("FF-3 — two sides each inserting a different row union mechanically", () => {
  const result = unionTableRows(BASE, oursInsert, theirsInsert, numericRowKey);
  assert.equal(result.ok, true);
  assert.ok(result.content.includes("| 7 | gamma | idea | ours |"));
  assert.ok(result.content.includes("| 8 | delta | idea | theirs |"));
  // The base rows are untouched and the prose is carried through.
  assert.ok(result.content.includes("| 1 | alpha | idea | first |"));
  assert.ok(result.content.includes("intro prose"));
  assert.ok(result.content.includes("closing prose"));
});

test("FF-4 — both sides flipping the same row's status surfaces a real conflict", () => {
  const ours = BASE.replace("| 1 | alpha | idea | first |", "| 1 | alpha | done | first |");
  const theirs = BASE.replace("| 1 | alpha | idea | first |", "| 1 | alpha | in-progress | first |");
  const result = unionTableRows(BASE, ours, theirs, numericRowKey);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "conflict");
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].key, "1");
  assert.ok(result.conflicts[0].ours.includes("done"));
  assert.ok(result.conflicts[0].theirs.includes("in-progress"));
  // The conflicted content carries real conflict markers.
  assert.ok(result.content.includes("<<<<<<<"));
  assert.ok(result.content.includes("======="));
  assert.ok(result.content.includes(">>>>>>>"));
});

test("an identical change on both sides merges once — never duplicated", () => {
  const both = BASE.replace("| 2 | beta | idea |", "| 2 | beta | done |");
  const result = unionTableRows(BASE, both, both, numericRowKey);
  assert.equal(result.ok, true);
  assert.equal(result.content.split("| 2 | beta | done |").length - 1, 1);
});

test("one side's row edit unions with the other side's independent row insert", () => {
  const ours = BASE.replace("| 2 | beta | idea |", "| 2 | beta | done |");
  const result = unionTableRows(BASE, ours, theirsInsert, numericRowKey);
  assert.equal(result.ok, true);
  assert.ok(result.content.includes("| 2 | beta | done |"));
  assert.ok(result.content.includes("| 8 | delta | idea | theirs |"));
});

test("a deletion on one side applies when the other side never touched the row", () => {
  const ours = BASE.replace("| 2 | beta | idea | second |\n", "");
  const result = unionTableRows(BASE, ours, theirsInsert, numericRowKey);
  assert.equal(result.ok, true);
  assert.ok(!result.content.includes("| 2 | beta |"));
  assert.ok(result.content.includes("| 8 | delta |"));
});

test("foreign bytes outside table rows are carried through byte for byte", () => {
  const result = unionTableRows(BASE, oursInsert, theirsInsert, numericRowKey);
  assert.equal(result.ok, true);
  for (const line of ["# Index", "intro prose", "closing prose"]) {
    assert.ok(result.content.includes(line));
  }
});

test("the fix-index row key reads the issue number out of the `[#N](url)` link cell", () => {
  assert.equal(issueRowKey("| [#443](https://github.com/x/y/issues/443) | doc-index | done | notes |"), "443");
  assert.equal(issueRowKey("| plain | row |", ), null);
  assert.equal(numericRowKey("| 12 | slug | status | note |"), "12");
  assert.equal(numericRowKey("| [#12](u) | slug | status | note |"), null);
});

test("a malformed side (structure changed) refuses closed instead of guessing", () => {
  const theirs = BASE.replace("| NN | slug | status | notes |", "| NN | slug | status | extra | notes |");
  const result = unionTableRows(BASE, oursInsert, theirs, numericRowKey);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "invalid-document");
});

// ── Structural JSON merge (the budgets class, decision D3) ───────────────

const JB = JSON.stringify({
  schemaVersion: 1,
  defaults: { mainEstimateMax: 2800 },
  routes: { "a:x": { estimateMax: 100, sources: {} }, "b:y": { estimateMax: 200, sources: {} } },
});

test("structural JSON merge unions different keys and nests recursively", () => {
  const ours = JSON.stringify({
    schemaVersion: 1,
    defaults: { mainEstimateMax: 2800 },
    routes: { "a:x": { estimateMax: 150, sources: { "fix 1": "why" } }, "b:y": { estimateMax: 200, sources: {} } },
  });
  const theirs = JSON.stringify({
    schemaVersion: 1,
    defaults: { mainEstimateMax: 2900 },
    routes: { "a:x": { estimateMax: 100, sources: {} }, "b:y": { estimateMax: 200, sources: {} }, "c:z": { estimateMax: 300, sources: {} } },
  });
  const result = structuralJsonMerge(JB, ours, theirs);
  assert.equal(result.ok, true);
  const merged = JSON.parse(result.content);
  assert.equal(merged.defaults.mainEstimateMax, 2900); // theirs changed, ours untouched
  assert.equal(merged.routes["a:x"].estimateMax, 150); // ours changed, theirs untouched
  assert.equal(merged.routes["a:x"].sources["fix 1"], "why");
  assert.ok(merged.routes["c:z"]); // theirs added
});

test("structural JSON merge conflicts on the same leaf set differently on both sides", () => {
  const ours = JSON.stringify({ schemaVersion: 2, defaults: {} });
  const theirs = JSON.stringify({ schemaVersion: 3, defaults: {} });
  const result = structuralJsonMerge(JB, ours, theirs);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "conflict");
  assert.ok(result.conflicts.includes("schemaVersion"));
});

/* -------------------------------------------------- the logs class (S17) */

/** The entry shape `renderEntryBlock` renders: `## <iso-second stamp> — <branch> — <label>`. */
const LOGS_BASE = [
  "# Logs",
  "",
  "Session journal intro.",
  "",
  "## 2026-11-09T15:04:20Z — main — narrative",
  "- **Commits:** 0",
  "- **Files:** —",
  "- **Summary:** the base entry",
  "",
  "## 2026-11-10T10:00:00Z — feat/x — narrative",
  "- **Commits:** 1 (`aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`)",
  "- **Summary:** another base entry",
  "",
].join("\n");

const logsEntry = (stamp, summary) =>
  LOGS_BASE.replace(
    "- **Summary:** another base entry\n",
    `- **Summary:** another base entry\n\n## ${stamp} — fix/y — narrative\n- **Commits:** 2\n- **Summary:** ${summary}\n`,
  );

test("FF-5 — two sides each appending a different journal entry union ordered by stamp", () => {
  const ours = logsEntry("2026-11-11T08:00:00Z", "ours entry");
  const theirs = logsEntry("2026-11-11T09:00:00Z", "theirs entry");
  const result = unionLogEntries(LOGS_BASE, ours, theirs);
  assert.equal(result.ok, true, JSON.stringify(result.conflicts ?? result));
  assert.ok(result.content.includes("ours entry"));
  assert.ok(result.content.includes("theirs entry"));
  // Fresh stamps are later than the base's, so the union keeps append order.
  assert.ok(
    result.content.indexOf("2026-11-11T08:00:00Z") < result.content.indexOf("2026-11-11T09:00:00Z"),
    "the union is ordered by stamp",
  );
  assert.ok(result.content.includes("the base entry"), "base entries are carried through");
});

test("FF-5 — the same entry on both sides deduplicates once", () => {
  const shared = logsEntry("2026-11-11T08:00:00Z", "one shared entry");
  const result = unionLogEntries(LOGS_BASE, shared, shared);
  assert.equal(result.ok, true);
  const heads = result.content.split("\n").filter((line) => line.startsWith("## 2026-11-11T08:00:00Z"));
  assert.equal(heads.length, 1, "one copy, not two");
});

test("FF-5 — the same entry appended with different bodies is a real conflict", () => {
  const ours = logsEntry("2026-11-11T08:00:00Z", "ours body");
  const theirs = logsEntry("2026-11-11T08:00:00Z", "theirs body");
  const result = unionLogEntries(LOGS_BASE, ours, theirs);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "conflict");
  assert.equal(result.conflicts.length, 1);
  assert.equal(result.conflicts[0].key, "## 2026-11-11T08:00:00Z — fix/y — narrative");
  assert.ok(result.content.includes("<<<<<<<"), "ours marker present");
  assert.ok(result.content.includes(">>>>>>>"), "theirs marker present");
  assert.ok(result.content.includes("ours body"), "ours side is in the file for the human");
  assert.ok(result.content.includes("theirs body"), "theirs side is in the file for the human");
});

test("FF-5 — a side that edits a committed entry's body is no longer an append and refuses closed", () => {
  const edited = LOGS_BASE.replace("- **Summary:** the base entry", "- **Summary:** a rewritten base entry");
  const result = unionLogEntries(LOGS_BASE, LOGS_BASE, edited);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "invalid-document");
  assert.ok(result.detail.includes("append-only"));
});

test("FF-5 — the real journal's heading shapes union clean: date-only, minute precision, exact duplicates", () => {
  const realBase = [
    "# Logs",
    "",
    "## 2026-09-16T08:00Z — feat/52-machine-checked-turn-contract — manual (review-spec pass)",
    "- **Summary:** minute precision",
    "",
    "## 2026-09-22 — feature 61: adaptive unit lane (executed end-to-end)",
    "- **Summary:** date only, no label segment",
    "",
    "## 2026-09-07T13:00:00Z — fix/179-declared-ledger-delta-receipts — manual",
    "- **Summary:** first of two identical headings",
    "",
    "## 2026-09-07T13:00:00Z — fix/179-declared-ledger-delta-receipts — manual",
    "- **Summary:** second of two identical headings",
    "",
  ].join("\n");
  // Two sides append differently-shaped new entries; base is untouched.
  const ours = `${realBase}\n## 2026-11-11 — local — narrative\n- **Summary:** ours day entry\n`;
  const theirs = `${realBase}\n## 2026-11-11T09:00:00Z — ci/aggregator — weekly\n- **Commits:** 3\n- **Summary:** theirs stamped entry\n`;
  const result = unionLogEntries(realBase, ours, theirs);
  assert.equal(result.ok, true, JSON.stringify(result.conflicts ?? result.detail ?? ""));
  assert.ok(result.content.includes("ours day entry"));
  assert.ok(result.content.includes("theirs stamped entry"));
  // Both duplicate heading occurrences survive untouched.
  assert.equal(result.content.split("## 2026-09-07T13:00:00Z — fix/179-declared-ledger-delta-receipts — manual").length - 1, 2);
  assert.ok(result.content.includes("minute precision"), "base blocks carried through byte for byte");
});
