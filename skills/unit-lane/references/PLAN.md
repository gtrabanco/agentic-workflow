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

| claim | prior decision | source path | verdict |
|---|---|---|---|
| <the plan claim> | <the recorded decision> | <path:line> | `contradicts` \| `compatible` |

The verdict cell is exactly one of two values: `contradicts` or `compatible`.

**Advisory only — no new authority.** `contradicts` routes to
`resolve-repository-state` (the sole writer of frozen facts) or surfaces a
`NEEDS-DECISION` for the user, per the existing rules. A plan with **no
candidate match is clean and proceeds** — a miss never blocks it, a missed
candidate can never void a plan, and the sweep issues no verdict and grants no
gate of its own.

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
      at `path:line` and one of the two verdicts

## Forbidden

- Do not bundle across phase boundaries — one phase = one commit
- Do not plan work beyond the unit's acceptance criteria
- Do not include docs/release tasks here — those are separate catalog steps
- Do not invent tasks that the ACs do not demand
- Do not turn the sweep into a gate, verdict or blocking check — it routes, it
  never blocks, and it adds no authority
- Do not record a `prior decision` that no source `path:line` cites