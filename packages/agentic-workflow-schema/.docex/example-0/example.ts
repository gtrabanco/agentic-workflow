import {
  buildPreExecutionArtifactSnapshot,
  comparePreExecutionReceiptToSnapshot,
  digestPreExecutionArtifactSnapshot,
  selectSpecProduct,
  validatePreExecutionReceiptAgainstSnapshot,
} from "../../dist/index.js";

const POLICY_VERSION = "2026-08-30";

// The caller reads the documents: this package never touches Git or the filesystem.
const spec = [
  "# Toy feature", "", "## Goal", "", "Ship one usable slice.", "",
  "## Branch", "", "`feat/toy`", "", "## Size", "", "`S`", "",
  "## Dependencies", "", "- none", "", "## Product half", "", "### Scope", "",
  "- **S1:** the slice.", "", "## Design status", "", "`designed`", "",
].join("\n");

/** 1. Freeze the exact bytes a reviewer may rely on, at one causal revision. */
function freeze(artifactRevisionId: string) {
  const built = buildPreExecutionArtifactSnapshot({
    stage: "spec",
    unitKind: "feature",
    unitId: "toy",
    sourceRevision: "8ab22ea6c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
    artifactRevisionId,
    files: [{ kind: "spec", path: "docs/features/toy/SPEC.md", content: spec }],
    contexts: [{ kind: "governing-issue", identifier: "#146", content: "the issue body" }],
  });
  const snapshot = built.ok ? built.snapshot : undefined;
  if (!snapshot) throw new Error(JSON.stringify(built.diagnostics));
  return snapshot;
}

const snapshot = freeze("rev-0001");

// 2. A reviewer records a verdict bound to that digest, never to the mutable file.
const receipt = {
  contract: "agentic-workflow/pre-execution-review-receipt@1",
  id: "review-0001",
  stage: snapshot.stage,
  snapshotDigest: digestPreExecutionArtifactSnapshot(snapshot),
  verdict: "spec-review-pass",
  findings: [],
  reviewer: "reviewer-7",
  sessionId: "session-7",
  reviewerRole: "reviewer",
  authorId: "author-3",
  authorExclusion: "enforced",
  contextClean: true,
  modelDiversity: "cross-model",
  policyVersion: POLICY_VERSION,
  startedAt: "2026-08-30T00:00:00Z",
  finishedAt: "2026-08-30T00:04:00Z",
  parentReceipts: [],
  diagnostics: [],
};

// 3. Only this entry can bless a PASS; it answers with codes, never submitted values.
const blessed = validatePreExecutionReceiptAgainstSnapshot(receipt, snapshot, POLICY_VERSION);
if (!blessed.ok) throw new Error(JSON.stringify(blessed.diagnostics));

// 4. Before executing, freeze again: unchanged authority stays fresh.
const fresh = comparePreExecutionReceiptToSnapshot(
  receipt, snapshot, freeze("rev-0001"), POLICY_VERSION,
);
if (fresh.fresh !== true) throw new Error(JSON.stringify(fresh));

// 5. Edit, revert, and rotate the revision anyway and the PASS is void: a stale
//    approval can never be resurrected by restoring the previous bytes.
const stale = comparePreExecutionReceiptToSnapshot(
  receipt, snapshot, freeze("rev-0002"), POLICY_VERSION,
);
if (stale.fresh === true || stale.reasonCode !== "stale-artifact-revision") {
  throw new Error(JSON.stringify(stale));
}

// 6. The projection is why a plan-side write cannot erase Product lineage: the
//    selector never saw anything outside the named Product headings.
const projection = selectSpecProduct(`${spec}\n## Engineering half\n\n### Phases\n\n- P1\n`);
if (projection.ok !== true) throw new Error(JSON.stringify(projection.errors));
if (projection.content.includes("Engineering half")) throw new Error("the projection leaked");

console.log("review bound", projection.byteLength, receipt.snapshotDigest.slice(0, 12), fresh, stale);
