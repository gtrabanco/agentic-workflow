#!/usr/bin/env node

/**
 * vocabulary-probe.mjs — the published closed vocabularies, applied (unit 84,
 * issue #315 S1, the F40 class).
 *
 * The defect: a doc writes a status/class token outside the closed vocabulary
 * the same tree publishes in prose, and no parser reads it — so no gate sees it
 * and the next review cycle finds it (unit 79's F40: `kept deferred <date>`,
 * still live in a closed unit's `## Future` rows when this unit opened).
 *
 * What it checks (the inventory declares the corpus; `AGENTS.md`
 * `normative-surfaces@1` names the canonical sets):
 *   future-status      every `## Future` bullet's status token is
 *                      `open | planned | discarded <YYYY-MM-DD>` (the date is
 *                      required on `discarded`, forbidden on the other two)
 *   finding-severity   every `## Findings` table severity cell is
 *                      `high | med | low` (the sensor may accept legacy
 *                      aliases on read; a published document may not carry one)
 *   finding-class      every `## Findings` table class cell is
 *                      `product | plan | source | environment | runtime`
 *
 * Corpus (decision D3): in-flight unit docs only — a roadmap row whose status
 * is not `done`/`discarded`/`superseded` and whose doc carries a dated progress
 * entry — plus the fix index the same way. Closed units are append-only
 * evidence; their off-vocabulary tokens are recorded debt, never a retroactive
 * red suite.
 *
 * stdout: one `Vocabulary-probe: <vocab> <file>:<line> — <token>` header per
 * violation, then `verdict` and a `probe:` tally. exit 0 only on PASS.
 * Read-only, no dependencies beyond the built schema runtime.
 */

import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { schemaRuntimePath } from "./schema-runtime.mjs";
import { sectionBounds, openFence, closesFence, inFlightUnitDocs } from "./unit-doc-phases.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The canonical sets, read from the built schema runtime (one declaration). */
const { FUTURE_STATUS_KINDS, FINDINGS_TABLE_SEVERITIES, PRE_EXECUTION_FINDING_CLASSES } = await import(
  schemaRuntimePath
);

/** A `## Future` bullet: `- `status` — …`. */
const FUTURE_BULLET = /^\s*[-*+]\s+(.*)$/;

/** `discarded <YYYY-MM-DD>` — the only status that carries a date. */
const DISCARDED = /^discarded (\d{4}-\d{2}-\d{2})$/;

/**
 * The rows of one section that sit outside a fenced block, line numbers kept.
 * Fence tracking belongs to the shared reader (`openFence` / `closesFence` in
 * `unit-doc-phases.mjs`): the probe carried three private copies of the walk,
 * one of them dead, which is the F37/F38/F39 class this unit pins out (review
 * F4/F6). A fenced quote is the fold's own evidence, never a violation.
 */
function unfenced(rows) {
  const out = [];
  let fence = null;
  for (const row of rows) {
    const trimmed = row.line.trim();
    if (fence !== null) {
      if (closesFence(trimmed, fence)) fence = null;
      continue;
    }
    const opened = openFence(trimmed);
    if (opened !== null) {
      fence = opened;
      continue;
    }
    out.push(row);
  }
  return out;
}

/** Fence-aware body of the first `## <name>` section, with line numbers, or null.
 *  Delegates to the shared fence-aware reader (`unit-doc-phases.sectionBounds`):
 *  a fenced block inside the section never truncates it, and a fenced line that
 *  looks like a heading never starts or ends one. */
function sectionLines(doc, name) {
  const text = doc.lines.join("\n");
  const bounds = sectionBounds(text, name);
  if (bounds === null) return null;
  const after = text.indexOf("\n", bounds[0]) + 1;
  const startNumber = text.slice(0, after).split("\n").length;
  return text.slice(after, bounds[1])
    .split("\n")
    .map((line, offset) => ({ line, number: startNumber + offset }));
}

/**
 * One document's vocabulary violations, across every declared section.
 * `doc` is { file, lines } — relative path and raw lines.
 */
function documentViolations(doc) {
  const violations = [];
  const record = (vocab, file, line, token, why) => violations.push({ vocab, file, line, token, why });

  // ── future-status: every `## Future` bullet's status token.
  const future = sectionLines(doc, "Future");
  if (future !== null) {
    for (const row of unfenced(future)) {
      const bullet = FUTURE_BULLET.exec(row.line);
      if (bullet === null) continue;
      const token = /`([^`]+)`/.exec(bullet[1]);
      if (token === null) continue;
      const status = token[1].trim();
      if (FUTURE_STATUS_KINDS.includes(status)) continue;
      if (DISCARDED.test(status)) continue;
      const why = status === "discarded"
        ? "a discarded row carries its `YYYY-MM-DD`"
        : `the published set is ${FUTURE_STATUS_KINDS.map((kind) => `\`${kind}\``).join(" | ")} (discarded takes a date)`;
      record("future-status", doc.file, row.number, status, why);
    }
  }

  // ── finding-severity / finding-class: the `## Findings` table cells.
  const findings = sectionLines(doc, "Findings");
  if (findings !== null) {
    for (const row of unfenced(findings)) {
      if (!row.line.trimStart().startsWith("|")) continue;
      const cells = row.line.split("|").map((cell) => cell.trim());
      if (cells.length < 7) continue;
      if (/^(id|:?-+:?)$/.test(cells[1])) continue;
      const severity = cells[4];
      if (severity !== undefined && severity !== "" && !FINDINGS_TABLE_SEVERITIES.includes(severity)) {
        record("finding-severity", doc.file, row.number, severity, `the published scale is ${FINDINGS_TABLE_SEVERITIES.join(" | ")} (aliases like 'medium' are a read-side accommodation, never a published token)`);
      }
      const klass = cells[5];
      if (klass !== undefined && klass !== "" && !PRE_EXECUTION_FINDING_CLASSES.includes(klass)) {
        record("finding-class", doc.file, row.number, klass, `the published set is ${PRE_EXECUTION_FINDING_CLASSES.join(" | ")}`);
      }
    }
  }
  return violations;
}

/** The unit docs the roadmap and the fix index still call in flight, as
 *  `{ file, lines }` pairs read once (review F5). The rule itself belongs to
 *  the shared reader — `inFlightUnitDocs` in `scripts/unit-doc-phases.mjs` is
 *  the one owner (cycle-2 review F20: two gates kept byte-similar copies here
 *  and could silently disagree about which docs are live). This stays
 *  exported so the suite can assert the corpus rule itself, not only the
 *  violations it finds: a settled head legitimately scans nothing, and that
 *  must not be confused with a corpus rule that stopped matching. */
export function inFlightDocs(root) {
  return inFlightUnitDocs(root);
}

/**
 * Run the probe over `root`'s in-flight unit docs.
 * @returns {{verdict: string, exitCode: number, lines: string[], violations: object[], documentsChecked: number}}
 */
export function runProbe(root) {
  const violations = [];
  const docs = inFlightDocs(root);
  for (const doc of docs) {
    violations.push(...documentViolations(doc));
  }
  const lines = [];
  for (const violation of violations) {
    lines.push(`Vocabulary-probe: ${violation.vocab} ${violation.file}:${violation.line} — \`${violation.token}\``);
    lines.push(`  why: ${violation.why}`);
  }
  const reason = violations.length === 0 ? null : `${violations[0].vocab}-token`;
  lines.push(reason === null ? "verdict PASS" : `verdict BLOCKED: ${reason}`);
  lines.push(`probe: ${violations.length} violation${violations.length === 1 ? "" : "s"} · ${docs.length} document${docs.length === 1 ? "" : "s"} checked · closed units not scanned (append-only evidence)`);
  return {
    verdict: reason === null ? "PASS" : `BLOCKED: ${reason}`,
    exitCode: reason === null ? 0 : 1,
    lines,
    violations,
    documentsChecked: docs.length,
    documents: docs.map((doc) => doc.file),
  };
}

/** CLI: `node scripts/vocabulary-probe.mjs [--root <dir>]` (default: this repo). */
function main(argv) {
  let root = ROOT;
  if (argv[0] === "--root") {
    if (argv.length !== 2) {
      process.stderr.write("usage: node scripts/vocabulary-probe.mjs [--root <dir>]\n");
      return 2;
    }
    root = path.resolve(argv[1]);
  } else if (argv.length !== 0) {
    process.stderr.write("usage: node scripts/vocabulary-probe.mjs [--root <dir>]\n");
    return 2;
  }
  const result = runProbe(root);
  process.stdout.write(`${result.lines.join("\n")}\n`);
  return result.exitCode;
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedDirectly) {
  process.exitCode = main(process.argv.slice(2));
}
