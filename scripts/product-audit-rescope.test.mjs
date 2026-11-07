#!/usr/bin/env node

/**
 * #440 — product-audit re-scope: deterministic-first dimensions, measured
 * triggers, profile-aware scope. Pins every normative surface the re-scope
 * introduces (design note 13 of #307):
 *
 *   1. measured triggers — the periodic/calendar cadence is retired and the
 *      `audit-trigger@1` grammar block declares the three triggers plus the
 *      `insufficient-corpus` verdict (S4)
 *   2. deterministic-producer pre-pass — every dimension consumes its
 *      producer's output receipt-quoted, never re-run by the model; only the
 *      non-mechanizable remainder is model-swept (S2)
 *   3. profile-aware scope — dimensions the project's ceremony profile does
 *      not declare are recorded `n/a` (consumption-side; grammar rides #436)
 *      (S3)
 *   4. findings typed 1:1 with review's finding vocabulary and the route cell
 *      as a resolver hand-off (`finding-route@1`, the note-7 single-input
 *      verbs) — never bespoke prose routes (S5)
 *   5. the unique surfaces survive (bug hunt, security research,
 *      broken-version investigation) and #438's four residual states are
 *      reused by reference, never a second vocabulary (S1, issue triage note)
 *   6. the retired cadence leaves every live instruction surface — the sweep
 *      that closes the external verify's F51/F53 class (sibling mentions of a
 *      truth retired in one surface), with dated records exempt by declaration
 *
 * Run: `bun test scripts/product-audit-rescope.test.mjs`
 * (fallback `node --test scripts/product-audit-rescope.test.mjs`).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (rel) => fs.readFileSync(path.join(repoRoot, rel), "utf8");

const skill = () => read("skills/product-audit/SKILL.md");
const dimensions = () => read("skills/product-audit/references/AUDIT_DIMENSIONS.md");
const process = () => read("skills/product-audit/references/AUDIT_PROCESS.md");
const agents = () => read("AGENTS.md");

// ── 1. Measured triggers replace the calendar cadence (S4, FF1) ─────────────

test("the periodic cadence is retired from the skill (S4)", () => {
  assert.doesNotMatch(skill(), /Periodically \(every few features\)/);
  assert.doesNotMatch(skill(), /periodic full-spectrum/i);
  assert.doesNotMatch(skill(), /whole product, all axes, periodic/);
});

test("the audit-trigger@1 grammar block declares the three measured triggers (S4)", () => {
  assert.match(skill(), /```text\naudit-trigger@1/);
  assert.match(skill(), /drift signal/);
  assert.match(skill(), /threshold debt/);
  assert.match(skill(), /owner request/);
  // The triggers cite their measured sources: the audit-docs corpus band
  // (note 12) and the #437 measurement design (note 11) — never invented bands.
  assert.match(skill(), /corpus band/);
  assert.match(skill(), /#437/);
});

test("an under-threshold invocation returns the insufficient-corpus verdict (S4)", () => {
  assert.match(skill(), /insufficient-corpus/);
  assert.match(skill(), /instead of inventing findings or figures/i);
});

test("the trigger grammar is a declared normative surface in AGENTS.md (S4)", () => {
  assert.match(agents(), /product-audit-trigger \| skills\/product-audit\/SKILL\.md \| block:audit-trigger@1/);
});

// ── 1b. The retired cadence leaves every live instruction surface (F51/F53) ──

// The external verify (2026-11-07) found the class this closes: the cadence was
// retired in `skills/product-audit/SKILL.md` while its surviving mentions kept
// asserting the old truth. A literal sweep over the surfaces that ORDER current
// behaviour (the skills + the tutorial + the root README), never a sentence
// parse: the phrasings below are the exact retired-cadence claims the sweep
// found, so an unrelated `periodic` (an `audit-docs` run cadence, a deferred
// tradeoff re-confirmation, another skill's own hygiene note) stays quiet.
const RETIRED_CADENCE_LITERALS = [
  "product-wide, periodic",
  "the periodic, product-wide full sweep",
  "is the periodic sweep",
  "then — periodically — the whole product",
  "roadmap proposals (periodic)",
  "periodic product-wide health check",
  "run every few features",
  "periodically (every few features)",
];

// Dated historical records are exempt: the row states what was true at its date,
// never current behaviour (the same exemption class the invocation-drift gate
// gives `REPOSITORY_STATE.md` — frozen receipts, evidence of what ran).
const CADENCE_SWEEP_EXEMPT = ["docs/workflow/MIGRATION.md"];

const sweepFiles = () => {
  const found = new Set();
  for (const skillDir of fs.readdirSync(path.join(repoRoot, "skills"), { withFileTypes: true })) {
    if (!skillDir.isDirectory()) continue;
    const base = path.join("skills", skillDir.name);
    for (const rel of [path.join(base, "SKILL.md"), path.join(base, "references")]) {
      const abs = path.join(repoRoot, rel);
      if (!fs.existsSync(abs)) continue;
      if (fs.statSync(abs).isDirectory()) {
        for (const f of fs.readdirSync(abs)) {
          if (f.endsWith(".md")) found.add(`${rel}/${f}`);
        }
      } else {
        found.add(rel);
      }
    }
  }
  for (const f of fs.readdirSync(path.join(repoRoot, "docs", "workflow"))) {
    if (f.endsWith(".md")) found.add(`docs/workflow/${f}`);
  }
  found.add("README.md");
  return [...found].filter((rel) => !CADENCE_SWEEP_EXEMPT.includes(rel) && fs.existsSync(path.join(repoRoot, rel)));
};

test("no live instruction surface keeps the retired periodic cadence (S4, the F51/F53 class)", () => {
  const survivors = [];
  for (const rel of sweepFiles()) {
    const lines = read(rel).split("\n");
    lines.forEach((line, i) => {
      const lower = line.toLowerCase();
      for (const literal of RETIRED_CADENCE_LITERALS) {
        if (lower.includes(literal)) survivors.push(`${rel}:${i + 1}: ${line.trim()} (${literal})`);
      }
    });
  }
  assert.deepEqual(survivors, [], "the cadence retired by S4 must leave every live surface — a surviving mention asserts the old truth");
});

// ── 2. Deterministic-producer pre-pass (S2, FF2) ────────────────────────────

test("the dimension table carries the deterministic-producer pre-pass rule (S2)", () => {
  assert.match(dimensions(), /Deterministic producer/);
  assert.match(dimensions(), /receipt-quoted/i);
  assert.match(dimensions(), /never re-run by the model/i);
  assert.match(dimensions(), /non-mechanizable remainder/i);
});

test("the dimension table names the real producers it consumes (S2)", () => {
  // Dependency advisories already run as a local-gate step.
  assert.match(dimensions(), /dependency-advisories/);
  // Per-language dead-code linters and posture checks ride #436's profile slots.
  assert.match(dimensions(), /dead-code linter/);
  assert.match(dimensions(), /#436/);
});

test("the audit process executes the pre-pass before the model sweep (S2)", () => {
  assert.match(process(), /pre-pass/i);
  assert.match(process(), /receipt/i);
});

// ── 3. Profile-aware scope (S3) ─────────────────────────────────────────────

test("dimensions not declared by the ceremony profile are recorded n/a (S3)", () => {
  assert.match(dimensions(), /ceremony profile/);
  assert.match(dimensions(), /n\/a —/);
  // Consumption-side: no profile grammar is invented here (it rides #436).
  assert.match(dimensions(), /#436/);
});

// ── 4. Findings 1:1 with review's vocabulary; resolver-verb routes (S5, FF3) ─

test("the finding route cell is the finding-route@1 resolver hand-off (S5)", () => {
  assert.match(skill(), /```text\nfinding-route@1/);
  // The note-7 single-input verbs, closed.
  assert.match(skill(), /continue \| fix \| review \| audit \| explain-state/);
  assert.match(skill(), /never bespoke prose routes/);
});

test("the route grammar is a declared normative surface in AGENTS.md (S5)", () => {
  assert.match(agents(), /product-audit-finding-route \| skills\/product-audit\/SKILL\.md \| block:finding-route@1/);
});

test("findings carry review's finding vocabulary 1:1, no mapping layer (S5)", () => {
  assert.match(skill(), /1:1 with review's finding vocabulary/i);
  assert.match(skill(), /CLASSIFY\.md/);
});

// ── 5. What must survive the re-scope (S1, S6) ──────────────────────────────

test("the unique surfaces survive the re-scope (S1)", () => {
  assert.match(skill(), /bug hunt/i);
  assert.match(skill(), /security research/i);
  assert.match(skill(), /broken-version investigation/);
});

test("the residue dimensions reuse #438's four residual states by reference (triage note)", () => {
  assert.match(dimensions(), /#438/);
  assert.match(dimensions(), /used \/ scaffold \/ half-built \/ orphan|used, scaffold, half-built, orphan/);
});

test("the proposals-only contract is untouched (S6)", () => {
  assert.match(skill(), /Never auto-fixes, never opens issues, never edits the roadmap/);
});

console.log("PASS product-audit rescope: measured triggers, pre-pass, profile scope, resolver routes pinned");
