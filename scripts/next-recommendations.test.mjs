#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readSkill = (name) =>
  fs.readFileSync(path.join(repoRoot, "skills", name, "SKILL.md"), "utf8");
const readReference = (skill, name) =>
  fs.readFileSync(path.join(repoRoot, "skills", skill, "references", name), "utf8");

test("multi-issue and dependency hand-offs keep the complete-ID rule in their surviving owners", () => {
  // Feature 61 P8b: plan-fix/plan-feature are retired; the complete-ID rule
  // they pinned is owned by triage-issue and fold-findings (verified live).
  const triage = readSkill("triage-issue");
  const fold = readSkill("fold-findings");
  assert.match(triage + fold, /#<primary> \+ #<n2> \+ #<n3>|F1 \+ F2 \+|joined with ` \+ `/);
  assert.match(fold, /Every affected finding ID is named in that block, joined with ` \+ `/);
});

test("dependency chains keep the no-ellipsis rule in the sensor and the lane conductor", () => {
  // Feature 61 P8b: the dependency-chain hand-off wording moved with the router.
  const sensor = readSkill("workflow-status");
  const conductor = readSkill("unit-lane");
  assert.match(sensor + readReference("workflow-status", "SENSOR_CORE.md"), /alternatives|runner-up|next command/, "the sensor publishes the runner-up commands");
  assert.match(conductor, /→ Next:/, "the conductor prints a concrete next command, never an ellipsis");
});

test("execute-phase terminal hand-offs recommend the review before the fold (fix #191)", () => {
  // Feature 61 P4 retired UNIT_LOOP.md/CLOSEOUT.md — the surviving terminal
  // surfaces are the SKILL.md closing block and FOLDING.md.
  const folding = readReference("execute-phase", "FOLDING.md");
  const skill = readSkill("execute-phase");

  // Every terminal block leads with /review-change — the mandatory end review.
  assert.match(skill, /→ Next: \/review-change|review-change \(mandatory end review\)/);
  assert.match(folding, /→ Next: \/review-change|→ \/review-change|review-change/);
  // Positive pin: the review→fold order is preserved in the surviving text.
  assert.match(folding + skill, /review-change.*fold-findings|REVIEW-FAIL.*fold-findings/s);
  // The fold is never the first leg — review-change precedes any fold step.
  assert.doesNotMatch(folding, /\/fold-findings, then re-run \/review-change/);
  // "mandatory" labels the review, never the fold hand-off.
  assert.doesNotMatch(skill, /mandatory\s+`?\/fold-findings/);
});

test("review and fold hand-offs preserve every finding ID", () => {
  const review = readReference("review-change", "PERSIST_AND_DECIDE.md");
  const reviewSkill = readSkill("review-change");
  const fold = readSkill("fold-findings");

  assert.match(reviewSkill, /list every open finding ID/);
  assert.match(review, /all open fix-now findings: <F1> \+ <F2> \+ <F3>/);
  assert.match(review, /resolve all open findings: <F1> \+ <F2> \+ <F3>/);
  assert.match(fold, /list every affected finding ID once as `F1 \+ F2 \+ …`/);
  assert.match(fold, /never\s+print `<F2>`, `…`, or a single representative ID/);
});

test("review-change review-end boundary (fix #191 extension)", () => {
  const reviewSkill = readSkill("review-change");
  const output = readReference("review-change", "OUTPUT_AND_GUARDRAILS.md");
  const review = readReference("review-change", "PERSIST_AND_DECIDE.md");
  const process = readReference("review-change", "REVIEW_PROCESS.md");

  // C1 — the review-end turn boundary box is present: the skill ends at the
  // report on REVIEW-FAIL/NEEDS-DECISION and never self-invokes a fold/executor.
  assert.match(reviewSkill, /ends at the report/);
  assert.match(reviewSkill, /separate user-initiated invocations/);

  // C2 — folder destination phrasing: the review never runs the fold itself.
  assert.doesNotMatch(reviewSkill, /folds in-unit/);
  assert.match(reviewSkill, /never run by this review/);

  // C4 — routing phrasing: fold is invoked after this review ends, not in-review.
  assert.doesNotMatch(output, /folded into the current phase/);
  assert.match(output, /invoked after this review ends/);

  // C3 — the → Next: recommendation is a hand-off, not a to-do list for this turn.
  assert.match(review, /recommendation, not a to-do list/);

  // C5 — two-cycle re-runs are separate review invocations, not in-session steps.
  assert.match(process, /separate review invocations/);
});

test("batch triage maps each issue to its own next command", () => {
  const skill = readSkill("triage-issue");

  assert.match(skill, /apply every verdict: #<n1> → <command> \+ #<n2> → <command> \+ #<n3> → <command>/);
  assert.match(skill, /never collapses to one generic action/);
  assert.match(skill, /Replace every placeholder with every actual issue\/finding ID/);
});

test("product audit and triage preserve complete finding sets", () => {
  const productAudit = readSkill("product-audit");
  // Fix #161: the review/fold router is retired; the complete-finding-set
  // guarantee lives with the manual path's triage step.
  const loop = readSkill("triage-issue");

  assert.match(productAudit, /Finding set: F<k> \+ F<j> \+ F<m>/);
  assert.match(productAudit, /complete actual set/);
  assert.match(loop, /issue\/finding ID to its own\s+next command, joined with ` \+ `/);
  assert.match(loop, /Replace every placeholder with every actual issue\/finding ID/);
  assert.match(loop, /never collapses to one generic action/);
  assert.match(loop, /triage-issue --prioritize-now/);
});

console.log("PASS next recommendations: complete issue, dependency, and finding sets are required");
