// telemetry-ledger-sink.test.mjs — issue #383 O13: the producer and the reader
// must share one grammar, so the proof is a round trip and not two happy paths.
//
// The sink writes what the accumulator measured into the ledger the repository
// owns; the repository's own reader (`scripts/tier-cost.mjs`) then has to accept
// that row and read the same values back. A sink that invented a column order, or
// a reader that trusted one, would pass alone and fail here.

import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createLedgerSink } from "../dist/telemetry-sinks.js";
import { parseLedger, readLedger, compare } from "../../../scripts/tier-cost.mjs";
import { tempRoot } from "../../../scripts/temp-root.mjs";

const DATE = "2026-11-03";

const SAMPLE = {
  unit: "383-measured-acceptance",
  changed_paths: 12,
  tokens: 1_500,
  turns: 4,
  model_ms: 9_400,
  tool_ms: 600,
  observed: DATE,
  source: "pi:session=abc",
};

/** The `tier-cost@1` row the earlier grammar published. */
const LEGACY_COLUMNS = ["unit", "changed_paths", "tokens", "turns", "model_ms", "tool_ms", "observed", "source"];

/** The current grammar's row, in its declared order (#504 S4). */
const CURRENT_COLUMNS = [
  "unit", "phase", "version", "model", "changed_paths", "tokens", "turns",
  "input_tokens", "output_tokens", "cache_read_tokens", "cache_write_tokens", "reasoning_tokens",
  "model_ms", "tool_ms", "observed", "source",
];

/** A ledger shaped exactly like `docs/workflow/TIER_COST.md`, rows included. */
function ledgerText(rows = [], { contract = "tier-cost@1", columns = LEGACY_COLUMNS } = {}) {
  const block = columns.map((c) => `${c} | \`x\` | what it holds`).join("\n");
  const header = `| ${columns.join(" | ")} |\n|${columns.map(() => "---").join("|")}|`;
  const body = rows.map((cells) => `\n| ${cells.join(" | ")} |`).join("");
  return `# Measured acceptance\n\n\`\`\`text\n${contract}\ncolumn | shape | what it holds\n${block}\n\`\`\`\n\n## Reading it\n\nNothing else.\n\n## Samples\n\nOne row per measured session.\n\n${header}${body}\n`;
}

/** A throwaway project carrying one unit doc, so a row's tier can be resolved. */
function project(ledgerRows = [], ledgerOptions = {}) {
  const root = tempRoot("ledger-sink-");
  fs.mkdirSync(path.join(root, "docs/fix/383-measured-acceptance"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "docs/fix/383-measured-acceptance/SPEC.md"),
    "# fix/383-measured-acceptance\n\n## Risk tier\n\n- **Tier** — `standard` · **Task Size** — `small`\n\n## Tasks\n\n- P1 — a phase (validator: `true` exits 0)\n\n## Log\n\n- **E1** — 2026-11-03, `true` · exit 0 · ok.\n- **R1** — `HEAD abc`, verdict PASS, cycle 1.\n",
  );
  fs.mkdirSync(path.join(root, "docs/workflow"), { recursive: true });
  const ledgerPath = path.join(root, "docs/workflow/TIER_COST.md");
  fs.writeFileSync(ledgerPath, ledgerText(ledgerRows, ledgerOptions));
  return { root, ledgerPath };
}

const rowsOf = (ledgerPath) => parseLedger(fs.readFileSync(ledgerPath, "utf8")).rows;

test("the sink appends one row in the ledger's own declared column order", () => {
  const { ledgerPath } = project();
  createLedgerSink({ ledgerPath }).write(SAMPLE);

  const rows = rowsOf(ledgerPath);
  assert.equal(rows.length, 1);
  for (const column of ["unit", "changed_paths", "tokens", "turns", "model_ms", "tool_ms", "observed", "source"]) {
    assert.deepEqual(rows[0][column], SAMPLE[column], `the sink wrote the declared column ${column}`);
  }
  assert.equal(rows[0].tier, undefined, "a derived fact is never stored: the reader resolves the tier from the carrier");
  assert.equal(rows[0].tokens, 1_500, "the repo reader coerces the numeric cells, and the sink wrote a number");
  assert.equal(rows[0].source, "pi:session=abc");
  assert.match(fs.readFileSync(ledgerPath, "utf8"), /## Reading it/, "the prose after the table survives untouched");
});

test("the sink is idempotent: the same sample twice is one row", () => {
  const { ledgerPath } = project();
  const sink = createLedgerSink({ ledgerPath });
  sink.write(SAMPLE);
  sink.write(SAMPLE);
  assert.equal(rowsOf(ledgerPath).length, 1, "a second shutdown for one session must not append a second row");
});

test("two sessions of the same unit on the same day are two rows", () => {
  const { ledgerPath } = project();
  const sink = createLedgerSink({ ledgerPath });
  sink.write(SAMPLE);
  sink.write({ ...SAMPLE, tokens: 2_000, source: "pi:session=def" });
  const rows = rowsOf(ledgerPath);
  assert.equal(rows.length, 2, "a second session measured the same day is a sample, not a duplicate");
  assert.deepEqual(rows.map((row) => row.source), ["pi:session=abc", "pi:session=def"]);
  assert.deepEqual(rows.map((row) => row.tokens), [1_500, 2_000]);
});

test("the guard never swallows a different sample from another session", () => {
  const { ledgerPath } = project();
  const sink = createLedgerSink({ ledgerPath });
  sink.write(SAMPLE);
  for (const change of [{ tokens: 1 }, { turns: 9 }, { observed: "2026-11-04" }, { changed_paths: 0 }]) {
    const before = rowsOf(ledgerPath).length;
    sink.write({ ...SAMPLE, ...change, source: `pi:session=other-${Object.keys(change)[0]}` });
    assert.equal(rowsOf(ledgerPath).length, before + 1, `a row differing in ${Object.keys(change)[0]} is a new sample`);
  }
});

// --- one row per source: the session's row is upserted (#623 S6) ------------
//
// A settled session emits its cumulative sample once per run, so the same
// session reaches the ledger more than once. The sink's whole-row guard would
// append every one of those as a new row. S6 picks the other shape: the sample's
// `source` is the row's identity, so a later emission for the same session
// replaces that row with the newer totals.

test("a later emission for the same source replaces its row instead of appending a second one", () => {
  const { ledgerPath } = project();
  const sink = createLedgerSink({ ledgerPath });
  sink.write(SAMPLE);
  sink.write({ ...SAMPLE, tokens: 2_000, turns: 7 });
  const rows = rowsOf(ledgerPath);
  assert.equal(rows.length, 1, "one session is one row, however many runs it settled");
  assert.equal(rows[0].tokens, 2_000, "the row carries the later, cumulative totals");
  assert.equal(rows[0].turns, 7);
});

test("a live emission replaces the row a reconstruction wrote for the same session (#624)", () => {
  // The reconstruction (#624) writes `pi:reconstruct=<id>` for a session the
  // sink never flushed; when that session finally flushes live it writes
  // `pi:session=<id>`. One row per session means the live emission replaces the
  // reconstructed one — the two prefixes are two producers naming one session,
  // not two sessions.
  const { ledgerPath } = project();
  const sink = createLedgerSink({ ledgerPath });
  sink.write({ ...SAMPLE, tokens: 500, turns: 2, source: "pi:reconstruct=abc" });
  sink.write({ ...SAMPLE, tokens: 9_000, turns: 20, source: "pi:session=abc" });
  const rows = rowsOf(ledgerPath);
  assert.equal(rows.length, 1, "one session is one row, whichever producer prefix names it");
  assert.equal(rows[0].tokens, 9_000, "the row carries the later, cumulative totals");
  assert.equal(rows[0].source, "pi:session=abc", "the live emission's provenance wins");
});

test("an upsert touches only its own row: the other sessions' rows stay byte-identical", () => {
  const { ledgerPath } = project();
  const sink = createLedgerSink({ ledgerPath });
  sink.write(SAMPLE);
  sink.write({ ...SAMPLE, source: "pi:session=def", tokens: 2_000 });
  const otherRow = fs.readFileSync(ledgerPath, "utf8").split("\n").find((line) => line.includes("pi:session=def"));
  sink.write({ ...SAMPLE, tokens: 1_800 });
  const rows = rowsOf(ledgerPath);
  assert.equal(rows.length, 2, "a second session keeps its own row");
  assert.equal(rows[0].source, "pi:session=abc", "the replaced row keeps its position");
  assert.equal(rows[0].tokens, 1_800);
  assert.equal(rows[1].tokens, 2_000);
  assert.equal(
    fs.readFileSync(ledgerPath, "utf8").split("\n").find((line) => line.includes("pi:session=def")),
    otherRow,
    "the other session's row is byte-identical after the upsert",
  );
  assert.equal(fs.readFileSync(ledgerPath, "utf8").startsWith("# Measured acceptance"), true, "the document's prose is untouched");
});

test("a ledger that declares no source column cannot upsert, so a second sample appends", () => {
  const columns = LEGACY_COLUMNS.filter((column) => column !== "source");
  const { ledgerPath } = project([], { columns });
  const sink = createLedgerSink({ ledgerPath });
  const rowCount = () => fs.readFileSync(ledgerPath, "utf8").split("\n").filter((line) => line.startsWith("| 383")).length;
  sink.write(SAMPLE);
  sink.write({ ...SAMPLE, tokens: 2_000 });
  assert.equal(rowCount(), 2, "without an identity column the append contract stands: no invented key is guessed");
});

test("the sink never rewrites an earlier row", () => {
  const { ledgerPath } = project();
  const before = fs.readFileSync(ledgerPath, "utf8");
  const sink = createLedgerSink({ ledgerPath });
  sink.write(SAMPLE);
  const afterFirst = fs.readFileSync(ledgerPath, "utf8");
  sink.write({ ...SAMPLE, tokens: 2_000, source: "pi:session=def" });
  const after = fs.readFileSync(ledgerPath, "utf8");
  assert.ok(afterFirst.startsWith(before), "the first write left every existing byte in place");
  assert.ok(after.startsWith(afterFirst), "the second write left the first row in place");
  assert.equal(rowsOf(ledgerPath).length, 2);
});

test("a ledger whose grammar disagrees with the sample is refused, never guessed", () => {
  const { root } = project();
  const broken = path.join(root, "docs/workflow/TIER_COST.md");
  // The block declares nine columns; the table's header declares eight. A sink
  // that trusted either one alone would write a row nobody can read back.
  const text = ledgerText().replace("| observed | source |\n", "| observed |\n").replace("|---|---|---|---|---|---|---|---|---|\n", "|---|---|---|---|---|---|---|---|\n");
  fs.writeFileSync(broken, text);
  const before = fs.readFileSync(broken, "utf8");
  assert.throws(() => createLedgerSink({ ledgerPath: broken }).write(SAMPLE), "a disagreeing header is a refusal, not a row written blind");
  assert.equal(fs.readFileSync(broken, "utf8"), before, "a refused write leaves the ledger byte-identical");
});

test("a ledger with no tier-cost block is refused", () => {
  const { root } = project();
  const missing = path.join(root, "docs/workflow/TIER_COST.md");
  fs.writeFileSync(missing, "# nothing here\n");
  assert.throws(() => createLedgerSink({ ledgerPath: missing }).write(SAMPLE));
});

test("round trip: the repository's reader accepts the sink's row and reads the same values", () => {
  const { root, ledgerPath } = project();
  createLedgerSink({ ledgerPath }).write(SAMPLE);

  const read = readLedger(root, fs.readFileSync(ledgerPath, "utf8"));
  assert.equal(read.error, undefined, `the repo reader refused the sink's row: ${read.detail ?? ""}`);
  const row = read.rows[0];
  assert.equal(row.unit, SAMPLE.unit);
  assert.equal(row.tier, "standard", "the tier is derived from the carrier, exactly the fact the sink never stored");
  assert.equal(row.tokens, SAMPLE.tokens);
  assert.equal(row.turns, SAMPLE.turns);
  assert.equal(row.model_ms, SAMPLE.model_ms);
  assert.equal(row.tool_ms, SAMPLE.tool_ms);
  assert.equal(row.changed_paths, SAMPLE.changed_paths);
  assert.equal(compare(read.rows).verdict, "insufficient-corpus", "one unit is a corpus of one, and the comparison says so");
});

// --- the ledger is a file two sessions can reach at once -------------------
//
// Pi runs sessions in separate processes. A new sample appends one line with
// `O_APPEND`, which the kernel places atomically, so no lock, no queue and no
// lost row is needed for the common case. Since #623 S6 the one rewrite is an
// upsert: a sample whose `source` already has a row replaces that row, and the
// row it replaces is its own — a session never rewrites another session's
// sample. The residual race (another process appending between the upsert's
// read and its atomic swap) costs at most that process's row, which the JSONL
// stream still carries; it is a declared limit, not a silent loss. These cases
// pin the append half and its no-lock shape.

/** The lock a rewriting writer would need; the append-only one takes none. */
const lockPath = (ledgerPath) => `${ledgerPath}.lock`;

test("concurrent writers all land, and no lock file is taken", async () => {
  const { root, ledgerPath } = project();
  const dist = new URL("../dist/telemetry-sinks.js", import.meta.url).href;
  const script = path.join(root, "writer.mjs");
  fs.writeFileSync(
    script,
    `import { createLedgerSink } from ${JSON.stringify(dist)};\n` +
      `const [ledger, who] = process.argv.slice(2);\n` +
      `const sink = createLedgerSink({ ledgerPath: ledger });\n` +
      `for (let i = 0; i < 3; i += 1) sink.write({ unit: "383-measured-acceptance", changed_paths: 1, tokens: 10 + i, turns: 1, model_ms: 1, tool_ms: 1, observed: ${JSON.stringify(DATE)}, source: \`pi:session=\${who}-\${i}\` });\n`,
  );

  // Four sessions, each with its own identity: the sink's duplicate guard is
  // per-row, and a session never races with itself (one process, one flush).
  const children = ["a", "b", "c", "d"].map((who) => spawn(process.execPath, [script, ledgerPath, who], { stdio: "ignore" }));
  const codes = await Promise.all(
    children.map((child) => new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", (code) => resolve(code));
    })),
  );

  assert.deepEqual(codes, [0, 0, 0, 0], "every writer finished");
  assert.equal(rowsOf(ledgerPath).length, 12, "12 samples measured, 12 rows written");
  assert.equal(fs.existsSync(lockPath(ledgerPath)), false, "an appending writer needs no lock");
});

test("the writer appends: everything already in the ledger is a prefix of the result", () => {
  const { ledgerPath } = project();
  const before = fs.readFileSync(ledgerPath, "utf8");
  createLedgerSink({ ledgerPath }).write(SAMPLE);
  const after = fs.readFileSync(ledgerPath, "utf8");
  assert.ok(after.startsWith(before), "no byte of the ledger is rewritten");
  assert.equal(after.length, before.length + "| 383-measured-acceptance | 12 | 1500 | 4 | 9400 | 600 | 2026-11-03 | pi:session=abc |\n".length);
  assert.equal(rowsOf(ledgerPath).length, 1);
});

test("a samples table that is not the file's last section is refused", () => {
  const { root, ledgerPath } = project();
  // The writer appends; if prose follows the table, the row would land after it.
  fs.appendFileSync(ledgerPath, "\n## Reading it\n\nNothing else.\n");
  const before = fs.readFileSync(ledgerPath, "utf8");
  assert.throws(() => createLedgerSink({ ledgerPath }).write(SAMPLE), /last section/);
  assert.equal(fs.readFileSync(ledgerPath, "utf8"), before);
});

test("a ledger whose last line is not a row is refused, never appended to blind", () => {
  const { ledgerPath } = project();
  fs.appendFileSync(ledgerPath, "trailing words with no newline");
  const before = fs.readFileSync(ledgerPath, "utf8");
  assert.throws(() => createLedgerSink({ ledgerPath }).write(SAMPLE), /must end with a newline/);
  assert.equal(fs.readFileSync(ledgerPath, "utf8"), before);
});

// --- the grammar moved to `@2` (#504 S4, S15) -------------------------------
//
// The sink never owned the version: it reads the block the ledger declares and
// writes the columns it declares. These cases pin the other half of "coexists" —
// a `@2` ledger gets the sixteen cells, and a declared column no sample carries
// is a refusal rather than a row written blind.

/** A sample in the current grammar: every declared field, populated. */
const CURRENT_SAMPLE = {
  unit: "383-measured-acceptance",
  phase: "execute-phase",
  version: "4.10.0",
  model: "glm5.3-flash",
  changed_paths: 12,
  tokens: 1_500,
  turns: 4,
  input_tokens: 800,
  output_tokens: 300,
  cache_read_tokens: 250,
  cache_write_tokens: 100,
  reasoning_tokens: 50,
  model_ms: 9_400,
  tool_ms: 600,
  observed: DATE,
  source: "pi:session=abc",
};

test("a tier-cost@2 ledger gets the sixteen declared cells, in its own order", () => {
  const { root, ledgerPath } = project([], { contract: "tier-cost@2", columns: CURRENT_COLUMNS });
  createLedgerSink({ ledgerPath }).write(CURRENT_SAMPLE);

  const parsed = parseLedger(fs.readFileSync(ledgerPath, "utf8"));
  assert.equal(parsed.error, undefined, parsed.detail ?? "");
  assert.equal(parsed.contract, "tier-cost@2");
  assert.equal(parsed.rows.length, 1);
  const [row] = parsed.rows;
  for (const column of CURRENT_COLUMNS) {
    assert.deepEqual(row[column], CURRENT_SAMPLE[column], `the sink wrote the declared column ${column}`);
  }
  assert.equal(readLedger(root, fs.readFileSync(ledgerPath, "utf8")).rows[0].tier, "standard");
});

test("a tier-cost@1 ledger still gets its eight cells — the grammar is negotiated, not assumed", () => {
  const { ledgerPath } = project();
  createLedgerSink({ ledgerPath }).write(CURRENT_SAMPLE);
  const parsed = parseLedger(fs.readFileSync(ledgerPath, "utf8"));
  assert.equal(parsed.contract, "tier-cost@1");
  assert.deepEqual(parsed.columns, LEGACY_COLUMNS);
  assert.deepEqual(Object.keys(parsed.rows[0]).sort(), [...LEGACY_COLUMNS].sort(), "the row carries exactly what the file declares");
  assert.equal(parsed.rows[0].tokens, 1_500);
});

test("a ledger declaring a column no sample carries is refused, never written blind", () => {
  const { ledgerPath } = project([], { contract: "tier-cost@2", columns: [...CURRENT_COLUMNS, "wall_clock"] });
  const before = fs.readFileSync(ledgerPath, "utf8");
  assert.throws(() => createLedgerSink({ ledgerPath }).write(CURRENT_SAMPLE), /wall_clock/);
  assert.equal(fs.readFileSync(ledgerPath, "utf8"), before, "a refused write leaves the ledger byte-identical");
});
