# 18 — normalized-repository-state · TASKS

## P1 — NRS artifact and discovery contract

- [ ] Add `template/docs/workflow/REPOSITORY_STATE.md` with fixed categories,
      evidence fields, snapshot metadata, and frozen status.
      Check: `grep -q "Repository Facts" template/docs/workflow/REPOSITORY_STATE.md`.
- [ ] Add `skills/discover-repository-state/SKILL.md`; it produces only facts and freezes state.
      Check: `grep -q "Discovery skills produce only repository facts" skills/discover-repository-state/SKILL.md`.
- [ ] Wire the artifact into template and workflow indexes.
      Check: `grep -rq "REPOSITORY_STATE.md" template docs/workflow`.

## P2 — Contradiction resolution

- [ ] Add `skills/resolve-repository-state/SKILL.md` with a sole-writer rule.
      Check: `grep -q "sole" skills/resolve-repository-state/SKILL.md`.
- [ ] Define accepted/rejected evidence and a next frozen snapshot.
      Check: `grep -q "next frozen" skills/resolve-repository-state/SKILL.md`.

## P3 — Planning and execution consumption

- [ ] Update bootstrap, design, planning, and execution contracts.
      Check: `grep -rl "REPOSITORY_STATE.md" skills/init-workspace skills/design-feature skills/plan-feature skills/execute-phase`.
- [ ] Preserve inspection for absent facts.
      Check: `grep -q "absent" skills/execute-phase/SKILL.md`.

## P4 — Review, audit, status, and orchestration consumption

- [ ] Update reviewer, auditor, status, and orchestration contracts.
      Check: `grep -rl "REPOSITORY_STATE.md" skills/review-change skills/audit-pr skills/workflow-status skills/orchestration-envelope`.
- [ ] Keep the machine-envelope package unchanged.
      Check: `git diff origin/main -- packages/agentic-workflow-schema` is empty.

## P5 — Hardening & PR

- [ ] Verify all four dev scenarios in their owning contracts.
- [ ] Run `npx skills add . --list` and record the result.
- [ ] Run golden fixtures for every edited executor-path skill and update both language run logs.
- [ ] Open a PR with `Closes #110`, link the roadmap, commit, and push.
