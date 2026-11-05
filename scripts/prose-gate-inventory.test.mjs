#!/usr/bin/env node
/**
 * Feature 96 — the prose-gate inventory is a gate of its own.
 *
 * The defect class (issue #359, arXiv 2606.22528): a gate enforced only by
 * skill prose silently disappears when the context compacts, and the run keeps
 * going as if the gate never existed. The inventory in
 * `docs/workflow/GATE_INVENTORY.md` answers "which gates are script-pinned and
 * which are prose-only", and this suite is what keeps that answer true: the
 * carrier a row names must still resolve, the ranking must still be arithmetic,
 * and a new gate may not enter the tree uncited.
 *
 * Every refusal is a fixture, never an edit: `inspect(root)` reads a tree into
 * plain rows and `checkInventory(model)` is pure, so each failure mode is
 * asserted through the same code path the live repository runs through.
 * `PROSE_GATE_REPO` re-points the reader at a throwaway tree, which is how the
 * frozen failure is reproduced against `git archive <base sha>` — the pre-change
 * tree carries no inventory at all.
 *
 * Usage
 *   bun test scripts/prose-gate-inventory.test.mjs
 *   node --test scripts/prose-gate-inventory.test.mjs     (fallback)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  CARRIERS,
  COLUMNS,
  INVENTORY_REL,
  MARKER,
  STAY_REASONS,
  deriveTier,
  findHomes,
  inspect,
  renderBlock,
  report,
} from "./prose-gate-inventory.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = process.env.PROSE_GATE_REPO ? path.resolve(process.env.PROSE_GATE_REPO) : repoRoot;

const tmpBase = process.env.TMPDIR || os.tmpdir();
const fixtures = [];

/** One throwaway tree per case; removed by the process exit hook below. */
const fixture = (files) => {
  const dir = fs.mkdtempSync(path.join(tmpBase, "prose-gate-"));
  fixtures.push(dir);
  for (const [relative, body] of Object.entries(files)) {
    const target = path.join(dir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body);
  }
  return dir;
};

process.on("exit", () => {
  for (const dir of fixtures) fs.rmSync(dir, { recursive: true, force: true });
});

/** A thead + one row, in the block's own grammar, built from an object. */
const row = (overrides = {}) => ({
  "gate-id": "gate-fixture",
  statement: "a fixture gate",
  carrier: "script",
  file: "scripts/pin.test.mjs",
  section: "-",
  token: "the pin",
  surfaces: "-",
  safety: "2",
  recurrence: "2",
  checkability: "2",
  tier: "script",
  "stay-reason": "-",
  rederive: "-",
  ...overrides,
});

const block = (rows, directives = {}) => {
  const lines = [MARKER];
  for (const [name, value] of Object.entries(directives)) lines.push(`# ${name}: ${value}`);
  lines.push(COLUMNS.join(" | "));
  for (const entry of rows) lines.push(COLUMNS.map((column) => entry[column]).join(" | "));
  return ["```text", ...lines, "```", ""].join("\n");
};

/** The minimum files a fixture row can resolve against. */
const baseFiles = (rows, directives) => ({
  [INVENTORY_REL]: `# Inventory\n\n${block(rows, directives)}\n`,
  "scripts/pin.test.mjs": `// the pin lives here\n`,
  "docs/owner.md": `# Owner\n\n## Rules\n\nthe rule lives here\n\n## Other\n\nnothing\n`,
  "scripts/a-discipline.test.mjs": "// suite\n",
});

const reasons = (result) => result.errors.map((error) => error.reason);

const inspectFixture = (rows, directives, extra = {}) =>
  inspect(fixture({ ...baseFiles(rows, directives), ...extra }));

const countRows = (result) => result.rows.length;

// --- The live head -----------------------------------------------------------

test("the repository's own inventory parses and every carrier resolves", () => {
  const result = inspect(root);
  assert.deepEqual(result.errors, [], result.errors.map((e) => `${e.gate}: ${e.reason} — ${e.detail}`).join("\n"));
  assert.ok(countRows(result) >= 20, `the inventory carries the gate set, saw ${countRows(result)} rows`);
  for (const entry of result.rows) {
    assert.ok(CARRIERS.includes(entry.carrier), `${entry["gate-id"]} names a carrier in the closed set`);
    assert.ok(Number.isInteger(entry.line) && entry.line > 0, `${entry["gate-id"]} resolves to a reported line`);
  }
  const tallies = result.rows.reduce((acc, entry) => ({ ...acc, [entry.carrier]: (acc[entry.carrier] ?? 0) + 1 }), {});
  assert.ok((tallies.script ?? 0) > 0 && (tallies.prose ?? 0) > 0, "the inventory names both carrier kinds it exists to separate");
});

test("the report prints the resolved file:line and a PASS verdict", () => {
  const text = report(inspect(root));
  assert.match(text, /^verdict: PASS$/m);
  assert.match(text, /prose-gate-inventory — \d+ row\(s\)/);
  assert.match(text, /[A-Za-z0-9_./-]+\.(?:mjs|md):\d+ · priority/m, "an anchor is reported at a line, not as a remembered path");
});

test("the block has exactly one home in the tree", () => {
  // The validator's own scan, not a second candidate list: the scope of the
  // one-home check lives in one place and this case reads it.
  assert.deepEqual(findHomes(root), [INVENTORY_REL], "the inventory is declared once, wherever in the tree a copy lands");
});

test("a second copy of the block anywhere in the tree fails as multiple-homes", () => {
  const dir = fixture({
    ...baseFiles([row()]),
    // A unit doc quoting the grammar as a fenced block is a second home, not a
    // citation — the same defect the guide layer is already checked for.
    "docs/features/96-x/SPEC.md": `# X\n\n${block([row()])}\n`,
  });
  assert.ok(reasons(inspect(dir)).includes("multiple-homes"),
    "a copy outside the guide layer is refused like any other");
});

// --- The frozen failure: no inventory at all ---------------------------------

test("a tree with no inventory block is refused by name", () => {
  const dir = fixture({ "AGENTS.md": "# x\n" });
  assert.deepEqual(reasons(inspect(dir)), ["missing-inventory"]);
});

// --- Anchor and pin resolution ----------------------------------------------

test("a prose row whose file is gone fails as missing-file", () => {
  const result = inspectFixture(
    [row({ carrier: "prose", tier: "prose", file: "docs/gone.md", section: "Rules", token: "the rule", "stay-reason": "judgment-needed", rederive: "docs/owner.md#Rules" })],
    { "gate-suites": "-" },
  );
  assert.deepEqual(reasons(result), ["missing-file"]);
});

test("a prose row whose section is gone fails as missing-section", () => {
  const result = inspectFixture(
    [row({ carrier: "prose", tier: "prose", file: "docs/owner.md", section: "Vanished", token: "the rule", "stay-reason": "judgment-needed", rederive: "docs/owner.md#Rules" })],
    { "gate-suites": "-" },
  );
  assert.deepEqual(reasons(result), ["missing-section"]);
});

test("a prose row whose sentence moved out of its section fails as missing-token", () => {
  const result = inspectFixture(
    [row({ carrier: "prose", tier: "prose", file: "docs/owner.md", section: "Other", token: "the rule", "stay-reason": "judgment-needed", rederive: "docs/owner.md#Rules" })],
    { "gate-suites": "-" },
  );
  assert.deepEqual(reasons(result), ["missing-token"]);
});

test("a script row whose pinned token vanished fails as missing-token", () => {
  const result = inspectFixture([row({ token: "a token the pin does not carry" })], { "gate-suites": "-" });
  assert.deepEqual(reasons(result), ["missing-token"]);
});

test("a stay row whose re-derivation pointer does not resolve fails as missing-rederive", () => {
  const result = inspectFixture(
    [row({ carrier: "prose", tier: "prose", "stay-reason": "judgment-needed", rederive: "docs/owner.md#Vanished", file: "docs/owner.md", section: "Rules", token: "the rule" })],
    { "gate-suites": "-" },
  );
  assert.deepEqual(reasons(result), ["missing-rederive"]);
});

// --- Completeness in both directions ---------------------------------------

test("a gate suite in a declared family with no row fails as uncited-gate-suite", () => {
  const result = inspectFixture(
    [row({ "gate-id": "gate-other", file: "scripts/pin.test.mjs" })],
    { "gate-suites": "scripts/*-discipline.test.mjs" },
  );
  assert.deepEqual(reasons(result), ["uncited-gate-suite"]);
  assert.match(result.errors[0].detail, /scripts\/a-discipline\.test\.mjs/);
});

test("a normative surface no row claims fails as uncited-surface", () => {
  const surfaces = [
    "```text",
    "normative-surfaces@1",
    "surface | file | grammar | machine | must-name",
    "one | docs/one.md | frontmatter:argument-hint | n/a | no",
    "two | docs/two.md | frontmatter:argument-hint | n/a | no",
    "```",
    "",
  ].join("\n");
  const result = inspectFixture(
    [row({ surfaces: "one" })],
    { "gate-suites": "-", "surface-seed": "AGENTS.md#normative-surfaces@1" },
    {
      "AGENTS.md": `# Guide\n\n## Normative surfaces\n\n${surfaces}`,
      "docs/one.md": "x\n",
      "docs/two.md": "x\n",
    },
  );
  assert.deepEqual(reasons(result), ["uncited-surface"]);
  assert.match(result.errors[0].detail, /\btwo\b/);
});

test("a surface id the block never declares fails as unknown-surface", () => {
  const surfaces = ["```text", "normative-surfaces@1", "surface | file | grammar | machine | must-name", "one | docs/one.md | frontmatter:argument-hint | n/a | no", "```", ""].join("\n");
  const result = inspectFixture(
    [row({ surfaces: "one,nine" })],
    { "gate-suites": "-", "surface-seed": "AGENTS.md#normative-surfaces@1" },
    { "AGENTS.md": `# Guide\n\n## Normative surfaces\n\n${surfaces}`, "docs/one.md": "x\n" },
  );
  assert.deepEqual(reasons(result), ["unknown-surface"]);
});

// --- The ranking is arithmetic, and the ship invariant holds ---------------

test("a tier cell that disagrees with safety x recurrence x checkability fails as tier-mismatch", () => {
  const result = inspectFixture(
    [row({ carrier: "prose", tier: "prose", "stay-reason": "judgment-needed", file: "docs/owner.md", section: "Rules", token: "the rule", rederive: "docs/owner.md#Rules", safety: "3", recurrence: "3", checkability: "3" })],
    { "gate-suites": "-" },
  );
  // An under-claimed tier also makes its stay reason untrue: the same row that
  // should have migrated cannot keep `judgment-needed` at checkability 3.
  assert.deepEqual(reasons(result), ["stay-reason-mismatch", "tier-mismatch"], "priority 9 with checkability 3 is migrate, never prose");
  assert.equal(deriveTier({ safety: 3, recurrence: 3, checkability: 3, carrier: "prose" }), "migrate");
});

test("a top-tier gate still unmigrated at the head fails as unmigrated-gate", () => {
  const result = inspectFixture(
    [row({ carrier: "prose", tier: "migrate", "stay-reason": "-", file: "docs/owner.md", section: "Rules", token: "the rule", rederive: "docs/owner.md#Rules", safety: "3", recurrence: "3", checkability: "3" })],
    { "gate-suites": "-" },
  );
  assert.deepEqual(reasons(result), ["unmigrated-gate"]);
});

test("a stay row with no recorded reason fails as stay-reason-missing", () => {
  const result = inspectFixture(
    [row({ carrier: "prose", tier: "prose", "stay-reason": "-", file: "docs/owner.md", section: "Rules", token: "the rule", rederive: "docs/owner.md#Rules" })],
    { "gate-suites": "-" },
  );
  assert.deepEqual(reasons(result), ["stay-reason-missing"]);
});

test("a stay reason that contradicts its own scores fails as stay-reason-mismatch", () => {
  const lowRecurrenceOnAHotGate = inspectFixture(
    [row({ carrier: "prose", tier: "prose", "stay-reason": "low-recurrence", file: "docs/owner.md", section: "Rules", token: "the rule", rederive: "docs/owner.md#Rules", recurrence: "3" })],
    { "gate-suites": "-" },
  );
  assert.deepEqual(reasons(lowRecurrenceOnAHotGate), ["stay-reason-mismatch"]);
  const hostOwnedButCheckable = inspectFixture(
    [row({ carrier: "cli", tier: "cli", "stay-reason": "host-owned", file: "docs/owner.md", section: "Rules", token: "the rule", rederive: "docs/owner.md#Rules", checkability: "3", safety: "1", recurrence: "1" })],
    { "gate-suites": "-" },
  );
  assert.deepEqual(reasons(hostOwnedButCheckable), ["stay-reason-mismatch"]);
});

// --- The table itself is closed grammar -----------------------------------

test("an empty inventory is a defect, not a vacuous pass", () => {
  const result = inspectFixture([], { "gate-suites": "-" });
  assert.deepEqual(reasons(result), ["empty-inventory"]);
});

test("a malformed row fails closed on its own shape", () => {
  const dir = fixture({
    [INVENTORY_REL]: `# Inventory\n\n\`\`\`text\n${MARKER}\n${COLUMNS.join(" | ")}\nG-fixture | only three | prose\n\`\`\`\n`,
  });
  assert.deepEqual(reasons(inspect(dir)), ["row-shape"]);
  const twice = fixture({
    [INVENTORY_REL]: `# Inventory\n\n${block([row(), row()], { "gate-suites": "-" })}\n`,
    "scripts/pin.test.mjs": "the pin\n",
  });
  assert.deepEqual(reasons(inspect(twice)), ["duplicate-id"]);
  const carrier = inspectFixture(
    [row({ carrier: "script-ish", tier: "script" })],
    { "gate-suites": "-" },
  );
  assert.deepEqual(reasons(carrier), ["row-shape"]);
});

test("the grammar block round-trips through the renderer the document ships", () => {
  const rendered = renderBlock({ rows: [row()], directives: { "gate-suites": "-" } });
  const dir = fixture({ [INVENTORY_REL]: `# Inventory\n\n${rendered}\n`, "scripts/pin.test.mjs": "the pin\n" });
  const result = inspect(dir);
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].token, "the pin");
});

// --- The closed vocabularies stay closed in the document ------------------

test("the document names every carrier, reason, and the arithmetic it computes", () => {
  const text = fs.readFileSync(path.join(root, INVENTORY_REL), "utf8");
  for (const carrier of CARRIERS) assert.match(text, new RegExp("`" + carrier + "`"), `carrier ${carrier} is documented`);
  for (const reason of STAY_REASONS) assert.match(text, new RegExp("`" + reason + "`"), `reason ${reason} is documented`);
  assert.match(text, /safety × recurrence/, "the priority the tier derives from is stated");
  assert.match(text, /never only in the conversation/, "the post-compaction rule is stated where the rows live");
});
