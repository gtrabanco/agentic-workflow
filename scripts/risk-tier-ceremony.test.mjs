#!/usr/bin/env node

/**
 * risk-tier-ceremony.test.mjs — the tier as *versioned grammar* and as ceremony
 * (issue #360), the half that must never be emitted by a model.
 *
 * Frozen failures this suite is the reproducer for:
 *
 *   C1  the tier has no machine home   — no ceremony subcommand, no published
 *                                        vocabulary, no inventory row
 *   C2  the sensor cannot say a unit's tier — `detail.risk_tier` absent
 *   C3  the lane re-derives ceremony   — no Task Size signals in triage
 *   C4  the executor owes one ceremony for every change — no per-tier rule
 *   C5  a passive unit has no carrier  — templates describe no zero-ceremony shape
 *
 * Every fixture is a throwaway tree under `os.tmpdir()`; the live repository is
 * read only where the assertion is about the live repository (the inventory, the
 * templates, the skills).
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const scrubbed = Array.from({ length: 3 }, () => path.join(os.tmpdir(), "risk-tier-scratch-"));
for (const dir of scrubbed) fs.rmSync(dir, { recursive: true, force: true });
after(() => { for (const dir of scrubbed) fs.rmSync(dir, { recursive: true, force: true }); });

const run = (args, options = {}) =>
  spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8", ...options });

const git = (cwd, args) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, `git ${args.join(" ")} failed: ${result.stderr}`);
  return result.stdout;
};

/** A throwaway repository the ceremony CLI can be pointed at. */
function fixtureRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "risk-tier-repo-"));
  git(dir, ["init", "-q", "-b", "main"]);
  git(dir, ["config", "user.email", "fixture@example.invalid"]);
  git(dir, ["config", "user.name", "Fixture"]);
  fs.writeFileSync(path.join(dir, "README.md"), "# Fixture\n\nProse only.\n");
  git(dir, ["add", "."]);
  git(dir, ["commit", "-q", "-m", "chore: fixture"]);
  return dir;
}

// ---------------------------------------------------------------------------
// C1 — the tier is emitted by the closed ceremony CLI, never by the model
// ---------------------------------------------------------------------------

test("C1 ceremony: `tier classify --paths` prints the tier as JSON and exits 0", () => {
  const repo = fixtureRepo();
  fs.writeFileSync(path.join(repo, "NOTES.md"), "prose\n");
  const result = spawnSync(process.execPath, [path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "ceremony", "tier", "classify", "--paths", "NOTES.md"], {
    cwd: repo,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `tier classify exits 0 (stderr: ${result.stderr})`);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.tier, "passive", "a single prose file is passive");
  assert.equal(payload.task_size.ceremony, "none");
  assert.deepEqual(payload.signals, []);
});

test("C1a ceremony: a high-risk path prints high with its named signal", () => {
  const repo = fixtureRepo();
  fs.mkdirSync(path.join(repo, ".github", "workflows"), { recursive: true });
  fs.writeFileSync(path.join(repo, ".github", "workflows", "ci.yml"), "name: ci\n");
  const result = spawnSync(process.execPath, [path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "ceremony", "tier", "classify", "--paths", ".github/workflows/ci.yml"], {
    cwd: repo,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.tier, "high");
  assert.deepEqual(payload.signals.map((s) => s.signal), ["ci"]);
});

test("C1b ceremony: the diff scope classifies HEAD against the merge base, no flag needed", () => {
  const repo = fixtureRepo();
  git(repo, ["checkout", "-q", "-b", "docs-only"]);
  fs.writeFileSync(path.join(repo, "GUIDE.md"), "more prose\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-q", "-m", "docs: readme prose"]);
  const result = spawnSync(process.execPath, [path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "ceremony", "tier", "classify"], { cwd: repo, encoding: "utf8" });
  assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.tier, "passive", "the branch's diff is prose only");
  assert.deepEqual(payload.paths.changed.sort(), ["GUIDE.md", "README.md"].filter((p) => payload.paths.changed.includes(p)));
});

test("C1d ceremony: the first uncommitted path is read whole, so a dirty CI workflow is high", () => {
  // Issue #384 F1: `scopePaths()` trimmed the porcelain listing before slicing
  // the status columns, so the FIRST dirty entry lost its first character
  // (`?? .github/x` → `github/x`). A mangled high-risk path is a fail-open tier:
  // the change classified `standard` and skipped the ceremony it owed.
  const repo = fixtureRepo();
  fs.mkdirSync(path.join(repo, ".github", "workflows"), { recursive: true });
  fs.writeFileSync(path.join(repo, ".github", "workflows", "root-suite.yml"), "name: suite\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-q", "-m", "ci: seed the suite"]);
  // The modified file is the FIRST (and only) porcelain entry — that column is
  // where the off-by-one bit.
  fs.writeFileSync(path.join(repo, ".github", "workflows", "root-suite.yml"), "name: suite\non: push\n");
  const result = spawnSync(process.execPath, [path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "ceremony", "tier", "classify", "--base", "main"], {
    cwd: repo,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `stderr: ${result.stderr}`);
  const payload = JSON.parse(result.stdout);
  assert.ok(payload.paths.changed.includes(".github/workflows/root-suite.yml"),
    `the dirty path is reported whole (saw ${JSON.stringify(payload.paths.changed)})`);
  assert.equal(payload.tier, "high", "a dirty CI surface is high whatever column it occupies");
  assert.deepEqual(payload.signals.map((s) => s.signal), ["ci"]);
});

test("C1c ceremony: `tier read --unit` answers the recorded tier of a unit, and refuses an unknown unit", () => {
  const repo = fixtureRepo();
  fs.mkdirSync(path.join(repo, "docs", "fix", "900-fixture"), { recursive: true });
  fs.writeFileSync(path.join(repo, "docs", "fix", "900-fixture", "SPEC.md"), "# fix/900-fixture\n\n- **E1** — 2026-11-02, `ceremony tier classify --paths docs/a.md` · exit 0 · `\"tier\": \"passive\"`.\n");
  const ok = spawnSync(process.execPath, [path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "ceremony", "tier", "read", "--unit", "900-fixture"], { cwd: repo, encoding: "utf8" });
  assert.equal(ok.status, 0, `stderr: ${ok.stderr}`);
  assert.equal(JSON.parse(ok.stdout).tier, "passive", "the tier is read from the unit's own evidence line");

  const missing = spawnSync(process.execPath, [path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "ceremony", "tier", "read", "--unit", "nope"], { cwd: repo, encoding: "utf8" });
  assert.equal(missing.status, 1, "an unknown unit is a usage error");
  assert.equal(JSON.parse(missing.stdout).error, "unknown-slug");
});

test("C1d ceremony: an unknown tier subcommand and an unknown object still refuse in the closed world", () => {
  const unknownOp = spawnSync(process.execPath, [path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "ceremony", "tier", "invent", "--paths", "a.md"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(unknownOp.status, 1);
  assert.equal(JSON.parse(unknownOp.stdout).error, "unknown-op");

  const unknownObject = spawnSync(process.execPath, [path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "ceremony", "teleport", "now"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(unknownObject.status, 1, "the closed world refuses an object it does not declare");
  assert.equal(JSON.parse(unknownObject.stdout).error, "unknown-object");

  const badFlag = spawnSync(process.execPath, [path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "ceremony", "tier", "classify", "--tier", "passive"], { cwd: ROOT, encoding: "utf8" });
  assert.equal(badFlag.status, 1, "a model-supplied --tier is refused: the tier is never an input");
  assert.equal(JSON.parse(badFlag.stdout).error, "unknown-flag");
});

// ---------------------------------------------------------------------------
// C2 — the inventory binds the published surfaces (normative-surfaces@1)
// ---------------------------------------------------------------------------

test("C2 the inventory declares the tier vocabularies and the verdict grammar as surfaces", () => {
  const guide = read("AGENTS.md");
  for (const [surface, exportName] of [
    ["risk-tier-vocabulary", "RISK_TIER_KINDS"],
    ["risk-tier-signals", "RISK_TIER_SIGNAL_KINDS"],
    ["risk-tier-reasons", "RISK_TIER_REASONS"],
  ]) {
    assert.ok(guide.includes(`${surface} | packages/agentic-workflow-schema/src/vocabularies.ts | schema-export:${exportName} |`),
      `${surface} is an inventoried surface bound to ${exportName}`);
  }
  assert.ok(guide.includes("risk-tier-verdict | skills/execute-phase/references/risk-tiers.md | block:risk-tier-verdict@1 |"),
    "the verdict grammar is an inventoried surface");
  assert.ok(guide.includes("passive-record | skills/execute-phase/references/risk-tiers.md | block:passive-record@1 |"),
    "the passive carrier's grammar is an inventoried surface");
  const tierBlock = read("skills/execute-phase/references/risk-tiers.md");
  assert.match(tierBlock, /```text\nrisk-tier-verdict@1\n/, "the block that owns the verdict shape");
  assert.match(tierBlock, /```text\npassive-record@1\n/, "the block that owns the passive carrier");
});

test("C2a the schema package publishes the tier vocabularies and the parity suite pins the reader", () => {
  const source = read("packages/agentic-workflow-schema/src/vocabularies.ts");
  assert.match(source, /export const RISK_TIER_KINDS = Object\.freeze\(\["passive", "standard", "high"\]\)/);
  assert.match(source, /export const RISK_TIER_SIGNAL_KINDS = Object\.freeze\(\[/);
  assert.match(source, /export const RISK_TIER_REASONS = Object\.freeze\(\[/);
  const parity = read("scripts/vocabulary-parity.test.mjs");
  assert.match(parity, /RISK_TIER_KINDS/, "the parity suite reads the new sets");
});

test("C2b the classifier and the ceremony module agree on the vocabulary (no second copy)", async () => {
  const { RISK_TIER_KINDS } = await import(pathToFileURL(path.join(ROOT, "packages/agentic-workflow/src/runner/risk-tiers.mjs")).href);
  assert.deepEqual([...RISK_TIER_KINDS], ["passive", "standard", "high"]);
  const ceremony = await import(pathToFileURL(path.join(ROOT, "packages", "agentic-workflow", "src", "runner", "ceremony", "tier.mjs")).href);
  assert.deepEqual([...ceremony.RISK_TIER_KINDS], [...RISK_TIER_KINDS], "one declaration, imported");
});

test("C2c the size tier and the risk tier are two sources of truth in one place, and `next` stays untouched", () => {
  const repo = fixtureRepo();
  const result = spawnSync(process.execPath, [path.join(ROOT, "packages", "agentic-workflow", "bin", "agentic-workflow.mjs"), "workflow-status"], {
    cwd: repo,
    encoding: "utf8",
    timeout: 60_000,
    env: { ...process.env, PATH: `${path.join(repo, "bin")}:${process.env.PATH}` },
  });
  assert.equal(result.status, 0, `the sensor runs on a bare fixture repo (stderr: ${result.stderr})`);
  const envelope = JSON.parse(result.stdout.slice(result.stdout.indexOf("{")));
  // One home per fact: the risk/size of the unit lives under `detail`; `next`
  // keeps its own, different meaning (the model budget for the next command).
  assert.ok(envelope.detail.risk_tier, "detail.risk_tier is the risk tier");
  assert.ok(envelope.detail.size_tier, "detail.size_tier is the size tier");
  assert.deepEqual(Object.keys(envelope.next).filter((k) => /risk|size/.test(k)), [],
    "next carries no second copy of the risk or size tier");
  assert.equal(envelope.next.tier, "cheap", "next.tier is unchanged: the command's model budget");
  assert.ok(["strong", "cheap"].includes(envelope.next.tier), "next.tier is still the model budget");
});

// ---------------------------------------------------------------------------
// C3 — the lane's triage names the tier and the Task Size signals
// ---------------------------------------------------------------------------

test("C3 unit-lane states the Task Size signals and never lets file counts decide", () => {
  const skill = read("skills/unit-lane/SKILL.md");
  assert.match(skill, /Task Size/, "the lane names Task Size");
  assert.match(skill, /Understood/, "the understood signal");
  assert.match(skill, /Contained risk/, "the contained-risk signal");
  assert.match(skill, /Resumable-from-diff/, "the resume test");
  assert.match(skill, /never decide|never read|never basis/i, "file counts never decide");
  assert.match(skill, /ceremony\.mjs tier classify/, "the lane reads the tier from the ceremony CLI, never derives it");
});

test("C3a a passive verdict routes a docs-only request to the zero-ceremony path", () => {
  const skill = read("skills/unit-lane/SKILL.md");
  assert.match(skill, /passive/, "the lane knows the passive tier");
  assert.match(skill, /docs\/passive\/<id>\.md/, "the passive carrier is named");
  assert.match(skill, /no unit doc/, "the passive tier opens no unit doc");
});

// ---------------------------------------------------------------------------
// C4 — the executor's ceremony mirrors the tier
// ---------------------------------------------------------------------------

test("C4 execute-phase states the three per-tier ceremonies once, and cites the owner", () => {
  const skill = read("skills/execute-phase/SKILL.md");
  const reference = read("skills/execute-phase/references/risk-tiers.md");
  assert.match(skill, /references\/risk-tiers\.md/, "the executor cites the owner instead of restating the table");
  assert.match(reference, /^\| `passive` \|.*readback/m, "passive → structural readback");
  assert.match(reference, /^\| `standard` \|.*unit-doc/m, "standard → the current unit-doc ceremony");
  assert.match(reference, /^\| `high` \|.*review-change/m, "high → full review-change");
});

// ---------------------------------------------------------------------------
// C5 — the passive tier's zero-ceremony carrier
// ---------------------------------------------------------------------------

test("C5 both unit-doc templates describe the passive shape and the scaffold mirrors it", () => {
  for (const template of [
    "docs/fix/_TEMPLATE/SPEC.md",
    "docs/features/_TEMPLATE/SPEC.md",
    "template/docs/fix/_TEMPLATE/SPEC.md",
    "template/docs/features/_TEMPLATE/SPEC.md",
  ]) {
    const text = read(template);
    assert.match(text, /docs\/passive\/<id>\.md/, `${template}: the passive carrier is named`);
    assert.match(text, /passive/, `${template}: the passive tier is named`);
  }
});

test("C5b a passive record written from the grammar parses back to exactly its five fields", () => {
  const record = [
    "# 2026-11-02-notes",
    "",
    "- id — `2026-11-02-notes`",
    "- tier — passive",
    "- paths — `docs/workflow/SETUP.md`, `README.md`",
    "- readback — both files read in full: prose only, no code block a runtime executes",
    "- gate — `node scripts/run-root-suite.mjs` · exit 0",
  ].join("\n");
  const fields = record.split("\n").map((line) => /^- (\w+) — (.+)$/.exec(line)).filter(Boolean).map((m) => m[1]);
  assert.deepEqual(fields, ["id", "tier", "paths", "readback", "gate"], "the record carries the grammar's five fields, in order");
  const grammar = /```text\npassive-record@1\n([\s\S]*?)```/.exec(read("skills/execute-phase/references/risk-tiers.md"));
  const declared = grammar[1].split("\n").map((line) => line.split("|")[0].trim()).filter(Boolean);
  assert.deepEqual(fields, declared, "the written record and the declared grammar agree — no field the schema does not publish");
});

test("C5a the passive record is a readback, not a unit doc: no phases, no evidence table", () => {
  const reference = read("skills/execute-phase/references/risk-tiers.md");
  const fenced = /```text\npassive-record@1\n([\s\S]*?)```/.exec(reference);
  assert.ok(fenced, "the passive carrier's grammar is fenced and versioned");
  const fields = fenced[1].split("\n").map((line) => line.split("|")[0].trim()).filter(Boolean);
  assert.deepEqual(fields, ["id", "tier", "paths", "readback", "gate"],
    "the passive carrier records exactly the readback's five fields");
  assert.match(reference, /a file, not a unit\s+doc/i, "the passive carrier is not a unit doc");
  assert.doesNotMatch(fenced[1], /phase|evidence table/i, "no phase and no evidence table enters the passive carrier");
});
