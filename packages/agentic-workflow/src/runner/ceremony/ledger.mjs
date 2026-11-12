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
} from "../lib.mjs";

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

/** The issue's `ledger count` key set, resolved against the carrier's own vocabulary (§S5); a mark the carrier cannot carry is `null`, never a zero it never measured. */
const DOCUMENTED_COUNT_KEYS = ["REVIEW-RAN", "VF", "GATE-RAN", "F", "R", "V", "E"];

function documentedCounts(counts) {
  const merged = {};
  for (const [key, value] of Object.entries(counts)) {
    const canonical = KIND_TO_LEGACY_COUNT[key] ?? key;
    merged[canonical] = (merged[canonical] ?? 0) + value;
  }
  return Object.fromEntries(DOCUMENTED_COUNT_KEYS.map((key) => [key, merged[KIND_TO_LEGACY_COUNT[key] ?? key] ?? null]));
}

/** A migrated `## Log` mark → the issue's mark fields (`type`, `sha`, `detail`, `date`), keeping `kind`/`n`/`text`. */
function logMark(m) {
  const head = m.body.match(/^([A-Z][A-Z-]+)\s*·\s*(?:HEAD\s+([0-9a-f]{7,40})\s*·\s*)?([\s\S]*)$/);
  return {
    type: head ? head[1] : KIND_TO_LEGACY_COUNT[m.kind] ?? m.kind,
    kind: m.kind,
    n: m.n,
    date: m.date,
    sha: head?.[2] ?? null,
    detail: head ? head[3] : m.body,
    text: m.text,
  };
}

function legacyMarks(text) {
  const marks = [];
  for (const line of text.split("\n")) {
    const cells = line.split("|").map((s) => s.trim());
    const head = cells[1] ?? "";
    const shaCell = cells.findIndex((cell, index) => index > 1 && /^HEAD [0-9a-f]{7,40}$/.test(cell));
    const sha = shaCell === -1 ? null : cells[shaCell].split(" ")[1];
    const detail = shaCell === -1 ? null : cells.slice(shaCell + 1).filter((cell) => cell !== "").join(" · ") || null;
    const mark = { type: head, n: null, date: null, sha, detail, text: line.trim().slice(0, 160) };
    if (/^REVIEW-RAN/.test(head)) marks.push(mark);
    else if (/^VF-\d+/.test(head)) marks.push({ ...mark, n: Number(head.split("-")[1]), type: "VF" });
    else if (/^GATE-RAN/.test(head)) marks.push(mark);
    else if (/^- \*\*D-/.test(line)) marks.push({ ...mark, type: "D" });
    else if (/^F\d+$/.test(head)) marks.push({ ...mark, type: "F" });
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
      out({ slug: flags.slug, carrier: c.carrier, marks: parseLog(c.md).map(logMark) });
    }
    case "count": {
      onlyFlags(flags, []);
      out({ slug: flags.slug, carrier: c.carrier, counts, documented: documentedCounts(counts) });
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
