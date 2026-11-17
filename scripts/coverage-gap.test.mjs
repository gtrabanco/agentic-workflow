#!/usr/bin/env node
/**
 * coverage-gap.test.mjs — the join's sibling suite (issue #590 S2/S6/S7/S8, S5).
 *
 * Pins the deterministic half of the coverage-gap dimension:
 *
 *   1. the receipt's contract id and its closed gap-kind set
 *   2. the criterion edge — the four resolvers (gate id, review pass, existing
 *      path, declared command) and the unresolved token, which is a gap naming
 *      what it tried
 *   3. the absent inputs — a project without a catalogue, without an inventory
 *      or without a corpus still gets a receipt that names the absence
 *   4. the refusal — an unparsable ledger and a malformed inventory are fatal,
 *      never a silently dropped row
 *   5. the corpus edge — an admitted class whose axis no detector names is one
 *      gap, a covered axis is none, and an annotated (unadmitted) row never
 *      reaches the receipt
 *   6. the seeded fixture — one gap per class on `seeded/`, zero on `clean/`
 *   7. determinism — the same tree renders the same bytes
 *   8. the prose the dimension ships — the row, the pass-only-if section, the
 *      three routes, the evolution-regression rule, the emission-only rule and
 *      the two registrations that keep the block grammar resolvable
 *
 * Run: `bun test scripts/coverage-gap.test.mjs`
 * (fallback `node --test scripts/coverage-gap.test.mjs`).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  CATALOGUE_REL,
  COMMAND_HEADS,
  COVERAGE_GAP_CONTRACT,
  GAP_KINDS,
  buildCoverageGap,
  evaluateCoverage,
  parseCatalogue,
  readDetectors,
  renderReceipt,
} from "./coverage-gap.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");
const fixtureScript = path.join(repoRoot, "scripts", "product-audit-gap-fixture.mjs");
const cli = path.join(repoRoot, "scripts", "coverage-gap.mjs");

const scratch = () => fs.mkdtempSync(path.join(os.tmpdir(), "coverage-gap-"));
const run = (argv, options = {}) => spawnSync(process.execPath, argv, { encoding: "utf8", ...options });
const runCli = (dir, extra = []) => run([cli, "--repo", dir, ...extra]);

const CATALOGUE = `# Verification criteria catalogue

## Criteria

| Criterion | Applies to (surface type) | Provenance | Source / authority | Notes |
|---|---|---|---|---|
| Suite green before every commit | code | workflow-generic | agent guide §Commands | \`bun test\` |
| Docs page per feature | docs | project-declared | decision D1 | \`scripts/does-not-exist.mjs\` |
| Boundary enforced by a machine | architecture | project-declared | charter answer | \`demo-gate\` |
`;

const INVENTORY = `# Gate inventory

\`\`\`text
prose-gate-inventory@1
gate-id | statement | carrier | file | section | token | surfaces | safety | recurrence | checkability | tier | stay-reason | rederive
demo-gate | the demo gate's own check | script | scripts/demo.test.mjs | - | demo token | - | 2 | 3 | 3 | script | - | -
idle-gate | a declared gate no criterion names | script | scripts/idle.test.mjs | - | idle token | - | 2 | 3 | 3 | script | - | -
\`\`\`
`;

const makeTree = (files) => {
  const dir = scratch();
  for (const [rel, content] of Object.entries(files)) {
    const absolute = path.join(dir, rel);
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, content);
  }
  return dir;
};

// ── 1. the contract ─────────────────────────────────────────────────────────

test("the receipt image publishes its contract id and its closed gap-kind set", () => {
  assert.equal(COVERAGE_GAP_CONTRACT, "coverage-gap@1");
  assert.deepEqual([...GAP_KINDS], ["criterion-uncovered", "class-uncovered", "detector-idle"]);
  assert.ok(COMMAND_HEADS.includes("bun"), "a declared command head is the package runtime's own");
});

// ── 2. the catalogue reader and the criterion edge ──────────────────────────

test("the catalogue reader keeps the row's cells, its line and its declared tokens", () => {
  const parsed = parseCatalogue(CATALOGUE);
  assert.equal(parsed.criteria.length, 3, "three criteria rows, the header and the separator excluded");
  assert.deepEqual(parsed.criteria.map((row) => row.name), [
    "Suite green before every commit",
    "Docs page per feature",
    "Boundary enforced by a machine",
  ]);
  assert.equal(parsed.criteria[0].provenance, "workflow-generic");
  assert.deepEqual(parsed.criteria[2].tokens, ["demo-gate"]);
  assert.ok(parsed.criteria[0].line > 1, "the row keeps its source line for the gap evidence");
});

test("a criterion is covered only when one of the four resolvers answers", () => {
  const dir = makeTree({ "scripts/probe.mjs": "export const probe = 1;\n" });
  try {
    const detectors = {
      gates: [{ id: "demo-gate" }],
      passes: [{ name: "review-code", axis: "code" }],
      source: { gates: "fixture", passes: "fixture", narrowed: false },
    };
    const catalogue = parseCatalogue(
      [
        "| Criterion | Applies to (surface type) | Provenance | Source / authority | Notes |",
        "|---|---|---|---|---|",
        "| by gate | code | workflow-generic | charter | `demo-gate` |",
        "| by pass | code | workflow-generic | charter | `review-code` |",
        "| by pass axis | code | workflow-generic | charter | `code` |",
        "| by path | code | workflow-generic | charter | `scripts/probe.mjs` |",
        "| by command | code | workflow-generic | charter | `bun test` |",
        "| by nothing | code | workflow-generic | charter | `scripts/absent.mjs` |",
        "| by no token | code | workflow-generic | charter | the declared gate |",
        "| by bad provenance | code | guessed | charter | `demo-gate` |",
      ].join("\n"),
    );
    const result = evaluateCoverage({ catalogue, detectors, corpus: { present: false }, root: dir });
    assert.deepEqual(
      result.rows.filter((row) => row.kind === "criterion-uncovered").map((row) => row.subject),
      ["by bad provenance", "by no token", "by nothing"],
      "the receipt sorts gaps by kind then subject, so the order is stable across runs",
    );
    const bySubject = Object.fromEntries(result.rows.map((row) => [row.subject, row.detail]));
    assert.match(bySubject["by nothing"], /scripts\/absent\.mjs/, "the refused token is named");
    assert.match(bySubject["by no token"], /none/, "a criterion with no backticked token says so");
    assert.match(bySubject["by bad provenance"], /provenance/, "a provenance outside the closed set is refused");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── 3. absent inputs ────────────────────────────────────────────────────────

test("a project with no catalogue names it and marks the catalogue edges n/a", () => {
  const dir = makeTree({ "AGENTS.md": "# guide\n" });
  try {
    const result = buildCoverageGap(dir);
    const text = renderReceipt(result);
    assert.match(text, new RegExp(`^${COVERAGE_GAP_CONTRACT}$`, "m"));
    assert.match(text, new RegExp(`^catalogue \\| absent · ${CATALOGUE_REL}$`, "m"));
    assert.match(text, /^edge \| criterion→detector · n\/a — catalogue absent$/m);
    assert.match(text, /^edge \| detector→criterion · n\/a — catalogue absent$/m);
    assert.match(text, /^verdict \| insufficient-input$/m, "no input at all is never a clean verdict");
    assert.equal(runCli(dir).status, 1, "an empty project is the required failure state, not a vacuous pass");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a project with no corpus names it and marks the corpus edge n/a", () => {
  const dir = makeTree({ [CATALOGUE_REL]: CATALOGUE, "docs/workflow/GATE_INVENTORY.md": INVENTORY });
  try {
    const result = buildCoverageGap(dir);
    const text = renderReceipt(result);
    assert.match(text, /^corpus \| absent · no unit ledger was read$/m);
    assert.match(text, /^edge \| class→detector · n\/a — corpus absent$/m);
    assert.doesNotMatch(text, /class-uncovered/);
    assert.deepEqual(
      result.rows.filter((row) => row.kind === "detector-idle").map((row) => row.subject),
      ["idle-gate"],
      "demo-gate is named by a criterion, idle-gate is not",
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// The 2026-11-17 EXTERNAL VERIFY reproducers (external-verify.md B1/B2): the two
// frozen failures this correction batch exists to repair. They land before the
// fix and are observed failing first (path-protection record: decisions.md P8).

test("a project with no gate inventory gets exactly one detectors input line that names the absence (B1)", () => {
  const dir = makeTree({ [CATALOGUE_REL]: CATALOGUE });
  try {
    const text = renderReceipt(buildCoverageGap(dir));
    const detectorLines = text.split("\n").filter((line) => line.startsWith("detectors |"));
    assert.equal(detectorLines.length, 1, `O2 orders one detectors line, got:\n${detectorLines.join("\n")}`);
    assert.match(
      detectorLines[0],
      /^detectors \| absent · docs\/workflow\/GATE_INVENTORY\.md( |$)/,
      "the absent carrier is named with its path, never counted as a measured zero",
    );
    assert.ok(!text.includes("gates 0"), "an unread inventory reports absent, not gates 0");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("the producer spelling the reference prints runs: a positional directory is --repo (B2)", () => {
  const dir = makeTree({ [CATALOGUE_REL]: CATALOGUE, "docs/workflow/GATE_INVENTORY.md": INVENTORY });
  try {
    const flagged = run([cli, "--repo", dir]);
    const positional = run([cli, dir]);
    assert.equal(flagged.status, 0, flagged.stderr);
    assert.equal(positional.status, 0, `the reference's own command must run: ${positional.stderr}`);
    assert.equal(positional.stdout, flagged.stdout, "one receipt, whichever spelling the reader uses");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── 4. the refusals ─────────────────────────────────────────────────────────

test("an unparsable ledger is a fatal exit naming the file and line", () => {
  const dir = makeTree({
    [CATALOGUE_REL]: CATALOGUE,
    "docs/features/001-broken/review-findings.md": "# Findings\n\n| id | file:line | axis | severity | class | route | folded |\n|---|---|---|---|---|---|---|\n| F1 | bad shape |\n",
  });
  try {
    const result = runCli(dir);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /findings-corpus|unparsable/i);
    assert.match(result.stderr, /001-broken\/review-findings\.md:1/, "the offending carrier and line are named");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("a malformed gate inventory is refused, never read optimistically", () => {
  const dir = makeTree({
    [CATALOGUE_REL]: CATALOGUE,
    "docs/workflow/GATE_INVENTORY.md": "```text\nprose-gate-inventory@1\ngate-id | statement | carrier | file | section | token | surfaces | safety | recurrence | checkability | tier | stay-reason | rederive\nshort | row\n```\n",
  });
  try {
    const result = runCli(dir);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /row-shape|inventory/i);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── 5. the corpus edge and the profile narrowing ────────────────────────────

test("an admitted class whose axis no detector names is one gap; a named axis is none", () => {
  const detectors = { gates: [], passes: [{ name: "review-code", axis: "code" }], source: { gates: "fixture", passes: "fixture", narrowed: false } };
  const catalogue = parseCatalogue(CATALOGUE);
  const result = evaluateCoverage({
    catalogue,
    detectors,
    corpus: { present: true, admitted: 4, classes: [{ axis: "code", klass: "fix-now", n: 9 }, { axis: "workflow", klass: "fix-now", n: 4 }] },
    root: repoRoot,
  });
  assert.deepEqual(
    result.rows.filter((row) => row.kind === "class-uncovered").map((row) => `${row.subject} · n ${row.detail.match(/n (\d+)/)[1]}`),
    ["workflow × fix-now · n 4"],
    "code is named by review-code; workflow is named by no detector",
  );
});

test("a ceremony profile narrows the pass set, so an undiscarded pass no longer covers an axis", () => {
  const dir = makeTree({
    "AGENTS.md": "# guide\n\n## Project charter\n\n```text\nceremony-profile@1\ndocs-step: paid\ncaptures: discarded\nreview-passes: none\npublish-gate: paid\ntest-policy: paid\n```\n",
  });
  try {
    const detectors = readDetectors(dir);
    assert.equal(detectors.passes.length, 0, "`none` discards every review surface");
    assert.equal(detectors.source.narrowed, true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── 6. the seeded fixture ───────────────────────────────────────────────────

test("the seeded twin yields exactly one gap per class and the clean twin yields none", () => {
  const dir = scratch();
  try {
    const written = run([fixtureScript, dir]);
    assert.equal(written.status, 0, written.stderr);

    const seeded = runCli(path.join(dir, "seeded"));
    assert.equal(seeded.status, 0, seeded.stderr);
    const seededGaps = seeded.stdout.split("\n").filter((line) => line.startsWith("gap — "));
    assert.equal(seededGaps.length, 3, `one gap per class, got:\n${seededGaps.join("\n")}`);
    for (const kind of GAP_KINDS) {
      assert.equal(seededGaps.filter((line) => line.startsWith(`gap — ${kind} ·`)).length, 1, `exactly one ${kind}`);
    }
    assert.match(seeded.stdout, /^verdict \| gaps 3$/m);

    const clean = runCli(path.join(dir, "clean"));
    assert.equal(clean.status, 0, clean.stderr);
    assert.equal(clean.stdout.split("\n").filter((line) => line.startsWith("gap — ")).length, 0, clean.stdout);
    assert.match(clean.stdout, /^verdict \| clean$/m);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── 7. determinism ──────────────────────────────────────────────────────────

test("the same tree renders the same receipt bytes twice", () => {
  const dir = makeTree({ [CATALOGUE_REL]: CATALOGUE, "docs/workflow/GATE_INVENTORY.md": INVENTORY });
  try {
    const first = runCli(dir);
    const second = runCli(dir);
    assert.equal(first.status, 0);
    assert.equal(first.stdout, second.stdout);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ── 8. the prose the dimension ships ────────────────────────────────────────

const dimensions = () => read("skills/product-audit/references/AUDIT_DIMENSIONS.md");
const auditProcess = () => read("skills/product-audit/references/AUDIT_PROCESS.md");
const guide = () => read("AGENTS.md");
const inventory = () => read("docs/workflow/GATE_INVENTORY.md");

test("product-audit carries the dimension row with its producer pre-pass (S3/S8)", () => {
  assert.match(dimensions(), /^\| \*\*Coverage gaps\*\* \|/m);
  assert.match(dimensions(), /`bun scripts\/coverage-gap\.mjs <repo>`/);
  assert.match(dimensions(), /coverage-gap@1/);
});

test("the pass-only-if contract states the evidenced-surface rule and the clean twin (S3/S7)", () => {
  const text = dimensions();
  assert.match(text, /## Coverage-gap sweep \(pass-only-if\)/);
  assert.match(text, /a gap is a finding only when its surface is evidenced/i);
  assert.match(text, /scripts\/product-audit-gap-fixture\.mjs/);
  assert.match(text, /clean/i);
});

test("the three routes are the published hand-offs and no bespoke route exists (S3/S8)", () => {
  const text = dimensions();
  assert.match(text, /finding-route@1/);
  assert.match(text, /agentic-workflow skills discover/, "an external skill routes to the discovery route");
  assert.match(text, /unit-lane/, "an own gate is a proposal, never auto-built");
  assert.match(text, /init-workspace upgrade route|references\/UPGRADE\.md/, "an obsolete criterion re-triages the catalogue");
});

test("AUDIT_PROCESS consumes the receipt as a step, never re-derived by inspection (S3)", () => {
  assert.match(auditProcess(), /coverage-gap@1/);
  assert.match(auditProcess(), /coverage-gap\.mjs/);
});

test("the evolution-regression rule names its gate and its source (S4)", () => {
  const text = dimensions();
  assert.match(text, /dimension-regression\.mjs/);
  assert.match(text, /2605\.09315/);
  assert.match(text, /previously present dimensions still pass/i);
});

test("the emission-only principle is stated once with both sources (S5)", () => {
  const text = dimensions();
  assert.match(text, /emission-only/i);
  assert.match(text, /2310\.01798/);
  assert.match(text, /2605\.09315/);
  assert.match(text, /never self-edits/i, "the constraint is stated as a prohibition, never a mechanism");
});

test("the block grammar is registered in the guide and claimed by the inventory (S6)", () => {
  assert.match(guide(), /^coverage-gap-grammar \| skills\/product-audit\/references\/AUDIT_DIMENSIONS\.md \| block:coverage-gap@1 \| n\/a \| no$/m);
  assert.match(dimensions(), /```text\ncoverage-gap@1\n/);
  const grammarRow = inventory().split("\n").find((line) => line.startsWith("normative-surface-grammar |"));
  assert.ok(grammarRow, "the inventory claims the grammar family");
  assert.match(grammarRow, /coverage-gap-grammar/);
});
