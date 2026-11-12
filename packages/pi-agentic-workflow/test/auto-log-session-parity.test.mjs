// auto-log-session-parity.test.mjs — the entry bytes are the hook's bytes
// (feature #394, S8).
//
// The parity is executed, never asserted in prose: this suite runs
// `template/.claude/hooks/log-session-start.sh` and `log-session-end.sh` for real
// in a throwaway repository, takes the block they appended, and compares it —
// byte for byte, leading newline included — with what this package appends for
// the same session facts. The hook is the oracle because it is what a project
// that does not run pi already has.
//
// Two sessions are pinned: one with a commit in its range and one without, since
// the second is the shape most pi sessions end in and it is the one a
// re-formatting would break first.

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildFacts, createMarker, markerPath } from "../dist/auto-log-session.js";
import { isRenderedEntry, renderEntry } from "@gtrabanco/agentic-workflow/src/log/render.mjs";
import { parseFragmentName } from "@gtrabanco/agentic-workflow/src/journal/fragment.mjs";

import { sandboxGitEnv } from "./git-sandbox.mjs";

const PKG_DIR = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const HOOKS = path.resolve(PKG_DIR, "..", "..", "template", ".claude", "hooks");
const CLI = path.resolve(PKG_DIR, "..", "agentic-workflow", "bin", "agentic-workflow.mjs");
const SESSION = "parity-394";
const JOURNAL = "docs/LOGS.md";
const INITIAL = "# Session log\n\n";

/** A throwaway repository with the journal the hooks append to. */
function repo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "auto-log-parity-"));
  const git = (args) => execFileSync("git", ["-c", "user.name=suite", "-c", "user.email=suite@example.test", "-c", "commit.gpgsign=false", ...args], { cwd: root, encoding: "utf8", env: sandboxGitEnv() });
  git(["init", "-q", "-b", "main"]);
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.writeFileSync(path.join(root, JOURNAL), INITIAL);
  fs.writeFileSync(path.join(root, "seed.txt"), "seed\n");
  git(["add", "."]);
  git(["commit", "-q", "-m", "seed"]);
  return { root, git };
}

/** Run a template hook with a JSON payload on stdin, in `root`. */
function hook(root, name, payload) {
  const result = spawnSync("bash", [path.join(HOOKS, name)], {
    cwd: root,
    input: JSON.stringify(payload),
    encoding: "utf8",
    env: sandboxGitEnv(),
  });
  assert.equal(result.status, 0, `${name} exited ${result.status}: ${result.stderr}`);
}

/**
 * The session the hook wrote: its marker (as the start hook left it) and the
 * block the end hook appended. `timestamp` is read back from the hook's own
 * header, because the hook has no clock to inject — feeding it back to our
 * renderer is what makes the comparison byte-exact instead of pattern-based.
 */
function hookedSession({ commits = 1 } = {}) {
  const { root, git } = repo();
  hook(root, "log-session-start.sh", { session_id: SESSION });
  // The hook's own starting point: read from git, not from its `.claude/`
  // marker — the two writers keep separate namespaces on purpose (AP-04).
  const startSha = git(["rev-parse", "--short", "HEAD"]).trim();
  for (let index = 0; index < commits; index += 1) {
    fs.writeFileSync(path.join(root, `work-${index}.txt`), `${index}\n`);
    git(["add", "."]);
    git(["commit", "-q", "-m", `work ${index}`]);
  }
  hook(root, "log-session-end.sh", { session_id: SESSION, reason: "exit" });
  const journal = fs.readFileSync(path.join(root, JOURNAL), "utf8");
  assert.equal(journal.startsWith(INITIAL), true);
  const appended = journal.slice(INITIAL.length);
  const timestamp = /^## (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z) — /u.exec(appended.slice(1))?.[1];
  assert.ok(timestamp, `the hook's header carries no readable timestamp: ${JSON.stringify(appended)}`);
  // Put the tree back the way the hook saw it when it collected its own path
  // list, so the two writers are compared over one state: the append is undone
  // and the hook's `.claude/` marker (untracked, and invisible to the hook's
  // range diff) is removed. What remains is the session's work.
  git(["checkout", "--", JOURNAL]);
  fs.rmSync(path.join(root, ".claude"), { recursive: true, force: true });
  return { root, appended, timestamp, marker: { sha: startSha, epoch: 0, iso: "1970-01-01T00:00Z" } };
}

test("AP-01 with a commit in its range, our append is the hook's append", () => {
  const { root, appended, timestamp, marker } = hookedSession({ commits: 1 });
  assert.equal(isRenderedEntry(appended.slice(1)), true, "the oracle still speaks the frozen three-line shape");

  const facts = buildFacts({ root, marker, reason: "exit", now: () => Date.parse(timestamp) });
  assert.equal(`\n${renderEntry(facts)}`, appended);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AP-02 with no commit in its range, the zero-count shape is identical too", () => {
  const { root, appended, timestamp, marker } = hookedSession({ commits: 0 });
  const facts = buildFacts({ root, marker, reason: "exit", now: () => Date.parse(timestamp) });
  assert.equal(`\n${renderEntry(facts)}`, appended);
  assert.match(appended, /- \*\*Commits:\*\* 0 `[0-9a-f]{4,40}…[0-9a-f]{4,40}`/u);
  fs.rmSync(root, { recursive: true, force: true });
});

test("AP-03 the CLI reproduces the extension's entry from the same payload", () => {
  const { root, timestamp, marker } = hookedSession({ commits: 1 });
  const facts = buildFacts({ root, marker, reason: "exit", now: () => Date.parse(timestamp) });
  const run = spawnSync(process.execPath, [CLI, "log", "render", "--facts", "-", "--raw"], {
    cwd: root,
    input: JSON.stringify(facts),
    encoding: "utf8",
    env: sandboxGitEnv(),
  });
  assert.equal(run.status, 0, run.stderr);
  assert.equal(run.stdout, renderEntry(facts));
  fs.rmSync(root, { recursive: true, force: true });
});

test("AP-04 the marker holds the hook's fields, in its own directory", () => {
  // Same three fields in the same order and separator — but `.pi/`, never
  // `.claude/`: that separation is what keeps one writer from adopting the
  // other's crashed marker, so it is asserted rather than assumed.
  const { root } = repo();
  hook(root, "log-session-start.sh", { session_id: SESSION });
  const hookMarker = fs.readFileSync(path.join(root, ".claude", `.session-${SESSION}.start`), "utf8").trim().split(" ");
  const ours = createMarker({ root, sessionId: SESSION, now: () => Number(hookMarker[1]) * 1000 });
  assert.ok(ours);
  assert.deepEqual([ours.sha, String(ours.epoch), ours.iso], hookMarker);
  assert.equal(markerPath(root, SESSION).includes(`${path.sep}.claude${path.sep}`), false);
  assert.equal(markerPath(root, SESSION), path.join(root, ".pi", `.session-${SESSION}.start`));
  fs.rmSync(root, { recursive: true, force: true });
});

test("AP-05 in a carrier project the hook writes a fragment with the crate's name and the crate's bytes (issue #405, O6)", () => {
  const { root, git } = repo();
  fs.mkdirSync(path.join(root, ".agentic-workflow", "journal"), { recursive: true });
  hook(root, "log-session-start.sh", { session_id: SESSION });
  const startSha = git(["rev-parse", "--short", "HEAD"]).trim();
  fs.writeFileSync(path.join(root, "work.txt"), "work\n");
  git(["add", "."]);
  git(["commit", "-q", "-m", "work"]);
  hook(root, "log-session-end.sh", { session_id: SESSION, reason: "exit" });

  // The journal is untouched — the aggregator is its only writer there.
  assert.equal(fs.readFileSync(path.join(root, JOURNAL), "utf8"), INITIAL);

  // The fragment: the crate grammar's name (slug, kind, session slug), the
  // renderer's bytes — the bash slug twin is compared, never assumed.
  const fragments = fs.readdirSync(path.join(root, ".agentic-workflow", "journal"));
  assert.equal(fragments.length, 1, `expected one fragment, got ${JSON.stringify(fragments)}`);
  const parsed = parseFragmentName(fragments[0]);
  assert.ok(parsed, `the hook's fragment name does not parse: ${fragments[0]}`);
  assert.equal(parsed.kind, "mechanical");
  assert.equal(parsed.branch, "main");
  assert.equal(parsed.sessionId, SESSION);

  const content = fs.readFileSync(path.join(root, ".agentic-workflow", "journal", fragments[0]), "utf8");
  const timestamp = /^## (\d{4}-\d{2}-\d{2}T\d{2}:\d{2}Z) — /u.exec(content)?.[1];
  assert.ok(timestamp, `the fragment carries no readable timestamp: ${JSON.stringify(content)}`);
  // Undo the fragment write before re-collecting the session's own facts: the
  // hook computed its path list before it wrote the fragment, so the comparison
  // needs the tree back in the state the hook saw (same rule as hookedSession).
  fs.rmSync(path.join(root, ".agentic-workflow", "journal", fragments[0]));
  const facts = buildFacts({ root, marker: { sha: startSha, epoch: 0, iso: "1970-01-01T00:00Z" }, reason: "exit", now: () => Date.parse(timestamp) });
  assert.equal(content, renderEntry(facts));
  fs.rmSync(root, { recursive: true, force: true });
});
