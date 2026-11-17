# Measured acceptance — what the risk tier cost

The classifier (`packages/agentic-workflow/src/runner/risk-tiers.mjs`) decides which tier a unit is; this
ledger records what that tier cost, one row per measured session, and
`scripts/tier-cost.mjs` reads it. It exists because #360's non-goal forbids a
ceremony reduction that cannot show its measured delta: a `passive` unit that
skips the unit doc must be able to prove it skipped something.

**Row contract.** The block below is the grammar; `scripts/normative-drift.test.mjs`
reads it (`normative-surfaces@1`) and `scripts/tier-cost.mjs` refuses a table whose
header is not exactly its column list. A new column is a versioned grammar change,
never an extra cell: `tier-cost@2` (issue #504) added the work's identity and the
provider's token breakdown to the `@1` eight, and both grammars are read — a
project still on `@1` keeps appending and reading its eight cells, and the writer
follows whichever block the file declares.

**Who writes a row.** Only the metric sink of `@gtrabanco/pi-agentic-workflow`
(`turn_start` → `turn_end` → `session_shutdown`), from the numbers the model
provider and the tool runtime already produced. No human and no model types a
value here: a cell that came from a prompt would be the defect #383 S7 forbids.
Two sessions append on their own shutdowns from separate processes, and the
append is atomic, so neither row is lost to the other. The same sample is also
appended to a per-session JSONL file (`telemetry.jsonFile`, `.pi/.telemetry/`
`sessions.jsonl` by default — #504 S3) as one JSON object per line, for a consumer
that streams instead of reading this document.

**What a row never carries.** No derived fact: the tier and the ceremony counts are repository facts that `scripts/tier-cost.mjs` resolves from the unit's own carrier at read time, so a stored copy could only drift.  No prompt text, no model output, no diff, no file
content — and no session span. A session's first and last timestamps measure how
long a person was away, not how long the work took: measured here, the same
corpus shows gaps of 123 h against minutes of work. Time enters only as
`model_ms` and `tool_ms`, measured at turn boundaries.

**One row per session, not per day.** The unit and the date do not identify a
sample: one unit is worked across many sessions, and the second one would be
written over. The session half of `source` is what separates them, and the
writer's duplicate guard compares a whole row — an identical row is a repeated
emission, a different one is always a new sample.

**One sample per session, so `phase` names the command that started the measured
work** — the first unit-scoped command, the same rule `unit` follows. A session
that runs several phases is one row labelled by the first of them; splitting it
per phase needs a second accumulator and is a future widening, not a column.

```text
tier-cost@2
column | shape | what it holds
unit | `<issue>-<slug>` | the unit the sample belongs to, as its directory is named under `docs/fix/` or `docs/features/`, or its `docs/passive/` id
phase | `<command \| null>` | the command that started the measured work, from the closed `PHASE_LABELS` vocabulary the schema package publishes
version | `<semver \| null>` | the `@gtrabanco/pi-agentic-workflow` version that produced the sample, read from its manifest at emit time
model | `<model id \| null>` | the model that served the most turns of the session, the first seen on a tie; a session that named none carries `null`
changed_paths | `<integer>` | how many paths the unit changed, counted when the sample is written — a count taken earlier would describe the tree before the session worked; the size tier (`prose \| small \| large`) is derived from it at read time, never stored
tokens | `<integer>` | the provider's own token count, summed over the unit's turns
turns | `<integer>` | how many assistant turns the unit took
input_tokens | `<integer>` | the provider's `usage.input`, summed over the unit's turns
output_tokens | `<integer>` | the provider's `usage.output`, summed over the same turns
cache_read_tokens | `<integer>` | the provider's `usage.cacheRead`, summed over the same turns
cache_write_tokens | `<integer>` | the provider's `usage.cacheWrite`, summed over the same turns
reasoning_tokens | `<integer>` | the provider's `usage.reasoning`, summed over the same turns
model_ms | `<integer>` | milliseconds the model spent producing those turns
tool_ms | `<integer>` | milliseconds the unit's tools spent, from the runtime's monotonic clock
observed | `<YYYY-MM-DD>` | the date the sample was taken
source | `<producer>:<ref>` | the producer's own provenance string, so a row traces back to the run that wrote it — the shipped sink writes `pi:session=<session id>`, or `pi:session=instance-<ref>` for a caller that had no session id at hand, never a shared constant
```

The `tier-cost@1` grammar — `unit`, `changed_paths`, `tokens`, `turns`,
`model_ms`, `tool_ms`, `observed`, `source` — is still read and still written to
a ledger that declares it. A ledger declares exactly one grammar; two blocks in
one file is a refusal.

Ceremony steps, as `skills/execute-phase/references/risk-tiers.md` declares them:
a unit doc, its phases, an evidence table and a review pass. A `passive` unit
owes none of them, so it records `0` and skips `4` — and that number is derived
from its carrier, never from a promise.

## Reading it

```bash
bun scripts/tier-cost.mjs read --ledger docs/workflow/TIER_COST.md
bun scripts/tier-cost.mjs aggregate --ledger docs/workflow/TIER_COST.md
bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md
```

The reader stops at the first line of the table that is not a row, so the samples
table has to be last for the same reason the writer appends there.

The per-session JSONL is read by the report CLI, which answers JSON by default
and a markdown table on request:

```bash
bun scripts/telemetry-report.mjs --ledger docs/workflow/TIER_COST.md
bun scripts/telemetry-report.mjs --ledger docs/workflow/TIER_COST.md --by phase --human
bun scripts/telemetry-report.mjs --schema
```

`compare` exits `2` with `insufficient-corpus` while any tier that has samples
holds fewer than three units, naming the counts it saw. That is the honest
answer for this repository today: one unit of 128 recorded a tier. The
comparison is not a gate on anything — it reports.

## Samples

One row per measured session — a unit worked across three sessions is three
samples, and the per-tier aggregate is what reads them together. The table is
empty until the sink writes its first row; an empty table is a corpus of zero,
and the comparison says so instead of inventing a figure.

**This section is the file's last one, and that is a contract.** Two sessions of
one project append their rows from separate processes, so the writer takes an
`O_APPEND` on this file: the kernel places each line atomically and no byte of
what is already here is touched. No lock, no queue, no row lost to a concurrent
writer — and nothing may follow this table, because a row appended after
trailing prose would land outside it.

| unit | phase | version | model | changed_paths | tokens | turns | input_tokens | output_tokens | cache_read_tokens | cache_write_tokens | reasoning_tokens | model_ms | tool_ms | observed | source |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
