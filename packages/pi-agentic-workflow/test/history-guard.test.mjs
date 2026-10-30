// history-guard.test.mjs — published history is owner-written, decided by git
// itself (`git push --dry-run`), not by enumerating spellings.
//
// A session rebased a pushed PR branch and force-pushed it to resolve a merge
// conflict: the conflict was resolved, but commits a reviewer may already have
// were rewritten. The rule lives in AGENTS.md → Working rules and, because
// prose is not enforcement, in this predicate beside the merge guard. The
// block sits on `git push` — a local rebase rewrites nothing anyone else can
// see — and the outcome comes from git's own dry-run, which is why the test
// matrix is outcomes (forced / deleted / main / clean / unknown) rather than
// flag spellings. The runner is injected, so no test touches the network.

import { test } from "node:test";
import assert from "node:assert/strict";

import { historyGuard, pushArgs, readPushOutcome } from "../dist/extension/history-guard.js";

const bash = (command) => ({ toolName: "bash", command });

/** A runner that always reports the given outcome. */
const runnerFor = (outcome, stdout = "") => () => ({ status: outcome === "unknown" ? 1 : 0, stdout: stdout || dryRunFor(outcome), stderr: "" });

function dryRunFor(outcome) {
  switch (outcome) {
    case "forced":
      return "To github.com:gtrabanco/agentic-workflow.git\n + 5e0e8ab...abc1234 feat/x -> feat/x (forced update)\n";
    case "deleted":
      return "To github.com:gtrabanco/agentic-workflow.git\n - [deleted]         feat/x -> feat/x\n";
    case "main":
      return "To github.com:gtrabanco/agentic-workflow.git\n   abc1234..def5678  main -> main\n";
    case "clean":
      return "To github.com:gtrabanco/agentic-workflow.git\n   abc1234..def5678  feat/x -> feat/x\n";
    default:
      return "";
  }
}

// --- outcome matrix --------------------------------------------------------

test("a push git would force-update is declined, whatever the flag spelling", () => {
  for (const command of ["git push --force origin feat/x", "git push origin +feat/x", "git push --force-with-lease origin feat/x"]) {
    // Same dry-run answer for all of them: git resolves flags and refspecs, so
    // the spelling is irrelevant to the decision.
    const decision = historyGuard(bash(command), true, { runner: runnerFor("forced") });
    assert.equal(decision.block, true, command);
    assert.match(decision.reason, /forced update/u);
    assert.match(decision.reason, /AW_ALLOW=force/u);
  }
});

test("a push git would delete a ref through is declined", () => {
  const decision = historyGuard(bash("git push origin :feat/x"), true, { runner: runnerFor("deleted") });
  assert.equal(decision.block, true);
  assert.match(decision.reason, /ref delete/u);
});

test("a push whose destination is main is declined even with AW_ALLOW=force", () => {
  for (const command of ["git push origin main", "AW_ALLOW=force git push origin main", "AW_ALLOW=force git push --force origin main"]) {
    const decision = historyGuard(bash(command), true, { runner: runnerFor("main") });
    assert.equal(decision.block, true, command);
    assert.match(decision.reason, /destination is `main`/u);
  }
});

test("a clean push passes", () => {
  for (const command of ["git push", "git push -u origin feat/history-guard", "git push origin HEAD:refs/heads/feat/x"]) {
    assert.equal(historyGuard(bash(command), true, { runner: runnerFor("clean") }).block, false, command);
  }
});

test("an up-to-date push passes even when the command spells --force", () => {
  // Nothing would be rewritten (everything up-to-date), so the outcome allows.
  const runner = () => ({ status: 0, stdout: "Everything up-to-date\n", stderr: "" });
  assert.equal(historyGuard(bash("git push --force origin feat/x"), true, { runner }).block, false);
});

test("an unknown outcome (offline) falls back to the text check on the push's own segment", () => {
  const offline = { runner: runnerFor("unknown") };
  // Offline + clean-looking args: allowed — a real push would fail anyway.
  assert.equal(historyGuard(bash("git push origin feat/x"), true, offline).block, false);
  // Offline + rewrite flags on the push segment: declined.
  for (const command of ["git push --force origin feat/x", "git push --mirror", "git push --delete origin feat/x", "git push origin +feat/x"]) {
    assert.equal(historyGuard(bash(command), true, offline).block, true, command);
  }
  // Offline: a flag belonging to another command is not attributed to the push.
  assert.equal(historyGuard(bash("docker build -f Dockerfile . && git push origin feat/x"), true, offline).block, false);
});

test("the fallback never attributes a main flag from another segment", () => {
  assert.equal(historyGuard(bash("git checkout main && git push origin feat/x"), true, { runner: runnerFor("unknown") }).block, false);
});

test("`gh api` forcing a ref update is declined — the dry-run never sees it", () => {
  const decision = historyGuard(
    bash("gh api -X PATCH repos/gtrabanco/agentic-workflow/git/refs/heads/feat/x -f force=true -f sha=abc123"),
    true,
    { runner: runnerFor("clean") },
  );
  assert.equal(decision.block, true);
});

test("reading a ref through `gh api` passes", () => {
  assert.equal(
    historyGuard(bash("gh api repos/gtrabanco/agentic-workflow/git/refs/heads/main"), true, { runner: runnerFor("clean") }).block,
    false,
  );
});

// --- the explicit token ----------------------------------------------------

test("AW_ALLOW=force enables the forced push it was granted for", () => {
  assert.equal(historyGuard(bash("AW_ALLOW=force git push --force origin feat/x"), true, { runner: runnerFor("forced") }).block, false);
  assert.equal(historyGuard(bash("env AW_ALLOW=force git push --force origin feat/x"), true, { runner: runnerFor("forced") }).block, false);
});

test("the token anywhere else authorizes nothing", () => {
  for (const command of [
    "echo AW_ALLOW=force && git push --force origin feat/x",
    "rg AW_ALLOW=force skills/ && git push --force origin feat/x",
    "export AW_ALLOW=force && git push --force origin feat/x",
  ]) {
    assert.equal(historyGuard(bash(command), true, { runner: runnerFor("forced") }).block, true, command);
  }
});

test("the token does not enable a push to main", () => {
  assert.equal(historyGuard(bash("AW_ALLOW=force git push origin main"), true, { runner: runnerFor("main") }).block, true);
});

// --- config gate and non-bash tools ---------------------------------------

test("the guard is a no-op while disabled", () => {
  for (const command of ["git push --force origin feat/x", "git push origin main"]) {
    assert.equal(historyGuard(bash(command), false, { runner: runnerFor("forced") }).block, false, command);
  }
});

test("a non-bash tool passes — the guard reads commands only", () => {
  assert.equal(historyGuard({ toolName: "write", command: "git push --force" }, true, { runner: runnerFor("forced") }).block, false);
});

// --- pure helpers ----------------------------------------------------------

test("pushArgs tokenizes the push's own arguments, quotes stripped", () => {
  assert.deepEqual(pushArgs("git push origin 'feat/x'"), ["origin", "feat/x"]);
  assert.deepEqual(pushArgs("git -C /tmp/repo push -u origin feat/x"), ["-u", "origin", "feat/x"]);
  assert.deepEqual(pushArgs("git push"), []);
});

test("readPushOutcome parses git's dry-run output", () => {
  assert.equal(readPushOutcome({ status: 1, stdout: "", stderr: "Could not resolve host" }), "unknown");
  assert.equal(readPushOutcome({ status: 0, stdout: "Everything up-to-date\n", stderr: "" }), "clean");
  assert.equal(readPushOutcome({ status: 0, stdout: dryRunFor("main"), stderr: "" }), "main");
  assert.equal(readPushOutcome({ status: 0, stdout: " * [new branch]      feat/x -> refs/heads/main\n", stderr: "" }), "main");
  assert.equal(readPushOutcome({ status: 0, stdout: " * [new branch]      feat/x -> feat/main\n", stderr: "" }), "clean");
});
