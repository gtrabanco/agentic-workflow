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
import { LOG_KINDS } from "../packages/agentic-workflow/src/runner/unit-doc-phases.mjs";
import {
  CEREMONY_PROFILE_CONTRACT_ID as CEREMONY_PROFILE_CONTRACT_ID_MJS,
  CEREMONY_PROFILE_PIECES as CEREMONY_PROFILE_PIECES_MJS,
  CEREMONY_PROFILE_ADOPTIONS as CEREMONY_PROFILE_ADOPTIONS_MJS,
  CEREMONY_REVIEW_SURFACES as CEREMONY_REVIEW_SURFACES_MJS,
  CEREMONY_PROFILE_REFUSALS as CEREMONY_PROFILE_REFUSALS_MJS,
} from "../packages/agentic-workflow/src/runner/ceremony-profile.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The canonical declarations, read from the built schema runtime. */
const {
  FUTURE_STATUS_KINDS,
  FINDINGS_TABLE_SEVERITIES,
  FINDINGS_TABLE_IMPACTS,
  LOG_KIND_TOKENS,
  CEREMONY_PROFILE_CONTRACT_ID,
  CEREMONY_PROFILE_PIECES,
  CEREMONY_PROFILE_ADOPTIONS,
  CEREMONY_REVIEW_SURFACES,
  CEREMONY_PROFILE_REFUSALS,
  SWEEP_CLAIM_KINDS,
  SWEEP_MISMATCH_REASONS,
  PRE_EXECUTION_FINDING_CLASSES,
  RISK_TIER_KINDS,
  RISK_TIER_SIGNAL_KINDS,
  RISK_TIER_REASONS,
  SIZE_TIER_KINDS,
  ADVERSARIAL_VERDICTS,
  ADVERSARIAL_REFLECTOR_VERDICTS,
  ADVERSARIAL_STABILITY_VERDICTS,
  PROJECTION_SEAMS,
  PROJECTION_OPS,
  PROJECTION_SELECTOR_KINDS,
  PROJECTION_HASH_ALGORITHMS,
  GUARD_VERDICTS,
  GUARD_REJECTION_REASONS,
  GATE_RECEIPT_VERDICTS,
  GATE_CHECK_STATUSES,
  GATE_RECEIPT_FRESHNESS_CODES,
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
    ["RISK_TIER_KINDS", RISK_TIER_KINDS],
    ["RISK_TIER_SIGNAL_KINDS", RISK_TIER_SIGNAL_KINDS],
    ["RISK_TIER_REASONS", RISK_TIER_REASONS],
    ["SIZE_TIER_KINDS", SIZE_TIER_KINDS],
    ["PROJECTION_SEAMS", PROJECTION_SEAMS],
    ["PROJECTION_OPS", PROJECTION_OPS],
    ["PROJECTION_SELECTOR_KINDS", PROJECTION_SELECTOR_KINDS],
    ["PROJECTION_HASH_ALGORITHMS", PROJECTION_HASH_ALGORITHMS],
    ["GUARD_VERDICTS", GUARD_VERDICTS],
    ["GUARD_REJECTION_REASONS", GUARD_REJECTION_REASONS],
    ["GATE_RECEIPT_VERDICTS", GATE_RECEIPT_VERDICTS],
    ["GATE_CHECK_STATUSES", GATE_CHECK_STATUSES],
    ["GATE_RECEIPT_FRESHNESS_CODES", GATE_RECEIPT_FRESHNESS_CODES],
  ]) {
    assert.ok(Array.isArray(set) && set.length > 0, `${name} is a published const array`);
  }
});

test("the reader's LOG_KINDS equals the canonical declaration (F22 pattern)", () => {
  assert.deepEqual([...LOG_KINDS], [...LOG_KIND_TOKENS]);
});

test("the ceremony-profile runtime copies equal the canonical declarations (F22 pattern, issue #436)", () => {
  assert.equal(CEREMONY_PROFILE_CONTRACT_ID_MJS, CEREMONY_PROFILE_CONTRACT_ID);
  assert.deepEqual([...CEREMONY_PROFILE_PIECES_MJS], [...CEREMONY_PROFILE_PIECES]);
  assert.deepEqual([...CEREMONY_PROFILE_ADOPTIONS_MJS], [...CEREMONY_PROFILE_ADOPTIONS]);
  assert.deepEqual([...CEREMONY_REVIEW_SURFACES_MJS], [...CEREMONY_REVIEW_SURFACES]);
  assert.deepEqual([...CEREMONY_PROFILE_REFUSALS_MJS], [...CEREMONY_PROFILE_REFUSALS]);
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

test("the risk tiers are the published set, and the classifier re-exports rather than restates them", () => {
  assert.deepEqual([...RISK_TIER_KINDS], ["passive", "standard", "high"]);
  const classifier = read("scripts/risk-tiers.mjs");
  // The classifier may re-export the sets; it may not spell a tier literal of its own.
  assert.match(classifier, /from "\.\.\/packages\/agentic-workflow-schema\/src\/vocabularies\.ts"/,
    "one home: the classifier imports the published consts");
  assert.doesNotMatch(classifier, /\["passive",\s*"standard"/, "no second copy of the tier set");
});

test("the tier-verdict grammar block publishes every token of the three sets", () => {
  const block = read("skills/execute-phase/references/risk-tiers.md");
  const fenced = /```text\nrisk-tier-verdict@1\n([\s\S]*?)```/.exec(block);
  assert.ok(fenced, "the grammar block is fenced and versioned");
  const cells = new Set(fenced[1].split(/[\s`,|]+/).filter(Boolean));
  for (const [name, values] of [["RISK_TIER_KINDS", RISK_TIER_KINDS], ["RISK_TIER_SIGNAL_KINDS", RISK_TIER_SIGNAL_KINDS], ["RISK_TIER_REASONS", RISK_TIER_REASONS], ["SIZE_TIER_KINDS", SIZE_TIER_KINDS]]) {
    for (const value of values) assert.ok(cells.has(value), `${name}: ${value} is published by risk-tier-verdict@1`);
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
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(/pre-existing advisory/g)) {
        // A citation is not a restatement: the sentence may name the phrase only
        // with its owner beside it (the same "names its owner" rule the guide
        // applies to every repeated contract). A bare copy is the defect.
        const around = text.slice(Math.max(0, match.index - 400), match.index + 400);
        if (!around.includes("CLASSIFY.md")) copies.push(rel);
      }
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

// ---------------------------------------------------------------------------
// #358 — the adversarial pass's three verdicts
// ---------------------------------------------------------------------------

/** The published adversarial sets, in the order the contract states them. */
const ADVERSARIAL_SETS = {
  "adversarial-verdict": ADVERSARIAL_VERDICTS,
  "adversarial-reflector-verdict": ADVERSARIAL_REFLECTOR_VERDICTS,
  "adversarial-stability": ADVERSARIAL_STABILITY_VERDICTS,
};

/** The `adversarial-verdict@1` block, as its `kind | token | vocabulary` cells. */
const adversarialBlockRows = () => {
  const fenced = /```text\nadversarial-verdict@1\n([\s\S]*?)```/.exec(read("skills/review-change/references/ADVERSARIAL_SETUP.md"));
  assert.ok(fenced, "the adversarial verdict grammar is fenced and versioned");
  const rows = fenced[1].trim().split("\n").map((line) => line.split("|").map((cell) => cell.trim()));
  assert.deepEqual(rows[0], ["kind", "token", "vocabulary", "what it orders"], "the block declares its four cells");
  return rows.slice(1).map(([kind, token, vocabulary]) => ({ kind, token, vocabulary }));
};

test("#358 the three adversarial sets are published and closed", () => {
  assert.deepEqual([...ADVERSARIAL_VERDICTS], ["kill", "confirm"], "the kill mandate answers kill or confirm");
  assert.deepEqual([...ADVERSARIAL_REFLECTOR_VERDICTS], ["keep", "drop"], "the reflector answers keep or drop");
  assert.deepEqual([...ADVERSARIAL_STABILITY_VERDICTS], ["stable", "unstable"], "the stability check answers stable or unstable");
});

test("#358 the grammar block orders exactly the published tokens, in both directions", () => {
  const rows = adversarialBlockRows();
  const referenced = rows.map((row) => {
    const match = /^([a-z0-9-]+):([A-Za-z0-9_-]+)$/.exec(row.vocabulary);
    assert.ok(match, `the vocabulary cell '${row.vocabulary}' is a vocab:token reference`);
    assert.ok(ADVERSARIAL_SETS[match[1]], `'${match[1]}' is a published adversarial set`);
    assert.equal(match[2], row.token, `row '${row.token}' references its own token`);
    return `${match[1]}:${match[2]}`;
  });
  for (const [vocabulary, values] of Object.entries(ADVERSARIAL_SETS)) {
    for (const value of values) {
      assert.ok(referenced.includes(`${vocabulary}:${value}`),
        `${vocabulary}:${value} is published by the machine and ordered by the block`);
    }
  }
  assert.equal(referenced.length, Object.values(ADVERSARIAL_SETS).flat().length,
    "the block declares no token the machine does not publish");
});

test("#358 the checker reads the published sets instead of a local copy", () => {
  const checker = read("scripts/adversarial-verdict.mjs");
  assert.match(checker, /loadSchemaRuntime/, "the checker loads the schema runtime");
  for (const name of ["ADVERSARIAL_VERDICTS", "ADVERSARIAL_REFLECTOR_VERDICTS", "ADVERSARIAL_STABILITY_VERDICTS"]) {
    assert.ok(checker.includes(`runtime.${name}`), `the checker reads ${name} from the built package`);
  }
  for (const literal of ["[\"kill\", \"confirm\"]", "[\"keep\", \"drop\"]", "[\"stable\", \"unstable\"]"]) {
    assert.ok(!checker.includes(literal), `the checker declares no local ${literal} list`);
  }
});
