---
"@gtrabanco/agentic-workflow": patch
---

chore(test): bound the package suite's per-test timeout

The `test` script in `packages/agentic-workflow/package.json` now passes
`--timeout=30000` to `bun test`, so a hung suite fails instead of idling the
gate's worker pool. Test-invocation change only — no shipped surface moves.
