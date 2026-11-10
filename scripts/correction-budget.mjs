#!/usr/bin/env node
/**
 * correction-budget.mjs — the correction budget as a measurement (issue #437,
 * S5/S8; absorbs #362's phase).
 *
 * The review→fold loop's stopping condition used to be prose: "a new finding
 * never earns a round", "one bounded correction per round". Prose is not a
 * number, so this reader computes one from the corpus instead of inventing it:
 *
 *   batch-size   the measured median number of folded findings per fold commit
 *                (denominator: distinct `· fold <sha>` commits in the corpus);
 *   budget       ceil(open fix-now findings ÷ batch-size), clamped to
 *                [1, MAX_BUDGET] — the bounded part;
 *   nimio        a finding below the materiality floor is classified, listed for
 *                a dated `known-issues.md` note, and excluded from the count: it
 *                never opens a round and never consumes the budget (S5);
 *   stop         an exhausted budget prints the typed `NEEDS-YOUR-DECISION`
 *                instead of granting another round.
 *
 * Usage
 *   bun scripts/correction-budget.mjs --unit <unit-dir> [--rounds-spent <n>] [--repo <dir>] [--json]
 *   bun scripts/correction-budget.mjs --measure [--repo <dir>]
 *
 * Exit: 0 the budget holds (or measurement succeeded); 1 the budget is spent or
 * the unit carries no findings ledger; 2 a usage error. Read-only: it writes
 * nothing and never edits a ledger.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { buildCorpus, makeGitFoldResolver, parseLegacyLedger, parseMigratedCarrier } from "./findings-corpus.mjs";

export const BUDGET_CONTRACT = "correction-budget@1";
export const MAX_BUDGET = 3;
export const NIMIO_FLOOR = "below-floor";

/** The materiality floor: a below-floor severity, or a report-only impact. */
export function isNimio(row) {
  return row.band === NIMIO_FLOOR || String(row.impact ?? "").toLowerCase() === "report-only";
}

/**
 * Measure the batch size from the corpus: how many findings one fold commit
 * actually repaired. The corpus's fold gate has already proven that each of
 * those commits touches the path its finding names.
 */
export function measureBatchSize(repo, { resolveFold = makeGitFoldResolver(repo) } = {}) {
  const corpus = buildCorpus(repo, { resolveFold });
  const perCommit = new Map();
  for (const row of corpus.findings) {
    if (!row.foldSha) continue;
    if (row.status !== "admitted" && row.status !== "annotated") continue;
    const fold = resolveFold(row);
    if (!fold || !fold.sha || !fold.paths || !fold.paths.includes(row.path)) continue;
    perCommit.set(fold.sha, (perCommit.get(fold.sha) ?? 0) + 1);
  }
  const counts = [...perCommit.values()].sort((a, b) => a - b);
  if (counts.length === 0) {
    return { batchSize: 1, sample: 0, source: "findings-corpus", reason: "no repaired fold commit in the corpus — fail-closed at one finding per round" };
  }
  const middle = Math.floor((counts.length - 1) / 2);
  return { batchSize: counts[middle], sample: counts.length, source: "findings-corpus" };
}

/** The unit's OPEN rows, from whichever carrier the unit carries. */
export function openRowsOf(unitDir) {
  const legacy = path.join(unitDir, "review-findings.md");
  const spec = path.join(unitDir, "SPEC.md");
  const unit = path.basename(unitDir);
  if (fs.existsSync(legacy)) {
    const parsed = parseLegacyLedger(fs.readFileSync(legacy, "utf8"), { file: legacy, unit });
    return parsed.findings.filter((row) => !row.folded);
  }
  if (fs.existsSync(spec)) {
    const parsed = parseMigratedCarrier(fs.readFileSync(spec, "utf8"), { file: spec, unit });
    return parsed.findings.filter((row) => !row.folded);
  }
  return null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The bounded budget. Pure: every input is explicit, so the formula is testable
 * without a repository.
 */
export function computeBudget({ rows, batchSize, roundsSpent = 0 }) {
  const nimioRows = rows
    .filter((row) => isNimio(row))
    .map((row) => ({ id: row.id, path: row.path, noteDate: today() }));
  const findings = rows.length - nimioRows.length;
  const rounds = Number.isInteger(roundsSpent) && roundsSpent > 0 ? roundsSpent : 0;
  const budget = findings === 0 ? 0 : Math.min(MAX_BUDGET, Math.max(1, Math.ceil(findings / batchSize)));
  const remaining = Math.max(0, budget - rounds);
  const exhausted = findings > 0 && remaining === 0;
  return {
    findings,
    nimio: nimioRows.length,
    nimioRows,
    batchSize,
    budget,
    roundsSpent: rounds,
    remaining,
    verdict: exhausted ? "BUDGET-EXHAUSTED" : "PASS",
    stop: exhausted
      ? `NEEDS-YOUR-DECISION: correction budget exhausted at ${rounds} of ${budget} rounds; ${findings} findings remain — the owner decides the next round`
      : "none",
  };
}

function block(budget, measured) {
  const lines = [
    BUDGET_CONTRACT,
    `findings | ${budget.findings}`,
    `nimio | ${budget.nimio}`,
    `batch-size | ${budget.batchSize}`,
    `budget | ${budget.budget}`,
    `rounds-spent | ${budget.roundsSpent}`,
    `remaining | ${budget.remaining}`,
    `verdict | ${budget.verdict}`,
    `stop | ${budget.stop}`,
  ];
  for (const row of budget.nimioRows) {
    lines.push(`nimio — ${row.id} · ${row.path} · record known-issues.md (${row.noteDate})`);
  }
  if (measured) lines.push(`measured — batch-size ${measured.batchSize} · sample ${measured.sample} · source ${measured.source}`);
  return `${lines.join("\n")}\n`;
}

const USAGE =
  "usage: correction-budget.mjs --unit <unit-dir> [--rounds-spent <n>] [--repo <dir>] [--json]\n" +
  "       correction-budget.mjs --measure [--repo <dir>] [--json]";

function parseArgs(argv) {
  const opts = { unit: null, measure: false, roundsSpent: 0, repo: null, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--measure") opts.measure = true;
    else if (arg === "--json") opts.json = true;
    else if (arg === "--unit") opts.unit = argv[++i];
    else if (arg === "--repo") opts.repo = argv[++i];
    else if (arg === "--rounds-spent") opts.roundsSpent = Number(argv[++i]);
    else if (arg === "--help" || arg === "-h") return { help: true };
    else return { error: `unknown argument ${arg}` };
  }
  if (opts.unit !== null && typeof opts.unit !== "string") return { error: "--unit needs a directory" };
  if (opts.repo !== null && typeof opts.repo !== "string") return { error: "--repo needs a directory" };
  if (!Number.isInteger(opts.roundsSpent) || opts.roundsSpent < 0) return { error: "--rounds-spent needs a non-negative integer" };
  if (!opts.measure && opts.unit === null) return { error: "--unit is required (or --measure)" };
  return { opts };
}

function main(argv) {
  const parsed = parseArgs(argv);
  if (parsed.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }
  if (parsed.error) {
    process.stderr.write(`correction-budget: ${parsed.error}\n${USAGE}\n`);
    process.exitCode = 2;
    return;
  }

  const root = parsed.opts.repo
    ? path.resolve(parsed.opts.repo)
    : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const measured = measureBatchSize(root);

  if (parsed.opts.measure) {
    if (parsed.opts.json) {
      process.stdout.write(`${JSON.stringify(measured, null, 2)}\n`);
      return;
    }
    const lines = [
      BUDGET_CONTRACT,
      `batch-size | ${measured.batchSize}`,
      `sample | ${measured.sample}`,
      `source | ${measured.source}`,
    ];
    if (measured.reason) lines.push(`reason | ${measured.reason}`);
    process.stdout.write(`${lines.join("\n")}\n`);
    return;
  }

  const unitDir = path.resolve(parsed.opts.unit);
  const rows = openRowsOf(unitDir);
  if (rows === null) {
    process.stderr.write(`correction-budget: no findings ledger under ${unitDir}\n`);
    process.exitCode = 1;
    return;
  }

  const budget = computeBudget({ rows, batchSize: measured.batchSize, roundsSpent: parsed.opts.roundsSpent });
  if (parsed.opts.json) {
    process.stdout.write(`${JSON.stringify({ ...budget, measured }, null, 2)}\n`);
  } else {
    process.stdout.write(block(budget, measured));
  }
  if (budget.verdict !== "PASS") process.exitCode = 1;
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main(process.argv.slice(2));
