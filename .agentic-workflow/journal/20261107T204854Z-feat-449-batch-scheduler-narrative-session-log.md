## 2026-11-07T20:48:54Z — feat/449-batch-scheduler-sensor — narrative
- **Commits:** 9 (`a649f3b3…7d6dacf5`)
- **Files:** 27 files
- **Summary:** feat/449-batch-scheduler-sensor — deterministic batch scheduler sensor: batch-plan@1 envelope, schema contract, scripts/batch-scheduler.mjs, user skill, 8 commits + PR #454
- **Decisions:** Own skill + script over workflow-status extended mode (read-only contract + S6 persistence); facts-not-policy (never caps lanes or launches); schema package as the closed contract; out-of-unit disclosed repair of pre-existing gate red (fragment name per fix-432's Next line); SKILL_CONTEXT_BUDGETS machineLines re-pinned exact 111→115; GATE_INVENTORY claim added for the four new normative surface ids
- **Next:** Owner external verification on PR #454, then merge decision
