---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/pi-agentic-workflow": minor
---

feat(676): a sanctioned errata path for a stale journal entry

A session whose journal entry went stale had three walls and no door: the writer
refused the rewrite, `log-immutability` refused the fragment edit and delete, and
the refusal routed nowhere — so the entry was hand-edited and then hand-added as
a second fragment, which the carrier lint now refuses. The writer gains
`--supersedes <fragment>`: it lands the correction as a NEW fragment whose block
carries one `Supersedes` cell naming the fragment it corrects (the stale bytes
are never rewritten, `docs/LOGS.md` stays append-only), the receipt names the
corrected fragment, and the `already registered` refusal routes to the flag by
name. The carrier lint reads a slot as one entry plus the corrections that
declare it — newest first, every fragment but the oldest names the one
immediately older than it — and keeps refusing every other multi-fragment slot,
naming every file; the aggregator's newest-wins consume lands the correction
once. The marker's closed set is published in the schema package
(`JOURNAL_ERRATA_MARKERS`) and declared as a normative surface, and the skill
documents the stale-entry recipe.
