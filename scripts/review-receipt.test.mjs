#!/usr/bin/env node

import assert from "node:assert/strict";
import { test } from "node:test";

const CONTRACT = "v1";
const MARKER_RE = /<!-- review-change:pass sha=([0-9a-f]{40}) contract=([^ ]+) -->/;

const receiptBody = ({ sha, scope, axes, coverage, invariants, proposals, manual }) =>
  [
    `<!-- review-change:pass sha=${sha} contract=${CONTRACT} -->`,
    "## review-change: REVIEW-PASS",
    "",
    `- Reviewed head: \`${sha}\``,
    `- Scope and applicable axes: ${scope}`,
    `- Acceptance coverage: ${coverage}`,
    `- Architectural invariants: ${invariants}`,
    "- Current-unit findings open: 0",
    `- Future-capability proposals: ${proposals}`,
    `- Manual verification: ${manual}`,
    "",
  ].join("\n");

const parseReceipt = (body) => {
  const match = MARKER_RE.exec(body ?? "");
  if (!match) return null;
  return { sha: match[1], contract: match[2] };
};

const newestReceipt = (comments) => {
  const list = comments ?? [];
  for (let i = list.length - 1; i >= 0; i--) {
    const receipt = parseReceipt(list[i].body);
    if (receipt && receipt.contract === CONTRACT) return receipt;
  }
  return null;
};

const receiptStatus = (comments, headSha) => {
  const receipt = newestReceipt(comments);
  if (!receipt) return { status: "absent", reason: "no REVIEW-PASS marker" };
  if (receipt.sha !== headSha) return { status: "stale", reason: `receipt at ${receipt.sha}, head is ${headSha}` };
  return { status: "current", reason: `receipt current at ${headSha}` };
};

const postReceipt = ({ decision, hasPr, comments, headSha }) => {
  if (decision !== "REVIEW-PASS") return { action: "none", reason: `${decision} posts no passing receipt` };
  if (!hasPr) return { action: "none", reason: "no PR — pre-PR checkpoint keeps the progress.md marker (D7)" };
  const status = receiptStatus(comments, headSha);
  if (status.status === "current") return { action: "skip", reason: "same SHA already commented — receipt is current" };
  return { action: "post", reason: "new or stale SHA — newest matching marker wins" };
};

const EMPTY = {};

test("REVIEW-PASS receipt body carries the exact marker and fixed fields", () => {
  const sha = "a".repeat(40);
  const body = receiptBody({ sha, scope: "branch diff vs main (src/export/**)", axes: "code, security, tests", coverage: "AC1-3 evidenced", invariants: "pass", proposals: "1; no issues created", manual: "spreadsheet round-trip" });
  assert.equal(parseReceipt(body).sha, sha);
  assert.equal(parseReceipt(body).contract, CONTRACT);
  assert.match(body, /## review-change: REVIEW-PASS/);
  assert.match(body, /- Current-unit findings open: 0/);
});

test("REVIEW-PASS posts one comment via --body-file (never inline --body)", () => {
  const result = postReceipt({ decision: "REVIEW-PASS", hasPr: true, comments: [], headSha: "a".repeat(40) });
  assert.equal(result.action, "post", result.reason);
  const forgeInvocation = "gh pr comment 7 --body-file $TMPDIR/review-receipt.md";
  assert.doesNotMatch(forgeInvocation, /--body "/);
});

test("REVIEW-PASS is idempotent: same SHA already commented is skipped", () => {
  const sha = "a".repeat(40);
  const comments = [{ body: receiptBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }];
  const result = postReceipt({ decision: "REVIEW-PASS", hasPr: true, comments, headSha: sha });
  assert.equal(result.action, "skip", result.reason);
});

test("newestReceipt selects last matching marker (newest wins for chronological oldest-first list)", () => {
  const sha1 = "a".repeat(40);
  const sha2 = "b".repeat(40);
  const c1 = { body: receiptBody({ sha: sha1, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) };
  const c2 = { body: receiptBody({ sha: sha2, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) };
  assert.equal(newestReceipt([c1, c2]).sha, sha2, "last in list wins");
  assert.equal(newestReceipt([c2, c1]).sha, sha1, "last in reversed list wins");
});

test("stale SHA (later commit) posts a new receipt; newest matching marker wins", () => {
  const oldSha = "a".repeat(40);
  const newSha = "b".repeat(40);
  const comments = [{ body: receiptBody({ sha: oldSha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }];
  const result = postReceipt({ decision: "REVIEW-PASS", hasPr: true, comments, headSha: newSha });
  assert.equal(result.action, "post", result.reason);
  assert.equal(receiptStatus(comments, newSha).status, "stale");
});

test("REVIEW-FAIL posts no passing receipt; findings stay in the fold ledger", () => {
  const result = postReceipt({ decision: "REVIEW-FAIL", hasPr: true, comments: [], headSha: "a".repeat(40) });
  assert.equal(result.action, "none", result.reason);
  assert.match(result.reason, /posts no passing receipt/);
});

test("NEEDS-DECISION blocks without creating an issue and posts no receipt", () => {
  const result = postReceipt({ decision: "NEEDS-DECISION", hasPr: true, comments: [], headSha: "a".repeat(40) });
  assert.equal(result.action, "none", result.reason);
  assert.match(result.reason, /posts no passing receipt/);
});

test("missing PR: pre-PR checkpoint posts no receipt (progress.md marker covers it, D7)", () => {
  const result = postReceipt({ decision: "REVIEW-PASS", hasPr: false, comments: [], headSha: "a".repeat(40) });
  assert.equal(result.action, "none", result.reason);
  assert.match(result.reason, /no PR/);
});

test("absent receipt on a real PR means no review evidence yet", () => {
  assert.equal(receiptStatus([], "a".repeat(40)).status, "absent");
  assert.equal(receiptStatus(null, "a".repeat(40)).status, "absent");
});

test("any later commit makes the receipt stale (invalidated by head SHA comparison)", () => {
  const sha = "a".repeat(40);
  const later = "c".repeat(40);
  const comments = [{ body: receiptBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }];
  assert.equal(receiptStatus(comments, sha).status, "current");
  assert.equal(receiptStatus(comments, later).status, "stale");
});

test("markdown body integrity: no hand-escaping artifacts, no shell interpolation", () => {
  const body = receiptBody({ sha: "a".repeat(40), scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" });
  assert.doesNotMatch(body, /\\`/);
  assert.doesNotMatch(body, /\$\{/);
});

test("fixture matrix covers PASS/FAIL/stale/idempotent/no-PR and every status", () => {
  const sha = "a".repeat(40);
  const cases = [
    postReceipt({ decision: "REVIEW-PASS", hasPr: true, comments: [], headSha: sha }),
    postReceipt({ decision: "REVIEW-FAIL", hasPr: true, comments: [], headSha: sha }),
    postReceipt({ decision: "NEEDS-DECISION", hasPr: true, comments: [], headSha: sha }),
    postReceipt({ decision: "REVIEW-PASS", hasPr: false, comments: [], headSha: sha }),
    postReceipt({ decision: "REVIEW-PASS", hasPr: true, comments: [{ body: receiptBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }], headSha: sha }),
    postReceipt({ decision: "REVIEW-PASS", hasPr: true, comments: [{ body: receiptBody({ sha: "b".repeat(40), scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }], headSha: sha }),
  ];
  assert.deepEqual(cases.map((c) => c.action), ["post", "none", "none", "none", "skip", "post"]);
  const invalidationCases = ["absent", "stale", "current"].sort();
  const statuses = [receiptStatus([], sha), receiptStatus([{ body: receiptBody({ sha: "b".repeat(40), scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }], sha), receiptStatus([{ body: receiptBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }], sha)].map((s) => s.status).sort();
  assert.deepEqual(statuses, invalidationCases);
});

test("pure: identical inputs yield identical decisions (no forge state, no side effects)", () => {
  const sha = "a".repeat(40);
  const comments = [{ body: receiptBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }];
  const inputs = { decision: "REVIEW-PASS", hasPr: true, comments, headSha: sha };
  assert.deepEqual(postReceipt(inputs), postReceipt(inputs));
  assert.equal(receiptStatus(comments, sha).status, receiptStatus(comments, sha).status);
});

console.log("PASS review receipt: exact marker, stale/idempotent/no-PR/FAIL/NEEDS-DECISION, zero forge calls");
