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
  for (const writer of ["log-session-end.sh", "logSession", "/log-session", "aggregator"]) {
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
    // The carrier's ONE declared placeholder (issue #374 D13): git cannot
    // track an empty directory, so the opted-in carrier keeps a zero-byte
    // .gitkeep — the aggregator skips it, never consumes it. Notes belong in
    // the carrier's doc beside it (`journal.md`), never inside the carrier.
    // Anything else that is not a fragment still fails this probe.
    if (entry.name === ".gitkeep") {
      assert.equal(fs.readFileSync(path.join(carrier, entry.name), "utf8"), "", ".gitkeep is an empty placeholder, not a readme");
      continue;
    }
    const parsed = parseFragmentName(entry.name);
    assert.ok(parsed !== null, `${entry.name} is not a fragment — the aggregator refuses the whole set`);
    const body = fs.readFileSync(path.join(carrier, entry.name), "utf8");
    assert.ok(body.startsWith("## "), `${entry.name} is not an entry block`);
    assert.ok(body.endsWith("\n") && !body.includes("\r"), `${entry.name} is not a newline-terminated CR-free block`);
  }
  assert.ok(fs.existsSync(path.join(repoRoot, ".agentic-workflow", "journal.md")), "the carrier's doc lives beside the carrier");
  assert.equal(fs.existsSync(path.join(carrier, "README.md")), false, "never inside it — the aggregator would refuse every run");
});

// ── issue #374 — the canonical entry + the driver contract's owner ────────

test("374 AC9 the entry contract's owner is the schema package, declared as a normative surface", () => {
  const agents = read("AGENTS.md");
  assert.match(agents, /journal-entry-contract \| packages\/agentic-workflow-schema\/src\/journal\.ts \| schema-export:JOURNAL_ENTRY_KINDS \| journal-entry/u);
  assert.match(agents, /journal-driver-contract \| packages\/agentic-workflow\/README\.md \| block:journal-driver-contract@1/u);
});

test("374 AC9 the driver-contract block exists in the crate README and names the entry type's owner", () => {
  const readme = read("packages", "agentic-workflow", "README.md");
  const fenced = /```text\njournal-driver-contract@1\n([\s\S]*?)```/u.exec(readme);
  assert.ok(fenced, "the owner block exists as a versioned grammar");
  for (const row of ["append |", "query |", "render |", "guarantee |", "metadata-line |", "driver |", "conformance |"]) {
    assert.match(fenced[1], new RegExp(row.replace(/\|/gu, "\\|")), `the block orders ${row.trim()}`);
  }
  assert.match(readme, /@gtrabanco\/agentic-workflow-schema/u, "the crate README names the schema package as the entry type's owner");
});

test("374 AC9 the carrier doc's forward note names the landed owner, not the future tense", () => {
  const doc = read("template", ".agentic-workflow", "journal.md");
  assert.match(doc, /journal-driver-contract@1/u, "the forward note names the contract's owner");
  assert.doesNotMatch(doc, /When the workflow's pluggable store-driver contract for the journal lands/u, "the landed contract is not described as pending");
});

// ── issue #676 — the errata marker's one owner ───────────────────────────

test("676 the errata marker is resident in the schema package and declared as a normative surface", async () => {
  assert.match(
    read("AGENTS.md"),
    /journal-errata-marker \| packages\/agentic-workflow-schema\/src\/journal\.ts \| schema-export:JOURNAL_ERRATA_MARKERS \| journal-errata-marker/u,
    "the inventory declares the block cell's vocabulary under its published owner",
  );
  const schema = await import("../../agentic-workflow-schema/dist/index.js");
  const { renderEntryBlock, supersedesOf } = await import("../src/journal/block.mjs");
  assert.deepEqual(schema.JOURNAL_ERRATA_MARKERS, ["Supersedes"], "the marker's closed set is the schema package's, never a second copy");
  const facts = { timestamp: "2026-11-05T10:00:00Z", branch: "feat/x", label: "narrative", summary: "the correction" };
  assert.equal(supersedesOf(renderEntryBlock(facts)), null, "an entry that corrects nothing carries no cell");
  const stale = "20261105T100000Z-feat-x-narrative-s1.md";
  assert.equal(supersedesOf(renderEntryBlock({ ...facts, supersedes: stale })), stale, "the block owner renders the cell the vocabulary publishes");
});

// ── the 2026-11-22 correction batch (EXTERNAL VERIFY B2/B3) ──────────────

test("676 no sibling surface still asserts the old slot rule", () => {
  const readme = read("packages", "agentic-workflow", "README.md");
  const row = readme.split("\n").find((line) => line.startsWith("| `journal aggregate "));
  assert.ok(row, "the command table carries the journal aggregate row");
  assert.doesNotMatch(row, /holding more than one fragment/u, "the command row states the chain rule, not the pre-#676 slot rule");
  assert.match(row, /not one entry plus its declared corrections/u, "the command row names the rule the lint reads");
  const crate = read("packages", "agentic-workflow", "src", "journal", "aggregate.mjs");
  assert.doesNotMatch(crate, /holding more than one conforming fragment/u, "the module doc no longer asserts the pre-#676 truth beside its chain bullet");
  assert.match(crate, /plus the corrections that declare it/u, "the module doc carries the chain rule");
});

test("374 the crate's entry codec carries the schema package's contract ids verbatim", async () => {
  const schema = await import("../../agentic-workflow-schema/dist/index.js");
  const crate = await import("../src/journal/entry.mjs");
  assert.equal(crate.JOURNAL_ENTRY_CONTRACT_ID, schema.JOURNAL_ENTRY_CONTRACT_ID);
  assert.equal(crate.JOURNAL_ENTRY_VERSION, schema.JOURNAL_ENTRY_VERSION);
  assert.deepEqual(crate.JOURNAL_ENTRY_KINDS, schema.JOURNAL_ENTRY_KINDS);
});

// ── the 2026-11-25 correction batch (EXTERNAL VERIFY B3–B5) ──────────────

// A consumer copying any of the three wiring surfaces gets a command that runs:
// each names the CI condition the aggregate door enforces, so a copied recipe is
// never refused for a context its own doc omitted.
test("706 no sibling wiring surface still asserts the pre-#706 invocation parity", () => {
  const prose = (text) => text.split("\n").map((line) => line.replace(/^\s*(?:\*|#)\s?/u, "")).join(" ");
  const crate = prose(read("packages", "agentic-workflow", "src", "journal", "aggregate.mjs"));
  assert.doesNotMatch(crate, /run the same `journal aggregate` command unchanged/u, "the module doc states the CI context, not the pre-#706 'unchanged' parity");
  assert.match(crate, /CI/u, "the module doc names the CI condition a run needs");
  const bin = prose(read("packages", "agentic-workflow", "bin", "agentic-workflow.mjs"));
  assert.doesNotMatch(bin, /`journal aggregate` unchanged/u, "the CLI header states the CI context, not the pre-#706 'unchanged' parity");
  assert.match(bin, /CI=true/u, "the CLI header names the hook's CI=true context");
  const example = prose(read("template", ".github", "workflows", "agentic-workflow-journal.yml.example"));
  assert.doesNotMatch(example, /the same command a post-receive hook runs/u, "the wiring example states the CI context, not the pre-#706 parity");
  assert.match(example, /CI=true/u, "the wiring example names the CI condition both doors need");
});
