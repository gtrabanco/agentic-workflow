#!/usr/bin/env node

// Fix #161 P1 — the authoring research gate. Authoring never leaves the repo
// today, so SPEC/plan authors design from what the repository already believes.
// Pins the authoring-side contract to its owning skill text:
//   O1  design-feature: a mandatory, fail-closed research pass before the
//       Product half is emitted (≥2 fetched external sources, full-definition
//       and user-expectation coverage)
//   O2  evidence-grounding: fetched web sources are citable evidence rows
//       (URL + access date); the evidence pass gains the web pass
//   O3  plan-fix / plan-feature-scaffold: plan-stage research is conditional
//       on a named unanswered bounded question — one web pass, no re-fetching
//       what the repo answers
//   O19 mandatory reference trace (symbol/reference search derives the blast
//       radius) + review-code's broken-reference checklist item
//   O20 implicit case decomposition of every enunciated expectation before the
//       Product half is cut

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const design = read("skills/design-feature/SKILL.md");
const grounding = read("skills/evidence-grounding/SKILL.md");
const rows = read("skills/evidence-grounding/references/ROWS.md");
const planFix = read("skills/plan-fix/SKILL.md");
const scaffold = read("skills/plan-feature-scaffold/SKILL.md");
const reviewCode = read("skills/review-code/SKILL.md");

// ── O1 — design-feature: the research gate is mandatory and fail-closed ─────

assert.match(design, /## Research gate \(mandatory, fail-closed\)/);
assert.match(design, /at least two externally fetched sources/);
assert.match(design, /URL and access date/);
assert.match(design, /and what it is not/);
assert.match(design, /user's expectation of it/);
assert.match(design, /NEEDS-EVIDENCE/);
assert.match(design, /never a guess/);
assert.match(design, /never an invented citation/);
// the gate replaces the old "no per-feature research" stance with a boundary
assert.match(design, /No market or competitive research/);

// ── O20 — implicit case decomposition before the Product half is cut ────────

assert.match(design, /implicit case decomposition/);
assert.match(design, /valid and invalid values and limits/);
assert.match(design, /interaction\s+states/);
assert.match(design, /degraded mode/);
assert.match(design, /backend validation\/filtering\/parsing/);
assert.match(design, /alternate\s+user\s+paths/);
assert.match(design, /phone number input/);

// research-before-encode: platform semantics are verified before a test
// encodes them (the prevention half of the test-immutability contract)
assert.match(design, /verified against authoritative documentation before the test exists/);

// ── O2 — fetched web sources are citable evidence rows ──────────────────────

assert.match(rows, /fetched external documentation/);
assert.match(rows, /URL plus access date/);
assert.match(grounding, /Web pass/);
assert.match(grounding, /URL and access date/);

// ── O3 — plan-stage research is conditional on an unanswered question ───────

for (const [name, text] of [["plan-fix", planFix], ["plan-feature-scaffold", scaffold]]) {
  assert.match(text, /cannot be answered from repository evidence/, `${name}: conditional trigger`);
  assert.match(text, /exactly one web pass/, `${name}: one web pass`);
  assert.match(text, /is never re-fetched/, `${name}: no re-fetch`);
}

// ── O19 — the reference trace derives the blast radius from a search ────────

for (const [name, text] of [["plan-fix", planFix], ["plan-feature-scaffold", scaffold]]) {
  assert.match(text, /symbol\/reference\s+search/, `${name}: search-based location`);
  assert.match(text, /LSP\/serena when the environment offers it, grep otherwise/, `${name}: tool fallback`);
  assert.match(text, /blast radius is derived from that search/, `${name}: search-derived blast radius`);
  assert.match(text, /never from model memory/, `${name}: not from memory`);
}
assert.match(reviewCode, /Reference trace: every changed symbol\/API got a reference search/);
assert.match(reviewCode, /un-updated callers are findings/);

console.log("PASS authoring-research: the research gate, web evidence rows, conditional plan research, and reference trace hold end to end");
