/**
 * charter.test.mjs — the `charter` file service (unit 556, feature/556-engineering-interview).
 *
 * `init-workspace` asks its engineering interview with prose, but the landing and
 * the bank's own check are deterministic: `charter state` reports what the project
 * already declares, `charter land` writes answers without ever overwriting a team
 * convention, and `charter check` refuses a bank question that cannot state its
 * bibliography source and the two behaviours its answers toggle.
 *
 * Every refusal case is a fixture over the same code path the shipped files run
 * through, and the shipped pin at the end is the real bank plus the real template
 * guide — a bank that stops landing its answers passes here rather than shipping.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  BANK_CONTRACT_ID,
  BOUNDARY_SLOT,
  LAYERS,
  CharterRefusal,
  checkBank,
  landAnswers,
  parseLandPayload,
  readBank,
  readSlots,
  stateReport,
} from "../src/charter/interview.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const BIN = fileURLToPath(new URL("../bin/agentic-workflow.mjs", import.meta.url));
const BANK_REL = "skills/init-workspace/references/ENGINEERING_INTERVIEW.md";
const GUIDE_REL = "template/AGENTS.md";

const read = (rel) => readFileSync(path.join(REPO, rel), "utf8");
const run = (...args) => {
  const result = spawnSync(process.execPath, [BIN, ...args], { encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

/** One scratch tree per case, removed by the case that made it. */
function scratch() {
  const root = mkdtempSync(path.join(tmpdir(), "charter-test-"));
  mkdirSync(path.join(root, "docs"), { recursive: true });
  return root;
}

/** A guide carrying the slots a bank row can land in. */
const guideFixture = (slots) =>
  `# AGENTS\n\n## Project charter\n\nIntro prose that is not a slot.\n\n${slots
    .map(([key, value]) => `- **${key}:** ${value}`)
    .join("\n")}\n\n## Commands\n\n- gate: \`true\`\n`;

/** The cell contract plus the table a bank document carries. */
function bankFixture(rows, { cells, header } = {}) {
  const declared = cells ?? ["id", "layer", "question", "applies-when", "source", "toggles", "default", "lands-in"];
  const row = (cellsToJoin) => `| ${cellsToJoin.join(" | ")} |`;
  const columns = header ?? declared;
  return [
    "## The bank",
    "",
    "```text",
    BANK_CONTRACT_ID,
    "cell | shape | what it orders",
    ...declared.map((cell) => `${cell} | <${cell}> | what ${cell} orders`),
    "```",
    "",
    row(columns),
    row(columns.map(() => "---")),
    ...rows.map(row),
    "",
  ].join("\n");
}

const goodRow = (overrides = {}) => [
  overrides.id ?? "OBJ-01",
  overrides.layer ?? "objectives",
  overrides.question ?? "What is this repository for?",
  overrides.applies ?? "always",
  overrides.source ?? "Norman, The Design of Everyday Things (1988)",
  overrides.toggles ?? "a sharp purpose → a unit that cannot state its job is refused; an unclear one → the design step widens its scope",
  overrides.default ?? "one sentence naming the job",
  overrides.lands ?? "Repo purpose",
];

// ── 0. Reading the section and its slots ────────────────────────────────────

test("a slot is a `- **Key:** value` bullet inside `## Project charter`, and nothing outside it counts", () => {
  const guide = guideFixture([["Project kind", "`<web app | library>`"], ["Repo purpose", "a job"]]);
  const slots = readSlots(guide);
  assert.deepEqual(slots.map((slot) => slot.key), ["Project kind", "Repo purpose"]);
  const states = stateReport(guide);
  assert.equal(states.find((row) => row.key === "Project kind").state, "placeholder");
  assert.equal(states.find((row) => row.key === "Repo purpose").state, "filled");
});

test("the charter section is the one the crate already reads by heading, and its absence is not a guess", () => {
  assert.match(guideFixture([["Repo purpose", "a job"]]), /## Project charter/);
  const noSection = "# AGENTS\n\n## Commands\n\n- **Repo purpose:** something\n";
  assert.deepEqual(readSlots(noSection), []);
  assert.throws(() => landAnswers({ guideText: noSection, payload: { date: "2026-11-16", answers: { "Repo purpose": "x" } } }), CharterRefusal);
});

// ── 1. The bank's own check (S8) ────────────────────────────────────────────

test("the shipped bank passes the check against the shipped guide", () => {
  const result = checkBank({ guideText: read(GUIDE_REL), bankText: read(BANK_REL) });
  assert.deepEqual(result.findings, [], `the shipped bank must pass its own check: ${JSON.stringify(result.findings, null, 2)}`);
});

test("a question with no bibliography source is refused", () => {
  const bankText = bankFixture([goodRow({ source: "" })]);
  const findings = checkBank({ guideText: guideFixture([["Repo purpose", "`<job>`"]]), bankText }).findings;
  assert.ok(findings.some((finding) => finding.code === "row-source-missing"), JSON.stringify(findings));
});

test("a question whose answers toggle one behaviour is refused — two answers or no question", () => {
  const bankText = bankFixture([goodRow({ toggles: "a sharp purpose → a narrower scope" })]);
  const findings = checkBank({ guideText: guideFixture([["Repo purpose", "`<job>`"]]), bankText }).findings;
  assert.ok(findings.some((finding) => finding.code === "row-toggles-single"), JSON.stringify(findings));
});

test("a question with no ask condition is refused — no universal questionnaire", () => {
  const bankText = bankFixture([goodRow({ applies: "" })]);
  const findings = checkBank({ guideText: guideFixture([["Repo purpose", "`<job>`"]]), bankText }).findings;
  assert.ok(findings.some((finding) => finding.code === "row-applies-when-missing"), JSON.stringify(findings));
});

test("a row landing in a slot the guide does not carry is refused", () => {
  const bankText = bankFixture([goodRow({ lands: "Nonexistent slot" })]);
  const findings = checkBank({ guideText: guideFixture([["Repo purpose", "`<job>`"]]), bankText }).findings;
  assert.ok(findings.some((finding) => finding.code === "slot-missing"), JSON.stringify(findings));
});

test("an unknown layer is refused; the two layers are the closed set", () => {
  const bankText = bankFixture([goodRow({ layer: "engineering" })]);
  const findings = checkBank({ guideText: guideFixture([["Repo purpose", "`<job>`"]]), bankText }).findings;
  assert.ok(findings.some((finding) => finding.code === "row-layer" && finding.detail.includes(LAYERS.join("/"))), JSON.stringify(findings));
});

test("the table header must equal the cells the block declares — one owner, no silent drift", () => {
  const bankText = bankFixture([goodRow()], { header: ["id", "layer", "question", "when", "source", "toggles", "default", "lands-in"] });
  const findings = checkBank({ guideText: guideFixture([["Repo purpose", "`<job>`"]]), bankText }).findings;
  assert.ok(findings.some((finding) => finding.code === "bank-header-drift"), JSON.stringify(findings));
});

test("a bank without its contract block or its table is refused, never read as empty", () => {
  const noBlock = "## The bank\n\n| id | layer |\n|---|---|\n";
  assert.ok(checkBank({ guideText: guideFixture([["Repo purpose", "x"]]), bankText: noBlock }).findings.some((finding) => finding.code === "bank-block-missing"));
  const noTable = "```text\n" + BANK_CONTRACT_ID + "\ncell | shape | what it orders\nid | <x> | y\n```\n";
  assert.ok(checkBank({ guideText: guideFixture([["Repo purpose", "x"]]), bankText: noTable }).findings.some((finding) => finding.code === "bank-table-missing"));
});

test("a key that appears twice in the charter is refused — one answer, one home", () => {
  const guide = guideFixture([
    ["Dependency policy", "`<selection criteria>`"],
    ["Architectural boundaries", "`<one entry per boundary>`"],
    ["Dependency policy", "`<pinning posture>`"],
  ]);
  const findings = checkBank({ guideText: guide, bankText: bankFixture([goodRow({ lands: "Dependency policy" })]) }).findings;
  assert.ok(findings.some((finding) => finding.code === "slot-duplicate" && finding.detail.includes("Dependency policy")), JSON.stringify(findings));
});

test("the shipped template carries no duplicated charter key", () => {
  const keys = readSlots(read(GUIDE_REL)).map((slot) => slot.key);
  assert.equal(new Set(keys).size, keys.length, `duplicated keys: ${keys.filter((key, index) => keys.indexOf(key) !== index).join(", ")}`);
});

// ── 2. Boundary enforcement (S10) ───────────────────────────────────────────

test("the enforcement answer has two legal shapes and a filled slot outside them is refused", () => {
  const guide = guideFixture([["Architectural boundaries", "`api → machine: a lint rule` · `ui → prose-only`"]]);
  assert.deepEqual(checkBank({ guideText: guide, bankText: bankFixture([goodRow({ lands: "Architectural boundaries" })]) }).findings.filter((finding) => finding.code.startsWith("boundary")), []);
  const bad = guideFixture([["Architectural boundaries", "`api is important` · `ui → maybe`"]]);
  const findings = checkBank({ guideText: bad, bankText: bankFixture([goodRow({ lands: "Architectural boundaries" })]) }).findings;
  assert.ok(findings.some((finding) => finding.code === "boundary-entry-shape"), JSON.stringify(findings));
});

test("a guide with no boundary slot cannot carry the materialization step's answer", () => {
  const findings = checkBank({ guideText: guideFixture([["Repo purpose", "`<job>`"]]), bankText: bankFixture([goodRow()]) }).findings;
  assert.ok(findings.some((finding) => finding.code === "boundary-slot-missing" && finding.detail.includes(BOUNDARY_SLOT)), JSON.stringify(findings));
});

// ── 3. Landing answers (S6, S7, S9) ─────────────────────────────────────────

test("a pre-seeded team convention survives the landing pass while the placeholder beside it receives the answer", () => {
  const guideText = guideFixture([
    ["Testing strategy", "`unit plus integration, with a characterization test before any refactor`"],
    ["Team shape", "`<solo | small | large>`"],
  ]);
  const payload = { date: "2026-11-16", answers: { "Testing strategy": "system-first", "Team shape": "small" } };
  const result = landAnswers({ guideText, payload });
  assert.equal(result.rows.find((row) => row.key === "Testing strategy").status, "kept");
  assert.equal(result.rows.find((row) => row.key === "Team shape").status, "written");
  assert.match(result.text, /\*\*Testing strategy:\*\* `unit plus integration, with a characterization test before any refactor`/);
  assert.match(result.text, /\*\*Team shape:\*\* small/);
  // Every byte that is not the written value is the guide's own.
  assert.equal(result.text.replace(/\*\*Team shape:\*\* small/, ""), guideText.replace(/\*\*Team shape:\*\* `<solo \| small \| large>`/, ""));
});

test("an unanswered slot with a bank default lands as a dated assumption, and a default with no date is refused", () => {
  const guideText = guideFixture([["Team shape", "`<solo | small | large>`"], ["Repo purpose", "`<job>`"]]);
  const result = landAnswers({ guideText, payload: { date: "2026-11-16", answers: { "Repo purpose": "a job" }, defaults: { "Team shape": "small" } } });
  assert.equal(result.rows.find((row) => row.key === "Team shape").status, "assumed");
  assert.match(result.text, /\*\*Team shape:\*\* assumed 2026-11-16 — small/);
  assert.equal(result.rows.find((row) => row.key === "Repo purpose").status, "written");
  assert.throws(
    () => landAnswers({ guideText, payload: { answers: {}, defaults: { "Team shape": "small" } } }),
    (error) => error instanceof CharterRefusal && /date/.test(error.message),
  );
});

test("a slot nobody answered and no default covers is reported unanswered, never invented", () => {
  const guideText = guideFixture([["Team shape", "`<solo | small | large>`"]]);
  const result = landAnswers({ guideText, payload: { date: "2026-11-16", answers: {} } });
  assert.equal(result.rows[0].status, "unanswered");
  assert.equal(result.text, guideText);
});

test("an unknown slot key, and a malformed payload, are refused before any byte moves", () => {
  const guideText = guideFixture([["Repo purpose", "`<job>`"]]);
  assert.throws(() => landAnswers({ guideText, payload: { date: "2026-11-16", answers: { Nope: "x" } } }), (error) => error instanceof CharterRefusal && /slot/.test(error.message));
  assert.throws(() => parseLandPayload("{ not json"), CharterRefusal);
  assert.throws(() => parseLandPayload('{"date":"2026-11-16","answers":[]}'), CharterRefusal);
  assert.throws(() => parseLandPayload('{"date":"16-11-2026","answers":{}}'), CharterRefusal);
});

test("the landing is deterministic: two runs over the same payload produce the same bytes", () => {
  const guideText = guideFixture([["Repo purpose", "`<job>`"]]);
  const payload = { date: "2026-11-16", answers: { "Repo purpose": "a job" } };
  assert.equal(landAnswers({ guideText, payload }).text, landAnswers({ guideText, payload }).text);
});

// ── 4. The shipped pin: the real bank, the real guide ──────────────────────

test("the shipped bank declares the cell contract and sixteen rows over the two layers", () => {
  const bank = readBank(read(BANK_REL));
  assert.deepEqual(bank.cells, ["id", "layer", "question", "applies-when", "source", "toggles", "default", "lands-in"]);
  assert.equal(bank.rows.length, 16);
  assert.deepEqual([...new Set(bank.rows.map((row) => row.layer))].sort(), [...LAYERS].sort());
});

test("the bank covers each technical area the interview asks about", () => {
  const rows = readBank(read(BANK_REL)).rows;
  const area = (prefix) => rows.filter((row) => row.id.startsWith(prefix)).length;
  assert.equal(area("OBJ-"), 5);
  assert.equal(area("TST-"), 3);
  assert.equal(area("ARC-"), 2);
  assert.equal(area("DEP-") + area("VER-") + area("DEC-") + area("API-"), 6);
  assert.equal(rows.filter((row) => row.layer === "objectives").length, 5);
});

test("the shipped guide carries every slot the bank lands in, so no answer has nowhere to go", () => {
  const bank = readBank(read(BANK_REL));
  const slots = new Set(readSlots(read(GUIDE_REL)).map((slot) => slot.key));
  for (const row of bank.rows) {
    assert.ok(slots.has(row["lands-in"]), `${row.id} lands in "${row["lands-in"]}", which the template guide does not carry`);
  }
});

// ── 5. The CLI boundary ────────────────────────────────────────────────────

test("`charter check` answers PASS on the shipped pair and BLOCKED on a refused bank", () => {
  const pass = run("charter", "check", "--guide", path.join(REPO, GUIDE_REL), "--bank", path.join(REPO, BANK_REL));
  assert.equal(pass.status, 0, pass.stderr);
  assert.match(pass.stdout, /CHARTER CHECK PASS/);

  const root = scratch();
  try {
    const bankPath = path.join(root, "bank.md");
    writeFileSync(bankPath, bankFixture([goodRow({ source: "" })]));
    writeFileSync(path.join(root, "AGENTS.md"), guideFixture([["Repo purpose", "`<job>`"], ["Architectural boundaries", "`api → prose-only`"]]));
    const blocked = run("charter", "check", "--guide", path.join(root, "AGENTS.md"), "--bank", bankPath);
    assert.equal(blocked.status, 1, blocked.stderr);
    assert.match(blocked.stdout, /CHARTER CHECK BLOCKED/);
    assert.match(blocked.stdout, /row-source-missing/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("`charter state` reports slots without writing, and `charter land` writes only the placeholder", () => {
  const root = scratch();
  try {
    const guidePath = path.join(root, "AGENTS.md");
    const original = guideFixture([
      ["Testing strategy", "`unit plus integration`"],
      ["Team shape", "`<solo | small | large>`"],
    ]);
    writeFileSync(guidePath, original);
    const state = run("charter", "state", "--guide", guidePath);
    assert.equal(state.status, 0, state.stderr);
    assert.match(state.stdout, /CHARTER STATE/);
    assert.match(state.stdout, /Testing strategy: filled/);
    assert.equal(readFileSync(guidePath, "utf8"), original, "state writes nothing");

    const payloadPath = path.join(root, "answers.json");
    writeFileSync(payloadPath, JSON.stringify({ date: "2026-11-16", answers: { "Team shape": "small", "Testing strategy": "system-first" } }));
    const land = run("charter", "land", "--guide", guidePath, "--answers", payloadPath);
    assert.equal(land.status, 0, land.stderr);
    assert.match(land.stdout, /CHARTER LAND/);
    assert.match(land.stdout, /Testing strategy: kept/);
    assert.match(readFileSync(guidePath, "utf8"), /\*\*Team shape:\*\* small/);

    const bad = run("charter", "land", "--guide", guidePath, "--answers", path.join(root, "missing.json"));
    assert.equal(bad.status, 2);
    assert.match(bad.stderr, /EDIT REFUSAL/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
