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

### P3 — execution route consolidation

Gate: `node scripts/check-skill-context.mjs --routes --route execute-phase:feature --route execute-phase:final-pr` → `PASS route budgets: 2 routes`, exit 0. Both routes pass their reduced regression maxima.

`WORKFLOWS.md` split into four per-mode resources (feature, small/phased, fix, legacy); the `execute-phase` entrypoint now selects **exactly one** mode from the target artifacts before loading mode detail, and each mode route records that single selected workflow resource.

Route totals after P3 (measured `--route execute-phase:feature --route execute-phase:small --route execute-phase:fix --route execute-phase:legacy --route execute-phase:final-pr`, exit 0), vs. baseline:

| Route | Skills | Files | Estimate | Lines | vs baseline |
|---|---|---|---|---|---|
| `execute-phase:feature` | execute-phase | 7 | 9202 | 628 | below 13284/866 |
| `execute-phase:small` | execute-phase | 7 | 9191 | 636 | below 13284/866 |
| `execute-phase:fix` | execute-phase | 7 | 9372 | 636 | below 13284/866 |
| `execute-phase:legacy` | execute-phase | 7 | 8986 | 621 | below 13284/866 |
| `execute-phase:final-pr` | execute-phase | 7 | 10686 | 713 | below 13284/866 |

File count dropped (7 vs 9) because routes now compose only their declared `references` array. Mode routes load PREFLIGHT, EXECUTION_CONTRACT, the selected `WORKFLOWS_*.md`, HANDOFF, CLOSEOUT, and FOLDING; `BATCH_AND_PORTABILITY` and `ISSUE_POLICY` do not load on mode routes (portability/examples are conditional per AC16). The `final-pr` close-out route carries `ISSUE_POLICY` instead of a mode workflow (mode is already selected in prior phases).

Reduced maxima set in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`:
- `execute-phase:feature`: routeEstimateMax 9500, routeLinesMax 660
- `execute-phase:small`: routeEstimateMax 9500, routeLinesMax 660
- `execute-phase:fix`: routeEstimateMax 9700, routeLinesMax 660
- `execute-phase:legacy`: routeEstimateMax 9300, routeLinesMax 650
- `execute-phase:final-pr`: routeEstimateMax 11000, routeLinesMax 740

Remaining routes still `null` (P4 sets the review/audit maxima).

Fixture evidence:
- The context-checker test suite adds per-route `references` fixtures: each mode route selects exactly one `WORKFLOWS_*.md`, `final-pr` selects none, and undeclared-skill / missing-file / directory-escaping route references fail closed.
- `scripts/check-skill-context.mjs` route resolution is now route-authoritative: a route with a `references` object loads only the listed files for that skill; routes without one fall back to the full `references/` scan (unchanged for plan/review/audit routes).

#### P3-2 — split issue policy into conditional resources

Gate: `node scripts/check-skill-context.mjs --routes` → `PASS route budgets: 16 routes`, exit 0 (14 routes + the two new policy routes). All execute routes pass their reduced maxima.

`ISSUE_POLICY.md` (8538 B) split into three independently loaded policy resources; the `execute-phase` entrypoint loads **exactly one** policy per situation:
- `FORGE_BODY.md` (2052 B) — forge body policy (`--body-file`, Markdown-not-shell, language precedence); loaded only on the `final-pr` close-out route.
- `DESCOPE.md` (1874 B) — descope guard (STOP before creating an issue; user-approved dated `## Amendments` row; single authoritative log for `audit-pr`/`product-audit`).
- `OPPORTUNISTIC_FINDING.md` (4643 B) — out-of-scope work policy (Autofix ≤15 lines/≤2 files; Opportunistic Fix ≤40 lines/≤3 files; Create Issue; `decisions.md` record format).

Route totals after P3-2 (measured `--routes`, all 16 exit 0):

| Route | Skills | Files | Estimate | Lines | vs baseline |
|---|---|---|---|---|---|
| `execute-phase:feature` | execute-phase | 7 | 9209 | 630 | below 13284/866 |
| `execute-phase:small` | execute-phase | 7 | 9198 | 638 | below 13284/866 |
| `execute-phase:fix` | execute-phase | 7 | 9379 | 638 | below 13284/866 |
| `execute-phase:legacy` | execute-phase | 7 | 8993 | 623 | below 13284/866 |
| `execute-phase:final-pr` | execute-phase | 7 | 9071 | 621 | below 13284/866 |
| `execute-phase:descope` | execute-phase | 7 | 9027 | 631 | below 13284/866 |
| `execute-phase:finding` | execute-phase | 7 | 9719 | 655 | below 13284/866 |

`final-pr` dropped ~1615 est vs P3-1 (ISSUE_POLICY 2135 est → FORGE_BODY 513 est); the P3-1 maxima for it (11000/740) were tightened to 9500/660. The two new policy routes were added:

- `execute-phase:descope`: routeEstimateMax 9500, routeLinesMax 660 (base + `DESCOPE.md`)
- `execute-phase:finding`: routeEstimateMax 9800, routeLinesMax 680 (base + `OPPORTUNISTIC_FINDING.md`)

SKILL.md main budget was re-verified after the step-3 conditional edit: 2799 est (≤ 2800), 177 lines.

Fixture evidence:
- The context-checker test suite adds per-route policy fixtures: `final-pr` records exactly one policy resource (`FORGE_BODY.md`), `descope` records only `DESCOPE.md`, `finding` records only `OPPORTUNISTIC_FINDING.md`, each referenced file exists, and `ISSUE_POLICY.md` no longer exists in `references/`.



