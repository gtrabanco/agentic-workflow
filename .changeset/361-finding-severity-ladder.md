---
"@gtrabanco/agentic-workflow": major
"@gtrabanco/agentic-workflow-schema": major
"@gtrabanco/pi-agentic-workflow": major
"review-a11y": major
"review-brand": major
"review-change": major
"review-code": major
"review-debt": major
"review-design": major
"review-implementation": major
"review-perf": major
"review-security": major
"review-seo": major
"review-verify": major
"product-audit": major
"audit-pr": major
"fold-findings": major
"triage-issue": major
"skill-lint": major
---

feat(findings)!: publish the severity ladder, the impact column and the baseline-advisory rule

A findings row could not say what it was: the carrier graded a row
`high | med | low` while the finders emitted `critical | major | minor` and the
planner emitted `info | low | medium | high | critical`, and nothing said whether
a row changes behaviour, only documents, or blocks nothing at all.

`findings-table@1` now carries one published ladder
(`BLOCKER | CRITICAL | WARNING | SUGGESTION`) and a new `impact` cell
(`blocking | docs-only | report-only`) between `severity` and `class`; both sets
are exported by `@gtrabanco/agentic-workflow-schema`
(`FINDINGS_TABLE_SEVERITIES`, `FINDINGS_TABLE_IMPACTS`) and published by both
repo templates, both exported scaffold templates, the `UnitDoc` skeleton and all
nine `review-*` output contracts. `review-implementation`'s `CLASSIFY.md` owns
the token meanings, the baseline-advisory rule (a blocker is caused by the change
and reproducible with realistic input; a failure already present at the base
commit is a pre-existing advisory and never earns a correction round) and the
conversion table that maps every older scale onto the ladder without ever
reaching `BLOCKER`. `decision-required` stays the human override and the
disposition table is unchanged.

Readers and writers moved with the grammar: `packages/agentic-workflow/src/runner/unit-route.mjs` steps over
the impact cell, `packages/agentic-workflow/src/runner/lib.mjs` parses and renders it,
`ceremony findings append` requires and validates both cells, and
`packages/agentic-workflow/src/runner/sensors/workflow-status.mjs` projects the ladder onto the envelope's unchanged
`high | med | low` enum. `scripts/vocabulary-probe.mjs` gains the `finding-impact`
dimension and refuses a `BLOCKER` whose impact is `report-only`.
`normative-surfaces@1` declares both grammar cells and the drift gate resolves
them against the published consts.

Migration: `docs/workflow/MIGRATION.md` — a unit doc opened before this release
adds the impact cell and converts each row through `CLASSIFY.md`'s table; closed
unit ledgers stay byte-identical and keep projecting through the read aliases.
