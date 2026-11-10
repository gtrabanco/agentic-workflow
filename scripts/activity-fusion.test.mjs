#!/usr/bin/env node

/**
 * activity-fusion.test.mjs — pins for the tier-fused design/plan activity
 * (issue #434) and its delta provenance.
 *
 * Covers (machine half, cut first — the prose half lands with P3):
 *   - catalog.json declares the fused activity graph (one declarative key)
 *   - a `standard`-tier feature unit's triage prints the additive `Fused:`
 *     line and carries `fused` in the JSON answer, steps and tiers unchanged
 *   - a `high`-tier feature unit never fuses (no line, no key)
 *   - a unit doc with no recorded tier is byte-identical to the base behavior
 *   - a fix unit never fuses (its catalog has no design step to fuse)
 *   - a docs-only unit never fuses
 *   - a malformed declaration fails closed (exit 2, named diagnostic)
 *
 * The catalog is always mutated on a throwaway copy (`UNIT_ROUTE_CATALOG`) and
 * the fixture tree is copied into a sandbox root (`UNIT_ROUTE_REPO`); nothing
 * here touches the tracked tree.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "unit-route.mjs");
const CATALOG_PATH = path.join(REPO_ROOT, "scripts", "catalog.json");
const FIXTURE_ROOT = path.join(REPO_ROOT, "scripts", "fixtures", "catalog");

/** The sandbox: a full copy of the fixture tree, with tier docs written in. */
let sandbox;
let copies = 0;

const run = (args, { root = sandbox, catalog = CATALOG_PATH } = {}) => spawnSync(
  process.execPath,
  [SCRIPT, ...args],
  { encoding: "utf8", env: { ...process.env, UNIT_ROUTE_REPO: root, ...(catalog ? { UNIT_ROUTE_CATALOG: catalog } : {}) } },
);

/** Serialize a catalog the same way the tracked file ships. */
function withCatalog(mutate) {
  const copy = path.join(sandbox, `catalog-${++copies}.json`);
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  mutate(catalog);
  fs.writeFileSync(copy, JSON.stringify(catalog, null, 2));
  return copy;
}

/** A fixture feature unit whose `## Risk tier` records the given tier. */
function tierDoc(tier) {
  const dir = path.join(sandbox, "docs", "features", `9${copies}-tier-${tier}-feature`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SPEC.md"), `---
type: feature
scope: medium
---

# 93-tier-${tier}-feature — Tier recording fixture

## Objective

Fuse the design and plan steps per the recorded risk tier.

## Why

The conductor session composition is decided by the recorded tier.

## User outcome

One investigate→orient→ask→decide pass at the standard tier.

## Acceptance criteria

1. The recorded tier drives the fused pass.
2. The recorded tier drives the separated pass.

## Impact

Nothing outside this fixture.

## Non-goals

none

## Risk tier

- **Tier** — \`${tier}\` · **Task Size** — \`{understood: true, contained_risk: "contained", resumable_from_diff: true, ceremony: "unit-doc", verification: "gates"}\`
- **Named high-risk item** — \`none — not a high-tier unit\`

## Future cost

none

## Applicable tests

unit: test the recorded tier

## Known pre-existing issues

none

## Tasks

P1 — Implement the fused pass.

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

## Progress log

## Next

Run the lane.

## References

issue: 434
`);
  return `9${copies}-tier-${tier}-feature`;
}

/** A non-trivial fix unit with a recorded tier (no design step to fuse). */
function tierFixDoc(tier) {
  const dir = path.join(sandbox, "docs", "fix", `88-tier-${tier}-fix`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "SPEC.md"), `---
type: fix
scope: standard
---

# 88-tier-${tier}-fix — Tiered fix fixture

## Objective

Ship a fix whose recorded risk tier is ${tier}.

## Why

Fix units carry no design step, so the fused pair cannot apply.

## User outcome

The fix lands with the fix lane's step list.

## Acceptance criteria

1. The fix steps are unchanged by the recorded tier.

## Impact

Nothing outside this fixture.

## Non-goals

none

## Risk tier

- **Tier** — \`${tier}\` · **Task Size** — \`{understood: true, contained_risk: "contained", resumable_from_diff: true, ceremony: "unit-doc", verification: "gates"}\`
- **Named high-risk item** — \`none — not a high-tier unit\`

## Future cost

none

## Applicable tests

unit: test the recorded tier

## Known pre-existing issues

none

## Tasks

P1 — Implement the fix.

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

## Progress log

## Next

Run the lane.

## References

issue: 434
`);
  return `88-tier-${tier}-fix`;
}

const parseText = (stdout) => ({
  steps: /^Steps: (.+)$/m.exec(stdout)?.[1]?.split(", ").filter(Boolean) ?? [],
  fused: /^Fused: (.+)$/m.exec(stdout)?.[1] ?? null,
  budget: /^Budget: (.+)$/m.exec(stdout)?.[1] ?? null,
  skipped: /^Skipped: (.+)$/m.exec(stdout)?.[1] ?? null,
});

before(() => {
  sandbox = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "activity-fusion-")), "repo");
  fs.cpSync(FIXTURE_ROOT, sandbox, { recursive: true });
});

after(() => {
  fs.rmSync(path.dirname(sandbox), { recursive: true, force: true });
});

// ===========================================================================
// The catalog's declaration (tracked file)
// ===========================================================================

test("catalog.json declares the activity-fusion graph", () => {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const fusion = catalog.activityFusion;
  assert.ok(fusion, "catalog must declare activityFusion");
  assert.equal(fusion.schemaVersion, 1);
  assert.deepEqual(fusion.steps, ["design", "plan"], "the fused pair is exactly design + plan");
  assert.equal(typeof fusion.applies_when, "string");
  assert.equal(typeof fusion.skipped_when, "string");
  assert.equal(fusion.carriers, "separated", "carriers stay separated");
  assert.equal(fusion.gates, "separated", "gates stay separated");
});

// ===========================================================================
// Triage behaviour
// ===========================================================================

test("a standard-tier feature unit prints the additive Fused line and keeps its steps", () => {
  const slug = tierDoc("standard");
  const result = run(["--triage", slug]);
  assert.equal(result.status, 0, result.stderr);
  const text = parseText(result.stdout);
  assert.ok(text.fused, "the Fused line is present");
  assert.match(text.fused, /design \+ plan/);
  assert.match(text.fused, /activity-fusion@1/);
  assert.deepEqual(text.steps, ["research", "design", "plan", "implement", "tests", "evidence", "review", "docs", "release"]);
  assert.equal(text.budget, "strong");
  const json = JSON.parse(run(["--triage", slug, "--json"], { catalog: CATALOG_PATH }).stdout);
  assert.deepEqual(json.fused, { steps: ["design", "plan"] });
  assert.deepEqual(json.steps, text.steps);
});

test("a high-tier feature unit never fuses", () => {
  const slug = tierDoc("high");
  const result = run(["--triage", slug]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(parseText(result.stdout).fused, null);
  const json = JSON.parse(run(["--triage", slug, "--json"]).stdout);
  assert.equal("fused" in json, false, "no fused key on the separated path");
});

test("a fix unit never fuses — no design step to fuse with the plan", () => {
  const slug = tierFixDoc("standard");
  const result = run(["--triage", slug]);
  assert.equal(result.status, 0, result.stderr);
  const text = parseText(result.stdout);
  assert.equal(text.fused, null);
  assert.ok(!text.steps.includes("design"));
});

test("a docs-only unit never fuses", () => {
  const result = run(["--triage", "91-docs-only"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(parseText(result.stdout).fused, null);
});

test("a unit doc with no recorded tier is unaffected (legacy/undefined tier)", () => {
  const result = run(["--triage", "93-core-feature"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(parseText(result.stdout).fused, null, "no Fused line without a recorded standard tier");
});

test("a malformed activityFusion declaration fails closed", () => {
  const copy = withCatalog((catalog) => {
    catalog.activityFusion = { schemaVersion: 1, steps: ["design"] };
  });
  const result = run(["--triage", "91-docs-only"], { catalog: copy });
  assert.equal(result.status, 2, `${result.stdout}${result.stderr}`);
  assert.match(result.stderr, /activityFusion/);
});

// ===========================================================================
// Prose half (P3): the plan reference owns the rule; the conductor and the
// design reference carry pointers, never restatements.
// ===========================================================================

const plan = fs.readFileSync(path.join(REPO_ROOT, "skills", "unit-lane", "references", "PLAN.md"), "utf8");
const design = fs.readFileSync(path.join(REPO_ROOT, "skills", "unit-lane", "references", "DESIGN.md"), "utf8");
const skill = fs.readFileSync(path.join(REPO_ROOT, "skills", "unit-lane", "SKILL.md"), "utf8");
const agents = fs.readFileSync(path.join(REPO_ROOT, "AGENTS.md"), "utf8");

test("PLAN.md owns the activity-fusion@1 block with both tier rows", () => {
  const block = /```text\nactivity-fusion@1\n([\s\S]*?)```/.exec(plan);
  assert.ok(block, "the versioned activity-fusion@1 block exists in PLAN.md");
  const standardRow = /standard \|/.test(block[1]);
  const highRow = /high \|/.test(block[1]);
  assert.ok(standardRow, "the block declares the standard pass");
  assert.ok(highRow, "the block declares the high shape");
  assert.match(block[1], /standard \|.*one investigate→orient→ask→decide pass/, "standard = one pass");
  assert.match(block[1], /standard \|.*one conductor session/, "standard = one conductor session");
  assert.match(block[1], /standard \|.*tagged/, "decision points are tagged design/plan");
  assert.match(block[1], /\|\s*separated — sources\.md/, "carriers stay separated");
  assert.match(block[1], /\|\s*separated — both stages/, "gates stay separated");
  assert.match(block[1], /separated stages/, "high keeps separated stages");
  assert.match(block[1], /cold pre-execution-review/, "the cold pre-execution-review separation is named");
});

test("PLAN.md carries the delta-provenance rule and the AC-as-input guard", () => {
  assert.match(plan, /only.*claims the design pass did not already journal/i, "the plan journals only delta claims");
  assert.match(plan, /sweep only the delta/i, "the sweep runs over the delta rows only");
  assert.match(plan, /input/, "the AC-as-input guard stays");
  assert.match(plan, /no task\s+re-decides an acceptance criterion/, "no task re-decides an AC");
});

test("the superseded full re-run sentence is deleted (replace-implies-delete)", () => {
  assert.equal((plan.match(/same provenance search/g) ?? []).length, 0,
    "PLAN.md no longer orders the design step's provenance search re-run in full");
});

test("the conductor and the design reference point at the block instead of restating it", () => {
  const skillMentions = (skill.match(/activity-fusion@1/g) ?? []).length;
  assert.ok(skillMentions >= 1 && skillMentions <= 2, `SKILL.md mentions the block by id ${skillMentions} time(s) with an owner pointer, never a restatement`);
  assert.match(skill, /owner[^\n]*references\/PLAN\.md|references\/PLAN\.md[^\n]*activity-fusion@1/);
  const designMentions = (design.match(/activity-fusion@1/g) ?? []).length;
  assert.ok(designMentions >= 1 && designMentions <= 2, `DESIGN.md mentions the block by id ${designMentions} time(s) with an owner pointer`);
});

test("no reviewer pass is resurrected in the lane references", () => {
  for (const [name, text] of [["SKILL.md", skill], ["PLAN.md", plan], ["DESIGN.md", design]]) {
    assert.equal((text.match(/SPEC-REVIEW-PASS|PLAN-REVIEW-PASS/g) ?? []).length, 0,
      `${name} introduces no reviewer verdict`);
  }
});

test("the topological precedence rule stands after the change (S4)", () => {
  assert.match(plan, /dependency-topological first, smallest within a ready set/);
  assert.match(plan, /validator only runs after its prerequisite tasks pass/);
});

test("the normative-surfaces inventory registers the new block", () => {
  const row = agents.split("\n").find((l) => l.startsWith("activity-fusion "));
  assert.ok(row, "AGENTS.md normative-surfaces@1 has an activity-fusion row");
  assert.match(row, /skills\/unit-lane\/references\/PLAN\.md \| block:activity-fusion@1/);
});
