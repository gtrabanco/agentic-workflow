/**
 * doctor.inventory.test.mjs — the documented tool inventory and the probes are
 * one declaration (issue #537 S8).
 *
 * The crate README's `tool-inventory@1` block is where a tool's what/why/
 * requirement/detection/alternative/route live; the code owns only the probes.
 * This suite pins the two halves together in both directions, so neither a
 * documented tool without a probe nor a probe without a documented row can land.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CHECK_PROBES } from "../src/doctor/checks.mjs";
import { INVENTORY_MARKER, parseInventory } from "../src/doctor/inventory.mjs";
import { INSTALL_ROUTES, NODE_ENGINE } from "../src/doctor/vocabulary.mjs";

const README = readFileSync(fileURLToPath(new URL("../README.md", import.meta.url)), "utf8");
const MANIFEST = JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"));

test("the crate README declares the inventory block with the published columns", () => {
  assert.ok(README.includes(INVENTORY_MARKER), `the crate README carries ${INVENTORY_MARKER}`);
  const parsed = parseInventory(README);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.columns, ["id", "what", "why", "requirement", "detected-by", "alternative", "install-route"]);
  assert.equal(parsed.rows.length, 17, "one row per checked surface");
});

test("documented → probed: every documented row has a probe, in registry order", () => {
  const { rows } = parseInventory(README);
  assert.deepEqual(
    rows.map((row) => row.id),
    CHECK_PROBES.map((probe) => probe.id),
    "the document and the registry name the same surfaces in the same order",
  );
});

test("probed → documented: every probe is declared, with a published route and requirement", () => {
  const { rows } = parseInventory(README);
  const byId = new Map(rows.map((row) => [row.id, row]));
  for (const probe of CHECK_PROBES) {
    const row = byId.get(probe.id);
    assert.ok(row, `${probe.id} is documented`);
    assert.ok(["required", "optional"].includes(row.requirement), `${probe.id}: requirement vocabulary`);
    assert.ok(INSTALL_ROUTES.includes(row["install-route"]), `${probe.id}: install-route vocabulary`);
    assert.ok(row.what && row.why && row["detected-by"] && row.alternative, `${probe.id}: every column is filled`);
  }
});

test("the node engine constant is the manifest's own engines.node (one home)", () => {
  assert.equal(NODE_ENGINE, MANIFEST.engines.node);
});

test("a malformed row is a parse error, never a silent skip", () => {
  const broken = README.replace(/^rg \|.*$/mu, "rg | only two cells |");
  const parsed = parseInventory(broken);
  assert.ok(parsed.errors.length > 0, "a short row is refused");
  assert.ok(parsed.errors.some((error) => /rg/u.test(error.message)), "the refusal names the row");
});

test("a duplicate id is a parse error", () => {
  const duplicated = README.replace(/^rg \|.*$/mu, (line) => `${line}\n${line}`);
  const parsed = parseInventory(duplicated);
  assert.ok(parsed.errors.some((error) => /duplicate/u.test(error.message)));
});

// Justification: the independent obligation is the rendered-facts rule over the
// doctor's own usage row — the count is the inventory literal above (`17`), so
// the prose must not restate a figure that drifts the moment a row is added
// (issue #705 external-verify blocker 1: the row said "instead of sixteen").
test("the doctor usage row restates no row count — the inventory literal owns it", () => {
  const row = README.split("\n").find((line) => line.startsWith("| `doctor ["));
  assert.ok(row, "the doctor usage row exists");
  const wordNumbers =
    "zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety";
  const rowFigures = wordNumbers.replace("one|", ""); // "one row per surface" is shape prose, not a count claim
  const contrast = new RegExp(`\\binstead of (?:\\d+|${wordNumbers})\\b`, "u");
  const figure = new RegExp(`\\b(?:\\d+|${rowFigures})\\s+rows?\\b`, "u");
  assert.ok(!contrast.test(row), `no "instead of <count>" claim: ${row.match(contrast)?.[0]}`);
  assert.ok(!figure.test(row), `no "<count> rows" claim: ${row.match(figure)?.[0]}`);
});
