#!/usr/bin/env node
/**
 * Corpus for the golden fixture — the executable half of
 * `docs/workflow/GOLDEN_FIXTURE.md`. It asserts the committed toy trees under
 * `scripts/fixtures/golden-fixture/` by running the real tools at their CLI
 * boundary: `scripts/phase-lint.mjs` (both verdicts) and
 * `scripts/schema-runtime.mjs` (the envelope contract), plus the run-log Result
 * grammar, the doc's cross-references, and the audit-target trap invariants.
 *
 * Every check is a function of a fixture root, so the AC4 tamper case re-runs the
 * real code path over a temporary copy instead of a re-implementation. The suite
 * is read-only over the working tree (the tamper case's temp dir is the only
 * write) and deterministic: no network, no wall-clock, no randomness, no model
 * in the mechanical loop (AC8, D-55-7).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { loadSchemaRuntime } from "./schema-runtime.mjs";

const REPO = fileURLToPath(new URL("..", import.meta.url));
const FIXTURE_DIR = path.join(REPO, "scripts", "fixtures", "golden-fixture");
const DOC = path.join(REPO, "docs", "workflow", "GOLDEN_FIXTURE.md");
const LINTER = path.join(REPO, "scripts", "phase-lint.mjs");
const GUIDE = path.join(REPO, "CLAUDE.md");
const INDEX = path.join(REPO, "docs", "workflow", "README.md");
const SNAPSHOT = path.join(FIXTURE_DIR, "expected", "phase-lint-toy-plan.txt");

/** The same validator the skills' envelopes are checked with. */
const { validateEnvelope } = await loadSchemaRuntime();

/**
 * Run the real phase-lint tool at its CLI boundary.
 * @returns {{ status: number|null, stdout: string }}
 */
function runPhaseLint(planPath) {
  const result = spawnSync(process.execPath, [LINTER, planPath], { encoding: "utf8" });
  if (result.error) throw result.error;
  return { status: result.status, stdout: result.stdout };
}

/** A repo-relative label for a path, falling back to the absolute path outside the repo. */
function showPath(p) {
  const rel = path.relative(REPO, p);
  return rel && !rel.startsWith("..") ? rel.split(path.sep).join("/") : p;
}

/** Copy a tree recursively (the tamper case's only temp use). */
function copyTree(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) copyTree(src, dst);
    else fs.copyFileSync(src, dst);
  }
}

function withTempDir(run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "golden-fixture-"));
  try {
    return run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// --- checks, each a function of a fixture root (ED-55-2) ----------------------

/** AC1 — the clean toy plan exits 0 and its stdout is byte-identical to the snapshot. */
export function phaseLintPass(root) {
  const plan = path.join(root, "toy-plan.md");
  const snapshot = path.join(root, "expected", "phase-lint-toy-plan.txt");
  for (const p of [plan, snapshot]) {
    if (!fs.existsSync(p)) {
      return { ok: false, message: `phaseLintPass: missing fixture file ${showPath(p)}` };
    }
  }
  const expected = fs.readFileSync(snapshot, "utf8");
  const { status, stdout } = runPhaseLint(plan);
  if (status !== 0) {
    return { ok: false, message: `phaseLintPass: ${showPath(plan)} exited ${status}, expected 0` };
  }
  if (!/^verdict PASS$/m.test(stdout)) {
    return { ok: false, message: `phaseLintPass: ${showPath(plan)} stdout carries no \`verdict PASS\`` };
  }
  if (stdout !== expected) {
    return {
      ok: false,
      message: `phaseLintPass: ${showPath(plan)} stdout is not byte-identical to the committed snapshot ${showPath(snapshot)}`,
    };
  }
  return { ok: true };
}

/** AC2 — the non-atomic variant exits non-zero with `verdict BLOCKED` and a `box-<n>` finding. */
export function phaseLintBlocked(root) {
  const plan = path.join(root, "toy-plan-nonatomic.md");
  if (!fs.existsSync(plan)) {
    return { ok: false, message: `phaseLintBlocked: missing fixture file ${showPath(plan)}` };
  }
  const { status, stdout } = runPhaseLint(plan);
  if (status === 0) {
    return { ok: false, message: `phaseLintBlocked: ${showPath(plan)} exited 0, expected non-zero` };
  }
  if (!/^verdict BLOCKED/m.test(stdout)) {
    return { ok: false, message: `phaseLintBlocked: ${showPath(plan)} stdout carries no \`verdict BLOCKED\`` };
  }
  if (!/box-\d+/.test(stdout)) {
    return { ok: false, message: `phaseLintBlocked: ${showPath(plan)} stdout carries no \`box-<n>\` finding token` };
  }
  return { ok: true };
}

/** AC3(b) — the valid sample passes and the one-field-invalid twin is rejected. */
export function envelopeValidity(root) {
  const validPath = path.join(root, "envelope", "valid.json");
  const invalidPath = path.join(root, "envelope", "invalid.json");
  for (const p of [validPath, invalidPath]) {
    if (!fs.existsSync(p)) {
      return { ok: false, message: `envelopeValidity: missing sample ${showPath(p)}` };
    }
  }
  const valid = validateEnvelope(JSON.parse(fs.readFileSync(validPath, "utf8")));
  if (!valid.ok) {
    return {
      ok: false,
      message: `envelopeValidity: ${showPath(validPath)} was rejected (${valid.errors.join("; ")})`,
    };
  }
  const invalid = validateEnvelope(JSON.parse(fs.readFileSync(invalidPath, "utf8")));
  if (invalid.ok) {
    return { ok: false, message: `envelopeValidity: ${showPath(invalidPath)} was accepted, expected rejection` };
  }
  return { ok: true };
}

/** The closed Result grammar (D-55-6). */
export const RESULT_GRAMMAR = /^exact \d+\/\d+ · invented (?:none|\d+) · shape (?:ok|[a-z][a-z0-9-]*)$/;
/** Rows dated on/after this day must match the grammar; earlier rows are grandfathered. */
export const RESULT_GRAMMAR_CUTOFF = "2026-09-18";

function runLogRow(line) {
  if (!line.startsWith("|")) return null;
  const cells = line.split("|").map((cell) => cell.trim());
  // | Date | Model | Skill(s) + version | Result | Note | -> ["", date, model, skills, result, note, ""]
  if (cells.length < 6 || !/^\d{4}-\d{2}-\d{2}$/.test(cells[1])) return null;
  return { date: cells[1], result: cells[4] };
}

/** The cutoff verdict for one (date, Result) pair. */
export function resultVerdict(date, result) {
  if (date < RESULT_GRAMMAR_CUTOFF) return "grandfathered";
  return RESULT_GRAMMAR.test(result) ? "ok" : "violation";
}

/** AC3(c) — every post-cutoff row in the doc matches the grammar; older rows are skipped. */
export function runLogGrammar(docPath) {
  const rows = fs
    .readFileSync(docPath, "utf8")
    .split("\n")
    .map(runLogRow)
    .filter(Boolean);
  if (rows.length === 0) {
    return { ok: false, message: `runLogGrammar: ${showPath(docPath)} carries no run-log rows` };
  }
  for (const row of rows) {
    if (resultVerdict(row.date, row.result) === "violation") {
      return {
        ok: false,
        message:
          `runLogGrammar: ${showPath(docPath)} row dated ${row.date} has Result "${row.result}", `
          + "which violates `exact <n>/<n> · invented none|<k> · shape ok|<fail-code>`",
      };
    }
  }
  return { ok: true, rows: rows.length, checked: rows.filter((row) => row.date >= RESULT_GRAMMAR_CUTOFF).length };
}

/**
 * AC3(c) — the committed log parses and every post-cutoff row obeys the closed
 * grammar. The check is a statement about the rows present, never about how many
 * post-cutoff rows the append-only log happens to hold (F1).
 */
export function committedLogCheck(docPath) {
  const result = runLogGrammar(docPath);
  if (!result.ok) return result;
  if (result.rows < 43) {
    return { ok: false, message: `committedLogCheck: ${showPath(docPath)} carries only ${result.rows} rows (expected at least 43)` };
  }
  return result;
}

const FIXTURE_TOKEN = /scripts\/fixtures\/golden-fixture\/[A-Za-z0-9._\-/]*/g;

/** AC3(d), AC7 — the doc's fixture paths exist and the guide + workflow index point at the doc. */
export function crossReferences(root, docPath = DOC) {
  if (!fs.existsSync(docPath)) {
    return { ok: false, message: `crossReferences: ${showPath(docPath)} does not exist` };
  }
  const text = fs.readFileSync(docPath, "utf8");
  if (!text.includes("scripts/fixtures/golden-fixture/")) {
    return { ok: false, message: `crossReferences: ${showPath(docPath)} names no \`scripts/fixtures/golden-fixture/\` pointer` };
  }
  const missing = new Set();
  for (const token of text.match(FIXTURE_TOKEN) ?? []) {
    const clean = token.replace(/[.,;:]+$/, "");
    if (clean && !fs.existsSync(path.join(REPO, clean))) missing.add(clean);
  }
  if (missing.size > 0) {
    return {
      ok: false,
      message: `crossReferences: ${showPath(docPath)} names missing fixture path(s): ${[...missing].join(", ")}`,
    };
  }
  for (const [file, label] of [[GUIDE, "CLAUDE.md"], [INDEX, "docs/workflow/README.md"]]) {
    const line = fs
      .readFileSync(file, "utf8")
      .split("\n")
      .find((candidate) => candidate.includes("GOLDEN_FIXTURE.md"));
    if (!line) {
      return { ok: false, message: `crossReferences: ${label} carries no pointer to docs/workflow/GOLDEN_FIXTURE.md` };
    }
  }
  return { ok: true };
}

/** AC3(e), AC6 — the audit-target T1–T4 facts hold in the committed tree. */
export function auditTargetTraps(root) {
  const target = path.join(root, "audit-target");
  const worklist = path.join(target, "docs", "fix", "README.md");
  if (!fs.existsSync(worklist)) {
    return { ok: false, message: `auditTargetTraps: missing worklist ${showPath(worklist)}` };
  }
  const worklistRow = fs
    .readFileSync(worklist, "utf8")
    .split("\n")
    .find((line) => line.includes("stale-cache"));
  if (!worklistRow || !/\bin-progress\b/.test(worklistRow)) {
    return {
      ok: false,
      message: `auditTargetTraps: ${showPath(worklist)} does not show row \`9 — stale-cache\` as \`in-progress\``,
    };
  }
  const adrDir = path.join(target, "docs", "adr");
  const records = fs.existsSync(adrDir)
    ? fs.readdirSync(adrDir).filter((name) => /^\d{4}-.*\.md$/.test(name)).sort()
    : [];
  const terminal = records[records.length - 1];
  if (terminal !== "0047-transport.md") {
    return {
      ok: false,
      message: `auditTargetTraps: ${showPath(adrDir)} ends at ${terminal ?? "(no numbered record)"}, expected 0047-transport.md`,
    };
  }
  const auditsDir = path.join(target, "docs", "audits");
  const audits = fs.existsSync(auditsDir)
    ? fs.readdirSync(auditsDir).filter((name) => /^3-.*\.md$/.test(name)).sort()
    : [];
  if (audits.length === 0) {
    return { ok: false, message: `auditTargetTraps: ${showPath(auditsDir)} carries no prior audit 3-*.md` };
  }
  const prior = path.join(auditsDir, audits[0]);
  if (!/\bF2\b/.test(fs.readFileSync(prior, "utf8"))) {
    return { ok: false, message: `auditTargetTraps: ${showPath(prior)} mentions no finding F2` };
  }
  return { ok: true };
}

// --- the committed corpus ----------------------------------------------------

const CLEAN_SNAPSHOT = fs.readFileSync(SNAPSHOT, "utf8");

test("AC1: the clean toy plan lints PASS and matches the committed snapshot byte-for-byte", () => {
  const result = phaseLintPass(FIXTURE_DIR);
  assert.equal(result.ok, true, result.message);
});

test("AC2: the non-atomic toy plan lints BLOCKED with a box-<n> finding token", () => {
  const result = phaseLintBlocked(FIXTURE_DIR);
  assert.equal(result.ok, true, result.message);
});

test("AC3(b): the envelope samples validate in both directions through scripts/schema-runtime.mjs", () => {
  const result = envelopeValidity(FIXTURE_DIR);
  assert.equal(result.ok, true, result.message);
});

test("AC3(c): the committed run log parses and every post-cutoff row obeys the closed grammar", () => {
  const result = committedLogCheck(DOC);
  assert.equal(result.ok, true, result.message);
});

test("AC3(c): a valid post-cutoff row appended to a log copy keeps the committed-log check green (F1)", () => {
  const result = withTempDir((dir) => {
    const docPath = path.join(dir, "GOLDEN_FIXTURE.md");
    fs.writeFileSync(
      docPath,
      `${fs.readFileSync(DOC, "utf8")}\n| 2026-09-18 | synthetic | \`test\` | exact 12/12 · invented none · shape ok | a valid post-cutoff row must not break the check |\n`,
    );
    return committedLogCheck(docPath);
  });
  assert.equal(result.ok, true, result.message);
  assert.equal(result.checked, 1, "the appended post-cutoff row must be checked, not skipped");
});

test("AC3(c): the cutoff accepts a well-formed row and rejects a malformed one", () => {
  assert.equal(resultVerdict(RESULT_GRAMMAR_CUTOFF, "exact 12/12 · invented none · shape ok"), "ok");
  assert.equal(resultVerdict(RESULT_GRAMMAR_CUTOFF, "exact 12/12 · invented 2 · shape lint-blocked"), "ok");
  assert.equal(resultVerdict(RESULT_GRAMMAR_CUTOFF, "PASS"), "violation");
  assert.equal(resultVerdict(RESULT_GRAMMAR_CUTOFF, "exact 12/12 · invented none"), "violation");
  assert.equal(resultVerdict("2026-09-17", "PASS"), "grandfathered");
});

test("AC3(c): a synthetic post-cutoff row with a malformed Result is rejected by the check", () => {
  const result = withTempDir((dir) => {
    const docPath = path.join(dir, "GOLDEN_FIXTURE.md");
    fs.writeFileSync(
      docPath,
      `${fs.readFileSync(DOC, "utf8")}\n| 2026-09-18 | synthetic | \`test\` | PASS | synthetic post-cutoff row |\n`,
    );
    return runLogGrammar(docPath);
  });
  assert.equal(result.ok, false, "a malformed post-cutoff Result must fail the grammar check");
  assert.match(result.message, /2026-09-18/, "the failure must name the offending row's date");
  assert.match(result.message, /Result "PASS"/, "the failure must name the offending Result cell");
});

test("AC3(d)/AC7: the doc's fixture pointer resolves, its fixture paths exist, and the guide + index point at it", () => {
  const result = crossReferences(FIXTURE_DIR, DOC);
  assert.equal(result.ok, true, result.message);
});

test("AC3(e)/AC6: the audit-target trap invariants hold in the committed tree", () => {
  const result = auditTargetTraps(FIXTURE_DIR);
  assert.equal(result.ok, true, result.message);
});

test("AC4: a one-byte mutation in a temp copy is detected, names the mutated fixture path, and leaves committed bytes untouched", () => {
  const result = withTempDir((dir) => {
    const copy = path.join(dir, "golden-fixture");
    copyTree(FIXTURE_DIR, copy);
    const mutated = path.join(copy, "expected", "phase-lint-toy-plan.txt");
    fs.writeFileSync(mutated, fs.readFileSync(mutated, "utf8").replace("verdict PASS", "verdict PAXX"));
    return phaseLintPass(copy);
  });
  assert.equal(result.ok, false, "the tampered copy must fail phaseLintPass");
  assert.match(
    result.message,
    /expected[\\/]phase-lint-toy-plan\.txt/,
    "the failure must name the mutated fixture path",
  );
  assert.match(result.message, /byte-identical to the committed snapshot/, "the failure must name the violated assertion");
  assert.equal(
    fs.readFileSync(SNAPSHOT, "utf8"),
    CLEAN_SNAPSHOT,
    "the committed snapshot must be byte-identical after the tamper run",
  );
});
