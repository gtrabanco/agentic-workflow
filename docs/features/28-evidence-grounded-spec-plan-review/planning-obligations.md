# Planning obligations — 28-evidence-grounded-spec-plan-review

One row per acceptance criterion from the frozen SPEC/ACCEPTANCE.md.
Created by legacy adoption from artifacts as they stand.

Amended 2026-08-31 (user-approved re-plan, findings F2+F3+F6):
qualification obligations O9–O14 are re-mapped to the appended phases
(P6 corpus/fixture evidence, P7 reconciliation, P8 terminal re-review).
Statuses remain as recorded until each row's evidence lands.

Repaired 2026-08-31 (review finding RS4): rows O3 and O4 carried the closed
verdict vocabulary with unescaped `|` separators inside the
`affected-use-case-or-invariant` cell, so a strict nine-column parse shifted
every later column of those two rows (the verdicts read as `phase`, `task`,
… and the `status` column landed past the end). The same words are now joined
with commas, which keeps the nine-column contract parseable and the vocabulary
visible; no verdict, validator, evidence or status changed.

Reconciled 2026-09-01 (phase P7): O9, O10, O11 and O14 are `verified` on the
evidence recorded in `testing.md` (the P5 gate tables, the 2026-09-01 re-runs
and the qualification corpus — no second-cycle sample across the three samples).
O12 stays `planned`: its validator is the independent `review-change` PASS on
the terminal candidate, which P8 produces; it is named in `progress.md`'s
residuals. O13 has been `verified` since P4. Status cells only — no verdict,
validator or evidence cell changed.

obligation-id | authority-source | affected-use-case-or-invariant | phase | task | implementation-owner | validator | required-evidence | status
O1 | AC1 | strict PreExecutionArtifactSnapshot v1 and PreExecutionReviewReceipt v1 public-entry suites, canonical vectors, bounded diagnostics | P1 | Publish pre-execution evidence contracts | execute-phase | `cd packages/agentic-workflow-schema && npm test` | exit 0 with all new and existing suites green | verified
O2 | AC2 | package tests prove exact-content and artifactRevisionId binding, Product-to-Plan parent binding, drift precedence, authoring-event revert non-resurrection, rejection of candidate review/verification receipts | P1-P2 | Publish contracts / Establish Product review readiness | execute-phase | package test assertions | exit 0, assertions pass | verified
O3 | AC3 | node --test scripts/pre-execution-quality.test.mjs exits 0 with fixtures showing review-spec is read-only, checks product/role/capability/expectation/acceptance closure, returns exactly one of SPEC-REVIEW-PASS, SPEC-REVIEW-FAIL, NEEDS-DESIGN | P2 | Establish Product review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, 25/25 | verified
O4 | AC4 | review-plan covers both feature and fix units, reconciles every obligation to a phase/task/validator/closure condition, returns exactly one of PLAN-REVIEW-PASS, PLAN-REVIEW-FAIL, NEEDS-DESIGN | P3 | Establish Plan review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, 39/39 | verified
O5 | AC5 | evidence grounding never emits approval, feature issues stop for review-spec before Engineering-half planning, fix issues route plan-fix -> review-plan, unsupported claims remain explicit unknowns | P2 | Establish Product review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, fixtures pass | verified
O6 | AC6 | root fixtures reject blank/partial/deferred/issue-exported current-unit obligations, accept n/a only with non-contradictory evidence, every accepted row has phase/owner/validator/evidence/verified closure | P2 | Establish Product review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, fixtures pass | verified
O7 | AC7 | root fixtures prove clean-context review, author-exclusion where identities available, unioned findings, counter-evidence-only dismissal, truthful diversity labels, bounded critique/synthesis, changed-snapshot-or-named-question no-progress enforcement | P3 | Establish Plan review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, fixtures pass | verified
O8 | AC8 | transition and workflow fixtures prove current SPEC receipt gates planning, current Plan receipt gates execution, legacy adoption does not rewrite frozen acceptance, later plan/spec root causes route upstream | P4 | Enforce pre-execution authority routing | execute-phase | `node --test scripts/pre-execution-quality.test.mjs scripts/bounded-delivery-loops.test.mjs` | exit 0, 46/46 | verified
O9 | AC9 | package and repository diffs preserve the meanings and public shapes of CandidateSnapshot v1, candidate ReviewReceipt v1, VerificationPlan v1, and VerificationReceipt v1; review-change and audit-pr retain candidate and delivery authority | P5-P8 | Qualify the pre-execution workflow | execute-phase | `node --test scripts/*.test.mjs` | exit 0, all suites pass | verified
O10 | AC10 | package version/export/pack checks, canonical-to-Pi skill bundling/parity and Pi package tests, node scripts/check-skill-context.mjs, npx skills add . --list, skill changelogs, synchronized EN/ES docs, migration fixtures all pass | P5-P8 | Qualify the pre-execution workflow | execute-phase | `npm test` + Pi bundle + check-skill-context + skills add | exit 0, all checks pass | verified
O11 | AC11 | required executor-path golden fixture demonstrates complete manual path through review-spec, planning, review-plan, execution gating, candidate review, and audit without provider/runtime dependency or automatic issue creation | P6-P7 | Qualify the pre-execution workflow | execute-phase | golden fixture execution | PASS with no unresolved findings | verified
O12 | AC12 | independent review of the exact candidate reports no unresolved fix-now finding; canary protocol records baseline and post-change measurements without claiming improvement before results exist | P6, P8 | Qualify the pre-execution workflow | execute-phase | review-change + canary corpus | PASS with no fix-now findings | planned
O13 | AC13 | Product and Engineering authoring follow inventory -> evidence -> draft -> readiness -> independent review; readiness gate checks complete evidence/obligation/unknown structure, binds compact planning evidence, cannot emit review PASS verdict | P2-P3 | Establish Product/Plan review readiness | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0, fixtures pass | verified
O14 | AC14 | route fixtures and qualification corpus prove first review findings are repaired as one root-caused batch, one re-review is the normal correction path, entry into second repair/re-review cycle emits convergence anomaly with exact owner and evidence deficit; release canary includes feature/fix/cross-boundary unit, any sample needing second cycle fails qualification | P6-P7 | Qualify the pre-execution workflow | execute-phase | review-change + canary + second-cycle checks | PASS with no second-cycle sample | verified