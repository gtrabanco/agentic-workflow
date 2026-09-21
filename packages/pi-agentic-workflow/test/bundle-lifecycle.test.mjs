// bundle-lifecycle.test.mjs — the staged skill bundle is build output, not source.
//
// The canonical skills live in the repository root `skills/` tree and nowhere
// else. The package stages a filtered copy for packing, and that copy must never
// become a second tree anybody edits: it is gitignored, it is wiped and rebuilt
// rather than merged into, and the `postpack` hook removes it once the tarball
// exists. Each of those three properties is asserted here, because they are what
// stops an edit landing in the copy and being silently thrown away by the next
// rebuild.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { bundleSkills, cleanBundle } from "../scripts/bundle-skills.mjs";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const STAGED = join(PKG_DIR, "skills");

const writeSkill = (root, slug, body = "body\n") => {
  mkdirSync(join(root, "skills", slug), { recursive: true });
  writeFileSync(join(root, "skills", slug, "SKILL.md"), `---\nname: ${slug}\nuser-invocable: true\n---\n${body}`);
};

test("lifecycle: cleanBundle removes the staged copy, and is safe when it is absent", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-clean-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const targetDir = join(root, "staged");

  writeSkill(root, "alpha");
  bundleSkills({ sourceDir: join(root, "skills"), targetDir });
  assert.equal(existsSync(targetDir), true);

  cleanBundle({ targetDir });
  assert.equal(existsSync(targetDir), false);
  // The hook runs on every pack; a missing directory is not an error.
  cleanBundle({ targetDir });
  assert.equal(existsSync(targetDir), false);
  // The source is untouched: cleaning is about the copy, never the truth.
  assert.equal(existsSync(join(root, "skills", "alpha", "SKILL.md")), true);
});

test("lifecycle: a rebuild wipes the staged copy instead of merging into it", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-wipe-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, "skills");
  const targetDir = join(root, "staged");

  writeSkill(root, "alpha");
  bundleSkills({ sourceDir, targetDir });

  // An edit that landed only in the copy — the failure this design exists to stop.
  writeFileSync(join(targetDir, "alpha", "SKILL.md"), "hand-edited\n");
  writeFileSync(join(targetDir, "alpha", "ORPHAN.md"), "never in the source\n");

  bundleSkills({ sourceDir, targetDir });
  const staged = readFileSync(join(targetDir, "alpha", "SKILL.md"), "utf8");
  assert.match(staged, /body/, "the rebuild must restore the source bytes, not keep the edit");
  assert.equal(existsSync(join(targetDir, "alpha", "ORPHAN.md")), false);
});

test("lifecycle: the staged copy is gitignored and untracked", () => {
  // The point of the whole design: git holds exactly one skills tree. If this
  // fails, someone re-added the copy and the two-tree problem is back.
  const git = (...args) => {
    try {
      return execFileSync("git", args, { cwd: PKG_DIR, encoding: "utf8", timeout: 5000 });
    } catch (error) {
      return error.stdout ?? "";
    }
  };
  const tracked = git("ls-files", "skills").trim();
  assert.equal(tracked, "", `the staged bundle is tracked again:\n${tracked}`);
  assert.match(git("check-ignore", "skills"), /skills/, "skills/ must be gitignored in the package");
});
