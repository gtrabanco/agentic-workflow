# progress — 26-staged-verification-contracts

Last replanned: 2026-08-26 (user-approved P7–P15 replan)

## Acceptance receipt v2 (replacement)
- Manifest: docs/features/26-staged-verification-contracts/ACCEPTANCE.md · Blob: 2e8058860b2c805cc30507053f15f91e2f273249 · Status: frozen · Verified: 2026-08-26
- Supersedes: a4c643dabe8105293c76a1013713c4a3919a96cb under the 2026-08-26 user-approved SPEC amendment

## Dependency receipt v1
- Fingerprint: 0292879887688a0c94e59984ad9dd60dbb590623 · Closure: 26-staged-verification-contracts ← 25-content-bound-review-receipts
- Inputs: SPEC `## Dependencies` hard row + ROADMAP row 25 (no literal `Depends on:` field exists in this SPEC)
- Merged PRs: 25 #144 @ 11a8061639e0ea2bdfdbaabc270380543eb37002 · Fully merged: yes · Verified: 2026-08-26

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

## P7 — 2026-08-26
- **Status**: Done
- Done: One canonical internal definition (`src/verification-contract.ts`) now owns the field lists, vocabularies, bounds, patterns and cross-field rules, and is consumed by runtime validation (`validateStructure`, own-property only) and by the new deterministic projection generator/check (`scripts/generate-verification-schemas.mjs`, `--check`). `validateVerificationPlanV1(value: unknown)` is the sole plan entry and `validateVerificationReceiptAgainstPlan(receipt: unknown, plan: unknown)` the sole receipt entry; both return normalized own-property DTOs (never the submitted reference), and `canonicalize*/digest*` project through the definition first. The standalone public receipt validator is retired with no alias, and the duplicate/unplanned constants (`VERIFICATION_STAGE_REQUESTS`, `VERIFICATION_WORKING_DIRECTORY_POLICIES`, `VERIFICATION_PLAN_SCHEMA_PATH`, `VERIFICATION_RECEIPT_SCHEMA_PATH`) are gone, so the public `VERIFICATION_*` surface is exactly the planned eight. 23 red-first authority tests in `test/verification-authority.test.mjs`; gate: 350/350 tests + drift-free projections.
- Remains: P8–P15. F63–F77 ledger rows stay `folded: no` — P15 owns the ledger flip; the diagnostic result (`errors: string[]` → bounded code+path rows) stays in P11 by D16.
- Gotchas: (1) the receipt suites no longer have a structural-only entry — every receipt fixture must be plan-consistent (matching `planDigest`, declared order and derived verdict); five accept-cases were re-bound to a fail-fast plan for valid D3 attribution, assertions untouched. (2) Non-authoritative projection metadata lives in `$comment` + `description`: Ajv `strict: true` rejects `x-*` keywords and the strict-mode parity fixtures must not be loosened. (3) The generated projections are now strictly stronger than the hand-written files — they also express "non-skipped rows carry skipReason null"; regenerate, never hand-edit. (4) `README.md`/`README.es.md` examples still import the retired `validateVerificationReceiptV1`; P14 owns the docs layer (a P14 task line was added). (5) `canonicalize*`/`digest*` of the published `VERIFICATION_CANONICAL_VECTORS` are byte-identical after normalization — do not restate the vector digests.
- Files: `packages/agentic-workflow-schema/src/verification-contract.ts`, `src/index.ts`, `scripts/generate-verification-schemas.mjs`, `verification-plan.schema.json`, `verification-receipt.schema.json`, `test/verification-authority.test.mjs`, `test/verification-{plan,receipt,core,scenarios}.test.mjs`, `docs/features/26-staged-verification-contracts/{TASKS,progress,decisions}.md`
- Next: P8 — Repair freshness classification

## P8 — Repair freshness classification
- **Status**: Done
- Done: `compareVerificationReceiptToCurrent` now answers the six D1 codes on reachable, disjoint conditions in the SPEC's fixed order — three stale bindings first (plan digest → candidate snapshot → acceptance fingerprint), then the incomplete block (missing FAST-stage row → unjustified skip → missing FULL-stage row on a `full` receipt) — with `{fresh: true}` as the only remaining outcome. `incomplete-stage-coverage` is reachable again (F63 root), and the malformed-input fast path reports `stale-plan` instead of an incompleteness it never verified.
- Remains: P9–P15. F63 is repaired by this phase but its ledger row stays `folded: no` — P15 owns the ledger flip.
- Gotchas: (1) The partition that keeps the two coverage codes disjoint is **the stage of the missing command, not the requested stage of the receipt** — `decisions.md` P8 records why; do not re-tighten it to `stageRequested`. (2) Three pre-existing assertions (two in `test/verification-core.test.mjs`, one in `test/verification-scenarios.test.mjs`) pinned the F63 behaviour and were corrected to the SPEC-frozen codes; assertion strength is unchanged. (3) P9's determinism tasks still own repeatability for canonicalize/digest/verdict — this phase pinned only the fresh-path determinism its own task listed. (4) The projection files are untouched by this phase: `node scripts/generate-verification-schemas.mjs --check` still passes.
- Files: `packages/agentic-workflow-schema/src/index.ts`, `packages/agentic-workflow-schema/test/verification-freshness.test.mjs` (new), `packages/agentic-workflow-schema/test/verification-core.test.mjs`, `packages/agentic-workflow-schema/test/verification-scenarios.test.mjs`, `docs/features/26-staged-verification-contracts/{TASKS,progress,decisions,testing}.md`
- Next: P9 — Repair verification semantics

## Unit-loop receipt — P8
- Commit: pending · Gate: `cd packages/agentic-workflow-schema && npm test` (exit 0, 365/365) + `node scripts/generate-verification-schemas.mjs --check` (exit 0) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P9 · Attempts: 1 · Review-checkpoint trigger recorded: **accumulation fired** — 8 files / 443 changed lines since `aeb2b92` (no `Last reviewed:` marker in this unit, so the merge-base baseline is even larger); layer unchanged (schema), no sensitivity surface (no auth/secrets/CI/destructive migration touched). Whole-unit mode records it and continues; the mandatory end review covers the frozen final candidate.

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
