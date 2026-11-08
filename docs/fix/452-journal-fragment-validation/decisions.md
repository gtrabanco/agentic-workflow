# Decisions — fix/452-journal-fragment-validation

Path-protection records (`path-protection-records@1`). `**/*.test.*` is a
protected path, so every edit below the test surface carries the justification
the checkpoint gate reads. Both rows are the owner's correction batch (`L5`):
they change **where** a check runs and **how many copies** of a rule exist —
never what the check proves, and never an assertion's strength.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/check-skill-context.test.mjs | P18 | 2026-11-08 | execute-phase | Correction batch (L5/F8): the guide-layer budget block moves from module scope into a named `test()`, so one budget break names the case and lets the 26 load-time mutation guards below it run; every assertion is kept verbatim and the guards stay fail-fast
justification | scripts/guide-split.test.mjs | P18 | 2026-11-08 | execute-phase | Correction batch (L5/F9): the ceiling case stops repeating the budget owner's exit-code and ceiling assertions (`--documents` exit 0 is asserted by the owner's suite) and keeps the linkage it alone answers — the guide row, the prose/machine split, the three required files; the branch/PR dedup case is added new. No assertion is relaxed
```

## Why these two, and why now

The external verify's correction chain left two open defects that are about
test *shape*, not behaviour: one budget break aborted
`scripts/check-skill-context.test.mjs` whole (0 pass, 1 error, the mutation
guards never ran), and `scripts/guide-split.test.mjs` re-asserted the same
budget so one break produced two red suites. The owner's instruction (`L5`) is
to fix both without breaking what they cover, so the split is by
responsibility: the budget owner's suite keeps the exit-code enforcement, the
guide-split case keeps the linkage, and a new case pins the branch/PR rule to a
single statement in the guide.
