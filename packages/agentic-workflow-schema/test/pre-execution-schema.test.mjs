// Feature 28 P1 — the published JSON Schema projections must equal the canonical
// internal definition rendered by the package's only renderer, and every artifact
// the release ships must be self-describing, drift-checked, and pack-listed.
//
// The renderer is the same `renderJsonSchemaDocument` the verification family uses;
// the generator has no literal rule table, so a projection cannot drift from the
// definition that the runtime enforces (rule 9: one definition, not two copies).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const GEN = join(ROOT, "scripts", "generate-pre-execution-schemas.mjs");

const PROJECTIONS = [
  {
    file: "pre-execution-artifact-snapshot.schema.json",
    contract: "agentic-workflow/pre-execution-artifact-snapshot@1",
    title: "PreExecutionArtifactSnapshot v1",
    // The renderer has a JSON Schema form for these (if/then on declared properties).
    rules: ["spec-stage-has-no-parent", "plan-stage-requires-parent", "fix-unit-has-no-product-parent",
      "present-context-has-digest", "absent-context-has-null-digest"],
    // These are properties of a COLLECTION (order, uniqueness, stage/selector matrix). Draft 07
    // cannot state them over an array of $refs, so the runtime owns them and the suite below
    // pins the split: a new collection rule must be named here, never silently dropped.
    collectionRules: ["artifact-rows-ordered", "artifact-kinds-unique", "artifact-paths-unique",
      "context-rows-ordered", "context-identities-unique", "spec-artifact-uses-product-selector",
      "stage-selector-matrix"],
  },
  {
    file: "pre-execution-review-receipt.schema.json",
    contract: "agentic-workflow/pre-execution-review-receipt@1",
    title: "PreExecutionReviewReceipt v1",
    rules: ["verdict-stage-matrix", "parent-topology-restrained", "parent-topology-shaped",
      "parent-identities-unique", "dismissal-needs-counter-evidence"],
    collectionRules: [],
  },
];

const load = (entry) => JSON.parse(readFileSync(join(ROOT, entry.file), "utf8"));

test("committed projections equal the generated output (no hand-edits)", () => {
  execFileSync(process.execPath, [GEN], { cwd: ROOT, stdio: "pipe" });
  try {
    execFileSync(process.execPath, [GEN, "--check"], { cwd: ROOT, stdio: "pipe" });
  } catch (error) {
    assert.fail(`generator reports drift after a clean run: ${error.stdout?.toString() || error.message}`);
  }
});

test("the drift check fails when a projection is edited by hand", () => {
  const entry = PROJECTIONS[0];
  const file = join(ROOT, entry.file);
  const original = readFileSync(file, "utf8");
  try {
    writeFileSync(file, original.replace('"maxLength": 1024', '"maxLength": 1025'));
    assert.notEqual(original, readFileSync(file, "utf8"), "the mutation must land before the check runs");
    assert.throws(
      () => execFileSync(process.execPath, [GEN, "--check"], { cwd: ROOT, stdio: "pipe" }),
      /drift/i,
      "a projection that no longer equals its definition must fail the gate",
    );
  } finally {
    writeFileSync(file, original);
  }
  execFileSync(process.execPath, [GEN, "--check"], { cwd: ROOT, stdio: "pipe" });
});

test("each projection is a complete draft 2020-12 document for its contract", () => {
  for (const entry of PROJECTIONS) {
    assert.ok(existsSync(join(ROOT, entry.file)), `${entry.file} is not published`);
    const schema = load(entry);
    // Draft 07 is what the package's renderer emits and what every sibling
    // projection declares; the test pins it so a renderer swap cannot silently
    // change the dialect consumers validate against.
    assert.equal(schema.$schema, "http://json-schema.org/draft-07/schema#");
    assert.equal(schema.title, entry.title);
    assert.equal(schema.type, "object");
    assert.equal(schema.additionalProperties, false, "undeclared fields are refused in the projection too");
    assert.equal(schema.properties.contract.const, entry.contract);
    assert.ok(schema.description.length > 40, "the projection states the authority it binds");
  }
});

test("the structural facts of the canonical definition are visible in the projection", () => {
  const snapshot = load(PROJECTIONS[0]);
  assert.deepEqual([...snapshot.required],
    ["contract", "stage", "unitKind", "unitId", "sourceRevision", "artifactRevisionId",
      "artifacts", "contexts", "parentSpecSnapshotDigest"]);
  assert.deepEqual({ ...snapshot.properties.artifacts.items }, { $ref: "#/$defs/PreExecutionArtifactRowV1" },
    "artifact rows are named sub-schemas, not anonymous blobs");
  assert.ok(["PreExecutionArtifactRowV1", "PreExecutionContextBindingV1"]
    .every((name) => name in snapshot.$defs));
  const artifactRow = snapshot.$defs.PreExecutionArtifactRowV1;
  assert.equal(artifactRow.additionalProperties, false);
  assert.deepEqual([...artifactRow.required], ["kind", "path", "selector", "byteLength", "digest"]);
  assert.equal(snapshot.properties.artifacts.maxItems, 32, "the published ceiling is in the projection");
  assert.equal(snapshot.properties.contexts.maxItems, 16);
  assert.equal(snapshot.properties.sourceRevision.pattern, "^[a-f0-9]{40}$|^[a-f0-9]{64}$");
  assert.equal(snapshot.properties.unitId.maxLength, 128);

  const receipt = load(PROJECTIONS[1]);
  assert.ok(receipt.properties.verdict.enum.includes("needs-design"));
  assert.equal(receipt.properties.parentReceipts.maxItems, 8);
  assert.equal(receipt.properties.diagnostics.maxItems, 8);
  assert.deepEqual([...receipt.$defs.PreExecutionReviewFindingV1.required],
    ["id", "severity", "class", "claim", "evidenceRefs", "verification", "resolution", "resolutionEvidence"]);
});

test("every rule the projection can carry is present, and the rest are named as collection rules", () => {
  for (const entry of PROJECTIONS) {
    const serialized = JSON.stringify(load(entry));
    for (const rule of entry.rules) {
      assert.ok(serialized.includes(`[${rule}]`), `${entry.file} loses the rule ${rule}`);
    }
    for (const rule of entry.collectionRules) {
      assert.equal(serialized.includes(`[${rule}]`), false,
        `${entry.file} claims ${rule} is enforceable in draft 07 — it is not`);
    }
  }
});

test("the collection rules are enforced by the runtime the projection describes", () => {
  // The split above is only honest while the runtime really refuses these; the
  // snapshot suite owns each code, this test owns that the split is disclosed.
  const readme = readFileSync(join(ROOT, "README.md"), "utf8");
  const readmeEs = readFileSync(join(ROOT, "README.es.md"), "utf8");
  for (const [name, text] of [["README.md", readme], ["README.es.md", readmeEs]]) {
    const lines = text.split("\n");
    const start = lines.findIndex((line) => /^### (?:Collection rules|Las reglas de colecci)/.test(line));
    assert.ok(start >= 0, `${name} never discloses that collection rules are runtime-only`);
    const end = lines.findIndex((line, i) => i > start && line.startsWith("### "));
    const section = lines.slice(start, end).join("\n");
    assert.match(section, /draft 07/i, `${name} must say why the schema cannot carry them`);
    for (const rule of ["artifact-rows-ordered", "context-identities-unique", "stage-selector-matrix"]) {
      assert.ok(section.includes(rule), `${name} omits ${rule} from the disclosure`);
    }
  }
});

test("path and identifier ceilings are rendered as rule sets, so no constraint is dropped", () => {
  const snapshot = load(PROJECTIONS[0]);
  const path = snapshot.$defs.PreExecutionArtifactRowV1.properties.path;
  assert.equal(path.maxLength, 1024);
  const patterns = JSON.stringify(path.allOf ?? path);
  for (const fragment of ["must not be empty", "absolute path", "Windows drive-letter",
    "backslashes", 'or \\"..\\" segments', "end with a separator", "empty segment"]) {
    // The dot-dot fragment is matched in its SERIALIZED form: JSON.stringify
    // escapes the double quotes the definition's description carries, so a raw
    // `or ".." segments` can never appear in the serialized bytes.
    assert.ok(patterns.includes(fragment), `the projection loses the ${fragment} rule`);
  }
});

test("both projections are listed in package files and exports", () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
  for (const entry of PROJECTIONS) {
    assert.ok(pkg.files.includes(entry.file), `${entry.file} is not shipped`);
    const exported = JSON.stringify(pkg.exports[`./${entry.file}`]);
    assert.ok(exported.includes(entry.file), `${entry.file} has no export entry`);
  }
});

test("RS14: the compound parent rule projects to Draft-07 and agrees with the runtime", () => {
  const projection = load(PROJECTIONS[0]);
  const fragments = projection.allOf.filter((fragment) => /\[plan-stage-requires-parent\]|\[fix-unit-has-no-product-parent\]/
    .test(fragment.description ?? ""));
  assert.equal(fragments.length, 2, "both halves of the narrowed rule must be projected");
  const parentRule = fragments.find((fragment) => fragment.description.startsWith("[plan-stage-requires-parent]"));
  assert.ok(parentRule.if.allOf, "a conjunction of two siblings is projected as an `allOf` condition");
  assert.deepEqual(parentRule.if.allOf, [
    { properties: { stage: { const: "plan" } } },
    { properties: { unitKind: { const: "feature" } } },
  ], "the projection states exactly the conjunction the runtime enforces");

  // Ajv, so the claim is checked by a real Draft-07 validator and not by reading.
  const ajv = new Ajv({ strict: true });
  const validate = ajv.compile(structuredClone(projection));
  const document = (stage, unitKind, parent) => ({
    contract: "agentic-workflow/pre-execution-artifact-snapshot@1",
    stage, unitKind, unitId: "78-unit",
    sourceRevision: "0".repeat(40), artifactRevisionId: "rev-1",
    artifacts: [{ kind: "acceptance", path: "docs/x/ACCEPTANCE.md", selector: "whole-file", byteLength: 1, digest: "a".repeat(64) },
      { kind: "spec", path: "docs/x/SPEC.md", selector: "whole-file", byteLength: 1, digest: "b".repeat(64) }],
    contexts: [],
    parentSpecSnapshotDigest: parent,
  });
  const DIGEST = "c".repeat(64);
  const cases = [
    [document("plan", "feature", DIGEST), true],
    [document("plan", "feature", null), false],
    [document("plan", "fix", null), true],
    [document("plan", "fix", DIGEST), false],
  ];
  for (const [value, expected] of cases) {
    assert.equal(validate(value), expected,
      `the projection disagrees with the contract on ${value.unitKind}/${String(value.parentSpecSnapshotDigest)}`);
  }
});
