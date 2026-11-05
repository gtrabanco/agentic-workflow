# Decisions — fix/356-test-targeting

> Decision log for post-freeze corrections on this unit. The frozen decisions
> live in the unit doc's `## Log` (`D` lines); this file carries the
> path-protection records the correction batches require and the decisions
> behind them.

## Decision log

| ID | Decision | Alternatives considered | Rationale |
|---|---|---|---|
| D-356-15 | Fold the four external-verify advisories (2026-11-04) as one correction batch: (1) correct E10's recorded gate figure 1543 → 1541 — a receipt-precision slip, the verdict reproduced; (2) refuse a `--paths` entry that names a directory instead of silently searching the directory's bare name as a fixed word; (3) document in the owner reference that a non-empty `suites` list under `verdict: empty` can only come from the caller's `--references`; (4) qualify `docs/workflow/SKILLS.md`'s "tests-first implementation" narration with the derived impact set | Leave the advisories as recorded findings (rejected: the owner directed the repair); change the `empty` verdict when LSP suites exist (rejected: D2's two-word verdict vocabulary is about executable content, and a prose-only change owes no ceremony) | External verify 2026-11-04 returned `VERIFIED` with four advisories; the operator instructed "Arregla los advisories". Advisory 2 is the only behavior change and it fails closed, consistent with the hint's refusal contract (D3). |

## Path protection records

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/test-impact.test.mjs | P5 | 2026-11-04 | execute-phase | External-verify advisory 2 folds here: the directory-refusal behaviour needs its judging case committed red-first, per the unit's own red-first rule (O11) — a new case in the shipped corpus, never a test-free behaviour change.
justification | scripts/test-impact.mjs | P5 | 2026-11-04 | execute-phase | External-verify advisory 2 folds here: the directory refusal is a fail-closed repair of a silently-over-matching search, in the same shape as the existing refusal family (O7); the red side is the suite case committed first.
```
