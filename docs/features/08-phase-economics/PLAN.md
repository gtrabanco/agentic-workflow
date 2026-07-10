# 08 — phase-economics · PLAN

Phased implementation plan. Phases are labelled `P1, P2, …` and called *phases*.
Planning (this artifact set) is done; `P1` is the first implementation phase and
also commits the planning artifacts. The last phase (`P3`) is hardening. Opening
the PR is the final *step* of `P3`, not a phase of its own. Three phases (≤ 5,
each one concern) — the feature satisfies its own new split rule.

## P1 — Hard split rule + cheap-executability checklist

Establish the mandatory phase-cutting discipline in the planner and the shared
SPEC template.

- `skills/plan-feature-scaffold/SKILL.md`, Process step 4: add the **hard split
  rule** block — SPLIT into `Depends on:`-chained features is **mandatory** on any
  of: >~5 phases, a phase touching >1 layer/concern, a phase needing a design
  decision unresolved in SPEC/decisions.md. State "more, smaller, slower features
  is the accepted trade." Reuse the existing dependency infrastructure.
- Same skill: add the **per-phase cheap-executability checklist** (✓ every task
  independently checkable without judgement · ✓ zero open design decisions · ✓ one
  layer/concern · ✓ gate runs locally; `n/a` explicit). A phase failing any box is
  re-cut/split.
- `docs/features/_TEMPLATE/SPEC.md` **and** `template/docs/features/_TEMPLATE/SPEC.md`:
  replace the Size section's soft "**L** … consider splitting" with the hard
  split-trigger wording (mirror both copies).
- Commit this feature's planning artifacts (SPEC + this set) and register roadmap
  row 08 as `in-progress`.

## P2 — Criteria-as-commands + one-phase-one-session

- `skills/plan-feature-scaffold/SKILL.md`: instruct emitting **command-checkable
  acceptance criteria as commands** in `TASKS.md`/`testing.md` (prose only for
  judgement-only criteria, labelled read-verified); reference feature 07's
  `testing.md` as the shape.
- `docs/features/_TEMPLATE/SPEC.md` **and** `template/docs/features/_TEMPLATE/SPEC.md`:
  add the criteria-as-commands convention to the Acceptance-criteria section
  (mirror both).
- `skills/execute-phase/SKILL.md`, Batch-execution section (~line 434): add the
  **one-phase-one-session** rule box (never two phases per conversation on
  non-frontier models; `/loop` already clears+re-invokes per phase; pair the
  `/loop` convenience with the generic re-invoke fallback in `## Portability`).
- `docs/workflow/FEATURE_WORKFLOW.md` (+ `template/` mirror if present, else record
  the assumption in `decisions.md`): add the one-phase-one-session convention.
- Minor version bumps for `plan-feature-scaffold` + `execute-phase` (bookkeeping
  deferred to P3's `bump-skill` run).

## P3 — Hardening + bookkeeping

- Verify the dev-scenario read-throughs: `plan:split-oversize`,
  `plan:split-multilayer`, `plan:open-decision`, `plan:criteria-as-commands`,
  `exec:one-phase-session` (each new rule present and independently checkable in
  the skill body).
- Run `bump-skill`: minor bump each touched skill → `CHANGELOG.md` +
  `CHANGELOG.es.md` rows + README skills+model tables (EN/ES).
- Run `npx skills add . --list` (all parse); run every acceptance-criteria
  `grep`/`--list` command (AC1–AC9); `/audit-docs` (expect no drift, mirror check
  clean); weak-model read-through; confirm no stack leakage and
  `## Portability` + closing `→ Next:` intact on `execute-phase`.
- Open the PR (`gh pr create --body-file <path>`) with `Closes #15`, print the
  URL, set roadmap row 08 → `done · [#PR]`, commit `docs: link PR #<n>` and push.
