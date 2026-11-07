#!/usr/bin/env node

/**
 * Fix #433 — precondition closure.
 *
 * The design step gains a named closure deliverable beside the
 * three-direction closure: the enumeration of the unit's *operational
 * prerequisites* (data sources, services, endpoints, tables, credentials,
 * environment) as tier-0 claims with search receipts, where confirmed-absent
 * is evidence — never `unknown` — and every confirmed-absent prerequisite
 * routes to the batched ask carrying exactly four options. The plan step
 * sequences prerequisite tasks before their dependants (topology precedes
 * smallest-first), and a dependent task's validator only runs after its
 * prerequisite tasks pass.
 *
 * Assertion classes (the #303/#432 suite's prose-shape discipline, same
 * fixtures discipline: read-only over the working tree, deterministic —
 * no network, no wall clock, no model):
 *   * **rule pins** — the deliverable and the ordering rule are stated where
 *     a design/plan run reads them, with the closed outcome set and the four
 *     options spelled;
 *   * **unchanged-behaviour pins** — the prose contracts the changed files
 *     already carry (the #303 stage order, the #432 provenance ceiling) still
 *     hold after the amendment: an edit that moves a stage heading or drops a
 *     provenance row is a regression, not a rewording.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DESIGN = "skills/unit-lane/references/DESIGN.md";
const PLAN = "skills/unit-lane/references/PLAN.md";
const SKILL = "skills/unit-lane/SKILL.md";

const read = (rel) => fs.readFileSync(path.join(REPO, rel), "utf8");

/** The body of the `## <title>` section, heading line excluded. */
function section(md, title) {
  const lines = md.split("\n");
  const start = lines.findIndex((line) => line === `## ${title}`);
  if (start === -1) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^## /.test(line));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

/** The `### ` subsections of a section body, as {title, body}. */
function subsections(body) {
  const found = [];
  const lines = body.split("\n");
  let current = null;
  for (const line of lines) {
    const match = /^### (.+)$/.exec(line);
    if (match) {
      current = { title: match[1].trim(), lines: [] };
      found.push(current);
    } else if (current) {
      current.lines.push(line);
    }
  }
  return found.map(({ title, lines }) => ({ title, body: lines.join("\n") }));
}

// --- S1/S2: the deliverable exists, beside the three-direction closure -------

function preconditionSection() {
  const md = read(DESIGN);
  const orient = section(md, "Stage 2 — orient");
  assert.ok(orient !== undefined, "DESIGN.md carries the orient stage");
  const closure = subsections(orient).find(({ title }) => /^Precondition closure/.test(title));
  assert.ok(closure, "DESIGN.md §Stage 2 carries a `### Precondition closure` deliverable beside the three-direction closure");
  return closure.body;
}

test("#433 S1: the design stage-2 orient carries the named precondition-closure deliverable, beside the three-direction closure", () => {
  const body = preconditionSection();
  const three = subsections(section(read(DESIGN), "Stage 2 — orient")).find(({ title }) =>
    /Three-direction closure/.test(title),
  );
  assert.ok(three, "the three-direction closure it sits beside is still there");
  const classes = ["data sources", "services", "endpoints", "tables", "credentials", "environment"];
  for (const cls of classes) {
    assert.ok(body.includes(cls), `the deliverable names the operational-prerequisite class "${cls}"`);
  }
  assert.match(body, /tier-0/, "each prerequisite is a tier-0 claim");
  assert.match(body, /search receipt/i, "each prerequisite carries a search receipt");
});

test("#433 S2: each prerequisite resolves to the closed three-outcome set, and confirmed-absent is evidence, never `unknown`", () => {
  const body = preconditionSection();
  assert.match(body, /exists \(path:line\)/, "outcome 1: exists, cited at path:line");
  assert.match(body, /confirmed-absent \(demonstrated search\)/, "outcome 2: confirmed-absent, backed by a demonstrated search");
  assert.match(body, /owner-answered/, "outcome 3: owner-answered");
  assert.match(body, /never `unknown`/, "confirmed-absent is evidence — it never degrades to `unknown`");
});

// --- S3: the four-option ask -------------------------------------------------

test("#433 S3: every confirmed-absent prerequisite enters the batched ask with exactly the four options recorded", () => {
  const body = preconditionSection();
  assert.match(body, /four options/i, "the ask carries exactly four options");
  assert.match(body, /owner provides the resource/, "option (a): owner provides the resource");
  assert.match(body, /declared twice/, "option (b): a promoted dependency is declared twice");
  assert.match(body, /blocked-by/, "option (b): the native blocked-by relationship is the machine half of the declaration");
  assert.match(body, /prerequisite task/, "option (c): build it inside this unit as a prerequisite task");
  assert.match(body, /change scope|scope\/AC|change the scope/i, "option (d): change scope/AC");
});

test("#433 S3: the four-option ask rides the open-questions@1 block the ask stage appends — no new grammar", () => {
  const body = preconditionSection();
  assert.match(body, /open-questions@1/, "the ask lands in the ledger block the dispatcher reads");
  assert.match(body, /Stage 3|ask stage|batched ask/i, "the ask names the stage that owns it");
});

// --- S4: the plan's ordering rule ---------------------------------------------

test("#433 S4: the plan sequences prerequisite tasks before their dependants — topology precedes smallest-first", () => {
  const md = read(PLAN);
  assert.match(md, /topolog/i, "PLAN.md states the topological rule");
  assert.match(md, /smallest-first|smallest within a ready set|smallest first/i, "smallest-first survives, bounded to a ready set");
  assert.match(
    md,
    /prerequisite tasks?\s+\*\*?before\*\*?\s+their dependants?|prerequisite.{0,40}before their dependants?/i,
    "the ordering is stated as prerequisite-before-dependent",
  );
});

test("#433 S4: a dependent task's validator only runs after its prerequisite tasks pass", () => {
  const md = read(PLAN);
  assert.match(
    md,
    /dependent task's validator only runs after its prerequisite tasks pass/,
    "the validator-ordering half of the rule is stated in the plan step, not left to execution luck",
  );
});

// --- S5: the one-shot half-coverage routes to the project charter -------------

test("#433 S5: a one-shot unit half-covered by the closure gets its project-level answer from the project charter; the per-unit remainder still asks", () => {
  const body = preconditionSection();
  assert.match(body, /project charter/i, "the charter is named as the project-level answer");
  assert.match(body, /still asks|remainder still asks/i, "the per-unit remainder still asks — the charter never absorbs it");
});

// --- unchanged-behaviour pins: the amendment moves nothing it must not --------

test("#433 (differential): the #303 stage order and the #432 provenance anchors survive the amendment", () => {
  for (const rel of [DESIGN, PLAN]) {
    const md = read(rel);
    const stages = [...md.matchAll(/^## Stage \d+ — ([a-z]+)$/gm)].map((m) => m[1]);
    assert.deepEqual(stages, ["investigate", "orient", "ask", "decide"], `${rel}: the ordered stages are untouched`);
  }
  const md = read(DESIGN);
  assert.match(md, /\| `model memory` \|/, "the #432 provenance-kind table keeps its model-memory row");
  assert.match(md, /never `confirmed`, and never tier-0/, "the #432 ceiling rule keeps its single-owner statement");
  assert.match(md, /ask-dont-infer@1/, "the no-assumption rule's owner block stays in DESIGN.md");
});

test("#433 (differential): the deliverable is prose, not a versioned block — no new grammar enters the normative surfaces", () => {
  for (const rel of [DESIGN, PLAN]) {
    const md = read(rel);
    assert.doesNotMatch(md, /```text\nprecondition-closure@/, `${rel}: no precondition-closure@1 block — the deliverable needs no new grammar (#435 precedent)`);
  }
});

test("#433 (differential): the lane conductor's design-step pointer names the new deliverable without restating it", () => {
  const skill = read(SKILL);
  const pointer = skill.split("\n").find((line) => /design.*step carries/.test(line));
  assert.ok(pointer, "SKILL.md §3 keeps the carries-it pointer line");
  assert.match(read(SKILL), /precondition closure/i, "SKILL.md §3 names the precondition closure");
  assert.match(read(SKILL), /DESIGN\.md/, "the pointer names the owner file — never a restatement");
});
