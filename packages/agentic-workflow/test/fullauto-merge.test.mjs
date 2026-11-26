// fullauto-merge.test.mjs — the automated merge wrapper's own argv contract
// (unit 554). The preconditions and the forge matrix are the shipped corpus's
// (template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh), which drives
// this module through the shim; this suite pins the face it exposes before any
// precondition runs, so a bad call never reaches a forge or a git write.

import test from "node:test";
import assert from "node:assert/strict";

import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, chmodSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";

import { main } from "../src/fullauto-merge.mjs";

/** Run the wrapper with both streams captured; no git, no forge, no cwd. */
function cli(argv) {
  const out = [];
  const err = [];
  const code = main(argv, {
    stdout: (text) => out.push(text),
    stderr: (text) => err.push(text),
    cwd: "/nonexistent-fixture",
    env: {},
  });
  return { code, stdout: out.join(""), stderr: err.join("") };
}

test("--help prints the usage and exits 0", () => {
  const result = cli(["--help"]);
  assert.equal(result.code, 0);
  assert.match(result.stdout, /usage: fullauto-merge --pr <number> --run-id <id>/u);
});

test("an unknown argument is a usage error", () => {
  const result = cli(["--nope"]);
  assert.equal(result.code, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /unknown argument: --nope/u);
});

test("--pr and --run-id are both required", () => {
  for (const argv of [[], ["--pr", "12"], ["--run-id", "r1"]]) {
    const result = cli(argv);
    assert.equal(result.code, 1, argv.join(" "));
    assert.match(result.stderr, /--pr and --run-id are required/u);
  }
});

test("a flag without a value names the flag", () => {
  const result = cli(["--pr"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /--pr requires a value/u);
});

test("the PR must be numeric and the run id must be a token", () => {
  const numeric = cli(["--pr", "12a", "--run-id", "r1"]);
  assert.equal(numeric.code, 1);
  assert.match(numeric.stderr, /PR must be numeric/u);

  const runId = cli(["--pr", "12", "--run-id", "r 1"]);
  assert.equal(runId.code, 1);
  assert.match(runId.stderr, /run id is invalid/u);
});

test("the merge method is a closed set", () => {
  const result = cli(["--pr", "12", "--run-id", "r1", "--method", "fast-forward"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /method must be merge, squash, or rebase/u);
});

test("an unknown remote is refused before any forge is asked", () => {
  const result = cli(["--pr", "12", "--run-id", "r1", "--remote", "nowhere"]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /the remote "nowhere" is not a remote of this repository/u);
});

// --- the clean-tree precondition (issue #727) ------------------------------
// The precondition gates run in order, so the fixture reaches the tree gate (a
// stub `gh` on PATH satisfies the forge CLI carrier) and reads the NEXT
// refusal — the cases prove the gate's decision without ever reaching a merge.


function dirtFixture(tailDirty) {
  const dir = mkdtempSync(`${tmpdir()}/fullauto-727-`);
  const id = ["-c", "user.name=T", "-c", "user.email=t@t", "-c", "commit.gpgsign=false"];
  const git = (args) => spawnSync("git", ["-C", dir, ...id, ...args], { encoding: "utf8" });
  git(["init", "-q"]);
  mkdirSync(`${dir}/docs/workflow`, { recursive: true });
  writeFileSync(`${dir}/docs/workflow/TIER_COST.md`, "| unit | t |\n");
  writeFileSync(`${dir}/app.ts`, "export const one = 1;\n");
  git(["add", "."]);
  git(["commit", "-q", "-m", "chore: base"]);
  git(["remote", "add", "origin", "https://github.com/x/y.git"]);
  const branch = spawnSync("git", ["-C", dir, "symbolic-ref", "--short", "HEAD"], { encoding: "utf8" }).stdout.trim();
  git(["config", `branch.${branch}.remote`, "origin"]);
  git(["config", `branch.${branch}.merge`, "refs/heads/main"]);
  // A self-synchronized tracking ref: the sync precondition passes offline and
  // the first forge call is what follows the tree gate.
  git(["update-ref", "refs/remotes/origin/main", "HEAD"]);
  if (tailDirty) {
    writeFileSync(`${dir}/app.ts`, "export const one = 2;\n");
  } else {
    // The machine row the class declares: pending, uncommitted, and written by
    // the machinery that owns it — the state the policy says never blocks.
    writeFileSync(`${dir}/docs/workflow/TIER_COST.md`, "| unit | t |\n| 1 | 10 |\n");
  }

  // The stub `gh` answers nothing: the wrapper's forge calls only come after
  // the git preconditions these cases pin. It lives OUTSIDE the repo so its
  // own untracked bytes never dirty the tree the wrapper probes.
  const stub = mkdtempSync(`${tmpdir()}/fullauto-gh-`);
  const bin = `${stub}/bin`;
  mkdirSync(bin);
  const gh = `${bin}/gh`;
  writeFileSync(gh, "#!/usr/bin/env node\nprocess.exit(1);\n");
  chmodSync(gh, 0o755);
  const previousPath = process.env.PATH;
  process.env.PATH = `${bin}:${previousPath}`;
  const run = () => {
    try {
      const out = [];
      const err = [];
      const code = main(["--pr", "12", "--run-id", "r1"], { stdout: (t) => out.push(t), stderr: (t) => err.push(t), cwd: dir, env: { ...process.env } });
      return { code, stderr: err.join(""), stdout: out.join("") };
    } finally {
      process.env.PATH = previousPath;
      rmSync(dir, { recursive: true, force: true });
      rmSync(stub, { recursive: true, force: true });
    }
  };
  return run;
}

test("a dirty foreign file refuses with the tree's own message before any upstream is read", () => {
  const run = dirtFixture(true);
  const result = run();
  assert.equal(result.code, 1);
  assert.match(result.stderr, /working tree is not clean/u);
});

test("a pending machine-owned ledger row is not the dirt this wrapper refuses on (issue #727)", () => {
  const run = dirtFixture(false);
  // Only the machine row is pending; the forge precondition is what greets a
  // tree-gate pass offline (the stub `gh` cannot answer).
  const result = run();
  assert.equal(result.code, 1);
  assert.ok(!/not clean/u.test(result.stderr), `the machine row never triggers the tree refusal: ${result.stderr}`);
  assert.match(result.stderr, /could not answer for PR/u, `the tree gate passed, the forge gate refused: ${result.stderr}`);
});

