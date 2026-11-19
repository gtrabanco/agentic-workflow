#!/usr/bin/env node
/**
 * product-audit-promotion-fixture.mjs — the `Decision promotion` dimension's
 * calibration twin (issue #650 S6).
 *
 * A sweep that reports nothing is indistinguishable from a sweep that reads
 * nothing, so the dimension ships the measurement instead of the claim: this
 * generator lays down a `seeded/` tree carrying exactly one seed per finding
 * class and a `clean/` twin of the same shape with no defect. The sibling suite
 * asserts one finding per class on `seeded/` and none on `clean/`.
 *
 * Written on demand outside the repository — never committed; the suite points
 * it at a `mkdtemp` directory and removes it.
 *
 * Usage
 *   bun scripts/product-audit-promotion-fixture.mjs <dir>
 *   (node fallback, same argv)
 *
 * stdout: `promotion-fixture@1` and one line per tree it wrote. Exit 0 written;
 * 2 a usage error. Read-only apart from the directory it is told to fill.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export const FIXTURE = "promotion-fixture@1";
/** The date the fixture's unscoped seed is captured after, so the rule binds. */
export const FIXTURE_SINCE = "2026-11-19";

const OPEN = [
  "id | date | type | question | blocks | search-receipt | options | route",
  "Q1 | 2026-11-20 | open-question | which owner doc carries it | nothing proceeds | `rg -n decisions docs/` → no owner | the guide | the invariants | design",
];

/**
 * One seed per finding class plus the passing shapes:
 *   `seeded/` — `unpromoted-decision`, `owner-doc-missing`, `scope-unrecorded`;
 *   `clean/`  — a promoted row and a legacy row, each legal by construction.
 */
export const SEEDS = Object.freeze({
  seeded: Object.freeze({
    "701-unpromoted": [
      ...OPEN,
      "D1 | 2026-11-20 | decision | Q1 | human-owner | chat paste | the rule stays in the ledger | the promotion | cross-unit",
    ],
    "702-wrong-doc": [
      ...OPEN,
      "D1 | 2026-11-20 | decision | Q1 | human-owner | chat paste | the rule, promoted to `docs/notes/decisions.md` | the guide | cross-unit",
    ],
    "703-unscoped": [
      ...OPEN,
      "D1 | 2026-12-01 | decision | Q1 | human-owner | chat paste | the rule | the alternative",
    ],
  }),
  clean: Object.freeze({
    "701-promoted": [
      ...OPEN,
      "D1 | 2026-11-20 | decision | Q1 | human-owner | chat paste | the rule, promoted to `AGENTS.md` | the architecture doc | cross-unit",
    ],
    "702-local": [
      ...OPEN,
      "D1 | 2026-11-20 | decision | Q1 | human-owner | chat paste | this unit's own choice | the alternative | unit-only",
    ],
    "703-legacy": [
      ...OPEN,
      "D1 | 2026-01-05 | decision | Q1 | human-owner | chat paste | an old rule | an old alternative",
    ],
  }),
});

/** Write one tree: the guide, the two owner docs and one ledger per unit. */
export function writeTree(root, tree) {
  fs.mkdirSync(path.join(root, "docs", "architecture"), { recursive: true });
  fs.writeFileSync(path.join(root, "AGENTS.md"), "# Guide\n\n- **Decision records:** `AGENTS.md`\n");
  fs.writeFileSync(path.join(root, "docs", "architecture", "ARCHITECTURE.md"), "# Architecture\n");
  fs.writeFileSync(path.join(root, "docs", "architecture", "ARCHITECTURAL_INVARIANTS.md"), "# Invariants\n");
  for (const [slug, rows] of Object.entries(SEEDS[tree])) {
    const dir = path.join(root, "docs", "features", slug);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "decisions.md"), ["open-questions@1", ...rows, ""].join("\n"));
  }
  return Object.keys(SEEDS[tree]).length;
}

export function writeFixture(dir) {
  const counts = {};
  for (const tree of Object.keys(SEEDS)) {
    const root = path.join(dir, tree);
    fs.mkdirSync(root, { recursive: true });
    counts[tree] = writeTree(root, tree);
  }
  return counts;
}

function main(argv) {
  const dir = argv.find((arg) => !arg.startsWith("-"));
  if (dir === undefined) {
    process.stderr.write("usage: product-audit-promotion-fixture.mjs <dir>\n");
    return 2;
  }
  const counts = writeFixture(path.resolve(dir));
  const lines = [FIXTURE];
  for (const [tree, units] of Object.entries(counts)) lines.push(`tree | ${tree} · units ${units}`);
  lines.push(`since | ${FIXTURE_SINCE}`);
  process.stdout.write(`${lines.join("\n")}\n`);
  return 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  process.exitCode = main(process.argv.slice(2));
}
