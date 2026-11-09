/**
 * Provenance — the document provenance stamp (`doc-provenance@1`) in the crate.
 *
 * Canonical definition: `@gtrabanco/agentic-workflow-schema`
 * (`packages/agentic-workflow-schema/src/doc-provenance.ts`, MIT, same
 * repository). This package ships without a dependency on the schema package
 * (AC21 of unit 61), so the constants below are a provenance-commented mirror
 * and `scripts/unit-doc-contract.test.mjs` pins the two sets — the same pattern
 * the unit-doc section lists already follow. A drifting mirror is the defect,
 * not the second copy.
 *
 * What the stamp is for (issue #462): a machine-read document declares which
 * grammar and carrier layout it speaks and which tool/schema wrote it, so a
 * reader dispatches the right parser instead of guessing the generation from
 * artifact presence. Three axes, never merged — `grammars` (content),
 * `format` (carrier layout generation), `written_by`/`schema` (forensic).
 *
 * Write points: creation (`UnitDoc.createSpecByReference`) and a re-cut
 * (`stampFile`, the `unit-doc <slug> provenance` CLI op) — never per edit, so
 * the stamp never becomes a second thing to keep in sync. A re-stamp is
 * byte-identical, which is also what proves the stamp is a generation and not a
 * revision counter.
 *
 * An absent stamp is a declared degradation, never an error: the format is
 * derived from the carrier headings the document actually carries
 * (`resolveUnitDocShape`, the pre-existing heuristic) and closed units are never
 * backstamped.
 */

import { createHash } from "node:crypto";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveUnitDocShape } from "./schema.mjs";

/** The versioned contract id every stamp carries. */
export const DOC_PROVENANCE_CONTRACT_ID = "doc-provenance@1";

/** The stamp's closed field set, in canonical (serialization) order. */
export const DOC_PROVENANCE_FIELDS = Object.freeze(["written_by", "schema", "format", "grammars"]);

/** The tools allowed to write a document (mirror of `DOC_PROVENANCE_TOOLS`). */
export const DOC_PROVENANCE_TOOLS = Object.freeze(["agentic-workflow"]);

/** The schema package's published name — the `schema` field's target. */
export const DOC_PROVENANCE_SCHEMA_PACKAGE = "@gtrabanco/agentic-workflow-schema";

/** The closed carrier-format vocabulary (mirror of `DOC_PROVENANCE_FORMATS`). */
export const DOC_PROVENANCE_FORMATS = Object.freeze(["unit-doc@1", "unit-doc@2"]);

/** The closed grammar-family set a stamp may declare. */
export const DOC_GRAMMAR_FAMILIES = Object.freeze(["findings-table", "log-kind", "obligations", "unit-doc"]);

/** The generation this package publishes for each family. */
export const DOC_GRAMMAR_VERSIONS = Object.freeze({ "findings-table": 1, "log-kind": 1, obligations: 1, "unit-doc": 1 });

/** The grammar families each carrier format actually publishes (the parity target). */
export const DOC_FORMAT_GRAMMARS = Object.freeze({
  "unit-doc@1": Object.freeze(["obligations", "unit-doc"]),
  "unit-doc@2": Object.freeze(["findings-table", "log-kind", "obligations", "unit-doc"]),
});

/** The unit-doc carrier shape each format names. */
export const DOC_FORMAT_SHAPES = Object.freeze({ "unit-doc@1": "legacy", "unit-doc@2": "spec-by-reference" });

/** The reader verdicts. */
export const DOC_PROVENANCE_READER_VERDICTS = Object.freeze(["current", "degrade", "refuse"]);

/** The closed reasons a verdict carries. */
export const DOC_PROVENANCE_READER_REASONS = Object.freeze([
  "stamp-current",
  "absent-stamp",
  "format-older-compatible",
  "format-too-old",
  "format-newer-than-reader",
  "format-unknown-to-reader",
  "grammar-older-compatible",
  "grammar-newer-than-reader",
  "grammar-unknown-to-reader",
  "stamp-invalid",
]);

/** This crate's own reader: the published generation, window floor at 0. */
export const CURRENT_READER = Object.freeze({
  format: "unit-doc@2",
  grammars: DOC_GRAMMAR_VERSIONS,
  readable_from: 0,
});

const SEMVER = /^\d+\.\d+\.\d+$/u;
const FORMAT_TOKEN = /^([a-z][a-z0-9-]*)@(\d+)$/u;
const FIELD_LINE = /^([a-z_]+):[ \t]*(.*)$/u;

const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/** `family@generation` → its family, or null when the token is not that shape. */
export function formatFamilyOf(token) {
  return FORMAT_TOKEN.exec(token)?.[1] ?? null;
}

/** `family@generation` → its generation, or null when the token is not that shape. */
export function formatGenerationOf(token) {
  const match = FORMAT_TOKEN.exec(token);
  return match === null ? null : Number(match[2]);
}

/** The carrier format a document's headings satisfy, or null (the derivation
 *  source an absent stamp falls back to). */
export function deriveFormat(headings) {
  const shape = resolveUnitDocShape(headings);
  if (shape === null) return null;
  for (const [format, named] of Object.entries(DOC_FORMAT_SHAPES)) {
    if (named === shape) return format;
  }
  return null;
}

/** The `## ` headings of a markdown document. */
export function headingsOf(text) {
  return (text.match(/^## (.+)$/gmu) ?? []).map((line) => line.replace(/^## /u, "").trim());
}

/**
 * The versions the writer stamps: its own manifest version, and the schema
 * package's version under its published name.
 *
 * One train version (D-40-14) is what makes the pair deterministic — the schema
 * package cannot be resolved from an installed crate that deliberately does not
 * depend on it, and the probe proves the invariant instead of restating it. The
 * root parity suite refuses a split train, so this can never silently lie.
 */
export function toolVersions() {
  const manifest = JSON.parse(readFileSync(fileURLToPath(new URL("../../package.json", import.meta.url)), "utf8"));
  return {
    tool: "agentic-workflow",
    tool_version: manifest.version,
    schema: DOC_PROVENANCE_SCHEMA_PACKAGE,
    schema_version: manifest.version,
  };
}

/** `<name>@<semver>` split at the last `@` (the scope contains none). */
function splitAtVersion(value) {
  const at = value.lastIndexOf("@");
  if (at <= 0) return null;
  const version = value.slice(at + 1);
  return SEMVER.test(version) ? { name: value.slice(0, at), version } : null;
}

/**
 * The stamp's structural rules — everything needed to read a document at all,
 * independent of which generations the asking reader publishes.
 */
function structureErrors(value) {
  const errors = [];
  const fail = (code, detail) => errors.push({ code, detail });
  if (!isRecord(value)) return [{ code: "not-an-object", detail: "the stamp is not an object" }];

  for (const key of Object.keys(value)) {
    if (key !== "contract" && !DOC_PROVENANCE_FIELDS.includes(key)) fail("unknown-field", `unknown field ${key}`);
  }
  if (value.contract !== DOC_PROVENANCE_CONTRACT_ID) fail("wrong-contract", `contract must be ${DOC_PROVENANCE_CONTRACT_ID}`);
  for (const field of DOC_PROVENANCE_FIELDS) {
    if (value[field] === undefined || value[field] === null) fail("missing-field", `${field} is required`);
  }

  if (value.written_by !== undefined && value.written_by !== null) {
    const split = typeof value.written_by === "string" ? splitAtVersion(value.written_by) : null;
    if (split === null) fail("malformed-version", "written_by must be <tool>@<semver>");
    else if (!DOC_PROVENANCE_TOOLS.includes(split.name)) fail("unknown-tool", `unknown writer tool ${split.name}`);
  }

  if (value.schema !== undefined && value.schema !== null) {
    const split = typeof value.schema === "string" ? splitAtVersion(value.schema) : null;
    if (split === null) fail("malformed-version", "schema must be <package>@<semver>");
    else if (split.name !== DOC_PROVENANCE_SCHEMA_PACKAGE) {
      fail("wrong-schema-package", `schema must name ${DOC_PROVENANCE_SCHEMA_PACKAGE}`);
    }
  }

  if (value.grammars !== undefined && value.grammars !== null) {
    if (!isRecord(value.grammars)) {
      fail("malformed-grammars", "grammars must be an object");
    } else {
      const keys = Object.keys(value.grammars);
      if (keys.length === 0) fail("empty-grammars", "grammars must declare at least one family");
      for (const family of keys) {
        const generation = value.grammars[family];
        if (!/^[a-z][a-z0-9-]*$/u.test(family)) {
          fail("malformed-grammars", `${JSON.stringify(family)} is not a grammar family name`);
          continue;
        }
        if (typeof generation !== "number" || !Number.isInteger(generation) || generation < 1) {
          fail("malformed-generation", `${family} must carry an integer generation >= 1`);
        }
      }
    }
  }
  return errors;
}

/**
 * Validate one parsed stamp against a published contract.
 *
 * Structural validity plus "does it speak a generation the contract publishes".
 * Carrier parity (`DOC_FORMAT_GRAMMARS`) belongs to the verifier, not here.
 */
export function validateProvenance(value, contract = {}) {
  const formats = contract.formats ?? DOC_PROVENANCE_FORMATS;
  const grammars = contract.grammars ?? DOC_GRAMMAR_VERSIONS;
  const errors = structureErrors(value);
  if (!isRecord(value)) return { valid: false, errors };

  if (value.format !== undefined && value.format !== null) {
    if (typeof value.format !== "string" || !formats.includes(value.format)) {
      errors.push({ code: "unpublished-format", detail: `format ${JSON.stringify(value.format)} is not published` });
    }
  }
  if (isRecord(value.grammars)) {
    for (const [family, generation] of Object.entries(value.grammars)) {
      if (typeof generation !== "number" || !Number.isInteger(generation) || generation < 1) continue;
      if (!/^[a-z][a-z0-9-]*$/u.test(family)) continue;
      if (!(family in grammars)) {
        errors.push({ code: "unpublished-grammar-family", detail: `unknown grammar family ${family}` });
        continue;
      }
      if (generation > grammars[family]) {
        errors.push({
          code: "unpublished-grammar-generation",
          detail: `${family} generation ${generation} is not published (max ${grammars[family]})`,
        });
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

/** A stamp's canonical fenced block (grammar keys sorted). */
export function serializeProvenance(stamp) {
  const grammars = Object.keys(stamp.grammars)
    .sort()
    .reduce((out, key) => {
      out[key] = stamp.grammars[key];
      return out;
    }, {});
  return [
    DOC_PROVENANCE_CONTRACT_ID,
    `written_by: ${stamp.written_by}`,
    `schema: ${stamp.schema}`,
    `format: ${stamp.format}`,
    `grammars: ${JSON.stringify(grammars)}`,
  ].join("\n");
}

/** The document's stamp block's offsets, or null when it carries none. */
function locateStamp(text) {
  let fence = null;
  let openAt = -1;
  let bodyStart = -1;
  let offset = 0;
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const run = /^(`{3,}|~{3,})/u.exec(trimmed);
    if (fence === null) {
      if (run) {
        fence = run[1][0];
        openAt = offset;
        bodyStart = offset + line.length + 1;
      }
    } else if (run && trimmed[0] === fence && trimmed.replace(/[`~]/gu, "") === "") {
      const body = text.slice(bodyStart, offset);
      if (body.split("\n")[0]?.trim() === DOC_PROVENANCE_CONTRACT_ID) {
        return { head: text.slice(0, openAt), tail: text.slice(offset + line.length), start: bodyStart, end: offset };
      }
      fence = null;
      openAt = -1;
      bodyStart = -1;
    }
    offset += line.length + 1;
  }
  return null;
}

/** The document's stamp block body, or null. */
function stampBody(text) {
  const at = locateStamp(text);
  if (at === null) return null;
  return text.slice(at.start, at.end).replace(/\n$/u, "");
}

/**
 * Parse the document's stamp block.
 *
 * Errors are strings (`<code>: <detail>`) — a parse failure is reported to a
 * human first; `validateProvenance` carries the structured form for a machine.
 * An absent block is `{ value: null, errors: [] }`: absence is a degradation.
 */
export function parseProvenance(text) {
  const body = stampBody(text);
  if (body === null) return { value: null, errors: [] };

  const errors = [];
  const fields = {};
  for (const line of body.split("\n").slice(1)) {
    if (line.trim() === "") continue;
    const match = FIELD_LINE.exec(line.trim());
    if (match === null) {
      errors.push(`malformed-field: ${line.trim()}`);
      continue;
    }
    const [, key, value] = match;
    if (!DOC_PROVENANCE_FIELDS.includes(key)) {
      errors.push(`unknown-field: ${key}`);
      continue;
    }
    if (key in fields) {
      errors.push(`duplicate-field: ${key}`);
      continue;
    }
    fields[key] = value;
  }
  for (const field of DOC_PROVENANCE_FIELDS) {
    if (!(field in fields)) errors.push(`missing-field: ${field}`);
  }
  if (errors.length > 0) return { value: null, errors };

  let grammars;
  try {
    grammars = JSON.parse(fields.grammars);
  } catch {
    return { value: null, errors: [`malformed-grammars: ${fields.grammars}`] };
  }
  if (formatFamilyOf(fields.format) === null || formatGenerationOf(fields.format) === null) {
    return { value: null, errors: [`unpublished-format: ${fields.format} is not a <family>@<generation> token`] };
  }
  const candidate = {
    contract: DOC_PROVENANCE_CONTRACT_ID,
    written_by: fields.written_by,
    schema: fields.schema,
    format: fields.format,
    grammars,
  };
  const structure = structureErrors(candidate);
  if (structure.length > 0) return { value: null, errors: structure.map((e) => `${e.code}: ${e.detail}`) };
  return { value: candidate, errors: [] };
}

/**
 * Read one document's stamp as *this* reader (mirror of `readDocProvenance`).
 *
 * Precedence: a malformed stamp refuses, an absent one degrades with the
 * carrier-derived format, then the `format` axis (newer refuses, older degrades
 * inside the window and refuses outside it with the migration note, an unknown
 * family refuses), then the `grammars` axis (newer refuses, older degrades,
 * unknown refuses). A refusal always carries its reason.
 */
export function readProvenance(text, reader = CURRENT_READER) {
  const { value, errors } = parseProvenance(text);
  if (errors.length > 0) return { verdict: "refuse", reason: "stamp-invalid", stamp: null, note: errors.join("; ") };
  if (value === null) {
    return { verdict: "degrade", reason: "absent-stamp", stamp: null, derived_format: deriveFormat(headingsOf(text)) };
  }

  const documentFamily = formatFamilyOf(value.format);
  const documentGeneration = formatGenerationOf(value.format) ?? 0;
  if (documentFamily === null || documentFamily !== formatFamilyOf(reader.format)) {
    return { verdict: "refuse", reason: "format-unknown-to-reader", stamp: value };
  }
  const readerGeneration = formatGenerationOf(reader.format) ?? 0;
  if (documentGeneration > readerGeneration) {
    return { verdict: "refuse", reason: "format-newer-than-reader", stamp: value };
  }
  let verdict = "current";
  let reason = "stamp-current";
  if (documentGeneration < readerGeneration) {
    const floor = reader.readable_from ?? 0;
    if (documentGeneration <= floor) {
      return {
        verdict: "refuse",
        reason: "format-too-old",
        stamp: value,
        note: `written under ${value.format} — see MIGRATION.md`,
      };
    }
    verdict = "degrade";
    reason = "format-older-compatible";
  }
  for (const [family, generation] of Object.entries(value.grammars)) {
    const published = reader.grammars[family];
    if (published === undefined) return { verdict: "refuse", reason: "grammar-unknown-to-reader", stamp: value };
    if (generation > published) return { verdict: "refuse", reason: "grammar-newer-than-reader", stamp: value };
    if (generation < published && verdict === "current") {
      verdict = "degrade";
      reason = "grammar-older-compatible";
    }
  }
  return { verdict, reason, stamp: value };
}

/** The stamp a writer emits for a document whose headings satisfy `format`. */
export function stampFor(text, versions = toolVersions()) {
  const format = deriveFormat(headingsOf(text));
  if (format === null) return null;
  const grammars = {};
  for (const family of DOC_FORMAT_GRAMMARS[format]) grammars[family] = DOC_GRAMMAR_VERSIONS[family];
  return {
    contract: DOC_PROVENANCE_CONTRACT_ID,
    written_by: `${versions.tool}@${versions.tool_version}`,
    schema: `${versions.schema}@${versions.schema_version}`,
    format,
    grammars,
  };
}

/**
 * Write the stamp into a document: replace an existing block in place, or insert
 * one into the preamble (before the first section) at creation.
 *
 * Throws when the carrier satisfies neither accepted shape — a document with no
 * derivable format has nothing to declare, and inventing one is the guess this
 * contract removes.
 */
export function stampDocument(text, versions = toolVersions()) {
  const stamp = stampFor(text, versions);
  if (stamp === null) {
    throw new Error(
      "the document's headings satisfy neither accepted unit-doc carrier, so no format can be declared (carrier derivation returned none)",
    );
  }
  const block = "```text\n" + serializeProvenance(stamp) + "\n```";
  const at = locateStamp(text);
  if (at !== null) {
    return at.head + block + at.tail;
  }
  const firstSection = text.search(/^## /mu);
  if (firstSection === -1) throw new Error("the document has no `## ` section, so the stamp has no preamble to live in");
  return `${text.slice(0, firstSection).trimEnd()}\n\n${block}\n\n${text.slice(firstSection)}`;
}

/**
 * Stamp one unit document on disk atomically and return its receipt.
 *
 * The write point S4 names: run it at creation and at a re-cut, never per edit.
 * A second run is byte-identical, so it is safe to re-run.
 */
export function stampFile(docPath, versions = toolVersions()) {
  const before = readFileSync(docPath, "utf8");
  const after = stampDocument(before, versions);
  if (after !== before) {
    const temporary = join(dirname(docPath), `.${docPath.split("/").pop()}.provenance.tmp`);
    writeFileSync(temporary, after);
    renameSync(temporary, docPath);
  }
  return {
    service: "UNIT_DOC",
    op: "provenance",
    path: docPath,
    schema: "doc-provenance@1",
    before: hash(before),
    after: hash(after),
    ok: parseProvenance(after).value !== null,
  };
}

/** The receipt's short content digest (the crate's receipts report 8 hex). */
function hash(text) {
  return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 8);
}
