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

test("plan-fix preserves the complete multi-issue unit in its hand-off", () => {
  const skill = readSkill("plan-fix");
  const process = readReference("plan-fix", "PLANNING_PROCESS.md");

  assert.match(skill, /Issue set: #<primary> \+ #<n2> \+ #<n3>/);
  assert.match(skill, /print every issue in this unit/);
  assert.match(skill, /Replace every placeholder with the complete actual issue set/);
  assert.match(process, /MULTI-ISSUE MERGE — #<primary> \+ #<n2> \+ #<n3>/);
  assert.match(process, /Replace the placeholders with every actual issue number/);
});

test("plan-feature preserves every dependency in a blocked hand-off", () => {
  const skill = readSkill("plan-feature");

  assert.match(skill, /Dependency chain \(deepest first\): <deepest> \+ <dependency> \+ <NN>/);
  assert.match(skill, /build the\s+complete dependency chain first: <deepest> \+ <dependency> \+ <NN>/);
  assert.match(skill, /never print `…`/);
});

test("execute-phase terminal hand-offs recommend the review before the fold (fix #191)", () => {
  const unitLoop = readReference("execute-phase", "UNIT_LOOP.md");
  const folding = readReference("execute-phase", "FOLDING.md");
  const closeout = readReference("execute-phase", "CLOSEOUT.md");
  const skill = readSkill("execute-phase");

  // Every terminal block leads with /review-change — the mandatory end review.
  assert.match(unitLoop, /→ Next: \/review-change/);
  assert.match(folding, /→ Next: \/review-change/);
  assert.match(closeout, /`?\/review-change`? → `?\/fold-findings`?/);
  // Positive pin: CLOSEOUT hand-off sentence preserves review→fold order.
  assert.match(closeout, /\`?\/review-change\`?.*mandatory.*\`?\/fold-findings\`?/);

  // The fold is never the first leg — review-change precedes any fold step.
  assert.doesNotMatch(unitLoop, /\/fold-findings, then re-run \/review-change/);
  assert.doesNotMatch(folding, /\/fold-findings, then re-run \/review-change/);
  // Tolerate backtick / optional newline between hand-off words and the fold token.
  // Regex: backtick is a literal char in regex, `?` makes it optional, /? handles `→ /` vs `→ /`.
  assert.doesNotMatch(closeout, /hand\s+off\s+to\s+`?\/fold-findings/);

  // "mandatory" labels the review, never the fold hand-off.
  // Catches both `mandatory /fold-findings` and `mandatory `/fold-findings``.
  assert.doesNotMatch(skill, /mandatory\s+`?\/fold-findings/);
  assert.doesNotMatch(closeout, /mandatory\s+`?\/fold-findings/);
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
