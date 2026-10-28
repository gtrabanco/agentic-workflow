#!/usr/bin/env node

/**
 * structural-sibling-pins.test.mjs — the negative-capability pins (unit 84,
 * issue #315 S3, the F37/F38/F39 class).
 *
 * Where the related surface is *code*, the durable check is a pin on the
 * pattern, not the instance: a new inline `## `-heading search, or an echo path
 * that bypasses the one flatten class, fails the suite at introduction instead
 * of surfacing at the next review cycle (unit 79's F49 → F50 → F51 tail).
 *
 * Every pin carries its allowlist entries with reasons and a corpus case that
 * reintroduces the pattern, so the pin is never vacuous.
 */

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  FLATTEN_COVERAGE_FILES,
  HEADING_READER_ALLOWLIST,
  flattenCoverageViolations,
  headingSearchHits,
  headingSearchViolations,
} from "./structural-sibling-pins.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPTS = path.join(ROOT, "scripts");

/* ------------------------------------------------------------------ pin A */

test("pin A — every inline `## `-heading search lives in an allowlisted reader, with a reason", () => {
  const violations = headingSearchViolations(SCRIPTS);
  assert.deepEqual(violations, [], "the current tree carries fence-blind `## ` readers — refactor them onto the shared sectionBounds reader or record the reason");
});

test("pin A — reintroducing the F37/F38/F39 pattern in a new script fails the pin", () => {
  const scratch = mkdtempSync(path.join(tmpdir(), "pin-a-"));
  try {
    mkdirSync(path.join(scratch, "scripts"));
    writeFileSync(path.join(scratch, "scripts", "rogue-reader.mjs"), "const next = /^## /m.exec(rest);\n");
    const violations = headingSearchViolations(scratch);
    assert.equal(violations.length, 1);
    assert.match(violations[0].file, /rogue-reader\.mjs$/);
    assert.equal(violations[0].line, 1, "the pin names file:line");
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test("pin A — reintroducing the F37/F38/F39 pattern under an allowlisted file name is still a violation", () => {
  // Review F8: the allowlist was keyed by `path.basename`, so a script in any
  // subdirectory that happened to share an allowlisted name (a nested
  // `unit-doc-phases.mjs`) bypassed the pin silently. Keys are repository-
  // relative paths now, so only the real reader owns its exemption.
  const scratch = mkdtempSync(path.join(tmpdir(), "pin-a-key-"));
  try {
    mkdirSync(path.join(scratch, "nested"), { recursive: true });
    writeFileSync(path.join(scratch, "nested", "unit-doc-phases.mjs"), "const bound = /^## /.exec(rest);\n");
    const violations = headingSearchViolations(scratch);
    assert.equal(violations.length, 1, "the same-named nested file is not exempt");
    assert.match(violations[0].file, /nested\/unit-doc-phases\.mjs$/);
    assert.equal(violations[0].line, 1, "the violation names the line");
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test("pin A — the pin is not vacuous: every allowlisted reader really carries the pattern", () => {
  const hits = headingSearchHits(SCRIPTS);
  // Keyed by repository-relative path, so a prunable entry is one nothing
  // needs any more — and an entry nobody carries is a hole, not a hedge.
  const carried = new Set(hits.map((hit) => hit.repoFile));
  for (const file of HEADING_READER_ALLOWLIST.keys()) {
    assert.ok(carried.has(file), `${file} no longer carries a heading search — prune the allowlist entry`);
  }
  for (const [file, reason] of HEADING_READER_ALLOWLIST) {
    assert.ok(reason.length > 20, `${file}'s allowlist reason is prose, not a dash`);
  }
});

/* ------------------------------------------------------------------ pin B */

test("pin B — every echo path of carrier cells routes through the one flatten class", () => {
  const violations = flattenCoverageViolations();
  assert.deepEqual(violations, [], "an echo path emitting a raw carrier cell is the F38 class — route it through flattenCell()/bounded()");
});

test("pin B — the pin covers the surfaces the issue names", () => {
  assert.ok(FLATTEN_COVERAGE_FILES.includes("scripts/workflow-status.mjs"), "the sensor's echo paths are the corpus the issue names");
  for (const file of FLATTEN_COVERAGE_FILES) {
    assert.ok(readFileSync(path.join(ROOT, file), "utf8").includes("flattenCell"), `${file} declares the flatten class the pin checks`);
  }
});

test("pin B — reintroducing an unflattened echo path fails the pin", () => {
  const scratch = mkdtempSync(path.join(tmpdir(), "pin-b-"));
  try {
    writeFileSync(
      path.join(scratch, "rogue-echo.mjs"),
      [
        "const marks = [];",
        "for (const { id, body } of rows) {",
        "  marks.push(`${unitDir}: ${id} — ${body}`);",
        "}",
        "",
      ].join("\n"),
    );
    const violations = flattenCoverageViolations(scratch);
    assert.equal(violations.length, 1, "the unflattened template push is refused");
    assert.equal(violations[0].line, 3, "the pin names the push site's line");
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});

test("F19 — the heading-search walk carries an entry ceiling", () => {
  // The census walk read every matching file with no bound on entries
  // visited. The ceiling is a budget on the walk itself, checked before any
  // work on an entry; the default is far above this repository's tree, so the
  // census over `scripts/` stays complete while a hostile directory cannot.
  const scratch = mkdtempSync(path.join(tmpdir(), "pin-cap-"));
  try {
    for (const name of ["a.mjs", "b.mjs", "c.mjs"]) {
      writeFileSync(path.join(scratch, name), "const H = /^## x/;\n");
    }
    assert.equal(headingSearchHits(scratch).length, 3, "the default ceiling is not the one in play here");
    assert.equal(headingSearchHits(scratch, 1).length, 1, "a one-entry ceiling visits one entry");
    assert.equal(headingSearchHits(scratch, 0).length, 0, "a zero-entry ceiling walks nothing");
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
});
