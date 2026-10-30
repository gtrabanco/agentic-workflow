#!/usr/bin/env node
/**
 * Corpus for scripts/changeset-create.mjs (D-40-16): the changeset intent
 * file is created by code — affected packages/skills derived from the
 * modified files, the semver from the conventional commit title, the file
 * name PR-first (unique), several packages and skills in ONE file.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(repoRoot, "scripts/changeset-create.mjs");
const GIT = ["-c", "user.email=t@t", "-c", "user.name=t", "-c", "commit.gpgsign=false"];

function fixture({ commits = [], dirty = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "changeset-create-"));
  const run = (...args) => execFileSync("git", [...GIT, "-C", root, ...args], { encoding: "utf8" });
  fs.mkdirSync(path.join(root, "packages/pi-agentic-workflow"), { recursive: true });
  fs.writeFileSync(path.join(root, "packages/pi-agentic-workflow/package.json"),
    JSON.stringify({ name: "@gtrabanco/pi-agentic-workflow", version: "1.0.0" }, null, 2) + "\n");
  fs.mkdirSync(path.join(root, "skills/unit-lane"), { recursive: true });
  fs.writeFileSync(path.join(root, "skills/unit-lane/SKILL.md"), "---\nname: unit-lane\n---\n\nbody\n");
  run("init", "-q", "-b", "main");
  run("add", "-A");
  run("commit", "-qm", "init");
  run("checkout", "-qb", "feat/test");
  for (const [message, file, content] of commits) {
    fs.mkdirSync(path.join(root, path.dirname(file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content ?? "changed\n");
    run("add", "-A");
    run("commit", "-qm", message);
  }
  for (const [file, content] of dirty) {
    fs.mkdirSync(path.join(root, path.dirname(file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content ?? "dirty\n");
  }
  return root;
}

const run = (args, root) =>
  spawnSync(process.execPath, [script, ...args, "--root", root], { encoding: "utf8" });

const changesetFile = (root, name) => {
  const file = fs.readdirSync(path.join(root, ".changeset")).find((f) => f.endsWith(".md"));
  return { file, content: file ? fs.readFileSync(path.join(root, ".changeset", file), "utf8") : null };
};

test("creates ONE file declaring the affected package and skill, level from the feat title", () => {
  const root = fixture({ commits: [["fix(pi): and the package code", "packages/pi-agentic-workflow/src/x.ts"], ["feat(pi): the lane contract gains a flag", "skills/unit-lane/SKILL.md"]] });
  const result = run([], root);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const { file, content } = changesetFile(root);
  assert.match(file, /^feat-test-/, "the branch slug leads the file name");
  assert.match(content, /"@gtrabanco\/pi-agentic-workflow": minor/);
  assert.match(content, /"unit-lane": minor/);
  assert.match(content, /the lane contract gains a flag/i, "the commit title is the release note body");
});

test("fix title infers patch; a breaking title infers major", () => {
  const root = fixture({ commits: [["fix(pi): correct the flag", "skills/unit-lane/SKILL.md"]] });
  assert.equal(run([], root).status, 0);
  assert.match(changesetFile(root).content, /"unit-lane": patch/);

  const breaking = fixture({ commits: [["feat(pi)!: new contract", "packages/pi-agentic-workflow/src/x.ts"]] });
  assert.equal(run([], breaking).status, 0);
  assert.match(changesetFile(breaking).content, /"@gtrabanco\/pi-agentic-workflow": major/);
});

test("--level overrides the inference and --pr leads the file name", () => {
  const root = fixture({ commits: [["fix(pi): correct the flag", "skills/unit-lane/SKILL.md"]] });
  const result = run(["--level", "minor", "--pr", "402", "--message", "The reviewed wording"], root);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const { file, content } = changesetFile(root);
  assert.match(file, /^402-/, "the PR number leads the file name when given");
  assert.match(content, /"unit-lane": minor/);
  assert.match(content, /The reviewed wording/);
});

test("an existing changeset file is never overwritten", () => {
  const root = fixture({ commits: [["fix(pi): one", "skills/unit-lane/SKILL.md"]] });
  assert.equal(run([], root).status, 0);
  const { file } = changesetFile(root);
  const result = run([], root);
  assert.equal(result.status, 1, "a second run on the same branch fails instead of overwriting");
  assert.match(result.stderr || result.stdout, /exists/);
  assert.equal(changesetFile(root).file, file, "the first file is untouched");
});

test("a change that still lives in the working tree declares its package", () => {
  // The intent file is created BEFORE the commit that ships the change, so the
  // dirty half of the census is the normal case, not an edge: the porcelain
  // parse used to strip two characters too many and read every dirty path as
  // "nothing to declare".
  const root = fixture({ dirty: [["packages/pi-agentic-workflow/test/scratch.test.mjs", "// draft\n"]] });
  const result = run(["--level", "patch", "--name", "dirty-only"], root);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(changesetFile(root).content, /"@gtrabanco\/pi-agentic-workflow": patch/);
});

test("a change that touches no package or skill is refused, not silently ignored", () => {
  const root = fixture({ commits: [["docs: prose", "docs/notes.md"]] });
  const result = run([], root);
  assert.equal(result.status, 1);
  assert.match(result.stderr || result.stdout, /no package|no skill|nothing to declare/i);
});

test("the created file passes lint-changeset", () => {
  const root = fixture({ commits: [["feat(pi): the lane contract gains a flag", "skills/unit-lane/SKILL.md"]] });
  assert.equal(run([], root).status, 0);
  const { file } = changesetFile(root);
  const lint = spawnSync(process.execPath, [path.join(repoRoot, "scripts/lint-changeset.mjs"), path.join(root, ".changeset", file)], { encoding: "utf8" });
  assert.equal(lint.status, 0, lint.stderr || lint.stdout);
});
