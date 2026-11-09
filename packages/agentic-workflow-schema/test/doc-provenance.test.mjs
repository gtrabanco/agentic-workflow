/**
 * doc-provenance.test.mjs — the document provenance stamp contract (issue
 * #462, unit docs/features/462-doc-provenance-stamp/).
 *
 * Written red-first: the module did not exist when this corpus landed. It pins
 * the contract the issue names:
 *
 *  - **One versioned grammar.** `doc-provenance@1` — a contract id, four
 *    declared fields, and the draft-07 projection agreeing with the validator.
 *  - **Three axes, never merged.** `grammars` (what the content speaks),
 *    `format` (the carrier layout generation), `written_by`/`schema` (the
 *    forensic half). A single merged version number is the defect.
 *  - **Closed vocabularies.** The format vocabulary, the grammar-family set and
 *    the writer tool set are published `as const`; a value the package does not
 *    publish is refused, never read optimistically (S8).
 *  - **Semver dispatch.** A reader answers `current | degrade | refuse` from a
 *    closed reason set against its own published contract: an older generation
 *    degrades inside the declared window, a newer one refuses typed, an unknown
 *    family refuses — never a silent misparse (S3, S6).
 *  - **Absent stamp is a degradation, never an error** (S5).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import Ajv from "ajv";

import {
  DOC_PROVENANCE_CONTRACT_ID,
  DOC_PROVENANCE_FIELDS,
  DOC_PROVENANCE_TOOLS,
  DOC_PROVENANCE_FORMATS,
  DOC_GRAMMAR_FAMILIES,
  DOC_GRAMMAR_VERSIONS,
  DOC_FORMAT_GRAMMARS,
  DOC_PROVENANCE_READER_VERDICTS,
  DOC_PROVENANCE_READER_REASONS,
  validateDocProvenance,
  parseDocProvenance,
  serializeDocProvenance,
  readDocProvenance,
  deriveFormat,
  formatFamilyOf,
  formatGenerationOf,
} from "../dist/index.js";

const packageRoot = new URL("..", import.meta.url).pathname;
const schema = JSON.parse(readFileSync(`${packageRoot}/doc-provenance.schema.json`, "utf8"));
const ajv = new Ajv({ strict: true });
const schemaValidates = ajv.compile(schema);

/** The canonical vector: a spec-by-reference unit doc written by the crate. */
const CANONICAL = {
  contract: "doc-provenance@1",
  written_by: "agentic-workflow@4.10.0",
  schema: "@gtrabanco/agentic-workflow-schema@4.10.0",
  format: "unit-doc@2",
  grammars: { "findings-table": 1, "log-kind": 1, "obligations": 1, "unit-doc": 1 },
};

const mutate = (patch) => ({ ...CANONICAL, ...patch });
const clone = () => JSON.parse(JSON.stringify(CANONICAL));

const errorsOf = (value, options) => validateDocProvenance(value, options).errors.map((e) => e.code);

test("the contract publishes one id, one field set and the three axes", () => {
  assert.equal(DOC_PROVENANCE_CONTRACT_ID, "doc-provenance@1");
  assert.deepEqual([...DOC_PROVENANCE_FIELDS], ["written_by", "schema", "format", "grammars"]);
  // Three axes: the content grammars, the carrier format, the forensic pair.
  assert.deepEqual([...DOC_PROVENANCE_TOOLS], ["agentic-workflow"]);
  assert.ok(DOC_PROVENANCE_FORMATS.length >= 2, "both accepted unit-doc carriers are named");
  assert.deepEqual([...DOC_GRAMMAR_FAMILIES].sort(), ["findings-table", "log-kind", "obligations", "unit-doc"]);
  for (const family of DOC_GRAMMAR_FAMILIES) {
    assert.ok(Number.isInteger(DOC_GRAMMAR_VERSIONS[family]) && DOC_GRAMMAR_VERSIONS[family] >= 1, `${family} publishes a positive generation`);
  }
});

test("the format vocabulary is <family>@<generation> and names the carrier's grammar set", () => {
  for (const format of DOC_PROVENANCE_FORMATS) {
    const family = formatFamilyOf(format);
    const generation = formatGenerationOf(format);
    assert.equal(family, "unit-doc", `${format} belongs to the unit-doc carrier family`);
    assert.ok(Number.isInteger(generation) && generation >= 1, `${format} carries a generation`);
    const grammars = DOC_FORMAT_GRAMMARS[format];
    assert.ok(Array.isArray(grammars) && grammars.length > 0, `${format} declares the grammar families its carrier publishes`);
    for (const grammar of grammars) assert.ok(DOC_GRAMMAR_FAMILIES.includes(grammar), `${format} names a published family (${grammar})`);
  }
  assert.notDeepEqual(DOC_FORMAT_GRAMMARS["unit-doc@1"], DOC_FORMAT_GRAMMARS["unit-doc@2"], "the two carriers are distinguishable by their grammar set");
  assert.equal(formatFamilyOf("nonsense"), null);
  assert.equal(formatGenerationOf("unit-doc@0"), 0);
  assert.equal(formatGenerationOf("unit-doc@x"), null);
});

test("the canonical stamp is valid under the validator and under strict Ajv", () => {
  const result = validateDocProvenance(CANONICAL);
  assert.equal(result.valid, true, JSON.stringify(result.errors));
  assert.equal(schemaValidates(CANONICAL), true, JSON.stringify(schemaValidates.errors));
});

test("the JSON Schema and the validator agree in both directions", () => {
  const cases = [
    mutate({ extra: 1 }),
    mutate({ contract: "doc-provenance@2" }),
    mutate({ written_by: "some-tool@4.10.0" }),
    mutate({ written_by: "agentic-workflow@4.10" }),
    mutate({ written_by: "agentic-workflow@4.10.0.0" }),
    mutate({ schema: "@gtrabanco/agentic-workflow-schema" }),
    mutate({ format: "unit-doc-nonsense@9" }),
    mutate({ format: "unit-doc-spec-by-reference" }),
    mutate({ grammars: { "unit-doc": 1, "no-such-family": 1 } }),
    mutate({ grammars: { "unit-doc": 0 } }),
    mutate({ grammars: { "unit-doc": "1" } }),
    mutate({ grammars: {} }),
    { written_by: CANONICAL.written_by },
  ];
  for (const value of cases) {
    const byValidator = validateDocProvenance(value).valid;
    const bySchema = schemaValidates(value);
    assert.equal(byValidator, bySchema, `validator and schema disagree on ${JSON.stringify(value)}`);
    assert.equal(byValidator, false, `refused: ${JSON.stringify(value)}`);
  }
});

test("the validator answers a closed reason code per refusal", () => {
  assert.deepEqual(errorsOf(mutate({ extra: 1 })), ["unknown-field"]);
  assert.deepEqual(errorsOf(mutate({ contract: "doc-provenance@2" })), ["wrong-contract"]);
  assert.deepEqual(errorsOf({ ...CANONICAL, written_by: undefined }), ["missing-field"]);
  assert.deepEqual(errorsOf(mutate({ written_by: "some-tool@4.10.0" })), ["unknown-tool"]);
  assert.deepEqual(errorsOf(mutate({ written_by: "agentic-workflow@4.10" })), ["malformed-version"]);
  assert.deepEqual(errorsOf(mutate({ schema: "@gtrabanco/another-package@4.10.0" })), ["wrong-schema-package"]);
  assert.deepEqual(errorsOf(mutate({ format: "unit-doc-nonsense@9" })), ["unpublished-format"]);
  assert.deepEqual(errorsOf(mutate({ grammars: { "unit-doc": 1, "no-such-family": 1 } })), ["unpublished-grammar-family"]);
  assert.deepEqual(errorsOf(mutate({ grammars: { "unit-doc": 2 } })), ["unpublished-grammar-generation"]);
});

test("the carried block round-trips through parse and serialize deterministically", () => {
  const block = serializeDocProvenance(CANONICAL);
  assert.equal(
    block,
    [
      "doc-provenance@1",
      "written_by: agentic-workflow@4.10.0",
      "schema: @gtrabanco/agentic-workflow-schema@4.10.0",
      "format: unit-doc@2",
      'grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}',
    ].join("\n"),
  );
  const doc = ["# 462 — example", "", "> one line", "", "```text", block, "```", "", "## Specs", "x", ""].join("\n");
  const parsed = parseDocProvenance(doc);
  assert.deepEqual(parsed.errors, []);
  assert.deepEqual(parsed.value, CANONICAL);
  // Canonical (sorted) key order, whatever order the document used.
  const shuffled = doc.replace(/"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1/, '"unit-doc":1,"obligations":1,"log-kind":1,"findings-table":1');
  assert.equal(serializeDocProvenance(parseDocProvenance(shuffled).value), block);
  assert.equal(parseDocProvenance("# no stamp here\n").value, null);
  assert.deepEqual(parseDocProvenance("# no stamp here\n").errors, []);
  const bad = parseDocProvenance(doc.replace("format: unit-doc@2", "format: unit-doc-spec-by-reference"));
  assert.equal(bad.value, null);
  assert.match(bad.errors.join(" "), /unpublished-format/);
});

test("the carrier derivation names the format a heading set satisfies", () => {
  const specRef = ["Specs", "Impact", "Non-goals", "Future cost", "Applicable tests", "Known pre-existing issues", "Tasks", "Findings", "Log", "Next", "References"];
  const legacy = ["Objective", "Why", "User outcome", "Acceptance criteria", "Impact", "Non-goals", "Future cost", "Applicable tests", "Known pre-existing issues", "Tasks", "Evidence", "Progress log", "Next", "References"];
  assert.equal(deriveFormat(specRef), "unit-doc@2");
  assert.equal(deriveFormat(legacy), "unit-doc@1");
  assert.equal(deriveFormat(["Specs", "Log"]), null);
});

test("the reader verdicts and reasons are closed sets", () => {
  assert.deepEqual([...DOC_PROVENANCE_READER_VERDICTS], ["current", "degrade", "refuse"]);
  for (const reason of DOC_PROVENANCE_READER_REASONS) assert.match(reason, /^[a-z][a-z0-9-]*$/);
});

test("a current stamp is current for the published reader", () => {
  const reading = readDocProvenance(`\`\`\`text\n${serializeDocProvenance(CANONICAL)}\n\`\`\`\n`);
  assert.equal(reading.verdict, "current");
  assert.equal(reading.reason, "stamp-current");
  assert.deepEqual(reading.stamp, CANONICAL);
});

test("an absent stamp degrades and derives the format from the carrier, never an error", () => {
  const doc = ["# 462 — example", "", "## Objective", "x", "## Why", "x", "## User outcome", "x", "## Acceptance criteria", "x", "## Impact", "x", "## Non-goals", "x", "## Future cost", "x", "## Applicable tests", "x", "## Known pre-existing issues", "x", "## Tasks", "x", "## Evidence", "x", "## Progress log", "x", "## Next", "x", "## References", "x", ""].join("\n");
  const reading = readDocProvenance(doc);
  assert.equal(reading.verdict, "degrade");
  assert.equal(reading.reason, "absent-stamp");
  assert.equal(reading.derived_format, "unit-doc@1");
  assert.equal(reading.stamp, null);
});

test("an older format degrades inside the declared window and refuses outside it", () => {
  const futureReader = { format: "unit-doc@3", grammars: { ...DOC_GRAMMAR_VERSIONS } };
  const inWindow = readDocProvenance(`\`\`\`text\n${serializeDocProvenance(mutate({ format: "unit-doc@2" }))}\n\`\`\``, futureReader);
  assert.equal(inWindow.verdict, "degrade");
  assert.equal(inWindow.reason, "format-older-compatible");

  const narrowReader = { ...futureReader, readable_from: 2 };
  const outOfWindow = readDocProvenance(`\`\`\`text\n${serializeDocProvenance(mutate({ format: "unit-doc@2" }))}\n\`\`\``, narrowReader);
  assert.equal(outOfWindow.verdict, "refuse");
  assert.equal(outOfWindow.reason, "format-too-old");
  assert.match(outOfWindow.note, /MIGRATION\.md/);
});

test("a newer format refuses typed against the reader's own generation", () => {
  const reading = readDocProvenance(
    `\`\`\`text\n${serializeDocProvenance({ ...mutate({ format: "unit-doc@3" }) })}\n\`\`\``,
    { format: "unit-doc@2", grammars: { ...DOC_GRAMMAR_VERSIONS } },
  );
  assert.equal(reading.verdict, "refuse");
  assert.equal(reading.reason, "format-newer-than-reader");
});

test("an unknown carrier family refuses instead of guessing", () => {
  const reading = readDocProvenance(
    `\`\`\`text\n${serializeDocProvenance({ ...mutate({ format: "unit-doc@2" }) })}\n\`\`\``,
    { format: "adr-legacy@1", grammars: { ...DOC_GRAMMAR_VERSIONS } },
  );
  assert.equal(reading.verdict, "refuse");
  assert.equal(reading.reason, "format-unknown-to-reader");
});

test("a newer grammar refuses; an older one degrades; an unknown family refuses", () => {
  const reader = { format: "unit-doc@2", grammars: { ...DOC_GRAMMAR_VERSIONS } };
  const newer = readDocProvenance(`\`\`\`text\n${serializeDocProvenance(mutate({ grammars: { "unit-doc": 2 } }))}\n\`\`\``, reader);
  assert.equal(newer.verdict, "refuse");
  assert.equal(newer.reason, "grammar-newer-than-reader");

  const futureReader = { format: "unit-doc@2", grammars: { ...DOC_GRAMMAR_VERSIONS, "unit-doc": 2 } };
  const older = readDocProvenance(`\`\`\`text\n${serializeDocProvenance(clone())}\n\`\`\``, futureReader);
  assert.equal(older.verdict, "degrade");
  assert.equal(older.reason, "grammar-older-compatible");

  const unknown = readDocProvenance(`\`\`\`text\n${serializeDocProvenance(mutate({ grammars: { "unit-doc": 1, "adr-links": 1 } }))}\n\`\`\``, reader);
  assert.equal(unknown.verdict, "refuse");
  assert.equal(unknown.reason, "grammar-unknown-to-reader");
});

test("a malformed stamp is a typed refusal, never a silent pass", () => {
  const reading = readDocProvenance("```text\ndoc-provenance@1\nwritten_by: agentic-workflow@4.10.0\n```\n");
  assert.equal(reading.verdict, "refuse");
  assert.equal(reading.reason, "stamp-invalid");
});
