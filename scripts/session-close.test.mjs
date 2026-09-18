#!/usr/bin/env node
/**
 * session-close.test.mjs — the mechanical session close, tested against the
 * runtime `/log-session` calls.
 *
 * The end-to-end cases run in a throwaway git repository, because the two claims
 * that matter can only be shown there: the entry is **committed by construction**
 * (never left riding along), and whatever is still uncommitted is **named and not
 * swept up**.
 *
 * The log itself is appended by the sanctioned writer in these tests (`/log-session`
 * or the session hook); this script owns the append-only proof and the commit —
 * see the module header for why it must not write a `ledger-ownership@1` ledger.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  appendedOnly,
  commitSubject,
  parsePorcelain,
  renderEntry,
  summaries,
} from "./session-close.mjs";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "session-close.mjs");

// ---------------------------------------------------------------------------
// Pure
// ---------------------------------------------------------------------------

test("renderEntry: the documented entry shape, manual kind", () => {
  const entry = renderEntry({
    timestamp: "2026-09-17T22:00Z",
    branch: "fix/182-x",
    commits: { count: 2, range: "abc12345…def67890" },
    files: "scripts/a.mjs, scripts/b.mjs",
    summary: "Made the receipt mechanical.",
    decisions: "Chose exit codes 0/2/3.",
    next: "Run /audit-pr.",
  });
  const lines = entry.trimEnd().split("\n");
  assert.equal(lines[0], "## 2026-09-17T22:00Z — fix/182-x — manual");
  assert.equal(lines[1], "- **Commits:** 2 (`abc12345…def67890`)");
  assert.equal(lines[2], "- **Files:** scripts/a.mjs, scripts/b.mjs");
  assert.equal(lines[3], "- **Summary:** Made the receipt mechanical.");
  assert.equal(lines[4], "- **Decisions:** Chose exit codes 0/2/3.");
  assert.equal(lines[5], "- **Next:** Run /audit-pr.");
});

test("renderEntry: auto kind carries only the mechanical facts", () => {
  const entry = renderEntry({ timestamp: "2026-09-17T22:00Z", branch: "main", kind: "auto", commits: { count: 0 }, files: "—" });
  assert.equal(entry, "## 2026-09-17T22:00Z — main — auto\n- **Commits:** 0\n- **Files:** —\n");
  assert.doesNotMatch(entry, /Summary|Decisions|Next/);
});

test("renderEntry: empty optional sections are omitted, never rendered blank", () => {
  const entry = renderEntry({ timestamp: "t", branch: "b", commits: { count: 0 }, files: "—", summary: "s", decisions: "  ", next: "" });
  assert.doesNotMatch(entry, /Decisions/);
  assert.doesNotMatch(entry, /Next/);
  assert.match(entry, /Summary:\*\* s/);
});

test("appendedOnly: a pure append passes and yields exactly the new bytes", () => {
  const result = appendedOnly("# Log\n## old\n", "# Log\n## old\n## new\n- **Summary:** x\n");
  assert.equal(result.ok, true);
  assert.equal(result.added, "## new\n- **Summary:** x\n");
});

test("appendedOnly: rewriting, truncating or touching nothing is refused", () => {
  assert.equal(appendedOnly("# Log\n## old\n", "# Log\n## old edited\n").ok, false, "an edited past entry");
  assert.equal(appendedOnly("# Log\n## old\n", "# Log\n").ok, false, "a truncated log");
  assert.equal(appendedOnly("# Log\n", "# Log\n").ok, false, "no append at all");
  assert.equal(appendedOnly("# Log\n", "# Log\n\n   \n").ok, false, "whitespace is not an entry");
  assert.equal(appendedOnly("", "").ok, false);
});

test("appendedOnly: an untracked log is a valid baseline (empty prefix)", () => {
  const result = appendedOnly("", "## first entry\n- **Summary:** x\n");
  assert.equal(result.ok, true);
});

test("summaries / commitSubject: newest summary drives the subject, bounded and one line", () => {
  const log = "## a\n- **Summary:** first\n## b\n- **Summary:** second\n";
  assert.deepEqual(summaries(log), ["first", "second"]);
  assert.equal(commitSubject("second"), "second");
  assert.equal(commitSubject("Fixed the receipt. Also more."), "Fixed the receipt.");
  assert.equal(commitSubject("a\nb   c"), "a b c");
  assert.equal(commitSubject(""), "log session");
  assert.ok(commitSubject("x".repeat(200)).length <= 72);
});

test("parsePorcelain: staged, modified and untracked entries", () => {
  assert.deepEqual(parsePorcelain("M  docs/LOGS.md\n?? tmp/x\n M src/a.mjs\n"), [
    { status: "M", path: "docs/LOGS.md" },
    { status: "??", path: "tmp/x" },
    { status: "M", path: "src/a.mjs" },
  ]);
  assert.deepEqual(parsePorcelain(""), []);
  assert.deepEqual(parsePorcelain(null), []);
});

// ---------------------------------------------------------------------------
// End to end in a throwaway repository
// ---------------------------------------------------------------------------

const HEADER = "# Session log\n\n<!-- entries below -->\n";

const makeRepo = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "session-close-"));
  const git = (...args) => spawnSync("git", args, { cwd: dir, encoding: "utf8" });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "Tester");
  fs.mkdirSync(path.join(dir, "docs"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/LOGS.md"), HEADER);
  git("add", "-A");
  git("commit", "-q", "-m", "chore: seed");
  return { dir, git, log: path.join(dir, "docs/LOGS.md") };
};

const run = (dir, args) => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: "utf8" });

test("end to end: an appended entry is committed alone and the tree ends clean", () => {
  const { dir, git, log } = makeRepo();
  fs.writeFileSync(log, `${HEADER}\n## 2026-09-17T22:00Z — main — manual\n- **Commits:** 0 (\`abc…def\`)\n- **Files:** —\n- **Summary:** Closed the loop.\n`);
  const result = run(dir, ["close"]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.clean, true);
  assert.deepEqual(report.leftovers, []);
  assert.equal(report.log, "docs/LOGS.md");

  assert.match(git("log", "-1", "--format=%s").stdout.trim(), /^docs\(log\): Closed the loop\.$/);
  const touched = git("show", "--name-only", "--format=", "HEAD").stdout.split("\n").filter(Boolean);
  assert.deepEqual(touched, ["docs/LOGS.md"], "the commit contains the log and nothing else");
  assert.equal(git("status", "--porcelain").stdout.trim(), "", "nothing is left uncommitted");
});

test("end to end: render prints the entry with the real git facts and writes nothing", () => {
  const { dir, git } = makeRepo();
  const before = git("rev-parse", "HEAD").stdout.trim();
  const result = run(dir, ["render", "--summary", "Rendered only.", "--decisions", "d", "--next", "n"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^## \d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?Z — main — manual$/m);
  assert.match(result.stdout, /- \*\*Commits:\*\* 0/);
  assert.match(result.stdout, /- \*\*Summary:\*\* Rendered only\./);
  assert.equal(git("rev-parse", "HEAD").stdout.trim(), before);
  assert.equal(git("status", "--porcelain").stdout.trim(), "", "render is read-only");
});

test("end to end: closing with no appended entry is refused, not committed", () => {
  const { dir, git } = makeRepo();
  const before = git("rev-parse", "HEAD").stdout.trim();
  const result = run(dir, ["close"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /was not appended to/i);
  assert.equal(git("rev-parse", "HEAD").stdout.trim(), before, "no empty log commit");
});

test("end to end: a rewritten past entry is refused (the log only ever grows)", () => {
  const { dir, log } = makeRepo();
  fs.writeFileSync(log, HEADER.replace("# Session log", "# Renamed log"));
  const result = run(dir, ["close"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /not a prefix/i);
});

test("end to end: a leftover file is named, and is NOT swept into the commit", () => {
  const { dir, git, log } = makeRepo();
  fs.writeFileSync(path.join(dir, "stranded.txt"), "work in progress\n");
  fs.writeFileSync(log, `${HEADER}\n## e\n- **Summary:** Half done.\n`);
  const result = run(dir, ["close"]);
  assert.equal(result.status, 2, "a dirty tree after close is exit 2, never a silent success");
  const report = JSON.parse(result.stdout);
  assert.equal(report.clean, false);
  assert.ok(report.leftovers.some((l) => l.includes("stranded.txt")), "the blocker names the path");
  const touched = git("show", "--name-only", "--format=", "HEAD").stdout.split("\n").filter(Boolean);
  assert.deepEqual(touched, ["docs/LOGS.md"], "only the log was committed");
  assert.ok(fs.existsSync(path.join(dir, "stranded.txt")), "the stranded file is untouched");
});

test("end to end: a missing log file is refused rather than invented", () => {
  const { dir, log } = makeRepo();
  fs.rmSync(log);
  const result = run(dir, ["close"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no session log/i);
});

test("end to end: render refuses a manual entry with no summary — the facts are free, the narrative is not", () => {
  const { dir } = makeRepo();
  const result = run(dir, ["render", "--decisions", "something"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--summary is required/i);
});

test("end to end: an unknown command is a usage error", () => {
  const { dir } = makeRepo();
  const result = run(dir, ["frobnicate"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /usage/i);
});

test("end to end: an unknown or misspelled flag is refused, never silently defaulted (F5)", () => {
  const { dir } = makeRepo();
  const result = run(dir, ["render", "--summry", "hi"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown flag: --summry/);
});

test("end to end: --flag=value is accepted (F5)", () => {
  const { dir } = makeRepo();
  const result = run(dir, ["render", "--summary=did a thing"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /did a thing/);
});

console.log("PASS session-close: facts computed, entry committed alone, leftovers named not swept");
