# fix/<issue-number>-<topic>

> Fix specification. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. The single unit doc carries all planning
> and evidence sections; legacy fix templates with separate PLAN/ACCEPTANCE
> files are not migrated (see Non-goals).

## Issue

`#<n>` — tracked issue in the project's forge. Required. The PR must close it
via `Closes #<n>` in the body (or the forge's equivalent auto-close
convention).

## Goal

One paragraph: what this fix repairs and why it cannot wait for a
regular feature cycle (2-4 lines).

## Why

The defect's root cause: what broke, where, and why. Reference the commit,
feature, or decision where the defect was introduced if known.

## User outcome

From the user's perspective: what they can do or observe after this fix ships.

## Branch

`fix/<issue-number>-<topic>`

## Depends on

Other fixes (by folder name) that must merge first. Empty if independent.

## Scope

### In scope

The exact change set.

### Out of scope

Adjacent issues this fix deliberately does NOT touch. Link to their
own fix folder or feature where each belongs.

### Regression scope

What previously-working behaviour must NOT break. Each row: the scenario
and the test/command that verifies it.

## Acceptance criteria

Numbered list. Each AC is a runnable command where possible, or labelled
`read-verified` — never unlabelled prose.

## Non-goals

What this fix is NOT. Regression scope is declared above; findings discovered
during implementation never expand scope beyond the declared regression boundary.

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