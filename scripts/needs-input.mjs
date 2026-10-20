#!/usr/bin/env node
/**
 * needs-input.mjs — the deterministic needs-input dispatcher.
 *
 * One writer/verifier split: the unit folder's `decisions.md` owns the ledger
 * (the append-only `open-questions@1` grammar the template agent guide
 * publishes), and this script only *reads* it. Given a unit folder it prints
 * the open questions that block the next step, each with the evidence behind
 * it — the search receipt, the researched options, the route back to the stage
 * that owns the fact — plus the typed continuation. It never asks, never
 * infers, and never writes.
 *
 * Usage
 *   node scripts/needs-input.mjs <unit-dir> [--json]
 *
 * stdout: the fixed `open-questions@1` block (grammar owned by
 * `skills/orchestration-envelope/references/TURN_CONTRACT.md`), or — when the
 * artifact is missing or malformed — the `NEEDS-INPUT FAIL` block naming the
 * reason and where it was found.
 * exit: 0 only for a well-formed artifact (pending questions or none);
 *       1 fail-closed on a missing/malformed artifact; 2 usage error.
 *
 * The continuation is the schema's existing `no-decision-available`
 * (`packages/agentic-workflow-schema/src/continuation.ts`), emitted when
 * `decisionAvailable === false` — which is exactly what an open question is —
 * so this script needs no schema change and no envelope field.
 *
 * Fail-closed reason codes: `missing-unit-doc`, `malformed-ledger-header`,
 * `malformed-entry`, `missing-search-receipt`, `missing-options`,
 * `unknown-route`, `unknown-question`, `invalid-authority`, `duplicate-id`.
 *
 * Read-only, dependency-free, and fence-aware: a fenced example inside
 * `decisions.md` is quoted text, never an entry.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/** Contract identifier for the printed block. */
export const BLOCK_ID = "open-questions@1";
/** The envelope's stop code an open question carries. */
export const CONTINUATION = "no-decision-available";
/** The column that carries the pending question's options, split on ` | `. */
export const OPTIONS_SEPARATOR = /\s+\|\s+/;
/** Fewest cells any entry may split into: `id, date, type, question, blocks, options, route`. */
export const MIN_CELLS = 7;
/** Joiner for cells that re-join into the `options` column. */
const OPTIONS_JOIN = " | ";
/** The ledger header line, verbatim. */
export const LEDGER_HEADER = "open-questions@1";
/** Column header the ledger carries under its contract id. */
export const LEDGER_COLUMNS = [
  "id", "date", "type", "question", "blocks", "search-receipt", "options", "route",
];
/** The stages that own a fact and may therefore receive it back. */
export const ROUTES = Object.freeze(["design", "unit-lane"]);
/** The only authority that may close an open question. */
export const AUTHORITY = "human-owner";
/** Ledger paths this script reads, in order, relative to the unit folder. */
const UNIT_DOC = "SPEC.md";
const LEDGER = "decisions.md";
/** Longest cell echoed before truncation; keeps a pasted block readable. */
export const CELL_MAX = 400;

const FENCE_OPEN = /^(`{3,}|~{3,})/;
const FENCE_CLOSE = /^(`{3,}|~{3,})$/;

/**
 * Split a ledger row into its cells on unescaped `|` only.
 *
 * A backslash before a pipe yields a literal pipe (a regex, a table cell)
 * with the escape removed; a backslash before any other character passes
 * through verbatim, so a receipt quoting `\d+` or `\s` never shifts its
 * columns. A trailing lone backslash is reported instead of silently
 * swallowed, so a malformed row never shifts its columns unnoticed.
 *
 * @param {string} line
 * @returns {{ cells: string[], escapeLost: boolean }}
 */
export function splitRow(line) {
  const cells = [];
  let cell = "";
  let escapeLost = false;
  let escaping = false;
  for (const char of line) {
    if (escaping) {
      if (char === "|") {
        cell += char; // `\|` → literal pipe, escape removed
      } else {
        cell += `\\${char}`; // any other escape passes through verbatim
      }
      escaping = false;
      continue;
    }
    if (char === "\\") {
      escaping = true;
      continue;
    }
    if (char === "|") {
      cells.push(cell.trim());
      cell = "";
      continue;
    }
    cell += char;
  }
  if (escaping) escapeLost = true;
  cells.push(cell.trim());
  return { cells, escapeLost };
}

/**
 * Parse `decisions.md` into typed entries, ignoring fenced examples.
 *
 * @param {string} text
 * @returns {{ ok: true, entries: Array<Record<string, unknown>> }
 *          | { ok: false, reason: string, where: string }}
 */
export function parseLedger(text) {
  let fence = null;
  let seenHeader = false;
  let seenColumns = false;
  let lineNo = 0;
  const entries = [];

  for (const raw of text.split("\n")) {
    lineNo += 1;
    const trimmed = raw.trim();
    const where = `${LEDGER}:${lineNo}`;

    if (fence) {
      const match = FENCE_CLOSE.exec(trimmed);
      if (match && match[1][0] === fence.char && match[1].length >= fence.length) fence = null;
      continue;
    }
    const opened = FENCE_OPEN.exec(trimmed);
    if (opened) {
      fence = { char: opened[1][0], length: opened[1].length };
      continue;
    }
    if (trimmed === "") continue;

    if (!seenHeader) {
      if (trimmed !== LEDGER_HEADER) return { ok: false, reason: "malformed-ledger-header", where: `${LEDGER}:1` };
      seenHeader = true;
      continue;
    }
    if (!seenColumns) {
      const { cells } = splitRow(trimmed);
      const normalized = cells.map((cell) => cell.toLowerCase().replace(/[\s-]+/g, "-"));
      if (normalized.join("|") !== LEDGER_COLUMNS.join("|")) {
        return { ok: false, reason: "malformed-ledger-header", where };
      }
      seenColumns = true;
      continue;
    }

    const { cells, escapeLost } = splitRow(trimmed);
    if (escapeLost) return { ok: false, reason: "malformed-entry", where };
    const type = cells[2];
    if (type === "decision") {
      // A `decision` row reads the shared columns per type — the layout the
      // template agent guide publishes: `question` carries the id it closes,
      // `blocks` the authority, `search-receipt` where the human's answer is
      // recorded, `options` what was chosen, and everything from `route` on
      // what was discarded (a stray separator cannot lose the tail).
      if (cells.length < 8) return { ok: false, reason: "malformed-entry", where };
      const entry = {
        id: cells[0],
        date: cells[1],
        type,
        question: cells[3],
        blocks: cells[4],
        searchReceipt: cells[5],
        options: "",
        route: "",
        closes: cells[3],
        authority: cells[4],
        receipt: cells[5],
        chosen: cells[6],
        discarded: cells.slice(7).join(OPTIONS_JOIN),
      };
      const row = classifyRow(entry, where);
      if (!row.ok) return row;
      entries.push(row.entry);
      continue;
    }
    if (cells.length < MIN_CELLS) {
      return { ok: false, reason: "malformed-entry", where };
    }
    // An `open-question` keeps its search receipt at index 5. Only `options`
    // may span several separators, so a row that splits wider re-joins them
    // there instead of losing an option; cell content keeps its escaped pipes.
    const tailIndex = cells.length - 1;
    const entry = {
      id: cells[0],
      date: cells[1],
      type,
      question: cells[3],
      blocks: cells[4],
      searchReceipt: cells[5],
      options: cells.slice(6, tailIndex).join(OPTIONS_JOIN),
      route: cells[tailIndex],
    };
    const row = classifyRow(entry, where);
    if (!row.ok) return row;
    entries.push(row.entry);
  }

  if (!seenHeader) return { ok: false, reason: "malformed-ledger-header", where: `${LEDGER}:1` };
  if (!seenColumns) return { ok: false, reason: "malformed-ledger-header", where: `${LEDGER}:2` };
  return { ok: true, entries };
}

/** Validate one row against the closed vocabulary; a defect fails closed. */
function classifyRow(entry, where) {
  if (entry.id === "") return { ok: false, reason: "malformed-entry", where };
  if (entry.type === "open-question") {
    if (entry.question === "") return { ok: false, reason: "malformed-entry", where };
    const receipt = entry.searchReceipt;
    if (receipt === "" || /^none$/i.test(receipt)) {
      return { ok: false, reason: "missing-search-receipt", where };
    }
    const options = entry.options === "" || /^none$/i.test(entry.options)
      ? []
      : entry.options.split(OPTIONS_SEPARATOR).map((option) => option.trim()).filter((option) => option !== "");
    if (options.length === 0) return { ok: false, reason: "missing-options", where };
    if (!ROUTES.includes(entry.route)) return { ok: false, reason: "unknown-route", where };
    return { ok: true, entry: { ...entry, type: "open-question", options } };
  }
  if (entry.type === "decision") {
    if (entry.authority !== AUTHORITY) return { ok: false, reason: "invalid-authority", where };
    if (entry.receipt === "" || /^none$/i.test(entry.receipt)) {
      return { ok: false, reason: "missing-search-receipt", where };
    }
    if (entry.closes === "" || entry.chosen === "" || entry.discarded === "") {
      return { ok: false, reason: "malformed-entry", where };
    }
    return { ok: true, entry: { ...entry, type: "decision" } };
  }
  return { ok: false, reason: "malformed-entry", where };
}

/**
 * Fold the ledger into the pending set: only a `decision` closes an
 * `open-question`, and a later `open-question` row re-opens the loop.
 *
 * @param {Array<Record<string, unknown>>} entries
 * @returns {{ ok: true, pending: Array<Record<string, unknown>> }
 *          | { ok: false, reason: string, where: string }}
 */
export function resolvePending(entries) {
  const declared = new Set();
  for (const entry of entries) {
    if (declared.has(entry.id)) return { ok: false, reason: "duplicate-id", where: `${LEDGER} entry ${entry.id}` };
    declared.add(entry.id);
  }
  const questions = new Set();
  for (const entry of entries) {
    if (entry.type !== "open-question") continue;
    questions.add(entry.id);
  }
  const closed = new Set();
  for (const entry of entries) {
    if (entry.type !== "decision") continue;
    const target = entry.closes;
    if (!questions.has(target)) return { ok: false, reason: "unknown-question", where: `${LEDGER} entry ${entry.id}` };
    closed.add(target);
  }
  const pending = entries.filter((entry) => entry.type === "open-question" && !closed.has(entry.id));
  return { ok: true, pending };
}

/** Truncate one cell to `CELL_MAX` characters, marking the cut. */
function cell(value) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length <= CELL_MAX ? text : `${text.slice(0, CELL_MAX - 1)}…`;
}

/**
 * Compute the machine result for a unit folder. Pure apart from two file
 * reads; the renderer below never re-derives a value from this one.
 *
 * @param {string} unitDir
 */
export function compute(unitDir) {
  const dir = path.resolve(unitDir);
  const unit = path.basename(dir);
  const specPath = path.join(dir, UNIT_DOC);
  if (!fs.existsSync(specPath) || !fs.statSync(specPath).isFile()) {
    return { ok: false, unit, reason: "missing-unit-doc", where: specPath };
  }
  const ledgerPath = path.join(dir, LEDGER);
  let pending = [];
  if (fs.existsSync(ledgerPath)) {
    const parsed = parseLedger(fs.readFileSync(ledgerPath, "utf8"));
    if (!parsed.ok) return { ok: false, unit, reason: parsed.reason, where: parsed.where };
    const resolved = resolvePending(parsed.entries);
    if (!resolved.ok) return { ok: false, unit, reason: resolved.reason, where: resolved.where };
    pending = resolved.pending;
  }
  return {
    ok: true,
    block: BLOCK_ID,
    unit,
    open_questions: pending.map((entry) => ({
      id: entry.id,
      date: entry.date,
      question: entry.question,
      blocks: entry.blocks,
      search_receipt: entry.searchReceipt,
      options: entry.options,
      route: entry.route,
    })),
    routes: [...new Set(pending.map((entry) => entry.route))],
    continuation: pending.length === 0 ? "none" : CONTINUATION,
    decision: pending.length === 0 ? "none" : "open",
  };
}

/** Render the fixed `open-questions@1` block. */
export function render(result) {
  const lines = [
    result.block,
    `Unit: ${result.unit}`,
    `Open questions: ${result.open_questions.length}`,
  ];
  for (const question of result.open_questions) {
    lines.push(
      `- ${cell(question.id)} · ${cell(question.route)} · ${cell(question.question)}`,
      `  Blocks: ${cell(question.blocks)}`,
      `  Searched: ${cell(question.search_receipt)}`,
      "  Options:",
      ...question.options.map((option) => `    - ${cell(option)}`),
    );
  }
  if (result.open_questions.length === 0) lines.push("Pending: none");
  lines.push(
    `Route back: ${result.routes.length === 0 ? "none" : result.routes.join(" · ")}`,
    `Continuation: ${result.continuation}`,
    `Decision: ${result.decision}`,
  );
  return `${lines.join("\n")}\n`;
}

/** Render the fail-closed block; the reason and where are the whole answer. */
export function renderFailure(result) {
  return [
    "NEEDS-INPUT FAIL — needs-input@1",
    `Unit: ${result.unit}`,
    `Reason: ${result.reason}`,
    `Where: ${result.where}`,
    `Continuation: ${CONTINUATION}`,
  ].join("\n") + "\n";
}

const USAGE = "usage: needs-input.mjs <unit-dir> [--json]\n";

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes("--json");
  const unknown = args.find((arg) => arg.startsWith("-") && arg !== "--json");
  if (unknown !== undefined) {
    process.stderr.write(`needs-input: unknown option: ${unknown}\n${USAGE}`);
    return 2;
  }
  const positional = args.filter((arg) => arg !== "--json");
  if (positional.length === 0) {
    process.stderr.write(`needs-input: missing <unit-dir>\n${USAGE}`);
    return 2;
  }
  if (positional.length > 1) {
    process.stderr.write(`needs-input: expected one <unit-dir>, got ${positional.length}\n${USAGE}`);
    return 2;
  }

  const result = compute(positional[0]);
  if (result.ok) {
    process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : render(result));
    return 0;
  }
  if (json) {
    process.stdout.write(`${JSON.stringify({ ...result, block: "needs-input@1", continuation: CONTINUATION }, null, 2)}\n`);
  } else {
    process.stdout.write(renderFailure(result));
  }
  return 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) process.exitCode = main(process.argv);
