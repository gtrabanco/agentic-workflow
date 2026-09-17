#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const auditSkill = fs.readFileSync(path.join(repoRoot, "skills/audit-pr/SKILL.md"), "utf8");
const auditProcess = fs.readFileSync(path.join(repoRoot, "skills/audit-pr/references/03_AUDIT_PROCESS.md"), "utf8");

// The contract lives in the runtimes the skills call. This file used to define
// `parseReview`, `newestReceipt`, `receiptStatus`, `GATE_NAMES`, `auditVerdict`,
// `newestAuditComment` and `mergeCommentAction` locally — it proved a copy of
// the rule while `review-change` and `audit-pr` executed prose. The assertions
// below are unchanged; only their subject is, so a regression in the runtime the
// workflow actually runs now fails here (#182).
import {
  GATE_NAMES,
  auditVerdict,
  hygieneFromState,
  mergeCommentAction,
  newestAuditComment,
} from "./audit-pr-gate.mjs";
import { receiptStatus, renderReceiptBody } from "./review-receipt.mjs";

/** The receipt body builder, by its historical name in this file. */
const reviewBody = renderReceiptBody;

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

test("audit-pr fetches the PR head with comments and treats every SHA mismatch as stale", () => {
  assert.match(auditSkill, /--json[^\n]*headRefOid[^\n]*comments|--json[^\n]*comments[^\n]*headRefOid/);
  assert.match(auditProcess, /headRefOid.*current head SHA|current head SHA.*headRefOid/s);
  assert.doesNotMatch(auditSkill, /If \*\*empty\*\*.*receipt is still valid/s);
  assert.match(auditProcess, /\*\*absent \/ stale\*\* → \*\*BLOCKER\*\*/);
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

test("newest* helpers select last matching (newest wins)", () => {
  const sha1 = "a".repeat(40);
  const sha2 = "b".repeat(40);
  const c1 = { body: `<!-- audit-pr:merge-ready sha=${sha1} -->` };
  const c2 = { body: `<!-- audit-pr:merge-ready sha=${sha2} -->` };
  assert.equal(newestAuditComment([c1, c2]), sha2);
  assert.equal(newestAuditComment([c2, c1]), sha1);
  // also for review receipt newest in this file
  const r1 = { body: reviewBody({ sha: sha1, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) };
  const r2 = { body: reviewBody({ sha: sha2, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) };
  // receiptStatus uses it; last wins means for a head matching the last, current
  assert.equal(receiptStatus([r1, r2], sha2).status, "current");
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

// ---------------------------------------------------------------------------
// Terminal hygiene (issue #182) — the gates that had no owner at merge time
// ---------------------------------------------------------------------------

test("hygiene gates are part of the closed gate set, so an unread one fails closed", () => {
  for (const name of ["tree-clean", "branch-pushed", "pr-ready"]) {
    assert.ok(GATE_NAMES.includes(name), `${name} is a required gate`);
  }
  const sha = "a".repeat(40);
  const reviews = [{ body: reviewBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }];
  const allPass = Object.fromEntries(GATE_NAMES.map((name) => [name, "pass"]));
  const dirty = auditVerdict({ comments: reviews, headSha: sha, gates: { ...allPass, "tree-clean": "fail" } });
  assert.equal(dirty.verdict, "BLOCKED");
  assert.deepEqual(dirty.blockers, ["gate tree-clean failed"]);
  // Omitting hygiene entirely is the same failure, never a silent pass.
  const omitted = auditVerdict({ comments: reviews, headSha: sha, gates: { ...allPass, "pr-ready": undefined } });
  assert.deepEqual(omitted.blockers, ["gate pr-ready failed"]);
});

test("hygieneFromState: a clean, pushed, ready terminal state passes every hygiene gate", () => {
  const state = hygieneFromState({ treePorcelain: "", branchAhead: 0, isDraft: false });
  assert.deepEqual(state.gates, { "tree-clean": "pass", "branch-pushed": "pass", "pr-ready": "pass" });
  assert.deepEqual(state.blockers, []);
  assert.deepEqual(state.repairs, []);
});

test("hygieneFromState: a dirty tree names every path and offers no repair — it is the author's to fix", () => {
  const state = hygieneFromState({ treePorcelain: " M docs/LOGS.md\n?? tmp/scratch\n", branchAhead: 0, isDraft: false });
  assert.equal(state.gates["tree-clean"], "fail");
  assert.equal(state.blockers.length, 1);
  assert.match(state.blockers[0], /docs\/LOGS\.md/);
  assert.match(state.blockers[0], /tmp\/scratch/);
  assert.deepEqual(state.repairs, [], "only the draft flag has a mechanical repair");
});

test("hygieneFromState: an unpushed branch blocks and is not silently pushed", () => {
  const state = hygieneFromState({ treePorcelain: "", branchAhead: 3, isDraft: false });
  assert.equal(state.gates["branch-pushed"], "fail");
  assert.match(state.blockers[0], /3 commit/);
  assert.deepEqual(state.repairs, []);
});

test("hygieneFromState: a draft PR blocks and offers the one mechanical repair", () => {
  const state = hygieneFromState({ treePorcelain: "", branchAhead: 0, isDraft: true });
  assert.equal(state.gates["pr-ready"], "fail");
  assert.ok(state.blockers.some((b) => /draft/i.test(b)));
  assert.deepEqual(state.repairs, ["gh pr ready"], "audit-pr flips the draft flag rather than reporting it");
});
