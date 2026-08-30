# Acceptance manifest v1 — 28-evidence-grounded-spec-plan-review

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | Strict `PreExecutionArtifactSnapshot v1` and `PreExecutionReviewReceipt v1` types, one authoritative semantic validator path, canonical digests/vectors, bounded diagnostics, generated structural projections, and package-root exports | `cd packages/agentic-workflow-schema && npm test` -> exit 0; `npm run check:pre-execution-schemas` -> exit 0 |
| AC2 | Exact Product/Plan content, context, parent, policy, source, and `artifactRevisionId` changes yield deterministic stale codes; a new authoring event prevents PASS resurrection after byte revert; candidate review/verification receipts are rejected as substitutes | `cd packages/agentic-workflow-schema && node --test test/pre-execution-*.test.mjs` -> exit 0 |
| AC3 | Public `review-spec` is artifact-read-only and emits only `SPEC-REVIEW-PASS`, `SPEC-REVIEW-FAIL`, or `NEEDS-DESIGN` after complete product/role/capability/expectation/acceptance/evidence checks | `node --test scripts/pre-execution-quality.test.mjs` -> exit 0 (SPEC route fixtures) |
| AC4 | Public `review-plan` covers feature and fix units, emits only `PLAN-REVIEW-PASS`, `PLAN-REVIEW-FAIL`, or `NEEDS-DESIGN`, and verifies exact obligation-to-phase/task/validator/closure correspondence | `node --test scripts/pre-execution-quality.test.mjs` -> exit 0 (Plan and fix fixtures) |
| AC5 | Evidence grounding cannot approve artifacts; issue-derived feature work stops after Product design for SPEC review; fix work routes from `plan-fix` to Plan review; unknown evidence is never converted into rationale | `node --test scripts/pre-execution-quality.test.mjs` -> exit 0 (grounding and issue-route fixtures) |
| AC6 | The obligation ledger rejects blank, partial, deferred, or issue-exported current-unit obligations; accepted/n-a rows carry the exact contracted evidence and no automatic issue creation occurs | `node --test scripts/pre-execution-quality.test.mjs` -> exit 0 (obligation and no-issue fixtures) |
| AC7 | Clean-context, author-exclusion, unioned-finding, counter-evidence, truthful-diversity, critique/synthesis, and changed-snapshot-or-question no-progress policies are fixed and tested | `node --test scripts/pre-execution-quality.test.mjs` -> exit 0 (independence and no-progress fixtures) |
| AC8 | `workflow-status`, transition/profile evidence, planners, `execute-phase`, `ship-roadmap`, review/fold, and `audit-pr` enforce current upstream review evidence and route Plan/Product root causes backward; legacy adoption never rewrites frozen acceptance | `node --test scripts/pre-execution-quality.test.mjs scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs` -> exit 0 |
| AC9 | Candidate `CandidateSnapshot`/`ReviewReceipt` and staged `VerificationPlan`/`VerificationReceipt` public meanings remain unchanged; `review-change` and `audit-pr` retain their existing authorities | read-verified: public API diff and docs show additive pre-execution surfaces only; full pre-existing package/root suites pass |
| AC10 | Schema package is released as additive minor `3.5.0`, both new schemas pack, every changed skill is bumped/changeloged, root/Pi skill bundle parity and Pi tests pass, intended skills are discoverable, context budgets pass, and EN/ES docs/migration are synchronized | schema version/pack checks; `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test`; `node scripts/check-skill-context.mjs`; `npx skills add . --list`; repository doc/version checks -> exit 0 |
| AC11 | Executor-path golden fixture demonstrates manual `review-spec -> plan -> review-plan -> execute` gating and no automatic issue creation without AWL/provider assumptions | read-verified: one dated PASS row in `docs/workflow/GOLDEN_FIXTURE.md` for every changed executor-path skill/version and the new manual route |
| AC12 | Exact candidate independently reviews with no unresolved fix-now finding; the canary protocol records baseline/post-change fields and makes no unmeasured savings claim | read-verified: current `review-change` PASS receipt plus completed canary template containing observations or explicit `not yet measured` values |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `cd packages/agentic-workflow-schema && npm test`
- `cd packages/agentic-workflow-schema && npm run check:pre-execution-schemas`
- `cd packages/agentic-workflow-schema && npm pack --dry-run`
- `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test`
- `node --test scripts/pre-execution-quality.test.mjs scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs`
- `node scripts/check-skill-context.mjs`
- `npx skills add . --list`
