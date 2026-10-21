#!/usr/bin/env node

/**
 * Fix #303 — the design and plan steps prescribed **positively**.
 *
 * The issue's premise is that a step whose contract is only a prohibition list
 * ("never assume", "never invent an AC") leaves a weak model the whole rest of
 * the space free, and the observed failure is exactly the forbidden one:
 * inventing what it does not know. So this suite pins the positive half —
 * investigate → orient → ask → decide → record — as a contract a model can
 * follow, and pins the checks that catch the invented claim.
 *
 * Two kinds of assertion live here:
 *   * **prose shape** — the references carry every ordered stage and the
 *     fixed output blocks the contract names. A stage missing, renamed, or
 *     nested under another heading is the defect, because the stage slug is
 *     also the journal token (`pre-execution-stage`, the schema package's
 *     `PRE_EXECUTION_STAGES`).
 *   * **behavior** — the ledger shapes the references publish parse with the
 *     real `scripts/needs-input.mjs` ledger reader. Published examples that
 *     the tool's own grammar rejects are the class of drift a prose-only test
 *     cannot see (the minted `| id | gap | … |` row shapes of the first
 *     attempt at this unit had exactly that shape).
 *
 * Read-only over the working tree; deterministic: no network, no wall clock,
 * no model.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { parseLedger, resolvePending } from "./needs-input.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LANE = "skills/unit-lane";
const DESIGN = `${LANE}/references/DESIGN.md`;
const PLAN = `${LANE}/references/PLAN.md`;
const SKILL = `${LANE}/SKILL.md`;
/** The ordered stage set the lane's design and plan steps execute. */
const STAGES = ["investigate", "orient", "ask", "decide"];

const read = (rel) => fs.readFileSync(path.join(REPO, rel), "utf8");

/** The `## `-level headings of a Markdown file, in document order. */
function headings(md) {
  return [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
}

/**
 * The stage slug of a `## Stage <n> — <slug>` heading, or `null`.
 * The heading carries the slug as its last word so the stage is also the
 * journal token a receipt names (`pre-execution-stage`).
 */
function stageSlug(heading) {
  const match = /^Stage \d+ — ([a-z]+)$/.exec(heading);
  return match ? match[1] : null;
}

/** The stage headings a reference carries, in order. */
function stageHeadings(md) {
  return headings(md).filter((heading) => stageSlug(heading) !== null);
}

/** The body of the `## <title>` section, heading line excluded. */
function section(md, title) {
  const lines = md.split("\n");
  const start = lines.findIndex((line) => line === `## ${title}`);
  if (start === -1) return undefined;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^## /.test(line));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

/** The fenced `text` blocks a section carries, opening marker stripped. */
function textBlocks(body) {
  return [...body.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1]);
}

// --- the ordered stages ------------------------------------------------------

test("#303 S1: design and plan state the same four stages, in the same order", () => {
  for (const rel of [DESIGN, PLAN]) {
    assert.deepEqual(
      stageHeadings(read(rel)).map(stageSlug),
      STAGES,
      `${rel} must carry the ordered stages ${STAGES.join(" → ")} as \`## Stage <n> — <slug>\` headings — a ` +
        "stage missing, renamed or nested under another heading is not executable",
    );
  }
});

test("#303 S2: the stage slugs are the journal token, so they never repeat another vocabulary's word", () => {
  // A pre-execution receipt's `stage` is `spec | plan` (PRE_EXECUTION_STAGES):
  // naming a lane stage `plan` would make the visual re-run of that stage
  // unjournalable. `decide` and `record` are outside both closed sets.
  const reserved = new Set(["spec", "plan"]);
  for (const rel of [DESIGN, PLAN]) {
    for (const slug of stageHeadings(read(rel)).map(stageSlug)) {
      assert.ok(!reserved.has(slug), `${rel}: stage slug \`${slug}\` collides with the receipt vocabulary`);
    }
  }
});

// --- orient asks the repository first ---------------------------------------

test("#303 S2: orient runs a provenance search before any claim, and says where it looked", () => {
  for (const rel of [DESIGN, PLAN]) {
    const orient = section(read(rel), stageHeadings(read(rel)).find((heading) => stageSlug(heading) === "orient"));
    assert.ok(orient, `${rel}: no orient stage`);
    assert.match(orient, /provenance/, `${rel}: orient must open with the provenance tier`);
    assert.match(orient, /where you looked|path:line/, `${rel}: orient must record where the search ran`);
  }
});

// --- every claim cites a source or an owner answer ---------------------------

test("#303 S1: every claim in a spec or plan carries a citation or an owner answer — the check the step runs", () => {
  for (const rel of [DESIGN, PLAN]) {
    const md = read(rel);
    const check = md.split("\n").filter((line) => /^- \[ \] Every claim\b.*cites/i.test(line));
    assert.equal(check.length, 1, `${rel} must carry exactly one \`- [ ] Every claim … cites\` checklist item`);
    assert.match(check[0], /\bACs?\b|acceptance criter/i, "the check must name what it covers");
  }
});

test("#303 S1: the prohibit-instead-of-prescribe defect is gone — no stage says 'never assume' in place of a procedure", () => {
  for (const rel of [DESIGN, PLAN]) {
    const md = read(rel);
    assert.doesNotMatch(md, /never assume/i, `${rel}: a bare prohibition still stands where a procedure belongs`);
    assert.match(md, /Never infer|never infer|not in the repository/, `${rel}: the inference ban must be stated as a rule, not as the whole contract`);
  }
});

// --- the fixed output contract carries the questions and their resolutions ---

test("#303 S1: both fixed output contracts carry the questions asked and their resolutions (or an explicit none)", () => {
  for (const rel of [DESIGN, PLAN]) {
    const md = read(rel);
    const anchors = [...md.matchAll(/<!-- ([\w-]+):start -->([\s\S]*?)<!-- \1:end -->/g)];
    const questions = anchors.find((m) => m[1] === "questions");
    assert.ok(questions, `${rel}: the questions section must be a first-class pane of the fixed output contract`);
    assert.match(questions[2], /\|\s*Asked\s*\|\s*Resolution\s*\|/i, `${rel}: the questions table must carry Asked and Resolution`);
    assert.match(questions[2], /none — no questions/i, `${rel}: the explicit-none form must be stated`);
  }
});

test("#303 S1: the references publish the whole unit folder, not only decisions.md", () => {
  for (const rel of [DESIGN, PLAN]) {
    assert.match(read(rel), /BRIEF\.md/, `${rel}: the questions pane lives in BRIEF.md`);
    assert.match(read(rel), /sources\.md/, `${rel}: the citation ledger lives in sources.md`);
  }
});

// --- the published ledger rows are honest and parse with the real reader -----

/** The published `open-questions@1` example block, as a reader input. */
function publishedLedger(rel) {
  // The example is read from the `## Stage 3 — ask` body and completed with the
  // `## Stage 4 — decide` row, because the two stages publish their rows apart:
  // one fence holds what the step asks, the other what it records.
  const md = read(rel);
  const stage = (slug) => md.slice(md.indexOf(`— ${slug}`));
  const ask = stage("ask");
  const block = textBlocks(ask).find((body) => /^open-questions@1$/m.test(body));
  assert.ok(block, `${rel}: no open-questions@1 example — the ledger shape would be unpinned prose`);
  const decision = textBlocks(md.slice(md.indexOf("— decide"))).find((body) => /^D\d/.test(body));
  assert.ok(decision, `${rel}: no decision row published — the resolution half is unpinned`);
  return `${block}\n${decision}`;
}

test("#303 S1: the ledger rows the references publish parse with the real ledger reader", () => {
  for (const rel of [DESIGN, PLAN]) {
    const parsed = parseLedger(publishedLedger(rel));
    assert.ok(parsed.ok, `${rel}: the published ledger is refused by the reader — ${parsed.reason} at ${parsed.where}`);

    const question = parsed.entries.find((entry) => entry.type === "open-question");
    assert.ok(question, `${rel}: the published example carries no open-question row`);
    assert.notEqual(question.searchReceipt, "none", `${rel}: the open question must carry a search receipt`);
    assert.ok(question.options.length >= 2, `${rel}: the question must ride with researched options`);

    const answer = parsed.entries.find((entry) => entry.type === "decision");
    assert.ok(answer, `${rel}: the published example carries no decision row`);
    assert.equal(answer.closes, question.id, `${rel}: the decision row must name the question it closes`);
    assert.equal(answer.authority, "human-owner", `${rel}: only the owner closes a question`);

    const pending = resolvePending(parsed.entries);
    assert.ok(pending.ok, `${rel}: ${pending.reason}`);
    assert.deepEqual(pending.pending, [], `${rel}: the published decision must actually close its question`);
  }
});

// --- the lane's own checklist -------------------------------------------------

test("#303 S1: the lane's turn contract ticks the knowledge-honesty contract", () => {
  const skill = read(SKILL);
  const ticks = skill.match(/^✓ .+$/gm) ?? [];
  assert.ok(
    ticks.some((line) => /cite|citation|source/i.test(line) && /claim|AC|assert/i.test(line)),
    "the turn contract must tick that every claim is cited or owner-answered",
  );
  assert.ok(
    ticks.some((line) => /question/i.test(line) && /answer|resolution|record/i.test(line)),
    "the turn contract must tick that every question asked was recorded with its resolution",
  );
});
