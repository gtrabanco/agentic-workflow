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

// --- #432: model memory is never tier-0 ---------------------------------------
// The journal's provenance column and the certainty ceiling are the evidence
// layer of the no-assumption rule above: they make it checkable row by row.

const GATE_INVENTORY = "docs/workflow/GATE_INVENTORY.md";
const RESEARCH = "skills/unit-lane/references/RESEARCH.md";

/** The four provenance kinds, in the closed order both journal tables spell. */
const PROVENANCE_SET = "repository / version-pinned doc / owner answer / model memory";

test("#432 S1: the design and plan journals record provenance over the closed four-kind set", () => {
  for (const rel of [DESIGN, PLAN]) {
    const md = read(rel);
    assert.match(md, /\| id \| claim \| source \| provenance \| certainty \|/, `${rel}: the journal table carries the provenance column`);
    assert.ok(md.includes(PROVENANCE_SET), `${rel}: the row shape spells the closed four-kind set`);
  }
});

test("#432 S1: model memory never carries confirmed — the ceiling is a rule in the single owner", () => {
  const md = read(DESIGN);
  assert.match(md, /never `confirmed`, and never tier-0/, "DESIGN.md states the ceiling as a rule: inferred at best, never confirmed, never tier-0");
  assert.match(md, /version-pinned, current/, "the confirmed demand names the version-pinned, current source it needs");
  assert.doesNotMatch(md, /never assume/i, "the ceiling stays positive — no bare prohibition takes a stage's place");
});

test("#432 S2: an external implementation-detail claim verifies against the pinned version before it guides a task", () => {
  const md = read(DESIGN);
  assert.match(md, /before it may guide a task/, "the verification gate is stated as an order, not an aspiration");
  assert.match(md, /one-fetch receipt/, "the verification rides as a cheap one-fetch receipt");
  assert.match(md, /lockfile, manifest, GitHub-action SHA/, "the pinned source is the project's own pinning, never `latest`");
});

test("#432 S3: deterministic verification prefers a script, as an extension of #359 — not a rival rule", () => {
  const md = read(DESIGN);
  assert.match(md, /prefer a script/, "the script preference is stated");
  assert.match(md, /actionlint/, "the named deterministic checks are named");
  assert.match(md, /#359/, "the migration the preference extends is cited");
});

test("#432 S4: the research step carries the repo-answered exit with its receipt", () => {
  const md = read(RESEARCH);
  assert.match(md, /descriptive/, "the exit is for descriptive questions");
  assert.match(md, /which claim the repo answered and where/, "the receipt records which claim and where");
  assert.match(md, /never closes on precedent/, "a normative question never closes on precedent");
  assert.match(md, /owned by/, "the certainty/provenance semantics carry an owner pointer, not a restatement");
});

test("#432: the model-memory gate is inventoried as prose, and the row resolves", () => {
  const md = read(GATE_INVENTORY);
  const row = md.split("\n").find((line) => line.startsWith("model-memory-provenance "));
  assert.ok(row, "the inventory carries the model-memory-provenance row");
  const cells = row.split("|").map((c) => c.trim());
  assert.ok(cells.includes("prose"), "the row's carrier is prose (the scriptable half is the deferred second slice)");
  assert.match(row, /DESIGN\.md/, "the row names its carrier file");
});

// --- #432 fold F1: a migrated journal must name the source it actually cites ---
//
// The batch-2 migration (2026-11-07, `35fc6e1e`) filled the `provenance` cell of seven
// other units' claim journals with the fallback "anything else — path, command, git/gh
// receipt — to `repository`", which asserted a repository provenance for sources those
// rows themselves name as outside the repository: a machine-global config path, a live
// service probe, a registry page, a `gh` forge read. The case below is the non-vacuous
// half of the fold: it re-reads the same seven journals and refuses the class. The
// leading backtick and any shell reader (`cat`, `grep`, `ls`, `sed`, `head`, `tail`) are
// stripped first, because the marker is what the source *names*, not the verb that read
// it — `cat ~/.pi/agent/mcp.json` cites a path outside this repository.

const MIGRATED_JOURNALS = [
  "docs/features/66-engram-memory-substrate/sources.md",
  "docs/features/67-serena-provisioning/sources.md",
  "docs/features/78-unit-cycle/sources.md",
  "docs/features/79-spec-by-reference/sources.md",
  "docs/features/82-relay-lane-execution/sources.md",
  "docs/features/84-published-vocabulary-sweep-gate/sources.md",
  "docs/fix/303-investigate-orient-ask/decisions.md",
];

/** What a cited source must begin with to sit outside this repository. */
const EXTERNAL_SOURCE_MARKERS = [
  "~/",
  "$HOME",
  "curl ",
  "gh issue view",
  "gh api",
  "npm view",
  "registry.",
  "pi.dev",
  "http",
];

const ESCAPED_PIPE = "\u0001";

/**
 * The `provenance` rows of one journal, in document order.
 * A table counts only when its header carries a `provenance` column; a row whose cell
 * count differs from its header is not a claim row (an escaped `\|`, or a neighbouring
 * pane read under the last header), so it is skipped rather than guessed.
 */
function provenanceRows(text) {
  const rows = [];
  let columns = null;
  text.split("\n").forEach((line, index) => {
    const flat = line.split("\\|").join(ESCAPED_PIPE);
    if (!flat.startsWith("|")) return;
    const cells = flat.split("|").map((cell) => cell.trim().split(ESCAPED_PIPE).join("|"));
    const at = cells.indexOf("provenance");
    if (at >= 0) {
      columns = {
        id: cells.indexOf("id"),
        source: cells.indexOf("source"),
        provenance: at,
        width: cells.length,
      };
      return;
    }
    if (columns === null) return;
    if (cells.length !== columns.width) return;
    if (!/^[A-Z]+-\d/.test(cells[columns.id] ?? "")) return;
    rows.push({
      line: index + 1,
      id: cells[columns.id],
      source: cells[columns.source] ?? "",
      provenance: cells[columns.provenance],
    });
  });
  return rows;
}

/** The first cited source of a row: quoting and any shell reader stripped. */
function firstCitedSource(source) {
  return (source.split(";")[0] ?? "")
    .trim()
    .replace(/^`/, "")
    .replace(/^(?:cat|grep|rg|ls|sed|head|tail)\s+(?:-\S+\s+)*/, "")
    .trim();
}

test("#432 F1: no migrated journal row asserts `repository` for a source outside the repository", () => {
  const offenders = [];
  let cited = 0;
  for (const rel of MIGRATED_JOURNALS) {
    for (const row of provenanceRows(read(rel))) {
      const marker = EXTERNAL_SOURCE_MARKERS.find((m) => firstCitedSource(row.source).startsWith(m));
      if (marker === undefined) continue;
      cited += 1;
      if (row.provenance === "repository") {
        offenders.push(`${rel}:${row.line} ${row.id} cites ${firstCitedSource(row.source).slice(0, 48)}`);
      }
    }
  }
  assert.ok(cited > 0, "the pin is non-vacuous: the seven journals still carry external citations to check");
  assert.deepEqual(
    offenders,
    [],
    `a journaled claim may not assert \`repository\` for a source it names as outside the repository:\n  ${offenders.join("\n  ")}`,
  );
});

test("#432 F1: the installed-environment arm is in the ceiling's single owner, on its own row", () => {
  const lines = read(DESIGN).split("\n");
  const pinned = lines.findIndex((line) => line.startsWith("| `version-pinned doc` |"));
  const recalled = lines.findIndex((line) => line.startsWith("| `model memory` |"));
  assert.ok(pinned >= 0 && recalled >= 0, "the provenance-kind table carries both rows");
  assert.equal(recalled - pinned, 2, "the table grew no row — the gate's DESIGN.md:61 anchor still resolves");
  const row = lines[pinned];
  assert.match(row, /observation of the installed environment/, "the kind names the installed environment as a source it accepts");
  assert.match(row, /records the version observed/, "and the version observed is what lifts it to the ceiling");
  assert.match(row, /never `latest`/, "the `latest` refusal stays — it is what judges a registry fetch");
  assert.match(row, /`inferred` at best/, "an observation that records none is capped, not promoted");
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
