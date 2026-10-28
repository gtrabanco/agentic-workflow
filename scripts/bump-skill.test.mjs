#!/usr/bin/env node
/**
 * RED-first corpus for skills/bump-skill/scripts/bump-skill.mjs (feature 40, issue #180).
 *
 * Covers the issue's "Tests first" bullets:
 *   - Automated bump on skill change (version applied mechanically)
 *   - Patch bump for wording-only changes; minor for new skills/sections;
 *     major for breaking changes (rename) with the migration-note requirement
 *
 * The script is the deterministic half of `bump-skill` (issue #180 amendment):
 * it applies `version:` + the CHANGELOG per-skill rows atomically, infers the
 * bump level from the git diff (printing its derivation) and accepts --level
 * to override. README cells / argument-hint / bundle:skills are reported, not
 * written (no mechanical edit can make them correctly).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(repoRoot, "skills/bump-skill/scripts/bump-skill.mjs");

const run = (args, cwd = repoRoot) =>
  spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });

/** Build a throwaway repo with one skill and the real CHANGELOG skeleton. */
function fixture({ skill = "alpha", version = "1.2.3", internal = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "bump-skill-fixture-"));
  const skillDir = path.join(root, "skills", skill);
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    [
      "---",
      `name: ${skill}`,
      `user-invocable: ${internal ? "false" : "true"}`,
      `version: ${version}`,
      "metadata:",
      "  internal: true",
      "description: >",
      "  Fixture skill used to test the deterministic bump script.",
      "---",
      "",
      "## When to use",
      "",
      "Fixture body with some wording that can be edited in tests.",
      "",
      "## Done when",
      "",
      "- the fixture passes",
      "",
      "→ Next: nothing — fixture.",
      "",
    ].join("\n"),
  );
  const changelog = [
    "# Changelog",
    "",
    "## Per-skill version history",
    "",
    "### Companion npm packages",
    "",
    "#### [`@t/pi`](packages/pi/)",
    "| Version | Date | Type | What changed |",
    "|---|---|---|---|",
    "| 0.1.0 | 2026-01-01 | minor | first |",
    "",
    "### User-facing",
    "",
    "#### `beta`",
    "| Version | Date | Type | What changed |",
    "|---|---|---|---|",
    "| 0.9.0 | 2026-01-01 | minor | first |",
    "",
    "### Internal (`user-invocable: false`)",
    "",
    "| Skill | Version | Date | Type | What changed |",
    "|---|---|---|---|---|",
    `| \`${skill}\` | ${version} | 2026-01-01 | — | First versioned release |`,
    "",
  ].join("\n");
  fs.writeFileSync(path.join(root, "CHANGELOG.md"), changelog);
  return root;
}

const read = (root, rel) => fs.readFileSync(path.join(root, rel), "utf8");

test("bump-skill applies a patch bump to version + one changelog row", () => {
  const root = fixture();
  const result = run(["alpha", "--level", "patch", "--date", "2026-10-28", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(read(root, "skills/alpha/SKILL.md"), /^version: 1\.2\.4$/m);
  const changelog = read(root, "CHANGELOG.md");
  const rows = changelog
    .split("\n")
    .filter((line) => line.startsWith("| `alpha` | 1.2.4 "));
  assert.equal(rows.length, 1, `expected exactly one alpha 1.2.4 row, got: ${rows}`);
  assert.match(rows[0], /\| `alpha` \| 1\.2\.4 \| 2026-10-28 \| patch \|/);
  // newest row first inside the combined internal table
  assert.ok(changelog.indexOf("| `alpha` | 1.2.4 |") < changelog.indexOf("| `alpha` | 1.2.3 |"));
  assert.match(result.stdout, /1\.2\.3 → 1\.2\.4/);
});

test("bump-skill never touches anything but the version: line in the SKILL.md", () => {
  const root = fixture();
  const before = read(root, "skills/alpha/SKILL.md")
    .replace(/^version: .*$/m, "version: X");
  run(["alpha", "--level", "minor", "--date", "2026-10-28", "--root", root]);
  const after = read(root, "skills/alpha/SKILL.md").replace(/^version: .*$/m, "version: X");
  assert.equal(after, before);
});

test("infers level from the diff with derivation printed (wording-only → patch)", () => {
  const root = fixture({ version: "1.0.0" });
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "t@t"], { cwd: root });
  execFileSync("git", ["config", "user.name", "t"], { cwd: root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  const skillPath = path.join(root, "skills/alpha/SKILL.md");
  fs.writeFileSync(
    skillPath,
    read(root, "skills/alpha/SKILL.md").replace(
      "Fixture body with some wording that can be edited in tests.",
      "Fixture body with reworded, clarified phrasing in tests.",
    ),
  );
  const result = run(["alpha", "--date", "2026-10-28", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /inferred level: patch/);
  assert.match(read(root, "skills/alpha/SKILL.md"), /^version: 1\.0\.1$/m);
});

test("--level overrides the inference", () => {
  const root = fixture({ version: "1.0.0" });
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "t@t"], { cwd: root });
  execFileSync("git", ["config", "user.name", "t"], { cwd: root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  const skillPath = path.join(root, "skills/alpha/SKILL.md");
  fs.writeFileSync(
    skillPath,
    read(root, "skills/alpha/SKILL.md").replace(
      "Fixture body with some wording that can be edited in tests.",
      "Fixture body with reworded, clarified phrasing in tests.",
    ),
  );
  const result = run(["alpha", "--level", "minor", "--date", "2026-10-28", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /overridden to minor/);
  assert.match(read(root, "skills/alpha/SKILL.md"), /^version: 1\.1\.0$/m);
});

test("a new section classifies minor", () => {
  const root = fixture({ version: "1.0.0" });
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "t@t"], { cwd: root });
  execFileSync("git", ["config", "user.name", "t"], { cwd: root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  const skillPath = path.join(root, "skills/alpha/SKILL.md");
  fs.writeFileSync(
    skillPath,
    read(root, "skills/alpha/SKILL.md").replace(
      "## Done when",
      "## Portability\n\nNo slash menu — follow this file directly.\n\n## Done when",
    ),
  );
  const result = run(["alpha", "--date", "2026-10-28", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /inferred level: minor/);
  assert.match(read(root, "skills/alpha/SKILL.md"), /^version: 1\.1\.0$/m);
});

test("a rename classifies major and requires the migration note", () => {
  const root = fixture({ version: "1.0.0" });
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "t@t"], { cwd: root });
  execFileSync("git", ["config", "user.name", "t"], { cwd: root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  const skillPath = path.join(root, "skills/alpha/SKILL.md");
  fs.writeFileSync(skillPath, read(root, "skills/alpha/SKILL.md").replace("name: alpha", "name: delta"));
  const result = run(["alpha", "--date", "2026-10-28", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /inferred level: major/);
  assert.match(result.stdout, /migration note/);
  assert.match(result.stdout, /docs\/workflow\/MIGRATION\.md/);
  assert.match(read(root, "skills/alpha/SKILL.md"), /^version: 2\.0\.0$/m);
});

test("an unknown skill in a non-git repo fails closed unless --level is given", () => {
  const root = fixture();
  const result = run(["alpha", "--date", "2026-10-28", "--root", root]);
  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /--level|not a git repository|no git diff/);
});

test("dry-run writes nothing", () => {
  const root = fixture();
  const beforeSkill = read(root, "skills/alpha/SKILL.md");
  const beforeChangelog = read(root, "CHANGELOG.md");
  const result = run(["alpha", "--level", "patch", "--date", "2026-10-28", "--root", root, "--dry-run"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(read(root, "skills/alpha/SKILL.md"), beforeSkill);
  assert.equal(read(root, "CHANGELOG.md"), beforeChangelog);
  assert.match(result.stdout, /dry-run/);
});

test("a new internal skill joins the combined internal table (no anchor before it)", () => {
  const root = fixture();
  const skillDir = path.join(root, "skills", "gamma");
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    "---\nname: gamma\nuser-invocable: false\nversion: 0.1.0\nmetadata:\n  internal: true\ndescription: >\n  New fixture skill.\n---\n\nbody\n",
  );
  const result = run(["gamma", "--level", "minor", "--date", "2026-10-28", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const changelog = read(root, "CHANGELOG.md");
  const internal = changelog.slice(changelog.indexOf("### Internal"));
  const userFacing = changelog.slice(changelog.indexOf("### User-facing"), changelog.indexOf("### Internal"));
  // a named row inside the combined table — never a `#### gamma` anchor that
  // would mis-attribute the combined table's rows that follow it
  assert.match(internal, /^\| `gamma` \| 0\.2\.0 \| 2026-10-28 \| minor \|/m);
  assert.doesNotMatch(changelog, /#### `gamma`/);
  assert.doesNotMatch(userFacing, /`gamma`/);
});

test("a new user-facing skill creates its per-skill table under User-facing", () => {
  const root = fixture();
  const skillDir = path.join(root, "skills", "delta");
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, "SKILL.md"),
    "---\nname: delta\nuser-invocable: true\nversion: 0.1.0\ndescription: >\n  New user-facing fixture skill.\n---\n\nbody\n",
  );
  const result = run(["delta", "--level", "minor", "--date", "2026-10-28", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const changelog = read(root, "CHANGELOG.md");
  const userFacing = changelog.slice(changelog.indexOf("### User-facing"), changelog.indexOf("### Internal"));
  assert.match(userFacing, /#### `delta`/);
  assert.match(userFacing, /\| 0\.2\.0 \| 2026-10-28 \| minor \|/);
});

test("an argument-hint change is detected and reported", () => {
  const root = fixture({ version: "1.0.0" });
  execFileSync("git", ["init", "-q"], { cwd: root });
  execFileSync("git", ["config", "user.email", "t@t"], { cwd: root });
  execFileSync("git", ["config", "user.name", "t"], { cwd: root });
  execFileSync("git", ["add", "-A"], { cwd: root });
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  const skillPath = path.join(root, "skills/alpha/SKILL.md");
  fs.writeFileSync(
    skillPath,
    read(root, "skills/alpha/SKILL.md").replace(
      "description: >",
      'argument-hint: "[new-hint]"\ndescription: >',
    ),
  );
  const result = run(["alpha", "--level", "patch", "--date", "2026-10-28", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /argument-hint/);
});

test("the script prints the bundle:skills reminder (mechanical surface, issue amendment)", () => {
  const root = fixture();
  const result = run(["alpha", "--level", "patch", "--date", "2026-10-28", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /bundle:skills/);
});

// A summary is human text that lands inside a markdown table cell — a raw pipe
// would break out of the cell and shift every column after it.
test("a summary containing '|' stays inside its table cell", () => {
  const root = fixture();
  const result = run(["alpha", "--level", "patch", "--date", "2026-10-28", "--root", root, "--summary", "a | b | c"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const changelog = read(root, "CHANGELOG.md");
  const row = changelog.split("\n").find((l) => l.startsWith("| `alpha` | 1.2.4 |"));
  assert.ok(row, "the combined internal row exists");
  assert.equal(row.split(/(?<!\\)\|/).length - 2, 5, "the row keeps exactly its 5 cells");
  assert.match(row, /a \\| b \\| c/);
});
