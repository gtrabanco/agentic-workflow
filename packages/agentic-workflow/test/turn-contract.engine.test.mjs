// Engine suite for packages/agentic-workflow/bin/turn-contract.mjs.
//
// Per-box pass/fail/n-a over the shared throwaway-repo matrix (fixtures.mjs),
// plus the CLI contract, subdirectory invocation, the read-only assertion, and
// the engine-only phase-lint clause of box2 (ED-52-3).

import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
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

test("the status read does not rewrite .git/index", () => {
  const dir = newRepo(ctx.root, "readonlyindex", "feat/readonlyindex");
  commitFile(dir, "docs/features/readonlyindex/SPEC.md", "unit doc\n");
  // A stale mtime on a tracked file makes `git status` want to refresh the
  // index; the read must not write it (F10, fold cycle 3 — a porcelain-only
  // before/after comparison cannot observe that write).
  const stale = new Date("2020-01-01T00:00:00.000Z");
  utimesSync(path.join(dir, "README.md"), stale, stale);
  const index = path.join(dir, ".git", "index");
  const before = readFileSync(index);
  const r = ctx.runEngine(dir);
  assert.equal(r.stdout, "TURN-CONTRACT ok\n");
  assert.equal(r.code, 0);
  assert.deepEqual(readFileSync(index), before, "git status must not refresh (rewrite) .git/index");
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

// ---------------------------------------------------------------------------
// Box 5 and the machine-owned ledger class (issue #727 S1d). The class's writer
// is machinery, so its pending bytes are not the dirty tree the box exists to
// refuse — while a human-uncommitted file still is, and an exempt row can never
// excuse an unpublished commit.
// ---------------------------------------------------------------------------

const LEDGER_HEADER = "| unit | tokens |\n| --- | --- |\n";

test("box5: a pending machine-ledger row is exempt from dirty-tree", () => {
  const dir = newRepo(ctx.root, "exemptledger", "main");
  git(dir, "checkout", "-q", "-b", "feat/exemptledger");
  commitFile(dir, "docs/features/exemptledger/SPEC.md", "unit doc\n");
  commitFile(dir, "docs/workflow/TIER_COST.md", `${LEDGER_HEADER}| 1 | 10 |\n`);
  writeFileSync(path.join(dir, "docs/workflow/TIER_COST.md"), `${LEDGER_HEADER}| 1 | 10 |\n| 2 | 20 |\n`);
  const r = ctx.runEngine(dir);
  assert.equal(r.stdout, "TURN-CONTRACT ok\n");
  assert.equal(r.code, 0);
});

test("box5: an untracked journal fragment is exempt too", () => {
  const dir = newRepo(ctx.root, "exemptfragment", "main");
  git(dir, "checkout", "-q", "-b", "feat/exemptfragment");
  commitFile(dir, "docs/features/exemptfragment/SPEC.md", "unit doc\n");
  mkdirSync(path.join(dir, ".agentic-workflow/journal"), { recursive: true });
  writeFileSync(path.join(dir, ".agentic-workflow/journal/20261126T160000Z-fixture.md"), "- **Summary:** fixture\n");
  const r = ctx.runEngine(dir);
  assert.equal(r.stdout, "TURN-CONTRACT ok\n");
  assert.equal(r.code, 0);
});

test("box5: a human-uncommitted ordinary file still fails dirty-tree", () => {
  const dir = newRepo(ctx.root, "humandirty", "main");
  git(dir, "checkout", "-q", "-b", "feat/humandirty");
  commitFile(dir, "docs/features/humandirty/SPEC.md", "unit doc\n");
  commitFile(dir, "src/app.ts", "export const one = 1;\n");
  writeFileSync(path.join(dir, "src/app.ts"), "export const one = 1;\nexport const two = 2;\n");
  writeFileSync(path.join(dir, "docs/workflow/TIER_COST.md"), `${LEDGER_HEADER}| 1 | 10 |\n`);
  const r = ctx.runEngine(dir);
  assert.equal(r.stdout, "TURN-CONTRACT fail box5: dirty-tree\n");
  assert.equal(r.code, 1);
});

test("box5: an exempt row does not hide an ahead-of-remote branch", () => {
  // fx.ahead is pushed and then carries one local commit: clean, but unpublished.
  // An exempt ledger row must not turn that into an ok receipt.
  writeFileSync(path.join(ctx.fx.ahead, "docs/workflow/TIER_COST.md"), `${LEDGER_HEADER}| 1 | 10 |\n`);
  const r = ctx.runEngine(ctx.fx.ahead);
  assert.equal(r.stdout, "TURN-CONTRACT fail box5: ahead-of-remote\n");
  assert.equal(r.code, 1);
});
