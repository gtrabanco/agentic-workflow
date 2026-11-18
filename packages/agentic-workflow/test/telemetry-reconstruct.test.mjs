// telemetry-reconstruct.test.mjs — issue #624, unit
// docs/fix/624-reconstruct-telemetry-from-pi-transcripts.
//
// The frozen corpus for `agentic-workflow telemetry reconstruct`. Two halves:
// the pure mapping is driven against committed Pi transcripts, and the CLI /
// merge is driven against a throwaway project with its own agent directory, so
// no case reads the real `~/.pi/agent/sessions` store or the repository ledger.
//
// Red-first: the import below fails on `ERR_MODULE_NOT_FOUND` until
// `src/telemetry/reconstruct.mjs` exists, and the CLI cases fail until the bin
// dispatches `telemetry`. The suite lands before the module (repo rule).

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { TELEMETRY_SAMPLE_FIELDS } from "@gtrabanco/agentic-workflow-schema";

import {
  DEFAULT_JSONL,
  RECONSTRUCT_CONTRACT_ID,
  listTranscripts,
  main,
  mergeIntoJsonl,
  mergeIntoLedger,
  piAgentDir,
  reconstructProject,
  reconstructRecord,
  sessionKeyOf,
  statsOf,
} from "../src/telemetry/reconstruct.mjs";
import { COLUMNS } from "../src/telemetry/ledger.mjs";
import { tempRoot } from "../../../scripts/temp-root.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, "fixtures/telemetry-reconstruct/sessions");
const BIN = path.join(HERE, "..", "bin", "agentic-workflow.mjs");

/** A fixture transcript's text, with its `<PROJECT>` placeholder still in place. */
function fixture(name) {
  return fs.readFileSync(path.join(FIXTURES, name), "utf8");
}

/** A throwaway Pi agent directory holding the named fixtures. */
function agentStore(project, files = {}) {
  const agent = tempRoot("reconstruct-agent-");
  const dir = path.join(agent, "sessions", "--project--");
  fs.mkdirSync(dir, { recursive: true });
  for (const [name, source] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), source.split("<PROJECT>").join(project));
  }
  return agent;
}

/** A throwaway project with an empty `tier-cost@2` ledger and a JSONL store. */
function project({ ledger = true, jsonl = false } = {}) {
  const root = tempRoot("reconstruct-project-");
  if (ledger) {
    fs.mkdirSync(path.join(root, "docs/workflow"), { recursive: true });
    fs.writeFileSync(path.join(root, "docs/workflow/TIER_COST.md"), ledgerText([]));
  }
  if (jsonl) {
    fs.mkdirSync(path.join(root, ".pi/.telemetry"), { recursive: true });
    fs.writeFileSync(path.join(root, DEFAULT_JSONL), "");
  }
  return root;
}

/** The ledger document the sink appends to: the grammar, the header and rows. */
function ledgerText(rows) {
  const columns = COLUMNS.join(" | ");
  return [
    "# Ledger fixture",
    "",
    "```text",
    "tier-cost@2",
    `column | shape | what it holds`,
    ...COLUMNS.map((column) => `${column} | <value> | a column`),
    "```",
    "",
    `| ${columns} |`,
    `|${COLUMNS.map(() => "---").join("|")}|`,
    ...rows.map((row) => `| ${COLUMNS.map((column) => String(row[column] ?? "null")).join(" | ")} |`),
    "",
  ].join("\n");
}

/** A full record, as the live sink writes it. */
function liveRecord(source, overrides = {}) {
  return {
    unit: "383-measured-acceptance",
    phase: "execute-phase",
    version: "4.10.0",
    model: "qwen3.6",
    changed_paths: 3,
    tokens: 100,
    turns: 1,
    input_tokens: 10,
    output_tokens: 20,
    cache_read_tokens: 30,
    cache_write_tokens: 40,
    reasoning_tokens: 5,
    model_ms: 1000,
    tool_ms: 200,
    observed: "2026-11-01",
    source,
    ...overrides,
  };
}

/** Run the command with captured streams; returns the exit code and both. */
function run(argv, options = {}) {
  let stdout = "";
  let stderr = "";
  const code = main(argv, {
    cwd: options.cwd ?? process.cwd(),
    env: options.env ?? {},
    stdout: (text) => (stdout += text),
    stderr: (text) => (stderr += text),
  });
  return { code, stdout, stderr };
}

// ── The mapping (S4) ─────────────────────────────────────────────────────

test("record: a transcript maps to the published sample fields, in the published order", () => {
  const { record } = reconstructRecord(path.join(FIXTURES, "session-full.jsonl"));
  assert.deepEqual(Object.keys(record), [...TELEMETRY_SAMPLE_FIELDS], "the record carries the published field order");
  assert.deepEqual(record, {
    unit: null,
    phase: null,
    version: null,
    model: "qwen3.6",
    changed_paths: null,
    tokens: 402,
    turns: 2,
    input_tokens: 300,
    output_tokens: 30,
    cache_read_tokens: 60,
    cache_write_tokens: 1,
    reasoning_tokens: 11,
    model_ms: 2000,
    tool_ms: null,
    observed: "2026-11-01",
    source: "pi:reconstruct=sess-full",
  });
  assert.equal(record.model_ms, 2000, "model_ms sums assistant durations only; the toolResult's 700ms is not model time");
});

test("record: the fields Pi cannot answer are null, never invented", () => {
  const { record } = reconstructRecord(path.join(FIXTURES, "session-full.jsonl"));
  for (const field of ["unit", "phase", "version", "changed_paths", "tool_ms"]) {
    assert.equal(record[field], null, `${field} is null — the transcript cannot answer it`);
  }
});

test("record: the model is the assistant majority, falling back to the last model_change", () => {
  const { record } = reconstructRecord(path.join(FIXTURES, "session-change-only.jsonl"));
  assert.equal(record.model, "other-model", "no assistant message names a model, so the model_change answers");
  assert.equal(record.tokens, 11, "no totalTokens means the five provider fields are summed");
  assert.equal(record.input_tokens, 5);
  assert.equal(record.output_tokens, 6);
  assert.equal(record.observed, "2026-11-02");
});

test("record: a transcript the mapping cannot trust is skipped with its reason, never invented", () => {
  const noUsage = reconstructRecord(path.join(FIXTURES, "session-no-usage.jsonl"));
  assert.match(noUsage.skip, /assistant/);
  const malformed = reconstructRecord(path.join(FIXTURES, "session-malformed.jsonl"));
  assert.match(malformed.skip, /malformed line/);
  const noTime = reconstructRecord(path.join(FIXTURES, "session-no-timestamp.jsonl"));
  assert.match(noTime.skip, /timestamp/);
});

// ── Discovery (S2, S3a) ──────────────────────────────────────────────────

test("discovery: only the project's own transcripts are read, and subagent artifacts are not sessions", () => {
  const root = project();
  const agent = agentStore(root, { "session-full.jsonl": fixture("session-full.jsonl"), "session-change-only.jsonl": fixture("session-change-only.jsonl") });
  const other = path.join(agent, "sessions", "--other--");
  fs.mkdirSync(other, { recursive: true });
  fs.writeFileSync(path.join(other, "session-full.jsonl"), fixture("session-full.jsonl").split("<PROJECT>").join("/somewhere/else"));
  const subagentFile = path.join(agent, "sessions", "--project--", "x_subagent_y.jsonl");
  fs.writeFileSync(subagentFile, fixture("session-full.jsonl"));
  fs.mkdirSync(path.join(agent, "sessions", "subagent-artifacts--project--"), { recursive: true });
  fs.writeFileSync(
    path.join(agent, "sessions", "subagent-artifacts--project--", "session-full.jsonl"),
    fixture("session-full.jsonl"),
  );

  const found = listTranscripts({ agentDir: agent, project: root });
  assert.deepEqual(
    found.map((entry) => path.basename(entry.path)),
    ["session-change-only.jsonl", "session-full.jsonl"],
    "the other project and every subagent artifact are excluded",
  );
  assert.equal(piAgentDir({ PI_CODING_AGENT_DIR: "/custom/agent" }, "/home/x"), "/custom/agent");
  assert.equal(piAgentDir({}, "/home/x"), path.join("/home/x", ".pi", "agent"));
});

// ── The stats envelope (S2) ──────────────────────────────────────────────

test("stats: totals, the two breakdowns and the skipped rows are one JSON answer", () => {
  const root = project();
  const agent = agentStore(root, {
    "session-full.jsonl": fixture("session-full.jsonl"),
    "session-change-only.jsonl": fixture("session-change-only.jsonl"),
    "session-no-usage.jsonl": fixture("session-no-usage.jsonl"),
  });
  const { records, skipped } = reconstructProject({ agentDir: agent, project: root });
  const plain = statsOf({ project: root, records, skipped });
  assert.equal(plain.contract, RECONSTRUCT_CONTRACT_ID);
  assert.equal(plain.sessions, 2);
  assert.equal(plain.skipped, 1);
  assert.deepEqual(plain.totals, {
    sessions: 2,
    tokens: 413,
    turns: 3,
    input_tokens: 305,
    output_tokens: 36,
    cache_read_tokens: 60,
    cache_write_tokens: 1,
    reasoning_tokens: 11,
    model_ms: 2100,
  });
  assert.equal(plain.by_model, undefined, "no flag means no breakdown");

  const byModel = statsOf({ project: root, records, skipped, byModel: true });
  assert.deepEqual(byModel.by_model.map((group) => group.model), ["qwen3.6", "other-model"]);
  assert.equal(byModel.by_model[0].tokens, 402);

  const byDate = statsOf({ project: root, records, skipped, byDate: true });
  assert.deepEqual(byDate.by_date.map((group) => group.observed), ["2026-11-01", "2026-11-02"]);

  const filtered = run(["reconstruct", "stats", "--project", root], { env: { PI_CODING_AGENT_DIR: agent } });
  assert.equal(filtered.code, 0);
  const printed = JSON.parse(filtered.stdout);
  assert.equal(printed.contract, RECONSTRUCT_CONTRACT_ID);
  assert.equal(printed.sessions, 2);
  assert.equal(printed.by_model, undefined);
});

// ── Samples (S2) ─────────────────────────────────────────────────────────

test("samples: stdout carries one JSON line per record, and --jsonl writes the same dump", () => {
  const root = project();
  const agent = agentStore(root, {
    "session-full.jsonl": fixture("session-full.jsonl"),
    "session-change-only.jsonl": fixture("session-change-only.jsonl"),
  });
  const printed = run(["reconstruct", "samples", "--project", root], { env: { PI_CODING_AGENT_DIR: agent } });
  assert.equal(printed.code, 0);
  const lines = printed.stdout.trim().split("\n");
  assert.equal(lines.length, 2);
  assert.deepEqual(Object.keys(JSON.parse(lines[0])), [...TELEMETRY_SAMPLE_FIELDS]);
  assert.equal(JSON.parse(lines[0]).source, "pi:reconstruct=sess-change");

  const dump = path.join(root, "dump.jsonl");
  const written = run(["reconstruct", "samples", "--project", root, "--jsonl", dump], { env: { PI_CODING_AGENT_DIR: agent } });
  assert.equal(written.code, 0);
  assert.equal(fs.readFileSync(dump, "utf8"), printed.stdout, "the dump is byte-identical to stdout");
  assert.equal(JSON.parse(written.stdout).samples, 2);
});

// ── Merge (S3a) ──────────────────────────────────────────────────────────

test("merge: write adds only the sessions a destination does not already carry, across both source prefixes", () => {
  const root = project({ jsonl: true });
  const agent = agentStore(root, {
    "session-full.jsonl": fixture("session-full.jsonl"),
    "session-change-only.jsonl": fixture("session-change-only.jsonl"),
  });
  const jsonl = path.join(root, DEFAULT_JSONL);
  const ledger = path.join(root, "docs/workflow/TIER_COST.md");
  // The full session already reached both stores live: the same session id under
  // the live prefix must stop the reconstructed record from being counted twice.
  fs.writeFileSync(jsonl, `${JSON.stringify(liveRecord("pi:session=sess-full"))}\n`);
  fs.writeFileSync(ledger, ledgerText([liveRecord("pi:session=sess-full")]));

  const first = run(["reconstruct", "write", "--jsonl", jsonl, "--ledger", ledger], { cwd: root, env: { PI_CODING_AGENT_DIR: agent } });
  assert.equal(first.code, 0, first.stderr);
  const receipt = JSON.parse(first.stdout);
  assert.equal(receipt.reconstructed, 2);
  assert.equal(receipt.jsonl.added, 1);
  assert.equal(receipt.ledger.added, 1);

  const jsonlLines = fs.readFileSync(jsonl, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  assert.deepEqual(jsonlLines.map((line) => sessionKeyOf(line.source)), ["sess-full", "sess-change"]);
  const ledgerTextNow = fs.readFileSync(ledger, "utf8");
  assert.equal(ledgerTextNow.split("\n").filter((line) => line.includes("pi:reconstruct=sess-change")).length, 1);
  assert.ok(ledgerTextNow.includes("| null | null | null | other-model | 0 | 11 | 1 |"), "the unattributed row is the documented projection");

  const second = run(["reconstruct", "write", "--jsonl", jsonl, "--ledger", ledger], { cwd: root, env: { PI_CODING_AGENT_DIR: agent } });
  assert.equal(second.code, 0);
  assert.deepEqual(JSON.parse(second.stdout).jsonl, { path: jsonl, status: "merged", added: 0, skipped: 2 });
  assert.deepEqual(JSON.parse(second.stdout).ledger, { path: ledger, status: "merged", added: 0, skipped: 2 });
});

test("merge: write refuses before writing anything when a destination is not a ledger", () => {
  const root = project();
  const agent = agentStore(root, { "session-full.jsonl": fixture("session-full.jsonl") });
  const jsonl = path.join(root, DEFAULT_JSONL);
  const ledger = path.join(root, "docs/workflow/TIER_COST.md");
  const before = fs.readFileSync(ledger, "utf8");
  fs.writeFileSync(ledger, "# no grammar here\n");
  const refused = run(["reconstruct", "write", "--jsonl", jsonl, "--ledger", ledger], { cwd: root, env: { PI_CODING_AGENT_DIR: agent } });
  assert.equal(refused.code, 2);
  assert.match(refused.stderr, /RECONSTRUCT REFUSAL —/);
  assert.equal(fs.existsSync(jsonl), false, "the JSONL was not created before the ledger was validated");
  assert.equal(fs.readFileSync(ledger, "utf8"), "# no grammar here\n");
  fs.writeFileSync(ledger, before);
});

test("merge: a missing ledger is absent when defaulted and a refusal when named", () => {
  const root = project({ ledger: false });
  const agent = agentStore(root, {});
  const defaulted = run(["reconstruct", "write"], { cwd: root, env: { PI_CODING_AGENT_DIR: agent } });
  assert.equal(defaulted.code, 0);
  assert.equal(JSON.parse(defaulted.stdout).ledger.status, "absent");
  assert.equal(fs.existsSync(path.join(root, "docs/workflow/TIER_COST.md")), false, "an absent ledger is never created");

  const named = run(["reconstruct", "write", "--ledger", path.join(root, "missing.md")], { cwd: root, env: { PI_CODING_AGENT_DIR: agent } });
  assert.equal(named.code, 2);
  assert.match(named.stderr, /RECONSTRUCT REFUSAL —/);
});

test("merge: the helpers answer the merge without a CLI, and the record text is the published order", () => {
  const root = project({ jsonl: true });
  const jsonl = path.join(root, DEFAULT_JSONL);
  const records = [liveRecord("pi:reconstruct=a")];
  assert.deepEqual(mergeIntoJsonl({ path: jsonl, records }), { added: 1, skipped: 0 });
  assert.deepEqual(mergeIntoJsonl({ path: jsonl, records }), { added: 0, skipped: 1 });
  const ledger = path.join(root, "docs/workflow/TIER_COST.md");
  assert.deepEqual(mergeIntoLedger({ path: ledger, records }), { added: 1, skipped: 0 });
  assert.deepEqual(mergeIntoLedger({ path: ledger, records }), { added: 0, skipped: 1 });
});

// ── The grammar (S2) ─────────────────────────────────────────────────────

test("grammar: an unknown operation, flag or missing value is a refusal, and nothing is written", () => {
  const root = project({ jsonl: true });
  const before = fs.readFileSync(path.join(root, DEFAULT_JSONL), "utf8");
  for (const argv of [
    ["reconstruct"],
    ["reconstruct", "bogus"],
    ["reconstruct", "stats", "--bogus"],
    ["reconstruct", "samples", "--jsonl"],
    ["reconstruct", "write", "extra"],
    ["telemetry"],
  ]) {
    const answered = run(argv, { cwd: root });
    assert.equal(answered.code, 2, `${argv.join(" ")} is refused`);
    assert.match(answered.stderr, /RECONSTRUCT REFUSAL —/);
    assert.equal(JSON.parse(answered.stdout).contract, RECONSTRUCT_CONTRACT_ID);
    assert.equal(JSON.parse(answered.stdout).error, "refusal");
  }
  assert.equal(fs.readFileSync(path.join(root, DEFAULT_JSONL), "utf8"), before, "no destination was touched");
});

// ── The live-tree guard (S3a) ────────────────────────────────────────────

test("write touches nothing outside the two destinations it names", () => {
  const root = project({ jsonl: true });
  const agent = agentStore(root, { "session-full.jsonl": fixture("session-full.jsonl") });
  const snapshot = () => {
    const seen = {};
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else seen[path.relative(root, full)] = fs.readFileSync(full, "utf8");
      }
    };
    walk(root);
    return seen;
  };
  const before = snapshot();
  const runOnce = run(["reconstruct", "write"], { cwd: root, env: { PI_CODING_AGENT_DIR: agent } });
  assert.equal(runOnce.code, 0, runOnce.stderr);
  const after = snapshot();
  const changed = Object.keys({ ...before, ...after }).filter((file) => before[file] !== after[file]);
  assert.deepEqual(changed.sort(), [".pi/.telemetry/sessions.jsonl", "docs/workflow/TIER_COST.md"]);
});

// ── The bin (S2) ─────────────────────────────────────────────────────────

test("bin: `agentic-workflow telemetry reconstruct stats` answers through the real binary", () => {
  const root = project();
  const agent = agentStore(root, { "session-full.jsonl": fixture("session-full.jsonl") });
  const spawned = spawnSync(
    process.execPath,
    [BIN, "telemetry", "reconstruct", "stats", "--project", root],
    { encoding: "utf8", env: { ...process.env, PI_CODING_AGENT_DIR: agent } },
  );
  assert.equal(spawned.status, 0, spawned.stderr);
  const receipt = JSON.parse(spawned.stdout);
  assert.equal(receipt.contract, RECONSTRUCT_CONTRACT_ID);
  assert.equal(receipt.totals.tokens, 402);
});
