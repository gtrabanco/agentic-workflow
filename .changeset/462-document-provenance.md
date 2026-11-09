---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": minor
"unit-lane": minor
---

feat(schema): publish the `doc-provenance@1` stamp and write it at creation

A machine-read unit doc declares which grammar and carrier layout it speaks and
which tool/schema wrote it, so a reader dispatches the right parser instead of
guessing the generation from artifact presence (issue #462). Three axes, never
merged: `grammars` (content), `format` (carrier layout generation, `unit-doc@1`
legacy / `unit-doc@2` the spec-by-reference re-cut), `written_by`/`schema`
(forensic). The schema package publishes the contract, its closed vocabularies,
the parsed-stamp validator, the reader dispatch (`current | degrade | refuse`
with a closed reason set) and the Draft-07 projection; the runner crate writes
the stamp at creation, gains the `unit-doc <slug> provenance` re-cut op and the
`verify` parity/refusal checks; the four unit-doc templates carry the block,
re-stamped by `release apply` like skill frontmatter; `MIGRATION.md` records the
per-major reader rule. An absent stamp degrades (derived from the carrier),
never fails, and closed units are never backstamped.
