#!/usr/bin/env node
// test-obligation: protects=packages/pi-agentic-workflow/src/extension/log-session-command.ts,packages/agentic-workflow/src/telemetry obligations=contract,convention

/**
 * telemetry-coverage.test.mjs — a command and its telemetry move together
 * (issue #504 S2, S6, S7, S8).
 *
 * The invariant the request states in code: **new command → register telemetry;
 * delete command → remove telemetry; rename command → update telemetry.** The
 * phase vocabulary is a published list, the command surface is the tree, and the
 * two must be the same set — in both directions, because a dead label and an
 * unmeasurable command are the same defect seen from two sides.
 *
 * The corpus is the crossing itself: the real tree (which must agree), and two
 * deliberate mutations of the vocabulary (one label short, one label extra),
 * which must be reported. A test that only proves the tree agrees today would
 * pass on the day a command is added and nobody reads it; the mutations are what
 * make the crossing a gate rather than a census.
 *
 * It also pins the projections of the same vocabulary: the committed JSON Schema
 * (`docs/telemetry/schema.json`, S6), the `tier-cost@2` column list and the
 * ledger document's own header — a projection edited by hand is the defect.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PHASE_LABELS,
  TELEMETRY_SAMPLE_FIELDS,
  TELEMETRY_TOKEN_FIELDS,
  telemetrySampleJsonSchema,
} from "../packages/agentic-workflow-schema/dist/index.js";
import {
  COLUMNS,
  COLUMNS_BY_CONTRACT,
  LEGACY_COLUMNS,
  TIER_COST_CONTRACT_ID,
  TIER_COST_LEGACY_CONTRACT_ID,
  parseLedger,
} from "./tier-cost.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(ROOT, relative), "utf8");

/** The `name:` and `user-invocable:` frontmatter of one skill, loosely read. */
function frontmatter(text) {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const fields = {};
  if (block === null) return fields;
  for (const line of block[1].split("\n")) {
    const match = /^([a-z-]+):\s*(.*)$/.exec(line);
    if (match !== null) fields[match[1]] = match[2].trim();
  }
  return fields;
}

/** The commands the skills tree publishes: a skill with `user-invocable: true`. */
function skillCommands() {
  const root = path.join(ROOT, "skills");
  const commands = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skill = path.join(root, entry.name, "SKILL.md");
    if (!fs.existsSync(skill)) continue;
    const fields = frontmatter(fs.readFileSync(skill, "utf8"));
    if (fields["user-invocable"] !== "true") continue;
    commands.push({ name: fields.name ?? entry.name, source: `skills/${entry.name}/SKILL.md` });
  }
  return commands;
}

/**
 * The native commands the package registers in code — a `*_COMMAND` export whose
 * value is a slash name. Both files that declare one, and only those: the
 * state-flow mode switches are the *host's* commands, not this package's phases.
 */
function nativeCommands() {
  const files = [
    "packages/pi-agentic-workflow/src/routing/types.ts",
    "packages/pi-agentic-workflow/src/extension/log-session-command.ts",
  ];
  const commands = [];
  for (const file of files) {
    for (const match of read(file).matchAll(/^export const ([A-Z_]+_COMMAND(?:_ALIAS)?)\s*=\s*"([^"]+)"/gm)) {
      commands.push({ name: match[2], source: `${file} (${match[1]})` });
    }
  }
  return commands;
}

/** The repository's real command surface, deduplicated by name. */
function commandSurface() {
  const seen = new Map();
  for (const command of [...skillCommands(), ...nativeCommands()]) {
    if (!seen.has(command.name)) seen.set(command.name, command);
  }
  return seen;
}

/**
 * The crossing: every command has a label, and every label names a command.
 * Answers the findings rather than throwing, so the mutations can be asserted.
 */
export function crossCoverage(labels, commands) {
  const published = new Set(labels);
  const dispatched = new Set(commands.keys());
  return {
    unlabelled: [...dispatched].filter((name) => !published.has(name)).sort(),
    stale: [...published].filter((name) => !dispatched.has(name)).sort(),
  };
}

test("every command has a telemetry label, and every label names a command", () => {
  const commands = commandSurface();
  assert.ok(commands.size >= 15, `the surface reader found ${commands.size} commands — a broken read must not pass as a green crossing`);
  const { unlabelled, stale } = crossCoverage(PHASE_LABELS, commands);
  assert.deepEqual(unlabelled, [], "a command with no label is an unmeasurable phase (S8: new command → register telemetry)");
  assert.deepEqual(stale, [], "a label with no command is dead telemetry (S8: delete command → remove telemetry)");
});

test("the crossing is a gate: a dropped label and an invented one are both reported", () => {
  const commands = commandSurface();
  const [first] = PHASE_LABELS;
  const dropped = crossCoverage(PHASE_LABELS.filter((label) => label !== first), commands);
  assert.deepEqual(dropped.unlabelled, [first], "removing a label from the vocabulary names the command it orphaned");

  const invented = crossCoverage([...PHASE_LABELS, "invented-command"], commands);
  assert.deepEqual(invented.stale, ["invented-command"], "a label no command dispatches is reported, never tolerated");

  const renamed = crossCoverage([...PHASE_LABELS.filter((label) => label !== first), `${first}-renamed`], commands);
  assert.deepEqual(renamed.unlabelled, [first], "a rename is an unlabelled command and a stale label at once");
  assert.deepEqual(renamed.stale, [`${first}-renamed`]);
});

test("the committed JSON Schema is the programmatic one, byte for byte", () => {
  const committed = JSON.parse(read("docs/telemetry/schema.json"));
  assert.deepEqual(committed, JSON.parse(JSON.stringify(telemetrySampleJsonSchema())),
    "docs/telemetry/schema.json is generated (bun scripts/telemetry-report.mjs --schema), never hand-edited (S6)");
});

test("the ledger's grammar is the published field list, in the published order", () => {
  assert.deepEqual([...COLUMNS], [...TELEMETRY_SAMPLE_FIELDS], "the @2 columns are the sample's fields: one declaration, two projections");
  assert.deepEqual(
    [...LEGACY_COLUMNS],
    [...TELEMETRY_SAMPLE_FIELDS].filter((field) => !["phase", "version", "model", ...TELEMETRY_TOKEN_FIELDS].includes(field)),
    "the @1 eight are the fields the earlier sample carried: the widening is additive",
  );
  const document = read("docs/workflow/TIER_COST.md");
  const parsed = parseLedger(document);
  assert.equal(parsed.error, undefined, `the ledger document does not satisfy its own grammar: ${parsed.detail ?? ""}`);
  assert.equal(parsed.contract, TIER_COST_CONTRACT_ID, `this repository's ledger declares ${TIER_COST_CONTRACT_ID}`);
  assert.deepEqual(parsed.columns, [...COLUMNS_BY_CONTRACT[TIER_COST_CONTRACT_ID]],
    "the committed table's header is the published column list");
  assert.ok(
    document.includes(TIER_COST_LEGACY_CONTRACT_ID),
    "the earlier grammar stays documented beside it: a project on it keeps its contract",
  );
});

test("the package README carries the invariant an author reads before adding a command", () => {
  // Markdown wraps: the sentence is what the author reads, so the prose is
  // squashed before it is matched — a line break inside it is not a defect.
  const readme = read("packages/pi-agentic-workflow/README.md").replace(/\s+/g, " ");
  assert.match(readme, /New command → register telemetry/, "the invariant is stated where the package's consumers read it (S8)");
  assert.match(readme, /Delete command → remove telemetry/);
  assert.match(readme, /Rename command → update telemetry/);
});

test("the surfaces that describe the ledger name its current grammar (external-verify 2026-11-16 B3/B4)", () => {
  // The F51/F53 class: the grammar moved to `tier-cost@2` and a sibling comment
  // or prose row still asserting `tier-cost@1` as the current truth lies to the
  // next reader — a surviving mention is the defect, not the grammar bump.
  const sinks = read("packages/pi-agentic-workflow/src/telemetry-sinks.ts");
  assert.doesNotMatch(sinks, /tier-cost@1/, "the sink's own docs never name a superseded grammar");
  const mapRow = read("docs/workflow/README.md").split("\n").find((line) => line.includes("[TIER_COST.md]")) ?? "";
  assert.match(mapRow, /tier-cost@2/, "the docs-map row describes TIER_COST.md by the grammar its block declares");
});
