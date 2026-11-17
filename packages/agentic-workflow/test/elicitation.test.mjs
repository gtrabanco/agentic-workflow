/**
 * elicitation.test.mjs — the `elicitation` file service (feature/526-evidence-backed-elicitation).
 *
 * Layer 0 of the input path is a checklist before it is an interview: the bank
 * says which fields a request of a given shape must fill, and only the fields
 * nothing can answer become questions — one at a time, through the published
 * `open-questions@1` blocks the design step already reads.
 *
 * What must not be prose is the part that decides whether a row earned a
 * question, whether a value was evidenced, and whether the elicitor shared the
 * implementer's family. Each refusal below is a fixture over the same code path
 * the shipped bank runs through, and the shipped pin at the end is the real
 * bank plus a pre-spec of this unit — a bank that stops asking for evidence
 * fails here rather than shipping.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  BANK_CONTRACT_ID,
  REQUEST_SHAPES,
  SPEC_CONTRACT_ID,
  ElicitationRefusal,
  checkBank,
  checkPair,
  checkSpec,
  readBank,
  readSpec,
} from "../src/elicitation/prespec.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));
const BANK_REL = "skills/unit-lane/references/ELICITATION.md";
const SPEC_REL = "docs/pre-spec/2026-11-17-526-elicitation-layer.md";

const read = (rel) => readFileSync(path.join(REPO, rel), "utf8");
const run = (...args) => {
  const result = spawnSync(process.execPath, [BIN, ...args], { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

/** One scratch tree per case, removed by the case that made it. */
function scratch() {
  return mkdtempSync(path.join(tmpdir(), "elicitation-test-"));
}

// ── fixtures ──────────────────────────────────────────────────────────────

/** A bank row as the table carries it, overridable per case. */
const bankRow = (overrides = {}) => ({
  id: "FEA-01",
  shape: "feature",
  field: "user-scenario",
  asks: "Which actor sees the change?",
  "applies-when": "always",
  toggles: "one actor → the criteria are written for it; several → each criterion names its actor",
  default: "none — an unobserved outcome is not a deliverable",
  source: "Cockburn (2001) — primary actor and goal",
  ...overrides,
});

/** A bank document: the cell contract block plus the table after it. */
const bankFixture = (rows) => {
  const columns = ["id", "shape", "field", "asks", "applies-when", "toggles", "default", "source"];
  const header = `| ${columns.join(" | ")} |`;
  const divider = `|${columns.map(() => "---").join("|")}|`;
  const body = rows.map((row) => `| ${columns.map((column) => row[column] ?? "").join(" | ")} |`);
  return [
    "# Bank",
    "",
    "```text",
    BANK_CONTRACT_ID,
    `cell | shape | what it orders`,
    ...columns.map((column) => `${column} | <${column}> | the ${column} cell`),
    "```",
    "",
    header,
    divider,
    ...body,
    "",
  ].join("\n");
};

/** A pre-spec document: the keyed block, the checklist table, an optional question block. */
const specFixture = ({
  id = "2026-11-17-toy",
  request = '"make the thing do the other thing"',
  shape = "feature",
  elicitor = "anthropic",
  implementer = "openai",
  sameFamily = null,
  questions = "none — the request names the actor and the observation",
  rows = [{ field: "user-scenario", value: "the operator sees a report", provenance: "request", receipt: "—" }],
  questionBlock = null,
} = {}) => {
  const lines = [
    "# Pre-spec",
    "",
    "```text",
    SPEC_CONTRACT_ID,
    `id: ${id}`,
    `request: ${request}`,
    `shape: ${shape}`,
    `elicitor: ${elicitor}`,
    `implementer: ${implementer}`,
    ...(sameFamily === null ? [] : [`same-family: ${sameFamily}`]),
    `questions: ${questions}`,
    "```",
    "",
    "| field | value | provenance | receipt |",
    "|---|---|---|---|",
    ...rows.map((row) => `| ${row.field} | ${row.value} | ${row.provenance} | ${row.receipt} |`),
    "",
  ];
  if (questionBlock !== null) lines.push(questionBlock, "");
  return lines.join("\n");
};

/** A well-formed `open-questions@1` block with the given entries. */
const questionBlock = (entries) =>
  [
    "```text",
    "open-questions@1",
    "id | date | type | question | blocks | search-receipt | options | route",
    ...entries,
    "```",
  ].join("\n");

const openQuestion = (id = "Q1", overrides = {}) => {
  const cells = {
    id,
    date: "2026-11-17",
    type: "open-question",
    question: "which actor sees it",
    blocks: "the user-scenario row",
    "search-receipt": "rg -n 'actor' docs/ → 0 hits",
    options: "the operator — cheapest | the customer — wider blast",
    route: "design",
    ...overrides,
  };
  return `| ${Object.values(cells).join(" | ")} |`;
};

const codes = (result) => result.findings.map((finding) => finding.code);

// ── 1. The bank's own cells ───────────────────────────────────────────────

test("a bank row with one toggled behaviour is refused", () => {
  const result = checkBank(bankFixture([bankRow({ toggles: "one answer → one behaviour" })]));
  assert.equal(result.ok, false);
  assert.deepEqual(codes(result), ["row-toggles-single"]);
});

test("a bank row missing its ask condition, its default or its source is refused", () => {
  assert.deepEqual(codes(checkBank(bankFixture([bankRow({ "applies-when": "" })]))), ["row-applies-when-missing"]);
  assert.deepEqual(codes(checkBank(bankFixture([bankRow({ default: "" })]))), ["row-default-missing"]);
  assert.deepEqual(codes(checkBank(bankFixture([bankRow({ source: "" })]))), ["row-source-missing"]);
});

test("a bank row whose shape the family set does not carry is refused", () => {
  const result = checkBank(bankFixture([bankRow({ shape: "backend" })]));
  assert.deepEqual(codes(result), ["row-shape-unknown"]);
  assert.ok(REQUEST_SHAPES.includes("feature"));
  assert.ok(REQUEST_SHAPES.every((shape) => typeof shape === "string"));
});

test("a bank whose table header differs from its declared cells is refused", () => {
  const text = bankFixture([bankRow()]).replace("| id | shape |", "| id | family |");
  const result = checkBank(text);
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes("bank-header-drift"), JSON.stringify(result.findings));
});

test("a bank with no contract block is refused instead of read as empty", () => {
  const text = bankFixture([bankRow()]).replace(BANK_CONTRACT_ID, "some-other@1");
  assert.deepEqual(codes(checkBank(text)), ["bank-block-missing"]);
  assert.equal(readBank(text).present, false);
});

// ── 2. The checklist is a checklist ───────────────────────────────────────

const toyBank = bankFixture([
  bankRow(),
  bankRow({ id: "FEA-02", shape: "feature", field: "observation", asks: "Which command shows it working?", default: "none — a criterion with no observation cannot pass" }),
  bankRow({ id: "ANY-01", shape: "any", field: "reversibility", asks: "Is this undone by reverting its own diff?", default: "none — an irreversible change is never one-shot" }),
  bankRow({ id: "FIX-01", shape: "fix", field: "reproducer", asks: "Which command reproduces it?" }),
]);

test("a pre-spec missing an applicable checklist row is refused", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({ rows: [{ field: "user-scenario", value: "the operator", provenance: "request", receipt: "—" }] }),
    specPath: "2026-11-17-toy.md",
  });
  assert.equal(result.ok, false);
  assert.deepEqual(codes(result), ["spec-row-missing", "spec-row-missing"]);
  assert.match(result.findings[0].detail, /observation|reversibility/);
});

test("a `fix` pre-spec is not charged the feature rows", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      shape: "fix",
      rows: [
        { field: "reproducer", value: "the failing command", provenance: "request", receipt: "—" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.equal(result.ok, true, JSON.stringify(result.findings));
});

test("a pre-spec row for a field the bank does not declare is refused", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      rows: [
        { field: "user-scenario", value: "the operator", provenance: "request", receipt: "—" },
        { field: "observation", value: "the report command", provenance: "request", receipt: "—" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
        { field: "invented-field", value: "x", provenance: "request", receipt: "—" },
      ],
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(result), ["spec-row-extra"]);
});

// ── 3. Provenance is evidenced, never asserted ────────────────────────────

test("a repository row with no receipt is refused", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      rows: [
        { field: "user-scenario", value: "the operator", provenance: "repository", receipt: "—" },
        { field: "observation", value: "the report command", provenance: "request", receipt: "—" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(result), ["row-receipt-missing"]);
});

test("an assumption that is not the row's default is refused", () => {
  const bankWithDefault = bankFixture([
    bankRow({ id: "ANY-01", shape: "any", field: "lane-collision", asks: "Does another unit touch these files?", default: "unchecked — batch-scheduler names the lane's surface" }),
  ]);
  const wrong = checkSpec({
    bankText: bankWithDefault,
    specText: specFixture({ rows: [{ field: "lane-collision", value: "nobody does", provenance: "assumption", receipt: "assumed 2026-11-17 — nobody does" }] }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(wrong), ["row-assumption-default-mismatch"]);

  const undated = checkSpec({
    bankText: bankWithDefault,
    specText: specFixture({ rows: [{ field: "lane-collision", value: "unchecked", provenance: "assumption", receipt: "unchecked — batch-scheduler names the lane's surface" }] }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(undated), ["row-assumption-shape"]);

  const right = checkSpec({
    bankText: bankWithDefault,
    specText: specFixture({ rows: [{ field: "lane-collision", value: "unchecked", provenance: "assumption", receipt: "assumed 2026-11-17 — unchecked — batch-scheduler names the lane's surface" }] }),
    specPath: "2026-11-17-toy.md",
  });
  assert.equal(right.ok, true, JSON.stringify(right.findings));
  assert.deepEqual(right.assumptions, ["lane-collision"]);
});

// ── 4. One question at a time, through the published grammar ──────────────

test("an unknown on a row that declares no default must be a question", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      rows: [
        { field: "user-scenario", value: "unknown", provenance: "unknown", receipt: "—" },
        { field: "observation", value: "the report command", provenance: "request", receipt: "—" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(result), ["row-unknown-without-question"]);
});

test("a second open question in one pre-spec is refused", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      questions: "Q1, Q2",
      rows: [
        { field: "user-scenario", value: "unknown", provenance: "unknown", receipt: "Q1" },
        { field: "observation", value: "unknown", provenance: "unknown", receipt: "Q2" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
      questionBlock: questionBlock([openQuestion("Q1"), openQuestion("Q2")]),
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(result), ["questions-multiple-open"]);
});

test("an unknown row naming a question the block does not carry is refused", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      questions: "Q1",
      rows: [
        { field: "user-scenario", value: "unknown", provenance: "unknown", receipt: "Q4" },
        { field: "observation", value: "unknown", provenance: "unknown", receipt: "Q1" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
      questionBlock: questionBlock([openQuestion("Q1")]),
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.ok(codes(result).includes("row-question-missing"), JSON.stringify(result.findings));
});

test("questions: none without a why is refused", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      questions: "none",
      rows: [
        { field: "user-scenario", value: "the operator", provenance: "request", receipt: "—" },
        { field: "observation", value: "the report command", provenance: "request", receipt: "—" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(result), ["questions-none-without-why"]);
});

test("questions: none beside an open question row is refused as a contradiction", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      questions: "none — nothing needed",
      rows: [
        { field: "user-scenario", value: "the operator", provenance: "request", receipt: "—" },
        { field: "observation", value: "the report command", provenance: "request", receipt: "—" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
      questionBlock: questionBlock([openQuestion("Q1")]),
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(result), ["questions-none-contradicts-row"]);
});

test("a question block whose header differs from the published columns is refused", () => {
  const block = questionBlock([openQuestion("Q1")]).replace(
    "id | date | type | question | blocks | search-receipt | options | route",
    "id | date | type | question | options | route",
  );
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      questions: "Q1",
      rows: [
        { field: "user-scenario", value: "unknown", provenance: "unknown", receipt: "Q1" },
        { field: "observation", value: "the report command", provenance: "request", receipt: "—" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
      questionBlock: block,
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(result), ["questions-header-drift"]);
});

// ── 5. Cross-family elicitation ───────────────────────────────────────────

const oneOpenQuestion = {
  questions: "Q1",
  rows: [
    { field: "user-scenario", value: "unknown", provenance: "unknown", receipt: "Q1" },
    { field: "observation", value: "the report command", provenance: "request", receipt: "—" },
    { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
  ],
  questionBlock: questionBlock([openQuestion("Q1")]),
};

test("equal elicitor and implementer families are refused", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({ ...oneOpenQuestion, elicitor: "anthropic", implementer: "anthropic" }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(result), ["family-same-without-reason"]);
});

test("a declared same-family reason is accepted and reported", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({ ...oneOpenQuestion, elicitor: "anthropic", implementer: "anthropic", sameFamily: "one family was available in this session" }),
    specPath: "2026-11-17-toy.md",
  });
  assert.equal(result.ok, true, JSON.stringify(result.findings));
  assert.equal(result.sameFamily, "one family was available in this session");
});

test("a pre-spec that asks a question must declare both families", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({ ...oneOpenQuestion, elicitor: "", implementer: "" }),
    specPath: "2026-11-17-toy.md",
  });
  assert.equal(result.ok, false, "an empty family cell is not a declaration");
  assert.deepEqual(codes(result), ["family-missing", "family-missing"]);
});

test("a pre-spec that asks nothing may leave the families undeclared", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      elicitor: "",
      implementer: "",
      rows: [
        { field: "user-scenario", value: "the operator", provenance: "request", receipt: "—" },
        { field: "observation", value: "the report command", provenance: "request", receipt: "—" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.equal(result.ok, true, JSON.stringify(result.findings));
});

// ── 6. The artifact's identity and the simple-work path ───────────────────

test("the id must equal the filename stem", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      id: "2026-11-17-something-else",
      rows: [
        { field: "user-scenario", value: "the operator", provenance: "request", receipt: "—" },
        { field: "observation", value: "the report command", provenance: "request", receipt: "—" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(result), ["spec-id-mismatch"]);
});

test("a fully answered pre-spec asks nothing and passes", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      rows: [
        { field: "user-scenario", value: "the operator sees a report", provenance: "request", receipt: "—" },
        { field: "observation", value: "the report command", provenance: "repository", receipt: "scripts/report.mjs:12" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.equal(result.ok, true, JSON.stringify(result.findings));
  assert.deepEqual(result.findings, []);
  assert.equal(result.rows, 3);
  assert.equal(result.shape, "feature");
  assert.equal(result.asked, 0);
});

test("a missing pre-spec block is refused instead of read as an empty record", () => {
  const result = checkSpec({ bankText: toyBank, specText: "# nothing here\n", specPath: "2026-11-17-toy.md" });
  assert.deepEqual(codes(result), ["spec-block-missing"]);
  assert.equal(readSpec("# nothing here\n").present, false);
});

test("a pre-spec whose shape is not a request family is refused", () => {
  const result = checkSpec({
    bankText: toyBank,
    specText: specFixture({
      shape: "backend",
      rows: [
        { field: "user-scenario", value: "the operator", provenance: "request", receipt: "—" },
        { field: "observation", value: "the report command", provenance: "request", receipt: "—" },
        { field: "reversibility", value: "a revert undoes it", provenance: "request", receipt: "—" },
      ],
    }),
    specPath: "2026-11-17-toy.md",
  });
  assert.deepEqual(codes(result), ["spec-shape-unknown"]);
});

// ── 7. The shipped pin and the CLI boundary ───────────────────────────────

test("the shipped bank passes its own check", () => {
  const result = checkBank(read(BANK_REL));
  assert.equal(result.ok, true, JSON.stringify(result.findings));
  assert.equal(result.rows, 16);
});

test("the shipped bank and this unit's pre-spec pass together", () => {
  const result = checkPair({ bankText: read(BANK_REL), specText: read(SPEC_REL), specPath: path.basename(SPEC_REL) });
  assert.equal(result.ok, true, JSON.stringify(result.findings));
});

test("`elicitation check` answers PASS on the shipped pair and BLOCKED on a refused spec", () => {
  const pass = run("elicitation", "check", "--bank", path.join(REPO, BANK_REL), "--spec", path.join(REPO, SPEC_REL));
  assert.equal(pass.status, 0, pass.stderr);
  assert.match(pass.stdout, /ELICITATION CHECK PASS/);

  const root = scratch();
  try {
    const bankPath = path.join(root, "bank.md");
    const specPath = path.join(root, "2026-11-17-toy.md");
    writeFileSync(bankPath, toyBank);
    writeFileSync(specPath, specFixture({ questions: "none" }));
    const blocked = run("elicitation", "check", "--bank", bankPath, "--spec", specPath);
    assert.equal(blocked.status, 1, blocked.stderr);
    assert.match(blocked.stdout, /ELICITATION CHECK BLOCKED/);
    assert.match(blocked.stdout, /questions-none-without-why/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an operation-foreign flag or a missing file is refused before any check runs", () => {
  const root = scratch();
  try {
    const bankPath = path.join(root, "bank.md");
    writeFileSync(bankPath, toyBank);
    const foreign = run("elicitation", "check", "--bank", bankPath, "--spec", path.join(root, "missing.md"), "--shape", "feature");
    assert.equal(foreign.status, 2, foreign.stdout);
    assert.match(foreign.stderr, /EDIT REFUSAL/);
    assert.match(foreign.stderr, /--shape/, "the refusal names the offending flag");

    const missing = run("elicitation", "check", "--bank", bankPath, "--spec", path.join(root, "missing.md"));
    assert.equal(missing.status, 2, missing.stdout);
    assert.match(missing.stderr, /EDIT REFUSAL/);

    const unknownOperation = run("elicitation", "land");
    assert.equal(unknownOperation.status, 2);
    assert.throws(() => checkPair({}), ElicitationRefusal);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
