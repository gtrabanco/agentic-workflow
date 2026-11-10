#!/usr/bin/env node
/**
 * findings-corpus.mjs — the reader the repo never had (issue #437, S2/S3/S4/S6/S10).
 *
 * Years of classified review findings sit in per-unit ledgers and had never been
 * aggregated once. This script joins both committed carriers into one corpus:
 *
 *   legacy     `docs/<kind>/<unit>/review-findings.md` — seven-column rows,
 *              `REVIEW-RAN` marks and the `· fold <sha>` annotation that
 *              `ledger-provenance.mjs` writes;
 *   migrated   the unit doc's `## Findings` table plus its `## Log` `F`/`R`/`V`
 *              lines (`skills/pre-execution-review/references/LEDGERS.md`).
 *
 * Nothing is re-derived: every row carries its `file:line` provenance and a
 * digest of the exact bytes it was parsed from. The script never writes.
 *
 * Three readings come out of the same corpus:
 *
 *   admission   CIVER's two halves as deterministic gates (S3): a `· fold <sha>`
 *               commit that actually touches the path the finding names, and
 *               recurrence of the same `class × axis` across distinct units.
 *               Rows that pass neither stay annotated data — the corpus keeps
 *               them and reports how many.
 *   attribution for each recurring class, the phase that should have caught it
 *               (triage / design / plan / gate) and the inventory row the
 *               migration would feed (S4). An unknown axis is reported
 *               `unmapped`, never bucketed.
 *   metrics     findings-per-cycle per unit and for the repository (S6), and the
 *               ARW code-net ratio — folded findings ÷ distinct code surfaces,
 *               `docs/` and lockfiles excluded — with its band (S10).
 *
 * Usage
 *   bun scripts/findings-corpus.mjs [--repo <dir>] [--json]
 *                                   [--min-recurrence <n>] [--threshold <n>]
 *
 * Exit: 0 a corpus was read; 1 an empty corpus or an unparsable ledger (a
 * required failure state, never a vacuous pass); 2 a usage error.
 */

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { sectionBounds } from "./unit-doc-phases.mjs";

export const CORPUS_CONTRACT = "findings-corpus@1";
export const DEFAULT_MIN_RECURRENCE = 2;
export const DEFAULT_THRESHOLD = 2;
/** The owner's stated baselines (issue #437 comment, 2026-11-06), reported beside
 *  the recomputed ratio and never substituted for it. */
export const ARW_OWNER_BASELINE = Object.freeze({ historical: 0.28, last30Days: 0.18 });

/** The three normalized bands. The published ladder owns the tokens; this is
 *  the coarse grouping a legacy cell can be mapped to without inventing one. */
export const SEVERITY_BANDS = Object.freeze({ blocker: true, material: true, "below-floor": true });

const BLOCKER_TOKENS = new Set(["blocker"]);
const MATERIAL_TOKENS = new Set(["critical", "warning", "high", "major", "med", "medium"]);
const BELOW_FLOOR_TOKENS = new Set(["suggestion", "low", "minor", "info", "trivial"]);

/** `axis → phase` for the axes the corpus carries. `null` means the map does not
 *  know the axis: reported `unmapped`, never guessed (decision D8). */
const AXIS_PHASE = Object.freeze({
  code: "gate",
  correctness: "gate",
  verify: "gate",
  security: "gate",
  perf: "gate",
  performance: "gate",
  debt: "gate",
  test: "gate",
  tests: "gate",
  workflow: "triage",
  product: "triage",
  "spec-drift": "design",
  design: "design",
  brand: "design",
  a11y: "design",
  ux: "design",
  docs: "design",
  plan: "plan",
});

/** Where an attributed phase's migration proposal lands. */
const PHASE_DESTINATION = Object.freeze({
  triage: "docs/workflow/GATE_INVENTORY.md (carrier: prose — the triage checklist row)",
  design: "docs/workflow/GATE_INVENTORY.md (carrier: cli — a design-time reader)",
  plan: "docs/workflow/GATE_INVENTORY.md (carrier: script — the plan validators)",
  gate: "docs/workflow/GATE_INVENTORY.md (carrier: script — a root-suite gate)",
});

const LOCKFILES = /(^|\/)(bun\.lock|package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/;
const ROW_LEGACY = /^\| (F\d+) \|/;
const ROW_PENDING = /^\|\s*(F\d+|\d+)\s*\|/;
const TABLE_HEADER = /^\|\s*id\s*\|\s*file:line\s*\|/;
const TABLE_SEPARATOR = /^\|[-:| ]+\|$/;
const MARK_REVIEW = /^\|\s*REVIEW-RAN\s*\|/;
const MARK_VERIFIED = /^\|\s*VF-\d+\s*\|/;
const CYCLE_LINE = /^Cycle\s+(\d+)\s*[—–-]/;
const FOLD_ANNOTATION = /·\s*fold\s+([0-9a-f]{7,40})/;
const LOG_FOLD = /^-\s*\*\*F(\d+)\*\*.*?·\s*fold\s+([0-9a-f]{7,40})/;
const LOG_REVIEW = /^-\s*\*\*R\d+\*\*/;
const LOG_FINDING = /^-\s*\*\*V\d+\*\*/;

function fail(code, message) {
  process.stderr.write(`findings-corpus: ${message}\n`);
  process.exit(code);
}

/** The stable 12-hex provenance digest of the bytes a row was parsed from. */
export function digestOf(text) {
  return createHash("sha256").update(String(text), "utf8").digest("hex").slice(0, 12);
}

export function severityBandOf(token) {
  const value = String(token ?? "").trim().toLowerCase();
  if (BLOCKER_TOKENS.has(value)) return "blocker";
  if (MATERIAL_TOKENS.has(value)) return "material";
  if (BELOW_FLOOR_TOKENS.has(value)) return "below-floor";
  return "below-floor";
}

/** The first axis token: legacy cells carry free text (`code / spec-drift`,
 *  `correctness + verify`), and the first named axis is the axis that found it. */
export function primaryAxisOf(cell) {
  const first = String(cell ?? "")
    .split(/[+,/]/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)[0];
  return first ?? "unclassified";
}

export function phaseOfAxis(axis) {
  return AXIS_PHASE[String(axis ?? "").toLowerCase()] ?? null;
}

/** The path a finding names: `file:line`, `file:line-range`, or a fenced path. */
function pathOfTarget(cell) {
  const raw = String(cell ?? "").replace(/`/g, "").trim();
  const afterArrow = raw.includes(" · ") ? raw.split(" · ").pop() : raw;
  const candidate = afterArrow.split(/\s+/)[0];
  const withoutLine = candidate.replace(/:\d+(-\d+)?$/, "");
  return withoutLine.replace(/[,;]+$/, "");
}

function isCodeSurface(relPath) {
  if (!relPath) return false;
  if (relPath.startsWith("docs/")) return false;
  if (LOCKFILES.test(relPath)) return false;
  return true;
}

function cellOf(line) {
  return line.split("|").slice(1, -1).map((cell) => cell.trim());
}

/** Split a table row into trimmed cells, honouring escaped pipes (`\\|`). */
function rowCells(line) {
  return line
    .replace(/\\\|/g, "\\u0000")
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.replace(/\\u0000/g, "|").trim());
}

/** Column map from a table's own header row: `<normalized name> -> index`. */
function columnsOf(headerLine) {
  const cells = rowCells(headerLine);
  const map = {};
  cells.forEach((cell, index) => {
    const name = cell.toLowerCase();
    if (/^id$/.test(name)) map.id = index;
    if (name.includes("file:line")) map.target = index;
    if (name === "axis") map.axis = index;
    if (name === "severity") map.severity = index;
    if (name === "impact") map.impact = index;
    if (name === "class") map.klass = index;
    if (name === "route") map.route = index;
    if (name === "folded") map.folded = index;
  });
  return map;
}

/**
 * Parse one legacy ledger. A ledger may carry several tables — the findings
 * table and, later, prose tables such as a fold receipt whose first column is
 * also `F<n>` (`docs/features/27-pi-agentic-workflow`). A block is a findings
 * table only when its own header names a `file:line` column; every other block
 * is prose and is never counted as a finding.
 */
export function parseLegacyLedger(text, { file, unit }) {
  const findings = [];
  const unparsable = [];
  let reviewMarks = 0;
  let verifiedMarks = 0;
  let malformed = 0;
  let cycle = 1;
  const lines = String(text).split("\n");

  lines.forEach((line, index) => {
    const cycleMatch = line.match(CYCLE_LINE);
    if (cycleMatch) cycle = Number(cycleMatch[1]);
    if (!line.startsWith("|")) return;
    if (MARK_REVIEW.test(line)) {
      reviewMarks += 1;
      return;
    }
    if (MARK_VERIFIED.test(line)) {
      verifiedMarks += 1;
      return;
    }
    if (!ROW_LEGACY.test(line)) return;

    // A finding row is identified by its own published shape — seven cells whose
    // last is the `folded` flag — never by the table it happens to sit under.
    // Ledgers carry prose tables whose first column is also `F<n>` (a fold
    // receipt, three cells), and the shape is what separates them. A finding-
    // shaped row that fails the shape is a parse defect, never a silent drop.
    const cells = rowCells(line);
    if (cells.length < 7 || !/^(yes|no)\b/i.test(cells[cells.length - 1])) {
      malformed += 1;
      return;
    }
    const [id, target, axis, severity, klass, route] = cells;
    const foldSha = (route.match(FOLD_ANNOTATION) || [])[1] || null;
    findings.push({
      unit,
      carrier: "legacy",
      id,
      carrierId: id,
      provenance: `${file}:${index + 1}`,
      digest: digestOf(line),
      target,
      path: pathOfTarget(target),
      axis: primaryAxisOf(axis),
      axisRaw: axis,
      severity,
      band: severityBandOf(severity),
      klass: klass || "unclassified",
      routeHead: String(route.split("·")[0]).trim(),
      folded: /^yes\b/i.test(cells[cells.length - 1]),
      foldSha,
      cycle,
      verified: false,
    });
  });

  if (malformed > 0 && findings.length === 0) {
    unparsable.push({ file, line: 1, reason: `findings table has no parseable F row (${malformed} malformed)` });
  }

  return { findings, reviewMarks, verifiedMarks, unparsable };
}

/** Parse a migrated unit doc: its `## Findings` table and its `## Log` marks. */
export function parseMigratedCarrier(text, { file, unit }) {
  const source = String(text);
  const lines = source.split("\n");
  const findings = [];
  const unparsable = [];
  const foldByFinding = new Map();
  let reviewMarks = 0;
  let verifiedMarks = 0;
  let cycle = 1;

  // The one fence-aware reader owns section bounds (#308 F28/F39); this parser
  // never searches for a heading itself.
  const range = sectionBounds(source, "Findings");
  if (range === null) {
    return { findings, reviewMarks, verifiedMarks, unparsable, migratedRows: 0 };
  }
  const lineOf = (offset) => source.slice(0, offset).split("\n").length - 1;
  const startLine = lineOf(range[0]);
  const endLine = lineOf(range[1]);

  let columns = null;
  for (let index = startLine + 1; index < endLine; index += 1) {
    const line = lines[index];
    if (!line.startsWith("|")) {
      columns = null;
      continue;
    }
    if (columns === null) {
      columns = columnsOf(line);
      continue;
    }
    if (TABLE_SEPARATOR.test(line)) continue;
    if (columns.target === undefined || columns.id === undefined) continue;
    if (!/^\|\s*F\d+\s*\|/.test(line)) continue;
    const cells = rowCells(line);
    const pick = (key) => (columns[key] === undefined ? "" : cells[columns[key]] ?? "");
    const severity = pick("severity");
    findings.push({
      unit,
      carrier: "migrated",
      id: pick("id"),
      carrierId: pick("id"),
      provenance: `${file}:${index + 1}`,
      digest: digestOf(line),
      target: pick("target"),
      path: pathOfTarget(pick("target")),
      axis: primaryAxisOf(pick("axis")),
      axisRaw: pick("axis"),
      severity,
      band: severityBandOf(severity),
      impact: pick("impact"),
      klass: pick("klass") || "unclassified",
      // In the migrated carrier a folded row leaves the table, so an OPEN row's
      // `fold` route is a destination, never a receipt: only a `## Log` `F` line
      // proves the repair.
      routeHead: String(pick("route").split("·")[0]).trim(),
      folded: false,
      foldSha: null,
      cycle,
      verified: false,
    });
  }

  const logRange = sectionBounds(source, "Log");
  if (logRange !== null) {
    const logStart = lineOf(logRange[0]);
    const logEnd = lineOf(logRange[1]);
    for (let index = logStart + 1; index < logEnd; index += 1) {
      const line = lines[index];
      const reviewCycle = line.match(/cycle\s+(\d+)/i);
      if (LOG_REVIEW.test(line)) {
        reviewMarks += 1;
        if (reviewCycle) cycle = Number(reviewCycle[1]);
        continue;
      }
      if (LOG_FINDING.test(line)) {
        verifiedMarks += 1;
        continue;
      }
      const fold = line.match(LOG_FOLD);
      if (fold) foldByFinding.set(`F${fold[1]}`, fold[2]);
    }
  }

  for (const row of findings) {
    const sha = foldByFinding.get(row.id);
    if (sha) {
      row.foldSha = sha;
      row.folded = true;
    }
  }

  return { findings, reviewMarks, verifiedMarks, unparsable, migratedRows: findings.length };
}

/** The unit directories that carry bytes this reader understands. */
export function discoverUnits(root) {
  const units = [];
  for (const kind of ["features", "fix"]) {
    const dir = path.join(root, "docs", kind);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const unitDir = path.join(dir, entry.name);
      const spec = path.join(unitDir, "SPEC.md");
      const legacy = path.join(unitDir, "review-findings.md");
      const hasSpec = fs.existsSync(spec);
      const hasLedger = fs.existsSync(legacy);
      if (!hasSpec && !hasLedger) continue;
      units.push({
        unit: entry.name,
        kind: kind === "features" ? "feature" : "fix",
        dir: unitDir,
        spec,
        legacy,
        hasSpec,
        hasLedger,
      });
    }
  }
  return units;
}

/** Fold gate: does `sha` resolve, and does its own diff touch `relPath`?
 *
 * The history is read once (`git log --format=%H --name-only`) instead of once
 * per annotation: a corpus of 229 annotations over 118 commits would otherwise
 * cost 236 subprocesses, and the reader runs on every push. */
export function makeGitFoldResolver(root) {
  const history = new Map();
  const byShort = new Map();

  const ingest = (text) => {
    let current = null;
    for (const line of String(text).split("\n")) {
      if (line.startsWith("\u0000")) {
        current = line.slice(1).trim();
        if (!history.has(current)) history.set(current, []);
        byShort.set(current.slice(0, 7), current);
        continue;
      }
      const rel = line.trim();
      if (current && rel) history.get(current).push(rel);
    }
  };

  /** Two subprocesses for every annotation: resolve the abbreviations in one
   *  `cat-file --batch-check` (one unprovable short sha must not fail the rest),
   *  then read only those commits with `--no-walk`. */
  const warm = (shas) => {
    const pending = [...new Set(shas)].filter((sha) => sha && !byShort.has(sha.slice(0, 7)));
    if (pending.length === 0) return;
    const check = spawnSync("git", ["-C", root, "cat-file", "--batch-check"], {
      encoding: "utf8",
      input: `${pending.join("\n")}\n`,
      maxBuffer: 64 * 1024 * 1024,
    });
    if (check.status !== 0) return;
    const full = [];
    for (const line of check.stdout.split("\n")) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3 && parts[1] === "commit") full.push(parts[0]);
    }
    if (full.length === 0) return;
    const show = spawnSync(
      "git",
      ["-C", root, "log", "--no-walk", "--no-renames", "--format=%x00%H", "--name-only", ...full],
      { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
    );
    if (show.status === 0) ingest(show.stdout);
  };

  const resolver = (row) => {
    if (!row.foldSha) return null;
    let full = history.has(row.foldSha) ? row.foldSha : byShort.get(row.foldSha.slice(0, 7)) ?? null;
    if (!full) {
      const resolved = spawnSync("git", ["-C", root, "rev-parse", "--verify", "--quiet", `${row.foldSha}^{commit}`], {
        encoding: "utf8",
      });
      if (resolved.status !== 0) return { sha: row.foldSha, paths: null };
      full = resolved.stdout.trim();
      const show = spawnSync("git", ["-C", root, "show", "--name-only", "--no-renames", "--format=", full], {
        encoding: "utf8",
      });
      if (show.status === 0) history.set(full, show.stdout.split("\n").map((p) => p.trim()).filter(Boolean));
      byShort.set(full.slice(0, 7), full);
    }
    return { sha: full, paths: history.get(full) ?? null };
  };
  resolver.warm = warm;
  return resolver;
}

/**
 * CIVER's two halves, both deterministic and both required:
 *   1. targeted-repair-resolution — the fold commit touches the named path;
 *   2. stability-under-unrelated-changes — the pair recurs across units.
 */
export function admit(rows, { minRecurrence = DEFAULT_MIN_RECURRENCE, resolveFold = () => null } = {}) {
  const unitsByClass = new Map();
  for (const row of rows) {
    const key = `${row.klass}×${row.axis}`;
    if (!unitsByClass.has(key)) unitsByClass.set(key, new Set());
    unitsByClass.get(key).add(row.unit);
  }

  return rows.map((row) => {
    const key = `${row.klass}×${row.axis}`;
    const unitCount = unitsByClass.get(key).size;
    const recurrencePass = unitCount >= minRecurrence;

    let repairPass = false;
    const gateReasons = [];
    if (!row.folded || !row.foldSha) {
      gateReasons.push("no fold commit recorded");
    } else {
      const fold = resolveFold(row);
      if (!fold || !fold.sha) {
        gateReasons.push(`fold ${row.foldSha} does not resolve`);
      } else if (!fold.paths) {
        gateReasons.push(`fold ${row.foldSha} has no readable diff`);
      } else if (!fold.paths.includes(row.path)) {
        gateReasons.push(`fold commit does not touch ${row.path}`);
      } else {
        repairPass = true;
      }
    }
    if (!recurrencePass) gateReasons.push(`recurrence ${unitCount} < ${minRecurrence}`);

    if (repairPass && recurrencePass) {
      return { ...row, status: "admitted", reason: `repaired by ${row.foldSha} and recurring across ${unitCount} units` };
    }
    return { ...row, status: "annotated", reason: `${gateReasons.join("; ")} — annotated data` };
  });
}

/** Group admitted rows by `class × axis` and name the phase that should have
 *  caught each recurring class, with the inventory row its migration feeds. */
export function attribute(rows, { threshold = DEFAULT_THRESHOLD } = {}) {
  const groups = new Map();
  for (const row of rows) {
    if (row.status !== "admitted") continue;
    const key = `${row.klass}×${row.axis}`;
    if (!groups.has(key)) {
      groups.set(key, { klass: row.klass, axis: row.axis, n: 0, units: new Set(), examples: [] });
    }
    const group = groups.get(key);
    group.n += 1;
    group.units.add(row.unit);
    if (group.examples.length < 3) group.examples.push(row.provenance);
  }

  return [...groups.values()]
    .filter((group) => group.n >= threshold)
    .map((group) => {
      const phase = phaseOfAxis(group.axis);
      return {
        klass: group.klass,
        axis: group.axis,
        n: group.n,
        units: group.units.size,
        phase: phase ?? "unmapped",
        proposal: phase ? PHASE_DESTINATION[phase] : null,
        examples: group.examples,
      };
    })
    .sort((a, b) => b.n - a.n || a.axis.localeCompare(b.axis));
}

export function arwBand(measuredUnits) {
  return measuredUnits >= 3 ? "measured" : "insufficient-corpus";
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

/**
 * Read the whole tree and return the corpus plus every reading the CLI prints.
 * Pure apart from `resolveFold` and the file reads; writes nothing.
 */
export function buildCorpus(root, { resolveFold = () => null, minRecurrence = DEFAULT_MIN_RECURRENCE, threshold = DEFAULT_THRESHOLD } = {}) {
  const units = discoverUnits(root);
  const findings = [];
  const unparsable = [];
  const marksByUnit = new Map();
  let legacyLedgers = 0;
  let migratedCarriers = 0;
  let reviewMarks = 0;

  for (const entry of units) {
    if (entry.hasLedger) {
      legacyLedgers += 1;
      const parsed = parseLegacyLedger(fs.readFileSync(entry.legacy, "utf8"), {
        file: path.relative(root, entry.legacy),
        unit: entry.unit,
      });
      findings.push(...parsed.findings);
      reviewMarks += parsed.reviewMarks;
      marksByUnit.set(entry.unit, (marksByUnit.get(entry.unit) || 0) + parsed.reviewMarks);
      unparsable.push(...parsed.unparsable);
    }
    if (entry.hasSpec) {
      const text = fs.readFileSync(entry.spec, "utf8");
      if (sectionBounds(text, "Findings") !== null) {
        migratedCarriers += 1;
        const parsed = parseMigratedCarrier(text, { file: path.relative(root, entry.spec), unit: entry.unit });
        findings.push(...parsed.findings);
        reviewMarks += parsed.reviewMarks;
        marksByUnit.set(entry.unit, (marksByUnit.get(entry.unit) || 0) + parsed.reviewMarks);
        unparsable.push(...parsed.unparsable);
      }
    }
  }

  if (typeof resolveFold.warm === "function") {
    resolveFold.warm(findings.map((row) => row.foldSha).filter(Boolean));
  }
  const rows = admit(findings, { minRecurrence, resolveFold });
  const admitted = rows.filter((row) => row.status === "admitted");
  const classes = attribute(rows, { threshold });

  // Health metric: cycles come from the review marks the ledgers already carry;
  // a unit with findings but no mark spent at least one cycle.
  //
  // ARW code-net (S10): eliminations are the findings this unit's own fold
  // commits repaired, and the denominator is the distinct code surfaces those
  // commits touched — not the paths the findings name, which would inflate the
  // ratio by construction (planning-evidence PE-014).
  const perUnit = new Map();
  for (const row of rows) {
    if (!perUnit.has(row.unit)) {
      perUnit.set(row.unit, { unit: row.unit, findings: 0, cycles: 0, eliminated: 0, surfaces: new Set() });
    }
    const stat = perUnit.get(row.unit);
    stat.findings += 1;
    stat.cycles = Math.max(stat.cycles, row.cycle || 1, marksByUnit.get(row.unit) || 0);
    if (row.status === "admitted") stat.eliminated += 1;
    if (row.foldSha) {
      const fold = resolveFold(row);
      for (const relPath of fold && fold.paths ? fold.paths : []) {
        if (isCodeSurface(relPath)) stat.surfaces.add(relPath);
      }
    }
  }
  for (const stat of perUnit.values()) {
    if (stat.cycles === 0) stat.cycles = 1;
  }
  const totalCycles = [...perUnit.values()].reduce((sum, stat) => sum + stat.cycles, 0);

  const arw = [...perUnit.values()]
    .map((stat) => {
      const surfaces = [...stat.surfaces].sort();
      const ratio = surfaces.length === 0 ? null : round2(stat.eliminated / surfaces.length);
      return { unit: stat.unit, eliminations: stat.eliminated, surfaces, ratio };
    })
    .sort((a, b) => a.unit.localeCompare(b.unit));

  const measurable = arw.filter((row) => row.ratio !== null);
  const repoArw = measurable.length === 0
    ? null
    : round2(measurable.reduce((sum, row) => sum + row.eliminations, 0) / measurable.reduce((sum, row) => sum + row.surfaces.length, 0));

  return {
    contract: CORPUS_CONTRACT,
    units,
    findings: rows,
    unparsable,
    legacyLedgers,
    migratedCarriers,
    reviewMarks,
    foldAnnotated: rows.filter((row) => row.foldSha).length,
    admitted,
    annotated: rows.length - admitted.length,
    classes,
    arw,
    arwBand: arwBand(measurable.length),
    arwMeasuredUnits: measurable.length,
    repoArw,
    findingsPerCycle: totalCycles === 0 ? 0 : round2(rows.length / totalCycles),
    perUnit: [...perUnit.values()]
      .map((stat) => ({ unit: stat.unit, findings: stat.findings, cycles: stat.cycles, perCycle: round2(stat.findings / stat.cycles) }))
      .sort((a, b) => b.perCycle - a.perCycle || a.unit.localeCompare(b.unit)),
  };
}

function block(corpus) {
  const lines = [
    CORPUS_CONTRACT,
    `units | ${corpus.units.length}`,
    `legacy-ledgers | ${corpus.legacyLedgers}`,
    `migrated-carriers | ${corpus.migratedCarriers}`,
    `findings | ${corpus.findings.length}`,
    `review-marks | ${corpus.reviewMarks}`,
    `fold-annotated | ${corpus.foldAnnotated}`,
    `admitted | ${corpus.admitted.length}`,
    `annotated | ${corpus.annotated}`,
    `repeat-classes | ${corpus.classes.length}`,
    `findings-per-cycle | ${corpus.findingsPerCycle.toFixed(2)}`,
    `arw | ${corpus.repoArw === null ? "n/a" : corpus.repoArw.toFixed(2)}`,
    `arw-band | ${corpus.arwBand}`,
    `severity-band — blocker · n ${corpus.findings.filter((row) => row.band === "blocker").length}`,
    `severity-band — material · n ${corpus.findings.filter((row) => row.band === "material").length}`,
    `severity-band — below-floor · n ${corpus.findings.filter((row) => row.band === "below-floor").length}`,
  ];

  for (const row of corpus.classes) {
    lines.push(
      row.proposal
        ? `attribute — ${row.axis} × ${row.klass} · n ${row.n} · phase ${row.phase} · propose ${row.proposal}`
        : `attribute — ${row.axis} × ${row.klass} · n ${row.n} · phase unmapped · propose none`,
    );
  }

  lines.push(
    `baseline — owner ${ARW_OWNER_BASELINE.historical.toFixed(2)} historical / ${ARW_OWNER_BASELINE.last30Days.toFixed(2)} last-30d · recomputed ${corpus.repoArw === null ? "n/a" : corpus.repoArw.toFixed(2)} · band ${corpus.arwBand} · measured-units ${corpus.arwMeasuredUnits}`,
  );

  for (const stat of corpus.perUnit) {
    lines.push(`unit — ${stat.unit} · cycles ${stat.cycles} · findings ${stat.findings} · per-cycle ${stat.perCycle.toFixed(2)}`);
  }

  return `${lines.join("\n")}\n`;
}

const USAGE = "usage: findings-corpus.mjs [--repo <dir>] [--json] [--min-recurrence <n>] [--threshold <n>]";

function parseArgs(argv) {
  const opts = { repo: null, json: false, minRecurrence: DEFAULT_MIN_RECURRENCE, threshold: DEFAULT_THRESHOLD };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--json") opts.json = true;
    else if (arg === "--repo") opts.repo = argv[++i];
    else if (arg === "--min-recurrence") opts.minRecurrence = Number(argv[++i]);
    else if (arg === "--threshold") opts.threshold = Number(argv[++i]);
    else if (arg === "--help" || arg === "-h") return { help: true };
    else return { error: `unknown argument ${arg}` };
  }
  if (opts.repo !== null && typeof opts.repo !== "string") return { error: "--repo needs a directory" };
  if (!Number.isInteger(opts.minRecurrence) || opts.minRecurrence < 1) return { error: "--min-recurrence needs a positive integer" };
  if (!Number.isInteger(opts.threshold) || opts.threshold < 1) return { error: "--threshold needs a positive integer" };
  return { opts };
}

function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }
  if (parsed.error) fail(2, `${parsed.error}\n${USAGE}`);

  const root = parsed.opts.repo
    ? path.resolve(parsed.opts.repo)
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const corpus = buildCorpus(root, {
    resolveFold: makeGitFoldResolver(root),
    minRecurrence: parsed.opts.minRecurrence,
    threshold: parsed.opts.threshold,
  });

  if (corpus.unparsable.length > 0) {
    const detail = corpus.unparsable.map((row) => `${row.file}:${row.line} — ${row.reason}`).join("\n");
    fail(1, `unparsable findings rows:\n${detail}`);
  }
  if (corpus.findings.length === 0) {
    fail(1, `empty corpus — no finding row was read under ${root}`);
  }

  if (parsed.opts.json) {
    process.stdout.write(`${JSON.stringify(corpus, null, 2)}\n`);
    return;
  }
  process.stdout.write(block(corpus));
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main(process.argv.slice(2));
