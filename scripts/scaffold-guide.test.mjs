#!/usr/bin/env node

/**
 * scaffold-guide.test.mjs — the template's own guide is neutral, visible and undated.
 *
 * `template/AGENTS.md` is the substrate `init-workspace` interviews and copies into
 * a target project, so three defect classes matter more there than anywhere else
 * (issue #332, revision items T1, T2, T3, T6):
 *
 *   one document, one H1 — a `#` in the middle re-parents every later section;
 *   nothing hidden — an optional block inside an HTML comment is invisible in the
 *     rendered file the reader actually gets;
 *   no tombstones — a fresh copy carries no row for a tool that no longer exists;
 *   no vendor — a scaffold that hard-wires one platform's hook directory teaches
 *     a project that its platform is the only one;
 *   no dates — `feature 61` or `issue #308` cannot resolve inside a copied file,
 *     so it ages into noise.
 *
 * The structural checks are functions over the file text, so each refusal case is
 * pinned against a mutated copy instead of trusted. Nothing here writes the tree.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATE = "template/AGENTS.md";

const guide = () => fs.readFileSync(path.join(ROOT, TEMPLATE), "utf8");

/** `# ` headings outside fenced blocks — the document's own title structure. */
const h1s = (text) => {
  const out = [];
  let fence = null;
  for (const line of text.split("\n")) {
    const run = /^\s*(`{3,})/.exec(line);
    if (run) {
      fence = fence === null ? run[1] : null;
      continue;
    }
    if (fence !== null) continue;
    if (/^# \S/.test(line)) out.push(line.trim());
  }
  return out;
};

/** The HTML comments a rendered viewer would never show. */
const hiddenBlocks = (text) => [...text.matchAll(/<!--([\s\S]*?)-->/g)].map((match) => match[1]);

/** Dated repository internals — meaningless inside a project that copied the file. */
const INTERNAL_IDS = [/\bfeature[ -]\d+\b/i, /\bissue #\d+\b/i, /\bD-\d+-\d+\b/];

/**
 * The notation rule quotes `feature 12` and `issue #12` on purpose — it teaches
 * the two number spaces. Everywhere else an id is a citation into this
 * repository's history, which a copied file cannot resolve.
 */
const NOTATION_OPEN = /Notation — forge numbers/;
const datedIds = (text) => {
  const hits = [];
  let inNotation = false;
  for (const raw of text.split("\n")) {
    if (NOTATION_OPEN.test(raw)) inNotation = true;
    else if (inNotation && /^\*\*[A-Z]/.test(raw.trim())) inNotation = false;
    if (inNotation) continue;
    for (const pattern of INTERNAL_IDS) {
      const match = pattern.exec(raw);
      if (match) hits.push(match[0]);
    }
  }
  return hits;
};

/** The section body of `## <heading>`, fenced content included. */
const section = (text, heading) => {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => line.trim().startsWith(`## ${heading}`));
  if (start === -1) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^## /.test(line));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
};

// ---------------------------------------------------------------------------
// 1. Structure: one H1, nothing hidden
// ---------------------------------------------------------------------------

test("the template guide carries exactly one H1 (T1)", () => {
  const titles = h1s(guide());
  assert.equal(titles.length, 1, `the template carries ${titles.length} H1 headings: ${titles.join(" | ")}`);
  assert.equal(titles[0], "# AGENTS.md", "the single H1 is the document title");
});

test("the optional docs-site block is a visible section, not a comment (T1)", () => {
  const text = guide();
  const body = section(text, "Docs site");
  assert.ok(body !== null, "the template declares `## Docs site` as a section");
  const heading = text.split("\n").find((line) => line.trim().startsWith("## Docs site"));
  assert.match(heading, /optional/i, "the section says in its own heading that it is optional");
  assert.match(body, /```/, "the block is visibly fenced, so it renders in a copied file");
  assert.match(body, /format:/, "the block's slots are visible, not hidden");
  for (const hidden of hiddenBlocks(text)) {
    assert.ok(!/format:|content-dir:|docs site/i.test(hidden),
      "no optional block hides inside an HTML comment");
  }
});

test("a mid-document H1 or a hidden block is refused by the same readers", () => {
  const broken = `${guide()}\n# Docs site\n`;
  assert.equal(h1s(broken).length, 2, "a second H1 is seen as a second title");
  const commented = '## Docs site\n\n<!--\n- format: starlight\n-->\n';
  assert.match(hiddenBlocks(commented)[0] ?? "", /format:/, "the hidden block is the defect the check names");
});

// ---------------------------------------------------------------------------
// 2. No tombstones, no vendor, no dates
// ---------------------------------------------------------------------------

test("the documentation map carries no tombstone row (T2)", () => {
  const body = section(guide(), "Documentation map");
  assert.ok(body !== null, "the template declares a `## Documentation map`");
  assert.ok(!/deprecated/i.test(body), "the map carries no row marked deprecated");
  assert.ok(!/generate-docs/i.test(body), "the map carries no row for a removed skill");
});

test("the session log names adapters instead of hard-wiring one platform (T3)", () => {
  const body = section(guide(), "Session log");
  assert.ok(body !== null, "the template declares a `## Session log`");
  assert.ok(!/\.claude\//.test(body), "the scaffold hard-wires one platform's hook directory");
  assert.match(body, /\/log-session/, "the manual writer is named");
  assert.match(body, /adapter|manual log|platform/i,
    "the automatic writer is named as a platform adapter or as a manual fallback");
});

test("the copied text names no dated repository internal (T6)", () => {
  assert.deepEqual(datedIds(guide()), [], "a copied file carries no `feature N`, `issue #N` or `D-N-N`");
});

test("a dated id is refused by the same reader", () => {
  assert.deepEqual(datedIds("The shape landed in feature 61 (issue #308, D-40-14)."),
    ["feature 61", "issue #308", "D-40-14"], "the three internal shapes are the ones the check refuses");
});

// ---------------------------------------------------------------------------
// 3. The shape the template declares is the shape it ships (T4's precondition)
// ---------------------------------------------------------------------------

test("the template guide declares the re-cut unit-doc shape (T4)", () => {
  const text = guide();
  const body = section(text, "Workflow conventions");
  assert.ok(body !== null, "the template declares `## Workflow conventions`");
  assert.match(body, /spec-by-reference/, "the re-cut shape is named");
  assert.match(body, /`Specs`/, "the shape's first section is named");
  assert.match(body, /`Log`/, "the shape's history section is named");
  for (const template of [
    "template/docs/features/_TEMPLATE/SPEC.md",
    "template/docs/fix/_TEMPLATE/SPEC.md",
  ]) {
    const doc = fs.readFileSync(path.join(ROOT, template), "utf8");
    assert.match(doc, /^## Specs$/m, `${template} ships the shape the guide declares`);
  }
});
