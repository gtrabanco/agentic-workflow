/**
 * Published canonical vectors for the continuation object.
 *
 * Each entry pins the EXACT lowercase SHA-256 digest of one fixture document
 * (`test/fixtures/continuation-vectors.mjs`, kept in sync by name), canonicalized
 * with `canonicalizeContinuation` (sorted keys, compact separators). The payloads
 * are written as literal JSON documents — not produced by the emitter — so a change
 * to the canonical serializer or the field projection shifts a digest here and the
 * suite fails instead of silently re-blessing new bytes.
 *
 * A digest change is a contract change: it is reviewed, versioned, and recorded in
 * `CHANGELOG.md`, never regenerated to make a test pass.
 */

/** Contract identifier for the continuation object (owned by `continuation.ts`). */
export const CONTINUATION_VECTOR_CONTRACT = "agentic-workflow/continuation@1";

export interface ContinuationCanonicalVector {
  readonly contract: string;
  readonly description: string;
  readonly digest: string;
}

/** The two shipped vectors: minimal and full (with evidence). */
export const CONTINUATION_CANONICAL_VECTORS: readonly ContinuationCanonicalVector[] = Object.freeze([
  Object.freeze({
    contract: CONTINUATION_VECTOR_CONTRACT,
    description: "minimal valid continuation (status-refresh class)",
    digest: "2cfdfc3e95af4e277786b1b696017c5938fd666a7a4121c4c61011259409ecb2",
  }),
  Object.freeze({
    contract: CONTINUATION_VECTOR_CONTRACT,
    description: "full continuation with evidence (planning-gate class)",
    digest: "08d10a797abf9d0dc7b8629aa82eca47b54409865a6591c18ccbbddf7699913c",
  }),
]);
