/**
 * findings.mjs — ceremony `findings` module (issue #338 P0; rewired by #702).
 *
 * CRUD on the findings carrier. Two carriers, one read path (LEDGERS.md): a
 * unit doc with a `## Findings` section is the migrated `findings-table@1`
 * carrier (read + write); a unit without one falls back to the legacy
 * `review-findings.md` side ledger (read-only — a legacy unit is never
 * rewritten). The grammars themselves have one owner —
 * `../findings-carrier.mjs` — and this module reads through it, so no cell is
 * ever mapped by position.
 *
 * **A write splices the table, never the section.** The carrier keeps
 * report-only material as prose beside its table (`findings-table@1`), and a
 * rebuilt section is exactly how that prose used to disappear (issue #702 S2).
 *
 * **A closed row keeps its identity.** A fold appends an `F` line numbered with
 * the finding it closed, `append` accepts an explicit `--id`, and the next id is
 * allocated from the carrier's own rows and fold lines — never from prose that
 * merely cites an older id (issue #702 S3).
 *
 * The severity and impact cells are closed vocabularies and this module is one
 * of their writers, so both are validated against the published sets before a
 * byte is written: an off-vocabulary token is `unknown-vocabulary`, never a
 * malformed row that the probe has to find later. The sets come from the
 * canonical declaration (the built schema runtime), never a second copy here.
 */

import fs from "node:fs";
import path from "node:path";
import {
  out, fail, onlyFlags, parseFlags, resolveUnit, replaceSection, deleteSection,
  parseFindings, parseLog, readSection, appendLogLine, today,
} from "../lib.mjs";
import {
  readCarrier, parseCarrierBody, spliceFindingsTable, grammarDefect,
  CURRENT_FINDINGS_GRAMMAR, LEDGER_FINDINGS_GRAMMAR,
} from "../findings-carrier.mjs";
import { FINDINGS_TABLE_SEVERITIES, FINDINGS_TABLE_IMPACTS } from "@gtrabanco/agentic-workflow-schema";

/** Highest-first merge order across both carriers: the ladder, then the legacy
 *  ledger aliases a pre-#308 unit still carries (read-only, never written). */
const SEVERITY_RANK = {
  BLOCKER: 6, CRITICAL: 5, WARNING: 4, SUGGESTION: 3,
  critical: 5, high: 5, medium: 3, med: 3, low: 2, info: 1,
};

/** Refuse a token the published set does not carry, naming the cell and the set. */
function requireVocabulary(value, set, flag) {
  if (!set.includes(value)) fail("unknown-vocabulary", { flag: `--${flag}`, value, allowed: set.join("|") });
}

/** Resolve the unit's findings carrier: the migrated doc table or the legacy side file. */
export function findingsCarrier(slug, cwd) {
  const unit = resolveUnit(slug, cwd);
  const md = fs.readFileSync(unit.specPath, "utf8");
  const legacyPath = path.join(unit.dir, "review-findings.md");
  const ledgerText = fs.existsSync(legacyPath) ? fs.readFileSync(legacyPath, "utf8") : null;
  const carrier = readCarrier({
    docText: md,
    ledgerText,
    docPath: path.relative(cwd, unit.specPath) || unit.specPath,
    ledgerPath: path.relative(cwd, legacyPath) || legacyPath,
  });
  return { ...unit, root: cwd, md, legacyPath, ledgerText, ...carrier };
}

/** A defect this surface refuses to answer past. */
const FATAL_ON_READ = new Set(["dual-carrier", "wrong-carrier-grammar", "unknown-grammar"]);
const FATAL_ON_WRITE = new Set(["dual-carrier", "wrong-carrier-grammar", "unknown-grammar", "carrier-table-missing", "superseded-grammar"]);

/** The defect's own code, with the carrier's facts — one refusal shape for every op. */
function refuse(defect, c) {
  const root = c.root ?? process.cwd();
  const code = defect.code === "dual-carrier" ? "dual-findings-carrier" : defect.code;
  fail(code, {
    slug: path.basename(c.dir),
    path: code === "dual-findings-carrier" ? undefined : path.relative(root, c.specPath),
    ...(defect.grammar === null || defect.grammar === undefined ? {} : { grammar: defect.grammar }),
    ...(defect.expected === undefined ? {} : { expected: defect.expected }),
    ...(defect.line === undefined ? {} : { line: defect.line }),
    detail: defect.detail,
    ...(code === "carrier-table-missing" ? { section: "Findings" } : {}),
    ...(code === "dual-findings-carrier" ? { paths: [path.relative(root, c.specPath), path.relative(root, c.legacyPath)] } : {}),
  });
}

/** Stop before reading or writing a carrier whose shape cannot be trusted. */
function requireCarrier(c, { write = false, legacy = false } = {}) {
  const fatal = write ? FATAL_ON_WRITE : FATAL_ON_READ;
  const defect = c.defects.find((entry) => fatal.has(entry.code));
  if (defect) refuse(defect, c);
  if (write && legacy && c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: path.basename(c.dir), path: c.legacyPath });
  if (write && c.grammar !== CURRENT_FINDINGS_GRAMMAR) {
    const mismatch = grammarDefect(c.grammar, CURRENT_FINDINGS_GRAMMAR) ?? { code: "carrier-table-missing", detail: "the carrier carries no findings table" };
    refuse(mismatch, c);
  }
}

/** The rows of a writable carrier, through the one parser. */
function carrierRows(c) {
  const body = readSection(c.md, "findings");
  if (body == null) return [];
  return parseCarrierBody(body).rows;
}

/**
 * Write the carrier's rows back, splicing the table and keeping every other byte
 * of the section. A section whose table is missing is refused before any write.
 */
function writeRows(c, rows) {
  const body = readSection(c.md, "findings");
  const root = c.root ?? process.cwd();
  if (body == null) fail("carrier-table-missing", { path: path.relative(root, c.specPath), section: "Findings" });
  const spliced = spliceFindingsTable(body, rows);
  if (!spliced.ok) fail("carrier-table-missing", { path: path.relative(root, c.specPath), section: "Findings", detail: spliced.defect.detail });
  fs.writeFileSync(c.specPath, replaceSection(c.md, "findings", spliced.body));
}

/** A finding id as the carrier writes it: `F<n>`. */
const normalizeId = (value) => (String(value).match(/^F/u) ? String(value) : `F${value}`);

/** Every id the carrier has already used: its open rows and its fold lines. */
function usedIds(c, rows) {
  const ids = new Set(rows.map((row) => row.id));
  for (const mark of parseLog(c.md)) {
    if (mark.kind === "F") ids.add(`F${mark.n}`);
  }
  return ids;
}

/** The next free id: one past the highest the carrier ever used, never a prose mention. */
function nextId(c, rows) {
  let highest = 0;
  for (const id of usedIds(c, rows)) {
    const numeric = Number(String(id).replace(/^F/u, ""));
    if (Number.isInteger(numeric) && numeric > highest) highest = numeric;
  }
  return `F${highest + 1}`;
}

/** The fold line's own words: the id it closed, its axis, its target, its cells. */
function foldLineText(row, cells) {
  const edited = cells.length ? ` · ${cells.map((key) => `${key}: ${row[key]}`).join(" · ")}` : "";
  return `folded ${row.id} (${row.axis}): ${row.target} — folded: yes${edited}`;
}

/**
 * One row as the CLI reports it. The carrier's own shape is the answer: a
 * migrated row carries `impact` and no `folded` cell, a legacy row carries its
 * `folded` flag as the boolean it always was. The grammar is reported beside
 * them, never inferred by the reader.
 */
function reportedRow(row, carrier) {
  if (carrier === "legacy") {
    return { id: row.id, target: row.target, axis: row.axis, severity: row.severity, class: row.class, route: row.route, folded: String(row.folded ?? "").trim() === "yes" };
  }
  return { id: row.id, target: row.target, axis: row.axis, severity: row.severity, impact: row.impact, class: row.class, route: row.route };
}

export function findings(op, argv, cwd = process.cwd()) {
  const flags = parseFlags(argv, ["slug", "id", "ids", "file", "line", "target", "axis", "severity", "impact", "class", "route", "folded", "section"], ["slug"]);
  const c = findingsCarrier(flags.slug, cwd);

  switch (op) {
    case "append": {
      onlyFlags(flags, ["id", "file", "line", "target", "axis", "severity", "impact", "class", "route"]);
      requireCarrier(c, { write: true, legacy: true });
      for (const r of ["axis", "severity", "impact", "class", "route"]) {
        if (!flags[r]) fail("missing-flag", { flag: `--${r}` });
      }
      requireVocabulary(flags.severity, FINDINGS_TABLE_SEVERITIES, "severity");
      requireVocabulary(flags.impact, FINDINGS_TABLE_IMPACTS, "impact");
      if (flags.severity === "BLOCKER" && flags.impact === "report-only") {
        fail("blocker-cannot-be-advisory", { severity: flags.severity, impact: flags.impact });
      }
      if (!flags.target && !flags.file) fail("missing-flag", { flag: "--target | --file" });
      const rows = carrierRows(c);
      const requested = flags.id === undefined ? null : normalizeId(flags.id);
      if (requested !== null && !/^F\d+$/u.test(String(requested))) fail("invalid-finding-id", { id: String(flags.id), expected: "F<n>" });
      const used = usedIds(c, rows);
      if (requested !== null && used.has(requested)) fail("duplicate-finding-id", { id: requested, used: [...used].sort((left, right) => Number(left.slice(1)) - Number(right.slice(1))) });
      const id = requested ?? nextId(c, rows);
      const target = flags.target ?? `${flags.file}${flags.line ? `:${flags.line}` : ""}`;
      const row = { id, target, axis: flags.axis, severity: flags.severity, impact: flags.impact, class: flags.class, route: flags.route };
      writeRows(c, [...rows, row]);
      out({ appended: true, slug: flags.slug, finding: row, carrier: c.carrier === "doc" ? "unit-doc" : c.carrier, grammar: c.grammar });
    }
    case "read": {
      onlyFlags(flags, []);
      requireCarrier(c);
      const findings = c.rows.map((row) => reportedRow(row, c.carrier));
      if (c.carrier === "legacy") {
        out({ slug: flags.slug, carrier: "legacy", grammar: c.grammar, path: "review-findings.md", defects: c.defects, findings });
      }
      out({ slug: flags.slug, carrier: c.carrier === "doc" ? "unit-doc" : c.carrier, grammar: c.grammar, defects: c.defects, findings });
    }
    case "update": {
      onlyFlags(flags, ["id", "severity", "impact", "class", "route", "folded"]);
      requireCarrier(c, { write: true, legacy: true });
      if (!flags.id) fail("missing-flag", { flag: "--id" });
      const rows = carrierRows(c);
      const row = rows.find((r) => r.id === normalizeId(flags.id));
      if (!row) fail("unknown-finding", { id: flags.id, slug: flags.slug });
      // Every cell flag applies, folded or not: the issue's own example passes
      // `--severity` and `--folded true` together, so folding after the edit and
      // echoing both is the contract — never silently dropping one of them.
      if (flags.severity) requireVocabulary(flags.severity, FINDINGS_TABLE_SEVERITIES, "severity");
      if (flags.impact) requireVocabulary(flags.impact, FINDINGS_TABLE_IMPACTS, "impact");
      const cells = ["severity", "impact", "class", "route"].filter((k) => flags[k]);
      for (const k of cells) row[k] = flags[k];
      const applied = Object.fromEntries(cells.map((k) => [k, row[k]]));
      if (flags.folded === "true") {
        const body = readSection(c.md, "findings");
        const spliced = body == null ? { ok: false } : spliceFindingsTable(body, rows.filter((r) => r !== row));
        if (!spliced.ok) fail("carrier-table-missing", { path: path.relative(c.root ?? process.cwd(), c.specPath), section: "Findings" });
        // The fold line's number IS the id it closed: one identity, one namespace.
        const md = appendLogLine(replaceSection(c.md, "findings", spliced.body), "F", foldLineText(row, cells), today(), Number(row.id.replace(/^F/u, "")));
        fs.writeFileSync(c.specPath, md);
        out({ updated: true, slug: flags.slug, id: row.id, folded: true, ...applied, log: "F-line appended" });
      }
      if (flags.folded === "false") fail("fold-flip-unsupported", { note: "a folded row left the table; re-append instead (findings-table@1)" });
      if (row.severity === "BLOCKER" && row.impact === "report-only") {
        fail("blocker-cannot-be-advisory", { severity: row.severity, impact: row.impact });
      }
      if (!cells.length) fail("missing-flag", { flag: "--severity | --impact | --class | --route | --folded true" });
      writeRows(c, rows);
      out({ updated: true, slug: flags.slug, id: row.id, ...applied });
    }
    case "delete": {
      onlyFlags(flags, ["id", "axis", "severity"]);
      requireCarrier(c, { write: true, legacy: true });
      const rows = carrierRows(c);
      let kept;
      let removed;
      if (flags.id) {
        const id = normalizeId(flags.id);
        kept = rows.filter((r) => r.id !== id);
        removed = rows.length - kept.length;
      } else if (flags.axis) {
        kept = rows.filter((r) => r.axis !== flags.axis);
        removed = rows.length - kept.length;
      } else if (flags.severity) {
        kept = rows.filter((r) => r.severity !== flags.severity);
        removed = rows.length - kept.length;
      } else {
        fail("missing-flag", { flag: "--id | --axis | --severity" });
      }
      writeRows(c, kept);
      out({ deleted: true, "deleted-count": removed, slug: flags.slug });
    }
    case "delete-all": {
      onlyFlags(flags, []);
      requireCarrier(c, { write: true, legacy: true });
      const removed = carrierRows(c).length;
      writeRows(c, []);
      out({ deleted: true, "deleted-count": removed, slug: flags.slug });
    }
    case "delete-section": {
      onlyFlags(flags, ["section"]);
      if (c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: flags.slug, path: "review-findings.md" });
      if (!flags.section) fail("missing-flag", { flag: "--section" });
      fs.writeFileSync(c.specPath, deleteSection(c.md, flags.section));
      out({ deleted: true, slug: flags.slug, section: flags.section });
    }
    case "merge": {
      onlyFlags(flags, ["ids"]);
      requireCarrier(c, { write: true, legacy: true });
      if (!flags.ids) fail("missing-flag", { flag: "--ids <n,m,o>" });
      const ids = String(flags.ids).split(",").map((s) => s.trim()).map((s) => normalizeId(s));
      const rows = carrierRows(c);
      const merged = rows.filter((r) => ids.includes(r.id));
      if (merged.length < 2) fail("merge-needs-two", { ids });
      const kept = rows.filter((r) => !ids.includes(r.id));
      const mergedInOrder = [...merged].sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
      const top = [...merged].sort((a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0))[0];
      const row = {
        id: mergedInOrder[0].id,
        target: mergedInOrder.map((m) => m.target).join(" + "),
        axis: top.axis,
        severity: top.severity,
        impact: top.impact,
        class: top.class,
        route: top.route,
      };
      writeRows(c, [...kept, row]);
      out({ merged: true, slug: flags.slug, "new-id": row.id, finding: row });
    }
    case "summarize": {
      onlyFlags(flags, []);
      const rows = c.rows;
      const group = (key) => rows.reduce((acc, r) => ({ ...acc, [r[key]]: (acc[r[key]] ?? 0) + 1 }), {});
      out({ slug: flags.slug, carrier: c.carrier === "doc" ? "unit-doc" : c.carrier, grammar: c.grammar, total: rows.length, byAxis: group("axis"), bySeverity: group("severity"), byClass: group("class") });
    }
    default:
      fail("unknown-subcommand", { object: "findings", subcommand: op });
  }
}
