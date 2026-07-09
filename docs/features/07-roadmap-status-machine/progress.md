# 07 — roadmap-status-machine · progress

Running log, one entry per phase (append as phases complete).

## Planning — 2026-07-09

Planned from issue [#14](https://github.com/gtrabanco/agentic-workflow/issues/14)
(U4). Product half authored by `plan-feature-from-issue` (capability closure
satisfied, `## Design status: designed`); engineering half + this artifact set by
`plan-feature-scaffold`. Size M, 5 phases (P5 hardening). Dependency
`06-design-feature` (#13 / PR #24) confirmed **merged**. Fix index empty; no
blocking fix-now issue. Roadmap row 07 registered.

## P1 — 2026-07-09

Rewrote `## Status legend` and `## Conventions` in `docs/features/ROADMAP.md`
and `template/docs/features/ROADMAP.md` to the five-state machine (`idea →
defined → planned → in-progress → done`), each state naming its owning skill
and next-action command, plus a state-transition diagram. Added the legacy
`planned`-with-designed-SPEC = `defined`+`planned` equivalence rule to
`docs/workflow/MIGRATION.md`. Registered roadmap row 07 as `in-progress`
(branch now open). Planning artifacts committed separately before this phase's
doc edits. AC1/AC2/AC9 grep checks pass (verified below).

## P2 — 2026-07-09

`workflow-status` 1.2.0: roadmap-parse step now recognizes all five statuses
(with the legacy-`planned` fallback per `MIGRATION.md`); new classification
step splits units into `design_candidates` (`idea`, deps-agnostic, next
`/design-feature`) vs `startable_now` (status ≥ `defined` AND deps met, next
command matched to the exact status — `defined`→`/plan-feature`,
`planned`→`/execute-phase NN P1`); `design_candidates` added as a top-level
envelope field with an updated sample envelope and human-summary line.

`execute-phase` 1.15.0: added an own-status precondition to the Dependency
gate section, running after the transitive-dependency closure is met and
still before any edit — `idea`→STOP→`/design-feature`,
`defined`→STOP→`/plan-feature`, `planned`+→proceed; `--force` skips the STOP
(never the check) and is recorded in `decisions.md`, same rule as the
dependency gate; machine envelope's `BLOCKED` state documented to cover this
gate too (`blockers[]` kind `own-status`).

`bump-skill` ran: both skills bumped minor, `CHANGELOG.md`/`CHANGELOG.es.md`
rows + release-log entries added, README/README.es skills table cells
updated. AC3, AC5 grep checks pass; `npx skills add . --list` still discovers
and parses every skill.

## P3 — _pending_

## P4 — _pending_

## P5 — _pending_
