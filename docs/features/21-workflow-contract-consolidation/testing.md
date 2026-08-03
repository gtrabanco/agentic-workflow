# 21 — workflow-contract-consolidation · testing

## Required layers

- Route-budget unit tests for composed-file accounting and failures.
- Planning fixtures for snapshot reuse, preflight ownership, and phase contract.
- Execute fixtures for route selection and dependency receipt invalidation.
- Review fixtures for unique ownership and complete-feature classification.
- Fake-forge integration for review receipts and audit consumption.
- Runtime negative tests for accidental merge execution.
- Weak-model golden-fixture runs for every changed executor/review/audit contract.

## Baseline route estimates

Baseline captured with `node scripts/check-skill-context.mjs --routes --json` before
any hot route was rewritten. The route checker computes each route from the
unique files of listed skills (SKILL.md + all reachable references) using the
existing deterministic byte/4 metric.

| Route | Skills | Files | Estimate | Lines |
|---|---|---|---|---|
| `plan-feature:scoped` | plan-feature | 3 | 3496 | 270 |
| `plan-feature:issue` | plan-feature, plan-feature-from-issue | 4 | 5391 | 411 |
| `plan-fix:issue` | plan-fix | 3 | 3150 | 225 |
| `execute-phase:feature` | execute-phase | 9 | 13284 | 866 |
| `execute-phase:small` | execute-phase | 9 | 13284 | 866 |
| `execute-phase:fix` | execute-phase | 9 | 13284 | 866 |
| `execute-phase:legacy` | execute-phase | 9 | 13284 | 866 |
| `execute-phase:final-pr` | execute-phase | 9 | 13284 | 866 |
| `review-change:default-backend` | review-change | 7 | 8412 | 605 |
| `review-change:default-web` | review-change | 7 | 8412 | 605 |
| `review-change:adversarial` | review-change | 7 | 8412 | 605 |
| `review-change:synthesize` | review-change | 7 | 8412 | 605 |
| `audit-pr:feature` | audit-pr | 7 | 6852 | 449 |
| `audit-pr:fix` | audit-pr | 7 | 6852 | 449 |

## Results

Pending execution.
