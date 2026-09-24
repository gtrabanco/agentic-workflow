# fix/<issue-number>-<topic>

> Fix specification — one single unit document. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. This is the same closed 13-section unit
> doc `scripts/unit-route.mjs --triage` reads for a feature; the fix
> template keeps four extra sections (`Issue`, `Branch`, `Depends on`,
> `Regression scope`) on top. Legacy fix templates with separate
> PLAN/ACCEPTANCE files are not migrated (see Non-goals).

## Issue

`#<n>` — tracked issue in the project's forge. Required. The PR must close it
via `Closes #<n>` in the body (or the forge's equivalent auto-close
convention).

## Objective

What this fix repairs and why it cannot wait for a regular feature cycle (2-4 lines).

## Why

The defect's root cause: what broke, where, and why. Reference the commit,
feature, or decision where the defect was introduced if known.

## User outcome

From the user's perspective: what they can do or observe after this fix ships.

## Acceptance criteria

Numbered list. Each AC is a runnable command where possible, or labelled
`read-verified` — never unlabelled prose.

## Non-goals

What this fix is NOT. Regression scope is declared below; findings discovered
during implementation never expand scope beyond the declared regression boundary.

## Future cost

Standing obligations this fix imposes on future work. Each row: the rule + who it binds.
Write `none` if it imposes none.

## Applicable tests

The tests this fix will run (triage-decided). Write exactly
`n/a — no tests step for this fix` when there is none.

## Known pre-existing issues

Each: `<issue/observation>` + explicit `affects` or `does-not-affect` this unit.
A red gate is never excused by an unrecorded issue.

## Tasks

P1…Pn with stable IDs, one line each, smallest first. Final task is verification
when the unit has behavior.

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output
(≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|

## Progress log

One entry per step taken. Format exactly:
`YYYY-MM-DD HH:MM — <what was done> → <commit sha or evidence> — next: <what is next>`

## Next

The single next action.

## References

Issues, roadmap rows, related material. The PR closes the tracked issue via
`Closes #<n>`. `none` if empty.

## Branch

`fix/<issue-number>-<topic>`

## Depends on

Other fixes (by folder name) that must merge first. Empty if independent.

## Regression scope

What previously-working behaviour must NOT break. Each row: the scenario
and the test/command that verifies it. Write `n/a` if the fix cannot regress
existing behaviour.
