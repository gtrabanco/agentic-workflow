// telemetry-jsonl-sink.test.mjs — issue #504 S3: a session's sample also lands
// as one JSON object per line, beside the markdown ledger.
//
// The ledger is a document a human reads and a reader parses; a JSONL file is
// what an analysis tool streams. Both carry the same sample, so the corpus here
// is the shape a consumer depends on: one line per sample, every line valid
// JSON, the published field set and nothing else, and a second session appending
// without rewriting the first line.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { createJsonlSink } from "../dist/telemetry-sinks.js";
import { createTelemetryWiring } from "../dist/extension/telemetry-wiring.js";
import { TELEMETRY_SAMPLE_FIELDS } from "@gtrabanco/agentic-workflow-schema";
import { tempRoot } from "../../../scripts/temp-root.mjs";

const SAMPLE = {
  unit: "494-telemetry-by-turn",
  phase: "execute-phase",
  version: "4.10.0",
  model: "anthropic/claude-sonnet-4-5",
  changed_paths: 7,
  tokens: 1_500,
  turns: 4,
  input_tokens: 800,
  output_tokens: 300,
  cache_read_tokens: 250,
  cache_write_tokens: 100,
  reasoning_tokens: 50,
  model_ms: 9_400,
  tool_ms: 600,
  observed: "2026-11-17",
  source: "pi:session=abc",
};

/** A throwaway project root. */
function project() {
  return tempRoot("telemetry-jsonl-");
}

/** The lines of a JSONL file, parsed. */
function lines(file) {
  return fs.readFileSync(file, "utf8").split("\n").filter((line) => line !== "").map((line) => JSON.parse(line));
}

test("one sample is one line of JSON, carrying exactly the published field set", () => {
  const root = project();
  const file = path.join(root, "sessions.jsonl");
  createJsonlSink({ path: file }).write(SAMPLE);

  const text = fs.readFileSync(file, "utf8");
  assert.equal(text.endsWith("\n"), true, "a line file ends with a newline, so appending is a line append");
  assert.equal(text.split("\n").filter((line) => line !== "").length, 1);

  const [record] = lines(file);
  assert.deepEqual(Object.keys(record), [...TELEMETRY_SAMPLE_FIELDS], "the line is the sample, in the ledger's own column order");
  assert.deepEqual(record, SAMPLE, "no value is dropped, added or re-typed");
});

test("two sessions append two lines, and the first is never rewritten", () => {
  const root = project();
  const file = path.join(root, "sessions.jsonl");
  const sink = createJsonlSink({ path: file });
  sink.write(SAMPLE);
  const afterFirst = fs.readFileSync(file, "utf8");
  sink.write({ ...SAMPLE, source: "pi:session=def", tokens: 2_000 });

  const after = fs.readFileSync(file, "utf8");
  assert.ok(after.startsWith(afterFirst), "the second write left the first line byte-identical");
  assert.deepEqual(lines(file).map((row) => row.source), ["pi:session=abc", "pi:session=def"]);
});

test("the directory is created on demand: a project needs no .pi directory first", () => {
  const root = project();
  const file = path.join(root, ".pi/.telemetry/sessions.jsonl");
  createJsonlSink({ path: file }).write(SAMPLE);
  assert.equal(fs.existsSync(file), true);
  assert.equal(lines(file).length, 1);
});

test("the file is data only: every line parses, so no prose can be appended to it", () => {
  const root = project();
  const file = path.join(root, "sessions.jsonl");
  const sink = createJsonlSink({ path: file });
  for (let index = 0; index < 3; index += 1) sink.write({ ...SAMPLE, turns: index });
  for (const line of fs.readFileSync(file, "utf8").split("\n").filter((row) => row !== "")) {
    assert.doesNotThrow(() => JSON.parse(line), `every line is JSON: ${line}`);
  }
});

test("a sink that cannot write throws, so the accumulator can report it and keep the other sinks", () => {
  const root = project();
  const blocker = path.join(root, "blocked");
  fs.writeFileSync(blocker, "not a directory\n");
  const sink = createJsonlSink({ path: path.join(blocker, "sessions.jsonl") });
  assert.throws(() => sink.write(SAMPLE));
});

/** A throwaway project that opts telemetry in: a unit doc, a ledger, the wiring's clock. */
function shippedProject() {
  const root = project();
  fs.mkdirSync(path.join(root, "docs/fix/494-telemetry-by-turn"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "docs/fix/494-telemetry-by-turn/SPEC.md"),
    "# fix/494-telemetry-by-turn\n\n## Risk tier\n\n- **Tier** — `standard` · **Task Size** — `small`\n\n## Tasks\n\n- P1 — a phase (validator: `true` exits 0)\n\n## Log\n\n- **E1** — 2026-11-17, `true` · exit 0 · ok.\n",
  );
  const columns = ["unit", "changed_paths", "tokens", "turns", "model_ms", "tool_ms", "observed", "source"];
  fs.mkdirSync(path.join(root, "docs/workflow"), { recursive: true });
  const ledgerPath = path.join(root, "docs/workflow/TIER_COST.md");
  const block = columns.map((column) => `${column} | \`x\` | what it holds`).join("\n");
  const header = `| ${columns.join(" | ")} |\n|${columns.map(() => "---").join("|")}|`;
  fs.writeFileSync(
    ledgerPath,
    `# Measured acceptance\n\n\`\`\`text\ntier-cost@1\ncolumn | shape | what it holds\n${block}\n\`\`\`\n\n## Samples\n\n${header}\n`,
  );

  const jsonlPath = path.join(root, ".pi/.telemetry/sessions.jsonl");
  const handlers = new Map();
  const instance = createTelemetryWiring({
    root,
    enabled: true,
    ledgerPath,
    jsonFile: jsonlPath,
    changedPaths: () => 3,
    sessionStartSha: () => "abc123",
    sessionId: () => "sess-504",
    now: () => 1_000,
    date: () => "2026-11-17",
  });
  instance.register({ on: (event, handler) => handlers.set(event, handler) });
  instance.noteCommand("execute-phase", ["494"]);
  return { root, ledgerPath, jsonlPath, handlers };
}

test("the shipped wiring writes the ledger and the JSONL from one sample", () => {
  const { ledgerPath, jsonlPath, handlers } = shippedProject();
  handlers.get("turn_end")({ message: { model: "glm5.3-flash", usage: { input: 10, output: 5 } } });
  handlers.get("session_shutdown")({});

  const [record] = lines(jsonlPath);
  assert.equal(record.unit, "494-telemetry-by-turn");
  assert.equal(record.phase, "execute-phase");
  assert.equal(record.model, "glm5.3-flash");
  assert.equal(record.input_tokens, 10);
  assert.equal(record.output_tokens, 5);
  assert.equal(record.source, "pi:session=sess-504");

  const ledger = fs.readFileSync(ledgerPath, "utf8");
  assert.match(ledger, /\| 494-telemetry-by-turn \|/, "the same sample reached the markdown ledger");
});

test("one line per settled run: a session that never shuts down still streams its samples", () => {
  const { jsonlPath, ledgerPath, handlers } = shippedProject();
  handlers.get("turn_end")({ message: { usage: { totalTokens: 100 } } });
  handlers.get("agent_settled")({});
  handlers.get("turn_end")({ message: { usage: { totalTokens: 250 } } });
  handlers.get("agent_settled")({});

  const records = lines(jsonlPath);
  assert.deepEqual(records.map((record) => record.tokens), [100, 350], "each settled run appends its cumulative sample: 100, then 100 + 250");
  assert.deepEqual(records.map((record) => record.turns), [1, 2]);
  assert.equal(records.every((record) => record.source === "pi:session=sess-504"), true, "both lines belong to the one session");

  const ledgerRows = fs.readFileSync(ledgerPath, "utf8").split("\n").filter((line) => line.startsWith("| 494-telemetry-by-turn"));
  assert.equal(ledgerRows.length, 1, "the ledger keeps one row for the session, upserted to the latest totals");
  assert.match(ledgerRows[0], /\| 350 \|/, "the row carries the last run's cumulative count");

  handlers.get("session_shutdown")({});
  assert.equal(lines(jsonlPath).length, 2, "the shutdown adds no duplicate line when the last run already emitted the same sample");
});
