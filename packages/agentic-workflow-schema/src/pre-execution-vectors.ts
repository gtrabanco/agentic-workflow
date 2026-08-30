/**
 * Published canonical vectors for the pre-execution contracts.
 *
 * Each entry pins the EXACT lowercase SHA-256 digest of one fixture document
 * (`test/fixtures/pre-execution-vectors.mjs`, kept in sync by name). The payloads
 * are written as literal JSON documents — not produced by the builder — so a change
 * to the canonical serializer, the field projection, or the byte ordering shifts a
 * digest here and the suite fails instead of silently re-blessing new bytes.
 *
 * A digest change is a contract change: it is reviewed, versioned, and recorded in
 * `CHANGELOG.md`, never regenerated to make a test pass.
 */

export interface PreExecutionCanonicalVector {
  readonly contract: string;
  readonly description: string;
  readonly digest: string;
}

/** The four shipped vectors: both contracts, both stages. */
export const PRE_EXECUTION_CANONICAL_VECTORS: readonly PreExecutionCanonicalVector[] = Object.freeze([
  Object.freeze({
    contract: "agentic-workflow/pre-execution-artifact-snapshot@1",
    description: "SPEC-stage snapshot binding one Product projection and one governing issue",
    digest: "a7c7237c6b6105e80a6fb26b3c0a7fd946505df8eed0c952a29cbc3ad7770658",
  }),
  Object.freeze({
    contract: "agentic-workflow/pre-execution-artifact-snapshot@1",
    description:
      "Plan-stage snapshot bound to a Product parent with SPEC, ACCEPTANCE, and TASKS rows",
    digest: "6348fc1818fc57ca78939a09d09d38600c3624e8ba3e09866cea2378161045c5",
  }),
  Object.freeze({
    contract: "agentic-workflow/pre-execution-review-receipt@1",
    description: "SPEC-stage review receipt with a clean PASS and no findings",
    digest: "7003133ab8f00ae7a9edb052e435e1bb07168d17f19c29f1d1ad0708e795b566",
  }),
  Object.freeze({
    contract: "agentic-workflow/pre-execution-review-receipt@1",
    description: "Plan-stage arbiter receipt carrying two findings and one critic parent digest",
    digest: "27d7d2b949b2776dc386ba217d93926f02580d54b7c194a99710f6f3696ee97e",
  }),
]);
