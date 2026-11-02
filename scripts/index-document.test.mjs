#!/usr/bin/env node
/**
 * The location index is **one** document (`docs/ROADMAP.md`) behind **one**
 * published path constant, and this suite is the frozen receipt for the move
 * that made it so (issue #319).
 *
 * It pins the obligations the unit cut, one case per row of
 * `docs/fix/319-location-index-consolidation/planning-obligations.md` — never a
 * second copy of the behaviour:
 *
 *   O6/R1  the pre-move path survives in exactly one place in live code
 *   O7     the crate and the schema package publish the same constants
 *   O1/R2  the consolidated document carries the four sections; the old file is gone
 *   O2/R3  `docs/fix/README.md` is a one-line stub pointing at the `## Fixes` section
 *   O4     the rollback lever: an explicit `{ legacy: true }` still reads the pre-move tree
 *   O5/R4  the closed window (the default) refuses the pre-move path with `roadmap-moved`
 *   O9/R5  the two tables never leak into each other's parsers
 *   O8     every live reader/writer goes through the constant, not a literal
 *
 * The legacy path is assembled from parts on purpose: this file lives inside the
 * `scripts/` tree the acceptance grep sweeps, so spelling it here would make the
 * one-occurrence rule unsatisfiable.
 *
 * Usage
 *   node --test scripts/index-document.test.mjs
 *   node scripts/index-document.test.mjs --demo moved   # prints the closed-window refusal
 */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CRATE_MODULE = "packages/agentic-workflow/src/index-document.mjs";
const SCHEMA_MODULE = "packages/agentic-workflow-schema/src/paths.ts";

/** The pre-move path, never spelled literally in this tree. */
const LEGACY = ["docs", "features", "ROADMAP.md"].join("/");
const CANONICAL = ["docs", "ROADMAP.md"].join("/");

const read = (relative) => fs.readFileSync(path.join(REPO, relative), "utf8");

/** Every `.mjs`/`.ts` file under a directory, skipping build output and vendored trees. */
function codeFiles(dir) {
  const out = [];
  const skip = new Set(["node_modules", "dist", ".git", ".serena"]);
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (skip.has(entry.name)) continue;
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (/\.(mjs|ts)$/.test(entry.name)) out.push(path.relative(REPO, abs));
    }
  };
  walk(path.join(REPO, dir));
  return out.sort();
}

/** A throwaway repository tree: `{ [relative]: content }`. */
function tree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "index-doc-"));
  for (const [relative, content] of Object.entries(files)) {
    const abs = path.join(root, relative);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf8");
  }
  return root;
}

const FEATURES = "## Features\n\n| NN | Slug | Status | Depends on | Summary |\n|----|------|--------|------------|---------|\n| 319 | `location-index-consolidation` | in-progress | — | one index |\n";
const FIXES = "## Fixes\n\n| Issue | Topic | Status | Notes |\n|---|---|---|---|\n| [#319](https://example.invalid/issues/319) | `location-index-consolidation` | pending | branch open |\n";
const CONSOLIDATED = `# Roadmap\n\n${FEATURES}\n${FIXES}\n## Conventions\n\n- numbers are never reused.\n`;

const crate = (name) => import(`../${CRATE_MODULE}`).then((module) => module[name]);

/**
 * The rows that carry a unit. `roadmapTableRows` returns the table as written —
 * header row included — because every parser keeps its own header guard; a
 * count of units therefore filters on the first cell's shape.
 */
const unitRows = (rows) => rows.filter((cells) => /^\d+$/.test(cells[0] ?? "") || /issues\/\d+|#\d+/.test(cells[0] ?? ""));

test("O6/R1: the pre-move path is written in exactly one place in live code", () => {
  const hits = [];
  for (const file of [...codeFiles("scripts"), ...codeFiles("packages")]) {
    const text = fs.readFileSync(path.join(REPO, file), "utf8");
    text.split("\n").forEach((line, index) => {
      if (line.includes(LEGACY)) hits.push(`${file}:${index + 1}: ${line.trim()}`);
    });
  }
  assert.equal(hits.length, 1, `expected the alias definition alone, found:\n${hits.join("\n")}`);
  assert.match(hits[0], new RegExp(`^${CRATE_MODULE}:`), "the single occurrence is the published alias constant");
  assert.match(hits[0], /ROADMAP_LEGACY_DOCUMENT/, "the occurrence declares the alias constant, not a path literal");
});

test("O7: the crate's constants and the schema package's published constants agree", async () => {
  const source = read(SCHEMA_MODULE);
  /**
   * A published constant's declared value: a string literal, a boolean literal,
   * or — for the rollback lever, which an installed package must be able to
   * flip at run time — the expression it derives from. A derived constant is
   * compared by the declaration, never by a value the environment could change
   * under the test.
   */
  const declared = (name) => {
    const match = new RegExp(`export const ${name}\\s*=\\s*("([^"]*)"|true|false|[^;]+);`).exec(source);
    assert.ok(match, `${SCHEMA_MODULE} publishes ${name}`);
    return /^"[^"]*"$/.test(match[1]) ? match[1].replace(/^"|"$/g, "") : match[1].trim();
  };
  const isLiteral = (name) => {
    const value = declared(name);
    return /^(true|false)$/.test(value) || !/\s|\(|=>|process\./.test(value) ? value : null;
  };
  const shared = [
    "ROADMAP_DOCUMENT",
    "FIX_INDEX_DOCUMENT",
    "ROADMAP_FEATURES_HEADING",
    "ROADMAP_FIXES_HEADING",
  ];
  for (const name of shared) {
    const value = await crate(name);
    const kind = /^(true|false)$/.test(declared(name)) ? "boolean" : "string";
    assert.equal(typeof value, kind, `${CRATE_MODULE} publishes ${name} as a ${kind}`);
    assert.equal(String(value), declared(name), `${name} is the same value in both packages`);
  }
  // The rollback lever reads `false` on both sides — the schema package stays
  // dependency-free and publishes the closed value, while the crate derives it
  // from the run-time channel an installed package can flip. Both state the same
  // fact and `crate("ROADMAP_LEGACY_READ")` is `false` in a clean environment.
  assert.equal(declared("ROADMAP_LEGACY_READ"), "false", "the schema package publishes the closed window (D4)");
  assert.equal(await crate("ROADMAP_LEGACY_READ"), false, "the migration window is closed (D4) in a clean environment");
  assert.match(
    read(CRATE_MODULE).match(/export const ROADMAP_LEGACY_READ\s*=\s*([^;]+);/)?.[1]?.trim() ?? "",
    /AGENTIC_WORKFLOW_ROADMAP_LEGACY_READ/,
    "the crate keeps the lever flippable by an installed package",
  );
  assert.match(read("packages/agentic-workflow-schema/src/index.ts"), /from "\.\/paths\.js"/, "the schema package re-exports the constants");
  assert.equal(await crate("ROADMAP_DOCUMENT"), CANONICAL);
  assert.equal(await crate("ROADMAP_LEGACY_DOCUMENT"), LEGACY, "the pre-move path is still named so the refusal can point at it");
});

test("O1/R2: the consolidated index carries the four sections, and the old file is gone", () => {
  const consolidated = fs.existsSync(path.join(REPO, CANONICAL)) ? read(CANONICAL) : null;
  assert.ok(consolidated !== null, `${CANONICAL} exists`);
  for (const heading of ["## Features", "## Fixes", "## Status legend", "## Conventions"]) {
    assert.equal(consolidated.split("\n").filter((line) => line.trim() === heading).length, 1, `${heading} appears exactly once`);
  }
  assert.ok(!fs.existsSync(path.join(REPO, LEGACY)), `${LEGACY} is gone (its content moved, it was not copied)`);
});

test("O2/R3: the fix index is a one-line stub that points at the Fixes section", () => {
  const stub = read("docs/fix/README.md");
  assert.equal(stub.split("\n").filter((line) => line.trim() !== "").length, 1, "the stub is one line");
  assert.match(stub, /docs\/ROADMAP\.md#fixes/, "the stub points at the consolidated Fixes section");
});

test("O4: the rollback lever reads a pre-319 tree identically, and the canonical path wins", async () => {
  const readIndex = await crate("readRoadmapIndex");
  const roadmapTableRows = await crate("roadmapTableRows");

  const canonicalTree = tree({ [CANONICAL]: CONSOLIDATED });
  const legacyTree = tree({ [LEGACY]: CONSOLIDATED });
  const canonical = readIndex(canonicalTree);
  const legacy = readIndex(legacyTree, { legacy: true });
  assert.equal(canonical.path, CANONICAL);
  assert.equal(canonical.source, "canonical");
  assert.equal(legacy.path, LEGACY);
  assert.equal(legacy.source, "legacy");
  assert.deepEqual(unitRows(roadmapTableRows(legacy.text, "fix")), unitRows(roadmapTableRows(canonical.text, "fix")), "the same document reads the same either way");

  const both = tree({ [CANONICAL]: CONSOLIDATED, [LEGACY]: "# Roadmap\n\n| NN | Slug | Status | Depends on | Summary |\n|---|---|---|---|---|\n| 01 | `stale` | idea | — | stale copy |\n" });
  const preferred = readIndex(both, { legacy: true });
  assert.equal(preferred.source, "canonical", "the canonical path wins when both exist");
  assert.equal(unitRows(roadmapTableRows(preferred.text, "feature")).length, 1, "the stale copy is never read");

  assert.equal(readIndex(tree({})), null, "no index at all is an absent index, not a refusal");
});

test("O5/R4: the closed window refuses the pre-move path with a moved pointer, never an empty parse", async () => {
  const readIndex = await crate("readRoadmapIndex");
  const legacyTree = tree({ [LEGACY]: CONSOLIDATED });
  assert.throws(
    () => readIndex(legacyTree),
    (error) => {
      assert.equal(error.code, "roadmap-moved", "the refusal carries the closed code");
      assert.equal(error.from, LEGACY);
      assert.equal(error.to, CANONICAL, "the refusal names where the file moved to");
      return true;
    },
  );
  assert.doesNotThrow(() => readIndex(legacyTree, { legacy: true }), "the rollback lever still reads the pre-move path");
});

test("O9/R5: the two tables never leak into each other's parsers", async () => {
  const roadmapTableRows = await crate("roadmapTableRows");
  const { checkUnitDoc } = await import("../packages/agentic-workflow/src/edit/Roadmap.mjs");
  assert.equal(unitRows(roadmapTableRows(CONSOLIDATED, "feature")).length, 1, "the Features table has one row");
  assert.equal(unitRows(roadmapTableRows(CONSOLIDATED, "fix")).length, 1, "the Fixes table has one row");

  const asFix = checkUnitDoc({ nn: "319", slug: "location-index-consolidation", kind: "fix", docText: "", indexText: CONSOLIDATED });
  assert.equal(asFix.ok, true, "the fix check reads its own row (status pending, no PR settled yet)");
  const feature = checkUnitDoc({ nn: 319, slug: "location-index-consolidation", kind: "feature", docText: "- PR: https://example.invalid/pull/1", indexText: CONSOLIDATED });
  assert.deepEqual(feature.violations.map((violation) => violation.code), ["pr-url-unsettled"], "the feature check reads the feature row, not the fix row");

  // A legacy document carries one table and no headings: every row belongs to the caller's kind.
  const legacyOnly = "| NN | Slug | Status | Depends on | Summary |\n|---|---|---|---|---|\n| 319 | `x` | in-progress | — | s |\n";
  assert.equal(unitRows(roadmapTableRows(legacyOnly, "feature")).length, 1, "a headingless document keeps its single-table meaning");

  // F1: a consolidated document whose `## Fixes` table is absent has NO fix rows.
  // Reading its `## Features` rows as fixes makes feature row N answer for fix row N.
  const consolidatedNoFixes = CONSOLIDATED.slice(0, CONSOLIDATED.indexOf("## Fixes"));
  assert.equal(unitRows(roadmapTableRows(consolidatedNoFixes, "fix")).length, 0, "a consolidated document without ## Fixes has no fix rows");
  assert.equal(unitRows(roadmapTableRows(consolidatedNoFixes, "feature")).length, 1, "its features table still reads");
  const halfMigrated = checkUnitDoc({ nn: "319", slug: "wrong-slug", kind: "fix", docText: "", indexText: consolidatedNoFixes });
  assert.equal(halfMigrated.ok, true, "a missing fix row is that index's convention, never a slug match against a feature row");
  assert.deepEqual(halfMigrated.violations, [], "no feature row answers for the fix row");
});

test("F15: a row without a trailing pipe keeps its last cell, on both published sides", async () => {
  // The crate stripped the first and last cell unconditionally, so a writer's
  // row that omits the trailing pipe lost its final column while the schema
  // package kept it — the same document parsed differently per published side.
  const tableCells = await crate("tableCells");
  assert.deepEqual(tableCells("| 12 | a | b |"), ["12", "a", "b"], "a closed row reads its three data cells");
  assert.deepEqual(tableCells("| 12 | a | b"), ["12", "a", "b"], "an unclosed row is not short a cell");
  assert.deepEqual(tableCells("| 12 | a \\| x | b"), ["12", "a | x", "b"], "an escaped pipe stays one cell and the last cell survives");

  const roadmapTableRows = await crate("roadmapTableRows");
  const unclosed = "## Features\n\n| NN | Slug | Status | Summary\n|---|---|---|---\n| 12 | `beta` | in-progress | s\n";
  const rows = roadmapTableRows(unclosed, "feature");
  assert.deepEqual(rows.at(-1), ["12", "`beta`", "in-progress", "s"], "the row scanner keeps the status and the summary cell");
});

test("O8: every live reader and writer goes through the published constant", () => {
  const consumers = [
    "scripts/unit-route.mjs",
    "scripts/workflow-status.mjs",
    "scripts/unit-cycle.mjs",
    "scripts/unit-doc-phases.mjs",
    "scripts/roadmap-settle.mjs",
    "scripts/ceremony/unit.mjs",
    "packages/agentic-workflow/bin/agentic-workflow.mjs",
    "packages/agentic-workflow/src/edit/Roadmap.mjs",
  ];
  for (const file of consumers) {
    const text = read(file);
    assert.match(text, /index-document\.mjs/, `${file} imports the published constants`);
    assert.ok(!text.includes(CANONICAL), `${file} never spells the path itself`);
  }
});

const demoIndex = process.argv.indexOf("--demo");
if (demoIndex !== -1 && process.argv[demoIndex + 1] === "moved") {
  const { readRoadmapIndex } = await import(`../${CRATE_MODULE}`);
  const legacyOnly = tree({ [LEGACY]: CONSOLIDATED });
  try {
    readRoadmapIndex(legacyOnly, { legacy: false });
    process.stdout.write("no refusal — the closed window read the pre-move path\n");
    process.exitCode = 1;
  } catch (error) {
    process.stdout.write(`${error.message}\n`);
  }
}
