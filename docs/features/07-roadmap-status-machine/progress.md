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

## P3 — 2026-07-09

The authoring skills now **write** the status transitions instead of only the
sensor/executor reading them:

- `design-feature` 1.1.0 — stamping `## Design status: designed` also sets
  the feature's roadmap row to `defined` (added at `idea` first if the row
  didn't exist); `NEEDS_INPUT` leaves both the marker and the row unchanged.
  Turn contract + Done when gained matching boxes.
- `plan-feature-from-issue` 1.4.0 — same `idea → defined` write, performed
  when this skill (not `design-feature`) is the one satisfying closure for an
  issue-born feature.
- `plan-feature-scaffold` 1.6.0 — "Register in the roadmap" now sets the row
  to `planned` (promoting an existing `defined` row, or adding a wholly new
  row directly at `planned` for an already-scoped SPEC with no prior entry).
- `plan-feature` 2.1.0 — the redirect gate now reads the **roadmap status**
  first (`defined`+ proceeds, `idea`/absent STOPs); the SPEC `## Design
  status` marker is retained only as the legacy-compat fallback for a
  pre-migration plain-`planned` row (per `docs/workflow/MIGRATION.md`).

`bump-skill` ran for all four: CHANGELOG/CHANGELOG.es rows + release-log
updates, README/README.es skills-table cells for `design-feature` and
`plan-feature`. AC6 grep checks pass; `npx skills add . --list` still
discovers and parses every skill.

## P4 — 2026-07-09

`ship-roadmap` 1.11.0 now complies with the roadmap status machine instead of
being exempted from it:

- **Founding = batch design.** Documented that interview rounds 2–4 already
  collect every product-definition answer `design-feature`'s capability
  closure would ask. Founding writes feature rows at `idea` (locked decisions
  are the design record, no per-feature SPEC yet); the founding-scaffolded
  skeleton feature (01, greenfield) is scaffolded immediately and lands
  directly at `planned`.
- **New DESIGN stage.** SELECT now picks `idea`/`defined` units too (not only
  `planned`); ADVANCE gains a DESIGN stage that composes `design-feature` +
  `plan-feature-scaffold` in-turn, deriving strictly from `SHIP_DECISIONS.md`
  — no new questions, preserving the "no further questions after the
  interview" contract — promoting `idea → defined → planned` before PLAN.
- **Undesignable → park.** A unit that contradicts a locked decision or needs
  an unanswered question is parked (`blockers[]` kind `undesignable`,
  `needs_input` records the specific gap), `state` stays `CONTINUE` (a
  per-unit park, not a run halt) — SELECT moves on to the next startable unit.
- Stage-sequence line, model-routing table, stop-conditions table, and
  Relationship-to-skills updated to include DESIGN.

`bump-skill` ran: CHANGELOG/CHANGELOG.es row + release-log update, README/
README.es skills-table cell. AC8 grep checks (`JIT`/`just-in-time` and
`NEEDS_INPUT`) pass; `npx skills add . --list` still discovers and parses
every skill.

## P5 — _pending_
