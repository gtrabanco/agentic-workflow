#!/usr/bin/env node

// Fix #159 — the review→fold loop must terminate. Pins the four loop killers
// to their owning skill text:
//   1. materiality survives classification and the decision (low = report-only)
//   2. workspace state is a precondition, not a persisted finding
//   3. folded rows are re-verified, not re-reported
//   4. loop-review-fold is bounded at two review→fold cycles per unit
// plus the plan-time prevention rules and the planning-review resolution map.

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const classify = read("skills/review-implementation/references/CLASSIFY.md");
const reviewProcess = read("skills/review-change/references/REVIEW_PROCESS.md");
const persist = read("skills/review-change/references/PERSIST_AND_DECIDE.md");
const outputGuardrails = read("skills/review-change/references/OUTPUT_AND_GUARDRAILS.md");
const loop = read("skills/loop-review-fold/SKILL.md");
const verification = read("skills/verification-contract/SKILL.md");
const grounding = read("skills/evidence-grounding/SKILL.md");
const logSession = read("skills/log-session/SKILL.md");
const specOutput = read("skills/review-spec/references/OUTPUT.md");
const planOutput = read("skills/review-plan/references/OUTPUT.md");

// ── 1. Materiality survives classification and the decision ────────────────

assert.match(classify, /A `low` finding[^.]*is \*\*never persisted and never blocks\*\*/s);
assert.match(classify, /carried\s+as a report note/);
assert.match(classify, /classify it at `med` minimum/);
assert.match(classify, /deflating a real defect to `low` to unblock a review is itself a review defect/);

// The severity vocabulary is consistent end-to-end: finder scale maps onto the
// classification scale, and only high/med rows persist.
assert.match(persist, /finding of severity `high`\s+or `med`/);
assert.match(persist, /critical.*high.*major.*med.*minor.*low/s);
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
assert.match(persist, /On\s+`REVIEW-PASS` with an open PR no ledger write happens/);

// ── 3. Folded rows are re-verified, not re-reported ─────────────────────────

assert.match(reviewProcess, /Read the unit's fold ledger \(`review-findings\.md`\)/);
assert.match(reviewProcess, /state the cycle number/);
assert.match(reviewProcess, /every `folded: yes` row\s+is re-verified at its cited location/);
assert.match(reviewProcess, /regression of <id>/);
assert.match(reviewProcess, /CONVERGENCE-ANOMALY/);

// ── 4. The loop is bounded ──────────────────────────────────────────────────

assert.match(loop, /at most \*\*two\*\*\s+review→fold cycles/);
assert.match(loop, /A third cycle never\s+starts/);
assert.match(loop, /REVIEW-FOLD LOOP — PASS \| TRIAGE-REQUIRED \| BLOCKED/);

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

// Authoring never states a forward-looking claim as present fact (the
// "merged via PR #158" / "Closes #157" failure class).
assert.match(grounding, /A forward-looking claim stated as present fact/);
assert.match(grounding, /bind its verification\s+to the step that owns it/);

// Session logs state forge-verified status words only.
assert.match(logSession, /Status words .*are forge-verified/s);

// ── 7. Planning-review resolution map (class → resolver, one block) ─────────

for (const [name, text] of [["review-spec", specOutput], ["review-plan", planOutput]]) {
  assert.match(text, /`fold-findings` never repairs a planning artifact/, `${name}: fold boundary`);
  assert.match(text, /class `product` → `design-feature`/, `${name}: product route`);
  assert.match(text, /class `plan` → `plan-feature`/, `${name}: plan route`);
}
const foldRoute = /class `source` \|\s*`environment` \|\s*`runtime` → the\s+executor's fold path/;
assert.match(planOutput, foldRoute);
assert.match(specOutput, foldRoute);

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
const claudeGuide = read("CLAUDE.md");
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

console.log("PASS review-loop-discipline: the review→fold loop is bounded end to end");
