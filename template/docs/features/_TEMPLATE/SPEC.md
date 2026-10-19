# NN — <unit-slug>

> One-line: what this unit doc is. Copy to docs/features/NN-<slug>/.

## Objective

What this unit delivers and why it exists now (2-4 lines).

## Why

The problem or gap this unit addresses; what already exists, what is missing.

## User outcome

From the user's perspective: what they can do or observe after this unit ships.

## Acceptance criteria

Numbered list. Each AC is induced from a concrete user scenario ("I do X and observe Y").
Make each AC command-verified where possible. If the request is too vague to state an AC,
STOP and ask the user with concrete options — never invent one.

**Validator determinism.** A frozen validator must be deterministic — pin network,
clock, randomness, and unordered-concurrency dependencies (fixed version,
frozen fixture, recorded input) or downgrade the row to `read-verified:`/
`manual:`.

**Property / fuzz validators.** A planner may emit a property or fuzz validator as
a bounded `commands` row — deterministic, bounded runtime — within the timeout
budgets published by the schema package. No new validator kind is needed: property/fuzz rides the existing commands class.

## Non-goals

What this unit is NOT. Findings discovered during implementation never expand scope.

## Future

Ideas the user deferred ("down the road I'd like…"), captured verbatim with a
date and a status: `open`, `planned`, or `discarded <YYYY-MM-DD>`. This unit
never implements, specs, or tasks a row here. Write `none` when nothing was
deferred. Reviewed at unit close, on session resume, and whenever later work
returns to the same area — each open row is then offered as
plan-now / keep-deferred / discard.

## Future cost

Standing obligations this unit imposes on future work. Each row: the rule + who it binds.

## Applicable tests

The tests this unit will run (triage-decided). Write exactly `n/a — no tests step for this unit`
when there is none.

## Known pre-existing issues

Each: `<issue/observation>` + explicit `affects` or `does-not-affect` this unit.
A red gate is never excused by an unrecorded issue.

## Tasks

P1…Pn with stable IDs, one line each, smallest first. Final task is verification when the unit has behavior.

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

## Progress log

One entry per step taken. Format exactly:
`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

## Next

The single next action.

## References

Issues, roadmap rows, related material. The PR closes absorbed issues via `Closes #N`. `none` if empty.