#!/usr/bin/env node
/**
 * Deterministic Draft-07 structural projection generator for the pre-execution
 * evidence contracts.
 *
 * Input:  the single canonical internal definition, `dist/pre-execution-contract.js`
 *         (the same definition the authoritative runtime validators consume).
 * Output: `pre-execution-artifact-snapshot.schema.json` and
 *         `pre-execution-review-receipt.schema.json`.
 *
 * The generated files are NON-AUTHORITATIVE structural projections for editors and
 * tooling. Semantic validity comes only from the package's public entry points
 * (`validatePreExecutionArtifactSnapshotV1`,
 * `validatePreExecutionReceiptAgainstSnapshot`). The stage artifact matrix, canonical
 * row ordering, PASS/material-finding coherence, author exclusion, and the payload
 * and diagnostic budgets are runtime-only and are DISCLOSED in `$comment`, never
 * silently dropped: a Draft-07 PASS is not contract validity.
 * Never hand-edit a projection: change the canonical definition and regenerate.
 *
 * Usage:
 *   node scripts/generate-pre-execution-schemas.mjs            # write
 *   node scripts/generate-pre-execution-schemas.mjs --check    # fail on drift
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PRE_EXECUTION_CONTRACT, PRE_EXECUTION_LIMITS } from "../dist/pre-execution-contract.js";
import { whenConditions } from "../dist/verification-contract.js";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The two published projection files, in generation order. */
export const PROJECTION_FILES = [
  PRE_EXECUTION_CONTRACT.snapshot.fileName,
  PRE_EXECUTION_CONTRACT.receipt.fileName,
];

const CONTRACT_BY_FILE = {
  [PRE_EXECUTION_CONTRACT.snapshot.fileName]: PRE_EXECUTION_CONTRACT.snapshot,
  [PRE_EXECUTION_CONTRACT.receipt.fileName]: PRE_EXECUTION_CONTRACT.receipt,
};

const DRAFT_07 = "http://json-schema.org/draft-07/schema#";
const NUL_PATTERN = "^[^\\0]*$";

/** Draft-07 JSON type name for a field (its non-null member when nullable). */
function jsonTypeOf(field) {
  switch (field.type) {
    case "const":
    case "enum":
    case "string":
      return "string";
    case "integer":
      return "integer";
    case "boolean":
      return "boolean";
    case "stringArray":
    case "array":
      return "array";
    case "nullable":
      return field.nullableOf === "integer"
        ? "integer"
        : field.nullableOf === "object"
          ? "object"
          : "string";
    default:
      throw new Error(`cannot type-project field ${field.key} (${field.type})`);
  }
}

/** The `null`-excluded member schema of a field (no `description` here). */
function memberSchema(field) {
  if (field.type === "nullable") {
    if (field.nullableOf === "object") {
      return { $ref: `#/$defs/${field.specName}` };
    }
    return memberSchema({
      ...field,
      type: field.nullableOf === "integer" ? "integer" : "string",
    });
  }

  switch (field.type) {
    case "const":
      return { type: "string", const: field.value };
    case "enum":
      return { type: "string", enum: [...field.enum] };
    case "boolean":
      return { type: "boolean" };
    case "integer": {
      const schema = { type: "integer" };
      if (field.exclusiveMinimum !== undefined) schema.exclusiveMinimum = field.exclusiveMinimum;
      if (field.minimum !== undefined) schema.minimum = field.minimum;
      if (field.maximum !== undefined) schema.maximum = field.maximum;
      return schema;
    }
    case "string": {
      const schema = { type: "string" };
      if (field.minLength !== undefined) schema.minLength = field.minLength;
      if (field.maxLength !== undefined) schema.maxLength = field.maxLength;
      if (field.pattern !== undefined) schema.pattern = field.pattern;
      const patterns = [];
      if (field.nulFree) patterns.push({ regex: NUL_PATTERN, message: "must not contain NUL characters" });
      for (const rule of field.rules ?? []) patterns.push({ regex: rule.regex, message: rule.message });
      if (patterns.length > 1 || (patterns.length === 1 && schema.pattern !== undefined)) {
        schema.allOf = patterns.map(({ regex, message }) => ({
          description: `[${field.key}] ${message}`,
          pattern: regex,
        }));
      } else if (patterns.length === 1) {
        schema.pattern = patterns[0].regex;
      }
      return schema;
    }
    case "stringArray": {
      const item = { type: "string" };
      if (field.itemNulFree) item.pattern = NUL_PATTERN;
      if (field.itemMaxLength !== undefined) item.maxLength = field.itemMaxLength;
      const schema = { type: "array", items: item };
      // `minItems` is deliberately NOT projected for a stringArray: the shared
      // structural engine enforces only the ceiling on this field type, so a
      // projected floor would refuse documents the runtime accepts. The finding
      // evidence floor is a semantic rule, disclosed below.
      if (field.maxItems !== undefined) schema.maxItems = field.maxItems;
      return schema;
    }
    case "array": {
      const schema = { type: "array", items: { $ref: `#/$defs/${field.specName}` } };
      if (field.minItems !== undefined) schema.minItems = field.minItems;
      if (field.maxItems !== undefined) schema.maxItems = field.maxItems;
      return schema;
    }
    default:
      throw new Error(`cannot project field ${field.key} of type ${field.type}`);
  }
}

/** Property schema for a field: the member rules plus nullability and description. */
function propertySchema(field) {
  if (field.type === "nullable") {
    const member = memberSchema(field);
    const oneOf =
      member.$ref !== undefined
        ? [{ $ref: member.$ref }, { type: "null" }]
        : [member, { type: "null" }];
    return { oneOf, description: field.description };
  }
  return { ...memberSchema(field), description: field.description };
}

/**
 * Draft-07 `if` fragment for one rule predicate. A conjunction (the `allOf` form
 * the shared engine evaluates, RS14) renders as a Draft-07 `allOf` of the same
 * member conditions, so the projection states exactly the conjunction the runtime
 * enforces instead of silently narrowing it to its first sibling.
 */
function whenSchema(contract, spec, rule) {
  const conditions = whenConditions(rule.when);
  if (conditions.length === 0) {
    throw new Error(`${contract.contractId}: rule ${rule.id} has no predicate`);
  }
  const parts = conditions.map((when) => conditionSchema(contract, spec, rule, when));
  return parts.length === 1 ? parts[0] : { allOf: parts };
}

function conditionSchema(contract, spec, rule, when) {
  const field = spec.fields.find((candidate) => candidate.key === when.field);
  const vocabulary = field?.enum ?? [];
  // A `minItems` predicate reads an ARRAY sibling and renders the array shape,
  // not a string vocabulary.
  if (when.minItems !== undefined) {
    return {
      properties: {
        [when.field]: { type: "array", minItems: when.minItems },
      },
    };
  }
  let allowed;
  if (when.equals !== undefined) allowed = [when.equals];
  else if (when.in !== undefined) allowed = [...when.in];
  else if (when.notIn !== undefined) allowed = vocabulary.filter((value) => !when.notIn.includes(value));
  else throw new Error(`${contract.contractId}: rule ${rule.id} has no predicate`);
  return {
    properties: {
      [when.field]: when.equals !== undefined ? { const: when.equals } : { enum: allowed },
    },
  };
}

/** Draft-07 fragment for one projectable cross-field rule. */
function ruleFragment(contract, spec, rule) {
  const description = `[${rule.id}] ${rule.description}`;
  // `unique-items` applies unconditionally: no `if`, so no predicate to render.
  const when = rule.kind === "unique-items" ? null : whenSchema(contract, spec, rule);

  switch (rule.kind) {
    case "null-when": {
      const properties = {};
      for (const key of rule.fields ?? []) properties[key] = { type: "null" };
      return { description, if: when, then: { properties } };
    }
    case "non-null-when": {
      const properties = {};
      for (const key of rule.fields ?? []) properties[key] = { not: { type: "null" } };
      return { description, if: when, then: { properties } };
    }
    case "exactly-one-non-null": {
      const fields = rule.fields ?? [];
      const branches = fields.map((present, index) => {
        const properties = {};
        fields.forEach((key, position) => {
          const field = spec.fields.find((candidate) => candidate.key === key);
          properties[key] =
            position === index
              ? { type: jsonTypeOf(field) }
              : { type: "null" };
        });
        return { required: [...fields], properties };
      });
      return { description, if: when, then: { anyOf: branches } };
    }
    case "enum-when": {
      const properties = {};
      for (const key of rule.fields ?? []) properties[key] = { enum: [...(rule.values ?? [])] };
      return { description, if: when, then: { properties } };
    }
    case "maximum-when": {
      // One kind states both "at most N" shapes: a numeric field is capped by
      // value, an array field by row count (e.g. the empty-parent ceiling of a
      // plain reviewer receipt). The field's own type picks the Draft-07 form.
      const properties = {};
      for (const key of rule.fields ?? []) {
        const constrained = spec.fields.find((candidate) => candidate.key === key);
        properties[key] =
          constrained?.type === "array" || constrained?.type === "stringArray"
            ? { maxItems: rule.maximum }
            : { maximum: rule.maximum };
      }
      return { description, if: when, then: { properties } };
    }
    case "unique-items": {
      // The Draft-07 floor for row identity: no two rows of `collection` are the
      // same value. It applies always, so the fragment carries no `if` — the
      // family's stronger key-level rules stay runtime-only and are disclosed.
      const properties = { [rule.collection ?? ""]: { uniqueItems: true } };
      return { description, properties };
    }
    default:
      throw new Error(`${contract.contractId}: rule ${rule.id} (${rule.kind}) is not projectable`);
  }
}

function objectBody(contract, spec) {
  const properties = {};
  for (const field of spec.fields) properties[field.key] = propertySchema(field);
  const body = {
    type: "object",
    additionalProperties: false,
    required: spec.fields.map((field) => field.key),
    properties,
  };
  const fragments = spec.rules
    .filter((rule) => rule.projectable)
    .map((rule) => ruleFragment(contract, spec, rule));
  if (fragments.length > 0) body.allOf = fragments;
  return body;
}

function collectRules(contract) {
  return [
    ...contract.root.rules,
    ...Object.values(contract.objects).flatMap((spec) => spec.rules),
  ];
}

function projectionComment(contract) {
  const ruleIds = collectRules(contract)
    .filter((rule) => !rule.projectable)
    .map((rule) => rule.id);
  // The declared-runtime rules are the semantics that live in the authoritative
  // entry rather than in any cross-field rule table; both classes are disclosed.
  const declared = contract.runtimeRules.map((rule) => `${rule.id} (${rule.claim})`);
  const budget = PRE_EXECUTION_LIMITS[`${contract.rootLabel}Bytes`];
  return [
    "agentic-workflow generated file - DO NOT HAND-EDIT.",
    "projection: structural-only",
    "authoritative: false",
    `authority: ${contract.authority}`,
    "semantic validation: required (a Draft-07 PASS is not contract validity)",
    `runtime-only rules (not expressible in Draft-07): ${ruleIds.join(", ") || "none"}; ${declared.join("; ")}`,
    // Canonical payload budgets are measured on normalized canonical bytes, which
    // no Draft-07 keyword can express: disclosed, never asserted.
    `payload budget: runtime-only (canonical ${contract.rootLabel} <= ${budget} bytes = ${budget / 1024} KiB)`,
    `diagnostics: runtime-only (at most ${PRE_EXECUTION_LIMITS.diagnostics} redacted code+path rows)`,
    "values: never returned (D16 — diagnostics carry a frozen code and an RFC 6901 pointer only)",
    "regenerate with: node scripts/generate-pre-execution-schemas.mjs",
  ].join(" | ");
}

const PROJECTION_DESCRIPTION =
  "This document is a NON-AUTHORITATIVE Draft-07 structural projection generated from the " +
  "package's canonical pre-execution-contract definition. It is not a semantic authority: a " +
  "Draft-07 match is not contract validity — use the authoritative runtime entry point named in $comment.";

/** Render one projection file's full text. Byte-stable for a given definition. */
export function renderProjection(fileName) {
  const contract = CONTRACT_BY_FILE[fileName];
  if (!contract) throw new Error(`unknown pre-execution projection ${fileName}`);
  const defs = {};
  for (const [name, spec] of Object.entries(contract.objects)) defs[name] = objectBody(contract, spec);
  const document = {
    $schema: DRAFT_07,
    $comment: projectionComment(contract),
    title: contract.title,
    description: `${contract.description} ${PROJECTION_DESCRIPTION}`,
    ...objectBody(contract, contract.root),
    $defs: defs,
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}

/** Compare the committed projections with the generated bytes. */
export function checkProjections({ packageRoot = PACKAGE_ROOT } = {}) {
  const drifted = [];
  for (const fileName of PROJECTION_FILES) {
    let committed;
    try {
      committed = readFileSync(join(packageRoot, fileName), "utf-8");
    } catch {
      committed = null;
    }
    if (committed !== renderProjection(fileName)) drifted.push(fileName);
  }
  return { ok: drifted.length === 0, drifted };
}

/** Write both projections; returns the files written. */
export function writeProjections({ packageRoot = PACKAGE_ROOT } = {}) {
  for (const fileName of PROJECTION_FILES) {
    writeFileSync(join(packageRoot, fileName), renderProjection(fileName), "utf-8");
  }
  return [...PROJECTION_FILES];
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null;
if (invokedPath !== null && invokedPath === fileURLToPath(import.meta.url)) {
  if (process.argv.includes("--check")) {
    const { ok, drifted } = checkProjections();
    if (!ok) {
      console.error(
        `pre-execution schema drift: regenerate ${drifted.join(", ")} with ` +
          "node scripts/generate-pre-execution-schemas.mjs",
      );
      process.exit(1);
    }
    console.log(
      `pre-execution schemas are generated and drift-free (${PROJECTION_FILES.length} files)`,
    );
  } else {
    const written = writeProjections();
    console.log(`generated ${written.join(", ")}`);
  }
}
