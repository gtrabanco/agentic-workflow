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

## Checklist (pass only if)

- [ ] Every AC maps to at least one task
- [ ] Tasks are ordered smallest first
- [ ] Each task names its validator (a backticked command plus its expected outcome)
- [ ] Final task is verification (proves the whole unit works)
- [ ] No task reaches into a future-phase concern (docs, release, migrations)
- [ ] Phases labeled P1, P2, … (never S1, Step 1)

## Forbidden

- Do not bundle across phase boundaries — one phase = one commit
- Do not plan work beyond the unit's acceptance criteria
- Do not include docs/release tasks here — those are separate catalog steps
- Do not invent tasks that the ACs do not demand