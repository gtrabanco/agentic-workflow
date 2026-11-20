/**
 * settled-carrier.test.mjs — the third accepted carrier, across the readers
 * (issue #651, S2/S6).
 *
 * The carrier itself is the schema package's; this suite proves the crate
 * *consumes* it: one table, no private section list, a half-trimmed document
 * refused by the writer, the verifier and the sensor alike, and a repository
 * carrying full and settled units side by side read as valid in both.
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  UNIT_DOC_KEEP_FILES,
  UNIT_DOC_SECTION_SHAPES as SCHEMA_SHAPES,
  UNIT_DOC_SETTLED_SECTIONS as SCHEMA_SETTLED,
  UNIT_DOC_TRIM_FILES,
  resolveUnitDocShape as schemaResolve,
} from "@gtrabanco/agentic-workflow-schema";

import {
  UNIT_DOC_SECTIONS,
  UNIT_DOC_SECTION_SHAPES,
  UNIT_DOC_SPEC_REF_SECTIONS,
  resolveUnitDocShape,
  unitDocSectionsFor,
} from "../src/edit/schema.mjs";
import { validate } from "../src/edit/UnitDoc.mjs";
import { verifyUnitDoc } from "../src/verify/Verify.mjs";
import { assessUnit } from "../src/retention/retention.mjs";

const STAMP = (format, grammars) => `\`\`\`text
doc-provenance@1
written_by: agentic-workflow@4.10.0
schema: @gtrabanco/agentic-workflow-schema@4.10.0
format: ${format}
grammars: ${grammars}
\`\`\``;

const FULL = `# 42 — example

> One-line: an example unit.

${STAMP("unit-doc@2", '{"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}')}

## Specs

**S1 — do the thing.**
> verbatim ask

## Acceptance criteria

1. **AC1 (S1)** — done.

## Impact

none

## Non-goals

none

## Future cost

none

## Applicable tests

- \`true\`

## Known pre-existing issues

none

## Tasks

- P1 — do it (validator: \`true\` exits 0)
  (Implements: S1)

## Findings

| id | S# / file:line | axis | severity | impact | class | route |
|---|---|---|---|---|---|---|

## Log

- **L1** — 2026-01-01, the request, verbatim:
  \`\`\`
  do the thing
  \`\`\`

## Next

ship it

## References

none
`;

/** The same unit after a settle: the trail is gone, the record is not. */
const SETTLED = `# 42 — example

> One-line: an example unit.

${STAMP("unit-doc@3", '{"log-kind":1,"obligations":1,"unit-doc":1}')}

## Specs

**S1 — do the thing.**
> verbatim ask

## Acceptance criteria

1. **AC1 (S1)** — done.

## Impact

none

## Non-goals

none

## Future cost

none

## Known pre-existing issues

none

## Log

- **L1** — 2026-01-01, the request, verbatim:
  \`\`\`
  do the thing
  \`\`\`

## References

none
`;

const HALF = SETTLED.replace(/## Log[\s\S]*?## References/u, "## References");

test("the crate publishes the schema package's carrier table and no private list", () => {
  assert.deepEqual(UNIT_DOC_SECTION_SHAPES, SCHEMA_SHAPES);
  assert.deepEqual([...UNIT_DOC_SETTLED_SECTIONS_OF(SCHEMA_SHAPES)], [...SCHEMA_SETTLED]);
  assert.deepEqual([...unitDocSectionsFor("settled")], [...SCHEMA_SETTLED]);
  assert.deepEqual([...unitDocSectionsFor("spec-by-reference")], [...UNIT_DOC_SPEC_REF_SECTIONS]);
  // The legacy alias still answers the legacy list, so no reader silently upgrades.
  assert.deepEqual([...UNIT_DOC_SECTIONS], [...SCHEMA_SHAPES.legacy]);
  assert.equal(resolveUnitDocShape([...SCHEMA_SETTLED]), schemaResolve([...SCHEMA_SETTLED]));
});

test("a full and a settled unit validate side by side, each against its own shape", () => {
  assert.equal(resolveUnitDocShape(FULL.split("\n").filter((line) => line.startsWith("## ")).map((line) => line.slice(3))), "spec-by-reference");
  assert.equal(resolveUnitDocShape(SETTLED.split("\n").filter((line) => line.startsWith("## ")).map((line) => line.slice(3))), "settled");
  assert.deepEqual(validate(FULL), { ok: true, violations: [] });
  assert.deepEqual(validate(SETTLED), { ok: true, violations: [] });
});

test("a half-trimmed document fails closed in the writer, the verifier and the sensor", () => {
  const writer = validate(HALF);
  assert.equal(writer.ok, false, "the writer refuses a body that satisfies no carrier");

  const verified = verifyUnitDoc({ text: HALF, path: "docs/features/42-example/SPEC.md" });
  assert.equal(verified.ok, false, "the verifier refuses it");
  assert.ok(
    verified.violations.some((violation) => ["section-shape", "section-missing", "provenance-format-mismatch"].includes(violation.code)),
    "the verifier refuses it against the carrier it can no longer resolve",
  );

  const assessed = assessUnit({
    unit: "docs/features/42-example",
    text: HALF,
    status: "done",
    files: ["SPEC.md"],
    dirty: false,
  });
  assert.equal(assessed.state, "unknown-carrier", "the trimmer will not act on a body it cannot read");
  assert.equal(assessed.eligible, false);
});

test("the trim and keep matrix is re-exported from its one owner", () => {
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
  assert.equal(UNIT_DOC_KEEP_FILES.includes("decisions.md"), true);
});

function UNIT_DOC_SETTLED_SECTIONS_OF(shapes) {
  return shapes.settled;
}
