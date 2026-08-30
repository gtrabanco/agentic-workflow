// Feature 28 P1 — public-entry suite for PreExecutionReviewReceipt v1 (AC1, AC7).
//
// Proves the closed verdict vocabulary and its stage compatibility matrix, the
// bounded structured finding shape, opaque identities, UTC timestamps, the bounded
// parent topology with NO quorum semantics, and every refusal the authoritative
// receipt-against-snapshot entry owns.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRE_EXECUTION_FINDING_CLASSES,
  PRE_EXECUTION_FINDING_RESOLUTIONS,
  PRE_EXECUTION_FINDING_SEVERITIES,
  PRE_EXECUTION_FINDING_VERIFICATION,
  PRE_EXECUTION_LIMITS,
  PRE_EXECUTION_PARENT_ROLES,
  PRE_EXECUTION_RECEIPT_CONTRACT_ID,
  PRE_EXECUTION_REVIEW_ROLES,
  PRE_EXECUTION_VERDICTS,
  buildPreExecutionArtifactSnapshot,
  digestPreExecutionArtifactSnapshot,
  validatePreExecutionReceiptAgainstSnapshot,
  validatePreExecutionReviewReceiptV1,
} from "../dist/index.js";
import {
  DIGEST_A,
  POLICY_VERSION,
  SHA1,
  UNIT_ID,
  boundSpec,
  finding,
  receiptFor,
  toySpec,
} from "./fixtures/pre-execution-documents.mjs";

const codes = (r) => r.diagnostics.map((d) => d.code);
const rows = (r) => JSON.stringify(r.diagnostics);
const ok = (v) => validatePreExecutionReviewReceiptV1(v);
const structural = (overrides) => ok(receiptFor(null, overrides));

// ---------------------------------------------------------------------------
// Published vocabulary
// ---------------------------------------------------------------------------

test("receipt vocabularies are frozen and closed", () => {
  assert.deepEqual([...PRE_EXECUTION_VERDICTS], [
    "spec-review-pass", "spec-review-fail",
    "plan-review-pass", "plan-review-fail", "needs-design",
  ]);
  assert.deepEqual([...PRE_EXECUTION_FINDING_CLASSES], ["product", "plan", "source", "environment", "runtime"]);
  assert.deepEqual([...PRE_EXECUTION_FINDING_VERIFICATION], ["verified", "unverified"]);
  assert.deepEqual([...PRE_EXECUTION_FINDING_RESOLUTIONS], ["open", "resolved", "dismissed"]);
  assert.deepEqual([...PRE_EXECUTION_PARENT_ROLES], ["critic", "synthesis", "arbitration"]);
  assert.deepEqual([...PRE_EXECUTION_REVIEW_ROLES], ["reviewer", "critic", "synthesizer", "arbiter"]);
  assert.deepEqual([...PRE_EXECUTION_FINDING_SEVERITIES], ["info", "low", "medium", "high", "critical"]);
  for (const list of [PRE_EXECUTION_VERDICTS, PRE_EXECUTION_FINDING_SEVERITIES,
    PRE_EXECUTION_FINDING_CLASSES, PRE_EXECUTION_FINDING_VERIFICATION,
    PRE_EXECUTION_FINDING_RESOLUTIONS, PRE_EXECUTION_REVIEW_ROLES, PRE_EXECUTION_PARENT_ROLES]) {
    assert.equal(Object.isFrozen(list), true);
  }
});

test("a minimal PASS receipt validates and normalizes to a copy", () => {
  const submitted = receiptFor(null);
  const result = ok(submitted);
  assert.equal(result.ok, true, rows(result));
  assert.notEqual(result.receipt, submitted);
  assert.equal(result.receipt.verdict, "spec-review-pass");
});

test("an unknown contract id — including the candidate and verification families — is refused", () => {
  for (const contract of [
    "agentic-workflow/review-receipt@1",
    "agentic-workflow/verification-receipt@1",
    "agentic-workflow/pre-execution-review-receipt@2",
  ]) {
    const result = structural({ contract });
    assert.equal(result.ok, false);
    assert.ok(codes(result).includes("invalid-value"), `${contract} refused`);
  }
});

// ---------------------------------------------------------------------------
// The stage/verdict matrix
// ---------------------------------------------------------------------------

test("the verdict/stage matrix is closed: spec verdicts need the spec stage and vice versa", () => {
  const matrix = [
    ["spec", "spec-review-pass", true],
    ["spec", "spec-review-fail", true],
    ["spec", "needs-design", true],
    ["spec", "plan-review-pass", false],
    ["spec", "plan-review-fail", false],
    ["plan", "plan-review-pass", true],
    ["plan", "plan-review-fail", true],
    ["plan", "needs-design", true],
    ["plan", "spec-review-pass", false],
    ["plan", "spec-review-fail", false],
  ];
  for (const [stage, verdict, expected] of matrix) {
    const result = structural({ stage, verdict });
    assert.equal(result.ok, expected, `stage=${stage} verdict=${verdict} → ${expected}`);
    if (!expected) assert.ok(codes(result).includes("invalid-stage"), `${verdict} names a stage error`);
  }
});

// ---------------------------------------------------------------------------
// Findings
// ---------------------------------------------------------------------------

test("findings carry the full bounded structure and unique stable ids", () => {
  const open = finding();
  assert.equal(structural({ verdict: "spec-review-fail", findings: [open] }).ok, true,
    rows(structural({ verdict: "spec-review-fail", findings: [open] })));

  const duplicated = structural({ verdict: "spec-review-fail", findings: [open, { ...open }] });
  assert.equal(duplicated.ok, false, "duplicate ids");
  assert.ok(codes(duplicated).includes("duplicate-id"));

  for (const [field, value] of [
    ["severity", "blocker"], ["class", "style"], ["verification", "maybe"], ["resolution", "wontfix"],
  ]) {
    const result = structural({ verdict: "spec-review-fail", findings: [{ ...open, [field]: value }] });
    assert.ok(codes(result).includes("invalid-value"),
      `${field}=${value} is outside the closed vocabulary · ${rows(result)}`);
  }

  assert.ok(codes(structural({
    verdict: "spec-review-fail",
    findings: [{ ...open, evidenceRefs: [] }],
  })).includes("invalid-evidence"), "a finding without an evidence reference is not a finding");
});

test("counter-evidence is the only dismissal route, and it must be recorded", () => {
  const dismissed = finding({ id: "F-1", severity: "medium", class: "plan", resolution: "dismissed" });
  const noCounter = structural({ verdict: "spec-review-fail", findings: [dismissed] });
  assert.equal(noCounter.ok, false);
  assert.ok(codes(noCounter).includes("invalid-evidence"), "an unrecorded dismissal is a silenced finding");

  const withCounter = structural({
    verdict: "spec-review-fail",
    findings: [{ ...dismissed, resolutionEvidence: "SPEC.md:412 states the failure state explicitly." }],
  });
  assert.equal(withCounter.ok, true, rows(withCounter));
});

// ---------------------------------------------------------------------------
// Parent topology
// ---------------------------------------------------------------------------

test("parent receipts are bounded, role-closed, digest-shaped, and unique", () => {
  const parents = (n, role = "critic") => Array.from({ length: n }, (_, i) => ({
    role, receiptDigest: i.toString(16).padStart(64, "0"),
  }));
  assert.equal(structural({ parentReceipts: parents(3) }).ok, true,
    rows(structural({ parentReceipts: parents(3) })));
  assert.ok(codes(structural({ parentReceipts: parents(PRE_EXECUTION_LIMITS.parentReceipts + 1) }))
    .includes("limit-exceeded"));
  assert.equal(structural({ parentReceipts: [{ role: "judge", receiptDigest: DIGEST_A }] }).ok, false,
    "there is no judge role in the vocabulary");
  assert.equal(structural({ parentReceipts: [{ role: "critic", receiptDigest: "nope" }] }).ok, false);
  assert.ok(codes(structural({
    parentReceipts: [
      { role: "critic", receiptDigest: DIGEST_A },
      { role: "synthesis", receiptDigest: DIGEST_A },
    ],
  })).includes("duplicate-id"), "two rows naming one parent receipt are a topology error");
});

// ---------------------------------------------------------------------------
// Timestamps and identities
// ---------------------------------------------------------------------------

test("timestamps are UTC, calendar-valid, and ordered", () => {
  assert.equal(structural({ startedAt: "2026-08-30T00:05:01Z" }).ok, false, "finished before started");
  assert.equal(structural({ startedAt: "2026-08-30 00:00:00Z" }).ok, false, "not ISO-8601");
  assert.equal(structural({ startedAt: "2026-02-30T00:00:00Z" }).ok, false, "no such calendar day");
  assert.equal(structural({ startedAt: "2026-08-30T00:00:00+02:00" }).ok, false, "UTC only");
  assert.equal(structural({ startedAt: "2026-08-30T00:00:00.500Z" }).ok, true,
    rows(structural({ startedAt: "2026-08-30T00:00:00.500Z" })));
});

test("opaque identities are bounded and never validated as content", () => {
  for (const field of ["reviewer", "sessionId", "authorId", "id"]) {
    assert.equal(structural({ [field]: "" }).ok, false, `${field} non-empty`);
    assert.equal(structural({ [field]: "z".repeat(PRE_EXECUTION_LIMITS.idChars) }).ok, true,
      `${field} at the ceiling`);
    assert.equal(structural({ [field]: "z".repeat(PRE_EXECUTION_LIMITS.idChars + 1) }).ok, false,
      `${field} past the ceiling`);
  }
  for (const bad of ["reviewer name", "x".repeat(200), "\u0000"]) {
    assert.equal(structural({ reviewer: bad }).ok, false,
      `an identity is transport-safe: ${JSON.stringify(bad)} is refused`);
  }
});

// ---------------------------------------------------------------------------
// The authoritative receipt-against-snapshot entry (the PASS authority)
// ---------------------------------------------------------------------------

async function currentPair() {
  const built = boundSpec();
  assert.equal(built.ok, true, rows(built));
  const snapshot = built.snapshot;
  const receipt = receiptFor(snapshot, {
    snapshotDigest: await digestPreExecutionArtifactSnapshot(snapshot),
  });
  return { snapshot, receipt };
}

test("a PASS bound to the exact current snapshot is accepted", async () => {
  const { snapshot, receipt } = await currentPair();
  const result = await validatePreExecutionReceiptAgainstSnapshot(receipt, snapshot, POLICY_VERSION);
  assert.equal(result.ok, true, rows(result));
});

test("a PASS carrying an open or unverified material finding is refused", async () => {
  const { snapshot } = await currentPair();
  const cases = [
    ["open", finding({ severity: "medium", verification: "verified", resolution: "open" })],
    ["unverified", finding({ severity: "high", verification: "unverified", resolution: "resolved",
      resolutionEvidence: "fixed in rev-0002" })],
  ];
  for (const [label, row] of cases) {
    const { receipt } = await currentPair();
    const result = await validatePreExecutionReceiptAgainstSnapshot(
      { ...receipt, findings: [row] }, snapshot, POLICY_VERSION,
    );
    assert.equal(result.ok, false, `PASS with a ${label} finding must not stand`);
    assert.ok(codes(result).includes("verdict-mismatch"), `${label} → verdict-mismatch · ${rows(result)}`);
  }
});

test("an info-severity finding never blocks a PASS on its own merits", async () => {
  const { snapshot, receipt } = await currentPair();
  const result = await validatePreExecutionReceiptAgainstSnapshot({
    ...receipt,
    findings: [finding({ severity: "info", class: "source", resolution: "resolved",
      resolutionEvidence: "confirmed unchanged" })],
  }, snapshot, POLICY_VERSION);
  assert.equal(result.ok, true, rows(result));
});

test("a FAIL verdict may report freely, including a contaminated context", async () => {
  const { snapshot, receipt } = await currentPair();
  const failing = await validatePreExecutionReceiptAgainstSnapshot(
    { ...receipt, verdict: "spec-review-fail", contextClean: false, findings: [finding()] },
    snapshot,
    POLICY_VERSION,
  );
  assert.equal(failing.ok, true, rows(failing), "a contaminated reviewer may still report findings");
});

test("a wrong stage, a wrong snapshot digest, or a foreign receipt is refused", async () => {
  const { snapshot, receipt } = await currentPair();

  const wrongStage = await validatePreExecutionReceiptAgainstSnapshot(
    { ...receipt, stage: "plan", verdict: "plan-review-pass" }, snapshot, POLICY_VERSION,
  );
  assert.equal(wrongStage.ok, false);
  assert.ok(codes(wrongStage).includes("invalid-stage"), rows(wrongStage));

  const wrongDigest = await validatePreExecutionReceiptAgainstSnapshot(
    { ...receipt, snapshotDigest: "f".repeat(64) }, snapshot, POLICY_VERSION,
  );
  assert.equal(wrongDigest.ok, false);
  assert.ok(codes(wrongDigest).includes("stale-snapshot"), rows(wrongDigest));

  const stalePolicy = await validatePreExecutionReceiptAgainstSnapshot(receipt, snapshot, "2026-09-01");
  assert.ok(codes(stalePolicy).includes("stale-policy"), "a PASS under a superseded policy is not current");

  // A Plan snapshot is a different review target: a SPEC receipt cannot bless it,
  // even though both documents validate on their own.
  const planBuilt = buildPlanFromToySpec();
  assert.equal(planBuilt.ok, true, rows(planBuilt));
  const crossStage = await validatePreExecutionReceiptAgainstSnapshot(
    receipt, planBuilt.snapshot, POLICY_VERSION,
  );
  assert.equal(crossStage.ok, false, "a SPEC receipt does not bind a Plan snapshot");
});

function buildPlanFromToySpec() {
  return buildPreExecutionArtifactSnapshot({
    stage: "plan",
    unitKind: "feature",
    unitId: UNIT_ID,
    sourceRevision: SHA1,
    artifactRevisionId: "rev-0002",
    parentSpecSnapshotDigest: DIGEST_A,
    files: [
      { kind: "spec", path: `docs/features/${UNIT_ID}/SPEC.md`, content: toySpec() },
      { kind: "acceptance", path: `docs/features/${UNIT_ID}/ACCEPTANCE.md`, content: "# Acceptance\n" },
    ],
    contexts: [],
  });
}

test("author exclusion is enforced exactly where declared enforceable", async () => {
  const { snapshot, receipt } = await currentPair();
  const reused = await validatePreExecutionReceiptAgainstSnapshot(
    { ...receipt, authorId: receipt.reviewer }, snapshot, POLICY_VERSION,
  );
  assert.equal(reused.ok, false, "an enforcing runtime cannot bless self-approval");
  assert.ok(codes(reused).includes("invalid-author"), rows(reused));

  const notEnforceable = await validatePreExecutionReceiptAgainstSnapshot(
    { ...receipt, authorId: receipt.reviewer, authorExclusion: "not-enforceable" }, snapshot, POLICY_VERSION,
  );
  assert.equal(notEnforceable.ok, true, "a manual workflow records the limit instead of lying about it");

  const dirtyClaim = await validatePreExecutionReceiptAgainstSnapshot(
    { ...receipt, contextClean: false }, snapshot, POLICY_VERSION,
  );
  assert.ok(codes(dirtyClaim).includes("invalid-context"), rows(dirtyClaim));
});

test("model diversity is a truthful label, never a threshold", async () => {
  const { snapshot, receipt } = await currentPair();
  for (const label of ["same-model", "cross-model", "not-applicable"]) {
    const result = await validatePreExecutionReceiptAgainstSnapshot(
      { ...receipt, modelDiversity: label }, snapshot, POLICY_VERSION,
    );
    assert.equal(result.ok, true, `${label} PASS is allowed on its own merits · ${rows(result)}`);
  }
  assert.equal(structural({ modelDiversity: "majority" }).ok, false,
    "there is no majority label to launder a vote through");
});

test("no quorum exists: one unresolved material finding survives any parent topology", async () => {
  const { snapshot, receipt } = await currentPair();
  const crowded = {
    ...receipt,
    findings: [finding({ severity: "critical" })],
    reviewerRole: "arbiter",
    parentReceipts: [
      { role: "critic", receiptDigest: "1".repeat(64) },
      { role: "critic", receiptDigest: "2".repeat(64) },
      { role: "synthesis", receiptDigest: "3".repeat(64) },
      { role: "arbitration", receiptDigest: "4".repeat(64) },
    ],
  };
  const result = await validatePreExecutionReceiptAgainstSnapshot(crowded, snapshot, POLICY_VERSION);
  assert.equal(result.ok, false, "votes never erase a material finding");
  assert.ok(codes(result).includes("verdict-mismatch"), rows(result));

  const cleanArbiter = await validatePreExecutionReceiptAgainstSnapshot(
    { ...crowded, findings: [] }, snapshot, POLICY_VERSION,
  );
  assert.equal(cleanArbiter.ok, true, "the same topology is legal when nothing is open · " + rows(cleanArbiter));
});

test("an invalid parent topology is refused by the authoritative entry", async () => {
  const { snapshot, receipt } = await currentPair();
  const bad = {
    ...receipt,
    reviewerRole: "reviewer",
    parentReceipts: [{ role: "critic", receiptDigest: "1".repeat(64) }],
  };
  const result = await validatePreExecutionReceiptAgainstSnapshot(bad, snapshot, POLICY_VERSION);
  assert.equal(result.ok, false, "a plain reviewer cannot claim critic parents");
  assert.ok(codes(result).includes("invalid-topology"), rows(result));
});

test("diagnostics stay bounded and redacted for hostile receipts", async () => {
  const { snapshot } = await currentPair();
  const hostile = receiptFor(null, {
    findings: Array.from({ length: PRE_EXECUTION_LIMITS.findings + 10 }, (_, i) => ({
      id: `F-${i}`, severity: "critical", class: "product",
      claim: "x".repeat(PRE_EXECUTION_LIMITS.claimChars + 100),
      evidenceRefs: ["a:1"], verification: "unverified", resolution: "open", resolutionEvidence: null,
    })),
    diagnostics: Array.from({ length: 500 }, (_, i) => `leak-${i}`),
  });
  const structuralResult = ok(hostile);
  assert.equal(structuralResult.ok, false);
  assert.ok(structuralResult.diagnostics.length <= PRE_EXECUTION_LIMITS.diagnostics);
  assert.equal(JSON.stringify(structuralResult).includes("leak-1"), false, "submitted strings are never echoed");

  const result = await validatePreExecutionReceiptAgainstSnapshot(hostile, snapshot, POLICY_VERSION);
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.length <= PRE_EXECUTION_LIMITS.diagnostics);
});

test("a structurally invalid receipt never reaches semantic PASS", async () => {
  const { snapshot, receipt } = await currentPair();
  const result = await validatePreExecutionReceiptAgainstSnapshot(
    { ...receipt, unknownField: 1 }, snapshot, POLICY_VERSION,
  );
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes("unknown-field"), rows(result));
});

test("a snapshot that is not a snapshot cannot be blessed", async () => {
  const { receipt } = await currentPair();
  for (const junk of [null, 0, "x", [], specLikeButBroken()]) {
    const result = await validatePreExecutionReceiptAgainstSnapshot(junk, receipt, POLICY_VERSION);
    assert.equal(result.ok, false, `${String(junk)} refused`);
  }
});

function specLikeButBroken() {
  return { contract: PRE_EXECUTION_RECEIPT_CONTRACT_ID };
}
