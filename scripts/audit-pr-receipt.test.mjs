#!/usr/bin/env node
// test-obligation: protects=scripts/review-receipt.mjs,skills/audit-pr/SKILL.md obligations=contract,failure-path

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "audit-pr-gate.mjs");
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHA_A = "a".repeat(40);
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
  GATE_OUTCOMES,
  auditVerdict,
  gateReceiptGate,
  hygieneFromState,
  mergeCommentAction,
  newestAuditComment,
  receiptGateOutcome,
} from "./audit-pr-gate.mjs";
import { receiptStatus, renderReceiptBody } from "./review-receipt.mjs";
import { tempRoot } from "./temp-root.mjs";

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

test("fix/286: a non-affecting head delta keeps a scoped receipt current; an affecting delta still BLOCKS", () => {
  const sha = "a".repeat(40);
  const moved = "b".repeat(40);
  const scope = "c".repeat(64);
  const gates = Object.fromEntries(GATE_NAMES.map((name) => [name, "pass"]));
  const comments = [{ body: reviewBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none", scopeManifest: scope }) }];
  // non-affecting delta (foreign session-log + toolstate commits) -> the receipt
  // stays current and the gates ARE evaluated (#182 AC3/AC9 at the merge gate)
  const ok = auditVerdict({ comments, headSha: moved, gates, changedPaths: ["docs/LOGS.md", ".serena/project.yml"] });
  assert.equal(ok.verdict, "MERGE-READY", JSON.stringify(ok));
  assert.equal(ok.gatesEvaluated, true);
  // one affecting path in the delta -> BLOCKED, routed to re-review (unchanged)
  const voided = auditVerdict({ comments, headSha: moved, gates, changedPaths: ["docs/LOGS.md", "src/feature.ts"] });
  assert.equal(voided.verdict, "BLOCKED");
  assert.equal(voided.route, "/review-change");
  // a legacy receipt (no scope) stays head-bound: any delta voids
  const legacyComments = [{ body: reviewBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }];
  const headBound = auditVerdict({ comments: legacyComments, headSha: moved, gates, changedPaths: ["docs/LOGS.md"] });
  assert.equal(headBound.verdict, "BLOCKED");
  // fail-closed: an unresolvable delta never reads as current
  const unknown = auditVerdict({ comments, headSha: moved, gates, changedPaths: null });
  assert.equal(unknown.verdict, "BLOCKED");
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
  // Since issue #612 the head and the comments arrive in one step from two
  // sanctioned reads: the head from the metadata read, the comments from the
  // guarded read. Both halves are still required — dropping either fails here.
  assert.match(auditSkill, /--json[^\n]*headRefOid/);
  assert.match(auditSkill, /runner forge-read pr <N> --comments/);
  assert.doesNotMatch(auditSkill, /--json[^\n]*headRefOid[^\n]*comments/);
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
  // Omitting hygiene entirely is the same blocker, never a silent pass — and it
  // says what it is (issue #702 S5): the gate was not evaluated, so no content
  // failure is claimed on its behalf.
  const omitted = auditVerdict({ comments: reviews, headSha: sha, gates: { ...allPass, "pr-ready": undefined } });
  assert.deepEqual(omitted.blockers, ["gate pr-ready unevaluatable: not-evaluated"]);
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

test("hygieneFromState: a pending machine-ledger row is exempt from tree-clean (issue #727)", () => {
  // The class `machine-ledger-commit@1` declares commits by machinery (the
  // teardown, the gate prelude) — the merge gate refusing on it is the defect
  // the review's box 5 already stopped carrying: review passes, audit blocks.
  const state = hygieneFromState({ treePorcelain: " M docs/workflow/TIER_COST.md\n M docs/LOGS.md\n", branchAhead: 0, isDraft: false });
  assert.equal(state.gates["tree-clean"], "pass");
  assert.deepEqual(state.blockers, []);
});

test("hygieneFromState: the exemption never hides a foreign dirty file", () => {
  const state = hygieneFromState({ treePorcelain: " M docs/workflow/TIER_COST.md\n M src/app.ts\n", branchAhead: 0, isDraft: false });
  assert.equal(state.gates["tree-clean"], "fail");
  assert.deepEqual(state.blockers, ["uncommitted changes: src/app.ts"]);
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

test("hygieneFromState: an unresolvable upstream blocks the branch-pushed gate (never a zero ahead-count)", () => {
  const state = hygieneFromState({ treePorcelain: "", branchAhead: null, isDraft: false });
  assert.equal(state.gates["branch-pushed"], "fail");
  assert.ok(state.blockers.some((b) => /upstream/i.test(b)), state.blockers.join("; "));
  assert.deepEqual(state.repairs, []);
});

test("hygieneFromState: an unobserved draft flag fails pr-ready closed, never a default pass (F6)", () => {
  const state = hygieneFromState({ treePorcelain: "", branchAhead: 0, isDraft: null });
  assert.equal(state.gates["pr-ready"], "fail");
  assert.ok(state.blockers.some((b) => /draft state was not observed/.test(b)), state.blockers.join("; "));
  assert.deepEqual(state.repairs, [], "an unobserved flag is not repaired by guessing");
  // The explicit reads still behave: false passes, true blocks with the repair.
  assert.equal(hygieneFromState({ isDraft: false }).gates["pr-ready"], "pass");
  assert.deepEqual(hygieneFromState({ isDraft: true }).repairs, ["gh pr ready"]);
});

test("CLI hygiene: without --pr the draft flag is unobserved, so pr-ready fails closed (F6)", () => {
  const { repo } = makeRepo({ withRemote: false });
  const result = spawnSync(process.execPath, [script, "hygiene"], { cwd: repo, encoding: "utf8" });
  assert.equal(result.status, 2, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.gates["pr-ready"], "fail");
  assert.ok(report.blockers.some((b) => /draft state was not observed/.test(b)), report.blockers.join("; "));
});

// ---------------------------------------------------------------------------
// CLI — `hygiene --apply` on a throwaway repo with a fake `gh`
// ---------------------------------------------------------------------------

/** A throwaway git repo whose tree is clean, so only the draft flag blocks. */
const makeRepo = ({ withRemote = true } = {}) => {
  const dir = tempRoot("audit-pr-gate-hygiene-");
  const repo = path.join(dir, "repo");
  fs.mkdirSync(repo);
  const git = (...args) => spawnSync("git", ["-c", "user.name=Tester", "-c", "user.email=t@example.com", "-c", "commit.gpgsign=false", ...args], { cwd: repo, encoding: "utf8" });
  git("init", "-q", "-b", "main");
  fs.writeFileSync(path.join(repo, "README.md"), "fixture\n");
  git("add", "-A");
  git("commit", "-q", "-m", "chore: seed");
  if (withRemote) {
    // A configured upstream is what makes `@{upstream}..HEAD` resolvable; the
    // pushed branch is the truthful `branch-pushed: pass` the other fixtures assert.
    const remote = path.join(dir, "remote.git");
    spawnSync("git", ["init", "-q", "--bare", remote], { encoding: "utf8" });
    git("remote", "add", "origin", remote);
    git("push", "-q", "-u", "origin", "main");
  }
  return { dir, repo };
};

test("CLI hygiene: a branch with no configured upstream fails branch-pushed closed", () => {
  const { repo } = makeRepo({ withRemote: false });
  const result = spawnSync(process.execPath, [script, "hygiene"], { cwd: repo, encoding: "utf8" });
  assert.equal(result.status, 2, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.gates["branch-pushed"], "fail");
  assert.ok(report.blockers.some((b) => /upstream/i.test(b)), report.blockers.join("; "));
  assert.doesNotMatch(report.blockers.join(" "), /0 commit\(s\) ahead/);
});

test("CLI hygiene --apply: the draft PR is repaired exactly once by `gh pr ready`, then re-read clean", () => {
  const { dir, repo } = makeRepo();
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  const log = path.join(dir, "gh.log");
  const state = path.join(dir, "draft-state");
  fs.writeFileSync(state, "draft");
  fs.writeFileSync(log, "");
  const fake = path.join(bin, "gh");
  // The fake models the forge: `pr view` reports the draft flag from the state
  // file, `pr ready` flips it. Every call is logged so the repair count is exact.
  fs.writeFileSync(
    fake,
    `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, args.join(" ") + "\\n");
if (args[0] === "pr" && args[1] === "ready") { fs.writeFileSync(${JSON.stringify(state)}, "ready"); process.exit(0); }
const isDraft = fs.readFileSync(${JSON.stringify(state)}, "utf8").trim() !== "ready";
process.stdout.write(JSON.stringify({ headRefOid: "${SHA_A}", number: 240, isDraft, mergeable: "clean", comments: [] }));\n`,
  );
  fs.chmodSync(fake, 0o755);

  const result = spawnSync(process.execPath, [script, "hygiene", "--pr", "240", "--apply"], {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
  });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.clean, true);
  assert.deepEqual(report.gates, { "tree-clean": "pass", "branch-pushed": "pass", "pr-ready": "pass" });
  const calls = fs.readFileSync(log, "utf8").trim().split("\n");
  assert.equal(calls.filter((c) => c === "pr ready").length, 1, "exactly one mechanical repair");
  assert.ok(calls.filter((c) => c.startsWith("pr view")).length >= 2, "the state is re-read after the repair");
});

test("CLI hygiene --apply: a clean, pushed, ready PR needs no repair and runs no forge write", () => {
  const { dir, repo } = makeRepo();
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  const log = path.join(dir, "gh.log");
  fs.writeFileSync(log, "");
  const fake = path.join(bin, "gh");
  fs.writeFileSync(
    fake,
    `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(log)}, args.join(" ") + "\\n");
process.stdout.write(JSON.stringify({ headRefOid: "${SHA_A}", number: 240, isDraft: false, mergeable: "clean", comments: [] }));\n`,
  );
  fs.chmodSync(fake, 0o755);
  const result = spawnSync(process.execPath, [script, "hygiene", "--pr", "240", "--apply"], {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).clean, true);
  const calls = fs.readFileSync(log, "utf8");
  assert.doesNotMatch(calls, /pr ready/, "no mechanical repair is run when nothing blocks");
});

test("CLI flags: an unknown or misspelled flag is refused, never a silent default (F5)", () => {
  const { repo } = makeRepo();
  const result = spawnSync(process.execPath, [script, "hygiene", "--prr", "240"], { cwd: repo, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown flag: --prr/);
});

test("CLI flags: --flag=value is accepted and -R resolves to the forge scope (F5)", () => {
  const { dir, repo } = makeRepo();
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  const log = path.join(dir, "gh.log");
  fs.writeFileSync(log, "");
  const fake = path.join(bin, "gh");
  fs.writeFileSync(
    fake,
    `#!/usr/bin/env node\nconst fs = require("node:fs");\nfs.appendFileSync(${JSON.stringify(log)}, process.argv.slice(2).join(" ") + "\\n");\nprocess.stdout.write(JSON.stringify({ headRefOid: "${SHA_A}", number: 240, isDraft: false, mergeable: "clean", comments: [] }));\n`,
  );
  fs.chmodSync(fake, 0o755);
  const result = spawnSync(process.execPath, [script, "hygiene", "--pr=240", "-R", "owner/name"], {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(log, "utf8"), /-R owner\/name/, "the documented -R alias must reach the forge call");
});

// ---------------------------------------------------------------------------
// The gate's own outcome (issue #702 S5/S10) — an unevaluatable gate says so
// ---------------------------------------------------------------------------

test("an unevaluated gate is its own outcome with its own reason, never a content failure", () => {
  const sha = "a".repeat(40);
  const reviews = [{ body: reviewBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }];
  const gates = Object.fromEntries(GATE_NAMES.map((name) => [name, "pass"]));
  delete gates.closure;
  const result = auditVerdict({ comments: reviews, headSha: sha, gates });
  assert.equal(result.verdict, "BLOCKED", "fail-closed: an unread gate still blocks");
  assert.deepEqual(result.blockers, ["gate closure unevaluatable: not-evaluated"]);
  assert.equal(result.gates.closure.outcome, "unevaluatable");
  assert.equal(result.gates.closure.reason, "not-evaluated");
  assert.deepEqual(result.unevaluatable, ["closure"]);

  // The field reproducer: `evaluate` with no gate map at all reported fourteen
  // `gate <name> failed` lines while nothing had failed. Every one of them is
  // now the truth — the gate was never evaluated.
  const bare = auditVerdict({ comments: reviews, headSha: sha, gates: {} });
  assert.equal(bare.blockers.length, GATE_NAMES.length);
  assert.ok(bare.blockers.every((blocker) => / unevaluatable: not-evaluated$/u.test(blocker)), bare.blockers.join("; "));
  assert.ok(!bare.blockers.some((blocker) => /\bfailed\b/u.test(blocker)), "no gate is accused of a failure nobody observed");
});

test("a supplied unevaluatable gate keeps the caller's reason and still blocks", () => {
  const sha = "a".repeat(40);
  const reviews = [{ body: reviewBody({ sha, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }];
  const allPass = Object.fromEntries(GATE_NAMES.map((name) => [name, "pass"]));
  const reason = "the checkout cannot read the forge's check runs";
  const unreadable = auditVerdict({ comments: reviews, headSha: sha, gates: { ...allPass, ci: { outcome: "unevaluatable", reason } } });
  assert.equal(unreadable.verdict, "BLOCKED");
  assert.deepEqual(unreadable.blockers, [`gate ci unevaluatable: ${reason}`]);
  assert.equal(unreadable.gates.ci.reason, reason);

  const failed = auditVerdict({ comments: reviews, headSha: sha, gates: { ...allPass, ci: "fail" } });
  assert.deepEqual(failed.blockers, ["gate ci failed"], "a supplied failure is still a content failure");
  assert.equal(failed.gates.ci.outcome, "fail");

  const skipped = auditVerdict({ comments: reviews, headSha: sha, gates: { ...allPass, ci: "skipped" } });
  assert.deepEqual(skipped.blockers, ["gate ci skipped"], "a gate the run skipped did not pass");
});

test("the gates map's outcome vocabulary is closed", () => {
  assert.deepEqual([...GATE_OUTCOMES], ["pass", "fail", "skipped", "unevaluatable"]);
  const dir = tempRoot("audit-pr-outcome-");
  const comments = path.join(dir, "comments.json");
  fs.writeFileSync(comments, JSON.stringify([{ body: reviewBody({ sha: SHA_A, scope: "s", axes: "a", coverage: "c", invariants: "pass", proposals: "0", manual: "none" }) }]));
  for (const value of ["maybe", "PASS", 1]) {
    const gatesPath = path.join(dir, `gates-${String(value)}.json`);
    fs.writeFileSync(gatesPath, JSON.stringify({ ci: value }));
    const result = spawnSync(process.execPath, [script, "evaluate", "--comments-json", comments, "--head", SHA_A, "--gates-json", gatesPath], { encoding: "utf8" });
    assert.equal(result.status, 1, `${JSON.stringify(value)} is refused, not classified`);
    assert.match(result.stderr, /gate ci/u);
    assert.match(result.stderr, /pass, fail, skipped, unevaluatable/u, result.stderr);
  }
});

test("the receipt judge's unreadable subprocess is unevaluatable, a judged receipt failure is not", () => {
  assert.deepEqual(receiptGateOutcome({ stdout: "" }), { outcome: "unevaluatable", reason: "judge-unreadable" });
  assert.deepEqual(receiptGateOutcome({ stdout: "audit-pr-gate: boom" }), { outcome: "unevaluatable", reason: "judge-unreadable" });
  assert.deepEqual(receiptGateOutcome({ stdout: JSON.stringify({ status: "missing", verdict: "fail", blockers: ["gate receipt is missing: .agentic-workflow/gate/gate-receipt.json"] }) }), {
    outcome: "fail",
    reason: "missing",
  });
  assert.deepEqual(receiptGateOutcome({ stdout: JSON.stringify({ status: "stale-manifest", verdict: "fail" }) }), { outcome: "fail", reason: "stale-manifest" });
  assert.deepEqual(receiptGateOutcome({ stdout: JSON.stringify({ status: "current", verdict: "pass" }) }), { outcome: "pass" });
  // The shipped gate is that pure mapping over the judge's own answer: a
  // project with no receipt is a judged failure naming its status.
  const dir = tempRoot("audit-pr-gate-judge-");
  const root = path.join(dir, "project");
  fs.mkdirSync(root);
  const judged = gateReceiptGate({ root });
  assert.equal(judged.outcome, "fail");
  assert.equal(judged.reason, "missing");
});
