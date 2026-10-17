# Decisions — 74-post-merge-reconciliation

| Date | Decision | Reason |
|---|---|---|
| 2026-10-17 | Review depth = one default `review-change` pass over the union diff of PR #280 + PR #276 (no adversarial panel). | The branches were each already reviewed (their own receipts + folds); the issue asks for one pass over the combination, not a re-review of either branch. Cheap to widen if findings demand it. |
| 2026-10-17 | Review receipt home = `docs/features/74-post-merge-reconciliation/review-findings.md`. | Matches the sibling units' convention (69, 72 carry `review-findings.md` in the unit folder); the lane's review step reads from there. |
| 2026-10-17 | ACs taken verbatim from issue #275's draft ACs (6 items, command-verified). | The issue states them as user scenarios; ask-don't-infer is satisfied by adoption, not re-derivation. |

## Assumptions (cheap defaults, correctable)

- `review-change` runs at this session's tier; per portability rules a reviewer may re-run it at a different tier.
- The union diff base is the merge state of PR #280 and PR #276 onto `main` (both merged before this unit started; verified 2026-10-17).
