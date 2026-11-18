---
"@gtrabanco/agentic-workflow": minor
---

Telemetry merge safety (issue #630): `docs/workflow/TIER_COST.md` and the JSONL
sample store (`.pi/.telemetry/sessions.jsonl`) join the shared-document merge
classes as an append-only `telemetry` class — the union is computed and its delta
**appended** to `%A` (`appendFileSync`-compatible, never staging+rename),
deduplicated by row `source` / line identity, refusing closed when a side is not
an append-only extension of the base. The git mechanics move into
`src/writer/shared-merge.mjs` (with `bin/shared-merge.mjs` as its crate entry) so
the new `agentic-workflow telemetry merge-install` can arm a working driver in a
project that ships no `scripts/` tree; `telemetry reconstruct write` arms the same
key as part of its reconciliation. `scripts/shared-doc-merge.mjs` stays the
documented entry and gains no second grammar.
