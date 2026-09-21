// bundle-check.test.mjs — the drift guard the CI relies on.
//
// `bundle:skills` (write mode) regenerates the committed bundle, so running it
// before the parity assertion would make that assertion compare a fresh copy
// with itself — a tautology. CI therefore runs `bundle:skills:check` FIRST and
// `bundle:skills` after it: the check is what catches a committed bundle that
// drifted from `skills/`, and the write mode only guarantees the packed
// artifact is regenerated rather than trusted.
//
// This suite pins that contract, including the negative cases: a check that
// cannot see drift is worse than no check, because it reports green.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { bundleSkills, checkBundle } from "../scripts/bundle-skills.mjs";

const PKG_DIR = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");

test("check: a freshly bundled tree is reported in sync, and nothing is rewritten", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-check-ok-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, "skills");
  const targetDir = join(root, "bundle");

  mkdirSync(join(sourceDir, "alpha"), { recursive: true });
  writeFileSync(join(sourceDir, "alpha", "SKILL.md"), "---\nname: alpha\nuser-invocable: true\n---\nbody\n");
  bundleSkills({ sourceDir, targetDir });

  const before = readFileSync(join(targetDir, "alpha", "SKILL.md"));
  const report = checkBundle({ sourceDir, targetDir });
  assert.equal(report.ok, true);
  assert.deepEqual(report, { ok: true, missing: [], drifted: [], extra: [], skills: 1, files: 1 });
  // The check is read-only: a check that repaired the tree could never report drift twice.
  assert.deepEqual(readFileSync(join(targetDir, "alpha", "SKILL.md")), before);
});

test("check: bytes edited in the bundle are named, not silently accepted", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-check-drift-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, "skills");
  const targetDir = join(root, "bundle");

  mkdirSync(join(sourceDir, "alpha"), { recursive: true });
  writeFileSync(join(sourceDir, "alpha", "SKILL.md"), "---\nname: alpha\nuser-invocable: true\n---\nbody\n");
  bundleSkills({ sourceDir, targetDir });

  writeFileSync(join(targetDir, "alpha", "SKILL.md"), "hand-edited\n");
  const report = checkBundle({ sourceDir, targetDir });
  assert.equal(report.ok, false);
  assert.deepEqual(report.drifted, ["alpha/SKILL.md"]);
});

test("check: a skill the source gained is reported missing", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-check-missing-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, "skills");
  const targetDir = join(root, "bundle");

  mkdirSync(join(sourceDir, "alpha"), { recursive: true });
  writeFileSync(join(sourceDir, "alpha", "SKILL.md"), "---\nname: alpha\nuser-invocable: true\n---\nbody\n");
  bundleSkills({ sourceDir, targetDir });

  mkdirSync(join(sourceDir, "beta"), { recursive: true });
  writeFileSync(join(sourceDir, "beta", "SKILL.md"), "---\nname: beta\nuser-invocable: true\n---\nbody\n");
  assert.deepEqual(checkBundle({ sourceDir, targetDir }).missing, ["beta/"]);
});

test("check: a file or skill directory the source never had is reported extra", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-check-extra-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, "skills");
  const targetDir = join(root, "bundle");

  mkdirSync(join(sourceDir, "alpha"), { recursive: true });
  writeFileSync(join(sourceDir, "alpha", "SKILL.md"), "---\nname: alpha\nuser-invocable: true\n---\nbody\n");
  bundleSkills({ sourceDir, targetDir });

  writeFileSync(join(targetDir, "alpha", "EXTRA.md"), "hand-added\n");
  mkdirSync(join(targetDir, "not-a-skill"), { recursive: true });
  writeFileSync(join(targetDir, "not-a-skill", "SKILL.md"), "---\nname: rogue\n---\nbody\n");

  const report = checkBundle({ sourceDir, targetDir });
  assert.equal(report.ok, false);
  assert.deepEqual(report.extra, ["alpha/EXTRA.md", "not-a-skill/"]);
});

test("check: a rebuild is the repair, and the check goes green again", (t) => {
  const root = mkdtempSync(join(tmpdir(), "pi-aw-check-repair-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const sourceDir = join(root, "skills");
  const targetDir = join(root, "bundle");

  mkdirSync(join(sourceDir, "alpha"), { recursive: true });
  writeFileSync(join(sourceDir, "alpha", "SKILL.md"), "---\nname: alpha\nuser-invocable: true\n---\nbody\n");
  bundleSkills({ sourceDir, targetDir });

  const source = join(sourceDir, "alpha", "SKILL.md");
  writeFileSync(source, readFileSync(source, "utf8") + "\nmore\n");
  assert.equal(checkBundle({ sourceDir, targetDir }).ok, false);

  bundleSkills({ sourceDir, targetDir });
  assert.equal(checkBundle({ sourceDir, targetDir }).ok, true);
});

test("check: the shipped bundle is in sync with the canonical skills/ tree", () => {
  const report = checkBundle({
    sourceDir: join(PKG_DIR, "..", "..", "skills"),
    targetDir: join(PKG_DIR, "skills"),
  });
  assert.equal(
    report.ok,
    true,
    `run \`bun run bundle:skills\` and commit — stale: ${[...report.missing, ...report.drifted, ...report.extra].join(", ")}`,
  );
});
