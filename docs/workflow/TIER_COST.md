# Measured acceptance — what the risk tier cost

The classifier (`scripts/risk-tiers.mjs`) decides which tier a unit is; this
ledger records what that tier cost, one row per unit sample, and
`scripts/tier-cost.mjs` reads it. It exists because #360's non-goal forbids a
ceremony reduction that cannot show its measured delta: a `passive` unit that
skips the unit doc must be able to prove it skipped something.

**Row contract.** The block below is the grammar; `scripts/normative-drift.test.mjs`
reads it (`normative-surfaces@1`) and `scripts/tier-cost.mjs` refuses a table whose
header is not exactly its column list. A new column is a versioned grammar change,
never an extra cell.

**Who writes a row.** Only the metric sink of `@gtrabanco/pi-agentic-workflow`
(`turn_start` → `turn_end` → `session_shutdown`), from the numbers the model
provider and the tool runtime already produced. No human and no model types a
value here: a cell that came from a prompt would be the defect #383 S7 forbids.

**What a row never carries.** No prompt text, no model output, no diff, no file
content — and no session span. A session's first and last timestamps measure how
long a person was away, not how long the work took: measured here, the same
corpus shows gaps of 123 h against minutes of work. Time enters only as
`model_ms` and `tool_ms`, measured at turn boundaries.

```text
tier-cost@1
column | shape | what it holds
unit | `<issue>-<slug>` | the unit the sample belongs to, as its directory is named under `docs/fix/` or `docs/features/`, or its `docs/passive/` id
tier | `passive` \| `standard` \| `high` | the tier the unit recorded in its own carrier; the reader re-resolves it and refuses a disagreement
changed_paths | `<integer>` | how many paths the unit changed; the size tier (`prose \| small \| large`) is derived from it at read time, never stored
tokens | `<integer>` | the provider's own token count, summed over the unit's turns
turns | `<integer>` | how many assistant turns the unit took
model_ms | `<integer>` | milliseconds the model spent producing those turns
tool_ms | `<integer>` | milliseconds the unit's tools spent, from the runtime's monotonic clock
ceremony_recorded | `<integer>` | how many of the four ceremony steps the unit's carrier actually delivered
ceremony_skipped | `<integer>` | how many of the four it did not: `4 - ceremony_recorded`, derived from the same carrier so the pair always sums to four
observed | `<YYYY-MM-DD>` | the date the sample was taken
source | `<producer>:<ref>` | the producer's own provenance string, so a row traces back to the run that wrote it
```

Ceremony steps, as `skills/execute-phase/references/risk-tiers.md` declares them:
a unit doc, its phases, an evidence table and a review pass. A `passive` unit
owes none of them, so it records `0` and skips `4` — and that number is derived
from its carrier, never from a promise.

## Samples

One row per unit sample. The table is empty until the sink writes its first row;
an empty table is a corpus of zero, and the comparison says so instead of
inventing a figure.

| unit | tier | changed_paths | tokens | turns | model_ms | tool_ms | ceremony_recorded | ceremony_skipped | observed | source |
|---|---|---|---|---|---|---|---|---|---|---|

## Reading it

```bash
bun scripts/tier-cost.mjs read --ledger docs/workflow/TIER_COST.md
bun scripts/tier-cost.mjs aggregate --ledger docs/workflow/TIER_COST.md
bun scripts/tier-cost.mjs compare --ledger docs/workflow/TIER_COST.md
```

`compare` exits `2` with `insufficient-corpus` while any tier that has samples
holds fewer than three units, naming the counts it saw. That is the honest
answer for this repository today: one unit of 128 recorded a tier. The
comparison is not a gate on anything — it reports.
