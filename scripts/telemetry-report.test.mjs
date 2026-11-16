#!/usr/bin/env node

/**
 * telemetry-report.test.mjs — the report CLI (issue #504 S5).
 *
 * The corpus is the flag matrix the request spells: JSON by default, one filter
 * per documented key, two aggregations, a human table on request, and a refusal
 * that names what it rejected instead of answering an empty table. Every case
 * runs the script as a process, so its exit code and its two streams are what is
 * asserted — a library call would prove neither.
 *
 * The fixture is a throwaway project (`mktemp -d`), never the real ledger.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tempRoot } from "./temp-root.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts/telemetry-report.mjs");

const COLUMNS = [
  "unit", "phase", "version", "model", "changed_paths", "tokens", "turns",
  "input_tokens", "output_tokens", "cache_read_tokens", "cache_write_tokens", "reasoning_tokens",
  "model_ms", "tool_ms", "observed", "source",
];

/** One sample row, in the published column order. */
function row(unit, { phase = "execute-phase", model = "glm5.3-flash", tokens = 1000, observed = "2026-11-10", source = "pi:session=a", input = 600, output = 300 } = {}) {
  return [unit, phase, "4.10.0", model, 4, tokens, 3, input, output, 60, 20, 20, 900, 60, observed, source];
}

/** A ledger carrying the grammar block and the given rows. */
function ledgerText(rows) {
  const block = COLUMNS.map((column) => `${column} | \`x\` | what it holds`).join("\n");
  const header = `| ${COLUMNS.join(" | ")} |\n|${COLUMNS.map(() => "---").join("|")}|`;
  const body = rows.map((cells) => `\n| ${cells.join(" | ")} |`).join("");
  return `# Measured acceptance\n\n\`\`\`text\ntier-cost@2\ncolumn | shape | what it holds\n${block}\n\`\`\`\n\n## Samples\n\n${header}${body}\n`;
}

/** A throwaway project with a ledger and, on request, a JSONL file. */
function project({ rows = [row("111-a"), row("222-b", { phase: "review-change", tokens: 3000 }), row("111-a", { model: "deepseek-v4-flash", tokens: 500, observed: "2026-11-14" })], jsonl = null } = {}) {
  const dir = tempRoot("telemetry-report-");
  fs.mkdirSync(path.join(dir, "docs/workflow"), { recursive: true });
  const ledger = path.join(dir, "docs/workflow/TIER_COST.md");
  fs.writeFileSync(ledger, ledgerText(rows));
  let jsonlPath = null;
  if (jsonl) {
    jsonlPath = path.join(dir, ".pi/.telemetry/sessions.jsonl");
    fs.mkdirSync(path.dirname(jsonlPath), { recursive: true });
    fs.writeFileSync(jsonlPath, jsonl.map((sample) => `${JSON.stringify(sample)}\n`).join(""));
  }
  return { dir, ledger, jsonlPath };
}

/** Run the CLI and parse its stdout as JSON, asserting the exit code. */
function run(args, { cwd = ROOT, status = 0 } = {}) {
  const result = spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8", cwd });
  assert.equal(result.status, status, `exit ${result.status} (expected ${status}): ${result.stderr}`);
  return result;
}

const json = (args, options) => JSON.parse(run(args, options).stdout);

const SAMPLE = {
  unit: "111-a",
  phase: "review-change",
  version: "4.10.0",
  model: "deepseek-v4-flash",
  changed_paths: 3,
  tokens: 2000,
  turns: 2,
  input_tokens: 1200,
  output_tokens: 800,
  cache_read_tokens: 0,
  cache_write_tokens: 0,
  reasoning_tokens: 0,
  model_ms: 500,
  tool_ms: 40,
  observed: "2026-11-12",
  source: "pi:session=c",
};

test("the default answer is JSON on stdout, and it names the samples it read", () => {
  const { ledger } = project();
  const report = json(["--ledger", ledger]);
  assert.equal(report.contract, "telemetry-report@1");
  assert.equal(report.samples, 3);
  assert.equal(report.rows.length, 3);
  assert.deepEqual(Object.keys(report.rows[0]), COLUMNS, "a row carries the published field set, in order");
  assert.equal(report.source.kind, "ledger");
  assert.equal(report.by, null, "no aggregation unless one is asked for");
});

test("--model filters by the model id, case-insensitively", () => {
  const { ledger } = project();
  const report = json(["--ledger", ledger, "--model", "DEEPSEEK"]);
  assert.equal(report.samples, 1);
  assert.equal(report.rows[0].model, "deepseek-v4-flash");
  assert.deepEqual(report.filters, { model: "DEEPSEEK", unit: null, from: null, to: null });
});

test("--unit matches a directory name or its issue number, like the command that names one", () => {
  const { ledger } = project();
  const byNumber = json(["--ledger", ledger, "--unit", "111"]);
  assert.equal(byNumber.samples, 2, "the numeric prefix selects every sample of that issue");
  assert.deepEqual([...new Set(byNumber.rows.map((entry) => entry.unit))], ["111-a"]);

  const byName = json(["--ledger", ledger, "--unit", "222-b"]);
  assert.equal(byName.samples, 1);
});

test("--from and --to bound the observed day inclusively", () => {
  const { ledger } = project();
  assert.equal(json(["--ledger", ledger, "--from", "2026-11-14"]).samples, 1);
  assert.equal(json(["--ledger", ledger, "--to", "2026-11-10"]).samples, 2, "the day itself is inside the bound");
  const window = json(["--ledger", ledger, "--from", "2026-11-10", "--to", "2026-11-14"]);
  assert.equal(window.samples, 3, "both bounds are inclusive");
  assert.equal(json(["--ledger", ledger, "--from", "2026-11-11", "--to", "2026-11-13"]).samples, 0, "a window with no sample is zero rows, not a refusal");
});

test("--from/--to refuse a shape-valid day that does not exist — a malformed date is a refusal, never an empty table (O14)", () => {
  const { ledger } = project();
  for (const bound of ["--from", "--to"]) {
    for (const value of ["2026-11-31", "2026-02-30", "2026-02-29", "2026-13-99", "2026-00-10"]) {
      const refused = spawnSync(process.execPath, [CLI, "--ledger", ledger, bound, value], { encoding: "utf8" });
      assert.equal(refused.status, 1, `${bound} ${value} is no day that exists and must be refused, got exit ${refused.status}`);
      assert.equal(JSON.parse(refused.stdout).error, "bad-date");
      assert.match(refused.stderr, new RegExp(`${bound} needs`), "the bound is named on stderr");
    }
  }
  // 2028 is a leap year: that leap day exists and answers a report with exit 0.
  assert.equal(json(["--ledger", ledger, "--from", "2028-02-29", "--to", "2028-03-01"]).samples, 0, "an existing bound day stays a valid window");
});

test("--by phase groups the samples and sums what they carried", () => {
  const { ledger } = project();
  const report = json(["--ledger", ledger, "--by", "phase"]);
  assert.equal(report.by, "phase");
  assert.equal(report.samples, 3);
  assert.equal(report.rows, undefined, "an aggregation answers groups, not the raw rows");
  const [first, second] = report.groups;
  assert.equal(first.key, "review-change");
  assert.equal(first.samples, 1);
  assert.equal(first.tokens_sum, 3000, "groups are ordered by tokens, the question this report exists to answer");
  assert.equal(second.key, "execute-phase");
  assert.equal(second.samples, 2);
  assert.equal(second.tokens_sum, 1500);
  assert.equal(second.input_tokens_sum, 1200);
  assert.equal(second.turns_sum, 6);
});

test("--by unit groups by the unit directory", () => {
  const { ledger } = project();
  const report = json(["--ledger", ledger, "--by", "unit"]);
  assert.deepEqual(report.groups.map((group) => group.key), ["222-b", "111-a"], "the most expensive unit leads, whichever directory it is");
  assert.equal(report.groups[0].tokens_sum, 3000);
  assert.equal(report.groups[1].samples, 2);
  assert.equal(report.groups[1].tokens_sum, 1500);
});

test("--human renders the same data as a markdown table and nothing else", () => {
  const { ledger } = project();
  const result = run(["--ledger", ledger, "--by", "phase", "--human"]);
  const lines = result.stdout.split("\n").filter((line) => line !== "");
  assert.ok(lines.every((line) => line.startsWith("|")), "every line of a markdown table is a table row");
  assert.match(lines[0], /^\| key \| samples \|/);
  assert.match(result.stdout, /review-change/);
  assert.doesNotMatch(result.stdout, /^\{/, "the human answer is not JSON");
});

test("--jsonl reads the per-session file instead of the ledger, and one source is the rule", () => {
  const { ledger, jsonlPath } = project({ jsonl: [SAMPLE, { ...SAMPLE, unit: "222-b", source: "pi:session=d" }] });
  const report = json(["--jsonl", jsonlPath]);
  assert.equal(report.source.kind, "jsonl");
  assert.equal(report.samples, 2);
  assert.equal(report.rows[0].model, "deepseek-v4-flash");

  const both = spawnSync(process.execPath, [CLI, "--ledger", ledger, "--jsonl", jsonlPath], { encoding: "utf8" });
  assert.equal(both.status, 1, "two sources are a refusal, not a silent preference");
  assert.match(JSON.parse(both.stdout).error, /two-sources/);
});

test("a report it cannot answer is a refusal that names what it rejected", () => {
  const { ledger } = project();
  const unknown = spawnSync(process.execPath, [CLI, "--ledger", ledger, "--nope"], { encoding: "utf8" });
  assert.equal(unknown.status, 1);
  assert.equal(JSON.parse(unknown.stdout).error, "unknown-flag");
  assert.match(unknown.stderr, /--nope/, "the rejected flag is named on stderr, where diagnostics belong");

  const missing = spawnSync(process.execPath, [CLI, "--ledger"], { encoding: "utf8" });
  assert.equal(missing.status, 1);
  assert.equal(JSON.parse(missing.stdout).error, "missing-flag-value");

  const date = spawnSync(process.execPath, [CLI, "--ledger", ledger, "--from", "14/11/2026"], { encoding: "utf8" });
  assert.equal(date.status, 1);
  assert.equal(JSON.parse(date.stdout).error, "bad-date");

  const absent = spawnSync(process.execPath, [CLI, "--ledger", path.join(ROOT, "no-such-ledger.md")], { encoding: "utf8" });
  assert.equal(absent.status, 1);
  assert.equal(JSON.parse(absent.stdout).error, "unreadable-source");

  const by = spawnSync(process.execPath, [CLI, "--ledger", ledger, "--by", "model"], { encoding: "utf8" });
  assert.equal(by.status, 1);
  assert.equal(JSON.parse(by.stdout).error, "unknown-flag-value", "an aggregation key outside the published pair is refused");
});

test("--schema prints the sample's JSON Schema, and --help the documented flags", async () => {
  const { telemetrySampleJsonSchema } = await import("../packages/agentic-workflow-schema/dist/index.js");
  const printed = json(["--schema"]);
  assert.deepEqual(printed, telemetrySampleJsonSchema(), "the schema is the published one, never a second copy");

  const help = run(["--help"]);
  for (const flag of ["--ledger", "--jsonl", "--model", "--unit", "--from", "--to", "--by", "--human", "--schema"]) {
    assert.match(help.stdout, new RegExp(flag), `the usage names ${flag}`);
  }
});
