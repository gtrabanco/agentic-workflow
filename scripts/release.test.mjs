#!/usr/bin/env node
/**
 * RED-first corpus for scripts/release.mjs (feature 40, issue #180).
 *
 * Frozen-failure reproducers (written RED before any implementation):
 *   FF-1 (#164): a skills-only merge that ships a changeset file still
 *                releases the declared package — a skills change can never
 *                ship unversioned.
 *   FF-2 (#156): a stable release plans the vX.Y.Z git tag and the `stable`
 *                branch push at the release commit — downstream tools can
 *                pin a stable ref.
 *
 * Issue "Tests first" mapping:
 *   - automated bump → version field updated in package.json
 *         → "applies the train version to all three packages"
 *   - stable tag at the same commit as the bump
 *         → "stable release plans the vX.Y.Z tag and stable branch push"
 *   - downstream pinning (smoke) → the tag/branch plan commands are emitted
 *   - patch/minor/major ladder → "highest bump wins" test
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(repoRoot, "scripts/release.mjs");

const run = (args) =>
  spawnSync(process.execPath, [script, ...args], { cwd: repoRoot, encoding: "utf8" });

const PACKAGES = [
  "@gtrabanco/pi-agentic-workflow",
  "@gtrabanco/agentic-workflow-schema",
  "@gtrabanco/agentic-workflow",
];

function fixture({ changesets = { "the-change.md": ["pi:patch"] }, version = "1.0.0", git = false } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "release-fixture-"));
  for (const name of PACKAGES) {
    const dirName = name.replace("@gtrabanco/", "");
    const dir = path.join(root, "packages", dirName);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ name, version }, null, 2) + "\n",
    );
  }
  const changesetDir = path.join(root, ".changeset");
  fs.mkdirSync(changesetDir, { recursive: true });
  const levels = { pi: "patch", schema: "minor", agentic: "major" };
  let i = 0;
  for (const [file, entries] of Object.entries(changesets)) {
    const fm = entries.map((e) => {
      const [pkg, level] = e.split(":");
      const name = pkg === "pi" ? PACKAGES[0] : pkg === "schema" ? PACKAGES[1] : PACKAGES[2];
      return `"${name}": ${level ?? levels[pkg]}`;
    });
    fs.writeFileSync(
      path.join(changesetDir, file.endsWith(".md") ? file : `${file}.md`),
      ["---", ...fm, "---", "", `Change number ${++i} body line.`, ""].join("\n"),
    );
  }
  const tables = PACKAGES.map(
    (name) =>
      `#### [\`${name}\`](packages/${name.replace("@gtrabanco/", "")}/)\n` +
      "| Version | Date | Type | What changed |\n|---|---|---|---|\n" +
      `| ${version} | 2026-01-01 | — | First versioned release |\n`,
  ).join("\n");
  fs.writeFileSync(
    path.join(root, "CHANGELOG.md"),
    "# Changelog\n\n## Per-skill version history\n\n### Companion npm packages\n\n" + tables,
  );
  if (git) {
    execFileSync("git", ["init", "-q"], { cwd: root });
    execFileSync("git", ["config", "user.email", "t@t"], { cwd: root });
    execFileSync("git", ["config", "user.name", "t"], { cwd: root });
    execFileSync("git", ["add", "-A"], { cwd: root });
    execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root });
  }
  return root;
}

const readPkgVersion = (root, name) =>
  JSON.parse(fs.readFileSync(path.join(root, "packages", name.replace("@gtrabanco/", ""), "package.json"), "utf8")).version;

test("--help exits 0 under plain node (AC-01)", () => {
  const result = run(["--help"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /usage/i);
});

// FF-1: the #164 reproducer — a skills-only merge ships a changeset file and
// the release pipeline still bumps + publishes the declared package.
test("skills-only merge with a changeset file bumps the declared package", () => {
  const root = fixture({ changesets: { "skills-only.md": ["pi:patch"] } });
  const result = run(["plan", "--root", root, "--base", "1.0.0", "--channel", "latest"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /1\.0\.1/);
  assert.match(result.stdout, /pi-agentic-workflow/);
});

test("the highest bump across accumulated changesets wins", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"], "b.md": ["schema:minor"], "c.md": ["agentic:major"] } });
  const result = run(["plan", "--root", root, "--base", "1.0.0", "--channel", "latest"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /train version: 2\.0\.0/);
});

// FF-2: the #156 reproducer — the stable ref (tag + branch) is planned.
test("stable release plans the vX.Y.Z tag and stable branch push", () => {
  const root = fixture();
  const result = run(["plan", "--root", root, "--base", "1.0.0", "--channel", "latest"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /git tag v1\.0\.1/);
  assert.match(result.stdout, /git push origin v1\.0\.1/);
  assert.match(result.stdout, /refs\/heads\/stable/);
});

test("applies the train version to all three packages (unified train, AC-03)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"], "b.md": ["schema:minor"], "c.md": ["agentic:major"] } });
  const result = run(["apply", "--root", root, "--base", "1.0.0", "--channel", "latest", "--date", "2026-10-28"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  for (const name of PACKAGES) assert.equal(readPkgVersion(root, name), "2.0.0");
});

test("apply writes one companion changelog row per package (AC-14, English-only)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] } });
  const result = run(["apply", "--root", root, "--base", "1.0.0", "--channel", "latest", "--date", "2026-10-28"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  for (const name of PACKAGES) {
    const section = changelog.slice(changelog.indexOf(`#### [\`${name}\`]`));
    assert.match(
      section,
      /\| 1\.0\.1 \| 2026-10-28 \| patch \|/,
      `missing 1.0.1 companion row for ${name}`,
    );
  }
});

test("plan writes nothing (read-only by construction)", () => {
  const root = fixture();
  const before = fs.readFileSync(path.join(root, "packages/pi-agentic-workflow/package.json"), "utf8");
  const result = run(["plan", "--root", root, "--base", "1.0.0"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.readFileSync(path.join(root, "packages/pi-agentic-workflow/package.json"), "utf8"), before);
});

test("canary version shape is <base>-canary.<yyyymmdd>.<n> (AC-07)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] } });
  const result = run(["plan", "--root", root, "--base", "4.2.0", "--channel", "canary", "--date", "2026-09-16"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /4\.2\.0-canary\.20260916\.1\b/);
});

test("canary is deterministic at the same state (AC-12)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] } });
  const first = run(["plan", "--root", root, "--base", "1.0.0", "--channel", "canary", "--date", "2026-09-16"]);
  const second = run(["plan", "--root", root, "--base", "1.0.0", "--channel", "canary", "--date", "2026-09-16"]);
  assert.equal(first.status, 0, first.stderr || first.stdout);
  assert.equal(second.status, 0, second.stderr || second.stdout);
  const v = (r) => r.stdout.match(/\d+\.\d+\.\d+-canary\.\d+\.\d+/)?.[0];
  assert.equal(v(first), v(second));
});

test("canary counter increments from existing canary tags for the same day", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] }, git: true });
  execFileSync("git", ["tag", "v1.0.0-canary.20260916.1"], { cwd: root });
  execFileSync("git", ["tag", "v1.0.0-canary.20260916.7"], { cwd: root });
  const result = run(["plan", "--root", root, "--base", "1.0.0", "--channel", "canary", "--date", "2026-09-16"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /1\.0\.0-canary\.20260916\.8\b/);
});

test("canary lists only the packages declared in changesets (AC-08 package filter)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] } });
  const result = run(["plan", "--root", root, "--base", "1.0.0", "--channel", "canary", "--date", "2026-09-16"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /pi-agentic-workflow/);
  assert.doesNotMatch(result.stdout, /agentic-workflow-schema.*canary/);
});

test("a manual channel publishes under its own dist-tag, never latest (AC-06/AC-09)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] } });
  const result = run(["plan", "--root", root, "--base", "1.0.0", "--channel", "beta", "--date", "2026-09-16"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /1\.0\.0-beta\.1/);
  assert.match(result.stdout, /npm publish --tag beta/);
  assert.doesNotMatch(result.stdout, /npm publish --tag latest/);
});

test("a forced version is marked in the release body (AC-10)", () => {
  const root = fixture();
  const result = run(["plan", "--root", root, "--version", "5.0.0", "--channel", "latest"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Version forced by operator: 5\.0\.0/);
});

test("the release command uses --generate-notes so PR authors are credited (AC-15)", () => {
  const root = fixture();
  const result = run(["plan", "--root", root, "--base", "1.0.0", "--channel", "latest"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /gh release create v1\.0\.1 --generate-notes/);
});

test("the release fails closed on a malformed changeset file", () => {
  const root = fixture({ changesets: {} });
  fs.writeFileSync(path.join(root, ".changeset", "bad.md"), "not a changeset\n");
  const result = run(["plan", "--root", root, "--base", "1.0.0"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /bad\.md/);
});

test("no changesets and no override is an error, not a silent no-op", () => {
  const root = fixture({ changesets: {} });
  const result = run(["plan", "--root", root, "--base", "1.0.0"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /no changeset|no release intent/);
});

test("--version override must not collide with an existing tag (D-40-4)", () => {
  const root = fixture({ git: true });
  execFileSync("git", ["tag", "v5.0.0"], { cwd: root });
  const result = run(["plan", "--root", root, "--version", "5.0.0"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /already exists|collide/);
});
