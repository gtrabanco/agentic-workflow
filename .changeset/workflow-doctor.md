---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
"agentic-workflow-doctor": minor
"aw-doctor": minor
"runner-contract": minor
---

feat(workflow-doctor): the ceremony-failure doctor family and the skill that drives it

`workflow-doctor mine|battery|bundle|route|publish` mines the project's own
journal and unit docs for ceremony failures, carries the tool doctor's envelope
as-is, validates a triage file against the closed rubric, renders one anonymized
bundle and routes it upstream — with the consent-gated `publish` as the only
write. The `/agentic-workflow-doctor` skill owns the invocation chain and the
rubric table; `/aw-doctor` is its short-name pointer. The two commands join the published `PHASE_LABELS`
vocabulary so the telemetry label set and the command surface stay one set. Issue #703.
