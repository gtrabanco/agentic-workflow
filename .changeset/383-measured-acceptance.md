---
"@gtrabanco/pi-agentic-workflow": major
---

feat(pi-agentic-workflow)!: session telemetry for the measured acceptance

The package measures what a unit cost from Pi's own numbers — provider tokens per
turn, model time from the turn window minus its tools, tool time from the
runtime's monotonic clock — and appends one `tier-cost@1` row per measured
session to the project's measured-acceptance ledger, naming that session in
`source`. A session's first and last timestamps are never used: they measure how
long a person was away, not how long the work took.

The only Pi surface this needs is `tool_execution_end.durationMs`, which arrives
in 1.1.0, so the peer floor moves from `>=0.99.1` to `>=1.1.0` — a breaking change
for a consumer still on 0.99.x, which is why the intent is `major`.
