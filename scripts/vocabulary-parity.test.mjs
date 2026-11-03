#!/usr/bin/env node

/**
 * vocabulary-parity.test.mjs — every second copy of a published vocabulary is
 * pinned to the canonical declaration (unit 84, issue #315 S1; the F22 /
 * `LOG_KINDS` pattern).
 *
 * Canonical home (decision D2): `packages/agentic-workflow-schema/src/vocabularies.ts`
 * exports the closed sets; the prose surfaces cite them; this suite refuses a
 * second copy that drifts. Adding a token to a set is a schema-const +
 * grammar-block + parity-pin change in one PR — never a prose-only edit.
 */

import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { schemaRuntimePath } from "./schema-runtime.mjs";
import { CLAIM_KINDS, REASON_CODES } from "./promise-coherence.mjs";
import { LOG_KINDS } from "./unit-doc-phases.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The canonical declarations, read from the built schema runtime. */
const {
  FUTURE_STATUS_KINDS,
  FINDINGS_TABLE_SEVERITIES,
  FINDINGS_TABLE_IMPACTS,
  LOG_KIND_TOKENS,
  SWEEP_CLAIM_KINDS,
  SWEEP_MISMATCH_REASONS,
  PRE_EXECUTION_FINDING_CLASSES,
} = await import(schemaRuntimePath);

const read = (relative) => readFileSync(path.join(ROOT, relative), "utf8");

/** The cell one `findings-table@1` grammar block publishes, as a regex. */
const tableCell = (tokens, column = "severity") => `${column} \\| ${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(" \\\\\| ")}`;

/** #361's two published sets, in the order the issue states them. */
const SEVERITY_LADDER = ["BLOCKER", "CRITICAL", "WARNING", "SUGGESTION"];
const IMPACT_SET = ["blocking", "docs-only", "report-only"];

/** The nine finder skills that publish the fixed findings table (the issue's
 *  "every `review-*` findings table"): discovered, never a hand-kept list. */
const finderSkills = () => readdirSync(path.join(ROOT, "skills"))
  .filter((name) => name.startsWith("review-") && existsSync(path.join(ROOT, "skills", name, "SKILL.md")))
  .filter((name) => read(`skills/${name}/SKILL.md`).includes("| Finding | Sev |"))
  .sort();

test("the schema package publishes every canonical set, non-empty", () => {
  for (const [name, set] of [
    ["FUTURE_STATUS_KINDS", FUTURE_STATUS_KINDS],
    ["FINDINGS_TABLE_SEVERITIES", FINDINGS_TABLE_SEVERITIES],
    ["FINDINGS_TABLE_IMPACTS", FINDINGS_TABLE_IMPACTS],
    ["LOG_KIND_TOKENS", LOG_KIND_TOKENS],
    ["SWEEP_CLAIM_KINDS", SWEEP_CLAIM_KINDS],
    ["SWEEP_MISMATCH_REASONS", SWEEP_MISMATCH_REASONS],
    ["PRE_EXECUTION_FINDING_CLASSES", PRE_EXECUTION_FINDING_CLASSES],
  ]) {
    assert.ok(Array.isArray(set) && set.length > 0, `${name} is a published const array`);
  }
});

test("the reader's LOG_KINDS equals the canonical declaration (F22 pattern)", () => {
  assert.deepEqual([...LOG_KINDS], [...LOG_KIND_TOKENS]);
});

test("the findings-table class vocabulary is the published PRE_EXECUTION_FINDING_CLASSES set", () => {
  assert.deepEqual([...PRE_EXECUTION_FINDING_CLASSES], ["product", "plan", "source", "environment", "runtime"]);
});

test("both unit-doc templates publish the canonical findings-table vocabularies", () => {
  for (const template of ["docs/features/_TEMPLATE/SPEC.md", "docs/fix/_TEMPLATE/SPEC.md"]) {
    const text = read(template);
    assert.match(text, new RegExp(tableCell(FINDINGS_TABLE_SEVERITIES)), `${template}: the severity row matches the canonical set`);
    assert.match(text, new RegExp(tableCell(PRE_EXECUTION_FINDING_CLASSES).replace("severity \\|", "class \\|")), `${template}: the class row matches the canonical set`);
  }
});

test("every prose copy of the Future-status set carries exactly the canonical tokens (F40)", () => {
  const copies = [
    "docs/features/_TEMPLATE/SPEC.md",
    "docs/fix/_TEMPLATE/SPEC.md",
    "packages/agentic-workflow/src/edit/UnitDoc.mjs",
  ];
  for (const copy of copies) {
    const text = read(copy);
    for (const status of FUTURE_STATUS_KINDS) {
      // The `UnitDoc` skeleton escapes its backticks (`\`open\``); both forms cite.
      assert.match(text, new RegExp("\\\\?`" + status + "(?:\\\\?`| <)"), `${copy}: the canonical token '${status}' is present`);
    }
    assert.doesNotMatch(text, /kept deferred/, `${copy}: no off-vocabulary status token survives here`);
  }
});

test("the sweep claim kind is mirrored: schema kind and reason are members of the gate's closed sets", () => {
  for (const kind of SWEEP_CLAIM_KINDS) assert.ok(CLAIM_KINDS.includes(kind), `CLAIM_KINDS publishes '${kind}'`);
  for (const reason of SWEEP_MISMATCH_REASONS) assert.ok(REASON_CODES.includes(reason), `REASON_CODES publishes '${reason}'`);
});

// ---------------------------------------------------------------------------
// #361 — the findings severity ladder and the impact column
// ---------------------------------------------------------------------------

test("#361 the findings-table severity scale is the published ladder", () => {
  assert.deepEqual([...FINDINGS_TABLE_SEVERITIES], SEVERITY_LADDER,
    "the carrier's severity cell offers exactly the four ladder tokens");
});

test("#361 the findings-table impact vocabulary is published and closed", () => {
  assert.deepEqual([...FINDINGS_TABLE_IMPACTS], IMPACT_SET,
    "the impact cell offers exactly behaviour / docs / nothing-that-blocks");
});

test("#361 both grammar rows are published by the four templates and the UnitDoc skeleton", () => {
  const templates = [
    "docs/features/_TEMPLATE/SPEC.md",
    "docs/fix/_TEMPLATE/SPEC.md",
    "template/docs/features/_TEMPLATE/SPEC.md",
    "template/docs/fix/_TEMPLATE/SPEC.md",
  ];
  for (const template of templates) {
    const text = read(template);
    assert.match(text, new RegExp(tableCell(FINDINGS_TABLE_SEVERITIES)), `${template}: the severity row is the ladder`);
    assert.match(text, new RegExp(tableCell(FINDINGS_TABLE_IMPACTS, "impact")), `${template}: the impact row is the published set`);
    assert.match(text, /\| id \| S# \/ file:line \| axis \| severity \| impact \| class \| route \|/,
      `${template}: the seven-column header carries the impact cell`);
  }
  const skeleton = read("packages/agentic-workflow/src/edit/UnitDoc.mjs");
  assert.match(skeleton, /\| id \| S# \/ file:line \| axis \| severity \| impact \| class \| route \|/,
    "the UnitDoc skeleton writes the same seven-column header");
});

test("#361 every review-* findings table publishes the ladder and the impact set", () => {
  const finders = finderSkills();
  assert.equal(finders.length, 9, `the nine finder contracts are the ones the issue names (got: ${finders.join(", ")})`);
  for (const name of finders) {
    const text = read(`skills/${name}/SKILL.md`);
    assert.match(text, /\| Finding \| Sev \| Impact \|/, `${name}: the fixed table gains the impact column`);
    assert.ok(text.includes(SEVERITY_LADDER.join("|")), `${name}: the Sev cell publishes the ladder`);
    assert.ok(text.includes(IMPACT_SET.join("|")), `${name}: the Impact cell publishes the impact set`);
    assert.ok(text.includes("`review-implementation`") && text.includes("CLASSIFY.md"),
      `${name}: the ladder's meanings are cited, never restated`);
  }
});

test("#361 the conversion table never targets BLOCKER and covers every older scale", () => {
  const classify = read("skills/review-implementation/references/CLASSIFY.md");
  assert.match(classify, /\|\s*Producer scale\s*\|\s*→ BLOCKER\s*\|\s*→ CRITICAL\s*\|\s*→ WARNING\s*\|\s*→ SUGGESTION\s*\|/,
    "the table's columns are the ladder itself");
  const rows = classify.split("\n").filter((line) => /^\|\s*[A-Z][^|]*\|/.test(line) && line.includes("✓"));
  assert.ok(rows.length >= 8, `the table carries a row per older scale (got ${rows.length})`);
  for (const row of rows) {
    const cells = row.split("|").map((cell) => cell.trim());
    assert.equal(cells[2], "—", `no converted scale reaches BLOCKER: ${row}`);
  }
  for (const token of ["high", "med", "low", "critical", "major", "minor", "medium", "info"]) {
    assert.ok(new RegExp("\\|\\s*[^|]*`" + token + "`").test(classify), `the table maps the '${token}' scale`);
  }
});

test("#361 the baseline-advisory rule has one home and every finder cites it", () => {
  const owner = "skills/review-implementation/references/CLASSIFY.md";
  const classify = read(owner);
  assert.match(classify, /pre-existing advisory/, "CLASSIFY.md publishes the rule");
  assert.match(classify, /caused by the change and reproducible with realistic input/, "the rule states what a blocker is");
  assert.match(classify, /never requires a correction round|never a correction round/, "the rule states the advisory's consequence");
  const copies = [];
  for (const name of readdirSync(path.join(ROOT, "skills"))) {
    const dir = path.join(ROOT, "skills", name);
    if (!existsSync(dir) || !existsSync(path.join(dir, "SKILL.md"))) continue;
    for (const file of [path.join(dir, "SKILL.md"), ...(existsSync(path.join(dir, "references")) ? readdirSync(path.join(dir, "references")).map((f) => path.join(dir, "references", f)) : [])]) {
      if (!file.endsWith(".md")) continue;
      const rel = path.relative(ROOT, file);
      if (rel === owner) continue;
      if (readFileSync(file, "utf8").includes("pre-existing advisory")) copies.push(rel);
    }
  }
  assert.deepEqual(copies, [], `the baseline-advisory rule is restated in ${copies.join(", ")} — cite its owner instead`);
});

test("#361 decision-required survives as the false-negative escalation and the five disposition classes are unchanged", () => {
  const classify = read("skills/review-implementation/references/CLASSIFY.md");
  assert.match(classify, /false negative/i, "the escalation names what it overrides");
  for (const klass of ["ignore", "fix-now", "replan-in-unit", "decision-required", "proposal"]) {
    assert.ok(classify.includes("`" + klass + "`") || classify.includes(klass), `the disposition '${klass}' survives`);
  }
  assert.doesNotMatch(classify, /`ignore` \| `replan-in-unit` \| `proposal` \| `deferred`/,
    "no sixth disposition class was invented");
});

test("#361 the sensor projects every ladder token onto the envelope's unchanged enum", async () => {
  const { SEVERITY_VOCABULARY } = await import("./workflow-status.mjs");
  const projection = new Map([["BLOCKER", "high"], ["CRITICAL", "high"], ["WARNING", "med"], ["SUGGESTION", "low"]]);
  for (const [token, envelope] of projection) {
    assert.equal(SEVERITY_VOCABULARY.get(token), envelope, `the ladder token '${token}' projects to '${envelope}'`);
  }
  for (const legacy of ["high", "med", "low", "critical", "major", "medium", "minor"]) {
    assert.ok(SEVERITY_VOCABULARY.has(legacy), `the legacy read alias '${legacy}' still projects`);
  }
});

test("#361 skill-lint names the two published sets in its new rule", () => {
  const lint = read("skills/skill-lint/references/DISCOVERY_AND_LINT.md");
  assert.ok(lint.includes("FINDINGS_TABLE_SEVERITIES"), "the rule cites the canonical severity const");
  assert.ok(lint.includes("FINDINGS_TABLE_IMPACTS"), "the rule cites the canonical impact const");
  assert.match(read("skills/skill-lint/SKILL.md"), /eight/i, "the lint's own rule count moves with the rule");
});
