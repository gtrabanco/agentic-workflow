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

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { schemaRuntimePath } from "./schema-runtime.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** The canonical sets, read from the built schema runtime (one declaration). */
const { FUTURE_STATUS_KINDS, FINDINGS_TABLE_SEVERITIES, PRE_EXECUTION_FINDING_CLASSES } = await import(
  schemaRuntimePath
);

/** A fenced code block opener (the closing side mirrors it). */
const FENCE = /^\s*(`{3,}|~{3,})/;

/** The dated progress entry that makes a plan a unit in flight. */
const IN_FLIGHT = /\d{4}-\d{2}-\d{2} \d{2}:\d{2} — /;

/** A `## Future` bullet: `- `status` — …`. */
const FUTURE_BULLET = /^\s*[-*+]\s+(.*)$/;

/** `discarded <YYYY-MM-DD>` — the only status that carries a date. */
const DISCARDED = /^discarded (\d{4}-\d{2}-\d{2})$/;

/**
 * Fence-aware scan of one document: the callback sees every line outside a
 * fenced block, with its 1-based line number.
 */
function outsideFences(doc, visit) {
  let fence = null;
  doc.lines.forEach((line, index) => {
    const run = FENCE.exec(line);
    if (run) {
      if (fence === null) fence = run[1];
      else if (line.trim() !== "" && line.trim()[0] === fence[0] && line.trim().length >= fence.length) fence = null;
      return;
    }
    if (fence === null) visit(line, index + 1);
  });
}

/** Fence-aware body of the first `## <name>` section, with line numbers, or null. */
function sectionLines(doc, name) {
  const start = doc.lines.findIndex((line) => line.trim() === `## ${name}`);
  if (start === -1) return null;
  const body = [];
  for (let index = start + 1; index < doc.lines.length; index += 1) {
    if (/^## /.test(doc.lines[index])) break;
    body.push({ line: doc.lines[index], number: index + 1 });
  }
  return body;
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
    let fence = null;
    for (const row of future) {
      const run = FENCE.exec(row.line);
      if (run) {
        if (fence === null) fence = run[1];
        else if (row.line.trim() !== "" && row.line.trim()[0] === fence[0] && row.line.trim().length >= fence.length) fence = null;
        continue;
      }
      if (fence !== null) continue;
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
    let fence = null;
    for (const row of findings) {
      const run = FENCE.exec(row.line);
      if (run) {
        if (fence === null) fence = run[1];
        else if (row.line.trim() !== "" && row.line.trim()[0] === fence[0] && row.line.trim().length >= fence.length) fence = null;
        continue;
      }
      if (fence !== null) continue;
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

/** The unit docs the roadmap and the fix index still call in flight. */
function inFlightDocs(root) {
  const out = [];
  const roadmap = readLines(root, "docs/features/ROADMAP.md");
  if (roadmap !== null) {
    for (const line of roadmap) {
      const row = /^\|\s*(\d+)\s*\|\s*`([a-z0-9-]+)`\s*\|\s*([^|]+)\|/.exec(line);
      if (row === null) continue;
      if (/done|discarded|superseded/i.test(row[3])) continue;
      out.push(`docs/features/${row[1]}-${row[2]}/SPEC.md`);
    }
  }
  const fixes = readLines(root, "docs/fix/README.md");
  if (fixes !== null) {
    for (const line of fixes) {
      const row = /^\|\s*\[#(\d+)\]\([^)]*\)\s*\|\s*([a-z0-9-]+)\s*\|\s*`?([a-z-]+)`?/.exec(line);
      if (row === null) continue;
      if (/done/i.test(row[3])) continue;
      out.push(`docs/fix/${row[1]}-${row[2]}/SPEC.md`);
    }
  }
  // A plan that was never started is a plan, not a promise (the same rule the
  // promise-coherence gate applies): a dated progress entry makes it live.
  return out.filter((file) => {
    const lines = readLines(root, file);
    return lines !== null && IN_FLIGHT.test(lines.join("\n"));
  });
}

function readLines(root, relative) {
  try {
    return fs.readFileSync(path.join(root, relative), "utf8").split(/\r?\n/);
  } catch {
    return null;
  }
}

/**
 * Run the probe over `root`'s in-flight unit docs.
 * @returns {{verdict: string, exitCode: number, lines: string[], violations: object[], documentsChecked: number}}
 */
export function runProbe(root) {
  const violations = [];
  const docs = inFlightDocs(root).map((file) => {
    const lines = readLines(root, file);
    return { file, lines: lines ?? [] };
  });
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
