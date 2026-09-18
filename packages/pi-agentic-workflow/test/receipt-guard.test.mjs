// receipt-guard.test.mjs — issue #182: the inline-receipt block and the
// settled-turn dirty-worktree notice.
//
// `review-change` and `audit-pr` used to post their SHA-bound receipts by
// hand-assembling an inline `gh pr comment --body "…"`. Nothing proved the
// marker landed, so a review could print REVIEW-PASS while the PR had no
// current receipt. The scripts (`scripts/review-receipt.mjs`,
// `scripts/audit-pr-gate.mjs`) now own that mechanically; this guard makes the
// inline path impossible. The predicates are Pi-free so the shipped adapter
// (`dist/extension/index.js`) binds exactly the code tested here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { GIT_STATUS_TIMEOUT_MS, dirtyWorktreeWarning, readGitStatusBounded, receiptGuard } from "../dist/extension/receipt-guard.js";

// --- tool_call guard ------------------------------------------------------

test("#182: an inline `gh pr comment` review receipt is blocked", () => {
  const decision = receiptGuard({
    toolName: "bash",
    command: 'gh pr comment 182 --body "<!-- review-change:pass sha=0123456789abcdef0123456789abcdef01234567 contract=v1 -->"',
  });
  assert.equal(decision.block, true);
  assert.equal(typeof decision.reason, "string");
});

test("#182: an inline `gh pr comment` merge-ready marker is blocked", () => {
  const decision = receiptGuard({
    toolName: "bash",
    command: 'gh pr comment 182 --body "<!-- audit-pr:merge-ready sha=0123456789abcdef0123456789abcdef01234567 -->"',
  });
  assert.equal(decision.block, true);
  assert.match(decision.reason, /audit-pr-gate\.mjs comment/);
});

test("#182: a `--body-file` receipt invocation is allowed", () => {
  assert.deepEqual(
    receiptGuard({
      toolName: "bash",
      command: 'gh pr comment 182 --body-file /tmp/receipt.md',
    }),
    { block: false },
  );
});

test("#182: a `gh pr comment` with an unrelated body is allowed", () => {
  assert.deepEqual(
    receiptGuard({ toolName: "bash", command: 'gh pr comment 182 --body "thanks, addressed in the latest push"' }),
    { block: false },
  );
});

test("#182: a non-bash tool is always allowed", () => {
  // The same text through `write`/`edit` is a legitimate doc edit, never a
  // receipt post.
  assert.deepEqual(
    receiptGuard({ toolName: "write", command: "gh pr comment 182 --body review-change:pass" }),
    { block: false },
  );
  assert.deepEqual(receiptGuard({ toolName: "read", command: undefined }), { block: false });
});

test("#182: a command mentioning the marker but not `gh pr comment` is allowed", () => {
  assert.deepEqual(receiptGuard({ toolName: "bash", command: 'rg "review-change:pass" skills/' }), { block: false });
  assert.deepEqual(receiptGuard({ toolName: "bash", command: 'node scripts/review-receipt.mjs emit --pr 182 --head 0123456789abcdef0123456789abcdef01234567 --scope x --axes y --coverage z' }), { block: false });
});

test("#182: the block reason names the script that proves the receipt landed", () => {
  const review = receiptGuard({ toolName: "bash", command: 'gh pr comment 1 --body "review-change:pass"' });
  assert.equal(review.block, true);
  assert.ok(review.reason.includes("bun scripts/review-receipt.mjs emit"), `reason must name the replacement: ${review.reason}`);
  assert.match(review.reason, /unverifiable/);

  const audit = receiptGuard({ toolName: "bash", command: 'gh pr comment 1 --body "audit-pr:merge-ready"' });
  assert.equal(audit.block, true);
  assert.ok(audit.reason.includes("bun scripts/audit-pr-gate.mjs comment"), `reason must name the replacement: ${audit.reason}`);
  assert.match(audit.reason, /unverifiable/);
});

// --- agent_settled dirty-worktree notice ----------------------------------

test("#182: a clean worktree stays silent", () => {
  assert.equal(dirtyWorktreeWarning(""), undefined);
  assert.equal(dirtyWorktreeWarning("  \n\n"), undefined);
});

test("#182: a dirty worktree warns naming what is uncommitted", () => {
  const warning = dirtyWorktreeWarning(" M packages/pi-agentic-workflow/src/extension/index.ts\n?? scripts/review-receipt.mjs\n");
  assert.equal(typeof warning, "string");
  assert.match(warning, /2/);
  assert.match(warning, /index\.ts/);
  assert.match(warning, /review-receipt\.mjs/);
});

test("#182: a long dirty list is previewed and summarised", () => {
  const porcelain = Array.from({ length: 9 }, (_, i) => ` M file-${i}.ts`).join("\n");
  const warning = dirtyWorktreeWarning(porcelain);
  assert.match(warning, /9/);
  assert.match(warning, /\+4 more/);
  assert.ok(!warning.includes("file-8.ts"), `the tail is summarised, not dumped: ${warning}`);
});

// --- settled-turn git probe -----------------------------------------------

/** Run `fn` with a fake `git` first on PATH, then restore PATH and clean up. */
const withFakeGit = (body, fn) => {
  const dir = mkdtempSync(join(tmpdir(), "receipt-guard-probe-"));
  const bin = join(dir, "bin");
  mkdirSync(bin);
  const fake = join(bin, "git");
  writeFileSync(fake, `#!/usr/bin/env node\n${body}\n`);
  chmodSync(fake, 0o755);
  const previous = process.env.PATH;
  process.env.PATH = `${bin}:${previous}`;
  try {
    return fn(dir);
  } finally {
    process.env.PATH = previous;
    rmSync(dir, { recursive: true, force: true });
  }
};

test("#182: the settled-turn git probe has a 2000 ms timeout", () => {
  assert.equal(GIT_STATUS_TIMEOUT_MS, 2000);
});

test("#182: a hung git reads as a clean worktree without parking the turn", () => {
  withFakeGit("setTimeout(() => process.exit(0), 10000);", (cwd) => {
    const started = Date.now();
    const out = readGitStatusBounded(cwd);
    const elapsed = Date.now() - started;
    assert.equal(out, "", "a timeout is best-effort clean, never a thrown turn failure");
    assert.ok(elapsed < 5000, `the probe must time out well before the hang: ${elapsed}ms`);
  });
});

test("#182: the probe returns porcelain on success and clean on any failure", () => {
  withFakeGit('process.stdout.write(" M file.ts\\n");', (cwd) => {
    assert.equal(readGitStatusBounded(cwd), " M file.ts\n");
  });
  withFakeGit("process.exit(1);", (cwd) => {
    assert.equal(readGitStatusBounded(cwd), "");
  });
});
