# #598 — Test-estate sweep: per-suite verdicts + measured speedup

## Origin

Issue [#598](https://github.com/gtrabanco/agentic-workflow/issues/598).
Triaged 2026-11-17: promoted to feature (dogfooding application of #595/#596/#597).
Promoted label applied.

## What

Owner observations (2026-11-16): ~114 root suites carry no recorded justification
per suite, and the pre-push hook runs ~67s under the full gate. This unit applies
the criteria from #595/#596/#597 to the **current** repo test estate, producing
a per-suite keep/merge/delete verdict and a measured speedup plan.

## Acceptance criteria

- [ ] Every root suite has a recorded verdict (keep / merge / delete) with evidence; deletions cite their ground and land in their own commits.
- [ ] Where duplicates merged: exactly one survivor per obligation.
- [ ] Wall-clock per change class measured before and after, recorded in Evidence.
- [ ] A typical pre-push runs within its declared budget on this host; the budget is recorded, not just claimed.
- [ ] Root suites green (`node scripts/run-root-suite.mjs`), context budgets green, gate green, changeset per repo rule.

## Dependencies

Soft Related: **#595** (the audit check this sweep pre-figures), **#596** (the tag surface and vocabulary this unit applies early), **#597** (the deletion authority this unit's plan exercises).
None blocks: the criteria and evidence standard are already recorded in #595/#596 and the owner rule of 2026-11-16.

## Relevant files

- Every root suite touched by a verdict (`scripts/*.test.mjs`, both `packages/*/test`)
- `scripts/local-gate.mjs` / `scripts/run-root-suite.mjs` — budgets, pool tuning, measured timings
- `docs/workflow/GATE_INVENTORY.md` — the budget rows
- The unit doc's Evidence — inventory, verdicts, deletion grounds, before/after wall-clock
- `.changeset/`, roadmap row (new unit), budget manifests

## Non-goals

- No weakening, emptying, or skipping of assertions for speed — cost reduction changes how a test runs, never what it proves.
- No deletion without the evidence standard (dead-surface / obligation-duplicate / cost-over-risk) recorded per deletion.
- No exhaustive mutation sweep — selective kill-rate only where a merge/delete verdict is contested.
- No decision-model dependency; the substrate's future role stays recorded in #444.
- No new skill surface — this unit applies existing criteria to this repository (a dogfooding application unit of #595/#596's standards).