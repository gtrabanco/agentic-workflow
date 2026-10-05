# fix/286-affecting-path-receipt-binding — decisions

Path-protection records for this unit (append-only; owner: `skills/orchestration-envelope/references/TURN_CONTRACT.md`):

```text
path-protection-records@1
kind | paths | phase | date | authority | justification
justification | scripts/review-receipt.test.mjs | P1 | 2026-10-05 | execute-phase | Red-first scope-binding cases for AC4/AC5 (#182 AC 3/9): the existing suite pins the legacy head-bound contract, and the new cases must sit beside it so both directions (non-affecting delta stays current, affecting delta voids, legacy parse unchanged) fail before the runtime changes and prove the refinement never weakened the old semantics.
justification | scripts/audit-pr-receipt.test.mjs | P1 | 2026-10-05 | execute-phase | Red-first gate cases for AC6: the audit verdict must keep blocking on an affecting delta and proceed on a non-affecting one — both directions pinned in the suite that owns the verdict contract.
justification | scripts/scope-manifest.test.mjs | P1 | 2026-10-05 | execute-phase | The new black-box suite for AC1-AC3 (created this unit, red-first); the missing crypto import is a test-harness fix inside the same red-first file, not a weakening — every assertion stays exactly as written red.
```

## Decision log

- **D-286-1 (2026-10-05)** — the scope-binding judge stays pure (`judgeReceipt`
  exported from `review-receipt.mjs`, delta paths computed at the CLI layer over
  git), matching the family's purity split; `audit-pr-gate.mjs` consumes the
  same judge so the two consumers cannot drift.
- **D-286-2 (2026-10-05)** — the non-affecting class list is a closed
  vocabulary owned by `scripts/scope-manifest.mjs` (`NON_AFFECTING_PATHS` /
  `NON_AFFECTING_DIRS`); consumers import the matcher, never re-state the
  classes. Extending the list is a reviewed, tested change (SPEC Future cost).
