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

/** Stage one fixture skill whose frontmatter carries `lines`; returns its bytes. */
function stageFixture(t, slug, lines) {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-hint-shape-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, "skills");
  const targetDir = join(root, "bundle");
  mkdirSync(join(sourceDir, slug), { recursive: true });
  const source = `---\nname: ${slug}\nuser-invocable: true\n${lines.join("\n")}\n---\n\nBody.\n`;
  writeFileSync(join(sourceDir, slug, "SKILL.md"), source);
  bundleSkills({ sourceDir, targetDir });
  return { source, staged: readFileSync(join(targetDir, slug, "SKILL.md"), "utf8") };
}

// The 2026-11-27 EXTERNAL VERIFY correction corpus (D5, PE-018): shapes the
// transform must NOT rewrite — yaml@2.9.0 already reads them as strings — and
// shapes it must rewrite — yaml@2.9.0 reads them as a comment or a non-string
// type, which is what leaves a hint the host cannot render.

test("a block-scalar hint is staged byte-identical and still parses as a string", (t) => {
  const shapes = [
    ["block-folded", ["argument-hint: >-", '  [--foo <bar>] [--search "<words>"]'], '[--foo <bar>] [--search "<words>"]'],
    ["block-literal", ["argument-hint: |", "  [--foo]"], "[--foo]\n"],
    ["block-comment-header", ["argument-hint: > # keep", "  [--foo]"], "[--foo]\n"],
    ["block-single", ["argument-hint: >"], ""],
  ];
  for (const [slug, lines, expected] of shapes) {
    const { source, staged } = stageFixture(t, slug, lines);
    assert.equal(staged, source, `${slug}: a block-scalar header must ship byte-identical — quoting it breaks the frontmatter`);
    assert.equal(parseYaml(frontmatterOf(staged))["argument-hint"], expected, `${slug}: the block content stays a string`);
  }
});

test("a comment-led or YAML-typed hint is staged as a string with its text", (t) => {
  const shapes = [
    ["comment-hint", "argument-hint: #726 reference", "#726 reference"],
    ["null-hint", "argument-hint: null", "null"],
    ["bool-hint", "argument-hint: true", "true"],
    ["number-hint", "argument-hint: 1.5e3", "1.5e3"],
  ];
  for (const [slug, line, expected] of shapes) {
    const { staged } = stageFixture(t, slug, [line]);
    const hint = parseYaml(frontmatterOf(staged))["argument-hint"];
    assert.equal(typeof hint, "string", `${slug}: staged as ${Array.isArray(hint) ? "an array" : typeof hint}, not a string`);
    assert.equal(hint, expected, `${slug}: the hint text is the author's raw text`);
    assert.match(staged, /^argument-hint: "/mu, `${slug}: the staged value is a quoted YAML string`);
  }
});

test("a quoted scalar with an invalid escape ships byte-identical (the source's own defect)", (t) => {
  // Re-quoting an already-quoted value would corrupt its valid escapes, so the
  // transform never touches one; an invalid escape is unparseable at base and
  // at head alike — an authoring defect, never a staging regression.
  const { source, staged } = stageFixture(t, "bad-escape", ['argument-hint: "[foo\\q]"']);
  assert.equal(staged, source, "a quoted scalar is never re-quoted");
  assert.throws(() => parseYaml(frontmatterOf(staged)), "the invalid escape stays the source's own defect");
});

// The cycle-1 review corpus (F4/F5/F6): shapes the transform turned into a
// frontmatter PARSE-ERROR where the source bytes parsed, and the authoring
// defect that slips past a first-match-only rewrite.

test("every block-scalar header order ships byte-identical (F4)", (t) => {
  // yaml@2.9.0 reads the indicator before or after its chomping/indentation
  // digits (`>-2` and `>2-` alike), so a header test that admits one order
  // quotes the line and orphans its content — a PARSE-ERROR at this head where
  // the source parsed a string.
  const shapes = [
    ["block-sign-digits", ["argument-hint: >-2", "  [--foo]"], "[--foo]"],
    ["block-sign-digits-literal", ["argument-hint: |+2", "  [--foo]"], "[--foo]\n\n"],
    ["block-digits-sign", ["argument-hint: >2-", "  [--foo]"], "[--foo]"],
  ];
  for (const [slug, lines, expected] of shapes) {
    const { source, staged } = stageFixture(t, slug, lines);
    assert.equal(staged, source, `${slug}: a block-scalar header ships byte-identical in either order`);
    assert.equal(parseYaml(frontmatterOf(staged))["argument-hint"], expected, `${slug}: the block content stays a string`);
  }
});

test("a raw hint spanning frontmatter lines is never half-rewritten (F5)", (t) => {
  const { source, staged } = stageFixture(t, "multiline-flow", ["argument-hint: [--a,", "  b]"]);
  assert.equal(staged, source, "a value that continues on the next line is left alone, never quoted on its first line");
  assert.deepEqual(parseYaml(frontmatterOf(staged))["argument-hint"], ["--a", "b"], "the source's own array type is its defect, not the staging's");
});

test("a duplicate argument-hint never ships its unrewritten sibling raw (F6)", (t) => {
  const { staged } = stageFixture(t, "duplicate-hint", [
    'argument-hint: "[--first]"',
    "argument-hint: [--second <x>]",
  ]);
  const hint = parseYaml(frontmatterOf(staged))["argument-hint"];
  assert.equal(typeof hint, "string", `staged as ${Array.isArray(hint) ? "an array" : typeof hint}, not a string`);
  assert.equal(hint, "[--second <x>]", "the last key wins in YAML, so the last value is the one that must ship safe");
  assert.equal(staged.match(/^argument-hint: "/gmu)?.length, 2, "every argument-hint line is quoted");
});
