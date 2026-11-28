/**
 * claim-staleness.mjs — issue #634: project the pre-execution snapshot's
 * `changedPaths` attribution onto a unit folder's claim ledger.
 *
 * A `sources.md` CLAIM/INV row states what a claim rests on and cites the bytes
 * that prove it. Those bytes move: a later phase rewrites the file a row points
 * at, and the row keeps asserting its `certainty` while its citation rots. This
 * module answers, per row, whether a cited path moved after a RECORDED phase, and
 * renders the mark `stale (P<n> · <sha>)` when it did.
 *
 * Three things it deliberately does not do:
 *
 *   · **It does not invent git evidence.** `changedBoundPaths` — the snapshot
 *     sensor's own attribution — already answers "which of these paths differ
 *     between a recorded revision and the worktree", uncommitted and untracked
 *     included. Reusing it keeps one reading of the same question.
 *   · **It does not read a `## Log` heading.** The phase map comes from the
 *     shared `parseLog` reader, so this file is not a second section parser.
 *   · **It never answers a false `fresh`.** A unit with no recorded phase, a
 *     revision git cannot resolve, and a citation that resolves to nothing are
 *     three distinct marks, all visible in the report. `fresh` means "compared,
 *     and nothing moved".
 *
 * Its vocabulary is runner-internal: no published contract names these states, so
 * `vocabulary-residency@1`'s `runner-internal` row keeps the set in this module
 * rather than in the schema package (decision `D4`).
 */

import path from "node:path";
import { parseLog } from "../unit-doc-phases.mjs";
import { changedBoundPaths } from "./pre-execution-snapshot.mjs";

/** The closed set of answers one row can carry. */
export const CLAIM_STALENESS_STATES = Object.freeze([
  "fresh",
  "stale",
  "no-citation",
  "unverified-no-phase",
  "unverified-unresolvable-revision",
]);

/** The column the projection writes, appended to the claim table. */
export const STALENESS_COLUMN = "staleness";

/** An escaped pipe (`\|`) is one character wide while it splits nothing. */
const ESCAPED_PIPE = "\u0001";
const SEPARATOR_CELL = /^:?-+:?$/u;
const CLAIM_ID = /^[A-Z]+-\d/u;
const SHA_TOKEN = /^[0-9a-f]{7,64}$/u;
const DOCUMENT_SUFFIX = /\.(?:md|markdown|mjs|cjs|js|ts|tsx|json|jsonc|json5|sh|ya?ml|toml|txt)$/iu;
const TRAILING_ANCHOR = /#[^`\s]*$/u;
const TRAILING_LINES = /:\d+(?:[,-]\d+)*$/u;
/** A mark's revision is the abbreviated commit; 12 hex is unambiguous and stable. */
const REVISION_LENGTH = 12;

/* ---------------------------------------------------------------- the mark */

/**
 * The mark a row carries. The grammar is the issue's own — `stale (P<n> · <sha>)`
 * — and every other state is a single token, so a reader never parses prose.
 *
 * @param {{ state: string, phase?: number, revision?: string }} answer
 * @returns {string}
 */
export function renderStalenessMark({ state, phase, revision } = {}) {
  if (!CLAIM_STALENESS_STATES.includes(state)) {
    throw new Error(`claim staleness: the state "${state}" is outside the published vocabulary (${CLAIM_STALENESS_STATES.join("|")})`);
  }
  if (state === "fresh" || state === "no-citation") return state;
  if (state === "unverified-no-phase") return "unverified: no-recorded-phase";
  if (state === "unverified-unresolvable-revision") {
    if (!Number.isInteger(phase)) throw new Error("claim staleness: an unverified-unresolvable-revision mark needs the phase it could not resolve");
    return `unverified: unresolvable-revision (P${phase})`;
  }
  if (!Number.isInteger(phase) || typeof revision !== "string" || revision === "") {
    throw new Error("claim staleness: a stale mark needs a phase and a revision — a mark without its evidence is never printed");
  }
  return `stale (P${phase} · ${revision})`;
}

/* ------------------------------------------------------------ cited paths */

/**
 * The repository paths a `source` cell cites, in sorted order.
 *
 * Only what a backticked span names is considered — a cell's free prose never
 * becomes a path. A line range (`:43,63`), an anchor (`#Non-goals`) and a leading
 * reader verb are stripped; a span with whitespace, an absolute or home-relative
 * path, a URL, or an issue reference is not a repository path and is dropped. A
 * bare filename (`SPEC.md`) is kept: in a unit's own ledger it names the unit's
 * own file, which the projection resolves against the unit folder.
 *
 * @param {string} sourceCell
 * @returns {string[]}
 */
export function citedPaths(sourceCell) {
  const found = new Set();
  for (const match of String(sourceCell ?? "").matchAll(/`([^`]+)`/gu)) {
    let token = match[1].trim();
    token = token.replace(TRAILING_ANCHOR, "");
    token = token.replace(TRAILING_LINES, "");
    if (token === "" || /\s/u.test(token)) continue;
    if (/^(?:~|\$|\/|#|https?:)/u.test(token)) continue;
    if (token.startsWith("../") || token.includes("..")) continue;
    if (!token.includes("/") && !DOCUMENT_SUFFIX.test(token)) continue;
    found.add(token.replace(/^\.\//u, ""));
  }
  return [...found].sort();
}

/**
 * The phases a unit doc records, each with the commit tokens its `P<n>` line
 * carries in the order it lists them.
 *
 * A line records no revision when it carries no sha token — that phase simply
 * cannot serve as a checkpoint, which is different from having none recorded.
 *
 * @param {string} unitDocText
 * @returns {{ phase: number, revisions: string[] }[]}
 */
export function phaseRevisions(unitDocText) {
  const phases = [];
  for (const line of parseLog(unitDocText).lines) {
    if (line.kind !== "P") continue;
    const revisions = [];
    for (const match of String(line.body ?? "").matchAll(/`([^`]+)`/gu)) {
      const token = match[1].trim();
      if (SHA_TOKEN.test(token)) revisions.push(token);
    }
    if (revisions.length > 0) phases.push({ phase: line.number, revisions });
  }
  return phases;
}

/* --------------------------------------------------------------- the rows */

/** One markdown line as its cells, unescaped, or `null` when the line is no row. */
function splitRowCells(line) {
  const trimmed = String(line).trim();
  if (trimmed.length < 2 || !trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  const flat = trimmed.split("\\|").join(ESCAPED_PIPE);
  return flat
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim().split(ESCAPED_PIPE).join("|"));
}

/** The inverse of `splitRowCells`: cells back to one markdown line. */
function joinRow(cells) {
  return `| ${cells.map((cell) => String(cell).split("|").join("\\|")).join(" | ")} |`;
}

const isSeparator = (cells) => cells.length > 0 && cells.every((cell) => SEPARATOR_CELL.test(cell));

/** Whether the cells are the header of a claim table, and where its two cells of interest sit. */
function claimHeader(cells) {
  const id = cells.indexOf("id");
  const source = cells.indexOf("source");
  const header = id >= 0 && source >= 0 && cells.includes("claim") && cells.includes("provenance");
  return header ? { id, source, width: cells.length, hasColumn: cells[cells.length - 1] === STALENESS_COLUMN } : null;
}

/** The CLAIM/INV rows of every claim table in a claim ledger, in document order. */
export function claimRows(sourcesText) {
  const rows = [];
  let header = null;
  for (const line of String(sourcesText ?? "").split("\n")) {
    const cells = splitRowCells(line);
    if (cells === null) {
      header = null;
      continue;
    }
    if (header === null) {
      header = claimHeader(cells);
      continue;
    }
    if (isSeparator(cells) || cells.length !== header.width) continue;
    const id = cells[header.id] ?? "";
    if (!CLAIM_ID.test(id)) continue;
    rows.push({ id, source: cells[header.source] ?? "" });
  }
  return rows;
}

/* --------------------------------------------------------- the projection */

/** A cited path, rooted: a bare filename means the unit folder's own file. */
function resolveCitedPath(candidate, unitDir) {
  return candidate.includes("/") ? candidate : path.posix.join(unitDir, candidate);
}

const isTracked = (gitRun, relPath) => gitRun("ls-files", "--error-unmatch", "--", relPath) !== "";

/** The full commit a recorded token names, or `null` when git cannot resolve it. */
function resolveRevision(gitRun, token) {
  const resolved = gitRun("rev-parse", "--verify", `${token}^{commit}`);
  return /^[0-9a-f]{40,64}$/u.test(resolved) ? resolved : null;
}

/**
 * Project the claim ledger onto the phases the unit doc records.
 *
 * One `git diff` per recorded phase answers all rows (not one per row and phase):
 * the snapshot sensor's `changedBoundPaths` already accepts a path set.
 *
 * @param {{ sourcesText: string, unitDocText: string, gitRun: (...args: string[]) => string, unitDir?: string }} input
 * @returns {{ rows: { id: string, state: string, mark: string, phase?: number, revision?: string, movedPaths: string[] }[] }}
 */
export function projectClaimStaleness({ sourcesText, unitDocText, gitRun, unitDir = "docs/features" } = {}) {
  const rows = claimRows(sourcesText);
  const phases = phaseRevisions(unitDocText);
  const checkpoints = phases
    .map((phase) => ({
      phase: phase.phase,
      full: phase.revisions.map((token) => resolveRevision(gitRun, token)).find((full) => full !== null) ?? null,
    }))
    .filter((checkpoint) => checkpoint.full !== null);

  return {
    rows: rows.map((row) => {
      const cited = citedPaths(row.source);
      const paths = cited.map((candidate) => resolveCitedPath(candidate, unitDir)).filter((rel) => isTracked(gitRun, rel));
      if (paths.length === 0) return answer(row, "no-citation");
      if (phases.length === 0) return answer(row, "unverified-no-phase");
      if (checkpoints.length === 0) {
        return answer(row, "unverified-unresolvable-revision", { phase: phases[0].phase });
      }
      const movedAt = checkpoints.map((checkpoint) => ({
        ...checkpoint,
        moved: new Set(changedBoundPaths(gitRun, checkpoint.full, paths)),
      }));
      const movedPaths = [...new Set(movedAt.flatMap((entry) => [...entry.moved]))].sort();
      if (movedPaths.length === 0) return answer(row, "fresh");
      // The newest recorded phase whose revision no longer contains the cited
      // bytes is the checkpoint the claim escaped after; an older one would blame
      // a moment that never saw the current content.
      const newest = movedAt
        .filter((entry) => entry.moved.size > 0)
        .reduce((latest, entry) => (latest === null || entry.phase > latest.phase ? entry : latest), null);
      return answer(row, "stale", {
        phase: newest.phase,
        revision: newest.full.slice(0, REVISION_LENGTH),
        movedPaths,
      });
    }),
  };
}

function answer(row, state, extra = {}) {
  return { id: row.id, state, mark: renderStalenessMark({ state, ...extra }), movedPaths: [], ...extra };
}

/* ------------------------------------------------------------- the write */

/**
 * Rewrite a claim ledger with the mark its projection produced.
 *
 * Only the CLAIM/INV tables gain the column, only rows the projection answered
 * are rewritten, and the write is idempotent: a second run is byte-identical,
 * because the column is detected rather than appended twice. Everything outside
 * those tables — prose, other tables, an escaped pipe inside a cell — is preserved
 * byte for byte.
 *
 * @param {string} sourcesText
 * @param {{ id: string, mark: string }[]} rows
 * @returns {string}
 */
export function writeStalenessColumn(sourcesText, rows) {
  const marks = new Map((rows ?? []).map((row) => [row.id, row.mark]));
  const out = [];
  let header = null;
  for (const line of String(sourcesText ?? "").split("\n")) {
    const cells = splitRowCells(line);
    if (cells === null) {
      header = null;
      out.push(line);
      continue;
    }
    if (header === null) {
      const found = claimHeader(cells);
      if (found === null) {
        out.push(line);
        continue;
      }
      header = found;
      out.push(found.hasColumn ? joinRow(cells) : joinRow([...cells, STALENESS_COLUMN]));
      continue;
    }
    if (isSeparator(cells)) {
      out.push(header.hasColumn || cells.length !== header.width ? joinRow(cells) : joinRow([...cells, "---"]));
      continue;
    }
    const id = cells[header.id] ?? "";
    const answerable = cells.length === header.width && CLAIM_ID.test(id) && marks.has(id);
    if (!answerable) {
      out.push(line);
      continue;
    }
    out.push(header.hasColumn
      ? joinRow([...cells.slice(0, -1), marks.get(id)])
      : joinRow([...cells, marks.get(id)]));
  }
  return out.join("\n");
}

/* ------------------------------------------------------------- the report */

/** Whether any row came back stale — the one question `--check` asks. */
export const hasStale = (rows) => (rows ?? []).some((row) => row.state === "stale");

/**
 * The `claim-staleness@1` envelope: one row per claim, then a summary line. The
 * counts are derived from the rows, never tabulated twice.
 *
 * @param {{ unit: string, rows: { id: string, state: string, mark: string, movedPaths?: string[] }[] }} input
 * @returns {string}
 */
export function renderClaimStalenessEnvelope({ unit, rows }) {
  const count = (state) => rows.filter((row) => row.state === state).length;
  const lines = [
    "claim-staleness@1",
    `unit | ${unit}`,
    "row | state | mark | moved-paths",
    ...rows.map((row) => [row.id, row.state, row.mark, (row.movedPaths ?? []).join(", ") || "—"].join(" | ")),
    `summary | ${rows.length} rows · ${count("stale")} stale · ${count("fresh")} fresh · ${count("no-citation")} no-citation · ${count("unverified-no-phase") + count("unverified-unresolvable-revision")} unverified`,
  ];
  return `${lines.join("\n")}\n`;
}
