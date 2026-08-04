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

### P2 — planning contract consolidation (docs)

Gate: `node scripts/check-skill-context.mjs --routes --route plan-feature:scoped --route plan-fix:issue` → `PASS route budgets: 2 routes`, exit 0. Both routes pass their reduced regression maxima.

Route totals after P2 (measured `--route plan-feature:scoped --route plan-feature:issue --route plan-fix:issue`, exit 0), vs. baseline:

| Route | Skills | Files | Estimate | Lines | vs baseline |
|---|---|---|---|---|---|
| `plan-feature:scoped` | plan-feature | 2 | 3346 | 258 | below 3496/270 |
| `plan-feature:issue` | plan-feature, plan-feature-from-issue | 3 | 5221 | 398 | below 5391/411 |
| `plan-fix:issue` | plan-fix | 3 | 3145 | 222 | below 3150/225 |

File count dropped (2/3/3 vs 3/4/3) because `skills/plan-feature/references/PLANNING_GATES.md` was deleted and replaced by the internal `planning-preflight` contract (linked via `(../planning-preflight/SKILL.md)` — the route resolver pulls only `references/`-linked files, so the new internal contracts are not route members).

Reduced maxima set in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`:
- `plan-feature:scoped`: routeEstimateMax 3346, routeLinesMax 258
- `plan-feature:issue`: routeEstimateMax 5221, routeLinesMax 398
- `plan-fix:issue`: routeEstimateMax 3145, routeLinesMax 222

Other routes still `null` (P3/P4 set the execute/review/audit maxima).

Fixture evidence:
- AC3 (one roadmap snapshot + one issue payload, exactly one post-write roadmap verification): plan-feature `## Process` now mandates ONE immutable planning context — the roadmap snapshot taken before writing (plus one issue payload for `--from-issue`), reused across composed internals, never re-fetched mid-plan; scaffold remains the sole roadmap writer and re-reader.
- AC4 (four planning skills consume one planning preflight, final architectural decision only after the complete engineering plan exists): `planning-preflight` owns the normalized repository state read and the ONE final architectural classification; consumed by plan-feature, plan-feature-from-issue, plan-feature-scaffold, and plan-fix. `plan-feature-from-issue` requires the full plan before any invariant classification; only `preserves` may be stamped `designed`.
- AC5 (one canonical phase-contract pointer/result; eight invalid-phase fixtures fail identically): `phase-contract` owns the 8-box phase-lint + normalized phase fingerprint; templates carry `Phase-lint: PASS (8/8) · fingerprint <P<n>:<layer>:<n-tasks>:<title-deliverable>>` record lines and point at `skills/phase-contract/SKILL.md`. No live doc still cites the templates as the phase-lint authority (grep-verified; remaining matches are historical CHANGELOG/golden-fixture/merged-fix records).

Per-file sizes after P2: plan-feature/SKILL.md 3346-est route share; plan-feature-from-issue 1090-est; plan-feature-scaffold 1064-est; plan-fix/SKILL.md 6112 bytes (1528 est); PLANNING_PROCESS.md 4666 bytes (1167 est); SPEC_CONTRACT.md 1871 bytes (468 est).

