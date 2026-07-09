# 07 — roadmap-status-machine · PLAN

Phased implementation plan. Phases are labelled `P1, P2, …` and called *phases*.
Planning (this artifact set) is done; `P1` is the first implementation phase and
also commits the planning artifacts. The last phase (`P5`) is hardening. Opening
the PR is the final *step* of `P5`, not a phase of its own.

## P1 — Status vocabulary + legacy-compat note

Establish the five-state vocabulary every later phase reads.

- Rewrite `## Status legend` + `## Conventions` in `docs/features/ROADMAP.md`
  (repo) — add `idea`, `defined`; state the owning skill per transition; keep the
  dependency-must-be-merged rule; add "executable only when `planned`".
- Mirror the same rewrite in `template/docs/features/ROADMAP.md` (exported
  scaffold).
- Add the legacy-compat rule to `docs/workflow/MIGRATION.md`: a legacy `planned`
  row with a complete SPEC product half = `defined`+`planned` (no redirect).
- Commit this feature's planning artifacts (SPEC + this set) and register roadmap
  row 07.

## P2 — Sensor + executor read the machine

- `skills/workflow-status/SKILL.md`: parse `idea/defined/planned/in-progress/done`;
  `startable_now` requires `defined`+ and deps met; `idea` → `design_candidates`
  (next `/design-feature`); `defined`→`/plan-feature`, `planned`→`/execute-phase
  NN P1`. Add `design_candidates` to the envelope + sample envelope + human table.
- `skills/execute-phase/SKILL.md`: add own-status precondition to the Dependency
  gate — `idea`→`/design-feature`, `defined`→`/plan-feature`, `planned`+ proceeds;
  `--force` recorded, autopilot forbidden.
- Minor version bumps (bookkeeping deferred to P5's `bump-skill` run).

## P3 — Authoring skills set the status (the writes)

- `skills/design-feature/SKILL.md` + `skills/plan-feature-from-issue/SKILL.md`:
  set roadmap row → `defined` when stamping `## Design status: designed`.
- `skills/plan-feature-scaffold/SKILL.md`: set row `defined → planned` in its
  "Register in the roadmap" step.
- `skills/plan-feature/SKILL.md`: redirect gate keys on roadmap status first;
  SPEC `## Design status` marker as legacy fallback.
- Minor version bumps.

## P4 — ship-roadmap batch/JIT design

- `skills/ship-roadmap/SKILL.md`: founding interview = batch design (locked
  `SHIP_DECISIONS.md` is the design record); mid-run `idea` → JIT design from
  locked decisions with **no new questions** → promote `idea→defined→planned` →
  execute; undesignable → `NEEDS_INPUT` + park. Minor version bump.

## P5 — Hardening + bookkeeping

- Implement/verify the dev-scenario failure modes: `ship:undesignable`,
  `legacy:planned-compat`, `execute:redirect-idea`, `execute:redirect-defined`.
- Run `bump-skill`: minor bump each touched skill → `CHANGELOG.md` +
  `CHANGELOG.es.md` + README skills+model tables (EN/ES).
- Run `npx skills add . --list`; run every acceptance-criteria `grep`/`test`;
  `/audit-docs`; weak-model read-through; confirm no stack leakage, `##
  Portability` intact, `→ Next:` blocks last.
- Open the PR (`gh pr create --body-file …`) with `Closes #14`, print the URL,
  set roadmap row 07 → `done · [#PR]`, commit `docs: link PR #<n>` and push.
