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
