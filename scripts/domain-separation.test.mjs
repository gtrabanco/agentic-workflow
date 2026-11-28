#!/usr/bin/env node
// test-obligation: protects=template/ obligations=convention

/**
 * domain-separation.test.mjs — the machine core of IR7's boundary
 * (owner decision 2026-11-28, the scaffold route of `materialize check`;
 * records: docs/fix/741-domain-separation-machine-core/decisions.md).
 *
 * The one product surface a target project copies wholesale is `template/`;
 * this suite refuses the source repository's project-domain carriers inside
 * that copy:
 *
 *   1. no source-repo issue or PR URLs — e.g. `github.com/gtrabanco/agentic-workflow/issues/123`
 *   2. no concrete source-unit citations — e.g. `docs/features/108-machine-gate-receipts`,
 *      `docs/fix/717-audit-single-repo-leaks` (a concrete slug after the id);
 *      the naming-convention placeholders like `157-<topic>/` are the
 *      product's teaching prose and stay legal by construction
 *   3. no source decision/research-tree citations — e.g.
 *      `docs/research/2026-11-13-tool-doctor-inventory` (the source's own
 *      decision and research carriers; a target's similarly-named tree made
 *      by its own decision is its own surface, never scanned here)
 *
 * Deliberately NOT a rule: `SKILL_CONTEXT_BUDGETS.json`, `docs/LOGS.md`,
 * `docs/ROADMAP.md` and the shared-merge path classes — they are the
 * writer-driver contract's product vocabulary (the merge-driver registry in
 * `template/.gitattributes` arms them for the target's own files), never
 * source-repo identity.
 *
 * Sanctioned source-repo content that stays legal: the npm package names
 * (`@gtrabanco/agentic-workflow(-schema)`), the skills install instruction and
 * its source-repo link (`template/AGENTS.md` § Skills), and the marked source
 * example `scripts/local-gate.mjs` in `template/AGENTS.md` § gate receipt.
 * Every other direction of the boundary — a project decision entering a
 * skills/docs/product surface, a product rule entering a project surface —
 * remains product-audit's person-run domain-drift sweep (IR7, soft by design).
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateRoot = path.join(repoRoot, "template");
const thisFile = fileURLToPath(import.meta.url);

const RULES = Object.freeze({
  "source-issue-pr-url": /github\.com\/gtrabanco\/agentic-workflow\/(issues|pull)\/\d+/gu,
  "source-unit-citation": /docs\/(?:features|fix)\/\d+-[a-z0-9]/gu,
  "source-decision-tree": /docs\/(?:design|research|golden)\//gu,
});

/**
 * Text files template/ ships. Hidden files are included on purpose: a
 * source-repo citation hidden from rg我不想 default no-ignore view
 * (`template/.gitattributes` taught the registry lesson) is exactly the drift
 * this sweep exists to catch.
 */
function templateFiles() {
  const files = [];
  const walk = (abs, rel) => {
    for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(abs, entry.name), entryRel);
      else files.push({ rel: entryRel, abs: path.join(abs, entry.name) });
    }
  };
  walk(templateRoot, "");
  return files.filter(({ abs }) => {
    // text carriers only — binary assets carry no citation to lose
    return /\.(md|json|jsonc|mjs|ts|txt|ya?ml|toml|sh|cjs|example)$/u.test(abs) || !path.extname(abs);
  });
}

test("template/ exists in the tree (the scaffold-purity surface)", () => {
  assert.ok(fs.existsSync(templateRoot), "template/ is the surface this suite pins");
});

for (const [name, rule] of Object.entries(RULES)) {
  test(`template/ carries no ${name}`, () => {
    const files = templateFiles();
    assert.ok(files.length > 0, "template/ has text files to read");
    for (const { rel, abs } of files) {
      const text = fs.readFileSync(abs, "utf8");
      for (const match of text.matchAll(rule)) {
        const line = text.slice(0, match.index).split("\n").length;
        assert.fail(`template/${rel}:${line} matches ${name}: ${match[0]}`);
      }
    }
  });
}

test("the detector itself is not scan-blind (sanity: every rule matches its own header's live example)", () => {
  const self = fs.readFileSync(thisFile, "utf8");
  // the header comment carries one live example per rule shape, so a rule
  // that went inert (escaped wrong, flags lost) fails here instead of
  // passing forever green
  assert.match(self, RULES["source-issue-pr-url"]);
  assert.match(self, RULES["source-unit-citation"]);
  assert.match(self, RULES["source-decision-tree"]);
});

test("the sweep sees hidden files (the .gitattributes lesson)", () => {
  const files = templateFiles();
  assert.ok(files.some(({ rel }) => rel.startsWith(".")), "template/'s hidden text files are in the sweep");
});
