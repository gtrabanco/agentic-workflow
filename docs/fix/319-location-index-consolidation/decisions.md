# Decisions — fix/319-location-index-consolidation

Open questions, their resolutions, and the path-protection records this unit's
folds need. Append-only.

## Path-protection records (F1/F3 fold)

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/index-document.test.mjs | P8 | 2026-11-02 | execute-phase | F1's regression belongs in the O9/R5 case this suite already owns (the two tables never leak into each other's parsers); the case pins the half-migrated tree the earlier O9/R5 only covered in its fully consolidated form, and the suite is red-first against the crate fix that lands with it
justification | packages/agentic-workflow-schema/test/machine-contract.test.mjs | P3 | 2026-11-02 | execute-phase | F3 is a divergence between this package's table parser and the crate's `tableCells`, so its regression belongs beside the #319 case this suite already owns; both F1 and F3 read the same consolidated document, and the suite is red-first against the schema fixes that land with it
```

## Questions

`none — no questions` — F1 and F3 were settled by the recorded `recheck` cells
(V2/V4) and their reproductions, never by inference.
