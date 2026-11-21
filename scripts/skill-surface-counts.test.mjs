#!/usr/bin/env node
// test-obligation: protects=AGENTS.md,scripts/skill-surface-counts.mjs obligations=contract,failure-path,boundary

/**
 * skill-surface-counts.test.mjs — the skill surface, counted from the tree
 * (issue #668, S2).
 *
 * The class the counter closes: issue #663 was written with three stale skill
 * counts and they drifted within a day — "13 user-facing skills" (14 carry
 * `user-invocable: true`), "29 `SKILL.md` files" (30), "14 reference
 * directories" (17). The committed prose that renders those numbers is bound by
 * `rendered-facts@1` rows the drift gate recomputes, and this suite judges the
 * machine those rows resolve: one derivation over `skills/` and the frontmatter
 * it carries, never a number typed anywhere else.
 *
 * Every semantic case runs on a **fixture tree** under a tracked temp root
 * (`tempRoot`), so the derivation is proved against trees it has never seen: a
 * four-skill fixture pins each family, and one fixture per refusal pins the
 * fail-closed states. The live tree is only asked for its identities, and the
 * CLI is proved to publish exactly what the module derives — that is what makes
 * `rendered-facts@1`'s `count:` machines trustworthy.
 *
 * Red-first (issue #668 S8): this suite was committed alone, observed failing on
 * the absent module, and the implementation followed in its own commit.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { tempRoot } from "./temp-root.mjs";
import { SKILL_SURFACE_COUNT_MACHINES, deriveSkillSurfaceCounts } from "./skill-surface-counts.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(REPO, "scripts", "skill-surface-counts.mjs");

/** Write a `skills/<name>/SKILL.md` with the frontmatter shape the tree uses. */
function writeSkill(root, name, { userInvocable, metadataInternal = false, references = false }) {
  const dir = path.join(root, "skills", name);
  fs.mkdirSync(dir, { recursive: true });
  const front = ["---", `name: ${name}`, `user-invocable: ${userInvocable}`];
  if (metadataInternal) front.push("metadata:", "  internal: true");
  front.push("---", "", `# ${name}`, "");
  fs.writeFileSync(path.join(dir, "SKILL.md"), front.join("\n"));
  if (references) fs.mkdirSync(path.join(dir, "references", "notes"), { recursive: true });
}

/** A tree with two user-facing skills, one internal and one metadata-internal. */
function fourSkillTree() {
  const root = tempRoot("skill-surface-");
  writeSkill(root, "alpha", { userInvocable: true, references: true });
  writeSkill(root, "beta", { userInvocable: true });
  writeSkill(root, "gamma", { userInvocable: false, references: true });
  writeSkill(root, "delta", { userInvocable: false, metadataInternal: true });
  return root;
}

const runCli = (args, cwd = REPO) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: "utf8" });

const refusalOf = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return null;
};

test("the fixture tree yields one count per published family", () => {
  const counts = deriveSkillSurfaceCounts(fourSkillTree());
  assert.deepEqual(Object.keys(counts).sort(), [...SKILL_SURFACE_COUNT_MACHINES].sort(), "every published machine resolves");
  assert.deepEqual(counts, {
    "count:skill-files": 4,
    "count:user-facing": 2,
    "count:workflow-internals": 1,
    "count:metadata-internal": 1,
    "count:discoverable": 3,
    "count:skill-references": 2,
  });
});

test("the user-invocable split sums back to the file count, and the metadata-internal set leaves the discoverable one", () => {
  for (const root of [fourSkillTree(), REPO]) {
    const counts = deriveSkillSurfaceCounts(root);
    const split = counts["count:user-facing"] + counts["count:workflow-internals"] + counts["count:metadata-internal"];
    assert.equal(split, counts["count:skill-files"], `${root}: the three classes partition the surface`);
    assert.equal(counts["count:discoverable"], counts["count:skill-files"] - counts["count:metadata-internal"], `${root}: an undiscoverable skill is metadata-internal`);
    for (const [name, value] of Object.entries(counts)) {
      assert.equal(Number.isInteger(value) && value >= 0, true, `${name} is a non-negative integer (${value})`);
    }
  }
});

test("a skills/ entry with no SKILL.md is refused by name, never silently skipped", () => {
  const root = fourSkillTree();
  fs.mkdirSync(path.join(root, "skills", "stray"), { recursive: true });
  const error = refusalOf(() => deriveSkillSurfaceCounts(root));
  assert.ok(error, "the tree cannot be classified");
  assert.match(error.message, /missing-skill-file/);
  assert.match(error.message, /skills\/stray/);
});

test("a SKILL.md with no user-invocable line is refused, not counted as internal", () => {
  const root = fourSkillTree();
  fs.writeFileSync(path.join(root, "skills", "beta", "SKILL.md"), "---\nname: beta\n---\n\n# beta\n");
  const error = refusalOf(() => deriveSkillSurfaceCounts(root));
  assert.ok(error, "an unclassifiable skill is a refusal");
  assert.match(error.message, /missing-user-invocable/);
  assert.match(error.message, /skills\/beta\/SKILL\.md/);
});

test("an unknown user-invocable value is refused rather than coerced to a boolean", () => {
  const root = fourSkillTree();
  fs.writeFileSync(path.join(root, "skills", "beta", "SKILL.md"), "---\nname: beta\nuser-invocable: maybe\n---\n\n# beta\n");
  const error = refusalOf(() => deriveSkillSurfaceCounts(root));
  assert.ok(error, "a third state is a refusal");
  assert.match(error.message, /unknown-user-invocable/);
  assert.match(error.message, /maybe/);
});

test("metadata.internal true beside user-invocable true is a contradiction and refuses", () => {
  const root = fourSkillTree();
  writeSkill(root, "delta", { userInvocable: true, metadataInternal: true });
  const error = refusalOf(() => deriveSkillSurfaceCounts(root));
  assert.ok(error, "the two flags cannot both hold");
  assert.match(error.message, /contradictory-internal/);
  assert.match(error.message, /skills\/delta\/SKILL\.md/);
});

test("the CLI publishes the same counts as the module and exits 0", () => {
  const root = fourSkillTree();
  const child = runCli(["--json", "--root", root]);
  assert.equal(child.status, 0, child.stderr);
  assert.deepEqual(JSON.parse(child.stdout), deriveSkillSurfaceCounts(root), "the CLI is a thin printer, never a second derivation");
  const live = runCli(["--json"]);
  assert.equal(live.status, 0, live.stderr);
  assert.deepEqual(JSON.parse(live.stdout), deriveSkillSurfaceCounts(REPO), "the default root is the repository the script lives in");
});

test("the CLI refuses a tree it cannot classify, and answers a usage error with exit 2", () => {
  const root = fourSkillTree();
  fs.mkdirSync(path.join(root, "skills", "stray"), { recursive: true });
  const refusal = runCli(["--root", root]);
  assert.equal(refusal.status, 1, "a refusal is exit 1, never a partial table");
  assert.match(refusal.stderr, /SKILL SURFACE REFUSAL/);
  assert.match(refusal.stderr, /missing-skill-file/);
  assert.equal(refusal.stdout.trim(), "", "nothing is published on refusal");

  const usage = runCli(["--nope"]);
  assert.equal(usage.status, 2);
  assert.match(usage.stderr, /usage:/);
});

test("the plain-text output names every machine beside its value", () => {
  const root = fourSkillTree();
  const child = runCli(["--root", root]);
  assert.equal(child.status, 0, child.stderr);
  const lines = child.stdout.trim().split("\n");
  assert.equal(lines.length, SKILL_SURFACE_COUNT_MACHINES.length);
  for (const name of SKILL_SURFACE_COUNT_MACHINES) {
    const line = lines.find((candidate) => candidate.startsWith(`${name} `));
    assert.ok(line, `${name} is printed`);
    assert.match(line, new RegExp(`^${name} +\\d+$`), "name and value, one line each");
  }
});
