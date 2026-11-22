#!/usr/bin/env node
/**
 * canary-tag.mjs — record a canary cut on the tree it actually published.
 *
 * A canary cut stages the train version into the declared manifests and into
 * `skills/runner-contract/references/RUNNER.md`, publishes those bytes, and then
 * restores the worktree. The tag used to be recorded at the restored `HEAD`, so
 * `npx skills add …#v<canary tag>` installed skills whose cited services could
 * be younger than the stable pin they carried (issue #679).
 *
 * This script is the deterministic half of the repair:
 *
 *   snapshot  materializes the staged tracked tree as a commit whose parent is
 *             `HEAD`. It never moves a branch and never restores the worktree;
 *             untracked files never enter the tree, so build output and the
 *             plan TSV stay out. The commit's tree — never its timestamp — is
 *             the identity a caller compares.
 *   record    puts the tag on that commit. A tag already recorded on the same
 *             tree is a no-op (`already-recorded`); one recorded on another
 *             tree is refused, so a published cut is never retargeted silently.
 *
 * Stdout is the machine receipt (the commit before the tag is recorded, the
 * tag receipt after); progress and every refusal go to stderr. Exit 0 success,
 * 1 usage, 2 refusal before a tag or a commit is written. The only mutations are
 * the index (`snapshot`, via `git add -u`) and one tag ref (`record`).
 *
 * Usage:
 *   bun scripts/canary-tag.mjs snapshot [--root <dir>]
 *   bun scripts/canary-tag.mjs record --tag <tag> [--commit <sha>] [--root <dir>]
 */

import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const USAGE = [
  "usage: bun scripts/canary-tag.mjs snapshot [--root <dir>]",
  "       bun scripts/canary-tag.mjs record --tag <tag> [--commit <sha>] [--root <dir>]",
].join("\n");

const RELEASE_IDENTITY = ["-c", "user.name=agentic-workflow-release", "-c", "user.email=release@localhost"];
const TAG_SHAPE = /^v?[0-9A-Za-z][0-9A-Za-z._-]*$/u;

function refuse(reason) {
  process.stderr.write(`CANARY-TAG REFUSAL — ${reason}\n`);
  process.exit(2);
}

function usageError(reason) {
  process.stdout.write(`${USAGE}\n`);
  if (reason) process.stderr.write(`${reason}\n`);
  process.exit(1);
}

/** Run one git command in `root`; the receipt is captured, never printed raw. */
function git(root, args, extra = []) {
  const result = spawnSync("git", [...extra, ...args], { cwd: root, encoding: "utf8" });
  return { ok: result.status === 0, out: (result.stdout ?? "").trim(), err: (result.stderr ?? "").trim() };
}

function requireRepo(root) {
  const probe = git(root, ["rev-parse", "--git-dir"]);
  if (!probe.ok) refuse(`not a git repository: ${root}`);
}

function requireHead(root) {
  const head = git(root, ["rev-parse", "--verify", "HEAD^{commit}"]);
  if (!head.ok) refuse(`the repository has no commit to parent the staged tree: ${root}`);
  return head.out;
}

function parse(args) {
  const parsed = { root: process.cwd(), tag: null, commit: null };
  for (let i = 0; i < args.length; i += 1) {
    const flag = args[i];
    if (flag === "--root") parsed.root = resolve(args[++i] ?? "");
    else if (flag === "--tag") parsed.tag = args[++i] ?? null;
    else if (flag === "--commit") parsed.commit = args[++i] ?? null;
    else if (flag.startsWith("--root=")) parsed.root = resolve(flag.slice("--root=".length));
    else if (flag.startsWith("--tag=")) parsed.tag = flag.slice("--tag=".length);
    else if (flag.startsWith("--commit=")) parsed.commit = flag.slice("--commit=".length);
    else throw new Error(`unknown argument "${flag}"`);
  }
  return parsed;
}

/** Materialize the staged tracked tree; print the commit a caller tags. */
function snapshot(root) {
  requireRepo(root);
  const head = requireHead(root);

  const staged = git(root, ["add", "-u"]);
  if (!staged.ok) refuse(`could not stage the tracked worktree: ${staged.err}`);

  const tree = git(root, ["write-tree"]);
  if (!tree.ok) refuse(`could not write the staged tree: ${tree.err}`);

  const headTree = git(root, ["rev-parse", "HEAD^{tree}"]);
  if (!headTree.ok) refuse(`could not read HEAD's tree: ${headTree.err}`);

  if (tree.out === headTree.out) {
    process.stderr.write(`canary-tag: ${head} (clean tree — HEAD)\n`);
    process.stdout.write(`${head}\n`);
    return;
  }

  const commit = git(root, ["commit-tree", tree.out, "-p", head, "-m", "release: the staged canary tree"], RELEASE_IDENTITY);
  if (!commit.ok) refuse(`could not materialize the staged tree: ${commit.err}`);
  process.stderr.write(`canary-tag: ${commit.out} (staged tree ${tree.out})\n`);
  process.stdout.write(`${commit.out}\n`);
}

/** Record `tag` on `commit`; a same-tree tag is a no-op, another tree refuses. */
function record(root, tag, commit) {
  if (!tag) usageError("record needs --tag <tag>");
  if (!TAG_SHAPE.test(tag) || tag.includes("..")) usageError(`not a safe tag name: ${JSON.stringify(tag)}`);
  requireRepo(root);

  const target = git(root, ["rev-parse", "--verify", `${commit ?? "HEAD"}^{commit}`]);
  if (!target.ok) refuse(`unknown commit: ${commit}`);
  const targetTree = git(root, ["rev-parse", `${target.out}^{tree}`]);
  if (!targetTree.ok) refuse(`could not read the target tree: ${targetTree.err}`);

  const existing = git(root, ["rev-parse", "-q", "--verify", `refs/tags/${tag}`]);
  if (existing.ok) {
    const existingTree = git(root, ["rev-parse", `${tag}^{tree}`]);
    if (!existingTree.ok) refuse(`could not read ${tag}'s tree: ${existingTree.err}`);
    if (existingTree.out !== targetTree.out) {
      refuse(`${tag} already names tree ${existingTree.out}, not the staged tree ${targetTree.out} — a published cut is never retargeted`);
    }
    process.stderr.write(`canary-tag: ${tag} already records tree ${targetTree.out}\n`);
    process.stdout.write(`already-recorded ${tag} ${target.out}\n`);
    return;
  }

  const created = git(root, ["tag", tag, target.out]);
  if (!created.ok) refuse(`could not create ${tag}: ${created.err}`);
  process.stderr.write(`canary-tag: ${tag} records ${target.out}\n`);
  process.stdout.write(`recorded ${tag} ${target.out}\n`);
}

function main(argv) {
  const [operation, ...rest] = argv;
  if (!operation || operation === "--help" || operation === "-h") {
    process.stdout.write(`${USAGE}\n`);
    process.exit(operation ? 0 : 1);
  }

  let args;
  try {
    args = parse(rest);
  } catch (error) {
    usageError(error.message);
  }

  if (operation === "snapshot") snapshot(args.root);
  else if (operation === "record") record(args.root, args.tag, args.commit);
  else usageError(`unknown operation "${operation}"`);
  process.exit(0);
}

main(process.argv.slice(2));
