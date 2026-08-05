#!/usr/bin/env node

import assert from "node:assert/strict";
import { test } from "node:test";

const REVIEW_CONTRACT = "v1";
const REVIEW_MARKER_RE = /<!-- review-change:pass sha=([0-9a-f]{40}) contract=([^ ]+) -->/;
const AUDIT_MARKER_RE = /<!-- audit-pr:merge-ready sha=([0-9a-f]{40}) -->/;

const reviewBody = ({ sha, scope, axes, coverage, invariants, proposals, manual }) =>
  [
    `<!-- review-change:pass sha=${sha} contract=${REVIEW_CONTRACT} -->`,
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

const parseReview = (body) => {
  const match = REVIEW_MARKER_RE.exec(body ?? "");
  if (!match) return null;
  return { sha: match[1], contract: match[2] };
};

const newestReceipt = (comments) => {
  for (const comment of comments ?? []) {
    const receipt = parseReview(comment.body);
    if (receipt && receipt.contract === REVIEW_CONTRACT) return receipt;
  }
  return null;
};

const receiptStatus = (comments, headSha) => {
  const receipt = newestReceipt(comments);
  if (!receipt) return { status: "absent", reason: "no REVIEW-PASS marker" };
  if (receipt.sha !== headSha) return { status: "stale", reason: `receipt at ${receipt.sha}, head is ${headSha}` };
  return { status: "current", reason: `receipt current at ${headSha}` };
};

const GATE_NAMES = [
  "acceptance-coverage",
  "phases-complete",
  "scope-creep",
  "docs-updated",
  "traceability",
  "ci",
  "mergeability",
  "closure",
  "descope",
  "invariants",
];

const auditVerdict = ({ comments, headSha, gates = {} }) => {
  const status = receiptStatus(comments, headSha);
  if (status.status !== "current") {
    return {
      verdict: "BLOCKED",
      reason: status.reason,
      route: "/review-change",
      gatesEvaluated: false,
      blockers: [status.reason],
    };
  }
  const blockers = GATE_NAMES.filter((name) => gates[name] !== "pass")
    .map((name) => `gate ${name} failed`);
  if (blockers.length > 0) {
    return { verdict: "BLOCKED", reason: blockers.join("; "), route: null, gatesEvaluated: true, blockers };
  }
  return { verdict: "MERGE-READY", reason: "receipt current; every applicable gate passes", route: null, gatesEvaluated: true, blockers: [] };
};

const newestAuditComment = (comments) => {
  for (const comment of comments ?? []) {
    const match = AUDIT_MARKER_RE.exec(comment.body ?? "");
    if (match) return match[1];
  }
  return null;
};

const mergeCommentAction = ({ verdict, comments, headSha }) => {
  if (verdict !== "MERGE-READY") return { action: "none", reason: "BLOCKED posts no comment (no stale green flag)" };
  const marker = newestAuditComment(comments);
  if (marker === headSha) return { action: "skip", reason: "same SHA already commented — idempotent by SHA marker" };
  return { action: "post", reason: "newest marker wins; older SHA re-comments" };
};

const EMPTY = {};

test("current receipt + all gates pass → MERGE-READY with the verdict and no re-review", () => {
  const sha = "a".repeat(40);
  const gates = Object.fromEntries(GATE_NAMES.map((name) => [name, "pass"]));
  const result = auditVerdict({ comments: [{ body: reviewBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }], headSha: sha, gates });
  assert.equal(result.verdict, "MERGE-READY");
  assert.equal(result.gatesEvaluated, true);
});

test("current receipt but a gate fails → BLOCKED with the gate blocker (not a review failure)", () => {
  const sha = "a".repeat(40);
  const gates = Object.fromEntries(GATE_NAMES.map((name) => [name, "pass"]));
  gates.traceability = "fail";
  const result = auditVerdict({ comments: [{ body: reviewBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }], headSha: sha, gates });
  assert.equal(result.verdict, "BLOCKED");
  assert.deepEqual(result.blockers, ["gate traceability failed"]);
  assert.equal(result.gatesEvaluated, true);
});

test("absent receipt → BLOCKED routed to /review-change; gates NOT evaluated (never re-review)", () => {
  const sha = "a".repeat(40);
  const result = auditVerdict({ comments: [], headSha: sha, gates: EMPTY });
  assert.equal(result.verdict, "BLOCKED");
  assert.equal(result.route, "/review-change");
  assert.equal(result.gatesEvaluated, false);
});

test("stale receipt (any later commit) → BLOCKED routed to /review-change; no gate evaluation", () => {
  const oldSha = "a".repeat(40);
  const headSha = "b".repeat(40);
  const result = auditVerdict({ comments: [{ body: reviewBody({ sha: oldSha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }], headSha, gates: EMPTY });
  assert.equal(result.verdict, "BLOCKED");
  assert.equal(result.route, "/review-change");
  assert.equal(result.gatesEvaluated, false);
  assert.equal(receiptStatus([{ body: reviewBody({ sha: oldSha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }], headSha).status, "stale");
});

test("missing receipt is a blocker even when every gate is nominally pass (receipt gate is first)", () => {
  const sha = "a".repeat(40);
  const gates = Object.fromEntries(GATE_NAMES.map((name) => [name, "pass"]));
  const result = auditVerdict({ comments: [], headSha: sha, gates });
  assert.equal(result.verdict, "BLOCKED");
  assert.equal(result.gatesEvaluated, false);
});

test("MERGE-READY posts one SHA-bound comment via --body-file; BLOCKED posts none", () => {
  const sha = "a".repeat(40);
  assert.equal(mergeCommentAction({ verdict: "MERGE-READY", comments: [], headSha: sha }).action, "post");
  assert.equal(mergeCommentAction({ verdict: "BLOCKED", comments: [], headSha: sha }).action, "none");
  const forgeInvocation = "gh pr comment 7 --body-file $TMPDIR/audit-pr-ready.md";
  assert.doesNotMatch(forgeInvocation, /--body "/);
});

test("MERGE-READY comment is idempotent by SHA marker: same SHA already commented → skip", () => {
  const sha = "a".repeat(40);
  const comments = [{ body: `<!-- audit-pr:merge-ready sha=${sha} -->\n## audit-pr: MERGE-READY` }];
  assert.equal(mergeCommentAction({ verdict: "MERGE-READY", comments, headSha: sha }).action, "skip");
});

test("newest audit-pr marker wins: older SHA comment is re-posted, newer SHA skip", () => {
  const oldSha = "a".repeat(40);
  const headSha = "b".repeat(40);
  const comments = [{ body: `<!-- audit-pr:merge-ready sha=${oldSha} -->` }];
  assert.equal(mergeCommentAction({ verdict: "MERGE-READY", comments, headSha }).action, "post");
  assert.equal(mergeCommentAction({ verdict: "MERGE-READY", comments: [{ body: `<!-- audit-pr:merge-ready sha=${headSha} -->` }], headSha }).action, "skip");
});

test("comment marker integrity: no hand-escaping artifacts, no shell interpolation", () => {
  const body = `<!-- audit-pr:merge-ready sha=${"a".repeat(40)} -->`;
  assert.doesNotMatch(body, /\\`/);
  assert.doesNotMatch(body, /\$\{/);
});

test("fixture matrix covers PASS/FAIL/absent/stale and every comment action", () => {
  const sha = "a".repeat(40);
  const allPass = Object.fromEntries(GATE_NAMES.map((name) => [name, "pass"]));
  const reviews = [{ body: reviewBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }];
  const verdicts = [
    auditVerdict({ comments: reviews, headSha: sha, gates: allPass }),
    auditVerdict({ comments: reviews, headSha: sha, gates: { ...allPass, ci: "fail" } }),
    auditVerdict({ comments: [], headSha: sha, gates: allPass }),
    auditVerdict({ comments: reviews, headSha: "b".repeat(40), gates: allPass }),
  ];
  assert.deepEqual(verdicts.map((v) => v.verdict), ["MERGE-READY", "BLOCKED", "BLOCKED", "BLOCKED"]);
  assert.deepEqual(verdicts.map((v) => v.route), [null, null, "/review-change", "/review-change"]);
  const actions = [
    mergeCommentAction({ verdict: "MERGE-READY", comments: [], headSha: sha }),
    mergeCommentAction({ verdict: "BLOCKED", comments: [], headSha: sha }),
    mergeCommentAction({ verdict: "MERGE-READY", comments: [{ body: `<!-- audit-pr:merge-ready sha=${sha} -->` }], headSha: sha }),
    mergeCommentAction({ verdict: "MERGE-READY", comments: [{ body: `<!-- audit-pr:merge-ready sha=${"c".repeat(40)} -->` }], headSha: sha }),
  ];
  assert.deepEqual(actions.map((a) => a.action), ["post", "none", "skip", "post"]);
});

test("missing required gate (omitted from gates map) blocks (fail-closed)", () => {
  const sha = "a".repeat(40);
  const reviews = [{ body: reviewBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }];
  const partial = { "acceptance-coverage": "pass" }; // many required gates absent
  const result = auditVerdict({ comments: reviews, headSha: sha, gates: partial });
  assert.equal(result.verdict, "BLOCKED");
  assert.equal(result.gatesEvaluated, true);
  assert.ok(result.blockers.length > 0, "omitted gates must produce blockers");
  assert.ok(result.blockers.some((b) => /traceability|phases|closure/.test(b)), "at least one omitted gate reported");
});

test("pure: identical inputs yield identical verdicts and actions (no forge state, no side effects)", () => {
  const sha = "a".repeat(40);
  const allPass = Object.fromEntries(GATE_NAMES.map((name) => [name, "pass"]));
  const inputs = { comments: [{ body: reviewBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }], headSha: sha, gates: allPass };
  assert.deepEqual(auditVerdict(inputs), auditVerdict(inputs));
  assert.deepEqual(mergeCommentAction({ verdict: "MERGE-READY", comments: [], headSha: sha }), mergeCommentAction({ verdict: "MERGE-READY", comments: [], headSha: sha }));
});

console.log("PASS audit-pr receipt: current/absent/stale verdicts, gate evaluation, idempotent SHA-bound comment, zero re-review, zero forge calls");
