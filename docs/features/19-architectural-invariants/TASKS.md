# 19 — architectural-invariants · TASKS

## P1 — Invariant contract

- [x] Add the English and Spanish workflow-invariant contract plus optional project template.
      Check: `test -f docs/workflow/WORKFLOW_INVARIANTS.md -a -f docs/workflow/WORKFLOW_INVARIANTS.es.md -a -f template/docs/architecture/ARCHITECTURAL_INVARIANTS.md`.
- [x] Register the document in the template guide, workflow index, and roadmap.
      Check: `grep -rq "WORKFLOW_INVARIANTS" docs/workflow template/CLAUDE.md`.
  Done-when: `test -f docs/workflow/WORKFLOW_INVARIANTS.md` → exit 0.

## P2 — Planning evaluation

- [x] Update initialization and planning roles to classify optional project invariants.
      Check: `grep -rl "ARCHITECTURAL_INVARIANTS.md" skills/init-workspace skills/design-feature skills/plan-feature skills/plan-feature-from-issue skills/plan-feature-scaffold | wc -l` → `5`.
- [x] Require an explicit architectural-decision route for a violation, new rule, or changed rule.
      Check: `grep -rq "explicit architectural decision" skills/init-workspace skills/design-feature skills/plan-feature skills/plan-feature-from-issue skills/plan-feature-scaffold`.
  Done-when: `grep -rl "ARCHITECTURAL_INVARIANTS.md" skills/init-workspace skills/design-feature skills/plan-feature skills/plan-feature-from-issue skills/plan-feature-scaffold | wc -l` → `5`.

## P3 — Execution evaluation

- [x] Update execution's pre-edit contract with optional invariant evaluation and the stop route.
      Check: `grep -q "Architectural invariants" skills/execute-phase/SKILL.md`.
- [x] Preserve NRS optional evidence consumption and repository truth.
      Check: `grep -q "REPOSITORY_STATE.md" skills/execute-phase/SKILL.md`.
  Done-when: `grep -q "explicit architectural decision" skills/execute-phase/SKILL.md` → exit 0.

## P4 — Review evaluation

- [x] Add invariant-preservation checks to `review-change` and `audit-pr`.
      Check: `grep -rl "Architectural invariants" skills/review-change skills/audit-pr | wc -l` → `2`.
- [x] Keep review/audit evidence-based and NRS read-only.
      Check: `grep -rq "REPOSITORY_STATE.md" skills/review-change skills/audit-pr`.
  Done-when: `grep -rl "Architectural invariants" skills/review-change skills/audit-pr | wc -l` → `2`.

## P5 — Hardening & PR

- [x] Verify all four dev scenarios in the owning contracts.
- [x] Run `npx skills add . --list` and record the result in `testing.md`.
- [x] Run and record golden fixtures for modified executor-path skills.
- [ ] Open a PR with `Closes #109`, link the roadmap, commit, and push.
