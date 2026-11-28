---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
---

feat(634): claim staleness projection — project `changedPaths` onto a unit's claim ledger

`pre-execution-snapshot` gains a fourth op, `claims`, which projects the sensor's
own `changedPaths` attribution (`changedBoundPaths`, the reader `verify` already
reports drift through) onto a unit folder's CLAIM/INV rows and marks a row
`stale (P<n> · <sha>)` when the bytes it cites moved after a recorded phase. The
phase map is the unit doc's `## Log` `P<n>` lines, read through the shared
`parseLog`; the mark lands in an appended `staleness` column by `--write`, and a
second run is byte-identical because the column is detected rather than appended
twice. Only the CLAIM/INV tables and only the rows the projection answered are
rewritten.

It reports and never gates: the default exit is 0 whatever the rows say, `--check`
answers 1 when a row came back `stale`, and no surface consumes that code — the
blocking policy stays undecided until a real case decides it. Three no-signal
states (`no-citation`, `unverified: no-recorded-phase`,
`unverified: unresolvable-revision (P<n>)`) exist so a row is never read as a
false `fresh`. The mark vocabulary is runner-internal and stays in its own module
under `vocabulary-residency@1`.

Issue #634 was trigger-gated and parked; the owner waived the gate rather than
claiming a trigger fired, and the unit's `decisions.md` records that as `D1`.
