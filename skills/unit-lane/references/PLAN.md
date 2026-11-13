# Plan step

## Purpose

Run **investigate → orient → ask → decide** over the plan itself: cite every
task, sweep every claim against what the repository already decided, ask only
what no source answers, and record the answers. The plan journals **delta
provenance** — only the claims the design pass did not already journal in
`sources.md`, and it sweeps only those delta rows (§ Stage 1, § Stage 2). The
loop itself runs fused or separated per the unit's recorded risk tier (block
`activity-fusion@1` below). Each task names its validator; the plan sequences
prerequisite tasks **before** their dependants (topology precedes smallest-first
— smallest within a ready set); no future-phase work.

### Activity fusion (`activity-fusion@1`)

The same four-stage loop runs once or twice per unit; the unit's recorded risk
tier decides which, never a judgment call:

```text
activity-fusion@1
tier | pass shape | carriers | gates
standard | one investigate→orient→ask→decide pass over the unit in one conductor session, the decision points tagged design (schemas, boundaries, retirements) and plan (tasks, validators, orders); stages 1–3 above run once — executing the loop again at standard is the defect this block owns | separated — sources.md / decisions.md / the SPEC's design half vs the unit doc's Tasks / Evidence | separated — both stages' pre-execution contracts bind per their owners (`PRE_EXECUTION_GATE.md`, `SNAPSHOT.md`); the fusion changes session composition, never gate ownership
high | separated stages — the `design` step, then the `plan` step; the cold pre-execution-review separation stays where its owners put it, and this rule resurrects no reviewer pass | unchanged | unchanged
```

The conductor reads the tier from the unit doc's recorded verdict, the triage
block's `Fused:` line is the run's machine annotation, and a `high` or
unrecorded tier runs the steps separated exactly as before the fusion.

## Inputs

- The unit doc: acceptance criteria, non-goals, and the design step's four panes
  (`sources.md`, `decisions.md`)
- The unit's Impact section — the surface the executor must sweep

## Stage 1 — investigate

Open with the plan's own claims — "does a validator for this exist?", "is this
module already covered?", "did a prior unit decide this?" — and journal **delta
provenance**: a claim enters the unit folder's `sources.md` as a `CLAIM-*` row
only when the design pass did not already journal it. The `INV-*` rows the
design stage wrote settle themselves; re-journaling a settled claim is a
defect, not thoroughness — one claim, one row, whichever stage wrote it first.

| id | claim | source | provenance | certainty |
|---|---|---|---|---|
| CLAIM-001 | <the plan claim, one line> | `<path:line>`, prior `decisions.md:line`, or `owner answer <Q-id>` | repository / version-pinned doc / owner answer / model memory | confirmed / inferred / unknown |

Two claims never need a search: the unit's own acceptance criteria (the design
step cited them) and its non-goals. Everything else the design pass did not
settle does — a plan claim with no source and no owner answer is the defect
this stage exists to catch. The
provenance kinds and the certainty ceiling are owned by `DESIGN.md`
(§ Provenance — model memory is never tier-0); this table journals the same
columns, it does not restate the rule. An external implementation-detail claim
that the pinned-version receipt has not fetched yet stays at its ceiling —
a `model memory` row can never carry `confirmed`.

## Stage 2 — orient

Sweep only the delta rows — the `CLAIM-*` rows this pass added — against what
the repository has **already decided in writing**; a plan must not contradict a
prior decision in architecture, engineering, product, or any other domain. The
`INV-*` rows the design pass journaled were swept there, and sweeping them
again buys one search twice. A delta claim the provenance search explains is
settled at tier 0: point the row at `path:line` and move on. **Record where you
looked** for every row the search did not settle — the greps meant for it and
the prior units of the same area. In the same pass, check that the acceptance
criteria are the plan's *input*, not a claim it re-decides: a task that would
change an AC belongs to the design step, not here.

**Candidate sources** — deterministic keyword/FTS matching, no new index and no
new tooling: `docs/features/<NN>-<slug>/decisions.md`,
`docs/fix/<issue>-<topic>/decisions.md`, the project's architectural invariants,
the Normalized Repository State (`discover-repository-state` /
`resolve-repository-state`), `AGENTS.md`, and a unit SPEC's `## Design status`
(legacy marker, units ≤ 60).

**Advisory only — no new authority.** `contradicts` routes to
`resolve-repository-state` only when the hit is against a frozen NRS fact (its
only candidate source that carries a `<contradiction-id>` row after a
`discover-repository-state` step); hits against `decisions.md` / `AGENTS.md` /
architectural invariants / `## Design status` surface a `NEEDS-DECISION` for the
user, per the existing rules. A plan with **no candidate match is clean and
proceeds** — a miss never blocks it, a missed candidate can never void a plan,
and the sweep issues no stage verdict and grants no gate of its own.

Pass only if: ✓ the provenance search ran and where you looked is recorded ✓ every delta `CLAIM-*` row was swept ✓ every `contradicts` hit is either
resolved from a frozen NRS fact or backlogged for the ask stage ✓ no task
re-decides an acceptance criterion.

## Stage 3 — ask

Only `contradicts` hits and `unknown` claims that no source settles reach this
stage — a plan asks after the repository has spoken, never before. Batch them
into **one** form-turn (≤6 slots) using the design step's mechanics: recommended
option with its why, one alternative, "Decide for me", "Explain the options".

The questions are the same `open-questions@1` block the dispatcher reads — append
the block to the unit folder's `decisions.md` (route `unit-lane`: these are
plan-owned facts), never a table of your own:

```text
open-questions@1
id | date | type | question | blocks | search-receipt | options | route
Q2 | <YYYY-MM-DD> | open-question | <the decision being asked> | <why nothing proceeds without it> | <where the repository was searched: path:line, greps, prior units> | <option A — trade-off> \| <option B — trade-off> \| Decide for me \| Explain the options | unit-lane
```

A plan with an empty backlog writes the explicit `none` line instead — never a
blank.

## Stage 4 — decide

Record every answer as a `decision` row of the same block (newest last), and a
`Decide for me` choice with its reason — then cut the tasks:

```text
D2 | <YYYY-MM-DD> | decision | Q2 | human-owner | <where the answer is recorded> | <what was chosen> | <what was discarded and why>
```

## Fixed output contract

<!-- tasks:start -->
Fill the unit doc's **Tasks** section:

```
P1 — <task description> (validator: <backticked command> <expected outcome>)
  - Relevant files: <path, path…>
P2 — <task description> (validator: <backticked command> <expected outcome>)
…
Pn — last task is verification when the unit has behavior
P<n+1> — release settle, when the unit opens a PR: after the PR exists, settle
  the roadmap row via the crate's writer (`agentic-workflow roadmap rowUpsert`,
  status `done · [#N](<pr-url>)`, every other cell preserved; a fix unit's
  `## Fixes` row goes through `agentic-workflow roadmap fixrow`) — validator:
  `bun scripts/roadmap-settle.mjs` exits 0 (#316: the settle is a task the
  executor owns, never a missing courtesy)
```

Order is dependency-topological first, smallest within a ready set — a
prerequisite task precedes its dependants even when larger, and a dependent
task's validator only runs after its prerequisite tasks pass (execution runs
phases in label order, so the plan's sequence is what the executor follows).

Both phase grammars are accepted (owner: `phase-contract`): these bullets, or
full plan-style `## P<n> —` blocks when the unit doc already carries them —
`phase-lint` parses either and answers `no-phases` only when it finds neither.
A bullet's `(validator: …)` span is its machine-checkable done-when (a
backticked command **and** an expected outcome, e.g. `exits 0`), and the nested
`Relevant files:` line is **metadata, never a task** — it is that phase's read
set, written from the planner's own discovery, and a file that is missing from
it is never out of scope for the executor.
<!-- tasks:end -->

<!-- retirements:start -->
Every retirement the design step declared (S8) becomes **its own task**: a
deliberate deletion gets the same rigor as a deliberate construction — task,
validator, evidence row — because an ad-hoc deletion skips evidence and a
planned one cannot. A replacement is a retirement: a task that supersedes an
existing part (a feature changed for another, a function/code path that does
the same or better) declares the superseded part retired, and its deletion
task follows the same three pieces (#340, replace-implies-delete). Three
pieces per retirement task:

- **the negative-capability pin** — the test proving the removed thing cannot
  return (`grep -c '<removed name>' <scope>` → 0, or a suite that fails if the
  surface reappears). This is the task's `(validator: …)`, never prose.
- **the sweep grep** — the pattern that found the remaining references, with its
  scope, so a reviewer re-runs the same command.
- **the surviving-reference count** — before and after, so the deletion is
  measured rather than asserted.

No declared retirements → a **strictly additive** unit answers with its
computed surface inventory — `bun scripts/residual-classify.mjs --inventory
--base <rev>`, the anti-divergence receipt its `## Retirements` section
carries — and any other empty answer writes exactly
``none — the design states why nothing can be removed``. The anti-gaming rule
(“never shrink a diff by deleting comments, blank lines, docs or tests”) gains
its complement: verified shrinkage is legitimate work, only unverified
shrinkage is suspect.
<!-- retirements:end -->

<!-- sources:start -->
`sources.md` — every `CLAIM-*` row with a source or an owner answer. A claim row
whose source is empty, `—`, or `n/a` is a **defect**: find the source in the
provenance tier or convert the claim into a question.
<!-- sources:end -->

<!-- questions:start -->
The unit folder's `decisions.md` — the `open-questions@1` block the ask stage
appended, plus the `decision` rows the decide stage appended, one per question
closed. The step also refreshes `BRIEF.md`, the reviewer brief that restates
them, so a reviewer never has to re-derive the step's questions:

| Asked | Resolution |
|---|---|
| <question id + the decision being asked> | <what was chosen, by whom (owner answer / Decide for me), and why> |

When the sweep and the provenance tier left an empty backlog, write exactly
``none — no questions: every claim was settled by provenance or research``.
<!-- questions:end -->

## Planning ledgers (same step)

Cut both planning ledgers in the same pass — the plan snapshot binds them, and
the audit's lineage gate closes obligations from them (fix/285). The closed row
shapes, column orders, and vocabularies are owned by
`skills/pre-execution-review/references/LEDGERS.md`; this step only decides the
home and fills the rows:

- **Planning evidence** — one row per Engineering claim the SPEC's Engineering
  half (or a fix SPEC's Objective/Why) makes. Ids `PE-001`, `PE-002`, …; an
  unsampled assumption is `unknown` with an owner (`ASSUMPTION-UNVERIFIED`),
  never a silent citation.
- **Obligations** — one row per normative behaviour, applicable compatibility
  invariant, affected use case, and required failure state. Ids `O1`, `O2`, …;
  exactly one phase and one task each; every row `planned` at cut time,
  `verified` (or evidenced `n/a`) before the unit ships.

**Home (sizing rule, never both):** XS/S embeds both tables under the unit
doc's `### Planning evidence` / `### Obligations` headings — the plan snapshot
binds them through the whole-SPEC row. M/L freezes them as the unit folder's
`planning-evidence.md` / `planning-obligations.md` and the unit-doc sections
name those files instead.

## Checklist (pass only if)

- [ ] The provenance search ran first over the delta claims and its receipt is recorded for each — an `INV-*` row the design pass journaled is not re-searched
- [ ] Every claim (CLAIM-001, …) cites its source or an owner answer in `sources.md`, including every acceptance criterion it rests on — none is blank, `—`, or `n/a`; an `INV-*` claim the design pass already journaled is never re-journaled (delta provenance)
- [ ] Every delta claim was swept against the candidate sources; each `contradicts` hit is resolved or asked
- [ ] The recorded risk tier decides the pass shape (block `activity-fusion@1`): at `standard` the design and plan decision points share one investigate→orient→ask→decide loop in one conductor session and no stage was re-run; at `high` or unrecorded the steps ran separated
- [ ] Every question asked was recorded in `decisions.md` with its resolution (or the questions pane says `none`)
- [ ] Every AC maps to at least one task, and no task re-decides an AC
- [ ] Every retirement the design declared is its own task, carrying the negative-capability pin as its validator plus the sweep grep and the before/after reference count — or the plan states why nothing can be removed
- [ ] The plan obeys the all-stages no-assumption rule — **ask-don't-infer**, owner `skills/unit-lane/references/DESIGN.md` (`ask-dont-infer@1`); a claim no source settles is asked, never invented
- [ ] Reuse-first (#340): every task that adds functionality names the pre-existing parts it reuses (functions, scripts, skills, schemas, prose surfaces) — or records why reuse is not possible; a task that re-implements an existing part without saying why does not pass
- [ ] Replace-implies-delete (#340): every task that changes a feature for another, or adds a function/code path that supersedes an existing one, carries the superseded part's deletion as its own planned task with its evidence — and where no superseded part exists, nothing is deleted: the obligation exists when the case exists, never as a ritual
- [ ] Tasks are ordered dependency-topological first, smallest within a ready set — a prerequisite task precedes its dependants even when larger, and a dependent task's validator only runs after its prerequisite tasks pass
- [ ] Each task names its validator (a backticked command plus its expected outcome)
- [ ] Final task is verification (proves the whole unit works); a unit that
      opens a PR ends with the release-settle task (#316)
- [ ] No task reaches into a future-phase concern (docs, release, migrations)
- [ ] Phases labeled P1, P2, … — `#308`: `S#` is the requirement id (a spec),
      `P#` is the phase label (a task); the two vocabularies never swap roles
- [ ] Each requirement is cut from the request verbatim: numbered `S#` in
      `## Specs`, one per distinct ask, with the requester's own words as its
      quote and no requirement the request did not make
- [ ] A later correction is appended under its own id (`S1a`) and leaves the
      requirement it corrects untouched
- [ ] Every task bullet names the `S#` it delivers on its `(Implements: …)` line
- [ ] The `## Log` is opened with `L1` = the request verbatim, and later entries
      append (never rewrite) in the `log-kind@1` vocabulary
- [ ] `## Findings` is present and carries only OPEN rows (empty at plan time)
- [ ] Both planning ledgers are cut (planning evidence + obligations), in the
      sizing rule's home, with stable ids

## Forbidden

- Never infer a plan claim: one the repository does not answer and no owner
  settled is a question, never a default
- Do not cut a task before the claim it rests on cites a source or an owner answer
- Do not invent a question table of your own: the ask stage writes the
  `open-questions@1` block the dispatcher reads
- Do not decide at the ask stage, and do not re-ask an answered question
- Do not bundle across phase boundaries — one phase = one commit
- Do not plan work beyond the unit's acceptance criteria
- Do not include docs/release tasks here — those are separate catalog steps;
  the release-settle task above is the sole exception (#316)
- Do not invent tasks that the ACs do not demand
- Do not turn the sweep into a gate, stage verdict or blocking check — it routes,
  it never blocks a miss, and it adds no authority
- Do not record a `prior decision` that no source `path:line` cites
