---
"@gtrabanco/agentic-workflow-schema": patch
---

fix(schema): normalize ANSI escapes before the README-example assertion matches

The AC8 runnable-example test spawns the reference example as a child and
asserts its captured stdout proves freshness and revocation
(`fresh: true` → `fresh: false, reasonCode: 'stale-artifact-revision'`). In a
caller environment with terminal colors enabled, the child's `console.log`
inspects its values with ANSI escape sequences between the semantic tokens, so
the semantic regex failed on formatting, not content — the example compiled,
ran and exited 0. `compileAndRun` now strips escape sequences before matching:
the assertion's tokens, order and failure message are unchanged (justification
recorded in feature 28's path-protection records, 2026-11-05, owner-approved).
