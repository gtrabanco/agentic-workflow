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

Amended again 2026-09-01 (owner verdict on F32): obligation **O21** is added for AC21 and mapped to **P17**, which executes before the P16 close-out.

Reconciled 2026-09-01 (phase P9): **O16** moves to `in-progress`, not `verified`.
Its map-and-scan clauses are proven — `node --test scripts/ledger-ownership.test.mjs`
18/18 exit 0 green, and 16 of 18 failing / exit 1 against the pre-P9 tree
(`git archive 0feaaf64`: no map, no templates) — but the row's third clause, "gate
rejections keep typed durable traces", is P10's work (AC17/O17), and a row whose
named validator covers only part of its statement is not a verified row. Status
cell only; no verdict, validator or evidence cell changed.

Reconciled 2026-09-01 (phase P10): **O16** moves to `verified` — the clause P9
left open, "gate rejections keep typed durable traces", landed with AC17's four
types and their printed traces, and the row's named validator still answers
(`node --test scripts/ledger-ownership.test.mjs` 18/18 exit 0, and 16/18 failing
against the pre-P9 tree). **O17** moves from `planned` to `in-progress`, not
`verified`: P10 delivered the mark, trace and replay fixtures
(`node --test scripts/pre-execution-quality.test.mjs` 53/53 exit 0 with the four
new cases), but the row spans P10 **and** P11, and P11's half — the sensor keying
its review-ran proof on the durable mark instead of on ledger presence — has not
run. Status cells only; no verdict, validator or evidence cell changed.

Amended 2026-09-01 (user-approved re-plan, finding F3 `replan-in-unit`, issue
#146 flow-integrity amendment F1-F6): obligations **O15-O20** are added for
AC15-AC20 and mapped to the appended phases P9-P16. Existing rows O1-O14 keep
their recorded authority, validator, evidence and status untouched; O12 stays
`planned` because its validator is the independent review that **P16** now
produces at the amended head, not P8.

Nine-column rule held: no cell quotes a closed `|`-separated vocabulary — vocabularies are joined with commas (known-issue 13).

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
O15 | AC15 | F1 drift gate: a repository test fails when normative skill text orders a transition, argument, field, artifact, or ledger-row shape the machine surface does not accept, and when the machine requires something no text states; surfaces lacking fixed grammar get one; prose restating versions, SHAs, counts, next commands is render-only and the machine is authoritative | P14 | Bind normative prose to machine surfaces | execute-phase | `node --test scripts/normative-drift.test.mjs` | exit 0 green and non-zero against each of the three injected disagreements | planned
O16 | AC16 | F2 durable-ledger write ownership: one declared owner per truth class plus declared mechanical annotator, present in the ownership map and every template; scan fails undeclared script or agent writers; gate rejections keep typed durable traces | P9 | Declare durable ledger write ownership | execute-phase | `node --test scripts/ledger-ownership.test.mjs` | exit 0 green and non-zero on the undeclared-writer fixture | verified
O17 | AC17 | F3 terminal marking: verdict and rejection turns write the durable mark in the same act, traces name reason and return route, replay of a stale, wrong, or duplicate mark refuses with a typed reason and zero side effects | P10, P11 | Mark terminal verdicts durably, prove clean reviews with a durable mark | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0 with terminal-mark, rejection-trace and no-side-effect fixtures | in-progress
O18 | AC18 | F4 delegated evidence standard: versioned artifact with outcome, questions, seven source fields, claims mapped to source ids, contradictions, freshness, separated product choices, unverified section; partial or blocked blocks readiness; persist-then-STOP; advisory until spot-checked | P12 | Conserve delegated evidence as a versioned artifact | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0 with delegated-evidence and NEEDS-EVIDENCE fixtures | planned
O19 | AC19 | F5 normalization before freeze: every source-mutating normalizer scheduled strictly before the snapshot or freeze row, only check-only actions after, post-freeze byte change voids current receipts | P13 | Run normalizers before the artifact freeze | execute-phase | `node --test scripts/pre-execution-quality.test.mjs` | exit 0 green and non-zero when a mutating step follows the freeze | planned
O20 | AC20 | F6 clean-review sensing: sensor review-run proof keys on the durable review mark instead of findings-ledger presence so a zero-finding review is distinguishable from a never-reviewed unit | P11 | Prove clean reviews with a durable mark | execute-phase | `node --test scripts/workflow-status-pre-execution.test.mjs` | exit 0 with mark-present and ledger-only fixtures | planned
O21 | AC21 | F32 disposition: the sync digest prefers the host native SHA-256 through globalThis.process?.getBuiltinModule?.("crypto") where present and this package's pure-JS path otherwise, one identical lowercase 64-hex result, no static node: specifier, no @types/node, no dependency added, nothing vendored, rejected alternatives recorded with measured cost, and any future copied code carrying source, author, version and license | P17 (runs before P16) | Prefer the host native SHA-256 digest | execute-phase | `cd packages/agentic-workflow-schema && npm test` plus the no-static-node-import grep and the two-path digest probe | exit 0, identical digests from both paths, zero static builtin imports | planned
