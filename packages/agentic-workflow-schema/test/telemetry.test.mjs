/**
 * telemetry.test.mjs — the session sample's published vocabulary (issue #504,
 * unit docs/features/494-telemetry-by-turn/).
 *
 * The corpus was observed RED before `src/telemetry.ts` existed (the owner's
 * application workflow: one test per requested rule, red first). What it pins:
 *
 *  - **One home for the phase vocabulary.** `PHASE_LABELS` is an exact set: a
 *    label that names no command is a dead label and a command with no label is
 *    an unmeasurable phase, so the set is closed in both directions (S2, S8).
 *  - **The sample's field list is declared once.** The ledger's `tier-cost@2`
 *    columns, the JSONL line and the JSON Schema are all projections of
 *    `TELEMETRY_SAMPLE_FIELDS`; a field added to one surface and not the others
 *    is exactly the drift those projections exist to make impossible (S1, S4).
 *  - **The schema is derived, not written.** `telemetrySampleJsonSchema()`
 *    builds its properties from the field list, so the committed
 *    `docs/telemetry/schema.json` can only be a projection of it (S6).
 *  - **Data, never prose.** No property carries a description: the sample is a
 *    machine surface and its explanations live in separate documentation (S9).
 */

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  PHASE_LABELS,
  TELEMETRY_SAMPLE_FIELDS,
  TELEMETRY_TOKEN_FIELDS,
  telemetrySampleJsonSchema,
} from "../dist/index.js";

/** The command surface the labels must equal, read from the repository tree. */
const COMMANDS = [
  // The fourteen user-invocable skills at the cut (skills/<name>/SKILL.md).
  "audit-docs",
  "audit-pr",
  "batch-scheduler",
  "discover-repository-state",
  "execute-phase",
  "fold-findings",
  "init-workspace",
  "log-session",
  "product-audit",
  "resolve-repository-state",
  "review-change",
  "triage-issue",
  "unit-lane",
  "workflow-status",
  // The four native command names the package registers in code
  // (routing/types.ts: ADVANCE_COMMAND, AW_INDEX_COMMAND, SETTINGS_COMMAND,
  // SETTINGS_COMMAND_ALIAS).
  "advance",
  "aw-index",
  "agentic-workflow-settings",
  "aw-settings",
];

/** The sample's sixteen fields, in the order the `tier-cost@2` ledger declares. */
const FIELDS = [
  "unit",
  "phase",
  "version",
  "model",
  "changed_paths",
  "tokens",
  "turns",
  "input_tokens",
  "output_tokens",
  "cache_read_tokens",
  "cache_write_tokens",
  "reasoning_tokens",
  "model_ms",
  "tool_ms",
  "observed",
  "source",
];

/** A canonical sample: every field, the shape the accumulator emits. */
const SAMPLE = {
  unit: "494-telemetry-by-turn",
  phase: "execute-phase",
  version: "4.10.0",
  model: "anthropic/claude-sonnet-4-5",
  changed_paths: 7,
  tokens: 1_500,
  turns: 4,
  input_tokens: 800,
  output_tokens: 300,
  cache_read_tokens: 250,
  cache_write_tokens: 100,
  reasoning_tokens: 50,
  model_ms: 9_400,
  tool_ms: 600,
  observed: "2026-11-17",
  source: "pi:session=abc",
};

test("the phase vocabulary is the repository's real command surface, closed in both directions", () => {
  assert.deepEqual(
    [...PHASE_LABELS].sort(),
    [...COMMANDS].sort(),
    "a label with no command is dead and a command with no label is unmeasurable (S2, S8)",
  );
  assert.equal(new Set(PHASE_LABELS).size, PHASE_LABELS.length, "the vocabulary has no duplicate label");
  assert.ok(Object.isFrozen(PHASE_LABELS), "a published vocabulary is frozen: a caller cannot widen the machine");
});

test("the sample's field list is the ledger's column order, declared exactly once", () => {
  assert.deepEqual([...TELEMETRY_SAMPLE_FIELDS], FIELDS);
  assert.equal(new Set(TELEMETRY_SAMPLE_FIELDS).size, FIELDS.length, "no field is declared twice");
  assert.ok(Object.isFrozen(TELEMETRY_SAMPLE_FIELDS));
  for (const field of [
    "unit", "changed_paths", "tokens", "turns", "model_ms", "tool_ms", "observed", "source",
  ]) {
    assert.ok(TELEMETRY_SAMPLE_FIELDS.includes(field), `the tier-cost@1 column ${field} survives the widening (S4)`);
  }
});

test("the token breakdown is the five provider fields, and each one is a sample field", () => {
  assert.deepEqual(
    [...TELEMETRY_TOKEN_FIELDS],
    ["input_tokens", "output_tokens", "cache_read_tokens", "cache_write_tokens", "reasoning_tokens"],
  );
  for (const field of TELEMETRY_TOKEN_FIELDS) {
    assert.ok(TELEMETRY_SAMPLE_FIELDS.includes(field), `${field} is part of the sample it breaks down (S1)`);
  }
});

test("the JSON Schema is a projection of the field list, never a second declaration", () => {
  const schema = telemetrySampleJsonSchema();
  assert.deepEqual(Object.keys(schema.properties), [...TELEMETRY_SAMPLE_FIELDS]);
  assert.deepEqual([...schema.required], [...TELEMETRY_SAMPLE_FIELDS], "every field is required: the shape is closed");
  assert.equal(schema.additionalProperties, false, "an unknown field is refused, not stored");
  assert.equal(schema.type, "object");
});

test("the schema types each field: counts are non-negative integers, identity is a string", () => {
  const { properties } = telemetrySampleJsonSchema();
  for (const field of ["changed_paths", "tokens", "turns", "model_ms", "tool_ms", ...TELEMETRY_TOKEN_FIELDS]) {
    assert.equal(properties[field].type, "integer", `${field} is a count`);
    assert.equal(properties[field].minimum, 0, `${field} is never negative`);
  }
  for (const field of ["unit", "observed", "source"]) {
    assert.equal(properties[field].type, "string", `${field} is a string`);
  }
  assert.deepEqual(
    properties.model.type,
    ["string", "null"],
    "model is nullable: a turn the provider did not name gets no invented model",
  );
  assert.deepEqual(properties.observed.pattern, "^\\d{4}-\\d{2}-\\d{2}$", "observed is a day, not a timestamp");
  assert.deepEqual(
    properties.phase.type,
    ["string", "null"],
    "phase is nullable in the interface S1 declares, and the schema says so",
  );
  assert.deepEqual(properties.version.type, ["string", "null"], "version is nullable for the same reason");
});

test("the schema carries no prose: a machine surface explains itself elsewhere", () => {
  const schema = telemetrySampleJsonSchema();
  const walk = (node, path) => {
    if (node === null || typeof node !== "object") return;
    for (const [key, value] of Object.entries(node)) {
      assert.notEqual(key, "description", `${path} carries a description (S9: no prose in the telemetry output)`);
      assert.notEqual(key, "$comment", `${path} carries a comment`);
      walk(value, `${path}.${key}`);
    }
  };
  walk(schema, "schema");
});

test("the canonical sample validates, and each way of breaking it is refused", async () => {
  const Ajv = (await import("ajv")).default;
  const validate = new Ajv({ strict: true, allErrors: true }).compile(telemetrySampleJsonSchema());
  assert.equal(validate(SAMPLE), true, `the canonical sample must validate: ${JSON.stringify(validate.errors)}`);

  const broken = [
    ["a missing field", { ...SAMPLE, tokens: undefined }],
    ["an unknown field", { ...SAMPLE, cost_usd: 1 }],
    ["a negative count", { ...SAMPLE, tokens: -1 }],
    ["a frational count", { ...SAMPLE, turns: 1.5 }],
    ["a timestamp where a day belongs", { ...SAMPLE, observed: "2026-11-17T10:00:00Z" }],
    ["a null unit", { ...SAMPLE, unit: null }],
  ];
  for (const [why, value] of broken) {
    assert.equal(validate(value), false, `${why} must be refused`);
  }
  assert.equal(validate({ ...SAMPLE, phase: null }), true, "a nullable field accepts null");
  assert.equal(validate({ ...SAMPLE, version: null }), true, "a nullable field accepts null");
});

test("the schema is JSON-serialisable as it stands: the committed projection is this object", () => {
  const schema = telemetrySampleJsonSchema();
  assert.equal(typeof schema.$schema, "string", "the document declares its dialect");
  assert.deepEqual(JSON.parse(JSON.stringify(schema)), schema, "nothing in the schema is a function or a class");
});
