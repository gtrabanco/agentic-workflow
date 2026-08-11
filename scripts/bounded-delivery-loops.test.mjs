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
const loopProcess = read("skills/loop-review-fold/references/LOOP_PROCESS.md");
const loop = read("skills/loop-review-fold/references/LOOP_POLICY.md");
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
assert.match(loopEntry, /not a skill-authoring or\s+installation task/);
assert.match(loopEntry, /## When to use/);
assert.match(loopEntry, /## Step 0 — Discover and execute the target \(always first\)/);
assert.match(loopEntry, /Do not create, edit, install, or merely\s+inventory this skill/);
assert.match(loopEntry, /Reading the references alone is not completion/);
assert.match(loopEntry, /## Guardrails/);
assert.match(loopEntry, /## Relationship to other skills/);
assert.match(loopEntry, /thin state router/);
assert.match(loopProcess, /Select the first action/);
assert.match(loopProcess, /no clean current pass receipt .*any `class: fix-now`, `folded: no` row → invoke/s);
assert.match(loopProcess, /must not spend a new review first/);
assert.match(loopProcess, /no clean current pass receipt \+ no open fix-now rows → invoke/);
assert.match(loopProcess, /A\s+successful fold always reviews the changed HEAD/);
assert.match(loopProcess, /selected `first_action` only in the turn state/);
assert.match(loop, /open `class: fix-now`, `folded: no` rows/);
assert.match(loop, /first action: PASS\|FOLD\|REVIEW/);
const firstAction = loopProcess.slice(
  loopProcess.indexOf("2. **Select the first action."),
  loopProcess.indexOf("3. **Initialize receipts."),
);
assert.ok(
  firstAction.indexOf("current exact-SHA") < firstAction.indexOf("`fold-findings` first")
    && firstAction.indexOf("`fold-findings` first") < firstAction.indexOf("`review-change` first"),
  "first-action order must be PASS, fold-findings, then review-change",
);

for (const state of ["PASS", "NEEDS-DECISION", "BLOCKED", "NO-PROGRESS", "BUDGET-EXHAUSTED"]) {
  assert.match(loop, new RegExp(`\\b${state}\\b`));
}
assert.match(loop, /Default correction budget is two/);
assert.match(loop, /Same HEAD may never enter review twice/);

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
for (const requiredDependency of ["loop-review-fold", "phase-contract", "planning-preflight", "verification-contract"]) {
  assert.ok(pluginSkills.includes(requiredDependency), `${requiredDependency} must be distributed by plugin.json`);
}
for (const distributedDependency of ["phase-contract", "planning-preflight", "verification-contract"]) {
  assert.doesNotMatch(read(`skills/${distributedDependency}/SKILL.md`), /^metadata:\n  internal: true$/m,
    `${distributedDependency} must remain discoverable by the skills CLI`);
}
assert.deepEqual(pluginSkills, [...pluginSkills].sort(), "plugin skills must stay alphabetical");

console.log("PASS bounded delivery loop contracts");
