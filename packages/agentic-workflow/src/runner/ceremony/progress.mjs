/**
 * progress.mjs — ceremony `progress` module (issue #352 P4, the frozen map of
 * fix/338): the unit's progress carrier.
 *
 * The carrier is the unit doc's own `## Log`, whose `log-kind@1` grammar the
 * template publishes: a progress entry is a `- **P<n>** — <text>` line. Writing
 * one is therefore a section append, never a second file — the rule the ledger
 * ownership map states for every other entry-shaped record.
 *
 * The map's date filters read the ISO date an entry opens with (`YYYY-MM-DD…`),
 * which is what the lane writes and the only date the carrier holds.
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always.
 */

import { out, fail, onlyFlags, parseFlags, resolveUnit, unitDoc, appendSectionLine, writeSection } from "../lib.mjs";

const ENTRY_RE = /^- \*\*P(\d+)\*\* — (.*)$/u;
const ENTRY_PREFIX = "- **P";
const DATE_RE = /(\d{4}-\d{2}-\d{2})/u;

/** Parse one entry line, or null when it is not a progress entry. */
function parseEntry(line) {
  const match = ENTRY_RE.exec(line.trim());
  if (match === null) return null;
  return { n: Number(match[1]), text: match[2], date: DATE_RE.exec(match[2])?.[1] ?? null };
}

/** Every progress entry in the document, in file order. */
const entriesOf = (text) => text.split("\n").map(parseEntry).filter((entry) => entry !== null);

export function progress(op, argv) {
  switch (op) {
    case "append": {
      const flags = parseFlags(argv, ["slug", "entry"], ["slug", "entry"]);
      onlyFlags(flags, ["slug", "entry"]);
      const unit = resolveUnit(flags.slug);
      const doc = unitDoc(unit);
      const existing = entriesOf(doc.text);
      const n = existing.length === 0 ? 1 : Math.max(...existing.map((entry) => entry.n)) + 1;
      appendSectionLine(doc.path, "Log", `${ENTRY_PREFIX}${n}** — ${String(flags.entry).trim()}`);
      out({ appended: true, unit: flags.slug, n });
    }
    case "read":
    case "list": {
      const flags = parseFlags(argv, ["slug", "from", "to"], ["slug"]);
      onlyFlags(flags, ["from", "to"]);
      const unit = resolveUnit(flags.slug);
      const all = entriesOf(unitDoc(unit).text);
      const from = typeof flags.from === "string" ? flags.from : null;
      const to = typeof flags.to === "string" ? flags.to : null;
      const entries = all.filter((entry) => {
        if (from === null && to === null) return true;
        if (entry.date === null) return false;
        if (from !== null && entry.date < from) return false;
        if (to !== null && entry.date > to) return false;
        return true;
      });
      out({ unit: flags.slug, entries, count: entries.length });
    }
    case "clear": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const doc = unitDoc(unit);
      const previous = entriesOf(doc.text).length;
      writeSection(doc.path, "Log", "");
      out({ unit: flags.slug, cleared: previous });
    }
    case "delete": {
      const flags = parseFlags(argv, ["slug", "range"], ["slug", "range"]);
      onlyFlags(flags, ["range"]);
      const unit = resolveUnit(flags.slug);
      const doc = unitDoc(unit);
      const match = /^P?(\d+)\s*(?:-\s*P?(\d+))?$/u.exec(String(flags.range).trim());
      if (match === null) fail("bad-range", { range: flags.range, expected: "<n>-<m>" });
      const low = Number(match[1]);
      const high = match[2] === undefined ? low : Number(match[2]);
      const before = entriesOf(doc.text);
      const doomed = new Set(before.filter((entry) => entry.n >= low && entry.n <= high).map((entry) => entry.n));
      if (doomed.size === 0) fail("empty-range", { range: flags.range });
      writeSection(doc.path, "Log", before.filter((entry) => !doomed.has(entry.n)).map((entry) => `${ENTRY_PREFIX}${entry.n}** — ${entry.text}`).join("\n"));
      out({ unit: flags.slug, deleted: [...doomed].sort((a, b) => a - b) });
    }
    default:
      fail("unknown-op", { object: "progress", op, ops: ["append", "read", "list", "delete", "clear"] });
  }
}
