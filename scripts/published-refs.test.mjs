#!/usr/bin/env node
/**
 * published-refs.test.mjs — the range policy's sibling suite (issue #539).
 *
 * Two push-range gates (`push-identity-check`, `log-immutability`) must judge
 * only what a local push can still affect. A commit already reachable from a
 * published ref — the remote's mainline, and the pushed branch's own remote tip
 * — cannot be changed by any push from this checkout, so judging it refuses
 * every push of a branch that merged `origin/main` (the incident this suite
 * pins: `github-actions[bot]`, `journal-bot` and an old name form on main).
 *
 * The policy is one module with two answers, so it is tested once here and
 * called by both gates. Every fixture repository is throwaway, every identity
 * is passed with `-c`, and the only writes are refs in the fixture.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { publishedRefs, unpublishedCommits } from "./published-refs.mjs";

const IDENTITY = { name: "Fixture Human", email: "human@example.com" };

function git(cwd, args, identity = IDENTITY) {
  const result = spawnSync(
    "git",
    ["-c", `user.name=${identity.name}`, "-c", `user.email=${identity.email}`, "-c", "commit.gpgsign=false", ...args],
    { cwd, encoding: "utf8" },
  );
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout.trim();
}

/** A throwaway repository with one commit per message; returns the shas in order. */
function fixture(t, messages = ["a", "b", "c"]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "published-refs-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  git(root, ["init", "-q", "-b", "main"]);
  const shas = [];
  for (const message of messages) {
    fs.writeFileSync(path.join(root, `${message}.txt`), `${message}\n`);
    git(root, ["add", "-A"]);
    git(root, ["commit", "-qm", message]);
    shas.push(git(root, ["rev-parse", "HEAD"]));
  }
  return { root, shas };
}

test("publishedRefs: the remote mainline first, then the extras, deduped", (t) => {
  const { root, shas } = fixture(t);
  git(root, ["update-ref", "refs/remotes/origin/main", shas[0]]);
  git(root, ["update-ref", "refs/remotes/origin/fix-x", shas[1]]);
  assert.deepEqual(publishedRefs({ root, extra: ["refs/remotes/origin/fix-x"] }), [
    "refs/remotes/origin/main",
    "refs/remotes/origin/fix-x",
  ]);
  assert.deepEqual(publishedRefs({ root, extra: ["refs/remotes/origin/main"] }), ["refs/remotes/origin/main"]);
});

test("publishedRefs: origin/HEAD's target wins over origin/main", (t) => {
  const { root, shas } = fixture(t);
  git(root, ["update-ref", "refs/remotes/origin/trunk", shas[0]]);
  git(root, ["update-ref", "refs/remotes/origin/main", shas[1]]);
  git(root, ["symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/trunk"]);
  assert.deepEqual(publishedRefs({ root }), ["refs/remotes/origin/trunk", "refs/remotes/origin/main"]);
});

test("publishedRefs: no resolvable remote ref answers an empty list", (t) => {
  const { root } = fixture(t);
  assert.deepEqual(publishedRefs({ root }), [], "a checkout with no remote has nothing published to skip");
  assert.deepEqual(publishedRefs({ root, extra: ["refs/remotes/origin/missing"] }), [], "an absent extra is dropped");
});

test("unpublishedCommits: commits reachable from a published ref are dropped, the rest keep their order", (t) => {
  const { root, shas } = fixture(t, ["a", "b", "c", "d"]);
  git(root, ["update-ref", "refs/remotes/origin/main", shas[1]]);
  assert.deepEqual(unpublishedCommits({ root, base: shas[0], published: ["refs/remotes/origin/main"] }), [shas[2], shas[3]]);
  assert.deepEqual(unpublishedCommits({ root, base: shas[0], head: shas[2], published: ["refs/remotes/origin/main"] }), [shas[2]]);
});

test("unpublishedCommits: no published ref is the plain base..head range", (t) => {
  const { root, shas } = fixture(t, ["a", "b", "c"]);
  assert.deepEqual(unpublishedCommits({ root, base: shas[0], published: [] }), [shas[1], shas[2]]);
  assert.deepEqual(unpublishedCommits({ root, base: shas[2], published: [] }), [], "an empty range is empty, never an error");
});

test("unpublishedCommits: an unresolvable range throws instead of answering empty", (t) => {
  const { root } = fixture(t);
  assert.throws(
    () => unpublishedCommits({ root, base: "no-such-rev", published: [], gitQuery: () => null }),
    /rev-list .* failed/,
    "an unreadable range must never read as 'nothing to judge'",
  );
});
