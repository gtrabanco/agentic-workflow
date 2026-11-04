#!/usr/bin/env node

/**
 * tier-cost.test.mjs — the measured acceptance's frozen corpus (issue #383,
 * `360b` of #360's `D360-1`).
 *
 * The instrument answers one question per unit: how many tokens did it cost,
 * how many ceremony steps did it skip, and which tier did it record. Every
 * number is a committed fact or a sink's own payload — never a model's claim
 * (S7) — and no cell is a session span (S4a): the timestamps of a session
 * measure absence, not work.
 *
 * The corpus is the fixture matrix below: a throwaway tree per case, never the
 * real project, so a red case names a shape and not a directory that happens to
 * be dirty. The suite lands before the module (the repo's red-first rule):
 * every case below fails on `ERR_MODULE_NOT_FOUND` until `scripts/tier-cost.mjs`
 * exists.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "scripts/tier-cost.mjs");

const { COLUMNS, CEREMONY_STEPS, TIER_COST_CONTRACT_ID, parseLedger, readLedger, aggregate, compare, ceremonyOf, resolveTier } =
  await import("./tier-cost.mjs");

/** A throwaway project root; the caller fills it and it is removed by the OS. */
function project(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "tier-cost-"));
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.join(dir, path.dirname(rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
  return dir;
}

/** The ledger text a sample table is read out of: the grammar block + the rows. */
function ledger(rows, columns = COLUMNS) {
  const declarations = columns.map((c) => `${c} | \`x\` | what it holds`).join("\n");
  const head = `| ${columns.join(" | ")} |`;
  const rule = `|${columns.map(() => "---").join("|")}|`;
  const body = rows.map((cells) => `| ${cells.join(" | ")} |`).join("\n");
  return `# Tier cost\n\n\`\`\`text\n${TIER_COST_CONTRACT_ID}\ncolumn | shape | what it holds\n${declarations}\n\`\`\`\n\n${head}\n${rule}\n${body}\n`;
}

/** One sample row, in the published column order. */
function row(unit, { changed = 4, tokens = 1000, turns = 3, model = 900, tool = 60, observed = "2026-11-03", source = "pi:session=abc" } = {}) {
  return [unit, changed, tokens, turns, model, tool, observed, source];
}

/** A unit doc that recorded a tier and carries the ceremony steps it owes. */
function unitDoc(tier, { tasks = 2, evidence = 1, review = 1 } = {}) {
  const phaseLines = Array.from({ length: tasks }, (_, i) => `- P${i + 1} — a phase (validator: \`true\` exits 0)`).join("\n");
  const log = [
    ...Array.from({ length: evidence }, (_, i) => `- **E${i + 1}** — 2026-11-03, \`true\` · exit 0 · ok.`),
    ...Array.from({ length: review }, (_, i) => `- **R${i + 1}** — \`HEAD abc\`, verdict PASS, cycle ${i + 1}.`),
  ].join("\n");
  return `# fix/111-a\n\n## Specs\n\n**S1 — a requirement.**\n> the words\n\n- **Tier** — \`${tier}\` · **Task Size** — \`standard\`\n\n## Tasks\n\n${phaseLines}\n\n## Log\n\n${log}\n`;
}

/** A passive unit's carrier: the five declared fields, nothing else. */
function passiveCarrier(id) {
  return `passive-record@1\nid | \`${id}\` | the passive unit's stable id\ntier | passive | the verdict as the classifier emitted it\npaths | docs/x.md | the readback's own scope\nreadback | every changed file read and classified | the structural readback\ngate | \`true\` · exit 0 | the deterministic gate that ran beside it\n`;
}

test("the instrument publishes its contract id and the exact column set", () => {
  assert.equal(TIER_COST_CONTRACT_ID, "tier-cost@1");
  assert.deepEqual(COLUMNS, [
    "unit", "changed_paths", "tokens", "turns", "model_ms", "tool_ms", "observed", "source",
  ], "the row is what was measured: the tier, the size tier and the ceremony counts are derived at read time");
  assert.deepEqual(CEREMONY_STEPS, ["unit-doc", "phases", "evidence-table", "review"], "the four ceremony steps are the ones risk-tiers.md declares");
});

test("the grammar is the header: an undeclared column is refused, a short row is refused", () => {
  const ok = parseLedger(ledger([row("111-a")]));
  assert.equal(ok.columns.length, 8);
  assert.equal(ok.rows.length, 1);

  const extra = parseLedger(ledger([row("111-a")], [...COLUMNS, "wall_clock"]));
  assert.equal(extra.error, "undeclared-column");
  assert.match(extra.detail, /wall_clock/);

  const short = ledger([[...row("111-a").slice(0, 7)]]);
  assert.equal(parseLedger(short).error, "row-shape");
});

test("the tier comes from the unit's carrier at read time, and a unit with no carrier is refused", () => {
  const root = project({
    "docs/fix/111-a/SPEC.md": unitDoc("standard"),
    "docs/passive/222-b.md": passiveCarrier("222-b"),
  });
  assert.equal(resolveTier(root, "111-a"), "standard");
  assert.equal(resolveTier(root, "222-b"), "passive");
  assert.equal(resolveTier(root, "333-ghost"), null);

  const ghost = readLedger(root, ledger([row("333-ghost")]));
  assert.equal(ghost.error, "unknown-unit");

  const read = readLedger(root, ledger([row("111-a"), row("222-b")]));
  assert.equal(read.error, undefined);
  assert.deepEqual(read.rows.map((r) => r.tier), ["standard", "passive"], "no stored tier can disagree with the carrier");
  assert.deepEqual(read.rows.map((r) => r.ceremony_skipped), [0, 4]);
});

test("a recorded tier is read from the template block, the classifier's JSON and a plain sentence", () => {
  const root = project({
    "docs/fix/111-a/SPEC.md": unitDoc("standard"),
    "docs/fix/222-b/SPEC.md": "# fix/222-b\n\n## Log\n\n- **E1** — 2026-11-03, `bun scripts/ceremony.mjs tier classify` · exit 0 · {\"tier\": \"passive\"}.\n",
    "docs/fix/333-c/SPEC.md": "# fix/333-c\n\nRecorded by the classifier: tier: `high`.\n",
    "docs/fix/444-d/SPEC.md": "# fix/444-d\n\n## Specs\n\n**S1 — a requirement.**\n> the words\n",
  });
  assert.equal(resolveTier(root, "111-a"), "standard", "the template's ## Risk tier block is a recorded tier");
  assert.equal(resolveTier(root, "222-b"), "passive", "the classifier's JSON in an evidence line still reads");
  assert.equal(resolveTier(root, "333-c"), "high", "a plain sentence still reads");
  assert.equal(resolveTier(root, "444-d"), null, "a unit that recorded nothing is not given a tier");
});

test("ceremony is counted against the four declared steps, and a doc-less unit invents nothing", () => {
  const root = project({
    "docs/fix/111-a/SPEC.md": unitDoc("standard"),
    "docs/fix/333-bare/SPEC.md": "# fix/333-bare\n\n## Specs\n\n**S1 — a requirement.**\n> the words\n",
    "docs/passive/222-b.md": passiveCarrier("222-b"),
  });
  assert.deepEqual(ceremonyOf(root, "111-a"), { recorded: 4, skipped: 0 });
  assert.deepEqual(ceremonyOf(root, "333-bare"), { recorded: 1, skipped: 3 });
  assert.deepEqual(ceremonyOf(root, "222-b"), { recorded: 0, skipped: 4 });
  assert.deepEqual(ceremonyOf(root, "444-ghost"), { recorded: 0, skipped: 4 });
});

test("the aggregate groups by both published tiers and prints no single figure", () => {
  const rows = [
    { tier: "passive", changed_paths: 2, tokens: 100, turns: 1, ceremony_skipped: 4 },
    { tier: "passive", changed_paths: 3, tokens: 300, turns: 2, ceremony_skipped: 4 },
    { tier: "standard", changed_paths: 9, tokens: 900, turns: 5, ceremony_skipped: 0 },
  ];
  const out = aggregate(rows);
  assert.equal(out.by_risk_tier.passive.units, 2);
  assert.equal(out.by_risk_tier.passive.tokens_sum, 400);
  assert.equal(out.by_risk_tier.passive.tokens_median, 200);
  assert.equal(out.by_risk_tier.standard.units, 1);
  assert.equal(out.by_size_tier.prose.units, 2, "a passive row is prose by the size rules, never by a second rule here");
  assert.equal(out.by_size_tier.large.units, 1, "9 changed paths is past the small bound");
  for (const banned of ["total_tokens", "savings", "delta_total", "overall"]) {
    assert.ok(!(banned in out), `the aggregate never synthesises a single figure (${banned})`);
  }
});

test("the comparison refuses below three units per tier and names the counts it saw", () => {
  const thin = compare([{ tier: "passive", changed_paths: 2, tokens: 100 }, { tier: "standard", changed_paths: 9, tokens: 900 }]);
  assert.equal(thin.verdict, "insufficient-corpus");
  assert.equal(thin.by_risk_tier.passive.units, 1);
  assert.equal(thin.by_risk_tier.high.units, 0);

  const full = compare([
    { tier: "passive", changed_paths: 2, tokens: 100, ceremony_skipped: 4 },
    { tier: "passive", changed_paths: 2, tokens: 200, ceremony_skipped: 4 },
    { tier: "passive", changed_paths: 2, tokens: 300, ceremony_skipped: 4 },
    { tier: "standard", changed_paths: 9, tokens: 900, ceremony_skipped: 0 },
    { tier: "standard", changed_paths: 9, tokens: 950, ceremony_skipped: 0 },
    { tier: "standard", changed_paths: 9, tokens: 990, ceremony_skipped: 0 },
  ]);
  assert.equal(full.verdict, "ok");
  assert.equal(full.by_risk_tier.passive.tokens_median, 200);
  assert.equal(full.by_risk_tier.standard.ceremony_skipped_sum, 0);
});

test("an empty ledger is a ledger: no samples aggregate to nothing and the comparison blocks", () => {
  const empty = parseLedger(ledger([]));
  assert.equal(empty.error, undefined, "a fresh ledger carries the grammar and no samples — that is not a parse failure");
  assert.deepEqual(empty.rows, []);

  const grouped = aggregate([]);
  assert.equal(grouped.rows, 0);
  assert.equal(grouped.by_risk_tier.passive.units, 0);
  assert.equal(grouped.by_size_tier.prose.units, 0);

  assert.equal(compare([]).verdict, "insufficient-corpus", "no samples is the smallest corpus, never a clean bill");
});

test("time is never a span: the module carries no wall-clock token, and no flag accepts a model's number", () => {
  const source = fs.readFileSync(path.join(ROOT, "scripts/tier-cost.mjs"), "utf8");
  assert.doesNotMatch(source, /wall_clock|wall-clock|\belapsed\b|savings/i, "S4a: no span-shaped cell, no claim of a saving in minutes");

  const usage = spawnSync(process.execPath, [CLI, "aggregate", "--model", "cheap"], { encoding: "utf8" });
  assert.equal(usage.status, 1, "an unknown flag is a usage error: no model-emitted value has a door in (S7)");
});

test("the CLI reads a ledger, aggregates it, and blocks the comparison on a thin corpus", () => {
  const root = project({
    "docs/fix/111-a/SPEC.md": unitDoc("standard", { tasks: 1, evidence: 1, review: 0 }),
    "docs/workflow/TIER_COST.md": ledger([row("111-a")]),
  });
  const ledgerPath = path.join(root, "docs/workflow/TIER_COST.md");

  const read = JSON.parse(execFileSync(process.execPath, [CLI, "read", "--ledger", ledgerPath], { encoding: "utf8" }));
  assert.equal(read.rows.length, 1);
  assert.equal(read.rows[0].tokens, 1000);
  assert.equal(read.rows[0].turns, 3);
  assert.equal(read.rows[0].ceremony_recorded, 3);
  assert.equal(read.rows[0].ceremony_skipped, 1);

  const agg = JSON.parse(execFileSync(process.execPath, [CLI, "aggregate", "--ledger", ledgerPath], { encoding: "utf8" }));
  assert.equal(agg.by_risk_tier.standard.units, 1);

  const cmp = spawnSync(process.execPath, [CLI, "compare", "--ledger", ledgerPath], { encoding: "utf8" });
  assert.equal(cmp.status, 2, "a ceremonial block, never exit 0 with invented data");
  assert.match(cmp.stdout, /insufficient-corpus/);

  const again = execFileSync(process.execPath, [CLI, "read", "--ledger", ledgerPath], { encoding: "utf8" });
  assert.equal(again, execFileSync(process.execPath, [CLI, "read", "--ledger", ledgerPath], { encoding: "utf8" }), "the same ledger yields the same bytes");
});
