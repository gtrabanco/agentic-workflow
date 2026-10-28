# sweep-same-doc unit doc — fixture

> Fixture for the true F35 shape: the stale copy lives in another section of
> the declaring document itself. The declaration's own log section is exempt
> (D1); the `## Review verdict` sibling is not — the gate must count it and
> refuse.

## Review verdict

The M1 verdict copy the fold was supposed to sweep — M1-VERDICT-COPY — still
asserted here, outside any fence.

## Log

- **F1** — 2026-10-27, the fold re-cut `## Next` and swept the class → deadbeef
  swept: /M1-VERDICT-COPY/ → expected 0 in scripts/fixtures/promise-coherence/sweep-same-doc-unit-doc.md
