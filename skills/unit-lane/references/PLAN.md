# Plan step

## Purpose

Cut tasks from acceptance criteria. Each task names its validator. Smallest
first. No future-phase work.

## Inputs

- The unit's Acceptance criteria (filled by the design step)
- The unit's non-goals

## Fixed output contract

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

## Prior-decisions contradiction sweep

Before the plan is accepted, sweep its claims against what the repository has
**already decided in writing** — a plan must not contradict a prior decision in
architecture, engineering, product, or any other domain.

**Candidate sources** — deterministic keyword/FTS matching, no new index and no
new tooling: `docs/features/<NN>-<slug>/decisions.md`,
`docs/fix/<issue>-<topic>/decisions.md`, the project's architectural invariants,
the Normalized Repository State (`discover-repository-state` /
`resolve-repository-state`), `AGENTS.md`, and a unit SPEC's `## Design status`
(legacy marker, units ≤ 60).

**Fixed evidence shape** — one row per candidate hit, the decision quoted from
its source:

| claim | prior decision | source path | relation |
|---|---|---|---|
| <the plan claim> | <the recorded decision> | <path:line> | `contradicts` \| `compatible` |

The cell value is exactly one of two values: `contradicts` or `compatible` —
a row relation, not a stage verdict.

**Advisory only — no new authority.** `contradicts` routes to
`resolve-repository-state` only when the hit is against a frozen NRS fact
(its only candidate source that carries a `<contradiction-id>` row after a
`discover-repository-state` step); hits against
`decisions.md` / `AGENTS.md` / architectural invariants / `## Design status`
surface a `NEEDS-DECISION` for the user, per the existing rules. A plan with **no
candidate match is clean and proceeds** — a miss never blocks it, a missed
candidate can never void a plan, and the sweep issues no stage verdict and grants no
gate of its own.

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

- [ ] Every AC maps to at least one task
- [ ] Tasks are ordered smallest first
- [ ] Each task names its validator (a backticked command plus its expected outcome)
- [ ] Final task is verification (proves the whole unit works)
- [ ] No task reaches into a future-phase concern (docs, release, migrations)
- [ ] Phases labeled P1, P2, … (never S1, Step 1)
- [ ] Every plan claim touching architecture, engineering or product intent was
      swept against the candidate sources above
- [ ] Each candidate hit is one fixed-shape row, with the prior decision cited
      at `path:line` and one of the two relations
- [ ] Both planning ledgers are cut (planning evidence + obligations), in the
      sizing rule's home, with stable ids

## Forbidden

- Do not bundle across phase boundaries — one phase = one commit
- Do not plan work beyond the unit's acceptance criteria
- Do not include docs/release tasks here — those are separate catalog steps
- Do not invent tasks that the ACs do not demand
- Do not turn the sweep into a gate, stage verdict or blocking check — it routes,
  it never blocks a miss, and it adds no authority
- Do not record a `prior decision` that no source `path:line` cites