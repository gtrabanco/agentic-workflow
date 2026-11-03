// telemetry-ledger-sink.test.mjs — issue #383 O13: the producer and the reader
// must share one grammar, so the proof is a round trip and not two happy paths.
//
// The sink writes what the accumulator measured into the ledger the repository
// owns; the repository's own reader (`scripts/tier-cost.mjs`) then has to accept
// that row and read the same values back. A sink that invented a column order, or
// a reader that trusted one, would pass alone and fail here.

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { createLedgerSink } from "../dist/telemetry-sinks.js";
import { parseLedger, readLedger, compare } from "../../../scripts/tier-cost.mjs";

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

/** A ledger shaped exactly like `docs/workflow/TIER_COST.md`, rows included. */
function ledgerText(rows = []) {
  const columns = ["unit", "changed_paths", "tokens", "turns", "model_ms", "tool_ms", "observed", "source"];
  const block = columns.map((c) => `${c} | \`x\` | what it holds`).join("\n");
  const header = `| ${columns.join(" | ")} |\n|${columns.map(() => "---").join("|")}|`;
  const body = rows.map((cells) => `\n| ${cells.join(" | ")} |`).join("");
  return `# Measured acceptance\n\n\`\`\`text\ntier-cost@1\ncolumn | shape | what it holds\n${block}\n\`\`\`\n\n## Samples\n\n${header}${body}\n\n## Reading it\n\nNothing else.\n`;
}

/** A throwaway project carrying one unit doc, so a row's tier can be resolved. */
function project(ledgerRows = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ledger-sink-"));
  fs.mkdirSync(path.join(root, "docs/fix/383-measured-acceptance"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "docs/fix/383-measured-acceptance/SPEC.md"),
    "# fix/383-measured-acceptance\n\n## Risk tier\n\n- **Tier** — `standard` · **Task Size** — `small`\n\n## Tasks\n\n- P1 — a phase (validator: `true` exits 0)\n\n## Log\n\n- **E1** — 2026-11-03, `true` · exit 0 · ok.\n- **R1** — `HEAD abc`, verdict PASS, cycle 1.\n",
  );
  fs.mkdirSync(path.join(root, "docs/workflow"), { recursive: true });
  const ledgerPath = path.join(root, "docs/workflow/TIER_COST.md");
  fs.writeFileSync(ledgerPath, ledgerText(ledgerRows));
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

test("only an identical row is a duplicate: the guard never swallows a different sample", () => {
  const { ledgerPath } = project();
  const sink = createLedgerSink({ ledgerPath });
  sink.write(SAMPLE);
  for (const change of [{ tokens: 1 }, { turns: 9 }, { observed: "2026-11-04" }, { changed_paths: 0 }]) {
    const before = rowsOf(ledgerPath).length;
    sink.write({ ...SAMPLE, ...change });
    assert.equal(rowsOf(ledgerPath).length, before + 1, `a row differing in ${Object.keys(change)[0]} is a new sample`);
  }
});

test("the sink never rewrites an earlier row", () => {
  const { ledgerPath } = project();
  const before = fs.readFileSync(ledgerPath, "utf8");
  const sink = createLedgerSink({ ledgerPath });
  sink.write(SAMPLE);
  sink.write({ ...SAMPLE, tokens: 2_000, source: "pi:session=def" });
  const after = fs.readFileSync(ledgerPath, "utf8");
  assert.ok(after.startsWith(before.slice(0, before.indexOf("\n\n## Reading it"))), "every byte of the original table ordering is preserved");
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
