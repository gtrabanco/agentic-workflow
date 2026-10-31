/**
 * ceremony-workspace.test.mjs — ceremony `workspace` module (fix #338, P3).
 *
 * Fixtures: hermetic temp git repos (scripts/ceremony/testing.mjs). Pins the
 * 11 issue-#338 workspace ops, the R2 frozen-failure reproducer
 * (clean-check replaces ad-hoc `git status --porcelain`), byte-stable
 * determinism of read ops (S2-3, O7), and the exit-2 ceremonial block of
 * main-check.
 */

import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { cer, makeRepo, commitFile } from "./ceremony/testing.mjs";

test("R2 reproducer: clean-check reports clean at a clean head, exit 0 (O10)", () => {
  const dir = makeRepo();
  const r = cer(["workspace", "clean-check"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.clean, true);
  assert.deepEqual(r.json["dirty-files"], []);
});

test("clean-check detects dirty worktree with porcelain rows", () => {
  const dir = makeRepo();
  fs.writeFileSync(path.join(dir, "draft.md"), "dirty\n");
  fs.writeFileSync(path.join(dir, "staged.md"), "staged\n");
  execFileSync("git", ["add", "staged.md"], { cwd: dir });
  const r = cer(["workspace", "clean-check"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.clean, false);
  assert.deepEqual(r.json["dirty-files"].sort(), ["draft.md", "staged.md"]);
});

test("status reports index/working/staged per file", () => {
  const dir = makeRepo();
  fs.writeFileSync(path.join(dir, "a.md"), "a\n");
  fs.writeFileSync(path.join(dir, "b.md"), "b\n");
  execFileSync("git", ["add", "b.md"], { cwd: dir });
  const r = cer(["workspace", "status"], dir);
  assert.equal(r.code, 0);
  const rows = Object.fromEntries(r.json.status.map((s) => [s.file, s]));
  assert.equal(rows["a.md"].working, "?");
  assert.equal(rows["b.md"].staged, true);
});

test("diff-scope / diff-files-only / diff-stat over a committed range", () => {
  const dir = makeRepo();
  const base = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
  commitFile(dir, "src/x.js", "one\ntwo\n");
  const r = cer(["workspace", "diff-scope", `${base}..HEAD`], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json["lines-added"], 2);
  assert.equal(r.json["lines-deleted"], 0);
  assert.equal(r.json.files[0].file, "src/x.js");

  const f = cer(["workspace", "diff-files-only", `${base}..HEAD`], dir);
  assert.deepEqual(f.json.files, ["src/x.js"]);

  const s = cer(["workspace", "diff-stat", `${base}..HEAD`], dir);
  assert.equal(s.code, 0);
  assert.match(s.json.shortstat, /1 file changed/);
});

test("missing diff range → usage error, exit 1", () => {
  const dir = makeRepo();
  const r = cer(["workspace", "diff-scope"], dir);
  assert.equal(r.code, 1);
  assert.equal(r.json.error, "missing-flag");
});

test("main-check: clean when no commits sit on main (exit 0)", () => {
  const dir = makeRepo();
  execFileSync("git", ["checkout", "-b", "side"], { cwd: dir });
  commitFile(dir, "side.md", "side\n");
  const r = cer(["workspace", "main-check", "main..HEAD"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.clean, true);
});

test("main-check: commits on main are a ceremonial block, exit 2", () => {
  const dir = makeRepo();
  const seed = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
  execFileSync("git", ["checkout", "-b", "side"], { cwd: dir });
  commitFile(dir, "side.md", "side\n");
  execFileSync("git", ["checkout", "main"], { cwd: dir });
  commitFile(dir, "main-only.md", "on main\n");
  const r = cer(["workspace", "main-check", `${seed}..main`], dir);
  assert.equal(r.code, 2);
  assert.equal(r.json.blocked, true);
  assert.equal(r.json["commits-on-main"].length, 1);
  assert.match(r.json["commits-on-main"][0].message, /fixture change/);
});

test("hash-object matches git hash-object; missing file → exit 1", () => {
  const dir = makeRepo();
  fs.writeFileSync(path.join(dir, "blob.txt"), "bytes\n");
  const expected = execFileSync("git", ["hash-object", "blob.txt"], { cwd: dir, encoding: "utf8" }).trim();
  const r = cer(["workspace", "hash-object", "--path", "blob.txt"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.sha, expected);
  assert.equal(cer(["workspace", "hash-object", "--path", "nope.txt"], dir).code, 1);
});

test("file-content reads a blob at a sha; missing object → exit 1", () => {
  const dir = makeRepo();
  const { sha } = commitFile(dir, "deep/f.txt", "content at sha\n");
  const r = cer(["workspace", "file-content", "--sha", sha, "--path", "deep/f.txt"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.content, "content at sha");
  assert.equal(cer(["workspace", "file-content", "--sha", sha, "--path", "nope.txt"], dir).code, 1);
});

test("find-files resolves globs and --ext; grep returns file:line hits with a cap", () => {
  const dir = makeRepo();
  commitFile(dir, "docs/a.md", "alpha needle\n");
  commitFile(dir, "docs/b.txt", "beta needle\n");
  const ff = cer(["workspace", "find-files", "docs/*.md", "--ext", "md"], dir);
  assert.deepEqual(ff.json.files, ["docs/a.md"]);
  const g = cer(["workspace", "grep", "needle", "--glob", "docs/*.md", "--limit", "1"], dir);
  assert.equal(g.code, 0);
  assert.equal(g.json.count, 1);
  assert.equal(g.json.hits[0].line, 1);
  assert.equal(g.json.hits[0].file, "docs/a.md");
});

test("O7: read ops are byte-stable — two runs, identical stdout", () => {
  const dir = makeRepo();
  const base = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
  commitFile(dir, "s.js", "x\n");
  const one = cer(["workspace", "diff-scope", `${base}..HEAD`], dir).stdout;
  const two = cer(["workspace", "diff-scope", `${base}..HEAD`], dir).stdout;
  assert.equal(one, two);
  const c1 = cer(["workspace", "clean-check"], dir).stdout;
  const c2 = cer(["workspace", "clean-check"], dir).stdout;
  assert.equal(c1, c2);
});

test("pr-status parses branch, base, ahead/behind", () => {
  const dir = makeRepo();
  const r = cer(["workspace", "pr-status"], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.branch, "main");
  assert.equal(r.json.base, null);
  assert.equal(r.json.ahead, 0);
});
