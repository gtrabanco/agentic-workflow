# progress — 26-staged-verification-contracts

Last replanned: 2026-08-26 (user-approved P7–P15 replan)

## Acceptance receipt v2 (replacement)
- Manifest: docs/features/26-staged-verification-contracts/ACCEPTANCE.md · Blob: 2e8058860b2c805cc30507053f15f91e2f273249 · Status: frozen · Verified: 2026-08-26
- Supersedes: a4c643dabe8105293c76a1013713c4a3919a96cb under the 2026-08-26 user-approved SPEC amendment

## P1 — Deliver the VerificationPlan v1 contract
- **Status**: Done
- **Done**: Types, constants, validator, schema, test suite (34 new tests), exports from `src/index.ts`
- **Files**:
  - `packages/agentic-workflow-schema/src/index.ts` — added VerificationPlan v1 types, constants, and `validateVerificationPlanV1`
  - `packages/agentic-workflow-schema/verification-plan.schema.json` — new JSON Schema
  - `packages/agentic-workflow-schema/test/verification-plan.test.mjs` — 34 test cases covering all validation rules
  - `packages/agentic-workflow-schema/package.json` — added schema file to exports and files
  - `docs/features/26-staged-verification-contracts/TASKS.md` — P1 checkboxes checked
- **Remains**: P2, P3, P4, P5
- **Gotchas**: None
- **Next**: P2 — Deliver the VerificationReceipt v1 contract

## P2 — Deliver the VerificationReceipt v1 contract
- **Status**: Done
- **Done**: Types, constants, validator, schema, test suite (37 new tests), exports from `src/index.ts`
- **Files**:
  - `packages/agentic-workflow-schema/src/index.ts` — added VerificationReceipt v1 types, constants, and `validateVerificationReceiptV1`
  - `packages/agentic-workflow-schema/verification-receipt.schema.json` — new JSON Schema
  - `packages/agentic-workflow-schema/test/verification-receipt.test.mjs` — 37 test cases covering all validation rules
  - `packages/agentic-workflow-schema/package.json` — added receipt schema to exports and files
  - `docs/features/26-staged-verification-contracts/TASKS.md` — P2 checkboxes checked
- **Remains**: P3, P4, P5
- **Gotchas**: None
- **Next**: P3 — Implement the staged verification semantic core

## P3 — Implement the staged verification semantic core
- **Status**: Done
- **Done**: validateVerificationReceiptAgainstPlan, deriveVerificationVerdict, canonicalize/digest core, compareVerificationReceiptToCurrent freshness predicate, VERIFICATION_CANONICAL_VECTORS, bilingual docs (README.md + README.es.md), version 3.3.0 → 3.4.0
- **Files**:
  - `packages/agentic-workflow-schema/src/index.ts` — added semantic core functions, types, constants, vectors
  - `packages/agentic-workflow-schema/test/verification-core.test.mjs` — 36 test cases for verdict, digest, freshness
  - `packages/agentic-workflow-schema/test/release-contract.test.mjs` — version updated to 3.4.0
  - `packages/agentic-workflow-schema/README.md` — staged-verification section added
  - `packages/agentic-workflow-schema/README.es.md` — sección de verificación escalonada added
  - `packages/agentic-workflow-schema/package.json` — version 3.4.0
  - `packages/agentic-workflow-schema/tsconfig.json` — added @types/node for crypto types
  - `docs/features/26-staged-verification-contracts/TASKS.md` — P3 checkboxes checked
- **Remains**: P4, P5
- **Gotchas**: digestSync not available on crypto.subtle in Node.js 24 — used node:crypto.createHash as fallback; required adding @types/node devDependency
- **Next**: P4 — Cover the mandated verification scenario matrix

## P4 — Cover the mandated verification scenario matrix
- **Status**: Done
- **Done**: 23 scenario tests covering fast/success, fail-fast, full success/fail-fast, timeout, infrastructure-error, skipped-with/without reason, missing-results, coverage-gap, vacuous-fast, stale plan/candidate/acceptance, path-traversal, duplicate-id, and full pipeline
- **Files**:
  - `packages/agentic-workflow-schema/test/verification-scenarios.test.mjs` — 23 scenario tests
  - `docs/features/26-staged-verification-contracts/TASKS.md` — P4 checkboxes checked
- **Remains**: P5
- **Gotchas**: D4 exit/signal matrix required careful helper construction — made `makeResult` respect explicit opts while defaulting per D4 rules
- **Next**: P5 — Hardening & PR

## P5 — Hardening & PR
- **Status**: Done
- **Done**: npm test 310/310, acceptance receipt v1 recorded, bilingual docs updated (contract ID, Spanish phrase, consumer examples), schema NUL/path/policy constraints, validator exitCode/signal type checks, Windows path rejection, O(n²)→O(1) lookup, _VerifyAgainstPlanInput → VerifyAgainstPlanInput export, ledger F1–F12 folded
- **Remains**: F31–F39 identified by post-close review
- **Gotchas**: review-change found 9 structural defects (unreachable freshness outcome, self-derived vectors, pre-validation throwing, mutable vocabularies, untyped README examples, stale metadata, stale progress, malformed ledger)
- **Next**: P6 — Staged-verification contract correction

## P6 — Staged-verification contract correction
- **Status**: Done (historical; superseded by the P7–P15 replan)
- **Done**: Folded F31–F62 across validator order, freshness, vector, schema-projection, API, docs and lockfile corrections; latest pre-replan package gate reported 327 tests.
- **Remains**: S1/S12 decisions are resolved; F63–F77 remain open and map to P7–P15.
- **Gotchas**: the final F62 fold made `incomplete-stage-coverage` unreachable again; separate validation authorities continued to drift; progress and PR metadata lagged the candidate.
- **Files**: source, generated projections, verification suites, bilingual README, package metadata, planning docs and fold ledger.
- **Next**: P7 — Unify validation authority

## P7 — Unify validation authority
- **Status**: Planned
- **Done**: D12/D13/D16 surface, tasks and replacement acceptance frozen.
- **Remains**: 8 schema tasks; F64, F69 and F76 roots.
- **Next**: `execute-phase 26 P7`

## P8 — Repair freshness classification
- **Status**: Planned
- **Done**: Disjoint D1 precedence and the seven-outcome matrix frozen.
- **Remains**: 6 schema tasks; F63 root.
- **Next**: after P7, `execute-phase 26 P8`

## P9 — Repair verification semantics
- **Status**: Planned
- **Done**: Corrected D1/D3 targets and AC5 authoritative evidence scope frozen.
- **Remains**: 8 schema tasks; F65–F67 and F72 roots.
- **Next**: after P8, `execute-phase 26 P9`

## P10 — Bound verification shapes
- **Status**: Planned
- **Done**: D14 shape limits frozen after user approval.
- **Remains**: 8 schema tasks; F77 shape roots.
- **Next**: after P9, `execute-phase 26 P10`

## P11 — Bound verification payloads
- **Status**: Planned
- **Done**: D14 payload limits and the D16 diagnostic contract frozen.
- **Remains**: 8 schema tasks; F71 and F77 payload roots.
- **Next**: after P10, `execute-phase 26 P11`

## P12 — Bound verification time
- **Status**: Planned
- **Done**: D14 timeout ceilings and stage budgets frozen.
- **Remains**: 6 schema tasks; F77 time roots.
- **Next**: after P11, `execute-phase 26 P12`

## P13 — Build package qualification tooling
- **Status**: Planned
- **Done**: Package/lock/script scope frozen.
- **Remains**: 7 config/infra tasks; F70 and benchmark/package-gate roots.
- **Next**: after P12, `execute-phase 26 P13`

## P14 — Document the verification contract
- **Status**: Planned
- **Done**: EN/ES authority, limits and example requirements frozen.
- **Remains**: 8 docs tasks; F68 and the deferred AWL boundary.
- **Next**: after P13, `execute-phase 26 P14`

## P15 — Requalify the delivery candidate
- **Status**: Planned
- **Done**: Fresh close-out chain frozen.
- **Remains**: 10 close-out tasks; AC1–AC10 evidence, F73–F75 metadata/ledger close-out and fresh review.
- **Next**: after P14, `execute-phase 26 P15`
