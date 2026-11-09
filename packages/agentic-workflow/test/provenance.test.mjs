/**
 * provenance.test.mjs — the document provenance stamp in the crate (issue
 * #462, unit docs/features/462-doc-provenance-stamp/).
 *
 * Written red-first: `src/edit/Provenance.mjs` did not exist when this corpus
 * landed. The crate ships without a dependency on the schema package (AC21 of
 * unit 61), so it mirrors the published contract with a provenance comment and
 * this suite is the parity pin — the same pattern `unit-doc-contract.test.mjs`
 * established for the section lists.
 *
 * The contract it pins:
 *  - the stamp is written at creation and at a re-cut, never per edit (S4);
 *  - a re-stamp is byte-identical, so the stamp is not a revision counter (S9);
 *  - an absent stamp derives the format from the carrier headings — the
 *    existing heuristic, now named (S5);
 *  - an older document degrades, a newer one refuses typed (S6), and a
 *    generation the schema package does not publish is red (S8);
 *  - `verify` refuses a declared format/grammar set that disagrees with the
 *    carrier actually present (S8).
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CURRENT_READER,
  DOC_PROVENANCE_CONTRACT_ID,
  DOC_GRAMMAR_FAMILIES,
  DOC_GRAMMAR_VERSIONS,
  DOC_PROVENANCE_FORMATS,
  DOC_FORMAT_GRAMMARS,
  deriveFormat,
  parseProvenance,
  readProvenance,
  serializeProvenance,
  stampDocument,
  toolVersions,
  validateProvenance,
} from "../src/edit/Provenance.mjs";
import { createSpecByReference, setSection, validate } from "../src/edit/UnitDoc.mjs";
import { verifyUnitDoc } from "../src/verify/Verify.mjs";

const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));
const PACKAGE = JSON.parse(readFileSync(fileURLToPath(new URL("../package.json", import.meta.url)), "utf8"));

/** A minimal spec-by-reference unit doc that satisfies the shape reader. */
const SPEC_REF_DOC = (extra = []) =>
  [
    "# 462 — example",
    "",
    "> one line",
    "",
    ...extra,
    "## Specs",
    "**S1 — example.**",
    "> words",
    "",
    "## Impact",
    "none",
    "",
    "## Non-goals",
    "none",
    "",
    "## Future cost",
    "none",
    "",
    "## Applicable tests",
    "none",
    "",
    "## Known pre-existing issues",
    "none",
    "",
    "## Tasks",
    "- P1 — example (validator: `true` exits 0)",
    "",
    "## Findings",
    "| id | S# / file:line | axis | severity | impact | class | route |",
    "|---|---|---|---|---|---|---|",
    "",
    "## Log",
    "- **L1** — 2026-11-09, the request, verbatim:",
    "  ```",
    "  Apply to this repository: issue #462",
    "  ```",
    "",
    "## Next",
    "P2",
    "",
    "## References",
    "none",
    "",
  ].join("\n");

/** A minimal legacy-unit doc, for the carrier derivation of the other shape. */
const LEGACY_DOC = (extra = []) =>
  [
    "# 01 — example",
    "",
    ...extra,
    "## Objective",
    "x",
    "## Why",
    "x",
    "## User outcome",
    "x",
    "## Acceptance criteria",
    "x",
    "## Impact",
    "x",
    "## Non-goals",
    "x",
    "## Future cost",
    "x",
    "## Applicable tests",
    "x",
    "## Known pre-existing issues",
    "x",
    "## Tasks",
    "- P1 — example",
    "## Evidence",
    "| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |",
    "|---|---|---|---|---|",
    "## Progress log",
    "2026-11-09 10:00 — did a thing → abc1234 — next: the next thing",
    "## Next",
    "x",
    "## References",
    "x",
    "",
  ].join("\n");

const withStamp = (stamp) => [`\`\`\`text`, serializeProvenance(stamp), "```", ""];

const tmp = () => mkdtempSync(join(tmpdir(), "aw-provenance-"));
const cleanup = (dir) => rmSync(dir, { recursive: true, force: true });

test("the crate mirrors the published contract and its own manifest versions", () => {
  assert.equal(DOC_PROVENANCE_CONTRACT_ID, "doc-provenance@1");
  assert.deepEqual(Object.keys(DOC_GRAMMAR_VERSIONS).sort(), [...DOC_GRAMMAR_FAMILIES].sort());
  assert.ok(DOC_PROVENANCE_FORMATS.includes("unit-doc-spec-by-reference@1"));
  assert.ok(DOC_PROVENANCE_FORMATS.includes("unit-doc-legacy@1"));
  const versions = toolVersions();
  assert.equal(versions.tool, "agentic-workflow");
  assert.equal(versions.tool_version, PACKAGE.version, "the writer reads its own manifest, never a literal");
  assert.equal(versions.schema, "@gtrabanco/agentic-workflow-schema");
  assert.equal(versions.schema_version, PACKAGE.version, "D-40-14: one train version, so the schema half is the same version");
});

test("creation emits a valid stamp whose format matches the skeleton's carrier", () => {
  const dir = tmp();
  try {
    mkdirSync(join(dir, "docs", "features", "462-example"), { recursive: true });
    const receipt = createSpecByReference(join(dir, "docs", "features", "462-example"), "462-example");
    assert.equal(receipt.ok, true, JSON.stringify(receipt));
    const text = readFileSync(join(dir, "docs", "features", "462-example", "SPEC.md"), "utf8");
    const { value, errors } = parseProvenance(text);
    assert.deepEqual(errors, []);
    assert.ok(value, "the created document carries a doc-provenance@1 block");
    assert.equal(validateProvenance(value).valid, true);
    assert.equal(value.written_by, `agentic-workflow@${PACKAGE.version}`);
    assert.equal(value.schema, `@gtrabanco/agentic-workflow-schema@${PACKAGE.version}`);
    const headings = (text.match(/^## (.+)$/gmu) ?? []).map((h) => h.replace(/^## /, ""));
    assert.equal(value.format, deriveFormat(headings), "the stamp's format is the carrier's");
    assert.deepEqual(Object.keys(value.grammars).sort(), [...DOC_FORMAT_GRAMMARS[value.format]].sort());
    assert.equal(text.indexOf("doc-provenance@1") < text.indexOf("## Specs"), true, "the stamp sits in the preamble, before the first section");
  } finally {
    cleanup(dir);
  }
});

test("a re-stamp is byte-identical — the stamp is a generation, not a revision", () => {
  const stamped = stampDocument(SPEC_REF_DOC(), toolVersions());
  assert.equal(stampDocument(stamped, toolVersions()), stamped);
  assert.equal((stamped.match(/doc-provenance@1/g) ?? []).length, 1, "exactly one block");
});

test("a re-cut restamps in place, keeping the document's own body", () => {
  const doc = SPEC_REF_DOC(withStamp({
    contract: "doc-provenance@1",
    written_by: "agentic-workflow@4.9.0",
    schema: "@gtrabanco/agentic-workflow-schema@4.9.0",
    format: "unit-doc-spec-by-reference@1",
    grammars: { "findings-table": 1, "log-kind": 1, "obligations": 1, "unit-doc": 1 },
  }));
  const restamped = stampDocument(doc, toolVersions());
  const { value } = parseProvenance(restamped);
  assert.equal(value.written_by, `agentic-workflow@${PACKAGE.version}`);
  assert.equal(restamped.replace(/```text[\s\S]*?```/, ""), doc.replace(/```text[\s\S]*?```/, ""), "only the block changed");
});

test("no per-edit operation touches the block", () => {
  const dir = tmp();
  try {
    mkdirSync(dir, { recursive: true });
    const doc = join(dir, "SPEC.md");
    writeFileSync(doc, stampDocument(SPEC_REF_DOC(), toolVersions()));
    const before = readFileSync(doc, "utf8");
    setSection(doc, "Next", "P3 — the next thing\n");
    const after = readFileSync(doc, "utf8");
    const block = (text) => text.slice(text.indexOf("```text"), text.indexOf("```", text.indexOf("```text") + 3) + 3);
    assert.equal(block(after), block(before), "setSection leaves the stamp byte-identical");
  } finally {
    cleanup(dir);
  }
});

test("an absent stamp degrades and derives the format from the carrier", () => {
  const reading = readProvenance(SPEC_REF_DOC());
  assert.equal(reading.verdict, "degrade");
  assert.equal(reading.reason, "absent-stamp");
  assert.equal(reading.derived_format, "unit-doc-spec-by-reference@1");
  assert.equal(reading.stamp, null);

  const legacy = readProvenance(LEGACY_DOC());
  assert.equal(legacy.verdict, "degrade");
  assert.equal(legacy.derived_format, "unit-doc-legacy@1");
});

test("an older document degrades inside the window and refuses outside it", () => {
  const reader = { ...CURRENT_READER, format: "unit-doc-spec-by-reference@2" };
  const doc = SPEC_REF_DOC(withStamp({
    contract: "doc-provenance@1",
    written_by: "agentic-workflow@4.10.0",
    schema: "@gtrabanco/agentic-workflow-schema@4.10.0",
    format: "unit-doc-spec-by-reference@1",
    grammars: { "findings-table": 1, "log-kind": 1, "obligations": 1, "unit-doc": 1 },
  }));
  assert.equal(readProvenance(doc, reader).reason, "format-older-compatible");
  assert.equal(readProvenance(doc, { ...reader, readable_from: 2 }).reason, "format-too-old");

  const newer = readProvenance(SPEC_REF_DOC(withStamp({
    contract: "doc-provenance@1",
    written_by: "agentic-workflow@9.0.0",
    schema: "@gtrabanco/agentic-workflow-schema@9.0.0",
    format: "unit-doc-spec-by-reference@2",
    grammars: { "findings-table": 1, "log-kind": 1, "obligations": 1, "unit-doc": 1 },
  })));
  assert.equal(newer.verdict, "refuse");
  assert.equal(newer.reason, "format-newer-than-reader");
});

test("verify refuses a declared format that disagrees with the carrier", () => {
  const doc = LEGACY_DOC(withStamp({
    contract: "doc-provenance@1",
    written_by: `agentic-workflow@${PACKAGE.version}`,
    schema: `@gtrabanco/agentic-workflow-schema@${PACKAGE.version}`,
    format: "unit-doc-spec-by-reference@1",
    grammars: { "findings-table": 1, "log-kind": 1, "obligations": 1, "unit-doc": 1 },
  }));
  const result = verifyUnitDoc({ text: doc, path: "docs/features/462-example/SPEC.md" });
  const codes = result.violations.map((v) => v.code);
  assert.ok(codes.includes("provenance-format-mismatch"), `observed ${codes.join(", ")}`);
});

test("verify refuses a declaration that omits a grammar family the carrier publishes", () => {
  const doc = SPEC_REF_DOC(withStamp({
    contract: "doc-provenance@1",
    written_by: `agentic-workflow@${PACKAGE.version}`,
    schema: `@gtrabanco/agentic-workflow-schema@${PACKAGE.version}`,
    format: "unit-doc-spec-by-reference@1",
    grammars: { "obligations": 1, "unit-doc": 1 },
  }));
  const codes = verifyUnitDoc({ text: doc, path: "docs/features/462-example/SPEC.md" }).violations.map((v) => v.code);
  assert.ok(codes.includes("provenance-grammar-mismatch"), `observed ${codes.join(", ")}`);
});

test("verify refuses an unpublished format and a newer-than-reader generation", () => {
  const unpublished = SPEC_REF_DOC(withStamp({
    contract: "doc-provenance@1",
    written_by: `agentic-workflow@${PACKAGE.version}`,
    schema: `@gtrabanco/agentic-workflow-schema@${PACKAGE.version}`,
    format: "unit-doc-nonsense@9",
    grammars: { "unit-doc": 1 },
  }));
  const codesA = verifyUnitDoc({ text: unpublished, path: "docs/features/462-example/SPEC.md" }).violations.map((v) => v.code);
  assert.ok(codesA.includes("provenance-unpublished"), `observed ${codesA.join(", ")}`);

  const newer = SPEC_REF_DOC(withStamp({
    contract: "doc-provenance@1",
    written_by: `agentic-workflow@${PACKAGE.version}`,
    schema: `@gtrabanco/agentic-workflow-schema@${PACKAGE.version}`,
    format: "unit-doc-spec-by-reference@2",
    grammars: { "findings-table": 1, "log-kind": 1, "obligations": 1, "unit-doc": 1 },
  }));
  const codesB = verifyUnitDoc({ text: newer, path: "docs/features/462-example/SPEC.md" }).violations.map((v) => v.code);
  assert.ok(codesB.includes("provenance-newer-than-reader"), `observed ${codesB.join(", ")}`);

  const newerGrammar = SPEC_REF_DOC(withStamp({
    contract: "doc-provenance@1",
    written_by: `agentic-workflow@${PACKAGE.version}`,
    schema: `@gtrabanco/agentic-workflow-schema@${PACKAGE.version}`,
    format: "unit-doc-spec-by-reference@1",
    grammars: { "findings-table": 1, "log-kind": 1, "obligations": 1, "unit-doc": 2 },
  }));
  const codesC = verifyUnitDoc({ text: newerGrammar, path: "docs/features/462-example/SPEC.md" }).violations.map((v) => v.code);
  assert.ok(codesC.includes("provenance-newer-than-reader"), `observed ${codesC.join(", ")}`);
});

test("verify accepts a stamped document and an unstamped one (absent is not an error)", () => {
  const good = verifyUnitDoc({ text: stampDocument(SPEC_REF_DOC(), toolVersions()), path: "docs/features/462-example/SPEC.md" });
  assert.deepEqual(good.violations.filter((v) => v.code.startsWith("provenance-")), []);
  const absent = verifyUnitDoc({ text: SPEC_REF_DOC(), path: "docs/features/462-example/SPEC.md" });
  assert.deepEqual(absent.violations.filter((v) => v.code.startsWith("provenance-")), []);
});

test("a stamped document still satisfies the writer's shape validator", () => {
  const text = stampDocument(SPEC_REF_DOC(), toolVersions());
  const result = validate(text);
  assert.equal(result.ok, true, JSON.stringify(result.violations));
});

test("the CLI `unit-doc <slug> provenance` op stamps an existing document", () => {
  const dir = tmp();
  try {
    const unitDir = join(dir, "docs", "features", "462-example");
    mkdirSync(unitDir, { recursive: true });
    writeFileSync(join(unitDir, "SPEC.md"), SPEC_REF_DOC());

    const first = spawnSync(process.execPath, [BIN, "unit-doc", "462-example", "provenance", "--dir", dir], { encoding: "utf8" });
    assert.equal(first.status, 0, first.stderr);
    assert.match(first.stdout, /UNIT_DOC\.provenance/);
    const stamped = readFileSync(join(unitDir, "SPEC.md"), "utf8");
    assert.equal(parseProvenance(stamped).errors.length, 0);
    assert.ok(parseProvenance(stamped).value, "the op wrote a stamp");

    const second = spawnSync(process.execPath, [BIN, "unit-doc", "462-example", "provenance", "--dir", dir], { encoding: "utf8" });
    assert.equal(second.status, 0, second.stderr);
    assert.equal(readFileSync(join(unitDir, "SPEC.md"), "utf8"), stamped, "idempotent");
  } finally {
    cleanup(dir);
  }
});

test("the CLI refuses to stamp a document whose carrier has no declared format", () => {
  const dir = tmp();
  try {
    const unitDir = join(dir, "docs", "features", "999-example");
    mkdirSync(unitDir, { recursive: true });
    writeFileSync(join(unitDir, "SPEC.md"), "# 999 — example\n\n## Specs\n\nnothing else\n");
    const run = spawnSync(process.execPath, [BIN, "unit-doc", "999-example", "provenance", "--dir", dir], { encoding: "utf8" });
    assert.equal(run.status, 2, run.stdout);
    assert.match(run.stderr, /EDIT REFUSAL — /);
    assert.match(run.stderr, /carrier/);
    assert.equal(readFileSync(join(unitDir, "SPEC.md"), "utf8"), "# 999 — example\n\n## Specs\n\nnothing else\n", "nothing written on a refusal");
  } finally {
    cleanup(dir);
  }
});
