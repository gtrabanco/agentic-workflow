#!/usr/bin/env node

/**
 * structural-sibling-pins.mjs — the negative-capability pin scanners (unit 84,
 * issue #315 S3, the F37/F38/F39 class).
 *
 * Each scanner walks a directory of scripts and reports the lines that
 * reintroduce a defect class the fold loop already repaired twice. The pins
 * are pattern-level on purpose: the instance repairs rot, the pattern fails at
 * introduction. Every allowlist entry carries its reason, and the pin suite
 * (`scripts/structural-sibling-pins.test.mjs`) proves each scanner is not
 * vacuous with a fixture that reintroduces the pattern.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MODULE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/**
 * An inline `## `-heading search: the F37/F38/F39 pattern. A regex literal
 * whose source anchors on `## ` is how a fence-blind section reader starts;
 * the shared reader is `scripts/unit-doc-phases.mjs` (`sectionText`,
 * `sectionBounds`, `H2_HEADING`) and everything else cites it.
 */
const HEADING_SEARCH = /\/\^##\s?/;

/**
 * The files allowed to carry a `## `-anchored regex literal, each with the
 * reason recorded at pin time. Keyed by the **repository-relative path**, not
 * the base name (review F8: basename keying let any script in any
 * subdirectory that happened to share an allowlisted name bypass the pin in
 * silence); the pin suite asserts every key still carries the pattern, so the
 * list cannot rot into entries nobody needs.
 */
export const HEADING_READER_ALLOWLIST = new Map([
  [
    "scripts/unit-doc-phases.mjs",
    "the shared fence-aware reader owns the grammar — sectionText, sectionBounds and H2_HEADING are the one definition (#308 F28/F39); every other reader cites it",
  ],
  [
    "scripts/workflow-status.mjs",
    "the legacy TASKS.md phase reader is fence-aware since unit 84 (S3 pin); its remaining `^##` literal only labels boundaries inside the fence-aware walk, never bounds a section on its own",
  ],
  [
    "scripts/promise-coherence.mjs",
    "its own sectionsOf is a fence-aware reader (it collects every section, not one); the remaining literals are `## Turn contract` presence probes, never section bounds",
  ],
  [
    "scripts/pre-execution-contract.mjs",
    "receipt chunk parser: versioned titled headings (## Pre-execution review receipt v1 — …) that the exact-name shared reader cannot match; machine-generated receipts carry no fenced blocks",
  ],
]);

/**
 * The files whose echo paths must route carrier cells through the one flatten
 * class (`flattenCell` / `bounded`): the sensor surfaces the carrier cells an
 * envelope emits (F38's class).
 */
export const FLATTEN_COVERAGE_FILES = Object.freeze(["scripts/workflow-status.mjs"]);

/** The carrier-cell identifiers an echo path must not emit raw. */
const CARRIER_CELL = /\$\{\s*(?<![.\w])(id|file|axis|severity|klass|route|body)\b/;

/** A template push that emits a string into an envelope or observation list. */
const TEMPLATE_PUSH = /\.push\(\s*`/;

/** `scripts/*.mjs` files (non-recursive), skipping the pin suites themselves. */
function scriptFiles(directory) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".mjs") && !entry.name.endsWith(".test.mjs"))
    .map((entry) => path.join(directory, entry.name));
}

/** The census walk's entry ceiling — far above this repository's tree. */
export const PINS_MAX_ENTRIES = 20_000;

/**
 * Every `## `-anchored regex-literal line under `directory` (recursive), as
 * `{ file, repoFile, line, text }` — `file` relative to `directory` (what a
 * report shows), `repoFile` relative to this repository (what the allowlist
 * keys on). The allowlist is applied only by `headingSearchViolations`; this
 * is the raw census. `maxEntries` bounds the walk (cycle-2 review F19): the
 * default is far above this repository's tree, so the census over a real
 * checkout stays complete while a hostile or accidental directory cannot
 * turn one read into an unbounded scan.
 */
export function headingSearchHits(directory, maxEntries = PINS_MAX_ENTRIES) {
  const hits = [];
  let visited = 0;
  const walk = (current) => {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (visited >= maxEntries) return;
      visited += 1;
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(absolute);
        continue;
      }
      if (!entry.name.endsWith(".mjs") || entry.name.endsWith(".test.mjs")) continue;
      let text;
      try {
        text = fs.readFileSync(absolute, "utf8");
      } catch {
        continue;
      }
      const relative = path.relative(directory, absolute).split(path.sep).join("/");
      // Keys are repository-relative, so a file outside this checkout can never
      // collide with an allowlisted reader: its repo-relative path starts with
      // `../` and matches nothing in the map.
      const repoFile = path.relative(MODULE_ROOT, absolute).split(path.sep).join("/");
      text.split(/\r?\n/).forEach((line, index) => {
        if (HEADING_SEARCH.test(line)) {
          hits.push({ file: relative, repoFile, line: index + 1, text: line.trim() });
        }
      });
    }
  };
  walk(directory);
  return hits;
}

/**
 * The heading-search lines that no allowlisted reader owns — empty when the
 * tree is clean, each row naming `file:line` when a new script reintroduces
 * the fence-blind-reader pattern. Keyed on the repository-relative path, so a
 * same-named file in a subdirectory is a violation, not a silent exemption.
 */
export function headingSearchViolations(directory) {
  return headingSearchHits(directory).filter((hit) => !HEADING_READER_ALLOWLIST.has(hit.repoFile));
}

/**
 * The echo paths that emit a carrier cell without the one flatten class.
 * Scans `directory` (or this repository's `FLATTEN_COVERAGE_FILES` when the
 * default root is given): a template push interpolating `id`, `file`, `axis`,
 * `severity`, `klass`, `route` or `body` must pass it through `flattenCell(`
 * or `bounded(` on the same line.
 */
export function flattenCoverageViolations(directory = MODULE_ROOT) {
  const violations = [];
  const scan = (absolute, display) => {
    let text;
    try {
      text = fs.readFileSync(absolute, "utf8");
    } catch {
      return;
    }
    text.split(/\r?\n/).forEach((line, index) => {
      if (!TEMPLATE_PUSH.test(line) || !CARRIER_CELL.test(line)) return;
      if (/flattenCell\(|bounded\(/.test(line)) return;
      violations.push({ file: display, line: index + 1, text: line.trim() });
    });
  };
  if (directory !== MODULE_ROOT) {
    // A scratch corpus: every top-level script in it is the surface under test.
    for (const file of scriptFiles(directory)) scan(file, path.basename(file));
    return violations;
  }
  for (const relative of FLATTEN_COVERAGE_FILES) {
    scan(path.join(MODULE_ROOT, relative), relative);
  }
  return violations;
}
