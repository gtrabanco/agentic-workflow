#!/usr/bin/env node
/**
 * published-refs.mjs — which commits a local push can still affect (issue #539).
 *
 * `push-identity-check` (#514) and `log-immutability` (#468) both judge a push
 * range, and both were refused forever by one structural false positive: a
 * branch that merges `origin/main` carries main's already-published commits in
 * its range, so the gates judged history no local push can change (the incident:
 * 13 published commits — PR web-merges, journal aggregations, CI runs — blocked
 * the push of a branch whose own commits were all approved).
 *
 * The rule is one fact and lives here, once: a commit reachable from a *published*
 * ref cannot be affected by a push from this checkout. The published refs are the
 * remote's mainline — `refs/remotes/origin/HEAD`'s target, else
 * `refs/remotes/origin/main` — plus the caller's extras, which is how the pushed
 * branch's own remote tip enters (the pre-push hook passes it as `--base`).
 *
 * Read-only by construction: it spawns `git symbolic-ref`, `git rev-parse` and
 * `git rev-list`, and writes nothing. No network — a stale `origin/main` leaves a
 * published commit judged (the conservative direction), and `git fetch` is the
 * repair, never a looser matcher.
 *
 * Usage
 *   import { publishedRefs, unpublishedCommits } from "./published-refs.mjs";
 *
 * Both take an injectable `gitQuery(root, args)` returning the trimmed stdout or
 * `null`; the default spawns git with a 64 MiB ceiling (a year-old history is
 * past spawnSync's 1 MiB default).
 */

import { spawnSync } from "node:child_process";

/** spawnSync's 1 MiB default is not enough for a real repository's rev-list. */
const GIT_MAX_BUFFER = 64 * 1024 * 1024;

/** The two refs a normal clone carries for its default branch, in preference order. */
const MAINLINE_HEAD = "refs/remotes/origin/HEAD";
const MAINLINE_BRANCH = "refs/remotes/origin/main";

function defaultGitQuery(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8", maxBuffer: GIT_MAX_BUFFER });
  return result.status === 0 ? result.stdout.trim() : null;
}

/**
 * The refs that name already-published history: the remote mainline first, then
 * `extra` (the pushed branch's own remote tip). A ref that does not resolve is
 * dropped, so a checkout with no remote answers `[]` — the pre-change semantics
 * of both gates, never a silent pass.
 */
export function publishedRefs({ root = ".", extra = [], gitQuery = defaultGitQuery } = {}) {
  const originHead = gitQuery(root, ["symbolic-ref", "--quiet", MAINLINE_HEAD]);
  const refs = [];
  for (const candidate of [originHead, MAINLINE_BRANCH, ...extra]) {
    if (candidate === null || candidate === undefined || candidate === "") continue;
    if (refs.includes(candidate)) continue;
    if (gitQuery(root, ["rev-parse", "--verify", "--quiet", `${candidate}^{commit}`]) === null) continue;
    refs.push(candidate);
  }
  return refs;
}

/**
 * The commits of `base..head` that no published ref reaches, oldest first. With
 * no published ref this is exactly the plain range. An unreadable range throws:
 * "no commits to judge" must never be the answer to "git could not tell".
 */
export function unpublishedCommits({ root = ".", base, head = "HEAD", published = [], gitQuery = defaultGitQuery } = {}) {
  const args = ["rev-list", "--reverse", `${base}..${head}`];
  if (published.length > 0) args.push("--not", ...published);
  const out = gitQuery(root, args);
  if (out === null) throw new Error(`git ${args.join(" ")} failed`);
  return out.split("\n").filter(Boolean);
}
