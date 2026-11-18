---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
---

feat(telemetry): `agentic-workflow telemetry reconstruct` rebuilds a session sample from Pi's transcripts and merges the missing ones (issue #624)

The wiring flushes a session's sample on `session_shutdown`; a host that keeps a
session alive between prompts — pi-web's normal shape — never fires it, so the
counters are lost while Pi's own transcript still holds the usage. The new
`telemetry reconstruct stats|samples|write` subcommand reads that store: `stats`
prints the `telemetry-reconstruct@1` totals plus the requested `--by-model` /
`--by-date` breakdowns, `samples` prints one JSON line per record (or dumps them
to `--jsonl`), and `write` appends only the sessions a destination does not
already carry, keyed by the session id after `pi:session=`/`pi:reconstruct=`, so
a forced second run adds nothing. It is manual by the owner's decision: no
session event reads a transcript.

A reconstructed record keeps `unit`, `phase`, `version`, `changed_paths` and
`tool_ms` `null` — a transcript cannot answer them and the reconstruction never
attributes a unit. The `tier-cost@2` ledger's count cells are digits only, so the
ledger row is a documented projection with `null` unit and `0` in those two
cells; `scripts/tier-cost.mjs` skips an unattributed row instead of refusing the
ledger, and a named unit that resolves to no carrier still refuses.

The `tier-cost@N` grammar and the ledger/JSONL appends moved to the crate's
`src/telemetry/ledger.mjs` so the universal CLI and the Pi sink share one reader
and one writer. `scripts/tier-cost.mjs` re-exports every name it published and
`telemetry-sinks.ts` keeps its two exports as thin wrappers, so both package
suites pass with their assertions untouched. Documented in the crate README,
`docs/workflow/CONFIG.md`, `docs/workflow/TIER_COST.md` and
`docs/features/494-telemetry-by-turn/SPEC.md`.
