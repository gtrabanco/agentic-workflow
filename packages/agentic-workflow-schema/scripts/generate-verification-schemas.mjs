#!/usr/bin/env node
/**
 * Deterministic Draft-07 structural projection generator for the staged
 * verification contracts.
 *
 * Input:  the single canonical internal definition, `dist/verification-contract.js`
 *         (the same definition the two authoritative runtime validators consume).
 * Output: `verification-plan.schema.json` and `verification-receipt.schema.json`.
 *
 * The generated files are NON-AUTHORITATIVE structural projections for editors
 * and tooling. Semantic validity comes only from the package's public entry
 * points (`validateVerificationPlanV1`, `validateVerificationReceiptAgainstPlan`).
 * Never hand-edit a projection: change the canonical definition and regenerate.
 *
 * Usage:
 *   node scripts/generate-verification-schemas.mjs            # write
 *   node scripts/generate-verification-schemas.mjs --check    # fail on drift
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VERIFICATION_CONTRACT, VERIFICATION_LIMITS } from "../dist/verification-contract.js";

const PACKAGE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The two published projection files, in generation order. */
export const PROJECTION_FILES = [
  VERIFICATION_CONTRACT.plan.fileName,
  VERIFICATION_CONTRACT.receipt.fileName,
];

const CONTRACT_BY_FILE = {
  [VERIFICATION_CONTRACT.plan.fileName]: VERIFICATION_CONTRACT.plan,
  [VERIFICATION_CONTRACT.receipt.fileName]: VERIFICATION_CONTRACT.receipt,
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

function whenSchema(contract, spec, rule) {
  const when = rule.when;
  const field = spec.fields.find((candidate) => candidate.key === when.field);
  const vocabulary = field?.enum ?? [];
  let allowed;
  if (when.equals !== undefined) allowed = [when.equals];
  else if (when.in !== undefined) allowed = [...when.in];
  else if (when.notIn !== undefined) allowed = vocabulary.filter((value) => !when.notIn.includes(value));
  else throw new Error(`${contract.contractId}: rule ${rule.id} has no predicate`);
  return { properties: { [when.field]: when.equals !== undefined ? { const: when.equals } : { enum: allowed } } };
}

/** Draft-07 fragment for one projectable cross-field rule. */
function ruleFragment(contract, spec, rule) {
  const description = `[${rule.id}] ${rule.description}`;
  const when = whenSchema(contract, spec, rule);

  switch (rule.kind) {
    case "exactly-one-non-null": {
      const fields = rule.fields ?? [];
      const branches = fields.map((present, index) => {
        const properties = {};
        fields.forEach((key, position) => {
          const field = spec.fields.find((candidate) => candidate.key === key);
          properties[key] =
            position === index
              ? { type: jsonTypeOf(field) === "object" ? "object" : jsonTypeOf(field) }
              : { type: "null" };
        });
        return { required: [...fields], properties };
      });
      return { description, if: when, then: { anyOf: branches } };
    }
    case "null-when": {
      const properties = {};
      for (const key of rule.fields ?? []) properties[key] = { type: "null" };
      return { description, if: when, then: { properties } };
    }
    case "maximum-when": {
      const properties = {};
      for (const key of rule.fields ?? []) {
        const field = spec.fields.find((candidate) => candidate.key === key);
        // Strict Ajv needs the type next to a numeric keyword; the outer property
        // schema still decides the real type, this only scopes the ceiling.
        properties[key] = { type: jsonTypeOf(field) === "integer" ? "number" : jsonTypeOf(field), maximum: rule.maximum };
      }
      return { description, if: when, then: { properties } };
    }
    case "non-null-when": {
      const properties = {};
      for (const key of rule.fields ?? []) properties[key] = { not: { type: "null" } };
      return { description, if: when, then: { properties } };
    }
    default:
      throw new Error(`${contract.contractId}: rule ${rule.id} is not projectable`);
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
  const runtimeOnly = collectRules(contract)
    .filter((rule) => !rule.projectable)
    .map((rule) => rule.id);
  return [
    "agentic-workflow generated file - DO NOT HAND-EDIT.",
    "projection: structural-only",
    "authoritative: false",
    `authority: ${contract.authority}`,
    "semantic validation: required (a Draft-07 PASS is not contract validity)",
    `runtime-only rules (not expressible in Draft-07): ${runtimeOnly.join(", ") || "none"}`,
    // D14 canonical payload budgets are measured on the normalized canonical
    // bytes, which no Draft-07 keyword can express: disclosed, never asserted.
    `payload budget: runtime-only (canonical ${contract.rootLabel} <= ${VERIFICATION_LIMITS[`${contract.rootLabel}Bytes`] / 1024} KiB)`,
    `diagnostics: runtime-only (at most ${VERIFICATION_LIMITS.diagnostics} redacted code+path rows)`,
    "values: never returned (D16 — diagnostics carry a frozen code and an RFC 6901 pointer only)",
    "regenerate with: node scripts/generate-verification-schemas.mjs",
  ].join(" | ");
}

const PROJECTION_DESCRIPTION =
  "This document is a NON-AUTHORITATIVE Draft-07 structural projection generated from the " +
  "package's canonical verification-contract definition. It is not a semantic authority: a " +
  "Draft-07 match is not contract validity — use the authoritative runtime entry point named in $comment.";

/** Render one projection file's full text. Byte-stable for a given definition. */
export function renderProjection(fileName) {
  const contract = CONTRACT_BY_FILE[fileName];
  if (!contract) throw new Error(`unknown verification projection ${fileName}`);
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
        `verification schema drift: regenerate ${drifted.join(", ")} with ` +
          "node scripts/generate-verification-schemas.mjs",
      );
      process.exit(1);
    }
    console.log(`verification schemas are generated and drift-free (${PROJECTION_FILES.length} files)`);
  } else {
    const written = writeProjections();
    console.log(`generated ${written.join(", ")}`);
  }
}
