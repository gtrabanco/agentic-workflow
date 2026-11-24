/**
 * mine.mjs — the ceremony-failure history miner (issue #703 S4/S14a).
 *
 * The corpora are the project's own durable record, and this module **joins**
 * them instead of re-parsing anything:
 *
 *   journal   `docs/LOGS.md` plus the pending fragments, read through
 *             `journal-corpus`'s `buildJournalCorpus`. Its correcting lines,
 *             refuted findings and per-unit session counts are the carrier this
 *             unit reads; the entry grammar, the fence handling and the
 *             `(unit, F<n>)` join all live there.
 *   unit docs every `docs/{features,fix}/*\/SPEC.md`, its `## Log` read through
 *             the shared `parseLog` (`log-kind@1`'s reader). A `G`/`E` line that
 *             records a non-zero exit is a gate/evidence event; an `R` line that
 *             carries a failing verdict is a review event; the per-unit `F` and
 *             `R` counts against the correction budget are the aggregate events.
 *
 * Two properties are the whole point:
 *
 *   * **it never decides.** A non-zero exit includes the red-first receipt a
 *     green unit is required to record, so the miner emits a candidate and the
 *     rubric (the skill's table, `bundle.mjs`'s validation) is where an expected
 *     red exits the report. That separation is what keeps a 400-row corpus an
 *     eight-row lookup instead of a weighing.
 *   * **the anchor is real.** Every row carries a repository-relative
 *     `file:line` (or the carrier itself, for an aggregate) plus the redaction
 *     handle the bundle prints in place of it. The internal anchor never reaches
 *     the bundle.
 *
 * Read-only: it reads bytes, writes nothing, spawns nothing (the journal reader
 * is called with `resolveFold: () => null`, so no git).
 */

import fs from "node:fs";
import path from "node:path";

import { DEFAULT_RECURRENCE, LOG_REL, FRAGMENTS_REL, buildJournalCorpus } from "../journal-corpus/index.mjs";
import { parseLog } from "../runner/unit-doc-phases.mjs";

import {
  DEFAULT_CYCLE_BUDGET,
  DEFAULT_FOLD_BUDGET,
  DoctorRefusal,
  MARKER_KINDS,
  MINE_CONTRACT,
} from "./vocabulary.mjs";

/** The unit homes, in the order their rows are read. */
export const UNIT_HOMES = Object.freeze(["docs/fix", "docs/features"]);

/** A `## Log` line that records an exit code (`· exit 1 ·`). */
const EXIT = /\bexit\s+(\d+)\b/u;
/** An `R` line whose verdict is a failure — the `log-kind@1` receipt row. */
const FAILING_VERDICT = /\bREVIEW[- ]FAIL\b|\bverdict\s+FAIL\b|\bBLOCKED\b/u;

/**
 * The line a log token sits on: the token's own bullet. This is an index over
 * lines the shared reader already parsed, not a second grammar — `parseLog`
 * supplies the token, and this finds the line it came from.
 *
 * @param {string} text
 * @param {string} token e.g. `G1`
 * @returns {number|null} 1-based line number
 */
export function lineOfToken(text, token) {
  const needle = `**${token}**`;
  const lines = String(text ?? "").split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/^\s*[-*+]\s/u.test(line)) continue;
    if (line.includes(needle)) return index + 1;
  }
  return null;
}

/** Every unit doc under the two homes, in a stable order. */
function unitDocs(root) {
  const docs = [];
  for (const home of UNIT_HOMES) {
    const dir = path.join(root, home);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      if (name.startsWith("_")) continue;
      const file = path.join(dir, name, "SPEC.md");
      if (fs.existsSync(file)) docs.push({ unit: name, home, file, rel: `${home}/${name}/SPEC.md` });
    }
  }
  return docs;
}

/** The rows one unit doc contributes: line events, then the two aggregates. */
function rowsOfUnit(doc, text, { foldBudget, cycleBudget }) {
  const { lines, present } = parseLog(text);
  if (!present) return { rows: [], hasLog: false };
  const rows = [];
  let folded = 0;
  let cycles = 0;

  for (const line of lines) {
    if (line.kind === "F") folded += 1;
    if (line.kind === "R") cycles += 1;
    if (line.kind === "G" || line.kind === "E") {
      const exit = EXIT.exec(line.body);
      if (exit === null || Number(exit[1]) === 0) continue;
      const at = lineOfToken(text, line.token);
      rows.push({
        kind: line.kind === "G" ? "gate-red" : "evidence-red",
        unit: doc.unit,
        token: line.token,
        handle: `lg:${line.token}`,
        anchor: at === null ? doc.rel : `${doc.rel}:${at}`,
        detail: `exit ${exit[1]}`,
      });
      continue;
    }
    if (line.kind === "R" && FAILING_VERDICT.test(line.body)) {
      const at = lineOfToken(text, line.token);
      rows.push({
        kind: "review-fail",
        unit: doc.unit,
        token: line.token,
        handle: `lg:${line.token}`,
        anchor: at === null ? doc.rel : `${doc.rel}:${at}`,
        detail: "failing review verdict",
      });
    }
  }

  if (folded > foldBudget) {
    rows.push({
      kind: "fold-over-budget",
      unit: doc.unit,
      token: null,
      handle: `agg:fold×${folded}`,
      anchor: doc.rel,
      detail: `${folded} folded findings, budget ${foldBudget}`,
    });
  }
  if (cycles > cycleBudget) {
    rows.push({
      kind: "review-cycles-over-budget",
      unit: doc.unit,
      token: null,
      handle: `agg:cycle×${cycles}`,
      anchor: doc.rel,
      detail: `${cycles} review cycles, budget ${cycleBudget}`,
    });
  }
  return { rows, hasLog: true };
}

/** The rows the journal carrier contributes: corrections, refutations, rework. */
function rowsOfJournal(corpus) {
  const rows = [];
  for (const row of corpus.rows) {
    rows.push({
      kind: row.kind === "refuted" ? "refuted-finding" : "correction",
      unit: row.unit ?? null,
      token: null,
      handle: row.kind === "refuted" ? "jn:refuted" : "jn:correction",
      anchor: row.provenance,
      detail: row.kind === "refuted" ? "a finding the record refutes" : "a correcting journal line",
    });
  }
  for (const signal of corpus.signals.sessions) {
    if (signal.sessions < DEFAULT_RECURRENCE) continue;
    rows.push({
      kind: "rework",
      unit: signal.unit,
      token: null,
      handle: `agg:rework×${signal.sessions}`,
      anchor: null,
      detail: `${signal.sessions} journal sessions on one unit`,
    });
  }
  return rows;
}

/** The render order: the published kind order, then unit, token and anchor. */
function orderRows(rows) {
  const rank = new Map(MARKER_KINDS.map((kind, index) => [kind, index]));
  return rows.slice().sort((left, right) => {
    const kind = (rank.get(left.kind) ?? 0) - (rank.get(right.kind) ?? 0);
    if (kind !== 0) return kind;
    const unit = String(left.unit ?? "").localeCompare(String(right.unit ?? ""));
    if (unit !== 0) return unit;
    const token = String(left.token ?? "").localeCompare(String(right.token ?? ""));
    if (token !== 0) return token;
    return String(left.anchor ?? "").localeCompare(String(right.anchor ?? ""));
  });
}

/**
 * Build the mine receipt for one project.
 *
 * @param {string} root the project root
 * @param {{foldBudget?: number, cycleBudget?: number, journal?: object}} [options]
 * @returns {object} the `workflow-doctor-mine@1` envelope
 */
export function buildMine(root, options = {}) {
  const projectDir = path.resolve(root);
  const foldBudget = Number.isInteger(options.foldBudget) ? options.foldBudget : DEFAULT_FOLD_BUDGET;
  const cycleBudget = Number.isInteger(options.cycleBudget) ? options.cycleBudget : DEFAULT_CYCLE_BUDGET;

  const corpus = options.journal ?? buildJournalCorpus(projectDir);
  const docs = unitDocs(projectDir);
  const units = [];
  const rows = [...rowsOfJournal(corpus)];

  for (const doc of docs) {
    const text = fs.readFileSync(doc.file, "utf8");
    const result = rowsOfUnit(doc, text, { foldBudget, cycleBudget });
    units.push({ path: doc.rel, unit: doc.unit, log: result.hasLog });
    rows.push(...result.rows);
  }

  const logPresent = corpus.log?.present === true;
  const fragmentsPresent = corpus.fragments?.present === true;
  if (!logPresent && !fragmentsPresent && units.length === 0) {
    throw new DoctorRefusal(
      "insufficient-input",
      `no carrier to mine: ${LOG_REL}, ${FRAGMENTS_REL}/ and docs/{features,fix}/*/SPEC.md are all absent`,
    );
  }

  const ordered = orderRows(rows).map((row, index) => ({ id: `W${index + 1}`, ...row }));
  const groups = MARKER_KINDS.map((kind) => {
    const own = ordered.filter((row) => row.kind === kind);
    return { kind, count: own.length, rows: own.map((row) => row.id) };
  });

  return {
    contract: MINE_CONTRACT,
    root: projectDir,
    carriers: {
      log: { path: LOG_REL, present: logPresent, entries: corpus.log?.entries ?? 0 },
      fragments: { path: FRAGMENTS_REL, present: fragmentsPresent, files: corpus.fragments?.files ?? 0 },
      units,
    },
    budgets: { folds: foldBudget, cycles: cycleBudget },
    kinds: [...MARKER_KINDS],
    rows: ordered,
    groups,
    totals: {
      rows: ordered.length,
      units: new Set(ordered.map((row) => row.unit).filter(Boolean)).size,
    },
    verdict: ordered.length === 0 ? "clean" : `rows ${ordered.length}`,
  };
}

/** The fixed human block: header, carriers, one line per group, the verdict. */
export function renderMine(receipt) {
  const lines = [
    `WORKFLOW DOCTOR MINE — ${receipt.totals.rows} row(s) · ${receipt.totals.units} unit(s) · contract ${receipt.contract}`,
  ];
  const carriers = receipt.carriers;
  lines.push(
    `carriers: ${carriers.log.path} ${carriers.log.present ? `entries ${carriers.log.entries}` : "absent"}`
      + ` · ${carriers.fragments.path} ${carriers.fragments.present ? `files ${carriers.fragments.files}` : "absent"}`
      + ` · unit docs ${carriers.units.length} (${carriers.units.filter((unit) => unit.log).length} with a Log)`,
  );
  lines.push(`budgets: folds ${receipt.budgets.folds} · cycles ${receipt.budgets.cycles}`);
  for (const group of receipt.groups) {
    lines.push(`group — ${group.kind} · ${group.count} row(s)${group.rows.length === 0 ? "" : ` · ${group.rows.join(" ")}`}`);
  }
  lines.push(`verdict: ${receipt.verdict}`);
  return lines.join("\n");
}
