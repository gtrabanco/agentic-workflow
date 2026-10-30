# Design step

## Needs-input guard

A blank or vague scope or acceptance-criteria input is a gap, not a licence to
infer. The order is fixed: search the repository's own docs first and append an
`open-question` row to the unit folder's `decisions.md` recording where; research
an external gap into 2–3 concrete options. A gap surviving both runs
`bun scripts/needs-input.mjs <unit-dir>` (node fallback if bun is not installed), pastes the `open-questions@1` block
and stops — route `design` for scope/architecture questions. "Decide for me" is
a legitimate answer: the lane chooses and records the choice with its reason.
Cheap-to-change defaults are recorded as assumptions, never silent.

## Purpose

Run **investigate → orient → ask → decide**: every claim the SPEC makes is
entered in a ledger that cites its source, and entity, role, and expectation
boundaries close. The unit of progress is a **claim with a source** — a claim no
source or owner answer supports is a defect, not a judgment call.

## Inputs

- The unit's objective, why, and user outcome from the SPEC
- The user's original request, the repository's current state, and the
  installed tooling — whatever they already answer is never asked again
- Research findings from the research step

## Stage 1 — investigate

Open with a provenance search, then journal every claim. **The first action of
this stage is a search, not a sentence**: no design claim is written before the
repository has been asked.

1. **Provenance search.** Run the greps and reads whose result would settle the
   claim (`grep -rn "<term>" docs/ src/`, the documentation map, the architecture
   doc, the roadmap, prior units' `decisions.md`), and record **where you
   looked**: `path:line` hits and the greps run. A "not found" without that
   receipt is the defect this stage exists to catch.
2. **Journal** — append one row per claim to the unit folder's `sources.md`:

| id | claim | source | certainty |
|---|---|---|---|
| INV-001 | <the claim, one line> | `<path:line>`, `<doc#anchor>`, `owner answer <Q-id>`, or `user request` | confirmed / inferred / unknown |

   `confirmed` = verifiable by a command or documented; `inferred` = deduced,
   not yet verified; `unknown` = no evidence found (→ the orient stage must ask).
3. **Induce acceptance criteria** from user scenarios — each AC is a claim too,
   and cites the scenario or owner answer it came from.
4. **Close boundaries**: entities and their roles, actors, accepted and rejected
   inputs (the expectation sweep), deferrals (→ `## Future`).
Pass only if: ✓ the provenance search ran and its receipt is recorded ✓ every
claim is a `sources.md` row ✓ every AC is induced from a user scenario.

## Stage 2 — orient

Filter each `INV-*` claim with three fixed tiers, in order — the lowest tier that
settles the claim wins, and the repository always speaks first:

| Tier | When it settles the claim | What this stage does |
|---|---|---|
| **0 · provenance** | A recorded `path:line`, doc, or prior decision answers it | Nothing to ask — point the row at the source |
| **1 · research** | External and unresearched, in tier 0 or outside it | Research it into 2–3 options with trade-offs |
| **2 · ask** | No evidence exists anywhere | Backlog it for the ask stage — never decided here |

The tier-2 backlog is then filtered by cost of being wrong — expensive to undo
= **scope** (personal / team / global), **stack**, **architecture pattern**,
**data model**, **deployment target**, **security configuration**:

| The claim… | The lane does |
|---|---|
| Blocks now and is expensive to undo once code sits on top | Asks |
| Blocks a later task that is already foreseeable | Asks now as a possibility; re-asks only if conditions change |
| Cheap to change later | Takes a reasonable default, records it as a dated assumption — never silent |

Pass only if: ✓ every `INV-*` row carries a tier and a cost verdict ✓ every
tier-0 row names the source that settled it ✓ no claim was researched or asked
before the provenance tier ran.

### Three-direction closure (S2, S6, S8)

The provenance tier answers *what exists*; closure answers *what this change
touches*, and each direction decides whether a question is left to ask.

**Backward — constraints in force.** A design system's tokens/components with
their `sources.md` evidence; with none, the precedent read from siblings.

**Sideways — siblings of the mechanism.** What it receives changes → its
callers. What it delivers changes → its consumers. Something is removed → what
still uses it, asked before breaking (the sweep `fold-findings` runs on a defect).

**Forward — promises coined.** Every name, field, endpoint or file is a
`sources.md` row and a node another party references, behind two gates:

- **ask-don't-infer** — an expectation in neither the tree nor the user's words
  is a stage-3 question; a coined name with no owner answer is already a defect.
  This is the design/plan case of the all-stages rule below —
  `ask-dont-infer@1`, whose single normative owner is this file.
- **document-or-don't-coin** — a new contract lands with the consumer-facing doc
  its consumer will look for (the promise registry renders into this step's
  output and the PR).

**Retirements.** Every surface, token, pane, helper or contract this unit
**retires**, with its replacement or no-consumer evidence; an empty answer says
*why nothing can be removed*. Retirements are a design deliverable, not a
review-time discovery — the plan step turns each into a planned task.

### Third-party before homemade (#340)

When the design reaches for code that solves a solved problem, a **widely
community-supported library is the preferred option** over writing our own
where a comparable option exists. Own code for a solved problem carries a
**recorded justification** in the design output — a `sources.md` row (or a
decision row) stating why no comparable community option fits. Owner-cited
precedent: the substrate-reuse approach of pi-extensible-workflows.

### The all-stages no-assumption rule (`ask-dont-infer@1`, #340)

This block is the **single normative owner** of the no-assumption rule for
every stage — development, modification, deletion, planning, design, review,
audit. Stage skills reference this block; they **never restate** it — a
restatement is a defect (`scripts/residue-dimensions.test.mjs` counts them).

```text
ask-dont-infer@1
stage | when the rule binds | what the stage does
any (development, modification, deletion, planning, design, review, audit) | an expectation is not evidenced by the tree, the docs, or a prior owner decision | understand the context of the question; research if useful — without leaking data, secrets or project details; propose options; the user decides. Research informs and proposes — it never answers on the user's behalf
```

## Stage 3 — ask

Batch the tier-2 claims from the orient stage. This stage reads the **orient
output and the ask backlog** — never re-derives a claim the provenance tier
settled, never re-asks an answer the user already gave.

Mechanics — one batched form-turn, never one-question-per-turn:

- Group all independent questions into a single turn; ≤6 slots, one-word
  defaults accepted, ≤2 ambiguity follow-ups per slot.
- Ask a single question first only when its answer changes the others. When
  more than five gaps remain, the root decision (objective or scope) goes
  first — its answer usually removes most of the rest.
- Every slot carries: the **recommended option with its why**, one
  alternative, **"Decide for me"**, and **"Explain the options"** — the user
  may always answer freely.
- A tool the project lacks may be offered as one more option (with its
  recommendation and why); installing it always needs the user's explicit
  consent.
- **Ready when:** no expensive-to-undo blocking claim remains unanswered — not
  when no questions remain.

The questions are the `open-questions@1` block of the unit folder's
`decisions.md` — the grammar `scripts/needs-input.mjs` reads, published in the
template agent guide's question protocol. Append the block (never a table of
your own invention) and carry a search receipt on every question:

```text
open-questions@1
id | date | type | question | blocks | search-receipt | options | route
Q1 | <YYYY-MM-DD> | open-question | <the decision being asked> | <why nothing proceeds without it> | <where the repository was searched: path:line, greps, prior units> | <option A — trade-off> \| <option B — trade-off> \| Decide for me \| Explain the options | design
```

## Stage 4 — decide

Record every answer — the user's, and every "Decide for me" choice with its
reason — as a `decision` row of the same block, newest last. Only the owner
closes a question; the row carries where the answer is recorded (a chat paste, an
issue comment) and what was discarded:

```text
D1 | <YYYY-MM-DD> | decision | Q1 | human-owner | <where the answer is recorded> | <what was chosen> | <what was discarded and why>
```

A cheap default taken in stage 2 goes to the file's `## Assumptions` as a dated
row, correctable by the user. Then fill the unit doc's **Acceptance criteria**
(induced from a concrete scenario, command-verified where possible, numbered).

## Fixed output contract

The step owns four panes of the unit folder and nothing else:

<!-- sources:start -->
`sources.md` — one row per claim, each with a source or an owner answer. A
claim row with an empty, `—`, or `n/a` source is a **defect**: either find the
source in the provenance tier or convert the claim into a question.
<!-- sources:end -->

<!-- questions:start -->
The unit folder's `decisions.md` — the `open-questions@1` block the ask stage
appended, plus the `decision` rows the decide stage appended (one per question
closed). The step also refreshes `BRIEF.md`, the reviewer brief that restates
them, so a reviewer never has to re-derive the step's questions.

| Asked | Resolution |
|---|---|
| <question id + the decision being asked> | <what was chosen, by whom (owner answer / Decide for me), and why> |

When the orient stage left an empty ask backlog, write exactly
``none — no questions: every claim was settled by provenance or research``.
An empty table is never that line — the form is a decision, the blank is a
missing one.
<!-- questions:end -->

<!-- deferred:start -->
`## Future` in the unit doc — deferred ideas ("down the road I'd like…"),
verbatim and dated. They are never implemented, never turned into spec or tasks
by this unit, and are reviewed at close, on resume, and when work returns to the
area.
<!-- deferred:end -->

<!-- acceptance:start -->
The unit doc's **Acceptance criteria** section, numbered and command-verified.
<!-- acceptance:end -->

## Checklist (pass only if)

- [ ] The provenance search ran first and its receipt is recorded (`path:line`, the greps, prior units)
- [ ] Every claim (objective, why, every AC, non-goals) cites its source or an owner answer in `sources.md`, and none lacks one
- [ ] Every claim carries a certainty (`confirmed` / `inferred` / `unknown`); an `unknown` claim became a question
- [ ] Every acceptance criterion (AC1, AC2, …) is induced from a user scenario and cites what induced it
- [ ] The orient tiers ran in order: provenance before research before ask
- [ ] Every question asked was recorded with its resolution — or the questions pane says `none` explicitly
- [ ] No expensive-to-undo blocking claim remains unanswered
- [ ] Every "Decide for me" choice is recorded with its reason in `decisions.md`
- [ ] Cheap defaults are recorded as dated assumptions, correctable by the user
- [ ] Entity closure: every entity mentioned has its role in the unit stated
- [ ] Role closure: every actor/role that interacts with the unit is listed
- [ ] Expectation sweep: user's accepted and rejected inputs are bounded
- [ ] The three-direction closure (§ Stage 2) ran: backward, sideways, forward — each with its evidence
- [ ] Retirements stated: each retired surface carries its replacement or no-consumer evidence, or the answer says why nothing can be removed
- [ ] Third-party before homemade (#340): a solved problem prefers a widely community-supported library; own code for a solved problem carries a recorded justification in the design output
- [ ] Deferrals landed in `## Future`, not in scope

## Forbidden

- Never infer a claim: one that is not in the repository and not derivable from
  it is a question for the owner, never a default. A claim with no source and no
  owner answer is the defect, not a judgment call
- Do not write a design claim before the provenance search ran
- Do not ask what the request, the repo, or the installed tooling already answers
- Do not ask one question per turn when slots are independent
- Do not invent a question table of your own: the ask stage writes the
  `open-questions@1` block the dispatcher reads
- Do not decide at the ask stage — asking and answering are different stages
- Do not implement, spec, or task anything from `## Future`
- Do not install a missing tool without explicit user consent
- Do not build a separate DESIGN.md — one SPEC, all in the unit doc
- Do not coin a name, field or endpoint without an owner answer and a named place its consumer will read it
- Do not answer the retirement question with silence: “nothing can be removed” is a stated reason, not an omission
- Do not pre-fill engineering content (phases, tests, architecture)
- Do not stamp "designed" with an incomplete closure row
