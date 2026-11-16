#!/usr/bin/env node
/**
 * telemetry-report.mjs — the session samples as a report (issue #504 S5, unit
 * `docs/features/494-telemetry-by-turn/`).
 *
 * The ledger and the per-session JSONL hold the same sample; this command is
 * what answers a question about it: which model spent what, in which phase, over
 * which window. It is the invoked form of the request's `pi telemetry report` —
 * a Pi extension cannot create a `pi <subcommand>` verb, so the bun script the
 * request names beside it (`bun scripts/telemetry-report.mjs`) is the door.
 *
 * Three rules, each a case in `scripts/telemetry-report.test.mjs`:
 *
 *  - **JSON by default.** stdout carries data; `--human` is the one markdown
 *    answer, and the diagnostics go to stderr.
 *  - **One source per run.** `--ledger` reads the document, `--jsonl` reads the
 *    stream; asking for both is a refusal, because a silent preference would
 *    make two different reports answer the same command.
 *  - **A refusal names what it rejected.** An unknown flag, a missing value, a
 *    malformed date or an unreadable file exits 1 with a JSON error on stdout and
 *    the reason on stderr — never an empty table that reads like "no cost".
 *
 * Samples come from the ledger through `scripts/tier-cost.mjs`'s own parser, so
 * `tier-cost@1` and `tier-cost@2` rows are read by the module that owns the
 * grammar. The schema package's built vocabulary supplies the field order and
 * `--schema`; the root gate rebuilds that `dist/` when it is stale.
 */

import fs from "node:fs";
import path from "node:path";

import {
  TELEMETRY_SAMPLE_FIELDS,
  telemetrySampleJsonSchema,
} from "../packages/agentic-workflow-schema/dist/index.js";
import { parseLedger } from "./tier-cost.mjs";

/** The document this command answers; a versioned id, like every other receipt. */
export const REPORT_CONTRACT_ID = "telemetry-report@1";

/** The one aggregation vocabulary: a group key is a sample field's own value. */
export const GROUP_KEYS = Object.freeze(["phase", "unit"]);

/** The ledger a run reads when it names no source. */
export const DEFAULT_LEDGER = "docs/workflow/TIER_COST.md";

/** The flags this command accepts, each with what it answers. */
const FLAGS = Object.freeze({
  ledger: "read the samples from this ledger document (default docs/workflow/TIER_COST.md)",
  jsonl: "read the samples from this per-session JSONL file instead of a ledger",
  model: "only samples whose model id contains this text (case-insensitive)",
  unit: "only samples of this unit directory, or of this issue number",
  from: "only samples observed on or after this YYYY-MM-DD day",
  to: "only samples observed on or before this YYYY-MM-DD day",
  by: `aggregate the samples by one of: ${GROUP_KEYS.join(", ")}`,
  human: "print a markdown table instead of JSON",
  schema: "print the sample's JSON Schema and exit",
  help: "print this usage and exit",
});

/** The flag spellings that take no value. */
const BOOLEAN_FLAGS = new Set(["human", "schema", "help"]);

/** The fields `--by` sums, in the order the table prints them. */
const SUM_FIELDS = Object.freeze([
  "tokens",
  "input_tokens",
  "output_tokens",
  "cache_read_tokens",
  "cache_write_tokens",
  "reasoning_tokens",
  "turns",
  "changed_paths",
  "model_ms",
  "tool_ms",
]);

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Whether a bound names a day that exists — `2026-11-31` has the shape and no
 * such day (O14: a malformed date is a refusal, never an empty table that reads
 * like "no cost"). The round-trip through `Date.UTC` is the calendar itself:
 * February 29 only survives it in a leap year.
 */
function isCalendarDay(value) {
  if (!ISO_DAY.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Print a JSON answer on stdout and set the exit code. */
function out(payload, code = 0) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  process.exitCode = code;
}

/** A refusal: the receipt on stdout, the reason on stderr, exit 1. */
function refuse(error, message, extra = {}) {
  process.stderr.write(`TELEMETRY REPORT REFUSAL — ${message}\n`);
  out({ contract: REPORT_CONTRACT_ID, error, detail: message, ...extra }, 1);
}

/** The usage text `--help` prints. */
function usage() {
  const lines = [`telemetry-report — ${REPORT_CONTRACT_ID}`, "", "usage: bun scripts/telemetry-report.mjs [flags]", ""];
  for (const [flag, description] of Object.entries(FLAGS)) {
    lines.push(`  --${flag.padEnd(7)} ${description}`);
  }
  return `${lines.join("\n")}\n`;
}

/** The argument vector as a flag map, or the refusal that names what it rejected. */
function parseArgs(argv) {
  const flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) return { error: "unexpected-argument", detail: `unexpected argument: ${arg}` };
    const name = arg.slice(2);
    if (!(name in FLAGS)) return { error: "unknown-flag", detail: `unknown flag: --${name}`, flag: `--${name}` };
    if (BOOLEAN_FLAGS.has(name)) {
      flags[name] = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) return { error: "missing-flag-value", detail: `--${name} needs a value`, flag: `--${name}` };
    flags[name] = value;
    index += 1;
  }
  return { flags };
}

/** One sample normalised to the published field set, in the published order. */
function normalise(row) {
  const sample = {};
  for (const field of TELEMETRY_SAMPLE_FIELDS) sample[field] = field in row ? row[field] : null;
  return sample;
}

/** Whether a sample passes every filter the run asked for. */
function matches(sample, filters) {
  if (filters.model !== null && !String(sample.model ?? "").toLowerCase().includes(filters.model.toLowerCase())) return false;
  if (filters.unit !== null) {
    const unit = String(sample.unit ?? "");
    const wanted = filters.unit;
    const byNumber = /^\d+$/.test(wanted) && unit.startsWith(`${wanted}-`);
    if (unit !== wanted && !byNumber) return false;
  }
  if (filters.from !== null && !(String(sample.observed ?? "") >= filters.from)) return false;
  if (filters.to !== null && !(String(sample.observed ?? "") <= filters.to)) return false;
  return true;
}

/** One group's sums, ordered by the report's own field list. */
function summarise(key, samples) {
  const group = { key, samples: samples.length };
  for (const field of SUM_FIELDS) {
    const { available, total } = samples.reduce(
      (acc, sample) => {
        const value = sample[field];
        return typeof value === "number" ? { available: true, total: acc.total + value } : acc;
      },
      { available: false, total: 0 },
    );
    group[`${field}_sum`] = available ? total : null;
  }
  return group;
}

/** Group the samples by one published key, most expensive first. */
function aggregate(samples, key) {
  const groups = new Map();
  for (const sample of samples) {
    const value = sample[key];
    const name = value === null || value === undefined ? "(unnamed)" : String(value);
    groups.set(name, [...(groups.get(name) ?? []), sample]);
  }
  return [...groups.entries()]
    .map(([name, members]) => summarise(name, members))
    .sort((left, right) => (right.tokens_sum ?? 0) - (left.tokens_sum ?? 0) || left.key.localeCompare(right.key));
}

/** A markdown table of the samples or the groups, whichever the run asked for. */
function humanTable(report) {
  const columns = report.by === null
    ? ["unit", "phase", "version", "model", "tokens", "input_tokens", "output_tokens", "turns", "observed"]
    : ["key", "samples", ...SUM_FIELDS.map((field) => `${field}_sum`)];
  const rows = report.by === null ? report.rows : report.groups;
  const cell = (value) => (value === null || value === undefined ? "" : String(value));
  const lines = [
    `| ${columns.join(" | ")} |`,
    `|${columns.map(() => "---").join("|")}|`,
    ...rows.map((row) => `| ${columns.map((column) => cell(row[column])).join(" | ")} |`),
  ];
  return `${lines.join("\n")}\n`;
}

/** The rows a source answers, or a refusal-shaped `{ error }`. */
function readSamples(flags, cwd) {
  if (flags.ledger !== undefined && flags.jsonl !== undefined) {
    return { error: "two-sources", detail: "two-sources: name --ledger or --jsonl, never both" };
  }
  if (flags.jsonl !== undefined) {
    const file = path.resolve(cwd, flags.jsonl);
    let text;
    try {
      text = fs.readFileSync(file, "utf8");
    } catch (error) {
      return { error: "unreadable-source", detail: `${file}: ${error.message}` };
    }
    const samples = [];
    for (const line of text.split("\n")) {
      if (line.trim() === "") continue;
      try {
        samples.push(normalise(JSON.parse(line)));
      } catch (error) {
        return { error: "unreadable-source", detail: `${file}: a line is not JSON (${error.message})` };
      }
    }
    return { source: { kind: "jsonl", path: file }, samples };
  }

  const file = path.resolve(cwd, flags.ledger ?? DEFAULT_LEDGER);
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    return { error: "unreadable-source", detail: `${file}: ${error.message}` };
  }
  const parsed = parseLedger(text);
  if (parsed.error !== undefined) {
    return { error: `ledger-${parsed.error}`, detail: `${file}: ${parsed.error} (${parsed.detail ?? "no detail"})` };
  }
  return { source: { kind: "ledger", path: file, contract: parsed.contract }, samples: parsed.rows.map(normalise) };
}

/** The CLI. Every branch that exits without a report names why. */
function main(argv, cwd) {
  const parsed = parseArgs(argv);
  if (parsed.error !== undefined) return refuse(parsed.error, parsed.detail, parsed.flag ? { flag: parsed.flag } : {});
  const { flags } = parsed;

  if (flags.help === true) {
    process.stdout.write(usage());
    return;
  }
  if (flags.schema === true) return out(telemetrySampleJsonSchema());
  if (flags.by !== undefined && !GROUP_KEYS.includes(flags.by)) {
    return refuse("unknown-flag-value", `--by accepts ${GROUP_KEYS.join(", ")}, got ${flags.by}`, { flag: "--by" });
  }
  for (const bound of ["from", "to"]) {
    if (flags[bound] !== undefined && !isCalendarDay(flags[bound])) {
      return refuse("bad-date", `--${bound} needs YYYY-MM-DD (a day that exists), got ${flags[bound]}`, { flag: `--${bound}` });
    }
  }

  const read = readSamples(flags, cwd);
  if (read.error !== undefined) return refuse(read.error, read.detail);

  const filters = {
    model: flags.model ?? null,
    unit: flags.unit ?? null,
    from: flags.from ?? null,
    to: flags.to ?? null,
  };
  const samples = read.samples.filter((sample) => matches(sample, filters));
  const report = {
    contract: REPORT_CONTRACT_ID,
    source: read.source,
    filters,
    samples: samples.length,
    by: flags.by ?? null,
    ...(flags.by === undefined ? { rows: samples } : { groups: aggregate(samples, flags.by) }),
  };

  if (flags.human === true) {
    process.stdout.write(humanTable(report));
    return;
  }
  return out(report);
}

main(process.argv.slice(2), process.cwd());
