# Review findings — 23-workflow-skill-capability-profiles

Fix-now fold ledger for feature unit 23 (PR #140). Schema:

```
| id | file:line | axis | severity | class | route | folded |
```

| id | file:line | axis | severity | class | route | folded |
|---|---|---|---|---|---|---|
| F1 | packages/agentic-workflow-schema/src/index.ts:687-701, :705-713, :721 | code | minor | fix-now | fold into current unit | yes |
| F2 | packages/agentic-workflow-schema/src/index.ts:874-884 (guard emitted inert runtime lines into dist/index.js) | code | minor | fix-now | fold into current unit | yes |