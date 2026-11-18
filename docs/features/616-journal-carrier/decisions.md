# Decisions — feature/616-journal-carrier

The unit doc's `## Log` carries the numbered `D` lines; this file carries the
records that need a shape of their own. Nothing here re-decides an acceptance
criterion.

## Path protection

No path-protection config exists in this checkout
(`agentic-workflow.config.json` is absent, `.pi/agentic-workflow.json` declares
`gitIdentity` and `telemetry` only), so the guard reports `missing-config` and
protects nothing by configuration. One touched path is still a suite this unit
must not weaken, and its record is written here rather than assumed:

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/dimension-regression.test.mjs | P5 | 2026-11-18 | execute-phase | The evolution gate's own contract says a new review dimension extends its frozen id list "here in the same change"; the row added is `Journal signals`, one assertion datum, and no existing assertion is relaxed, skipped, narrowed or deleted. The approval row is deliberately absent: no auto-approval authority exists, so the owner approves this addition with the handoff.
```

## Why the corpus is joined, not re-parsed

`scripts/journal-corpus.mjs` imports `buildCorpus` from
`scripts/findings-corpus.mjs` instead of reading the unit ledgers itself. Two
readers would be two admission rules and two `F`-row parsers, and the residue
sweep reports exactly that class of copy. The same reason decides the phase
map: `phaseOfAxis` and `PHASE_DESTINATION` gain an `export` and are imported,
never restated — a second `axis → phase` table would let the journal and the
corpus propose different `GATE_INVENTORY.md` rows for one class.

## Why the fixture tree needs no git history

The corpus's own fixture (`scripts/product-audit-gap-fixture.mjs`) builds real
git history because its receipt reads **admitted** classes, and admission needs
a fold commit. This unit's join reads corpus **rows**, not admission: a
`(unit, F<n>)` pair is resolvable from the unit doc's `## Findings` table alone.
So the fixture writes a flat tree, and the reader calls `buildCorpus` with
`resolveFold: () => null` — no subprocess, no repository, no fold resolution the
join does not use. The choice is documented in the script's header so a later
reader does not mistake it for an oversight.
