---
"@gtrabanco/agentic-workflow": minor
---

feat(675): the carrier lint keeps one entry per conversation per kind

The "one entry per conversation per kind" rule was enforced only at write time,
and the carrier lint validated each fragment in isolation, so two fragments of
one conversation and kind with different bytes both passed `journal aggregate
--check` and the aggregator appended both — dedupe only ever asked whether the
bytes were already in the journal. The lint now compares the parsed identity
across fragments: a slot holding more than one conforming fragment is one
refusal naming every file, with no byte moved. The aggregator stops depending
on byte coincidence too — it keeps the newest fragment of a slot and records
each superseded one, and the fragment that superseded it, in the receipt's
`superseded` row. The shared `local` session slug names no conversation and
stays exempt on both sides, from one predicate the writer and the lint share.
