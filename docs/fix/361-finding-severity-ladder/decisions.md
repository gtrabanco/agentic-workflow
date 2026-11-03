# Decisions — fix/361-finding-severity-ladder

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/fixtures/vocabulary-probe/tree/docs/features/90-off-vocab-future/SPEC.md | P1 | 2026-11-04 | execute-phase | The frozen-failure fixture gains the three rows this unit must refuse (retired `medium` severity, `BLOCKER` with `report-only` impact, empty impact) and moves to the seven-column carrier; its assertions are extended, never relaxed.
justification | scripts/fixtures/vocabulary-probe/tree/docs/features/91-clean-future/SPEC.md | P1 | 2026-11-04 | execute-phase | The clean fixture carries the two unit-79 rows the ladder separates (a functional `BLOCKER`/`blocking` row and a docs-only `WARNING`/`docs-only` row) in the seven-column carrier, so the comparator has a positive corpus.
justification | scripts/fixtures/spec-by-reference/tree/docs/features/21-migrated-shape/SPEC.md | P4 | 2026-11-04 | execute-phase | The grammar moved from six to seven columns; every migrated fixture document carries the impact cell its rows now require, and no assertion changes.
justification | scripts/fixtures/spec-by-reference/tree/docs/features/22-migrated-done/SPEC.md | P4 | 2026-11-04 | execute-phase | Same grammar move: the fixture's `## Findings` header and rows gain the impact cell.
justification | scripts/fixtures/spec-by-reference/tree/docs/features/23-migrated-broken/SPEC.md | P4 | 2026-11-04 | execute-phase | Same grammar move: the fixture's `## Findings` header and rows gain the impact cell.
justification | scripts/fixtures/spec-by-reference/tree/docs/features/24-migrated-open/SPEC.md | P4 | 2026-11-04 | execute-phase | Same grammar move: the fixture's `## Findings` header and rows gain the impact cell.
justification | scripts/fixtures/spec-by-reference/tree/docs/features/90-missing-shared/SPEC.md | P4 | 2026-11-04 | execute-phase | Same grammar move: the fixture's `## Findings` header and rows gain the impact cell.
justification | scripts/fixtures/spec-by-reference/golden-fixture/SPEC.md | P4 | 2026-11-04 | execute-phase | Same grammar move: the golden fixture's `## Findings` header gains the impact cell (it carries no data row).
justification | scripts/fixtures/spec-by-reference/258-harden-needs-input-contracts/SPEC.md | P4 | 2026-11-04 | execute-phase | Same grammar move: the unit-258 fixture's two open rows gain the impact cell their severity implies.
```

## Decisions

- **D1** — 2026-11-04, the issue's own scope (S1): the ladder **replaces**
  `high|med|low` as the `findings-table@1` severity scale rather than joining it
  as a second column — one vocabulary per row. The legacy `review-findings.md`
  carrier keeps its frozen `high|med|low` rows and is mapped on read.
- **D2** — 2026-11-04, S1's verbatim casing: the ladder tokens are uppercase
  (`BLOCKER | CRITICAL | WARNING | SUGGESTION`), so a mixed carrier is visible to
  a reader and mechanically detectable (the sets are case-sensitive).
- **D3** — 2026-11-04, S2's placement: `impact` is the carrier's fifth column
  (`id | S# / file:line | axis | severity | impact | class | route`), beside the
  severity it qualifies; `route` stays last, so a `#355` route cell and the
  legacy carrier's trailing `folded` keep their own positions.
- **D4** — 2026-11-04, S3's mechanical half: `BLOCKER` with impact `report-only`
  is refused by the probe. The differential run that proves cause belongs to
  `#363`; until it exists, the contradiction a static gate *can* see (a blocker
  that blocks nothing) is refused instead of published.
- **D5** — 2026-11-04, S3's read side: the conversion table never targets
  `BLOCKER`. A converted scale can only reach `CRITICAL | WARNING | SUGGESTION`;
  `BLOCKER` is assigned by evidence (a reproducer) or not at all.
- **D6** — 2026-11-04, S3's ownership: the baseline-advisory definition lives
  here, in `CLASSIFY.md` §Severity ladder, and roadmap row 100 (`#363`) cites it
  instead of keeping its own copy — one home, two consumers.
- **D7** — 2026-11-04, S6's `skill-lint` half: the lint gains an eighth
  report-only rule naming the two published sets; the enforcing half stays
  `scripts/vocabulary-parity.test.mjs`.
- **D8** — 2026-11-04, S1's envelope half: the envelope keeps `high|med|low` and
  the sensor projects (`BLOCKER`/`CRITICAL` → `high`, `WARNING` → `med`,
  `SUGGESTION` → `low`), so a published envelope schema is not re-cut for a
  ledger vocabulary.
- **D9** — 2026-11-04, S4/S8: the finder FAIL rule keeps its old blast radius —
  `critical` → `CRITICAL`, `major` → `WARNING`, `minor` → `SUGGESTION`, so
  `BLOCKER | CRITICAL | WARNING` open still fails a pass and `SUGGESTION` still
  never blocks. No disposition value changes.
