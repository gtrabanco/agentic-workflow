/**
 * findings-carrier.mjs — the one owner of the findings carrier's grammars
 * (issue #702 S4/S9).
 *
 * A unit carries its findings in exactly one of two shapes, and each shape has
 * exactly one header:
 *
 *   findings-table@1    `| id | S# / file:line | axis | severity | impact | class | route |`
 *                       the current carrier — a migrated unit doc's `## Findings`
 *   findings-table@0    the same, before issue #361 added the mandatory `impact`
 *                       cell — readable history, never written
 *   findings-ledger@1   `| id | file:line | axis | severity | class | route | folded |`
 *                       a legacy unit's `review-findings.md` side ledger, read-only
 *
 * **A reader maps cells by the table's own header, never by position.** That is
 * the whole defect this module removes: `impact = class, class = route,
 * route = folded` is what a positional read of the ledger grammar under a
 * migrated heading answers, silently.
 *
 * **One grammar in force.** A carrier parsed in the other shape, a carrier in a
 * grammar nobody publishes, two carriers at once, or a row whose width disagrees
 * with its header is a typed defect (`carrierDefect`), never a silent dual
 * support. The write path refuses every grammar but `findings-table@1`: rewriting
 * a row into a shape it was not written in shifts every cell after the difference.
 *
 * Dependency-free apart from the shared fence-aware section reader, which is what
 * makes `## Findings` bounds (and a heading quoted inside a fence) one rule.
 */

import { sectionText } from "./unit-doc-phases.mjs";

/** The published grammars, each named by the carrier shape it declares. */
export const FINDINGS_GRAMMARS = Object.freeze({
  "findings-table@1": Object.freeze(["id", "S# / file:line", "axis", "severity", "impact", "class", "route"]),
  "findings-table@0": Object.freeze(["id", "S# / file:line", "axis", "severity", "class", "route"]),
  "findings-ledger@1": Object.freeze(["id", "file:line", "axis", "severity", "class", "route", "folded"]),
});

/** The grammar a write may produce, and the one a migrated unit must carry. */
export const CURRENT_FINDINGS_GRAMMAR = "findings-table@1";

/** The legacy side ledger's grammar. */
export const LEDGER_FINDINGS_GRAMMAR = "findings-ledger@1";

/** The superseded doc grammar: readable, never written. */
export const SUPERSEDED_FINDINGS_GRAMMAR = "findings-table@0";

/** Header cell → the row field that cell names. `class` is the cell, `klass` the
 *  parser alias the router already reads. */
const FIELD_OF_HEADER = Object.freeze({
  id: "id",
  "s# / file:line": "target",
  "file:line": "target",
  axis: "axis",
  severity: "severity",
  impact: "impact",
  class: "class",
  route: "route",
  folded: "folded",
});

/** The separator between a header and its rows, in every dash spelling. */
const SEPARATOR = /^\s*\|[-: |]+\|?\s*$/u;

/** A cell's comparable form: emphasis and backticks dropped, space folded. */
function headerCell(cell) {
  return String(cell ?? "").replace(/[`*_]/gu, "").replace(/\s+/gu, " ").trim().toLowerCase();
}

/**
 * Split one table line into its cells between the outer pipes. A pipe escaped
 * with an odd number of backslashes (`\|`) is content, never a boundary — the
 * markdown cell rule this repository's own tables rely on.
 */
export function rowCells(line) {
  const parts = [];
  let current = "";
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "|") {
      let backslashes = 0;
      for (let back = index - 1; back >= 0 && line[back] === "\\"; back -= 1) backslashes += 1;
      if (backslashes % 2 === 0) {
        parts.push(current);
        current = "";
        continue;
      }
    }
    current += char;
  }
  parts.push(current);
  return parts.slice(1, -1).map((cell) => cell.trim());
}

/** The grammar a header row declares, or `null` when no carrier publishes it. */
export function grammarOf(cells) {
  const normalized = cells.map(headerCell);
  for (const [grammar, header] of Object.entries(FINDINGS_GRAMMARS)) {
    const declared = header.map(headerCell);
    if (declared.length === normalized.length && declared.every((cell, index) => cell === normalized[index])) return grammar;
  }
  return null;
}

/** The `## Findings` section body, or `null` when the doc carries no such section. */
export function findingsSectionBody(docText) {
  const body = sectionText(String(docText ?? ""), "Findings");
  return body === null ? null : body.replace(/^\n+/u, "").replace(/\s+$/u, "");
}

/**
 * Locate the carrier table inside a section body (or a whole ledger text).
 *
 * The block is the header line and the contiguous separator + row lines under
 * it; prose above and below it belongs to the carrier and is never part of it.
 *
 * @returns {{ grammar: string|null, headerIndex: number, endIndex: number, header: string[], rows: Array<{cells: string[], index: number}> } | null}
 */
export function tableBlockOf(body) {
  const lines = String(body ?? "").split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.trimStart().startsWith("|") || SEPARATOR.test(line)) continue;
    const cells = rowCells(line);
    const grammar = grammarOf(cells);
    if (grammar === null) continue;
    let endIndex = index + 1;
    if (endIndex < lines.length && SEPARATOR.test(lines[endIndex])) endIndex += 1;
    const rows = [];
    while (endIndex < lines.length && lines[endIndex].trimStart().startsWith("|") && !SEPARATOR.test(lines[endIndex])) {
      rows.push({ cells: rowCells(lines[endIndex]), index: endIndex });
      endIndex += 1;
    }
    return { grammar, headerIndex: index, endIndex, header: cells, rows };
  }
  return null;
}

/** One row's fields, mapped by the header that declares them. */
function rowOf(grammar, header, cells) {
  const fields = header.map((cell) => FIELD_OF_HEADER[headerCell(cell)] ?? null);
  const row = {};
  fields.forEach((field, index) => {
    if (field !== null) row[field] = cells[index] ?? "";
  });
  // The two doc grammars carry no `folded` cell: a row in the table is open by
  // construction (a folded row leaves for a `## Log` line).
  if (row.folded === undefined) row.folded = grammar === LEDGER_FINDINGS_GRAMMAR ? "" : "no";
  return row;
}

/**
 * Parse a carrier body: its grammar, its rows and every defect the shape carries.
 *
 * A row whose width disagrees with its header is a defect, not a row — the cell
 * after the difference would answer a different question.
 *
 * @returns {{ grammar: string|null, rows: Array<object>, defects: Array<{code: string, detail: string, grammar?: string, expected?: string, line?: number}> }}
 */
export function parseCarrierBody(body) {
  const block = tableBlockOf(body);
  if (block === null) {
    return { grammar: null, rows: [], defects: [{ code: "carrier-table-missing", detail: "the carrier section has no findings table" }] };
  }
  const defects = [];
  if (block.grammar === null) {
    defects.push({ code: "unknown-grammar", detail: `no carrier publishes the header '${block.header.join(" | ")}'` });
  }
  const width = block.header.length;
  const rows = [];
  for (const row of block.rows) {
    if (row.cells.length !== width) {
      defects.push({ code: "row-width", detail: `row has ${row.cells.length} cells, its header declares ${width}`, line: row.index + 1 });
      continue;
    }
    rows.push(rowOf(block.grammar, block.header, row.cells));
  }
  return { grammar: block.grammar, rows, defects };
}

/** The defect a grammar carries when it is not the one this carrier must hold. */
export function grammarDefect(grammar, expected) {
  if (grammar === null) return { code: "unknown-grammar", detail: "the table's header names no published grammar" };
  if (grammar === expected) return null;
  if (expected === CURRENT_FINDINGS_GRAMMAR && grammar === SUPERSEDED_FINDINGS_GRAMMAR) {
    return { code: "superseded-grammar", grammar, expected, detail: `${grammar} predates the mandatory impact cell; a write would shift every cell after it` };
  }
  return { code: "wrong-carrier-grammar", grammar, expected, detail: `the carrier holds ${grammar}, this one must hold ${expected}` };
}

/**
 * Resolve a unit's carrier from its two possible carriers.
 *
 * @returns {{ carrier: "doc"|"legacy"|"none"|"dual", grammar: string|null, rows: Array<object>, defects: Array<object> }}
 */
export function readCarrier({ docText = null, ledgerText = null, docPath = "SPEC.md", ledgerPath = "review-findings.md" } = {}) {
  const body = docText === null ? null : findingsSectionBody(docText);
  const hasDoc = body !== null;
  const hasLedger = ledgerText !== null;
  if (hasDoc && hasLedger) {
    return {
      carrier: "dual",
      grammar: null,
      rows: [],
      defects: [{ code: "dual-carrier", detail: `two findings carriers exist (${docPath} and ${ledgerPath}); one carrier is in force, and no reader can say which` }],
    };
  }
  if (hasDoc) {
    const parsed = parseCarrierBody(body);
    const defect = grammarDefect(parsed.grammar, CURRENT_FINDINGS_GRAMMAR);
    return { carrier: "doc", grammar: parsed.grammar, rows: parsed.rows, defects: [...parsed.defects, ...(defect ? [defect] : [])] };
  }
  if (hasLedger) {
    const parsed = parseCarrierBody(ledgerText);
    const defect = grammarDefect(parsed.grammar, LEDGER_FINDINGS_GRAMMAR);
    return { carrier: "legacy", grammar: parsed.grammar, rows: parsed.rows, defects: [...parsed.defects, ...(defect ? [defect] : [])] };
  }
  return { carrier: "none", grammar: null, rows: [], defects: [] };
}

/** The rendered `findings-table@1` table for the given rows. */
export function renderFindingsTable(rows) {
  const header = FINDINGS_GRAMMARS[CURRENT_FINDINGS_GRAMMAR];
  const head = `| ${header.join(" | ")} |\n|${"---|".repeat(header.length)}`;
  const body = rows.map((row) => `| ${[row.id, row.target, row.axis, row.severity, row.impact, row.class, row.route].join(" | ")} |`).join("\n");
  return rows.length ? `${head}\n${body}` : head;
}

/**
 * Replace only the carrier table inside a section body with the given rows,
 * keeping every other byte — the prose above it, the prose below it, and the
 * blank lines that separate them.
 *
 * Returns `{ ok: false, defect }` when the body carries no table to splice: a
 * writer that invents a table over prose owns prose nobody asked it to own.
 */
export function spliceFindingsTable(body, rows) {
  const block = tableBlockOf(body);
  if (block === null) {
    return { ok: false, defect: { code: "carrier-table-missing", detail: "the carrier section has no findings table to splice" } };
  }
  const lines = String(body).split("\n");
  const before = lines.slice(0, block.headerIndex);
  const after = lines.slice(block.endIndex);
  const rendered = renderFindingsTable(rows).split("\n");
  return { ok: true, body: [...before, ...rendered, ...after].join("\n") };
}
