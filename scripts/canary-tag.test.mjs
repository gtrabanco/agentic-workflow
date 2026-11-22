#!/usr/bin/env node
// test-obligation: protects=scripts/canary-tag.mjs obligations=contract,failure-path,distribution-contract

/**
 * The canary tag's deterministic half (issue #679).
 *
 * A canary cut stages the train version into `RUNNER.md` and the declared
 * manifests, publishes those bytes, then restores the worktree. The tag used to
 * be recorded at the restored `HEAD`, so `npx skills add …#v<canary tag>`
 * installed skills whose cited services could be younger than the stable pin.
 * These cases pin the repair: the staged tree is materialized as a commit
 * without moving `HEAD`, and the tag records that tree — idempotently and
 * fail-closed.
 *
 * Each case below is justified by the independent obligation it covers, never
 * by the implementation it exercises.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { tempRoot } from "./temp-root.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(repoRoot, "scripts", "canary-tag.mjs");

const run = (args, options = {}) =>
  spawnSync(process.execPath, [script, ...args], { cwd: repoRoot, encoding: "utf8", ...options });

/** One throwaway repository with a committed baseline. */
function fixture() {
  const root = tempRoot("canary-tag-");
  fs.writeFileSync(path.join(root, "pin.txt"), "4.10.0\n");
  fs.writeFileSync(path.join(root, "notes.txt"), "baseline\n");
  git(root, ["init", "-q"]);
  git(root, ["add", "-A"]);
  git(root, ["commit", "-qm", "fixture"]);
  return root;
}

function git(root, args) {
  return execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", "-c", "commit.gpgsign=false", ...args], {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

const head = (root) => git(root, ["rev-parse", "HEAD"]);
const tree = (root, rev) => git(root, ["rev-parse", `${rev}^{tree}`]);

// O2/O7: the snapshot is the staged tracked tree, materialized without moving
// the branch or the worktree — the invariant that keeps `#stable` untouched.
test("snapshot records the staged tracked tree without moving HEAD or the worktree", () => {
  const root = fixture();
  const before = head(root);
  fs.writeFileSync(path.join(root, "pin.txt"), "5.0.0-canary.20261122.1\n");
  fs.writeFileSync(path.join(root, "untracked.txt"), "never in the tag\n");

  const snap = run(["snapshot", "--root", root]);
  assert.equal(snap.status, 0, snap.stderr);
  const commit = snap.stdout.trim();
  assert.match(commit, /^[0-9a-f]{40}$/u, "the snapshot prints the commit a caller tags");

  assert.equal(head(root), before, "HEAD never moves: the committed pin stays stable");
  assert.equal(fs.readFileSync(path.join(root, "pin.txt"), "utf8"), "5.0.0-canary.20261122.1\n", "the worktree is not restored by the snapshot");
  assert.equal(fs.readFileSync(path.join(root, "untracked.txt"), "utf8"), "never in the tag\n", "untracked files stay in the worktree");

  assert.equal(git(root, ["show", `${commit}:pin.txt`]), "5.0.0-canary.20261122.1", "the tag tree carries the staged pin");
  assert.equal(git(root, ["ls-tree", "--name-only", commit]).includes("untracked.txt"), false, "an untracked file never enters the tag");
  assert.match(snap.stderr, /canary-tag: [0-9a-f]{40} \(staged tree [0-9a-f]{40}\)/u, "progress goes to stderr, the receipt to stdout");
});

// O2: a clean tree is a clean zero — the snapshot answers HEAD instead of
// inventing a commit.
test("snapshot on a clean tree answers HEAD", () => {
  const root = fixture();
  const snap = run(["snapshot", "--root", root]);
  assert.equal(snap.status, 0, snap.stderr);
  assert.equal(snap.stdout.trim(), head(root));
});

// O1: record puts the tag on the snapshot commit, so the canary tree carries
// the pin the cut published.
test("record tags the snapshot commit, and a same-tree re-record is a no-op", () => {
  const root = fixture();
  fs.writeFileSync(path.join(root, "pin.txt"), "5.0.0-canary.20261122.1\n");
  const commit = run(["snapshot", "--root", root]).stdout.trim();

  const recorded = run(["record", "--root", root, "--tag", "v5.0.0-canary.20261122.1", "--commit", commit]);
  assert.equal(recorded.status, 0, recorded.stderr);
  assert.match(recorded.stdout, /^recorded v5\.0\.0-canary\.20261122\.1 /u);
  assert.equal(tree(root, "v5.0.0-canary.20261122.1"), tree(root, commit), "the tag names the staged tree");

  const again = run(["record", "--root", root, "--tag", "v5.0.0-canary.20261122.1", "--commit", commit]);
  assert.equal(again.status, 0, again.stderr);
  assert.match(again.stdout, /^already-recorded /u, "a retry that lands the same tree is idempotent");
});

// O7: a tag already on another tree is refused before it is rewritten — the
// published cut is never retargeted silently.
test("record refuses a tag that already names a different tree", () => {
  const root = fixture();
  git(root, ["tag", "v1.0.0-canary.20260101.1"]);
  fs.writeFileSync(path.join(root, "pin.txt"), "9.9.9-canary.20260101.1\n");
  const commit = run(["snapshot", "--root", root]).stdout.trim();

  const refused = run(["record", "--root", root, "--tag", "v1.0.0-canary.20260101.1", "--commit", commit]);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /^CANARY-TAG REFUSAL — /u);
  assert.match(refused.stderr, /v1\.0\.0-canary\.20260101\.1/u);
  assert.equal(tree(root, "v1.0.0-canary.20260101.1"), tree(root, "HEAD"), "the existing tag is untouched");
});

// O7: no repository, no tag — the script never guesses a git root.
test("a non-repository is refused", () => {
  const root = tempRoot("canary-tag-bare-");
  const refused = run(["snapshot", "--root", root]);
  assert.equal(refused.status, 2);
  assert.match(refused.stderr, /^CANARY-TAG REFUSAL — /u);
});

test("usage is exit 1 and names both operations", () => {
  const usage = run([]);
  assert.equal(usage.status, 1);
  assert.match(usage.stdout, /snapshot/);
  assert.match(usage.stdout, /record --tag/);
});

// F1 — EXTERNAL VERIFY 2026-11-22 advisory 2, folded: a flag that never
// received its value used to read as absent and succeed — valueless `--commit`
// tagged HEAD, valueless/empty `--root` ran at cwd. The USAGE text is the
// declared grammar and it names a value for both; a missing one is usage
// (exit 1), never a silent default.
test("a valueless or empty --root, and a valueless --commit, are usage errors", () => {
  const root = fixture();

  const noCommit = run(["record", "--root", root, "--tag", "v8.8.8-canary.20260101.8", "--commit"]);
  assert.equal(noCommit.status, 1, noCommit.stderr);
  assert.match(noCommit.stderr, /--commit needs a value/u);
  assert.equal(git(root, ["tag", "-l", "v8.8.8-canary.20260101.8"]), "", "a usage error never writes a tag");

  const noRoot = run(["snapshot", "--root"], { cwd: root });
  assert.equal(noRoot.status, 1, "a valueless --root never falls back to cwd");
  assert.match(noRoot.stderr, /--root needs a value/u);

  const emptyRoot = run(["record", "--root=", "--tag", "v8.8.8-canary.20260101.8"], { cwd: root });
  assert.equal(emptyRoot.status, 1, "an empty --root is not a directory");
  assert.match(emptyRoot.stderr, /--root needs a value/u);
  assert.equal(git(root, ["tag", "-l", "v8.8.8-canary.20260101.8"]), "", "the cwd repo is never tagged");
});

// F1 — same fold: the USAGE text scopes the options per operation, so
// `record`'s options on `snapshot` are usage errors, never ignored flags.
test("snapshot rejects record's options instead of ignoring them", () => {
  const root = fixture();

  const tagged = run(["snapshot", "--root", root, "--tag", "v1.0.0-canary.20260101.1"]);
  assert.equal(tagged.status, 1, "--tag is not an option of snapshot");
  assert.match(tagged.stderr, /not an option of snapshot/u);

  const committed = run(["snapshot", "--root", root, "--commit", "HEAD"]);
  assert.equal(committed.status, 1, "--commit is not an option of snapshot");
  assert.match(committed.stderr, /not an option of snapshot/u);
});

// Differential pin on the touched parse path: `record` without `--tag` keeps
// its own usage message byte for byte — the fix changes only paths that used
// to succeed silently.
test("record without --tag keeps its own usage message", () => {
  const root = fixture();
  const refused = run(["record", "--root", root]);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /^record needs --tag <tag>$/mu);
});
