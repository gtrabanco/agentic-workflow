#!/usr/bin/env node
// test-obligation: protects=AGENTS.md,docs/workflow/GATE_INVENTORY.md obligations=contract,failure-path,convention

/**
 * inviolable-rules.test.mjs — the guide's laws have a shape and a carrier.
 *
 * `AGENTS.md`'s `## Inviolable rules` section lists the laws no session may
 * violate (issue #645 S1/S5). This suite is the gate's frozen-failure corpus:
 * every refusal below plants exactly one defect in a throwaway tree, and the
 * same code path runs on the live repository, so the tree either carries a
 * resolvable laws table or the root suite says which row does not.
 *
 * The refusals:
 *
 *   missing-block     no `inviolable-rules@1` block in the guide
 *   second-home       the block copied into another document
 *   row-shape         a row without the four declared cells, or a malformed id
 *   duplicate-id      one rule id twice
 *   owner-unresolved  the owner cell's path, heading or versioned block is absent
 *   state-shape       a state cell outside the three declared forms
 *   state-unresolved  a `materialized:` gate id absent from the gate inventory,
 *                     or a `materialized:` path that does not exist
 *   reason-missing    a `soft-by-design:` row with no reason recorded
 *
 * `bun test scripts/inviolable-rules.test.mjs` (bun-first) and
 * `node --test scripts/inviolable-rules.test.mjs` (the guaranteed fallback) run
 * the identical suite. Nothing here writes outside `os.tmpdir()`.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE = path.join(repoRoot, "scripts", "inviolable-rules.mjs");
const MARKER = "inviolable-rules@1";

/** The ids the guide must carry: issue #645 S2's seed list, split where one
 *  seed has two carriers (D4) and completed with the law that had no home (D2). */
const SEED_IDS = [
  "IR1-vocabulary-residency",
  "IR2-force-push-ban",
  "IR3-test-immutability",
  "IR4-red-first",
  "IR5-human-revision-hold",
  "IR6-no-backward-compat",
  "IR7-domain-separation",
  "IR8-worktree-namespace",
  "IR9-english-only",
  "IR10-no-assumption",
  "IR11-one-owner-per-rule",
  "IR12-stderr-only",
  "IR13-no-secrets",
  "IR14-tool-choice",
];

// ---------------------------------------------------------------------------
// A tiny tree every rule accepts, so each case below plants exactly one defect
// ---------------------------------------------------------------------------

const INVENTORY = [
  "# Gate inventory",
  "",
  "```text",
  "prose-gate-inventory@1",
  "# gate-suites: scripts/*.test.mjs",
  "gate-id | statement | carrier | file | section | token | surfaces | safety | recurrence | checkability | tier | stay-reason | rederive",
  "worktree-audit | the namespace guard | script | scripts/worktree-guard.test.mjs | - | ADMIN_NAMESPACE | - | 2 | 2 | 3 | script | - | -",
  "docs-language | no committed translation | script | scripts/doc-discipline.test.mjs | - | no committed .es.md sibling survives the head | - | 2 | 3 | 3 | script | - | -",
  "```",
  "",
].join("\n");

const ROW = (overrides = {}) => {
  const row = {
    rule: "IR1-vocabulary-residency",
    statement: "a closed vocabulary has one owner and a consumer imports it",
    owner: "docs/architecture/ARCHITECTURAL_INVARIANTS.md#block:vocabulary-residency@1",
    state: "materialized: docs-language",
    ...overrides,
  };
  return `${row.rule} | ${row.statement} | ${row.owner} | ${row.state}`;
};

const guide = (rows) => [
  "# AGENTS.md",
  "",
  "## Inviolable rules",
  "",
  "The laws no session may violate.",
  "",
  "```text",
  MARKER,
  "rule | statement | owner | state",
  ...rows,
  "```",
  "",
  "## Working rules",
  "",
  "- a rule.",
  "",
].join("\n");

/** A complete, compliant tree: the green baseline the refusals are measured against. */
function compliantTree(name) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `inviolable-${name}-`));
  const write = (rel, text) => {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, text);
  };
  write("AGENTS.md", guide([ROW()]));
  write("docs/workflow/GATE_INVENTORY.md", INVENTORY);
  write(
    "docs/architecture/ARCHITECTURAL_INVARIANTS.md",
    ["# Architectural invariants", "", "## AI-001 — one owner", "", "```text", "vocabulary-residency@1", "owner | the schema package", "```", ""].join("\n"),
  );
  write("skills/x/SKILL.md", "# x\n\nThe tool choice is re-decided every turn.\n");
  return { root, write };
}

const trees = [];
const tree = (name) => {
  const built = compliantTree(name);
  trees.push(built.root);
  return built;
};

process.on("exit", () => {
  for (const root of trees) fs.rmSync(root, { recursive: true, force: true });
});

const run = (root) =>
  spawnSync(process.execPath, [GATE, "--root", root], { encoding: "utf8" });

const reasons = (result) =>
  `${result.stdout}\n${result.stderr}`
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("FAIL inviolable rules:"))
    .map((line) => line.slice("FAIL inviolable rules:".length).trim().split(":")[0].split(" ")[0].trim());

// ---------------------------------------------------------------------------
// 1. The green baseline and the envelope
// ---------------------------------------------------------------------------

test("a compliant tree passes with the fixed envelope", () => {
  const { root } = tree("green");
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^PASS inviolable rules: 1 rows · 1 home$/m);
});

test("the live tree carries every seed law and resolves them all", () => {
  const result = spawnSync(process.execPath, [GATE], { encoding: "utf8", cwd: repoRoot });
  assert.equal(result.status, 0, result.stderr);
  const printed = /^PASS inviolable rules: (\d+) rows · (\d+) home$/m.exec(result.stdout);
  assert.ok(printed, `the gate prints its envelope: ${result.stdout}`);
  assert.equal(Number(printed[2]), 1, "the block has one home in the tree");
  const guideText = fs.readFileSync(path.join(repoRoot, "AGENTS.md"), "utf8");
  const present = guideText.split("\n").filter((line) => /^IR\d+-[a-z0-9-]+ \|/.test(line));
  assert.equal(present.length, Number(printed[1]), "every printed row is a table row of the guide");
  for (const id of SEED_IDS) {
    assert.ok(guideText.includes(`${id} |`), `the guide's laws table carries ${id} (S2/S7 seed)`);
  }
});

// ---------------------------------------------------------------------------
// 2. The block: missing, or in a second home
// ---------------------------------------------------------------------------

test("a tree with no block is refused by name", () => {
  const { root, write } = tree("missing");
  write("AGENTS.md", "# AGENTS.md\n\n## Working rules\n\n- a rule.\n");
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: missing-block/m);
});

test("the block copied into another document is a second home, refused by path", () => {
  const { root, write } = tree("second-home");
  write("docs/copy.md", guide([ROW()]));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: second-home: docs\/copy\.md$/m);
});

// ---------------------------------------------------------------------------
// 3. The row shape and its ids
// ---------------------------------------------------------------------------

test("a row without the four declared cells is refused as row-shape", () => {
  const { root, write } = tree("shape");
  write("AGENTS.md", guide(["IR1-vocabulary-residency | a statement | docs/workflow/GATE_INVENTORY.md"]));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: row-shape/m);
});

test("a malformed rule id is refused as row-shape", () => {
  const { root, write } = tree("bad-id");
  write("AGENTS.md", guide([ROW({ rule: "ir1" })]));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: row-shape/m);
});

test("one rule id stated twice is refused as duplicate-id", () => {
  const { root, write } = tree("duplicate");
  write("AGENTS.md", guide([ROW(), ROW()]));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: duplicate-id: IR1-vocabulary-residency$/m);
});

// ---------------------------------------------------------------------------
// 4. The owner pointer resolves to a real surface
// ---------------------------------------------------------------------------

test("an owner path that does not exist is refused as owner-unresolved", () => {
  const { root, write } = tree("owner-path");
  write("AGENTS.md", guide([ROW({ owner: "docs/nowhere.md" })]));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: owner-unresolved/m);
});

test("an owner heading that the file does not carry is refused as owner-unresolved", () => {
  const { root, write } = tree("owner-heading");
  write("skills/x/SKILL.md", "# x\n\n## Another section\n\ntext\n");
  write("AGENTS.md", guide([ROW({ owner: "skills/x/SKILL.md#The section that is absent" })]));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: owner-unresolved/m);
});

test("an owner versioned block the file does not carry is refused as owner-unresolved", () => {
  const { root, write } = tree("owner-block");
  write("AGENTS.md", guide([ROW({ owner: "docs/architecture/ARCHITECTURAL_INVARIANTS.md#block:another-block@1" })]));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: owner-unresolved/m);
});

// ---------------------------------------------------------------------------
// 5. The state cell: three forms, each resolving
// ---------------------------------------------------------------------------

test("a materialized gate id the inventory does not carry is refused as state-unresolved", () => {
  const { root, write } = tree("gate-missing");
  write("AGENTS.md", guide([ROW({ state: "materialized: no-such-gate" })]));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: state-unresolved: IR1-vocabulary-residency$/m);
});

test("a materialized path that does not exist is refused as state-unresolved", () => {
  const { root, write } = tree("path-missing");
  write("AGENTS.md", guide([ROW({ state: "materialized: packages/x/test/gone.test.mjs" })]));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: state-unresolved: IR1-vocabulary-residency$/m);
});

test("a materialized path that exists resolves, so the path form is legal", () => {
  const { root } = tree("path-ok");
  const target = "packages/x/test/gone.test.mjs";
  fs.mkdirSync(path.join(root, path.dirname(target)), { recursive: true });
  fs.writeFileSync(path.join(root, target), "// a suite\n");
  fs.writeFileSync(
    path.join(root, "AGENTS.md"),
    guide([ROW({ state: `materialized: ${target}` })]),
  );
  const result = run(root);
  assert.equal(result.status, 0, result.stderr);
});

test("a soft-by-design row with no reason is refused as reason-missing", () => {
  const { root, write } = tree("reason");
  write("AGENTS.md", guide([ROW({ state: "soft-by-design: -" })]));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: reason-missing/m);
});

test("a state outside the three declared forms is refused as state-shape", () => {
  const { root, write } = tree("state-shape");
  write("AGENTS.md", guide([ROW({ state: "maybe-later" })]));
  const result = run(root);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: state-shape/m);
});

test("a materializable row must name an issue number", () => {
  const { root, write } = tree("materializable");
  write("AGENTS.md", guide([ROW({ state: "materializable: 644" })]));
  const bad = run(root);
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /^FAIL inviolable rules: state-shape/m);
  write("AGENTS.md", guide([ROW({ state: "materializable: #644" })]));
  const good = run(root);
  assert.equal(good.status, 0, good.stderr);
});

// ---------------------------------------------------------------------------
// 6. The gate itself is a script, not a fixture-only shape
// ---------------------------------------------------------------------------

test("the gate refuses a tree it cannot read instead of passing silently", () => {
  const missing = path.join(os.tmpdir(), `inviolable-absent-${process.pid}`);
  const result = run(missing);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /^FAIL inviolable rules: missing-block/m);
});

test("a usage error exits 2 without a verdict block", () => {
  const result = spawnSync(process.execPath, [GATE, "--root"], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(`${result.stdout}\n${result.stderr}`, /usage: inviolable-rules/);
  assert.ok(!/^(PASS|FAIL) inviolable rules:/m.test(result.stdout), "a usage error prints no verdict");
});
