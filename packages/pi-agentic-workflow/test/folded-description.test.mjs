// folded-description.test.mjs — #165
//
// `readSkillMeta()` registers a command's frontmatter `description:`. Every
// optimised skill in this repo declares that field as a YAML folded block
// scalar (`description: >`), and the old line-oriented reader stored the scalar
// indicator `>` as the value, so every catalogue command surfaced a stray `>`
// instead of its real description. These tests pin the fix: folded and literal
// block scalars parse into the intended text, plain single-line values keep
// working, and the real bundled catalogue carries no `">"` description.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readCatalogue, readSkillMeta } from "../dist/routing/catalogue.js";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const bundleSkills = join(PKG_DIR, "skills");

test("folded (`>`) block scalar folds its continuation lines into one string", () => {
  const text = `---
name: review-change
user-invocable: true
description: >
  Review a change with only applicable internal axes, classify every finding,
  persist fix-now work, and return one evidence-backed decision. Findings only;
  --adversarial N uses isolated reviewers; --synthesize fuses supplied reviewer
  tables. Triggers: "review-change", "review this change", "adversarial review".
---
Run review-change.
`;
  const meta = readSkillMeta(text, "review-change");
  assert.equal(
    meta.description,
    'Review a change with only applicable internal axes, classify every finding, persist fix-now work, and return one evidence-backed decision. Findings only; --adversarial N uses isolated reviewers; --synthesize fuses supplied reviewer tables. Triggers: "review-change", "review this change", "adversarial review".',
  );
  assert.equal(meta.name, "review-change");
  assert.equal(meta.userInvocable, true);
});

test("literal (`|`) block scalar preserves its line breaks", () => {
  const text = `---
name: literal-skill
user-invocable: true
description: |
  first line
  second line
  third line
---
Run literal-skill.
`;
  const meta = readSkillMeta(text, "literal-skill");
  assert.equal(meta.description, "first line\nsecond line\nthird line");
});

test("plain single-line `description:` keeps working unchanged", () => {
  const text = `---
name: plain-skill
user-invocable: true
description: A single-line description stays inline.
---
Run plain-skill.
`;
  const meta = readSkillMeta(text, "plain-skill");
  assert.equal(meta.description, "A single-line description stays inline.");
});

test("a folded description does not swallow the next frontmatter key", () => {
  const text = `---
name: folded-skill
user-invocable: true
description: >
  line one
  line two
version: 1.0.0
---
Run folded-skill.
`;
  const meta = readSkillMeta(text, "folded-skill");
  assert.equal(meta.description, "line one line two");
});

test("the real bundled catalogue reports real descriptions, never \">\"", () => {
  const catalogue = readCatalogue(bundleSkills);
  assert.ok(catalogue.commands.length > 0, "the bundle ships user-invocable commands");
  for (const command of catalogue.commands) {
    assert.notEqual(
      command.description,
      ">",
      `${command.name}: the scalar indicator must not leak as the description`,
    );
    assert.ok(
      command.description && command.description.length > 1,
      `${command.name}: expected a real description, got ${JSON.stringify(command.description)}`,
    );
  }

  const review = catalogue.commands.find((command) => command.name === "review-change");
  assert.ok(review, "review-change is in the catalogue");
  assert.match(review.description, /Review a change with only applicable internal axes/su);
});

test("a real bundled skill's parsed description equals its frontmatter folded text", () => {
  const source = readFileSync(join(bundleSkills, "review-change", "SKILL.md"), "utf8");
  const meta = readSkillMeta(source, "review-change");
  const frontmatterLine = source.split(/\r?\n/u).find((line) => line.includes("description: >"));
  assert.ok(frontmatterLine, "review-change declares a folded description");
  assert.equal(meta.description, 'Review a change with only applicable internal axes, classify every finding, persist fix-now work, and return one evidence-backed decision. Findings only; --adversarial N uses isolated reviewers; --synthesize fuses supplied reviewer tables. Triggers: "review-change", "review this change", "adversarial review".');
});
