---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(quality-metrics): the read-only project-quality sensor (issue #565)

`agentic-workflow quality-metrics` measures the project, not the workflow: the
DORA four keys plus the reversion ratio over a trailing window, printed as one
validated `quality-metrics@1` document. Every row carries `measured`, `derived`
or `unavailable`, and a metric that cannot be computed names its cause in
`degraded` instead of reporting a zero — the fail-closed rule is the feature,
not a footnote.

Six rows: the reversion ratio from git history, the change-failure rate linking
a revert's target commit to a merged pull, the lead time from a bounded
first-commit sample, PR volume and review latency from the forge, and the
escaped-defect slot read from the findings corpus the fold queue already parses.
Read-only: `--out` is the only byte it may write. `--until` pins the window so a
report is reproducible.

The metric definitions have one home — the runner crate's README — so a review
or an audit can cite them; the contract, its closed vocabularies and its
draft-07 JSON Schema live in the schema package.

The Pi package ships the same command beside them: `skills/runner-contract`'s
subcommand table gains the `quality-metrics` row, so the runner contract's
closed list keeps pace with the crate's dispatch table.
