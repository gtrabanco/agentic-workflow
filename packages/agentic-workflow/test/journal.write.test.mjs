/**
 * journal.write.test.mjs — the programmatic fragment writer and the
 * validate-only carrier check (issue #452, unit
 * docs/fix/452-journal-fragment-validation/).
 *
 * This suite is the unit's frozen-failure corpus (owner S10/S14), and it was
 * observed RED before the operations existed: the write CLI answered
 * `JOURNAL REFUSAL — journal requires the aggregate or name operation` and the
 * carrier check was unreachable, while the repository's own committed
 * `…-manual-narrative-local.md` fragment (PR #457's class, committed again by
 * `3c2b64a9` without its trailing newline) kept the S15 probe red.
 *
 * What it pins:
 *
 *  - **The model supplies fields, never a filename.** `journal write` computes
 *    the UTC second, the branch (git), the session slug and the name, renders
 *    the block through the one narrative owner, self-validates the name and
 *    lands the file; an unknown flag is a refusal, never a name.
 *  - **The today-shapes are refused.** The `manual` label in the kind slot and
 *    a non-`## `-headed body are refusals, not writes — the library checks they
 *    pin already exist and are not re-implemented here.
 *  - **The carrier check is validate-only.** `journal aggregate --check` lists
 *    *every* fault in the carrier, exits 2, and moves no byte; a conforming
 *    carrier (with its `.gitkeep` placeholder) passes.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { renderEntry } from "../src/log/render.mjs";
import { JOURNAL_DIR, fragmentName, parseFragmentName } from "../src/journal/fragment.mjs";
import { git, sandboxGitEnv } from "./fixtures.mjs";
import { tempRoot } from "../../../scripts/temp-root.mjs";

const binPath = new URL("../bin/agentic-workflow.mjs", import.meta.url).pathname;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const sessionClose = path.join(repoRoot, "scripts", "session-close.mjs");

/** A pinned write-time second: the CLI's `--timestamp` keeps names stable. */
const PINNED = "2026-11-08T12:30:00Z";

function tmp(label) {
  return tempRoot(`journal-write-${label}-`);
}

function newRepo(label, { carrier = true } = {}) {
  const dir = tmp(label);
  const r = spawnSync("git", ["init", "-q", "-b", "main", dir], { encoding: "utf8", env: sandboxGitEnv() });
  assert.equal(r.status, 0, r.stderr);
  fs.mkdirSync(path.join(dir, "docs"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/LOGS.md"), "# Session log\n\nheader\n");
  git(dir, "add", "-A");
  git(dir, "config", "user.email", "t@example.com");
  git(dir, "config", "user.name", "test");
  git(dir, "commit", "-qm", "base");
  if (carrier) fs.mkdirSync(path.join(dir, JOURNAL_DIR), { recursive: true });
  return dir;
}

function runCli(args, cwd, options = {}) {
  return spawnSync(process.execPath, [binPath, ...args], {
    encoding: "utf8",
    cwd,
    env: sandboxGitEnv(),
    ...options,
  });
}

const names = (dir) => fs.readdirSync(path.join(dir, JOURNAL_DIR)).sort();

// ── write — fields in, one conforming fragment out (S1) ───────────────────

test("journal write: field arguments land one conforming fragment", () => {
  const repo = newRepo("fields");
  const run = runCli(
    [
      "journal",
      "write",
      "--kind",
      "narrative",
      "--summary",
      "Did the thing.",
      "--decisions",
      "Chose the cheap route.",
      "--next",
      "Run the gate.",
      "--session",
      "s1",
      "--timestamp",
      PINNED,
    ],
    repo,
  );
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.name, "20261108T123000Z-main-narrative-s1.md");
  const files = names(repo);
  assert.deepEqual(files, ["20261108T123000Z-main-narrative-s1.md"]);
  const body = fs.readFileSync(path.join(repo, JOURNAL_DIR, files[0]), "utf8");
  assert.ok(body.startsWith("## "), "one entry block");
  assert.ok(body.endsWith("\n"), "newline-terminated");
  assert.ok(!body.includes("\r"), "CR-free");
  assert.match(body, /- \*\*Summary:\*\* Did the thing\./u);
  assert.match(body, /- \*\*Decisions:\*\* Chose the cheap route\./u);
  assert.match(body, /- \*\*Next:\*\* Run the gate\./u);
  const parsed = parseFragmentName(receipt.name);
  assert.deepEqual(
    { branch: parsed.branch, kind: parsed.kind, sessionId: parsed.sessionId },
    { branch: "main", kind: "narrative", sessionId: "s1" },
  );
});

test("journal write: the block equals the session-close renderer for the same facts", () => {
  const repo = newRepo("parity");
  git(repo, "commit", "-q", "--allow-empty", "-m", "second");
  const cells = ["--summary", "Same prose.", "--decisions", "Same choice.", "--next", "Same next."];
  const writer = spawnSync(process.execPath, [sessionClose, "render", ...cells], {
    encoding: "utf8",
    cwd: repo,
    env: sandboxGitEnv(),
  });
  assert.equal(writer.status, 0, writer.stderr);
  const run = runCli(["journal", "write", "--kind", "narrative", "--session", "s1", ...cells], repo);
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  const block = fs.readFileSync(receipt.path, "utf8").split("\n");
  const rendered = writer.stdout.split("\n");
  // The heading label is the entry's own (`narrative` for a fragment, `manual`
  // for the journal writer); every fact and prose cell below it must agree.
  assert.match(block[0], /^## \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z — main — narrative$/u);
  assert.match(rendered[0], /^## \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z — main — manual$/u);
  assert.deepEqual(block.slice(1), rendered.slice(1), "facts and prose cells are one renderer's bytes");
});

test("journal write: --content - writes the stdin bytes unchanged", () => {
  const repo = newRepo("stdin");
  const input = "## 2026-11-08T12:30:00Z — main — narrative\n- **Summary:** from stdin\n";
  const run = runCli(["journal", "write", "--kind", "narrative", "--session", "s1", "--content", "-"], repo, {
    input,
  });
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(fs.readFileSync(receipt.path, "utf8"), input);
});

test("journal write: the manual label in the kind slot is refused", () => {
  const repo = newRepo("manual-kind");
  const run = runCli(["journal", "write", "--kind", "manual", "--summary", "x"], repo);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /^JOURNAL REFUSAL — /u);
  assert.match(run.stderr, /mechanical, narrative/u);
  assert.deepEqual(names(repo), [], "nothing was written");
});

test("journal write: a body without an entry heading is refused", () => {
  const repo = newRepo("bad-body");
  const run = runCli(
    ["journal", "write", "--kind", "narrative", "--content", "Summary: no heading\n", "--session", "s1"],
    repo,
  );
  assert.equal(run.status, 2);
  assert.match(run.stderr, /^JOURNAL REFUSAL — /u);
  assert.match(run.stderr, /starting with '## '/u);
  assert.deepEqual(names(repo), []);
});

test("journal write: a body with no trailing newline is refused, never repaired", () => {
  const repo = newRepo("no-newline");
  const run = runCli(
    ["journal", "write", "--kind", "narrative", "--content", "## 2026-11-08T12:30:00Z — main — narrative", "--session", "s1"],
    repo,
  );
  assert.equal(run.status, 2);
  assert.match(run.stderr, /newline-terminated/u);
  assert.deepEqual(names(repo), []);
});

test("journal write: an unknown flag is refused, never a filename", () => {
  const repo = newRepo("unknown-flag");
  const run = runCli(
    [
      "journal",
      "write",
      "--kind",
      "narrative",
      "--summary",
      "x",
      "--name",
      "20261108T121830Z-main-manual-narrative-local.md",
    ],
    repo,
  );
  assert.equal(run.status, 2);
  assert.match(run.stderr, /^JOURNAL REFUSAL — /u);
  assert.match(run.stderr, /--name/u);
  assert.deepEqual(names(repo), [], "a caller cannot hand a filename");
});

test("journal write: a colliding target is refused and its bytes survive", () => {
  const repo = newRepo("collision");
  const existing = path.join(repo, JOURNAL_DIR, "20261108T123000Z-main-narrative-s1.md");
  fs.writeFileSync(existing, "## 2026-11-08T12:30:00Z — main — narrative\n- **Summary:** first\n");
  const before = fs.readFileSync(existing, "utf8");
  const run = runCli(
    ["journal", "write", "--kind", "narrative", "--summary", "second", "--session", "s1", "--timestamp", PINNED],
    repo,
  );
  assert.equal(run.status, 2);
  assert.match(run.stderr, /already exists — a collision is refused, never overwritten/u);
  assert.equal(fs.readFileSync(existing, "utf8"), before, "the first write's bytes are untouched");
});

test("journal write: the name is the grammar owner's answer, never a second naming path", () => {
  const repo = newRepo("naming");
  const run = runCli(
    ["journal", "write", "--kind", "narrative", "--summary", "x", "--session", "s1", "--timestamp", PINNED],
    repo,
  );
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(
    receipt.name,
    fragmentName({ timestamp: PINNED, branch: "main", kind: "narrative", sessionId: "s1" }),
    "the write and `journal name` share one owner",
  );
});

test("journal write: an absent carrier is refused, never created (opt-in stays deliberate)", () => {
  const repo = newRepo("no-carrier", { carrier: false });
  const run = runCli(
    ["journal", "write", "--kind", "narrative", "--summary", "Would opt the project in.", "--session", "s1", "--timestamp", PINNED],
    repo,
  );
  assert.equal(run.status, 2, run.stderr);
  assert.match(run.stderr, /JOURNAL REFUSAL/u);
  assert.match(run.stderr, /carrier/u, "the refusal names the carrier it will not create");
  assert.match(run.stderr, /opt-in/u, "the refusal names the opt-in rule");
  assert.equal(run.stdout, "", "a refusal prints no receipt");
  assert.equal(fs.existsSync(path.join(repo, JOURNAL_DIR)), false, "the writer never creates the carrier");
  assert.equal(fs.existsSync(path.join(repo, ".agentic-workflow")), false, "not even the parent directory");
});

test("journal write: a mechanical fragment is exactly log render's bytes", () => {
  const repo = newRepo("mechanical");
  const facts = {
    timestamp: "2026-11-08T12:30Z",
    branch: "main",
    reason: "quit",
    commits: { count: 1, range: "1a2b3c4d…9e8f7a6b" },
    files: ["docs/LOGS.md"],
  };
  const factsPath = path.join(repo, "facts.json");
  fs.writeFileSync(factsPath, `${JSON.stringify(facts)}\n`);
  const run = runCli(
    ["journal", "write", "--kind", "mechanical", "--facts", factsPath, "--session", "s1", "--timestamp", PINNED],
    repo,
  );
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(fs.readFileSync(receipt.path, "utf8"), renderEntry(facts));
});

// ── already registered — one entry per conversation per kind (issue #468 S3) ─

test("journal write: an explicit session already registered is refused, never duplicated", () => {
  const repo = newRepo("registered");
  const first = runCli(
    ["journal", "write", "--kind", "narrative", "--summary", "First entry.", "--session", "s1", "--timestamp", PINNED],
    repo,
  );
  assert.equal(first.status, 0, first.stderr);
  const second = runCli(
    ["journal", "write", "--kind", "narrative", "--summary", "Second entry.", "--session", "s1", "--timestamp", "2026-11-08T13:30:00Z"],
    repo,
  );
  assert.equal(second.status, 2, second.stdout);
  assert.match(second.stderr, /JOURNAL REFUSAL — already registered/u);
  assert.match(second.stderr, /20261108T123000Z-main-narrative-s1\.md/u, "the refusal names the fragment that landed");
  assert.deepEqual(names(repo), ["20261108T123000Z-main-narrative-s1.md"], "no byte written");
});

// ── one entry per conversation per kind (issue #468 S3, correction batch 1) ─
//
// The auto-log names the session explicitly at shutdown (the Pi extension,
// kind `mechanical`) and `/log-session` names the same session for its
// narrative door, so a kind-wide refusal would block the shipped flow. The
// writer's own grammar already says one entry per conversation PER KIND; these
// cases pin the two orders a session really writes in, plus the boundary the
// template SessionEnd hook needs (a second mechanical fragment it created
// itself is never rewritten).

const FACTS = {
  timestamp: "2026-11-08T12:30Z",
  branch: "main",
  reason: "quit",
  commits: { count: 1, range: "1a2b3c4d…9e8f7a6b" },
  files: ["docs/LOGS.md"],
};

function factsFile(repo, label) {
  const factsPath = path.join(repo, `facts-${label}.json`);
  fs.writeFileSync(factsPath, `${JSON.stringify(FACTS)}\n`);
  return factsPath;
}

test("journal write: the auto-log's mechanical entry then the narrative door — both land, one entry per kind", () => {
  const repo = newRepo("order-mechanical-first");
  const mechanical = runCli(
    ["journal", "write", "--kind", "mechanical", "--facts", factsFile(repo, "m"), "--session", "s1", "--timestamp", PINNED],
    repo,
  );
  assert.equal(mechanical.status, 0, mechanical.stderr);
  const narrative = runCli(
    ["journal", "write", "--kind", "narrative", "--summary", "The rich entry.", "--session", "s1", "--timestamp", "2026-11-08T13:30:00Z"],
    repo,
  );
  assert.equal(narrative.status, 0, narrative.stderr);
  assert.deepEqual(names(repo), ["20261108T123000Z-main-mechanical-s1.md", "20261108T133000Z-main-narrative-s1.md"]);
});

test("journal write: the narrative door then the shutdown's mechanical entry — both land", () => {
  const repo = newRepo("order-narrative-first");
  const narrative = runCli(
    ["journal", "write", "--kind", "narrative", "--summary", "The rich entry.", "--session", "s1", "--timestamp", PINNED],
    repo,
  );
  assert.equal(narrative.status, 0, narrative.stderr);
  const mechanical = runCli(
    ["journal", "write", "--kind", "mechanical", "--facts", factsFile(repo, "m"), "--session", "s1", "--timestamp", "2026-11-08T13:30:00Z"],
    repo,
  );
  assert.equal(mechanical.status, 0, mechanical.stderr);
  assert.equal(names(repo).length, 2, "a conversation holds one entry per kind, in either order");
});

test("journal write: a second fragment of the same kind is refused, the first one's bytes untouched", () => {
  const repo = newRepo("same-kind");
  const first = runCli(
    ["journal", "write", "--kind", "narrative", "--summary", "First entry.", "--session", "s1", "--timestamp", PINNED],
    repo,
  );
  assert.equal(first.status, 0, first.stderr);
  const landed = fs.readFileSync(path.join(repo, JOURNAL_DIR, "20261108T123000Z-main-narrative-s1.md"), "utf8");
  const second = runCli(
    ["journal", "write", "--kind", "narrative", "--summary", "Second entry.", "--session", "s1", "--timestamp", "2026-11-08T13:30:00Z"],
    repo,
  );
  assert.equal(second.status, 2, second.stdout);
  assert.match(second.stderr, /already registered/u);
  assert.match(second.stderr, /one entry per conversation per kind/u, "the refusal states its own unit — the kind, not the kind-wide session");
  assert.deepEqual(names(repo), ["20261108T123000Z-main-narrative-s1.md"], "no byte written for the second entry");
  assert.equal(
    fs.readFileSync(path.join(repo, JOURNAL_DIR, "20261108T123000Z-main-narrative-s1.md"), "utf8"),
    landed,
    "the first entry's bytes survive the refusal",
  );
});

test("journal write: a second mechanical fragment the SessionEnd hook created is not a duplicate — its own re-run is not refused", () => {
  const repo = newRepo("born-before");
  // The template hook names the fragment itself (log-session-end.sh): two
  // mechanical fragments of one session can already be in the carrier when the
  // writer runs. The guard judges a NEW entry, never the ones already there.
  const hookName = "20261108T120000Z-main-mechanical-s1.md";
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, hookName), "## 2026-11-08T12:00:00Z — main — mechanical\n- **Session:** quit\n");
  const author = runCli(
    ["journal", "write", "--kind", "narrative", "--summary", "The session's narrative.", "--session", "s1", "--timestamp", "2026-11-08T13:30:00Z"],
    repo,
  );
  assert.equal(author.status, 0, author.stderr);
  assert.deepEqual(names(repo), [hookName, "20261108T133000Z-main-narrative-s1.md"], "the hook's fragment is never rewritten and never blocks the writer");
});

test("journal write: the fallback session is not a conversation identity — unflagged writes keep landing", () => {
  const repo = newRepo("fallback");
  for (const [timestamp, summary] of [
    [PINNED, "One conversation's entry."],
    ["2026-11-08T13:30:00Z", "Another conversation's entry."],
  ]) {
    const run = runCli(["journal", "write", "--kind", "narrative", "--summary", summary, "--timestamp", timestamp], repo);
    assert.equal(run.status, 0, run.stderr);
  }
  assert.equal(names(repo).length, 2, "both unflagged writes land — the check never fires on the fallback slug");
});

// ── aggregate --check — the carrier lint (S3) ────────────────────────────

test("journal aggregate --check: every fault is listed and no byte moves", () => {
  const repo = newRepo("check-faults");
  const dir = path.join(repo, JOURNAL_DIR);
  fs.writeFileSync(
    path.join(dir, "20261108T121830Z-main-manual-narrative-local.md"),
    "## 2026-11-08T12:18:30Z — main — manual\n- **Summary:** bad name\n",
  );
  fs.writeFileSync(path.join(dir, "20261108T122239Z-main-narrative-local.md"), "## 2026-11-08T12:22:39Z — main — narrative");
  const before = names(repo).map((name) => [name, fs.readFileSync(path.join(dir, name), "utf8")]);
  const run = runCli(["journal", "aggregate", "--check", "--dir", repo], repo);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /^JOURNAL REFUSAL — /u);
  assert.match(run.stderr, /20261108T121830Z-main-manual-narrative-local\.md/u, "the bad name is listed");
  assert.match(run.stderr, /20261108T122239Z-main-narrative-local\.md/u, "the bad body is listed");
  const after = names(repo).map((name) => [name, fs.readFileSync(path.join(dir, name), "utf8")]);
  assert.deepEqual(after, before, "validate-only: no fragment was consumed, appended or rewritten");
});

test("journal aggregate --check: a conforming carrier passes and counts what it checked", () => {
  const repo = newRepo("check-clean");
  const dir = path.join(repo, JOURNAL_DIR);
  fs.writeFileSync(path.join(dir, ".gitkeep"), "");
  fs.writeFileSync(
    path.join(dir, "20261108T122239Z-main-narrative-local.md"),
    "## 2026-11-08T12:22:39Z — main — narrative\n- **Summary:** ok\n",
  );
  const run = runCli(["journal", "aggregate", "--check", "--dir", repo], repo);
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.equal(receipt.ok, true);
  assert.equal(receipt.checked, 1);
  assert.deepEqual(receipt.refusals, []);
  assert.equal(fs.existsSync(path.join(dir, "20261108T122239Z-main-narrative-local.md")), true);
});

// ── the two model-facing routes converge on one writer (S1/S7) ────────────

test("the skill's fragment step names journal write, not a hand-composed name", () => {
  const skill = fs.readFileSync(path.join(repoRoot, "skills", "log-session", "SKILL.md"), "utf8");
  assert.match(skill, /journal write/u, "the prose door names the one writer");
  assert.doesNotMatch(skill, /save the entry bytes unchanged as that\s+file/u, "the hand-save instruction is gone");
  assert.match(skill, /journal-fragment-grammar@1/u, "the grammar's owner stays named");
});

test("the template's fragment rules name the writer and its grammar owner", () => {
  const doc = fs.readFileSync(path.join(repoRoot, "template", ".agentic-workflow", "journal.md"), "utf8");
  assert.match(doc, /journal write/u, "a target project's carrier doc names the writer, not only the naming service");
  assert.match(doc, /journal-write-grammar@1/u, "and names the grammar owner instead of restating it");
});

// ── the prose states the writer's real unit (issue #468, correction batch 1) ─
//
// The grammar row and the template carrier doc are what a caller reads before
// writing; the guard's unit is the conversation PER KIND, so both say so and
// both keep the shared `local` identity out — a row that says more than the
// code is the same defect as code that does more than the row.

test("the declared prose states one entry per conversation per kind and the shared local identity", () => {
  const readme = fs.readFileSync(path.join(repoRoot, "packages", "agentic-workflow", "README.md"), "utf8");
  const row = /^already-registered \| ([^\n]+)$/mu.exec(readme);
  assert.ok(row, "the grammar row exists in the one owner file");
  assert.match(row[1], /per kind/u, "the row's unit is the kind, as the writer enforces it");
  assert.match(row[1], /explicit `--session local`/u, "the row names the explicit-`local` exemption, not only the absent flag");
  const doc = fs.readFileSync(path.join(repoRoot, "template", ".agentic-workflow", "journal.md"), "utf8");
  assert.match(doc, /per conversation per kind/u, "the carrier doc carries the writer's refusal, not its own older summary");
  assert.doesNotMatch(doc, /One fragment per session per kind/u, "the superseded summary is gone");
});

test("the extension's invocation record names the same writer", () => {
  const source = fs.readFileSync(
    path.join(repoRoot, "packages", "pi-agentic-workflow", "src", "log-session-invocation.ts"),
    "utf8",
  );
  assert.match(source, /journal write/u, "the code door names the one writer");
  assert.doesNotMatch(source, /so write this one file/u, "the path-only instruction is gone");
});
