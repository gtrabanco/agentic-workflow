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

Record with `node scripts/check-skill-context.mjs --routes --json` during P1,
before editing any hot route. The pre-feature static audit observed these rough
byte/4 proxies, which are orientation only until the route checker reproduces
them: scoped `plan-feature` ~9.4k; issue `plan-feature` ~11.3k; `plan-fix`
~4.4k; normal `execute-phase` ~9.4k per phase; final-PR execution ~11.6k;
typical backend `review-change` ~13.1k; feature `audit-pr` ~10.5k.

## Results

Pending execution.
