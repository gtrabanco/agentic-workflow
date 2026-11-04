# Decisions — 103-doc-currency

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/review-loop-discipline.test.mjs | P3 | 2026-11-04 | execute-phase | audit-docs' report contract pins the check count in this suite's IS-2 assertion; check 15 moves that pin from 14 to 15 exactly as feature 32 P3 moved it 13 → 14, leaving every assertion's meaning (the report header, the count and the no-MEDIUM legend) as strict as it was.
approval | scripts/review-loop-discipline.test.mjs | P3 | 2026-11-04 | human-owner | Owner approved editing the frozen test pin (14 → 15) instead of dropping the required README-currency check — asked when the protection gate refused the edit; verbatim answer: "Apruebo editar el test".
```

## Decisions

- **D1** — 2026-11-04, tier: the classifier answers `passive` over prose-only
  diffs and `standard` the moment the report-contract pin is repaired, because
  `scripts/review-loop-discipline.test.mjs` is executable content. The unit
  therefore carries the full unit-doc ceremony; the tier is read from
  `bun scripts/ceremony.mjs tier classify`, never chosen.
- **D2** — 2026-11-04, the pin is a **contract follower**, not an assertion to
  relax: `review-loop-discipline.test.mjs` pins the report header so a driver can
  parse the fixed format, and its own comment says *audit-docs owns the count*.
  The count grows with the skill; no assertion is narrowed, dropped or skipped,
  and the suite still refuses a header that disagrees with the skill.
- **D3** — 2026-11-04, scope: the automation half (a forced documentation task
  rendered in the project's declared output format) is **not** implemented here —
  it is issue #396, recorded under `## References`; this unit repairs the READMEs
  and lands the rule plus the required step.
