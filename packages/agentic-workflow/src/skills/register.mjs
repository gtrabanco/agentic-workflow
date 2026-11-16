/**
 * register.mjs — lifecycle registration for installed external skills (issue
 * #591 S5, the anti-rot half).
 *
 * The workflow ships its own review pack, so an external skill is never a
 * dependency: it is an extra, registered in the guide's "Optional review
 * extras" note as one `review-extras@1` row carrying **where it came from, the
 * version it is pinned to, when it was installed and the review axis it covers**.
 * That single row is what turns a silent decay into a report: the inventory reads
 * it back and says `unpinned`, `stale` or `incomplete`, which is the finding a
 * later `product-audit` surfaces instead of a library rotting quietly.
 *
 * Two writes are impossible here by construction: a row never loses a cell (an
 * incomplete registration is refused before any byte moves), and registering a
 * name twice is refused rather than duplicated. The decay decision is pure — the
 * caller supplies `asOf`, so the same guide and the same date always produce the
 * same states, and no clock is read in this module.
 */

/** The block this module writes, and the only contract a consumer binds. */
export const REVIEW_EXTRAS_CONTRACT_ID = "review-extras@1";

/** The note's heading — the one place an installed extra is recorded. */
export const REVIEW_EXTRAS_HEADING = "Optional review extras";

/** The block's column order, frozen: a new column is a grammar change. */
export const REVIEW_EXTRAS_COLUMNS = Object.freeze(["name", "source", "pin", "installed", "axis"]);

/** Where a registered row stands — the closed set the inventory reports. */
export const SKILL_EXTRA_STATES = Object.freeze(["ok", "unpinned", "stale", "incomplete"]);

/** The declared decay window: a row older than this is `stale`. */
export const DEFAULT_MAX_AGE_DAYS = 180;

/** A pin that says nothing: the words a registry uses for "whatever is newest". */
const UNPINNED_PIN = /^(?:unpinned|latest|newest|current|\*|-|main|master)$/i;

/** `YYYY-MM-DD`, with the calendar check that makes the date a real one. */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A refusal the caller reports as `SKILLS REFUSAL — <message>` (exit 2). */
export class SkillExtrasRefusal extends Error {}

/** The prose the created note carries above its block. */
const NOTE_PROSE =
  "External review skills this project installed. Each row names where it came from, the version it is pinned to, when it was installed and the review axis it covers — the workflow ships its own review pack, so these run **in addition**, never as a dependency. `agentic-workflow skills inventory --guide AGENTS.md` reads this block and reports a row that has gone unpinned, stale or incomplete.";

/** True for a real calendar date in `YYYY-MM-DD`. */
export function isIsoDate(value) {
  const match = ISO_DATE.exec(typeof value === "string" ? value.trim() : "");
  if (match === null) return false;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Whole days from `from` to `to`, both `YYYY-MM-DD` (UTC, no clock read). */
const daysBetween = (from, to) => {
  const at = (value) => {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((at(to) - at(from)) / 86_400_000);
};

/** One markdown cell: no pipe, no newline, trimmed. */
const cell = (value) => (typeof value === "string" ? value.replace(/\r?\n/g, " ").trim() : "");

/**
 * The `review-extras@1` block inside one guide, or `null` when the guide carries
 * none. The marker is the block's first non-empty line; the header must be the
 * frozen column order, because the inventory reads cells by position.
 * @param {string} text
 * @returns {{ markerLine: number, headerLine: number, rows: object[], lastRowLine: number } | null}
 */
function findBlock(text) {
  const lines = text.split("\n");
  let fence = null;
  let start = -1;
  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (fence === null) {
      const opened = /^(```+|~~~+)/u.exec(trimmed);
      if (opened !== null) {
        fence = opened[1];
        start = index;
      }
      continue;
    }
    if (trimmed.startsWith(fence)) {
      const body = lines.slice(start + 1, index).map((line) => line.trim()).filter((line) => line !== "");
      if (body.length > 0 && body[0] === REVIEW_EXTRAS_CONTRACT_ID) {
        const header = body[1];
        if (header !== REVIEW_EXTRAS_COLUMNS.join(" | ")) {
          throw new SkillExtrasRefusal(`the ${REVIEW_EXTRAS_CONTRACT_ID} block's header is "${header}", not "${REVIEW_EXTRAS_COLUMNS.join(" | ")}"`);
        }
        const rows = body.slice(2).map((line) => {
          const cells = line.split("|").map((value) => value.trim());
          if (cells.length !== REVIEW_EXTRAS_COLUMNS.length) {
            throw new SkillExtrasRefusal(`the ${REVIEW_EXTRAS_CONTRACT_ID} row "${line}" carries ${cells.length} cells, not ${REVIEW_EXTRAS_COLUMNS.length}`);
          }
          return Object.fromEntries(REVIEW_EXTRAS_COLUMNS.map((column, at) => [column, cells[at]]));
        });
        return { rows, closeLine: index };
      }
      fence = null;
      start = -1;
    }
  }
  return null;
}

/**
 * Read the guide's registration note and its block.
 * @param {string} guideText
 * @returns {{ present: boolean, note: boolean, rows: object[] }}
 */
export function parseReviewExtras(guideText) {
  const text = typeof guideText === "string" ? guideText : "";
  const note = new RegExp(`^#{2,4} ${REVIEW_EXTRAS_HEADING}$`, "mu").test(text);
  const block = findBlock(text);
  return { present: note || block !== null, note, rows: block === null ? [] : block.rows };
}

/** The block's own bytes, ready to splice into a note. */
function renderBlock(rows) {
  return [
    "```text",
    REVIEW_EXTRAS_CONTRACT_ID,
    REVIEW_EXTRAS_COLUMNS.join(" | "),
    ...rows.map((row) => REVIEW_EXTRAS_COLUMNS.map((column) => row[column]).join(" | ")),
    "```",
  ];
}

/** Validate one registration row, refusing before any byte could move. */
function validatedRow(input) {
  const row = Object.fromEntries(REVIEW_EXTRAS_COLUMNS.map((column) => [column, cell(input[column])]));
  for (const column of REVIEW_EXTRAS_COLUMNS) {
    if (row[column] === "") throw new SkillExtrasRefusal(`the registration carries no ${column}`);
    if (row[column].includes("|")) throw new SkillExtrasRefusal(`the ${column} cell carries a pipe: "${row[column]}"`);
  }
  if (!isIsoDate(row.installed)) throw new SkillExtrasRefusal(`the install date "${row.installed}" is not a calendar day (YYYY-MM-DD)`);
  return row;
}

/**
 * Register one installed external skill in the guide.
 *
 * The guide's own bytes are never rewritten: the row is inserted into the
 * existing block, or the note and its block are appended when the guide carries
 * neither, so a registration is a pure extension of the document.
 *
 * @param {{ guideText: string, name: string, source: string, pin: string, installed: string, axis: string }} input
 * @returns {{ text: string, changed: "created"|"appended" }}
 */
export function registerReviewExtra({ guideText, ...row }) {
  const text = typeof guideText === "string" ? guideText : "";
  const entry = validatedRow(row);
  const parsed = parseReviewExtras(text);
  if (parsed.rows.some((existing) => existing.name === entry.name)) {
    throw new SkillExtrasRefusal(`${entry.name} is already registered in the "${REVIEW_EXTRAS_HEADING}" note`);
  }

  const block = findBlock(text);
  if (block !== null) {
    const lines = text.split("\n");
    lines.splice(block.closeLine, 0, REVIEW_EXTRAS_COLUMNS.map((column) => entry[column]).join(" | "));
    return { text: lines.join("\n"), changed: "appended" };
  }

  const section = [...renderBlock([entry])];
  if (parsed.note) {
    // The note exists without its block: attach the block at the end of the note.
    const lines = text.split("\n");
    const headingAt = lines.findIndex((line) => new RegExp(`^#{2,4} ${REVIEW_EXTRAS_HEADING}$`, "u").test(line));
    let end = lines.length;
    for (let index = headingAt + 1; index < lines.length; index += 1) {
      if (/^#{1,4} /u.test(lines[index])) {
        end = index;
        break;
      }
    }
    const tail = lines.slice(end);
    const head = lines.slice(0, end);
    while (head.length > 0 && head[head.length - 1].trim() === "") head.pop();
    return { text: [...head, "", ...section, "", ...tail].join("\n"), changed: "created" };
  }

  const suffix = text.endsWith("\n") || text === "" ? "" : "\n";
  return {
    text: `${text}${suffix}\n### ${REVIEW_EXTRAS_HEADING}\n\n${NOTE_PROSE}\n\n${section.join("\n")}\n`,
    changed: "created",
  };
}

/**
 * Read every registered extra back with its decay state.
 * @param {{ guideText: string, asOf: string, maxAgeDays?: number }} input
 * @returns {{ rows: object[], summary: object, verdict: "pass"|"attention" }}
 */
export function inventoryExtras({ guideText, asOf, maxAgeDays = DEFAULT_MAX_AGE_DAYS }) {
  if (!isIsoDate(asOf)) throw new SkillExtrasRefusal(`--as-of "${asOf}" is not a calendar day (YYYY-MM-DD)`);
  if (!Number.isInteger(maxAgeDays) || maxAgeDays < 1) throw new SkillExtrasRefusal(`the max age "${maxAgeDays}" is not a positive whole number of days`);

  const rows = parseReviewExtras(guideText).rows.map((row) => {
    const incomplete = REVIEW_EXTRAS_COLUMNS.some((column) => row[column] === "") || !isIsoDate(row.installed);
    if (incomplete) return { ...row, ageDays: null, state: "incomplete" };
    const ageDays = daysBetween(row.installed, asOf);
    const state = UNPINNED_PIN.test(row.pin) ? "unpinned" : ageDays > maxAgeDays ? "stale" : "ok";
    return { ...row, ageDays, state };
  });

  const count = (state) => rows.filter((row) => row.state === state).length;
  const summary = {
    rows: rows.length,
    ok: count("ok"),
    unpinned: count("unpinned"),
    stale: count("stale"),
    incomplete: count("incomplete"),
  };
  return { rows, summary, verdict: summary.rows === summary.ok ? "pass" : "attention" };
}

/**
 * The fixed block the inventory prints.
 * @param {ReturnType<typeof inventoryExtras>} report
 * @param {{ asOf: string, maxAgeDays: number }} window
 */
export function renderInventory(report, window) {
  const lines = [`${REVIEW_EXTRAS_CONTRACT_ID} — ${report.summary.rows} row(s) · as-of ${window.asOf} · max-age ${window.maxAgeDays} day(s)`];
  for (const row of report.rows) {
    lines.push(`${row.name} — ${row.state}`);
    lines.push(
      `  source ${row.source} · pin ${row.pin} · installed ${row.installed} · age ${row.ageDays === null ? "n/a" : `${row.ageDays} day(s)`} · axis ${row.axis}`,
    );
  }
  const { rows, ok, unpinned, stale, incomplete } = report.summary;
  lines.push(`summary: rows ${rows} · ok ${ok} · unpinned ${unpinned} · stale ${stale} · incomplete ${incomplete}`);
  lines.push(`verdict: ${report.verdict}`);
  return `${lines.join("\n")}\n`;
}
