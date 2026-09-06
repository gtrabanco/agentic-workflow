// skill-parity.test.mjs — AC2 (SPEC S2, D-E3)
//
// Bundled skills are build copies, never sources: every file under
// `packages/pi-agentic-workflow/skills/` must be byte-identical to the
// canonical repository `skills/` tree, every `user-invocable: true` skill and
// every internal composed skill must be present, and every
// `metadata.internal: true` skill must be absent. This suite is the drift
// guard that lets the package ship skill prose without forking it.
//
// Written red-first: it landed before the bundling script produced any output,
// so a stale or hand-edited bundle fails the build instead of the review.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { bundleSkills, listFiles, listSkills } from "../scripts/bundle-skills.mjs";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const REPO_SKILLS = join(PKG_DIR, "..", "..", "skills");
const BUNDLE_SKILLS = join(PKG_DIR, "skills");

const readSourceSkills = () => listSkills(REPO_SKILLS);
const expectedSlugs = () => readSourceSkills().filter((s) => !s.internal).map((s) => s.slug);
const bundledDirs = () =>
  readdirSync(BUNDLE_SKILLS, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

/**
 * Assert two skill directories hold identical bytes for identical relative
 * paths, in both directions (no missing file, no hand-added file).
 */
function assertByteIdentical(sourceDir, bundleDir, slug) {
  const fromSource = listFiles(sourceDir);
  const fromBundle = listFiles(bundleDir);
  assert.deepEqual(fromBundle, fromSource, `${slug}: bundle file set drifted from skills/ source`);
  for (const rel of fromSource) {
    const a = readFileSync(join(sourceDir, rel));
    const b = readFileSync(join(bundleDir, rel));
    assert.deepEqual(b, a, `${slug}/${rel}: bundle bytes drifted from skills/ source`);
  }
}

test("AC2: bundle exists and covers every shipped skill", () => {
  const source = readSourceSkills();
  assert.ok(source.length >= 30, `expected the canonical skills/ tree to be discoverable, found ${source.length}`);

  assert.deepEqual(
    bundledDirs(),
    expectedSlugs(),
    "bundle directory set != skills/ minus metadata.internal: true skills",
  );
});

test("AC2: every user-invocable skill is bundled", () => {
  const bundled = new Set(bundledDirs());
  const publicSkills = readSourceSkills().filter((s) => s.userInvocable);
  assert.ok(publicSkills.length >= 15, `expected the public skill set to be non-trivial, found ${publicSkills.length}`);
  for (const skill of publicSkills) {
    assert.ok(bundled.has(skill.slug), `public skill ${skill.slug} missing from the bundle`);
  }
});

test("AC2: internal composed skills are bundled, metadata.internal skills are not", () => {
  const bundled = new Set(bundledDirs());
  const source = readSourceSkills();

  const composed = source.filter((s) => !s.userInvocable && !s.internal);
  assert.ok(composed.length >= 10, `expected composed internal skills to be present, found ${composed.length}`);
  for (const skill of composed) {
    assert.ok(bundled.has(skill.slug), `internal composed skill ${skill.slug} missing from the bundle`);
  }

  const excluded = source.filter((s) => s.internal);
  assert.ok(excluded.length >= 1, "expected at least one metadata.internal: true skill to exclude");
  for (const skill of excluded) {
    assert.ok(!bundled.has(skill.slug), `metadata.internal skill ${skill.slug} must not ship in the bundle`);
  }
});

test("AC2: every bundled file is byte-identical to its skills/ source", () => {
  for (const slug of expectedSlugs()) {
    assertByteIdentical(join(REPO_SKILLS, slug), join(BUNDLE_SKILLS, slug), slug);
  }
});

test("AC2 fixture: bundling a toy skills tree applies the inclusion rule", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-bundle-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, "skills");
  const targetDir = join(root, "bundle");

  const writeSkill = (slug, frontmatter, body = "body\n") => {
    mkdirSync(join(sourceDir, slug, "references"), { recursive: true });
    writeFileSync(join(sourceDir, slug, "SKILL.md"), `---\n${frontmatter}\n---\n${body}`);
    writeFileSync(join(sourceDir, slug, "references", "REF.md"), `reference for ${slug}\n`);
  };

  writeSkill("public-skill", "name: public-skill\nuser-invocable: true\nversion: 1.0.0");
  writeSkill("composed-skill", "name: composed-skill\nuser-invocable: false\nversion: 1.0.0");
  writeSkill(
    "maintenance-skill",
    "name: maintenance-skill\nuser-invocable: false\nversion: 1.0.0\nmetadata:\n  internal: true",
  );

  const result = bundleSkills({ sourceDir, targetDir });
  assert.deepEqual(result.included, ["composed-skill", "public-skill"]);
  assert.deepEqual(result.excluded, ["maintenance-skill"]);
  // readdir order is filesystem-dependent (node and bun differ for the same
  // directory); the property being checked is that the bundle holds exactly the
  // included slots and no excluded one, so compare the sorted set.
  assert.equal(readdirSync(targetDir).sort().join(","), "composed-skill,public-skill");
  assert.equal(result.files, 4);

  for (const slug of result.included) {
    assertByteIdentical(join(sourceDir, slug), join(targetDir, slug), slug);
  }
});

test("AC2 fixture: rebuilding clears stale bundle copies instead of merging over them", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-stale-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, "skills");
  const targetDir = join(root, "bundle");

  mkdirSync(join(sourceDir, "kept"), { recursive: true });
  writeFileSync(join(sourceDir, "kept", "SKILL.md"), "---\nname: kept\nuser-invocable: true\n---\nv1\n");
  bundleSkills({ sourceDir, targetDir });

  // A source skill disappears and the source text changes: the rebuild must
  // neither keep the old directory nor the old bytes.
  rmSync(join(sourceDir, "kept", "SKILL.md"));
  mkdirSync(join(sourceDir, "added"), { recursive: true });
  writeFileSync(join(sourceDir, "added", "SKILL.md"), "---\nname: added\nuser-invocable: true\n---\nv2\n");
  const result = bundleSkills({ sourceDir, targetDir });

  assert.deepEqual(result.included, ["added"]);
  assert.deepEqual(readdirSync(targetDir), ["added"]);
  assert.equal(readFileSync(join(targetDir, "added", "SKILL.md"), "utf8").includes("v2"), true);
});

test("AC2: the package ships no Pi-specific skill variant or forked prose", () => {
  const sources = new Set(readSourceSkills().map((s) => s.slug));
  for (const dir of bundledDirs()) {
    assert.ok(sources.has(dir), `bundle carries ${dir}, which has no canonical skills/ source`);
  }
});
