# Decisions — fix/374-pluggable-session-journal

The unit's decisions are `D` lines in `SPEC.md` `## Log`. This file carries the
`path-protection-records@1` escape records the path-protection policy requires
when a protected path is touched. Append-only: a removal or a lowering is
ignored by the gate.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/test/journal.driver.test.mjs | P1 | 2026-11-07 | execute-phase | Pre-observation corpus cleanup, before the RED run: merge the entryToFacts import into the file's single import block (it was drafted as a mid-file import) and replace a tautological journal-equality assertion with a real before/after comparison in the carrier-routing case. No assertion is relaxed, deleted or narrowed — the corpus has not been observed green (or run at all) yet, so this is the RED corpus being written, not a test being edited to pass.
justification | packages/agentic-workflow-schema/test/journal-entry.test.mjs | P1 | 2026-11-07 | execute-phase | Pre-observation corpus alignment, before any GREEN run: the timestamp case split so the impossible-instant refusal (2026-13) is asserted against the runtime validator alone — draft-07 cannot express instant parseability without ajv-formats (not a dependency), so the schema carries component ranges and the validator the stricter rule. The bothWays Ajv-agreement discipline stays intact for every pattern-expressible rule; no assertion weakened where the schema can express it.
justification | packages/agentic-workflow/test/journal.driver.test.mjs | P1 | 2026-11-07 | execute-phase | Second pre-observation corpus alignment, before any GREEN run: (a) awaits made uniform — the contract allows async methods and the reference SQLite driver is the async half, so the conformance loop and the parity/round-trip cases await; (b) the insert-only case asserts metadata absent-or-empty instead of strictly {} (a parsed entry carries no metadata key when none was written — the assertion's meaning is unchanged); (c) the mutating-driver fixture rewrites a heading it actually matches (auto (clear) → auto (mutated), the harness's own mechanical entry) so the conformance snapshot check has a real mutation to catch; no assertion relaxed, deleted or narrowed.
justification | packages/agentic-workflow/test/journal.surfaces.test.mjs | P7 | 2026-11-07 | execute-phase | Additive only, per issue #374 AC9: the suite gains the owner-citation cases for the new surfaces (journal-entry@1 owned by the schema package, journal-driver-contract@1 owned by the crate README, the carrier doc's forward note naming the landed owner) and the crate↔schema contract-id parity assert. No existing assertion is edited, relaxed or removed.
```
