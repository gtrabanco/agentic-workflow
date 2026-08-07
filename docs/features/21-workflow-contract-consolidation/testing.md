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

#### P3-3 — versioned dependency receipt + fail-closed fast path

Gate: `node scripts/check-skill-context.mjs --routes` → `PASS route budgets: 16 routes`, exit 0; `node --test scripts/dependency-gate.test.mjs` → 10 pass.

`PREFLIGHT.md` (loaded on every execute route) now owns the dependency receipt contract: after a full pass with every dependency merged, the unit's `progress.md` records `Dependency receipt v1` (fingerprint, closure, merged PRs, `Fully merged: yes`, `Verified: <date>`). Later phases recompute the cheap local fingerprint — `git hash-object --stdin` over the SPEC `Depends on:` line and the closure roadmap rows only — and skip forge traversal **only when** the receipt is current, the fingerprint matches, it records fully merged, and no `--force` is dated after it. Fail-closed invalidation on any of: fingerprint mismatch (graph changed), missing or older-version receipt, later `--force`, or the full gate finding an unmet dependency; ambiguity never skips the forge.

Design fix recorded: the fingerprint covers only locally-derivable inputs. PR identities are receipt provenance, never fingerprint input — otherwise the fast-path recompute (which has no forge access) could never match the full-pass fingerprint.

Route totals after P3-3 (measured `--routes`, all 16 exit 0; the receipt contract permanently grows PREFLIGHT on every execute route):

| Route | Skills | Files | Estimate | Lines | vs baseline |
|---|---|---|---|---|---|
| `execute-phase:feature` | execute-phase | 7 | 9477 | 653 | below 13284/866 |
| `execute-phase:small` | execute-phase | 7 | 9466 | 661 | below 13284/866 |
| `execute-phase:fix` | execute-phase | 7 | 9647 | 661 | below 13284/866 |
| `execute-phase:legacy` | execute-phase | 7 | 9261 | 646 | below 13284/866 |
| `execute-phase:final-pr` | execute-phase | 7 | 9339 | 644 | below 13284/866 |
| `execute-phase:descope` | execute-phase | 7 | 9295 | 654 | below 13284/866 |
| `execute-phase:finding` | execute-phase | 7 | 9987 | 678 | below 13284/866 |

The receipt contract (~1100 B) added ~270 est / ~23 lines to every execute route, so the seven execute maxima were recalibrated once to the new steady state (one-time adjustment, documented in decisions.md): feature 9500/660 → 9600/670, small 9500/660 → 9600/670, fix 9700/660 → 9750/670, legacy 9300/650 → 9400/660, final-pr unchanged 9500/660, descope 9500/660 → 9400/670, finding 9800/680 → 10100/690. All remain far below the 13284/866 baseline with headroom for drift.

Fixture evidence:
- `scripts/dependency-gate.test.mjs` models the contract as pure functions (`gitBlobSha` implements the git blob hash; `dependencyFingerprint` hashes SPEC line + roadmap rows; `fastPathEligible` returns `{ eligible, reason }`). 10 cases: the fingerprint primitive cross-checks `git hash-object --stdin`; a full gate pass produces a receipt that fast-paths; and each documented invalidation case fails closed — SPEC/roadway amendment (fingerprint mismatch), missing receipt, older-version (v0) receipt, later `--force`, unmet dependency, ambiguous (no-fingerprint) receipt — plus `--force` predating the receipt does not invalidate it, and the matrix asserts exactly the six documented reasons.
- `node --test scripts/check-skill-context.test.mjs` still passes (route/policy fixtures unchanged).

#### P3-4 — preserve universal execution safety boxes + observable behavior

Gate: `node --test scripts/*.test.mjs` → 11 pass, exit 0; `node scripts/check-skill-context.mjs --routes` → `PASS route budgets: 16 routes`, exit 0.

The compaction preserved every pre-consolidation universal execution safety box (11 boxes, cut at `5c71105^`) in the compact Turn contract. `scripts/check-skill-context.test.mjs` now carries a **read-verified owner map**: it reads the actual files and asserts (a) the compact contract still has all 11 `✓ N.` box lines and (b) each box maps to exactly one designated owner resource containing the box's normative marker. The 1:1 table:

| Box | Owner resource | Normative marker |
|---|---|---|
| 1 Branch verified FIRST | `EXECUTION_CONTRACT.md` | `## Branch` |
| 2 Phase-lint pre-flight guard | `PREFLIGHT.md` | `## Phase-lint pre-flight guard` |
| 3 Architectural-invariant gate | `EXECUTION_CONTRACT.md` | `## Architectural invariants` |
| 4 Gate RUN (not assumed) | `EXECUTION_CONTRACT.md` | `actually RUN (paste exit` |
| 5 git add/commit executed | `EXECUTION_CONTRACT.md` | `Docs COMMITTED with the phase` |
| 6 Unit finished → push + PR | `CLOSEOUT.md` | `gh pr create` |
| 7 Clean-tree check LAST | `FOLDING.md` | `git status --porcelain` |
| 8 Artifact language | `FORGE_BODY.md` | `Language precedence` |
| 9 Descope guard | `DESCOPE.md` | `## Descope guard` |
| 10 Out-of-scope finding classification | `OPPORTUNISTIC_FINDING.md` | `## Opportunistic finding policy` |
| 11 `→ Next:` block ABSOLUTE last | `CLOSEOUT.md` | `→ Next: /review-change` |

Observable-behavior fixtures preserve route-specific behavior without loading another route's contract: each mode route loads exactly its own `WORKFLOWS_*` (feature/small/fix/legacy) and no policy file; the policy routes (`final-pr`/`descope`/`finding`) load no mode workflow; and each of the 7 execute routes is run individually and must still exit 0 with its route name in the output (unchanged observable outcome).

Fixture evidence:
- `scripts/check-skill-context.test.mjs` gains two P3-4 blocks: the read-verified owner map (11 boxes; asserts contract line count == 11, unique per-box owner, owner exists, marker present) and the observable-behavior block (per-mode workflow + policy disjointness + per-route `--routes --route execute-phase:<mode>` PASS). `node --test scripts/*.test.mjs` → 11 pass.
- Owner markers verified by grep (see the box/owner table above); no `ISSUE_POLICY.md` reappears on any route.

### P4 — review-to-audit boundary

Gate: `node scripts/check-skill-context.mjs --routes --route review-change:default-backend --route audit-pr:feature` → `PASS route budgets: 2 routes`, exit 0. Both routes pass their globals.

#### P4-1 — merge→synthesize rename

`review-change/SKILL.md` (2.9.1) gained `--synthesize` / `--adversarial N` and removed `--merge`; `ADVERSARIAL_MERGE.md` git-moved to `ADVERSARIAL_SYNTHESIS.md` and rewritten; legacy `--merge` returns the fixed no-mutation migration refusal before any git/forge mutation. AC 2 grep (`grep -Rni -- '--merge' skills/review-change docs/workflow | grep -v 'legacy.*reject\|migration'`) exits clean (0 active matches).

Fixture evidence: `scripts/review-receipt.test.mjs`'s negative cases observe zero merge-invocation paths; no `--merge` string survives outside migration/refusal text (grep-verified).

#### P4-2/P4-3 — one owner per axis, one classifier

`review-implementation` (1.4.0) is the single scope/classification engine; `FIND.md` maps every review concern to one owning pass; `review-debt` (1.1.0) is a synthesized-table transform that never rescans the diff. `CLASSIFY.md` implements the D2/D3 current-unit contract (ignore → fix-now/replan-in-unit/decision-required → proposal; postpone/tradeoff/wontfix/disputed/new-issue forbidden for current-unit).

Fixture evidence: `scripts/review-receipt.test.mjs` and the fake-forge suite below assert classification results stay in the fold ledger (REVIEW-FAIL/NEEDS-DECISION post no receipt); no reviewer-created postpone/tradeoff/issue escape paths remain in the routing docs (grep-verified).

#### P4-4 — per-route review-change manifests

`SKILL_CONTEXT_BUDGETS.json` gained explicit `references` arrays on all four review-change routes. Re-measured route totals vs. the pre-split identical 7-file set:

| Route | Skills | Files | Estimate | Lines |
|---|---|---|---|---|
| `review-change:default-backend` | review-change | 5 | 7118 | 513 |
| `review-change:default-web` | review-change | 5 | 7118 | 513 |
| `review-change:adversarial` | review-change | 6 | 8770 | 620 |
| `review-change:synthesize` | review-change | 5 | 7585 | 534 |

`ADVERSARIAL_RECOMMENDATION.md` (32 L) holds the default route's only adversarial content; `ADVERSARIAL_SETUP.md` (was 103 L → 86 L) loads only for `--adversarial N`.

#### P4-5 — idempotent REVIEW-PASS receipt

`PERSIST_AND_DECIDE.md` step 13 posts the exact-SHA `REVIEW-PASS` PR comment via `--body-file` (`<!-- review-change:pass sha=<40-hex> contract=v1 -->`; newest matching marker wins; same-SHA skip; later commit → stale; REVIEW-FAIL/NEEDS-DECISION post nothing). `scripts/review-receipt.test.mjs` (12 tests, pure functions, zero forge spawns) covers PASS/FAIL/stale/idempotent/no-PR/absent + markdown-body integrity + purity + full matrix. `node --test scripts/*.test.mjs` → 23 pass.

#### P4-6 — audit-pr consumes the receipt, owns only delivery gates

`audit-pr/SKILL.md` (4.2.0 → 4.3.0) + `references/01_MERGE_GATES.md`, `03_AUDIT_PROCESS.md`, `04_VERDICT.md`, `05_ROUTING_AND_GUARDRAILS.md`, `PORTABILITY.md` refactored per AC 13/14 and the SPEC's audit-only gate list (lines 516–525):

- **Step 1 consumes the review receipt** before any gate: newest `review-change:pass` marker whose `sha` equals the current head → acknowledged (scope/axes, acceptance coverage, invariant result, manual checks); absent/stale → **BLOCKER routed to `/review-change`**, never re-reviewed (AC 13).
- **Gate list narrowed to the delivery set**: dropped the `Tests` (test-quality) gate and the acceptance-criteria diff→evidence remapping (replaced by the receipt's acceptance-coverage field); `Architectural invariants` gate now mirrors the receipt's result instead of reclassifying (AC 13); `Acceptance coverage` and `Review receipt` gates are receipt-based, never SPEC-diff remaps.
- **Step 0 no longer loads feature/fix templates** (AC 14); the SPEC is the only planning artifact the audit reads.
- MERGE-READY comment stays idempotent and SHA-bound (`<!-- audit-pr:merge-ready sha=<head SHA> -->`), cites the consumed receipt, posts only on MERGE-READY.

New `scripts/audit-pr-receipt.test.mjs` (11 tests, pure functions, zero forge spawns) proves current receipt consumption, stale/missing receipt blocking (always routed to `/review-change`, gate evaluation skipped — never a re-review), gate failures blocking on a current receipt, idempotent SHA-bound comment posting (post/skip/none), newest-marker-wins, markdown-body integrity, purity, and the full verdict/comment matrix. `node --test scripts/*.test.mjs` → 34 pass.

Route totals after P4-6 (measured `--routes --route review-change:default-backend --route audit-pr:feature`):

| Route | Skills | Files | Estimate | Lines |
|---|---|---|---|---|
| `review-change:default-backend` | review-change | 5 | 7118 | 513 |
| `audit-pr:feature` | audit-pr | 7 | 7964 | 517 |
| `audit-pr:fix` | audit-pr | 7 | 7964 | 517 |

audit-pr grew vs. the 6852/449 baseline because the receipt-consumption contract (Step 1, receipt gates, verdict comment) is additive; the SPEC's audit-only gate list is satisfied and the route stays far below the per-file globals. P5 records the before/after explanation per AC 1/AC 17.

### P5 — hardening & PR (AC 1/16/17/18)

#### P5-1 — verification matrix

Done-when gates, all exit 0 (recorded verbatim):

| Command | Result |
|---|---|
| `node --test scripts/*.test.mjs` | 39 pass / 0 fail |
| `node --test scripts/check-skill-context.test.mjs` | PASS |
| `node scripts/check-skill-context.mjs` | PASS context budgets: 33 skills |
| `node scripts/check-skill-context.mjs --routes` | PASS route budgets: 16 routes |
| `node scripts/check-skill-context.mjs --routes --route review-change:default-backend --route audit-pr:feature` | PASS route budgets: 2 routes |
| `npx skills add . --list` | exit 0 |
| AC 2 grep (`grep -Rni -- '--merge' skills/review-change docs/workflow \| grep -v 'legacy.*reject\|migration'`) | clean (exit 1, no matches) |
| `git diff --check` | clean |

#### P5-2 — before/after proxy totals (AC 1 report)

Baseline = pre-consolidation route table at the top of this file (all four `review-change` routes were an identical 7-file set; `audit-pr` 6852/449). Final = measured at unit close-out after the F7 budget fold (`node scripts/check-skill-context.mjs --routes`), with every hot route's `routeEstimateMax`/`routeLinesMax` in `SKILL_CONTEXT_BUDGETS.json` equal to its live measured total.

| Route | Files before → after | Estimate before → after | Lines before → after | Δ est | Δ lines |
|---|---|---|---|---|---|
| `plan-feature:scoped` | 3 → 4 | 3496 → 5107 | 270 → 423 | +1611 | +153 |
| `plan-feature:issue` | 4 → 5 | 5391 → 6982 | 411 → 563 | +1591 | +152 |
| `plan-fix:issue` | 3 → 5 | 3150 → 4906 | 225 → 387 | +1756 | +162 |
| `execute-phase:feature` | 9 → 8 | 13284 → 10375 | 866 → 739 | −2909 | −127 |
| `execute-phase:small` | 9 → 8 | 13284 → 10364 | 866 → 747 | −2920 | −119 |
| `execute-phase:fix` | 9 → 8 | 13284 → 10545 | 866 → 747 | −2739 | −119 |
| `execute-phase:legacy` | 9 → 8 | 13284 → 10159 | 866 → 732 | −3125 | −134 |
| `execute-phase:final-pr` | 9 → 8 | 13284 → 10237 | 866 → 730 | −3047 | −136 |
| `execute-phase:descope` | 9 → 8 | 13284 → 10193 | 866 → 740 | −3091 | −126 |
| `execute-phase:finding` | 9 → 8 | 13284 → 10885 | 866 → 764 | −2399 | −102 |
| `review-change:default-backend` | 7 → 9 | 8412 → 11359 | 605 → 823 | +2947 | +218 |
| `review-change:default-web` | 7 → 9 | 8412 → 11359 | 605 → 823 | +2947 | +218 |
| `review-change:adversarial` | 7 → 10 | 8412 → 13011 | 605 → 931 | +4599 | +326 |
| `review-change:synthesize` | 7 → 9 | 8412 → 11826 | 605 → 845 | +3414 | +240 |
| `audit-pr:feature` | 7 → 7 | 6852 → 7964 | 449 → 517 | **+1112** | **+68** |
| `audit-pr:fix` | 7 → 7 | 6852 → 7964 | 449 → 517 | **+1112** | **+68** |

Explanation of the final numbers (AC 1: no coverage-related file omitted to improve the number):

- **The execute routes still net-save** (−2399 to −3125 est, files 9 → 8): the `WORKFLOWS.md` split (P3) and the per-route `references` arrays cut what loads on mode routes. `phase-contract` is the one mandatory addition F7 counts on every execute route — small and honest, not regression.
- **Plan routes grew vs. the pre-F7 interim finals** (+1591 to +1756 est, files 3–4 → 4–5): F7 declared the mandatory internal contracts `planning-preflight` + `phase-contract` as members of every plan route. They load during real plan-feature/plan-fix runs (the one-preflight / one-phase-contract architecture), but were not route members before F7, so the interim finals (e.g. 3346) under-counted. The final equals the live measured total (e.g. 5107).
- **Review routes grew vs. the pre-F7 interim finals** (+2947 to +4599 est, files 7 → 9–10): the review-to-audit boundary (P4) makes `review-implementation` + `review-debt` mandatory members of every review route, and the adversarial route carries the full roles/spawn contract (`ADVERSARIAL_SETUP.md` + `ADVERSARIAL_SYNTHESIS.md`). The interim finals (e.g. 7118) did not count them; the final equals the live measured total (11359 default / 13011 adversarial).
- **`audit-pr:feature` / `audit-pr:fix`** (+1112 est / +68 lines, files 7 → 7): unchanged from P4-6 — the AC 13 receipt-consumption contract (Step 1 receipt read, the receipt-based `Acceptance coverage` / `Review receipt` gates, and the SHA-bound verdict comment) is additive; `audit-pr` now *reads* evidence it previously regenerated. The route stays far below the per-file globals (SKILL.md 2648 est, lines 199) and the maxima pass.

The F7 budget fold is why the maxima equal the measured totals: each hot route's `routeEstimateMax`/`routeLinesMax` in `SKILL_CONTEXT_BUDGETS.json` was recomputed to the live measured value, so `--routes` passes with the honest cost of the consolidated architecture. No route omitted any coverage file to improve its number; the file counts reflect the F7-declared mandatory deps plus the P2–P4 per-route `references` arrays that exclude non-loading portability/example/policy resources (AC 16), each recorded in the P2–P4 fixtures above.



#### P5-3 — AC 18 local close-out command set (all exit 0)

| Command | Result |
|---|---|
| `node scripts/check-skill-context.test.mjs` | exit 0 (PASS) |
| `node scripts/check-skill-context.mjs` | exit 0 (PASS context budgets: 33 skills) |
| `npx skills add . --list` | exit 0 |
| `node --test scripts/*.test.mjs` | 39 pass / 0 fail |
| `node --test scripts/audit-pr-receipt.test.mjs` | 13 pass / 0 fail |
| `node --test scripts/review-receipt.test.mjs` | 13 pass / 0 fail |
| `git diff --check` | clean |
| Manual doc link/coherence | no `ADVERSARIAL_MERGE` reference anywhere; all `--synthesize` / `ADVERSARIAL_SYNTHESIS` references resolve; route-manifest reference files all exist |

#### P5-4 — AC 16 surface sync evidence

- CHANGELOG EN + ES: `audit-pr` 4.3.0 row present in both (ES row added this
  unit); `review-change` 2.10.0 and `execute-phase` 2.13.2 rows present in both.
- `MIGRATION.md` + `MIGRATION.es.md`: new dated 2026-08-05 note — `review-change`
  and `audit-pr` upgrade as a pair; an old `review-change` (no receipt) leaves
  `audit-pr` 4.3.0 blocked with no marker at the head; never mix versions.
- `docs/workflow/SKILLS.md` + `SKILLS.es.md`: `audit-pr` rows updated to
  receipt-consumption wording matching README EN/ES.
- `docs/workflow/GOLDEN_FIXTURE.md` + `GOLDEN_FIXTURE.es.md`: 2026-08-05 run-log
  row present in both (qwen3.6 3B weak-model fixture, feature #21).
- Version frontmatter (`audit-pr` 4.3.0, `review-change` 2.10.0,
  `execute-phase` 2.13.2) matches CHANGELOG rows.
- AC 2 sweep: `grep -Rni -- '--merge' skills/review-change docs/workflow`
  (excl. legacy/migration) → clean (exit 1); stale `Decision: FAIL` /
  `postpone` / `tradeoff` sweep → clean (exit 1).
