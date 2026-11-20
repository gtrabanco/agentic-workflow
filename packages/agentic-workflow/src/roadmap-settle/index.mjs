/**
 * roadmap-settle — the roadmap's `done` settle is code, not prose (issue #316).
 *
 * The defect: the roadmap row's done settle — the status-machine write
 * `done` + PR link at PR open — had a deterministic detector
 * (`unit-route.mjs` refuses close-out while the status is not `done`) and a
 * deterministic writer (the crate's `roadmap rowUpsert`), but zero call
 * sites: the transition was assigned to free-form prose, and three near
 * identical misses (unit 77 on `main`, unit 79 in PR #311, persisted as
 * finding F43) were caught late at `audit-pr`, after the review pass was
 * already paid.
 *
 * This gate mechanizes the inverse invariant offline: a unit doc that
 * carries a PR URL must have its index row reading `done · [#N](<same
 * url>)`. The comparison itself is the crate's `checkUnitDoc`
 * (`edit/Roadmap.mjs`) — this module is the wiring, it carries no second copy
 * of the grammar.
 *
 * Usage:
 *   agentic-workflow roadmap-settle [--root <dir>] [--json]
 *
 * `--root` defaults to the working directory, so the command senses the project
 * it is run in; this repository's `scripts/roadmap-settle.mjs` passes this
 * checkout's root instead.
 *
 * stdout: one fixed block — a `Roadmap-settle:` line per violation with its
 * named code and the expected settle form, then the tally and the verdict.
 * exit: 0 only when the verdict is `PASS`; 1 on violations; 2 on usage.
 *
 * Codes (closed set, owned by the crate's `ROADMAP_CHECK_CODES`):
 *   row-missing        a feature doc whose NN has no roadmap row
 *   slug-mismatch      the doc folder's slug disagrees with the row's
 *   pr-url-unsettled   the doc carries its PR URL and the row is not
 *                      `done · [#N](<same url>)`
 *
 * Scope (issue #316, deliberately narrow): the row composer is #227, the
 * schema-wide unit-doc verifier is #260, the repair-receipt receiver is #301.
 */

import fs from "node:fs";
import path from "node:path";

import { checkUnitDoc, ROADMAP_CHECK_CODES } from "../edit/Roadmap.mjs";
import { FIX_INDEX_DOCUMENT, ROADMAP_DOCUMENT, readFixIndexTable, readRoadmapIndex } from "../index-document.mjs";

const USAGE = `usage: agentic-workflow roadmap-settle [--root <dir>] [--json]`;

function parseArgs(argv, defaultRoot) {
  const result = { json: false, root: defaultRoot };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--json") result.json = true;
    else if (argv[i] === "--root") {
      const value = argv[++i];
      if (value === undefined) {
        process.stderr.write(`${USAGE}\n`);
        process.exit(2);
      }
      result.root = path.resolve(value);
    }
    else {
      process.stderr.write(`${USAGE}\n`);
      process.exit(2);
    }
  }
  return result;
}

/** Unit folders under a docs tree: `NN-slug` directories carrying a SPEC.md. */
function unitDocs(docsDir) {
  if (!fs.existsSync(docsDir)) return [];
  return fs
    .readdirSync(docsDir)
    .filter((name) => /^\d/.test(name))
    .sort()
    .map((name) => path.join(docsDir, name))
    .filter((dir) => fs.statSync(dir).isDirectory() && fs.existsSync(path.join(dir, "SPEC.md")))
    .map((dir) => ({ dir, spec: path.join(dir, "SPEC.md") }));
}

export function settle(rootDir) {
  const featuresDir = path.join(rootDir, "docs", "features");
  const fixDir = path.join(rootDir, "docs", "fix");
  // One index (issue #319): the consolidated document carries both tables. A
  // pre-319 tree keeps them in two files, which the read alias accepts until
  // the migration window closes.
  let index;
  try {
    index = readRoadmapIndex(rootDir);
  } catch (error) {
    return { usage: error.message };
  }
  if (index === null) {
    return { usage: `no roadmap at ${path.join(rootDir, ROADMAP_DOCUMENT)}` };
  }
  const roadmapText = index.text;
  const fixIndex = readFixIndexTable(rootDir);
  const fixIndexText = fixIndex === null ? null : fixIndex.text;

  const violations = [];
  let checked = 0;
  let fixRowless = 0;
  const rel = (p) => path.relative(rootDir, p);

  for (const { spec } of unitDocs(featuresDir)) {
    checked += 1;
    const dirName = path.basename(path.dirname(spec));
    const nn = /^(\d+)/.exec(dirName)?.[1] ?? "";
    const result = checkUnitDoc({
      nn,
      slug: dirName.replace(/^\d+-/, ""),
      kind: "feature",
      docText: fs.readFileSync(spec, "utf8"),
      indexText: roadmapText,
    });
    for (const v of result.violations) violations.push({ doc: rel(spec), ...v });
  }

  if (fixIndexText !== null) {
    for (const { spec } of unitDocs(fixDir)) {
      checked += 1;
      const dirName = path.basename(path.dirname(spec));
      const nn = /^(\d+)/.exec(dirName)?.[1] ?? "";
      const result = checkUnitDoc({
        nn,
        slug: dirName.replace(/^\d+-/, ""),
        kind: "fix",
        docText: fs.readFileSync(spec, "utf8"),
        indexText: fixIndexText,
      });
      // A fix doc with no active row is the index's own convention (merged
      // fixes are removed); the disclosure keeps the skip counted, never silent.
      if (!result.violations.some((v) => v.code !== "row-missing") && result.violations.some((v) => v.code === "row-missing")) {
        fixRowless += 1;
        continue;
      }
      for (const v of result.violations) violations.push({ doc: rel(spec), ...v });
    }
  }

  return { checked, fixRowless, violations };
}

export function main(argv = process.argv.slice(2), options = {}) {
  const args = parseArgs(argv, path.resolve(options.root ?? process.cwd()));
  const result = settle(args.root);
  if (result.usage) {
    process.stderr.write(`roadmap-settle: ${result.usage}\n`);
    process.exit(2);
  }
  if (args.json) {
    console.log(
      JSON.stringify(
        {
          gate: "roadmap-settle",
          schema: "roadmap-table@1",
          codes: ROADMAP_CHECK_CODES,
          checked: result.checked,
          fixRowlessSkipped: result.fixRowless,
          ok: result.violations.length === 0,
          violations: result.violations,
        },
        null,
        2,
      ),
    );
  } else {
    for (const v of result.violations) {
      console.log(`Roadmap-settle: ${v.doc}:${v.line} ${v.code} — ${v.detail}`);
    }
    console.log(
      `Roadmap-settle: ${result.checked} unit docs checked · ${result.fixRowless} fix docs skipped (no active row — merged fixes leave the index by convention)`,
    );
    console.log(`verdict: ${result.violations.length === 0 ? "PASS" : "FAIL"}`);
    console.log(`violations: ${result.violations.length}`);
  }
  process.exit(result.violations.length === 0 ? 0 : 1);
}
