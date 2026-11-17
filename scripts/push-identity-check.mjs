#!/usr/bin/env node
/**
 * push-identity-check.mjs — Layer 2's last resort: refuse to publish a commit
 * whose author or committer is not the project's approved identity (issue #514
 * S4).
 *
 * The pi guard only sees what a model asks bash to run, and a pre-commit hook
 * only sees commits made in this checkout. Two of the three recorded leaks in
 * this repository were produced by processes neither could see: a suite that
 * wrote `t <t@example.test>` into the shared config from a failed fixture
 * resolution, and an agent identity pinned on purpose. The commits that carried
 * them were signed, valid, and invisible to every gate — signature validity
 * says nothing about attribution.
 *
 * So the push range is checked as one fact: every author *and* committer of
 * the never-published commits of `<base>..<head>` must match the approved
 * profile the project declares in the unified config (`gitIdentity` in
 * `.pi/agentic-workflow.json`, project over global). Publication is the last
 * moment this is cheap to stop; after the push the only repair is a history
 * rewrite.
 *
 * The profile rule and the commit comparison are not this script's: they live in
 * the crate (`packages/agentic-workflow/src/guard/git-identity.mjs`), which the
 * pre-commit hook and the pi guard read too (unit 554). Two carriers of one
 * contract, one implementation — `scripts/identity-hook-parity.test.mjs` proves
 * they still answer identically.
 *
 * What the range *is* respects reachability (issue #539): a commit already
 * reachable from a published ref — the remote mainline, and the pushed branch's
 * own remote tip — cannot be changed by this push, so it is skipped and only the
 * never-published commits are judged. Without that, merging `origin/main` into a
 * branch put main's own history in the range and refused every merge-push. The
 * rule is one module (`published-refs.mjs`), never a copy here.
 *
 * Which pushes it judges is a declared scope (issue #546): `push` judges a push
 * to any remote, `push-upstream` judges only a push to the branch's tracked
 * upstream remote — a third-party fork contributor pushing to their own fork is
 * not publishing this project's history. The caller names the remote it is
 * pushing to (`--remote`, which the `pre-push` hook supplies); a caller that
 * names none cannot prove the remote is the upstream one, so the check runs.
 *
 * Read-only by construction: it spawns `git rev-list` and `git log`, reads two
 * JSON files, writes nothing, calls no network, and never repairs a value — the
 * repair text it prints is the operator's to run.
 *
 * Usage
 *   bun scripts/push-identity-check.mjs --base <rev> [--head <rev>] [--remote <name>] [--root <dir>]
 *   (node fallback, same argv)
 *
 * Without `--base` the merge base with the upstream is used; a range that cannot
 * be resolved is a usage error (exit 2) — the caller that has no range must not
 * run the step at all.
 *
 * stdout: `PUSH IDENTITY — ok: <n> commit(s) verified`, `… — failed: <k> of <n>
 * …` with one offender line per commit and the repair block, or `… — skipped:
 * <reason>` when the project enforces nothing on push.
 * exit: 0 ok or skipped; 1 a misattributed commit; 2 usage or configuration
 * error (a config file that does not parse is never read as "no profile").
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { publishedRefs, unpublishedCommits } from "./published-refs.mjs";
import {
  ENFORCE_VALUES,
  PUSH_ENFORCING,
  REPAIR_LINES,
  commitViolations,
  describeApproved,
  resolveIdentityProfile,
} from "../packages/agentic-workflow/src/guard/git-identity.mjs";

const DEFAULT_ROOT = process.cwd();
/** The two repair facts every failure prints: diagnose the origin, then fix it. */
export { REPAIR_LINES, resolveIdentityProfile };
/** The enforce vocabulary, as the set this script asks. */
const ENFORCE = new Set(ENFORCE_VALUES);
/** The values that ask the push half to judge this push. */
const PUSHING = new Set(PUSH_ENFORCING);
/** The fallback remote when nothing else names the mainline. The one home for it. */
export const DEFAULT_REMOTE = "origin";

function git(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  if (result.status !== 0) {
    const failure = new Error((result.stderr || "").trim() || `git ${args.join(" ")} failed`);
    failure.code = "git-failed";
    throw failure;
  }
  return result.stdout;
}

/** The trimmed stdout of one git query, or null when git refuses it. */
function gitQuery(root, args) {
  const result = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : null;
}

/**
 * Which remote this branch treats as its upstream, and how it was decided:
 *
 *   1. the branch's own upstream ref (`@{upstream}` → `<remote>/<branch>`);
 *   2. `branch.<name>.remote` — a branch that has not been pushed yet still
 *      names the remote git will track once it is;
 *   3. the remote that owns the mainline (`refs/remotes/<remote>/HEAD`);
 *   4. `origin`, the shipped fallback.
 *
 * A checkout with no remote answers `origin`, which is the pre-#546 reading: the
 * scope can only ever *skip* a push whose remote is explicitly named and differs.
 */
export function trackedUpstreamRemote({ root, query = gitQuery }) {
  const upstream = query(root, ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]);
  if (upstream) {
    const named = /^(?:refs\/remotes\/)?([^/]+)\//.exec(upstream);
    if (named) return { remote: named[1], source: "the branch's upstream ref" };
  }
  const branch = query(root, ["rev-parse", "--abbrev-ref", "HEAD"]);
  if (branch && branch !== "HEAD") {
    const configured = query(root, ["config", "--get", `branch.${branch}.remote`]);
    if (configured && configured !== ".") return { remote: configured, source: `branch.${branch}.remote` };
  }
  const heads = query(root, ["for-each-ref", "--format=%(refname:short)", "refs/remotes"]);
  for (const ref of (heads ?? "").split("\n")) {
    const named = /^([^/]+)\/HEAD$/.exec(ref.trim());
    if (named) return { remote: named[1], source: "the remote mainline" };
  }
  return { remote: DEFAULT_REMOTE, source: "the default remote" };
}

/** The commits of `base..head` a published ref does not reach, oldest first, as
 *  `{sha, author, committer}`. The range's own base is the pushed branch's remote
 *  tip when the hook supplies it, so it enters the published set too. */
export function rangeCommits({ root, base, head = "HEAD", published = [] }) {
  const shas = unpublishedCommits({ root, base, head, published });
  return shas.map((sha) => {
    const [authorName, authorEmail, committerName, committerEmail] = git(root, [
      "log",
      "-1",
      "--format=%an%x00%ae%x00%cn%x00%ce",
      sha,
    ])
      .trim()
      .split("\u0000");
    return { sha, author: { name: authorName, email: authorEmail }, committer: { name: committerName, email: committerEmail } };
  });
}

/** The optional profile facts the *commit* cannot carry; the hook checks them. */
function renderSkipped(reason) {
  return `PUSH IDENTITY — skipped: ${reason}\n`;
}

export function renderResult({ status, commits, offenders, profile }) {
  if (status === "skipped") return renderSkipped(offenders);
  if (status === "ok") {
    const where = profile.sources.profile === "project" ? ".pi/agentic-workflow.json" : "the global agentic-workflow.json";
    return `PUSH IDENTITY — ok: ${commits.length} commit(s) verified against ${describeApproved(profile.approved)} (${where})\n`;
  }
  const lines = [`PUSH IDENTITY — failed: ${offenders.length} of ${commits.length} commit(s) outside the approved profile`];
  for (const { sha, violations } of offenders) {
    for (const { role, actual } of violations) {
      lines.push(`  ${sha} ${role} ${actual.name} <${actual.email}> — expected ${describeApproved(profile.approved)}`);
    }
  }
  lines.push("repair (never automatic):");
  for (const line of REPAIR_LINES) lines.push(`  ${line}`);
  return `${lines.join("\n")}\n`;
}

function usage(message) {
  process.stderr.write(`push-identity-check: ${message}\n`);
  process.stderr.write("usage: bun scripts/push-identity-check.mjs --base <rev> [--head <rev>] [--remote <name>] [--root <dir>]  (node fallback, same argv)\n");
  return 2;
}

/** The base a caller that named none means: the merge base with the upstream. */
function resolveBase(root) {
  const upstream = spawnSync("git", ["-C", root, "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"], {
    encoding: "utf8",
  });
  if (upstream.status !== 0) return null;
  const base = spawnSync("git", ["-C", root, "merge-base", "HEAD", upstream.stdout.trim()], { encoding: "utf8" });
  return base.status === 0 ? base.stdout.trim() : null;
}

export function main(argv) {
  let root = DEFAULT_ROOT;
  let base = null;
  let head = "HEAD";
  let remote = null;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--root" || arg === "--base" || arg === "--head" || arg === "--remote") {
      const value = argv[index + 1];
      if (value === undefined || value === "") return usage(`${arg} needs a value`);
      if (arg === "--root") root = path.resolve(value);
      else if (arg === "--base") base = value;
      else if (arg === "--remote") remote = value;
      else head = value;
      index += 1;
      continue;
    }
    return usage(`unknown argument ${arg}`);
  }

  let profile;
  try {
    profile = resolveIdentityProfile({ root });
  } catch (error) {
    process.stderr.write(`PUSH IDENTITY — config error: ${error.message}\n`);
    return 2;
  }
  if (!ENFORCE.has(profile.enforce)) {
    process.stderr.write(`PUSH IDENTITY — config error: gitIdentity.enforce "${profile.enforce}" is not one of ${[...ENFORCE].join(", ")}\n`);
    return 2;
  }
  if (!profile.named) {
    // Nothing declared to enforce: an unconfigured project is inert, but a
    // project that *asked* for enforcement and declared no profile is broken
    // and must say so instead of passing silently.
    if (profile.enforceDeclared && profile.enforce !== "off") {
      process.stderr.write(
        `PUSH IDENTITY — config error: gitIdentity.enforce is "${profile.enforce}" but gitIdentity.approved declares no name or email\n`,
      );
      return 2;
    }
    process.stdout.write(renderResult({ status: "skipped", offenders: "no approved identity profile", profile }));
    return 0;
  }
  if (!PUSHING.has(profile.enforce)) {
    process.stdout.write(renderResult({ status: "skipped", offenders: `gitIdentity.enforce is "${profile.enforce}"`, profile }));
    return 0;
  }

  // The scope: `push` judges every remote, `push-upstream` only the tracked one.
  // A named remote git does not know is a caller bug, never a skip.
  if (remote !== null && gitQuery(root, ["remote", "get-url", remote]) === null) {
    return usage(`--remote names "${remote}", which is not a remote of this repository`);
  }
  if (profile.enforce.endsWith("-upstream")) {
    const upstream = trackedUpstreamRemote({ root });
    if (remote !== null && remote !== upstream.remote) {
      process.stdout.write(
        renderResult({
          status: "skipped",
          offenders: `the pushed remote "${remote}" is not the tracked upstream remote "${upstream.remote}" (${upstream.source})`,
          profile,
        }),
      );
      return 0;
    }
  }

  const resolvedBase = base ?? resolveBase(root);
  if (resolvedBase === null) return usage("--base is required when the branch has no upstream");

  let commits;
  try {
    commits = rangeCommits({ root, base: resolvedBase, head, published: publishedRefs({ root, extra: [resolvedBase] }) });
  } catch (error) {
    return usage(error.message);
  }
  const offenders = [];
  for (const commit of commits) {
    const violations = commitViolations(commit, profile.approved);
    if (violations.length > 0) offenders.push({ sha: commit.sha, violations });
  }
  if (offenders.length === 0) {
    process.stdout.write(renderResult({ status: "ok", commits, offenders, profile }));
    return 0;
  }
  process.stdout.write(renderResult({ status: "failed", commits, offenders, profile }));
  return 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}
