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

test("product audit and loop review preserve complete finding sets", () => {
  const productAudit = readSkill("product-audit");
  const loop = readSkill("loop-review-fold");

  assert.match(productAudit, /Finding set: F<k> \+ F<j> \+ F<m>/);
  assert.match(productAudit, /complete actual set/);
  assert.match(loop, /list each actual finding ID exactly\s+once joined with ` \+ `/);
  assert.match(loop, /Replace every placeholder, list each actual finding ID/);
  assert.match(loop, /never emit a literal ellipsis/);
  assert.match(loop, /triage-issue --prioritize-now/);
});

console.log("PASS next recommendations: complete issue, dependency, and finding sets are required");
