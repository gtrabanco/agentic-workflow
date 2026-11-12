/**
 * differential-baseline.test.mjs — the baseline run's contract (issue #437, S9;
 * absorbs #363's phase).
 *
 * Pinned here: the four verdict classes (a base failure is an advisory, a
 * base-pass/head-fail is a regression), the two-layer staleness judge the owner
 * selected (scope-digest mechanism + declared trivial-path policy, D1), and the
 * policy listing that makes every trivial class and its exclusion auditable.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  BASELINE_CONTRACT,
  TRIVIAL_PATH_CLASSES,
  classifyVerdict,
  judgeStaleness,
} from "./differential-baseline.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts", "differential-baseline.mjs");

function run(args, opts = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { cwd: opts.cwd || ROOT, encoding: "utf8" });
}

function field(stdout, name) {
  const match = stdout.match(new RegExp(`^${name} \\| (.*)$`, "m"));
  return match ? match[1] : null;
}

function git(cwd, ...args) {
  const result = spawnSync("git", ["-c", "user.email=t@example.com", "-c", "user.name=t", ...args], {
    cwd,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

/** A throwaway repository with two commits, so base and head really differ. */
function fixtureRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "differential-baseline-"));
  git(dir, "init", "-q", "-b", "main");
  fs.writeFileSync(path.join(dir, "stable.txt"), "stable\n");
  fs.writeFileSync(path.join(dir, "removed-at-head.txt"), "gone\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "base");
  fs.rmSync(path.join(dir, "removed-at-head.txt"));
  fs.writeFileSync(path.join(dir, "added-at-head.txt"), "new\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", "head");
  return dir;
}

test("verdicts: the four classes, with the base failure as an advisory", () => {
  assert.equal(classifyVerdict(0, 0), "pass");
  assert.equal(classifyVerdict(1, 1), "pre-existing-failure");
  assert.equal(classifyVerdict(0, 1), "regression");
  assert.equal(classifyVerdict(1, 0), "repaired");
});

test("staleness: no delta is fresh, a trivial delta is trivial, anything else is stale", () => {
  assert.equal(judgeStaleness({ changedPaths: [] }).state, "fresh");
  assert.equal(judgeStaleness({ changedPaths: ["docs/LOGS.md"] }).state, "trivial");
  assert.equal(judgeStaleness({ changedPaths: ["docs/features/1-a/SPEC.md", "bun.lock"] }).state, "trivial");
  const stale = judgeStaleness({ changedPaths: ["scripts/differential-baseline.mjs", ".serena/project.yml"] });
  assert.equal(stale.state, "stale");
  assert.deepEqual(stale.affecting, ["scripts/differential-baseline.mjs"]);
  assert.deepEqual(stale.trivial, [".serena/project.yml"]);
});

test("staleness: a commit prefix is never consulted — the bytes decide", () => {
  // The policy is path-based; there is no subject input anywhere in the judge,
  // so a `chore(docs):` subject over an executable path still goes stale.
  assert.equal(judgeStaleness({ changedPaths: ["scripts/a.mjs"] }).state, "stale");
});

test("policy: every trivial class declares its patterns and its reason", () => {
  assert.ok(TRIVIAL_PATH_CLASSES.length >= 3);
  for (const entry of TRIVIAL_PATH_CLASSES) {
    assert.match(entry.name, /^[a-z-]+$/);
    assert.ok(Array.isArray(entry.patterns) && entry.patterns.length > 0);
    assert.ok(entry.reason.length > 10);
  }
  const names = TRIVIAL_PATH_CLASSES.map((entry) => entry.name);
  assert.ok(names.includes("documentation"));
  assert.ok(names.includes("lockfile"));
  assert.ok(!names.includes("formatting-only"), "no formatter is declared, so the class cannot exist");
});

test("--policy prints the declared classes and the recorded exclusion", () => {
  const result = run(["--policy"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, new RegExp(`^${BASELINE_CONTRACT}$`, "m"));
  assert.match(result.stdout, /^class — documentation · /m);
  assert.match(result.stdout, /^class — lockfile · /m);
  assert.match(result.stdout, /^excluded — formatting-only · /m);
  assert.match(result.stdout, /^mechanism — scope-digest · scripts\/scope-manifest\.mjs$/m);
});

test("the rule this run implements cites the run, never a pending check", () => {
  // S9's impact claim: CLASSIFY.md owns the baseline-advisory rule and cites the
  // run that proves cause. The pre-437 wording — "until it exists the rule is
  // cited from here" — is the superseded text this case freezes out.
  const rule = fs.readFileSync(path.join(ROOT, "skills/review-implementation/references/CLASSIFY.md"), "utf8");
  assert.ok(fs.existsSync(CLI), "the cited run exists at scripts/differential-baseline.mjs");
  assert.match(rule, /scripts\/differential-baseline\.mjs/, "the rule cites the baseline run");
  assert.doesNotMatch(rule, /until it exists/, "the rule no longer calls the baseline check pending");
});

test("the run classifies every validator and exits 1 only on a regression", () => {
  const repo = fixtureRepo();
  const validators = path.join(repo, "validators.txt");
  fs.writeFileSync(
    validators,
    [
      "test -f stable.txt",
      "test -f added-at-head.txt",
      "test -f removed-at-head.txt",
      "false",
    ].join("\n"),
  );
  const result = run(["--base", "HEAD~1", "--head", "HEAD", "--validators", validators, "--repo", repo]);
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stdout, /^validator — test -f stable\.txt · base exit 0 · head exit 0 · pass$/m);
  assert.match(result.stdout, /^validator — test -f added-at-head\.txt · base exit 1 · head exit 0 · repaired$/m);
  assert.match(result.stdout, /^validator — test -f removed-at-head\.txt · base exit 0 · head exit 1 · regression$/m);
  assert.match(result.stdout, /^validator — false · base exit 1 · head exit 1 · pre-existing-failure$/m);
  assert.equal(field(result.stdout, "verdict"), "REGRESSION");
});

test("a base failure alone is an advisory: exit 0, never a correction round", () => {
  const repo = fixtureRepo();
  const validators = path.join(repo, "validators.txt");
  fs.writeFileSync(validators, "false\n");
  const result = run(["--base", "HEAD~1", "--head", "HEAD", "--validators", validators, "--repo", repo]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(field(result.stdout, "verdict"), "PRE-EXISTING");
});

test("the run judges staleness against a reviewed revision", () => {
  const repo = fixtureRepo();
  const validators = path.join(repo, "validators.txt");
  fs.writeFileSync(validators, "test -f stable.txt\n");
  const stale = run(["--base", "HEAD~1", "--head", "HEAD", "--validators", validators, "--repo", repo, "--reviewed", "HEAD~1"]);
  assert.equal(field(stale.stdout, "staleness"), "stale");
  const fresh = run(["--base", "HEAD~1", "--head", "HEAD", "--validators", validators, "--repo", repo, "--reviewed", "HEAD"]);
  assert.equal(field(fresh.stdout, "staleness"), "fresh");
});

test("usage: an unknown flag is exit 2, and a missing validators file is a real failure", () => {
  assert.equal(run(["--nope"]).status, 2);
  const missing = run(["--base", "HEAD~1", "--validators", "/nonexistent/validators.txt"]);
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /validators/);
});
