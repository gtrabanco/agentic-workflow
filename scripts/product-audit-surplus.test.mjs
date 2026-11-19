#!/usr/bin/env node
// test-obligation: protects=skills/product-audit/references/AUDIT_DIMENSIONS.md obligations=convention,contract

/**
 * product-audit-surplus.test.mjs — the Tests dimension's surplus direction,
 * pinned (issue #595).
 *
 * The dimension inventory named one direction only: which tests are missing. An
 * audit pass could therefore complete without ever asking the other question —
 * which tests should not exist — and the owner observed exactly that on
 * 2026-11-16. Prose alone does not survive a compaction (the reason
 * `docs/workflow/GATE_INVENTORY.md` exists), so the rule that fixes it is pinned
 * here: the applicability row, the three checks with their evidence standards,
 * the `verified: no surplus tests` receipt, the class and route a surplus
 * finding takes, the delete-vs-weaken boundary, and the registration that gives
 * the surface one owner.
 *
 * What this file does NOT do, by the unit's own non-goal: no producer, no
 * duplication measurement, no gate step. Every assertion reads committed bytes;
 * nothing imports the workspace packages, so a fresh clone can run this suite
 * with no install and no `dist/` build.
 *
 * Sibling suites read the same two references and stay the owners of their own
 * rules (`product-audit-rescope`, `residue-dimensions`, `coverage-gap`,
 * `dimension-regression`); this file pins the surplus direction and the
 * structural shape of the files it edits, never a rule another suite owns.
 *
 * Run: `bun test scripts/product-audit-surplus.test.mjs`
 * (fallback `node --test scripts/product-audit-surplus.test.mjs`).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { sectionText } from "../packages/agentic-workflow/src/runner/unit-doc-phases.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");

const DIMENSIONS_REL = "skills/product-audit/references/AUDIT_DIMENSIONS.md";
const PROCESS_REL = "skills/product-audit/references/AUDIT_PROCESS.md";
const GUIDE_REL = "AGENTS.md";
const INVENTORY_REL = "docs/workflow/GATE_INVENTORY.md";
const SECTION = "Test-surplus sweep (pass-only-if)";

const dimensions = () => read(DIMENSIONS_REL);
const process_ = () => read(PROCESS_REL);
/** Prose wraps: a phrase check reads the flattened text, never a line. */
const flat = (text) => text.replace(/\s+/g, " ");
/** The section this unit adds, or fail loudly: a renamed heading is a real miss. */
const sweep = () => {
  const text = sectionText(dimensions(), SECTION);
  assert.notEqual(text, null, `${DIMENSIONS_REL} no longer carries the \`## ${SECTION}\` section`);
  return text;
};

/** One fenced block by its marker (the first line inside the fence). */
function blockByMarker(text, marker) {
  for (const match of text.matchAll(/```[a-zA-Z]*\n([\s\S]*?)```/g)) {
    const body = match[1].replace(/\n$/, "");
    if (body.split("\n")[0].trim() !== marker) continue;
    const lines = body.split("\n");
    const cells = (line) => line.split("|").map((cell) => cell.trim());
    const header = cells(lines[1] ?? "");
    const rows = lines
      .slice(2)
      .filter((line) => line.trim() !== "")
      .map((line) => {
        const values = cells(line);
        const row = {};
        header.forEach((name, index) => {
          row[name] = values[index] ?? "";
        });
        return row;
      });
    return { header, rows, body };
  }
  return null;
}

// ── O1 — the dimension row names both directions ────────────────────────────

test("the applicability row sweeps the surplus direction and points at its section (O1)", () => {
  const row = dimensions()
    .split("\n")
    .find((line) => line.trim().startsWith("| **Tests** |"));
  assert.ok(row, `${DIMENSIONS_REL} carries no \`| **Tests** |\` applicability row`);
  assert.match(row, /surplus/i, "the Tests row still sweeps the depleted direction only");
  assert.match(row, /Test-surplus sweep/, "the row must point at the section that defines the sweep");
});

test("regression: the depleted direction the row already swept is still named (O1)", () => {
  const row = dimensions()
    .split("\n")
    .find((line) => line.trim().startsWith("| **Tests** |"));
  assert.match(row, /Coverage of critical paths/, "the existing coverage sweep left the row");
  assert.match(row, /missing\/!flaky tests/, "the existing missing/flaky check left the row");
  assert.match(row, /untested failure modes/, "the existing untested-failure-modes check left the row");
});

// ── O2/O3 — the three checks and their evidence standards ───────────────────

test("the surplus direction publishes its three checks (O2)", () => {
  const block = blockByMarker(sweep(), "test-surplus@1");
  assert.ok(block, `${DIMENSIONS_REL} § ${SECTION} carries no \`test-surplus@1\` block`);
  assert.deepEqual(block.header, ["kind", "shape", "what it orders"], "the block's column order is closed");
  const checks = block.rows.filter((row) => row.kind === "check").map((row) => row.shape);
  assert.deepEqual(checks, ["dead-surface", "obligation-duplicate", "cost-over-value"],
    `the three surplus checks are a closed set, got: ${checks.join(", ")}`);
  for (const row of block.rows.filter((entry) => entry.kind === "check")) {
    assert.ok(row["what it orders"].length > 40, `check ${row.shape} orders nothing`);
  }
});

test("each check carries its own evidence standard (O3)", () => {
  const text = sweep();
  // dead-surface: a live-tree search proves the surface gone, and the residue
  // sweep's no-prose-consumer rule is composed by reference, never restated.
  assert.match(text, /dead-surface/i);
  assert.match(text, /live-tree search|search that proves/i, "dead-surface states no evidence standard");
  assert.match(text, /dead-code rule/, "dead-surface does not name the rule it composes");
  assert.match(text, /not evidence of a consumer/,
    "dead-surface must compose the residue sweep's no-prose-consumer rule by reference");
  assert.match(text, /Residue sweeps/, "the dead-code rule's owner is cited, not restated");
  // obligation-duplicate: the asserted behaviour, never line coverage.
  assert.match(text, /obligation-duplicate/i);
  assert.match(text, /never line coverage|not line coverage/i,
    "obligation-duplicate must refuse line coverage as evidence");
  assert.match(text, /asserted behaviou?r/i, "obligation-duplicate names its evidence");
  // cost-over-value: measured cost against the risk covered.
  assert.match(text, /cost-over-value/i);
  assert.match(text, /risk/i);
  assert.match(text, /cost/i);
});

test("selective kill-rate is a confirmation for contested clusters, never a sweep (O3)", () => {
  const text = sweep();
  assert.match(text, /kill-rate/i, "the confirmation mechanism is not named");
  assert.match(text, /contested/i, "kill-rate without a contested cluster is an exhaustive sweep");
  assert.match(text, /exhaustive (mutation )?sweep is never run|never an exhaustive sweep/i,
    "the cost bound is not stated");
});

test("the checks cite their sources and invent no repository fact (O4)", () => {
  const text = sweep();
  assert.match(text, /#595/, "the upstream evidence's source (issue #595) is not cited");
  assert.match(text, /Inozemtseva|Rothermel|Zhang|Myers|Myers 1979/,
    "the risk/effectiveness claims carry no citation");
});

// ── O5 — the receipt ────────────────────────────────────────────────────────

test("the receipt is a verification, not a reward for deletion (O5)", () => {
  const text = sweep();
  assert.match(text, /verified: no surplus tests/, "the receipt row is not published");
  assert.match(text, /(not|never) a reward for deletion/i, "the receipt's meaning is not stated");
});

test("the process records the receipt for every pass that reaches the Tests dimension (O5, S7)", () => {
  const text = process_();
  assert.match(text, /verified: no surplus tests/, `${PROCESS_REL} does not carry the receipt`);
  assert.match(flat(text), /Test-surplus sweep/, `${PROCESS_REL} does not point at the sweep it consumes`);
  // The receipt rides the dimension's health line, which is where the report
  // already puts a dimension's verdict — no new report section is invented.
  assert.match(text, /health line/, "the receipt's carrier in the report is not named");
});

// ── O6 — class, route, and the audit's own repair boundary ──────────────────

test("a surplus finding takes fix-now (delete) only with evidence, and routes to its executor (O6)", () => {
  const text = `${sweep()}\n${process_()}`;
  assert.match(text, /`fix-now \(delete\)`/, "the class notation is not the residue sweep's own");
  assert.match(text, /finding-route@1/, "the route grammar is not the published one");
  assert.match(text, /\/fold-findings/, "the executor is not named");
  assert.match(text, /never (by )?this (audit|run)|never deletes|repairs nothing/i,
    "the audit's own boundary is not stated");
});

// ── O7 — the boundary, stated where the check is defined ───────────────────

test("the delete-vs-weaken boundary sits in the section that defines the check (O7)", () => {
  const text = sweep();
  assert.match(text, /weaken/i, "the boundary does not name weakening");
  assert.match(text, /AGENTS\.md/, "the guide's rule is not cited by owner pointer");
  assert.match(text, /separate, evidence-gated action/i, "deletion's standing is not stated");
});

// ── O8 — one surface, one owner ─────────────────────────────────────────────

test("the surface is declared in the guide and claimed by exactly one gate row (O8)", () => {
  assert.match(
    read(GUIDE_REL),
    /test-surplus-grammar \| skills\/product-audit\/references\/AUDIT_DIMENSIONS\.md \| block:test-surplus@1/,
    `${GUIDE_REL} does not declare \`test-surplus-grammar\``,
  );
  // The inventory block's rows are pipe-separated without a leading pipe; the
  // `surfaces` cell is the seventh (gate-id, statement, carrier, file, section,
  // token, surfaces, …). One row claims the id, so no second gate owns it.
  const claims = read(INVENTORY_REL)
    .split("\n")
    .filter((line) => /^[a-z0-9-]+ \|/.test(line.trim()))
    .filter((line) =>
      line
        .split("|")
        .map((cell) => cell.trim())
        .slice(6, 7)
        .join("")
        .split(",")
        .includes("test-surplus-grammar"));
  assert.equal(
    claims.length,
    1,
    `${INVENTORY_REL} claims \`test-surplus-grammar\` in ${claims.length} rows, expected exactly 1 (one surface, one owner)`,
  );
  assert.match(claims[0], /^normative-surface-grammar \|/, "the drift gate's own row is the surface's claimant");
});

// ── O11 — regression: the two edited references keep their shape ────────────

test("regression: the applicability table still parses as a table (O11)", () => {
  const rows = dimensions()
    .split("\n")
    .filter((line) => line.trim().startsWith("| **"));
  assert.ok(rows.length >= 16, `${DIMENSIONS_REL} publishes ${rows.length} dimension rows, not the shipped set`);
  for (const row of rows) {
    assert.ok(row.split("|").length >= 5, `a dimension row lost its columns: ${row.slice(0, 60)}`);
  }
});

test("regression: the process still carries its eleven numbered steps (O11)", () => {
  const steps = [...process_().matchAll(/^(\d+)\. \*\*/gm)].map((match) => Number(match[1]));
  assert.deepEqual(steps, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    `${PROCESS_REL}'s numbered process changed: ${steps.join(", ")}`);
});
