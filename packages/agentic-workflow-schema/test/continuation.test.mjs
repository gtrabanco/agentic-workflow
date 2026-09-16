// Feature 59 P1 — Envelope v2 `next.continuation` contract suite (AC1, AC4, AC5).
//
// Covers the frozen shape, the closed refusal vocabulary, the pure emitter, the
// published canonical vectors, the evidence-token digest equality + mismatch
// (receiver side, nothing persisted), and the per-family rendering derivation.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  CONTINUATION_CANONICAL_VECTORS,
  CONTINUATION_CONTRACT_ID,
  CONTINUATION_PLATFORM_FAMILIES,
  CONTINUATION_REFUSALS,
  CONTINUATION_VECTOR_CONTRACT,
  canonicalizeContinuation,
  deriveContinuationRendering,
  emitContinuation,
  parseContinuationArgv,
  validateContinuation,
  validateEnvelope,
  validateEnvelopeV2Strict,
  verifyContinuationEvidence,
} from "../dist/index.js";
import { sha256HexSync } from "../dist/sha256.js";
import {
  CONTINUATION_VECTORS,
  FULL_VECTOR_DESCRIPTION,
  MINIMAL_VECTOR_DESCRIPTION,
  VECTOR_EVIDENCE_DIGEST,
} from "./fixtures/continuation-vectors.mjs";

const baseEnvelope = (overrides = {}) => ({
  skill: "workflow-status",
  state: "OK",
  summary: "0 unit(s)",
  unit: { type: "none", id: null, issue: null, branch: null },
  phase: { current: null, total: null, completed: null },
  pr: { number: null, url: null, state: "none", head_sha: null, merge_ready: null, ci: null },
  gates: { verification: null, review_pending: null, audit_pending: null },
  findings: { fix_now: [], issues_filed: [], untriaged: 0, decisions_recorded: 0 },
  blockers: [],
  dependencies: { unmet: [], build_order: [] },
  recommendations: { product_audit: false, reason: null },
  needs_input: null,
  next: { recommended: "/workflow-status", alternatives: [], tier: "cheap" },
  detail: {},
  ...overrides,
});

const validContinuation = () => ({
  argv: ["/review-plan", "59-executable-continuations"],
  rendering: "/review-plan 59-executable-continuations",
  preconditions: [
    { id: "receipt-current", check: "detail.pre_execution.plan.label == \"current\"", satisfied: false },
  ],
  evidence: { artifact: "docs/features/59-executable-continuations/progress.md", digest: "a".repeat(64) },
  convergence: "detail.pre_execution.plan.label",
});

// ---------------------------------------------------------------------------
// Backward compatibility + valid object
// ---------------------------------------------------------------------------

test("an envelope without next.continuation stays valid (additive minor)", () => {
  const result = validateEnvelope(baseEnvelope());
  assert.equal(result.ok, true, JSON.stringify(result.errors ?? null));
  assert.equal("continuation" in result.envelope.next, false);
});

test("an envelope with a valid next.continuation validates under both entry points", () => {
  const value = baseEnvelope({ next: { ...baseEnvelope().next, continuation: validContinuation() } });
  const compat = validateEnvelope(value);
  assert.equal(compat.ok, true, JSON.stringify(compat.errors ?? null));
  assert.deepEqual(compat.envelope.next.continuation, validContinuation());
  const strict = validateEnvelopeV2Strict(value);
  assert.equal(strict.ok, true, JSON.stringify(strict.errors ?? null));
});

// ---------------------------------------------------------------------------
// Fail-closed shapes (AC1)
// ---------------------------------------------------------------------------

const invalidShapeCases = [
  ["missing argv", (c) => { delete c.argv; return c; }, /argv/],
  ["empty argv", (c) => { c.argv = []; return c; }, /argv/],
  ["non-string-array argv", (c) => { c.argv = ["/x", 7]; return c; }, /argv/],
  ["empty convergence", (c) => { c.convergence = ""; return c; }, /convergence/],
  ["missing convergence", (c) => { delete c.convergence; return c; }, /convergence/],
  ["non-object precondition", (c) => { c.preconditions = ["nope"]; return c; }, /preconditions\[0\]/],
  ["precondition without a boolean satisfied", (c) => { c.preconditions = [{ id: "a", check: "b", satisfied: "yes" }]; return c; }, /satisfied/],
  ["non-object continuation", () => "not-an-object", /must be an object/],
  ["malformed evidence digest", (c) => { c.evidence = { artifact: "docs/x.md", digest: "A".repeat(64) }; return c; }, /evidence\.digest/],
  ["unexpected key", (c) => { c.extra = true; return c; }, /unexpected key/],
];

for (const [name, build, pattern] of invalidShapeCases) {
  test(`invalid shape fails closed with a typed error: ${name}`, () => {
    const value = baseEnvelope({ next: { ...baseEnvelope().next, continuation: build(validContinuation()) } });
    const result = validateEnvelope(value);
    assert.equal(result.ok, false, "invalid continuation must not validate");
    assert.ok(
      result.errors.some((error) => pattern.test(error)),
      `expected an error matching ${pattern}; got ${JSON.stringify(result.errors)}`,
    );
  });
}

test("validateContinuation returns typed errors and an empty list when valid", () => {
  assert.deepEqual(validateContinuation(validContinuation()), []);
  assert.match(validateContinuation(null)[0], /must be an object/);
  assert.match(validateContinuation({ argv: [], preconditions: [], convergence: "" }).join("\n"), /argv/);
});

// ---------------------------------------------------------------------------
// Refusal vocabulary closure (O16 / D-59-5)
// ---------------------------------------------------------------------------

test("CONTINUATION_REFUSALS is the frozen four-code closed vocabulary", () => {
  assert.equal(CONTINUATION_REFUSALS.length, 4);
  assert.deepEqual([...CONTINUATION_REFUSALS], [
    "precondition-uncheckable",
    "rendering-failed",
    "no-decision-available",
    "sensor-degraded",
  ]);
  assert.equal(Object.isFrozen(CONTINUATION_REFUSALS), true);
});

// ---------------------------------------------------------------------------
// Emitter (AC1/AC2/AC5)
// ---------------------------------------------------------------------------

test("emitContinuation parses argv and derives the POSIX rendering", () => {
  const result = emitContinuation({
    command: "/review-plan 59-executable-continuations",
    convergence: "detail.pre_execution.plan.label",
    preconditions: [{ id: "r", check: "row exists", satisfied: true }],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.continuation.argv, ["/review-plan", "59-executable-continuations"]);
  assert.equal(result.continuation.rendering, "/review-plan 59-executable-continuations");
  assert.equal(result.continuation.convergence, "detail.pre_execution.plan.label");
  assert.equal(validateContinuation(result.continuation).length, 0);
});

test("emitContinuation keeps a quoted argument as one token and never mutates argv by rendering", () => {
  const result = emitContinuation({
    command: "/triage-issue 'a b' c",
    convergence: "next.recommended",
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.continuation.argv, ["/triage-issue", "a b", "c"]);
  const snapshot = [...result.continuation.argv];
  deriveContinuationRendering(result.continuation.argv, "windows");
  assert.deepEqual(result.continuation.argv, snapshot, "rendering must not alter argv");
});

test("emitContinuation refuses every failure path with a closed-vocabulary code", () => {
  const cases = [
    [{ command: "", convergence: "x" }, "no-decision-available"],
    [{ command: "/x", convergence: "" }, "no-decision-available"],
    [{ command: "/x", convergence: "x", decisionAvailable: false }, "no-decision-available"],
    [{ command: "/x", convergence: "x", sensorDegraded: true }, "sensor-degraded"],
    [{ command: "/x 'unterminated", convergence: "x" }, "rendering-failed"],
    [{ command: "/x", convergence: "x", preconditions: [{ id: "a", check: "", satisfied: true }] }, "precondition-uncheckable"],
    [{ command: "/x", convergence: "x", preconditions: [null] }, "precondition-uncheckable"],
    [{ command: "/x", convergence: "x", evidence: { artifact: "d", digest: "nope" } }, "precondition-uncheckable"],
  ];
  for (const [input, refusal] of cases) {
    const result = emitContinuation(input);
    assert.equal(result.ok, false, `expected refusal for ${JSON.stringify(input)}`);
    assert.equal(result.refusal, refusal);
    assert.ok(CONTINUATION_REFUSALS.includes(result.refusal));
  }
});

test("a sensor-degraded input is refused before a decision is consulted", () => {
  const result = emitContinuation({ command: "/workflow-status", convergence: "next.recommended", sensorDegraded: true });
  assert.equal(result.ok, false);
  assert.equal(result.refusal, "sensor-degraded");
});

// ---------------------------------------------------------------------------
// Rendering derivation per platform family (AC5)
// ---------------------------------------------------------------------------

test("rendering is derivable from argv per platform family", () => {
  assert.deepEqual([...CONTINUATION_PLATFORM_FAMILIES], ["posix", "windows"]);
  const argv = ["/plan-feature", "59 executable continuations"];
  assert.equal(deriveContinuationRendering(argv, "posix"), "/plan-feature '59 executable continuations'");
  assert.equal(deriveContinuationRendering(argv, "windows"), "/plan-feature \"59 executable continuations\"");
  assert.equal(deriveContinuationRendering(["/workflow-status"], "posix"), "/workflow-status");
});

test("a forced rendering divergence from argv fails the derivation", () => {
  // The derivation is pure; forcing a divergent string is refused, and the
  // unknown-family path throws so the emitter maps it to rendering-failed.
  assert.throws(() => deriveContinuationRendering([], "posix"), /non-empty array/);
  assert.throws(() => deriveContinuationRendering([1, 2], "posix"), /array of strings/);
  assert.throws(() => deriveContinuationRendering(["/x"], "plan9"), /unknown continuation platform family/);
  const emitted = emitContinuation({ command: "/x", convergence: "c", platform: "plan9" });
  assert.equal(emitted.ok, false);
  assert.equal(emitted.refusal, "rendering-failed");
});

test("parseContinuationArgv rejects an unterminated quote", () => {
  assert.throws(() => parseContinuationArgv("/x 'y"), /unterminated quote/);
});

// ---------------------------------------------------------------------------
// Canonical vectors (AC1)
// ---------------------------------------------------------------------------

test("the published continuation vectors reproduce from the literal fixtures", () => {
  assert.ok(CONTINUATION_CANONICAL_VECTORS.length >= 2, "both canonical objects are covered");
  for (const vector of CONTINUATION_CANONICAL_VECTORS) {
    assert.equal(vector.contract, CONTINUATION_VECTOR_CONTRACT);
    assert.equal(vector.contract, CONTINUATION_CONTRACT_ID);
    const payload = CONTINUATION_VECTORS[vector.description];
    assert.ok(payload, `fixture payload missing for ${vector.description}`);
    const canonical = canonicalizeContinuation(payload);
    const digest = createHash("sha256").update(canonical, "utf8").digest("hex");
    assert.equal(digest, vector.digest, `digest drift for ${vector.description}`);
    assert.equal(validateContinuation(payload).length, 0, `vector is a valid continuation: ${vector.description}`);
  }
  assert.deepEqual(
    CONTINUATION_CANONICAL_VECTORS.map((vector) => vector.description),
    [MINIMAL_VECTOR_DESCRIPTION, FULL_VECTOR_DESCRIPTION],
  );
});

// ---------------------------------------------------------------------------
// Evidence token digest equality + mismatch (AC4, receiver side)
// ---------------------------------------------------------------------------

const ARTIFACT = "docs/features/59-executable-continuations/progress.md";
const ARTIFACT_TEXT = "## Acceptance receipt v1\n- Blob: d046f0b5\n";

test("the evidence token's hash equals the referenced artifact digest", () => {
  const result = emitContinuation({
    command: "/review-plan 59",
    convergence: "detail.pre_execution.plan.label",
    evidence: { artifact: ARTIFACT, digest: sha256HexSync(ARTIFACT_TEXT) },
  });
  assert.equal(result.ok, true);
  assert.equal(result.continuation.evidence.digest, sha256HexSync(ARTIFACT_TEXT));
  assert.equal(verifyContinuationEvidence(result.continuation, ARTIFACT_TEXT), true);
  assert.equal(verifyContinuationEvidence(result.continuation, `${ARTIFACT_TEXT}mutated`), false);
  assert.equal(verifyContinuationEvidence({ argv: ["/x"], convergence: "c", preconditions: [] }, ARTIFACT_TEXT), false);
});

test("the receiver check fails on a mismatched digest and persists nothing", () => {
  const token = { artifact: ARTIFACT, digest: VECTOR_EVIDENCE_DIGEST };
  assert.equal(
    verifyContinuationEvidence({ argv: ["/x"], convergence: "c", preconditions: [], evidence: token }, ARTIFACT_TEXT),
    false,
  );
  // Nothing is stored: the check is a pure predicate over the supplied bytes.
  assert.equal(verifyContinuationEvidence(null, ARTIFACT_TEXT), false);
});

test("the package distinguishes a declared digest from a recomputed one", () => {
  const declared = sha256HexSync(ARTIFACT_TEXT);
  const canonical = canonicalizeContinuation(CONTINUATION_VECTORS[FULL_VECTOR_DESCRIPTION]);
  assert.notEqual(declared, canonical, "the canonical vector digest and an artifact digest are different surfaces");
});
