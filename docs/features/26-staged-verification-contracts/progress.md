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
- **Status**: Done
- **Done**: npm test 310/310, acceptance receipt v1 recorded, bilingual docs updated (contract ID, Spanish phrase, consumer examples), schema NUL/path/policy constraints, validator exitCode/signal type checks, Windows path rejection, O(n²)→O(1) lookup, _VerifyAgainstPlanInput → VerifyAgainstPlanInput export, ledger F1–F12 folded
- **Remains**: F31–F39 identified by post-close review
- **Gotchas**: review-change found 9 structural defects (unreachable freshness outcome, self-derived vectors, pre-validation throwing, mutable vocabularies, untyped README examples, stale metadata, stale progress, malformed ledger)
- **Next**: P6 — Staged-verification contract correction

## P6 — Staged-verification contract correction
- **Status**: Done
- **Done**: F31 fix — distinguish missing-results from full-coverage-gap in compareVerificationReceiptToCurrent; F32 — hard-code canonical vector digests, deep-freeze entries; F33 — validate before hashing/dereferencing; F35 — compile-safe EN/ES README examples with `as const`; F36 — freeze all 6 vocabulary arrays + immutability tests; F39 — restore ledger columns, remove `ignore` rows; added 4 immutability/vector tests (310→314)
- **Remains**: none
- **Gotchas**: F31 fix requires moving pre-validation after stale-checks to preserve original stale-plan/fingerprint error precedence; vector digests computed from canonicalJSONValue and verified independently via node:crypto
- **Files**:
  - `packages/agentic-workflow-schema/src/index.ts` — validate-then-stale-checks in compareVerificationReceiptToCurrent, fixed vector digests, deep-frozen vocabulary arrays
  - `packages/agentic-workflow-schema/README.md` — compile-safe EN consumer example
  - `packages/agentic-workflow-schema/README.es.md` — compile-safe ES consumer example
  - `packages/agentic-workflow-schema/test/verification-core.test.mjs` — immutability tests, vector digest tests
  - `packages/agentic-workflow-schema/test/verification-scenarios.test.mjs` — updated coverage-gap test
  - `docs/features/26-staged-verification-contracts/review-findings.md` — F4 fixed, F27/F29 removed, all folded
  - `docs/features/26-staged-verification-contracts/progress.md` — P5 updated, P6 appended
  - `docs/features/26-staged-verification-contracts/TASKS.md` — P6 appended and checked
- **Next**: unit finished