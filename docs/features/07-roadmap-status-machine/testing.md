# 07 — roadmap-status-machine · testing

No application build exists — "green" is the repo's doc-verification gate
(`CLAUDE.md` → Verification). Layers below in order of authority.

## Structural

- `npx skills add . --list` lists every skill (all touched SKILL.md files parse).

## Textual (acceptance criteria as runnable commands)

Run from repo root; each maps to a SPEC acceptance criterion.

```sh
# AC1/AC2 — five-state legend, repo + template
grep -q '`idea`'    docs/features/ROADMAP.md
grep -q '`defined`' docs/features/ROADMAP.md
grep -q '`idea`'    template/docs/features/ROADMAP.md
grep -q '`defined`' template/docs/features/ROADMAP.md
# AC3 — workflow-status parses the machine
grep -iq 'design_candidates' skills/workflow-status/SKILL.md
grep -iq 'defined'           skills/workflow-status/SKILL.md
# AC5 — execute-phase gate redirects sub-planned units
grep -q '/design-feature' skills/execute-phase/SKILL.md
grep -q '/plan-feature'   skills/execute-phase/SKILL.md
# AC6 — authoring skills set the status
grep -iq 'defined' skills/design-feature/SKILL.md
grep -iq 'defined' skills/plan-feature-from-issue/SKILL.md
grep -iq 'planned' skills/plan-feature-scaffold/SKILL.md
# AC8 — ship-roadmap batch/JIT design + NEEDS_INPUT
grep -iEq 'jit|just-in-time' skills/ship-roadmap/SKILL.md
grep -iq  'NEEDS_INPUT'       skills/ship-roadmap/SKILL.md
# AC9 — legacy compat documented
grep -iq 'defined' docs/workflow/MIGRATION.md
```

Read-verified criteria (no single grep suffices): AC4 (envelope example),
AC7 (plan-feature roadmap-status-first gate + legacy fallback), AC12/AC13
(no stack leakage, `## Portability` intact), AC14 (PR carries `Closes #14`).

## Cross-doc

- `bump-skill` bookkeeping consistent: each touched skill's `version:` ↔ changelog
  rows EN/ES ↔ README skills+model tables EN/ES.
- Documentation-map + skill-reference links resolve.
- Run `/audit-docs` after the edits — expect no drift.

## Weak-model read-through

Re-read each edited skill as the fleet's weakest model would execute it:

- `execute-phase` own-status precondition: `idea→design`, `defined→plan`,
  `planned+` proceed — each branch independently checkable, `--force` recorded.
- `workflow-status` `startable_now ≥ defined` and `idea → design_candidates`
  mapping — a fixed rule, not a heuristic.
- `ship-roadmap` JIT design **derive-only, no new questions**; undesignable →
  `NEEDS_INPUT` (never a prompt).

## Manual dry-runs

1. `workflow-status` on a roadmap with an `idea` row and a `defined` row → former
   in `design_candidates` (next `/design-feature`), latter in `startable_now`
   (next `/plan-feature`).
2. `execute-phase` on a `defined` unit → `/plan-feature` redirect fires;
   on an `idea` unit → `/design-feature` redirect fires.
3. A legacy `planned`-with-designed-SPEC row → no redirect (treated `defined`+).

## P5 verification (read-through, this repo has no runtime harness)

- `status:idea-candidate` / `status:defined-startable` — `workflow-status`
  SKILL.md step 5 (readiness classification) matches the SPEC's dev scenarios
  verbatim: `idea` → `design_candidates` only, `defined`/`planned` + deps met
  → `startable_now` with the status-matched next command.
- `execute:redirect-idea` / `execute:redirect-defined` — `execute-phase`
  SKILL.md's "Own-status precondition" section prints the fixed `idea`/
  `defined` STOP blocks verbatim, `--force` recorded per the same rule as the
  dependency gate.
- `legacy:planned-compat` — `plan-feature`'s redirect gate step 3 and
  `execute-phase`'s own-status step 4 both state the identical equivalence
  rule (legacy plain-`planned` + designed SPEC → `defined`+`planned`, no
  redirect), matching `docs/workflow/MIGRATION.md`.
- `ship:jit-design` / `ship:undesignable` — `ship-roadmap`'s new DESIGN stage
  composes `design-feature` + `plan-feature-scaffold` deriving only from
  `SHIP_DECISIONS.md`, no new questions; an undesignable unit is parked
  (`blockers[]` kind `undesignable`, `state: CONTINUE`) rather than asked —
  matches the SPEC's "no further questions after the interview" contract.

Verified 2026-07-09: AC1/AC2/AC3/AC5/AC6/AC8/AC9 grep commands all pass;
`npx skills add . --list` discovers and parses every skill (115 lines of
output, no parse errors); `/audit-docs` returned PASS with 0 findings across
12/14 applicable checks (8 and 13 n/a — no invariant-ID convention, no
`Docs site` block).
