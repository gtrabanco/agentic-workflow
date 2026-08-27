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
- Commit: c899d06 · Gate: `cd packages/agentic-workflow-schema && npm test` (exit 0, 365/365) + `node scripts/generate-verification-schemas.mjs --check` (exit 0) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P9 · Attempts: 1 · Review-checkpoint trigger recorded: **accumulation fired** — 8 files / 443 changed lines since `aeb2b92` (no `Last reviewed:` marker in this unit, so the merge-base baseline is even larger); layer unchanged (schema), no sensitivity surface (no auth/secrets/CI/destructive migration touched). Whole-unit mode records it and continues; the mandatory end review covers the frozen final candidate.

## P9 — Repair verification semantics
- **Status**: Done
- Done: `validateVerificationReceiptAgainstPlan` now enforces **complete `stopOnFailure` sequencing and attribution** — the trigger is the earliest row whose command declares `stopOnFailure: true` and whose status is `failed | timed-out | infrastructure-error`; every later row must be `skipped`, and a reason present after the trigger must name that trigger (F65). The misnamed fast-stage fixture really submits a full-stage row now (F66), `VERIFICATION_CANONICAL_VECTORS` is `ReadonlyArray<Readonly<CanonicalVectorV1>>` so consumer writes fail to compile (F67), and AC5's authoritative-entry + repeatability evidence is pinned with shared vector payloads (F72).
- Remains: P10–P15. F65–F77 ledger rows stay `folded: no` — P15 owns the flip.
- Gotchas: (1) The sequencing rule deliberately does **not** invalidate a `skipped` row with a null reason after the trigger, nor a later command with no row: D3 calls the null reason representable incompleteness (verdict `incomplete`) and D7 calls a missing row representable — invalidating either would erase AC3's `skipped-without-reason` scenario. (2) Error text is still `errors: string[]`; P11 replaces it with the bounded diagnostic rows, and the new assertions match on `stopOnFailure` / `skipReason` substrings so that swap stays mechanical. (3) `CanonicalVectorV1` is a pre-existing feature-25 export — readonly-ness was applied at the feature-26 declaration site, never by editing that interface (AC8). (4) Vector payloads moved to `test/fixtures/verification-vectors.mjs`; the digest assertions still compute expected values through `node:crypto` independently (F32), so the fixture is shared but not self-derived. (5) The projection files are unchanged: sequencing is semantic and Draft-07 cannot express it.
- Files: `packages/agentic-workflow-schema/src/index.ts`, `test/verification-semantics.test.mjs` (new), `test/fixtures/verification-vectors.mjs` (new), `test/fixtures/verification-vector-readonly.ts` (new), `test/verification-core.test.mjs`, `docs/features/26-staged-verification-contracts/{TASKS,progress,decisions,testing}.md`
- Next: P10 — Bound verification shapes

## Unit-loop receipt — P9
- Commit: 8055343 · Gate: `cd packages/agentic-workflow-schema && npm test` (exit 0, 380/380) + `node scripts/generate-verification-schemas.mjs --check` (exit 0) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P10 · Attempts: 1 · Review-checkpoint trigger recorded: accumulation fired again (5 files / 452 changed lines since `c899d06`); layer unchanged (schema); no sensitivity surface.

## P10 — Bound verification shapes
- **Status**: Done
- Done: `VERIFICATION_LIMITS` (frozen, public, declared once in `src/verification-contract.ts`) now drives every shape ceiling — 128 commands, 128 results, 64 args/command, 128-char ids and commandIds, 1024-char executable/workingDirectory, 4096 chars per arg — and both Draft-07 projections were regenerated from it. 13 boundary pairs (exact limit / one over) are green.
- Remains: P11–P15. `VERIFICATION_LIMITS` still lacks the payload fields (skipReasonChars, evidenceRefChars, planBytes, receiptBytes, diagnostics → P11) and the timeout fields (→ P12).
- Gotchas: (1) The `stringArray` branch of `validateStructure` had **no** `maxItems` check while the generator already projected one — a silent validator/projection divergence on `args`; it is fixed and pinned. Any future string-array ceiling must be enforced in both places by that single branch. (2) `id`/`commandId` moved from the F50 1024 char class to D14's 128 — `test/verification-plan.test.mjs` now asserts the 128 boundary and the public-surface assertion in `test/verification-authority.test.mjs` lists `VERIFICATION_LIMITS`. (3) `workingDirectory` is nullable, so its projected bounds live on the **non-null `oneOf` branch**, not on the property root — boundary assertions must read the branch. (4) The generator consumes **`dist/`**, so after editing the definition the order is `npx tsc` → generate → `--check`; P13's registered command must build first or it will check a stale render.
- Files: `packages/agentic-workflow-schema/src/verification-contract.ts`, `src/index.ts`, `verification-plan.schema.json`, `verification-receipt.schema.json` (regenerated), `test/verification-bounds.test.mjs` (new), `test/verification-plan.test.mjs`, `test/verification-authority.test.mjs`, `docs/features/26-staged-verification-contracts/{TASKS,progress,decisions,testing}.md`
- Next: P11 — Bound verification payloads

## Unit-loop receipt — P10
- Commit: 1a7eace · Gate: `cd packages/agentic-workflow-schema && npm test` (exit 0, 393/393) + `node scripts/generate-verification-schemas.mjs --check` (exit 0) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P11 · Attempts: 1 · Review-checkpoint trigger recorded: accumulation fired (9 files / 336 changed lines since `8055343`; regenerated projections included), layer unchanged (schema); no sensitivity surface. Projections changed in this phase, so the end review should re-check AC9's generated-file claims against the final candidate.

## P11 — Bound verification payloads
- **Status**: Done
- Done: validation failures are now **bounded, redacted diagnostics**. Both public entries (and every helper that used to return `errors: string[]`) return `{ ok: false, diagnostics, truncated }` where each row is a frozen `{ code, path }`: `code` from the newly published `VERIFICATION_DIAGNOSTIC_CODES` (16 codes, SPEC-frozen), `path` an RFC 6901 pointer into the payload (`/commands/3/id`, `/results/1/commandId`, `""` for the whole document). The sink caps at `VERIFICATION_LIMITS.diagnostics` (50) in emission order and reports `truncated`. `VERIFICATION_LIMITS` gained the payload fields (`skipReasonChars`, `evidenceRefChars`, `planBytes` 256 KiB, `receiptBytes` 512 KiB, `diagnostics` 50), the canonical byte budget is enforced **before** any diagnostic is allocated, and the projections were regenerated with the runtime-only payload rules disclosed. 68 assertion sites in the seven pre-existing feature-26 suites were retargeted onto one shared fixture (`test/fixtures/verification-diagnostics.mjs`); 14 new cases in `test/verification-payload.test.mjs`.
- Remains: P12–P15. `budget-exceeded` is the one published code with no emitter yet — P12 owns the fast/full aggregate-budget and timeout rules (AC10); the new vocabulary test fails if any *other* code stays silent.
- Gotchas: (1) `unknown-field` rows now point at the **container**, not the submitted key — an undeclared key is input data, so echoing it would break D16 redaction (`__proto__` and `secret-token` probes proved this). (2) The receipt byte budget cannot bind through shape-legal payloads: a maximum-capacity legal receipt is 440,331 B against a 524,288 B ceiling (pinned by test), so the check is a defensive refusal that only ever fires on a document that also crosses a cardinality ceiling. (3) Measuring the budget on the **submitted** document is exact, not approximate: `validateStructure` rejects undeclared fields, so any document it accepts has a canonical form byte-identical to the raw one. (4) A skip-reason at exactly 1024 chars is never semantically valid (ids cap at 128, so it cannot name a trigger) — the boundary pair is proven by which *code* answers, `unknown-command` inside and `limit-exceeded` outside. (5) D5 evidence content rules (NUL in `ref`, non-64-hex `sha256`) now report `invalid-evidence` through a new per-field `violationCode`; capacity keeps `limit-exceeded` and type errors keep `invalid-type`.
- Files: `packages/agentic-workflow-schema/src/verification-contract.ts`, `src/index.ts`, `scripts/generate-verification-schemas.mjs`, `verification-plan.schema.json`, `verification-receipt.schema.json` (regenerated), `test/verification-payload.test.mjs` (new), `test/fixtures/verification-diagnostics.mjs` (new), `test/verification-{plan,receipt,core,scenarios,authority,semantics,bounds}.test.mjs` (assertion migration), `docs/features/26-staged-verification-contracts/{TASKS,progress,decisions,testing}.md`
- Next: P12 — Bound verification time

## Unit-loop receipt — P11
- Commit: pending · Gate: `cd packages/agentic-workflow-schema && npm test` (exit 0, 407/407) + `node scripts/generate-verification-schemas.mjs --check` (exit 0) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P12 · Attempts: 1 · Review-checkpoint trigger recorded: accumulation fired again (14 files / 451 changed lines since `1a7eace`; public failure-shape change + regenerated projections). Layer unchanged (schema), but this phase **changed the public result type of both authoritative entries** (`errors: string[]` → `diagnostics`/`truncated`), so the end review must re-check AC8 (no pre-existing suite touched) and AC9/AC10 generated-file claims against the final candidate, and F71's ledger row against the shipped diagnostic shape.

## P12 — Bound verification time
- **Status**: Planned
- **Done**: D14 timeout ceilings and stage budgets frozen.
- **Remains**: 6 schema tasks; F77 time roots.
- **Next**: after P11, `execute-phase 26 P12` (P11 delivered `planBytes`/`receiptBytes`/`diagnostics` in `VERIFICATION_LIMITS`; the timeout fields are still missing)

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
