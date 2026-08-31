// Feature 28 P1 — suite for lineage, freshness precedence, causal revision
// rotation, and the substitute-rejection boundary (AC2).
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRE_EXECUTION_FRESHNESS_CODES,
  PRE_EXECUTION_RECEIPT_CONTRACT_ID,
  buildPreExecutionArtifactSnapshot,
  comparePreExecutionReceiptToSnapshot,
  digestPreExecutionArtifactSnapshot,
} from "../dist/index.js";
import {
  DIGEST_A,
  PARENT,
  POLICY_VERSION,
  SHA1,
  UNIT_ID,
  planInput,
  receiptFor,
  specInput,
  toySpec,
} from "./fixtures/pre-execution-documents.mjs";

const builtSpec = (rev = "rev-1", overrides = {}) =>
  buildPreExecutionArtifactSnapshot(specInput({ ...overrides, artifactRevisionId: rev }));
const builtPlan = (rev = "rev-1", overrides = {}) =>
  buildPreExecutionArtifactSnapshot(planInput(overrides.parentSpecSnapshotDigest ?? PARENT,
    { ...overrides, artifactRevisionId: rev }));

async function receiptBound(snapshot, overrides = {}) {
  return receiptFor(snapshot, {
    snapshotDigest: await digestPreExecutionArtifactSnapshot(snapshot),
    ...overrides,
  });
}

function mustBuild(result) {
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics ?? null));
  return result.snapshot;
}

test("the freshness vocabulary is closed, frozen, and answers alone", async () => {
  for (const code of ["stale-artifact-revision", "stale-artifact-content", "stale-context",
    "stale-source-revision", "stale-parent", "stale-policy", "missing-receipt-snapshot",
    "invalid-stage", "invalid-unit"]) {
    assert.ok(PRE_EXECUTION_FRESHNESS_CODES.includes(code), `${code} missing`);
  }
  assert.equal(Object.isFrozen(PRE_EXECUTION_FRESHNESS_CODES), true);
  const snapshot = mustBuild(builtSpec());
  const receipt = await receiptBound(snapshot);
  assert.deepEqual(await comparePreExecutionReceiptToSnapshot(receipt, snapshot, snapshot, POLICY_VERSION),
    { fresh: true }, "the fresh answer carries no reason code");
});

test("stage or unit identity mismatch is refused before any content comparison", async () => {
  const specSide = mustBuild(builtSpec());
  const planSide = mustBuild(builtPlan());
  const receipt = await receiptBound(specSide);
  assert.equal(
    (await comparePreExecutionReceiptToSnapshot(receipt, specSide, planSide, POLICY_VERSION)).reasonCode,
    "invalid-stage",
  );
  const otherUnit = mustBuild(buildPreExecutionArtifactSnapshot(specInput({ unitId: "different" })));
  assert.equal(
    (await comparePreExecutionReceiptToSnapshot(receipt, specSide, otherUnit, POLICY_VERSION)).reasonCode,
    "invalid-unit",
  );
});

test("every stale dimension answers its own deterministic code", async () => {
  const cases = [
    ["stale-artifact-content", () => builtSpec("rev-1"),
      () => builtSpec("rev-1", {
        files: [{ kind: "spec", path: "docs/toy/SPEC.md", content: toySpec({ Goal: "## Goal\n\nShip the other thing.\n" }) }],
      })],
    ["stale-context", () => builtSpec(),
      () => builtSpec("rev-1", {
        contexts: [{ kind: "architectural-invariants", identifier: "n/a", presence: "absent" }],
      })],
    ["stale-source-revision", () => builtSpec(),
      () => buildPreExecutionArtifactSnapshot(specInput({ sourceRevision: "f".repeat(40) }))],
    ["stale-artifact-revision", () => builtSpec("rev-1"), () => builtSpec("rev-2")],
    ["stale-parent", () => builtPlan(), () => builtPlan("rev-1", { parentSpecSnapshotDigest: "d".repeat(64) })],
  ];
  for (const [code, reviewed, current] of cases) {
    const snapshot = mustBuild(reviewed());
    const receipt = await receiptBound(snapshot);
    const result = await comparePreExecutionReceiptToSnapshot(receipt, snapshot, mustBuild(current()), POLICY_VERSION);
    assert.equal(result.fresh, false, `${code} must be stale`);
    assert.equal(result.reasonCode, code, `${code} answered ${result.reasonCode}`);
  }
});

test("the precedence is fixed: policy before context before source before revision", async () => {
  const snapshot = mustBuild(builtSpec());
  const receipt = await receiptBound(snapshot);
  const everything = mustBuild(buildPreExecutionArtifactSnapshot(specInput({
    artifactRevisionId: "rev-9",
    sourceRevision: "e".repeat(40),
    contexts: [],
    files: [{ kind: "spec", path: "docs/toy/SPEC.md", content: `${toySpec()}extra` }],
  })));
  const result = await comparePreExecutionReceiptToSnapshot(receipt, snapshot, everything, "different-policy");
  assert.equal(result.reasonCode, "stale-policy");
  assert.equal((await comparePreExecutionReceiptToSnapshot(receipt, snapshot, everything, POLICY_VERSION)).reasonCode,
    "stale-context", "context outranks source and revision");
});

test("a receipt bound to a foreign snapshot never reports fresh", async () => {
  const snapshot = mustBuild(builtSpec());
  const receipt = await receiptBound(snapshot);
  const other = mustBuild(builtSpec("rev-2"));
  const result = await comparePreExecutionReceiptToSnapshot(
    { ...receipt, snapshotDigest: "0".repeat(64) }, snapshot, other, POLICY_VERSION,
  );
  assert.equal(result.reasonCode, "missing-receipt-snapshot");
});

test("mutate-then-revert with a rotated revision cannot resurrect a PASS (S6)", async () => {
  const original = mustBuild(builtSpec("rev-1"));
  const receipt = await receiptBound(original);
  // The author edits, then reverts to the identical bytes, rotating the revision.
  const mutated = mustBuild(builtSpec("rev-2", {
    files: [{
      kind: "spec",
      path: "docs/toy/SPEC.md",
      content: toySpec({ "Product half": "## Product half\n\n### Scope\n\n- new\n" }),
    }],
  }));
  const reverted = mustBuild(builtSpec("rev-3"));
  assert.deepEqual(reverted.artifacts, mustBuild(builtSpec("rev-1")).artifacts,
    "the reverted bytes hash identically — only the causal revision differs");
  assert.notEqual(
    await digestPreExecutionArtifactSnapshot(reverted),
    await digestPreExecutionArtifactSnapshot(mustBuild(builtSpec("rev-1"))),
    "and the revision rotation still moves the snapshot digest",
  );
  const mutatedCheck = await comparePreExecutionReceiptToSnapshot(receipt, original, mutated, POLICY_VERSION);
  assert.equal(mutatedCheck.reasonCode, "stale-artifact-content",
    "a real edit outranks the revision rotation that accompanied it");
  const revertCheck = await comparePreExecutionReceiptToSnapshot(receipt, original, reverted, POLICY_VERSION);
  assert.equal(revertCheck.fresh, false, "an older PASS never revives");
  assert.equal(revertCheck.reasonCode, "stale-artifact-revision");
});

test("a plan snapshot's parent binding is carried, compared, and never defaulted", async () => {
  const plan = mustBuild(builtPlan());
  assert.equal(plan.parentSpecSnapshotDigest, PARENT);
  const specDigest = await digestPreExecutionArtifactSnapshot(mustBuild(builtSpec()));
  const reparented = mustBuild(buildPreExecutionArtifactSnapshot(planInput(specDigest)));
  assert.equal(reparented.parentSpecSnapshotDigest, specDigest, "the builder never invents a parent");
  const receipt = await receiptBound(plan);
  const drifted = await comparePreExecutionReceiptToSnapshot(receipt, plan, reparented, POLICY_VERSION);
  assert.equal(drifted.reasonCode, "stale-parent",
    "a new Product revision invalidates the descendant Plan approval");
});

test("a plan-only edit leaves the parent binding intact but changes the plan digest", async () => {
  const before = mustBuild(builtPlan());
  const after = mustBuild(buildPreExecutionArtifactSnapshot(planInput(PARENT, {
    artifactRevisionId: "rev-2",
    files: [
      ...planInput(PARENT).files,
      { kind: "tasks", path: "docs/toy/TASKS.md", content: "# Tasks\n" },
    ],
  })));
  assert.equal(after.parentSpecSnapshotDigest, before.parentSpecSnapshotDigest);
  assert.notEqual(
    await digestPreExecutionArtifactSnapshot(after),
    await digestPreExecutionArtifactSnapshot(before),
  );
});

test("candidate and verification receipts are never accepted as pre-execution receipts", async () => {
  const { validateCandidateSnapshotV1, validatePreExecutionReceiptAgainstSnapshot } =
    await import("../dist/index.js");
  const snapshot = mustBuild(builtSpec());
  const substitutes = [
    {
      contract: "agentic-workflow/review-receipt@1",
      id: "candidate-1",
      candidateSnapshotDigest: DIGEST_A,
      kind: "implementation",
      verdict: "pass",
      findings: [],
      reviewer: "r",
      sessionId: "s",
      startedAt: "2026-08-30T00:00:00Z",
      finishedAt: "2026-08-30T00:01:00Z",
      diagnostics: [],
      policyVersion: "1",
    },
    {
      contract: "agentic-workflow/verification-receipt@1",
      planDigest: "b".repeat(64),
      candidateSnapshotDigest: DIGEST_A,
      acceptanceFingerprint: "c".repeat(64),
      stageRequested: "full",
      results: [],
      verdict: "pass",
    },
  ];
  for (const substitute of substitutes) {
    const result = await validatePreExecutionReceiptAgainstSnapshot(substitute, snapshot, POLICY_VERSION);
    assert.equal(result.ok, false, `${substitute.contract} is a substitute`);
    assert.ok(result.diagnostics.some((d) => d.code === "invalid-value" || d.code === "missing-field"),
      JSON.stringify(result.diagnostics));
  }
  assert.equal(typeof validateCandidateSnapshotV1, "function", "the candidate family still exports");
});

test("a malformed freshness input answers a stable code instead of throwing", async () => {
  const snapshot = mustBuild(builtSpec());
  // Precedence 1 pins the exact code: any input the comparator cannot read at
  // all — including an invalid object or an array — is `missing-receipt-snapshot`,
  // never a content-staleness code (F11: arrays are objects and must not read as
  // content drift; an unreadable current document is likewise a binding answer).
  for (const bad of [null, undefined, 0, "x", [], { contract: PRE_EXECUTION_RECEIPT_CONTRACT_ID }]) {
    const result = await comparePreExecutionReceiptToSnapshot(bad, snapshot, snapshot, POLICY_VERSION);
    assert.equal(result.fresh, false);
    assert.equal(result.reasonCode, "missing-receipt-snapshot", `reviewed ${JSON.stringify(bad)}`);
    assert.ok(PRE_EXECUTION_FRESHNESS_CODES.includes(result.reasonCode), String(result.reasonCode));
  }
  const receipt = await receiptBound(snapshot);
  for (const bad of [null, undefined, 0, "x", [], { contract: PRE_EXECUTION_RECEIPT_CONTRACT_ID }]) {
    const result = await comparePreExecutionReceiptToSnapshot(receipt, snapshot, bad, POLICY_VERSION);
    assert.equal(result.reasonCode, "missing-receipt-snapshot", `current ${JSON.stringify(bad)}`);
  }
});

test("a product edit at the boundary between halves is caught by the selector, not the file", async () => {
  const before = mustBuild(builtSpec("rev-1"));
  const receipt = await receiptBound(before);
  // Same file bytes except the Engineering half grew — the Product projection is unchanged.
  const after = mustBuild(buildPreExecutionArtifactSnapshot(specInput({
    files: [{ kind: "spec", path: "docs/toy/SPEC.md", content: `${toySpec()}\n## Engineering half\n\nx\n` }],
  })));
  assert.equal(
    await digestPreExecutionArtifactSnapshot(after),
    await digestPreExecutionArtifactSnapshot(before),
    "D2: the Engineering half is outside Product authority",
  );
  const same = await comparePreExecutionReceiptToSnapshot(receipt, before, after, POLICY_VERSION);
  assert.deepEqual(same, { fresh: true });
});
