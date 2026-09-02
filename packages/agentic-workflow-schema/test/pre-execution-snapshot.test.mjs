// Feature 28 P1 — public-entry suite for PreExecutionArtifactSnapshot v1 (AC1).
//
// Proves the strict shape, the closed vocabularies, undeclared-field refusal, the
// stage matrix, the published bounds, normalized paths, opaque identities, the
// digest/presence context matrix, canonical row ordering, and the bounded redacted
// diagnostic contract.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PRE_EXECUTION_ARTIFACT_KINDS,
  PRE_EXECUTION_CONTEXT_KINDS,
  PRE_EXECUTION_CONTEXT_PRESENCE,
  PRE_EXECUTION_DIAGNOSTIC_CODES,
  PRE_EXECUTION_LIMITS,
  PRE_EXECUTION_SELECTORS,
  PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
  PRE_EXECUTION_STAGES,
  PRE_EXECUTION_UNIT_KINDS,
  validatePreExecutionArtifactSnapshotV1,
  buildPreExecutionArtifactSnapshot,
} from "../dist/index.js";
import {
  DIGEST_A, DIGEST_B, SHA1, SHA256, UNIT_ID, planSnapshot, specSnapshot, toySpec,
} from "./fixtures/pre-execution-documents.mjs";

const codes = (result) => result.diagnostics.map((row) => row.code);
const ok = (value) => validatePreExecutionArtifactSnapshotV1(value);
const rows = (result) => JSON.stringify(result.diagnostics.map((d) => [d.code, d.path]));

// ---------------------------------------------------------------------------
// Published vocabulary and bounds
// ---------------------------------------------------------------------------

test("vocabularies are frozen, closed, and match the SPEC", () => {
  assert.deepEqual([...PRE_EXECUTION_STAGES], ["spec", "plan"]);
  assert.deepEqual([...PRE_EXECUTION_UNIT_KINDS], ["feature", "fix"]);
  assert.deepEqual([...PRE_EXECUTION_SELECTORS], ["whole-file", "spec-product-v1"]);
  assert.deepEqual([...PRE_EXECUTION_CONTEXT_PRESENCE], ["present", "absent"]);
  for (const kind of ["spec", "acceptance", "plan", "tasks", "testing", "decisions",
    "architecture-notes", "planning-evidence", "obligations"]) {
    assert.ok(PRE_EXECUTION_ARTIFACT_KINDS.includes(kind), `artifact kind ${kind} missing`);
  }
  for (const kind of ["roadmap-row", "governing-issue", "normalized-repository-state",
    "architectural-invariants", "dependency-unit", "project-guide"]) {
    assert.ok(PRE_EXECUTION_CONTEXT_KINDS.includes(kind), `context kind ${kind} missing`);
  }
  for (const list of [PRE_EXECUTION_STAGES, PRE_EXECUTION_UNIT_KINDS, PRE_EXECUTION_ARTIFACT_KINDS,
    PRE_EXECUTION_SELECTORS, PRE_EXECUTION_CONTEXT_KINDS, PRE_EXECUTION_CONTEXT_PRESENCE]) {
    assert.equal(Object.isFrozen(list), true, "closed vocabularies are frozen");
  }
});

test("every published limit is a positive integer, and the budgets are reachable below the shape ceilings", () => {
  for (const [key, value] of Object.entries(PRE_EXECUTION_LIMITS)) {
    assert.ok(Number.isInteger(value) && value > 0, `${key} must be a positive integer`);
  }
  // A payload budget that no document inside the other ceilings can reach would be
  // decoration: it must fire first, so the diagnostic ceiling is never spent on it.
  const widestSnapshot = PRE_EXECUTION_LIMITS.artifacts * (PRE_EXECUTION_LIMITS.pathChars + 60);
  assert.ok(PRE_EXECUTION_LIMITS.snapshotBytes < widestSnapshot,
    "a path-saturated snapshot must be refused by the byte budget, not by 32 field rows");
});

// ---------------------------------------------------------------------------
// AC1 — valid entries and the normalized DTO
// ---------------------------------------------------------------------------

test("AC1: a minimal SPEC snapshot validates and normalizes", () => {
  const result = ok(specSnapshot());
  assert.equal(result.ok, true, rows(result));
  assert.equal(result.snapshot.contract, PRE_EXECUTION_SNAPSHOT_CONTRACT_ID);
  assert.deepEqual([...result.diagnostics], []);
  assert.equal(result.truncated, false);
});

test("AC1: a minimal Plan snapshot with a parent validates", () => {
  const result = ok(planSnapshot());
  assert.equal(result.ok, true, rows(result));
  assert.equal(result.snapshot.parentSpecSnapshotDigest, DIGEST_A);
});

test("AC1: both git object-id lengths are exact-accepted", () => {
  assert.equal(ok(specSnapshot({ sourceRevision: SHA256 })).ok, true);
  for (const revision of ["abc123", "g".repeat(40), "f".repeat(63), "f".repeat(65), "F".repeat(40)]) {
    assert.equal(ok(specSnapshot({ sourceRevision: revision })).ok, false, `${revision} refused`);
  }
});

test("the normalized DTO is a copy, never the submitted reference", () => {
  const submitted = specSnapshot();
  const result = ok(submitted);
  assert.equal(result.ok, true, rows(result));
  assert.notEqual(result.snapshot, submitted);
  assert.notEqual(result.snapshot.artifacts, submitted.artifacts);
  submitted.artifacts[0].byteLength = 7;
  assert.equal(result.snapshot.artifacts[0].byteLength, 2048, "later mutation cannot reach the DTO");
});

test("a prototype-inheriting object is not a contract document", () => {
  const proto = { stage: "plan", unitKind: "fix" };
  const submitted = Object.create(proto);
  submitted.contract = PRE_EXECUTION_SNAPSHOT_CONTRACT_ID;
  submitted.unitId = "toy-unit";
  submitted.sourceRevision = SHA1;
  submitted.artifactRevisionId = "rev-1";
  submitted.artifacts = [];
  submitted.contexts = [];
  submitted.parentSpecSnapshotDigest = null;
  const result = ok(submitted);
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes("invalid-type"),
    "inheritance is not own data: the document is refused rather than read through a prototype chain");
});

test("a required field missing from the own keys is named on its own pointer", () => {
  const submitted = specSnapshot();
  delete submitted.stage;
  const result = ok(submitted);
  assert.equal(result.ok, false);
  assert.deepEqual(
    [...result.diagnostics].filter((d) => d.code === "missing-field"),
    [{ code: "missing-field", path: "/stage" }],
  );
});

// ---------------------------------------------------------------------------
// AC1 — closed vocabularies and undeclared fields
// ---------------------------------------------------------------------------

test("AC1: an unknown contract id is refused, including the sibling families", () => {
  for (const contract of [
    "agentic-workflow/pre-execution-artifact-snapshot@2",
    "agentic-workflow/candidate-snapshot@1",
    "agentic-workflow/verification-plan@1",
    "",
    null,
  ]) {
    const result = ok(specSnapshot({ contract }));
    assert.equal(result.ok, false, `${String(contract)} must not validate`);
    assert.ok(codes(result).includes("invalid-value"), `${String(contract)} reports invalid-value`);
  }
});

test("AC1: every undeclared key at every level is refused and names the container only", () => {
  const root = ok(specSnapshot({ extraRoot: 1 }));
  assert.equal(root.ok, false);
  assert.deepEqual([...root.diagnostics], [{ code: "unknown-field", path: "" }]);

  const row = specSnapshot();
  row.artifacts[0].extraRow = 1;
  const rowResult = ok(row);
  assert.deepEqual([...rowResult.diagnostics], [{ code: "unknown-field", path: "/artifacts/0" }]);

  const withContext = specSnapshot({
    contexts: [{ kind: "governing-issue", identifier: "#146", presence: "present", digest: DIGEST_B, extra: 1 }],
  });
  const contextResult = ok(withContext);
  assert.deepEqual([...contextResult.diagnostics], [{ code: "unknown-field", path: "/contexts/0" }]);

  const probe = ok({ ...specSnapshot(), suspicious: 1 });
  assert.equal(JSON.stringify(probe).includes("suspicious"), false, "a submitted key is never echoed");
});

test("AC1: closed enums reject near-miss values with invalid-value on that field alone", () => {
  for (const [field, value] of [
    ["stage", "specs"],
    ["stage", "SPEC"],
    ["unitKind", "feature-request"],
    ["unitKind", "docs"],
  ]) {
    const result = ok(specSnapshot({ [field]: value }));
    assert.equal(result.ok, false, `${field}=${value}`);
    assert.deepEqual(
      result.diagnostics.filter((d) => d.code === "invalid-value").map((d) => d.path),
      [`/${field}`],
      `${field}=${value} must answer exactly one vocabulary row on its own pointer`,
    );
  }
});

test("AC1: artifact kind and selector vocabularies are closed", () => {
  const badKind = specSnapshot();
  badKind.artifacts[0].kind = "readme";
  assert.ok(codes(ok(badKind)).includes("invalid-value"));

  const badSelector = specSnapshot();
  badSelector.artifacts[0].selector = "spec-product-v2";
  assert.ok(codes(ok(badSelector)).includes("invalid-value"));

  const badType = specSnapshot();
  badType.artifacts[0].selector = 1;
  assert.ok(codes(ok(badType)).includes("invalid-value"), "a non-string enum value is still refused");
});

// ---------------------------------------------------------------------------
// AC1 — the stage matrix
// ---------------------------------------------------------------------------

test("AC1: stage drives parent and selector requirements", () => {
  assert.ok(codes(ok(specSnapshot({ parentSpecSnapshotDigest: DIGEST_A }))).includes("invalid-value"),
    "a SPEC snapshot is the root of its own lineage");
  assert.ok(codes(ok(planSnapshot({ parentSpecSnapshotDigest: null }))).includes("invalid-value"),
    "a FEATURE Plan snapshot requires its parent (RS14 narrowed the rule to the unit family, it did not relax it here)");
  assert.ok(codes(ok(planSnapshot({ parentSpecSnapshotDigest: "z".repeat(64) }))).includes("invalid-value"),
    "a 64-character non-hex string is the shape a truncation bug produces");

  const projectionAtPlanStage = ok(planSnapshot({
    artifacts: [{
      kind: "spec", path: "docs/x/SPEC.md", selector: "spec-product-v1", byteLength: 10, digest: DIGEST_A,
    }],
  }));
  assert.ok(codes(projectionAtPlanStage).includes("invalid-value"),
    "the Product projection selector belongs to the SPEC stage only");

  const wholeFileAtSpecStage = ok(specSnapshot({
    artifacts: [{
      kind: "spec", path: "docs/x/SPEC.md", selector: "whole-file", byteLength: 10, digest: DIGEST_A,
    }],
  }));
  assert.ok(codes(wholeFileAtSpecStage).includes("invalid-value"),
    "a SPEC-stage snapshot binds the Product projection, never the whole mutable file");
});

test("AC1: a SPEC-stage row of the wrong kind is refused at the kind (F65)", () => {
  // The pointer is what a driver repairs. This row carries the sanctioned
  // `spec-product-v1` selector and a wrong kind, so naming `/selector` sends the
  // caller patching a member that was already correct.
  const wrongKind = ok(specSnapshot({
    artifacts: [{
      kind: "acceptance", path: "docs/x/SPEC.md", selector: "spec-product-v1", byteLength: 10, digest: DIGEST_A,
    }],
  }));
  assert.ok(rows(wrongKind).includes('["invalid-value","/artifacts/0/kind"]'),
    `the offending member must be named, got ${rows(wrongKind)}`);
  assert.equal(wrongKind.diagnostics.some((d) => d.path === "/artifacts/0/selector"), false,
    "a correct selector must not be reported as the offender");

  // The selector half of the same clause keeps pointing at the selector.
  const wrongSelector = ok(specSnapshot({
    artifacts: [{ kind: "spec", path: "docs/x/SPEC.md", selector: "whole-file", byteLength: 10, digest: DIGEST_A }],
  }));
  assert.ok(rows(wrongSelector).includes('["invalid-value","/artifacts/0/selector"]'),
    `the selector must be named, got ${rows(wrongSelector)}`);
});

test("AC1: a fix unit has no Product half, so the spec stage refuses it and the parentless plan stage is the fix path", () => {
  const result = ok(specSnapshot({ unitKind: "fix" }));
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes("invalid-value"));
  // RS14: the same bytes at plan stage are the fix unit, and a fix unit has no
  // Product snapshot to bind — `SNAPSHOT.md` never promised one it could build,
  // because `spec-product-v1` refuses a fix SPEC (no `Size`/`Product half`).
  assert.equal(ok(planSnapshot({ unitKind: "fix", parentSpecSnapshotDigest: null })).ok, true,
    rows(ok(planSnapshot({ unitKind: "fix", parentSpecSnapshotDigest: null }))));
  assert.ok(codes(ok(planSnapshot({ unitKind: "fix", parentSpecSnapshotDigest: DIGEST_A }))).includes("invalid-value"),
    "a fix unit that names a parent pretends a Product review happened");
});

test("RS14: the parent rule is a compound predicate over stage AND unitKind", () => {
  // The one sanctioned `stage: spec` binding (`spec-product-v1`) is unreachable for
  // a fix unit, so `parentSpecSnapshotDigest` is required exactly when
  // `stage == plan && unitKind == feature` and null otherwise.
  const matrix = [
    ["spec", "feature", null, true],
    ["spec", "feature", DIGEST_A, false],
    ["plan", "feature", DIGEST_A, true],
    ["plan", "feature", null, false],
    ["plan", "fix", null, true],
    ["plan", "fix", DIGEST_A, false],
  ];
  for (const [stage, unitKind, parent, expected] of matrix) {
    const document = stage === "spec"
      ? specSnapshot({ unitKind, parentSpecSnapshotDigest: parent })
      : planSnapshot({ unitKind, parentSpecSnapshotDigest: parent });
    assert.equal(ok(document).ok, expected, `${stage}/${unitKind}/parent=${String(parent)} → ${rows(ok(document))}`);
  }
});

test("RS14: the builder produces a parentless fix plan snapshot from caller bytes", () => {
  const fixSpec = "# Fix 78 — closure integrity\n\n## Goal\n\nClose the gate.\n\n## Scope\n\n- the audit\n";
  const built = buildPreExecutionArtifactSnapshot({
    stage: "plan",
    unitKind: "fix",
    unitId: "fix-78",
    sourceRevision: SHA1,
    artifactRevisionId: "rev-1",
    files: [
      { kind: "spec", path: "docs/fix/78-audit-pr-closure-integrity/SPEC.md", content: fixSpec },
      { kind: "acceptance", path: "docs/fix/78-audit-pr-closure-integrity/ACCEPTANCE.md", content: "# Acceptance\n" },
    ],
    contexts: [],
  });
  assert.equal(built.ok, true, JSON.stringify(built.diagnostics));
  assert.equal(built.snapshot.parentSpecSnapshotDigest, null, "a fix plan roots its own lineage");
  // The feature twin still refuses the same shape: the rule narrowed, it did not
  // become a suggestion.
  const feature = buildPreExecutionArtifactSnapshot({
    stage: "plan",
    unitKind: "feature",
    unitId: UNIT_ID,
    sourceRevision: SHA1,
    artifactRevisionId: "rev-1",
    files: [
      { kind: "spec", path: `docs/features/${UNIT_ID}/SPEC.md`, content: toySpec() },
      { kind: "acceptance", path: `docs/features/${UNIT_ID}/ACCEPTANCE.md`, content: "# Acceptance\n" },
    ],
    contexts: [],
  });
  assert.equal(feature.ok, false);
  assert.deepEqual(
    feature.diagnostics.filter((row) => row.path === "/parentSpecSnapshotDigest"),
    [{ code: "invalid-value", path: "/parentSpecSnapshotDigest" }],
  );
});

test("AC1: the plan required set is SPEC + ACCEPTANCE, extras are additive", () => {
  for (const artifacts of [
    [{ kind: "spec", path: "docs/x/SPEC.md", selector: "whole-file", byteLength: 1, digest: DIGEST_A }],
    [{ kind: "acceptance", path: "docs/x/ACCEPTANCE.md", selector: "whole-file", byteLength: 1, digest: DIGEST_A }],
  ]) {
    const result = ok(planSnapshot({ artifacts }));
    assert.ok(codes(result).includes("missing-artifact-kind"), JSON.stringify(artifacts[0].kind));
  }
  const withLedgers = ok(planSnapshot({
    artifacts: [
      { kind: "acceptance", path: "docs/x/ACCEPTANCE.md", selector: "whole-file", byteLength: 1, digest: DIGEST_A },
      { kind: "obligations", path: "docs/x/OBLIGATIONS.md", selector: "whole-file", byteLength: 1, digest: DIGEST_A },
      { kind: "spec", path: "docs/x/SPEC.md", selector: "whole-file", byteLength: 1, digest: DIGEST_B },
      { kind: "tasks", path: "docs/x/TASKS.md", selector: "whole-file", byteLength: 1, digest: DIGEST_A },
      { kind: "testing", path: "docs/x/testing.md", selector: "whole-file", byteLength: 1, digest: DIGEST_A },
    ],
  }));
  assert.equal(withLedgers.ok, true, rows(withLedgers));
  assert.ok(codes(ok(planSnapshot({ artifacts: [] }))).includes("limit-exceeded"),
    "an empty artifact row list is a cardinality failure");
});

// ---------------------------------------------------------------------------
// AC1 — paths, digests, identities, contexts, ordering
// ---------------------------------------------------------------------------

test("AC1: paths are normalized repository-relative", () => {
  const base = { kind: "spec", selector: "spec-product-v1", byteLength: 1, digest: DIGEST_A };
  const bad = [
    "/etc/passwd",
    "./docs/x/SPEC.md",
    "../outside/SPEC.md",
    "docs/../outside/SPEC.md",
    "docs\\x\\SPEC.md",
    "C:/docs/SPEC.md",
    "docs/x/",
    "docs//x/SPEC.md",
    "docs/x/./SPEC.md",
    "",
  ];
  for (const path of bad) {
    const result = ok(specSnapshot({ artifacts: [{ ...base, path }] }));
    assert.equal(result.ok, false, `${JSON.stringify(path)} must be refused`);
    assert.ok(codes(result).includes("invalid-value"), `${JSON.stringify(path)} → invalid-value`);
  }
  for (const path of ["SPEC.md", "docs/a-b_c.SPEC.md", "docs/28-unit/SPEC.md"]) {
    assert.equal(ok(specSnapshot({ artifacts: [{ ...base, path }] })).ok, true, `${path} accepted`);
  }
});

test("AC1: digests are lowercase 64-hex; identities are bounded and NUL-free", () => {
  const base = { kind: "spec", path: "docs/x/SPEC.md", selector: "spec-product-v1", byteLength: 1 };
  for (const digest of ["A".repeat(64), "a".repeat(63), "a".repeat(65), "", "z".repeat(64), null, 64]) {
    assert.equal(ok(specSnapshot({ artifacts: [{ ...base, digest }] })).ok, false,
      `digest ${JSON.stringify(digest)} must be refused`);
  }
  for (const bad of ["", " ".repeat(200), "a".repeat(PRE_EXECUTION_LIMITS.unitIdChars + 1), "x\0y"]) {
    assert.equal(ok(specSnapshot({ unitId: bad })).ok, false, `unitId ${JSON.stringify(bad.slice(0, 8))}`);
    assert.equal(ok(specSnapshot({ artifactRevisionId: bad })).ok, false,
      `revision ${JSON.stringify(bad.slice(0, 8))}`);
  }
  assert.equal(ok(specSnapshot({ unitId: "a".repeat(PRE_EXECUTION_LIMITS.unitIdChars) })).ok, true,
    "the exact boundary is accepted");
  assert.equal(ok(specSnapshot({ unitId: "docs/fix/74-oops" })).ok, true,
    "an opaque identity may carry separators; nothing resolves it");
});

test("AC1: an empty artifactRevisionId is refused — causal identity is mandatory", () => {
  assert.equal(ok(specSnapshot({ artifactRevisionId: "" })).ok, false);
});

test("AC1: context bindings carry the exact digest/presence matrix", () => {
  assert.ok(codes(ok(specSnapshot({
    contexts: [{ kind: "governing-issue", identifier: "#146", presence: "present", digest: null }],
  }))).includes("invalid-value"), "a present authority must be bound by digest");

  assert.ok(codes(ok(specSnapshot({
    contexts: [{ kind: "governing-issue", identifier: "#146", presence: "absent", digest: DIGEST_A }],
  }))).includes("invalid-value"), "an absent authority binds exactly null");

  assert.equal(ok(specSnapshot({
    contexts: [{
      kind: "normalized-repository-state",
      identifier: "2026-08-30-first-pass-convergence",
      presence: "absent",
      digest: null,
    }],
  })).ok, true, "an absent authority is a first-class row, not a skipped field");
});

test("AC1: context rows are unique by identity and byte-ordered", () => {
  assert.ok(codes(ok(specSnapshot({
    contexts: [
      { kind: "governing-issue", identifier: "#146", presence: "present", digest: DIGEST_A },
      { kind: "governing-issue", identifier: "#146", presence: "absent", digest: null },
    ],
  }))).includes("duplicate-id"), "one authority cannot be both present and absent");

  assert.ok(codes(ok(specSnapshot({
    contexts: [
      { kind: "project-guide", identifier: "b", presence: "absent", digest: null },
      { kind: "governing-issue", identifier: "a", presence: "absent", digest: null },
    ],
  }))).includes("invalid-order"), "canonical order is declared, not assumed");

  assert.equal(ok(specSnapshot({
    contexts: [
      { kind: "architectural-invariants", identifier: "a", presence: "absent", digest: null },
      { kind: "project-guide", identifier: "b", presence: "absent", digest: null },
    ],
  })).ok, true, rows(ok(specSnapshot())));
});

test("AC1: artifact rows are unique by kind and path and byte-ordered by path", () => {
  const dupPath = planSnapshot();
  dupPath.artifacts[1].path = dupPath.artifacts[0].path;
  assert.ok(codes(ok(dupPath)).includes("duplicate-id"), "one path cannot bind two selections");

  assert.ok(codes(ok(planSnapshot({
    artifacts: [
      { kind: "acceptance", path: "docs/x/A.md", selector: "whole-file", byteLength: 1, digest: DIGEST_A },
      { kind: "acceptance", path: "docs/x/B.md", selector: "whole-file", byteLength: 1, digest: DIGEST_B },
    ],
  }))).includes("duplicate-id"), "one role cannot bind two files");

  assert.ok(codes(ok(planSnapshot({
    artifacts: [
      { kind: "spec", path: "docs/x/SPEC.md", selector: "whole-file", byteLength: 1, digest: DIGEST_A },
      { kind: "acceptance", path: "docs/x/ACCEPTANCE.md", selector: "whole-file", byteLength: 1, digest: DIGEST_B },
    ],
  }))).includes("invalid-order"), "ACCEPTANCE.md sorts before SPEC.md");
});

// ---------------------------------------------------------------------------
// AC1 — bounds and redacted diagnostics
// ---------------------------------------------------------------------------

test("AC1: every cardinality ceiling is exact at the boundary and rejected one past it", () => {
  const ledger = (n) => ({
    kind: n === 0 ? "spec" : "acceptance",
    path: `docs/x/a-${String(n).padStart(3, "0")}.md`,
    selector: "whole-file",
    byteLength: 1,
    digest: DIGEST_A,
  });
  const at = planSnapshot({
    artifacts: Array.from({ length: PRE_EXECUTION_LIMITS.artifacts }, (_, i) => ledger(i)),
  });
  const over = planSnapshot({
    artifacts: Array.from({ length: PRE_EXECUTION_LIMITS.artifacts + 1 }, (_, i) => ledger(i)),
  });
  assert.ok(codes(ok(over)).includes("limit-exceeded"), "one row past the ceiling is refused");
  assert.equal(ok(at).ok, false, "duplicate kinds are refused independently of the ceiling");

  const manyContexts = (n) => specSnapshot({
    contexts: Array.from({ length: n }, (_, i) => ({
      kind: "project-guide",
      identifier: `guide-${String(i).padStart(4, "0")}`,
      presence: "absent",
      digest: null,
    })),
  });
  assert.equal(ok(manyContexts(PRE_EXECUTION_LIMITS.contexts)).ok, true, "the exact ceiling validates");
  assert.ok(codes(ok(manyContexts(PRE_EXECUTION_LIMITS.contexts + 1))).includes("limit-exceeded"));
});

test("AC1: byteLength is bounded by the published per-artifact ceiling", () => {
  const base = { kind: "spec", path: "docs/x/SPEC.md", selector: "spec-product-v1", digest: DIGEST_A };
  assert.equal(ok(specSnapshot({ artifacts: [{ ...base, byteLength: PRE_EXECUTION_LIMITS.artifactBytes }] })).ok, true,
    "the exact ceiling validates");
  assert.ok(codes(ok(specSnapshot({
    artifacts: [{ ...base, byteLength: PRE_EXECUTION_LIMITS.artifactBytes + 1 }],
  }))).includes("limit-exceeded"));
  assert.equal(ok(specSnapshot({ artifacts: [{ ...base, byteLength: -1 }] })).ok, false);
  assert.equal(ok(specSnapshot({ artifacts: [{ ...base, byteLength: 1.5 }] })).ok, false);
});

test("AC1: an oversized payload is refused by the budget alone, with one redacted row", () => {
  const wide = specSnapshot();
  wide.artifacts = Array.from({ length: PRE_EXECUTION_LIMITS.artifacts }, (_, i) => ({
    kind: i === 0 ? "spec" : "acceptance",
    path: `docs/x/${String(i).padStart(3, "0")}-${"y".repeat(PRE_EXECUTION_LIMITS.pathChars)}.md`,
    selector: "whole-file",
    byteLength: 1,
    digest: DIGEST_A,
  }));
  const result = ok(wide);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.length, 1, "the budget answers before per-field rows are spent");
  assert.deepEqual({ ...result.diagnostics[0] }, { code: "limit-exceeded", path: "" });
  assert.equal(result.truncated, false, "one row seen is not a truncated report");
});

test("AC1: diagnostics stay bounded, redacted, and never echo a submitted value", () => {
  const secret = "attacker-controlled-secret-value";
  const result = ok(specSnapshot({
    sourceRevision: secret,
    stage: secret,
    unitKind: secret,
    parentSpecSnapshotDigest: secret,
  }));
  assert.equal(result.ok, false);
  assert.ok(result.diagnostics.length <= PRE_EXECUTION_LIMITS.diagnostics);
  assert.equal(JSON.stringify(result).includes(secret), false, "no submitted value is ever echoed");
  for (const row of result.diagnostics) {
    assert.ok(PRE_EXECUTION_DIAGNOSTIC_CODES.includes(row.code), `unknown code ${row.code}`);
    assert.match(row.path, /^($|\/[A-Za-z0-9/_-]*)$/, "a pointer carries declared names and indices only");
    assert.equal(Object.isFrozen(row), true);
  }
  assert.equal(Object.isFrozen(result.diagnostics), true);
});

test("a pathological document cannot make the validator allocate one diagnostic per field", () => {
  const wide = { contract: PRE_EXECUTION_SNAPSHOT_CONTRACT_ID };
  for (let i = 0; i < 500; i += 1) wide[`e${i}`] = 0;
  const result = ok(wide);
  assert.equal(result.ok, false);
  assert.equal(result.diagnostics.length, PRE_EXECUTION_LIMITS.diagnostics, "the sink ceiling holds");
  assert.equal(result.truncated, true, "and the report says it is not the whole story");
});

test("an input outside the JSON data model never smuggles its own exception", () => {
  const hostile = {
    contract: PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
    get stage() {
      throw new Error("attacker-chosen message");
    },
  };
  const result = ok(hostile);
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes("invalid-type"));
  assert.equal(JSON.stringify(result).includes("attacker-chosen"), false);
});

test("non-object submissions are refused, not thrown", () => {
  for (const value of [null, undefined, 0, "", [], true, () => {}]) {
    const result = ok(value);
    assert.equal(result.ok, false, `${String(value)} refused`);
    assert.ok(codes(result).includes("invalid-type") || codes(result).includes("invalid-value"));
  }
});
