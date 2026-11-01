#!/usr/bin/env node
/**
 * findings.mjs — ceremony `findings` module (issue #338 P0).
 *
 * CRUD on the findings carrier. Two carriers, one read path (LEDGERS.md): a
 * unit doc with a `## Findings` section is the migrated six-column
 * `findings-table@1` carrier (read + write); a unit without one falls back to
 * the legacy `review-findings.md` side ledger (read-only — a legacy unit is
 * never rewritten).
 */

import fs from "node:fs";
import path from "node:path";
import {
  out, fail, onlyFlags, parseFlags, resolveUnit, splitSections, replaceSection, deleteSection,
  parseFindings, renderFindings, appendLogLine, today,
} from "./lib.mjs";

const SEVERITY_RANK = { critical: 5, high: 4, med: 3, medium: 3, low: 2, info: 1 };

/** Resolve the unit's findings carrier: migrated unit-doc table or legacy side file. */
export function findingsCarrier(slug, cwd) {
  const unit = resolveUnit(slug, cwd);
  const md = fs.readFileSync(unit.specPath, "utf8");
  const hasDoc = splitSections(md).sections.some((s) => s.heading === "Findings" && s.level === 2);
  const legacyPath = path.join(unit.dir, "review-findings.md");
  if (hasDoc || !fs.existsSync(legacyPath)) return { ...unit, md, carrier: "unit-doc" };
  return { ...unit, md, carrier: "legacy", legacyPath };
}

function nextId(md) {
  const seen = [...md.matchAll(/\bF(\d+)\b/g)].map((m) => Number(m[1]));
  return seen.reduce((a, n) => Math.max(a, n), 0) + 1;
}

function writeRows(c, rows) {
  fs.writeFileSync(c.specPath, replaceSection(c.md, "findings", renderFindings(rows)));
}

function parseLegacyFindings(text) {
  return text.split("\n")
    .filter((l) => /^\s*\| F\d+\s*\|/.test(l))
    .map((l) => {
      const c = l.split("|").map((s) => s.trim());
      return { id: c[1], target: c[2], axis: c[3], severity: c[4], class: c[5], route: c[6], folded: c[7] === "yes" };
    });
}

export function findings(op, argv, cwd = process.cwd()) {
  const flags = parseFlags(argv, ["slug", "id", "ids", "file", "line", "target", "axis", "severity", "class", "route", "folded", "section"], ["slug"]);
  const c = findingsCarrier(flags.slug, cwd);

  switch (op) {
    case "append": {
      onlyFlags(flags, ["file", "line", "target", "axis", "severity", "class", "route"]);
      if (c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: flags.slug, path: c.legacyPath });
      for (const r of ["axis", "severity", "class", "route"]) {
        if (!flags[r]) fail("missing-flag", { flag: `--${r}` });
      }
      if (!flags.target && !flags.file) fail("missing-flag", { flag: "--target | --file" });
      const rows = parseFindings(c.md);
      const id = `F${nextId(c.md)}`;
      const target = flags.target ?? `${flags.file}${flags.line ? `:${flags.line}` : ""}`;
      const row = { id, target, axis: flags.axis, severity: flags.severity, class: flags.class, route: flags.route };
      writeRows(c, [...rows, row]);
      out({ appended: true, slug: flags.slug, finding: row, carrier: c.carrier });
    }
    case "read": {
      onlyFlags(flags, []);
      if (c.carrier === "legacy") {
        out({ slug: flags.slug, carrier: "legacy", path: "review-findings.md", findings: parseLegacyFindings(fs.readFileSync(c.legacyPath, "utf8")) });
      }
      out({ slug: flags.slug, carrier: c.carrier, findings: parseFindings(c.md) });
    }
    case "update": {
      onlyFlags(flags, ["id", "severity", "class", "route", "folded"]);
      if (c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: flags.slug, path: c.legacyPath });
      if (!flags.id) fail("missing-flag", { flag: "--id" });
      const rows = parseFindings(c.md);
      const row = rows.find((r) => r.id === (String(flags.id).match(/^F/) ? flags.id : `F${flags.id}`));
      if (!row) fail("unknown-finding", { id: flags.id, slug: flags.slug });
      // Every cell flag applies, folded or not: the issue's own example passes
      // `--severity` and `--folded true` together, so folding after the edit and
      // echoing both is the contract — never silently dropping one of them.
      const cells = ["severity", "class", "route"].filter((k) => flags[k]);
      for (const k of cells) row[k] = flags[k];
      const applied = Object.fromEntries(cells.map((k) => [k, row[k]]));
      if (flags.folded === "true") {
        let md = replaceSection(c.md, "findings", renderFindings(rows.filter((r) => r !== row)));
        const edited = cells.length ? ` · ${cells.map((k) => `${k}: ${row[k]}`).join(" · ")}` : "";
        md = appendLogLine(md, "F", `folded ${row.id} (${row.axis}): ${row.target} — folded: yes${edited}`, today());
        fs.writeFileSync(c.specPath, md);
        out({ updated: true, slug: flags.slug, id: row.id, folded: true, ...applied, log: "F-line appended" });
      }
      if (flags.folded === "false") fail("fold-flip-unsupported", { note: "a folded row left the table; re-append instead (findings-table@1)" });
      if (!cells.length) fail("missing-flag", { flag: "--severity | --class | --route | --folded true" });
      writeRows(c, rows);
      out({ updated: true, slug: flags.slug, id: row.id, ...applied });
    }
    case "delete": {
      onlyFlags(flags, ["id", "axis", "severity"]);
      if (c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: flags.slug, path: c.legacyPath });
      const rows = parseFindings(c.md);
      let kept;
      let removed;
      if (flags.id) {
        const id = String(flags.id).match(/^F/) ? flags.id : `F${flags.id}`;
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
      if (c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: flags.slug, path: c.legacyPath });
      const removed = parseFindings(c.md).length;
      writeRows(c, []);
      out({ deleted: true, "deleted-count": removed, slug: flags.slug });
    }
    case "delete-section": {
      onlyFlags(flags, ["section"]);
      if (c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: flags.slug, path: c.legacyPath });
      if (!flags.section) fail("missing-flag", { flag: "--section" });
      fs.writeFileSync(c.specPath, deleteSection(c.md, flags.section));
      out({ deleted: true, slug: flags.slug, section: flags.section });
    }
    case "merge": {
      onlyFlags(flags, ["ids"]);
      if (c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: flags.slug, path: c.legacyPath });
      if (!flags.ids) fail("missing-flag", { flag: "--ids <n,m,o>" });
      const ids = String(flags.ids).split(",").map((s) => s.trim()).map((s) => (s.match(/^F/) ? s : `F${s}`));
      const rows = parseFindings(c.md);
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
        class: top.class,
        route: top.route,
      };
      writeRows(c, [...kept, row]);
      out({ merged: true, slug: flags.slug, "new-id": row.id, finding: row });
    }
    case "summarize": {
      onlyFlags(flags, []);
      let rows;
      if (c.carrier === "legacy") {
        rows = parseLegacyFindings(fs.readFileSync(c.legacyPath, "utf8"));
      } else {
        rows = parseFindings(c.md);
      }
      const group = (key) => rows.reduce((acc, r) => ({ ...acc, [r[key]]: (acc[r[key]] ?? 0) + 1 }), {});
      out({ slug: flags.slug, carrier: c.carrier, total: rows.length, byAxis: group("axis"), bySeverity: group("severity"), byClass: group("class") });
    }
    default:
      fail("unknown-subcommand", { object: "findings", subcommand: op });
  }
}
