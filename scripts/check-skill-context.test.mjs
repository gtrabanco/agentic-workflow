#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const createFixture = () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-context-check-"));
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

const runFixtureRoute = (label, setup, expected) => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-route-check-"));
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

console.log("PASS context checker: nested, missing, unreachable, heading, budget, argument, route, and route-reference failures rejected");
