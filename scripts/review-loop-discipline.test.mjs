#!/usr/bin/env node

// Fix #159 — the review→fold loop must terminate. Pins the four loop killers
// to their owning skill text:
//   1. materiality survives classification and the decision (low = report-only)
//   2. workspace state is a precondition, not a persisted finding
//   3. folded rows are re-verified, not re-reported
//   4. loop-review-fold is bounded at two review→fold cycles per unit
// plus the plan-time prevention rules and the planning-review resolution map.

import assert from "node:assert/strict";
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

console.log("PASS review-loop-discipline: the review→fold loop is bounded end to end");
