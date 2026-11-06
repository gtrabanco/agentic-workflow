/**
 * journal.surfaces.test.mjs — the carrier's prose contracts (issue #405,
 * AC7/AC9; unit docs/fix/405-journal-fragments/).
 *
 * The code contracts live in `journal.test.mjs`; this suite pins the two that
 * are prose-shaped:
 *
 *  - **AC7 — consent-gated, opt-in, off by default.** The template ships the
 *    carrier's *documentation* and the CI example — never the carrier
 *    directory, never an active workflow file — so a wholesale scaffold copy
 *    opts nobody in, and the init-workspace consent step says exactly that.
 *  - **AC9 — one grammar owner.** Every consumer-facing prose surface that
 *    talks about the fragment layout names `journal-fragment-grammar@1`'s
 *    owner (the runner crate's README block) instead of restating the
 *    grammar — the repository's single-owner rule, applied to a surface that
 *    would otherwise grow a second hand-rolled grammar.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseFragmentName } from "../src/journal/fragment.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const read = (...parts) => fs.readFileSync(path.join(repoRoot, ...parts), "utf8");

// ── AC7 — the template ships documentation, never an opt-in ──────────────

test("AC7 the template ships no carrier directory and no active workflow", () => {
  assert.equal(fs.existsSync(path.join(repoRoot, "template/.agentic-workflow/journal")), false, "no carrier directory in the template");
  assert.equal(fs.existsSync(path.join(repoRoot, "template/.github/workflows/agentic-workflow-journal.yml")), false, "no active workflow");
  assert.equal(fs.existsSync(path.join(repoRoot, "template/.github/workflows/agentic-workflow-journal.yml.example")), true, "only the .example ships");
  assert.equal(fs.existsSync(path.join(repoRoot, "template/.agentic-workflow/journal.md")), true, "the carrier doc ships");
});

test("AC7 the carrier doc states the consent-gated install and the writer flip", () => {
  const doc = read("template", ".agentic-workflow", "journal.md");
  assert.match(doc, /consent-gated/iu);
  assert.match(doc, /opt-in/iu);
  // Open question 6: the writer flip is one table, not prose folklore.
  assert.match(doc, /\| Writer \|/u);
  for (const writer of ["log-session-end.sh", "autoLogSession", "/log-session", "aggregator"]) {
    assert.match(doc, new RegExp(writer.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"), `the writer table names ${writer}`);
  }
});

test("AC7 the init-workspace consent step: a no writes nothing", () => {
  const skill = read("skills", "init-workspace", "SKILL.md");
  assert.match(skill, /opt-in, off by default \(issue #405\)/u);
  assert.match(skill, /a no writes nothing — no directory, no workflow,\s+no config/u);
  assert.match(skill, /never the carrier directory itself/u);
});

// ── AC9 — one grammar owner, named everywhere it is needed ───────────────

const OWNER_BLOCK = "journal-fragment-grammar@1";
const OWNER = "packages/agentic-workflow/README.md";

test("AC9 the owner block exists in the crate README and is the declared normative surface", () => {
  const readme = read("packages", "agentic-workflow", "README.md");
  const fenced = /```text\njournal-fragment-grammar@1\n([\s\S]*?)```/u.exec(readme);
  assert.ok(fenced, "the owner block exists as a versioned grammar");
  assert.match(fenced[1], /fragment-name \|/u);
  // The drift gate's inventory declares the surface.
  assert.match(read("AGENTS.md"), new RegExp(`journal-fragment-grammar \\| ${OWNER.replace(/\//g, "\\/")} \\| block:${OWNER_BLOCK}`));
});

test("AC9 every consumer-facing prose surface names the owner instead of restating the grammar", () => {
  const surfaces = [
    ["template", ".agentic-workflow", "journal.md"],
    ["template", "AGENTS.md"],
    ["skills", "init-workspace", "SKILL.md"],
    ["skills", "log-session", "SKILL.md"],
  ];
  for (const parts of surfaces) {
    const text = read(...parts);
    assert.match(text, new RegExp(OWNER_BLOCK), `${path.join(...parts)} names the grammar id`);
    assert.match(text, /@gtrabanco\/agentic-workflow/u, `${path.join(...parts)} names the owner crate`);
    // No second hand-rolled grammar: no surface re-declares the name shape.
    assert.doesNotMatch(text, /<utc-second>-<branch-slug>-<kind>-<session-slug>/u, `${path.join(...parts)} restates the name grammar`);
  }
});

test("AC9 the CI example and the post-receive example invoke the identical command (AC5)", () => {
  const workflow = read("template", ".github", "workflows", "agentic-workflow-journal.yml.example");
  const doc = read("template", ".agentic-workflow", "journal.md");
  const argv = /journal aggregate/u;
  assert.match(workflow, argv);
  assert.match(doc, argv);
  // Forge-free by contract: the crate module never names a forge.
  const dir = path.join(repoRoot, "packages", "agentic-workflow", "src", "journal");
  const hits = fs.readdirSync(dir).filter((file) => file.endsWith(".mjs"));
  assert.ok(hits.length > 0, "the journal modules exist");
  for (const file of hits) {
    assert.doesNotMatch(fs.readFileSync(path.join(dir, file), "utf8"), /github|gitlab|forge/iu, `${file} knows no forge`);
  }
});

// ── The repository's own carrier (S15): only fragments live there ─────────

test("S15 the opted-in carrier holds only parseable fragments and its doc sits beside it", () => {
  const carrier = path.join(repoRoot, ".agentic-workflow", "journal");
  const entries = fs.readdirSync(carrier, { withFileTypes: true }).filter((entry) => entry.isFile());
  for (const entry of entries) {
    const parsed = parseFragmentName(entry.name);
    assert.ok(parsed !== null, `${entry.name} is not a fragment — the aggregator refuses the whole set`);
    const body = fs.readFileSync(path.join(carrier, entry.name), "utf8");
    assert.ok(body.startsWith("## "), `${entry.name} is not an entry block`);
    assert.ok(body.endsWith("\n") && !body.includes("\r"), `${entry.name} is not a newline-terminated CR-free block`);
  }
  assert.ok(fs.existsSync(path.join(repoRoot, ".agentic-workflow", "journal.md")), "the carrier's doc lives beside the carrier");
  assert.equal(fs.existsSync(path.join(carrier, "README.md")), false, "never inside it — the aggregator would refuse every run");
});
