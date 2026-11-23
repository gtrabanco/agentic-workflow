// test-obligation: protects=packages/agentic-workflow/src/runner/findings-carrier.mjs,packages/agentic-workflow/src/runner/unit-route.mjs obligations=contract,failure-path
/**
 * findings-carrier.test.mjs — issue #702 S4/S9: the carrier's grammar has one
 * owner and every reader says which grammar it read.
 *
 * The rows below are the ones the live tree carries: `findings-table@1`, its
 * superseded six-column predecessor, and the legacy side ledger. A reader that
 * reads by position turns the ledger's `class` into `impact` and its `route`
 * into `class` — the drift this suite refuses.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { FINDINGS_GRAMMARS, readCarrier, grammarOf } from "../src/runner/findings-carrier.mjs";
import { findingsRows, openRows, isOpen, routeOfRow } from "../src/runner/unit-route.mjs";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));

const DOC = (header, rows) => `# 77-toy\n\n## Findings\n\n${header}\n${rows.join("\n")}\n\n## Log\n\nnone\n`;
const TABLE_V1 = "| id | S# / file:line | axis | severity | impact | class | route |\n|---|---|---|---|---|---|---|";
const TABLE_V0 = "| id | S# / file:line | axis | severity | class | route |\n|---|---|---|---|---|---|";
const TABLE_LEDGER = "| id | file:line | axis | severity | class | route | folded |\n|---|---|---|---|---|---|---|";

test("the grammar is named from the table's own header, and an unknown header is named as such", () => {
  assert.equal(grammarOf(["id", "S# / file:line", "axis", "severity", "impact", "class", "route"]), "findings-table@1");
  assert.equal(grammarOf(["id", "S# / file:line", "axis", "severity", "class", "route"]), "findings-table@0");
  assert.equal(grammarOf(["id", "file:line", "axis", "severity", "class", "route", "folded"]), "findings-ledger@1");
  assert.equal(grammarOf(["id", "where", "axis"]), null, "a header no carrier publishes is unknown, never a guess");
  assert.deepEqual(Object.keys(FINDINGS_GRAMMARS), ["findings-table@1", "findings-table@0", "findings-ledger@1"]);
});

test("a doc row is read by its header, never by position", () => {
  const rows = findingsRows(DOC(TABLE_V1, ["| F1 | src/a.mjs:3 | code | WARNING | blocking | source | fold |"]));
  assert.equal(rows.length, 1);
  assert.deepEqual(
    { id: rows[0].id, file: rows[0].file, axis: rows[0].axis, severity: rows[0].severity, impact: rows[0].impact, klass: rows[0].klass, route: rows[0].route, grammar: rows[0].grammar },
    { id: "F1", file: "src/a.mjs:3", axis: "code", severity: "WARNING", impact: "blocking", klass: "source", route: "fold", grammar: "findings-table@1" },
  );
  assert.equal(routeOfRow(rows[0]), "fold");
});

test("a ledger-grammar doc table keeps its folded cell and reports the grammar", () => {
  const doc = DOC(TABLE_LEDGER, [
    "| F1 | src/a.mjs:3 | code | WARNING | source | fold | no |",
    "| F2 | src/b.mjs:4 | code | WARNING | source | fold | yes |",
  ]);
  const rows = findingsRows(doc);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].impact, "", "the ledger grammar publishes no impact cell, so no cell is invented for it");
  assert.equal(rows[0].klass, "source", "class is class, never read from the route column");
  assert.equal(rows[0].route, "fold");
  assert.equal(isOpen(rows[0].folded), true);
  assert.equal(isOpen(rows[1].folded), false, "a folded ledger row is closed, never routed again");

  const report = readCarrier({ docText: doc });
  assert.equal(report.carrier, "doc");
  assert.equal(report.grammar, "findings-ledger@1");
  assert.deepEqual(report.defects.map((defect) => defect.code), ["wrong-carrier-grammar"]);
});

test("a superseded six-column doc table is read, and reported as superseded", () => {
  const doc = DOC(TABLE_V0, ["| F1 | src/a.mjs:3 | code | WARNING | source | fold |"]);
  const rows = findingsRows(doc);
  assert.equal(rows[0].file, "src/a.mjs:3", "the target cell is read where its header puts it");
  assert.equal(rows[0].severity, "WARNING");
  const report = readCarrier({ docText: doc });
  assert.equal(report.grammar, "findings-table@0");
  assert.deepEqual(report.defects.map((defect) => defect.code), ["superseded-grammar"]);
});

test("two carriers are one defect naming both paths, never a silent preference", () => {
  const report = readCarrier({
    docText: DOC(TABLE_V1, ["| F1 | src/a.mjs:3 | code | WARNING | blocking | source | fold |"]),
    ledgerText: `# Findings\n\n${TABLE_LEDGER}\n| F1 | src/a.mjs:3 | code | WARNING | source | fold | no |\n`,
  });
  assert.deepEqual(report.defects.map((defect) => defect.code), ["dual-carrier"]);
  assert.match(report.defects[0].detail, /SPEC\.md/u);
  assert.match(report.defects[0].detail, /review-findings\.md/u);
});

test("a table whose header nobody publishes is an unknown grammar, never \"no table\"", () => {
  const report = readCarrier({ docText: DOC("| id | where | axis |\n|---|---|---|", ["| F1 | a.mjs:3 | code |"]) });
  assert.equal(report.carrier, "doc");
  assert.equal(report.grammar, null);
  assert.deepEqual(report.defects.map((defect) => defect.code), ["unknown-grammar"]);
  assert.match(report.defects[0].detail, /id \| where \| axis/u);
  const bare = readCarrier({ docText: DOC("", []) });
  assert.deepEqual(bare.defects.map((defect) => defect.code), ["carrier-table-missing"], "a section with no table at all is the other defect");
});

test("the legacy ledger reader is unchanged: folded rows are closed, marks are not rows", () => {
  const ledger = `# Findings\n\n${TABLE_LEDGER}
| F1 | src/a.mjs:3 | code | WARNING | source | fold | no |
| F2 | src/b.mjs:4 | code | WARNING | source | fold | yes |
| REVIEW-RAN | HEAD abc | code | WARNING | source | fold | no |
`;
  const rows = openRows(ledger);
  assert.deepEqual(rows.map((row) => row.id), ["F1"]);
});

test("the sensor surfaces a carrier defect as an observation", (t) => {
  const root = mkdtempSync(join(tmpdir(), "carrier-sensor-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    const abs = join(root, rel);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, text);
  };
  write("docs/fix/77-toy/SPEC.md", DOC(TABLE_LEDGER, ["| F1 | src/a.mjs:3 | code | WARNING | source | fold | no |"]));
  // The index registers the fix unit: the sensor projects the units the roadmap
  // names, so a fixture without its row would never reach the carrier at all.
  write(
    "docs/ROADMAP.md",
    [
      "# Roadmap",
      "",
      "## Features",
      "",
      "| NN | Slug | Status | Depends on | Summary |",
      "|----|------|--------|------------|---------|",
      "",
      "## Fixes",
      "",
      "| Issue | Topic | Status | Notes |",
      "|---|---|---|---|",
      "| [#77](https://github.com/o/r/issues/77) | toy | pending | — |",
      "",
    ].join("\n"),
  );
  write("NOTES.md", "prose\n");
  const GIT_ID = ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false"];
  const git = (...args) => execFileSync("git", [...GIT_ID, ...args], { cwd: root, encoding: "utf8" }).trim();
  git("init", "-q", "-b", "main");
  git("add", "-A");
  git("commit", "-qm", "chore(77): fixture");

  const envelope = execFileSync(process.execPath, [BIN, "workflow-status", "--json-only"], { cwd: root, encoding: "utf8" });
  const parsed = JSON.parse(envelope);
  const observations = parsed.detail?.workflow_observations ?? [];
  assert.ok(
    observations.some((line) => line.includes("docs/fix/77-toy") && line.includes("wrong-carrier-grammar")),
    `the sensor names the carrier it could not read as current:\n${observations.join("\n")}`,
  );
});
