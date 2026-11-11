# Decisions — 498 shared-writer-driver

Interpretation and process decisions for this unit, plus the
`path-protection-records@1` rows the path guard requires for justified
modifications of protected paths.

## Interpretation decisions

- **D1 — unit home.** The apply workflow's §5 names `docs/fix/<issue>-<topic>/`;
  #498 is a feature (roadmap Features table, `feat/` branch), so the unit is cut
  at `docs/features/498-shared-writer-driver/` with the feature template (see
  SPEC.md).
- **D2 — split decision.** One unit, two ordered layers: P1–P3 (runtime) before
  P4–P5 (git layer). The issue's split recommendation is preserved as phase
  order; the inline application delivers one branch and one diff.
- **D3 — budgets class.** Structural JSON merge: recursive union by key, same
  leaf set differently on both sides is a conflict.
- **D4 — repository-state class.** Fail closed always: frozen facts are
  resolver-only; any concurrent change is a conflict for the resolver.
- **D5 — CAS scope.** CAS is enforced when the caller supplies `expected`;
  without it the write behavior is byte-identical to the pre-driver writer
  (differential-pinned, O6).

## Path-protection records

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/shared-doc-merge.test.mjs | P5 | 2026-11-10 | execute-phase | RED-first sibling suite for scripts/shared-doc-merge.mjs (repo rule: red commit then green); fixture additions are part of the same suite's red-to-green cycle, never a relaxed assertion
```
