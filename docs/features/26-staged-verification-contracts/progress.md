# progress — 26-staged-verification-contracts

Last reviewed: 2026-08-24 (initial review)

## Acceptance receipt v1
- Manifest: docs/features/26-staged-verification-contracts/ACCEPTANCE.md · Blob: a4c643dabe8105293c76a1013713c4a3919a96cb · Status: frozen · Verified: 2026-08-24

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
- **Status**: In progress
- **Remains**: Fold F1–F12 (semantic, validator, schema, docs, progress fixes)
- **Next**: Re-run npm test, update roadmap, push, update PR