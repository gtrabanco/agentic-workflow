---
"@gtrabanco/agentic-workflow-schema": minor
"@gtrabanco/agentic-workflow": minor
---

feat: document retention — the settled carrier, the stamp-gated trim, and its detection (issue #651)

A merged unit's process artifacts were never read again, while the decision-grade
record beside them was. The schema package now publishes the third accepted
unit-doc carrier (`settled`) beside `legacy` and `spec-by-reference`, the
`unit-doc@3` provenance format it derives, the trim/keep matrix
(`UNIT_DOC_TRIM_FILES` / `UNIT_DOC_KEEP_FILES`), one eligibility predicate
(`classifyUnitRetention`), the `doc-retention-archive@1` manifest contract, the
`retention-declaration@1` vocabulary and the `docRetention` base config section
(shipped `keep-all`). The published reader advances to `unit-doc@3`; older
documents degrade and stay readable forever.

`agentic-workflow doc archive [--dry-run] [--unit <id> | --all-eligible]` and
`doc restore --unit <id>` are the single write path: a target is required, a
refusal moves no byte, the archive is staged and renamed into place before the
carrier settles, every archived file is bound by `sha256:` and a restore
re-hashes before it writes, and the archive directory must be gitignored. The
project-declared seam hook runs after the local archive is durable; a failed
copy is a reported degradation, never a lost record.

`workflow-status` projects `detail.retention.pending_trim[]` and the declared
out-of-scope documents, and offers the archive command at `next.continuation`
only when the resolver has nothing actionable and the project configured the
trim step. `product-audit` gains the Retention debt dimension, whose producer is
`bun scripts/retention-debt.mjs`, and every unit-doc template declares each
carrier file's disposition, checked by `bun scripts/retention-declaration.mjs`.
