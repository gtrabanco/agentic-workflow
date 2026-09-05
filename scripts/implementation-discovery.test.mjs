#!/usr/bin/env node

/**
 * Feature 29 — bounded implementation discovery: the text contract as a BLACK BOX.
 *
 * `skills/implementation-discovery/SKILL.md` is the single authoritative owner of
 * the pre-write mapper's contract. Nothing may define the seven questions, the
 * fixed map, the four verdicts, or the inline/fresh route elsewhere. This suite
 * parses and executes that SKILL.md text (the portable contract surface) and
 * rejects any drift that would let a phase write before the map closes.
 *
 * The suite is RED-FIRST: it parses the contract the executor must produce. A
 * helper `section` extracts one `## Heading` body so assertions stay honest —
 * they assert the contract's own wording, never a value the executor wrote into
 * the test.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKILL_PATH = "skills/implementation-discovery/SKILL.md";
const skillText = () => fs.readFileSync(path.join(repoRoot, SKILL_PATH), "utf8");
const read = (relative) => fs.readFileSync(path.join(repoRoot, relative), "utf8");

/** Pull one `## Heading` section body up to the next `## ` heading, with runs of
 * whitespace collapsed to a single space so line-wrapped prose still matches. */
function section(text, heading) {
  const idx = text.indexOf(`## ${heading}`);
  if (idx < 0) return "";
  const body = text.slice(idx + `## ${heading}`.length);
  const next = body.indexOf("\n## ");
  const block = next < 0 ? body : body.slice(0, next);
  return block.replace(/\s+/g, " ");
}

const SEVEN_QUESTIONS = [
  /entry points and (public\/)?internal interfaces own current behaviour/i,
  /callers, adapters, roles, compatibility surfaces, and failure paths[\s\S]*?affect/i,
  /helpers, patterns, decisions, and invariants constrain the change/i,
  /tests, fixtures, probes, and production-like scenarios establish current behaviour/i,
  /which exact writes are expected, and which reviewed obligation does each serve/i,
  /planning-evidence claims and Plan assumptions.*?(confirm|refine|contradict)ed?/i,
  /relevant unknowns remain, who owns them, and what evidence resolves them/i,
];

const MAP_FIELDS = [
  "Map revision", "Source identity", "Authority", "Planning evidence",
  "Obligations", "Entry points", "Affected surfaces", "Current behaviour",
  "Reuse and constraints", "Expected writes", "Validation",
  "Plan assumptions", "Contradictions", "Unknowns", "Decision",
];

const VERDICTS = ["READY", "REPLAN", "NEEDS-DESIGN", "BLOCKED"];

test("the internal skill is non-user-invocable and not a menu entry", () => {
  const text = skillText();
  assert.match(text, /user-invocable:\s*false/);
  assert.match(text, /not a menu entry|no public command|internal/i);
});

test("the contract names exactly seven fixed evidence questions", () => {
  const text = skillText();
  const body = section(text, "Seven evidence questions") || text;
  for (const q of SEVEN_QUESTIONS) {
    assert.match(body, q, `missing seven-question clause: ${q}`);
  }
  assert.match(text, /seven.*questions/i);
});

test("the fixed implementation map lists every published field", () => {
  const text = skillText();
  const body = section(text, "Fixed implementation map") || text;
  for (const field of MAP_FIELDS) {
    assert.ok(body.includes(field), `map field missing from contract: ${field}`);
  }
});

test("the verdict set is exactly the four closed values", () => {
  const text = skillText();
  const body = section(text, "Verdicts") || text;
  for (const v of VERDICTS) {
    assert.match(body, new RegExp(`\\b${v}\\b`), `verdict missing: ${v}`);
  }
  assert.doesNotMatch(body, /APPROVE|PARTIAL|CANCEL|SKIP/);
});

test("READY requires every field, question, and owned obligation covered", () => {
  const text = skillText();
  const body = section(text, "Verdicts") || text;
  assert.match(body, /every field, question, and owned obligation covered/i);
  assert.match(body, /no material contradiction\/unknown|no material contradiction or unknown/i);
});

test("no file/search/read count may decide the route or the verdict", () => {
  const text = skillText();
  assert.doesNotMatch(text, /file\s+count\s+(threshold|limit|cap)\s+decides/i);
  assert.doesNotMatch(text, /read\s+count\s+(threshold|limit|cap)\s+decides/i);
  assert.match(text, /No file-count threshold participates in the route or the verdict/i);
});

test("a fresh mapper is required for cross-layer/public/security/compatibility work", () => {
  const text = skillText();
  const body = section(text, "Inline and fresh routing") || text;
  assert.match(body, /fresh/i);
  assert.match(body, /(cross-module|cross-layer|public|persistence|security|recovery|compatibility)/i);
});

test("the cheapest relevant observed read-only falsification probe precedes READY", () => {
  const text = skillText();
  const body = section(text, "Early falsification") || text;
  assert.match(body, /cheapest relevant read-only/i);
  assert.match(body, /observed result/i);
  assert.match(body, /unavailable/i);
});

test("repeated search/read without new question or evidence is a no-progress stop", () => {
  const text = skillText();
  const body = section(text, "No-progress") || text;
  assert.match(body, /no-progress|new question/i);
  assert.match(body, /Conclusion once/i);
  assert.match(body, /changed source revision|new question|insufficient evidence|contradiction/i);
});

test("the mapper is read-only and creates no forge issue, schema, or committed map", () => {
  const text = skillText();
  assert.match(text, /read-only/i);
  assert.match(text, /no forge|never calls the forge|no automatic issue/i);
  assert.doesNotMatch(text, /create an issue|raise an issue|opens?\s+an?\s+issue/i);
});

test("the writer handoff is compact and carries confirmed planning-evidence ids", () => {
  const text = skillText();
  const body = section(text, "Writer handoff") || text;
  assert.match(body, /compact/i);
  assert.match(body, /planning-evidence[\s\S]*?ids?/i);
  assert.match(body, /raw\s+exploration/i);
});

// ── P2 — gate the first phase write: the mapper runs before any repository write ──

test("the mapper is settled after read-only gates and before the first build-ready write", () => {
  // PREFLIGHT reference: the reserved slot now names the mapper contract.
  const preflight = read("skills/execute-phase/references/PREFLIGHT.md");
  assert.match(preflight, /implementation-discovery/i);
  assert.match(preflight, /first write/i);
  // The executor hard rule names the mapper on the pre-write route.
  const exec = read("skills/execute-phase/SKILL.md");
  assert.match(exec, /implementation-discovery/i);
  assert.match(exec, /before branch creation, planning commit, or source\/test edit|before any repository write/i);
});

test("source identity is exact HEAD plus clean-source proof and a cited-content manifest", () => {
  const text = skillText();
  assert.match(text, /HEAD/);
  assert.match(text, /clean-?source|clean tracked/i);
  assert.match(text, /cited-?evidence manifest|manifest digest/i);
});

test("continuity accepts unchanged HEAD or one allowlisted-descendant planning commit", () => {
  const text = skillText();
  assert.match(text, /HEAD is unchanged|unchanged HEAD/);
  assert.match(text, /one direct descendant|direct descendant/i);
  assert.match(text, /allowed planning|allowlist|reviewed planning/i);
  assert.match(text, /reject|invalidates|remap/i);
});

test("READY is single-consumption; a crash before/after first write has exact semantics", () => {
  const text = skillText();
  assert.match(text, /single-?consumption/);
  assert.match(text, /crash/);
  assert.match(text, /remap|re-?map/);
});

test("a newly required path, changed evidence, or contradiction stops and remaps", () => {
  const text = skillText();
  assert.match(text, /newly discovered path|unexpected path|new path|newly required path/i);
  assert.match(text, /stops and remaps|stops and routes|remap/i);
});
