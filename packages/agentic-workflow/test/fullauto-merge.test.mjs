// fullauto-merge.test.mjs — the automated merge wrapper's own argv contract
// (unit 554). The preconditions and the forge matrix are the shipped corpus's
// (template/.agentic-workflow/hooks/tests/test-fullauto-merge.sh), which drives
// this module through the shim; this suite pins the face it exposes before any
// precondition runs, so a bad call never reaches a forge or a git write.

import test from "node:test";
import assert from "node:assert/strict";

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
