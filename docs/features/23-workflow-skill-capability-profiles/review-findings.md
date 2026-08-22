# Review findings — 23-workflow-skill-capability-profiles

Fix-now fold ledger for feature unit 23 (PR #140). Schema:

```
| id | file:line | axis | severity | class | route | folded |
```

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | packages/agentic-workflow-schema/src/index.ts:687-701, :705-713, :721 | code | minor | fix-now | fold into current unit | yes |
| F2 | packages/agentic-workflow-schema/src/index.ts:874-884 (guard emitted inert runtime lines into dist/index.js) | code | minor | fix-now | fold into current unit | yes |
| F3 | packages/agentic-workflow-schema/src/index.ts:695-703 (legacy `skill`, `output`, and `nativeFallback` became readonly; compatibility fixture produces TS2540) | code | major | fix-now | replan-in-unit P3 | yes |
| F4 | docs/features/23-workflow-skill-capability-profiles/ACCEPTANCE.md:8,13-14 (AC2 count is 13, AC7 English grep misses Spanish, AC8 alternation proves only one artifact) | workflow | major | fix-now | replan-in-unit P4 | yes |
| F5 | packages/agentic-workflow-schema/package.json:50 | code | high | fix-now | fold into current unit | yes |
| F6 | packages/agentic-workflow-schema/test/capabilities.test.mjs:273-308 | code | low | fix-now | fold into current unit | yes |
| F7 | docs/workflow/REPOSITORY_STATE.md | spec-drift | high | fix-now | fold into current unit | yes |
| F8 | docs/features/23-workflow-skill-capability-profiles/review-findings.md:13-14 | workflow | low | fix-now | fold into current unit | yes |
| F9 | docs/fix/142-skills-md-count-stale/SPEC.md (tracked but deleted in worktree) | workflow | med | fix-now | fold into current unit | yes |
| F10 | docs/features/23-workflow-skill-capability-profiles/SPEC.md (## Amendments) | spec-drift | low | fix-now | fold into current unit | yes |
| F11 | commit 7b344d7 (message language) | workflow | low | fix-now | fold into current unit | yes |
