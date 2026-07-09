# 08 — phase-economics · progress

Running log, one entry per phase (append as phases complete).

## Planning — 2026-07-10

Planned from issue [#15](https://github.com/gtrabanco/agentic-workflow/issues/15)
(U5). Product half authored by `plan-feature-from-issue` (capability closure
satisfied, `## Design status: designed`); engineering half + this artifact set by
`plan-feature-scaffold`. Size **M**, 3 phases (P3 hardening) — the feature
satisfies its own new hard split rule (≤ 5 phases, each one concern, no open
decisions). Soft dependencies `06-design-feature` (#13 / PR #24) and
`07-roadmap-status-machine` (#14 / PR #25) both confirmed **merged** — nothing
gates start; roadmap `Depends on` = `—`. Fix index empty; no blocking fix-now
issue touches `plan-feature-scaffold`, `execute-phase`, the SPEC template, or
`FEATURE_WORKFLOW.md`. Roadmap row 08 registered at `planned`.

## P1 — 2026-07-10

`plan-feature-scaffold` (Process step 4, before the XS/S→M/L split) gained the
**hard split rule** ("Split — mandatory, not advisory": >~5 phases OR
multi-layer/concern phase OR unresolved design decision → `Depends on:`-chained
split, using the existing dependency infra) and the **per-phase
cheap-executability checklist** (4 boxes: independently checkable · zero open
decisions · one concern · gate runs locally; `n/a` explicit). Both SPEC templates
(`docs/features/_TEMPLATE/SPEC.md` and `template/docs/features/_TEMPLATE/SPEC.md`)
had their soft "**L**: consider splitting" line replaced with the same hard
split-trigger wording — confirmed identical via `grep`; old phrasing confirmed
gone from all three touched files. Roadmap row 08 flipped `planned → in-progress`.
No design decisions were needed (all resolved in the SPEC already). Version bump
for `plan-feature-scaffold` is a P2 task per `TASKS.md` (it edits the skill again
for criteria-as-commands); not bumped here to avoid a throwaway intermediate
version between P1 and P2 edits to the same file.

## P2 — 2026-07-10

`plan-feature-scaffold`'s `TASKS.md`/`testing.md` generation bullets now instruct
emitting command-checkable acceptance criteria as the command, prose only for
judgement-only criteria (labelled `read-verified`), referencing feature 07's
`testing.md` as the shape. Both SPEC templates' Acceptance-criteria sections got
the same convention. `execute-phase` gained the **one phase = one session** rule
right before its Batch-execution section, paired with the Portability fallback
already present ("No `/loop`" bullet). `FEATURE_WORKFLOW.md` (Stage 2) carries the
same rule. `template/docs/workflow/FEATURE_WORKFLOW.md` does not exist — no
standalone workflow-convention doc in `template/` — so the rule was mirrored into
the equivalent `## Feature workflow` section of `template/CLAUDE.md` instead
(decision recorded in `decisions.md`). Both touched skills bumped minor:
`plan-feature-scaffold` 1.6.0 → 1.7.0, `execute-phase` 1.15.0 → 1.16.0 (version
numbers only — the changelog/README bookkeeping via `bump-skill` is a P3 task).
All P2 acceptance-criteria greps (AC3–AC7) pass; `npx skills add . --list` exits 0
with both skills parsed.
