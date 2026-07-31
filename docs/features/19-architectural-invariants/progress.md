# 19 — architectural-invariants · progress

Last reviewed: —

## P1 — 2026-07-31
- Done: Added the optional invariant contract, template, bilingual index, and planning artifacts.
- Remains: P2 — Planning evaluation
- Gotchas: Invariant absence is a compatible `n/a` outcome; NRS remains an optional evidence source.
- Files: docs/workflow/WORKFLOW_INVARIANTS.md, docs/workflow/WORKFLOW_INVARIANTS.es.md, template/docs/architecture/ARCHITECTURAL_INVARIANTS.md, template/CLAUDE.md, docs/features/19-architectural-invariants/
- Next: P2 — Planning evaluation

## P2 — 2026-07-31
- Done: Updated bootstrap and planning roles to classify optional project invariants and stop for explicit architectural decisions.
- Remains: P3 — Execution evaluation
- Gotchas: The NRS ledger is optional when absent; a present non-frozen ledger still routes to discovery or resolution.
- Files: skills/init-workspace/SKILL.md, skills/design-feature/SKILL.md, skills/plan-feature/SKILL.md, skills/plan-feature-from-issue/SKILL.md, skills/plan-feature-scaffold/SKILL.md, CHANGELOG.md, CHANGELOG.es.md, README.md, README.es.md
- Next: P3 — Execution evaluation

## P3 — 2026-07-31
- Done: Added an evidence-based, pre-edit architectural-invariant gate to execution.
- Remains: P4 — Review evaluation
- Gotchas: The fixed BLOCKED report distinguishes a required architecture decision from an NRS evidence contradiction.
- Files: skills/execute-phase/SKILL.md, CHANGELOG.md, CHANGELOG.es.md, README.md, README.es.md, docs/features/19-architectural-invariants/
- Next: P4 — Review evaluation
