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

console.log("PASS context checker: nested, missing, unreachable, heading, budget, and argument failures rejected");
