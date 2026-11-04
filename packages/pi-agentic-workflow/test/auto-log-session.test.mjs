// auto-log-session.test.mjs — the facts builder and the marker store (feature
// #394, S5/S9/S11), with no pi and no live session.
//
// Two halves, and they are deliberately separate from the wiring suite: this one
// runs in a throwaway git repository and asserts on the *bytes* the module
// produces, so a failure here says "the facts are wrong", never "the event did
// not fire".
//
// The marker is the interesting half. It lives at `.pi/.session-<id>.start` —
// the package's own directory, not the Claude hook's `.claude/` namespace — and
// it is only ever read back by the session that wrote it: `createMarker` returns
// the record it wrote, and nothing in this module *searches* for a marker. That
// is what makes "a marker left by a crashed session must never be adopted" an
// absence of code rather than a check somebody can delete.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  JOURNAL_PATH,
  MARKER_DIR,
  collectFiles,
  createMarker,
  hasJournal,
  isoMinute,
  markerPath,
  readMarker,
  removeMarker,
  buildFacts,
  shortSha,
} from "../dist/auto-log-session.js";
import { normalizeFacts } from "@gtrabanco/agentic-workflow/src/log/render.mjs";

/** A throwaway git repository; `root` is the project root. */
function repo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "auto-log-session-"));
  const run = (args) => execFileSync("git", args, { cwd: root, encoding: "utf8" });
  run(["init", "-q", "-b", "main"]);
  run(["config", "user.email", "suite@example.test"]);
  run(["config", "user.name", "suite"]);
  run(["config", "commit.gpgsign", "false"]);
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.writeFileSync(path.join(root, JOURNAL_PATH), "# Session log\n\n");
  fs.writeFileSync(path.join(root, "a.txt"), "a\n");
  run(["add", "."]);
  run(["commit", "-q", "-m", "seed"]);
  return { root, run };
}

test("AM-01 the marker lives in the package's own directory, never the hook's", () => {
  assert.equal(MARKER_DIR, ".pi");
  assert.equal(JOURNAL_PATH, "docs/LOGS.md");
  assert.equal(markerPath("/project", "abc"), path.join("/project", ".pi", ".session-abc.start"));
  assert.equal(markerPath("/project", "abc").includes(".claude"), false);
});

test("AM-02 createMarker writes `<short-sha> <epoch> <iso>` and returns what it wrote", () => {
  const { root, run } = repo();
  const record = createMarker({ root, sessionId: "s1", now: () => Date.parse("2026-11-04T15:12:43Z") });
  assert.ok(record);
  assert.equal(record.sha, run(["rev-parse", "--short", "HEAD"]).trim());
  assert.equal(record.iso, "2026-11-04T15:12Z");
  assert.equal(record.epoch, Math.floor(Date.parse("2026-11-04T15:12:43Z") / 1000));
  assert.equal(record.branch, "main");
  assert.deepEqual(fs.readFileSync(markerPath(root, "s1"), "utf8").trim().split(" "), [
    record.sha,
    String(record.epoch),
    record.iso,
  ]);
  assert.deepEqual(readMarker(root, "s1"), { sha: record.sha, epoch: record.epoch, iso: record.iso, branch: record.branch });
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-03 a marker written by another session id is neither read nor removed", () => {
  const { root } = repo();
  createMarker({ root, sessionId: "other-session", now: () => 1_760_000_000_000 });
  createMarker({ root, sessionId: "mine", now: () => 1_760_000_100_000 });
  assert.equal(fs.existsSync(markerPath(root, "other-session")), true);
  // Removing my own marker leaves the other session's alone: two sessions in one
  // workspace are legal, and a session only cleans up after itself.
  removeMarker(root, "mine");
  assert.equal(fs.existsSync(markerPath(root, "mine")), false);
  assert.equal(fs.existsSync(markerPath(root, "other-session")), true);
  assert.equal(readMarker(root, "absent"), null);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-04 outside a git repository there is no marker and no half-written state", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "auto-log-session-nogit-"));
  assert.equal(createMarker({ root, sessionId: "s1" }), null);
  assert.equal(fs.existsSync(path.join(root, MARKER_DIR)), false);
  assert.equal(buildFacts({ root, sessionId: "s1", reason: "quit" }), null);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-05 a detached HEAD is named, not left empty", () => {
  const { root, run } = repo();
  run(["checkout", "-q", "--detach", "HEAD"]);
  assert.equal(createMarker({ root, sessionId: "s1" }).branch, "detached");
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-06 the path list unions the committed range with what is still uncommitted", () => {
  const { root, run } = repo();
  const start = run(["rev-parse", "--short", "HEAD"]).trim();
  fs.writeFileSync(path.join(root, "committed.txt"), "c\n");
  run(["add", "."]);
  run(["commit", "-q", "-m", "committed"]);
  fs.writeFileSync(path.join(root, "dirty.txt"), "d\n");
  fs.writeFileSync(path.join(root, "untracked.txt"), "u\n");
  assert.deepEqual(collectFiles({ root, startSha: start }), ["committed.txt", "dirty.txt", "untracked.txt"]);
  // A session that changed nothing lists nothing — the entry renders `—`.
  assert.deepEqual(collectFiles({ root, startSha: run(["rev-parse", "--short", "HEAD"]).trim() }), []);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-07 the facts payload is the frozen contract, and it validates against the renderer's own schema", () => {
  const { root } = repo();
  const record = createMarker({ root, sessionId: "s1", now: () => Date.parse("2026-11-04T15:12:00Z") });
  const facts = buildFacts({ root, marker: record, reason: "quit", now: () => Date.parse("2026-11-04T16:00:29Z") });
  assert.deepEqual(Object.keys(facts).sort(), ["branch", "commits", "files", "reason", "timestamp"]);
  assert.equal(facts.timestamp, "2026-11-04T16:00Z");
  assert.equal(facts.reason, "quit");
  assert.deepEqual(facts.commits, { count: 0, range: `${record.sha}…${record.sha}` });
  const result = normalizeFacts(facts);
  assert.equal(result.ok, true, result.ok ? "" : result.reason);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-08 the range grows with the session's commits and keeps both short shas", () => {
  const { root, run } = repo();
  const record = createMarker({ root, sessionId: "s1", now: () => 0 });
  fs.writeFileSync(path.join(root, "b.txt"), "b\n");
  run(["add", "."]);
  run(["commit", "-q", "-m", "one"]);
  fs.writeFileSync(path.join(root, "c.txt"), "c\n");
  run(["add", "."]);
  run(["commit", "-q", "-m", "two"]);
  const facts = buildFacts({ root, marker: record, reason: "quit", now: () => 0 });
  assert.equal(facts.commits.count, 2);
  assert.equal(facts.commits.range, `${record.sha}…${shortSha(root)}`);
  assert.match(facts.commits.range, /^[0-9a-f]{4,40}…[0-9a-f]{4,40}$/u);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-09 without a marker the entry says so instead of inventing a range", () => {
  const { root } = repo();
  const facts = buildFacts({ root, marker: null, reason: "quit", now: () => 0 });
  assert.deepEqual(facts.commits, { count: 0, range: null });
  assert.equal(facts.branch, "main");
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-10 the journal check is a real check, not a promise about the config", () => {
  const { root } = repo();
  assert.equal(hasJournal(root), true);
  fs.rmSync(path.join(root, JOURNAL_PATH));
  assert.equal(hasJournal(root), false);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-11 the timestamp is a UTC minute stamp, the hook's own precision", () => {
  assert.equal(isoMinute(Date.parse("2026-11-04T15:12:43.999Z")), "2026-11-04T15:12Z");
  assert.equal(isoMinute(Date.parse("2026-01-01T00:00:00Z")), "2026-01-01T00:00Z");
  assert.match(isoMinute(Date.now()), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/u);
});
