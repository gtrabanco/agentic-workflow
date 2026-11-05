---
"@gtrabanco/pi-agentic-workflow": patch
"audit-docs": patch
---

fix(audit-docs): key the phase checks on the unit's own carrier, and let the router read `## Specs`

Two machine surfaces still read carriers retired by feature 61 (adaptive lane)
and feature 79 (spec-by-reference), so they could not judge a current unit and,
read literally, asserted things that are no longer true.

`audit-docs` check 11 now picks its carrier mechanically — `TASKS.md` in the
unit folder means legacy carriage, its absence means the unit doc's
`## Tasks`/`## Log` — runs `check-tasks-ticks` and `check-progress-entry` on a
lane-era unit (never `check-all`), states the `n/a` answer the no-Tasks case
returns, keeps `done`→HIGH / `in-progress`→LOW, and delegates close-out to
`audit-pr`. Check 10 keeps its grep labelled *legacy carriers only* and names
`phase-lint` / `check-phase-labels` as the lane-era owners. The report contract
is untouched: 15 checks, no `MEDIUM`.

`unit-route`'s scope fallback read only `## Objective` / `## Acceptance
criteria`, which the re-cut template does not ship, so a unit cut from it
derived `trivial` and silently skipped design, plan, tests, review and docs. It
now also counts `## Specs` requirements through the shared grammar
(`parseSpecs`) and a doc carrying three or more is never trivial.

`check-tasks-ticks`, `check-progress-entry` and `check-phase-labels` answer
`n/a` (`no ## Tasks section — legacy carrier`) instead of a vacuous
`valid: true` on a legacy unit, and `check-all` treats an `n/a` row as passing,
so the aggregate and its sub-checks tell one story.

The unit-doc templates (both repo trees and both exported twins) carry the
`type`/`scope` vocabulary block and the `## Triaged steps` slot, so a new unit is
cut with the surfaces the lane and the readers expect.

Prose that still described the retired carriers as current is re-pointed:
`log-session` pairs with the unit doc's `## Progress log`, and the
`product-audit` / `review-implementation` / `review-change` references name the
unit's own carrier (`audit-docs` check 11 discriminates it) instead of asserting
`TASKS.md`/`progress.md` for every unit.
