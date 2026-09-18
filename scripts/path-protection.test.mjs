#!/usr/bin/env node

/**
 * Feature 60 — repo-root discipline suite for the Tier 1 path-protection gate
 * (AC-02, AC-05, and the P1 dev-scenario pins).
 *
 * Every case drives `packages/agentic-workflow/bin/path-guard.mjs` end to end
 * over a throwaway git fixture repo: the CLI exit codes and fixed block, the
 * closed-reason closure, the no-auto-approval negative case, the
 * policy-config-always-protected case, and the `path-guard:two-runs` /
 * `path-guard:committed-range` / `path-guard:freeze-boundary` /
 * `path-guard:missing-approval` / `path-guard:unmatched-record` scenarios.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { PATH_GUARD_REASONS } from "../packages/agentic-workflow/src/path-policy.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(repoRoot, "packages/agentic-workflow/bin/path-guard.mjs");
const UNIT = "docs/features/60-path-protection-guards";
const GIT_CONFIG = ["-c", "user.email=t@example.com", "-c", "user.name=test", "-c", "commit.gpgsign=false"];

const DIRS = new Set();
after(() => {
  for (const dir of DIRS) fs.rmSync(dir, { recursive: true, force: true });
});

function git(dir, ...args) {
  return execFileSync("git", [...GIT_CONFIG, "-C", dir, ...args], { encoding: "utf8" }).trimEnd();
}

function commit(dir, rel, content) {
  const target = path.join(dir, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  git(dir, "add", rel);
  git(dir, "commit", "-q", "-m", `add ${rel}`);
}

function declaration({ freezeAfter = "P4", rows = [] } = {}) {
  const body = rows.length > 0 ? rows.join("\n") : "created | tests/** | the declared test set";
  return `\`\`\`text\npath-protection-plan@1\nfreeze-after: ${freezeAfter}\nkind | path | justification\n${body}\n\`\`\`\n`;
}

function recordsBlock(rows) {
  return `\`\`\`text\npath-protection-records@1\nkind | paths | phase | date | authority | justification\n${rows.join("\n")}\n\`\`\`\n`;
}

/** A throwaway repo with a committed unit declaration and optional policy config. */
function fixture(name, { freezeAfter = "P4", rows = [], config = undefined } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), `path-guard-disc-${name}-`));
  DIRS.add(dir);
  git(dir, "init", "-q", "-b", "feat/unit");
  commit(dir, "README.md", "base\n");
  commit(dir, `${UNIT}/PLAN.md`, declaration({ freezeAfter, rows }));
  if (config !== undefined) commit(dir, ".agentic-workflow/path-policy.json", config);
  return dir;
}

function run(dir, args) {
  const result = spawnSync(process.execPath, [CLI, "--unit", UNIT, ...args], { cwd: dir, encoding: "utf8" });
  return { code: result.status, stdout: result.stdout, stderr: result.stderr };
}

function reasonOf(stdout) {
  return /^PATH-GUARD \w+ — (\S+)$/m.exec(stdout)?.[1];
}

/* ------------------------------------------------------------- exit codes */

test("a clean tree exits 0 with the fixed pass block", () => {
  const dir = fixture("clean");
  const result = run(dir, ["--phase", "P1"]);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(reasonOf(result.stdout), "clean");
  assert.match(result.stdout, /^offenders: none$/m);
  assert.match(result.stdout, /^phase: P1 · freeze-after: P4 · checked: 0$/m);
  assert.match(result.stdout, /DEGRADED — missing-config: shipped defaults in force/);
});

test("a dirty protected modification exits 1 with a closed reason", () => {
  const dir = fixture("dirty");
  commit(dir, "tests/a.mjs", "v1\n");
  fs.writeFileSync(path.join(dir, "tests/a.mjs"), "v2\n");
  const result = run(dir, ["--phase", "P1"]);
  assert.equal(result.code, 1);
  assert.equal(reasonOf(result.stdout), "protected-modification");
  assert.equal(PATH_GUARD_REASONS.includes(reasonOf(result.stdout)), true);
  assert.match(result.stdout, /^offenders: tests\/a\.mjs:modify:protected-modification$/m);
});

test("the same change passes once a justification record exists", () => {
  const dir = fixture("justified");
  commit(dir, "tests/a.mjs", "v1\n");
  fs.writeFileSync(path.join(dir, "tests/a.mjs"), "v2\n");
  commit(dir, `${UNIT}/decisions.md`, recordsBlock([
    "justification | tests/a.mjs | P1 | 2026-09-18 | execute-phase | the expectation changed",
  ]));
  const result = run(dir, ["--phase", "P1"]);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(reasonOf(result.stdout), "justified");
});

/* --------------------------------------------------------------- scenarios */

test("path-guard:committed-range — a committed protected modification fails at the checkpoint", () => {
  const dir = fixture("range");
  commit(dir, "tests/a.mjs", "v1\n");
  const base = git(dir, "rev-parse", "HEAD");
  commit(dir, "tests/a.mjs", "v2\n");
  const failed = run(dir, ["--phase", "P1", "--base", base]);
  assert.equal(failed.code, 1);
  assert.equal(reasonOf(failed.stdout), "protected-modification");
  assert.match(failed.stdout, /checked: 1$/m);

  fs.writeFileSync(path.join(dir, `${UNIT}/decisions.md`), recordsBlock([
    "justification | tests/a.mjs | P1 | 2026-09-18 | execute-phase | committed under justification",
  ]));
  const passed = run(dir, ["--phase", "P1", "--base", base]);
  assert.equal(passed.code, 0, passed.stderr);
  assert.equal(reasonOf(passed.stdout), "justified");
});

test("path-guard:two-runs — two runs are byte-identical and mutate nothing", () => {
  const dir = fixture("two-runs");
  commit(dir, "tests/a.mjs", "v1\n");
  fs.writeFileSync(path.join(dir, "tests/a.mjs"), "v2\n");
  const before = git(dir, "status", "--porcelain", "--untracked-files=all");
  const first = run(dir, ["--phase", "P1"]);
  const second = run(dir, ["--phase", "P1"]);
  const after = git(dir, "status", "--porcelain", "--untracked-files=all");
  assert.equal(first.stdout, second.stdout);
  assert.equal(first.code, second.code);
  assert.equal(after, before);
});

test("path-guard:malformed-config — shipped defaults stay in force and the fallback is reported", () => {
  const dir = fixture("malformed", { config: "{ not json" });
  const result = run(dir, ["--phase", "P1"]);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(reasonOf(result.stdout), "clean");
  assert.match(result.stdout, /DEGRADED — malformed-config: shipped defaults in force/);
});

test("path-guard:missing-approval — post-freeze needs the recorded owner approval", () => {
  const dir = fixture("approval", { freezeAfter: "P1" });
  commit(dir, "tests/a.mjs", "v1\n");
  fs.writeFileSync(path.join(dir, "tests/a.mjs"), "v2\n");
  fs.writeFileSync(path.join(dir, `${UNIT}/decisions.md`), recordsBlock([
    "justification | tests/a.mjs | P2 | 2026-09-18 | execute-phase | justified post-freeze",
  ]));
  const failed = run(dir, ["--phase", "P2"]);
  assert.equal(failed.code, 1);
  assert.equal(reasonOf(failed.stdout), "approval-required");

  fs.writeFileSync(path.join(dir, `${UNIT}/decisions.md`), recordsBlock([
    "justification | tests/a.mjs | P2 | 2026-09-18 | execute-phase | justified post-freeze",
    "approval | tests/a.mjs | P2 | 2026-09-18 | human-owner | owner approved the change",
  ]));
  const passed = run(dir, ["--phase", "P2"]);
  assert.equal(passed.code, 0, passed.stderr);
  assert.equal(reasonOf(passed.stdout), "approved");
});

test("path-guard:freeze-boundary — the requirement flips at the declared phase", () => {
  const dir = fixture("boundary", { freezeAfter: "P1" });
  commit(dir, "tests/a.mjs", "v1\n");
  fs.writeFileSync(path.join(dir, "tests/a.mjs"), "v2\n");
  fs.writeFileSync(path.join(dir, `${UNIT}/decisions.md`), recordsBlock([
    "justification | tests/a.mjs | P1 | 2026-09-18 | execute-phase | at the boundary",
  ]));
  const atBoundary = run(dir, ["--phase", "P1"]);
  assert.equal(atBoundary.code, 0, atBoundary.stderr);
  assert.equal(reasonOf(atBoundary.stdout), "justified");

  fs.writeFileSync(path.join(dir, `${UNIT}/decisions.md`), recordsBlock([
    "justification | tests/a.mjs | P2 | 2026-09-18 | execute-phase | past the boundary",
  ]));
  const pastBoundary = run(dir, ["--phase", "P2"]);
  assert.equal(pastBoundary.code, 1);
  assert.equal(reasonOf(pastBoundary.stdout), "approval-required");
});

test("path-guard:unmatched-record — a record matching no changed path fails the gate", () => {
  const dir = fixture("unmatched");
  fs.writeFileSync(path.join(dir, `${UNIT}/decisions.md`), recordsBlock([
    "justification | tests/ghost.mjs | P1 | 2026-09-18 | execute-phase | orphan",
  ]));
  const result = run(dir, ["--phase", "P1"]);
  assert.equal(result.code, 1);
  assert.equal(reasonOf(result.stdout), "unmatched-record");
});

/* ---------------------------------------------------------- safety invariants */

test("no auto-approval: a non-owner approval row is malformed, never honored", () => {
  const dir = fixture("no-auto-approval", { freezeAfter: "P1" });
  commit(dir, "tests/a.mjs", "v1\n");
  fs.writeFileSync(path.join(dir, "tests/a.mjs"), "v2\n");
  fs.writeFileSync(path.join(dir, `${UNIT}/decisions.md`), recordsBlock([
    "justification | tests/a.mjs | P2 | 2026-09-18 | execute-phase | justified",
    "approval | tests/a.mjs | P2 | 2026-09-18 | execute-phase | agent self-approves",
  ]));
  const result = run(dir, ["--phase", "P2"]);
  assert.equal(result.code, 1);
  assert.equal(reasonOf(result.stdout), "malformed-declaration");
});

test("the policy config is protected at all times, in every phase", () => {
  const dir = fixture("policy-config", { config: JSON.stringify(policyDoc()) });
  for (const phase of ["P1", "P9"]) {
    fs.writeFileSync(path.join(dir, ".agentic-workflow/path-policy.json"), JSON.stringify(policyDoc({ extraGlob: true })));
    const failed = run(dir, ["--phase", phase]);
    assert.equal(failed.code, 1, `phase ${phase} must protect the policy`);
    assert.equal(reasonOf(failed.stdout), "protected-modification");

    fs.writeFileSync(path.join(dir, `${UNIT}/decisions.md`), recordsBlock([
      `justification | .agentic-workflow/path-policy.json | ${phase} | 2026-09-18 | execute-phase | policy edit`,
      `approval | .agentic-workflow/path-policy.json | ${phase} | 2026-09-18 | human-owner | owner approved`,
    ]));
    const passed = run(dir, ["--phase", phase]);
    assert.equal(passed.code, 0, passed.stderr);
    assert.equal(reasonOf(passed.stdout), "approved");
  }
});

/** A valid full policy document (the shipped shape) with an optional extra glob. */
function policyDoc({ extraGlob = false } = {}) {
  const classes = {
    tests: { globs: ["tests/**"], freeze: true },
    e2e: { globs: ["e2e/**"], freeze: true },
    "test-file": { globs: ["**/*.test.*"], freeze: true },
    fixtures: { globs: ["fixtures/**", "**/fixtures/**"], freeze: true },
    "policy-config": { globs: [".agentic-workflow/path-policy.json"], freeze: false },
  };
  if (extraGlob) classes.tests.globs.push("spec/**");
  return {
    schema: "path-protection-policy@1",
    classes,
    matrix: {
      "pre-freeze": { create: "none", modify: "justification", delete: "justification", rename: "justification" },
      "post-freeze": { create: "justification", modify: "approval", delete: "approval", rename: "approval" },
      always: { create: "approval", modify: "approval", delete: "approval", rename: "approval" },
    },
  };
}
