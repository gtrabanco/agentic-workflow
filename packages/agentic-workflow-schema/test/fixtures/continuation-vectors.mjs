// Feature 59 P1 — shared canonical-vector payloads for the continuation object.
//
// These are exactly the documents whose digests the published
// `CONTINUATION_CANONICAL_VECTORS` entries lock. They live here so the digest
// tests and the publishing test consume ONE definition instead of restating
// payloads — a restated fixture could silently disagree with the published
// vector.
//
// The payloads are LITERAL JSON documents, not emitter output: a digest locked
// against a document the emitter produced would also drift the moment the
// emitter changed, which is exactly the signal these vectors exist to emit. The
// evidence digest in the full vector is a fixed placeholder (never the vector's
// own digest) so locking the canonical form is not circular.

/** A fixed, obviously-synthetic lowercase SHA-256 placeholder for the full vector. */
export const VECTOR_EVIDENCE_DIGEST = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const MINIMAL_DESCRIPTION = "minimal valid continuation (status-refresh class)";
const FULL_DESCRIPTION = "full continuation with evidence (planning-gate class)";

const MINIMAL = Object.freeze({
  argv: ["/workflow-status"],
  rendering: "/workflow-status",
  preconditions: [],
  convergence: "next.recommended",
});

const FULL = Object.freeze({
  argv: ["/review-plan", "59-executable-continuations"],
  rendering: "/review-plan 59-executable-continuations",
  preconditions: [
    Object.freeze({
      id: "receipt-current",
      check: 'detail.pre_execution.plan.label == "current"',
      satisfied: false,
    }),
  ],
  evidence: Object.freeze({
    artifact: "docs/features/59-executable-continuations/progress.md",
    digest: VECTOR_EVIDENCE_DIGEST,
  }),
  convergence: "detail.pre_execution.plan.label",
});

/** Description-keyed payload map, consumed by the package suite next to the vectors. */
export const CONTINUATION_VECTORS = Object.freeze({
  [MINIMAL_DESCRIPTION]: MINIMAL,
  [FULL_DESCRIPTION]: FULL,
});

export const MINIMAL_VECTOR_DESCRIPTION = MINIMAL_DESCRIPTION;
export const FULL_VECTOR_DESCRIPTION = FULL_DESCRIPTION;
