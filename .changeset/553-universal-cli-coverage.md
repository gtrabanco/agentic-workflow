---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
"unit-lane": minor
"execute-phase": minor
"review-change": minor
"audit-pr": minor
"audit-docs": minor
"product-audit": minor
"fold-findings": minor
"log-session": minor
"init-workspace": minor
"triage-issue": minor
"batch-scheduler": minor
"runner-contract": minor
"review-implementation": minor
"review-verify": minor
"review-security": minor
"orchestration-envelope": minor
"discover-repository-state": minor
"resolve-repository-state": minor
---

feat(cli): every shipped skill cites the runner, never a script path

The 24 commands a shipped skill used to reach through `bun scripts/*.mjs` are
subcommands of `@gtrabanco/agentic-workflow`, and every citation now uses the
symbolic `runner <command>` form that `runner-contract` owns. A target project
ships no `scripts/` tree, so the old citations named files it never had.

`scripts/<name>.mjs` survives in this repository as a zero-logic shim behind the
`// cli-command:` marker, so the repository's own gate and suites judge the same
module a target gets. `docs/workflow/CLI.md` is the procedure; the coverage suite
refuses a shipped path, launcher or restated pin.
