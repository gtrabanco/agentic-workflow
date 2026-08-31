#!/usr/bin/env node

// Feature 28 root fixtures: the pre-execution quality route as a TEXT contract.
//
// The machine semantics of `PreExecutionArtifactSnapshot v1` /
// `PreExecutionReviewReceipt v1` are owned and tested by
// `packages/agentic-workflow-schema` (AC1/AC2). What this file pins is the
// behaviour the skills must exhibit: the closed vocabularies they may emit, the
// read-only boundary of the reviewer, the fail-closed gates that consume a
// Product receipt, and the ownership of repair. The pure models below mirror the
// decision tables written into the skills; they are not a second validator.

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(repoRoot, relative), "utf8");

const grounding = read("skills/evidence-grounding/SKILL.md");
const groundingRows = read("skills/evidence-grounding/references/ROWS.md");
const groundingReadiness = read("skills/evidence-grounding/references/READINESS.md");
const reviewSpec = read("skills/review-spec/SKILL.md");
const specChecks = read("skills/review-spec/references/CHECKS.md");
const specOutput = read("skills/review-spec/references/OUTPUT.md");
const designFeature = read("skills/design-feature/SKILL.md");
const designWrite = read("skills/design-feature/references/WRITE_AND_UPSERT.md");
const designRepair = read("skills/design-feature/references/REPAIR.md");
const designInterview = read("skills/design-feature/references/INTERVIEW.md");
const planFeature = read("skills/plan-feature/SKILL.md");
const planRouting = read("skills/plan-feature/references/ROUTING.md");
const fromIssue = read("skills/plan-feature-from-issue/SKILL.md");
const plugin = JSON.parse(read(".claude-plugin/plugin.json"));
const skillsSh = JSON.parse(read("skills.sh.json"));
const routing = read("docs/workflow/model-routing.yml");

// --- closed vocabularies (single source of truth: the skills' own text) --------

const GROUNDING_OUTCOMES = ["CONTEXT-PREPARED", "NEEDS-EVIDENCE", "NEEDS-DESIGN"];
const READINESS_OUTCOMES = ["READY-FOR-REVIEW", "NEEDS-EVIDENCE", "NEEDS-DESIGN", "NEEDS-REPLAN"];
const SPEC_VERDICTS = ["SPEC-REVIEW-PASS", "SPEC-REVIEW-FAIL", "NEEDS-DESIGN"];
const PLAN_VERDICTS = ["PLAN-REVIEW-PASS", "PLAN-REVIEW-FAIL", "NEEDS-DESIGN"];
const FINDING_CLASSES = ["product", "plan", "source", "environment", "runtime"];
const SEVERITIES = ["info", "low", "medium", "high", "critical"];
const MATERIAL = SEVERITIES.filter((s) => s !== "info");
const PRODUCT_CHECKS = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8", "C9", "C10", "C11", "C12", "C13", "C14"];

const squash1 = (t) => t.replace(/\s+/g, " ").trim();

// --- pure models of the contracted decision tables ----------------------------

// evidence-grounding never emits a review verdict, and readiness is capped at
// licensing a review request (SKILL.md "Hard rule — authority boundary").
const outcomeFor = (step) => {
  if (step === "grounding") return GROUNDING_OUTCOMES;
  if (step === "readiness") return READINESS_OUTCOMES;
  if (step === "review-spec") return SPEC_VERDICTS;
  if (step === "review-plan") return PLAN_VERDICTS;
  throw new Error(`unknown step: ${step}`);
};

const canEmitReviewPass = (step) => outcomeFor(step).some((v) => /REVIEW-PASS$/.test(v));

// Deterministic readiness: a failing box maps to one outcome by the fixed table.
const readinessCondition = {
  "missing-evidence": "NEEDS-EVIDENCE",
  "drifted-row": "NEEDS-EVIDENCE",
  "stale-row": "NEEDS-EVIDENCE",
  "unowned-unknown": "NEEDS-EVIDENCE",
  "missing-parent-receipt": "NEEDS-EVIDENCE",
  "open-product-choice": "NEEDS-DESIGN",
  "obligation-phase-mismatch": "NEEDS-REPLAN",
  "invalid-phase-cut": "NEEDS-REPLAN",
};

const evaluateReadiness = ({ stage, failures = [] }) => {
  if (failures.length === 0) return { stage, outcome: "READY-FOR-REVIEW", blockers: [] };
  const outcomes = failures.map((f) => readinessCondition[f] ?? "NEEDS-EVIDENCE");
  const outcome = stage === "spec" && outcomes.includes("NEEDS-DESIGN")
    ? "NEEDS-DESIGN"
    : outcomes[0];
  return { stage, outcome, blockers: failures };
};

// Snapshot freshness precedence for the SPEC stage — same order the package's
// PRE_EXECUTION_FRESHNESS_CODES declares (policy → context → source → revision →
// content); the package remains the semantic authority.
const SPEC_STAGE_FRESHNESS_ORDER = [
  ["invalid-stage", (r, s) => r.stage !== s.stage || !["spec-review-pass", "spec-review-fail", "needs-design"].includes(r.verdict)],
  ["invalid-unit", (r, s) => r.unitId !== s.unitId],
  ["stale-policy", (r, s) => r.policyVersion !== s.policyVersion],
  ["stale-context", (r, s) => JSON.stringify(r.contexts) !== JSON.stringify(s.contexts)],
  ["stale-source-revision", (r, s) => r.sourceRevision !== s.sourceRevision],
  ["stale-artifact-revision", (r, s) => r.artifactRevisionId !== s.artifactRevisionId],
  ["stale-artifact-content", (r, s) => r.snapshotDigest !== s.snapshotDigest],
];

const freshnessOf = (receipt, snapshot) => {
  for (const [code, fails] of SPEC_STAGE_FRESHNESS_ORDER) if (fails(receipt, snapshot)) return code;
  return "fresh";
};

// The authority rules that turn a fresh receipt into an accepted gate input.
const gateAccepts = (receipt, snapshot) => {
  const freshness = freshnessOf(receipt, snapshot);
  if (freshness !== "fresh") return { accepted: false, reason: freshness };
  if (receipt.contract !== "agentic-workflow/pre-execution-review-receipt@1") return { accepted: false, reason: "substitute" };
  if (receipt.stage !== "spec") return { accepted: false, reason: "wrong-stage" };
  if (receipt.verdict !== "spec-review-pass") return { accepted: false, reason: "verdict" };
  if (receipt.contextClean !== true) return { accepted: false, reason: "self-approved" };
  if (receipt.authorExclusion === "enforced" && receipt.reviewer === receipt.authorId) return { accepted: false, reason: "self-approved" };
  const openMaterial = (receipt.findings ?? []).filter(
    (f) => MATERIAL.includes(f.severity) && (f.resolution === "open" || f.verification === "unverified"),
  );
  if (openMaterial.length > 0) return { accepted: false, reason: "open-findings" };
  return { accepted: true, reason: "current" };
};

// An authoring write rotates the revision; a revert is still a write.
const authoringEvent = (snapshot, { bytes, revert = false } = {}) => ({
  ...snapshot,
  artifactRevisionId: `rev-${Math.random().toString(36).slice(2, 8)}`,
  ...(bytes === undefined ? {} : { snapshotDigest: bytes }),
  rotated: true,
  revert,
});

// One review → one batch → one re-review; a second cycle is an anomaly.
const repairCycle = ({ cycle, findingIds, changedSnapshot, newQuestion }) => {
  if (cycle <= 1) return { action: "repair-batch", batch: findingIds, reReview: 1 };
  const progress = changedSnapshot || newQuestion;
  return {
    action: progress ? "convergence-anomaly" : "no-progress",
    anomaly: progress ? "CONVERGENCE-ANOMALY" : "NO-PROGRESS",
    findingIds,
    owner: progress ? "stage-that-missed-the-evidence" : null,
  };
};

// A current-unit obligation may not leave the unit without a user amendment.
const exportObligation = ({ target, amended, approvedBy }) => {
  if (target === "follow-up-issue" && !amended) return { allowed: false, reason: "descope-without-amendment" };
  if (amended && approvedBy !== "user") return { allowed: false, reason: "amendment-needs-user-authority" };
  return { allowed: true, reason: amended ? "user-amended" : "stays-in-unit" };
};

// --- fixtures -----------------------------------------------------------------

const digest = (seed) => seed.repeat(64).slice(0, 64);
const SNAPSHOT = Object.freeze({
  contract: "agentic-workflow/pre-execution-artifact-snapshot@1",
  stage: "spec",
  unitKind: "feature",
  unitId: "28-evidence-grounded-spec-plan-review",
  sourceRevision: "a".repeat(40),
  artifactRevisionId: "rev-1",
  snapshotDigest: digest("1"),
  contexts: [{ kind: "roadmap-row", identifier: "28", presence: "present", digest: digest("2") }],
  policyVersion: "28-pre-execution-1",
});
const receipt = (over = {}) => ({
  contract: "agentic-workflow/pre-execution-review-receipt@1",
  stage: "spec",
  verdict: "spec-review-pass",
  snapshotDigest: SNAPSHOT.snapshotDigest,
  artifactRevisionId: SNAPSHOT.artifactRevisionId,
  sourceRevision: SNAPSHOT.sourceRevision,
  unitId: SNAPSHOT.unitId,
  contexts: SNAPSHOT.contexts,
  policyVersion: SNAPSHOT.policyVersion,
  reviewer: "reviewer-1",
  authorId: "author-1",
  authorExclusion: "enforced",
  contextClean: true,
  modelDiversity: "same-model",
  findings: [],
  ...over,
});

// --- AC13 / AC5: grounding and readiness cannot approve -----------------------

test("grounding and readiness vocabularies exclude every review PASS", () => {
  assert.equal(canEmitReviewPass("grounding"), false);
  assert.equal(canEmitReviewPass("readiness"), false);
  assert.equal(canEmitReviewPass("review-spec"), true);
  assert.deepEqual(outcomeFor("review-spec"), SPEC_VERDICTS);
  assert.match(grounding, /forbidden outputs here/);
  assert.match(grounding, /may emit only these two vocabularies/);
  assert.match(groundingReadiness, /Never emit `SPEC-REVIEW-PASS`, `PLAN-REVIEW-PASS`/);
  assert.match(grounding, /authoring-quality gates, not review verdicts/);
  assert.match(grounding, /never emit\S+ a review PASS|can never emit a review PASS|can never emit\b/);
});

test("the fixed evidence row and its closed vocabularies are stated once", () => {
  const row = /claim-or-obligation \| authority-kind \| source-and-location \| observed-revision \|\sfreshness \| status: proven\|decision\|unknown \| owner-or-next-evidence/;
  assert.match(grounding, row);
  assert.match(groundingRows, row);
  assert.match(designWrite, /claim-or-obligation \| authority-kind \| source-and-location \|/);
  for (const authority of ["repository", "document", "ledger", "forge", "user", "derived"]) {
    assert.match(groundingRows, new RegExp(`\\| \`${authority}\` \\|`), `missing authority kind ${authority}`);
  }
  for (const freshness of ["current", "drifted", "stale", "not-applicable"]) {
    assert.match(groundingRows, new RegExp(`\`${freshness}\``), `missing freshness ${freshness}`);
  }
  assert.match(groundingRows, /A `drifted` or `stale` row is not evidence/);
  assert.match(grounding, /`unknown` with an owner — an unknown is never replaced by\n  a plausible rationale|unknown`? with a named owner/);
});

test("authoring passes are ordered and the no-progress rule is bounded", () => {
  const order = ["Inventory", "Evidence", "Draft", "Cut", "Readiness"];
  const positions = order.map((step) => {
    const at = grounding.indexOf(`**${step}**`);
    assert.ok(at >= 0, `missing pass ${step}`);
    return at;
  });
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), "passes must be ordered inventory→readiness");
  assert.match(grounding, /must answer a \*\*new named question\*\* or expose \*\*new evidence\*\*/);
  assert.match(grounding, /Otherwise it is no-progress/);
  assert.match(groundingReadiness, /Never convert exhaustion into readiness/);
});

test("readiness rejects every incomplete artifact and never reaches review", () => {
  for (const failure of Object.keys(readinessCondition)) {
    const result = evaluateReadiness({ stage: "spec", failures: [failure] });
    assert.notEqual(result.outcome, "READY-FOR-REVIEW", failure);
    assert.ok(READINESS_OUTCOMES.includes(result.outcome), `${failure}: ${result.outcome}`);
    assert.ok(!/REVIEW-PASS/.test(result.outcome), `${failure} must not read as approval`);
  }
  assert.deepEqual(evaluateReadiness({ stage: "spec", failures: [] }), { stage: "spec", outcome: "READY-FOR-REVIEW", blockers: [] });
  assert.match(groundingReadiness, /do not invoke an independent reviewer/);
  assert.match(groundingReadiness, /### `stage: spec` boxes/);
  assert.match(groundingReadiness, /### `stage: plan` boxes/);
});

// --- AC3: review-spec is read-only, complete, and returns three verdicts -----

test("review-spec declares the read-only artifact boundary", () => {
  assert.match(reviewSpec, /Read-only on the reviewed artifact/);
  assert.match(reviewSpec, /Never edit, reformat, reorder, or/);
  assert.match(designFeature, /Never write or "sync" a\n  `PreExecutionReviewReceipt`/);
  for (const forbidden of ["git add", "git commit", "Edit `SPEC.md", "write the reviewed"]) {
    assert.ok(!reviewSpec.includes(forbidden), `reviewer text must not instruct ${forbidden}`);
  }
  assert.match(specOutput, /`git status --porcelain` shows no change to any reviewed artifact/);
});

test("the Product check list is the fixed fourteen, in order", () => {
  const listed = [...specChecks.matchAll(/^\| (C\d+) \| (.+?) \|/gm)].map((m) => m[1]);
  assert.deepEqual(listed, PRODUCT_CHECKS);
  assert.match(specChecks, /Every row gets exactly one result: `pass`, `finding`, or `n\/a/);
  assert.match(specOutput, /Checks: 14\/14/);
  assert.match(specChecks, /`class` \(`product \| plan \|\nsource \| environment \| runtime`\)/);
});

test("a complete Product review is the only path to SPEC-REVIEW-PASS", () => {
  assert.deepEqual(gateAccepts(receipt(), SNAPSHOT), { accepted: true, reason: "current" });
  assert.match(specOutput, /SPEC-REVIEW-PASS — <NN-slug>/);
  assert.match(reviewSpec, /Three verdicts only/);
});

test("unsupported, self-approved and non-current authority is refused deterministically", () => {
  const cases = [
    [receipt({ reviewer: "author-1" }), SNAPSHOT, "self-approved"],
    [receipt({ contextClean: false }), SNAPSHOT, "self-approved"],
    [receipt({ verdict: "plan-review-pass" }), SNAPSHOT, "invalid-stage"],
    [receipt({ stage: "plan" }), SNAPSHOT, "invalid-stage"],
    [receipt({ contract: "agentic-workflow/review-receipt@1" }), SNAPSHOT, "substitute"],
    [receipt({ policyVersion: "older" }), SNAPSHOT, "stale-policy"],
    [receipt({ contexts: [] }), SNAPSHOT, "stale-context"],
    [receipt({ sourceRevision: "b".repeat(40) }), SNAPSHOT, "stale-source-revision"],
    [receipt({ artifactRevisionId: "rev-2" }), SNAPSHOT, "stale-artifact-revision"],
    [receipt({ snapshotDigest: digest("9") }), SNAPSHOT, "stale-artifact-content"],
  ];
  for (const [r, s, expected] of cases) {
    const result = gateAccepts(r, s);
    assert.equal(result.accepted, false, JSON.stringify(result));
    assert.equal(result.reason, expected, `expected ${expected}, got ${result.reason}`);
  }
});

test("candidate and verification receipts are never Product-review substitutes", () => {
  for (const substitute of [
    receipt({ contract: "agentic-workflow/review-receipt@1" }),
    receipt({ contract: "agentic-workflow/verification-receipt@1" }),
  ]) {
    assert.equal(gateAccepts(substitute, SNAPSHOT).accepted, false);
  }
  assert.match(planRouting, /\*\*substitute\*\* \(candidate `ReviewReceipt v1`/);
  assert.match(planRouting, /different contracts, never interchangeable/);
  assert.match(reviewSpec, /Never substitute other evidence/);
  assert.match(groundingReadiness, /current `SPEC-REVIEW-PASS`/);
});

test("a PASS cannot coexist with an open material finding", () => {
  const open = receipt({ findings: [{ id: "F1", severity: "high", class: "product", verification: "verified", resolution: "open" }] });
  assert.equal(gateAccepts(open, SNAPSHOT).reason, "open-findings");
  const unverified = receipt({ findings: [{ id: "F1", severity: "medium", class: "product", verification: "unverified", resolution: "resolved" }] });
  assert.equal(gateAccepts(unverified, SNAPSHOT).reason, "open-findings");
  const info = receipt({ findings: [{ id: "F1", severity: "info", class: "product", verification: "verified", resolution: "open" }] });
  assert.equal(gateAccepts(info, SNAPSHOT).accepted, true, "info rows are immaterial");
  assert.match(specChecks, /a `PASS` may not carry an open or\nunverified material row/);
});

test("causal revert: new authoring event keeps the old PASS stale after bytes return", () => {
  const mutated = authoringEvent(SNAPSHOT, { bytes: digest("7") });
  const reverted = authoringEvent(mutated, { bytes: SNAPSHOT.snapshotDigest, revert: true });
  assert.notEqual(reverted.artifactRevisionId, SNAPSHOT.artifactRevisionId, "revert must rotate the revision id");
  const stale = gateAccepts(receipt(), reverted);
  assert.equal(stale.accepted, false);
  assert.equal(stale.reason, "stale-artifact-revision", "identical bytes must not revive the old PASS");
  assert.match(grounding, /a revert to previously published bytes is a new write|revert to previously published bytes is a\n  new write|is a new write/s);
  assert.match(designFeature, /a revert to previously published bytes included/);
});

test("same-model clean context is labelled same-model, never diverse", () => {
  const same = receipt({ modelDiversity: "same-model" });
  assert.equal(same.modelDiversity, "same-model");
  assert.equal(gateAccepts(same, SNAPSHOT).accepted, true, "a clean same-model review is valid");
  assert.ok(!["cross-model", "diverse"].includes(same.modelDiversity));
  assert.equal(receipt().contextClean, true, "a clean review records the field");
  assert.match(specOutput, /Model diversity: <same-model\|cross-model\|not-applicable>/);
  assert.match(specOutput, /truthful|diversity/);
});

test("missing or unreadable evidence returns NEEDS-DESIGN/NEEDS-EVIDENCE, not a claim", () => {
  assert.equal(evaluateReadiness({ stage: "spec", failures: ["missing-evidence"] }).outcome, "NEEDS-EVIDENCE");
  assert.equal(evaluateReadiness({ stage: "spec", failures: ["open-product-choice"] }).outcome, "NEEDS-DESIGN");
  assert.match(grounding, /Never invent product intent, scope, roles, authority, or user outcomes/);
  assert.match(reviewSpec, /may never\n  choose the intended behaviour|No product authority/);
  assert.match(specOutput, /NEEDS-DESIGN — <NN-slug>/);
  assert.match(specOutput, /Missing product choice \(product authority only\)/);
});

// --- AC7: first findings union is one batch; a second cycle is an anomaly ----

test("the first review findings go to one root-caused batch owned by design-feature", () => {
  const findings = ["F1", "F2", "F3"].map((id) => ({ id, severity: "high", class: "product" }));
  const result = repairCycle({ cycle: 1, findingIds: findings.map((f) => f.id) });
  assert.equal(result.action, "repair-batch");
  assert.deepEqual(result.batch, ["F1", "F2", "F3"], "the union is repaired together, not one at a time");
  assert.equal(result.reReview, 1, "one re-review closes the batch");
  assert.match(designRepair, /one evidence-bounded repair batch/);
  assert.match(designRepair, /Do not fix one finding, re-review, fix the next/);
  assert.match(specOutput, /one batch over this whole set/);
});

test("entering a second repair/re-review cycle emits a convergence anomaly", () => {
  const anomaly = repairCycle({ cycle: 2, findingIds: ["F1", "F5"], changedSnapshot: true });
  assert.equal(anomaly.anomaly, "CONVERGENCE-ANOMALY");
  assert.equal(anomaly.action, "convergence-anomaly");
  assert.deepEqual(anomaly.findingIds, ["F1", "F5"]);
  const stalled = repairCycle({ cycle: 2, findingIds: ["F1"], changedSnapshot: false, newQuestion: false });
  assert.equal(stalled.action, "no-progress");
  assert.match(designRepair, /`CONVERGENCE-ANOMALY`/);
  // P3 gave the cycle rules one owner; the caller must delegate to it and keep the
  // spec-stage detail. Same guarantees, checked across owner + delegator.
  assert.match(designRepair, /Cycle rules have one owner: `pre-execution-review\/references\/POLICY\.md` §4/);
  assert.match(designRepair, /\*\*before\*\* any\nfurther edit/);
  assert.match(designRepair, /they never earn a PASS/);
  assert.match(designRepair, /an exhausted cycle budget/);
});

test("a mechanical repair stays autonomous only while intent is unchanged", () => {
  assert.match(designRepair, /Mechanical, intent-preserving/);
  assert.match(designRepair, /Product change/);
  assert.match(designRepair, /the human, through this skill's interview/);
  assert.match(designRepair, /dated SPEC `## Amendments` row/);
  assert.match(designRepair, /only while reviewed product intent is/);
  assert.match(designRepair, /Classify each by root cause\n\(`product \| plan \| source \| environment \| runtime`\)/);
});

// --- AC5: issue-derived design stops for review-spec -------------------------

test("design-feature hands a designed half to review-spec, never straight to planning", () => {
  assert.match(designFeature, /→ Next: \/review-spec <slug>/);
  assert.doesNotMatch(designFeature, /→ Next: \/plan-feature <slug>/);
  assert.match(designWrite, /recommending `\/review-spec <slug>`/);
  assert.match(designWrite, /Do \*\*not\*\* recommend `\/plan-feature`/);
  assert.match(designFeature, /Consume the internal \[evidence-grounding\]/);
  assert.match(designFeature, /`review-spec` is the gate this skill hands to/);
  assert.match(designInterview, /readiness block printed; the artifact is handed off only on/);
  assert.match(designInterview, /`artifactRevisionId` rotated for the bytes just written/);
});

test("issue-derived feature work stops after the Product half", () => {
  assert.match(fromIssue, /This skill stops at the Product half/);
  assert.match(fromIssue, /→ review-spec next \(engineering planning is gated on its receipt; do not scaffold here\)/);
  assert.match(fromIssue, /No Engineering half, no phases, no\n  `defined → planned` promotion, no in-turn `plan-feature-scaffold` composition/);
  assert.doesNotMatch(fromIssue, /→ scaffold next \(plan-feature-scaffold\)/);
  assert.ok(fromIssue.indexOf("stops at") < fromIssue.indexOf("## Guardrails"), "the stop rule belongs in the contract, not only the tail");
});

test("plan-feature fails closed without a current Product receipt", () => {
  for (const [r, s, code] of [
    [null, SNAPSHOT, "missing"],
    [receipt({ artifactRevisionId: "rev-old" }), SNAPSHOT, "stale"],
    [receipt({ stage: "plan", verdict: "plan-review-pass" }), SNAPSHOT, "wrong-stage"],
    [receipt({ contract: "agentic-workflow/verification-receipt@1" }), SNAPSHOT, "substitute"],
    [receipt({ reviewer: "author-1" }), SNAPSHOT, "self-approved"],
  ]) {
    const decision = !r ? { block: "missing" } : gateAccepts(r, s);
    assert.ok(decision.block === "missing" || decision.accepted === false, `${code} must fail closed`);
  }
  assert.match(planRouting, /PRODUCT-REVIEW GATE — <NN>-<slug> BLOCKED/);
  assert.match(planRouting, /no bypass flag exists/i);
  assert.match(planFeature, /Then the Product-review gate ran/);
  assert.match(planFeature, /candidate\/verification receipt, a Plan receipt, or readiness never counts/);
  assert.match(planRouting, /`--force` is not a `plan-feature` flag/);
});

test("the Product gate re-verifies bytes rather than trusting the stored block", () => {
  assert.match(planRouting, /Recompute the SPEC-stage snapshot from the bytes on disk now/);
  assert.match(planRouting, /A stale receipt is never "refreshed" by editing the block/);
  assert.match(planRouting, /exactly one\n   artifact row \(`kind: spec`, `selector: spec-product-v1`\)/);
});

// --- AC6: no current-unit obligation escapes into an issue -------------------

test("an obligation may not be exported to a follow-up issue without a user amendment", () => {
  assert.deepEqual(exportObligation({ target: "follow-up-issue", amended: false }), { allowed: false, reason: "descope-without-amendment" });
  assert.deepEqual(exportObligation({ target: "follow-up-issue", amended: true, approvedBy: "reviewer" }), { allowed: false, reason: "amendment-needs-user-authority" });
  assert.equal(exportObligation({ target: "follow-up-issue", amended: true, approvedBy: "user" }).allowed, true);
  assert.equal(exportObligation({ target: "unit", amended: false }).allowed, true);
  assert.match(designRepair, /Never create a forge issue to hold a current-unit obligation/);
  assert.match(reviewSpec, /Never widen an artifact beyond the frozen obligations|No engineering scope creep/);
  assert.match(specChecks, /no current-unit obligation is exported to a future issue/);
  assert.match(grounding, /No automatic forge writes\. No issue creation, ever/);
});

// --- distribution and progressive-context contract --------------------------

test("the new skills are distributed without the discovery-exclusion flag", () => {
  const pluginSkills = plugin.skills.map((entry) => entry.replace("./skills/", ""));
  for (const skill of ["evidence-grounding", "review-spec"]) {
    assert.ok(pluginSkills.includes(skill), `${skill} must be registered in plugin.json`);
    const body = read(`skills/${skill}/SKILL.md`);
    assert.doesNotMatch(body, /^metadata:\n  internal: true$/m, `${skill} must stay discoverable by the skills CLI`);
    assert.ok(fs.existsSync(path.join(repoRoot, `skills/${skill}/SKILL.md`)));
  }
  assert.equal(/^user-invocable: false$/m.test(grounding), true, "evidence-grounding is internal");
  assert.equal(/^user-invocable: true$/m.test(reviewSpec), true, "review-spec is a menu entry");
  assert.deepEqual(pluginSkills, [...pluginSkills].sort(), "plugin skills stay alphabetical");
  const grouped = skillsSh.groupings.flatMap((g) => g.skills);
  for (const skill of ["evidence-grounding", "review-spec"]) {
    assert.ok(grouped.includes(skill), `${skill} must be grouped in skills.sh.json`);
  }
  for (const name of grouped) {
    assert.ok(fs.existsSync(path.join(repoRoot, "skills", name, "SKILL.md")), `grouped skill missing: ${name}`);
  }
  // review-spec is a user-facing stage: it needs its own declared tier.
  assert.match(routing, /^review-spec:\n  model: opus\n  effort: high$/m);
  // evidence-grounding is composed in-turn, so it carries no tier of its own —
  // the same rule as the phase/verification/planning contracts it sits beside.
  assert.doesNotMatch(routing, /^evidence-grounding:$/m);
  for (const internal of ["phase-contract", "verification-contract", "planning-preflight", "evidence-grounding"]) {
    assert.equal(/^user-invocable: true$/m.test(read(`skills/${internal}/SKILL.md`)), false, `${internal} must stay out of the menu`);
  }
  assert.deepEqual([...routing.matchAll(/^([a-z0-9-]+):$/gm)].map((m) => m[1]), [...routing.matchAll(/^([a-z0-9-]+):$/gm)].map((m) => m[1]).sort(), "model-routing keys stay alphabetical");
});

test("each P2 entrypoint stays within its progressive route", () => {
  const routes = [
    ["design-feature", designFeature, ["INTERVIEW.md", "WRITE_AND_UPSERT.md", "UPSERT_EXAMPLE.md", "REPAIR.md", "PORTABILITY.md"]],
    ["review-spec", reviewSpec, ["CHECKS.md", "OUTPUT.md"]],
    ["evidence-grounding", grounding, ["ROWS.md", "READINESS.md"]],
  ];
  for (const [skill, body, allowed] of routes) {
    const linked = [...new Set([...body.matchAll(/\(references\/([^)]+\.md)\)/g)].map((m) => m[1]))].sort();
    assert.deepEqual(linked, [...allowed].sort(), `${skill} must route exactly to its allowed references`);
    for (const link of allowed) {
      assert.ok(fs.existsSync(path.join(repoRoot, "skills", skill, "references", link)), `${skill}/${link} must exist`);
    }
  }
  // one-hop only: no reference may reach another reference
  for (const [name, body] of [["CHECKS.md", specChecks], ["OUTPUT.md", specOutput], ["ROWS.md", groundingRows], ["READINESS.md", groundingReadiness], ["REPAIR.md", designRepair], ["WRITE_AND_UPSERT.md", designWrite], ["INTERVIEW.md", designInterview]]) {
    assert.ok(!/\]\((?:\.\.\/)?references\//.test(body), `${name} must not nest a reference link`);
  }
});

test("author-exclusion and readiness boundaries are recorded on the receipt itself", () => {
  assert.match(specOutput, /Author exclusion: <enforced\|not-enforceable> · Context clean: <true\|false>/);
  assert.match(specOutput, /If context cleanliness is\nfalse or the reviewer identity equals the author's under an enforced exclusion,\na PASS is not emit-able/);
  assert.match(specOutput, /## Pre-execution review receipt v1 — spec/);
  assert.match(specOutput, /Snapshot: <digest> · Artifact revision: <artifactRevisionId>/);
  assert.match(reviewSpec, /docs\/workflow\/REPOSITORY_STATE\.md|REPOSITORY_STATE/);
});

test("review-spec routes every finding class to its owner and edits nothing", () => {
  for (const cls of FINDING_CLASSES) {
    assert.ok(specChecks.includes(cls), `check list must name the ${cls} root cause`);
  }
  assert.match(specOutput, /does not\nbecome work here: record it, keep it open, and route it to its owner/);
  assert.match(designRepair, /Findings classified outside `product` are \*\*not\*\* repaired here/);
  assert.deepEqual(FINDING_CLASSES.join("|").split("|").length, 5);
});


// --- P3: Plan review, ledgers, shared review policy -------------------------

const reviewPlan = read("skills/review-plan/SKILL.md");
const planChecks = read("skills/review-plan/references/CHECKS.md");
const planEngChecks = read("skills/review-plan/references/ENG-CHECKS.md");
const planOutput = read("skills/review-plan/references/OUTPUT.md");
const policyOwner = read("skills/pre-execution-review/SKILL.md");
const policyCycle = read("skills/pre-execution-review/references/POLICY.md");
const policyLedgers = read("skills/pre-execution-review/references/LEDGERS.md");
const scaffold = read("skills/plan-feature-scaffold/SKILL.md");
const scaffoldProcess = read("skills/plan-feature-scaffold/references/SCAFFOLD_PROCESS.md");
const planFix = read("skills/plan-fix/SKILL.md");
const featureTemplate = read("docs/features/_TEMPLATE/SPEC.md");
const fixTemplate = read("docs/fix/_TEMPLATE/SPEC.md");

const LEDGER_COLUMNS = {
  evidence: "id | question-or-claim | authority | repository-evidence-and-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence",
  obligations: "obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status",
  findings: "finding-id | stage | severity | class | snapshot-digest | claim | evidence | status | resolution-evidence | resolving-artifact-revision",
};

// Pure model of PLAN readiness + review (mirrors the skill decision tables).
const planReadiness = (rows) => {
  if (!rows.parentReceipt || rows.parentReceipt.verdict !== "SPEC-REVIEW-PASS") return "NEEDS-EVIDENCE";
  if (rows.obligations.some((o) => !o.phase || !o.validator)) return "NEEDS-REPLAN";
  if (rows.evidence.some((e) => e.freshness !== "current")) return "NEEDS-EVIDENCE";
  if (rows.assumptions.some((a) => a.unsampled && a.status !== "unknown")) return "NEEDS-EVIDENCE";
  if (rows.gaps.some((g) => g.type === "scenario-missing-validator")) return "NEEDS-REPLAN";
  if (rows.gaps.some((g) => g.type === "unknown-ownership")) return "NEEDS-EVIDENCE";
  return "READY-FOR-REVIEW";
};
const planReview = (snapshot, findings) => {
  if (snapshot.stage !== "plan") return "invalid-stage";
  if (snapshot.unitKind === "fix" && snapshot.hasProductHalf) return "finding"; // D6
  // order mirrors review-plan/references/OUTPUT.md §Routes: an undecided product
  // choice leaves this stage before incompleteness is judged
  if (findings.some((f) => f.class === "product" && !f.decidable)) return "NEEDS-DESIGN";
  if (findings.some((f) => MATERIAL.includes(f.severity) && (f.status !== "resolved" || !f.verified))) return "PLAN-REVIEW-FAIL";
  return "PLAN-REVIEW-PASS";
};

test("plan readiness covers evidence, obligation, and scenario gaps without claiming PASS", () => {
  const base = { parentReceipt: { verdict: "SPEC-REVIEW-PASS" }, obligations: [{ phase: "P1", validator: "node --test" }], evidence: [{ freshness: "current" }], assumptions: [], gaps: [] };
  assert.equal(planReadiness(base), "READY-FOR-REVIEW");
  assert.equal(planReadiness({ ...base, parentReceipt: null }), "NEEDS-EVIDENCE");
  assert.equal(planReadiness({ ...base, obligations: [{ phase: "", validator: "x" }] }), "NEEDS-REPLAN");
  assert.equal(planReadiness({ ...base, evidence: [{ freshness: "stale" }] }), "NEEDS-EVIDENCE");
  assert.equal(planReadiness({ ...base, assumptions: [{ unsampled: true, status: "proven" }] }), "NEEDS-EVIDENCE");
  assert.equal(planReadiness({ ...base, gaps: [{ type: "scenario-missing-validator" }] }), "NEEDS-REPLAN");
  assert.equal(planReadiness({ ...base, gaps: [{ type: "unknown-ownership" }] }), "NEEDS-EVIDENCE");
  // none of the outcomes is a review PASS
  assert.ok(!canEmitReviewPass("readiness"));
  assert.match(groundingReadiness, /Never emit `SPEC-REVIEW-PASS`, `PLAN-REVIEW-PASS`/);
  // readiness stage: plan boxes cover parent receipt, obligations, evidence, scenarios, phase-lint
  const planBoxes = groundingReadiness.match(/### `stage: plan` boxes\n+```([\s\S]+?)```/);
  assert.ok(planBoxes, "the stage:plan readiness box list must be present");
  for (const [what, pat] of [["parent receipt", /SPEC-REVIEW-PASS/], ["obligations", /obligation-ledger|obligation ledger/], ["planning evidence", /planning-evidence\.md/], ["scenario/validator", /validator/], ["phase-lint", /phase-lint|phase lint|Phase-lint/], ["rollback", /rollback/], ["unresolved decisions", /unresolved decision|Open questions/]]) {
    assert.ok(pat.test(planBoxes[1]), `stage:plan readiness must check ${what}`);
  }
});

test("the planning ledger set is defined once, in the shared owner", () => {
  // shared owner declares the three ledgers and their single writers
  for (const name of ["Planning evidence", "Obligations", "Findings"]) {
    assert.ok(policyLedgers.includes(name), `LEDGERS must own the ${name} ledger`);
  }
  const squash = (t) => t.replace(/\s+/g, " ").trim();
  const allSkillMd = fs.readdirSync(path.join(repoRoot, "skills"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .flatMap((d) => {
      const root = path.join(repoRoot, "skills", d.name);
      const own = fs.readdirSync(root).filter((n) => n.endsWith(".md")).map((n) => path.join(root, n));
      const refs = fs.existsSync(path.join(root, "references"))
        ? fs.readdirSync(path.join(root, "references")).filter((n) => n.endsWith(".md")).map((n) => path.join(root, "references", n))
        : [];
      return [...own, ...refs];
    });
  for (const [k, cols] of Object.entries(LEDGER_COLUMNS)) {
    const owners = allSkillMd.filter((f) => squash(read(path.relative(repoRoot, f))).includes(squash(cols)));
    assert.equal(owners.length, 1, `${k} ledger columns must be defined in exactly one file, found ${owners.length}`);
    assert.ok(owners[0].endsWith(path.join("pre-execution-review", "references", "LEDGERS.md")), `${k} columns must be owned by the shared ledger reference, got ${owners[0]}`);
  }
  // consumers point at the shared owner rather than restating the schema
  for (const [who, text] of [["plan-feature-scaffold", scaffoldProcess], ["plan-fix", planFix], ["plan-feature", planFeature], ["review-plan", reviewPlan + planChecks + planOutput]]) {
    assert.ok(/pre-execution-review/.test(text), `${who} must reference the shared ledger/policy owner`);
  }
});

test("evidence and obligation ledgers are frozen with XS/S embedding rules", () => {
  assert.match(policyLedgers, /XS\/S embeds both tables in the SPEC to stay within the size's artifact budget/);
  // templates must expose both ledgers for feature and fix units
  for (const [name, t] of [["feature", featureTemplate], ["fix", fixTemplate]]) {
    assert.ok(/^(#{2,3}) Planning evidence$/m.test(t), `${name} template needs a Planning evidence section`);
    assert.ok(/^(#{2,3}) Obligations$/m.test(t), `${name} template needs an Obligations section`);
    assert.ok(/validator/i.test(t), `${name} template's obligation table must carry a validator column`);
  }
  // the templates' own presence gate must demand both ledgers
  for (const [name, t] of [["feature", featureTemplate], ["fix", fixTemplate]]) {
    assert.ok(/Planning evidence`? and `?###? Obligations|Planning evidence.*obligations|obligations?.*validator/i.test(t), `${name} template must lint its ledgers`);
    assert.ok(/no obligation is `deferred`|no `deferred` row/i.test(t), `${name} template must forbid deferred/exported obligations`);
  }
  // scaffold writes planning-evidence.md for M/L, embedded for XS/S, rotates revision
  assert.match(scaffoldProcess, /planning-evidence\.md/);
  assert.match(scaffoldProcess, /Run the `stage: plan` readiness preflight/);
  assert.match(scaffoldProcess, /artifactRevisionId/);
  assert.match(scaffoldProcess, /stage: plan.*READY-FOR-REVIEW|READY-FOR-REVIEW/);
  assert.match(scaffoldProcess, /never written as, quoted as, or summarized as a review/);
  assert.match(scaffoldProcess, /routes\n?\s*to `\/review-plan`, never to `\/execute-phase`/);
});

test("obligation status lifecycle blocks completion until every row is verified", () => {
  const lifecycle = ["planned", "in-progress", "verified", "n/a", "deferred"];
  for (const st of lifecycle) assert.ok(policyLedgers.includes(`\`${st}\``) || policyLedgers.includes(st), `obligation status ${st} must be defined`);
  assert.match(policyLedgers, /Before the unit ships, every row is `verified`/);
  assert.match(policyLedgers, /`deferred` exists only in a ledger the user has amended/);
  assert.match(policyLedgers, /One behaviour appearing twice is a defect/);
  // AC6: validator that cannot fail / unvalidated row never closes
  assert.match(planChecks + planEngChecks, /each validator can actually fail \(a validator that passes on no-op is a finding\)/);
});

test("plan-fix hands its ledgers to review-plan and never straight to the executor", () => {
  assert.match(planFix, /→ Next: \/review-plan fix-<primary>/);
  assert.doesNotMatch(planFix, /→ Next: .*\/execute-phase --fix/);
  assert.match(planFix, /## Planning evidence`? and `?## Obligations|Planning evidence/);
  assert.match(planFix, /no fabricated Product half|never grows a fake one/i);
  assert.match(planFix, /stage: plan` readiness printed/);
});

test("review-plan is read-only on plan authority and names every artifact it may not touch", () => {
  assert.match(reviewPlan, /\*\*Read-only on plan authority\.\*\*/);
  for (const artifact of ["SPEC.md", "PLAN.md", "TASKS.md", "ACCEPTANCE.md"]) {
    assert.ok(reviewPlan.includes(artifact), `read-only boundary must name ${artifact}`);
  }
  assert.match(reviewPlan, /Appending findings and\n  the receipt block is writing \*evidence\*, not editing authority/);
  assert.match(reviewPlan, /Obligations are not suggestions\./);
  assert.match(reviewPlan, /This\n  skill may not narrow a check to make the plan pass|may not narrow a check/);
});

test("plan review binds exact snapshots, enforces stage, and supports feature/fix/legacy lineages", () => {
  assert.equal(planReview({ stage: "plan", unitKind: "feature", hasProductHalf: false }, []), "PLAN-REVIEW-PASS");
  assert.equal(planReview({ stage: "plan", unitKind: "fix", hasProductHalf: true }, []), "finding");
  assert.equal(planReview({ stage: "spec", unitKind: "feature" }, []), "invalid-stage");
  const openMat = [{ severity: "high", status: "open", verified: false, class: "plan", decidable: true }];
  assert.equal(planReview({ stage: "plan", unitKind: "feature" }, openMat), "PLAN-REVIEW-FAIL");
  assert.equal(planReview({ stage: "plan", unitKind: "feature" }, [{ severity: "medium", status: "open", verified: false, class: "product", decidable: false }]), "NEEDS-DESIGN");
  // snapshot rows differ per unit kind/size
  for (const [what, pat] of [["stage: plan snapshot", /stage: plan/], ["spec-product-v1", /spec-product-v1/], ["whole-file", /whole-file/], ["parent required", /parentSpecSnapshotDigest.*required|required.*parent/i], ["XS/S embed absent rows", /absent/]
  ]) {
    assert.ok(pat.test(planChecks), `plan snapshot construction must cover ${what}`);
  }
  for (const kind of ["spec", "acceptance", "plan", "tasks", "testing", "decisions", "architecture-notes", "planning-evidence", "obligations"]) {
    assert.ok(planChecks.includes(kind), `Plan snapshot must bind artifact kind ${kind}`);
  }
});

test("engineering checks cover phase cuts, validators, scenarios, and fix reproduction/root cause/rollback", () => {
  const checks = planEngChecks;
  for (const [what, pat] of [["architecture", /Architecture/], ["dependencies", /Dependency/], ["compatibility", /Compatibility/], ["security", /Security/], ["migration", /Migration/], ["recovery", /Recovery/], ["rollback", /Rollback/], ["operability", /Operability/], ["phase atomicity and order", /Phase atomicity and order/], ["validators", /Validators/], ["scenario coverage", /Scenario coverage/], ["source evidence", /Source evidence/], ["fix reproduction", /Reproduction/], ["fix root cause", /Root cause/], ["fix regression scope", /Regression scope/], ["fix rollback", /F4 \| Rollback/], ["wrong parent / stale lineage", /descendant lineage|invalidates/]
  ]) {
    assert.ok(pat.test(checks) || pat.test(planChecks), `Engineering checks must cover ${what}`);
  }
  for (const row of ["| F1 | Reproduction |", "| F2 | Root cause |", "| F3 | Regression scope |"]) {
    assert.ok(checks.includes(row), `fix check list must carry the row ${row}`);
  }
  for (const id of ["P1","P2","P3","P4","P5","P6","P7","P8","P9","P10","P11","P12"]) {
    assert.ok(new RegExp(`^\\| ${id} \\|`,`m`).test(checks), `engineering check ${id} must exist as a row id`);
  }
  // fix units never fabricate a Product half
  assert.match(checks + planChecks, /no fake one \(D6\)/);
  assert.match(reviewPlan, /[Ff]ix units? (retain|have) .*no .*fake|never grows a fake one|no fake Product half/i);
});

test("findings union, dismissal, no-progress, and second-cycle diagnosis live in the shared owner", () => {
  assert.equal(/^user-invocable: false$/m.test(policyOwner), true, "pre-execution-review is internal");
  assert.match(policyOwner, /never prints|never (emit|issue)/i);
  for (const [what, pat] of [["union, never majority", /Union, never majority/], ["counter-evidence dismissal", /Dismissal needs counter-evidence|dismissed`? only with/], ["same-model labelling", /same-model/], ["author exclusion", /authorExclusion|Author exclusion/], ["bounded critique/synthesis/arbitration", /critic|synthesizer|arbiter/], ["no quorum", /no quorum|never a vote|no majority/i], ["no-progress", /no-progress/], ["CONVERGENCE-ANOMALY", /CONVERGENCE-ANOMALY/]]) {
    assert.ok(pat.test(policyCycle), `POLICY must state ${what}`);
  }
  assert.match(policyCycle, /CONVERGENCE-ANOMALY — <unit> <spec\|plan>/);
  // the report is mandatory and ordered: before any further edit, never optional
  assert.match(policyCycle, /it is a\n`CONVERGENCE-ANOMALY`: before any further edit, report/);
  assert.doesNotMatch(policyCycle, /CONVERGENCE-ANOMALY[\s\S]{0,40}?optionally/);
  assert.match(policyCycle, /must diagnose its owning root cause|then continue from the owner it names/);
  for (const f of ["Finding ids", "Snapshots", "Missed", "Owning stage", "Route to owner"]) {
    assert.ok(policyCycle.includes(f), `CONVERGENCE-ANOMALY block must report ${f}`);
  }
  // the per-skill files route to the owner instead of duplicating the cycle
  assert.match(designRepair, /Cycle rules have one owner/);
  assert.match(specOutput, /`pre-execution-review\/references\/POLICY\.md` §4/);
  assert.match(planOutput, /`pre-execution-review\/references\/POLICY\.md` §4/);
});

test("batch repair, wording-only rule, and causal revert apply to the plan stage too", () => {
  assert.match(planOutput, /one batch over this whole set|one root-caused repair batch/);
  assert.match(policyCycle, /Wording-only/);
  assert.match(policyCycle, /intent, obligation identity, phase topology, validators, and authority/);
  assert.match(policyCycle, /evidence records that determination|the evidence/);
  // revert is a new authoring event: new revision id keeps old PASS stale
  assert.match(grounding + groundingRows + groundingReadiness + designRepair + scaffoldProcess, /revert is (a write|an authoring event)|a revert is a write/i);
  assert.match(scaffoldProcess, /A later revert to these same bytes is a new/);
  assert.match(planChecks, /invalidates this receipt and its whole descendant lineage/);
});

test("issue-derived and cross-stage exports are refused at the plan boundary", () => {
  // from-issue stops after the Product half; it never plans or executes
  assert.match(fromIssue, /\/review-spec/);
  assert.ok(!/\/plan-feature-scaffold|plan-feature-scaffold in the same turn/.test(fromIssue) || /never composes Engineering planning|stop after/.test(fromIssue));
  // an obligation cannot be exported to an issue to look closed
  assert.ok(squash1(policyLedgers).includes("deferring work out of the unit requires a governing-SPEC amendment first"), "deferred needs a user amendment");
  assert.match(planChecks, /no `deferred` without a user-amended governing SPEC/);
  assert.match(planOutput, /`class: product`/);
  // review-plan never substitutes a candidate review or self-approves its own plan
  assert.match(reviewPlan, /candidate `ReviewReceipt`|never substitutes a candidate review/i);
  assert.match(planFeature, /never reviews (its own plan|the plan it just wrote)/);
});

test("P3 skills are registered, distributed, and routed", () => {
  const pluginSkills = plugin.skills.map((entry) => entry.replace("./skills/", ""));
  for (const skill of ["review-plan", "pre-execution-review"]) {
    assert.ok(pluginSkills.includes(skill), `${skill} must be in plugin.json`);
    assert.ok(skillsSh.groupings.flatMap((g) => g.skills).includes(skill), `${skill} must be grouped in skills.sh.json`);
    assert.ok(fs.existsSync(path.join(repoRoot, `skills/${skill}/SKILL.md`)));
    assert.doesNotMatch(read(`skills/${skill}/SKILL.md`), /^metadata:\n  internal: true$/m, `${skill} must stay discoverable`);
  }
  assert.equal(/^user-invocable: true$/m.test(reviewPlan), true, "review-plan is a menu entry");
  assert.match(routing, /^review-plan:\n  model: opus\n  effort: high$/m);
  assert.doesNotMatch(routing, /^pre-execution-review:$/m, "the shared policy owner carries no route of its own");
  assert.deepEqual(pluginSkills, [...pluginSkills].sort(), "plugin skills stay alphabetical");
});

test("each P3 entrypoint routes to its references and stays one-hop", () => {
  const routes = [
    ["review-plan", reviewPlan, ["CHECKS.md", "ENG-CHECKS.md", "OUTPUT.md"]],
    ["pre-execution-review", policyOwner, ["POLICY.md", "LEDGERS.md", "SNAPSHOT.md"]],
  ];
  for (const [skill, body, allowed] of routes) {
    const linked = [...new Set([...body.matchAll(/\(references\/([^)]+\.md)\)/g)].map((m) => m[1]))].sort();
    assert.deepEqual(linked, [...allowed].sort(), `${skill} must route exactly to its allowed references`);
    for (const link of allowed) {
      assert.ok(fs.existsSync(path.join(repoRoot, "skills", skill, "references", link)), `${skill}/${link} must exist`);
    }
  }
  // a skill routes to another skill only through its SKILL.md, never its references
  for (const file of ["skills/review-plan/references/CHECKS.md", "skills/review-plan/references/OUTPUT.md", "skills/review-plan/references/ENG-CHECKS.md", "skills/pre-execution-review/references/POLICY.md", "skills/pre-execution-review/references/LEDGERS.md", "skills/pre-execution-review/references/SNAPSHOT.md", "skills/plan-feature-scaffold/references/SCAFFOLD_PROCESS.md", "skills/design-feature/references/REPAIR.md", "skills/review-spec/references/OUTPUT.md"]) {
    const body = read(file);
    assert.ok(!/\]\(\.\.\/\.\.\/[a-z-]+\/references\//.test(body), `${file} must not deep-link another skill's reference`);
    assert.ok(!/\]\((?:\.\.\/)?references\//.test(body), `${file} must not nest a reference link`);
  }
});

test("plan-stage receipt records parent lineage and the three verdicts verbatim", () => {
  assert.match(planOutput, /## Pre-execution review receipt v1 — plan/);
  assert.match(planOutput, /Parent SPEC snapshot: <64-hex> · Parent Product receipt: <receipt-id/);
  assert.match(planOutput, /Parent note: fix unit — no Product half exists \(D6\)/);
  for (const v of PLAN_VERDICTS) assert.ok(planOutput.includes(v) || planOutput.toLowerCase().includes(v.toLowerCase()), `OUTPUT must render ${v}`);
  assert.match(planOutput, /execute-phase|review-plan/);
  assert.match(reviewPlan, /PLAN-REVIEW-PASS \|\nPLAN-REVIEW-FAIL|PLAN-REVIEW-FAIL \|/);
  assert.match(reviewPlan, /Three verdicts only/);
});

// --- P4: routing enforcement (mirrors workflow-status step 6a, execute-phase's
// pre-execution gate, ship-roadmap's stage order, and loop-review-fold's split) ---

const sensorDoc = read("skills/workflow-status/references/PRE_EXECUTION.md");
const execGate = read("skills/execute-phase/references/PRE_EXECUTION_GATE.md");
const advance = read("skills/ship-roadmap/references/ADVANCE.md");
const loopFold = read("skills/loop-review-fold/SKILL.md");
const classify = read("skills/review-implementation/references/CLASSIFY.md");
const auditGates = read("skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md");
const descope = read("skills/execute-phase/references/DESCOPE.md");
const legacyAdoption = read("skills/pre-execution-review/references/POLICY.md");

// The sensor's label table, as code: one label per stage, from bytes only.
const receiptLabel = (receipt, stage, legacy = false) => {
  if (legacy && !receipt) return "legacy";
  if (!receipt) return "missing";
  if (receipt.stage !== stage) return "wrong-stage";
  if (receipt.kind === "readiness") return "author-readiness";
  if (receipt.kind === "substitute") return "substitute";
  if (receipt.recordedBy === receipt.authoredBy) return "self-approved";
  if (receipt.boundDigest !== receipt.observedDigest) return "stale";
  if (!PASS_VERDICTS.includes(receipt.verdict)) return "missing";
  return "current";
};
const PASS_VERDICTS = ["SPEC-REVIEW-PASS", "PLAN-REVIEW-PASS"];

// workflow-status step 6/6a: the label overrides the status-only command.
const sensorRoute = ({ status, depsMet = true, spec, plan, legacy = false }) => {
  if (!depsMet) return { bucket: "blocked_units", next: null };
  if (status === "idea") return { bucket: "design_candidates", next: "/design-feature <slug>" };
  const specLabel = receiptLabel(spec, "spec", legacy && status === "defined");
  if (status === "defined") {
    return specLabel === "current"
      ? { bucket: "startable_now", next: "/plan-feature <slug>" }
      : { bucket: "gate", next: "/review-spec <slug>", label: specLabel };
  }
  const planLabel = receiptLabel(plan, "plan", legacy);
  return planLabel === "current"
    ? { bucket: "startable_now", next: "/execute-phase <NN>" }
    : { bucket: "gate", next: "/review-plan <NN>", label: planLabel };
};

// execute-phase's gate: only a current plan PASS admits an edit; --force never reaches it.
const executeAdmits = ({ plan, legacy = false }) =>
  receiptLabel(plan, "plan", legacy) === "current" ? "EDIT" : "PRE-EXECUTION GATE BLOCKED";

// ship-roadmap's stage order.
const NEXT_STAGE = {
  idea: "DESIGN", defined: "REVIEW-SPEC", planned: "REVIEW-PLAN", "in-progress": "EXECUTE",
};
const autopilotStage = ({ status, spec, plan, legacy = false }) => {
  if (status === "idea") return "DESIGN";
  if (status === "defined") {
    return receiptLabel(spec, "spec") === "current" ? "PLAN" : "REVIEW-SPEC";
  }
  if (status === "planned") {
    return receiptLabel(plan, "plan", legacy) === "current" ? "EXECUTE" : "REVIEW-PLAN";
  }
  return NEXT_STAGE[status] ?? "EXECUTE";
};

// loop-review-fold: split the open queue by owning stage before folding.
const foldRoute = (findings, cycle = 1) => {
  const owners = new Set(findings.map((f) => f.owner));
  if (owners.has("plan")) return "BLOCKED → /plan-feature <unit> + /review-plan <unit>";
  if (owners.has("product")) return "BLOCKED → /design-feature <unit> + /review-spec <unit>";
  if (cycle > 1) return "CONVERGENCE-ANOMALY before any further edit";
  return "fold-findings → review-change on the new HEAD";
};

const ok = (v) => ({ stage: "plan", verdict: "PLAN-REVIEW-PASS", boundDigest: v ?? "d1", observedDigest: v ?? "d1", recordedBy: "reviewer", authoredBy: "author" });
const okSpec = (v) => ({ ...ok(v), stage: "spec", verdict: "SPEC-REVIEW-PASS" });

test("route fixtures: current, stale and missing receipts select exactly one command each", () => {
  assert.deepEqual(
    { ...sensorRoute({ status: "planned", plan: ok() }), admitted: executeAdmits({ plan: ok() }) },
    { bucket: "startable_now", next: "/execute-phase <NN>", admitted: "EDIT" });
  for (const [label, plan] of [
    ["missing", null],
    ["stale", ok("d1") && { ...ok(), observedDigest: "d2" }],
    ["wrong-stage", okSpec()],
    ["self-approved", { ...ok(), recordedBy: "author" }],
    ["author-readiness", { ...ok(), kind: "readiness" }],
    ["substitute", { ...ok(), kind: "substitute" }],
  ]) {
    const routed = sensorRoute({ status: "planned", plan });
    assert.equal(routed.label, label, `${label} must be the label`);
    assert.equal(routed.bucket, "gate", `${label} is not startable`);
    assert.equal(routed.next, "/review-plan <NN>", `${label} re-runs the review, never the author`);
    assert.equal(executeAdmits({ plan }), "PRE-EXECUTION GATE BLOCKED", `${label} never admits an edit`);
  }
  // a defined unit without a current spec PASS plans nothing
  assert.equal(sensorRoute({ status: "defined", spec: null }).next, "/review-spec <slug>");
  assert.equal(sensorRoute({ status: "defined", spec: okSpec() }).next, "/plan-feature <slug>");
  // deps unmet outrank every receipt
  assert.equal(sensorRoute({ status: "planned", depsMet: false, plan: ok() }).bucket, "blocked_units");
});

test("route fixtures: feature and fix paths, and the autopilot stage order", () => {
  assert.equal(autopilotStage({ status: "idea" }), "DESIGN");
  assert.equal(autopilotStage({ status: "defined", spec: null }), "REVIEW-SPEC");
  assert.equal(autopilotStage({ status: "defined", spec: okSpec() }), "PLAN");
  assert.equal(autopilotStage({ status: "planned", plan: null }), "REVIEW-PLAN");
  assert.equal(autopilotStage({ status: "planned", plan: ok() }), "EXECUTE");
  assert.match(advance, /\[DESIGN → REVIEW-SPEC\] → PLAN → REVIEW-PLAN → EXECUTE/);
  assert.match(advance, /plan-fix → REVIEW-PLAN → EXECUTE[\s\S]{0,4}\(`--fix`\)/);
  assert.match(read("skills/ship-roadmap/references/RECOVERY_AND_SELECTION.md"), /`plan-fix` → REVIEW-PLAN → EXECUTE/);
  // fix units: reviewed on their own receipt, with no Product hop to substitute
  const fixPlan = { ...ok(), unit: "fix-12" };
  assert.equal(executeAdmits({ plan: fixPlan }), "EDIT");
  assert.equal(executeAdmits({ plan: okSpec() }), "PRE-EXECUTION GATE BLOCKED");
  assert.match(execGate, /there is no Product hop to substitute/);
  assert.match(execGate, /no bypass flag exists for this gate/);
  assert.match(execGate, /--force/);
});

test("route fixtures: later review root causes, crash re-entry, and no-progress", () => {
  assert.equal(foldRoute([{ owner: "source" }]), "fold-findings → review-change on the new HEAD");
  assert.match(foldRoute([{ owner: "plan" }]), /\/plan-feature <unit> \+ \/review-plan <unit>/);
  assert.match(foldRoute([{ owner: "product" }]), /\/design-feature <unit> \+ \/review-spec <unit>/);
  assert.equal(foldRoute([{ owner: "source" }], 2), "CONVERGENCE-ANOMALY before any further edit");
  // a mixed queue is still owned by the highest stage: source never folds authority away
  assert.match(foldRoute([{ owner: "source" }, { owner: "plan" }]), /BLOCKED/);
  // crash/re-entry: routing is recomputed from persisted evidence, never from memory
  const afterCrash = sensorRoute({ status: "in-progress", plan: ok() });
  assert.equal(afterCrash.next, "/execute-phase <NN>");
  assert.equal(sensorRoute({ status: "in-progress", plan: { ...ok(), observedDigest: "moved" } }).label, "stale");
  assert.match(loopFold, /CONVERGENCE-ANOMALY/);
  assert.match(loopFold, /never send one to `triage-issue` to make it disappear/);
  assert.match(classify, /Owning stage: which artifact is actually wrong/);
  assert.match(legacyAdoption, /### 4\. Repeats: no-progress and convergence/);
});

test("route fixtures: no partial-success envelope and no auto-issued deferral", () => {
  // a FAIL and a PASS cannot both be current for one stage: the sensor labels the
  // newest block, so a stale PASS under a fresh FAIL is never "startable"
  const mixed = sensorRoute({ status: "planned", plan: { ...ok(), verdict: "PLAN-REVIEW-FAIL" } });
  assert.equal(mixed.label, "missing");
  assert.equal(executeAdmits({ plan: { ...ok(), verdict: "PLAN-REVIEW-FAIL" } }), "PRE-EXECUTION GATE BLOCKED");
  // and neither verdict ever arrives from a readiness preflight
  assert.ok(!canEmitReviewPass("readiness"));
  assert.match(sensorDoc, /`next\.recommended` never points a human at `execute-phase` on an unreviewed plan|so `next\.recommended` never points/);
  // obligations cannot be exported to clear a gate
  assert.match(auditGates, /Any `planned`, `in-progress`, blank, or `deferred` row is/);
  assert.match(auditGates, /wearing a new name/);
  assert.match(descope, /obligation-ledger row/);
  assert.match(legacyAdoption, /An automatic forge issue/);
  assert.match(advance, /No stage between PLAN and EXECUTE may create a forge/);
});

test("route fixtures: legacy adoption constructs evidence and never coerces it", () => {
  const legacy = sensorRoute({ status: "planned", plan: null, legacy: true });
  assert.equal(legacy.label, "legacy");
  assert.equal(legacy.next, "/review-plan <NN>");
  assert.equal(executeAdmits({ plan: null, legacy: true }), "PRE-EXECUTION GATE BLOCKED");
  assert.match(legacyAdoption, /### 6\. Legacy adoption/);
  assert.match(legacyAdoption, /Construct, never coerce/);
  assert.match(legacyAdoption, /byte-identical/);
  assert.match(execGate, /adopt through `pre-execution-review`'s legacy rule/);
  assert.match(sensorDoc, /it never edits a unit to make the\nlabel disappear/);
});

test("P4 route contracts are pinned to the text that grants them", () => {
  // the sensor's label vocabulary is exhaustive and overrides status-only routing
  for (const label of ["`current`", "`missing`", "`stale`", "`wrong-stage`", "`substitute`",
    "`self-approved`", "`author-readiness`", "`legacy`"]) {
    assert.ok(sensorDoc.includes(label), `sensor must define the ${label} label`);
  }
  // the sensor doc states the routing table; the core declares the override
  assert.match(sensorDoc, /A stale receipt re-runs the \*\*review\*\*, not the authoring skill/);
  assert.match(read("skills/workflow-status/references/SENSOR_CORE.md"), /label \*\*overrides step 6's/);
  // the loop blocks on ownership instead of folding it away
  assert.match(loopFold, /A `plan`-owned row stops the loop with `BLOCKED`/);
  assert.match(loopFold, /a `product`-owned row goes to `\/design-feature <unit>`/);
  assert.match(loopFold, /The loop files nothing/);
  // the audit turns an open obligation into a blocker, not a note
  assert.match(auditGates, /row is\n   \*\*BLOCKED\*\*, naming the ids/);
  assert.match(auditGates, /may not be exported to a follow-up issue to clear the/);
  assert.match(auditGates, /remains the only emitter of `MERGE-READY`/);
  // execution admits an edit only on the PASS, in fix mode on its own receipt
  assert.match(execGate, /require\n`PLAN-REVIEW-PASS`|require[\s\S]{0,40}`PLAN-REVIEW-PASS`/);
});

test("P4 routing text keeps one owner per rule", () => {
  // the adoption rule lives once; the sensor and the executor cite it
  const owners = ["skills/pre-execution-review/references/POLICY.md", "skills/workflow-status/references/PRE_EXECUTION.md", "skills/execute-phase/references/PRE_EXECUTION_GATE.md"]
    .filter((f) => /Construct, never coerce/.test(read(f)));
  assert.deepEqual(owners, ["skills/pre-execution-review/references/POLICY.md"]);
  // the sensor must not re-implement the executor's gate and vice versa
  assert.ok(!/no bypass flag exists for this gate/.test(sensorDoc));
  assert.ok(!/startable_now/.test(execGate));
  // the loop names owners, it does not redefine repair classes
  assert.match(loopFold, /`pre-execution-review` owns|defined by\s*\n?`pre-execution-review`|report the convergence diagnosis|report the\n`CONVERGENCE-ANOMALY` report defined by\n`pre-execution-review`/);
  assert.ok(!/Common root cause/.test(loopFold), "repair-class table stays in the policy owner");
});


console.log("PASS pre-execution quality: grounding, Product/Plan readiness, review-spec, review-plan, ledgers, shared policy, gates, repair, routing, distribution");
