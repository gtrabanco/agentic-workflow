/**
 * interview.mjs — the `charter` file service (unit 556, feature/556-engineering-interview).
 *
 * `init-workspace` asks its engineering interview in prose, because the answers
 * are a conversation. What must not be prose is the part that decides *where an
 * answer lands* and *whether a question earned its place*:
 *
 *   state — what the guide already declares, so the interview asks only once;
 *   land  — write an answer into a placeholder, keep a team convention untouched,
 *           and record a recommendation as a dated assumption when the project
 *           said nothing;
 *   check — the bank's own check: every question cites its bibliography source,
 *           states the two behaviours its answers toggle, states the condition
 *           that earns it, and lands in a slot the guide actually carries.
 *
 * The section reader is not duplicated here: `charterSectionOf` is the crate's
 * one owner of "where `## Project charter` starts and ends", so this service and
 * the ceremony-profile router agree byte for byte about what the section is.
 *
 * Read-only except `land`, which writes one file and refuses before any byte
 * moves. No clock, no network, no git: `land` takes the date from its payload, so
 * two runs over the same bytes produce the same bytes.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { charterSectionOf } from "../runner/ceremony-profile.mjs";

/** The bank's cell contract, and the table's marker. */
export const BANK_CONTRACT_ID = "interview-bank@1";
/** The section every answer lands in. */
export const CHARTER_HEADING = "Project charter";
/** The slot the materialization step reads its enforcement answer from. */
export const BOUNDARY_SLOT = "Architectural boundaries";
/** The closed layer set the bank's rows may declare. */
export const LAYERS = Object.freeze(["objectives", "technical"]);

/** `- **Key:** value` — the one slot shape the guide carries. */
const SLOT_LINE = /^- \*\*([^*]+):\*\*\s*(.*)$/;
/** A cell whose entire content is a `<…>` placeholder, code span or not. */
const PLACEHOLDER = /^`?<[^>]+>`?$/;
/** `YYYY-MM-DD`, and the calendar check that makes the date a real one. */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A refusal the caller reports as `EDIT REFUSAL — <message>` (exit 2). */
export class CharterRefusal extends Error {}

const cell = (line) => line.split("|").map((value) => value.trim());

/** A `<…>` token: an unfilled slot is documented as one, or as a list of them. */
const ANGLE_TOKEN = /<[^>]+>/;

/**
 * True when a value is still an unfilled slot: empty, one `<…>` placeholder, or
 * a ` · `-separated list whose every entry still carries an unfilled `<…>`. A
 * documented shape is not an answer — the interview must still ask for it.
 */
const isPlaceholder = (value) => {
  if (value === "") return true;
  if (PLACEHOLDER.test(value)) return true;
  const entries = value.replace(/`/g, "").split(" · ");
  return entries.length > 1 && entries.every((entry) => ANGLE_TOKEN.test(entry));
};

/**
 * Every keyed slot inside the guide's `## Project charter` section.
 * @param {string} guideText
 * @returns {{key: string, value: string, state: "filled"|"placeholder"}[]}
 */
export function readSlots(guideText) {
  const section = charterSectionOf(guideText);
  const slots = [];
  for (const line of section.split("\n")) {
    const match = SLOT_LINE.exec(line);
    if (!match) continue;
    const value = match[2].trim();
    slots.push({ key: match[1].trim(), value, state: isPlaceholder(value) ? "placeholder" : "filled" });
  }
  return slots;
}

/**
 * The slot report the interview reads before asking anything: every slot with
 * the state it is in.
 * @param {string} guideText
 * @returns {{key: string, value: string, state: "filled"|"placeholder"}[]}
 */
export function stateReport(guideText) {
  return readSlots(guideText);
}

/**
 * The bank: the `interview-bank@1` block's declared cells, and the table that
 * follows it. A missing block or table is reported by the caller's check, never
 * silently read as an empty bank.
 * @param {string} text
 */
export function readBank(text) {
  const lines = text.split("\n");
  let cells = null;
  let blockEnd = -1;
  for (let index = 0; index < lines.length; index += 1) {
    if (!lines[index].trim().startsWith("```")) continue;
    const marker = (lines[index + 1] ?? "").trim();
    let close = index + 2;
    while (close < lines.length && !lines[close].trim().startsWith("```")) close += 1;
    if (close >= lines.length) break;
    if (marker !== BANK_CONTRACT_ID) {
      index = close;
      continue;
    }
    const header = cell(lines[index + 2] ?? "");
    const position = header.indexOf("cell");
    cells = lines.slice(index + 3, close)
      .filter((line) => line.trim() !== "")
      .map((line) => cell(line)[position] ?? "")
      .filter((value) => value !== "");
    blockEnd = close;
    break;
  }
  const columns = [];
  const rows = [];
  if (blockEnd !== -1) {
    let index = blockEnd + 1;
    while (index < lines.length && !/^\s*\|/.test(lines[index])) index += 1;
    if (index < lines.length) {
      columns.push(...cell(lines[index].replace(/^\s*\|/, "").replace(/\|\s*$/, "")));
      index += 1;
      // The separator row (`|---|`) is markup, never a question.
      if (index < lines.length && /^\s*\|\s*[-: ]+\|/.test(lines[index])) index += 1;
      while (index < lines.length && /^\s*\|/.test(lines[index])) {
        const values = cell(lines[index].replace(/^\s*\|/, "").replace(/\|\s*$/, ""));
        rows.push(values);
        index += 1;
      }
    }
  }
  const records = rows.map((values) => {
    const record = {};
    columns.forEach((column, position) => { record[column] = values[position] ?? ""; });
    return record;
  });
  return { present: cells !== null, cells: cells ?? [], columns, rows: records };
}

/** Two behaviour clauses, each `answer → behaviour`. */
const togglesCount = (value) =>
  value.split(";").filter((part) => part.trim() !== "" && /\S+\s*→\s*\S+/.test(part)).length;

/** The legal enforcement shapes, in one place. */
const ENFORCEMENT_SHAPES = [
  /^machine:\s*[^`\s][^`]*$/,
  /^prose-only$/,
];

/**
 * Findings for the `Architectural boundaries` slot's value: one entry per
 * declared boundary, either `machine: <mechanism>` or `prose-only`.
 * @param {string} value
 */
export function boundaryFindings(value) {
  if (isPlaceholder(value)) return [];
  const findings = [];
  for (const entry of value.replace(/`/g, "").split(" · ")) {
    const trimmed = entry.trim();
    if (trimmed === "") {
      findings.push({ code: "boundary-entry-shape", detail: "an empty boundary entry" });
      continue;
    }
    const parts = trimmed.split(" → ");
    if (parts.length !== 2 || parts[0].trim() === "") {
      findings.push({ code: "boundary-entry-shape", detail: `"${trimmed}" names no enforcement: write <boundary> → machine: <mechanism> or <boundary> → prose-only` });
      continue;
    }
    const enforcement = parts[1].trim();
    if (!ENFORCEMENT_SHAPES.some((shape) => shape.test(enforcement))) {
      findings.push({ code: "boundary-entry-shape", detail: `"${trimmed}" is neither \`machine: <mechanism>\` nor \`prose-only\`` });
    }
  }
  return findings;
}

/**
 * The bank's own check.
 * @param {{guideText: string, bankText: string}} input
 * @returns {{ok: boolean, findings: {code: string, detail: string}[], rows: number, slots: number}}
 */
export function checkBank({ guideText, bankText }) {
  const findings = [];
  const bank = readBank(bankText);
  if (!bank.present) findings.push({ code: "bank-block-missing", detail: `no ${BANK_CONTRACT_ID} block declares the bank's cells` });
  if (bank.columns.length === 0) findings.push({ code: "bank-table-missing", detail: `no question table follows the ${BANK_CONTRACT_ID} block` });

  if (bank.present && bank.columns.length > 0 && (bank.cells.length === 0 || bank.cells.join("|") !== bank.columns.join("|"))) {
    findings.push({ code: "bank-header-drift", detail: `the table's header (${bank.columns.join(", ")}) does not equal the declared cells (${bank.cells.join(", ")})` });
  }

  const slots = readSlots(guideText);
  const slotKeys = new Set(slots.map((slot) => slot.key));
  const ids = new Set();
  for (const row of bank.rows) {
    const id = row.id ?? "";
    const label = id === "" ? `a row at line ${bank.rows.indexOf(row) + 1}` : id;
    if (!/^[A-Z]{3}-\d{2}$/.test(id)) findings.push({ code: "row-shape", detail: `${label} is not an <AREA>-<nn> id` });
    else if (ids.has(id)) findings.push({ code: "row-shape", detail: `duplicate row id ${id}` });
    ids.add(id);
    if (!LAYERS.includes(row.layer ?? "")) findings.push({ code: "row-layer", detail: `${label} declares layer "${row.layer ?? ""}", which is not ${LAYERS.join("/")}` });
    if ((row.question ?? "").trim() === "") findings.push({ code: "row-question-missing", detail: `${label} asks no question` });
    if ((row["applies-when"] ?? "").trim() === "") findings.push({ code: "row-applies-when-missing", detail: `${label} states no condition that earns it — no universal questionnaire` });
    if ((row.source ?? "").trim() === "") findings.push({ code: "row-source-missing", detail: `${label} cites no bibliography source` });
    if (togglesCount(row.toggles ?? "") < 2) findings.push({ code: "row-toggles-single", detail: `${label} toggles ${togglesCount(row.toggles ?? "")} behaviour(s); a question earns its place only with two answers that change behaviour` });
    if ((row.default ?? "").trim() === "") findings.push({ code: "row-default-missing", detail: `${label} states no default, so an unanswered slot has nothing to record` });
    const lands = (row["lands-in"] ?? "").trim();
    if (!slotKeys.has(lands)) findings.push({ code: "slot-missing", detail: `${label} lands in "${lands}", which the guide's ${CHARTER_HEADING} section does not carry` });
  }

  const boundary = slots.find((slot) => slot.key === BOUNDARY_SLOT);
  if (boundary === undefined) {
    findings.push({ code: "boundary-slot-missing", detail: `the guide carries no ${BOUNDARY_SLOT} slot, so the enforcement answer has nowhere the materialization step reads` });
  } else {
    findings.push(...boundaryFindings(boundary.value).map((finding) => ({ ...finding, detail: `${BOUNDARY_SLOT}: ${finding.detail}` })));
  }

  const ordered = findings.slice().sort((left, right) => `${left.code}${left.detail}`.localeCompare(`${right.code}${right.detail}`));
  return { ok: ordered.length === 0, findings: ordered, rows: bank.rows.length, slots: slots.length };
}

/**
 * Parse a landing payload: `{ date, answers, defaults }`. The date is the caller's
 * (no clock), and it is required as soon as a default could become an assumption —
 * an undated assumption is not dated.
 * @param {string} text
 */
export function parseLandPayload(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    throw new CharterRefusal(`the answers payload is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) throw new CharterRefusal("the answers payload must be an object with `answers` (and optionally `date`, `defaults`)");
  const answers = payload.answers ?? {};
  const defaults = payload.defaults ?? {};
  for (const [field, value] of [["answers", answers], ["defaults", defaults]]) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new CharterRefusal(`\`${field}\` must be an object of slot → value`);
    for (const [key, entry] of Object.entries(value)) {
      if (typeof entry !== "string" || entry.trim() === "") throw new CharterRefusal(`\`${field}["${key}"]\` must be a non-empty string`);
    }
  }
  const hasDefaults = Object.keys(defaults).length > 0;
  if (payload.date !== undefined) {
    const match = typeof payload.date === "string" ? ISO_DATE.exec(payload.date) : null;
    const asDate = match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : null;
    if (asDate === null || Number.isNaN(asDate.getTime()) || asDate.toISOString().slice(0, 10) !== payload.date) {
      throw new CharterRefusal(`\`date\` must be a real YYYY-MM-DD date, got ${JSON.stringify(payload.date)}`);
    }
  } else if (hasDefaults) {
    throw new CharterRefusal("a defaults payload needs `date`: an assumption is recorded with the day it was made, never undated");
  }
  return { date: payload.date ?? null, answers, defaults };
}

/**
 * Land answers into the guide's charter slots. A filled slot is `kept` (the team
 * already decided), a placeholder with an answer is `written`, a placeholder
 * covered only by a default is `assumed <date> — <default>`, and anything else is
 * `unanswered` and left byte-identical.
 * @param {{guideText: string, payload: {date: string|null, answers: Record<string,string>, defaults: Record<string,string>}}} input
 */
export function landAnswers({ guideText, payload }) {
  const answers = payload.answers ?? {};
  const defaults = payload.defaults ?? {};
  const slots = readSlots(guideText);
  if (slots.length === 0) throw new CharterRefusal(`the guide has no ${CHARTER_HEADING} section with keyed slots, so there is nothing to land`);
  const keys = new Set(slots.map((slot) => slot.key));
  for (const key of [...Object.keys(answers), ...Object.keys(defaults)]) {
    if (!keys.has(key)) throw new CharterRefusal(`"${key}" is not a slot in the guide's ${CHARTER_HEADING} section`);
  }
  if (Object.keys(defaults).length > 0 && payload.date === undefined) {
    throw new CharterRefusal("a defaults payload needs `date`: an assumption is recorded with the day it was made, never undated");
  }

  const rows = [];
  const lines = guideText.split("\n");
  let start = -1;
  let level = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^(#{1,6})\s+(.*)$/.exec(lines[index]);
    if (heading && heading[2].trim() === CHARTER_HEADING) {
      start = index;
      level = heading[1].length;
      break;
    }
  }
  for (let index = start + 1; index > start && index < lines.length; index += 1) {
    const heading = /^(#{1,6})\s+(.*)$/.exec(lines[index]);
    if (heading && heading[1].length <= level) break;
    const match = SLOT_LINE.exec(lines[index]);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2].trim();
    if (!isPlaceholder(value)) {
      rows.push({ key, status: "kept", value });
      continue;
    }
    if (payload.answers[key] !== undefined) {
      lines[index] = lines[index].replace(/^- \*\*[^*]+:\*\*\s*.*$/, `- **${key}:** ${answers[key]}`);
      rows.push({ key, status: "written", value: answers[key] });
      continue;
    }
    if (defaults[key] !== undefined) {
      const assumption = `assumed ${payload.date} — ${defaults[key]}`;
      lines[index] = lines[index].replace(/^- \*\*[^*]+:\*\*\s*.*$/, `- **${key}:** ${assumption}`);
      rows.push({ key, status: "assumed", value: assumption });      continue;
    }
    rows.push({ key, status: "unanswered", value });
  }
  return { text: lines.join("\n"), rows };
}

// ── CLI ───────────────────────────────────────────────────────────────────

const USAGE = "usage: charter state --guide <path> | charter land --guide <path> --answers <path|-> | charter check --guide <path> --bank <path>";

const parseFlags = (args) => {
  const flags = { json: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") { flags.json = true; continue; }
    if (arg === "--guide" || arg === "--answers" || arg === "--bank") {
      const value = args[index + 1];
      if (value === undefined) throw new CharterRefusal(`${arg} requires a value`);
      flags[arg.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new CharterRefusal(`unknown argument "${arg}" — ${USAGE}`);
  }
  return flags;
};

const readText = (file, what) => {
  try {
    return readFileSync(resolve(file), "utf8");
  } catch (error) {
    throw new CharterRefusal(`${what} is present but unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * The `charter` subcommand.
 * @param {string[]} args
 * @returns {number} the exit code
 */
export function run(args) {
  const json = args.includes("--json");
  try {
    const [operation, ...rest] = args;
    const flags = parseFlags(rest);
    if (flags.guide === undefined) throw new CharterRefusal(`no --guide given — ${USAGE}`);
    const guideText = readText(flags.guide, "the guide");

    if (operation === "state") {
      const slots = stateReport(guideText);
      if (json) {
        process.stdout.write(`${JSON.stringify({ ok: true, operation, guide: flags.guide, slots }, null, 2)}\n`);
        return 0;
      }
      const filled = slots.filter((slot) => slot.state === "filled").length;
      process.stdout.write(`CHARTER STATE — ${flags.guide} · ${slots.length} slot(s) · filled ${filled} · placeholder ${slots.length - filled}\n`);
      for (const slot of slots) process.stdout.write(`- ${slot.key}: ${slot.state}\n`);
      return 0;
    }

    if (operation === "land") {
      if (flags.answers === undefined) throw new CharterRefusal(`no --answers given — ${USAGE}`);
      const raw = flags.answers === "-" ? readStdin() : readText(flags.answers, "the answers file");
      const payload = parseLandPayload(raw);
      const result = landAnswers({ guideText, payload });
      if (result.text !== guideText) writeFileSync(resolve(flags.guide), result.text, "utf8");
      const tally = (status) => result.rows.filter((row) => row.status === status).length;
      if (json) {
        process.stdout.write(`${JSON.stringify({ ok: true, operation, guide: flags.guide, rows: result.rows }, null, 2)}\n`);
        return 0;
      }
      process.stdout.write(
        `CHARTER LAND — ${flags.guide} · written ${tally("written")} · kept ${tally("kept")} · assumed ${tally("assumed")} · unanswered ${tally("unanswered")}\n`,
      );
      for (const row of result.rows) process.stdout.write(`- ${row.key}: ${row.status}\n`);
      return 0;
    }

    if (operation === "check") {
      if (flags.bank === undefined) throw new CharterRefusal(`no --bank given — ${USAGE}`);
      const bankText = readText(flags.bank, "the bank");
      const result = checkBank({ guideText, bankText });
      if (json) {
        process.stdout.write(`${JSON.stringify({ ok: result.ok, operation, bank: flags.bank, guide: flags.guide, ...result }, null, 2)}\n`);
        return result.ok ? 0 : 1;
      }
      if (result.ok) {
        process.stdout.write(`CHARTER CHECK PASS — ${flags.bank} · ${result.rows} row(s) · ${result.slots} slot(s)\n`);
        return 0;
      }
      process.stdout.write(`CHARTER CHECK BLOCKED — ${result.findings.length} finding(s)\n`);
      for (const finding of result.findings) process.stdout.write(`- ${finding.code}: ${finding.detail}\n`);
      return 1;
    }

    throw new CharterRefusal(`unknown operation "${operation ?? ""}" — ${USAGE}`);
  } catch (error) {
    if (!(error instanceof CharterRefusal)) throw error;
    process.stderr.write(`EDIT REFUSAL — ${error.message}\n`);
    return 2;
  }
}

/** `--answers -`: the payload arrives on stdin, e.g. from a heredoc. */
const readStdin = () => {
  let text = "";
  try {
    text = readFileSync(0, "utf8");
  } catch (error) {
    throw new CharterRefusal(`stdin is unreadable: ${error instanceof Error ? error.message : String(error)}`);
  }
  return text;
};
