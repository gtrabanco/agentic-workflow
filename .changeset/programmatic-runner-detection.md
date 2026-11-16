---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
"runner-contract": minor
"audit-docs": patch
"audit-pr": patch
"execute-phase": patch
"fold-findings": patch
"init-workspace": patch
"orchestration-envelope": patch
"pre-execution-review": patch
"review-change": patch
"review-implementation": patch
"review-verify": patch
"triage-issue": patch
"unit-lane": patch
"workflow-status": patch
---

feat(555): programmatic runner detection — the prose stays in the skills, pi goes programmatic

Runner selection is code wherever code consumes it. One resolver
(`packages/agentic-workflow/src/runner/resolve.mjs`) answers the closed set
`bunx` → `npx --yes` → `pnpm dlx` at the crate's own pin, gated by the crate's
own `engines`, with the documented `AGENTIC_WORKFLOW_RUNNER` override first and a
caller's installed bin second; with none of the set it fails closed naming every
candidate it tried. The new `runner resolve` subcommand prints that answer, and
`skills/runner-contract/references/RUNNER.md` declares the same set in its
`runner-set@1` block — the crate suite refuses a drift between the two.

The invocation prose has one home. Every skill now cites the symbolic
`runner <subcommand> [args…]` and points at RUNNER.md; the retired
"`npx` fallback" rule and the 145 restated invocations are gone, and RUNNER.md
states the cache/exact-pin contract once.

The pi package stops carrying the prose. Its bundle pointerises the contract's
invocation section (the declared projection, one hash-bound rule), its README
keeps no launcher example, and every crate spawn goes through `runnerLaunch` —
the same resolver, with the installed dependency first. The new deferred tool
`agentic_workflow_run` runs any subcommand a packaged skill cites, and the
GitHub action in `journal/` imports the crate's resolver instead of its own
private copy.
