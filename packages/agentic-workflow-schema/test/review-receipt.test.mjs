import { test } from "node:test";
import assert from "node:assert/strict";
import {
  REVIEW_RECEIPT_CONTRACT_ID,
  REVIEW_KINDS,
  FINDING_SEVERITIES,
  validateReviewReceiptV1,
} from "../dist/index.js";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

test("REVIEW_RECEIPT_CONTRACT_ID is correct", () => {
  assert.equal(REVIEW_RECEIPT_CONTRACT_ID, "agentic-workflow/review-receipt@1");
});

test("REVIEW_KINDS has exactly 10 values", () => {
  assert.equal(REVIEW_KINDS.length, 10);
});

test("FINDING_SEVERITIES has exactly 5 values", () => {
  assert.equal(FINDING_SEVERITIES.length, 5);
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validReceipt(findings = []) {
  return {
    contract: REVIEW_RECEIPT_CONTRACT_ID,
    id: "rcpt-001",
    candidateSnapshotDigest: "a".repeat(64),
    kind: "implementation",
    verdict: "pass",
    findings,
    reviewer: "auto-reviewer",
    sessionId: "sess-abc",
    startedAt: "2025-01-01T00:00:00Z",
    finishedAt: "2025-01-01T00:00:01Z",
    diagnostics: [],
    policyVersion: "v1.0.0",
  };
}

// ---------------------------------------------------------------------------
// undeclared fields
// ---------------------------------------------------------------------------

test("rejects undeclared field at top level", () => {
  const r = validReceipt();
  r.extraField = "boom";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("extraField")));
});

test("rejects undeclared field inside finding", () => {
  const f = { id: "f1", severity: "high", summary: "bug", extra: 1 };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("extra")));
});

test("rejects undeclared field inside finding evidence", () => {
  const f = { id: "f1", severity: "high", summary: "bug", evidence: { path: "a.ts", line: 10, extra: true } };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("evidence") && e.includes("extra")));
});

// ---------------------------------------------------------------------------
// contract id
// ---------------------------------------------------------------------------

test("rejects wrong contract id", () => {
  const r = validReceipt();
  r.contract = "wrong/contract";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("contract")));
});

// ---------------------------------------------------------------------------
// id
// ---------------------------------------------------------------------------

test("rejects empty id", () => {
  const r = validReceipt();
  r.id = "";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("id")));
});

// ---------------------------------------------------------------------------
// candidateSnapshotDigest
// ---------------------------------------------------------------------------

test("rejects invalid candidateSnapshotDigest", () => {
  const r = validReceipt();
  r.candidateSnapshotDigest = "not-a-hash";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("candidateSnapshotDigest")));
});

test("rejects uppercase candidateSnapshotDigest", () => {
  const r = validReceipt();
  r.candidateSnapshotDigest = "A".repeat(64);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("candidateSnapshotDigest")));
});

// ---------------------------------------------------------------------------
// kind
// ---------------------------------------------------------------------------

test("rejects invalid kind", () => {
  const r = validReceipt();
  r.kind = "unknown-kind";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("kind")));
});

// ---------------------------------------------------------------------------
// verdict
// ---------------------------------------------------------------------------

test("rejects invalid verdict", () => {
  const r = validReceipt();
  r.verdict = "warn";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("verdict")));
});

// ---------------------------------------------------------------------------
// findings — structure
// ---------------------------------------------------------------------------

test("rejects non-array findings", () => {
  const r = validReceipt();
  r.findings = "not-array";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("findings")));
});

test("rejects finding with empty id", () => {
  const f = { id: "", severity: "high", summary: "bug" };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("id")));
});

test("rejects duplicate finding ids", () => {
  const f = { id: "f1", severity: "high", summary: "bug", refs: [] };
  const r = validReceipt([f, { ...f }]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("duplicate")));
});

test("rejects invalid severity", () => {
  const f = { id: "f1", severity: "extreme", refs: [] };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("severity")));
});

test("rejects empty summary", () => {
  const f = { id: "f1", severity: "high", summary: "", refs: [] };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("summary")));
});

test("rejects finding evidence with non-integer line", () => {
  const f = { id: "f1", severity: "high", summary: "bug", evidence: { path: "a.ts", line: 1.5 } };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("line")));
});

test("rejects finding evidence with line < 1", () => {
  const f = { id: "f1", severity: "high", summary: "bug", evidence: { path: "a.ts", line: 0 } };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("line")));
});

test("rejects finding evidence with non-object evidence", () => {
  const f = { id: "f1", severity: "high", summary: "bug", evidence: "not-object" };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("evidence")));
});

test("rejects non-string refs", () => {
  const f = { id: "f1", severity: "high", summary: "bug", refs: [123] };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("refs")));
});

test("accepts finding with evidence and refs", () => {
  const f = { id: "f1", severity: "high", summary: "bug", evidence: { path: "a.ts", line: 42 }, refs: ["evidence-1"] };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, true);
});

test("accepts finding without optional fields", () => {
  const f = { id: "f1", severity: "info", summary: "note", refs: [] };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// reviewer / sessionId
// ---------------------------------------------------------------------------

test("rejects empty reviewer", () => {
  const r = validReceipt();
  r.reviewer = "";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("reviewer")));
});

test("rejects empty sessionId", () => {
  const r = validReceipt();
  r.sessionId = "";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("sessionId")));
});

// ---------------------------------------------------------------------------
// timestamps
// ---------------------------------------------------------------------------

test("rejects invalid startedAt format", () => {
  const r = validReceipt();
  r.startedAt = "not-a-timestamp";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("startedAt")));
});

test("rejects finishedAt < startedAt", () => {
  const r = validReceipt();
  r.startedAt = "2025-01-01T00:00:01Z";
  r.finishedAt = "2025-01-01T00:00:00Z";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("finishedAt") && (e.includes(">=") || e.includes("startedAt"))));
});

test("accepts equal timestamps", () => {
  const r = validReceipt();
  r.startedAt = "2025-01-01T00:00:00Z";
  r.finishedAt = "2025-01-01T00:00:00Z";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// diagnostics
// ---------------------------------------------------------------------------

test("rejects non-array diagnostics", () => {
  const r = validReceipt();
  r.diagnostics = "not-array";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("diagnostics")));
});

test("rejects non-string diagnostics item", () => {
  const r = validReceipt();
  r.diagnostics = [123];
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("diagnostics")));
});

// ---------------------------------------------------------------------------
// policyVersion
// ---------------------------------------------------------------------------

test("rejects empty policyVersion", () => {
  const r = validReceipt();
  r.policyVersion = "";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((e) => e.includes("policyVersion")));
});

// ---------------------------------------------------------------------------
// Full valid receipt
// ---------------------------------------------------------------------------

test("accepts a fully valid receipt", () => {
  const f = { id: "f1", severity: "medium", summary: "potential issue", refs: ["ref1"] };
  const r = validReceipt([f]);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, true);
});

test("accepts receipt with multiple findings", () => {
  const findings = [
    { id: "f1", severity: "high", summary: "critical bug", refs: [] },
    { id: "f2", severity: "low", summary: "style issue", refs: [] },
    { id: "f3", severity: "info", summary: "nits", refs: [] },
  ];
  const r = validReceipt(findings);
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, true);
});

test("accepts receipt with fail verdict", () => {
  const r = validReceipt([{ id: "f1", severity: "critical", summary: "security flaw", refs: [] }]);
  r.verdict = "fail";
  const result = validateReviewReceiptV1(r);
  assert.equal(result.ok, true);
});

// ---------------------------------------------------------------------------
// Schema structure parity
// ---------------------------------------------------------------------------

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Note: package.json does not list ajv as a dependency, so the parity test
// validates the schema file structure rather than importing Ajv at runtime.
test("review-receipt.schema.json is valid JSON with expected structure", () => {
  const schema = require("../review-receipt.schema.json");
  assert.equal(schema["$schema"], "http://json-schema.org/draft-07/schema#");
  assert.equal(schema["$id"], "https://github.com/gtrabanco/agentic-workflow/packages/agentic-workflow-schema/review-receipt.schema.json");
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
  assert.ok(schema.required.includes("contract"));
  assert.ok(schema.required.includes("findings"));
  assert.ok(schema.required.includes("policyVersion"));
  assert.equal(schema.properties.contract.const, "agentic-workflow/review-receipt@1");
  assert.equal(schema.properties.kind.enum.length, 10);
  assert.equal(schema.properties.verdict.enum.length, 2);
  assert.ok(schema["$defs"].findingV1);
  assert.ok(schema["$defs"].findingEvidenceV1);
  assert.equal(schema["$defs"].findingV1.additionalProperties, false);
  assert.equal(schema["$defs"].findingEvidenceV1.additionalProperties, false);
});