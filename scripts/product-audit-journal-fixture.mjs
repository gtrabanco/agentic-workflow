#!/usr/bin/env node
/**
 * product-audit-journal-fixture.mjs — the journal dimension's pass-only-if
 * evidence (issue #616).
 *
 * The `Journal signals` dimension claims that a journal carrying corrections,
 * rework and admitted false positives yields exactly one signal per class, and
 * that a journal carrying none yields zero. Asserting that against the live
 * repository would prove nothing (its journal carries all of it); so this
 * builder writes the two twins into a caller-supplied scratch directory and the
 * suite runs the carrier over both:
 *
 *   seeded/   two entries on one unit (rework), a correcting line naming the
 *             unit's F1 (a joined correction class) and a refuted line naming
 *             its F2 (one admitted false positive);
 *   clean/    one entry, no correcting line and no refutation, over the same
 *             unit doc — so the zero is the journal's, never the corpus's.
 *
 * It writes only under the directory it is given, creates no git repository (the
 * join needs corpus rows, not admission) and never touches the project.
 *
 * Usage
 *   bun scripts/product-audit-journal-fixture.mjs <dir>
 *   (node fallback, same argv)
 *
 * Exit: 0 the twins were written; 2 a usage error. Its consumer is
 * `scripts/journal-corpus.test.mjs`, where the pass-only-if contract is checked.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { LOG_REL } from "./journal-corpus.mjs";

const UNIT = "1-fixture-unit";
const SPEC_REL = `docs/features/${UNIT}/SPEC.md`;

/** The migrated findings carrier, in the shape the corpus already reads. */
const FINDINGS = [
  "## Findings",
  "",
  "| id | S# / file:line | axis | severity | impact | class | route |",
  "|---|---|---|---|---|---|---|",
  "| F1 | S1 · `scripts/example.mjs`:12 | code | WARNING | blocking | fix-now | fold |",
  "| F2 | S1 · `scripts/example.mjs`:44 | spec-drift | SUGGESTION | report-only | fix-now | fold |",
  "",
].join("\n");

const SEEDED_LOG = [
  "# Session log",
  "",
  "## 2026-11-01T10:00:00Z — feat/1-fixture-unit — manual",
  "- **Commits:** 1 (`aaaaaaa…bbbbbbb`)",
  "- **Files:** scripts/example.mjs",
  "- **Summary:** first pass over the fixture unit.",
  "- **Correction:** the verdict recorded in F1 was read against bytes a merge had already replaced.",
  "",
  "## 2026-11-02T11:00:00Z — feat/1-fixture-unit — manual",
  "- **Commits:** 1 (`ccccccc…ddddddd`)",
  "- **Files:** scripts/example.mjs",
  "- **Summary:** F2 was refuted with counter-evidence and the concurrent commit discarded it.",
  "- **Next:** hand the diff to the owner.",
  "",
].join("\n");

const CLEAN_LOG = [
  "# Session log",
  "",
  "## 2026-11-03T09:00:00Z — feat/1-fixture-unit — manual",
  "- **Commits:** 1 (`eeeeeee…fffffff`)",
  "- **Files:** scripts/example.mjs",
  "- **Summary:** one session, no correction and no refutation.",
  "- **Next:** hand the diff to the owner.",
  "",
].join("\n");

function write(root, relative, text) {
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text);
}

/** Build `seeded/` and `clean/` under `dir`; returns the two roots. */
export function buildJournalFixture(dir) {
  const root = path.resolve(dir);
  const seeded = path.join(root, "seeded");
  const clean = path.join(root, "clean");
  write(seeded, SPEC_REL, `# 1 — fixture-unit\n\n${FINDINGS}`);
  write(seeded, LOG_REL, SEEDED_LOG);
  write(clean, SPEC_REL, `# 1 — fixture-unit\n\n${FINDINGS}`);
  write(clean, LOG_REL, CLEAN_LOG);
  return { seeded, clean };
}

function main(argv) {
  if (argv.length !== 1 || argv[0].startsWith("-")) {
    process.stderr.write("usage: product-audit-journal-fixture.mjs <dir>\n");
    return 2;
  }
  const { seeded, clean } = buildJournalFixture(argv[0]);
  process.stdout.write(`product-audit-journal-fixture: seeded ${seeded}\nclean ${clean}\n`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main(process.argv.slice(2));
}
