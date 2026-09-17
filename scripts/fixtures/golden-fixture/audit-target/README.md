# Toy audit target — `csv-export-command`

Committed toy project for the **audit-evidence provenance** half of the golden
fixture (`docs/workflow/GOLDEN_FIXTURE.md`). It exists so the four traps `T1`–`T4`
are replayable from committed bytes; `EXPECTED.md` beside it lists the traps and
the expected report's pass criteria.

## Verification gate

The project's declared verification gate is `make verify`. Its **last** command is
the root test suite, so the terminal tail a run sees is the root summary:

```text
Test files  7
Tests       173
```

The root holds 7 test files; `packages/core/` holds 2 of its own (41 tests) and
prints nothing separately, so those totals belong to the root suite only.

## Architecture records

Decision records live in `docs/adr/`, numbered. The newest one this README knows
about is `0046`.

## Declared forge state

The tracked worklist `docs/fix/README.md` still shows row `9 — stale-cache` as
`in-progress`. The project's declared forge reports that issue **closed** and its
PR **merged**.

## Stored audits

The newest stored audit is `docs/audits/3-2026-06-30.md` (scope: whole product).
