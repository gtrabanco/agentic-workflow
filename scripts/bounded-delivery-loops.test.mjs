#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const execute = read("skills/execute-phase/SKILL.md");
const unitLoop = read("skills/execute-phase/references/UNIT_LOOP.md");
const findingPolicy = read("skills/execute-phase/references/OPPORTUNISTIC_FINDING.md");
const planFix = read("skills/plan-fix/references/PLANNING_PROCESS.md");
const fold = read("skills/fold-findings/references/FOLD_PROCESS.md");
const loopEntry = read("skills/loop-review-fold/SKILL.md");
const triage = read("skills/triage-issue/SKILL.md");
const findingTriage = read("skills/triage-issue/references/REVIEW_FINDING_PROCESS.md");
const verification = read("skills/verification-contract/SKILL.md");
const planFeature = read("skills/plan-feature/SKILL.md");
const workflowStatus = read("skills/workflow-status/SKILL.md");
const discovery = read("skills/discover-repository-state/SKILL.md");
const resolution = read("skills/resolve-repository-state/SKILL.md");
const roadmap = read("docs/features/ROADMAP.md");
const shipAdvance = read("skills/ship-roadmap/references/ADVANCE.md");
const plugin = JSON.parse(read(".claude-plugin/plugin.json"));

assert.match(execute, /unit loop.*default when `P<n>` is omitted/s);
assert.match(execute, /explicit phase.*exactly that phase/s);
assert.match(unitLoop, /Default `--max-attempts 3`/);
assert.match(unitLoop, /Do \*\*not\*\* stop for intermediate review/);
assert.match(unitLoop, /NO-PROGRESS\|ATTEMPT-BUDGET/);
assert.match(planFeature, /Next: \/execute-phase <NN> — execute every remaining phase/);
assert.match(workflowStatus, /`planned` → `\/execute-phase <NN>`/);
assert.match(discovery, /implementation-ready feature → \/execute-phase <NN>\n/);
assert.match(resolution, /implementation was interrupted → \/execute-phase <NN>\n/);
assert.match(roadmap, /Next action: `\/execute-phase <NN>`/);
assert.match(shipAdvance, /Stop before the literal final `Hardening & PR` phase/);
assert.match(shipAdvance, /\*\*PR\*\* — run the unit's explicit final `Hardening & PR` phase/);

assert.match(planFix, /Capability bundle/);
assert.match(planFix, /Homogeneous mechanical batch/);
assert.match(planFix, /Shared files, one root cause, and equal severities.*not requirements/s);
assert.match(planFix, /fewest maximal\s+compatible groups/s);

assert.match(findingPolicy, /\*\*Proposal\*\*/);
assert.doesNotMatch(findingPolicy, /\*\*Create Issue\*\*/);
assert.match(findingPolicy, /No automatic `gh issue create`/);

assert.match(fold, /fewest atomic correction groups/);
assert.match(fold, /one `FOLDED <same-sha>` line per\s+member/s);
assert.match(fold, /never edit classification or create an\s+issue/s);

assert.match(loopEntry, /Triggers: "loop-review-fold"/);
assert.match(loopEntry, /review-change ── findings ──▶ fold-findings/);
assert.match(loopEntry, /## When to use/);
assert.match(loopEntry, /## Step 0 — Discover the project \(always first\)/);
assert.match(loopEntry, /Apply this first-match table exactly/);
assert.match(loopEntry, /## Guardrails/);
assert.match(loopEntry, /## Relationship to other skills/);
assert.match(loopEntry, /The loop ends at the first `PASS`, blocked\s+prerequisite, unresolved finding/);
assert.match(loopEntry, /TRIAGE-REQUIRED/);
assert.match(loopEntry, /triage-issue --prioritize-now/);
assert.match(loopEntry, /plan-feature <slug>/);
assert.match(loopEntry, /plan-fix <issue-number>/);
assert.match(loopEntry, /execute those phases manually/);
assert.match(triage, /--prioritize-now <unit> F<k>/);
assert.match(triage, /Review findings/);
assert.match(triage, /new `P<n>` phases/);
assert.match(findingTriage, /complete correction that fits the current unit/);
assert.match(findingTriage, /too large for the current fold/);
assert.match(findingTriage, /execute.*phases.*manually/);

assert.match(verification, /Status: frozen/);
assert.match(verification, /git hash-object/);
assert.match(verification, /deleting, skipping, narrowing, or loosening a validator/);

const pluginSkills = plugin.skills.map((entry) => entry.replace("./skills/", ""));
assert.ok(!pluginSkills.includes("bump-skill"), "bump-skill is repository-internal and must not be distributed");
assert.ok(!pluginSkills.includes("plan-feature-interview"), "plan-feature-interview is retired and must not be distributed");
assert.equal(fs.existsSync(path.join(root, "skills", "plan-feature-interview")), false,
  "retired plan-feature-interview must remain absent from the source tree");
assert.match(read("skills/bump-skill/SKILL.md"), /^user-invocable: false$/m);
assert.match(read("skills/bump-skill/SKILL.md"), /^  internal: true$/m);
for (const requiredDependency of [
  "loop-review-fold",
  "orchestration-envelope",
  "phase-contract",
  "planning-preflight",
  "verification-contract",
]) {
  assert.ok(pluginSkills.includes(requiredDependency), `${requiredDependency} must be distributed by plugin.json`);
}
for (const distributedSkill of pluginSkills) {
  assert.doesNotMatch(read(`skills/${distributedSkill}/SKILL.md`), /^metadata:\n  internal: true$/m,
    `${distributedSkill} must remain discoverable by the skills CLI`);
}
assert.deepEqual(pluginSkills, [...pluginSkills].sort(), "plugin skills must stay alphabetical");

console.log("PASS bounded delivery loop contracts");
