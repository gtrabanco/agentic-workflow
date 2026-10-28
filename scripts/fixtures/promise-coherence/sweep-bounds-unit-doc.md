# sweep-bounds — the refused-pattern fixture

> Fixture for review F2 (`scripts/promise-coherence.mjs`). The `sweep` claim
> kind compiles a pattern body authored in a unit doc and runs it line by line
> over the declaration's whole glob corpus. Compiled unbounded, one
> nested-quantifier shape hangs the gate: the reviewed reproducer, `(a+)+$`,
> cost 83 s for five `test()` calls on a single 29-character line, and the scan
> walks up to 5000 files × 2 MB. Both declarations below fit the line grammar
> and sit outside the bounds, so each must be refused **before it is compiled**
> — a refused declaration is a red claim, never a silent pass.

## Log

- **F1** — 2026-10-27, a fold reached for a nested quantifier → deadbeef
  swept: /(a+)+$/ → expected 0 in scripts/fixtures/promise-coherence/sweep-bounds-unit-doc.md
- **F2** — 2026-10-27, a fold pasted a pattern longer than the bound → deadbeef
  swept: /abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890abcdefghij1234567890$/ → expected 0 in scripts/fixtures/promise-coherence/sweep-bounds-unit-doc.md
