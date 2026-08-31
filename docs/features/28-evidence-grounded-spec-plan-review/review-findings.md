# review-findings — 28-evidence-grounded-spec-plan-review

Candidate-code review ran 2026-08-31 (review-change, single-reviewer, PR #155 head `a42c244b`). F7 (decision-required) and F21 (proposal) are intentionally not ledgered — non-fix-now findings keep their destinations from outcome routing (D3).

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | skills/workflow-status/references/SENSOR_CORE.md:69 + skills/execute-phase/references/PRE_EXECUTION_GATE.md:6 + skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md:93 | code | high | fix-now | fold | yes |
| F2 | docs/features/28-evidence-grounded-spec-plan-review/testing.md (Canary fields) + planning-obligations.md O9–O14 | spec-drift | high | fix-now | replan-in-unit | no |
| F3 | docs/features/ROADMAP.md:38 + docs/features/28-evidence-grounded-spec-plan-review/progress.md (P5 section) | workflow | high | fix-now | replan-in-unit | no |
| F4 | docs/workflow/GOLDEN_FIXTURE.md:304 | spec-drift | med | fix-now | fold | no |
| F5 | docs/workflow/SKILLS.es.md + docs/workflow/GOLDEN_FIXTURE.es.md | workflow | med | fix-now | fold | no |
| F6 | docs/features/28-evidence-grounded-spec-plan-review/TASKS.md (P5 section) | workflow | med | fix-now | replan-in-unit | no |
| F8 | docs/workflow/SKILL_CONTEXT_BUDGETS.json (plan-fix:issue route) + plan-fix path skill docs | perf | med | fix-now | fold (ceiling re-basis after F7 decision) | no |
| F9 | packages/agentic-workflow-schema/src/pre-execution-contract.ts:183-195 | code | med | fix-now | fold | yes |
| F10 | packages/agentic-workflow-schema/src/pre-execution.ts:150 + src/pre-execution-contract.ts:166 | code | med | fix-now | fold | yes |
| F11 | packages/agentic-workflow-schema/src/pre-execution.ts:1038-1041 | code | med | fix-now | fold | yes |
| F12 | skills/pre-execution-review/references/LEDGERS.md:19-27 + docs/features/_TEMPLATE/SPEC.md:255 | code | med | fix-now | fold | yes |
| F13 | skills/plan-fix/SKILL.md:62 + docs/fix/_TEMPLATE/SPEC.md:50 | code | med | fix-now | fold | yes |
| F14 | scripts/pre-execution-snapshot.mjs:88-96,184-186 | security | low | fix-now | fold | no |
| F15 | scripts/pre-execution-snapshot.mjs:97-99 | security | low | fix-now | fold | no |
| F16 | skills/workflow-status/references/PRE_EXECUTION.md:20 | code | low | fix-now | fold | yes |
| F17 | scripts/pre-execution-snapshot.mjs:171-215,237-252 | code | low | fix-now | fold | no |
| F18 | packages/agentic-workflow-schema/src/pre-execution.ts:541-546 | code | low | fix-now | fold | yes |
| F19 | scripts/pre-execution-snapshot.mjs:176-177 | perf | low | fix-now | fold | no |
| F20 | scripts/pre-execution-snapshot.mjs:193-195 | perf | low | fix-now | fold | no |
