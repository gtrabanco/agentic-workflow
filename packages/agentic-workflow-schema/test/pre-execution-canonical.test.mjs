// Feature 28 P1 — suite for the deterministic Product selector, the stage-aware
// artifact-set builder, canonical serialization, digests, and the published
// independently-checked vectors (AC1, AC2).
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  PRE_EXECUTION_CANONICAL_VECTORS,
  PRE_EXECUTION_RECEIPT_CONTRACT_ID,
  PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
  PRE_EXECUTION_SNAPSHOT_SELECTOR,
  SPEC_PRODUCT_REQUIRED_HEADINGS,
  buildPreExecutionArtifactSnapshot,
  canonicalizePreExecutionArtifactSnapshot,
  canonicalizePreExecutionReviewReceipt,
  digestPreExecutionArtifactSnapshot,
  digestPreExecutionReviewReceipt,
  selectSpecProduct,
  validatePreExecutionArtifactSnapshotV1,
  validatePreExecutionReceiptAgainstSnapshot,
  validatePreExecutionReviewReceiptV1,
} from "../dist/index.js";
import {
  DIGEST_A,
  POLICY_VERSION,
  SHA1,
  UNIT_ID,
  planInput,
  specInput,
  toySpec,
} from "./fixtures/pre-execution-documents.mjs";
import { sha256Hex, sha256HexSync } from "../dist/sha256.js";
import vectors, { PRE_EXECUTION_VECTORS } from "./fixtures/pre-execution-vectors.mjs";

const specBuild = (overrides = {}) =>
  buildPreExecutionArtifactSnapshot(specInput(overrides));

// ---------------------------------------------------------------------------
// selectSpecProduct — exact selection
// ---------------------------------------------------------------------------

test("the selector returns exactly the named blocks, in order, byte-stably", () => {
  const text = toySpec();
  const first = selectSpecProduct(text);
  assert.equal(first.ok, true, JSON.stringify(first.errors ?? null));
  assert.match(first.content, /^# Toy feature/);
  assert.match(first.content, /## Design status\n\n`designed`\n$/);
  assert.equal(first.content, selectSpecProduct(text).content, "pure and deterministic");
  assert.equal(first.byteLength, Buffer.byteLength(first.content, "utf8"));
  assert.equal(first.digest, createHash("sha256").update(first.content, "utf8").digest("hex"),
    "the digest is lowercase SHA-256 over the selection bytes");
});

test("the selector stops before Amendments and the Engineering half", () => {
  const text = `${toySpec()}---\n\n## Amendments\n\n| Date | Authority | Change |\n\n---\n\n## Engineering half\n\n### Phases\n\n#### P1 — nope\n`;
  const result = selectSpecProduct(text);
  assert.equal(result.ok, true);
  assert.equal(result.content.includes("## Amendments"), false, "Amendments is not Product authority");
  assert.equal(result.content.includes("nope"), false);
});

test("engineering-half edits leave the Product projection byte-identical (D2)", () => {
  const base = toySpec();
  const before = selectSpecProduct(base);
  const after = selectSpecProduct(`${base}\n## Engineering half\n\n### Design\n\nnew text\n`);
  assert.equal(before.ok, true);
  assert.equal(after.ok, true);
  assert.equal(before.digest, after.digest, "a Plan write must not erase Product lineage");
});

test("missing, duplicate, and out-of-order required headings fail with one named heading", () => {
  const missing = selectSpecProduct(toySpec({ Goal: undefined }));
  assert.equal(missing.ok, false);
  assert.deepEqual([...missing.errors], [{ code: "selector-heading-missing", heading: "Goal" }]);

  const duplicated = selectSpecProduct(`${toySpec()}\n## Goal\n\nsecond one\n`);
  assert.equal(duplicated.ok, false);
  assert.deepEqual([...duplicated.errors], [{ code: "selector-heading-duplicate", heading: "Goal" }]);

  const swapped = selectSpecProduct(
    "# Toy\n\n## Goal\n\nx\n\n## Branch\n\nb\n\n## Size\n\ns\n\n## Dependencies\n\nd\n\n## Design status\n\n`designed`\n\n## Product half\n\np\n",
  );
  assert.equal(swapped.ok, false);
  assert.deepEqual([...swapped.errors], [{ code: "selector-heading-order", heading: "Product half" }]);

  assert.equal(selectSpecProduct("").ok, false);
  assert.equal(selectSpecProduct("## Goal\n\nx\n").ok, false, "no title");
  assert.deepEqual([...selectSpecProduct("## Goal\n\nx\n").errors],
    [{ code: "selector-title-missing", heading: "<title>" }]);
  assert.equal(selectSpecProduct(null).ok, false, "a non-string is refused, not thrown");
});

test("heading matching is exact and level-precise, not a substring", () => {
  assert.equal(selectSpecProduct(toySpec({ Goal: "## Goals\n\nplural\n" })).ok, false);
  assert.equal(selectSpecProduct(toySpec({ Goal: "### Goal\n\nwrong level\n" })).ok, false);
  assert.equal(selectSpecProduct(toySpec({ Goal: "## goal\n\ncase folded\n" })).ok, false);
  assert.equal(selectSpecProduct(toySpec({ Goal: "## Goal \n\ntrailing space heading\n" })).ok, false,
    "a heading with trailing text is not the named section");
});

test("a fenced block cannot fake a heading, and its bytes stay bound", () => {
  const fencedProductHalf = "## Product half\n\n### Template\n\n```md\n## Goal\n\ninside a fence\n```\n";
  const result = selectSpecProduct(toySpec({ "Product half": fencedProductHalf }));
  assert.equal(result.ok, true,
    "a `## Goal` inside a template is neither a duplicate nor a boundary · " + JSON.stringify(result.errors ?? null));
  assert.ok(result.content.includes("inside a fence"),
    "fenced bytes belong to the section that contains them: under-binding would leave an edit unchecked");

  const trailing = selectSpecProduct(`${toySpec()}\n\`\`\`md\n## Goal\n\nafter design status\n\`\`\`\n`);
  assert.equal(trailing.ok, true, "the fence after the last required section is still inert");
});

test("CRLF input selects the same bytes as LF input", () => {
  const lf = toySpec();
  const crlf = lf.replace(/\n/g, "\r\n");
  assert.equal(selectSpecProduct(crlf).digest, selectSpecProduct(lf).digest);
  assert.equal(selectSpecProduct(crlf).content, selectSpecProduct(lf).content);
});

test("the real feature-28 SPEC selects cleanly", () => {
  const text = readFileSync(
    fileURLToPath(new URL("../../../docs/features/28-evidence-grounded-spec-plan-review/SPEC.md", import.meta.url)),
    "utf8",
  );
  const result = selectSpecProduct(text);
  assert.equal(result.ok, true, JSON.stringify(result.errors ?? null));
  assert.match(result.content, /evidence-grounded-spec-plan-review/);
  assert.equal(result.content.includes("## Engineering half"), false);
  assert.equal(result.content.includes("## Amendments"), false);
  for (const heading of SPEC_PRODUCT_REQUIRED_HEADINGS) {
    assert.ok(result.content.includes(`## ${heading}\n`), `${heading} is inside the projection`);
  }
});

// ---------------------------------------------------------------------------
// buildPreExecutionArtifactSnapshot — stage-aware set from caller bytes
// ---------------------------------------------------------------------------

test("the builder derives digests and byte lengths and orders rows canonically", async () => {
  const built = specBuild();
  assert.equal(built.ok, true, JSON.stringify(built.diagnostics ?? null));
  const row = built.snapshot.artifacts[0];
  const expected = selectSpecProduct(toySpec());
  assert.equal(row.selector, PRE_EXECUTION_SNAPSHOT_SELECTOR);
  assert.equal(row.digest, expected.digest, "the SPEC row binds the Product projection, not the file");
  assert.equal(row.byteLength, expected.byteLength);
  assert.equal(validatePreExecutionArtifactSnapshotV1(built.snapshot).ok, true);
  assert.equal(await digestPreExecutionArtifactSnapshot(built.snapshot), await digestPreExecutionArtifactSnapshot(built.snapshot));
});

test("the builder refuses a SPEC-stage set with more than the projection row", () => {
  const built = buildPreExecutionArtifactSnapshot({
    ...specInput(),
    files: [
      { kind: "spec", path: "docs/toy/SPEC.md", content: toySpec() },
      { kind: "acceptance", path: "docs/toy/ACCEPTANCE.md", content: "# A\n" },
    ],
  });
  assert.equal(built.ok, false);
  assert.ok(built.diagnostics.some((d) => d.code === "invalid-artifact-set"), JSON.stringify(built.diagnostics));
});

test("the plan set requires SPEC + ACCEPTANCE and accepts the size-applicable extras", () => {
  const minimal = buildPreExecutionArtifactSnapshot(planInput(DIGEST_A));
  assert.equal(minimal.ok, true, JSON.stringify(minimal.diagnostics ?? null));
  assert.deepEqual(minimal.snapshot.artifacts.map((r) => r.path),
    ["docs/toy/ACCEPTANCE.md", "docs/toy/SPEC.md", "docs/toy/planning-evidence.md"],
    "rows are ordered by path BYTES — so `ACCEPTANCE.md` precedes `planning-evidence.md`, "
    + "which no locale-aware or case-insensitive sort would answer");

  const withLedgers = buildPreExecutionArtifactSnapshot(planInput(DIGEST_A, {
    files: [
      { kind: "spec", path: "docs/toy/SPEC.md", content: toySpec() },
      { kind: "acceptance", path: "docs/toy/ACCEPTANCE.md", content: "# A\n" },
      { kind: "planning-evidence", path: "docs/toy/planning-evidence.md", content: "# E\n" },
      { kind: "obligations", path: "docs/toy/planning-obligations.md", content: "# O\n" },
      { kind: "tasks", path: "docs/toy/TASKS.md", content: "# T\n" },
      { kind: "testing", path: "docs/toy/testing.md", content: "# V\n" },
      { kind: "decisions", path: "docs/toy/decisions.md", content: "# D\n" },
      { kind: "architecture-notes", path: "docs/toy/architecture-notes.md", content: "# N\n" },
    ],
  }));
  assert.equal(withLedgers.ok, true, JSON.stringify(withLedgers.diagnostics ?? null));

  const missing = buildPreExecutionArtifactSnapshot(planInput(DIGEST_A, {
    files: [{ kind: "spec", path: "docs/toy/SPEC.md", content: toySpec() }],
  }));
  assert.equal(missing.ok, false);
  assert.ok(missing.diagnostics.some((d) => d.code === "missing-artifact-kind"));
});

test("the builder never reads the filesystem or Git", () => {
  const built = specBuild();
  assert.equal(built.ok, true);
  const [context] = built.snapshot.contexts;
  assert.equal(context.presence, "present");
  assert.equal(context.digest, createHash("sha256").update("issue body", "utf8").digest("hex"),
    "a supplied authority is hashed from caller bytes");

  const absent = buildPreExecutionArtifactSnapshot(specInput({
    contexts: [{ kind: "architectural-invariants", presence: "absent", identifier: "n/a" }],
  }));
  assert.equal(absent.ok, true, JSON.stringify(absent.diagnostics ?? null));
  assert.deepEqual([...absent.snapshot.contexts], [
    { kind: "architectural-invariants", identifier: "n/a", presence: "absent", digest: null },
  ]);

  const contradictory = buildPreExecutionArtifactSnapshot(specInput({
    contexts: [{ kind: "project-guide", identifier: "AGENTS", presence: "absent", content: "read it anyway" }],
  }));
  assert.equal(contradictory.ok, false, "a row cannot claim an authority is missing and bind its bytes");
  assert.ok(contradictory.diagnostics.some((d) => d.code === "invalid-context"));
});

test("a rejected selection fails the build with the selector's own code", () => {
  const built = buildPreExecutionArtifactSnapshot(specInput({
    files: [{ kind: "spec", path: "docs/toy/SPEC.md", content: "# Toy\n\n## Goal\n\nx\n" }],
  }));
  assert.equal(built.ok, false);
  assert.ok(built.diagnostics.some((d) => d.code === "invalid-selector"), JSON.stringify(built.diagnostics));
});

test("a builder input outside the contract is refused, never thrown", () => {
  for (const junk of [null, 0, "x", [], {}, { ...specInput(), files: undefined }]) {
    const built = buildPreExecutionArtifactSnapshot(junk);
    assert.equal(built.ok, false, `${JSON.stringify(junk)} refused`);
    assert.ok(built.diagnostics.length > 0);
  }
});

// ---------------------------------------------------------------------------
// Canonicalization + digests
// ---------------------------------------------------------------------------

test("canonical form sorts object keys and preserves declared array order", () => {
  const canonical = canonicalizePreExecutionArtifactSnapshot(planLikeDocument());
  assert.equal(canonical.startsWith('{"artifactRevisionId"'), true, "keys are sorted");
  const parsed = JSON.parse(canonical);
  assert.deepEqual(parsed.artifacts.map((r) => r.path), planLikeDocument().artifacts.map((r) => r.path),
    "array order is preserved, never re-sorted by the serializer");
  assert.ok(canonical.includes("parentSpecSnapshotDigest"));
  assert.equal(canonical.includes('": '), false, "compact separators");
  assert.equal(canonical.includes("\n"), false, "no pretty printing");
});

function planLikeDocument() {
  return {
    contract: PRE_EXECUTION_SNAPSHOT_CONTRACT_ID,
    stage: "plan",
    unitKind: "feature",
    unitId: UNIT_ID,
    sourceRevision: SHA1,
    artifactRevisionId: "rev-0002",
    artifacts: [
      { kind: "acceptance", path: "docs/x/ACCEPTANCE.md", selector: "whole-file", byteLength: 3, digest: DIGEST_A },
      { kind: "spec", path: "docs/x/SPEC.md", selector: "whole-file", byteLength: 4, digest: DIGEST_A },
    ],
    contexts: [],
    parentSpecSnapshotDigest: DIGEST_A,
  };
}

test("canonicalization refuses leaves outside the JSON data model by name", () => {
  const poisoned = planLikeDocument();
  poisoned.artifacts[0].digest = () => "x";
  assert.throws(() => canonicalizePreExecutionArtifactSnapshot(poisoned), /unsupported leaf/);
  const bigInt = { ...vectors[PRE_EXECUTION_CANONICAL_VECTORS[2].description].value, id: 1n };
  assert.throws(() => canonicalizePreExecutionReviewReceipt(bigInt), /unsupported leaf/);
});

test("receipt canonical form is insensitive to the order findings and parents were appended in", () => {
  const [receiptVector] = [vectors[PRE_EXECUTION_CANONICAL_VECTORS[3].description].value];
  const forwards = { ...receiptVector, findings: [...receiptVector.findings].reverse() };
  assert.equal(
    canonicalizePreExecutionReviewReceipt(receiptVector),
    canonicalizePreExecutionReviewReceipt(forwards),
    "row order carries no meaning, so it must not move the digest",
  );
});

test("two different documents cannot share a digest", async () => {
  const a = await digestPreExecutionArtifactSnapshot(planLikeDocument());
  const b = await digestPreExecutionArtifactSnapshot({ ...planLikeDocument(), artifactRevisionId: "rev-3" });
  assert.match(a, /^[a-f0-9]{64}$/);
  assert.notEqual(a, b);
});

test("digests are repeatable and equal an independent SHA-256 of the canonical bytes", async () => {
  const snapshot = planLikeDocument();
  const canonical = canonicalizePreExecutionArtifactSnapshot(snapshot);
  const first = await digestPreExecutionArtifactSnapshot(snapshot);
  const second = await digestPreExecutionArtifactSnapshot(JSON.parse(canonical));
  assert.equal(first, second, "re-serializing the same document answers the same digest");
  assert.equal(first, createHash("sha256").update(canonical, "utf8").digest("hex"));
});

// ---------------------------------------------------------------------------
// SHA-256 path agreement (AC21 / F32 / D36)
// ---------------------------------------------------------------------------

/**
 * The three paths AC21 names, over the ASCII / multibyte / oversized shapes this
 * suite already pins: an all-ASCII selection, the same bytes with a four-byte
 * codepoint in every chunk position, and the real feature-28 SPEC projection
 * (tens of kilobytes — a document, not a token).
 *
 * A native binding that is present but never consulted is the failure mode this
 * case exists for, so the native path is observed through a counting wrapper
 * around `process.getBuiltinModule` instead of inferred from a matching digest:
 * three agreeing digests prove the guarantee, the count proves the routing.
 */
const SHA_PATH_CORPUS = [
  { label: "ASCII", text: "# Toy feature\n\n## Design status\n\n`designed`\n\nplain ascii only\n" },
  { label: "multibyte", text: `摘要 🚀 ünïcödé ▓ ${toySpec()}` },
  {
    label: "oversized (real SPEC projection)",
    text: readFileSync(
      fileURLToPath(new URL("../../../docs/features/28-evidence-grounded-spec-plan-review/SPEC.md", import.meta.url)),
      "utf8",
    ),
  },
];

/** Runs `fn` with `getBuiltinModule` replaced, and records every id requested. */
function withBuiltinBinding(override, fn) {
  const process_ = globalThis.process;
  const original = process_.getBuiltinModule;
  const requested = [];
  process_.getBuiltinModule =
    override === "throw"
      ? () => {
          requested.push("throwing");
          throw new Error("host binding unavailable");
        }
      : override === "absent"
        ? undefined
        : (id) => {
            requested.push(id);
            return original.call(process_, id);
          };
  try {
    return { result: fn(), requested };
  } finally {
    process_.getBuiltinModule = original;
  }
}

test("sha256HexSync answers from the host native SHA-256 and all three paths agree", async () => {
  if (typeof globalThis.process?.getBuiltinModule !== "function") {
    assert.fail("this case asserts the native routing and needs a host that exposes the binding");
  }
  for (const { label, text } of SHA_PATH_CORPUS) {
    const reference = createHash("sha256").update(text, "utf8").digest("hex");
    // Two calls: the binding must be looked up on each one, never cached.
    const observed = withBuiltinBinding("count", () => [sha256HexSync(text), sha256HexSync(text)]);
    assert.equal(
      observed.requested.filter((id) => id === "crypto").length >= 2, true,
      `${label}: the native path answered, and answered per call (got ${JSON.stringify(observed.requested)})`,
    );
    const [first, second] = observed.result;
    assert.match(first, /^[0-9a-f]{64}$/, `${label}: lowercase 64-hex`);
    assert.equal(first, second, `${label}: repeated calls agree`);
    assert.equal(first, reference, `${label}: native sync digest equals the node:crypto reference`);
    assert.equal(await sha256Hex(text), reference, `${label}: WebCrypto agrees with the native path`);

    // The same bytes with the binding withheld must answer identically: that is
    // the browser condition, and the pure-JS core is what serves it.
    const withheld = withBuiltinBinding("absent", () => sha256HexSync(text));
    assert.equal(withheld.result, reference, `${label}: pure-JS path agrees with the native path`);
    assert.deepEqual(withheld.requested, [], `${label}: a withheld binding is never reached`);

    // A binding that exists and then fails must not throw out of a digest.
    const throwing = withBuiltinBinding("throw", () => sha256HexSync(text));
    assert.equal(throwing.result, reference, `${label}: a failing lookup falls back to the JS core`);
  }
});

// ---------------------------------------------------------------------------
// Published vectors (AC2)
// ---------------------------------------------------------------------------

test("published vectors are frozen and reproduce from their own fixtures", async () => {
  assert.ok(PRE_EXECUTION_CANONICAL_VECTORS.length >= 4, "both contracts and both stages are covered");
  const contracts = new Set();
  for (const vector of PRE_EXECUTION_CANONICAL_VECTORS) {
    assert.equal(Object.isFrozen(vector), true);
    assert.match(vector.digest, /^[a-f0-9]{64}$/);
    const entry = vectors[vector.description];
    assert.ok(entry, `no fixture published for vector "${vector.description}"`);
    assert.equal(entry.contract, vector.contract, `${vector.description} contract id drifted`);
    contracts.add(vector.contract);
    const digest = vector.contract === PRE_EXECUTION_SNAPSHOT_CONTRACT_ID
      ? await digestPreExecutionArtifactSnapshot(entry.value)
      : await digestPreExecutionReviewReceipt(entry.value);
    assert.equal(digest, vector.digest, `${vector.description} digest drifted`);
  }
  assert.deepEqual([...contracts].sort(), [PRE_EXECUTION_SNAPSHOT_CONTRACT_ID, PRE_EXECUTION_RECEIPT_CONTRACT_ID]);
});

test("vector descriptions are unique so a fixture cannot be silently unbound", () => {
  const descriptions = PRE_EXECUTION_CANONICAL_VECTORS.map((v) => v.description);
  assert.equal(new Set(descriptions).size, descriptions.length);
  assert.deepEqual(Object.keys(vectors).sort(), descriptions.slice().sort(),
    "the fixture map and the published vectors name the same set");
});

test("the vectors fixture payloads validate through the public entries and bind each other", async () => {
  const [specSnapshotVector, planSnapshotVector, specReceiptVector, planReceiptVector] =
    PRE_EXECUTION_CANONICAL_VECTORS.map((vector) => vectors[vector.description].value);
  assert.equal(validatePreExecutionArtifactSnapshotV1(specSnapshotVector).ok, true);
  assert.equal(validatePreExecutionArtifactSnapshotV1(planSnapshotVector).ok, true);
  assert.equal(validatePreExecutionReviewReceiptV1(specReceiptVector).ok, true);
  assert.equal(validatePreExecutionReviewReceiptV1(planReceiptVector).ok, true);

  const specDigest = await digestPreExecutionArtifactSnapshot(specSnapshotVector);
  assert.equal(planSnapshotVector.parentSpecSnapshotDigest, specDigest,
    "the Plan vector descends from the Product vector in the same set");
  assert.equal(specReceiptVector.snapshotDigest, specDigest);
  assert.equal(planReceiptVector.snapshotDigest, await digestPreExecutionArtifactSnapshot(planSnapshotVector));
  assert.equal(
    (await validatePreExecutionReceiptAgainstSnapshot(specReceiptVector, specSnapshotVector, POLICY_VERSION)).ok,
    true,
    "the published receipt passes its own authoritative entry",
  );
  assert.equal(
    (await validatePreExecutionReceiptAgainstSnapshot(planReceiptVector, planSnapshotVector, POLICY_VERSION)).ok,
    true,
  );
});

test("the published limits are the same object the fixture discloses", () => {
  assert.deepEqual({ ...PRE_EXECUTION_VECTORS.limits }, {
    artifacts: 32,
    contexts: 16,
    findings: 64,
    evidencePerFinding: 8,
    parentReceipts: 8,
    receiptDiagnostics: 8,
    unitIdChars: 128,
    revisionIdChars: 128,
    idChars: 128,
    pathChars: 1024,
    identifierChars: 160,
    claimChars: 2048,
    evidenceChars: 1024,
    resolutionEvidenceChars: 2048,
    policyChars: 64,
    diagnosticChars: 512,
    artifactBytes: 4 * 1024 * 1024,
    snapshotBytes: 32 * 1024,
    receiptBytes: 64 * 1024,
    diagnostics: 50,
  }, "a limit rename must fail here, not silently widen a consumer's expectation");
});
