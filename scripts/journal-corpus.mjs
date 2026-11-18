#!/usr/bin/env node
/**
 * journal-corpus.mjs — the session journal as a corpus carrier (issue #616).
 *
 * The retrospective half of the workflow reads the findings ledgers; the
 * journal — `docs/LOGS.md` plus the pending `.agentic-workflow/journal/`
 * fragments — recorded corrections, rework and admitted false positives that
 * reached no audit, no corpus row and no gate. This script is that carrier, and
 * it derives only:
 *
 *   corrections    a correcting line (`- **Correction…**`) is one row; its class
 *                  is the corpus row its own bytes resolve, and a correction
 *                  that resolves to nothing is `unjoined` — counted, listed,
 *                  never bucketed into a guessed class. A lexical taxonomy was
 *                  rejected on purpose: it would attribute a class the journal
 *                  never declared.
 *   sessions       entries recorded against one unit, the rework signal. Two or
 *                  more entries on a unit is rework by definition; whether
 *                  twenty is thrashing is the dimension's call, so no threshold
 *                  is shipped here.
 *   false-positive a line admitting a finding wrong (false positive, refuted,
 *                  self-refuted, discarded) that names a finding id: the row is
 *                  cross-joined to the corpus row so one finding cites both
 *                  carriers.
 *
 * The join is the corpus's own: `buildCorpus` supplies every `(unit, F<n>)` row,
 * and the phase a recurring class should have been caught in comes from
 * `phaseOfAxis`/`PHASE_DESTINATION` — the journal never keeps a second
 * `axis → phase` table. Fold resolution is deliberately off (`resolveFold:
 * () => null`): this reader needs rows, not admission, so it spawns no git.
 *
 * Nothing is re-derived and nothing is decided: an absent carrier is named in
 * the receipt, and the severity, the route and the thrashing threshold belong to
 * the audit dimension that consumes the block.
 *
 * Usage
 *   bun scripts/journal-corpus.mjs [<dir> | --repo <dir>] [--recurrence <n>]
 *   (node fallback, same argv)
 *
 * Exit: 0 a receipt was produced (with or without signals); 1 neither carrier
 * exists (`insufficient-input`), a required failure state rather than a vacuous
 * clean; 2 a usage error.
 *
 * Read-only: it reads bytes, writes nothing, calls no network. Its sibling suite
 * is `scripts/journal-corpus.test.mjs`.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { closesFence, openFence } from "../packages/agentic-workflow/src/runner/unit-doc-phases.mjs";
import { PHASE_DESTINATION, buildCorpus, digestOf, phaseOfAxis } from "./findings-corpus.mjs";

export const JOURNAL_CORPUS_CONTRACT = "journal-corpus@1";
/** The aggregated journal, relative to the project root. */
export const LOG_REL = "docs/LOGS.md";
/** The fragment carrier (#405), relative to the project root. */
export const FRAGMENTS_REL = ".agentic-workflow/journal";
/** The closed signal vocabulary this receipt can carry. */
export const SIGNAL_KINDS = Object.freeze(["corrections", "sessions", "false-positive"]);
/** The corpus's own recurrence default, reused so one rule decides both. */
export const DEFAULT_RECURRENCE = 2;

/** A level-2 heading: the entry boundary, never a section bound (allowlisted). */
const ENTRY_HEADING = /^## /;
/**
 * The stamp the two renderers and the fragment grammar produce: `YYYY-MM-DD`,
 * `YYYY-MM-DDTHH:MMZ`, `YYYY-MM-DDTHH:MM:SSZ`, the millisecond tail a writer
 * left before `isoSecond` stripped it, and the compact `YYYYMMDDTHHMMSSZ`.
 */
const STAMP = /^\d{4}-?\d{2}-?\d{2}(?:T\d{2}:?\d{2}(?::?\d{2})?(?:\.\d{1,3})?Z?)?$/u;
/** The heading's own separator; a label may carry it too, so the split is capped. */
const SEPARATOR = " — ";
/** A correcting line: the journal's append-only shape for a wrong past line. */
const CORRECTING = /^[-*]\s+\*\*correct(?:ion|ing)\b/iu;
/** The closed refutation markers. */
const REFUTATION = /false positive|self-refut|refuted|discarded/iu;
const FINDING_ID = /\bF(\d+)\b/u;
const MARKDOWN = /\.md$/u;
const BRANCHES_WITHOUT_UNIT = new Set(["main", "master", "trunk", "detached"]);

/**
 * The entry heading's shape: `## <stamp> — <branch> — <label>`.
 *
 * This is the reader half of the shape `renderEntryBlock` (narrative) and
 * `renderEntry` (mechanical) write; the suite parses both renderers' own bytes
 * so the writer and the audit cannot drift apart silently. A `## ` heading that
 * carries no stamp is prose (`## What happened`), never an entry.
 */
export function parseEntryHeading(line) {
  if (!ENTRY_HEADING.test(String(line ?? ""))) return null;
  const parts = String(line).slice(3).split(SEPARATOR);
  if (parts.length < 2) return null;
  const stamp = parts[0].trim();
  const branch = parts[1].trim();
  if (!STAMP.test(stamp) || branch.length === 0) return null;
  return { stamp, branch, label: parts.slice(2).join(SEPARATOR).trim() };
}

/**
 * The unit a journal branch names: `feat/<unit>`, `fix/<unit>` or the sanitized
 * `feat-<unit>`/`fix-<unit>`. The trunk names no unit, and neither does an empty
 * branch — a session on `main` is triage, not rework of one unit.
 */
export function unitOfBranch(branch) {
  const raw = String(branch ?? "").trim();
  if (raw.length === 0) return null;
  const stripped = raw.replace(/^(?:feat|fix)[/-]/u, "").replaceAll("/", "-");
  if (stripped.length === 0 || BRANCHES_WITHOUT_UNIT.has(stripped)) return null;
  return stripped;
}

const findingOf = (line) => {
  const match = FINDING_ID.exec(line);
  return match === null ? null : `F${match[1]}`;
};

/**
 * Read one carrier's bytes into `{ entries, rows, skipped }`.
 *
 * A fence-aware walk: a `## ` line inside a fenced block is quoted prose, and the
 * fence primitives are the runner's own (`openFence`/`closesFence`), so this
 * reader grows no second fence rule.
 */
export function parseJournalText(text, { file, carrier }) {
  const entries = [];
  const rows = [];
  let skipped = 0;
  let current = null;
  let fence = null;

  String(text ?? "")
    .split("\n")
    .forEach((line, index) => {
      const trimmed = line.trim();
      if (fence !== null) {
        if (closesFence(trimmed, fence)) fence = null;
        return;
      }
      const opened = openFence(trimmed);
      if (opened !== null) {
        fence = opened;
        return;
      }
      const heading = parseEntryHeading(line);
      if (heading !== null) {
        current = { ...heading, line: index + 1, unit: unitOfBranch(heading.branch) };
        entries.push(current);
        return;
      }
      if (ENTRY_HEADING.test(line)) {
        // A `## ` heading that carries no stamp bounds no entry: it is prose the
        // journal already contains, and it is counted instead of guessed at.
        skipped += 1;
        current = null;
        return;
      }
      if (current === null) return;
      const finding = findingOf(line);
      const refuted = finding !== null && REFUTATION.test(line);
      const correcting = CORRECTING.test(line);
      if (!refuted && !correcting) return;
      rows.push({
        carrier,
        provenance: `${file}:${index + 1}`,
        digest: digestOf(line),
        unit: current.unit,
        date: current.stamp,
        entry: current.stamp,
        kind: refuted ? "refuted" : "correction",
        finding,
        class: null,
        joined: null,
        axis: null,
        klass: null,
        reason: null,
        text: trimmed,
      });
    });

  return { entries, rows, skipped };
}

/**
 * Attach the corpus row each journal row names: `(unit, F<n>)` resolved through
 * `buildCorpus`. A row that resolves nothing keeps `joined: null` and the reason
 * it could not — never a bucket it did not earn.
 */
export function joinJournalRows(rows, corpusRows) {
  const index = new Map();
  for (const row of corpusRows) index.set(`${row.unit}\u0000${row.id}`, row);
  return rows.map((row) => {
    const joined = { ...row };
    if (joined.unit === null) {
      joined.reason = "no unit in the entry's branch";
    } else if (joined.finding === null) {
      joined.reason = "the line names no finding id";
    } else {
      const hit = index.get(`${joined.unit}\u0000${joined.finding}`);
      if (hit === undefined) {
        joined.reason = `no corpus row for ${joined.unit} ${joined.finding}`;
      } else {
        joined.joined = hit.provenance;
        joined.axis = hit.axis;
        joined.klass = hit.klass;
      }
    }
    joined.class = joined.axis === null ? "unjoined" : `${joined.axis}×${joined.klass}`;
    return joined;
  });
}

const byProvenance = (left, right) => left.provenance.localeCompare(right.provenance);

/** One row per correction class: the count, and the reason a class is unjoined. */
export function correctionClasses(rows) {
  const groups = new Map();
  for (const row of rows) {
    if (row.kind !== "correction") continue;
    if (!groups.has(row.class)) groups.set(row.class, { class: row.class, n: 0, reasons: new Set() });
    const group = groups.get(row.class);
    group.n += 1;
    if (row.reason !== null) group.reasons.add(row.reason);
  }
  return [...groups.values()]
    .map((group) => ({ class: group.class, n: group.n, reason: [...group.reasons].sort().join("; ") }))
    .sort((left, right) => left.class.localeCompare(right.class));
}

/** The rework signal: entries per unit, trunk excluded, no threshold applied. */
export function sessionsPerUnit(entries) {
  const counts = new Map();
  for (const entry of entries) {
    if (entry.unit === null) continue;
    counts.set(entry.unit, (counts.get(entry.unit) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, sessions]) => sessions > 1)
    .map(([unit, sessions]) => ({ unit, sessions }))
    .sort((left, right) => right.sessions - left.sessions || left.unit.localeCompare(right.unit));
}

/** Recurring joined classes, attributed through the corpus's own phase map. */
export function attributeJournalClasses(rows, { recurrence = DEFAULT_RECURRENCE } = {}) {
  const groups = new Map();
  for (const row of rows) {
    if (row.joined === null) continue;
    const key = row.class;
    if (!groups.has(key)) groups.set(key, { axis: row.axis, klass: row.klass, n: 0, examples: [] });
    const group = groups.get(key);
    group.n += 1;
    if (group.examples.length < 3) group.examples.push(row.provenance);
  }
  return [...groups.values()]
    .filter((group) => group.n >= recurrence)
    .map((group) => {
      const phase = phaseOfAxis(group.axis);
      return {
        axis: group.axis,
        klass: group.klass,
        n: group.n,
        phase: phase ?? "unmapped",
        proposal: phase === null || phase === undefined ? null : PHASE_DESTINATION[phase],
        examples: group.examples.sort(),
      };
    })
    .sort((left, right) => right.n - left.n || left.axis.localeCompare(right.axis));
}

/**
 * Read the project and return the receipt's model. Pure apart from the reads;
 * writes nothing. The corpus is read only when the journal produced a row, so a
 * project whose journal records nothing pays nothing for the join.
 */
export function buildJournalCorpus(root, { recurrence = DEFAULT_RECURRENCE } = {}) {
  const logPath = path.join(root, LOG_REL);
  const fragmentDir = path.join(root, FRAGMENTS_REL);
  const logPresent = fs.existsSync(logPath);
  const fragmentsPresent = fs.existsSync(fragmentDir);

  const entries = [];
  const rows = [];
  let skipped = 0;
  let logEntries = 0;

  if (logPresent) {
    const parsed = parseJournalText(fs.readFileSync(logPath, "utf8"), { file: LOG_REL, carrier: "log" });
    entries.push(...parsed.entries);
    rows.push(...parsed.rows);
    skipped += parsed.skipped;
    logEntries = parsed.entries.length;
  }
  const fragmentFiles = fragmentsPresent
    ? fs.readdirSync(fragmentDir).filter((name) => MARKDOWN.test(name)).sort()
    : [];
  for (const name of fragmentFiles) {
    const parsed = parseJournalText(fs.readFileSync(path.join(fragmentDir, name), "utf8"), {
      file: `${FRAGMENTS_REL}/${name}`,
      carrier: "fragment",
    });
    entries.push(...parsed.entries);
    rows.push(...parsed.rows);
    skipped += parsed.skipped;
  }

  const joined = rows.length === 0
    ? []
    : joinJournalRows(rows, buildCorpus(root, { resolveFold: () => null }).findings);

  const corrections = correctionClasses(joined);
  const sessions = sessionsPerUnit(entries);
  const falsePositives = joined.filter((row) => row.kind === "refuted").sort(byProvenance);
  const attributes = attributeJournalClasses(joined, { recurrence });

  const clusterCounts = new Map();
  for (const row of joined) {
    if (row.joined === null) continue;
    clusterCounts.set(row.joined, (clusterCounts.get(row.joined) ?? 0) + 1);
  }
  const signals = { corrections, sessions, falsePositives };
  const totalSignals = corrections.length + sessions.length + falsePositives.length;

  return {
    contract: JOURNAL_CORPUS_CONTRACT,
    log: { path: LOG_REL, present: logPresent, entries: logEntries },
    fragments: { path: FRAGMENTS_REL, present: fragmentsPresent, files: fragmentFiles.length },
    entryCount: entries.length,
    skipped,
    rows: joined,
    signals,
    attributes,
    join: {
      rows: joined.length,
      corpusRows: clusterCounts.size,
      clusters: [...clusterCounts.values()].filter((count) => count > 1).length,
      unjoined: joined.filter((row) => row.joined === null).length,
    },
    totalSignals,
    verdict: totalSignals === 0 ? "clean" : `signals ${totalSignals}`,
  };
}

const FALSE_POSITIVE_CELL = (row) =>
  row.joined === null
    ? `${row.unit ?? "no-unit"} ${row.finding ?? "no-finding"} · unjoined — ${row.reason}`
    : `${row.unit} ${row.finding} · joined ${row.joined}`;

/** The fixed receipt block: one line per read, per signal, per class, then the verdict. */
export function renderReceipt(result) {
  const lines = [JOURNAL_CORPUS_CONTRACT];
  lines.push(result.log.present ? `log | ${result.log.path} · entries ${result.log.entries}` : `log | absent · ${result.log.path}`);
  lines.push(
    result.fragments.present
      ? `fragments | ${result.fragments.path} · files ${result.fragments.files}`
      : `fragments | absent · ${result.fragments.path}`,
  );
  lines.push(`entries | ${result.entryCount} · skipped headings ${result.skipped}`);
  lines.push(
    `rows | ${result.rows.length} · corrections ${result.rows.filter((row) => row.kind === "correction").length} · refuted ${result.rows.filter((row) => row.kind === "refuted").length}`,
  );
  lines.push(
    `join | rows ${result.join.rows} · corpus-rows ${result.join.corpusRows} · clusters ${result.join.clusters} · unjoined ${result.join.unjoined}`,
  );
  for (const signal of result.signals.corrections) {
    // An unjoined class carries the reason it could not resolve — the receipt a
    // reader quotes must explain itself instead of hiding the gap in the model.
    lines.push(
      `signal — corrections · class ${signal.class} · n ${signal.n}${signal.reason === "" ? "" : ` · reason ${signal.reason}`}`,
    );
  }
  for (const signal of result.signals.sessions) {
    lines.push(`signal — sessions · unit ${signal.unit} · sessions ${signal.sessions}`);
  }
  for (const row of result.signals.falsePositives) {
    lines.push(`signal — false-positive · ${FALSE_POSITIVE_CELL(row)}`);
  }
  for (const row of result.attributes) {
    lines.push(
      row.proposal === null
        ? `attribute — ${row.axis} × ${row.klass} · n ${row.n} · phase unmapped · propose none`
        : `attribute — ${row.axis} × ${row.klass} · n ${row.n} · phase ${row.phase} · propose ${row.proposal}`,
    );
  }
  lines.push(`verdict | ${result.verdict}`);
  return `${lines.join("\n")}\n`;
}

const USAGE = "usage: journal-corpus.mjs [<dir> | --repo <dir>] [--recurrence <n>]";

function main(argv) {
  let root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  let positional = null;
  let recurrence = DEFAULT_RECURRENCE;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--repo" || arg === "--recurrence") {
      const value = argv[index + 1];
      if (value === undefined) {
        process.stderr.write(`journal-corpus: ${arg} needs a value\n${USAGE}\n`);
        return 2;
      }
      if (arg === "--repo") root = path.resolve(value);
      else {
        recurrence = Number(value);
        if (!Number.isInteger(recurrence) || recurrence < 1) {
          process.stderr.write(`journal-corpus: --recurrence needs a positive integer\n${USAGE}\n`);
          return 2;
        }
      }
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(`${USAGE}\n`);
      return 0;
    } else if (arg.startsWith("-")) {
      process.stderr.write(`journal-corpus: unknown argument ${arg}\n${USAGE}\n`);
      return 2;
    } else if (positional === null) {
      positional = arg;
      root = path.resolve(arg);
    } else {
      process.stderr.write(`journal-corpus: one directory at a time (${positional}, ${arg})\n${USAGE}\n`);
      return 2;
    }
  }

  const result = buildJournalCorpus(root, { recurrence });
  if (!result.log.present && !result.fragments.present) {
    result.verdict = "insufficient-input";
    process.stderr.write(`journal-corpus: neither ${LOG_REL} nor ${FRAGMENTS_REL}/ exists under ${root}\n`);
    process.stdout.write(renderReceipt(result));
    return 1;
  }
  process.stdout.write(renderReceipt(result));
  return 0;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) process.exitCode = main(process.argv.slice(2));
