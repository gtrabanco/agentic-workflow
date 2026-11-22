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
 *             `HEAD`, through `git stash create` — it never touches the index,
 *             never moves a branch and never restores the worktree; untracked
 *             files never enter the tree, so build output and the plan TSV stay
 *             out. The commit's tree — never its timestamp — is the identity a
 *             caller compares.
 *   record    puts the tag on that commit. A tag already recorded on the same
 *             tree is a no-op (`already-recorded`); one recorded on another
 *             tree is refused, so a published cut is never retargeted silently.
 *
 * Stdout is the machine receipt (the commit before the tag is recorded, the
 * tag receipt after); progress and every refusal go to stderr. Exit 0 success,
 * 1 usage, 2 refusal before a tag or a commit is written. The only mutation is
 * one tag ref (`record`); `snapshot` leaves the index and the worktree exactly
 * as it found them, so the cut's `git checkout -- <paths>` still restores from
 * `HEAD`.
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

/** The options each operation declares in its USAGE line — a flag of the
 * other operation is a usage error, never a flag read and ignored. */
const OPERATION_OPTIONS = { snapshot: ["root"], record: ["root", "tag", "commit"] };

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

/** Parse `args` for `operation` against its declared option set. A value that
 * never arrives is usage (exit 1) — it used to read as the default and
 * succeed silently (valueless `--commit` tagged HEAD, valueless/empty
 * `--root` ran at cwd). A value that arrives but is empty still falls through
 * to the caller's own check, so those observed refusals stay byte-identical:
 * `record`'s missing-tag message, `--commit ""`'s unknown-commit refusal. */
function parse(operation, args) {
  const allowed = OPERATION_OPTIONS[operation] ?? [];
  const parsed = { root: process.cwd(), tag: null, commit: null };
  for (let i = 0; i < args.length; i += 1) {
    const flag = args[i];
    if (flag === "--root" || flag === "--tag" || flag === "--commit") {
      const key = flag.slice(2);
      if (!allowed.includes(key)) usageError(`${flag} is not an option of ${operation}`);
      const value = args[i + 1];
      if (key === "root" && (value === undefined || value === "")) usageError("--root needs a value");
      if (key === "commit" && value === undefined) usageError("--commit needs a value");
      if (value !== undefined) i += 1;
      if (key === "root") parsed.root = resolve(value);
      else parsed[key] = value ?? null;
    } else if (flag.startsWith("--root=")) {
      const value = flag.slice("--root=".length);
      if (value === "") usageError("--root needs a value");
      parsed.root = resolve(value);
    } else if (flag.startsWith("--tag=")) {
      if (!allowed.includes("tag")) usageError(`--tag is not an option of ${operation}`);
      parsed.tag = flag.slice("--tag=".length);
    } else if (flag.startsWith("--commit=")) {
      if (!allowed.includes("commit")) usageError(`--commit is not an option of ${operation}`);
      parsed.commit = flag.slice("--commit=".length);
    } else {
      throw new Error(`unknown argument "${flag}"`);
    }
  }
  return parsed;
}

/** Materialize the staged tracked tree; print the commit a caller tags. */
function snapshot(root) {
  requireRepo(root);
  const head = requireHead(root);

  // `stash create` writes a commit object from the worktree's tracked changes
  // and touches neither the index nor the worktree, so the cut's later
  // `git checkout -- <paths>` restores from HEAD exactly as it did before.
  const snap = git(root, ["stash", "create"], RELEASE_IDENTITY);
  if (!snap.ok) refuse(`could not materialize the staged tree: ${snap.err}`);
  if (snap.out === "") {
    process.stderr.write(`canary-tag: ${head} (clean tree — HEAD)\n`);
    process.stdout.write(`${head}\n`);
    return;
  }

  const tree = git(root, ["rev-parse", `${snap.out}^{tree}`]);
  if (!tree.ok) refuse(`could not read the staged tree: ${tree.err}`);
  process.stderr.write(`canary-tag: ${snap.out} (staged tree ${tree.out})\n`);
  process.stdout.write(`${snap.out}\n`);
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
  if (!OPERATION_OPTIONS[operation]) usageError(`unknown operation "${operation}"`);

  let args;
  try {
    args = parse(operation, rest);
  } catch (error) {
    usageError(error.message);
  }

  if (operation === "snapshot") snapshot(args.root);
  else if (operation === "record") record(args.root, args.tag, args.commit);
  else usageError(`unknown operation "${operation}"`);
  process.exit(0);
}

main(process.argv.slice(2));
