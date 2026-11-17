---
"@gtrabanco/pi-agentic-workflow": major
"@gtrabanco/agentic-workflow-schema": minor
---

feat(telemetry): extended telemetry — phase, version, model and the token breakdown (issue #504)

The session sample stops collapsing the provider's usage into one number. It now
carries the phase (the command that started the measured work, from the closed
`PHASE_LABELS` vocabulary), the package version that produced it, the model that
served the session's turns, and the five provider fields `tokens` is made of —
`input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_write_tokens` and
`reasoning_tokens`. A cost regression can be attributed to a work type, a model
and a version instead of an opaque total; the 2026-11-10 finding that led here
(one model burning ~1.57× the tokens of another for the same work) is the case
the ledger could not answer.

Two additions beside it:

- **A per-session JSONL sink.** The same sample is appended as one JSON object
  per line at the path `telemetry.jsonFile` names (inside the project's ignored
  `.pi` state directory by default), for a consumer that streams instead of
  reading a document. One switch, one path, no remote destination and no new
  consent gate.
- **`tier-cost@2`**, the ledger grammar that carries the new columns. `@1` is
  still read and still written to a ledger that declares it — the writer follows
  the file's own block — and a ledger declaring two grammars is refused.

The report reads either source and answers JSON by default
(`bun scripts/telemetry-report.mjs`, filters `--model`/`--unit`/`--from`/`--to`,
aggregation `--by phase|unit`, `--human` for a markdown table, `--schema` for the
sample's JSON Schema). The phase vocabulary is pinned to the repository's real
command surface by a coverage test: a new command without a label and a label
without a command both fail it.

**Breaking for the interface.** `TelemetrySample` gains required fields, so this
package's major moves; the schema package's minor is the published vocabulary
(`PHASE_LABELS`, the sample's field list and the JSON Schema derived from it).
