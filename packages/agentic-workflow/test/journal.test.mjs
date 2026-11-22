/**
 * journal.test.mjs — the session-log fragment carrier and the merge-to-main
 * aggregator (issue #405, unit docs/fix/405-journal-fragments/).
 *
 * This suite is the unit's frozen-failure corpus first (owner S2): the race
 * fixture below reproduces the failure class the issue documents — concurrent
 * journal appends that conflict on merge and lose entries (PE-001:
 * `56409a27` lost, `1e7be55a` restored, PR #280 hand-sequenced) — and it was
 * observed RED before the fragment and aggregator modules existed.
 *
 * The contracts it pins:
 *
 *  - **The name is the identity.** `<UTC-second>-<branch-slug>-<kind>-<session-slug>.md`,
 *    parsed back, never free text (AC2). Two sessions on one branch produce two
 *    fragments; an existing target is refused, never overwritten.
 *  - **The fragment is the entry.** A mechanical fragment's bytes are exactly
 *    `renderEntry(facts)` — the parity AC6 pins — and a narrative fragment is
 *    one `## `-headed entry block.
 *  - **The aggregator is deterministic and forge-free.** Append at the end of
 *    `docs/LOGS.md` (the journal is append-only), batch newest-first with the
 *    declared tie-break, delete the consumed fragments, refuse ambiguity with
 *    a refusal error the CLI maps to exit 2 (AC3/AC5/O11).
 *  - **The race is gone by construction.** Two branches carrying fragments
 *    merge back-to-back cleanly and aggregate with zero lost or duplicated
 *    entries (AC4).
 *  - **Routing is the opt-in.** The local journal publisher writes a fragment
 *    when `.agentic-workflow/journal/` exists and appends to `docs/LOGS.md`
 *    exactly as before when it does not (AC1/O10).
 *  - **The entry slot is the conversation per kind.** A second conforming fragment
 *    of one `(sessionId, kind)` is a lint refusal naming every file, and the
 *    aggregator keeps the newest, naming the superseded one (issue #675).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { renderEntry } from "../src/log/render.mjs";
import { createJournalPublisher } from "../src/log/publish.mjs";
import {
  FRAGMENT_KINDS,
  FragmentError,
  JOURNAL_DIR,
  fragmentName,
  parseFragmentName,
  slug,
  writeFragment,
} from "../src/journal/fragment.mjs";
import { JournalAggregateError, aggregateJournal, checkJournal } from "../src/journal/aggregate.mjs";
import { isoSecond } from "../src/journal/block.mjs";
import { GIT_CONFIG, git, sandboxGitEnv } from "./fixtures.mjs";

/** A complete, valid payload: the one every other case varies from. */
const FACTS = {
  timestamp: "2026-11-05T10:00Z",
  branch: "feat/405-journal-fragments",
  reason: "quit",
  commits: { count: 2, range: "1a2b3c4d…9e8f7a6b" },
  files: ["docs/LOGS.md"],
};

/** The write-time clock the tests pin, so names are stable across runs. */
const NOW = Date.UTC(2026, 10, 5, 10, 0, 0);

function tmp(label) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `journal-${label}-`));
}

function newRepo(label) {
  const dir = tmp(label);
  const r = spawnSync("git", ["-c", "user.name=test", "-c", "user.email=t@example.com", "-c", "commit.gpgsign=false", "init", "-q", "-b", "main", dir], { encoding: "utf8", env: sandboxGitEnv() });
  assert.equal(r.status, 0, r.stderr);
  fs.mkdirSync(path.join(dir, "docs"), { recursive: true });
  fs.writeFileSync(path.join(dir, "docs/LOGS.md"), "# Session log\n\nheader\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base");
  return dir;
}

const MECHANICAL_ENTRY = renderEntry(FACTS);

// ── The naming grammar (AC2) ─────────────────────────────────────────────

test("fragmentName: deterministic from git facts — the same inputs name the same fragment", () => {
  const first = fragmentName({ timestamp: NOW, branch: "feat/405-x", kind: "mechanical", sessionId: "s1" });
  const second = fragmentName({ timestamp: NOW, branch: "feat/405-x", kind: "mechanical", sessionId: "s1" });
  assert.equal(first, second);
  assert.equal(first, "20261105T100000Z-feat-405-x-mechanical-s1.md");
});

test("two simulated sessions on the same branch produce two fragments, never one overwrite", () => {
  const repo = newRepo("two-sessions");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  const a = writeFragment({ root: repo, facts: FACTS, kind: "mechanical", sessionId: "session-a", now: () => NOW });
  const b = writeFragment({
    root: repo,
    facts: { ...FACTS, reason: "clear" },
    kind: "mechanical",
    sessionId: "session-b",
    now: () => NOW,
  });
  assert.ok(a.ok && b.ok, `${a.reason ?? ""} ${b.reason ?? ""}`);
  assert.notEqual(a.name, b.name);
  const names = fs.readdirSync(path.join(repo, JOURNAL_DIR)).sort();
  assert.deepEqual(names, [a.name, b.name].sort());
});

test("slug: branch and session slugs survive the filename grammar", () => {
  assert.equal(slug("feat/405-journal-fragments"), "feat-405-journal-fragments");
  assert.equal(slug("  odd  branch..name  "), "odd-branch..name");
  assert.equal(slug("a".repeat(100)).length, 64);
  assert.equal(slug(""), "x");
  assert.equal(slug("///"), "x");
});

test("an existing target is refused, never overwritten", () => {
  const repo = newRepo("collision");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  const first = writeFragment({ root: repo, facts: FACTS, kind: "mechanical", sessionId: "s1", now: () => NOW });
  assert.ok(first.ok, first.reason);
  const bytes = fs.readFileSync(path.join(repo, JOURNAL_DIR, first.name), "utf8");
  assert.throws(
    () => writeFragment({ root: repo, facts: { ...FACTS, reason: "clear" }, kind: "mechanical", sessionId: "s1", now: () => NOW }),
    FragmentError,
  );
  // The refused write left the first fragment's bytes untouched.
  assert.equal(fs.readFileSync(path.join(repo, JOURNAL_DIR, first.name), "utf8"), bytes);
  assert.equal(fs.readdirSync(path.join(repo, JOURNAL_DIR)).length, 1);
});

test("parseFragmentName round-trips the grammar and refuses free text", () => {
  const name = fragmentName({ timestamp: NOW, branch: "feat/x", kind: "narrative", sessionId: "abc-123" });
  const parsed = parseFragmentName(name);
  assert.deepEqual(parsed, { timestamp: "20261105T100000Z", branch: "feat-x", kind: "narrative", sessionId: "abc-123" });
  assert.equal(parseFragmentName("notes.md"), null);
  assert.equal(parseFragmentName("20261105T100000Z-feat-x.md"), null);
  assert.equal(parseFragmentName("20261105T100000Z-feat-x-political-s1.md"), null); // kind outside the closed set
  assert.equal(parseFragmentName("20261305T100000Z-feat-x-mechanical-s1.md"), null); // not a date
});

test("an unknown kind is refused", () => {
  assert.throws(
    () => fragmentName({ timestamp: NOW, branch: "main", kind: "political", sessionId: "s1" }),
    FragmentError,
  );
  assert.deepEqual([...FRAGMENT_KINDS].sort(), ["mechanical", "narrative"]);
});

// ── The fragment is the entry (AC6 parity) ───────────────────────────────

test("a mechanical fragment's bytes are exactly renderEntry's bytes", () => {
  const repo = newRepo("parity");
  const result = writeFragment({ root: repo, facts: FACTS, kind: "mechanical", sessionId: "s1", now: () => NOW });
  assert.ok(result.ok, result.reason);
  const bytes = fs.readFileSync(path.join(repo, JOURNAL_DIR, result.name), "utf8");
  assert.equal(bytes, MECHANICAL_ENTRY);
});

test("a narrative fragment is one ##-headed entry block, newline-terminated", () => {
  const repo = newRepo("narrative");
  const entry = "## 2026-11-05T10:00Z — feat/x — manual\n- **Summary:** did the thing\n- **Next:** resume here\n";
  const result = writeFragment({ root: repo, kind: "narrative", content: entry, branch: "feat/x", sessionId: "s1", now: () => NOW });
  assert.ok(result.ok, result.reason);
  assert.equal(fs.readFileSync(path.join(repo, JOURNAL_DIR, result.name), "utf8"), entry);
  // Refusals: not an entry block, CRLF, or not newline-terminated.
  assert.throws(() => writeFragment({ root: repo, kind: "narrative", content: "- no heading\n", branch: "feat/x", sessionId: "s1", now: () => NOW }), FragmentError);
  assert.throws(() => writeFragment({ root: repo, kind: "narrative", content: "## heading\r\n- x\n", branch: "feat/x", sessionId: "s1", now: () => NOW }), FragmentError);
  assert.throws(() => writeFragment({ root: repo, kind: "narrative", content: "## heading\n- x", branch: "feat/x", sessionId: "s1", now: () => NOW }), FragmentError);
});

test("a narrative fragment whose heading names another branch is refused, never written", () => {
  const repo = newRepo("name-bytes-branch");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  const content = "## 2026-11-05T10:00Z — docs/domain-separation-safeguard — manual\n- **Summary:** x\n";
  assert.throws(
    () =>
      writeFragment({
        root: repo,
        kind: "narrative",
        content,
        branch: "docs-batch-2-landing-safeguard",
        sessionId: "local",
        now: () => NOW,
      }),
    (error) =>
      error instanceof FragmentError &&
      /branch/.test(error.message) &&
      /docs-batch-2-landing-safeguard/.test(error.message) &&
      /docs\/domain-separation-safeguard/.test(error.message),
  );
  assert.equal(fs.readdirSync(path.join(repo, JOURNAL_DIR)).length, 0, "a refused write leaves no fragment behind");
});

test("a narrative fragment whose heading carries no identity is refused", () => {
  const repo = newRepo("name-bytes-heading");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  const content = "## an entry with no identity line\n- **Summary:** x\n";
  assert.throws(
    () => writeFragment({ root: repo, kind: "narrative", content, branch: "feat/x", sessionId: "s1", now: () => NOW }),
    (error) => error instanceof FragmentError && /heading/.test(error.message),
  );
  assert.equal(fs.readdirSync(path.join(repo, JOURNAL_DIR)).length, 0);
});

// ── The race fixture — the frozen-failure reproducer (AC4) ───────────────

test("two branches carrying fragments merge with zero conflicts and zero lost or duplicated entries", () => {
  const repo = newRepo("race");
  const entryA = "## 2026-11-05T10:00Z — feat/a — manual\n- **Summary:** branch A\n- **Next:** resume A\n";
  const entryB = "## 2026-11-05T10:01Z — feat/b — manual\n- **Summary:** branch B\n- **Next:** resume B\n";

  for (const [branch, entry, session, clock] of [
    ["feat/a", entryA, "session-a", NOW],
    ["feat/b", entryB, "session-b", NOW + 60000],
  ]) {
    git(repo, "checkout", "-qb", branch);
    fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
    const result = writeFragment({ root: repo, kind: "narrative", content: entry, branch, sessionId: session, now: () => clock });
    assert.ok(result.ok, result.reason);
    git(repo, "add", "-A");
    git(repo, "commit", "-qm", `${branch} fragment`);
    git(repo, "checkout", "-q", "main");
  }

  // Back-to-back merges: the case that was manual resolution until now.
  // The merge runs under the fixture identity, like every other fixture
  // invocation: an operator's — or a CI runner's — git config never decides
  // whether this merge succeeds. A runner has no global `user.*`, so an
  // identity-less spawn dies with "empty ident name" instead of exercising
  // the merge under test.
  for (const branch of ["feat/a", "feat/b"]) {
    const merge = spawnSync("git", [...GIT_CONFIG, "-C", repo, "merge", "--no-ff", "-m", `merge ${branch}`, branch], {
      encoding: "utf8",
      env: sandboxGitEnv(),
    });
    assert.equal(merge.status, 0, `merge ${branch} conflicted or failed: ${merge.stdout}\n${merge.stderr}`);
  }

  // Aggregate: both fragments land, newest-first, and nothing is lost or doubled.
  const receipt = aggregateJournal({ root: repo });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.appended.length, 2);
  const log = fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8");
  assert.equal(log.split(entryB.trim()).length - 1, 1, "entry B appears exactly once");
  assert.equal(log.split(entryA.trim()).length - 1, 1, "entry A appears exactly once");
  // Newest name first: the 10:01:00 fragment is appended before the 10:00:00 one.
  const posB = log.indexOf("feat/b — manual");
  const posA = log.indexOf("feat/a — manual");
  assert.ok(posA > posB, "newest-first: the 10:01 entry precedes the 10:00 entry");
  assert.deepEqual(fs.readdirSync(path.join(repo, JOURNAL_DIR)), [], "consumed fragments are deleted");
});

// ── Determinism, idempotency, ordering (AC3) ─────────────────────────────

test("the same fragment set always yields byte-identical docs/LOGS.md (declared tie-break)", () => {
  const entry = (branch, session, minute) =>
    `## 2026-11-05T10:${minute}Z — ${branch} — manual\n- **Summary:** ${branch}/${session}\n- **Next:** x\n`;
  const fragments = [
    { branch: "feat/b", session: "s2", second: "01", minute: "01" },
    { branch: "feat/b", session: "s1", second: "01", minute: "01" }, // tie on timestamp → branch, then session ascending
    { branch: "feat/a", session: "s3", second: "01", minute: "01" }, // tie on timestamp → branch ascending
    { branch: "feat/c", session: "s4", second: "00", minute: "00" }, // older timestamp → appended later; a distinct slot (issue #675)
  ];

  const aggregate = () => {
    const repo = newRepo("determinism");
    fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
    for (const { branch, session, second, minute } of fragments) {
      const name = `20261105T10${second}00Z-${slug(branch)}-narrative-${session}.md`;
      fs.writeFileSync(path.join(repo, JOURNAL_DIR, name), entry(branch, session, minute));
    }
    const receipt = aggregateJournal({ root: repo });
    assert.equal(receipt.ok, true, receipt.reason);
    return fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8");
  };

  const first = aggregate();
  const second = aggregate();
  assert.equal(first, second);
  // Newest timestamp first; ties break branch, then session, ascending.
  const order = [first.indexOf("feat/a/s3"), first.indexOf("feat/b/s1"), first.indexOf("feat/b/s2"), first.indexOf("feat/c/s4")];
  assert.deepEqual([...order].sort((a, b) => a - b), order, "newest-first, then branch, then session ascending");
});

test("re-running on an aggregated set is a no-op diff", () => {
  const repo = newRepo("idempotent");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, "20261105T100000Z-main-mechanical-s1.md"), MECHANICAL_ENTRY);
  const first = aggregateJournal({ root: repo });
  assert.equal(first.ok, true, first.reason);
  const log = fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8");
  assert.deepEqual(fs.readdirSync(path.join(repo, JOURNAL_DIR)), []);

  const second = aggregateJournal({ root: repo });
  assert.equal(second.ok, true, second.reason);
  assert.equal(second.appended.length, 0);
  assert.equal(second.removed.length, 0);
  assert.equal(fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8"), log, "zero diff");
});

test("an already-present entry is consumed without being appended again (crash-safe re-run)", () => {
  const repo = newRepo("already-present");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, "20261105T100000Z-main-mechanical-s1.md"), MECHANICAL_ENTRY);
  const first = aggregateJournal({ root: repo });
  assert.equal(first.ok, true);

  // A crash between append and delete re-presents the same fragment.
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, "20261105T100000Z-main-mechanical-s1.md"), MECHANICAL_ENTRY);
  const second = aggregateJournal({ root: repo });
  assert.equal(second.ok, true, second.reason);
  assert.deepEqual(second.appended, [], "nothing appended twice");
  assert.deepEqual(second.alreadyPresent, ["20261105T100000Z-main-mechanical-s1.md"]);
  const log = fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8");
  assert.equal(log.split(MECHANICAL_ENTRY.trim()).length - 1, 1);
});

// ── Refusals — the aggregator exits non-zero on anything ambiguous (O11) ─

test("an unparseable fragment name is a refusal, before anything is written", () => {
  const repo = newRepo("refusal-name");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, "notes.md"), "## stray\n");
  assert.throws(() => aggregateJournal({ root: repo }), (error) => {
    assert.ok(error instanceof JournalAggregateError);
    assert.match(error.message, /notes\.md/);
    return true;
  });
  assert.match(fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8"), /^# Session log/, "the log is untouched");
  assert.equal(fs.readdirSync(path.join(repo, JOURNAL_DIR)).length, 1, "the ambiguous fragment is not consumed");
});

test("a fragment that is not a newline-terminated entry block is a refusal", () => {
  const repo = newRepo("refusal-content");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, "20261105T100000Z-main-mechanical-s1.md"), "half an entry");
  assert.throws(() => aggregateJournal({ root: repo }), JournalAggregateError);
});

test("a missing journal file is a refusal — the aggregator never creates docs/LOGS.md", () => {
  const repo = newRepo("refusal-no-log");
  fs.rmSync(path.join(repo, "docs/LOGS.md"));
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, "20261105T100000Z-main-mechanical-s1.md"), MECHANICAL_ENTRY);
  assert.throws(() => aggregateJournal({ root: repo }), (error) => {
    assert.match(error.message, /no journal/);
    return true;
  });
  assert.equal(fs.existsSync(path.join(repo, "docs/LOGS.md")), false);
});

test("a missing or empty carrier directory is a no-op, not an error", () => {
  const repo = newRepo("no-op");
  const receipt = aggregateJournal({ root: repo });
  assert.equal(receipt.ok, true);
  assert.equal(receipt.appended.length, 0);
});

// ── The hidden carrier directory is found (AC8's dot-directory caveat) ───

test("the hidden carrier directory is found and consumed by the aggregator", () => {
  const repo = newRepo("dotdir");
  // A `*`-glob walker stops at dot-directories; the aggregator must not.
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, "20261105T100000Z-main-mechanical-s1.md"), MECHANICAL_ENTRY);
  const receipt = aggregateJournal({ root: repo });
  assert.equal(receipt.ok, true, receipt.reason);
  assert.equal(receipt.appended.length, 1);
  assert.match(fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8"), /feat\/405-journal-fragments — auto \(quit\)/);
});

// ── Routing is the opt-in (AC1) ──────────────────────────────────────────

test("the local publisher routes to a fragment when the carrier exists and never touches docs/LOGS.md", () => {
  const repo = newRepo("routing-on");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  const publisher = createJournalPublisher({
    journalPath: path.join(repo, "docs/LOGS.md"),
    fragmentDir: path.join(repo, JOURNAL_DIR),
    sessionId: "session-a",
    now: () => NOW,
  });
  const result = publisher.publish(FACTS);
  assert.equal(result.ok, true, result.error);
  assert.equal(result.written, true);
  assert.equal(result.target, "fragment");
  const log = fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8");
  assert.equal(log, "# Session log\n\nheader\n", "the journal file was not touched");
  const fragments = fs.readdirSync(path.join(repo, JOURNAL_DIR));
  assert.equal(fragments.length, 1);
  assert.equal(fs.readFileSync(path.join(repo, JOURNAL_DIR, fragments[0]), "utf8"), MECHANICAL_ENTRY);
});

test("the local publisher appends to docs/LOGS.md when the carrier is absent — previous behaviour holds", () => {
  const repo = newRepo("routing-off");
  const publisher = createJournalPublisher({ journalPath: path.join(repo, "docs/LOGS.md") });
  const result = publisher.publish(FACTS);
  assert.equal(result.ok, true, result.error);
  assert.equal(result.target, "journal");
  const log = fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8");
  assert.equal(log, `# Session log\n\nheader\n\n${MECHANICAL_ENTRY}`);
  assert.equal(fs.existsSync(path.join(repo, JOURNAL_DIR)), false, "no carrier residue");
});

// ── The CLI — the same module, exit codes included (S11/AC5) ─────────────

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "bin", "agentic-workflow.mjs");

function runCli(args, cwd) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", cwd, env: sandboxGitEnv() });
}

test("journal aggregate: the CLI aggregates, deletes and answers a receipt; a no-op re-run exits 0", () => {
  const repo = newRepo("cli");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, "20261105T100000Z-main-mechanical-s1.md"), MECHANICAL_ENTRY);
  const first = runCli(["journal", "aggregate", "--dir", repo]);
  assert.equal(first.status, 0, first.stderr);
  const receipt = JSON.parse(first.stdout);
  assert.equal(receipt.ok, true);
  assert.deepEqual(receipt.appended, ["20261105T100000Z-main-mechanical-s1.md"]);
  const second = runCli(["journal", "aggregate", "--dir", repo]);
  assert.equal(second.status, 0);
  assert.equal(JSON.parse(second.stdout).fragments, 0);
});

test("journal aggregate: ambiguity is exit 2 with JOURNAL REFUSAL on stderr", () => {
  const repo = newRepo("cli-refusal");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, "notes.md"), "## stray\n");
  const run = runCli(["journal", "aggregate", "--dir", repo]);
  assert.equal(run.status, 2);
  assert.match(run.stderr, /^JOURNAL REFUSAL — /);
  assert.match(run.stderr, /notes\.md/);
});

test("journal name: prints the deterministic fragment path, writes nothing", () => {
  const repo = newRepo("cli-name");
  const run = runCli(["journal", "name", "--kind", "narrative", "--branch", "feat/405-x", "--session", "s1"], repo);
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /^\.agentic-workflow\/journal\/\d{8}T\d{6}Z-feat-405-x-narrative-s1\.md\n$/);
  assert.equal(fs.readdirSync(repo).includes(".agentic-workflow"), false, "nothing was written");
  const refused = runCli(["journal", "name"], repo);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /--kind/);
});

// ── The carrier's placeholder (issue #374 D13: the opt-in outlives a full aggregation) ──

test("a .gitkeep in the carrier is skipped, never consumed — the empty-carrier opt-in persists", () => {
  const repo = newRepo("gitkeep-inert");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, ".gitkeep"), "");
  const receipt = aggregateJournal({ root: repo });
  assert.equal(receipt.ok, true, receipt.reason);
  assert.equal(receipt.fragments, 0);
  assert.equal(fs.existsSync(path.join(repo, JOURNAL_DIR, ".gitkeep")), true, "the placeholder is not consumed");
  // And it does not block a real fragment behind it.
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, "20261105T100000Z-main-mechanical-s1.md"), MECHANICAL_ENTRY);
  const next = aggregateJournal({ root: repo });
  assert.equal(next.ok, true, next.reason);
  assert.equal(next.appended.length, 1);
  assert.equal(fs.existsSync(path.join(repo, JOURNAL_DIR, ".gitkeep")), true);
});

test("any other non-fragment file in the carrier is still refused", () => {
  const repo = newRepo("gitkeep-not-a-wildcard");
  fs.mkdirSync(path.join(repo, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, "README.md"), "docs");
  assert.throws(() => aggregateJournal({ root: repo }), /unparseable fragment name/u);
  fs.rmSync(path.join(repo, JOURNAL_DIR, "README.md"));
  fs.writeFileSync(path.join(repo, JOURNAL_DIR, ".keep"), "");
  assert.throws(() => aggregateJournal({ root: repo }), /unparseable fragment name/u, "the placeholder set is exactly .gitkeep");
});

// ── The cross-fragment identity rule (issue #675) ────────────────────────
//
// The frozen-failure corpus is the live pair from 2026-11-21, published on
// `feat/600-config-default-materialization`: one conversation (session
// `01a1fbaf-…`), one kind, two fragments with different bytes. The per-fragment
// lint passed both and the aggregator appended both, because dedupe only ever
// asked whether the *bytes* were already in the journal.
//
// The rule the pairs below pin: the grammar's unit is the conversation per
// kind, so `(sessionId, kind)` is the entry slot. The lint refuses a slot with
// more than one conforming fragment, naming every file; the aggregator never
// appends two of them — it keeps the newest and records the superseded one in
// its receipt. The shared `local` slug is not a conversation
// (`journal-write-grammar@1`) and stays exempt on both sides.

/** The published pair, frozen with the names and the bytes' shape they carried. */
const LIVE_PAIR = [
  {
    name: "20261121T020442Z-feat-600-config-default-materialization-narrative-01a1fbaf-0b4f-74c8-a90a-030e00929f08.md",
    content:
      "## 2026-11-21T02:04:42Z — feat/600-config-default-materialization — config default materialization (issue #600)\n- **Summary:** the unit as of 02:04Z — commits unpushed, gate PASS, awaiting the owner's verdict\n",
  },
  {
    name: "20261121T114851Z-feat-600-config-default-materialization-narrative-01a1fbaf-0b4f-74c8-a90a-030e00929f08.md",
    content:
      "## 2026-11-21T11:48:51Z — feat/600-config-default-materialization — config default materialization (issue #600) — unit complete, PR opened\n- **Summary:** the corrected entry\n",
  },
];

/** Write a fixture carrier from `{ name, content }` rows. */
function carrier(repo, fragments) {
  const dir = path.join(repo, JOURNAL_DIR);
  fs.mkdirSync(dir, { recursive: true });
  for (const { name, content } of fragments) fs.writeFileSync(path.join(dir, name), content);
  return dir;
}

/** One conforming narrative fragment, landed through the library's own writer. */
function narrative(repo, { branch, sessionId, at, label = "narrative" }) {
  return writeFragment({
    root: repo,
    kind: "narrative",
    branch,
    sessionId,
    now: () => at,
    content: `## ${isoSecond(at)} — ${branch} — ${label}\n- **Summary:** ${label}\n`,
  });
}

/** The literal name as a regex, so a reason assertion names the file it means. */
const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

function carrierBytes(repo) {
  const dir = path.join(repo, JOURNAL_DIR);
  return fs.readdirSync(dir).sort().map((name) => [name, fs.readFileSync(path.join(dir, name), "utf8")]);
}

test("checkJournal refuses two fragments of one conversation+kind, naming both files", () => {
  const repo = newRepo("identity-collision");
  carrier(repo, LIVE_PAIR);
  const before = carrierBytes(repo);

  const receipt = checkJournal({ root: repo });
  assert.equal(receipt.ok, false);
  assert.equal(receipt.checked, 2);
  assert.equal(receipt.refusals.length, 1, "one refusal per colliding identity slot");
  const reason = receipt.refusals[0].reason;
  for (const { name } of LIVE_PAIR) assert.match(reason, new RegExp(literal(name)), `the refusal names ${name}`);
  assert.match(reason, /one entry per conversation per kind/u);
  assert.deepEqual(carrierBytes(repo), before, "the lint is a reporter: no fragment moved");
});

test("journal aggregate --check refuses the live pair, names both and moves no byte", () => {
  const repo = newRepo("identity-collision-cli");
  carrier(repo, LIVE_PAIR);
  const before = carrierBytes(repo);

  const run = runCli(["journal", "aggregate", "--check", "--dir", repo], repo);
  assert.equal(run.status, 2);
  assert.match(run.stderr, new RegExp(`^JOURNAL REFUSAL — ${LIVE_PAIR.length} non-conforming fragment`, "u"));
  for (const { name } of LIVE_PAIR) assert.match(run.stderr, new RegExp(literal(name)), `stderr names ${name}`);
  assert.deepEqual(carrierBytes(repo), before, "validate-only: nothing consumed, appended or rewritten");
});

test("checkJournal keeps non-colliding carriers green", () => {
  const empty = newRepo("green-empty");
  fs.mkdirSync(path.join(empty, JOURNAL_DIR), { recursive: true });
  fs.writeFileSync(path.join(empty, JOURNAL_DIR, ".gitkeep"), "");
  const placeholder = checkJournal({ root: empty });
  assert.equal(placeholder.ok, true);
  assert.equal(placeholder.checked, 0, "the placeholder is skipped, never counted as an entry");

  const one = newRepo("green-one");
  narrative(one, { branch: "feat/x", sessionId: "s1", at: NOW });
  assert.equal(checkJournal({ root: one }).ok, true);

  const bothKinds = newRepo("green-kinds");
  writeFragment({ root: bothKinds, facts: FACTS, kind: "mechanical", sessionId: "s1", now: () => NOW });
  narrative(bothKinds, { branch: "feat/405-journal-fragments", sessionId: "s1", at: NOW + 1000 });
  const kinds = checkJournal({ root: bothKinds });
  assert.equal(kinds.ok, true, "the auto-log's mechanical entry and /log-session's narrative one coexist");
  assert.equal(kinds.checked, 2);

  const twoSessions = newRepo("green-sessions");
  narrative(twoSessions, { branch: "feat/x", sessionId: "s1", at: NOW });
  narrative(twoSessions, { branch: "feat/x", sessionId: "s2", at: NOW });
  assert.equal(checkJournal({ root: twoSessions }).ok, true);
});

// ── The sanctioned errata chain (issue #676) ───────────────────────────────
//
// A stale entry is corrected by a NEW fragment that declares the one it
// corrects, never by editing the stale bytes. The lint reads a slot as one
// entry plus its corrections: newest first, every fragment but the oldest
// declares the one immediately older than it in its `Supersedes` cell, and the
// oldest (the entry being corrected) declares nothing. Anything else is still
// the duplicate #675 refuses, naming every file.

/** A stale narrative entry and the correction that declares it. */
function errataPair(repo, { at = NOW, branch = "feat/x", sessionId = "s1" } = {}) {
  const stale = narrative(repo, { branch, sessionId, at, label: "the stale entry" });
  const correction = writeFragment({
    root: repo,
    kind: "narrative",
    branch,
    sessionId,
    now: () => at + 1000,
    content: `## ${isoSecond(at + 1000)} — ${branch} — the corrected entry\n- **Summary:** the corrected entry\n- **Supersedes:** ${stale.name}\n`,
  });
  return { stale, correction };
}

test("checkJournal accepts a slot that is one entry plus its declared correction", () => {
  const repo = newRepo("errata-chain");
  const { stale, correction } = errataPair(repo);
  const before = carrierBytes(repo);

  const receipt = checkJournal({ root: repo });
  assert.deepEqual(receipt.refusals, [], "an entry and the correction that declares it are one slot");
  assert.equal(receipt.ok, true);
  assert.equal(receipt.checked, 2);
  assert.deepEqual(carrierBytes(repo), before, "the lint is a reporter: no fragment moved");
  assert.ok([stale.name, correction.name].every((name) => before.some(([held]) => held === name)));
});

test("checkJournal refuses a slot whose correction names the wrong predecessor", () => {
  const repo = newRepo("errata-wrong-predecessor");
  const { stale } = errataPair(repo);
  const middle = writeFragment({
    root: repo,
    kind: "narrative",
    branch: "feat/x",
    sessionId: "s1",
    now: () => NOW + 2000,
    content: `## ${isoSecond(NOW + 2000)} — feat/x — the middle correction\n- **Summary:** second\n- **Supersedes:** ${stale.name}\n`,
  });
  // The newest correction declares the oldest fragment, skipping the one the
  // chain requires: the slot is no longer one entry plus its corrections.
  const newest = writeFragment({
    root: repo,
    kind: "narrative",
    branch: "feat/x",
    sessionId: "s1",
    now: () => NOW + 3000,
    content: `## ${isoSecond(NOW + 3000)} — feat/x — a correction that skips one\n- **Summary:** third\n- **Supersedes:** ${stale.name}\n`,
  });

  const receipt = checkJournal({ root: repo });
  assert.equal(receipt.ok, false);
  assert.equal(receipt.refusals.length, 1, "one refusal per broken slot");
  const reason = receipt.refusals[0].reason;
  for (const name of [stale.name, middle.name, newest.name]) assert.match(reason, new RegExp(literal(name)), `the refusal names ${name}`);
  assert.match(reason, /one entry per conversation per kind/u);
  assert.match(reason, /immediately older/u, "the refusal states the chain rule it broke");
});

test("checkJournal refuses a fragment that declares two corrections", () => {
  const repo = newRepo("errata-two-cells");
  const stale = narrative(repo, { branch: "feat/x", sessionId: "s1", at: NOW, label: "first" });
  const other = narrative(repo, { branch: "feat/x", sessionId: "s2", at: NOW, label: "second conversation" });
  carrier(repo, [
    {
      name: "20261105T100500Z-feat-x-narrative-s1.md",
      content: `## 2026-11-05T10:05:00Z — feat/x — two links\n- **Summary:** ambiguous\n- **Supersedes:** ${stale.name}\n- **Supersedes:** ${other.name}\n`,
    },
  ]);

  const receipt = checkJournal({ root: repo });
  assert.equal(receipt.ok, false);
  const reason = receipt.refusals.map((refusal) => refusal.reason).join("\n");
  assert.match(reason, /declares 2 correction cells/u, "two links are an ambiguity, never a guess");
});

test("checkJournal refuses a lone fragment that declares a correction", () => {
  const repo = newRepo("errata-lone");
  const name = "20261105T100500Z-feat-x-narrative-s9.md";
  carrier(repo, [
    {
      name,
      content:
        "## 2026-11-05T10:05:00Z — feat/x — lone\n" +
        "- **Summary:** a link to nothing\n" +
        "- **Supersedes:** 20200101T000000Z-feat-x-narrative-s9.md\n",
    },
  ]);

  const receipt = checkJournal({ root: repo });
  assert.equal(receipt.ok, false, "the oldest fragment names nothing — a lone link dangles or points outside the slot");
  assert.equal(receipt.refusals.length, 1, "one refusal");
  const reason = receipt.refusals[0].reason;
  assert.match(reason, new RegExp(literal(name)), `the refusal names ${name}`);
  assert.match(reason, /the oldest fragment is the entry a correction names/u, "the chain rule it broke");
  assert.match(reason, /declares Supersedes/u, "the refusal quotes the declared link");
});

test("the aggregator integrates a declared correction once and names the superseded fragment", () => {
  const repo = newRepo("errata-aggregate");
  const { stale, correction } = errataPair(repo);

  const receipt = aggregateJournal({ root: repo });
  assert.deepEqual(receipt.appended, [correction.name], "the correction is the entry that lands");
  assert.deepEqual(receipt.superseded, [{ name: stale.name, supersededBy: correction.name }]);
  const log = fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8");
  assert.equal(log.includes("the corrected entry"), true, "the correction reached the journal");
  assert.equal(log.includes("the stale entry"), false, "the stale bytes never reach the journal");
  assert.deepEqual(fs.readdirSync(path.join(repo, JOURNAL_DIR)), [], "both fragments are consumed");
});

test("journal aggregate --check is green on the errata pair and moves no byte", () => {
  const repo = newRepo("errata-chain-cli");
  errataPair(repo);
  const before = carrierBytes(repo);

  const run = runCli(["journal", "aggregate", "--check", "--dir", repo], repo);
  assert.equal(run.status, 0, run.stderr);
  assert.equal(JSON.parse(run.stdout).ok, true);
  assert.deepEqual(carrierBytes(repo), before, "validate-only: nothing consumed or rewritten");
});


test("checkJournal keeps the shared local identity legal", () => {
  const repo = newRepo("green-local");
  narrative(repo, { branch: "feat/668-x", sessionId: "local", at: NOW });
  narrative(repo, { branch: "feat/668-x", sessionId: "local", at: NOW + 1000 });

  const receipt = checkJournal({ root: repo });
  assert.equal(receipt.ok, true, "the shared slug is not a conversation — journal-write-grammar@1's own sentence");
  const aggregated = aggregateJournal({ root: repo });
  assert.equal(aggregated.appended.length, 2, "two unflagged conversations stay two entries");
  assert.deepEqual(aggregated.superseded, []);
});

test("two writes that raced past the writer's already-registered check are refused by the lint", () => {
  const repo = newRepo("straggler");
  const first = narrative(repo, { branch: "feat/x", sessionId: "s1", at: NOW, label: "first" });
  const second = narrative(repo, { branch: "feat/x", sessionId: "s1", at: NOW + 1000, label: "second" });
  assert.ok(first.ok && second.ok, "the exclusive create cannot see the racing writer: both land");

  const receipt = checkJournal({ root: repo });
  assert.equal(receipt.ok, false, "the read side nets the write-time TOCTOU");
  assert.equal(receipt.refusals.length, 1);
  assert.match(receipt.refusals[0].reason, new RegExp(literal(first.name)));
  assert.match(receipt.refusals[0].reason, new RegExp(literal(second.name)));
});

test("the aggregator consumes the newest of a colliding pair and names the superseded fragment", () => {
  const repo = newRepo("identity-supersede");
  carrier(repo, LIVE_PAIR);
  const [older, newest] = LIVE_PAIR;

  const receipt = aggregateJournal({ root: repo });
  assert.equal(receipt.ok, true, receipt.reason);
  assert.deepEqual(receipt.appended, [newest.name]);
  assert.deepEqual(receipt.superseded, [{ name: older.name, supersededBy: newest.name }]);
  assert.deepEqual([...receipt.removed].sort(), [older.name, newest.name].sort());

  const log = fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8");
  assert.equal(log.split(newest.content.trim()).length - 1, 1, "the kept entry appears exactly once");
  assert.equal(log.includes(older.content.trim()), false, "the superseded bytes never reach the journal");
  assert.deepEqual(fs.readdirSync(path.join(repo, JOURNAL_DIR)), [], "both fragments are consumed");
});

test("three fragments of one slot keep only the newest, each supersede named", () => {
  const repo = newRepo("identity-triple");
  const at = (second) => NOW + second * 1000;
  const rows = [narrative(repo, { branch: "feat/x", sessionId: "s1", at: at(0), label: "first" }),
    narrative(repo, { branch: "feat/x", sessionId: "s1", at: at(1), label: "second" }),
    narrative(repo, { branch: "feat/x", sessionId: "s1", at: at(2), label: "third" })];
  assert.ok(rows.every((row) => row.ok));

  const receipt = aggregateJournal({ root: repo });
  assert.deepEqual(receipt.appended, [rows[2].name]);
  assert.deepEqual(receipt.superseded, [
    { name: rows[1].name, supersededBy: rows[2].name },
    { name: rows[0].name, supersededBy: rows[2].name },
  ]);
});

test("the supersede decision depends on the identity slot, not on byte coincidence", () => {
  const aggregate = () => {
    const repo = newRepo("identity-determinism");
    carrier(repo, LIVE_PAIR);
    return { receipt: aggregateJournal({ root: repo }), log: fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8") };
  };
  const first = aggregate();
  const second = aggregate();
  assert.deepEqual(first.receipt.superseded, second.receipt.superseded);
  assert.deepEqual(first.receipt.appended, [LIVE_PAIR[1].name]);
  assert.equal(first.log, second.log, "two runs over one corpus are byte-identical");
});

test("journal aggregate: a colliding pair appends one entry, consumes both and names the superseded one", () => {
  const repo = newRepo("identity-cli");
  carrier(repo, LIVE_PAIR);
  const [older, newest] = LIVE_PAIR;

  const run = runCli(["journal", "aggregate", "--dir", repo], repo);
  assert.equal(run.status, 0, run.stderr);
  const receipt = JSON.parse(run.stdout);
  assert.deepEqual(receipt.appended, [newest.name]);
  assert.deepEqual(receipt.superseded, [{ name: older.name, supersededBy: newest.name }]);
  const log = fs.readFileSync(path.join(repo, "docs/LOGS.md"), "utf8");
  assert.equal(log.split(newest.content.trim()).length - 1, 1, "one copy, never two");
});
