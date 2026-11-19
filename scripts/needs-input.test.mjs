#!/usr/bin/env node
// test-obligation: protects=packages/agentic-workflow/src/runner/sensors/needs-input.mjs obligations=contract,failure-path

/**
 * Corpus for the `needs-input` runner subcommand — the behavioural contract of the
 * needs-input dispatcher. Fixtures are embedded strings written to a temporary
 * directory at run time: no network, no committed fixtures directory.
 *
 * Every assertion is at the CLI boundary (exit code + stdout block), because
 * that is the contract the consumer skills paste.
 */

import test, { after } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseLedger } from "../packages/agentic-workflow/src/runner/sensors/needs-input.mjs";

const BIN = fileURLToPath(new URL("../packages/agentic-workflow/bin/agentic-workflow.mjs", import.meta.url));
/** The runner's subcommand this corpus exercises. */
const SUB = "needs-input";
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "needs-input-corpus-"));

after(() => fs.rmSync(TMP, { recursive: true, force: true }));

let counter = 0;

/** Write a unit folder (`SPEC.md` + optional `decisions.md`) and return it. */
function unit({ spec = null, ledger = null } = {}) {
  const dir = path.join(TMP, `unit-${++counter}`);
  fs.mkdirSync(dir, { recursive: true });
  if (spec !== null) fs.writeFileSync(path.join(dir, "SPEC.md"), spec);
  if (ledger !== null) fs.writeFileSync(path.join(dir, "decisions.md"), ledger);
  return dir;
}

/** Run the dispatcher; returns { status, stdout, stderr }. */
function run(...args) {
  const result = spawnSync(process.execPath, [BIN, SUB, ...args], { encoding: "utf8" });
  if (result.error && result.error.code === "ENOENT") return null;
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

const SPEC = `# fix/300-example

## Tasks

- P1 — Do the thing (validator: \`true\` exits 0)
- P2 — Do the other thing (validator: \`true\` exits 0)

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
`;

const HEADER = "open-questions@1\n"
  + "id | date | type | question | blocks | search-receipt | options | route\n";

function ledger(...rows) {
  return `${HEADER}${rows.join("\n")}\n`;
}

const OPEN_Q1 = "Q1 | 2026-10-19 | open-question | Which unit kind is this? | P3 cannot be cut without it | "
  + "`grep -rn \"unit kind\" docs/` → no hit; docs/fix/README.md:12 names two kinds | "
  + "feature (whole pipeline) | fix (plan-first pipeline) | design";

/** Extract the block body between the `open-questions@1` header and the footer. */
function body(stdout) {
  const lines = stdout.split("\n");
  const startIndex = lines.findIndex((line) => line === "open-questions@1");
  return lines.slice(startIndex > -1 ? startIndex : 0);
}

test("open question, no decision → block on stdout, exit 0", () => {
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1) }));

  assert.equal(result.status, 0, result.stderr);
  const lines = body(result.stdout);
  assert.equal(lines[0], "open-questions@1");
  assert.match(result.stdout, /^Unit: .*unit-\d+$/m);
  assert.match(result.stdout, /^Open questions: 1$/m);
  assert.match(result.stdout, /^- Q1 · design · Which unit kind is this\?$/m);
  assert.match(result.stdout, /^  Blocks: P3 cannot be cut without it$/m);
  assert.match(result.stdout, /^  Searched: `grep -rn "unit kind" docs\/` → no hit; docs\/fix\/README.md:12 names two kinds$/m);
  assert.match(result.stdout, /^  Options:$/m);
  assert.match(result.stdout, /^    - feature \(whole pipeline\)$/m);
  assert.match(result.stdout, /^    - fix \(plan-first pipeline\)$/m);
  assert.match(result.stdout, /^Route back: design$/m);
  assert.match(result.stdout, /^Continuation: no-decision-available$/m);
  assert.match(result.stdout, /^Decision: open$/m);
});

test("a decided question is not pending", () => {
  const D1 = "D1 | 2026-10-19 | decision | Q1 | human-owner | recorded in the review turn's chat paste | fix — the issue tracks a defect | feature: the blast radius is one script";
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1, D1) }));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Open questions: 0$/m);
  assert.match(result.stdout, /^Pending: none$/m);
  assert.match(result.stdout, /^Continuation: none$/m);
  assert.match(result.stdout, /^Decision: none$/m);
});

test("a later open-question row re-opens the loop", () => {
  const D1 = "D1 | 2026-10-19 | decision | Q1 | human-owner | chat paste | fix | feature";
  const Q2 = "Q2 | 2026-10-19 | open-question | Which script owns the guard? | P3 cannot start | "
    + "`rg -l \"needs-input\" scripts/` → no hit | scripts/needs-input.mjs (one owner) | "
    + "extend unit-route.mjs (no new script) | design";
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1, D1, Q2) }));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Open questions: 1$/m);
  assert.match(result.stdout, /^- Q2 · design · Which script owns the guard\?$/m);
});

test("last row is the machine entry", () => {
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1) }));

  assert.equal(result.status, 0, result.stderr);
  const lines = body(result.stdout);
  assert.equal(lines[lines.length - 1], "");
  assert.match(lines[lines.length - 2], /^Decision: open$/);
});

test("--json emits the same computation as JSON", () => {
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1) }), "--json");

  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.block, "open-questions@1");
  assert.match(parsed.unit, /^unit-\d+$/);
  assert.equal(parsed.open_questions.length, 1);
  assert.equal(parsed.open_questions[0].id, "Q1");
  assert.equal(parsed.open_questions[0].route, "design");
  assert.deepEqual(parsed.open_questions[0].options, [
    "feature (whole pipeline)",
    "fix (plan-first pipeline)",
  ]);
  assert.equal(parsed.continuation, "no-decision-available");
  assert.equal(parsed.decision, "open");
});

test("--json bounds the echoed cells like the text block does", () => {
  const big = "x".repeat(20000);
  const result = run(
    unit({
      spec: SPEC,
      ledger: ledger(`Q1 | 2026-10-19 | open-question | q${big} | b${big} | r${big} | - opt ${big} | - opt2 | design`),
    }),
    "--json",
  );

  assert.equal(result.status, 0, result.stderr);
  const parsed = JSON.parse(result.stdout);
  const question = parsed.open_questions[0];
  for (const value of [question.question, question.blocks, question.search_receipt, ...question.options]) {
    assert.ok(value.length <= 400, `unbounded field: ${value.length} chars`);
  }
});

test("no decisions.md → exit 0, nothing pending (the ledger is optional)", () => {
  const result = run(unit({ spec: SPEC }));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Open questions: 0$/m);
});

test("missing unit folder → fails closed", () => {
  const result = run(path.join(TMP, "does-not-exist"));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^NEEDS-INPUT FAIL — needs-input@1$/m);
  assert.match(result.stdout, /^Reason: missing-unit-doc$/m);
  assert.match(result.stdout, /^Continuation: no-decision-available$/m);
});

test("missing SPEC.md → fails closed", () => {
  const dir = unit({ ledger: ledger(OPEN_Q1) });
  const result = run(dir);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: missing-unit-doc$/m);
});

test("no --tasks argument → usage error, exit 2", () => {
  const result = run();

  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage: agentic-workflow needs-input <unit-dir>/);
});

test("unknown option → usage error, exit 2", () => {
  const result = run(unit({ spec: SPEC }), "--nope");

  assert.equal(result.status, 2);
  assert.match(result.stderr, /unknown option: --nope/);
});

test("malformed ledger: no @1 header → fails closed", () => {
  const result = run(unit({ spec: SPEC, ledger: `Q1 | 2026-10-19 | open-question | x | y | z | a | design\n` }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: malformed-ledger-header$/m);
  assert.match(result.stdout, /^Where: decisions\.md:1$/m);
});

test("malformed ledger: unknown entry type → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("Q9 | 2026-10-19 | question | x | y | z | a | design"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: malformed-entry$/m);
  assert.match(result.stdout, /^Where: decisions\.md:3$/m);
});

test("malformed ledger: wrong cell count → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("Q1 | 2026-10-19 | open-question | only four cells"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: malformed-entry$/m);
});

test("malformed ledger: open question without a search receipt → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("Q1 | 2026-10-19 | open-question | x | y | none | a | design"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: missing-search-receipt$/m);
  assert.match(result.stdout, /^Where: decisions\.md:3$/m);
});

test("malformed ledger: open question with no options → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("Q1 | 2026-10-19 | open-question | x | y | grep → no hit | none | design"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: missing-options$/m);
});

test("malformed ledger: unknown route → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("Q1 | 2026-10-19 | open-question | x | y | grep → no hit | a | implement"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: unknown-route$/m);
});

test("malformed ledger: decision addressed to an unknown question → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("D1 | 2026-10-19 | decision | Q7 | human-owner | chat paste | fix | feature"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: unknown-question$/m);
});

test("malformed ledger: decision without human-owner authority → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger(OPEN_Q1, "D1 | 2026-10-19 | decision | Q1 | execute-phase | chat paste | fix | feature"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: invalid-authority$/m);
});

test("duplicate question id → fails closed", () => {
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1, OPEN_Q1) }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: duplicate-id$/m);
});

test("the block is versioned and byte-stable across runs", () => {
  const dir = unit({ spec: SPEC, ledger: ledger(OPEN_Q1) });
  const first = run(dir);
  const second = run(dir);

  assert.equal(first.status, 0);
  assert.equal(first.stdout, second.stdout);
  assert.match(first.stdout, /^open-questions@1$/m);
});

test("an escaped pipe stays inside its cell instead of shifting the columns", () => {
  const matrix = "Q1 | 2026-10-19 | open-question | Which one? | P3 cannot start | "
    + "`rg \"a\\|b\" docs/` → docs/x.md:3: | two-tables (fits the page) | "
    + "one-table (breaks the page) | unit-lane";
  const result = run(unit({ spec: SPEC, ledger: ledger(matrix) }));

  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes('  Searched: `rg "a|b" docs/` → docs/x.md:3:'), result.stdout);
  assert.match(result.stdout, /^    - two-tables \(fits the page\)$/m);
  assert.match(result.stdout, /^    - one-table \(breaks the page\)$/m);
  assert.match(result.stdout, /^Route back: unit-lane$/m);
});

test("a decision row maps its fields to the published per-type layout", () => {
  const parsed = parseLedger(ledger(
    OPEN_Q1,
    "D1 | 2026-10-19 | decision | Q1 | human-owner | recorded in the chat paste | Postgres chosen | SQLite discarded",
  ));

  assert.equal(parsed.ok, true, JSON.stringify(parsed));
  const decision = parsed.entries.find((entry) => entry.type === "decision");
  assert.equal(decision.closes, "Q1");
  assert.equal(decision.authority, "human-owner");
  assert.equal(decision.receipt, "recorded in the chat paste");
  assert.equal(decision.chosen, "Postgres chosen");
  assert.equal(decision.discarded, "SQLite discarded");
});

test("malformed ledger: decision without a receipt → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger(OPEN_Q1, "D1 | 2026-10-19 | decision | Q1 | human-owner | none | fix | feature"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: missing-search-receipt$/m);
});

test("malformed ledger: decision with too few cells → fails closed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger(OPEN_Q1, "D1 | 2026-10-19 | decision | Q1 | human-owner | fix | feature"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: malformed-entry$/m);
});

test("a non-pipe escape passes through verbatim instead of failing the row", () => {
  const receipt = "Q1 | 2026-10-19 | open-question | Which retry pattern? | blocks AC2 | "
    + "grep '\\d+' scripts/x.mjs found nothing | - \\w+ (simple) | - [0-9]+ (explicit) | unit-lane";
  const result = run(unit({ spec: SPEC, ledger: ledger(receipt) }));

  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes("grep '\\d+' scripts/x.mjs found nothing"), result.stdout);
  assert.ok(result.stdout.includes("- \\w+ (simple)"), result.stdout);
});

test("a trailing lone backslash still fails closed instead of being swallowed", () => {
  const result = run(unit({
    spec: SPEC,
    ledger: ledger("Q1 | 2026-10-19 | open-question | x | y | receipt cites scripts/x.mjs | a | design\\"),
  }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: malformed-entry$/m);
});

test("fenced examples inside decisions.md are quoted text, never entries", () => {
  const quoted = `${HEADER}\n\`\`\`text\nQ9 | 2026-10-19 | open-question | fenced example | x | y | a | design\n\`\`\`\n${OPEN_Q1}\n`;
  const result = run(unit({ spec: SPEC, ledger: quoted }));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Open questions: 1$/m);
  assert.ok(!result.stdout.includes("Q9"), result.stdout);
});

test("the published side-by-side blocks in decisions.md never fail the ledger", () => {
  // The template agent guide publishes `decisions.md` as one file holding
  // several typed blocks side by side; the dispatcher reads its own and must
  // leave the rest untouched instead of failing closed on them.
  const composed = [
    `${HEADER.replace(/\n$/, "")}`,
    OPEN_Q1,
    "",
    "path-protection-records@1",
    "kind | paths | phase | date | authority | justification",
    "justification | skills/execute-phase/SKILL.md | P10 | 2026-10-19 | execute-phase | the fold repairs the cited guard",
    "approval | skills/execute-phase/SKILL.md | P10 | 2026-10-19 | human-owner | owner order recorded in the review turn",
    "",
    "### Decide for me",
    "",
    "| date | decision | reason |",
    "|---|---|---|",
    "| 2026-10-19 | unit-lane | the defect is plan-owned |",
    "",
  ].join("\n");
  const result = run(unit({ spec: SPEC, ledger: composed }));

  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /^Open questions: 1$/m);
  assert.ok(!result.stdout.includes("path-protection-records@1"), result.stdout);
  assert.ok(!result.stdout.includes("Decide for me"), result.stdout);
});

test("a decision appended after a published side-by-side block still closes its question", () => {
  const D1 = "D1 | 2026-10-19 | decision | Q1 | human-owner | recorded in the review turn's chat paste | fix — one script | feature: three skills";
  const composed = [
    HEADER.replace(/\n$/, ""),
    OPEN_Q1,
    "",
    "path-protection-records@1",
    "kind | paths | phase | date | authority | justification",
    "justification | scripts/needs-input.mjs | P10 | 2026-10-19 | execute-phase | the fold repairs the parser",
    "",
    D1,
    "",
  ].join("\n");
  const result = run(unit({ spec: SPEC, ledger: composed }));

  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /^Open questions: 0$/m);
  assert.match(result.stdout, /^Decision: none$/m);
});

test("a ledger that starts with its own block is read even when other blocks precede it", () => {
  const composed = [
    "path-protection-records@1",
    "kind | paths | phase | date | authority | justification",
    "justification | skills/init-workspace/SKILL.md | P10 | 2026-10-19 | execute-phase | the consent halt is re-cut",
    "",
    HEADER.replace(/\n$/, ""),
    OPEN_Q1,
    "",
  ].join("\n");
  const result = run(unit({ spec: SPEC, ledger: composed }));

  assert.equal(result.status, 0, result.stdout);
  assert.match(result.stdout, /^Open questions: 1$/m);
});

test("a line that belongs to no published block still fails closed", () => {
  const composed = ledger(OPEN_Q1, "a stray prose line that names no block");
  const result = run(unit({ spec: SPEC, ledger: composed }));

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /^Reason: malformed-entry$/m);
});

test("a skill that runs before any unit exists states where the dispatcher gets one", () => {
  // F53: the Turn-contract box is the checklist an agent ticks before ending a
  // turn. A skill that runs BEFORE a unit folder exists (init-workspace) can only
  // satisfy it if the box says where the dispatcher's unit comes from; a skill
  // that always runs inside one (execute-phase, unit-lane) needs no scratch step.
  const skills = fileURLToPath(new URL("../skills", import.meta.url));
  const RUNS_BEFORE_A_UNIT = new Set(["init-workspace"]);
  for (const name of RUNS_BEFORE_A_UNIT) {
    const text = fs.readFileSync(path.join(skills, name, "SKILL.md"), "utf8");
    const box = text.split("## Turn contract")[1];
    assert.ok(box !== undefined, `${name}: no Turn contract`);
    // The box is a fenced checklist whose bullets wrap; the halt bullet is the
    // one carrying the dispatcher or its block, continuation lines included.
    const lines = box.split("\n## ")[0].split("\n");
    const start = lines.findIndex((line) => line.includes("needs-input.mjs") || line.includes("open-questions@1"));
    assert.ok(start > -1, `${name}: the box never names the halt`);
    const bullet = [lines[start]];
    for (const line of lines.slice(start + 1)) {
      if (/^\u2713/.test(line.trim()) || line.trim() === "```") break;
      bullet.push(line);
    }
    assert.match(bullet.join(" "), /scratch/i, `${name}: the box runs the dispatcher without saying where a scratch unit comes from`);
  }
});

test("the disabled guard: a box that omits the scratch unit is caught", () => {
  // Proves the guard above is load-bearing: the pre-fold box text fails it.
  const legacyBox = "✓ Required user inputs were answered concretely (not defaulted). Consent for\n"
    + "  every install, hook, and overwrite is explicit; a consent gap runs\n"
    + "  `node scripts/needs-input.mjs <unit-dir>` and stops with the\n"
    + "  `open-questions@1` block carrying the questions.";
  assert.ok(legacyBox.includes("needs-input.mjs"));
  assert.equal(/scratch/i.test(legacyBox), false);
});

// ---------------------------------------------------------------------------
// #644 · the substrate route — a gap no document could own routes to the
// scaffolder, and the claim is verified against the workspace, never trusted
// ---------------------------------------------------------------------------

/** A guide carrying the four substrate surfaces the census reads. */
const SCAFFOLD_GUIDE = `# Fixture project

## Documentation map

| Task | Required docs |
|---|---|
| Any change | \`docs/architecture/ARCHITECTURE.md\` |

## Project charter

- **Decision records:** one ADR per irreversible decision
- **API posture:** safer-API
`;

/**
 * Write a workspace root and return it. `architecture` is the architecture
 * doc's body, or `null` for a workspace that has none.
 */
function workspaceRoot({ guide = SCAFFOLD_GUIDE, architecture = "# Architecture\n\nOne boundary.\n", declines = null } = {}) {
  const dir = path.join(TMP, `workspace-${++counter}`);
  fs.mkdirSync(path.join(dir, "docs", "architecture"), { recursive: true });
  fs.writeFileSync(path.join(dir, "AGENTS.md"), declines === null ? guide : `${guide}${declines}`);
  if (architecture !== null) fs.writeFileSync(path.join(dir, "docs", "architecture", "ARCHITECTURE.md"), architecture);
  return dir;
}

/** A unit folder inside a workspace, so discovery walks up to the marker. */
function unitIn(root, body = SPEC, entries = null) {
  const dir = path.join(root, "docs", "features", `unit-${++counter}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SPEC.md"), body);
  if (entries !== null) fs.writeFileSync(path.join(dir, "decisions.md"), entries);
  return dir;
}

/** A ledger row routed at the scaffolder, with the class it claims. */
function substrateRow(route) {
  return `Q2 | 2026-11-19 | open-question | Which architecture boundary owns the runner? | P3 cannot cut the map | `
    + "`rg -n 'architecture' docs/ AGENTS.md` → no owning doc; docs/architecture/ARCHITECTURE.md absent | "
    + `add the doc at bootstrap | add it in this unit, inventing the home | ${route}`;
}

test("#644 a substrate gap routes to the scaffolder and the block carries that route", () => {
  const root = workspaceRoot({ architecture: null });
  const result = run(unitIn(root, SPEC, ledger(substrateRow("init-workspace:architecture"))));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^- Q2 · init-workspace:architecture · Which architecture boundary owns the runner\?$/m);
  assert.match(result.stdout, /^Route back: init-workspace:architecture$/m);
});

test("#644 the same claim on a workspace that owns the surface is refused, not granted", () => {
  const root = workspaceRoot();
  const result = run(unitIn(root, SPEC, ledger(substrateRow("init-workspace:architecture"))));

  assert.equal(result.status, 1, "a route around an existing owner is a defect");
  assert.match(result.stdout, /^Reason: substrate-present$/m);
  assert.match(result.stdout, /^Where: decisions\.md:\d+$/m);
});

test("#644 a declined class still routes to the scaffolder: a decline is reversible, ask-first", () => {
  const declines = `
\`\`\`text
substrate-declines@1
class | date | owner
architecture | 2026-11-19 | human-owner
\`\`\`
`;
  const root = workspaceRoot({ architecture: null, declines });
  const result = run(unitIn(root, SPEC, ledger(substrateRow("init-workspace:architecture"))));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Route back: init-workspace:architecture$/m);
});

test("#644 a bare init-workspace route has no class to verify and is refused", () => {
  const result = run(unit({ spec: SPEC, ledger: ledger(substrateRow("init-workspace")) }));

  assert.equal(result.status, 1);
  assert.match(result.stdout, /^Reason: unknown-route$/m);
});

test("#644 a substrate class outside the published set is refused", () => {
  const result = run(unit({ spec: SPEC, ledger: ledger(substrateRow("init-workspace:billing")) }));

  assert.equal(result.status, 1);
  assert.match(result.stdout, /^Reason: unknown-route$/m);
});

test("#644 a substrate claim with no discoverable workspace fails closed", () => {
  const result = run(unit({ spec: SPEC, ledger: ledger(substrateRow("init-workspace:architecture")) }));

  assert.equal(result.status, 1, "no workspace means the claim cannot be verified");
  assert.match(result.stdout, /^Reason: missing-workspace$/m);
});

test("#644 --workspace re-points the census when the unit lives outside the scaffold", () => {
  const root = workspaceRoot({ architecture: null });
  const result = run(unit({ spec: SPEC, ledger: ledger(substrateRow("init-workspace:architecture")) }), "--workspace", root);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Route back: init-workspace:architecture$/m);
});

test("#644 a design route never reads the workspace: the census is lazy", () => {
  // The unrelated-behaviour invariant: adding a census must not make an ordinary
  // halt depend on a workspace, a marker or a readable guide.
  const result = run(unit({ spec: SPEC, ledger: ledger(OPEN_Q1) }), "--workspace", path.join(TMP, "absent-workspace"));

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^Route back: design$/m);
});
