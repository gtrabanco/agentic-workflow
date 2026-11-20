/**
 * doc-retention.test.mjs — the retention contract (issue #651).
 *
 * Pins the deterministic half of the feature:
 *
 *  - the **trim/keep matrix** is published once and the two sets are disjoint;
 *  - the third accepted carrier `settled` resolves from the document's own
 *    headings, beside `legacy` and `spec-by-reference`, forever;
 *  - the settled carrier derives the new provenance format `unit-doc@3`, and the
 *    two older generations stay readable (degrade, never refuse for age);
 *  - `classifyUnitRetention` is the one eligibility predicate the CLI, the
 *    sensor and the audit producer share: proved-merged + full carrier + stamp,
 *    with a closed refusal reason for every way a unit is not a candidate;
 *  - the `docRetention` base config section ships `keep-all` and refuses an
 *    unknown key;
 *  - the archive manifest carries one `sha256:` contentHash per archived file.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  BASE_CONFIG_SECTIONS,
  DOC_FORMAT_GRAMMARS,
  DOC_PROVENANCE_FORMATS,
  RETENTION_STATES,
  UNIT_DOC_KEEP_FILES,
  UNIT_DOC_SECTION_SHAPES,
  UNIT_DOC_SETTLED_SECTIONS,
  UNIT_DOC_TRIM_FILES,
  classifyUnitRetention,
  composeConfigSchema,
  deriveFormat,
  readDocProvenance,
  resolveUnitDocShape,
  validateRetentionArchive,
  validateSectionValue,
} from "../dist/index.js";

const SETTLED_HEADINGS = [...UNIT_DOC_SETTLED_SECTIONS];
const SPEC_REF_HEADINGS = [...UNIT_DOC_SECTION_SHAPES["spec-by-reference"]];
const LEGACY_HEADINGS = [...UNIT_DOC_SECTION_SHAPES.legacy];

const stamp = (format) => [
  "```text",
  "doc-provenance@1",
  "written_by: agentic-workflow@4.10.0",
  "schema: @gtrabanco/agentic-workflow-schema@4.10.0",
  `format: ${format}`,
  'grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}',
  "```",
  "",
].join("\n");

test("the trim matrix is one published pair of disjoint sets", () => {
  assert.deepEqual([...UNIT_DOC_TRIM_FILES], [
    "TASKS.md",
    "PLAN.md",
    "progress.md",
    "ACCEPTANCE.md",
    "testing.md",
    "CHECKLIST.md",
    "BRIEF.md",
    "pr-body.md",
    "external-verify.md",
    "review-findings.md",
    "planning-findings.md",
  ]);
  assert.deepEqual([...UNIT_DOC_KEEP_FILES], [
    "SPEC.md",
    "decisions.md",
    "known-issues.md",
    "planning-obligations.md",
    "planning-evidence.md",
    "architecture-notes.md",
    "sources.md",
    "research.md",
  ]);
  const overlap = UNIT_DOC_TRIM_FILES.filter((file) => UNIT_DOC_KEEP_FILES.includes(file));
  assert.deepEqual(overlap, [], "a file is trimmable or kept, never both");
});

test("the settled carrier resolves from its own headings and never from another shape's", () => {
  assert.deepEqual([...UNIT_DOC_SETTLED_SECTIONS], [
    "Specs",
    "Acceptance criteria",
    "Impact",
    "Non-goals",
    "Future cost",
    "Known pre-existing issues",
    "Log",
    "References",
  ]);
  assert.equal(resolveUnitDocShape(SETTLED_HEADINGS), "settled");
  assert.equal(resolveUnitDocShape(SPEC_REF_HEADINGS), "spec-by-reference");
  assert.equal(resolveUnitDocShape(LEGACY_HEADINGS), "legacy");
  // A half-trimmed body: the settled headings minus its own receipt.
  const half = SETTLED_HEADINGS.filter((section) => section !== "Log");
  assert.equal(resolveUnitDocShape(half), null, "a body satisfying no carrier resolves to null");
  // Extra sections the settled carrier does not require are tolerated, so a
  // settled document may keep its Surfaces / Risk tier blocks.
  assert.equal(resolveUnitDocShape([...SETTLED_HEADINGS, "Surfaces", "Risk tier"]), "settled");
});

test("the settled carrier derives the new format and keeps the older generations readable", () => {
  assert.ok(DOC_PROVENANCE_FORMATS.includes("unit-doc@3"));
  assert.equal(deriveFormat(SETTLED_HEADINGS), "unit-doc@3");
  assert.equal(deriveFormat(SPEC_REF_HEADINGS), "unit-doc@2");
  assert.equal(deriveFormat(LEGACY_HEADINGS), "unit-doc@1");
  assert.ok(DOC_FORMAT_GRAMMARS["unit-doc@3"].includes("log-kind"));

  assert.equal(readDocProvenance(stamp("unit-doc@3")).verdict, "current");
  const older = readDocProvenance(stamp("unit-doc@2"));
  assert.equal(older.verdict, "degrade");
  assert.equal(older.reason, "format-older-compatible");
  const oldest = readDocProvenance(stamp("unit-doc@1"));
  assert.equal(oldest.verdict, "degrade");
});

test("the eligibility predicate has one answer per state and a closed reason set", () => {
  const candidate = { status: "done", shape: "spec-by-reference", format: "unit-doc@2", dirty: false };
  const verdict = classifyUnitRetention(candidate);
  assert.deepEqual(verdict, { state: "eligible", eligible: true, reason: "proved-merged-full-carrier" });

  const cases = [
    [{ ...candidate, status: "in-progress" }, "not-done"],
    [{ ...candidate, status: "idea" }, "not-done"],
    [{ ...candidate, shape: "settled" }, "already-settled"],
    [{ ...candidate, format: null }, "unstamped"],
    [{ ...candidate, format: "unit-doc@1" }, "older-format"],
    [{ ...candidate, dirty: true }, "dirty-unit-dir"],
    [{ ...candidate, shape: null }, "unknown-carrier"],
  ];
  for (const [input, reason] of cases) {
    const result = classifyUnitRetention(input);
    assert.equal(result.eligible, false, `${reason} is not eligible`);
    assert.equal(result.reason, reason);
    assert.ok(RETENTION_STATES.includes(result.state), `${result.state} is a published state`);
  }
  // `done` is the only status that can be a candidate, and it is checked first:
  // an unstamped `done` unit is out of scope, not "older-format".
  assert.equal(classifyUnitRetention({ ...candidate, format: null, dirty: true }).reason, "unstamped");
});

test("the docRetention base section ships keep-all and refuses an unknown key", () => {
  const section = BASE_CONFIG_SECTIONS.find((entry) => entry.key === "docRetention");
  assert.ok(section, "docRetention is a base section");
  assert.deepEqual(section.defaults, {
    mode: "keep-all",
    pendingTrimAfterDays: 0,
    archiveDir: ".agentic-workflow/archive",
    archiveRetentionDays: null,
    seamHook: null,
  });
  assert.deepEqual(validateSectionValue(section, section.defaults), []);
  assert.deepEqual(validateSectionValue(section, { mode: "archive" }), []);
  const refused = validateSectionValue(section, { mode: "keep-all", seammHook: "x" });
  assert.equal(refused.length, 1);
  assert.match(refused[0].message, /seammHook/);
  assert.ok(validateSectionValue(section, { mode: "archive-everything" }).length > 0);

  const composed = composeConfigSchema(BASE_CONFIG_SECTIONS);
  assert.deepEqual(composed.properties.docRetention, section.schema);
});

test("the archive manifest binds every archived file by contentHash", () => {
  const manifest = {
    contract: "doc-retention-archive@1",
    unit: "docs/features/42-example",
    settled_at: "2026-11-22T10:00:00Z",
    source_revision: "0123456789abcdef0123456789abcdef01234567",
    spec_digest: `sha256:${"a".repeat(64)}`,
    files: [{ path: "TASKS.md", contentHash: `sha256:${"b".repeat(64)}` }],
  };
  assert.deepEqual(validateRetentionArchive(manifest), { valid: true, errors: [] });

  const badHash = structuredClone(manifest);
  badHash.files[0].contentHash = "b".repeat(64);
  assert.equal(validateRetentionArchive(badHash).valid, false);

  const unknown = { ...manifest, extra: 1 };
  assert.equal(validateRetentionArchive(unknown).valid, false);

  const noFiles = { ...manifest, files: [] };
  assert.equal(validateRetentionArchive(noFiles).valid, false, "an archive with nothing in it is not a settle");
});
