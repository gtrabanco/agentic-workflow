# Decisions — fix/405-journal-fragments

Path-protection records (`path-protection-records@1`). `**/*.test.*` is a
protected path; the owner's governing request mandates the test surface
explicitly (S6: "One RED test per requested rule; … one test proving its
previous behavior still holds"), recorded here as the justification the
checkpoint gate reads. Every row below creates or *appends cases to* a suite —
no existing assertion is touched.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | packages/agentic-workflow/test/journal.test.mjs | P1 | 2026-11-05 | execute-phase | New suite — the unit's frozen-failure reproducer corpus (O2–O4, O6, O8, O11) and the AC1–AC8 code contracts; created red-first per owner S2/S6
justification | packages/agentic-workflow/test/journal.surfaces.test.mjs | P7 | 2026-11-05 | execute-phase | New suite — AC9's single-owner citation check over the prose surfaces; no existing assertion touched
justification | packages/agentic-workflow/test/journal.surfaces.test.mjs | P7 | 2026-11-06 | execute-phase | Case appended by the external-verification batch (D9): the opted-in carrier holds only parseable fragments and its contract doc sits beside it; existing assertions untouched
justification | packages/agentic-workflow/test/edit.test.mjs | P8 | 2026-11-06 | execute-phase | Path fix only, no assertion changed: the CLI smoke resolved the bin from `process.cwd()`, so the suite failed when run from the repository root and passed from the package — the file-relative path is what the case always meant (L23). Predates this unit at base
justification | packages/pi-agentic-workflow/test/auto-log-session-parity.test.mjs | P4 | 2026-11-05 | execute-phase | New fragment-mode cases appended (O6) — existing parity assertions untouched
justification | packages/pi-agentic-workflow/test/auto-log-session-wiring.test.mjs | P4 | 2026-11-05 | execute-phase | New carrier-present wiring cases appended (O1) — existing cases untouched
justification | packages/pi-agentic-workflow/test/auto-log-session.test.mjs | P4 | 2026-11-05 | execute-phase | New hasJournal carrier case appended — existing cases untouched
justification | scripts/session-close.test.mjs | P5 | 2026-11-05 | execute-phase | New fragment-mode close cases appended (AC1/O10) — existing cases untouched
justification | scripts/session-close.test.mjs | P5 | 2026-11-06 | execute-phase | Case appended by the external-verification batch (D9): `--log` names the journal the carrier guard protects instead of being silently ignored; existing cases untouched
```
