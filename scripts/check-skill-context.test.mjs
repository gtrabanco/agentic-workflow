#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const tmpBase = process.env.TMPDIR || "/var/tmp";
const mktemp = (prefix) => fs.mkdtempSync(path.join(tmpBase, prefix));

const createFixture = () => {
  const fixture = mktemp("agentic-context-check-");
  fs.cpSync(path.join(repoRoot, "skills"), path.join(fixture, "skills"), { recursive: true });
  fs.mkdirSync(path.join(fixture, "docs/workflow"), { recursive: true });
  fs.copyFileSync(
    path.join(repoRoot, "docs/workflow/SKILL_CONTEXT_BUDGETS.json"),
    path.join(fixture, "docs/workflow/SKILL_CONTEXT_BUDGETS.json"),
  );
  fs.mkdirSync(path.join(fixture, "scripts"), { recursive: true });
  fs.copyFileSync(path.join(repoRoot, "scripts/check-skill-context.mjs"), path.join(fixture, "scripts/check-skill-context.mjs"));
  return fixture;
};

const runFixture = (label, setup, expected) => {
  const fixture = createFixture();
  try {
    setup(fixture);
    const result = spawnSync(process.execPath, [path.join(fixture, "scripts/check-skill-context.mjs"), "--skill", "review-change"], {
      encoding: "utf8",
    });
    assert.notEqual(result.status, 0, `${label} should fail closed`);
    assert.match(`${result.stdout}\n${result.stderr}`, expected, label);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
};

const skillFile = (fixture) => path.join(fixture, "skills/review-change/SKILL.md");
const referencesDir = (fixture) => path.join(fixture, "skills/review-change/references");
const link = (fixture, name) => fs.appendFileSync(skillFile(fixture), `\nSee [fixture](references/${name}).\n`);

runFixture(
  "nested reference",
  (fixture) => {
    link(fixture, "subdir/leaf.md");
    fs.mkdirSync(path.join(referencesDir(fixture), "subdir"), { recursive: true });
    fs.writeFileSync(path.join(referencesDir(fixture), "subdir/leaf.md"), "# Nested\n");
  },
  /nested reference link exceeds depth 1/,
);

runFixture(
  "missing reference",
  (fixture) => link(fixture, "missing.md"),
  /linked reference is missing/,
);

runFixture(
  "unreachable reference",
  (fixture) => fs.writeFileSync(path.join(referencesDir(fixture), "orphan.md"), "# Orphan\n"),
  /unreachable reference/,
);

runFixture(
  "invalid heading",
  (fixture) => {
    link(fixture, "invalid.md");
    fs.writeFileSync(path.join(referencesDir(fixture), "invalid.md"), "Not a heading\n");
  },
  /first content line must be a heading/,
);

runFixture(
  "over-budget reference",
  (fixture) => {
    link(fixture, "huge.md");
    fs.writeFileSync(path.join(referencesDir(fixture), "huge.md"), `# Huge\n${"x".repeat(10_000)}\n`);
  },
  /estimate .* >|lines .* > /,
);

const badArgument = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--unknown"], { encoding: "utf8" });
assert.notEqual(badArgument.status, 0);
assert.match(`${badArgument.stdout}\n${badArgument.stderr}`, /Unknown argument/);

const missingSkill = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--skill", "does-not-exist"], { encoding: "utf8" });
assert.notEqual(missingSkill.status, 0);
assert.match(`${missingSkill.stdout}\n${missingSkill.stderr}`, /Skill entrypoint was not discovered/);

const manifestOnly = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--manifest-only"], { encoding: "utf8" });
assert.equal(manifestOnly.status, 0, manifestOnly.stderr);
assert.match(manifestOnly.stdout, /PASS context manifest/);

const bareSkill = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--skill"], { encoding: "utf8" });
assert.notEqual(bareSkill.status, 0);
assert.match(`${bareSkill.stdout}\n${bareSkill.stderr}`, /--skill requires a name/);

// Route tests

const manifestPath = path.join(repoRoot, "docs/workflow/SKILL_CONTEXT_BUDGETS.json");

const unknownRoute = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--routes", "--route", "does-not-exist"], { encoding: "utf8" });
assert.notEqual(unknownRoute.status, 0);
assert.match(`${unknownRoute.stdout}\n${unknownRoute.stderr}`, /Route not declared/);

const routeJson = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--routes", "--json"], { encoding: "utf8" });
assert.equal(routeJson.status, 0, routeJson.stderr);
const parsed = JSON.parse(routeJson.stdout);
assert(Array.isArray(parsed.routes), "JSON output should have routes array");
assert(parsed.routes.length > 0, "JSON output should have at least one route");

const routeTable = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--routes"], { encoding: "utf8" });
assert.equal(routeTable.status, 0, routeTable.stderr);
assert.match(routeTable.stdout, /PASS route budgets/);

const filteredRoute = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--routes", "--route", "plan-feature:scoped"], { encoding: "utf8" });
assert.equal(filteredRoute.status, 0, filteredRoute.stderr);
assert.match(filteredRoute.stdout, /plan-feature:scoped/);
assert(!filteredRoute.stdout.includes("plan-feature:issue"), "filtered route should not include other routes");

const bareRoute = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--route"], { encoding: "utf8" });
assert.notEqual(bareRoute.status, 0);
assert.match(`${bareRoute.stdout}\n${bareRoute.stderr}`, /--route requires a name/);

const routesBudgets = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--routes", "--budgets"], { encoding: "utf8" });
assert.equal(routesBudgets.status, 0, routesBudgets.stderr);
assert.match(routesBudgets.stdout, /PASS route budgets/);
assert.match(routesBudgets.stdout, /PASS context budgets/);

const bareBudgets = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--budgets"], { encoding: "utf8" });
assert.equal(bareBudgets.status, 0, bareBudgets.stderr);
assert.match(bareBudgets.stdout, /PASS context budgets/);

const runFixtureRouteBudgets = (label, setup, expected) => {
  const fixture = createFixture();
  try {
    setup(fixture);
    const result = spawnSync(process.execPath, [path.join(fixture, "scripts/check-skill-context.mjs"), "--routes", "--budgets"], { encoding: "utf8" });
    assert.notEqual(result.status, 0, `${label} should fail closed`);
    assert.match(`${result.stdout}\n${result.stderr}`, expected, label);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
};

runFixtureRouteBudgets(
  "route plus context budget failure",
  (fixture) => {
    const skillPath = path.join(fixture, "skills/workflow-status/SKILL.md");
    const body = fs.readFileSync(skillPath, "utf8");
    fs.writeFileSync(skillPath, `${body}\n${"x".repeat(12_000)}\n`);
  },
  /workflow-status: main estimate/,
);

const runFixtureRoute = (label, setup, expected) => {
  const fixture = mktemp("agentic-route-check-");
  try {
    fs.cpSync(path.join(repoRoot, "skills"), path.join(fixture, "skills"), { recursive: true });
    fs.mkdirSync(path.join(fixture, "docs/workflow"), { recursive: true });
    fs.mkdirSync(path.join(fixture, "scripts"), { recursive: true });
    fs.copyFileSync(path.join(repoRoot, "scripts/check-skill-context.mjs"), path.join(fixture, "scripts/check-skill-context.mjs"));
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    setup(manifest);
    fs.writeFileSync(path.join(fixture, "docs/workflow/SKILL_CONTEXT_BUDGETS.json"), JSON.stringify(manifest, null, 2));
    const result = spawnSync(process.execPath, [path.join(fixture, "scripts/check-skill-context.mjs"), "--routes"], { encoding: "utf8" });
    assert.notEqual(result.status, 0, `${label} should fail closed`);
    assert.match(`${result.stdout}\n${result.stderr}`, expected, label);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
};

runFixtureRoute(
  "route with unknown skill",
  (manifest) => { manifest.routes["test:bad"] = { skills: ["does-not-exist"], routeEstimateMax: null, routeLinesMax: null }; },
  /route references unknown skill/,
);

runFixtureRoute(
  "route budget regression",
  (manifest) => { manifest.routes["plan-feature:scoped"].routeEstimateMax = 10; },
  /route estimate .* >/,
);

runFixtureRoute(
  "route lines regression",
  (manifest) => { manifest.routes["plan-fix:issue"].routeLinesMax = 5; },
  /route lines .* >/,
);

runFixtureRoute(
  "route references for undeclared skill",
  (manifest) => { manifest.routes["test:badref"] = { skills: ["execute-phase"], references: { "review-change": ["HANDOFF.md"] }, templates: [], routeEstimateMax: null, routeLinesMax: null }; },
  /route declares references for undeclared skill/,
);

runFixtureRoute(
  "route references missing file",
  (manifest) => { manifest.routes["test:missingref"] = { skills: ["execute-phase"], references: { "execute-phase": ["NOPE.md"] }, templates: [], routeEstimateMax: null, routeLinesMax: null }; },
  /Missing file in route/,
);

runFixtureRoute(
  "route reference escapes references directory",
  (manifest) => { manifest.routes["test:escape"] = { skills: ["execute-phase"], references: { "execute-phase": ["../x.md"] }, templates: [], routeEstimateMax: null, routeLinesMax: null }; },
  /route reference must be a flat file name/,
);

// Execute route selection: each mode route records exactly one workflow resource.

{
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const executeRefsDir = path.join(repoRoot, "skills/execute-phase/references");
  for (const mode of ["feature", "small", "fix", "legacy"]) {
    const refs = manifest.routes[`execute-phase:${mode}`].references["execute-phase"];
    assert.equal(refs.filter((n) => n.startsWith("WORKFLOWS_")).length, 1, `execute-phase:${mode} must select exactly one workflow resource`);
    for (const name of refs) assert(fs.existsSync(path.join(executeRefsDir, name)), `missing referenced file: ${name}`);
  }
  const finalPrRefs = manifest.routes["execute-phase:final-pr"].references["execute-phase"];
  assert.equal(finalPrRefs.filter((n) => n.startsWith("WORKFLOWS_")).length, 0, "final-pr must not select a mode workflow");
}

// Policy route selection: final-pr, descope, and finding each record only its
// required policy resource (forge body / descope / opportunistic finding).

{
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const policyFiles = ["FORGE_BODY.md", "DESCOPE.md", "OPPORTUNISTIC_FINDING.md"];
  const policyFor = {
    "execute-phase:final-pr": "FORGE_BODY.md",
    "execute-phase:descope": "DESCOPE.md",
    "execute-phase:finding": "OPPORTUNISTIC_FINDING.md",
  };
  const executeRefsDir = path.join(repoRoot, "skills/execute-phase/references");
  for (const [route, expected] of Object.entries(policyFor)) {
    const refs = manifest.routes[route].references["execute-phase"];
    const selected = refs.filter((n) => policyFiles.includes(n));
    assert.equal(selected.length, 1, `${route} must record exactly one policy resource`);
    assert.equal(selected[0], expected, `${route} must record its required policy resource`);
    for (const name of refs) assert(fs.existsSync(path.join(executeRefsDir, name)), `missing referenced file: ${name}`);
  }
  assert.ok(!manifest.routes["execute-phase:final-pr"].references["execute-phase"].includes("DESCOPE.md"), "final-pr must not load descope");
  assert.ok(!manifest.routes["execute-phase:final-pr"].references["execute-phase"].includes("OPPORTUNISTIC_FINDING.md"), "final-pr must not load finding policy");
  assert.ok(!fs.existsSync(path.join(executeRefsDir, "ISSUE_POLICY.md")), "ISSUE_POLICY.md must be split");
}

// P3-4 (read-verified): every pre-consolidation universal safety box (11 boxes
// at the compact Turn contract, `5c71105^`) must be (a) preserved in the compact
// contract and (b) map to exactly one unique owner resource that carries its
// normative detail. The box line stays resident in SKILL.md; the owner carries
// the authority.

{
  const contract = fs.readFileSync(path.join(repoRoot, "skills/orchestration-envelope/references/TURN_CONTRACT.md"), "utf8");
  const boxLines = contract.split("\n").filter((l) => /^✓ \d+\./.test(l));
  assert.equal(boxLines.length, 11, "canonical Turn contract must preserve all 11 safety boxes");

  const executeRefsDir = path.join(repoRoot, "skills/execute-phase/references");
  const owners = [
    { box: "Branch verified FIRST", owner: "EXECUTION_CONTRACT.md", marker: "## Branch" },
    { box: "All pre-edit gates (phase-lint, architectural invariants, dependency) RUN", owner: "PREFLIGHT.md", marker: "## Phase-lint pre-flight guard" },
    { box: "`git add`, `git commit -m", owner: "EXECUTION_CONTRACT.md", marker: "Docs COMMITTED with the phase" },
    { box: "Unit finished (single-pass/--fix/final phase)", owner: "CLOSEOUT.md", marker: "gh pr create" },
    { box: "Clean-tree check LAST (`git status --porcelain` RUN", owner: "FOLDING.md", marker: "git status --porcelain" },
    { box: "Artifact language: explicit user > project docs > English", owner: "FORGE_BODY.md", marker: "Language precedence" },
    { box: "Descope guard applied to every issue created this turn", owner: "DESCOPE.md", marker: "## Descope guard" },
    { box: "Out-of-scope findings classified per Opportunistic finding policy", owner: "OPPORTUNISTIC_FINDING.md", marker: "## Opportunistic finding policy" },
    { box: "Closing `→ Next:` block printed as ABSOLUTE last output", owner: "CLOSEOUT.md", marker: "→ Next:" },
    { box: "Machine result emitted if driver requested", owner: "EXECUTION_CONTRACT.md", marker: "## Normalized Repository State" },
    { box: "No reconstruction from memory — missing reference → STOP", owner: "EXECUTION_CONTRACT.md", marker: "## Architectural invariants" },
  ];
  assert.equal(new Set(owners.map((o) => o.box)).size, 11, "owner map must designate exactly one owner per box");
  for (const { box, owner, marker } of owners) {
    assert(boxLines.some((l) => l.includes(box)), `box preserved in compact contract: ${box}`);
    const ownerText = fs.readFileSync(path.join(executeRefsDir, owner), "utf8");
    assert(ownerText.includes(marker), `${owner} must carry the normative detail for "${box}" (missing marker: "${marker}")`);
  }
}

// P3-4 (observable behavior): route-specific contracts stay out of unrelated
// routes and every execute route still PASSes on its own with unchanged
// observable outcomes.

{
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const executeRefsDir = path.join(repoRoot, "skills/execute-phase/references");
  const modeWorkflow = {
    feature: "WORKFLOWS_FEATURE.md",
    small: "WORKFLOWS_SMALL_PHASED.md",
    fix: "WORKFLOWS_FIX.md",
    legacy: "WORKFLOWS_LEGACY.md",
  };
  const policyFiles = ["FORGE_BODY.md", "DESCOPE.md", "OPPORTUNISTIC_FINDING.md"];
  for (const [mode, workflow] of Object.entries(modeWorkflow)) {
    const refs = manifest.routes[`execute-phase:${mode}`].references["execute-phase"];
    assert.ok(refs.includes(workflow), `execute-phase:${mode} must load ${workflow}`);
    for (const name of refs) {
      if (name.startsWith("WORKFLOWS_")) assert.equal(name, workflow, `execute-phase:${mode} must not load other mode workflows`);
      assert.ok(!policyFiles.includes(name), `execute-phase:${mode} must not load policy files`);
    }
  }
  for (const route of ["execute-phase:final-pr", "execute-phase:descope", "execute-phase:finding"]) {
    const refs = manifest.routes[route].references["execute-phase"];
    assert.equal(refs.filter((n) => n.startsWith("WORKFLOWS_")).length, 0, `${route} must not load a mode workflow`);
    for (const name of refs) assert(fs.existsSync(path.join(executeRefsDir, name)), `missing referenced file: ${name}`);
  }
  for (const mode of ["feature", "small", "fix", "legacy", "final-pr", "descope", "finding"]) {
    const res = spawnSync(process.execPath, [path.join(repoRoot, "scripts/check-skill-context.mjs"), "--routes", "--route", `execute-phase:${mode}`], { encoding: "utf8" });
    assert.equal(res.status, 0, `execute-phase:${mode} must still PASS: ${res.stderr}`);
    assert.ok(res.stdout.includes(`execute-phase:${mode}`), `execute-phase:${mode} must appear in its own route output`);
  }
}

console.log("PASS context checker: nested, missing, unreachable, heading, budget, argument, route, and route-reference failures rejected");
