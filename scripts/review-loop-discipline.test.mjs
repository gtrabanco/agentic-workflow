#!/usr/bin/env node

// Fix #159 — the review→fold loop must terminate. Pins the four loop killers
// to their owning skill text:
//   1. materiality survives classification and the decision (low = report-only)
//   2. workspace state is a precondition, not a persisted finding
//   3. folded rows are re-verified, not re-reported
//   4. the review→fold loop is bounded at two review→fold cycles per unit
// plus the plan-time prevention rules and the planning-review resolution map.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
// P8b: safeRead returns null for deleted skills so the test doesn't crash.
const safeRead = (relative) => {
  const p = path.join(root, relative);
  try { return fs.readFileSync(p, "utf8"); } catch { return null; }
};

const classify = read("skills/review-implementation/references/CLASSIFY.md");
const reviewProcess = read("skills/review-change/references/REVIEW_PROCESS.md");
const persist = read("skills/review-change/references/PERSIST_AND_DECIDE.md");
const outputGuardrails = read("skills/review-change/references/OUTPUT_AND_GUARDRAILS.md");
const verification = read("skills/verification-contract/SKILL.md");
// P8b: evidence-grounding deleted — grounding is null, assertions below are skipped.
const grounding = safeRead("skills/evidence-grounding/SKILL.md");
const logSession = read("skills/log-session/SKILL.md");
// P8b: review-spec / review-plan deleted — specOutput / planOutput are null.
const specOutput = safeRead("skills/review-spec/references/OUTPUT.md");
const planOutput = safeRead("skills/review-plan/references/OUTPUT.md");

// ── 1. Materiality survives classification and the decision ────────────────

assert.match(classify, /A `low` finding[^.]*is \*\*never persisted and never blocks\*\*/s);
assert.match(classify, /carried\s+as a report note/);
assert.match(classify, /classify it at `med` minimum/);
assert.match(classify, /deflating a real defect to `low` to unblock a review is itself a review defect/);

// The severity vocabulary is consistent end-to-end: finder scale maps onto the
// classification scale, and only high/med rows persist.
assert.match(persist, /finding of severity `high`\s+or `med`/);
assert.match(classify, /critical.*high.*major.*med.*minor.*low/s);
assert.match(persist, /never persisted to the fold ledger/);
assert.match(outputGuardrails, /`low`\s+findings are report-only notes that never block/);
assert.match(persist, /Notes \(low · report-only/);

// ── 2. Workspace state is a precondition, not a persisted finding ──────────

assert.match(reviewProcess, /precondition, not a finding/);
assert.match(reviewProcess, /REVIEW BLOCKED — workspace state/);
assert.match(reviewProcess, /is withheld, not filed/);
assert.match(reviewProcess, /never a `workflow` finding/);

// The review never dirties the tree it will next be judged against.
assert.match(persist, /Commit the ledger append/);
assert.match(persist, /docs\(<unit>\): persist review findings/);
assert.match(persist, /On\s+`REVIEW-PASS` with an open PR the SHA-bound receipt is the durable record/);

// ── 3. Folded rows are re-verified, not re-reported ─────────────────────────

assert.match(reviewProcess, /Read the unit's fold ledger \(`review-findings\.md`\)/);
assert.match(reviewProcess, /state the cycle number/);
assert.match(reviewProcess, /every `folded: yes` row\s+is re-verified at its cited location/);
assert.match(reviewProcess, /regression of <id>/);
assert.match(reviewProcess, /CONVERGENCE-ANOMALY/);

// ── 4. The loop is bounded ──────────────────────────────────────────────────

assert.match(reviewProcess, /LOOP CAP REACHED/);
assert.match(reviewProcess, /at most \*\*two\*\*\s+review→fold cycles/);
assert.match(reviewProcess, /third cycle never\s+starts/);
assert.match(reviewProcess, /triage-issue --prioritize-now/);

// ── 5. Materiality bar in every finder of the internal review pack ──────────

for (const finder of [
  "review-code",
  "review-security",
  "review-verify",
  "review-design",
  "review-a11y",
  "review-brand",
  "review-perf",
  "review-seo",
]) {
  const text = read(`skills/${finder}/SKILL.md`);
  assert.match(text, /## Materiality bar/, `${finder}: materiality bar section`);
  assert.match(text, /cite the rule it violates/, `${finder}: cite-the-rule bar`);
  assert.match(text, /never pad the table/, `${finder}: no padding`);
}

// ── 6. Plan-time prevention ─────────────────────────────────────────────────

// Validators cannot gate on surfaces other workflow actors mutate (the AC9 /
// docs/LOGS.md failure that re-opened a finished unit's review).
assert.match(verification, /must never gate on a surface other workflow\s+actors mutate/);
assert.match(verification, /session log/);

// P8b: evidence-grounding deleted; skip authoring claims assertions.
if (grounding) {
  assert.match(grounding, /A forward-looking claim stated as present fact/);
  assert.match(grounding, /bind its verification\s+to the step that owns it/);
}

// Session logs state forge-verified status words only.
assert.match(logSession, /Status words .*are forge-verified/s);

// P8b: review-spec / review-plan deleted; skip planning-review resolution map.
if (specOutput && planOutput) {
  for (const [name, text] of [["review-spec", specOutput], ["review-plan", planOutput]]) {
    assert.match(text, /`fold-findings` never repairs a planning artifact/, `${name}: fold boundary`);
    assert.match(text, /class `product` → `design-feature`/, `${name}: product route`);
    assert.match(text, /class `plan` → `plan-feature`/, `${name}: plan route`);
  }
  const foldRoute = /class `source` \|\s*`environment` \|\s*`runtime` → the\s+executor's fold path/;
  assert.match(planOutput, foldRoute);
  assert.match(specOutput, foldRoute);
}

// ── 8. Findings are verified before persistence (fix #161) ──────────────────

// O4: the verification gate runs between the finders and synthesis, isolated,
// against the reviewed head — and only confirmed candidates reach the ledger.
assert.match(reviewProcess, /Verify, then synthesize/);
assert.match(reviewProcess, /verified in an isolated context against the reviewed\s+head's bytes/);
assert.match(persist, /comes from a \*\*confirmed\*\* candidate only/);
assert.match(persist, /finding-mark@1/);

// O21: the recheck method follows the finding's axis.
assert.match(reviewProcess, /failing reproducer/);
assert.match(reviewProcess, /red test written first/);
assert.match(reviewProcess, /unchanged code/);
assert.match(reviewProcess, /reproducible command output/);
assert.match(reviewProcess, /direct read/);
assert.match(reviewProcess, /named user\s+path/);

// O5: the per-finding verified mark — shape, writer, routes, exclusions.
const ledgers = read("skills/pre-execution-review/references/LEDGERS.md");
assert.match(ledgers, /finding-mark@1/);
assert.match(ledgers, /VF-<n>/);
assert.match(ledgers, /confirmed \| refuted/);
assert.match(ledgers, /counter-evidence/);
assert.match(ledgers, /never becomes a row/);
assert.match(ledgers, /single writer of every finding mark is `review-change`/);

// O6: one writer on the ownership map + the normative-surfaces row.
assert.match(ledgers, /review-change:finding-mark/);
const claudeGuide = read("AGENTS.md");
assert.match(claudeGuide, /block:finding-mark@1/);

// O7: the annotator never parses VF- rows as findings — proven against the
// seeded fixture by running the annotator itself, not asserted from prose.
const fixtureAbs = path.join(root, "scripts/fixtures/finding-mark-ledger.md");
const provScript = path.join(root, "scripts/ledger-provenance.mjs");
const entries = JSON.parse(
  execFileSync("node", [provScript, fixtureAbs, "--json"], { encoding: "utf8" }),
);
assert.ok(
  entries.some((e) => e.id === "F901" && e.status === "open") &&
  entries.some((e) => e.id === "F902" && e.status === "open"),
  "the fixture's F rows must parse as findings",
);
assert.ok(
  !entries.some((e) => String(e.id).startsWith("VF-")),
  "a finding-mark@1 (VF-) row was parsed as a finding",
);
try {
  const checkOut = execFileSync("node", [provScript, fixtureAbs, "--check"], { encoding: "utf8" });
  assert.match(checkOut, /CHECK PASS/);
} catch (error) {
  throw new Error(`ledger-provenance --check failed on the seeded fixture: ${error.stdout ?? error.message}`);
}

// ── 9. Tests are immutable once written (fix #161, O22–O23) ────────────────

// O22: the executor fixes code until green, never the test; the sole
// legitimate amendment is a proven mis-encoding of external semantics, cited
// from authoritative documentation, surfaced as a finding + SPEC amendment.
assert.match(verification, /immutable/);
assert.match(verification, /fixes code until green/);
assert.match(verification, /never the test/);
assert.match(verification, /proven mis-encoding of external semantic/);
assert.match(verification, /authoritative documentation/);
assert.match(verification, /finding .* SPEC amendment/);
assert.match(verification, /research-before-encode/);
assert.match(verification, /before a test encodes them/);
assert.match(verification, /adding stronger tests stays allowed/);
assert.match(verification, /editing expectations never/);

// O23: the fold-side mirror — the fold never edits an existing test's
// expectation to match behaviour; setup repairs keep assertions at least as
// strong and never touch expectations.
const foldPolicy = read("skills/fold-findings/references/FOLD_POLICY.md");
const folding = read("skills/execute-phase/references/FOLDING.md");
assert.match(foldPolicy, /edit an existing test's expectation/i);
assert.match(foldPolicy, /setup repair/);
assert.match(foldPolicy, /at least as strong/);
assert.match(foldPolicy, /never touch expectations/);
assert.match(folding, /edit an existing test's expectation/i);

// ── 10. REPAIR-RECEIPT contract (issue #170 / major, P1) ───────────────────

const foldSkill = read("skills/fold-findings/SKILL.md");
const foldProcess = read("skills/fold-findings/references/FOLD_PROCESS.md");
const reviewChangeSkill = read("skills/review-change/SKILL.md");
const envelopeCore = read("skills/workflow-status/references/ENVELOPE_CORE.md");
const sensorCore = read("skills/workflow-status/references/SENSOR_CORE.md");

// 10a. The fixed REPAIR-RECEIPT block is printed as the ABSOLUTE-last output —
// its header and every one of its five fields (repaired ids + finding-mark@1
// refs, refuted/open, gate exit codes at head, batch class, fold-diff shortstat)
// appear verbatim in the skill's report contract.
assert.match(foldSkill, /## REPAIR-RECEIPT/);
assert.match(foldSkill, /- Repaired: <F-ids with \(VF-<n>\) refs, joined ` \+ `, or `none`>/);
assert.match(foldSkill, /- Refuted\/open: <F-ids joined ` \+ `, or `none`>/);
assert.match(foldSkill, /- Gate: <command> .*exit <n> at head <40-hex sha>/);
assert.match(foldSkill, /- Batch class: <all-repair-in-place \| frozen \(replan present\) \| none>/);
assert.match(foldSkill, /- Fold diff: <shortstat from a real `git diff` run>/);
assert.match(foldSkill, /- Branch: <RE-REVIEW-REQUIRED \(delta\) \| RE-REVIEW-OPTIONAL \| RE-REVIEW-SKIPPED \| REPLAN-ROUTE>/);

// 10b. The receipt is immutable once printed and emitted after the tally as
// the ABSOLUTE-last output together with the branching block.
assert.match(foldSkill, /immutable once printed/);
assert.match(foldSkill, /ABSOLUTE[- ]last output/);

// 10c. Empty-batch and failed-gate branches — a nothing-folded turn prints the
// receipt with `none` class / observed gate exit codes, never a silent gap.
assert.match(foldProcess, /empty queue|nothing folded|no targets taken/);
assert.match(foldProcess, /batch class `none`/);
assert.match(foldSkill, /green or red/);
assert.match(foldSkill, /failed gate never silences the receipt/);

// 10d. Impact-rule batch classification — the class derives from the frozen
// rows only, referencing only the closed CLASSIFY set, never reclassifying.
assert.match(foldProcess, /batch class/);
assert.match(foldSkill, /all-repair-in-place/);
assert.match(foldSkill, /frozen \(replan present\)/);
assert.match(foldSkill, /reclassif/);

// 10e. Freeze-batch: a replan-class member folds nothing (no flips, no
// commits), and the receipt records the REPLAN-ROUTE with retained ids.
assert.match(foldSkill, /replan-in-unit/);
assert.match(foldSkill, /decision-required/);
assert.match(foldProcess, /no `folded: yes` flips/);
assert.match(foldProcess, /REPLAN-ROUTE/);
assert.match(foldProcess, /retained/);

// 10f. Four-branch closing block + the literal no-decision→re-review default.
assert.match(foldSkill, /RE-REVIEW-REQUIRED \(delta\)/);
assert.match(foldSkill, /RE-REVIEW-OPTIONAL/);
assert.match(foldSkill, /RE-REVIEW-SKIPPED/);
assert.match(foldSkill, /no-decision/);
assert.match(foldSkill, /re-review default/);

// 10g. Branch-selection decision inputs (repair P30-2): the docs-only file-set
// test (E-D3), the frozen-severity-`high` override, and the SKIPPED-requires-
// prior-consumer-decision rule (E-D2).
assert.match(foldSkill, /every fold-diff/);
assert.match(foldSkill, /Markdown\/documentation file/);
assert.match(foldSkill, /frozen severity/);
assert.match(foldSkill, /`high`/);
assert.match(foldSkill, /RE-REVIEW-REQUIRED \(delta\)/);
assert.match(foldSkill, /prior consumer decision/);
assert.match(foldSkill, /RE-REVIEW-OPTIONAL/);
assert.match(foldSkill, /never.*RE-REVIEW-SKIPPED/);

// 10h. The receipt contract is pinned verbatim in FOLD_PROCESS.md too (the
// classification + freeze edge is stated there, not only in the SKILL).
assert.match(foldProcess, /REPAIR-RECEIPT/);
assert.match(foldProcess, /all-repair-in-place/);
assert.match(foldProcess, /none/);

// 10i. Reproducer handoff — FOLD_POLICY consumes the finding-mark@1 `recheck`
// cell, never re-derives, and yields BLOCKED with the missing input when not
// materializable.
assert.match(foldPolicy, /recheck/);
assert.match(foldPolicy, /never .*re-derive|never invents/);
assert.match(foldPolicy, /BLOCKED/);
assert.match(foldPolicy, /missing input/);
assert.match(foldPolicy, /materializ/);

// 10j. Version — fold-findings is bumped for this contract. The exact pin is
// maintained on every later bump: fix #224 moved it 1.4.0 → 1.5.0 (the
// conditional replan destination), fix #244 moved it 1.5.0 → 1.5.1
// (the freeze-batch consumer contract), feature 32 moved it 1.5.1 → 1.6.0
// (sole-flipper provenance cited to the ledger-ownership map), and the lane
// reference migration moved it 1.6.0 → 1.7.0 (the #244 consumer now names
// `/unit-lane`, the lane command the router prints), the assertion
// unchanged in strength.
assert.match(foldSkill, /version: 1\.7\.0/);

// 10k. The existing bounded-loop fold pins survive verbatim.
assert.match(foldProcess, /one `FOLDED <same-sha>` line per/);
assert.match(foldProcess, /never edit classification or create an/);

// ── 11. Delta-mode default post-fold re-review (issue #170, P2) ─────────────

// 11a. Delta mode is the default when the preceding fold receipt's branch is
// RE-REVIEW-REQUIRED (delta) (or OPTIONAL acted on with the re-review
// decision).
assert.match(reviewProcess, /delta mode/);
assert.match(reviewProcess, /RE-REVIEW-REQUIRED \(delta\)/);
assert.match(reviewProcess, /re-verify every `folded: yes` row at the `file:line` cited/i);
assert.match(reviewProcess, /review the fold diff|fold diff only/);

// 11b. The gate-green + exact ACACCEPTANCE.md blob precondition (the existing
// step-2 structural precondition is unchanged and still mandatory).
assert.match(reviewProcess, /gate green at the reviewed head/);
assert.match(reviewProcess, /`ACCEPTANCE\.md` blob/);
assert.match(reviewProcess, /exact match/);

// 11c. Escalation triggers with the state-the-trigger-and-numbers requirement:
// width (file outside cited-file union, or changed line >50 lines from every
// cited line in its file) and size (>200 changed lines or >15 files).
assert.match(reviewProcess, /escalat/);
assert.match(reviewProcess, /outside the union of the batch's cited files/);
assert.match(reviewProcess, /50 lines/);
assert.match(reviewProcess, /200/);
assert.match(reviewProcess, /> \*\*15\*\*|> 15/);
assert.match(reviewProcess, /which trigger fired|state .*trigger|trigger.*numbers/);

// 11d. Cycle-≥2 genuinely-new dedupe extension: a same-`file:line`+axis
// re-report inside the delta scope is admitted only as `regression of <id>` or
// `DISPUTED`; the two-cycle cap counts deltas from the unchanged source
// (review-mark@1 marks + forge receipts); the third-cycle-user-only line
// survives verbatim.
assert.match(reviewProcess, /regression of <id>/);
assert.match(reviewProcess, /DISPUTED/);
assert.match(reviewProcess, /LOOP CAP REACHED/);
assert.match(reviewProcess, /two.*review→fold cycles/);
assert.match(reviewProcess, /third cycle never\s+starts/);
assert.match(reviewProcess, /REVIEW-RAN/);

// ── 12. Recheck-cell consumption in the durable finding mark (issue #170, P3) ─

// The durable finding mark's `recheck` cell is consumed by fold-findings
// (materialize, never re-derive); the row shape, `VF-` exclusions, and the
// `review-change` single-writer rule stay untouched. The consumption sentence
// names fold-findings as the recheck cell's consumer.
assert.match(ledgers, /fold-findings/);
assert.match(ledgers, /recheck/);
assert.match(ledgers, /`fold-findings` .*reads.*`recheck` cell/);
assert.match(ledgers, /materializ/);
assert.match(ledgers, /never .*re-derive|never re-derives/);
assert.match(ledgers, /single writer of every finding mark is `review-change`/);
assert.match(ledgers, /VF-/);

// ── 13. Planning-side loop carriers (feature 31, D-31-6/E-D31-14) ────────────
//
// The planning-side loop rules are code, not prose: this block reads the
// carriers directly, so a regression of any rule fails here even when the
// superseded sentences are gone. The existing code-side assertions above stay
// byte-unchanged (AC8's no-weakening walk).

// ── 13.5. Feature 32 (P2) — contract prose alignment pins ───────────────────
//
// IS-1: sole flipper provenance — fold-findings:folded-flag is the sole writer
// of `folded: no → yes` across all surfaces. IS-5(b): triage-issue's three modes
// named in review-change surfaces. IS-5(c): plan-feature verify-vs-write split.
// IS-5(a): sensor NRS split (draft/contradicted/resolved block, missing = notice).

// IS-1: fold-findings/SKILL.md cites the map, not the cycle
assert.match(foldSkill, /`ledger-ownership@1`.*`fold-findings:folded-flag`.*sole writer/s);
// IS-1: PERSIST_AND_DECIDE.md cites the map, not the cycle
assert.match(persist, /`ledger-ownership@1`.*`fold-findings:folded-flag`.*sole writer/s);
// IS-1: FOLDING.md cites the map
assert.match(folding, /`ledger-ownership@1`.*`fold-findings:folded-flag`.*sole writer/s);
// IS-1: no surviving old claim in docs/workflow/ (tutorial scan) — AC-01
let workflowDocs = "";
try {
  workflowDocs = execFileSync("grep", ["-rnE", "only step that ever flips|one and only ledger state transition", "docs/workflow/", "--include=*.md"], { encoding: "utf8", stderr: "inherit" }).toString();
} catch {
  // grep returns exit 1 when no matches — that's the expected pass condition
}
assert.equal(workflowDocs, "", "no contradicting sole-flipper restatement survives in docs/workflow/ outside GOLDEN_FIXTURE.md");

// IS-5(b): triage-issue's three modes in review-change surfaces. The reviewChange
// clause is pinned to the `triage-issue` sentence itself — a match from any other
// adjacent sentence (the F11 defect) is no longer accepted.
assert.match(reviewChangeSkill, /`triage-issue` is user-invoked[\s\S]{0,120}?for independent proposals, audit findings, and\s+`--prioritize-now` runs/s);
assert.doesNotMatch(reviewChangeSkill, /user-invoked\s+only for independent proposals/);
assert.match(outputGuardrails, /independent[\s\S]*proposals.*audit findings.*--prioritize-now/s);
assert.match(persist, /independent[\s\S]*proposals.*audit findings.*--prioritize-now/s);

// IS-5(c): plan-feature verify-vs-roadmap
// P8b: plan-feature / plan-feature-scaffold deleted.
const planFeature = safeRead("skills/plan-feature/SKILL.md");
const planScaffold = safeRead("skills/plan-feature-scaffold/SKILL.md");
if (planFeature && planScaffold) {
  assert.match(planFeature, /verifies.*repairs.*roadmap.*plan-feature-scaffold.*sole writer.*defined → planned/s);
  assert.match(planScaffold, /defined → planned.*write.*owns/);
}

// IS-5(a): sensor NRS split — draft/contradicted/resolved block, missing = notice
assert.match(envelopeCore, /\`draft\`, \`contradicted\`, or \`resolved\`/);
assert.match(envelopeCore, /absent ledger is a non-blocking notice/);
assert.match(sensorCore, /\`draft\`[,\s]+\`contradicted\`/);
assert.match(sensorCore, /absent ledger emits a non-blocking substrate notice/);


// ── 14. Feature 32 (P3) — classification single-owner contract pins ─────────

// IS-2: canonical severity conversion table exists in CLASSIFY.md with all four
// producer scales mapped onto high|med|low.
assert.match(classify, /Severity conversion \(canonical table\)/);
assert.match(classify, /Producer scale.*→ `high`.*→ `med`.*→ `low`/s);
assert.match(classify, /Ledger \(`CLASSIFY.md` itself\): `high`/);
assert.match(classify, /Finder \(nine review passes\): `critical`/);
assert.match(classify, /Planning/);
assert.match(classify, /`audit-docs`/);
assert.match(classify, /Unknown scale.*fail closed/);

// IS-2: fail-closed for unknown scales.
assert.match(classify, /fail closed.*guess|guess.*fail closed/s);

// IS-3: derived blocking gate — four citation categories and no-citation outcome.
assert.match(classify, /Derived blocking gate/);
assert.match(classify, /finding.*blocks.*only when the reviewer cites/);
assert.match(classify, /ACCEPTANCE criterion.*unverified/i);
assert.match(classify, /Obligation row/);
assert.match(classify, /gate.*red.*at the reviewed head/i);
assert.match(classify, /open confirmed.*fix-now/i);
assert.match(classify, /report-note.*proposal.*never blocking|never blocking.*report-note.*proposal/s);
assert.match(classify, /D10[\s\S]*verdict[\s\S]*unchanged/i);

// IS-3: report-note definition cited to LEDGERS.md §3.
assert.match(classify, /LEDGERS.md.*§3/);

// IS-2: audit-docs report contract — 14 checks, no MEDIUM.
const auditDocs = read("skills/audit-docs/SKILL.md");
assert.match(auditDocs, /Check \(1-14\)/);
assert.match(auditDocs, /Checks run: <n>\/14/);
assert.doesNotMatch(auditDocs, /MEDIUM/);

// IS-2: audit-docs citation in product-audit / AUDIT_DIMENSIONS.md — audit-docs owns the count.
const auditDimensions = read("skills/product-audit/references/AUDIT_DIMENSIONS.md");
assert.doesNotMatch(auditDimensions, /audit-docs checks 1–13/);
assert.match(auditDimensions, /run `audit-docs` checks mechanically/);

// IS-2: product-audit uses closed class set, not postpone/tradeoff.
const productAudit = read("skills/product-audit/SKILL.md");
assert.doesNotMatch(productAudit, /\bpostpone\b/);
assert.doesNotMatch(productAudit, /\btradeoff\b/);
assert.match(productAudit, /fix-now.*replan-in-unit.*decision-required.*proposal.*ignore|fix-now.*replan-in-unit/s);

// IS-2: PERSIST_AND_DECIDE.md finder-scale maps to canonical table, not ad-hoc.
assert.doesNotMatch(persist, /critical.*high.*major.*med.*minor.*low/s);
assert.match(persist, /canonical table.*CLASSIFY\.md|CLASSIFY\.md.*canonical table/s);

// IS-2: audit-pr closure-integrity scale is pass/blocker/n-a.
const auditPr = read("skills/audit-pr/SKILL.md");
assert.match(auditPr, /pass \/ blocker \/ n-a/);
assert.doesNotMatch(auditPr, /pass.*blocker.*warning.*n-a/);
assert.doesNotMatch(auditPr, /\bwarning\b.*blocker|\bblocker\b.*\bwarning\b/s);

// ── 15. Feature 32 (P4) — gate-run receipt pins ──────────────────────────────

// P4 Task 2: gate-ran@1 mark in LEDGERS.md.
assert.match(ledgers, /gate-ran@1/);
assert.match(ledgers, /GATE-RAN \|\s*HEAD/);
assert.match(ledgers, /additive slots|additive-slots|fields after.*additive|trailing.*slot/s);
assert.match(ledgers, /manifest.*slot|reserved.*slot.*manifest|manifest.*sha/s);
assert.match(ledgers, /identical-head|identical\s+head.*reuse|reuse.*identical.*head|changed.*head.*re-run/s);
assert.match(ledgers, /execute-phase:gate-ran-marks/);
assert.match(ledgers, /review-change:review-gate-ran-marks/);
assert.match(ledgers, /review-change:review-gate-ran-marks.*execute-phase:gate-ran-marks|execute-phase:gate-ran-marks.*review-change:review-gate-ran-marks/s);

// P4 Task 3: template projections — P8b: fix-template LEDGERS.md deleted;
// the live LEDGERS still carries the gate-ran recorder columns.
assert.match(ledgers, /execute-phase:gate-ran-marks/);
assert.match(ledgers, /review-change:review-gate-ran-marks/);
// Byte-equal owner cells: only the live LEDGERS row exists now.
const liveRow = ledgers.match(/review-findings.*?\|.*?scripts\/ledger-provenance/m);
assert.ok(liveRow, "live review-findings row exists");
assert.match(liveRow[0], /scripts\/ledger-provenance/);

// P4 Task 4: GATE-RAN in EXECUTION_CONTRACT.md and FOLDING.md.
assert.match(read("skills/execute-phase/references/EXECUTION_CONTRACT.md"), /gate-ran@1|GATE-RAN\s*\|/);
assert.match(read("skills/execute-phase/references/EXECUTION_CONTRACT.md"), /identical-head|identical\s+head.*reuse|reuse.*identical.*head|changed.*head.*re-run|gate-ran|GATE-RAN/s);
assert.match(read("skills/execute-phase/references/FOLDING.md"), /GATE-RAN/);
assert.match(read("skills/execute-phase/references/FOLDING.md"), /LEDGERS\.md.*gate-ran|gate-ran.*LEDGERS\.md/s);

// P4 Task 4: GATE-RAN in PERSIST_AND_DECIDE.md.
assert.match(persist, /GATE-RAN/);
assert.match(persist, /LEDGERS\.md.*gate-ran|gate-ran.*LEDGERS\.md/s);

// P4 Task 5: isMarkRow recognizes GATE-RAN (triage F24, triage F14 pin).
const unitRouteSource = read("scripts/unit-route.mjs");
// isMarkRow must contain the GATE-RAN pattern
assert.match(unitRouteSource, /export const isMarkRow[\s\S]*?GATE-RAN/);

// Triage 32 F31: the four mark-id enumerations name GATE-RAN alongside VF-/REVIEW-RAN,
// so the documented contract agrees with the guard widened above.
assert.match(unitRouteSource, /`VF-<n>` carries a finding's verification signature[\s\S]*?`GATE-RAN` a gate run's/);
assert.match(read("scripts/workflow-status.mjs"), /Mark rows \(`VF-<n>`, `REVIEW-RAN`, `GATE-RAN`\)/);
assert.match(read("skills/workflow-status/references/SENSOR_SIGNALS.md"), /`GATE-RAN` \(a gate-run mark\)/);
// P8b: replan-findings deleted; skip its mark assertions.
const replanFindings = safeRead("skills/replan-findings/SKILL.md");
if (replanFindings) {
  assert.match(replanFindings, /`VF-<n>`, `REVIEW-RAN` and\n\s*`GATE-RAN` are marks/);
}

// ── 13. Planning-side loop carriers (feature 31, D-31-6/E-D31-14) ────────────
//
// The planning-side loop rules are code, not prose: this block reads the
// carriers directly, so a regression of any rule fails here even when the
// superseded sentences are gone. The existing code-side assertions above stay
// byte-unchanged (AC8's no-weakening walk).

const preExecutionSource = read("packages/agentic-workflow-schema/src/pre-execution.ts");
const preExecutionContract = read("packages/agentic-workflow-schema/src/pre-execution-contract.ts");
const workflowIndex = read("packages/agentic-workflow-schema/src/index.ts");
const snapshotScript = read("scripts/pre-execution-snapshot.mjs");
const statusScript = read("scripts/workflow-status.mjs");

// 13a. The materiality predicate is a closed `medium`+ membership test, and the
// negated `info` comparison is gone.
assert.match(preExecutionSource, /MATERIAL_FINDING_SEVERITIES/);
assert.match(preExecutionSource, /"medium", "high", "critical"/);
assert.doesNotMatch(preExecutionSource, /severity !== "info"/);
assert.match(preExecutionContract, /material = `medium`/);
assert.match(preExecutionContract, /report-note/);
assert.match(preExecutionContract, /reproducerChars/);

// 13b. The orchestrator refuses past the two-cycle cap with the human route.
assert.match(workflowIndex, /stop-review-loop-cap/);
assert.match(workflowIndex, /reviewLoopCycles/);

// 13c. The CLI's verify report carries the wording-only route.
assert.match(snapshotScript, /parseWordingOnlyDeterminations/);
assert.match(snapshotScript, /wordingOnly/);

// 13d. The sensor projects the derived count and never references the decider
// (feature 38 A:12).
assert.match(statusScript, /review_loop_cycles/);
assert.match(statusScript, /deriveReviewLoopCycles/);
assert.doesNotMatch(statusScript, /decideWorkflowAction/);

console.log("PASS review-loop-discipline: the review→fold loop is bounded end to end");
