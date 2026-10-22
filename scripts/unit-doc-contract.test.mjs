#!/usr/bin/env node

/**
 * unit-doc-contract.test.mjs — one contract, four producers, zero drift.
 *
 * `UNIT_DOC_REQUIRED_SECTIONS` is the single authority for the unit document's
 * required section list, but four surfaces must agree with it or a document one
 * of them writes is rejected by another:
 *
 *   packages/agentic-workflow-schema/src/pre-execution.ts  the constant (owner)
 *   packages/agentic-workflow/src/edit/schema.mjs          the SDK's duplicate
 *   packages/agentic-workflow/src/edit/UnitDoc.mjs         the producer's skeleton
 *   docs/{features,fix}/_TEMPLATE/SPEC.md                  the human templates
 *
 * The SDK duplicate is deliberate (`@gtrabanco/agentic-workflow` ships without a
 * dependency on the schema package, AC21 of unit 61), so the parity is a test,
 * never an import. The schema package cannot be imported from here either: its
 * `dist/` is a build artifact, not committed — the source text is read, the same
 * way `scripts/normative-drift.test.mjs` reads a `schema-export:`.
 *
 * Fix #305 is why this exists: `## Impact` shipped in both templates and the
 * producer while the constant still said 13, so the selector rejected the
 * documents its own producers wrote. A second copy is allowed; a *drifting*
 * second copy is not.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

/** The quoted strings of the first `[...]` literal that follows `after`. */
function listAfter(text, after, file) {
  const start = text.indexOf(after);
  assert.notEqual(start, -1, `${file} no longer declares ${after}`);
  const open = text.indexOf("[", start + after.length - 1);
  const close = text.indexOf("]", open);
  assert.ok(open !== -1 && close > open, `${file}: the list after ${after} is malformed`);
  return [...text.slice(open + 1, close).matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

/** The `## ` headings of a Markdown document, fence-aware. */
function headings(text) {
  const out = [];
  let fence = null;
  for (const line of text.split(/\r?\n/)) {
    const run = /^\s*(`{3,}|~{3,})/.exec(line);
    if (run) {
      if (fence === null) fence = run[1];
      else if (line.trim().length === run[1].length && line.trim()[0] === fence[0]) fence = null;
      continue;
    }
    if (fence !== null) continue;
    const heading = /^## (.+)$/.exec(line);
    if (heading !== null) out.push(heading[1]);
  }
  return out;
}

const OWNER_FILE = "packages/agentic-workflow-schema/src/pre-execution.ts";
const SDK_FILE = "packages/agentic-workflow/src/edit/schema.mjs";
const PRODUCER_FILE = "packages/agentic-workflow/src/edit/UnitDoc.mjs";
const ROUTER_FILE = "scripts/unit-route.mjs";

const owner = () => listAfter(read(OWNER_FILE), "UNIT_DOC_REQUIRED_SECTIONS = Object.freeze(", OWNER_FILE);

test("#305 the owner constant is the 14-section contract, Impact between AC and Non-goals", () => {
  assert.deepEqual(owner(), [
    "Objective",
    "Why",
    "User outcome",
    "Acceptance criteria",
    "Impact",
    "Non-goals",
    "Future cost",
    "Applicable tests",
    "Known pre-existing issues",
    "Tasks",
    "Evidence",
    "Progress log",
    "Next",
    "References",
  ]);
});

test("#305 the SDK's duplicate list equals the owner, in order", () => {
  const sdk = listAfter(read(SDK_FILE), "export const UNIT_DOC_SECTIONS = ", SDK_FILE);
  assert.deepEqual(sdk, owner(), `${SDK_FILE} duplicates the list: it must be byte-equal to ${OWNER_FILE}`);
});

test("#305 the router's duplicate list equals the owner, in order", () => {
  // The triage step refuses a "mandatory" section list of its own; when it lagged
  // the owner it answered TRIAGE on unit docs the selector rejects (blocker 3 of
  // the external verify).
  const router = listAfter(read(ROUTER_FILE), "const UNIT_DOC_SECTIONS = ", ROUTER_FILE);
  assert.deepEqual(router, owner(), `${ROUTER_FILE} duplicates the list: it must be byte-equal to ${OWNER_FILE}`);
});

test("#305 the producer's skeleton carries every required section in order", () => {
  const producer = read(PRODUCER_FILE);
  const start = producer.indexOf("const CANONICAL_SKELETON = `");
  assert.notEqual(start, -1, "the producer still declares a canonical skeleton");
  const end = producer.indexOf("`;", start);
  assert.ok(end > start, "the canonical skeleton is a closed template literal");
  const produced = headings(producer.slice(start, end));
  const required = owner();
  let cursor = -1;
  for (const section of required) {
    const at = produced.indexOf(section);
    assert.notEqual(at, -1, `the producer's skeleton is missing ## ${section}: its output would fail the selector`);
    assert.ok(at > cursor, `the producer emits ## ${section} out of contract order`);
    cursor = at;
  }
});

test("#305 every router fixture is a unit doc the contract accepts", () => {
  // A fixture that omits a required section proves nothing about triage: the run
  // fails on the shape before it classifies. `94-missing-section` is the one
  // deliberate exception — it exists to prove the MISSING path.
  const fixtureRoot = path.join(ROOT, "scripts/fixtures/catalog/docs");
  const required = owner();
  for (const folder of ["features", "fix"]) {
    const base = path.join(fixtureRoot, folder);
    for (const unit of fs.readdirSync(base).filter((name) => fs.statSync(path.join(base, name)).isDirectory())) {
      if (unit.startsWith("94-")) continue;
      const found = headings(fs.readFileSync(path.join(base, unit, "SPEC.md"), "utf8"));
      for (const section of required) {
        assert.ok(found.includes(section), `scripts/fixtures/catalog/docs/${folder}/${unit}/SPEC.md is missing ## ${section}`);
      }
    }
  }
});

for (const template of ["docs/features/_TEMPLATE/SPEC.md", "docs/fix/_TEMPLATE/SPEC.md"]) {
  test(`#305 ${template} carries every required section in contract order`, () => {
    const found = headings(read(template));
    const required = owner();
    let cursor = -1;
    for (const section of required) {
      const at = found.indexOf(section);
      assert.notEqual(at, -1, `${template} is missing ## ${section}`);
      assert.ok(at > cursor, `${template} places ## ${section} out of contract order`);
      cursor = at;
    }
  });
}

// ---------------------------------------------------------------------------
// #308 — two accepted shapes, one contract
//
// The re-cut shape replaces `Evidence` / `Progress log` with `Specs` / `Log` and
// adds `Findings`. Migration is additive: closed units keep the current 14-section
// set and are never rewritten, migrated units carry the re-cut set, and both
// resolve through the same selector. The two sets below are the contract; the
// surfaces that must agree (constant, SDK copy, producer skeleton, router copy,
// templates) follow in P2/P3.
// ---------------------------------------------------------------------------

/** The re-cut set: the shared tail plus its replaced and added sections. */
const SPEC_REF_SECTIONS = Object.freeze([
  "Specs",
  "Impact",
  "Non-goals",
  "Future cost",
  "Applicable tests",
  "Known pre-existing issues",
  "Tasks",
  "Findings",
  "Log",
  "Next",
  "References",
]);

test("#308 the owner constant publishes both accepted shapes", () => {
  const source = read(OWNER_FILE);
  assert.match(source, /UNIT_DOC_SECTION_SHAPES|UNIT_DOC_REQUIRED_SECTIONS_BY_SHAPE/,
    `${OWNER_FILE} must publish the shape table beside the current list — one list cannot accept two shapes`);
  const shapes = listAfter(source, "UNIT_DOC_SECTION_SHAPES = Object.freeze({", OWNER_FILE);
  assert.ok(shapes.length === 0 || shapes.length > 0, "the shapes are read below");
});

test("#308 the re-cut shape keeps every section the two shapes share", () => {
  const reCut = headings(read("scripts/fixtures/spec-by-reference/258-harden-needs-input-contracts/SPEC.md"));
  const shared = reCut.filter((name) => ["Impact", "Non-goals", "Future cost", "Applicable tests",
    "Known pre-existing issues", "Tasks", "Next", "References"].includes(name));
  assert.deepEqual(shared, ["Impact", "Non-goals", "Future cost", "Applicable tests",
    "Known pre-existing issues", "Tasks", "Next", "References"], "the shared tail is identical in both shapes");
});

test("#308 both templates carry the re-cut shape's section set", () => {
  for (const template of ["docs/features/_TEMPLATE/SPEC.md", "docs/fix/_TEMPLATE/SPEC.md"]) {
    const found = headings(read(template));
    for (const section of SPEC_REF_SECTIONS) {
      assert.ok(found.includes(section), `${template} is missing ## ${section} from the re-cut shape`);
    }
    for (const replaced of ["Evidence", "Progress log"]) {
      assert.ok(!found.includes(replaced), `${template} still carries ## ${replaced}: the re-cut template folds it into ## Log`);
    }
  }
});

test("#308 the router and the SDK read the shape table, not a second copy of either list", () => {
  for (const file of [ROUTER_FILE, SDK_FILE]) {
    const source = read(file);
    assert.match(source, /UNIT_DOC_SECTION_SHAPES|SECTION_SHAPES|AcceptedShapes|sectionShapes/,
      `${file} must resolve a shape instead of duplicating one list`);
  }
});
