# 18 — normalized-repository-state · TASKS

## P1 — NRS ledger template

- [x] Add `template/docs/workflow/REPOSITORY_STATE.md` with fixed categories,
      evidence fields, snapshot metadata, and frozen status.
      Check: `grep -q "Repository Facts" template/docs/workflow/REPOSITORY_STATE.md`.
- [x] Wire the artifact into template and workflow indexes.
      Check: `grep -rq "REPOSITORY_STATE.md" template docs/workflow`.
  Done-when: `grep -q "Repository Facts" template/docs/workflow/REPOSITORY_STATE.md` → exit 0.

## P2 — Repository-state skills

- [x] Add `skills/discover-repository-state/SKILL.md`; it produces only facts and freezes state.
      Check: `grep -q "Discovery skills produce only repository facts" skills/discover-repository-state/SKILL.md`.
- [x] Add `skills/resolve-repository-state/SKILL.md` with a sole-writer rule.
      Check: `grep -q "sole" skills/resolve-repository-state/SKILL.md`.
- [x] Define accepted/rejected evidence and a next frozen snapshot.
      Check: `grep -q "next frozen" skills/resolve-repository-state/SKILL.md`.
  Done-when: `test -f skills/discover-repository-state/SKILL.md -a -f skills/resolve-repository-state/SKILL.md` → exit 0.

## P3 — Planning and execution consumption

- [x] Update bootstrap, design, planning, and execution contracts.
      Check: `grep -rl "REPOSITORY_STATE.md" skills/init-workspace skills/design-feature skills/plan-feature skills/execute-phase`.
- [x] Preserve inspection for absent facts.
      Check: `grep -q "absent" skills/execute-phase/SKILL.md`.
  Done-when: `grep -rl "REPOSITORY_STATE.md" skills/init-workspace skills/design-feature skills/plan-feature skills/execute-phase | wc -l` → `4`.

## P4 — Review, audit, status, and orchestration consumption

- [x] Update reviewer, auditor, status, and orchestration contracts.
      Check: `grep -rl "REPOSITORY_STATE.md" skills/review-change skills/audit-pr skills/workflow-status skills/orchestration-envelope`.
- [x] Keep the machine-envelope package unchanged.
      Check: `git diff origin/main -- packages/agentic-workflow-schema` is empty.
  Done-when: `grep -rl "REPOSITORY_STATE.md" skills/review-change skills/audit-pr skills/workflow-status skills/orchestration-envelope | wc -l` → `4`.

## P5 — Hardening & PR

- [x] Verify all four dev scenarios in their owning contracts.
- [x] Run `npx skills add . --list` and record the result in `testing.md`.
- [ ] Golden fixtures are not run: this feature changes contracts but no live
      weakest-model runner is available in this session.
- [x] Opened [#114](https://github.com/gtrabanco/agentic-workflow/pull/114) with `Closes #110`, linked the roadmap, committed, and pushed.
