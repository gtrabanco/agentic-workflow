#!/usr/bin/env node
/**
 * ledger.mjs — ceremony `ledger` module (issue #338 P0).
 *
 * Marks carrier, two grammars (LEDGERS.md): a migrated unit's `## Log`
 * `log-kind@1` lines (read + write) or a legacy unit's `review-findings.md`
 * marks (read-only — a legacy unit is never rewritten). A unit doc with a
 * `## Log` section is migrated; otherwise the side file is the carrier.
 */

import fs from "node:fs";
import path from "node:path";
import {
  out, fail, block, onlyFlags, parseFlags, resolveUnit, splitSections, readSection,
  replaceSection, deleteSection, parseLog, appendLogLine, today,
} from "./lib.mjs";

const MARK_TO_KIND = {
  "REVIEW-RAN": "R", "GATE-RAN": "G", "F": "F", "R": "R", "V": "V",
  "E": "E", "D": "D", "P": "P", "L": "L",
};

export function ledgerCarrier(slug, cwd) {
  const unit = resolveUnit(slug, cwd);
  const md = fs.readFileSync(unit.specPath, "utf8");
  const hasLog = splitSections(md).sections.some((s) => s.heading === "Log" && s.level === 2);
  const legacyPath = path.join(unit.dir, "review-findings.md");
  if (hasLog || !fs.existsSync(legacyPath)) return { ...unit, md, carrier: "unit-doc" };
  return { ...unit, md, carrier: "legacy", legacyPath };
}

/** Legacy mark counts — grep-equivalent line counts per token (R1 reproducer). */
export function countLegacy(text) {
  const lines = text.split("\n");
  return {
    "REVIEW-RAN": lines.filter((l) => l.includes("REVIEW-RAN")).length,
    "VF": lines.filter((l) => /^\s*\| VF-/.test(l)).length,
    "GATE-RAN": lines.filter((l) => l.includes("GATE-RAN")).length,
    "F": lines.filter((l) => /^\s*\| F\d+\s*\|/.test(l)).length,
    "D": lines.filter((l) => /^- \*\*D-/.test(l)).length,
  };
}

/** Legacy-count keys are the long mark forms; single-letter kinds alias to them. */
const KIND_TO_LEGACY_COUNT = { "R": "REVIEW-RAN", "G": "GATE-RAN", "V": "VF" };

function legacyMarks(text) {
  const marks = [];
  for (const line of text.split("\n")) {
    const vf = line.match(/^\s*\| (VF-\d+)/);
    if (/^\s*\| REVIEW-RAN/.test(line)) marks.push({ type: "REVIEW-RAN", text: line.trim().slice(0, 160) });
    else if (vf) marks.push({ type: "VF", n: Number(vf[1].split("-")[1]), text: line.trim().slice(0, 160) });
    else if (/^\s*\| GATE-RAN/.test(line)) marks.push({ type: "GATE-RAN", text: line.trim().slice(0, 160) });
    else if (/^- \*\*D-/.test(line)) marks.push({ type: "D", text: line.trim().slice(0, 160) });
    else if (/^\s*\| F\d+\s*\|/.test(line)) marks.push({ type: "F", text: line.trim().slice(0, 160) });
  }
  return marks;
}

/** Rewrite `## Log` keeping only the marks passing `keep(kind, n)`. */
function filterLog(c, keep) {
  const body = readSection(c.md, "log");
  const kept = body.split("\n").filter((l) => {
    const m = l.match(/^- \*\*([A-Z])(\d+)([a-z]?)\*\* — /);
    return !m || keep(m[1], Number(m[2]));
  });
  fs.writeFileSync(c.specPath, replaceSection(c.md, "log", kept.join("\n")));
}

export function ledger(op, argv, cwd = process.cwd()) {
  const flags = parseFlags(argv, ["slug", "mark", "type", "sha", "detail", "required-mark", "section"], ["slug"]);
  const c = ledgerCarrier(flags.slug, cwd);
  const counts = c.carrier === "legacy"
    ? countLegacy(fs.readFileSync(c.legacyPath, "utf8"))
    : parseLog(c.md).reduce((a, m) => ({ ...a, [m.kind]: (a[m.kind] ?? 0) + 1 }), {});

  switch (op) {
    case "read": {
      onlyFlags(flags, []);
      if (c.carrier === "legacy") {
        out({ slug: flags.slug, carrier: "legacy", path: "review-findings.md", marks: legacyMarks(fs.readFileSync(c.legacyPath, "utf8")) });
      }
      out({ slug: flags.slug, carrier: c.carrier, marks: parseLog(c.md) });
    }
    case "count": {
      onlyFlags(flags, []);
      out({ slug: flags.slug, carrier: c.carrier, counts });
    }
    case "append": {
      onlyFlags(flags, ["mark", "sha", "detail"]);
      if (c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: flags.slug, path: c.legacyPath });
      if (!flags.mark || !(flags.mark in MARK_TO_KIND)) fail("unknown-mark", { mark: flags.mark, allowed: Object.keys(MARK_TO_KIND) });
      if (!flags.detail) fail("missing-flag", { flag: "--detail" });
      const kind = MARK_TO_KIND[flags.mark];
      const text = `${flags.mark} · ${flags.sha ? `HEAD ${flags.sha} · ` : ""}${flags.detail}`;
      const md = appendLogLine(c.md, kind, text, today());
      fs.writeFileSync(c.specPath, md);
      out({ appended: true, slug: flags.slug, mark: flags.mark, kind });
    }
    case "delete": {
      onlyFlags(flags, ["mark", "type"]);
      if (c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: flags.slug, path: c.legacyPath });
      if (flags.mark) {
        const marks = parseLog(c.md);
        if (/^\d+$/.test(String(flags.mark))) {
          const index = Number(flags.mark);
          if (index < 1 || index > marks.length) fail("unknown-mark", { mark: flags.mark, expected: `1..${marks.length}` });
          const target = marks[index - 1];
          filterLog(c, (kind, n) => !(kind === target.kind && n === target.n));
          out({ deleted: true, slug: flags.slug, mark: `${target.kind}${target.n}`, index });
        }
        const m = String(flags.mark).match(/^([A-Z])(\d+)$/);
        if (!m) fail("unknown-mark", { mark: flags.mark, expected: "<kind><n>, e.g. R3, or a 1-based index" });
        filterLog(c, (kind, n) => !(kind === m[1] && n === Number(m[2])));
        out({ deleted: true, slug: flags.slug, mark: flags.mark });
      } else if (flags.type) {
        const t = MARK_TO_KIND[flags.type] ?? flags.type;
        filterLog(c, (kind) => kind !== t);
        out({ deleted: true, slug: flags.slug, type: flags.type, "deleted-count": counts[t] ?? 0 });
      } else {
        fail("missing-flag", { flag: "--mark <kind><n> | --type <type>" });
      }
    }
    case "delete-all": {
      onlyFlags(flags, []);
      if (c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: flags.slug, path: c.legacyPath });
      const removed = Object.values(counts).reduce((a, b) => a + b, 0);
      fs.writeFileSync(c.specPath, replaceSection(c.md, "log", "(empty)"));
      out({ deleted: true, slug: flags.slug, "deleted-count": removed });
    }
    case "delete-section": {
      onlyFlags(flags, ["section"]);
      if (c.carrier === "legacy") fail("legacy-carrier-readonly", { slug: flags.slug, path: c.legacyPath });
      if (!flags.section) fail("missing-flag", { flag: "--section" });
      fs.writeFileSync(c.specPath, deleteSection(c.md, flags.section));
      out({ deleted: true, slug: flags.slug, section: flags.section });
    }
    case "verify": {
      onlyFlags(flags, ["required-mark"]);
      if (!flags["required-mark"]) fail("missing-flag", { flag: "--required-mark" });
      const req = String(flags["required-mark"]);
      const kind = MARK_TO_KIND[req] ?? req;
      // Resolve against the carrier's own count vocabulary: the legacy
      // carrier's counts are keyed by the long mark forms (REVIEW-RAN, VF,
      // GATE-RAN), the migrated carrier's by kind — the required mark and its
      // kind alias must both be tried, so verify never false-negatives a mark
      // `ledger count` reports on the same carrier.
      const candidates = [req, kind];
      if (c.carrier === "legacy" && KIND_TO_LEGACY_COUNT[kind]) candidates.push(KIND_TO_LEGACY_COUNT[kind]);
      const verified = candidates.some((key) => (counts[key] ?? 0) > 0);
      if (!verified) block({ check: "ledger-verify", verified, "required-mark": req, carrier: c.carrier });
      out({ slug: flags.slug, verified, "required-mark": req, carrier: c.carrier });
    }
    default:
      fail("unknown-subcommand", { object: "ledger", subcommand: op });
  }
}
