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
  assert.match(designRepair, /before any further edit, report/);
  assert.match(designRepair, /never a way to earn a PASS/);
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

console.log("PASS pre-execution quality: grounding, Product readiness, review-spec, gates, repair, distribution");
