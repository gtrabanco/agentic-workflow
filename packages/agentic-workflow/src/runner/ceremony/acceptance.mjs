/**
 * acceptance.mjs — ceremony `acceptance` module (issue #352 P4): the unit's
 * acceptance criteria and the manifest that binds them.
 *
 * The carrier is the unit doc's `## Acceptance criteria` section (the canonical
 * source since feature 61); a legacy unit's `ACCEPTANCE.md` is read, never
 * rewritten. A criterion is *met* when an evidence row or `E`/`G` log line cites
 * its id, *untouched* when nothing does, and *unmet* when the last row citing it
 * records a non-zero exit.
 *
 * Exit contract (unchanged from #338): 0 success, 1 usage error, 2 ceremonial
 * block. JSON on stdout, always.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { out, fail, onlyFlags, parseFlags, resolveUnit, unitDoc, writeSection } from "../lib.mjs";
import { sectionText } from "../unit-doc-phases.mjs";

/** The criterion ids of the section, `AC1`-style bullets and `A<n>` aliases alike. */
export function criteriaOf(text) {
  const body = sectionText(text, "Acceptance criteria");
  if (body === null) return [];
  return body
    .split("\n")
    .map((line) => /^\s*[-*]\s*(?:AC|A)?(\d+)?\s*[—:-]?\s*(.+)$/u.exec(line))
    .filter((match) => match !== null && match[2].trim() !== "")
    .map((match, index) => ({ id: `AC${match[1] ?? index + 1}`, text: match[2].trim() }));
}

/** The evidence rows that cite each criterion id. */
function evidenceOf(text) {
  const rows = [];
  for (const line of text.split("\n")) {
    const cell = /^\|\s*(AC\d+)\s*\|(.*)$/u.exec(line);
    if (cell !== null) {
      const cells = line.split("|").slice(1, -1).map((value) => value.trim());
      rows.push({ ac: cell[1], exit: Number(cells[2] ?? 0), output: cells[3] ?? "" });
      continue;
    }
    const log = /^\s*-\s*\*\*E\d+\*\* — .*?(AC\d+).*?exit (\d+)/u.exec(line);
    if (log !== null) rows.push({ ac: log[1], exit: Number(log[2]), output: "" });
  }
  return rows;
}

/** The manifest: one row per criterion with its verdict. */
export function manifestOf(text) {
  const evidence = evidenceOf(text);
  return criteriaOf(text).map((criterion) => {
    const rows = evidence.filter((row) => row.ac === criterion.id);
    const last = rows.at(-1);
    const met = rows.length > 0 && last.exit === 0;
    return {
      criterion: criterion.id,
      text: criterion.text,
      evidence: rows.length,
      met,
      unmet: rows.length > 0 && last.exit !== 0,
      untouched: rows.length === 0,
    };
  });
}

const digest = (value) => createHash("sha256").update(value, "utf8").digest("hex");

export function acceptance(op, argv) {
  switch (op) {
    case "read": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      out({ unit: flags.slug, criteria: manifestOf(unitDoc(unit).text) });
    }
    case "update-criteria": {
      const flags = parseFlags(argv, ["slug", "criteria"], ["slug", "criteria"]);
      onlyFlags(flags, ["criteria"]);
      const unit = resolveUnit(flags.slug);
      let criteria;
      try {
        criteria = JSON.parse(String(flags.criteria));
      } catch {
        fail("bad-json", { flag: "--criteria" });
      }
      if (!Array.isArray(criteria) || criteria.some((entry) => typeof entry?.text !== "string")) {
        fail("bad-criteria", { expected: "[{ id?, text }]" });
      }
      const body = criteria.map((entry, index) => `- ${entry.id ?? `AC${index + 1}`} — ${entry.text.trim()}`).join("\n");
      writeSection(unitDoc(unit).path, "Acceptance criteria", body);
      out({ updated: true, unit: flags.slug, criteria: criteria.length });
    }
    case "build-manifest": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const text = unitDoc(unit).text;
      const manifest = manifestOf(text);
      out({ unit: flags.slug, manifest, "blob-sha": digest(JSON.stringify(manifest)) });
    }
    case "check-drift": {
      const flags = parseFlags(argv, ["slug", "diff"], ["slug", "diff"]);
      onlyFlags(flags, ["diff"]);
      const unit = resolveUnit(flags.slug);
      const [from, to] = String(flags.diff).split("..");
      if (to === undefined) fail("bad-diff", { expected: "<from>..<to>" });
      const changed = execFileSync("git", ["diff", "--name-only", from, to], { encoding: "utf8" }).split("\n").filter(Boolean);
      const untouched = manifestOf(unitDoc(unit).text).filter((row) => row.untouched).map((row) => row.criterion);
      out({ unit: flags.slug, diff: flags.diff, changed, drift: untouched, "needs-full-pass": untouched.length > 0 });
    }
    case "hash": {
      const flags = parseFlags(argv, ["slug"], ["slug"]);
      onlyFlags(flags, []);
      const unit = resolveUnit(flags.slug);
      const text = unitDoc(unit).text;
      const legacy = join(unit.dir, "ACCEPTANCE.md");
      const source = (() => { try { return readFileSync(legacy, "utf8"); } catch { return text; } })();
      out({ unit: flags.slug, "blob-sha": digest(source) });
    }
    default:
      fail("unknown-op", { object: "acceptance", op, ops: ["read", "update-criteria", "build-manifest", "check-drift", "hash"] });
  }
}
