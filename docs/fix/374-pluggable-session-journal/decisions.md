# Decisions — fix/374-pluggable-session-journal

The unit's decisions are `D` lines in `SPEC.md` `## Log`. This file carries the
`path-protection-records@1` escape records the path-protection policy requires
when a protected path is touched. Append-only: a removal or a lowering is
ignored by the gate.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/test/journal.driver.test.mjs | P1 | 2026-11-07 | execute-phase | Pre-observation corpus cleanup, before the RED run: merge the entryToFacts import into the file's single import block (it was drafted as a mid-file import) and replace a tautological journal-equality assertion with a real before/after comparison in the carrier-routing case. No assertion is relaxed, deleted or narrowed — the corpus has not been observed green (or run at all) yet, so this is the RED corpus being written, not a test being edited to pass.
```
