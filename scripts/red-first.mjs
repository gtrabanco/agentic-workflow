#!/usr/bin/env node
/**
 * red-first.mjs — the deterministic half of the red-first ceremony (fix #382).
 *
 * A new `scripts/<x>.mjs` + `scripts/<x>.test.mjs` pair must land as two
 * commits: the suite's red commit (observed failing on the missing module or
 * the failing assertion) precedes the implementation's green commit. This
 * gate reads the repository's git history and orders every tracked pair —
 * the pair-existence rule stays owned by `scripts/structural-sibling-pins.test.mjs`,
 * which this gate composes beside and never replaces.
 *
 * Usage
 *   bun scripts/red-first.mjs                  (the repository this file lives in)
 *   bun scripts/red-first.mjs --repo <dir>     (another tree's history)
 *   (node fallback, same argv)
 *
 * Cutoff: the gate's own introducing commit (`git log --diff-filter=A` for
 * `scripts/red-first.mjs`). Every pair introduced at or before the cutoff is
 * grandfathered — the rule never reaches back into published history.
 *
 * stdout: one fixed, byte-stable block — a `red-first —` header naming the
 * pair count and the cutoff, one `FINDING <path> — <detail>` line per
 * finding in path order, a tally, then `verdict`.
 * exit: 0 only when the verdict is `PASS`; 1 when it is `FAIL`; 2 on a usage
 * error (an unknown flag, a missing `--repo` value, or a target that is not
 * a git repository).
 *
 * Read-only: it writes nothing, calls no network, has no external dependency,
 * and holds no state between runs — the same history always prints the same
 * block. Its sibling suite is `scripts/red-first.test.mjs`.
 */

import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE_PATH = "scripts/red-first.mjs";

function usage(message) {
  process.stderr.write(`red-first: ${message}\n`);
  process.stderr.write("usage: bun scripts/red-first.mjs [--repo <dir>]  (node fallback, same argv)\n");
  process.exit(2);
}

function main(argv) {
  let root = null;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo") {
      const value = argv[index + 1];
      if (value === undefined) usage("--repo needs a directory");
      root = path.resolve(value);
      index += 1;
    } else usage(`unknown argument ${arg}`);
  }
  root = root ?? DEFAULT_ROOT;

  const git = (args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    if (result.status !== 0) usage(`${root} is not a git repository (${result.stderr.trim().split("\n")[0]})`);
    return result.stdout;
  };
  const lines = (out) => out.split("\n").map((line) => line.trim()).filter(Boolean);

  /** The oldest commit that added `file` — its introducing commit. */
  const introduced = (file) => {
    const commits = lines(git(["log", "--diff-filter=A", "--format=%H", "--", file]));
    return commits.length === 0 ? null : commits[commits.length - 1];
  };
  const isAncestor = (older, newer) => ancestorStatus(older, newer, root) === 0;

  const cutoff = introduced(GATE_PATH);
  if (cutoff === null) usage(`${GATE_PATH} is not tracked in ${root} — the cutoff is undefined`);

  const tracked = new Set(lines(git(["ls-files", "--", "scripts"])));
  const tests = [...tracked].filter((file) => file.startsWith("scripts/") && file.endsWith(".test.mjs")).sort();
  const pairs = [];
  for (const testFile of tests) {
    const impl = testFile.replace(/\.test\.mjs$/, ".mjs");
    if (!tracked.has(impl)) continue;
    pairs.push({ impl, testCommit: introduced(testFile), implCommit: introduced(impl) });
  }

  const after = (sha) => sha !== cutoff && isAncestor(cutoff, sha);
  const checked = pairs.filter((pair) => after(pair.testCommit) && after(pair.implCommit));
  const findings = [];
  for (const pair of checked) {
    if (pair.testCommit === pair.implCommit) {
      findings.push(`FINDING ${pair.impl} — the pair lands in one commit (${pair.implCommit.slice(0, 7)}): no red commit exists`);
    } else if (isAncestor(pair.implCommit, pair.testCommit)) {
      findings.push(`FINDING ${pair.impl} — the implementation (${pair.implCommit.slice(0, 7)}) precedes its suite (${pair.testCommit.slice(0, 7)}): the suite never ran red`);
    } else if (!isAncestor(pair.testCommit, pair.implCommit)) {
      findings.push(`FINDING ${pair.impl} — the pair's commits diverged; no ordering is provable from the history`);
    }
  }

  const verdict = findings.length === 0 ? "PASS" : "FAIL";
  console.log(`red-first — ${pairs.length} pair(s) · ${checked.length} after the cutoff · cutoff ${cutoff.slice(0, 7)}`);
  for (const finding of findings) console.log(finding);
  console.log(`red-first: ${findings.length} finding(s)`);
  console.log(`verdict: ${verdict}`);
  process.exit(verdict === "PASS" ? 0 : 1);
}

/** `git merge-base --is-ancestor` as a status probe (0 = ancestor or equal). */
function ancestorStatus(older, newer, root) {
  return spawnSync("git", ["merge-base", "--is-ancestor", older, newer], { cwd: root, encoding: "utf8" }).status ?? 1;
}

main(process.argv.slice(2));
