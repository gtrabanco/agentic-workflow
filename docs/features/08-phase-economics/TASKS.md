# 08 — phase-economics · TASKS

Per-phase checklists the executor ticks off. Labels are fixed `P1, P2, …`.
Command-checkable items are written as the command to run (this feature's own
rule); judgement-only items are prose labelled read-verified.

## P1 — Hard split rule + cheap-executability checklist

- [x] `plan-feature-scaffold`: add the **hard split rule** (mandatory SPLIT on
      >~5 phases OR multi-layer/concern phase OR unresolved design decision; uses
      existing `Depends on:` infra; "more, smaller, slower is the accepted trade")
      — read-verified: rule uses `must`, all three triggers present
      (`skills/plan-feature-scaffold/SKILL.md` Process step 4)
- [x] `plan-feature-scaffold`: add the **per-phase cheap-executability checklist**
      (4 boxes: independently checkable · zero open decisions · one concern · gate
      runs locally; `n/a` explicit) — read-verified
      (`skills/plan-feature-scaffold/SKILL.md` Process step 4)
- [x] `docs/features/_TEMPLATE/SPEC.md`: replace soft "consider splitting" with the
      hard split-trigger rule → `grep -iq 'one layer\|more than one\|independently shippable' docs/features/_TEMPLATE/SPEC.md`
- [x] `template/docs/features/_TEMPLATE/SPEC.md`: mirror the same replacement →
      `grep -iq 'one layer\|more than one\|independently shippable' template/docs/features/_TEMPLATE/SPEC.md`
- [x] Confirm the old soft phrasing is gone in both templates — read-verified
      (`grep -rn "consider splitting" docs/features/_TEMPLATE/SPEC.md template/docs/features/_TEMPLATE/SPEC.md skills/plan-feature-scaffold/SKILL.md` → no matches)
- [x] Register roadmap row `08 | phase-economics | in-progress | — | …`
- [x] Commit planning artifacts (SPEC + PLAN + TASKS + progress + testing +
      known-issues + decisions + architecture-notes)

## P2 — Criteria-as-commands + one-phase-one-session

- [x] `plan-feature-scaffold`: instruct emitting command-checkable acceptance
      criteria as commands in `TASKS.md`/`testing.md` (prose only for
      judgement-only, labelled read-verified; reference feature 07's `testing.md`)
      → `grep -iq 'runnable command\|as the command\|command-checkable' skills/plan-feature-scaffold/SKILL.md`
- [x] `docs/features/_TEMPLATE/SPEC.md`: add the criteria-as-commands convention to
      the Acceptance-criteria section — read-verified
- [x] `template/docs/features/_TEMPLATE/SPEC.md`: mirror the convention —
      read-verified
- [x] `execute-phase`: add the one-phase-one-session rule to the Batch-execution
      section (never two phases/conversation on non-frontier models; `/loop`
      already re-invokes per phase; Portability fallback paired) →
      `grep -iq 'one phase = one session\|one phase per session\|one session' skills/execute-phase/SKILL.md`
- [x] `docs/workflow/FEATURE_WORKFLOW.md`: add the one-phase-one-session convention
      → `grep -iq 'one phase' docs/workflow/FEATURE_WORKFLOW.md`
- [x] `template/` mirror of `FEATURE_WORKFLOW` updated if present; else record the
      assumption in `decisions.md` — read-verified. No standalone
      `template/docs/workflow/FEATURE_WORKFLOW.md` exists; the rule was added to
      the equivalent `## Feature workflow` section in `template/CLAUDE.md`
      instead (recorded in `decisions.md`).
- [x] Bump `plan-feature-scaffold` (1.6.0 → 1.7.0) + `execute-phase`
      (1.15.0 → 1.16.0) `version:` (minor)

## P3 — Hardening + bookkeeping

- [x] Verify dev-scenario read-throughs: `plan:split-oversize`,
      `plan:split-multilayer`, `plan:open-decision`, `plan:criteria-as-commands`,
      `exec:one-phase-session` (each rule present + independently checkable)
- [x] Run `bump-skill` → `CHANGELOG.md` + `CHANGELOG.es.md` rows for each touched
      skill + README skills+model tables (EN/ES)
- [x] `npx skills add . --list` lists every skill (all parse)
- [x] Run every acceptance-criteria command (AC1–AC9):
      `grep -iq 'must' skills/plan-feature-scaffold/SKILL.md` ·
      `grep -iq 'cheap-executab' skills/plan-feature-scaffold/SKILL.md` ·
      `grep -iq 'runnable command\|as the command\|command-checkable' skills/plan-feature-scaffold/SKILL.md` ·
      `grep -iq 'one phase = one session\|one phase per session\|one session' skills/execute-phase/SKILL.md` ·
      `grep -iq 'one phase' docs/workflow/FEATURE_WORKFLOW.md` ·
      `grep -iq 'one layer\|more than one\|independently shippable' docs/features/_TEMPLATE/SPEC.md` ·
      `grep -iq 'one layer\|more than one\|independently shippable' template/docs/features/_TEMPLATE/SPEC.md`
- [x] `/audit-docs` — cross-doc consistency clean (repo↔template mirror check) → PASS
- [x] Weak-model read-through of `plan-feature-scaffold` + `execute-phase` (each
      new rule a fixed checklist item, not a heuristic)
- [x] Confirm no stack leakage; `## Portability` + closing `→ Next:` intact on
      `execute-phase`
- [x] open the PR (`gh pr create --body-file <path>` — body written as a Markdown
      file, real backticks, never inline `--body`/heredoc that leaves
      `\`-escaped backticks) with `Closes #15` and PRINT THE PR URL in the chat
      → https://github.com/gtrabanco/agentic-workflow/pull/26
- [x] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [x] commit `docs: link PR #<n>` and push
