// Shared canonical-vector payloads for the verification contracts (AC5 / F72).
//
// These are exactly the fixtures whose digests the published
// `VERIFICATION_CANONICAL_VECTORS` entries lock. They live here so the digest
// tests (independent `node:crypto` path), the AJV projection-parity tests and
// the authoritative-entry tests all consume ONE definition instead of restating
// the payloads — a restated fixture could silently disagree with the published
// vector.
//
// The receipt vector binds to the plan vector (`planDigest` of the single
// `lint` command, one `passed` row, `verdict: "pass"`), so the pair is valid
// through `validateVerificationReceiptAgainstPlan`, not merely shape-valid.
import {
  VERIFICATION_PLAN_CONTRACT_ID,
  VERIFICATION_RECEIPT_CONTRACT_ID,
} from "../../dist/index.js";

/** Minimal valid `VerificationPlan v1` — the payload of vector[0]. */
export function planVector() {
  return {
    contract: VERIFICATION_PLAN_CONTRACT_ID,
    commands: [
      {
        id: "lint",
        stage: "fast",
        executable: "npm",
        args: ["run", "lint"],
        workingDirectoryPolicy: "candidate-root",
        workingDirectory: null,
        timeoutMs: 30000,
        stopOnFailure: false,
        costClass: "cheap",
      },
    ],
  };
}

/** Minimal valid `VerificationReceipt v1` bound to `planDigest` — vector[1]. */
export function receiptVector(planDigest) {
  return {
    contract: VERIFICATION_RECEIPT_CONTRACT_ID,
    planDigest,
    candidateSnapshotDigest: "a".repeat(64),
    acceptanceFingerprint: "b".repeat(64),
    stageRequested: "full",
    results: [
      {
        commandId: "lint",
        status: "passed",
        exitCode: 0,
        signal: null,
        startedAt: "2025-01-01T00:00:00Z",
        endedAt: "2025-01-01T00:00:01Z",
        stdout: null,
        stderr: null,
        skipReason: null,
      },
    ],
    verdict: "pass",
  };
}
