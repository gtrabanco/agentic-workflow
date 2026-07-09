# 07 — roadmap-status-machine · TASKS

Per-phase checklists the executor ticks off. Labels are fixed `P1, P2, …`.

## P1 — Status vocabulary + legacy-compat note

- [ ] `docs/features/ROADMAP.md`: rewrite `## Status legend` to five states
      (`idea → defined → planned → in-progress → done`) with meanings + owning
      skill per transition
- [ ] `docs/features/ROADMAP.md`: update `## Conventions` — executable only when
      `planned`; dependency-must-be-merged unchanged
- [ ] `template/docs/features/ROADMAP.md`: mirror the same legend + conventions
      rewrite
- [ ] `docs/workflow/MIGRATION.md`: add legacy `planned`-with-designed-SPEC =
      `defined`+`planned` (no redirect) rule
- [ ] Register roadmap row `07 | roadmap-status-machine | in-progress | 06 | …`
- [ ] Commit planning artifacts (SPEC + PLAN + TASKS + progress + testing +
      known-issues + decisions + architecture-notes)

## P2 — Sensor + executor read the machine

- [ ] `workflow-status`: parse all five statuses in the roadmap-parse step
- [ ] `workflow-status`: `startable_now` requires status ≥ `defined` AND deps met
- [ ] `workflow-status`: `idea` rows → new `design_candidates` list, next
      `/design-feature`; never `startable_now`
- [ ] `workflow-status`: next-command per status (`defined`→`/plan-feature`,
      `planned`→`/execute-phase NN P1`)
- [ ] `workflow-status`: add `design_candidates` to envelope + update sample
      envelope + human summary table
- [ ] `execute-phase`: own-status precondition in the Dependency gate —
      `idea`→`/design-feature`, `defined`→`/plan-feature`, `planned`+ proceeds
- [ ] `execute-phase`: `--force` records the override; autopilot forbidden from it
- [ ] Bump `workflow-status` + `execute-phase` `version:` (minor)

## P3 — Authoring skills set the status

- [ ] `design-feature`: set roadmap row → `defined` when stamping `## Design
      status: designed` (add row as `idea` first if absent)
- [ ] `plan-feature-from-issue`: set roadmap row → `defined` alongside `Closes #N`
- [ ] `plan-feature-scaffold`: "Register in the roadmap" sets row `defined →
      planned`
- [ ] `plan-feature`: redirect gate keys on roadmap status first; SPEC `## Design
      status` as legacy fallback (legacy `planned`+designed-SPEC → no redirect)
- [ ] Bump the four skills' `version:` (minor)

## P4 — ship-roadmap batch/JIT design

- [ ] `ship-roadmap`: document founding interview = batch design (locked
      `SHIP_DECISIONS.md` is the design record)
- [ ] `ship-roadmap`: mid-run `idea` unit → JIT design from locked decisions,
      **no new questions** → promote `idea→defined→planned` → execute
- [ ] `ship-roadmap`: undesignable-from-record unit → `NEEDS_INPUT` + park
      (no silent guess, no mid-run interview)
- [ ] Bump `ship-roadmap` `version:` (minor)

## P5 — Hardening + bookkeeping

- [ ] Verify dev-scenario failure modes: `ship:undesignable`,
      `legacy:planned-compat`, `execute:redirect-idea`, `execute:redirect-defined`
- [ ] Run `bump-skill` → `CHANGELOG.md` + `CHANGELOG.es.md` rows for every touched
      skill + README skills+model tables (EN/ES)
- [ ] `npx skills add . --list` lists every skill (all parse)
- [ ] Run every acceptance-criteria `grep`/`test` command (AC 1,2,3,5,6,8,9)
- [ ] `/audit-docs` — cross-doc consistency clean
- [ ] Weak-model read-through of every edited skill (status precondition,
      `startable_now ≥ defined`, JIT no-questions contract each independently
      checkable)
- [ ] Confirm no stack leakage; `## Portability` + closing `→ Next:` intact in
      every touched user-facing skill
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown
      file, real backticks, never inline `--body`/heredoc that leaves
      `\`-escaped backticks) with `Closes #14` and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push
