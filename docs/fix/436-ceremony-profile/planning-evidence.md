# Planning evidence — fix/436-ceremony-profile

One row per Engineering claim the change rests on (column order and
vocabularies owned by `skills/pre-execution-review/references/LEDGERS.md`).
Frozen at cut except `freshness`.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | code | `scripts/catalog.json` carries the closed 9 steps with `applies_when`/`skipped_when` and `budget_tier`, and `unit-route.mjs --triage` is the dispatcher that filters it into the emitted step list | `scripts/catalog.json`, `scripts/unit-route.mjs` (`triageSteps`, read 2026-11-11) | read-this-session | O3, O4, O8 |
| PE-002 | code | the #435 charter machinery writes the owner's answers into the project guide's `## Project charter` section — the tier-0 home the profile block belongs to | `skills/init-workspace/references/BOOTSTRAP_WRITE.md:20-31` | read-this-session | O7 |
| PE-003 | code | `product-audit` already consumes a declared ceremony profile conditionally and runs every applicable dimension when none is declared — the change must preserve this byte-for-byte | `skills/product-audit/references/AUDIT_DIMENSIONS.md:18-22`, `scripts/product-audit-rescope.test.mjs` | read-this-session | O11 |
| PE-004 | code | the review passes are a published closed vocabulary (`PASS_NAMES`), so the profile's `review-passes` surface set can be derived from it rather than invented | `packages/agentic-workflow-schema/src/vocabularies.ts:202-214` | read-this-session | O1, O10 |
| PE-005 | code | the parity-pin mechanism exists: root suites pin second copies of published vocabularies to the built schema runtime (`scripts/schema-runtime.mjs`) | `scripts/vocabulary-parity.test.mjs`, `scripts/schema-runtime.mjs` | read-this-session | O1, O10 |
| PE-006 | code | the roadmap sync appends only what the tree derives and never rewrites a hand row; a unit doc's `roadmap_summary:` overrides the summary cell — only for a row of the same kind (a fix-kind unit's row in the Features table passes through verbatim — external-verify B3); fix rows are never appended | `scripts/docs-generate.mjs:374-383` (sync comment), `syncTable` | read-this-session | O12 |
| PE-007 | code | the fail-closed doctrine for dispatcher declarations: a present-but-malformed `activityFusion`/`budget_tier` exits 2 with a named diagnostic | `scripts/unit-route.mjs:757-786, 820-826` | read-this-session | O8 |
| PE-008 | unknown | whether #441's router-side integration expects a specific `ceremony-profile` shape beyond this unit's grammar | not sampled — #441 has no unit doc or design note in-tree yet (2026-11-11) | unknown — owner: #441 triage | O4 (the grammar may be extended, never silently re-shaped) |
| PE-009 | code | the triage block's fixed line-prefix parsers (unit-cycle, unit-lineage) read named lines only, so an additive `Profile:` line is invisible to them — the #434 fused-annotation pattern | `scripts/unit-route.mjs:1000-1010` (`runTriage` comment) | read-this-session | O4 |
