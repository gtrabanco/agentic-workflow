#!/usr/bin/env node

/**
 * vocabulary-parity.test.mjs — every second copy of a published vocabulary is
 * pinned to the canonical declaration (unit 84, issue #315 S1; the F22 /
 * `LOG_KINDS` pattern).
 *
 * Canonical home (decision D2): `packages/agentic-workflow-schema/src/vocabularies.ts`
 * exports the closed sets; the prose surfaces cite them; this suite refuses a
 * second copy that drifts. Adding a token to a set is a schema-const +
 * grammar-block + parity-pin change in one PR — never a prose-only edit.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { schemaRuntimePath } from "./schema-runtime.mjs";
import { CLAIM_KINDS, REASON_CODES } from "./promise-coherence.mjs";
import { LOG_KINDS } from "./unit-doc-phases.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The canonical declarations, read from the built schema runtime. */
const {
  FUTURE_STATUS_KINDS,
  FINDINGS_TABLE_SEVERITIES,
  LOG_KIND_TOKENS,
  SWEEP_CLAIM_KINDS,
  SWEEP_MISMATCH_REASONS,
  PRE_EXECUTION_FINDING_CLASSES,
} = await import(schemaRuntimePath);

const read = (relative) => readFileSync(path.join(ROOT, relative), "utf8");

/** `high \| med \| low` — the cell the `findings-table@1` blocks publish. */
const tableCell = (tokens) => `severity \\| ${tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(" \\\\\\| ")}`;

test("the schema package publishes every canonical set, non-empty", () => {
  for (const [name, set] of [
    ["FUTURE_STATUS_KINDS", FUTURE_STATUS_KINDS],
    ["FINDINGS_TABLE_SEVERITIES", FINDINGS_TABLE_SEVERITIES],
    ["LOG_KIND_TOKENS", LOG_KIND_TOKENS],
    ["SWEEP_CLAIM_KINDS", SWEEP_CLAIM_KINDS],
    ["SWEEP_MISMATCH_REASONS", SWEEP_MISMATCH_REASONS],
    ["PRE_EXECUTION_FINDING_CLASSES", PRE_EXECUTION_FINDING_CLASSES],
  ]) {
    assert.ok(Array.isArray(set) && set.length > 0, `${name} is a published const array`);
  }
});

test("the reader's LOG_KINDS equals the canonical declaration (F22 pattern)", () => {
  assert.deepEqual([...LOG_KINDS], [...LOG_KIND_TOKENS]);
});

test("the sensor's severity map covers the canonical table severities identity-mapped", () => {
  const source = read("scripts/workflow-status.mjs");
  for (const severity of FINDINGS_TABLE_SEVERITIES) {
    assert.match(source, new RegExp(`\\["${severity}", "${severity}"\\]`), `SEVERITY_VOCABULARY maps '${severity}' to itself`);
  }
});

test("the findings-table class vocabulary is the published PRE_EXECUTION_FINDING_CLASSES set", () => {
  assert.deepEqual([...PRE_EXECUTION_FINDING_CLASSES], ["product", "plan", "source", "environment", "runtime"]);
});

test("both unit-doc templates publish the canonical findings-table vocabularies", () => {
  for (const template of ["docs/features/_TEMPLATE/SPEC.md", "docs/fix/_TEMPLATE/SPEC.md"]) {
    const text = read(template);
    assert.match(text, new RegExp(tableCell(FINDINGS_TABLE_SEVERITIES)), `${template}: the severity row matches the canonical set`);
    assert.match(text, new RegExp(tableCell(PRE_EXECUTION_FINDING_CLASSES).replace("severity \\|", "class \\|")), `${template}: the class row matches the canonical set`);
  }
});

test("every prose copy of the Future-status set carries exactly the canonical tokens (F40)", () => {
  const copies = [
    "docs/features/_TEMPLATE/SPEC.md",
    "docs/fix/_TEMPLATE/SPEC.md",
    "packages/agentic-workflow/src/edit/UnitDoc.mjs",
  ];
  for (const copy of copies) {
    const text = read(copy);
    for (const status of FUTURE_STATUS_KINDS) {
      assert.match(text, new RegExp("`" + status + "(?:`| <)"), `${copy}: the canonical token '${status}' is present`);
    }
    assert.doesNotMatch(text, /kept deferred/, `${copy}: no off-vocabulary status token survives here`);
  }
});

test("the sweep claim kind is mirrored: schema kind and reason are members of the gate's closed sets", () => {
  for (const kind of SWEEP_CLAIM_KINDS) assert.ok(CLAIM_KINDS.includes(kind), `CLAIM_KINDS publishes '${kind}'`);
  for (const reason of SWEEP_MISMATCH_REASONS) assert.ok(REASON_CODES.includes(reason), `REASON_CODES publishes '${reason}'`);
});
