# Decisions — feature/590-coverage-gap-audit

This ledger holds the unit's recorded decisions and the path-protection escape
records (`path-protection-records@1`) the tool guard reads. The unit's planning
ledgers live beside `SPEC.md` (`planning-evidence.md`, `planning-obligations.md`);
the external verifier's receipt is [`external-verify.md`](external-verify.md).

Decisions taken outside a `## Log` line are none yet — every design call this unit
made is a `D` line in the unit doc, as its format prescribes.

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/coverage-gap.test.mjs | P8 | 2026-11-17 | execute-phase | The correction batch over the 2026-11-17 EXTERNAL VERIFY receipt (docs/features/590-coverage-gap-audit/external-verify.md, blockers B1 and B2): the suite gains two ADDED tests, one per frozen reproducer, landed observed RED against the pre-correction bytes before any implementation or prose is touched. No existing assertion is relaxed, skipped, narrowed or deleted — the batch only adds, and what it pins is the receipt's own reproducers (B1: one detectors input line on the absent-inventory receipt; B2: the producer spelling the reference prints runs as written). Phase P8 is this batch's own phase, declared here because the unit's lane phases end at P7.
```
