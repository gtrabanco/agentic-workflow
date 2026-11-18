#!/usr/bin/env node
/**
 * ledger.mjs — the telemetry sample's two destinations and the `tier-cost@N`
 * grammar they share (issue #504, re-homed by issue #624).
 *
 * The grammar used to live in `scripts/tier-cost.mjs` (the reader) and the two
 * appends in `packages/pi-agentic-workflow/src/telemetry-sinks.ts` (the producer).
 * The universal CLI needs the same two appends for a manual reconstruction
 * (#624), and a crate may not import `scripts/`, so the pair moved here: one
 * reader, one writer, three consumers — this module's appends, the Pi sinks that
 * delegate to it, and the root script that re-exports its reader.
 *
 * Three rules, each a test in the sibling suites:
 *
 *  - **The ledger owns the column list; the sample owns the values.** The sink
 *    writes the columns the file declares, in that order, refusing a column the
 *    published sample fields do not carry or a sample that cannot fill one.
 *  - **One `O_APPEND` per row, nothing rewritten.** Two sessions append from
 *    separate processes and the kernel places each line atomically: no lock, no
 *    queue, no lost row. The samples table must be the file's last section, or a
 *    row appended after trailing prose would land outside it.
 *  - **The idempotency guard compares a whole row.** A repeated emission is
 *    dropped, a different sample never is. The session identity that keeps two
 *    sessions apart lives in the sample's `source`, not in a key invented here.
 */

import fs from "node:fs";
import path from "node:path";

import { TELEMETRY_SAMPLE_FIELDS } from "@gtrabanco/agentic-workflow-schema";

import { tableCells } from "../writer/merges.mjs";

/** The earlier grammar: still read, and still what a project on it writes. */
export const TIER_COST_LEGACY_CONTRACT_ID = "tier-cost@1";

/** The contract id this module publishes (#504 S4, unchanged by #624). */
export const TIER_COST_CONTRACT_ID = "tier-cost@2";

/** Every grammar this reader accepts, oldest first. */
export const TIER_COST_CONTRACT_IDS = Object.freeze([TIER_COST_LEGACY_CONTRACT_ID, TIER_COST_CONTRACT_ID]);

/** The ledger's only carrier. */
export const LEDGER_PATH = "docs/workflow/TIER_COST.md";

/**
 * The `tier-cost@1` row, in order. `changed_paths` is a fact — the size tier is
 * derived from it, never stored — and `source` is the producer's own provenance
 * string, so a row can always be traced to the command that wrote it.
 */
export const LEGACY_COLUMNS = Object.freeze([
  "unit", "changed_paths", "tokens", "turns", "model_ms", "tool_ms", "observed", "source",
]);

/**
 * The current row, in order: the `@1` eight widened by the work's identity
 * (`phase`, `version`, `model`) and the provider's five token fields. `tokens`
 * stays the provider's own total; the five break it down so a cost regression
 * can be attributed to what actually grew.
 */
export const COLUMNS = Object.freeze([
  "unit", "phase", "version", "model", "changed_paths", "tokens", "turns",
  "input_tokens", "output_tokens", "cache_read_tokens", "cache_write_tokens", "reasoning_tokens",
  "model_ms", "tool_ms", "observed", "source",
]);

/** Each grammar's published column list — the one authority the parse reads. */
export const COLUMNS_BY_CONTRACT = Object.freeze({
  [TIER_COST_LEGACY_CONTRACT_ID]: LEGACY_COLUMNS,
  [TIER_COST_CONTRACT_ID]: COLUMNS,
});

/** The columns whose cell is a count: a non-negative integer, never a float. */
export const INTEGER_COLUMNS = Object.freeze([
  "changed_paths", "tokens", "turns",
  "input_tokens", "output_tokens", "cache_read_tokens", "cache_write_tokens", "reasoning_tokens",
  "model_ms", "tool_ms",
]);

/** The columns a sample may leave unnamed; the row carries the literal `null`. */
export const NULLABLE_COLUMNS = Object.freeze(["phase", "version", "model"]);

/** The trimmed cells of one markdown table row — the writer's own splitter,
 * shared with the merge library so a row means the same thing to both. */
const cellsOf = tableCells;

/** A line that declares a grammar: the contract id alone, fenced or not. */
const CONTRACT_LINE = /^tier-cost@(\d+)$/;

/**
 * The fenced block that declares the grammar, as `{ contract, columns, rest }`.
 *
 * One grammar per ledger: the file says which grammar its table is written in,
 * so a `@1` table is never read as a `@2` one. Two blocks in one file is the
 * ambiguity this refuses — a table whose header disagrees with the block is
 * caught one step later, by the header check.
 */
function declaredBlock(text) {
  const lines = String(text).split("\n");
  const markers = lines
    .map((line, index) => ({ index, marker: CONTRACT_LINE.test(line.trim()) ? line.trim() : null }))
    .filter((entry) => entry.marker !== null);
  if (markers.length === 0) return { error: "missing-contract", detail: `no ${TIER_COST_CONTRACT_ID} block` };
  if (markers.length > 1) {
    return { error: "ambiguous-grammar", detail: `two grammar blocks: ${markers.map((entry) => entry.marker).join(", ")}` };
  }
  const { index: open, marker: contract } = markers[0];
  if (!TIER_COST_CONTRACT_IDS.includes(contract)) {
    return { error: "unknown-grammar", detail: `${contract}, expected one of ${TIER_COST_CONTRACT_IDS.join(", ")}` };
  }
  const close = lines.findIndex((line, index) => index > open && line.trim().startsWith("```"));
  const end = close === -1 ? lines.length : close;
  const declarations = [];
  for (const line of lines.slice(open + 1, end)) {
    if (line.trim() === "" || line.trim().startsWith("column |")) continue;
    const [column] = cellsOf(line);
    if (column) declarations.push(column);
  }
  return { contract, columns: declarations, rest: lines.slice(end + 1) };
}

/**
 * Read the ledger text: the grammar block first, then the first table whose
 * header is exactly the declared columns. A header carrying a column the grammar
 * does not publish is refused, and so is a row whose cell count drifted — the
 * grammar is the header, so a widened table would silently stop being read.
 */
export function parseLedger(text) {
  const declared = declaredBlock(text);
  if (declared.error !== undefined) return declared;

  const published = COLUMNS_BY_CONTRACT[declared.contract];
  const extra = declared.columns.filter((column) => !published.includes(column));
  if (extra.length > 0) return { error: "undeclared-column", contract: declared.contract, detail: extra.join(", ") };
  if (declared.columns.length !== published.length || published.some((column, index) => declared.columns[index] !== column)) {
    return { error: "column-set", contract: declared.contract, detail: `expected ${published.join(", ")}` };
  }

  const lines = declared.rest;
  const headerAt = lines.findIndex((line) => cellsOf(line).length > 1 && line.includes("|"));
  if (headerAt === -1) return { error: "missing-table", contract: declared.contract, detail: `no sample table after the ${declared.contract} block` };

  const rows = [];
  for (const line of lines.slice(headerAt + 2)) {
    if (!line.trim().startsWith("|")) break;
    const cells = cellsOf(line);
    if (cells.length !== published.length) {
      return { error: "row-shape", contract: declared.contract, detail: `${cells.length} cells, expected ${published.length}: ${line.trim()}` };
    }
    const record = Object.fromEntries(published.map((column, index) => [column, cells[index]]));
    for (const numeric of INTEGER_COLUMNS.filter((column) => published.includes(column))) {
      if (!/^\d+$/.test(record[numeric])) return { error: "row-shape", contract: declared.contract, detail: `${record.unit}: ${numeric} is not a non-negative integer` };
      record[numeric] = Number(record[numeric]);
    }
    for (const nullable of NULLABLE_COLUMNS.filter((column) => published.includes(column))) {
      if (record[nullable] === "null") record[nullable] = null;
    }
    rows.push(record);
  }
  return { contract: declared.contract, columns: [...published], rows };
}

/** One sample's fields in the published order — the JSONL line's own contract. */
export function orderedSample(sample) {
  const values = sample;
  const ordered = {};
  for (const field of TELEMETRY_SAMPLE_FIELDS) ordered[field] = values[field];
  return ordered;
}

/**
 * Validate one ledger append and return the function that performs it — the
 * plan half of "plan every append, then apply it".
 *
 * It throws — rather than writing something plausible — when the ledger carries
 * no grammar block, when the sample and the declared columns disagree, when the
 * table's header is not the declared set, or when the table is not the file's
 * last section. Every refusal this append can raise is therefore raised before
 * the caller has written a byte to any destination, which is what makes a
 * refusal write nothing (issue #624's correction of `telemetry reconstruct
 * write`). The plan reads the ledger once, so it is applied without delay —
 * not held across other writes.
 *
 * A row the table already carries plans to a no-op: the duplicate guard is part
 * of the plan, never a mid-apply surprise.
 */
export function prepareLedgerAppend({ ledgerPath, sample }) {
  const text = fs.readFileSync(ledgerPath, "utf8");
  const lines = text.split("\n");

  const marker = /^tier-cost@\d+$/;
  const markerAt = lines.findIndex((line) => marker.test(line.trim()));
  if (markerAt === -1) throw new Error(`${ledgerPath} carries no tier-cost@N block`);

  const fenceEnd = lines.findIndex((line, index) => index > markerAt && line.trim().startsWith("```"));
  if (fenceEnd === -1) throw new Error(`${ledgerPath}: the ${marker} block is not closed`);

  const declared = [];
  for (const line of lines.slice(markerAt + 1, fenceEnd)) {
    if (line.trim() === "" || line.trim().startsWith("column |")) continue;
    const [column] = cellsOf(line);
    if (column) declared.push(column);
  }

  const values = sample;
  // The ledger owns the column list; the sample owns the values. A declared
  // column that is not a published sample field is a grammar the sample cannot
  // satisfy, and one the sample cannot fill is a producer defect: both are
  // refusals, never a row written blind.
  const unpublished = declared.filter((column) => !TELEMETRY_SAMPLE_FIELDS.includes(column));
  if (unpublished.length > 0) throw new Error(`${ledgerPath} declares columns no sample carries: ${unpublished.join(", ")}`);
  const missing = declared.filter((column) => !(column in values));
  if (missing.length > 0) throw new Error(`the sample carries no value for: ${missing.join(", ")}`);

  const headerAt = lines.findIndex((line, index) => index > fenceEnd && line.trim().startsWith("|"));
  if (headerAt === -1) throw new Error(`${ledgerPath}: no sample table after the ${marker} block`);
  if (cellsOf(lines[headerAt]).join("|") !== declared.join("|")) {
    throw new Error(`${ledgerPath}: the sample table's header is not the declared columns`);
  }

  // An append is only safe where the table ends the file: a row written after
  // trailing prose would sit outside it, and the reader would stop before it.
  if (!text.endsWith("\n")) throw new Error(`${ledgerPath}: the ledger must end with a newline before a row can be appended`);
  const tail = text.slice(0, -1).split("\n").at(-1) ?? "";
  if (!tail.trim().startsWith("|")) {
    throw new Error(`${ledgerPath}: the samples table must be the ledger's last section, found ${JSON.stringify(tail)}`);
  }

  // One row per sample: the guard compares the whole row, because the row is
  // what a sample is. Keying it on a few cells (unit, source, day) would
  // swallow a second session of the same unit — the exact case the ledger
  // exists to record — while an identical row is a re-emission, not a sample.
  for (const line of lines.slice(headerAt + 2)) {
    if (!line.trim().startsWith("|")) break;
    const cells = cellsOf(line);
    if (declared.every((column, at) => (cells[at] ?? "") === String(values[column]))) return () => {};
  }

  const row = `| ${declared.map((column) => String(values[column])).join(" | ")} |\n`;
  return () => fs.appendFileSync(ledgerPath, row);
}

/**
 * Append one sample to the project's ledger, in the order the ledger declares:
 * plan the append (every refusal above), then apply it. The caller catches a
 * sink failure so one broken destination never costs the others their sample.
 */
export function appendLedgerSample(options) {
  prepareLedgerAppend(options)();
}

/**
 * Append one sample to the per-session JSONL store — the sample itself, in the
 * published field order, with no wrapper and no prose (#504 S3, S9).
 *
 * It refuses a sample that cannot fill every published field, rather than writing
 * a line a consumer would have to special-case: the fields are the contract, and
 * a missing one is a producer defect, not an absent value. The directory is
 * created on demand, so a project needs no `.pi` before its first session; two
 * sessions appending from separate processes each take their own `O_APPEND`,
 * which the kernel places atomically.
 *
 * No duplicate guard: a sample is emitted once per session by construction
 * (`flush()` emits once), so a repeated line would be a repeated sample, not a
 * re-emission to swallow. A caller that merges (the #624 reconstruction) keys on
 * `source` before it appends.
 */
export function appendJsonlSample({ path: file, sample }) {
  const values = sample;
  const missing = TELEMETRY_SAMPLE_FIELDS.filter((field) => !(field in values));
  if (missing.length > 0) throw new Error(`the sample carries no value for: ${missing.join(", ")}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(file, `${JSON.stringify(orderedSample(sample))}\n`);
}
