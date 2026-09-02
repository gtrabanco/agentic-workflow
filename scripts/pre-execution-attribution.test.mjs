#!/usr/bin/env node

/**
 * Feature 28 — finding RS13: the sensor's staleness attribution must be the
 * CONTRACT's precedence, not a second opinion.
 *
 * `verify` holds only the digest the receipt recorded, so it can never hand the
 * schema comparator a real "reviewed" snapshot object — inventing one would make
 * the comparator's guarantee meaningless. It therefore attributes the drift from
 * the fields the receipt itself pins plus caller-supplied git evidence. This file
 * proves that attribution and `comparePreExecutionReceiptToSnapshot` answer the
 * SAME code for the SAME drift, for every dimension the comparator can name, so
 * the CLI cannot drift from the contract it prints.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { loadSchemaRuntime } from "./schema-runtime.mjs";

const {
  PRE_EXECUTION_FRESHNESS_CODES,
  PRE_EXECUTION_RECEIPT_CONTRACT_ID,
  buildPreExecutionArtifactSnapshot,
  comparePreExecutionReceiptToSnapshot,
  digestPreExecutionArtifactSnapshot,
} = await loadSchemaRuntime();
// Dynamic on purpose: this fixture imports `dist/` itself, and a *static* import
// of it fails during module resolution — before any guard could name the build
// step (see scripts/schema-runtime.mjs).
const { PARENT, SHA1, planInput, specInput, toySpec } = await import(
  "../packages/agentic-workflow-schema/test/fixtures/pre-execution-documents.mjs"
);
import { attributeFreshness } from "./pre-execution-snapshot.mjs";

const POLICY = "v1";
const SPEC_PATH = "docs/toy/SPEC.md";
const CONTEXT_ID = "#146";

const build = async (input) => {
  const result = buildPreExecutionArtifactSnapshot(input);
  assert.equal(result.ok, true, JSON.stringify(result.diagnostics));
  return { snapshot: result.snapshot, digest: await digestPreExecutionArtifactSnapshot(result.snapshot) };
};

/** The Product bytes a reviewer would have read at some other moment. */
const editedSpec = () => toySpec({ Goal: "## Goal\n\nShip the other thing.\n" });

/**
 * What a receipt block records about the snapshot it bound. `verify` parses these
 * lines out of `progress.md`; the backticks and the `sha256:` prefix are the two
 * shapes the block is written in, so one case carries them.
 */
const recordedFrom = (snapshot, digest, over = {}) => ({
  stage: snapshot.stage,
  unit: snapshot.unitId,
  unitKind: snapshot.unitKind,
  snapshot: digest,
  policy: POLICY,
  sourceRevision: snapshot.sourceRevision,
  artifactRevision: snapshot.artifactRevisionId,
  parent: snapshot.parentSpecSnapshotDigest,
  ...over,
});

const edited = (input, overrides) => ({
  ...input,
  files: input.files.map((file) => (file.path === SPEC_PATH ? { ...file, content: editedSpec() } : file)),
  ...overrides,
});

const contextsOn = (input, body) => ({
  ...input,
  contexts: [{ kind: "governing-issue", identifier: CONTEXT_ID, content: body }],
});

test("the sensor's attribution answers exactly what the comparator answers", async () => {
  const cases = [
    ["stale-artifact-content", specInput(), edited(specInput()), { changedArtifacts: [SPEC_PATH] }],
    ["stale-context", specInput(), contextsOn(specInput(), "other issue body"), { changedContexts: [CONTEXT_ID] }],
    ["stale-source-revision", specInput(), { ...specInput(), sourceRevision: "f".repeat(40) }, {}],
    ["stale-parent", planInput(), planInput("d".repeat(64)), {}],
    ["stale-artifact-revision", specInput(), { ...specInput(), artifactRevisionId: "rev-2" }, {}],
    ["invalid-unit", specInput(), { ...specInput(), unitId: "another-unit" }, {}],
    ["invalid-stage", specInput(), planInput(), {}],
    // Everything moved at once: the comparator's precedence must decide, and the
    // sensor must not "helpfully" answer a later dimension.
    ["stale-policy", specInput(), edited(specInput({
      sourceRevision: "f".repeat(40),
      artifactRevisionId: "rev-9",
      contexts: [{ kind: "governing-issue", identifier: CONTEXT_ID, content: "other body" }],
    })), { policy: "v2", changedArtifacts: [SPEC_PATH], changedContexts: [CONTEXT_ID] }],
    ["stale-context", specInput(), edited(contextsOn(specInput(), "other issue body"), {
      sourceRevision: "f".repeat(40),
    }), { changedArtifacts: [SPEC_PATH], changedContexts: [CONTEXT_ID] }],
    ["stale-source-revision", specInput(), edited({ ...specInput(), sourceRevision: "f".repeat(40) }), {
      changedArtifacts: [SPEC_PATH],
    }],
    ["stale-parent", planInput(), edited(planInput("d".repeat(64))), { changedArtifacts: [SPEC_PATH] }],
    ["stale-artifact-content", specInput(), edited(specInput(), { artifactRevisionId: "rev-2" }), {
      changedArtifacts: [SPEC_PATH],
    }],
    ["fresh", specInput(), specInput(), {}],
  ];
  for (const [expected, reviewedInput, currentInput, evidence] of cases) {
    const reviewed = await build(reviewedInput);
    const current = await build(currentInput);
    const receipt = {
      contract: PRE_EXECUTION_RECEIPT_CONTRACT_ID,
      snapshotDigest: reviewed.digest,
      policyVersion: evidence.policy ?? POLICY,
    };
    // `evidence.policy` is the policy the RECEIPT was recorded under; the policy in
    // force now is always POLICY. Passing one value as both would make the
    // stale-policy dimension unreachable by construction in this table.
    const structural = await comparePreExecutionReceiptToSnapshot(
      receipt, reviewed.snapshot, current.snapshot, POLICY,
    );
    assert.equal(structural.fresh ? "fresh" : structural.reasonCode, expected,
      `${expected}: the comparator itself answered ${JSON.stringify(structural)}`);
    const attributed = attributeFreshness({
      recorded: recordedFrom(reviewed.snapshot, reviewed.digest,
        evidence.policy ? { policy: evidence.policy } : {}),
      snapshot: current.snapshot,
      observedDigest: current.digest,
      policyVersion: POLICY,
      changedArtifacts: evidence.changedArtifacts ?? [],
      changedContexts: evidence.changedContexts ?? [],
    });
    assert.equal(attributed.fresh, structural.fresh, `${expected}: freshness flag drifted`);
    assert.equal(attributed.reasonCode, structural.reasonCode ?? undefined,
      `${expected}: the sensor answered ${attributed.reasonCode}`);
    assert.ok(attributed.reasonCode === undefined || PRE_EXECUTION_FRESHNESS_CODES.includes(attributed.reasonCode),
      "the sensor may print no code outside the published vocabulary");
  }
});

test("a bound digest recorded with a prefix or in backticks still binds", async () => {
  const reviewed = await build(specInput());
  for (const shape of [`sha256:${reviewed.digest}`, `\`${reviewed.digest}\``, reviewed.digest]) {
    const attributed = attributeFreshness({
      recorded: recordedFrom(reviewed.snapshot, shape),
      snapshot: reviewed.snapshot,
      observedDigest: reviewed.digest,
      policyVersion: POLICY,
    });
    assert.equal(attributed.fresh, true, `${shape} must read as the digest it is`);
  }
});

test("the receipt's own digest is the only thing that may read as missing-receipt-snapshot", async () => {
  const reviewed = await build(specInput());
  for (const bound of [null, "", "not-a-digest", "`prose`"]) {
    const attributed = attributeFreshness({
      recorded: recordedFrom(reviewed.snapshot, bound),
      snapshot: reviewed.snapshot,
      observedDigest: reviewed.digest,
      policyVersion: POLICY,
    });
    assert.equal(attributed.fresh, false);
    assert.equal(attributed.reasonCode, "missing-receipt-snapshot", `${String(bound)} must be precedence 1`);
  }
});

test("identity matched but the digest differs: the drift is named by elimination, never hidden", async () => {
  const reviewed = await build(specInput());
  // The residual a receipt-only sensor can hit: a bound file that git cannot
  // compare (an unrecorded revision, an editor buffer, a rewritten history).
  const attributed = attributeFreshness({
    recorded: recordedFrom(reviewed.snapshot, "0".repeat(64)),
    snapshot: reviewed.snapshot,
    observedDigest: "1".repeat(64),
    policyVersion: POLICY,
  });
  assert.equal(attributed.fresh, false);
  assert.equal(attributed.reasonCode, "stale-artifact-content");
  assert.match(attributed.detail, /elimination/i, "the report must say how it knows");
  assert.deepEqual(attributed.changedPaths, []);
});

test("a `null` parent line reads as no lineage, not as a missing value", async () => {
  // D30: a fix unit has no Product half, so its plan snapshot binds no parent and
  // the receipt says so with a null-ish line. Every spelling of null must mean the
  // same null the snapshot carries — a real digest there must not pass.
  const reviewed = await build(planInput(null, { unitKind: "fix" }));
  for (const shape of [null, "null", "`null`", "—", "none"]) {
    const attributed = attributeFreshness({
      recorded: recordedFrom(reviewed.snapshot, reviewed.digest, { parent: shape }),
      snapshot: reviewed.snapshot,
      observedDigest: reviewed.digest,
      policyVersion: POLICY,
    });
    assert.equal(attributed.fresh, true, `${String(shape)} must mean the null the snapshot carries`);
  }
  const realParent = attributeFreshness({
    recorded: recordedFrom(reviewed.snapshot, reviewed.digest, { parent: "d".repeat(64) }),
    snapshot: reviewed.snapshot,
    observedDigest: reviewed.digest,
    policyVersion: POLICY,
  });
  assert.equal(realParent.reasonCode, "stale-parent", "a named parent that is not this one is lineage drift");
});
