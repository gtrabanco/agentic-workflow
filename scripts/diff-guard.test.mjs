#!/usr/bin/env node
/**
 * Corpus for `scripts/diff-guard.mjs` — the behavioural contract of the
 * diff-size guard. Fixtures are embedded temp git repos written at run time:
 * no network, no committed fixtures directory.
 */

import test, { after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const GUARD = fileURLToPath(new URL("./diff-guard.mjs", import.meta.url));
const SEP = "\u00b7";
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "diff-guard-corpus-"));

function createRepo() {
  const repo = path.join(TMP, `repo-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  fs.mkdirSync(repo, { recursive: true });
  spawnSync("git", ["init"], { cwd: repo, encoding: "utf8" });
  spawnSync("git", ["config", "user.email", "test@test.com"], { cwd: repo, encoding: "utf8" });
  spawnSync("git", ["config", "user.name", "Test"], { cwd: repo, encoding: "utf8" });
  fs.writeFileSync(path.join(repo, "README.md"), "# Test\n");
  spawnSync("git", ["add", "."], { cwd: repo, encoding: "utf8" });
  spawnSync("git", ["commit", "-m", "initial"], { cwd: repo, encoding: "utf8" });
  return repo;
}

function appendFile(repo, name, content) {
  fs.appendFileSync(path.join(repo, name), content);
  return path.join(repo, name);
}

function stageAll(repo) {
  spawnSync("git", ["add", "-A"], { cwd: repo, encoding: "utf8" });
}

function makeCommit(repo, message) {
  spawnSync("git", ["commit", "-m", message], { cwd: repo, encoding: "utf8" });
  return spawnSync("git", ["rev-parse", "HEAD"], { cwd: repo, encoding: "utf8" }).stdout.trim();
}

function run(repo, runtime, ...args) {
  const result = spawnSync(runtime, [GUARD, "--repo", repo, ...args], {
    encoding: "utf8", cwd: repo, timeout: 10000,
  });
  if (result.error && result.error.code === "ENOENT") return null;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function nodeRun(repo, ...args) {
  const result = run(repo, process.execPath, ...args);
  assert.ok(result, "node must run the guard");
  return result;
}

// Test 1: small diff passes (exit 0, block shape).
test("a small diff exits 0 with the PASS block", () => {
  const repo = createRepo();
  const base = makeCommit(repo, "base");
  appendFile(repo, "small.md", "line1\nline2\nline3\n");
  stageAll(repo);
  makeCommit(repo, "small change");
  const { status, stdout } = nodeRun(repo, "--base", base);
  assert.equal(status, 0, "small diff must exit 0");
  assert.match(stdout, /^DIFF-GUARD PASS — /m);
  // PASS format: Lines: 3 (+3/-0) <SEP> Files: 1 (limit 8)
  const re = /^Lines: \d+ \(\+\d+\/-\d+\) \u00b7 Files: \d+ \(limit 8\)$/m;
  assert.match(stdout, re, "PASS block lines format");
  assert.doesNotMatch(stdout, /^DIFF-GUARD BREACH/m);
});

// Test 2: breach over max-lines exits 1, anti-gaming line present.
test("a diff over max-lines breaches (exit 1) with the anti-gaming block", () => {
  const repo = createRepo();
  const base = makeCommit(repo, "base");
  const bigContent = Array.from({ length: 500 }, (_, i) => `line${i}`).join("\n") + "\n";
  appendFile(repo, "big.md", bigContent);
  stageAll(repo);
  makeCommit(repo, "big change");
  const { status, stdout } = nodeRun(repo, "--base", base, "--max-lines", 400);
  assert.equal(status, 1, "over max-lines must exit 1");
  assert.match(stdout, /^DIFF-GUARD BREACH — /m);
  // BREACH format: Lines: 500 > 400 <SEP> Files: 1 > 8
  const re = /^Lines: \d+ > \d+ \u00b7 Files: \d+ > \d+$/m;
  assert.match(stdout, re, "BREACH block lines format");
  assert.match(stdout, /Anti-gaming: NEVER shrink a diff by deleting comments/m);
  assert.match(stdout, /\u2192 Next: re-triage the unit/m);
});

// Test 3: --json shape is exact.
test("--json prints the exact JSON shape", () => {
  const repo = createRepo();
  const base = makeCommit(repo, "base");
  appendFile(repo, "small.md", "line1\nline2\n");
  stageAll(repo);
  makeCommit(repo, "small change");
  const { status, stdout } = nodeRun(repo, "--base", base, "--json");
  assert.equal(status, 0, "must exit 0 for small diff");
  const parsed = JSON.parse(stdout.trim());
  assert.ok(typeof parsed.lines === "number");
  assert.ok(typeof parsed.files === "number");
  assert.ok(typeof parsed.additions === "number");
  assert.ok(typeof parsed.deletions === "number");
  assert.ok(typeof parsed.maxLines === "number");
  assert.ok(typeof parsed.maxFiles === "number");
  assert.ok(typeof parsed.breach === "boolean");
  assert.equal(parsed.breach, false);
  assert.ok(typeof parsed.base === "string");
  assert.equal(Object.keys(parsed).length, 8, "JSON must have exactly 8 keys");
});

// Test 4: unknown base exits 2.
test("an unknown base ref exits 2 with DIFF-GUARD ERROR", () => {
  const repo = createRepo();
  const { status, stdout } = nodeRun(repo, "--base", "nonexistent-ref-xyz123");
  assert.equal(status, 2, "unknown base must exit 2");
  assert.match(stdout, /^DIFF-GUARD ERROR — /m);
});

// Test 5: defaults are 400/8.
test("the default budget is 400 lines and 8 files", () => {
  const repo = createRepo();
  const base = makeCommit(repo, "base");
  const bigContent = Array.from({ length: 401 }, (_, i) => `line${i}`).join("\n") + "\n";
  appendFile(repo, "big.md", bigContent);
  stageAll(repo);
  makeCommit(repo, "big change");
  const { status, stdout } = nodeRun(repo, "--base", base);
  assert.equal(status, 1, "must breach on 401 lines with default max");
  assert.match(stdout, /Lines: 401/, "breach shows actual 401 line count");
});

// Test 6: file-count breach triggers when lines are under budget.
test("file-count breach triggers when lines are under budget", () => {
  const repo = createRepo();
  const base = makeCommit(repo, "base");
  for (let i = 0; i < 10; i++) {
    appendFile(repo, `file${i}.md`, `content${i}\n`);
  }
  stageAll(repo);
  makeCommit(repo, "many files");
  const { status, stdout } = nodeRun(repo, "--base", base);
  assert.equal(status, 1, "must breach on file count");
  assert.match(stdout, /Files: 10 > 8/);
  assert.ok(stdout.includes("Lines: 10"), "line count reflects 10 lines added");
});

// Test 7: --unit label appears in the output block.
test("the --unit label appears in the output block", () => {
  const repo = createRepo();
  const base = makeCommit(repo, "base");
  appendFile(repo, "small.md", "line1\n");
  stageAll(repo);
  makeCommit(repo, "small");
  const { status, stdout } = nodeRun(repo, "--base", base, "--unit", "my-feature");
  assert.equal(status, 0);
  assert.match(stdout, /^DIFF-GUARD PASS — my-feature$/m);
});

// Test 8: BREACH block when both lines and files are over budget.
test("BREACH block shows both violations when both are over budget", () => {
  const repo = createRepo();
  const base = makeCommit(repo, "base");
  for (let i = 0; i < 10; i++) {
    appendFile(repo, `big${i}.md`, Array.from({ length: 50 }, (_, j) => `line${j}`).join("\n") + "\n");
  }
  stageAll(repo);
  makeCommit(repo, "big change");
  const { status, stdout } = nodeRun(repo, "--base", base, "--max-lines", 100, "--max-files", 3);
  assert.equal(status, 1);
  assert.match(stdout, /Lines: \d+ > 100/);
  assert.match(stdout, /Files: \d+ > 3/);
});

// Test 9: --json breach shape.
test("--json breach prints breach:true when over budget", () => {
  const repo = createRepo();
  const base = makeCommit(repo, "base");
  const bigContent = Array.from({ length: 500 }, (_, i) => `line${i}`).join("\n") + "\n";
  appendFile(repo, "big.md", bigContent);
  stageAll(repo);
  makeCommit(repo, "big");
  const { stdout } = nodeRun(repo, "--base", base, "--json", "--max-lines", 400);
  const parsed = JSON.parse(stdout.trim());
  assert.equal(parsed.breach, true, "json breach must be true");
  assert.ok(parsed.lines >= 500, "json lines must reflect actual count");
});

// Test 10: determinism — two runs produce identical output.
test("two runs on the same repo state are byte-identical", () => {
  const repo = createRepo();
  const base = makeCommit(repo, "base");
  appendFile(repo, "det.md", "line1\nline2\n");
  stageAll(repo);
  makeCommit(repo, "small");
  const first = nodeRun(repo, "--base", base);
  const second = nodeRun(repo, "--base", base);
  assert.equal(first.stdout, second.stdout, "stdout must be identical");
  assert.equal(first.status, second.status, "status must be identical");
});

after(() => {
  fs.rmSync(TMP, { recursive: true, force: true });
});
