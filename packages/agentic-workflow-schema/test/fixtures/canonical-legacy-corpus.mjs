// P19 / F100 — the pre-feature-26 unsupported-leaf corpus.
//
// Shared by `scripts/capture-legacy-vectors.mjs` (which runs the MERGE-BASE build
// over it) and `test/canonical-legacy-compat.test.mjs` (which runs the candidate),
// so both sides feed byte-identical documents to the two builds.
//
// Both legacy canonicalizers project a fixed key set, so a leaf outside the JSON
// data model can only reach the serializer from INSIDE a projected field — or from
// inside one of its array elements. Every injection point below does exactly that,
// on documents that are otherwise valid `CandidateSnapshotV1` / `ReviewReceiptV1`
// shapes; nothing here invents a field the released exports never carried.
import {
  CANDIDATE_SNAPSHOT_CONTRACT_ID,
  REVIEW_RECEIPT_CONTRACT_ID,
} from "../../dist/index.js";

const sha1 = (char) => ({ algorithm: "sha1", hex: char.repeat(40) });
const FINGERPRINT = "0".repeat(64);

/** One `ManifestEntryV1`; `changedPaths` holds entries, never bare strings. */
function manifestEntry(overrides = {}) {
  return {
    path: "src/a.txt",
    status: "modified",
    oldPath: null,
    mode: "100644",
    objectSha: "e".repeat(40),
    sizeBytes: 12,
    binary: false,
    ...overrides,
  };
}

/** A valid `CandidateSnapshotV1` (feature 25 shape) with one manifest entry. */
export function legacySnapshot(entries = [manifestEntry()]) {
  return {
    contract: CANDIDATE_SNAPSHOT_CONTRACT_ID,
    objectFormat: "sha1",
    baseCommit: sha1("a"),
    candidateCommit: sha1("b"),
    baseTree: sha1("c"),
    candidateTree: sha1("c"),
    acceptanceFingerprint: FINGERPRINT,
    changedPaths: entries,
  };
}

/** A valid `ReviewReceiptV1` (feature 25 shape). */
export function legacyReceipt(overrides = {}) {
  return {
    contract: REVIEW_RECEIPT_CONTRACT_ID,
    id: "rcpt-001",
    candidateSnapshotDigest: "d".repeat(64),
    kind: "implementation",
    verdict: "pass",
    findings: [{ id: "f1", severity: "medium", summary: "issue", refs: [] }],
    reviewer: "auto",
    sessionId: "sess-1",
    startedAt: "2025-01-01T00:00:00Z",
    finishedAt: "2025-01-01T00:00:01Z",
    diagnostics: ["clean"],
    policyVersion: "v1",
    ...overrides,
  };
}

/**
 * The leaves feature 26's guard refuses by name, plus `null` — the
 * JSON-representable value that looks like them at a glance and must keep
 * serializing identically. It is the control every other vector is read against.
 */
export const UNSUPPORTED_LEAVES = {
  null: () => null,
  undefined: () => undefined,
  function: () => function leaf() {},
  symbol: () => Symbol("leaf"),
  bigint: () => 42n,
  nan: () => Number.NaN,
  infinity: () => Number.POSITIVE_INFINITY,
};

/**
 * `[point, surface, build(leaf)]`. `surface` selects the export pair:
 * `candidateSnapshot` → `canonicalize/digestCandidateSnapshot`,
 * `reviewReceipt` → `canonicalize/digestReviewReceipt`,
 * `acceptanceFingerprint` → `computeAcceptanceFingerprint`.
 */
export const LEGACY_INJECTION_POINTS = [
  [
    "snapshot.baseCommit.hex",
    "candidateSnapshot",
    (leaf) => ({ ...legacySnapshot(), baseCommit: { algorithm: "sha1", hex: leaf } }),
  ],
  [
    "snapshot.changedPaths[0].sizeBytes",
    "candidateSnapshot",
    (leaf) => legacySnapshot([manifestEntry({ sizeBytes: leaf })]),
  ],
  [
    "snapshot.changedPaths[0].path",
    "candidateSnapshot",
    (leaf) => legacySnapshot([manifestEntry({ path: leaf })]),
  ],
  [
    "snapshot.acceptanceFingerprint",
    "candidateSnapshot",
    (leaf) => ({ ...legacySnapshot(), acceptanceFingerprint: leaf }),
  ],
  ["receipt.id", "reviewReceipt", (leaf) => legacyReceipt({ id: leaf })],
  [
    "receipt.findings[0].summary",
    "reviewReceipt",
    (leaf) =>
      legacyReceipt({ findings: [{ id: "f1", severity: "medium", summary: leaf, refs: [] }] }),
  ],
  ["receipt.diagnostics[0]", "reviewReceipt", (leaf) => legacyReceipt({ diagnostics: [leaf] })],
  [
    "fingerprint.inputs[0].blobSha256",
    "acceptanceFingerprint",
    (leaf) => [{ id: "ACCEPTANCE.md", blobSha256: leaf }],
  ],
];

/** The full case list: every injection point × every leaf, in capture order. */
export function legacyCompatCases() {
  const cases = [];
  for (const [point, surface, build] of LEGACY_INJECTION_POINTS) {
    for (const leaf of Object.keys(UNSUPPORTED_LEAVES)) {
      cases.push({
        name: `${point}/${leaf}`,
        point,
        surface,
        value: build(leaf === "null" ? null : UNSUPPORTED_LEAVES[leaf]()),
      });
    }
  }
  return cases;
}

/**
 * The collision class feature 26 named the guard for: an array whose only element
 * is unrepresentable serializes as an EMPTY array, so two different documents bind
 * one digest. The guard closes it on the verification surface; 3.3.0 published it
 * here, so AC8 keeps it — the compatibility suite pins the collision instead of
 * pretending it away.
 */
export function legacyCollisionPair() {
  return {
    empty: legacyReceipt({ diagnostics: [] }),
    unrepresentable: legacyReceipt({ diagnostics: [UNSUPPORTED_LEAVES.function()] }),
  };
}
