# Plan step

## Purpose

Run **investigate → orient → ask → decide** over the plan itself: cite every
task, sweep every claim against what the repository already decided, ask only
what no source answers, and record the answers. Each task names its validator;
smallest first; no future-phase work.

## Inputs

- The unit doc: acceptance criteria, non-goals, and the design step's four panes
  (`sources.md`, `decisions.md`)
- The unit's Impact section — the surface the executor must sweep

## Stage 1 — investigate

Open with the same provenance search the design step ran, aimed at the plan's own
claims ("does a validator for this exist?", "is this module already covered?",
"did a prior unit decide this?"). Journal each claim as a row of the unit
folder's `sources.md`, with the id prefix `CLAIM-`:

| id | claim | source | certainty |
|---|---|---|---|
| CLAIM-001 | <the plan claim, one line> | `<path:line>`, prior `decisions.md:line`, or `owner answer <Q-id>` | confirmed / inferred / unknown |

Two claims never need a search: the unit's own acceptance criteria (the design
step cited them) and its non-goals. Everything else does — a plan claim with no
source and no owner answer is the defect this stage exists to catch.

## Stage 2 — orient

Re-run the provenance tier over the plan's claims, then sweep every one of them
against what the repository has **already decided in writing** — a plan must not
contradict a prior decision in architecture, engineering, product, or any other
domain. A claim the provenance search explains is settled at tier 0: point the
row at `path:line` and move on. **Record where you looked** for every row the
search did not settle — the greps meant for it and the prior units of the same
area. In the same pass, check that the acceptance criteria are the plan's
*input*, not a claim it re-decides: a task that would change an AC belongs to the
design step, not here.

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

Pass only if: ✓ the provenance search ran and where you looked is recorded ✓ every `CLAIM-*` row was swept ✓ every `contradicts` hit is either
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
```

Both phase grammars are accepted (owner: `phase-contract`): these bullets, or
full plan-style `## P<n> —` blocks when the unit doc already carries them —
`phase-lint` parses either and answers `no-phases` only when it finds neither.
A bullet's `(validator: …)` span is its machine-checkable done-when (a
backticked command **and** an expected outcome, e.g. `exits 0`), and the nested
`Relevant files:` line is **metadata, never a task** — it is that phase's read
set, written from the planner's own discovery, and a file that is missing from
it is never out of scope for the executor.
<!-- tasks:end -->

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

- [ ] The provenance search ran first and its receipt is recorded for every plan claim
- [ ] Every claim (CLAIM-001, …) cites its source or an owner answer in `sources.md`, including every acceptance criterion it rests on — none is blank, `—`, or `n/a`
- [ ] Every claim was swept against the candidate sources; each `contradicts` hit is resolved or asked
- [ ] Every question asked was recorded in `decisions.md` with its resolution (or the questions pane says `none`)
- [ ] Every AC maps to at least one task, and no task re-decides an AC
- [ ] Tasks are ordered smallest first
- [ ] Each task names its validator (a backticked command plus its expected outcome)
- [ ] Final task is verification (proves the whole unit works)
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
- Do not include docs/release tasks here — those are separate catalog steps
- Do not invent tasks that the ACs do not demand
- Do not turn the sweep into a gate, stage verdict or blocking check — it routes,
  it never blocks a miss, and it adds no authority
- Do not record a `prior decision` that no source `path:line` cites
