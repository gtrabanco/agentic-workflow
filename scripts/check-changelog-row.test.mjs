#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(repoRoot, "scripts/check-changelog-row.mjs");

const run = (args) =>
  spawnSync(process.execPath, [script, ...args], { cwd: repoRoot, encoding: "utf8" });

test("check-changelog-row counts the scoped fold-findings 1.5.1 row", () => {
  const result = run(["fold-findings", "1.5.1"]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stdout.trim(), "1");
});

test("check-changelog-row fails closed on a missing row", () => {
  const result = run(["fold-findings", "9.9.9"]);
  assert.equal(result.status, 1);
  assert.equal(result.stdout.trim(), "0");
});

test("check-changelog-row is scoped, not file-wide (the fix #244 F3 defect)", () => {
  // The whole file states 1.5.1 in several skill tables; the scoped count must
  // still be 1. This is the exact reason an unscoped `grep -c` cannot PASS.
  const fileWide = fs
    .readFileSync(path.join(repoRoot, "CHANGELOG.md"), "utf8")
    .split("\n")
    .filter((line) => line.startsWith("| 1.5.1 |")).length;
  assert.ok(fileWide > 1, `expected several 1.5.1 rows file-wide, saw ${fileWide}`);
  const scoped = run(["fold-findings", "1.5.1"]);
  assert.equal(scoped.status, 0);
  assert.equal(scoped.stdout.trim(), "1");
});

test("check-changelog-row scopes to the named table in a fixture", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "check-changelog-row-"));
  const fixture = path.join(tmp, "CHANGELOG.md");
  fs.writeFileSync(
    fixture,
    [
      "# Changelog",
      "",
      "## Per-skill version history",
      "",
      "#### `alpha`",
      "| Version | Date | Type | What changed |",
      "|---|---|---|---|",
      "| 1.5.1 | 2026-01-01 | patch | a |",
      "",
      "#### `beta`",
      "| Version | Date | Type | What changed |",
      "|---|---|---|---|",
      "| 1.5.1 | 2026-01-02 | patch | b |",
      "",
    ].join("\n"),
  );
  const alpha = run(["alpha", "1.5.1", fixture]);
  const beta = run(["beta", "1.5.1", fixture]);
  assert.equal(alpha.status, 0, alpha.stderr);
  assert.equal(alpha.stdout.trim(), "1");
  assert.equal(beta.status, 0, beta.stderr);
  assert.equal(beta.stdout.trim(), "1");
});

test("check-changelog-row rejects a missing argument", () => {
  const result = run(["fold-findings"]);
  assert.equal(result.status, 2);
});
