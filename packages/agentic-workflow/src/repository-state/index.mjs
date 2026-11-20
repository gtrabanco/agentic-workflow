/**
 * repository-state — the freshness reader for the frozen repository snapshot
 * (issue #646 S1).
 *
 * The defect it answers: `docs/workflow/REPOSITORY_STATE.md` froze F011 and
 * AD-002 as *current* ("English-only, interim, feature 57 restores them per
 * release") while the owner reversed that decision on 2026-10-27, and the
 * architectural protocol ordered every session to consume the snapshot *before*
 * inspecting the tree. Nothing could see the contradiction, so a superseded
 * decision stayed authoritative for three months.
 *
 * Two rules close it, and both are computed, never remembered:
 *
 *   contradiction  an accepted decision dated after the snapshot's
 *                  `covers-through` means the snapshot no longer covers the
 *                  tree it claims to describe — `stale`, and the decision is
 *                  named;
 *   expiry         a `covers-through` older than the declared TTL — `stale`,
 *                  with the measured age.
 *
 * The reader is read-only: it reports a stale snapshot and never repairs it.
 * Repairing is `resolve-repository-state`'s, the sole authorized writer.
 *
 * Usage
 *   repository-state [<snapshot>] [--ttl-days <n>] [--today <date>] [--json]
 *   repository-state --help
 *   (node fallback, same argv)
 *
 * Defaults: the snapshot is `docs/workflow/REPOSITORY_STATE.md` and the TTL is
 * 90 days. stdout carries one fixed block — a header, one `REASON <code> — …`
 * line per reason in code order, then `verdict:`; diagnostics go to stderr.
 *
 * Exit: 0 `fresh` · 1 `stale` or a refusal (a named fault, never a guess) ·
 * 2 a usage error.
 *
 * Its sibling suite is `scripts/repository-state.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { sectionBounds } from "../runner/unit-doc-phases.mjs";

let SCRIPT_ROOT = process.cwd();

/** The checkout this reads: `--root`/the caller's root, else the cwd. */
function setRoot(dir) {
  if (dir) SCRIPT_ROOT = path.resolve(dir);
}
const DEFAULT_SNAPSHOT = "docs/workflow/REPOSITORY_STATE.md";

/** The grammar this reader implements. Published beside the skill that owns the
 *  snapshot: `skills/resolve-repository-state/references/STATE_CONTRACT.md`. */
export const CONTRACT_ID = "repository-state@1";
/** The closed verdict set. */
export const FRESHNESS_VERDICTS = Object.freeze(["fresh", "stale"]);
/** The closed fact-status set: a fact is frozen or it is stale, never blank. */
export const FACT_STATUSES = Object.freeze(["frozen", "stale"]);
/** The closed reason-code set, in report order. */
export const REASON_CODES = Object.freeze(["contradicted-by", "expired"]);
/** The default age bound, in days: a snapshot older than this no longer covers
 *  a tree that moves every day. Declared here so the CLI and the reader agree. */
export const DEFAULT_TTL_DAYS = 90;

const SNAPSHOT_FIELDS = Object.freeze({
  "snapshot id": "snapshotId",
  "source revision": "sourceRevision",
  status: "status",
  "covers through": "coversThrough",
  "created at": "createdAt",
});
const FACT_COLUMNS = ["ID", "Statement", "Evidence", "Status"];
const DECISION_COLUMNS = ["ID", "Decision", "Decided", "Rationale", "Evidence"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** A named fault: the reader refuses instead of answering a partial snapshot. */
function fault(code, detail) {
  const error = new Error(`${code}: ${detail}`);
  error.code = code;
  error.detail = detail;
  return error;
}

/** One table row's cells. A `\|` inside a cell is an escaped pipe — markdown's own
 *  spelling — so it never splits, and the escape is undone in the value. */
const ESCAPED_PIPE = "\u0000";
const cells = (line) =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\\\|/g, ESCAPED_PIPE)
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim().replaceAll(ESCAPED_PIPE, "|"));

const isTableRow = (line) => line.trim().startsWith("|");
const isSeparator = (line) => /^\|[\s:-]+\|/.test(line.trim()) || /^\|(\s*:?-{3,}:?\s*\|)+$/.test(line.trim());

/** The rows of the first table inside `## <heading>`, header included. The
 *  fence-aware section reader is the one definition (#308 F28/F39) — never an
 *  inline `## ` search here. */
function sectionTable(text, heading) {
  const bounds = sectionBounds(text, heading);
  if (bounds === null) return null;
  const body = text.slice(bounds[0], bounds[1]).split("\n").slice(1);
  const rows = body.filter((line) => isTableRow(line) && !isSeparator(line));
  return rows.length === 0 ? null : rows.map(cells);
}

function requireTable(text, heading, label) {
  const table = sectionTable(text, heading);
  if (table === null) throw fault("missing-table", `the snapshot declares no ${label} table under "## ${heading}"`);
  return table;
}

function requireColumns(table, expected, label) {
  const header = table[0].map((cell) => cell.toLowerCase());
  const wanted = expected.map((cell) => cell.toLowerCase());
  if (header.length !== wanted.length) {
    throw fault("ragged-row", `the ${label} header has ${header.length} cells, expected ${wanted.length}: ${expected.join(" | ")}`);
  }
  for (let index = 0; index < wanted.length; index += 1) {
    if (header[index] !== wanted[index]) {
      throw fault("ragged-row", `the ${label} header cell ${index + 1} is "${table[0][index]}", expected "${expected[index]}"`);
    }
  }
}

/**
 * Read one snapshot document. Structural faults throw; freshness is computed
 * separately by `readRepositoryState` so a caller can judge a document it did
 * not get from disk.
 */
export function parseSnapshot(text) {
  const snapshot = {};
  const table = requireTable(text, "Snapshot", "snapshot");
  for (const row of table) {
    if (row.length !== 2) throw fault("ragged-row", `a snapshot field row carries ${row.length} cells, expected 2`);
    const key = SNAPSHOT_FIELDS[row[0].toLowerCase()];
    if (key) snapshot[key] = row[1].replace(/`/g, "").trim();
  }
  for (const [label, key] of Object.entries(SNAPSHOT_FIELDS)) {
    if (!snapshot[key]) throw fault("missing-field", `the snapshot declares no "${label.replace(" ", "-")}" field`);
  }
  if (!ISO_DATE.test(snapshot.coversThrough)) {
    throw fault("bad-date", `the snapshot's covers-through "${snapshot.coversThrough}" is not a YYYY-MM-DD date`);
  }
  if (snapshot.status !== "frozen") {
    throw fault("missing-field", `the snapshot's status is "${snapshot.status}", expected "frozen"`);
  }

  const factRows = requireTable(text, "Repository facts", "facts");
  if (factRows.length < 2) throw fault("missing-table", "the facts table carries no rows");
  const facts = factRows.slice(1).map((row) => {
    if (row.length !== FACT_COLUMNS.length) {
      throw fault("ragged-row", `fact row ${row[0] ?? "?"} carries ${row.length} cells, expected ${FACT_COLUMNS.length}`);
    }
    const [id, statement, evidence, status] = row;
    if (!FACT_STATUSES.includes(status)) {
      throw fault("missing-field", `fact ${id}'s status "${status}" is outside ${FACT_STATUSES.join(" | ")}`);
    }
    const record = { id, statement, evidence, status };
    if (status === "stale") {
      const superseded = /superseded-by:\s*([A-Za-z0-9-]+)/.exec(`${statement} ${evidence}`);
      if (superseded === null) {
        throw fault("stale-without-superseded-by", `fact ${id} is stale but names no superseded-by: <decision id>`);
      }
      record.supersededBy = superseded[1];
    }
    return record;
  });

  const decisionRows = requireTable(text, "Accepted decisions", "accepted decisions");
  if (decisionRows.length < 2) throw fault("missing-table", "the accepted-decisions table carries no rows");
  requireColumns(decisionRows, DECISION_COLUMNS, "accepted-decisions");
  const decisions = decisionRows.slice(1).map((row) => {
    if (row.length !== DECISION_COLUMNS.length) {
      throw fault("ragged-row", `decision row ${row[0] ?? "?"} carries ${row.length} cells, expected ${DECISION_COLUMNS.length}`);
    }
    const [id, decision, decided] = row;
    if (!ISO_DATE.test(decided)) {
      throw fault("undated-decision", `decision ${id} carries no YYYY-MM-DD decided date ("${decided}")`);
    }
    return { id, decision, decided };
  });

  return { ...snapshot, facts, decisions };
}

const daysBetween = (from, to) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);

/**
 * Compute the verdict for one snapshot. `today` is injected so a suite can judge
 * a fixture at a fixed date instead of at the wall clock.
 */
export function readRepositoryState({ file, text, today, ttlDays } = {}) {
  const body = text ?? fs.readFileSync(file, "utf8");
  const snapshot = parseSnapshot(body);
  const day = today ?? new Date().toISOString().slice(0, 10);
  const ttl = ttlDays ?? DEFAULT_TTL_DAYS;
  const reasons = [];

  const newer = snapshot.decisions
    .filter((decision) => decision.decided > snapshot.coversThrough)
    .sort((left, right) => left.decided.localeCompare(right.decided) || left.id.localeCompare(right.id));
  for (const decision of newer) {
    reasons.push({
      code: "contradicted-by",
      detail: `${decision.id} (${decision.decided}) is newer than covers-through ${snapshot.coversThrough}`,
    });
  }
  const age = daysBetween(snapshot.coversThrough, day);
  if (age > ttl) {
    reasons.push({ code: "expired", detail: `covers-through ${snapshot.coversThrough} is ${age} days old (ttl ${ttl})` });
  }
  reasons.sort((left, right) => REASON_CODES.indexOf(left.code) - REASON_CODES.indexOf(right.code));
  return {
    contract: CONTRACT_ID,
    snapshotId: snapshot.snapshotId,
    sourceRevision: snapshot.sourceRevision,
    coversThrough: snapshot.coversThrough,
    createdAt: snapshot.createdAt,
    decidedOn: day,
    ttlDays: ttl,
    verdict: reasons.length === 0 ? "fresh" : "stale",
    reasons,
    facts: snapshot.facts,
    decisions: snapshot.decisions,
  };
}

function usage(message) {
  process.stderr.write(`repository-state: ${message}\n`);
  process.stderr.write("usage: repository-state [<snapshot>] [--ttl-days <n>] [--json]  (node fallback, same argv)\n");
  process.exit(2);
}

export function main(argv = process.argv.slice(2), options = {}) {
  setRoot(options.root);
  let file = null;
  let ttlDays = null;
  let today = null;
  let json = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      process.stdout.write("usage: repository-state [<snapshot>] [--ttl-days <n>] [--today <YYYY-MM-DD>] [--json]\n");
      return 0;
    }
    if (arg === "--json") {
      json = true;
    } else if (arg === "--ttl-days") {
      const value = argv[index + 1];
      if (value === undefined || !/^\d+$/.test(value)) usage("--ttl-days needs a whole number of days");
      ttlDays = Number(value);
      index += 1;
    } else if (arg === "--today") {
      const value = argv[index + 1];
      if (value === undefined || !ISO_DATE.test(value)) usage("--today needs a YYYY-MM-DD date");
      today = value;
      index += 1;
    } else if (arg.startsWith("-")) {
      usage(`unknown flag ${arg}`);
    } else if (file === null) {
      file = path.resolve(arg);
    } else {
      usage(`only one snapshot may be judged at a time (got ${file} and ${arg})`);
    }
  }
  const target = file ?? path.join(SCRIPT_ROOT, DEFAULT_SNAPSHOT);
  if (!fs.existsSync(target)) usage(`${target} does not exist`);

  let state;
  try {
    state = readRepositoryState({ file: target, ttlDays: ttlDays ?? undefined, today: today ?? undefined });
  } catch (error) {
    process.stderr.write(`repository-state: ${error.message}\n`);
    return 1;
  }

  if (json) {
    process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
  } else {
    const lines = [
      `repository-state — ${state.snapshotId} · covers-through ${state.coversThrough} · ${state.facts.length} facts · ${state.decisions.length} decisions`,
    ];
    for (const reason of state.reasons) lines.push(`REASON ${reason.code} — ${reason.detail}`);
    lines.push(`verdict: ${state.verdict}`);
    process.stdout.write(`${lines.join("\n")}\n`);
  }
  return state.verdict === "fresh" ? 0 : 1;
}
