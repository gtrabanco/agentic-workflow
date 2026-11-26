#!/usr/bin/env node
// test-obligation: protects=packages/agentic-workflow-schema/src/vocabularies.ts obligations=convention,contract

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
  ARTIFACT_KINDS as ARTIFACT_KINDS_MJS,
  FINDING_CODES as FINDING_CODES_MJS,
  OUTCOMES as OUTCOMES_MJS,
} from "../packages/agentic-workflow/src/materialize/materialize.mjs";
import { UNIT_DOC_SECTION_SHAPES } from "../packages/agentic-workflow/src/edit/schema.mjs";
import {
  ROADMAP_FEATURES_HEADING,
  ROADMAP_FIXES_HEADING,
} from "../packages/agentic-workflow/src/index-document.mjs";
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
  DOC_DEGRADATIONS,
  MATERIALIZATION_OUTCOMES,
  MATERIALIZATION_FINDING_CODES,
  ARTIFACT_EVIDENCE_KINDS,
  DELIVERY_CONDITION_KINDS,
  DELIVERY_CONDITION_VERDICTS,
  DELIVERY_CONDITION_FINDINGS,
  DELIVERY_CONDITION_REFUSALS,
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
    ["DOC_DEGRADATIONS", DOC_DEGRADATIONS],
    ["MATERIALIZATION_OUTCOMES", MATERIALIZATION_OUTCOMES],
    ["MATERIALIZATION_FINDING_CODES", MATERIALIZATION_FINDING_CODES],
    ["ARTIFACT_EVIDENCE_KINDS", ARTIFACT_EVIDENCE_KINDS],
    ["DELIVERY_CONDITION_KINDS", DELIVERY_CONDITION_KINDS],
    ["DELIVERY_CONDITION_VERDICTS", DELIVERY_CONDITION_VERDICTS],
    ["DELIVERY_CONDITION_FINDINGS", DELIVERY_CONDITION_FINDINGS],
    ["DELIVERY_CONDITION_REFUSALS", DELIVERY_CONDITION_REFUSALS],
  ]) {
    assert.ok(Array.isArray(set) && set.length > 0, `${name} is a published const array`);
  }
});

test("the doc envelope's runtime close accepts exactly the published degradation set (fix #540)", async () => {
  // The `doc` path is the crate's cold path and has no build step, so its close
  // is a pattern list beside the published const, not an import of `dist`. This
  // pin is what keeps the two one fact: every published value is accepted, a
  // value the schema does not publish is refused, and the two open families the
  // const documents stay open.
  const { degradationIsKnown } = await import("../packages/agentic-workflow/src/doc/envelope.mjs");
  for (const value of DOC_DEGRADATIONS) {
    assert.equal(degradationIsKnown(value), true, `the runtime close refuses the published ${value}`);
  }
  for (const value of ["embeddings-request-failed", "embeddings-rejected", "not-a-degradation"]) {
    assert.equal(degradationIsKnown(value), false, `the runtime close accepts the unpublished ${value}`);
  }
  for (const value of ["unavailable-sqlite-node", "unavailable-sqlite-bun", "unavailable-embeddings-http-401"]) {
    assert.equal(degradationIsKnown(value), true, `${value} is an open-family emission and must stay known`);
  }
  assert.ok(!DOC_DEGRADATIONS.includes("unavailable-embeddings-http-401"), "an open-family emission is never enumerated");
});

test("the reader's LOG_KINDS equals the canonical declaration (F22 pattern)", () => {
  assert.deepEqual([...LOG_KINDS], [...LOG_KIND_TOKENS]);
});

test("the materialize contract's copies equal the canonical declarations (F22 pattern, issue #564)", () => {
  assert.deepEqual([...OUTCOMES_MJS], [...MATERIALIZATION_OUTCOMES]);
  assert.deepEqual([...FINDING_CODES_MJS], [...MATERIALIZATION_FINDING_CODES]);
  assert.deepEqual([...ARTIFACT_KINDS_MJS], [...ARTIFACT_EVIDENCE_KINDS]);
});

test("the ceremony-profile runtime copies equal the canonical declarations (F22 pattern, issue #436)", () => {
  assert.equal(CEREMONY_PROFILE_CONTRACT_ID_MJS, CEREMONY_PROFILE_CONTRACT_ID);
  assert.deepEqual([...CEREMONY_PROFILE_PIECES_MJS], [...CEREMONY_PROFILE_PIECES]);
  assert.deepEqual([...CEREMONY_PROFILE_ADOPTIONS_MJS], [...CEREMONY_PROFILE_ADOPTIONS]);
  assert.deepEqual([...CEREMONY_REVIEW_SURFACES_MJS], [...CEREMONY_REVIEW_SURFACES]);
  assert.deepEqual([...CEREMONY_PROFILE_REFUSALS_MJS], [...CEREMONY_PROFILE_REFUSALS]);
});

test("the findings-table class vocabulary is the published PRE_EXECUTION_FINDING_CLASSES set", () => {
  assert.deepEqual([...PRE_EXECUTION_FINDING_CLASSES], ["product", "plan", "source", "environment", "runtime", "workflow"]);
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
  const classifier = read("packages/agentic-workflow/src/runner/risk-tiers.mjs");
  // The classifier may re-export the sets; it may not spell a tier literal of its own.
  assert.match(classifier, /from "@gtrabanco\/agentic-workflow-schema"/,
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
  const { SEVERITY_VOCABULARY } = await import("../packages/agentic-workflow/src/runner/sensors/workflow-status.mjs");
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
  const checker = read("packages/agentic-workflow/src/adversarial-verdict/index.mjs");
  assert.match(checker, /schemaRuntime\(|loadSchemaRuntime/, "the checker loads the schema runtime");
  for (const name of ["ADVERSARIAL_VERDICTS", "ADVERSARIAL_REFLECTOR_VERDICTS", "ADVERSARIAL_STABILITY_VERDICTS"]) {
    assert.ok(checker.includes(`runtime.${name}`), `the checker reads ${name} from the built package`);
  }
  for (const literal of ["[\"kill\", \"confirm\"]", "[\"keep\", \"drop\"]", "[\"stable\", \"unstable\"]"]) {
    assert.ok(!checker.includes(literal), `the checker declares no local ${literal} list`);
  }
});

// ---------------------------------------------------------------------------
// #643 — vocabulary residency: one owner, one pin carrier
//
// The invariant (owner: `vocabulary-residency@1` in
// docs/architecture/ARCHITECTURAL_INVARIANTS.md) says the schema package owns
// every closed vocabulary a published contract names, consumers import it, and a
// literal copy is legal only inside a named pre-build entrypoint whose header
// carries the guarantee. This section is the rule's whole enforcement:
//
//   class 1 — the crate declares a literal under a name the schema publishes:
//             the copy must become an import (or the file must be the named
//             exception, and then this suite is its only pin);
//   class 2 — an inventory row's `schema-export:` const is not published by the
//             schema package: the vocabulary belongs there, not in the runner;
//   class 3 — neither: a runner-internal enum the rule leaves in place, counted
//             and reported so the audit is a measurement, not a claim.
// ---------------------------------------------------------------------------

const CRATE_SRC = "packages/agentic-workflow/src";
const PI_SRC = "packages/pi-agentic-workflow/src";
const INVARIANTS = "docs/architecture/ARCHITECTURAL_INVARIANTS.md";
const INVARIANT_MARKER = "vocabulary-residency@1";
const SCHEMA_SPECIFIER = "@gtrabanco/agentic-workflow-schema";

/** Every source file under `relative` with one of `extensions`, repo-relative, sorted. */
function sourceFiles(relative, extensions) {
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      const child = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(child);
      else if (extensions.some((extension) => entry.name.endsWith(extension))) out.push(child);
    }
  };
  walk(relative);
  return out.sort();
}

/** `const NAME = <array|object literal>` — the shape a vocabulary copy takes,
 *  exported or not: a router's private copy is exactly the mirror the rule is
 *  about, so the classifier never asks whether the copy is exported first. */
const LITERAL_DECLARATION = /^(?:export )?const ([A-Z][A-Z0-9_]+)[^=\n]*=\s*(Object\.freeze\(\s*)?([[{])/gmu;

/** The names the schema package publishes from committed source (never `dist`: a
 *  drift gate that depended on a build would fail a fresh clone). */
function schemaPublishedNames() {
  const names = new Set();
  for (const file of sourceFiles("packages/agentic-workflow-schema/src", [".ts"])) {
    for (const match of read(file).matchAll(/^export const ([A-Z][A-Z0-9_]+)/gmu)) names.add(match[1]);
  }
  return names;
}

/** A module's import/export clause naming `name` from the schema package. */
const importsFromSchema = (text, name) =>
  new RegExp(`(?:import|export)\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*"${SCHEMA_SPECIFIER.replace(/[/.]/g, "\\$&")}"`, "su").test(text);

/** Literal declarations of a schema-published name, split by the named exception. */
function literalCopies(relative, extensions, published) {
  const defects = [];
  const exempt = [];
  for (const file of sourceFiles(relative, extensions)) {
    const text = read(file);
    const header = text.split("\n").slice(0, 40).join("\n");
    for (const match of text.matchAll(LITERAL_DECLARATION)) {
      if (!published.has(match[1])) continue;
      const row = { file, name: match[1] };
      (header.includes(INVARIANT_MARKER) ? exempt : defects).push(row);
    }
  }
  return { defects, exempt };
}

/** The `normative-surfaces@1` rows: `surface | file | grammar | machine | must-name`. */
function inventoryRows() {
  const fenced = /```text\nnormative-surfaces@1\n([\s\S]*?)```/u.exec(read("AGENTS.md"));
  assert.ok(fenced, "AGENTS.md declares the normative-surfaces@1 inventory");
  return fenced[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#") && !line.startsWith("surface |"))
    .map((line) => {
      const cells = line.split("|").map((cell) => cell.trim());
      return { surface: cells[0], file: cells[1], grammar: cells[2], machine: cells[3], mustName: cells[4] };
    });
}

test("#643 class 1 — no runner module declares a literal under a schema-published name", () => {
  const published = schemaPublishedNames();
  const { defects } = literalCopies(CRATE_SRC, [".mjs"], published);
  const named = defects.map((row) => `${row.file}: ${row.name}`);
  assert.deepEqual(named, [],
    `${named.length} mirror(s) still declare a second copy — import the published const, or name the pre-build guarantee in the file header (owner: ${INVARIANT_MARKER})`);
});

test("#643 class 1 — the named pre-build exception is a pinned, imported-parity list (empty today)", async () => {
  // The invariant's only legal exception. A file opts in by naming the invariant in
  // its header; that opt-in is not self-certifying — this case is the pin the rule
  // demands, and it compares the standing copy with the published one by import.
  const published = schemaPublishedNames();
  const { exempt } = literalCopies(CRATE_SRC, [".mjs"], published);
  const runtime = await import(schemaRuntimePath);
  for (const row of exempt) {
    const module = await import(new URL(`../${row.file}`, import.meta.url).href);
    assert.ok(row.name in module, `${row.file}: the exempt copy ${row.name} is exported`);
    assert.ok(row.name in runtime, `the schema publishes ${row.name}`);
    assert.deepEqual(
      JSON.parse(JSON.stringify(module[row.name])),
      JSON.parse(JSON.stringify(runtime[row.name])),
      `${row.file}: the exempt copy of ${row.name} drifted from the published const`,
    );
  }
});

test("#643 class 2 — every schema-export inventory row points at the schema package", () => {
  const published = schemaPublishedNames();
  const offenders = [];
  for (const row of inventoryRows()) {
    const exported = /^schema-export:([A-Z][A-Z0-9_]+)$/u.exec(row.grammar);
    if (!exported) continue;
    assert.ok(published.has(exported[1]),
      `${row.surface}: the machine surface ${exported[1]} is published by no schema module`);
    for (const file of row.file.split("+").map((cell) => cell.trim())) {
      if (!file.startsWith("packages/agentic-workflow-schema/")) offenders.push(`${row.surface} → ${file}`);
    }
  }
  assert.deepEqual(offenders, [],
    `${offenders.length} vocabulary row(s) still name the runner as the const's home — move the const to the schema package and re-point the row`);
});

test("#643 the pi package carries no second copy of a schema-published vocabulary", () => {
  const published = schemaPublishedNames();
  const { defects } = literalCopies(PI_SRC, [".ts", ".mjs"], published);
  assert.deepEqual(defects.map((row) => `${row.file}: ${row.name}`), [],
    "the companion package is a consumer of the published vocabularies, never a second owner");
});

test("#643 the invariant has one home and every other mention cites it", () => {
  const files = [...new Set(["AGENTS.md", ...sourceFiles("docs/architecture", [".md"]), ...sourceFiles("docs/workflow", [".md"])])]
    .filter((file) => existsSync(path.join(ROOT, file)));
  // One home: the only file that declares the rule as a versioned block.
  const declared = files.filter((file) => read(file).includes(`\`\`\`text\n${INVARIANT_MARKER}\n`));
  assert.deepEqual(declared, [INVARIANTS],
    `the residency rule is declared in ${declared.join(", ")} — one home, every other surface cites it`);
  // A mention anywhere else is a citation, so it names the owner (the same rule
  // the guide states for every repeated contract: a bare second copy is the defect).
  for (const file of files) {
    if (file === INVARIANTS) continue;
    const text = read(file);
    if (!text.includes(INVARIANT_MARKER)) continue;
    assert.ok(text.includes("ARCHITECTURAL_INVARIANTS.md"), `${file} names the marker without citing its owner`);
  }
});

test("#643 the gate-rejection vocabulary is published by the schema package, not by the prose", async () => {
  assert.ok(schemaPublishedNames().has("GATE_REJECTION_TYPES"),
    "GATE_REJECTION_TYPES is a schema-published const (a `must-name: yes` vocabulary needs a machine surface that is not the prose naming it)");
  const runtime = await import(schemaRuntimePath);
  assert.deepEqual([...(runtime.GATE_REJECTION_TYPES ?? [])], [
    "dependency",
    "status",
    "phase-lint",
    "path-protection",
    "stale-or-missing-receipt",
    "stale-unit-doc",
  ], "the six types the executor's gates print");
});

test("#643 the residency receipt classifies every runner const (class 3 stays, counted)", () => {
  const published = schemaPublishedNames();
  const class1and2 = new Set();
  const class3 = [];
  for (const file of sourceFiles(CRATE_SRC, [".mjs"])) {
    const text = read(file);
    // class 1/2 — the names this module imports from the one owner.
    for (const match of text.matchAll(/import\s*\{([^}]*)\}\s*from\s*"@gtrabanco\/agentic-workflow-schema"/gsu)) {
      for (const name of match[1].split(",").map((cell) => cell.trim().split(/\s+as\s+/u)[0]).filter(Boolean)) {
        if (published.has(name)) class1and2.add(name);
      }
    }
    // class 3 — a declared set no published contract names: it stays here.
    for (const match of text.matchAll(LITERAL_DECLARATION)) {
      if (!published.has(match[1])) class3.push(`${file}: ${match[1]}`);
    }
  }
  assert.ok(class1and2.size > 0, "the receipt counts the vocabularies the crate now imports");
  assert.ok(class3.length > 0, "class 3 exists by construction — an unnamed internal enum stays in the runner");
  // The receipt is a measurement a reviewer re-runs, never a number a reader trusts.
  process.stdout.write([
    "--- vocabulary residency receipt ---",
    `class 1/2 imported from the schema: ${class1and2.size}`,
    `class 3 declared here and staying: ${class3.length}`,
    ...class3,
    "--- end receipt ---",
    "",
  ].join("\n"));
});

// ---------------------------------------------------------------------------
// #643 — the prose drift audit (S9), seeded with the issue's four suspects
// ---------------------------------------------------------------------------

test("#643 audit seed 1 — the severity projection is a projection, not a second ladder", async () => {
  const { SEVERITY_VOCABULARY } = await import("../packages/agentic-workflow/src/runner/sensors/workflow-status.mjs");
  const envelopeSeverities = new Set(["high", "med", "low"]);
  for (const [token, projected] of SEVERITY_VOCABULARY) {
    assert.ok(envelopeSeverities.has(projected), `${token} projects onto an envelope severity, never a new one`);
  }
  for (const token of FINDINGS_TABLE_SEVERITIES) {
    assert.ok(SEVERITY_VOCABULARY.has(token), `the ladder token ${token} is projected rather than dropped`);
  }
});

test("#643 audit seed 2 — a unit *type* set is never a section model", async () => {
  const { UNIT_DOC_TYPES } = await import("../packages/agentic-workflow/src/doc/structure.mjs");
  const sections = new Set(Object.values(UNIT_DOC_SECTION_SHAPES).flat());
  for (const type of UNIT_DOC_TYPES) {
    assert.ok(!sections.has(type), `${type} is a unit type, not a document section`);
  }
  for (const section of sections) {
    assert.ok(!UNIT_DOC_TYPES.includes(section), `${section} is a document section, not a unit type`);
  }
});

test("#643 audit seed 3 — the index constants are the headings the index really carries", () => {
  const roadmap = read("docs/ROADMAP.md");
  assert.match(roadmap, new RegExp(`^## ${ROADMAP_FEATURES_HEADING}$`, "m"), "the features table's heading is the published constant");
  assert.match(roadmap, new RegExp(`^## ${ROADMAP_FIXES_HEADING}$`, "m"), "the fixes table's heading is the published constant");
});

test("#643 audit seed 4 — the Future-status tokens are the published ones and `deferred` is not one", () => {
  for (const copy of ["docs/features/_TEMPLATE/SPEC.md", "docs/fix/_TEMPLATE/SPEC.md"]) {
    assert.doesNotMatch(read(copy), /\|\s*`?deferred`?\s*\|/, `${copy}: \`deferred\` is a ledger status, never a Future row status`);
  }
  assert.ok(!FUTURE_STATUS_KINDS.includes("deferred"), "the published Future-status set carries no `deferred` token");
});

test("#643 the stale dependency rationale is gone from source, suites, scripts and the schema package's own narration", () => {
  // The premise of every mirror this unit retires: the crate was said not to
  // depend on the schema package, to duplicate the schema package's sets with a
  // pointing comment, and to need a parity pin beside that copy. It has depended
  // on it since 2026-11-09 (#427) and imports every set since #643, so a
  // narration justified that way is justified by a fact that is no longer true —
  // in the crate *and* in the owning package's own README and headers, where the
  // external verify found the old truth surviving (B3-B6).
  const phrases = [
    "does not depend on the schema package",
    "ships without a dependency on the schema package",
    "ships without a dependency on this package",
    "until issue #427 unifies the reading",
    "duplicates with a pointing comment",
    "mirrors these sets",
    "mirrors these values",
  ];
  const offenders = [];
  // This file names the phrases to forbid them; a scanner that flagged its own
  // pattern list would be reporting the rule instead of the defect.
  const self = "scripts/vocabulary-parity.test.mjs";
  const files = [
    ...sourceFiles(CRATE_SRC, [".mjs"]),
    ...sourceFiles("packages/agentic-workflow/test", [".mjs"]),
    ...sourceFiles("scripts", [".mjs"]),
    ...sourceFiles("packages/agentic-workflow-schema/src", [".ts"]),
    "packages/agentic-workflow-schema/README.md",
  ];
  for (const file of files) {
    if (file === self || !existsSync(path.join(ROOT, file))) continue;
    // Whitespace-normalized: a rationale wrapped across two comment lines is the
    // same sentence, and reading only exact lines would let it survive the sweep.
    const text = read(file).replace(/\s+/gu, " ");
    for (const phrase of phrases) if (text.includes(phrase)) offenders.push(`${file}: ${phrase}`);
  }
  assert.deepEqual(offenders, [],
    `${offenders.length} surface(s) still narrate the retired mirror architecture with a premise that stopped being true (dependency since 2026-11-09 #427; imports since #643)`);
});

// ---------------------------------------------------------------------------
// #704 — the delivery-condition sets: one home, imported, never restated
// ---------------------------------------------------------------------------

test("#704 the runner's delivery-condition handles are the published sets (F22 pattern)", async () => {
  const {
    CONDITION_KINDS, CONDITION_VERDICTS, CONDITION_FINDINGS, CONDITION_REFUSALS,
  } = await import("../packages/agentic-workflow/src/delivery-conditions/index.mjs");
  assert.deepEqual([...CONDITION_KINDS], [...DELIVERY_CONDITION_KINDS]);
  assert.deepEqual([...CONDITION_VERDICTS], [...DELIVERY_CONDITION_VERDICTS]);
  assert.deepEqual([...CONDITION_FINDINGS], [...DELIVERY_CONDITION_FINDINGS]);
  assert.deepEqual([...CONDITION_REFUSALS], [...DELIVERY_CONDITION_REFUSALS]);
});

test("#704 the issue process names every published condition kind, and no other", () => {
  const text = read("skills/triage-issue/references/ISSUE_PROCESS.md");
  const block = /```text\ndelivery-condition@1\n([\s\S]*?)```/u.exec(text);
  assert.ok(block, "the delivery-condition@1 block is the phrasings' declared home");
  const kinds = new Set(
    block[1]
      .split("\n")
      .slice(1)
      .map((line) => line.split("|").map((cell) => cell.trim())[1])
      .filter(Boolean),
  );
  assert.deepEqual([...kinds].sort(), [...DELIVERY_CONDITION_KINDS].sort());
});
