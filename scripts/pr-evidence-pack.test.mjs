#!/usr/bin/env node

/**
 * #318 S3/S7 — the PR body is an evidence pack, and both shipped templates say so.
 *
 * `audit-pr` blocks a PR whose acceptance criteria lack a demonstration, so the
 * template the author fills has to carry a place for that demonstration and the
 * two audience layers the gate distinguishes (human layer the approver reads,
 * technical layer the gate checks). The authoring repo's template and the
 * exportable scaffold are two copies of that contract: a fix landing in one and
 * not the other is the surviving-sibling class this suite exists to stop.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const TEMPLATES = Object.freeze([
  ".github/PULL_REQUEST_TEMPLATE.md",
  "template/.github/PULL_REQUEST_TEMPLATE.md",
]);

const read = (relative) => fs.readFileSync(path.join(repoRoot, relative), "utf8");

test("#318 S7: every shipped PR template carries the generated evidence pack", () => {
  for (const template of TEMPLATES) {
    const text = read(template);
    assert.match(text, /^## Evidence pack/m, `${template} has no evidence-pack section`);
    assert.match(text, /generated from the unit doc/i,
      `${template} must state the body is generated, never re-typed by hand`);
  }
});

test("#318 S3/S7: both audience layers are present in every template", () => {
  for (const template of TEMPLATES) {
    const text = read(template);
    assert.match(text, /^### Human layer/m,
      `${template} has no human layer for the non-technical approver`);
    assert.match(text, /^### Technical layer/m,
      `${template} has no technical layer for the merge gate`);
  }
});

test("#318 S3: the technical layer is the AC -> demonstration table audit-pr checks", () => {
  for (const template of TEMPLATES) {
    const text = read(template);
    const row = /^\| AC \| demonstration[^|]*\| observed \|$/m;
    assert.match(text, row, `${template} must carry the AC | demonstration | observed table`);
    assert.match(text, /^\|---\|---\|---\|$/m,
      `${template}'s demonstration table needs its header separator`);
  }
});

test("#318 S7: the why travels with the what — decisions and resolved ask-gates", () => {
  for (const template of TEMPLATES) {
    const text = read(template);
    assert.match(text, /^### Decisions and resolved ask-gates/m,
      `${template} must record decisions and the questions asked`);
    assert.match(text, /\*\*Asked:\*\*.*\*\*Answered:\*\*/s,
      `${template} must pair every ask with its answer so nothing looks invented`);
    assert.match(text, /New contract:/,
      `${template} must name where a coined contract is documented (document-or-don't-coin)`);
  }
});

test("#318 the two template copies agree on the evidence-pack contract", () => {
  // Not byte-equality — the authoring template carries extra repo sections — but
  // the pack itself is one contract, so its headings must match exactly.
  const packOf = (text) => {
    const start = text.indexOf("## Evidence pack");
    assert.ok(start !== -1, "evidence pack present");
    return text.slice(start).match(/^#{2,3} .+$/gm);
  };
  const [authoring, scaffold] = TEMPLATES.map((template) => packOf(read(template)));
  assert.deepEqual(scaffold, authoring,
    "both templates publish the same evidence-pack headings, in the same order");
});
