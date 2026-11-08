---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
"review-change": minor
---

feat: operator-approved model routing for spawned review passes (issue #201)

The `passes` config key maps the published pass names plus the `default`
escape to `{model, thinking}` — `inherit`, `auto`, a pinned `provider/modelId`
reference, or a 1–4 reference chain — validated by the strict validator and
merged project-over-global per entry and per key. The runner crate ships the
`resolve-passes` subcommand: the deterministic `resolve-passes@1` receipt
resolving every pass through the fail-closed chain `passes.<name>` →
`passes.default` → the configured cheap tier (`commands.execute-phase`) → the
inline floor at the orchestrator's model, recorded with a reason; a malformed
selected route is a refusal, never a silent fallback. `PASS_NAMES` is
published once in the schema package and mirrored in the crate with its
provenance comment. `review-change` resolves every pass's model from the
resolved table before spawning, records the row's source in the pass record,
and states inline degrades in the report.
