// Engine suite for packages/agentic-workflow/bin/turn-contract.mjs.
//
// Per-box pass/fail/n-a over the shared throwaway-repo matrix (fixtures.mjs),
// plus the CLI contract, subdirectory invocation, the read-only assertion, and
// the engine-only phase-lint clause of box2 (ED-52-3).

import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { makeContext, receiptCases, engineOnlyCases, git, newRepo, commitFile } from "./fixtures.mjs";

const ctx = makeContext();
test.after(() => ctx.cleanup());

for (const c of [...receiptCases(ctx), ...engineOnlyCases(ctx)]) {
  test(c.name, () => {
    const r = ctx.runEngine(c.dir, c.args ?? [], c.env ?? {});
    assert.equal(r.stdout, `${c.line}\n`, `stdout for "${c.name}"`);
    assert.equal(r.code, c.code, `exit code for "${c.name}"`);
  });
}

test("empty repo fails without a stack trace", () => {
  const r = ctx.runEngine(ctx.fx.empty);
  assert.equal(r.code, 1);
  assert.equal(r.stderr, "", "no diagnostics on a fail path");
});

test("--help names both flags and exits 0", () => {
  for (const args of [["--help"], ["--finished", "--help"]]) {
    const r = ctx.runEngine(ctx.fx.ok, args);
    assert.equal(r.code, 0, `exit for ${args.join(" ")}`);
    assert.match(r.stdout, /--finished/);
    assert.match(r.stdout, /--help/);
  }
});

test("unknown flag prints usage on stderr and exits 2", () => {
  const r = ctx.runEngine(ctx.fx.ok, ["--nope"]);
  assert.equal(r.code, 2);
  assert.equal(r.stdout, "", "usage errors never print a receipt on stdout");
  assert.match(r.stderr, /unknown argument: --nope/);
});

test("works from a subdirectory of the repository", () => {
  const sub = path.join(ctx.fx.ok, "subdir");
  mkdirSync(sub, { recursive: true });
  const r = ctx.runEngine(sub);
  assert.equal(r.code, 0);
  assert.equal(r.stdout, "TURN-CONTRACT ok\n");
});

test("the verifier is read-only", () => {
  const before = git(ctx.fx.ok, "status", "--porcelain", "--untracked-files=all");
  const r = ctx.runEngine(ctx.fx.ok);
  const after = git(ctx.fx.ok, "status", "--porcelain", "--untracked-files=all");
  assert.equal(r.stdout, "TURN-CONTRACT ok\n");
  assert.equal(after, before, "the verifier must not mutate tree or index");
});

test("the box2 phase-lint clause is read-only", () => {
  const before = git(ctx.fx.lintpass, "status", "--porcelain", "--untracked-files=all");
  const r = ctx.runEngine(ctx.fx.lintpass);
  const after = git(ctx.fx.lintpass, "status", "--porcelain", "--untracked-files=all");
  assert.equal(r.stdout, "TURN-CONTRACT ok\n");
  assert.equal(after, before, "the phase-lint spawn must not mutate tree or index");
});

test("unreadable .git fails closed with a fail line", (t) => {
  if (typeof process.getuid === "function" && process.getuid() === 0) {
    t.skip("running as root: permission bits are not enforced");
    return;
  }
  const dir = newRepo(ctx.root, "plumbing", "feat/plumbing");
  commitFile(dir, "docs/features/plumbing/ACCEPTANCE.md", "frozen\n");
  const dotgit = path.join(dir, ".git");
  chmodSync(dotgit, 0o000);
  try {
    const r = ctx.runEngine(dir);
    assert.equal(r.code, 1, "never a fake ok when plumbing is denied");
    assert.equal(r.stdout, "TURN-CONTRACT fail box1: not-a-repo\n");
  } finally {
    chmodSync(dotgit, 0o755);
  }
});
