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
      JSON.stringify({ name, version, ...(name === PACKAGES[0] ? { dependencies: {
        "@gtrabanco/agentic-workflow": version,
        "@gtrabanco/agentic-workflow-schema": version,
      } } : {}) }, null, 2) + "\n",
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

test("the changelog row summary is built from the changeset bodies (the changeset IS the release note)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"], "b.md": ["schema:minor"] } });
  const result = run(["apply", "--root", root, "--base", "1.0.0", "--channel", "latest", "--date", "2026-10-28"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  const section = changelog.slice(changelog.indexOf(`#### [\`${PACKAGES[0]}\`]`));
  assert.match(section, /Change number 1 body line\. · Change number 2 body line\./,
    "the row summary must carry the changeset bodies, not a generic line");
  assert.doesNotMatch(section, /Release 1\.0\.1/);
});

// --summary still wins when the operator names one explicitly.
test("--summary overrides the changeset-derived summary", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] } });
  const result = run(["apply", "--root", root, "--base", "1.0.0", "--channel", "latest", "--date", "2026-10-28",
    "--summary", "Operator summary"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  assert.match(changelog, /\| 1\.0\.1 \| 2026-10-28 \| patch \| Operator summary \|/);
});

test("plan lists every changeset with its semver annotation and body (the per-PR type, visible)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"], "b.md": ["schema:minor"] } });
  const result = run(["plan", "--root", root, "--base", "1.0.0", "--channel", "latest"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /a\.md: @gtrabanco\/pi-agentic-workflow=patch — Change number 1 body line\./);
  assert.match(result.stdout, /b\.md: @gtrabanco\/agentic-workflow-schema=minor — Change number 2 body line\./);
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

test("apply rewrites the downstream exact pins to the train version (dependency closure)", () => {
  // Real graph: pi-agentic-workflow pins @gtrabanco/agentic-workflow and
  // @gtrabanco/agentic-workflow-schema exactly — when the train moves schema,
  // a pi pin at the old version reds the parity gate (--pins: pin == local).
  const root = fixture({ changesets: { "a.md": ["schema:minor"] } });
  const result = run(["apply", "--root", root, "--base", "1.0.0", "--channel", "latest", "--date", "2026-10-28"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const pi = JSON.parse(fs.readFileSync(path.join(root, "packages/pi-agentic-workflow/package.json"), "utf8"));
  assert.equal(pi.dependencies["@gtrabanco/agentic-workflow"], "1.1.0");
  assert.equal(pi.dependencies["@gtrabanco/agentic-workflow-schema"], "1.1.0");
  assert.match(result.stdout, /pin: @gtrabanco\/pi-agentic-workflow @gtrabanco\/agentic-workflow-schema 1\.0\.0 → 1\.1\.0/);
  // a package with no exact local pins has nothing to rewrite
  const crate = JSON.parse(fs.readFileSync(path.join(root, "packages/agentic-workflow/package.json"), "utf8"));
  assert.equal(crate.dependencies?.["@gtrabanco/agentic-workflow-schema"], undefined);
});

test("apply leaves non-exact and foreign ranges untouched", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] } });
  const piPath = path.join(root, "packages/pi-agentic-workflow/package.json");
  const pi = JSON.parse(fs.readFileSync(piPath, "utf8"));
  pi.dependencies["@gtrabanco/agentic-workflow"] = "^1.0.0";
  pi.dependencies["left-pad"] = "1.3.0";
  fs.writeFileSync(piPath, JSON.stringify(pi, null, 2) + "\n");
  const result = run(["apply", "--root", root, "--base", "1.0.0", "--channel", "latest", "--date", "2026-10-28"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const after = JSON.parse(fs.readFileSync(piPath, "utf8"));
  assert.equal(after.dependencies["@gtrabanco/agentic-workflow"], "^1.0.0", "ranges are ranges by nature — never rewritten");
  assert.equal(after.dependencies["left-pad"], "1.3.0", "foreign exact pins are not this train's business");
});

test("without v-tags the base falls back to the highest package version (the first release)", () => {
  // packages carry 1.0.0; the repo has no vX.Y.Z tag — the train still computes
  const root = fixture({ changesets: { "a.md": ["pi:minor"] } });
  const result = run(["plan", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /base: 1\.0\.0 \(highest package version — no stable v-tag\)/);
  assert.match(result.stdout, /train version: 1\.1\.0/);
});

test("the base never sits below an already-published package version (a stale v-tag cannot downgrade the train)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:minor"] }, git: true, version: "4.9.0" });
  execFileSync("git", ["tag", "v1.0.0"], { cwd: root });
  const result = run(["plan", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /base: 4\.9\.0/);
  assert.match(result.stdout, /train version: 4\.10\.0/);
});

test("release-notes prints the assembled release body (the changeset bodies)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"], "b.md": ["schema:minor"] } });
  const result = run(["release-notes", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Change number 1 body line\./);
  assert.match(result.stdout, /Change number 2 body line\./);
  assert.doesNotMatch(result.stdout, /forced by operator/i);
});

test("release-notes marks a forced version", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] } });
  const result = run(["release-notes", "--root", root, "--version", "5.0.0"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /Version forced by operator: 5\.0\.0/);
});

test("publish-plan prints per-package TSV lines for the declared packages (the channel publish job's input)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"], "b.md": ["schema:minor"] } });
  const result = run(["publish-plan", "--root", root, "--channel", "canary", "--date", "2026-09-16"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const lines = result.stdout.trim().split("\n");
  assert.deepEqual(lines.sort(), [
    "@gtrabanco/agentic-workflow-schema\tagentic-workflow-schema\t1.0.0-canary.20260916.1\tcanary",
    "@gtrabanco/pi-agentic-workflow\tpi-agentic-workflow\t1.0.0-canary.20260916.1\tcanary",
  ]);
});

test("publish-plan lists nothing when no changeset declares packages (empty cut, not an error)", () => {
  const root = fixture({ changesets: {} });
  const result = run(["publish-plan", "--root", root, "--channel", "beta", "--date", "2026-09-16"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stdout.trim(), "");
});

test("publish-plan refuses channel latest (that is apply's job)", () => {
  const root = fixture();
  const result = run(["publish-plan", "--root", root, "--channel", "latest"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /apply/);
});

test("publish-plan carries the manual channel shape (beta → <base>-beta.<n>)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] } });
  const result = run(["publish-plan", "--root", root, "--channel", "beta", "--date", "2026-09-16"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /@gtrabanco\/pi-agentic-workflow\tpi-agentic-workflow\t1\.0\.0-beta\.1\tbeta/);
});

// External-verify blocker: apply consumed the intent but left the files in
// .changeset/, so the NEXT cut re-consumed them — a patch-only release
// computed the stale minor again and re-printed stale bodies into the notes.
test("apply consumes the changesets it applied (the next cut carries only new intent)", () => {
  const root = fixture({ changesets: { "a.md": ["pi:minor"] }, git: true });
  const applied = run(["apply", "--root", root, "--base", "1.0.0", "--channel", "latest", "--date", "2026-10-28"]);
  assert.equal(applied.status, 0, applied.stderr || applied.stdout);
  assert.equal(
    fs.existsSync(path.join(root, ".changeset", "a.md")),
    false,
    "the applied changeset is consumed — it must not ride into the next cut",
  );
  execFileSync("git", ["tag", "v1.1.0"], { cwd: root });
  fs.writeFileSync(
    path.join(root, ".changeset", "b.md"),
    '---\n"@gtrabanco/pi-agentic-workflow": patch\n---\n\nA later patch body line.\n',
  );
  const next = run(["plan", "--root", root]);
  assert.equal(next.status, 0, next.stderr || next.stdout);
  assert.match(next.stdout, /train version: 1\.1\.1/, "a patch-only cut is a patch");
  assert.doesNotMatch(next.stdout, /1\.1\.2/, "the stale minor must not re-apply");
});

test("plan still leaves the changesets in place (read-only by construction)", () => {
  const root = fixture();
  const result = run(["plan", "--root", root, "--base", "1.0.0"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(root, ".changeset", "the-change.md")), true);
});

// The docstring (and SPEC capability closure) name --dry-run as the plan alias,
// but the flag used to exit 2 as unknown.
test("--dry-run is an accepted alias for plan (SPEC capability-closure Read test)", () => {
  const root = fixture();
  const result = run(["--dry-run", "--version", "4.2.0", "--root", root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /train version: 4\.2\.0/);
  assert.match(result.stdout, /plan only — nothing written/);
  const applied = run(["apply", "--dry-run", "--root", root]);
  assert.equal(applied.status, 1, "--dry-run never lets apply write");
  assert.match(applied.stderr || applied.stdout, /--dry-run/);
});

// External-verify blocker: --version with a prerelease channel printed
// "Version forced by operator: undefined" and silently ignored the override.
test("--version with a prerelease channel is rejected, never silently ignored", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] } });
  for (const channel of ["canary", "alpha", "beta", "rc"]) {
    const result = run(["plan", "--root", root, "--base", "1.0.0", "--channel", channel, "--version", "9.9.9"]);
    assert.equal(result.status, 1, `${channel}: --version off the latest train must fail, not succeed`);
    assert.match(result.stderr || result.stdout, /--version/);
    assert.doesNotMatch(result.stdout, /undefined/);
  }
});

// A companion table without its |---| grid used to corrupt the CHANGELOG
// silently: indexOf("|---|", idx) returned -1 and the row landed at offset 1.
test("apply fails closed on a companion table missing its grid — nothing is written", () => {
  const root = fixture({ changesets: { "a.md": ["pi:patch"] } });
  const changelogPath = path.join(root, "CHANGELOG.md");
  fs.writeFileSync(changelogPath, fs.readFileSync(changelogPath, "utf8").replaceAll("|---|---|---|---|\n", ""));
  const result = run(["apply", "--root", root, "--base", "1.0.0", "--channel", "latest", "--date", "2026-10-28"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /\|---\|/);
  assert.equal(readPkgVersion(root, PACKAGES[0]), "1.0.0", "the pre-flight runs before any write");
  assert.equal(fs.existsSync(path.join(root, ".changeset", "a.md")), true, "nothing consumed on a failed apply");
});
