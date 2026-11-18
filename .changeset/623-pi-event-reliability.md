---
"@gtrabanco/pi-agentic-workflow": patch
---

fix(623): pi event reliability — emit at the settled run, document the matrix

The extension's observable effects no longer depend on `session_shutdown` alone,
which fires only when a runtime is torn down: the telemetry sample is emitted at
every settled run (JSONL one cumulative line per run, ledger one row per session
upserted on `source`), the journal entry is published at the first boundary the
session reaches, `AG_WF_PHASE` is cleared at `session_start`, and stale session
markers are swept. The event-by-host reliability matrix ships in
`docs/workflow/CONFIG.md`.
