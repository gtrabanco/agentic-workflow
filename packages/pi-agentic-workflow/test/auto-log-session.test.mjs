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

import { sandboxGitEnv } from "./git-sandbox.mjs";
import {
  JOURNAL_PATH,
  MARKER_DIR,
  STALE_MARKER_MS,
  collectFiles,
  createMarker,
  hasJournal,
  isoMinute,
  markerPath,
  purgeStaleMarkers,
  readMarker,
  removeMarker,
  buildFacts,
  shortSha,
} from "../dist/auto-log-session.js";
import { normalizeFacts } from "@gtrabanco/agentic-workflow/src/log/render.mjs";

/** A throwaway git repository; `root` is the project root. */
function repo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "auto-log-session-"));
  const run = (args, cwd = root) => execFileSync("git", ["-c", "user.name=suite", "-c", "user.email=suite@example.test", "-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8", env: sandboxGitEnv() });
  run(["init", "-q", "-b", "main"]);
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
  assert.deepEqual(fs.readFileSync(markerPath(root, "s1"), "utf8").trim().split(" "), [
    record.sha,
    String(record.epoch),
    record.iso,
  ]);
  assert.deepEqual(readMarker(root, "s1"), { sha: record.sha, epoch: record.epoch, iso: record.iso });
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

test("AM-05 a detached HEAD is named `detached`, not left empty", () => {
  const { root, run } = repo();
  const marker = createMarker({ root, sessionId: "s1" });
  run(["checkout", "-q", "--detach", "HEAD"]);
  // The branch is a fact of the *shutdown*, not of the marker: a session can
  // switch branches, and the hook reads it at the end for the same reason.
  assert.equal(buildFacts({ root, marker, reason: "quit" }).branch, "detached");
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
  run(["add", "."]);
  run(["commit", "-q", "-m", "clean up"]);
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
  // The fragment carrier's presence is the opt-in too (issue #405): a project
  // that opted in without a journal file yet still writes its fragments.
  fs.mkdirSync(path.join(root, ".agentic-workflow", "journal"), { recursive: true });
  assert.equal(hasJournal(root), true);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-12 the git reader ignores ambient GIT_DIR-style environment, so a run inside a tooling worktree cannot leak facts out of the project", () => {
  const { root, run } = repo();
  const decoy = fs.mkdtempSync(path.join(os.tmpdir(), "auto-log-decoy-"));
  run(["init", "-q", "-b", "decoy"], decoy);
  const leakVars = {
    GIT_DIR: path.join(decoy, ".git"),
    GIT_WORK_TREE: decoy,
    GIT_INDEX_FILE: path.join(decoy, ".git", "index"),
    GIT_OBJECT_DIRECTORY: path.join(decoy, ".git", "objects"),
    GIT_COMMON_DIR: path.join(decoy, ".git"),
  };
  const saved = { ...process.env };
  Object.assign(process.env, leakVars);
  try {
    const facts = buildFacts({ root, marker: null, reason: "quit", now: () => 0 });
    assert.equal(facts.branch, "main");
  } finally {
    process.env = saved;
    fs.rmSync(decoy, { recursive: true, force: true });
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("AM-11 the timestamp is a UTC minute stamp, the hook's own precision", () => {
  assert.equal(isoMinute(Date.parse("2026-11-04T15:12:43.999Z")), "2026-11-04T15:12Z");
  assert.equal(isoMinute(Date.parse("2026-01-01T00:00:00Z")), "2026-01-01T00:00Z");
  assert.match(isoMinute(Date.now()), /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z$/u);
});

// --- stale markers (#623 S3) -----------------------------------------------
//
// The marker was written at `session_start` and removed at `session_shutdown`
// only. A host whose session never tears down therefore left its marker on disk
// forever, while the reader that never adopts a found marker kept the file inert.
// The run boundary removes the marker now; the purge is the other half — a marker
// that a crash or an older build stranded is removed once it is older than the
// retention window, so the directory does not accumulate one file per dead
// session. It is a sweeper, never an adoption: nothing here reads a marker.

/** A marker file carrying the epoch the sweep compares, in the writer's own shape. */
function seedMarker(root, sessionId, epochSeconds) {
  fs.mkdirSync(path.join(root, MARKER_DIR), { recursive: true });
  fs.writeFileSync(markerPath(root, sessionId), `abc1234 ${epochSeconds} 2026-11-01T00:00Z\n`);
}

const NOW_MS = Date.parse("2026-11-18T10:00:00Z");

test("AM-13 a marker older than the window is purged, a recent one and this session's mark survive", () => {
  const { root } = repo();
  seedMarker(root, "expired", Math.floor((NOW_MS - 8 * 86_400_000) / 1000));
  seedMarker(root, "edge", Math.floor((NOW_MS - STALE_MARKER_MS) / 1000));
  seedMarker(root, "recent", Math.floor((NOW_MS - 60_000) / 1000));

  const purged = purgeStaleMarkers({ root, now: () => NOW_MS });

  assert.deepEqual(purged, ["expired"], "only the marker past the window is removed");
  assert.equal(fs.existsSync(markerPath(root, "expired")), false);
  assert.equal(fs.existsSync(markerPath(root, "edge")), true, "a marker exactly at the window is not older than it");
  assert.equal(fs.existsSync(markerPath(root, "recent")), true, "a live session's marker is never swept");
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-14 the sweep reads only markers it can date, and an absent directory is not an error", () => {
  const { root } = repo();
  seedMarker(root, "undated", 0);
  fs.writeFileSync(markerPath(root, "undated"), "garbage\n");  fs.writeFileSync(path.join(root, MARKER_DIR, "notes.txt"), "keep me\n");

  assert.deepEqual(purgeStaleMarkers({ root, now: () => NOW_MS }), [], "a marker whose stamp does not parse has no provable age");
  assert.equal(fs.existsSync(markerPath(root, "undated")), true);
  assert.equal(fs.readFileSync(path.join(root, MARKER_DIR, "notes.txt"), "utf8"), "keep me\n", "the sweep only touches marker files");

  const fresh = fs.mkdtempSync(path.join(os.tmpdir(), "auto-log-session-nomarkers-"));
  assert.deepEqual(purgeStaleMarkers({ root: fresh, now: () => NOW_MS }), [], "no directory, nothing to sweep");
  fs.rmSync(fresh, { recursive: true, force: true });
  fs.rmSync(root, { recursive: true, force: true });
});

test("AM-15 this session's own marker is written after the sweep, so the sweep can never eat it", () => {
  const { root } = repo();
  seedMarker(root, "crashed", Math.floor((NOW_MS - 30 * 86_400_000) / 1000));
  const purged = purgeStaleMarkers({ root, now: () => NOW_MS });
  const marker = createMarker({ root, sessionId: "live", now: () => NOW_MS });
  assert.deepEqual(purged, ["crashed"]);
  assert.ok(marker, "the live session still records its own marker");
  assert.equal(fs.existsSync(markerPath(root, "live")), true);
  fs.rmSync(root, { recursive: true, force: true });
});
