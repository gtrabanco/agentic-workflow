// config-guards-doc.test.mjs — the guard inventory is exhaustive (issue #626 S2/S5).
//
// The schema package publishes the guard disposition vocabulary and the guard
// names; `docs/workflow/CONFIG.md` is the surface a human reads before writing a
// `guard` section. Two lists and one table that must agree, checked instead of
// trusted:
//
//   - every `GUARD_MODES` value is named by the `guard-reference@1` table;
//   - every `GUARD_NAMES` value is its own row in that table;
//   - the always-on pair is stated there rather than left implicit, so a reader
//     learns which guards cannot be turned off from the same table.
//
// The vocabularies are read from the built schema package (the root gate rebuilds
// it when stale), never re-spelled here: a copy of the list would be the drift
// this file exists to catch.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const { GUARD_MODES, GUARD_NAMES } = await import(
  join(root, "packages", "agentic-workflow-schema", "dist", "index.js")
);

const CONFIG_DOC = readFileSync(join(root, "docs", "workflow", "CONFIG.md"), "utf8");

/** The data rows of the table that follows the `guard-reference@1` heading. */
function guardReferenceRows() {
  const at = CONFIG_DOC.indexOf("guard-reference@1");
  assert.ok(at > -1, "CONFIG.md declares the guard-reference@1 table");
  const rows = [];
  for (const line of CONFIG_DOC.slice(at).split("\n").slice(1)) {
    if (/^\s*\|/.test(line)) rows.push(line.split("|").map((cell) => cell.trim()).filter(Boolean));
    else if (rows.length) break;
  }
  assert.ok(rows.length >= 3, `the guard table carries a header and data rows, got ${rows.length}`);
  return rows.slice(2);
}

test("every guard name is a row of the reference table", () => {
  const names = guardReferenceRows().map((row) => row[0].replaceAll("`", ""));
  for (const name of GUARD_NAMES) {
    assert.ok(names.includes(name), `${name} is missing from the guard-reference@1 table (rows: ${names.join(", ")})`);
  }
});

test("every disposition value is named by the reference table", () => {
  const text = guardReferenceRows().map((row) => row.join(" ")).join("\n");
  for (const mode of GUARD_MODES) {
    assert.ok(new RegExp(`\`${mode}\``).test(text), `the disposition ${mode} is never named by the guard-reference@1 table`);
  }
});

test("the always-on guards are declared, not left implicit", () => {
  const text = guardReferenceRows().map((row) => row.join(" ")).join("\n");
  for (const name of ["pathProtection", "contentGuard"]) {
    assert.ok(text.includes(name), `${name} is documented as a guard`);
  }
  assert.match(text, /always on \(no disposition\)/, "the table states which guards cannot be configured");
});

test("the shipped default and the question path are stated per row", () => {
  // A row that omits either column would leave a reader guessing which guards can
  // really ask — the exact "modes are not intuitive" defect of the issue.
  for (const row of guardReferenceRows()) {
    assert.ok(row.length >= 6, `row ${row[0]} carries every column, got ${row.length}`);
    assert.ok(row[3].length > 0, `row ${row[0]} states its shipped default`);
    assert.ok(row[4].length > 0, `row ${row[0]} states whether it can ask`);
  }
});

test("the retired section is not documented as current", () => {
  // `guards` may only appear as the retirement note, never as a live section.
  for (const line of CONFIG_DOC.split("\n")) {
    if (!line.includes("`guards`")) continue;
    assert.match(line, /retire|Retire/, `a live mention of the retired section: ${line.trim()}`);
  }
});
