// test-obligation: protects=skills,packages/pi-agentic-workflow/scripts/bundle-skills.mjs obligations=contract,distribution-contract,failure-path
// argument-hint-frontmatter.test.mjs — issue #726, defect 1.
//
// pi reads a skill's frontmatter with the `yaml` package's `parse` (the host's
// own `dist/utils/frontmatter.js`), so a bare `[...]` `argument-hint:` is a flow
// sequence and the whole skill file is rejected — its `skill:*` command never
// appears. The contract here is the reader's: every shipped skill parses, and a
// present `argument-hint` is a string.
//
// Two surfaces are checked because they are shipped separately: the canonical
// `skills/` tree (installed by the skills CLI) and the package's staged bundle
// (installed by the pi package). The staging projection also refuses to ship an
// unsafe hint even when a source author writes one, so the fixture at the end
// proves the transform rather than trusting the sources to stay clean.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

import { bundleSkills } from "../scripts/bundle-skills.mjs";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const REPO_SKILLS = join(PKG_DIR, "..", "..", "skills");
const MANIFEST = join(PKG_DIR, "projection-manifest.json");

/** pi's own extraction: strip a BOM, normalise newlines, take the first fence. */
function frontmatterOf(text) {
  const normalized = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!normalized.startsWith("---")) return null;
  const end = normalized.indexOf("\n---", 3);
  return end === -1 ? null : normalized.slice(4, end);
}

function parseSkill(file) {
  const block = frontmatterOf(readFileSync(file, "utf8"));
  assert.notEqual(block, null, `${file}: no frontmatter fence`);
  return parseYaml(block);
}

const skillDirs = (root) =>
  readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => {
      try {
        readFileSync(join(root, name, "SKILL.md"));
        return true;
      } catch {
        return false;
      }
    })
    .sort();

// The three values the issue's audit found unsafe, with the text they must keep
// after quoting. These are the pre-change bytes, copied here so a later edit
// that changes the hint's text fails instead of silently redefining the hint.
const REPAIRED = new Map([
  ["agentic-workflow-doctor", '[--unit <slug>] [--search "<words>"] [--candidate <n>]'],
  ["aw-doctor", '[--unit <slug>] [--search "<words>"] [--candidate <n>]'],
  ["fold-findings", "[finding-id …]"],
]);

test("every source skill frontmatter parses and its argument-hint is a string", () => {
  const dirs = skillDirs(REPO_SKILLS);
  assert.ok(dirs.length >= 28, `expected the canonical skills tree, found ${dirs.length}`);
  for (const dir of dirs) {
    const frontmatter = parseSkill(join(REPO_SKILLS, dir, "SKILL.md"));
    const hint = frontmatter["argument-hint"];
    if (hint !== undefined) {
      assert.equal(typeof hint, "string", `${dir}: argument-hint parsed as ${Array.isArray(hint) ? "an array" : typeof hint}`);
    }
  }
});

test("the repaired hints decode to their original text", () => {
  for (const [dir, expected] of REPAIRED) {
    const frontmatter = parseSkill(join(REPO_SKILLS, dir, "SKILL.md"));
    assert.equal(frontmatter["argument-hint"], expected, `${dir}: the hint text changed, not just its quoting`);
  }
});

test("no shipped hint is a YAML flow sequence or array", () => {
  for (const dir of skillDirs(REPO_SKILLS)) {
    const text = readFileSync(join(REPO_SKILLS, dir, "SKILL.md"), "utf8");
    const match = /^argument-hint:[ \t]*(.*)$/mu.exec(frontmatterOf(text) ?? "");
    if (match === null) continue;
    const raw = match[1].trim();
    if (raw === "" || raw.startsWith('"') || raw.startsWith("'")) continue;
    assert.ok(!raw.startsWith("["), `${dir}: a raw value starting with "[" is a flow sequence, not a hint string`);
  }
});

test("the staged bundle parses the same way", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-hint-bundle-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const targetDir = join(root, "skills");
  bundleSkills({ sourceDir: REPO_SKILLS, targetDir, manifestPath: MANIFEST });

  for (const dir of skillDirs(targetDir)) {
    const frontmatter = parseSkill(join(targetDir, dir, "SKILL.md"));
    const hint = frontmatter["argument-hint"];
    if (hint !== undefined) {
      assert.equal(typeof hint, "string", `${dir}: the staged bundle ships a non-string argument-hint`);
    }
  }
  for (const [dir, expected] of REPAIRED) {
    assert.equal(
      parseSkill(join(targetDir, dir, "SKILL.md"))["argument-hint"],
      expected,
      `${dir}: the staged hint text changed, not just its quoting`,
    );
  }
});

test("a raw flow-sequence hint is staged as a quoted string", (t) => {
  // The guard the issue asks for: a future source author writes the same unsafe
  // shape, and the projection (not the author's memory) is what makes it safe.
  const root = mkdtempSync(join(tmpdir(), "pi-aw-hint-fixture-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, "skills");
  const targetDir = join(root, "bundle");
  mkdirSync(join(sourceDir, "unsafe"), { recursive: true });
  writeFileSync(
    join(sourceDir, "unsafe", "SKILL.md"),
    '---\nname: unsafe\nuser-invocable: true\nargument-hint: [--unsafe "<x>"]\n---\n\nBody.\n',
  );

  const result = bundleSkills({ sourceDir, targetDir });
  assert.deepEqual(result.included, ["unsafe"]);

  const staged = readFileSync(join(targetDir, "unsafe", "SKILL.md"), "utf8");
  const frontmatter = parseYaml(frontmatterOf(staged));
  assert.equal(frontmatter["argument-hint"], '[--unsafe "<x>"]', "the staged hint keeps its text");
  assert.match(staged, /^argument-hint: "\[--unsafe \\"<x>\\"\]"$/mu, "the staged hint is a double-quoted YAML string");
});
