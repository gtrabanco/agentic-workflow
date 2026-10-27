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

test("pin A — the pin is not vacuous: an allowlisted reader really carries the pattern", () => {
  const hits = headingSearchHits(SCRIPTS);
  const allowlisted = new Set([...HEADING_READER_ALLOWLIST.keys()].map((file) => path.basename(file)));
  assert.ok(
    hits.some((hit) => allowlisted.has(path.basename(hit.file))),
    "no allowlisted file carries a heading search any more — prune the allowlist",
  );
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
