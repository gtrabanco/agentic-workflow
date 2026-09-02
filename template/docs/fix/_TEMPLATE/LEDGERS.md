# Ledger ownership projection — fix unit

Project the write-ownership map for this unit's ledgers. The single source of
truth is
[`LEDGERS.md`](../../skills/pre-execution-review/references/LEDGERS.md)
("Durable ledger write ownership"); this table is a per-tree copy of it, pinned
against drift by `node --test scripts/ledger-ownership.test.mjs`, so it restates
nothing and re-explains nothing. One writer per column set; the annotator may
append only its declared token; anyone else reads.

```text
ledger-ownership@1
ledger | owner | annotator
docs/fix/<issue>-<topic>/review-findings.md | review-change:finding-rows + review-change:review-mark + audit-pr:audit-rows + triage-issue:triage-rows + fold-findings:folded-flag | scripts/ledger-provenance.mjs
docs/fix/<issue>-<topic>/planning-findings.md | review-spec:spec-stage-rows + review-plan:plan-stage-rows + design-feature:product-class-resolutions + plan-feature:plan-class-resolutions + plan-fix:fix-plan-class-resolutions + fold-findings:source-class-resolutions | none
docs/fix/<issue>-<topic>/progress.md | plan-feature-scaffold:create + execute-phase:phase-entries + execute-phase:gate-rejection-traces + review-spec:product-receipt + review-plan:plan-receipt | none
docs/fix/<issue>-<topic>/known-issues.md | plan-feature-scaffold:create + execute-phase:blocker-entries-and-status | none
docs/fix/<issue>-<topic>/decisions.md | plan-feature-scaffold:create + design-feature:product-decisions + plan-feature:engineering-decisions + execute-phase:phase-decisions + human-owner:ratified-verdicts | none
docs/fix/README.md | design-feature:idea-or-defined-row + plan-feature-scaffold:planned-row + plan-fix:fix-index-row + execute-phase:status-and-pr-link + ship-roadmap:founding-and-flip + audit-docs:low-risk-row-repair | none
docs/fix/<issue>-<topic>/ACCEPTANCE.md | plan-feature-scaffold:feature-freeze + plan-fix:fix-freeze + human-owner:approved-amendment | none
```

A fix unit's ledger files are created by `plan-fix` (and `plan-feature-scaffold`
for the shared records); they carry rows, never a second copy of this table. The
projection lives here, in the template the planners read, so no unit directory can
fork it.
