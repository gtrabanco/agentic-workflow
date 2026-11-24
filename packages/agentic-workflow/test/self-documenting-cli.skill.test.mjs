/**
 * self-documenting-cli.skill.test.mjs — issue #603 S3: the usage carrier.
 *
 * The skill's whole value is that it *points* at the CLI's own grammar instead
 * of copying it. A copied flag list rots against the crate and re-opens the
 * drift this unit exists to close, so the absence of a restated grammar is an
 * asserted property, not a style preference.
 *
 * Written red-first: the skill did not exist on the tree that carried the
 * request, so every case below failed on a missing directory.
 *
 * Obligation tag — surface: the usage carrier skill (`skills/self-documenting-cli/`);
 * obligations: `usage-skill-frontmatter` (the non-invocable, target-shipping
 * shape), `usage-skill-index-only` (SKILL.md is an index, references carry the
 * recipes), `usage-skill-no-grammar` (zero restated command grammars).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const SKILL_DIR = fileURLToPath(new URL("../../../skills/self-documenting-cli/", import.meta.url));
const read = (...parts) => readFileSync(join(SKILL_DIR, ...parts), "utf8");

/** The frontmatter block, split from the body. */
function frontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n/u);
  assert.ok(match, "the skill declares frontmatter");
  return match[1];
}

test("the skill exists and its directory name matches its `name:`", () => {
  assert.ok(existsSync(`${SKILL_DIR}SKILL.md`), "skills/self-documenting-cli/SKILL.md exists");
  assert.match(frontmatter(read("SKILL.md")), /^name: self-documenting-cli$/mu);
});

test("the skill is non-invocable and ships to targets (no metadata.internal)", () => {
  const front = frontmatter(read("SKILL.md"));
  assert.match(front, /^user-invocable: false$/mu, "the skill is not a menu entry");
  assert.doesNotMatch(front, /^metadata:/mu, "no metadata block at all, so no metadata.internal");
  assert.doesNotMatch(front, /internal: true/u, "it is not repo-only: it ships to target projects");
});

test("SKILL.md is an index: every family it names has a reference file", () => {
  const body = read("SKILL.md");
  const links = [...body.matchAll(/\]\(references\/([a-z-]+)\.md\)/gu)].map((m) => m[1]);
  assert.ok(links.length >= 5, `SKILL.md links its reference set (found ${links.length})`);
  for (const name of new Set(links)) {
    assert.ok(existsSync(`${SKILL_DIR}references/${name}.md`), `references/${name}.md exists`);
  }
});

test("the references directory carries no file SKILL.md does not link", () => {
  const linked = new Set([...read("SKILL.md").matchAll(/references\/([a-z-]+)\.md/gu)].map((m) => m[1]));
  for (const file of readdirSync(`${SKILL_DIR}references`)) {
    const name = file.replace(/\.md$/u, "");
    assert.ok(linked.has(name), `references/${file} is reachable from SKILL.md`);
  }
});

test("the skill carries the conduct rule: query help before guessing a flag", () => {
  const body = read("SKILL.md");
  assert.match(body, /runner help/u, "it names the help command, in the symbolic form the runner contract sanctions");
  assert.match(body, /before guessing|before guessing a flag|query the CLI/iu, "it states the conduct rule");
});

test("the skill restates no command grammar: no usage line of its own", () => {
  for (const file of ["SKILL.md", ...readdirSync(`${SKILL_DIR}references`).map((name) => `references/${name}`)]) {
    const text = read(file);
    assert.doesNotMatch(text, /^usage: agentic-workflow /mu, `${file} carries no \`usage:\` line of its own`);
    assert.doesNotMatch(text, /^ {2}agentic-workflow [a-z-]+ .*\[--/mu, `${file} carries no flag list in the crate's usage form`);
  }
});

test("every reference names `help` as the owner of flag spelling", () => {
  for (const file of readdirSync(`${SKILL_DIR}references`)) {
    const text = read("references", file);
    assert.match(text, /runner help/u, `references/${file} points at the grammar's owner`);
  }
});
