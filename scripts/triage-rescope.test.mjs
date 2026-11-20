#!/usr/bin/env node
// test-obligation: protects=skills/triage-issue/SKILL.md obligations=convention,contract

/**
 * triage-rescope.test.mjs — the triage router's re-scoped vocabulary (issue #441).
 *
 * `triage-issue` is the router of the ODD-hybrid direction (#307) and its
 * vocabulary predated it. This suite freezes what the re-scope adds:
 *
 *   1. the two new verdicts (`one-shot`, `remove`) and the criteria-provenance
 *      set are **published machine vocabularies**, not prose a reader trusts;
 *   2. the surface that orders them names every published token;
 *   3. `one-shot` carries its six eligibility conditions, the owner's consent,
 *      and the tier disqualification that keeps the classifier authoritative;
 *   4. `remove` is measured — three named input commands and the
 *      no-measurement-no-removal rule, with `orphan` the only legitimate state;
 *   5. every verdict block records the provenance of the criteria it used;
 *   6. the project's `ceremony-profile@1` is read before routing, with the
 *      anti-gaming guard stated in both directions;
 *   7. a typed receipt is a legal findings input beside a markdown file;
 *   8. the fold→repair switch is conditional and never emits a live hand-off to
 *      a command that does not exist yet;
 *   9. the batch flow is unchanged, and neither new verdict invents a label.
 *
 * And, since the 2026-11-15 `EXTERNAL VERIFY` receipt
 * (`docs/fix/441-triage-issue-rescope/external-verify.md`), the reproducers of
 * the surfaces that kept the pre-rescope truth after the change landed: the
 * sibling mentions of the verdict set (B1-B4), the unit doc's two claims
 * (B5-B6), the vocabulary comment's citation (B7), and the tutorial-index and
 * line-citation advisories this batch repairs (A1/A2/A4). One assertion per
 * reproducer; the section only ever adds assertions.
 *
 * The suite reads the machine from the built schema package (the same runtime
 * `vocabulary-parity` and `normative-drift` read) and the prose from the skill's
 * own files. It is deliberately assertion-per-rule: a rule that regresses names
 * itself.
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { schemaRuntimePath } from "./schema-runtime.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => readFileSync(path.join(ROOT, relative), "utf8");
const exists = (relative) => existsSync(path.join(ROOT, relative));

const SKILL = "skills/triage-issue/SKILL.md";
const ISSUE_PROCESS = "skills/triage-issue/references/ISSUE_PROCESS.md";
const REVIEW_FINDINGS = "skills/triage-issue/references/REVIEW_FINDING_PROCESS.md";
const AUDIT_FINDINGS = "skills/triage-issue/references/AUDIT_FINDINGS.md";
const LABELS = "skills/triage-issue/references/LABELS.md";
const RECEIPTS = "skills/triage-issue/references/RECEIPTS.md";

const {
  TRIAGE_VERDICTS,
  TRIAGE_CRITERIA_PROVENANCE,
} = await import(schemaRuntimePath);

/** The classification order the skill walks: cheapest organic route first. */
const VERDICT_ORDER = ["one-shot", "fix-now", "fix-in-unit", "promote", "postpone", "wontfix", "remove"];

/** The Charter's three provenance tokens (#435 S9), tokenized for the machine. */
const PROVENANCE_ORDER = ["workflow-generic", "project-declared", "stamped-assumption"];

/** The six `one-shot` eligibility conditions, as the block must name them. */
const ONE_SHOT_CONDITIONS = [
  "single surface",
  "no pending design decision",
  "no contract consumed by others",
  "existing validator",
  "resumable-from-diff",
  "reversible",
];

/** One versioned block read: the fence whose first line is `<marker>`, de-indented.
 *  Blocks inside a list item are indented with it, so the common leading
 *  whitespace is stripped before the marker and the rows are read. */
function versionedBlock(file, marker) {
  const text = read(file);
  const bodies = [...text.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  const deindent = (body) => {
    const lines = body.split("\n");
    const indents = lines.filter((line) => line.trim() !== "").map((line) => line.length - line.trimStart().length);
    const strip = indents.length === 0 ? 0 : Math.min(...indents);
    return lines.map((line) => line.slice(Math.min(strip, line.length - line.trimStart().length))).join("\n");
  };
  const block = bodies.map(deindent).find((body) => body.split("\n")[0].trim() === marker);
  assert.ok(block, `${file} carries no \`${marker}\` block`);
  return block;
}

test("#441 the schema package publishes the triage verdict vocabulary", () => {
  assert.ok(Array.isArray(TRIAGE_VERDICTS), "TRIAGE_VERDICTS is a published const array");
  assert.ok(Object.isFrozen(TRIAGE_VERDICTS), "TRIAGE_VERDICTS is frozen");
  assert.deepEqual([...TRIAGE_VERDICTS], VERDICT_ORDER,
    "the published set is the classification order: the organic route first, then the five original verdicts, then removal");
});

test("#441 the schema package publishes the criteria-provenance vocabulary", () => {
  assert.ok(Object.isFrozen(TRIAGE_CRITERIA_PROVENANCE), "TRIAGE_CRITERIA_PROVENANCE is frozen");
  assert.deepEqual([...TRIAGE_CRITERIA_PROVENANCE], PROVENANCE_ORDER,
    "the three tokens are the Charter's own (#435 S9: workflow-generic / project-declared / stamped assumption)");
});

test("#441 the triage surface names every published verdict, token for token", () => {
  const block = versionedBlock(ISSUE_PROCESS, "triage-verdict@1");
  const named = block.split("\n")
    .slice(1)
    .map((line) => line.split("|")[0].trim())
    .filter((cell) => cell !== "" && cell !== "verdict");
  assert.deepEqual(named, [...TRIAGE_VERDICTS],
    "the `triage-verdict@1` block enumerates exactly the machine's verdicts, in its order");
});

test("#441 one-shot carries its six conditions, the consent rule and the tier disqualification", () => {
  const text = read(ISSUE_PROCESS);
  for (const condition of ONE_SHOT_CONDITIONS) {
    assert.ok(text.includes(condition), `the one-shot eligibility block does not name \`${condition}\``);
  }
  assert.match(text, /owner'?s? (explicit )?consent/i, "one-shot requires the owner's explicit consent");
  assert.match(text, /standard|high/, "one-shot names the tiers that disqualify it");
  assert.match(text, /tier (verdict )?(wins|disqualif|outranks)/i,
    "the computed tier outranks the one-shot route (fail closed upward)");
});

test("#441 a one-shot leaves no unit doc and pays no review pass", () => {
  const text = read(ISSUE_PROCESS);
  assert.match(text, /no unit doc/i, "the inline route states that it opens no unit doc");
  assert.match(text, /no review pass|pays no review|no review/i, "the inline route pays no review pass");
  assert.match(text, /closing comment|dated comment/i, "the record is the issue's own dated comment, not a new receipt");
});

test("#441 remove is measured: three named inputs, no measurement no removal, orphan only", () => {
  const text = read(ISSUE_PROCESS);
  assert.match(text, /runner residual-classify --receipt/u,
    "the removal verdict cites the deterministic retire receipt");
  assert.match(text, /code-net|ARW/u, "the removal verdict cites the code-net ratio the corpus owns");
  assert.match(text, /impact sweep/i, "the removal verdict cites the impact sweep");
  assert.match(text, /no measured verdict, no removal/i, "the rule is stated in the negative it must fail closed on");
  assert.match(text, /orphan/, "an orphan is the only retire-legitimate state");
});

test("#441 every verdict block records the provenance of the criteria it used", () => {
  const block = versionedBlock(ISSUE_PROCESS, "triage-verdict-block@1");
  assert.match(block, /^Criteria: /m, "the verdict block carries a `Criteria:` line");
  const text = read(ISSUE_PROCESS);
  for (const token of TRIAGE_CRITERIA_PROVENANCE) {
    assert.ok(text.includes(token), `the provenance token \`${token}\` is never named where the block is defined`);
  }
  assert.match(text, /surface[sd]? it to the\s+owner|surfaced to the\s+owner/i,
    "an open-with-default criterion the unit touches is surfaced to the owner, never assumed");
  assert.match(text, /workflow-generic/, "a project with no declared catalogue records the generic provenance");
});

test("#441 the ceremony profile is read before routing, with the anti-gaming guard in both directions", () => {
  const text = read(SKILL);
  assert.match(text, /ceremony-profile@1/, "the skill names the published profile grammar it reads");
  assert.match(text, /never authorizes|never waives/i, "the profile never waives a tier gate, verification or a non-negotiable");
  assert.match(text, /discarded piece|declared surface/i, "the routing half: only declared surfaces are routed to");
});

test("#441 a typed receipt is a legal findings input beside a markdown file", () => {
  assert.ok(exists(RECEIPTS), `${RECEIPTS} does not exist — the receipt mode has no home`);
  const receipts = read(RECEIPTS);
  assert.match(receipts, /EnvelopeFixNowFinding/, "the receipt mode names the published typed shape");
  assert.match(receipts, /EXTERNAL VERIFY/, "the local flow's block is a candidate input in the same shape");
  assert.ok(read(SKILL).includes("references/RECEIPTS.md"),
    "the skill's progressive-loading allowlist names the receipt reference (an unlisted reference is never read)");
  assert.ok(read(AUDIT_FINDINGS).includes("RECEIPTS.md") || read(AUDIT_FINDINGS).includes("receipt"),
    "audit-finding mode accepts a receipt in addition to a markdown audit file");
});

test("#441 the fold→repair switch stays conditional and never emits a live hand-off", () => {
  const text = read(REVIEW_FINDINGS);
  assert.match(text, /\/fold-findings/, "the live route is still the fold");
  assert.match(text, /execute-phase --repair/, "the conditional route names the future command explicitly");
  assert.match(text, /retirement trigger/i, "the switch names what gates it");
  assert.match(text, /never earlier|only when|strictly/i, "the switch is stated as conditional, not as available now");
  const liveHandOffs = [...read(SKILL).matchAll(/→\s*Next:.*$/gm)].map((m) => m[0]);
  assert.ok(liveHandOffs.length > 0, "the skill still prints its closing hand-off block");
  for (const line of liveHandOffs) {
    assert.ok(!line.includes("--repair"),
      `a live → Next: line hands off to a command that does not exist yet: ${line.trim()}`);
  }
});

test("#441 the batch flow is unchanged and the five original verdicts survive", () => {
  const text = read(ISSUE_PROCESS);
  for (const verdict of ["fix-now", "fix-in-unit", "promote", "postpone", "wontfix"]) {
    assert.ok(text.includes(verdict), `the original verdict \`${verdict}\` disappeared from the classification`);
  }
  assert.match(text, /VERDICT: .*fix-now/, "the fixed-format verdict block still prints its VERDICT line");
  assert.match(text, /group by home unit/i, "the batch summary still groups by home unit");
  const skill = read(SKILL);
  assert.match(skill, /summary table/i, "the batch summary table is still required");
  assert.match(skill, /→ Next:/, "the closing hand-off block survives");
  assert.match(skill, /its own next command/i,
    "the batch hand-off still maps every id to its own command");
});

test("#441 neither new verdict invents a label", () => {
  const labels = read(LABELS);
  assert.match(labels, /one-shot/, "the label vocabulary states what one-shot applies");
  assert.match(labels, /remove/, "the label vocabulary states what remove applies");
  assert.match(labels, /no (disposition )?label/i, "the obligation is stated: the two new verdicts apply no label");
  const declared = read(ISSUE_PROCESS);
  for (const invented of ["`one-shot` label", "`remove` label"]) {
    assert.ok(!declared.includes(invented), `a verdict naming a label that does not exist: ${invented}`);
  }
});

/* ── The 2026-11-15 EXTERNAL VERIFY reproducers (receipt blockers B1–B7 and
 * the advisories A1/A2/A4 this correction batch repairs). Each test fails on
 * the pre-correction bytes and passes after them; the receipt is the corpus. */

const SPEC_DOC = "docs/fix/441-triage-issue-rescope/SPEC.md";
const WORKFLOW_SKILLS = "docs/workflow/SKILLS.md";
const WORKFLOW_README = "docs/workflow/README.md";
const PORTABLE_PROMPT = "docs/workflow/PORTABLE_PROMPT.md";
const SENSOR_SIGNALS = "skills/workflow-status/references/SENSOR_SIGNALS.md";
const ROADMAP = "docs/ROADMAP.md";
const PASSIVE_SETTLE = "docs/passive/2026-11-15-settle-odd-hybrid-direction.md";
const DIRECTION_DRAFT = "docs/features/83-odd-hybrid-direction/SPEC.md";
const SCHEMA_VOCAB = "packages/agentic-workflow-schema/src/vocabularies.ts";

test("#441-B1/B2 ISSUE_PROCESS never calls the published classification four-verdict", () => {
  const text = read(ISSUE_PROCESS);
  assert.ok(
    !text.includes("four-verdict"),
    "ISSUE_PROCESS.md still says `four-verdict … unchanged` beside step 4's seven published verdicts (receipt B1 at the scope-membership fall-through, B2 under the verdict block)",
  );
});

test("#441-B3 audit mode defers to the published verdict set, not the four", () => {
  const text = read(AUDIT_FINDINGS);
  assert.ok(
    !text.includes("same four verdicts"),
    "AUDIT_FINDINGS.md still classifies audit findings with the pre-rescope four verdicts (receipt B3)",
  );
  assert.match(text, /triage-verdict@1/, "audit mode names the published set its classification defers to");
});

test("#441-B4 the workflow index's triage diagram names every published verdict", () => {
  const text = read(WORKFLOW_SKILLS);
  const start = text.indexOf("ISSUE(any) ─▶ triage-issue");
  assert.notEqual(start, -1, "docs/workflow/SKILLS.md carries the triage-issue verdict diagram");
  const diagram = text.slice(start, text.indexOf("review→fold", start));
  for (const verdict of TRIAGE_VERDICTS) {
    assert.ok(diagram.includes(verdict), `the SKILLS.md verdict→route diagram omits \`${verdict}\` (receipt B4)`);
  }
});

test("#441-B5 the Retirements receipt states the rows the inventory actually prints", () => {
  const spec = read(SPEC_DOC);
  assert.ok(
    !spec.includes("with the state the plan"),
    "the Retirements claim still says the printed states are the plan's — the inventory prints `used` and `orphan — no-plan-claim` (receipt B5)",
  );
  assert.match(spec, /`orphan`/, "the Retirements claim names the state the inventory prints for the new suite");
});

test("#441-B6 the settle evidence cites only rows that show delivery", () => {
  const row83 = read(ROADMAP).split("\n").find((line) => line.startsWith("| 83 |"));
  assert.ok(row83 !== undefined, "roadmap row 83 exists");
  assert.ok(
    !row83.includes("delivered by its own row"),
    "row 83 still claims delivery by rows that do not show it — fix 269 reads `in-progress`, fix 303 has no row (receipt B6)",
  );
  const passive = read(PASSIVE_SETTLE);
  assert.ok(
    !passive.includes("every slice delivered by its own row"),
    "the passive readback repeats the superseded delivery claim (receipt B6)",
  );
  assert.match(read(DIRECTION_DRAFT), /\*\*L3\*\*/, "the direction draft's append-only Log carries the correction to L2");
});

test("#441-B7 the provenance comment cites the requirement that carries the tokens (#435 S10)", () => {
  const text = read(SCHEMA_VOCAB);
  assert.ok(
    !text.includes("#435 S9"),
    "the vocabulary comment cites #435 S9, which owns the catalogue — the provenance rule is S10 (receipt B7)",
  );
  assert.match(text, /#435 S10/, "the vocabulary comment cites #435 S10, whose quote carries the three tokens");
});

test("#441-A1/A2 the tutorial index and the portable prompt enumerate the current verdict set", () => {
  const readme = read(WORKFLOW_README);
  assert.ok(
    !readme.includes("fix-now / postpone / wontfix / promote"),
    "docs/workflow/README.md still lists the pre-rescope four verdicts (advisory A1)",
  );
  for (const verdict of TRIAGE_VERDICTS) {
    assert.ok(readme.includes(verdict), `docs/workflow/README.md never names \`${verdict}\``);
  }
  const portable = read(PORTABLE_PROMPT);
  assert.ok(
    !portable.includes("fix-now / promote-to-feature / postpone /"),
    "docs/workflow/PORTABLE_PROMPT.md still lists the pre-rescope four verdicts (advisory A2)",
  );
  for (const verdict of TRIAGE_VERDICTS) {
    assert.ok(portable.includes(verdict), `docs/workflow/PORTABLE_PROMPT.md never names \`${verdict}\``);
  }
});

test("#441-A4 no live reference pins triage-issue's SKILL.md by line number", () => {
  const text = read(SENSOR_SIGNALS);
  assert.ok(
    !/triage-issue\/SKILL\.md:\d+/.test(text),
    "a line-number citation into SKILL.md drifts with every edit — cite the owning block instead (advisory A4)",
  );
});
