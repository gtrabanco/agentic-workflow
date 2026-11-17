#!/usr/bin/env node
/**
 * tier-cost.mjs — the measured acceptance for the risk tiers (issue #383,
 * `360b` of #360's `D360-1`; S9 of #360).
 *
 * The classifier says which tier a unit is. This module answers the other half:
 * what that tier cost. One row per unit sample — tokens, turns, model and tool
 * milliseconds, the ceremony steps the unit recorded versus the four it owes —
 * grouped by the risk tier the unit recorded and by the size tier derived from
 * its changed paths.
 *
 * Two rules shape every line below:
 *
 *  - **The tier is re-resolved, never copied.** A row's `tier` cell is checked
 *    against the unit's own carrier (its unit doc's recorded tier, or the
 *    passive carrier) and a disagreement is refused. The size tier is derived at
 *    read time by `sizeTierOf()`, so the size rules keep one home.
 *  - **No duration spans a session.** A session's timestamps measure absence —
 *    a human away for days, a command waiting on a network — not work. Time
 *    enters only as `model_ms` and `tool_ms`, measured at turn boundaries by the
 *    producer that saw the turns.
 *
 * Exit contract: 0 success, 1 usage or parse error, 2 ceremonial block (the
 * comparison refuses to run below three units per recorded tier). JSON on
 * stdout, always.
 */

import fs from "node:fs";
import path from "node:path";
import { recordedTier } from "../packages/agentic-workflow/src/runner/ceremony/tier.mjs";
import { RISK_TIER_KINDS, sizeTierOf } from "../packages/agentic-workflow/src/runner/risk-tiers.mjs";

/** The earlier grammar: still read, and still what a project on it writes. */
export const TIER_COST_LEGACY_CONTRACT_ID = "tier-cost@1";

/**
 * The contract id this module publishes (#504 S4).
 *
 * A grammar is versioned, never widened in place: `@2` adds `phase`, `version`,
 * `model` and the five provider token fields to the `@1` eight, and a reader
 * that knows only `@1` refuses an `@2` header instead of misreading its cells.
 * The writer follows whichever block the ledger declares, so the two coexist.
 */
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
const INTEGER_COLUMNS = Object.freeze([
  "changed_paths", "tokens", "turns",
  "input_tokens", "output_tokens", "cache_read_tokens", "cache_write_tokens", "reasoning_tokens",
  "model_ms", "tool_ms",
]);

/** The columns a sample may leave unnamed; the row carries the literal `null`. */
const NULLABLE_COLUMNS = Object.freeze(["phase", "version", "model"]);

/**
 * The four ceremony steps a tier owes, as `skills/execute-phase/references/risk-tiers.md`
 * declares them: a passive unit opens no unit folder, runs no phases, keeps no
 * evidence table and takes no review pass.
 */
export const CEREMONY_STEPS = Object.freeze(["unit-doc", "phases", "evidence-table", "review"]);

/** A comparison needs this many units before it may report anything. */
export const MIN_UNITS_PER_TIER = 3;

/** The cell splitter a markdown table row uses. */
const CELL_SPLIT = /(?<!\\)\|/;

/** The trimmed cells of one markdown table row, cells only. */
function cellsOf(line) {
  const body = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return body.split(CELL_SPLIT).map((cell) => cell.trim());
}

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

/** The project root a ledger path belongs to (`<root>/docs/workflow/TIER_COST.md`). */
export function rootOfLedger(ledgerPath) {
  const resolved = path.resolve(ledgerPath);
  if (path.basename(resolved) !== path.basename(LEDGER_PATH)) return null;
  const docs = path.dirname(path.dirname(resolved));
  if (path.basename(docs) !== "docs") return null;
  return path.dirname(docs);
}

/** The four delivered steps of a passive carrier's declared fields, or `null`. */
function passiveTier(root, unit) {
  const carrier = path.join(root, "docs/passive", `${unit}.md`);
  if (!fs.existsSync(carrier)) return null;
  const match = /^tier\s*\|\s*([a-z]+)\s*\|/m.exec(fs.readFileSync(carrier, "utf8"));
  return match && RISK_TIER_KINDS.includes(match[1]) ? match[1] : null;
}

/** The unit doc text of a unit, or `null` when the unit has none. */
function unitDocOf(root, unit) {
  for (const family of ["fix", "features"]) {
    const spec = path.join(root, "docs", family, unit, "SPEC.md");
    if (fs.existsSync(spec)) return fs.readFileSync(spec, "utf8");
  }
  return null;
}

/**
 * The tier a unit recorded for itself: the passive carrier's verdict, or the
 * tier its unit doc recorded in its `## Log`/`## Risk tier` evidence. `null`
 * when the unit exists in neither carrier — a tier is never inferred from the
 * row it is about to validate.
 */
export function resolveTier(root, unit) {
  const passive = passiveTier(root, unit);
  if (passive !== null) return passive;
  const doc = unitDocOf(root, unit);
  return doc === null ? null : recordedTier(doc);
}

/** The ceremony a unit recorded, against the four steps its tier owes. */
export function ceremonyOf(root, unit) {
  if (passiveTier(root, unit) !== null) return { recorded: 0, skipped: CEREMONY_STEPS.length };
  const doc = unitDocOf(root, unit);
  if (doc === null) return { recorded: 0, skipped: CEREMONY_STEPS.length };

  const section = (title) => {
    const at = doc.indexOf(`\n## ${title}`);
    if (at === -1) return "";
    const rest = doc.slice(at + 1);
    const end = rest.indexOf("\n## ", 4);
    return end === -1 ? rest : rest.slice(0, end);
  };
  const delivered = [
    true,
    /^- P\d+ —/m.test(section("Tasks")),
    /^- \*\*E\d+\*\*/m.test(section("Log")),
    /^- \*\*R\d+\*\*/m.test(section("Log")),
  ].filter(Boolean).length;
  return { recorded: delivered, skipped: CEREMONY_STEPS.length - delivered };
}

/**
 * Read a ledger for the project at `root`: parse, then re-resolve every row's
 * tier and ceremony against that unit's own carrier. A row whose tier disagrees
 * with its carrier is refused rather than repaired — a repaired row would hide
 * the drift the re-resolution exists to catch.
 */
export function readLedger(root, text) {
  const parsed = parseLedger(text);
  if (parsed.error !== undefined) return parsed;

  const rows = [];
  for (const row of parsed.rows) {
    const recorded = resolveTier(root, row.unit);
    if (recorded === null) return { error: "unknown-unit", detail: `${row.unit}: no unit doc and no passive carrier` };
    const ceremony = ceremonyOf(root, row.unit);
    // The tier and the ceremony are repository facts, resolved here: a stored copy
    // could only drift from the carrier it is supposed to report.
    rows.push({ ...row, tier: recorded, ceremony_recorded: ceremony.recorded, ceremony_skipped: ceremony.skipped });
  }
  return { contract: parsed.contract, columns: parsed.columns, rows };
}

/** The median of a numeric list, averaged across the middle pair when even. */
function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[middle] : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

/** One group's summary — counts and medians, never a synthesised total. */
function summarise(rows) {
  return {
    units: rows.length,
    tokens_sum: rows.reduce((sum, row) => sum + row.tokens, 0),
    tokens_median: median(rows.map((row) => row.tokens)),
    turns_sum: rows.reduce((sum, row) => sum + row.turns, 0),
    ceremony_skipped_sum: rows.reduce((sum, row) => sum + (row.ceremony_skipped ?? 0), 0),
  };
}

/**
 * Group the samples by both published tiers: the risk tier the unit recorded and
 * the size tier derived from its `changed_paths` by `sizeTierOf()`. Each group
 * reports counts, sums and medians; the shape deliberately has no single figure,
 * because one number would be the claim S5 forbids.
 */
export function aggregate(rows) {
  const risk = Object.fromEntries(RISK_TIER_KINDS.map((tier) => [tier, summarise(rows.filter((row) => row.tier === tier))]));
  const size = { prose: [], small: [], large: [] };
  for (const row of rows) {
    const { size_tier } = sizeTierOf({ tier: row.tier, paths_changed: row.changed_paths });
    size[size_tier].push(row);
  }
  return {
    rows: rows.length,
    by_risk_tier: risk,
    by_size_tier: Object.fromEntries(Object.entries(size).map(([tier, group]) => [tier, summarise(group)])),
  };
}

/**
 * Compare the samples by recorded tier. Below `MIN_UNITS_PER_TIER` units on any
 * tier that has samples, the honest answer is `insufficient-corpus` and the
 * counts it saw — never a number invented from one or two units.
 */
export function compare(rows, { min = MIN_UNITS_PER_TIER } = {}) {
  const grouped = aggregate(rows);
  // No samples at all is the smallest corpus there is, so it names every tier
  // rather than passing as a clean bill; below the bound on a tier that has
  // samples, that tier is the one named.
  const short = rows.length === 0
    ? RISK_TIER_KINDS.map((tier) => ({ tier, units: 0 }))
    : RISK_TIER_KINDS.filter((tier) => grouped.by_risk_tier[tier].units > 0 && grouped.by_risk_tier[tier].units < min)
        .map((tier) => ({ tier, units: grouped.by_risk_tier[tier].units }));
  return {
    contract: TIER_COST_CONTRACT_ID,
    verdict: short.length === 0 ? "ok" : "insufficient-corpus",
    min_units_per_tier: min,
    short_tiers: short,
    by_risk_tier: grouped.by_risk_tier,
    by_size_tier: grouped.by_size_tier,
  };
}

/** Print a JSON answer and exit with its own code. */
function out(payload, code = 0) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = code;
}

/** The CLI: `<read|aggregate|compare> --ledger <path>`, one closed flag set. */
function main(argv) {
  const [command, ...rest] = argv;
  const allowed = new Set(["ledger"]);
  const flags = {};

  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith("--")) return out({ error: "unexpected-argument", argument: arg }, 1);
    const name = arg.slice(2);
    if (!allowed.has(name)) return out({ error: "unknown-flag", flag: `--${name}`, allowed: [...allowed].map((f) => `--${f}`) }, 1);
    const value = rest[index + 1];
    if (value === undefined || value.startsWith("--")) return out({ error: "missing-flag-value", flag: `--${name}` }, 1);
    flags[name] = value;
    index += 1;
  }

  if (!["read", "aggregate", "compare"].includes(command)) {
    return out({ error: "unknown-command", command: command ?? null, allowed: ["read", "aggregate", "compare"] }, 1);
  }
  if (flags.ledger === undefined) return out({ error: "missing-flag", flag: "--ledger" }, 1);

  const root = rootOfLedger(flags.ledger);
  if (root === null) return out({ error: "ledger-outside-docs", path: flags.ledger, expected: `<root>/${LEDGER_PATH}` }, 1);

  const read = readLedger(root, fs.readFileSync(flags.ledger, "utf8"));
  if (read.error !== undefined) return out({ contract: TIER_COST_CONTRACT_ID, ...read }, 1);

  const rows = read.rows;
  if (command === "read") return out({ contract: read.contract, columns: read.columns, rows });
  if (command === "aggregate") return out({ contract: read.contract, ...aggregate(rows) });

  const comparison = { ...compare(rows), contract: read.contract };
  return out(comparison, comparison.verdict === "ok" ? 0 : 2);
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
