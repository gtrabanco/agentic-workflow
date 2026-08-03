# 21 — workflow-contract-consolidation · progress

Last reviewed: —

## P1 — 2026-08-03

- Done: Route cost measurement — manifest `SKILL_CONTEXT_BUDGETS.json` gains 14 named routes (plan-feature:scoped/issue, plan-fix:issue, execute-phase ×5, review-change ×4, audit-pr ×2); `check-skill-context.mjs` adds `--routes/--json/--route` with byte/4 route metrics and regression checks; `check-skill-context.test.mjs` covers unknown route, JSON shape, filtered route, bare `--route`, unknown-skill, estimate and lines regressions; baselines captured in `testing.md`; per-file mode backward compatible.
- Remains: none.
- Gotchas: route estimate = `Math.ceil(Buffer.byteLength(text,'utf8')/4)`; per-file mode still prints `PASS context budgets: N skills`; script's last line has no trailing newline (pre-existing, harmless). Prior interrupted run left P1 implemented but uncommitted — reconciled now.
- Files: scripts/check-skill-context.mjs, scripts/check-skill-context.test.mjs, docs/workflow/SKILL_CONTEXT_BUDGETS.json, docs/features/21-workflow-contract-consolidation/testing.md, docs/features/21-workflow-contract-consolidation/TASKS.md, docs/features/21-workflow-contract-consolidation/progress.md
- Next: P2 — Planning contract consolidation | unit not finished
