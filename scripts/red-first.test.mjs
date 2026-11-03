#!/usr/bin/env node
/**
 * red-first.test.mjs — the fixture corpus for `scripts/red-first.mjs`
 * (fix #382, obligations O1–O5).
 *
 * The gate reads a repository's git history and orders every
 * `scripts/<x>.mjs` + `scripts/<x>.test.mjs` pair: the suite's introducing
 * commit must precede the implementation's for pairs introduced after the
 * gate itself. Every case here builds a throwaway git repository (the
 * `run-root-suite` fixture pattern — signing neutralized, `mktemp -d`,
 * removed in a `finally`), commits the scenario, and runs the gate over it.
 * The shipped tree's own history is the grandfathering pin.
 *
 * Usage
 *   node --test scripts/red-first.test.mjs     (the root gate's form)
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE = path.join(repoRoot, "scripts/red-first.mjs");
const GATE_SOURCE = fs.readFileSync(GATE, "utf8");
const tmpBase = process.env.TMPDIR || "/var/tmp";

const TEST_FILE = `import { test } from "node:test";\ntest("pair suite", () => {});\n`;
const IMPL_FILE = `export const pair = 1;\n`;
const NO_PAIR_TEST = `import { test } from "node:test";\ntest("structural gate", () => {});\n`;

/**
 * A throwaway repository whose commits are `[{ files, deletes, message }, …]`,
 * each committed in order with signing neutralized (the operator's
 * `commit.gpgsign` cannot fail a fixture that commits nothing real).
 * `deletes` removes paths with `git rm`, so a later re-add counts as an add.
 */
function withRepo(commits, run) {
  const root = fs.mkdtempSync(path.join(tmpBase, "red-first-"));
  try {
    const git = (args) => {
      const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
      assert.equal(result.status, 0, `git ${args.join(" ")} failed:\n${result.stderr}`);
      return result.stdout;
    };
    git(["init", "-b", "main"]);
    git(["config", "user.email", "fixture@example.invalid"]);
    git(["config", "user.name", "fixture"]);
    const shas = [];
    for (const commit of commits) {
      for (const [file, content] of Object.entries(commit.files ?? {})) {
        fs.mkdirSync(path.join(root, file, ".."), { recursive: true });
        fs.writeFileSync(path.join(root, file), content);
      }
      if (commit.deletes) git(["rm", "-q", "--", ...commit.deletes]);
      git(["add", "."]);
      git(["-c", "commit.gpgsign=false", "commit", "-m", commit.message]);
      shas.push(git(["rev-parse", "HEAD"]).trim());
    }
    return run(root, shas);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/** Run the gate over a fixture repository. */
function gate(root, args = []) {
  const result = spawnSync(process.execPath, [GATE, "--repo", root, ...args], { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, output: `${result.stdout}${result.stderr}` };
}

/** A commit that plants the gate itself — the fixture's cutoff anchor. */
const gateCommit = { files: { "scripts/red-first.mjs": GATE_SOURCE }, message: "chore: the gate" };

// ── The required failure states (O1, O3) ────────────────────────────────────

test("a pair committed together after the gate fails (O1)", () => {
  withRepo(
    [gateCommit, { files: { "scripts/pair.mjs": IMPL_FILE, "scripts/pair.test.mjs": TEST_FILE }, message: "feat: pair in one commit" }],
    (root) => {
      const result = gate(root);
      assert.equal(result.status, 1, result.output);
      assert.match(result.stdout, /FINDING .*scripts\/pair\.mjs/, result.stdout);
      assert.match(result.stdout, /^verdict: FAIL$/m, result.stdout);
    },
  );
});

test("an implementation committed before its suite fails (O3)", () => {
  withRepo(
    [
      gateCommit,
      { files: { "scripts/late.mjs": IMPL_FILE }, message: "feat: the script alone" },
      { files: { "scripts/late.test.mjs": TEST_FILE }, message: "test: the suite arrives late" },
    ],
    (root) => {
      const result = gate(root);
      assert.equal(result.status, 1, result.output);
      assert.match(result.stdout, /FINDING .*scripts\/late\.mjs/, result.stdout);
      assert.match(result.stdout, /^verdict: FAIL$/m, result.stdout);
    },
  );
});

// ── The passing orders (O2) ─────────────────────────────────────────────────

test("a suite-only commit before the implementation passes (O2)", () => {
  withRepo(
    [
      gateCommit,
      { files: { "scripts/ordered.test.mjs": TEST_FILE }, message: "test: the suite lands red" },
      { files: { "scripts/ordered.mjs": IMPL_FILE }, message: "feat: the implementation lands green" },
    ],
    (root) => {
      const result = gate(root);
      assert.equal(result.status, 0, result.output);
      assert.match(result.stdout, /^verdict: PASS$/m, result.stdout);
    },
  );
});

// ── Grandfathering and scope (O4) ───────────────────────────────────────────

test("a pair introduced before the gate is grandfathered (O4)", () => {
  withRepo(
    [
      { files: { "scripts/old.mjs": IMPL_FILE, "scripts/old.test.mjs": TEST_FILE }, message: "feat: pre-gate pair, one commit" },
      gateCommit,
    ],
    (root) => {
      const result = gate(root);
      assert.equal(result.status, 0, result.output);
      assert.match(result.stdout, /^verdict: PASS$/m, result.stdout);
    },
  );
});

test("a suite with no implementation sibling is out of scope (O4)", () => {
  withRepo(
    [gateCommit, { files: { "scripts/structural.test.mjs": NO_PAIR_TEST }, message: "test: structural gate, no pair" }],
    (root) => {
      const result = gate(root);
      assert.equal(result.status, 0, result.output);
      assert.match(result.stdout, /^verdict: PASS$/m, result.stdout);
    },
  );
});

// ── A re-added pair is judged by its latest add (O1) ────────────────────────

test("a pair re-added together after an earlier add still fails (O1)", () => {
  withRepo(
    [
      gateCommit,
      { files: { "scripts/back.test.mjs": TEST_FILE }, message: "test: the suite lands red" },
      { files: { "scripts/back.mjs": IMPL_FILE }, message: "feat: the implementation lands green" },
      { deletes: ["scripts/back.mjs", "scripts/back.test.mjs"], message: "chore: drop the pair" },
      { files: { "scripts/back.mjs": IMPL_FILE, "scripts/back.test.mjs": TEST_FILE }, message: "feat: the pair lands in one commit again" },
    ],
    (root) => {
      const result = gate(root);
      assert.equal(result.status, 1, result.output);
      assert.match(result.stdout, /FINDING .*scripts\/back\.mjs/, result.stdout);
      assert.match(result.stdout, /^verdict: FAIL$/m, result.stdout);
    },
  );
});

// ── Read-only and byte-stable (O5) ──────────────────────────────────────────

test("the gate writes nothing and is byte-stable across runs (O5)", () => {
  withRepo(
    [gateCommit, { files: { "scripts/pair.mjs": IMPL_FILE, "scripts/pair.test.mjs": TEST_FILE }, message: "feat: pair in one commit" }],
    (root) => {
      const before = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).stdout;
      const one = gate(root);
      const two = gate(root);
      assert.equal(one.stdout, two.stdout, "the report is byte-stable across runs");
      const after = spawnSync("git", ["status", "--porcelain"], { cwd: root, encoding: "utf8" }).stdout;
      assert.equal(after, before, "the gate wrote nothing");
    },
  );
});

// ── Usage contract ──────────────────────────────────────────────────────────

test("an unknown flag is a usage error, never a silent drop", () => {
  withRepo([gateCommit], (root) => {
    const result = gate(root, ["--unknown"]);
    assert.equal(result.status, 2, result.output);
    assert.match(result.stderr, /unknown argument/, result.stderr);
  });
});

// ── The shipped tree is clean, and stays clean as scripts evolve (O4) ───────

test("the shipped repository's history passes the gate (O4)", () => {
  const result = spawnSync(process.execPath, [GATE], { cwd: repoRoot, encoding: "utf8" });
  const output = `${result.stdout}${result.stderr}`;
  assert.equal(result.status, 0, `the shipped history reports findings:\n${output}`);
  assert.match(result.stdout, /^verdict: PASS$/m, output);
  assert.match(result.stdout, /^red-first — \d+ pair\(s\) · \d+ after the cutoff · cutoff [0-9a-f]{7}/m, output);
});
