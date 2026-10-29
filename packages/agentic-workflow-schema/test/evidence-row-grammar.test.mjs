/**
 * #318 S12 — the claim-evidence row is versioned grammar, not prose.
 *
 * `fold-findings` (S5) and `execute-phase` (P6) require every repair claim to
 * carry `claim | command | output | ✓`, pasted rather than typed. Until that
 * shape is published by this package it is a sentence a model may ignore: no
 * driver can reject a receipt that cannot demonstrate itself.
 *
 * The shape is published here beside the other unit-doc grammars
 * (`EVIDENCE_COLUMNS`, `PROGRESS_ENTRY_PATTERN`), and the validator refuses a
 * row that omits its command, its observed output or its verdict — the three
 * cells that make the row evidence rather than assertion.
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  EVIDENCE_ROW_COLUMNS,
  EVIDENCE_ROW_VERDICTS,
  validateEvidenceRow,
  parseEvidenceRow,
} from "../src/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "..");

test("#318 S12: the published column set is the claim | command | output | status shape", () => {
  assert.deepEqual([...EVIDENCE_ROW_COLUMNS], ["claim", "command", "output", "status"]);
});

test("#318 S12: the verdict vocabulary is closed and publishes the pass mark", () => {
  assert.deepEqual([...EVIDENCE_ROW_VERDICTS], ["✓", "✗"]);
});

test("#318 S12: a complete row validates and parses back to its cells", () => {
  const row = "| the fold removed 12 lines | `git diff --numstat` | `12\t0\tskills/x.md` | ✓ |";
  const parsed = parseEvidenceRow(row);
  assert.equal(parsed.ok, true, parsed.violations.join("; "));
  assert.equal(parsed.cells.claim, "the fold removed 12 lines");
  assert.equal(parsed.cells.command, "git diff --numstat");
  assert.equal(parsed.cells.output, "12\t0\tskills/x.md");
  assert.equal(parsed.cells.status, "✓");
  assert.deepEqual(parsed.violations, []);
});

test("#318 S12: every missing evidence cell fails closed, naming itself", () => {
  const cases = [
    ["| claim |  | `out` | ✓ |", "invalid-evidence-row-command"],
    ["| claim | `cmd` |  | ✓ |", "invalid-evidence-row-output"],
    ["| claim | `cmd` | `out` |  |", "invalid-evidence-row-status"],
    ["|  | `cmd` | `out` | ✓ |", "invalid-evidence-row-claim"],
  ];
  for (const [row, code] of cases) {
    const result = validateEvidenceRow(row);
    assert.equal(result.ok, false, `${row} must fail closed`);
    assert.ok(result.violations.includes(code), `${row} must name ${code}, got ${result.violations.join(", ")}`);
  }
});

test("#318 S12: a verdict outside the closed set is refused, never coerced", () => {
  for (const verdict of ["yes", "PASS", "ok", "✔", "Y"]) {
    const result = validateEvidenceRow(`| c | \`cmd\` | \`out\` | ${verdict} |`);
    assert.equal(result.ok, false, `verdict ${verdict} must be refused`);
    assert.ok(result.violations.includes("invalid-evidence-row-status"));
  }
});

test("#318 S12: a row whose command carries no backticked command is refused", () => {
  // The shape exists to stop a typed expectation: the command cell must be a
  // command, so prose in that cell is the same defect as an empty one.
  const result = validateEvidenceRow("| claim | I ran the tests | `all green` | ✓ |");
  assert.equal(result.ok, false);
  assert.ok(result.violations.includes("invalid-evidence-row-command"));
});

test("#318 S12: the header and separator rows are recognised, not validated as claims", () => {
  assert.equal(parseEvidenceRow("| claim | command | output | status |").kind, "header");
  assert.equal(parseEvidenceRow("|---|---|---|---|").kind, "separator");
  assert.equal(parseEvidenceRow("| c | `cmd` | `out` | ✓ |").kind, "row");
});

test("#318 S12: the package ships the shape to consumers, built and exported", () => {
  const out = execFileSync(
    process.execPath,
    ["-e", "import('./dist/index.js').then(m=>process.stdout.write(String(Array.isArray(m.EVIDENCE_ROW_COLUMNS))))"],
    { cwd: packageRoot, encoding: "utf8" },
  );
  assert.equal(out, "true", "the published entrypoint exports EVIDENCE_ROW_COLUMNS");
});
