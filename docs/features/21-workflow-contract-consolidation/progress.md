# 21 — workflow-contract-consolidation · progress

Last reviewed: —

## P1 — 2026-08-03

- Done: Route cost measurement — manifest `SKILL_CONTEXT_BUDGETS.json` gains 14 named routes (plan-feature:scoped/issue, plan-fix:issue, execute-phase ×5, review-change ×4, audit-pr ×2); `check-skill-context.mjs` adds `--routes/--json/--route` with byte/4 route metrics and regression checks; `check-skill-context.test.mjs` covers unknown route, JSON shape, filtered route, bare `--route`, unknown-skill, estimate and lines regressions; baselines captured in `testing.md`; per-file mode backward compatible.
- Remains: none.
- Gotchas: route estimate = `Math.ceil(Buffer.byteLength(text,'utf8')/4)`; per-file mode still prints `PASS context budgets: N skills`; script's last line has no trailing newline (pre-existing, harmless). Prior interrupted run left P1 implemented but uncommitted — reconciled now.
- Files: scripts/check-skill-context.mjs, scripts/check-skill-context.test.mjs, docs/workflow/SKILL_CONTEXT_BUDGETS.json, docs/features/21-workflow-contract-consolidation/testing.md, docs/features/21-workflow-contract-consolidation/TASKS.md, docs/features/21-workflow-contract-consolidation/progress.md
- Next: P2 — Planning contract consolidation | unit not finished

## P2 — 2026-08-04

- Done: Planning contract consolidation — new internal `planning-preflight`
  (owns the normalized repository state read and the ONE final architectural
  classification) and `phase-contract` (owns the canonical eight-box phase-lint
  and the normalized phase fingerprint); `plan-feature` (3.4.0) and `plan-fix`
  (2.5.0) consume both with one immutable planning context; internals
  `plan-feature-from-issue` (1.7.0) and `plan-feature-scaffold` (1.13.0) drop
  their duplicated invariant/lint copies; feature/fix templates and mirrors slim
  to a phase-contract pointer + `Phase-lint: PASS (8/8) · fingerprint` record
  line; `execute-phase` PREFLIGHT points at the phase contract; the three
  planning routes gain reduced regression maxima in `SKILL_CONTEXT_BUDGETS.json`;
  all route totals now sit below their captured baselines.
- Remains: none.
- Gotchas: plan-fix grew above baseline when the two new consumption paths were
  added, so ~52 bytes of prose were trimmed to land at 3145 est/222 lines below
  the 3150/225 baseline; `PLANNING_GATES.md` deleted (route resolver only pulls
  `references/`-linked files, so `../skill` links change no route membership).
- Files: skills/planning-preflight/SKILL.md (new), skills/phase-contract/SKILL.md
  (new), skills/plan-feature/SKILL.md, skills/plan-feature/references/ROUTING.md,
  skills/plan-feature/references/PLANNING_GATES.md (deleted),
  skills/plan-feature-from-issue/SKILL.md, skills/plan-feature-scaffold/SKILL.md,
  skills/plan-feature-scaffold/references/SCAFFOLD_PROCESS.md, skills/plan-fix/SKILL.md,
  skills/plan-fix/references/PLANNING_PROCESS.md, skills/plan-fix/references/SPEC_CONTRACT.md,
  docs/features/_TEMPLATE/SPEC.md, docs/fix/_TEMPLATE/SPEC.md,
  template/docs/features/_TEMPLATE/SPEC.md, template/docs/fix/_TEMPLATE/SPEC.md,
  skills/execute-phase/references/PREFLIGHT.md, docs/workflow/SKILL_CONTEXT_BUDGETS.json,
  docs/features/21-workflow-contract-consolidation/{testing,TASKS,decisions,progress}.md
- Next: P3 — Execution route consolidation | unit not finished
