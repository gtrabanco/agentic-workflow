/**
 * The document provenance stamp (`doc-provenance@1`) — issue #462.
 *
 * A machine-read document declares which grammar and carrier layout it speaks
 * and which tool/schema wrote it, so a reader dispatches the right parser
 * instead of guessing the generation from artifact presence (a `TASKS.md` beside
 * the SPEC used to mean "legacy carrier").
 *
 * **Three axes, never merged.** One merged version number is the defect this
 * contract removes:
 *
 *  - `grammars` — which vocabulary the **content** speaks (requirement ids,
 *    task-link grammar, the findings table, the log kinds, the obligations
 *    ledger). Closed family set, integer generation each.
 *  - `format` — which **carrier layout** the document was written under (the
 *    section set a major re-cut rewrites wholesale). A `<family>@<generation>`
 *    token from a closed vocabulary.
 *  - `written_by` / `schema` — the **forensic** half: which tool version and
 *    which schema-package version wrote it, so a breakage is reproducible and
 *    bisectable across the train (D-40-14's single train version is what makes
 *    the pair deterministic).
 *
 * **Semver dispatch.** A reader answers `current | degrade | refuse` from the
 * closed reason set against its *own* published contract: an older generation
 * degrades inside the declared compatibility window, a newer one refuses typed,
 * an unknown family refuses. A silent misparse is never an answer (S6).
 *
 * **Absent stamp is a degradation, never an error** (S5): the generation is
 * derived from the carrier the document actually carries, so a closed unit
 * written before this contract existed stays readable and is never backstamped.
 *
 * The carried block is one fenced block in the document's preamble:
 *
 * ```text
 * doc-provenance@1
 * written_by: agentic-workflow@4.10.0
 * schema: @gtrabanco/agentic-workflow-schema@4.10.0
 * format: unit-doc@2
 * grammars: {"findings-table":1,"log-kind":1,"obligations":1,"unit-doc":1}
 * ```
 *
 * `validateDocProvenance` answers "is this a valid document under a published
 * contract"; `readDocProvenance` answers "how does THIS reader treat it". Both
 * are deterministic and dependency-free.
 */

import { resolveUnitDocShape } from "./pre-execution.js";

/** The versioned contract id every stamp and every grammar block carries. */
export const DOC_PROVENANCE_CONTRACT_ID = "doc-provenance@1" as const;

/** The stamp's closed field set, in canonical (serialization) order. */
export const DOC_PROVENANCE_FIELDS = ["written_by", "schema", "format", "grammars"] as const;
export type DocProvenanceField = (typeof DOC_PROVENANCE_FIELDS)[number];

/** The tools allowed to write a document. Closed: a new writer is a contract
 *  change, never a free string that a reader has to guess about. */
export const DOC_PROVENANCE_TOOLS = ["agentic-workflow"] as const;
export type DocProvenanceTool = (typeof DOC_PROVENANCE_TOOLS)[number];

/** The schema package's published name — the `schema` field's target. */
export const DOC_PROVENANCE_SCHEMA_PACKAGE = "@gtrabanco/agentic-workflow-schema";

/** The closed carrier-format vocabulary: `<family>@<generation>`. The family is
 *  what a reader dispatches on; the generation is what semver orders. Adding a
 *  carrier layout (a re-cut) is a new member, never a free string. */
export const DOC_PROVENANCE_FORMATS = [
  "unit-doc@1",
  "unit-doc@2",
] as const;
export type DocProvenanceFormat = (typeof DOC_PROVENANCE_FORMATS)[number];

/** The closed grammar-family set a stamp may declare. */
export const DOC_GRAMMAR_FAMILIES = ["findings-table", "log-kind", "obligations", "unit-doc"] as const;
export type DocGrammarFamily = (typeof DOC_GRAMMAR_FAMILIES)[number];

/** The generation the package publishes for each family. A document may declare
 *  an older one (readable) but never a newer one. */
export const DOC_GRAMMAR_VERSIONS = Object.freeze({
  "findings-table": 1,
  "log-kind": 1,
  "obligations": 1,
  "unit-doc": 1,
});

/** The grammar families each carrier format actually publishes — the parity
 *  target (S8: "stamped units' declared grammar ↔ carrier actually present"). */
export const DOC_FORMAT_GRAMMARS: Readonly<Record<string, readonly DocGrammarFamily[]>> = Object.freeze({
  "unit-doc@1": Object.freeze(["obligations", "unit-doc"] as const),
  "unit-doc@2": Object.freeze(["findings-table", "log-kind", "obligations", "unit-doc"] as const),
});

/** The unit-doc carrier shape each format names — the derivation source an
 *  absent stamp falls back to (S5), owned by `resolveUnitDocShape`. */
export const DOC_FORMAT_SHAPES: Readonly<Record<string, string>> = Object.freeze({
  "unit-doc@1": "legacy",
  "unit-doc@2": "spec-by-reference",
});

/** The reader verdicts (`doc-provenance-reader-verdict`). */
export const DOC_PROVENANCE_READER_VERDICTS = ["current", "degrade", "refuse"] as const;
export type DocProvenanceReaderVerdict = (typeof DOC_PROVENANCE_READER_VERDICTS)[number];

/** The closed reasons a verdict carries (`doc-provenance-reader-reason`). */
export const DOC_PROVENANCE_READER_REASONS = [
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
] as const;
export type DocProvenanceReaderReason = (typeof DOC_PROVENANCE_READER_REASONS)[number];

/** The validation refusals (`doc-provenance-refusal`). */
export const DOC_PROVENANCE_REFUSALS = [
  "not-an-object",
  "wrong-contract",
  "unknown-field",
  "missing-field",
  "unknown-tool",
  "malformed-version",
  "wrong-schema-package",
  "unpublished-format",
  "malformed-grammars",
  "empty-grammars",
  "malformed-generation",
  "unpublished-grammar-family",
  "unpublished-grammar-generation",
] as const;
export type DocProvenanceRefusal = (typeof DOC_PROVENANCE_REFUSALS)[number];

/** One parsed stamp: the block's fields plus the contract id the marker states. */
export interface DocProvenance {
  contract: typeof DOC_PROVENANCE_CONTRACT_ID;
  written_by: string;
  schema: string;
  format: string;
  grammars: Record<string, number>;
}

/** The published contract a validator (or a reader) judges against. Extending
 *  it is how a v-Next reader reads a v-Next document; the defaults are this
 *  package's own generation. */
export interface DocProvenanceContract {
  formats: readonly string[];
  grammars: Readonly<Record<string, number>>;
}

/** A reader's own contract. `readable_from` is the declared compatibility
 *  window's floor: the generation the reader is done with, so a document at or
 *  below it is refused as too old (`0` — the default — refuses nothing). */
export interface DocProvenanceReader {
  format: string;
  grammars: Readonly<Record<string, number>>;
  readable_from?: number;
}

export interface DocProvenanceReading {
  verdict: DocProvenanceReaderVerdict;
  reason: DocProvenanceReaderReason;
  stamp: DocProvenance | null;
  derived_format?: DocProvenanceFormat | null;
  note?: string;
}

export interface DocProvenanceViolation {
  code: DocProvenanceRefusal;
  detail: string;
}

const SEMVER = /^\d+\.\d+\.\d+$/u;
const FORMAT_TOKEN = /^([a-z][a-z0-9-]*)@(\d+)$/u;
const STAMP_MARKER = DOC_PROVENANCE_CONTRACT_ID;

/** `family@generation` → its family, or null when the token is not that shape. */
export function formatFamilyOf(token: string): string | null {
  return FORMAT_TOKEN.exec(token)?.[1] ?? null;
}

/** `family@generation` → its generation, or null when the token is not that shape. */
export function formatGenerationOf(token: string): number | null {
  const match = FORMAT_TOKEN.exec(token);
  return match === null ? null : Number(match[2]);
}

/**
 * The carrier format a document's headings satisfy, or null when they satisfy
 * neither accepted shape. The derivation source S5 names: one resolver
 * (`resolveUnitDocShape`), one shape → format table.
 */
export function deriveFormat(headings: readonly string[]): DocProvenanceFormat | null {
  const shape = resolveUnitDocShape(headings);
  if (shape === null) return null;
  for (const [format, named] of Object.entries(DOC_FORMAT_SHAPES)) {
    if (named === shape) return format as DocProvenanceFormat;
  }
  return null;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** The generation a contract publishes for a family (`0` when it publishes none). */
function publishedGeneration(grammars: Readonly<Record<string, number>>, family: string): number {
  const entry = Object.entries(grammars).find(([key]) => key === family);
  return entry === undefined ? 0 : entry[1];
}

/** `<tool>@<semver>` split at the last `@` (the tool and the schema package both
 *  contain none; the scope does). */
function splitAtVersion(value: string): { name: string; version: string } | null {
  const at = value.lastIndexOf("@");
  if (at <= 0) return null;
  const version = value.slice(at + 1);
  if (!SEMVER.test(version)) return null;
  return { name: value.slice(0, at), version };
}

/** The default published contract: this package's own generation. */
export const DOC_PROVENANCE_PUBLISHED: DocProvenanceContract = Object.freeze({
  formats: DOC_PROVENANCE_FORMATS,
  grammars: DOC_GRAMMAR_VERSIONS,
});

/**
 * The stamp's structural rules — everything a document must satisfy to be
 * *readable* at all, independent of which generations a given reader publishes.
 * A reader whose contract is older than the document must be able to parse it
 * and answer `format-newer-than-reader`; a published-set check here would turn
 * every newer document into an unreadable one (S6: typed refusal, not a dead
 * end).
 */
function structureErrors(value: unknown): DocProvenanceViolation[] {
  const errors: DocProvenanceViolation[] = [];
  const fail = (code: DocProvenanceRefusal, detail: string) => errors.push({ code, detail });

  if (!isRecord(value)) return [{ code: "not-an-object", detail: "the stamp is not an object" }];

  for (const key of Object.keys(value)) {
    if (key !== "contract" && !(DOC_PROVENANCE_FIELDS as readonly string[]).includes(key)) {
      fail("unknown-field", `unknown field ${key}`);
    }
  }
  if (value.contract !== DOC_PROVENANCE_CONTRACT_ID) {
    fail("wrong-contract", `contract must be ${DOC_PROVENANCE_CONTRACT_ID}`);
  }
  for (const field of DOC_PROVENANCE_FIELDS) {
    if (value[field] === undefined || value[field] === null) fail("missing-field", `${field} is required`);
  }

  if (value.written_by !== undefined && value.written_by !== null) {
    const split = typeof value.written_by === "string" ? splitAtVersion(value.written_by) : null;
    if (split === null) fail("malformed-version", "written_by must be <tool>@<semver>");
    else if (!(DOC_PROVENANCE_TOOLS as readonly string[]).includes(split.name)) {
      fail("unknown-tool", `unknown writer tool ${split.name}`);
    }
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
        const version = value.grammars[family];
        if (!/^[a-z][a-z0-9-]*$/u.test(family)) {
          fail("malformed-grammars", `${JSON.stringify(family)} is not a grammar family name`);
          continue;
        }
        if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
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
 * Structural validity plus "does this stamp speak a generation the contract
 * publishes". Carrier parity (`DOC_FORMAT_GRAMMARS`) is the verifier's job, not
 * this function's: the contract answers *well-formedness*, a reader answers
 * *dispatch*.
 */
export function validateDocProvenance(
  value: unknown,
  contract: Partial<DocProvenanceContract> = {},
): { valid: boolean; errors: DocProvenanceViolation[] } {
  const formats = contract.formats ?? DOC_PROVENANCE_FORMATS;
  const grammars = contract.grammars ?? DOC_GRAMMAR_VERSIONS;
  const errors = structureErrors(value);
  if (!isRecord(value)) return { valid: false, errors };
  const fail = (code: DocProvenanceRefusal, detail: string) => errors.push({ code, detail });

  if (value.format !== undefined && value.format !== null) {
    if (typeof value.format !== "string" || !formats.includes(value.format)) {
      fail("unpublished-format", `format ${JSON.stringify(value.format)} is not published`);
    }
  }

  if (isRecord(value.grammars)) {
    for (const [family, version] of Object.entries(value.grammars)) {
      if (typeof version !== "number" || !Number.isInteger(version) || version < 1) continue;
      if (!/^[a-z][a-z0-9-]*$/u.test(family)) continue;
      if (!(family in grammars)) {
        fail("unpublished-grammar-family", `unknown grammar family ${family}`);
        continue;
      }
      const published = publishedGeneration(grammars, family);
      if (version > published) {
        fail("unpublished-grammar-generation", `${family} generation ${version} is not published (max ${published})`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/** A parsed stamp's canonical fenced block (the carried text). Grammar keys are
 *  sorted, so two writers of the same stamp produce the same bytes. */
export function serializeDocProvenance(value: DocProvenance): string {
  const grammars = Object.keys(value.grammars)
    .sort()
    .reduce<Record<string, number>>((out, key) => {
      out[key] = value.grammars[key] as number;
      return out;
    }, {});
  return [
    STAMP_MARKER,
    `written_by: ${value.written_by}`,
    `schema: ${value.schema}`,
    `format: ${value.format}`,
    `grammars: ${JSON.stringify(grammars)}`,
  ].join("\n");
}

/** The fenced block bodies of a markdown document, in document order. */
function fencedBlocks(text: string): string[] {
  const blocks: string[] = [];
  let fence: string | null = null;
  let current: string[] = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    const run = /^(`{3,}|~{3,})/u.exec(trimmed);
    if (fence === null) {
      if (run) {
        fence = run[1][0];
        current = [];
      }
      continue;
    }
    if (run && trimmed[0] === fence && trimmed.replace(/[`~]/gu, "") === "") {
      blocks.push(current.join("\n"));
      fence = null;
      current = [];
      continue;
    }
    current.push(line);
  }
  return blocks;
}

/**
 * Parse the document's stamp block.
 *
 * Errors are strings (`<code>: <detail>`) because a parse failure is reported
 * to a human first; `validateDocProvenance` carries the structured form for a
 * machine consumer. An absent block is `{ value: null, errors: [] }` — absence
 * is a degradation, never an error (S5).
 */
export function parseDocProvenance(text: string): { value: DocProvenance | null; errors: string[] } {
  const block = fencedBlocks(text).find((body) => body.split("\n")[0]?.trim() === STAMP_MARKER);
  if (block === undefined) return { value: null, errors: [] };

  const errors: string[] = [];
  const lines = block.split("\n").slice(1).filter((line) => line.trim() !== "");
  const fields: Record<string, string> = {};
  for (const line of lines) {
    const match = /^([a-z_]+):[ \t]*(.*)$/u.exec(line.trim());
    if (match === null) {
      errors.push(`malformed-field: ${line.trim()}`);
      continue;
    }
    const [, key, value] = match;
    if (!(DOC_PROVENANCE_FIELDS as readonly string[]).includes(key)) {
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

  let grammars: unknown;
  try {
    grammars = JSON.parse(fields.grammars);
  } catch {
    return { value: null, errors: [`malformed-grammars: ${fields.grammars}`] };
  }

  const candidate = {
    contract: STAMP_MARKER,
    written_by: fields.written_by,
    schema: fields.schema,
    format: fields.format,
    grammars,
  };
  // A reader older than the document must still parse it (S6: the *dispatch*
  // answers newer-than-reader; a published-set gate here would make every newer
  // document unreadable instead of refused with a reason). The format token's
  // shape is structural: a token with no generation names no generation.
  if (formatFamilyOf(fields.format) === null || formatGenerationOf(fields.format) === null) {
    return { value: null, errors: [`unpublished-format: ${fields.format} is not a <family>@<generation> token`] };
  }
  const validation = { errors: structureErrors(candidate) };
  if (validation.errors.length > 0) {
    return { value: null, errors: validation.errors.map((e) => `${e.code}: ${e.detail}`) };
  }
  return { value: candidate as DocProvenance, errors: [] };
}

/** The published reader: this package's own generation, window at generation 1. */
export const CURRENT_READER: DocProvenanceReader = Object.freeze({
  format: "unit-doc@2",
  grammars: DOC_GRAMMAR_VERSIONS,
  readable_from: 0,
});

/**
 * Read one document's stamp as *this* reader.
 *
 * Precedence: a malformed stamp refuses (`stamp-invalid`), an absent one
 * degrades with the carrier-derived format, then the `format` axis decides
 * (newer refuses, older degrades inside the window and refuses outside it with
 * the migration note, an unknown family refuses), then the `grammars` axis
 * (newer refuses, older degrades, unknown refuses). A refusal always carries
 * its reason, never a silent pass.
 */
export function readDocProvenance(
  text: string,
  reader: DocProvenanceReader = CURRENT_READER,
): DocProvenanceReading {
  const { value, errors } = parseDocProvenance(text);
  if (errors.length > 0) {
    return { verdict: "refuse", reason: "stamp-invalid", stamp: null, note: errors.join("; ") };
  }
  if (value === null) {
    const headings = (text.match(/^## (.+)$/gmu) ?? []).map((line) => line.replace(/^## /u, "").trim());
    return { verdict: "degrade", reason: "absent-stamp", stamp: null, derived_format: deriveFormat(headings) };
  }

  const docFamily = formatFamilyOf(value.format);
  const docGeneration = formatGenerationOf(value.format) ?? 0;
  const readerFamily = formatFamilyOf(reader.format);
  const readerGeneration = formatGenerationOf(reader.format) ?? 0;

  if (docFamily === null || docFamily !== readerFamily) {
    return { verdict: "refuse", reason: "format-unknown-to-reader", stamp: value };
  }
  if (docGeneration > readerGeneration) {
    return { verdict: "refuse", reason: "format-newer-than-reader", stamp: value };
  }
  let verdict: DocProvenanceReaderVerdict = "current";
  let reason: DocProvenanceReaderReason = "stamp-current";
  let note: string | undefined;
  if (docGeneration < readerGeneration) {
    // The declared compatibility window is `(readable_from, own generation]`:
    // `readable_from` names the generation the reader is done with, so a
    // document at or below it is refused as too old (default 0 — nothing is
    // refused for age). A document inside the window degrades: it is readable,
    // and the reading says so.
    const floor = reader.readable_from ?? 0;
    if (docGeneration <= floor) {
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

  for (const [family, version] of Object.entries(value.grammars)) {
    const published = reader.grammars[family];
    if (published === undefined) {
      return { verdict: "refuse", reason: "grammar-unknown-to-reader", stamp: value };
    }
    if (version > published) {
      return { verdict: "refuse", reason: "grammar-newer-than-reader", stamp: value };
    }
    if (version < published && verdict === "current") {
      verdict = "degrade";
      reason = "grammar-older-compatible";
    }
  }
  return { verdict, reason, stamp: value };
}
