#!/usr/bin/env node
// test-obligation: protects=scripts/dimension-regression.mjs obligations=contract,failure-path

/**
 * dimension-regression.test.mjs — the evolution-regression gate's sibling suite
 * (issue #590 S4/S9).
 *
 * The rule: a unit that adds or changes a review dimension, a review skill or an
 * audit producer re-verifies that the dimensions present before it still pass.
 * Unconstrained self-evolution measurably degrades previously acquired
 * capabilities (arXiv 2605.09315), so the workflow-side analogue of the residue
 * sweeps' features-preserved-without-it check gets teeth:
 *
 *   1. a range that adds a dimension and records the re-verification run is clean
 *   2. the same range with no recorded run is refused
 *   3. a range that drops a prior dimension is refused unless a `D` line names it
 *   4. a range that touches no review surface is `not-applicable`, never a pass
 *   5. the live tree carries the frozen dimension set (adding one cannot drop one)
 *   6. the CLI reads a real push range: refused at the seeded head, clean once the
 *      evidence line is committed
 *
 * Run: `bun test scripts/dimension-regression.test.mjs`
 * (fallback `node --test scripts/dimension-regression.test.mjs`).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  DIMENSION_SURFACES,
  EVOLUTION_GUARD,
  dimensionsOf,
  evaluateEvolution,
  isDimensionSurface,
} from "./dimension-regression.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIMENSIONS_REL = "skills/product-audit/references/AUDIT_DIMENSIONS.md";
const liveDimensions = () => fs.readFileSync(path.join(repoRoot, DIMENSIONS_REL), "utf8");
const cli = path.join(repoRoot, "scripts", "dimension-regression.mjs");

/** The dimension set this repository shipped before unit 590, in table order —
 *  the frozen list the gate re-verifies. Adding a dimension means extending it
 *  here in the same change; removing one needs a recorded owner decision. */
const FROZEN = [
  "Correctness & architecture",
  "Security & cybersecurity",
  "Performance",
  "Tests",
  "UX / UI",
  "Accessibility",
  "SEO",
  "Brand / voice",
  "Tech debt",
  "Residue — duplication",
  "Residue — unused code",
  "Residue — documentation",
  "Process & docs",
  "Workflow discipline",
  "Roadmap coherence",
  "Installed tooling",
  "Coverage gaps",
  "Journal signals",
  "Retention debt",
  "Decision promotion",
];

const table = (ids) => `# Dimensions\n\n| Dimension | What it sweeps |\n|---|---|\n${ids.map((id) => `| **${id}** | sweep |`).join("\n")}\n`;
const unitDoc = (...logLines) => `# unit\n\n## Log\n\n${logLines.join("\n")}\n`;
const EVIDENCE = "- **G1** — 2026-01-01, `bun scripts/dimension-regression.mjs --base main` · exit 0 · clean";

test("the guard publishes its contract id and its closed surface set", () => {
  assert.equal(EVOLUTION_GUARD, "dimension-regression@1");
  assert.ok(DIMENSION_SURFACES.length > 0);
  assert.ok(isDimensionSurface("skills/product-audit/references/AUDIT_DIMENSIONS.md"));
  assert.ok(isDimensionSurface("skills/review-code/SKILL.md"));
  assert.ok(isDimensionSurface("scripts/findings-corpus.mjs"));
  assert.equal(isDimensionSurface("docs/LOGS.md"), false);
});

test("the reference reader keeps the dimension table's own ids", () => {
  assert.deepEqual(dimensionsOf(table(["One", "Two"])), ["One", "Two"]);
});

test("a range touching no review surface is not-applicable, never a pass", () => {
  const result = evaluateEvolution({
    baseDimensions: ["A", "B"],
    headDimensions: ["A", "B"],
    changedPaths: ["docs/LOGS.md", "README.md"],
    unitDocs: [],
  });
  assert.equal(result.verdict, "not-applicable");
  assert.deepEqual(result.findings, []);
});

test("adding a dimension with the recorded run is clean", () => {
  const result = evaluateEvolution({
    baseDimensions: ["A"],
    headDimensions: ["A", "B"],
    changedPaths: [DIMENSIONS_REL],
    unitDocs: [{ path: "docs/features/001-x/SPEC.md", text: unitDoc(EVIDENCE) }],
  });
  assert.equal(result.verdict, "clean");
  assert.deepEqual(result.findings, []);
});

test("adding a dimension without the recorded run is refused", () => {
  const result = evaluateEvolution({
    baseDimensions: ["A"],
    headDimensions: ["A", "B"],
    changedPaths: [DIMENSIONS_REL],
    unitDocs: [{ path: "docs/features/001-x/SPEC.md", text: unitDoc("- **P1** — wrote rows") }],
  });
  assert.equal(result.verdict, "refused");
  assert.deepEqual(result.findings.map((row) => row.code), ["missing-reverification-evidence"]);
  assert.match(result.findings[0].detail, /runner dimension-regression/);
});

test("dropping a prior dimension is refused unless a D line names it", () => {
  const refused = evaluateEvolution({
    baseDimensions: ["A", "B"],
    headDimensions: ["A", "C"],
    changedPaths: [DIMENSIONS_REL],
    unitDocs: [{ path: "docs/features/001-x/SPEC.md", text: unitDoc(EVIDENCE) }],
  });
  assert.equal(refused.verdict, "refused");
  assert.deepEqual(refused.findings.map((row) => row.code), ["dimension-dropped"]);
  assert.match(refused.findings[0].detail, /B/);

  const decided = evaluateEvolution({
    baseDimensions: ["A", "B"],
    headDimensions: ["A", "C"],
    changedPaths: [DIMENSIONS_REL],
    unitDocs: [
      { path: "docs/features/001-x/SPEC.md", text: unitDoc(EVIDENCE, "- **D1** — 2026-01-01, the owner retires B (merged into A)") },
    ],
  });
  assert.equal(decided.verdict, "clean");
});

test("the live tree carries the frozen set plus the coverage-gap dimension", () => {
  const live = dimensionsOf(liveDimensions());
  assert.deepEqual(live, FROZEN, "every prior dimension is present, in table order, and the new row is last");
});

// ── the CLI on a real push range ────────────────────────────────────────────

const scratch = () => fs.mkdtempSync(path.join(os.tmpdir(), "dimension-regression-"));
const git = (dir, args) =>
  spawnSync("git", ["-C", dir, "-c", "user.name=fixture", "-c", "user.email=fixture@example.test", "-c", "commit.gpgsign=false", "-c", "init.defaultBranch=main", ...args], { encoding: "utf8" });

const makeRange = () => {
  const dir = scratch();
  const write = (rel, content) => {
    const absolute = path.join(dir, rel);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content);
  };
  git(dir, ["init", "-q"]);
  write(DIMENSIONS_REL, table(["A", "B"]));
  write("docs/features/001-x/SPEC.md", unitDoc("- **P1** — cut"));
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "base"]);
  const base = git(dir, ["rev-parse", "HEAD"]).stdout.trim();

  write(DIMENSIONS_REL, table(["A", "B", "C"]));
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", "add a dimension"]);
  return { dir, base, write };
};

const runCli = (dir, extra) => spawnSync(process.execPath, [cli, "--root", dir, ...extra], { encoding: "utf8" });

test("the CLI refuses a pushed range that adds a dimension without the run", () => {
  const { dir, base } = makeRange();
  try {
    const result = runCli(dir, ["--base", base]);
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /^verdict \| refused$/m);
    assert.match(result.stdout, /finding — missing-reverification-evidence ·/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the CLI is clean once the unit records the re-verification run", () => {
  const { dir, base, write } = makeRange();
  try {
    write("docs/features/001-x/SPEC.md", unitDoc("- **P1** — cut", EVIDENCE));
    git(dir, ["add", "-A"]);
    git(dir, ["commit", "-q", "-m", "record the run"]);
    // the local gate passes both flags: a pushBase step that refused --remote
    // would redden every push
    const result = runCli(dir, ["--base", base, "--remote", "origin"]);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^verdict \| clean$/m);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the CLI without a base is not-applicable, never a pass", () => {
  const { dir } = makeRange();
  try {
    const result = runCli(dir, []);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^verdict \| not-applicable$/m);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
