// merge-guard.test.mjs — issue #278: owner-only merges at the `tool_call` gate.
//
// An agent session merged PR #273 after an owner message that waived only the
// *review*, not the merge. Prose already said "audit-pr never merges" and
// prose failed once, so the block is mechanical: `mergeGuard` is the Pi-free
// predicate `index.ts` binds to `tool_call`, ahead of the issue-#182 receipt
// guard. The block/allow matrix below is the contract — especially the
// read-only forms (`git merge-tree`, `git merge-base`) the #275 post-merge
// reconciliation depends on: they must never be caught by this guard.

import { test } from "node:test";
import assert from "node:assert/strict";

import { mergeGuard } from "../dist/extension/merge-guard.js";

const bash = (command) => ({ toolName: "bash", command });

// --- block matrix ----------------------------------------------------------

test("#278: `gh pr merge` is blocked", () => {
  const decision = mergeGuard(bash("gh pr merge 273 --merge"));
  assert.equal(decision.block, true);
  assert.match(decision.reason, /issue #278/);
  assert.match(decision.reason, /owner/i);
});

test("#278: `gh pr merge` chained after another command is blocked", () => {
  assert.equal(mergeGuard(bash("git fetch -q origin && gh pr merge 273 --merge")).block, true);
});

test("#278: the REST merge endpoint under `gh api` is blocked", () => {
  assert.equal(
    mergeGuard(bash("gh api -X PUT repos/gtrabanco/agentic-workflow/pulls/273/merge")).block,
    true,
  );
});

test("#278: the GraphQL `mergePullRequest` mutation under `gh api` is blocked", () => {
  assert.equal(
    mergeGuard(bash("gh api graphql -f query='mutation { mergePullRequest(input: {}) { clientMutationId } }'")).block,
    true,
  );
});

test("#278: `git merge <branch>` is blocked", () => {
  assert.equal(mergeGuard(bash("git merge origin/main")).block, true);
  assert.match(mergeGuard(bash("git merge origin/main")).reason, /issue #278/);
});

test("#278: `git merge` with flags is blocked", () => {
  assert.equal(mergeGuard(bash("git merge --no-ff feature/x")).block, true);
});

test("#278: `git -C <path> merge` is blocked", () => {
  assert.equal(mergeGuard(bash("git -C /tmp/repo merge main")).block, true);
});

test("#278: a bare `git merge` is blocked", () => {
  assert.equal(mergeGuard(bash("git merge")).block, true);
});

test("#278 (documented edge): a bash search for the literal `gh pr merge` is blocked like an invocation", () => {
  // Deterministic over clever, same trade the receipt guard takes. The reason
  // tells the agent to search `pr merge` instead (asserted below).
  const decision = mergeGuard(bash('rg "gh pr merge" docs/'));
  assert.equal(decision.block, true);
  assert.match(decision.reason, /search `pr merge`/);
});

// --- allow matrix ----------------------------------------------------------

test("#278: `git merge-tree` stays allowed (the #275 reconciliation uses it)", () => {
  assert.equal(mergeGuard(bash("git merge-tree --write-tree origin/main 270-review-conformance")).block, false);
});

test("#278: `git merge-base` stays allowed", () => {
  assert.equal(mergeGuard(bash("git merge-base origin/main fix/272-phase-lint-unit-doc-grammar")).block, false);
});

test("#278: rebases and the owner's preferred integration stay allowed", () => {
  assert.equal(mergeGuard(bash("git pull --rebase")).block, false);
  assert.equal(mergeGuard(bash("git rebase origin/main")).block, false);
});

test("#278: PR reads stay allowed (receipts remain the receipt guard's domain)", () => {
  assert.equal(mergeGuard(bash("gh pr view 273 --json url -q .url")).block, false);
  assert.equal(mergeGuard(bash("gh pr checks 273")).block, false);
  assert.equal(mergeGuard(bash("gh pr comment 273 --body-file receipt.md")).block, false);
});

test("#278: a text search for `pr merge` (no `gh ` prefix) stays allowed", () => {
  assert.equal(mergeGuard(bash('rg "pr merge" skills/')).block, false);
});

test("#278: prose that merely says merge in a plain command stays allowed", () => {
  assert.equal(mergeGuard(bash("grep -rn merge docs/")).block, false);
  assert.equal(mergeGuard(bash("git status && git log --oneline -3")).block, false);
});

test("#278: non-bash tools pass untouched", () => {
  assert.equal(mergeGuard({ toolName: "write", command: "git merge main" }).block, false);
  assert.equal(mergeGuard({ toolName: "read", command: undefined }).block, false);
  assert.equal(mergeGuard({ toolName: "bash", command: undefined }).block, false);
});
