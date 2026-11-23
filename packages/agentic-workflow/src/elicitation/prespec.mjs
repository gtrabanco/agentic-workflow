/**
 * prespec.mjs — the `elicitation` file service (feature/526, docs/features/526-elicitation-layer).
 *
 * Layer 0 of the input path is a checklist before it is an interview. The bank
 * says which fields a request of a given shape must fill; filling runs first
 * against the request, the tree and the docs; what survives becomes either the
 * bank's declared cheap default (a dated assumption) or **one** question, in the
 * `open-questions@1` block the design step already reads.
 *
 * What must not be prose is the part that decides whether a row earned a
 * question, whether a value was evidenced, and whether the elicitor shared the
 * implementer's family — the three places a model's own preference can quietly
 * replace the owner's answer. So:
 *
 *   check — the bank's cells (two behaviour-changing answers, a default or a
 *           stated `none`, an ask condition, a source) and the artifact against
 *           that bank: every applicable row present, every provenance carried
 *           by the receipt it demands, at most one open question, and the
 *           families declared — `same-family: <why>` when they are equal.
 *
 * The question block's column set is not restated here: it is imported from the
 * crate's `needs-input` reader, which owns the `open-questions@1` grammar, so the
 * layer and the mechanism it feeds cannot drift apart. The route cell's grammar
 * is read through that same owner (`parseRoute`), never re-derived: the
 * pre-spec accepts exactly the cells the dispatcher accepts (#644 F2).
 *
 * Read-only, no clock, no network, no git: every value comes from the two files
 * the caller names, so two runs over the same bytes report the same findings.
 */

import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";

import { helpPointer } from "../runner/help.mjs";

import { LEDGER_COLUMNS, LEDGER_HEADER, ROUTES, SUBSTRATE_ROUTE, parseRoute } from "../runner/sensors/needs-input.mjs";

/** The published route cells as the linter states them — a bare stage, or the
 *  scaffolder route qualified with the class it claims. Derived from the
 *  reader's own sets, so the message cannot outlive the grammar. */
const ROUTE_CELL_SHAPES = ROUTES
  .map((entry) => (entry === SUBSTRATE_ROUTE ? `${entry}:<class>` : entry))
  .join(" | ");

/** The bank's cell contract, and the artifact's. */
export const BANK_CONTRACT_ID = "elicitation-checklist@1";
export const SPEC_CONTRACT_ID = "pre-spec@1";
/** The request families a pre-spec may declare; a bank row adds `any`. */
export const REQUEST_SHAPES = Object.freeze(["feature", "fix", "refactor", "docs", "dependency", "performance"]);
/** A bank row's own shape set: the families plus the row every family pays. */
export const BANK_SHAPES = Object.freeze([...REQUEST_SHAPES, "any"]);
/** Where a value came from, in the artifact's closed vocabulary. */
export const PROVENANCES = Object.freeze(["request", "repository", "answer", "assumption", "unknown"]);
/** The artifact's keyed fields, and the ones every pre-spec carries. */
export const REQUIRED_FIELDS = Object.freeze(["id", "request", "shape", "questions"]);
/** Checklist table cells, in order. */
export const ROW_CELLS = Object.freeze(["field", "value", "provenance", "receipt"]);

export class ElicitationRefusal extends Error {}

const cell = (line) => line.split("|").map((value) => value.trim());
/** The cells of one markdown table row, its outer pipes dropped. */
const rowCells = (line) => {
  const trimmed = line.replace(/^\s*\|/, "").replace(/\|\s*$/, "");
  return trimmed.split("|").map((value) => value.trim());
};
/** `answer → behaviour; answer → behaviour`: how many behaviour-changing answers a row names. */
const togglesCount = (value) =>
  (value ?? "").split(";").filter((part) => part.trim() !== "" && /\S+\s*→\s*\S+/.test(part)).length;
/** The value half of a `value — why` default. */
const defaultValueOf = (declared) => declared.split(" — ")[0].trim();
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** The fenced block whose first line is `marker`, with its inner lines. */
function fencedBlock(text, marker) {
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].trim().startsWith("```")) continue;
    const open = index;
    let close = index + 1;
    while (close < lines.length && !lines[close].trim().startsWith("```")) close += 1;
    if (close >= lines.length) return null;
    if ((lines[open + 1] ?? "").trim() === marker) return { start: open, end: close, lines: lines.slice(open + 2, close) };
    index = close;
  }
  return null;
}

/** The markdown table that follows `from`, or `null`. */
function tableAfter(text, from) {
  const lines = text.split("\n");
  let index = from;
  while (index < lines.length && !/^\s*\|/.test(lines[index])) index += 1;
  if (index >= lines.length) return null;
  const columns = rowCells(lines[index]);
  index += 1;
  if (index < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[index])) index += 1;
  const rows = [];
  while (index < lines.length && /^\s*\|/.test(lines[index])) {
    rows.push(rowCells(lines[index]));
    index += 1;
  }
  return { columns, rows };
}

/** The cell names a bank block declares, in declaration order. */
function declaredCells(block) {
  if (!block.lines.some((line) => /^cell\s*\|/i.test(line))) return [];
  const header = cell(block.lines.find((line) => /^cell\s*\|/i.test(line)));
  const position = header.indexOf("cell");
  if (position === -1) return [];
  return block.lines
    .filter((line) => line.trim() !== "" && !/^cell\s*\|/i.test(line))
    .map((line) => cell(line)[position] ?? "")
    .filter((value) => value !== "");
}

/**
 * The checklist bank: its declared cells and the table that carries the rows.
 * A missing block or table is reported by the check, never read as an empty bank.
 * @param {string} text
 */
export function readBank(text) {
  const block = fencedBlock(text, BANK_CONTRACT_ID);
  if (block === null) return { present: false, cells: [], columns: [], rows: [] };
  const table = tableAfter(text, block.end + 1);
  if (table === null) return { present: true, cells: declaredCells(block), columns: [], rows: [] };
  return {
    present: true,
    cells: declaredCells(block),
    columns: table.columns,
    rows: table.rows.map((values) => {
      const record = {};
      table.columns.forEach((column, position) => { record[column] = values[position] ?? ""; });
      return record;
    }),
  };
}

/**
 * The pre-spec: its keyed fields, its checklist rows and its question block.
 * @param {string} text
 */
export function readSpec(text) {
  const block = fencedBlock(text, SPEC_CONTRACT_ID);
  if (block === null) return { present: false, fields: {}, rows: [], questions: { present: false, header: [], rows: [] } };
  const fields = {};
  for (const line of block.lines) {
    const match = /^([a-z][a-z-]*):\s*(.*)$/.exec(line.trim());
    if (match) fields[match[1]] = match[2].trim();
  }
  const table = tableAfter(text, block.end + 1);
  const rows = table === null || table.columns.join("|") !== ROW_CELLS.join("|")
    ? []
    : table.rows.map((values) => ({
      field: values[0] ?? "",
      value: values[1] ?? "",
      provenance: values[2] ?? "",
      receipt: values[3] ?? "",
      cells: values.length,
    }));

  const questionsBlock = fencedBlock(text, LEDGER_HEADER);
  let questions = { present: false, header: [], rows: [] };
  if (questionsBlock !== null) {
    const header = questionsBlock.lines.length > 0 ? cell(questionsBlock.lines[0]).filter((value) => value !== "") : [];
    const entries = [];
    for (const line of questionsBlock.lines.slice(1)) {
      if (line.trim() === "") continue;
      const values = rowCells(line);
      // The `options` cell is the one column that may itself carry ` | `
      // (the published grammar joins its alternatives that way), so the middle
      // cells re-join into it exactly as the crate's `needs-input` reader does.
      const cells = values.length > header.length
        ? [...values.slice(0, header.length - 2), values.slice(header.length - 2, values.length - 1).join(" | "), values[values.length - 1]]
        : values;
      const record = {};
      header.forEach((column, position) => { record[column] = cells[position] ?? ""; });
      entries.push(record);
    }
    questions = { present: true, header, rows: entries };
  }
  return { present: true, fields, rows, questions, hasChecklistTable: table !== null };
}

/** The bank's own check: the cells a row must carry to be a row at all. */
export function checkBank(bankText) {
  const findings = [];
  const bank = readBank(bankText);
  if (!bank.present) findings.push({ code: "bank-block-missing", detail: `no ${BANK_CONTRACT_ID} block declares the bank's cells` });
  if (bank.present && bank.columns.length === 0) findings.push({ code: "bank-table-missing", detail: `no question table follows the ${BANK_CONTRACT_ID} block` });
  if (bank.present && bank.columns.length > 0 && bank.cells.join("|") !== bank.columns.join("|")) {
    findings.push({ code: "bank-header-drift", detail: `the table's header (${bank.columns.join(", ")}) does not equal the declared cells (${bank.cells.join(", ")})` });
  }

  const seen = new Set();
  for (const row of bank.rows) {
    const id = row.id ?? "";
    const label = id === "" ? `a row at position ${bank.rows.indexOf(row) + 1}` : id;
    if (!/^[A-Z]{3}-\d{2}$/.test(id)) findings.push({ code: "row-shape", detail: `${label} is not a <FAMILY>-<nn> id` });
    else if (seen.has(id)) findings.push({ code: "row-shape", detail: `duplicate row id ${id}` });
    seen.add(id);
    if (!BANK_SHAPES.includes(row.shape ?? "")) findings.push({ code: "row-shape-unknown", detail: `${label} declares shape "${row.shape ?? ""}", which is not one of ${BANK_SHAPES.join("/")}` });
    if ((row.field ?? "").trim() === "") findings.push({ code: "row-field-missing", detail: `${label} names no pre-spec field` });
    if ((row.asks ?? "").trim() === "") findings.push({ code: "row-asks-missing", detail: `${label} asks nothing` });
    if ((row["applies-when"] ?? "").trim() === "") findings.push({ code: "row-applies-when-missing", detail: `${label} states no condition that earns it` });
    if (togglesCount(row.toggles) < 2) {
      findings.push({ code: "row-toggles-single", detail: `${label} toggles ${togglesCount(row.toggles)} behaviour(s); a row earns its place only with two answers that change behaviour` });
    }
    if ((row.default ?? "").trim() === "") findings.push({ code: "row-default-missing", detail: `${label} states neither a default nor a stated \`none — <why>\`` });
    if ((row.source ?? "").trim() === "") findings.push({ code: "row-source-missing", detail: `${label} cites no source` });
  }
  const ordered = findings.slice().sort((left, right) => `${left.code}${left.detail}`.localeCompare(`${right.code}${right.detail}`));
  return { ok: ordered.length === 0, findings: ordered, rows: bank.rows.length };
}

/** A receipt the named provenance demands, or the reason it demands none. */
function receiptFinding({ row, provenance, bank }) {
  const receipt = (row.receipt ?? "").replace(/`/g, "").trim();
  const empty = receipt === "" || receipt === "—";
  if (provenance === "request") return null;
  if (provenance === "repository") {
    if (empty) return { code: "row-receipt-missing", detail: `${row.field}: a \`repository\` value needs its receipt — a \`path:line\`, or the rg/grep that found it` };
    const shaped = /^(?:rg|grep)\s/.test(receipt) || /^[A-Za-z0-9_.@+-]+(?:\/[A-Za-z0-9_.@+-]+)+(?::\d+)?/.test(receipt);
    if (!shaped) return { code: "row-receipt-missing", detail: `${row.field}: "${receipt}" is neither a \`path:line\` nor a grep` };
    return null;
  }
  if (provenance === "answer") {
    return /^Q\d+$/.test(receipt) ? null : { code: "row-receipt-missing", detail: `${row.field}: an \`answer\` value names the question it answers (a \`Q<n>\`)` };
  }
  if (provenance === "assumption") {
    const match = /^assumed (\d{4}-\d{2}-\d{2}) — (.+)$/.exec(receipt);
    if (match === null) return { code: "row-assumption-shape", detail: `${row.field}: an assumption is recorded as \`assumed <YYYY-MM-DD> — <value>\`` };
    const [, date, stated] = match;
    const calendar = ISO_DATE.exec(date);
    const real = calendar !== null && !Number.isNaN(new Date(`${date}T00:00:00Z`).getTime());
    if (!real) return { code: "row-assumption-shape", detail: `${row.field}: "${date}" is not a real date` };
    const declared = (bank.rows.find((entry) => entry.field === row.field)?.default ?? "").trim();
    if (stated.trim() !== declared.replace(/^assumed \d{4}-\d{2}-\d{2} — /, "").trim()) {
      return { code: "row-assumption-default-mismatch", detail: `${row.field}: the bank declares "${declared}", so the assumption is not this row's default` };
    }
    const expected = defaultValueOf(declared);
    if (row.value.trim() !== expected) {
      return { code: "row-assumption-default-mismatch", detail: `${row.field}: the value is "${expected}", not "${row.value.trim()}" — a default the bank did not declare is invented, not assumed` };
    }
    return null;
  }
  if (provenance === "unknown") {
    return /^Q\d+$/.test(receipt) ? null : { code: "row-unknown-without-question", detail: `${row.field}: an \`unknown\` value is a question — name the \`Q<n>\` it became` };
  }
  return null;
}

/**
 * The pre-spec against the bank that declares its checklist.
 * @param {{bankText: string, specText: string, specPath: string}} input
 * @returns {{ok: boolean, findings: {code: string, detail: string}[], rows: number, shape: string, asked: number, assumptions: string[], sameFamily: string|null}}
 */
export function checkSpec({ bankText, specText, specPath }) {
  const findings = [];
  const bank = readBank(bankText);
  const spec = readSpec(specText);
  if (!spec.present) {
    return { ok: false, findings: [{ code: "spec-block-missing", detail: `no ${SPEC_CONTRACT_ID} block declares the pre-spec's fields` }], rows: 0, shape: "", asked: 0, assumptions: [], sameFamily: null };
  }

  const fields = spec.fields;
  for (const field of REQUIRED_FIELDS) {
    if ((fields[field] ?? "").trim() === "") findings.push({ code: "spec-field-missing", detail: `the pre-spec declares no \`${field}\`` });
  }
  const stem = basename(specPath ?? "", ".md");
  if ((fields.id ?? "") !== "" && fields.id !== stem) {
    findings.push({ code: "spec-id-mismatch", detail: `id "${fields.id}" is not the file's own name "${stem}"` });
  }
  const shape = (fields.shape ?? "").trim();
  if (shape !== "" && !REQUEST_SHAPES.includes(shape)) {
    findings.push({ code: "spec-shape-unknown", detail: `shape "${shape}" is not one of ${REQUEST_SHAPES.join("/")}` });
  }

  const questionRows = spec.questions.rows;
  const openRows = questionRows.filter((row) => (row.type ?? "").trim() === "open-question");
  const inBlock = new Set(questionRows.map((row) => (row.id ?? "").trim()).filter((id) => id !== ""));

  if (spec.questions.present && spec.questions.header.join("|") !== LEDGER_COLUMNS.join("|")) {
    findings.push({ code: "questions-header-drift", detail: `the question block's columns (${spec.questions.header.join(", ")}) are not the published ${LEDGER_HEADER} columns (${LEDGER_COLUMNS.join(", ")})` });
  }
  if (openRows.length > 1) {
    findings.push({ code: "questions-multiple-open", detail: `${openRows.length} open questions in one pre-spec — ask one at a time, and let the others wait for their decision rows` });
  }
  for (const row of questionRows) {
    const type = (row.type ?? "").trim();
    if (type !== "open-question" && type !== "decision") {
      findings.push({ code: "questions-type-unknown", detail: `question row "${row.id ?? "?"}" is a "${type}", not open-question/decision` });
      continue;
    }
    const route = (row.route ?? "").trim();
    if (route !== "" && !parseRoute(route).ok) {
      findings.push({ code: "questions-route-unknown", detail: `question row "${row.id ?? "?"}" routes to "${route}", which is not one of ${ROUTE_CELL_SHAPES}` });
    }
  }

  // `questions:` is the artifact's own claim about whether the request earned one.
  const declared = (fields.questions ?? "").trim();
  const noneMatch = /^none(?:\s*—\s*(.+))?$/.exec(declared);
  const listed = noneMatch === null ? declared.split(",").map((entry) => entry.trim()).filter((entry) => entry !== "") : [];
  if (declared === "") {
    // already reported as a missing field
  } else if (noneMatch !== null) {
    if ((noneMatch[1] ?? "").trim() === "") findings.push({ code: "questions-none-without-why", detail: "`questions: none` needs its why — an unexplained none is a silent assumption" });
    if (openRows.length > 0) findings.push({ code: "questions-none-contradicts-row", detail: `\`questions: none\` beside ${openRows.length} open question row(s)` });
  } else if (listed.length === 0 || listed.some((id) => !/^Q\d+$/.test(id))) {
    findings.push({ code: "questions-shape", detail: `\`questions: ${declared}\` is neither \`none — <why>\` nor a list of \`Q<n>\` ids` });
  }
  for (const id of listed) {
    if (!inBlock.has(id)) findings.push({ code: "questions-listed-missing", detail: `\`questions:\` lists ${id}, which the block does not carry` });
  }

  // The checklist: one row per applicable bank row, and nothing the bank does not declare.
  const applicable = bank.rows.filter((row) => row.shape === shape || row.shape === "any");
  const declaredFields = new Set(bank.rows.map((row) => row.field));
  const byField = new Map();
  for (const row of spec.rows) {
    if (row.cells !== ROW_CELLS.length) {
      findings.push({ code: "spec-row-shape", detail: `${row.field || "a row"} carries ${row.cells} cell(s); a checklist row is \`field | value | provenance | receipt\`` });
      continue;
    }
    if (!declaredFields.has(row.field)) {
      findings.push({ code: "spec-row-extra", detail: `"${row.field}" is not a field the bank declares` });
      continue;
    }
    if (byField.has(row.field)) findings.push({ code: "spec-row-extra", detail: `"${row.field}" appears more than once — one row per field` });
    byField.set(row.field, row);
  }
  for (const row of applicable) {
    if (!byField.has(row.field)) {
      findings.push({ code: "spec-row-missing", detail: `the ${row.id} row "${row.field}" applies to a ${shape} request and the pre-spec omits it` });
    }
  }

  const assumptions = [];
  for (const row of spec.rows) {
    if (row.cells !== ROW_CELLS.length || !declaredFields.has(row.field)) continue;
    const provenance = (row.provenance ?? "").trim();
    if (!PROVENANCES.includes(provenance)) {
      findings.push({ code: "row-provenance-missing", detail: `${row.field}: "${provenance}" is not one of ${PROVENANCES.join("/")}` });
      continue;
    }
    if (provenance === "assumption") assumptions.push(row.field);
    const finding = receiptFinding({ row, provenance, bank });
    if (finding !== null) findings.push(finding);
    if (provenance === "unknown" && /^Q\d+$/.test((row.receipt ?? "").trim())) {
      if (!listed.includes(row.receipt.trim()) || !inBlock.has(row.receipt.trim())) {
        findings.push({ code: "row-question-missing", detail: `${row.field} names ${row.receipt.trim()}, which \`questions:\` and the block do not carry together` });
      }
    }
  }

  // Cross-family elicitation: equal families are a declared degradation, never a silence.
  const elicitor = (fields.elicitor ?? "").trim();
  const implementer = (fields.implementer ?? "").trim();
  const asked = openRows.length;
  const declaredSameFamily = (fields["same-family"] ?? "").trim();
  const sameFamily = declaredSameFamily === "" ? null : declaredSameFamily;
  if (asked > 0) {
    if (elicitor === "") findings.push({ code: "family-missing", detail: "a pre-spec that asks a question declares its `elicitor` family" });
    if (implementer === "") findings.push({ code: "family-missing", detail: "a pre-spec that asks a question declares its `implementer` family" });
    if (elicitor !== "" && implementer !== "" && elicitor.toLowerCase() === implementer.toLowerCase() && sameFamily === null) {
      findings.push({ code: "family-same-without-reason", detail: `the elicitor and the implementer are both "${elicitor}" — a cross-family elicitor is what the evidence supports, so a one-family run declares \`same-family: <why>\`` });
    }
  }

  const ordered = findings.slice().sort((left, right) => `${left.code}${left.detail}`.localeCompare(`${right.code}${right.detail}`));
  return { ok: ordered.length === 0, findings: ordered, rows: spec.rows.length, shape, asked, assumptions, sameFamily };
}

/**
 * Both halves in one call: the bank's cells, then the artifact against it.
 * @param {{bankText?: string, specText?: string, specPath?: string}} input
 */
export function checkPair({ bankText, specText, specPath } = {}) {
  if (typeof bankText !== "string" || typeof specText !== "string") {
    throw new ElicitationRefusal("both the bank and the pre-spec are required");
  }
  const bank = checkBank(bankText);
  const spec = checkSpec({ bankText, specText, specPath: specPath ?? "" });
  const findings = [...bank.findings, ...spec.findings].sort((left, right) => `${left.code}${left.detail}`.localeCompare(`${right.code}${right.detail}`));
  return { ok: findings.length === 0, findings, rows: spec.rows, shape: spec.shape, asked: spec.asked, assumptions: spec.assumptions, sameFamily: spec.sameFamily, bankRows: bank.rows };
}

// ── CLI ───────────────────────────────────────────────────────────────────

const USAGE = "usage: elicitation check --bank <path> --spec <path> [--json]";
/** The flags each operation takes. An operation-foreign flag is refused (exit 2). */
const OPERATION_FLAGS = Object.freeze({ check: ["bank", "spec"] });

const parseFlags = (args) => {
  const flags = { json: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") { flags.json = true; continue; }
    if (arg === "--bank" || arg === "--spec") {
      const value = args[index + 1];
      if (value === undefined) throw new ElicitationRefusal(`${arg} requires a value`);
      flags[arg.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new ElicitationRefusal(`unknown argument "${arg}" — ${USAGE}`);
  }
  return flags;
};

const readText = (file, what) => {
  try {
    return readFileSync(resolve(file), "utf8");
  } catch (error) {
    throw new ElicitationRefusal(`${what} is present but unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * The `elicitation` subcommand.
 * @param {string[]} args
 * @returns {number} the exit code
 */
export function run(args) {
  try {
    const [operation, ...rest] = args;
    const flags = parseFlags(rest);
    const allowed = OPERATION_FLAGS[operation];
    if (allowed === undefined) throw new ElicitationRefusal(`unknown operation "${operation ?? ""}" — ${USAGE}`);
    for (const flag of Object.keys(flags)) {
      if (flag === "json" || allowed.includes(flag)) continue;
      throw new ElicitationRefusal(`unknown argument "--${flag}" for \`elicitation ${operation}\` — ${USAGE}`);
    }
    if (flags.bank === undefined) throw new ElicitationRefusal(`no --bank given — ${USAGE}`);
    if (flags.spec === undefined) throw new ElicitationRefusal(`no --spec given — ${USAGE}`);
    const bankText = readText(flags.bank, "the bank");
    const specText = readText(flags.spec, "the pre-spec");
    const result = checkPair({ bankText, specText, specPath: flags.spec });

    if (flags.json) {
      process.stdout.write(`${JSON.stringify({ ok: result.ok, operation, bank: flags.bank, spec: flags.spec, ...result }, null, 2)}\n`);
      return result.ok ? 0 : 1;
    }
    if (result.ok) {
      process.stdout.write(`ELICITATION CHECK PASS — ${flags.spec} · ${result.rows} row(s) · ${result.asked} question(s) · ${result.shape}\n`);
      if (result.sameFamily !== null) process.stdout.write(`- same-family: ${result.sameFamily}\n`);
      for (const field of result.assumptions) process.stdout.write(`- assumed: ${field}\n`);
      return 0;
    }
    process.stdout.write(`ELICITATION CHECK BLOCKED — ${result.findings.length} finding(s)\n`);
    for (const finding of result.findings) process.stdout.write(`- ${finding.code}: ${finding.detail}\n`);
    return 1;
  } catch (error) {
    if (!(error instanceof ElicitationRefusal)) throw error;
    process.stderr.write(`EDIT REFUSAL — ${error.message}\n`);
    process.stderr.write(`${helpPointer("elicitation")}\n`);
    return 2;
  }
}
