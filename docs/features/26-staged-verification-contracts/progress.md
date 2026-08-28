# progress — 26-staged-verification-contracts

Last replanned: 2026-08-26 (user-approved P7–P15 replan)

## Acceptance receipt v2 (replacement)
- Manifest: docs/features/26-staged-verification-contracts/ACCEPTANCE.md · Blob: 2e8058860b2c805cc30507053f15f91e2f273249 · Status: frozen · Verified: 2026-08-26
- Supersedes: a4c643dabe8105293c76a1013713c4a3919a96cb under the 2026-08-26 user-approved SPEC amendment

## AC1–AC10 execution receipt — candidate `5934702` (2026-08-27)

- Manifest: docs/features/26-staged-verification-contracts/ACCEPTANCE.md · Blob: 2e8058860b2c805cc30507053f15f91e2f273249 · Status: frozen · Verified: recomputed at P15, exact match with receipt v2 above
- Every validator below is the literal command from the frozen manifest, run against the pushed candidate. 254 verification cases inside 442 total package tests.
- `5934702` is the last commit that changes anything the validators read. The close-out commit adds planning state only; the chain is re-run at the exact pushed HEAD and that observation is recorded in PR #145's body (P15 task 10).

| AC | Validator as frozen | Observed | Evidence in the candidate |
|---|---|---|---|
| AC1 | `cd packages/agentic-workflow-schema && npm test` → exit 0 | exit 0, 442/442 | `verification-plan.test.mjs` (40) + `verification-core.test.mjs` (43) + `verification-bounds.test.mjs` (13) reject undeclared/inherited fields, empty/oversized lists, duplicate/empty/oversized ids, vocabulary, executable/args/working-directory shapes, invalid timeouts, budget violations and non-boolean `stopOnFailure`; `verification-authority.test.mjs` proves the returned plan is a normalized own-property DTO |
| AC2 | same command → exit 0 | exit 0, 442/442 | `verification-receipt.test.mjs` (40) covers structural + every plan-bound rule in the one call; `verification-authority.test.mjs` asserts no standalone receipt validator is exported and that a rejection is exactly `{ diagnostics, ok, truncated }` |
| AC3 | same command → exit 0 | exit 0, 442/442 | `verification-scenarios.test.mjs` (17) and `verification-semantics.test.mjs` (14): fast/full success, both fail-fast paths, timeout, infrastructure error, skipped with/without reason, missing results, requested-full coverage gap, vacuous-fast pin, and no `pass` unless every declared command of the stage passed |
| AC4 | same command → exit 0 | exit 0, 442/442 | `verification-freshness.test.mjs` (15) — reachability matrix over all six reason codes plus `{ fresh: true }` on disjoint conditions (P8 repair) |
| AC5 | same command → exit 0 | exit 0, 442/442 | shared `test/fixtures/verification-vectors.mjs` vectors pass through the authoritative entries, repeated canonicalize/digest/derive/compare calls are deep-equal, and `test/fixtures/verification-vector-readonly.ts` is compiled by `tsc -p tsconfig.test.json` to prove the frozen entries are readonly in the type |
| AC6 | `npm run test:verification-docs` → exit 0 | exit 0, 13/13 | `verification-docs.test.mjs`: AC6's six claims in both languages, every `VERIFICATION_LIMITS` number per table row, budgets + p95 statement, projection/generator/drift boundary, D16 shape and 16-code vocabulary, six freshness codes, no unexported call in either reference, EN/ES example-code equality, and the extracted feature-26 example typechecked against the published types **and executed** to `Delivery verified` |
| AC7 | `(cd packages/agentic-workflow-schema && npm ci && bun install --frozen-lockfile && npm test && npm run check:verification-package) && node scripts/check-skill-context.mjs && npx skills add . --list` → exit 0 | exit 0 end-to-end | `npm ci` clean; `bun install --frozen-lockfile` "no changes" (locks agree with the manifest, asserted in `verification-gates.test.mjs`); 442/442; package verifier: 15 packed files, both projections present, every `exports` target shipped, no dev path leaked; version `3.4.0`; `PASS context budgets: 35 skills`; skills CLI lists all and exits 0 |
| AC8 | read-verified: `git diff main -- packages/agentic-workflow-schema/{envelope,skill-outcome,workflow-snapshot,candidate-snapshot,review-receipt}.schema.json` | empty diff (0 lines) | the five prior schema files are byte-identical to `main`; the only public-shape change in this unit is the unshipped feature-26 failure result (`errors: string[]` → bounded diagnostics), which no pre-existing suite or consumer depends on |
| AC9 | `npm run check:verification-schemas` → exit 0; projection fixture tests in `npm test` → exit 0 | `verification schemas are generated and drift-free (2 files)`; suites green | one canonical definition (`src/verification-contract.ts`) renders both projections; `$comment`/`description` carry `authoritative: false`, the authority name and the runtime-only disclosures; strict-Ajv compile + parity fixtures prove the Draft-07-expressible rules agree with the validator, and semantic validity is claimed only by the two entries |
| AC10 | `npm test` → boundary suites exit 0; `npm run bench:verification -- --commands 128` → exit 0 and p95 ≤ 100 ms | 442/442; `PASS · p95 18.33 ms ≤ 100 ms` | `verification-bounds.test.mjs` (128 commands / 128 results / 64 args / 128-char ids / 1024-char paths / 4096-char args), `verification-payload.test.mjs` (256 KiB plan at and one byte over, 512 KiB receipt invariant, 50-row diagnostic ceiling + `truncated` + redaction), `verification-timeouts.test.mjs` (10/15 min and 60/120 min pairs, per-stage isolation, first-crossing `budget-exceeded`); Ajv/validator parity on every projected ceiling; benchmark has no ceiling override |

Passing the declared checks is necessary, not sufficient: the quality floor keeps the
final **independent review** and the manual documentation read outstanding. This
receipt does not claim either — it hands the exact pushed HEAD and the blob above to
`/loop-review-fold 26-staged-verification-contracts`.

## Dependency receipt v1
- Fingerprint: 0292879887688a0c94e59984ad9dd60dbb590623 · Closure: 26-staged-verification-contracts ← 25-content-bound-review-receipts
- Inputs: SPEC `## Dependencies` hard row + ROADMAP row 25 (no literal `Depends on:` field exists in this SPEC)
- Merged PRs: 25 #144 @ 11a8061639e0ea2bdfdbaabc270380543eb37002 · Fully merged: yes · Verified: 2026-08-26

## Dependency receipt v2 (full pass at P16 entry — supersedes v1)
- Fingerprint: not reproducible from the recorded inputs — recomputing `git hash-object --stdin` over the SPEC hard-deps line + ROADMAP row 25 yields `5b9bd433a59a369865eaa3de8842d2eecf035ba6` (and `98adf44849c4b23fd014cc14e41366a376fd7a0c` for the whole `## Dependencies` block, `3c3f2f1ddc6ada7a3b7bfb715d2ec137edec627c` newline-joined). v1's `0292879…` matches no reading of those inputs, so the fail-closed rule applied: forge traversal re-run, fast path not taken.
- Closure: 26-staged-verification-contracts ← 25-content-bound-review-receipts (row 25 dep cell `—`, so the closure is depth 1)
- Merged PRs: 25 #144 MERGED @ 11a8061639e0ea2bdfdbaabc270380543eb37002 (`gh pr view` 2026-08-27) · ancestor-of-HEAD verified · Fully merged: yes · Verified: 2026-08-27
- Own status: roadmap row 26 `in-progress · [#145]` → `planned`+ → proceed. No `--force` is recorded in `decisions.md`.

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
- Commit: e912594 · Gate: `cd packages/agentic-workflow-schema && npm test` (exit 0, 407/407) + `node scripts/generate-verification-schemas.mjs --check` (exit 0) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P12 · Attempts: 1 · Review-checkpoint trigger recorded: accumulation fired again (14 files / 451 changed lines since `1a7eace`; public failure-shape change + regenerated projections). Layer unchanged (schema), but this phase **changed the public result type of both authoritative entries** (`errors: string[]` → `diagnostics`/`truncated`), so the end review must re-check AC8 (no pre-existing suite touched) and AC9/AC10 generated-file claims against the final candidate, and F71's ledger row against the shipped diagnostic shape.

## P12 — Bound verification time
- **Status**: Done
- Done: D14's four time bounds are now enforced from the canonical definition — `timeoutMs.maximum` = 60 min (full), a `maximum-when` rule tightening it to 10 min for `stage: "fast"`, and `fast-stage-aggregate-budget` / `full-stage-aggregate-budget` root rules that sum each stage in declared order. `VERIFICATION_LIMITS` gained `fastCommandTimeoutMs`, `fastStageTimeoutMs`, `fullCommandTimeoutMs`, `fullStageTimeoutMs`; `budget-exceeded` finally has an emitter, so the P11 guard now demands **zero** silent codes. 12 red-first cases in `test/verification-timeouts.test.mjs` (written before the implementation; all 12 failed, then all passed) + regenerated projection with an `if/then` fast ceiling.
- Remains: P13–P15.
- Gotchas: (1) **The budgets cross the capacity tests.** A 128-command fast plan with the old 30 s fixture timeout declares 3,840,000 ms against a 900,000 ms stage budget, so three pre-existing capacity fixtures (P10's 128-command acceptance, P11's maximum-capacity receipt, core's 128-result case) had to size their fixture timeout for capacity: `floor(fastStageTimeoutMs / commands)` = 7031 ms. That is fixture sizing, not a loosened assertion — the ceilings they test are unchanged. **P13's benchmark must do the same** or it will build an invalid 128-command plan. (2) `fastStageTimeoutMs` (15 min) is *smaller* than two fast command ceilings (2 × 10 min) by design — one 10-minute fast command leaves 5 minutes for the rest of the stage; pinned explicitly so nobody "fixes" it. (3) An aggregate violation names the **first crossing** command (`/commands/2/timeoutMs`), not the array: a sum has no single owner, and the earliest pointer that explains the overflow is the actionable one. (4) A plan can break a ceiling and a budget at once and gets **both** rows (per-command `limit-exceeded` ×2 + one `budget-exceeded`) — rules answer independently, which is what the diagnostic ceiling is for. (5) Draft-07 expresses a *conditional* ceiling (`if stage=fast then timeoutMs ≤ 600000`), so AC10 forbids projecting only the loose 60 min maximum; a sum cannot be expressed, so the two budget rule ids are disclosed as runtime-only through the existing generator mechanism. (6) Strict Ajv rejects a bare `maximum` in a `then` branch — the projected fragment carries `type: "number"` alongside the ceiling.
- Files: `packages/agentic-workflow-schema/src/verification-contract.ts`, `scripts/generate-verification-schemas.mjs`, `verification-plan.schema.json` (regenerated), `test/verification-timeouts.test.mjs` (new), `test/verification-{bounds,payload,core}.test.mjs` (fixture timeout sizing + tightened vocabulary guard), `docs/features/26-staged-verification-contracts/{TASKS,progress,decisions,testing}.md`
- Next: P13 — Build package qualification tooling

## Unit-loop receipt — P12
- Commit: 1572d6c · Gate: `cd packages/agentic-workflow-schema && npm test` (exit 0, 419/419) + `node scripts/generate-verification-schemas.mjs --check` (exit 0) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P13 · Attempts: 1 · Review-checkpoint trigger recorded: accumulation fired (11 files / 241 changed lines since `e912594`). Layer unchanged (schema), but this phase retouched **three earlier phases' fixtures** (capacity timeout sizing) and added a public ceiling family, so the end review must confirm no assertion was weakened (AC8), that the projected conditional ceiling matches the runtime rule (AC10), and that `budget-exceeded`'s new emitter satisfies AC4/AC5 evidence. No sensitivity surface (no execution, no I/O). (P11 delivered `planBytes`/`receiptBytes`/`diagnostics` in `VERIFICATION_LIMITS`; the timeout fields are still missing)

## P13 — Build package qualification tooling
- **Status**: Done
- Done: the package now carries its own qualification tooling. Two new scripts (`scripts/bench-verification.mjs`, `scripts/check-verification-package.mjs`), five new registered commands (`check:verification-schemas`, `check:verification-package`, `bench:verification`, `test:verification-docs`, `gate:verification`), 13 new cases (`test/verification-gates.test.mjs` 10, `test/verification-docs.test.mjs` 3), and F70 resolved: `"types": ["node"]` and the `@types/node` devDependency are gone with `package-lock.json` regenerated (−18 lines). Observed P13 Done-when chain: `npm ci` → `bun install --frozen-lockfile` → schemas drift-free → p95 **20.01 ms** (ceiling 100 ms) → package content PASS (15 files, both projections). Full `npm run gate:verification` exits 0 with 432/432 tests.
- Remains: P14–P15. `test:verification-docs` is deliberately a harness with registration-level assertions only; P14 owns the content assertions (projections named in both references, every D14 limit/budget, executable examples, EN/ES semantic parity, AWL boundary) and the F68 example corrections.
- Gotchas: (1) **F70 was npm-only.** `bun.lock` never listed `@types/node`, so "regenerate the Bun lock" is a no-op; the sync is now asserted (`npm and Bun locks agree with the manifest dependency ranges`) instead of performed. (2) The package compiles **without** Node typings: target `ES2022` pulls `TextEncoder`/`Crypto` from the default libs, so the `"types"` override was pure cost. (3) The packer found its own bug on first run — it looked up `exports` keys as bare filenames while the manifest uses `./x.schema.json` — which is why the checks are asserted from the manifest *and* the tarball. (4) The benchmark takes no ceiling argument on purpose (ACCEPTANCE quality floor: do not raise a threshold to pass); it also refuses `--commands` above the D14 capacity, so a "passing" run can never be built on an invalid payload. (5) `check:verification-schemas` starts with `tsc` because the generator renders from `dist/` — P10's staleness trap, now encoded in the command and pinned by a test. (6) A 128-command benchmark plan must respect the stage budgets P12 added: the fixture sizes `timeoutMs` at `floor(fastStageTimeoutMs / commands)`.
- Files: `packages/agentic-workflow-schema/package.json`, `package-lock.json`, `tsconfig.json`, `scripts/bench-verification.mjs` (new), `scripts/check-verification-package.mjs` (new), `test/verification-gates.test.mjs` (new), `test/verification-docs.test.mjs` (new), `docs/features/26-staged-verification-contracts/{TASKS,progress,decisions,testing}.md`
- Next: P14 — Document the verification contract

## Unit-loop receipt — P13
- Commit: 4138b11 · Gate: `cd packages/agentic-workflow-schema && npm ci && bun install --frozen-lockfile && npm run check:verification-schemas && npm run bench:verification -- --commands 128 && npm run check:verification-package` (exit 0, p95 20.01 ms ≤ 100 ms) + `npm run gate:verification` (exit 0, 432/432) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P14 · Attempts: 1 · Review-checkpoint trigger recorded: layer **changed** (schema → config/infra), 8 files / ~430 new lines since `1572d6c`, and this phase edited the dependency manifest + lock + tsconfig (F70). The end review must re-run AC7 (both frozen installs, `check-skill-context.mjs`, `npx skills add . --list`), confirm the benchmark is not self-referential (measured work equals the gate's real cycle), and confirm P13 did not pre-empt P14's red-first doc assertions. (P12 delivered every `VERIFICATION_LIMITS` field AC10 names, so P13's benchmark and P15's requalification need no further limit work)

## P14 — Document the verification contract
- **Status**: Done
- Done: both references now state AC6's six claims in their own language — the two-stage model, the delivery-gate rule, the no-execution boundary, the **two public authoritative entries** (and the absence of a standalone receipt validator), the **generated non-authoritative structural-projection** status of both schema files with their generator and drift command, and all 15 `VERIFICATION_LIMITS` values with the aggregate stage budgets and the 100 ms p95 gate. The D16 diagnostic contract is documented with its 16-code table, and the consumer example was rebuilt: two entries only, `diagnostics` instead of `errors`, explicit 64-hex candidate/acceptance digests, timeout-coherent timestamps (12 s / 108 s against 30 000 / 120 000 ms) and an inline coherence check. `test/verification-docs.test.mjs` grew from 3 harness cases to 13, and the example is now **compiled against the published types and executed** by the suite — it prints `Delivery verified`.
- Remains: P15.
- Gotchas: (1) 12 of the 13 new doc assertions were red first; the three that were already green are the P13 harness facts and the six freshness codes, which the old references did carry. (2) The example must not import `node:assert` — F70 removed `@types/node`, so a Node-specifier import makes the documented snippet fail its own typecheck; the coherence check now throws a plain `Error`. (3) Markdown line wrapping defeats naive prose regexes (`no` + newline + `autoritativas`): the AC6 assertions use `\s+`/`[\s\S]{0,40}` windows instead of single spaces, so the check reads the claim, not the formatting. (4) Only the **feature-26** example is compiled and run; the older snippets in both references use undeclared placeholders (`snapshot`, `headSha`, `invokeAgent`) and remain the routed review proposal already recorded in `decisions.md`. (5) TypeScript 6 refuses command-line files when a parent `tsconfig.json` is discoverable, so the harness writes a one-file project next to the extracted example. (6) Both `### Validar o usar otro lenguaje` / "Validate or use another language" sections also had to name the two verification entries, or the docs would have contradicted the new authority section.
- Files: `packages/agentic-workflow-schema/README.md`, `README.es.md`, `test/verification-docs.test.mjs`, `docs/features/26-staged-verification-contracts/{TASKS,progress,decisions,testing}.md`
- Next: P15 — Requalify the delivery candidate

## Unit-loop receipt — P14
- Commit: 5934702 · Gate: `cd packages/agentic-workflow-schema && npm run test:verification-docs` (exit 0, 13/13) + `npm run gate:verification` (exit 0: 442/442 tests, projections drift-free, package content PASS, p95 20.80 ms ≤ 100 ms) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P15 · Attempts: 1 · Review-checkpoint trigger recorded: **layer changed** (config/infra → docs). AC6 is the criterion this phase serves and it is only partly executable — the independent review must read both references (EN and ES) for semantic parity and honesty of claims, and confirm the example's runtime proof is the real gate chain, not a rigged fixture. (`npm run test:verification-docs` is live and drives `test/verification-docs.test.mjs`; the content assertions P14 must write are listed in that file's header)

## P15 — Requalify the delivery candidate
- **Status**: Done
- Done: the ten close-out tasks ran against the pushed candidate. Frozen commands: `npm ci` ✓, `bun install --frozen-lockfile` ✓ ("no changes" — locks agree with the manifest), `npm run gate:verification` ✓ (442/442, projections drift-free, package content PASS, docs 13/13, p95 18.33 ms), `node scripts/check-skill-context.mjs` ✓ (`PASS context budgets: 35 skills`), `npx skills add . --list` ✓ exit 0, and AC7's literal chained command end-to-end ✓ exit 0. The **AC1–AC10 execution receipt** above records each frozen validator with what it printed. The fix-now ledger is finalized: F63–F77 flipped `folded: yes` naming the phase and commit that folded each one, and F62b was **removed** from the ledger and preserved as a user-routed review proposal with its trigger in `decisions.md` (F75). Roadmap row 26 already reads `done · #145` and names the approved replan, so delivery state is synchronized; `git diff main` on the five prior schema files is empty (AC8).
- Remains: the independent review — this phase does **not** claim it. The quality floor holds that passing declared checks is necessary, not sufficient.
- Gotchas: (1) The candidate named in the receipt is the last commit that touches anything the validators read; the close-out commit is planning state, so the chain is re-run at the pushed HEAD and cited in the PR body rather than quietly shifting the target. (2) Every `folded: yes` flip names its commit — a flip without evidence is the exact failure mode F1–F77 exist to catch. (3) PR #145's title still read `(P1-P5)` after a nine-phase replan: stale PR metadata is a finding (F70/F74), not cosmetics.
- Files: `docs/features/26-staged-verification-contracts/{TASKS,progress,decisions,review-findings}.md`; PR #145 title and body through `gh`
- Next: none for this unit — `/loop-review-fold 26-staged-verification-contracts` for the independent review/fold route (manual path: `/review-change`, then `/fold-findings` and re-review)

## Unit-loop receipt — P15 (close-out)

- Attempt: 1 · Result: PASS
- Preflight: current · manifest v2 · blob `2e8058860b2c805cc30507053f15f91e2f273249` · receipt v2 · ledger current (F63–F77 folded with commit evidence, F62b relocated) · NRS frozen
- Baseline: HEAD `5934702` remote-current (branch == PR head), fresh tree, 442/442
- Scope: planning state only — `docs/features/26-staged-verification-contracts/{TASKS,progress,decisions,review-findings}.md` (no source, schema, test or README changes)
- Task count: 10/10
- Commands run (frozen): `npm ci` ✓ · `bun install --frozen-lockfile` ✓ · `npm run gate:verification` ✓ · `node scripts/check-skill-context.mjs` ✓ · `npx skills add . --list` ✓ · AC7's literal chain ✓ exit 0
- Evidence: AC1–AC10 execution receipt above; AC8 diff empty; observed p95 18.33 ms vs the frozen 100 ms ceiling
- Commit: pending · Gate: `cd packages/agentic-workflow-schema && npm run gate:verification`
- Accepted: AC1–AC10 validators re-executed literally, fix-now ledger finalized and preserved, roadmap/progress state synchronized
- Deferred: none
- Issues created: none (F62b stays a review proposal — no issue; D15 AWL boundary stays a proposal; the route does not manufacture work items)
- Review: not claimed here — the pushed HEAD and this receipt go to a fresh `/review-change` through `/loop-review-fold`
- Residual risks: (1) the receipt names `5934702`, the last commit touching validator-read content, so the close-out commit is proven only by re-running the chain at the pushed HEAD (done, cited in the PR body); (2) independent review, the manual documentation read and maintainer merge remain outside execution; (3) routed proposals stay open (README older snippets, AWL node-22-only, `canonicalJSONValue` BigInt, consumer matrix)
- → Next: /loop-review-fold 26-staged-verification-contracts — select the persisted review/fold route, then triage or replan unresolved findings
- Manual path: /review-change → /fold-findings → re-review

## Post-review debt sweep — user-directed immediate fix (2026-08-27)

- Trigger: the user routed the batched review proposals to `/triage-issue` with an
  explicit prioritize-and-fix instruction; nothing here was postponed silently.
- Resolved at `9ef8c5d` (`fix(schema): refuse unrepresentable canonical leaves and
  hoist per-call hot-path work`): F80, F82, F83 plus the two report-batched
  proposals from the adversarial pass (unconsumed `ReadonlySet` parameter arm;
  per-call `RegExp` compilation on the validation walk).
- Evidence at this HEAD: `npm test` 451/451 pass (7 new red-first tests),
  `check:verification-schemas` drift-free (2 files), `test:verification-docs`
  15/15, `bench:verification --commands 128` p95 14.87 ms ≤ 100 ms,
  `check:verification-package` PASS, `check-skill-context.mjs` PASS (35 skills),
  AC8 five protected schema files still zero-diff vs `main`, AC5 plan vector still
  locks `43ba52cb34490733...` (no canonical-form drift).
- Not resolved, deliberately: F81 (`ajv` caret range) stays watched-debt — dev-only,
  lockfile-pinned, zero production dependencies, trigger unmet. The Finding-C skip
  attribution question is `disputed`, not debt: SPEC D3 mandates "non-passed AND
  `stopOnFailure`" verbatim and P9/F65 pins the degraded-but-valid incompleteness
  case as a do-not-tighten boundary.
- Consequence: the `review-change:pass` marker bound to `36fa8cdc` no longer covers
  this HEAD; `/audit-pr` needs a fresh review at ≥ `9ef8c5d`.
- → Next: /loop-review-fold 26-staged-verification-contracts — re-review the moved
  HEAD before the merge gate

## P16 — 2026-08-27
- Done: ledger provenance repaired and published docs hygiene corrected — F98/F101–F105 now name their fold commits (e7a7f49 / a76ad88 / fdd2a98, each verified to touch the surface its row describes), F107/F109/F110 flipped `folded: yes`, and the `bench:verification` proof sentence in both READMEs carries the source-checkout-only boundary pinned by a new red-first docs case; both CHANGELOGs re-count the suite at 23.
- Remains: P17–P21 (F97 hostile-getter snapshot, F99 preflight refusal work, F100 legacy canonicalizer compatibility, F106 ledger fold-provenance recovery, P21 requalify + close-out).
- Gotchas: (1) A `folded: yes` flip cannot name its own commit — F107/F110 say "folded in P16" and **P17 must bind the real P16 short SHA** in its reconciliation note (UNIT_LOOP's pending→SHA rule); leaving that unbound re-creates F106/F107 as a finding. (2) The F110 case asserts a ±6-line window around *every* mention of all five source-checkout-only commands, so any future prose mention of `gate:verification`/`check:*` in either README must carry the qualifier too — do not narrow the case to `bench:verification`. (3) Adding any docs case makes the F90 case red until both CHANGELOG lines are re-counted in the same commit. (4) Dependency receipt v1's fingerprint is not reproducible from its own recorded inputs (see receipt v2): always take the full gate pass here, the fast path cannot be trusted for this unit.
- Files: `packages/agentic-workflow-schema/{README.md,README.es.md,test/verification-docs.test.mjs}`, `CHANGELOG.md`, `CHANGELOG.es.md`, `docs/features/26-staged-verification-contracts/{TASKS,progress,review-findings}.md`
- Next: P17 — Snapshot verification input at validation entry

## Unit-loop receipt — P16
- Commit: 147090e · Gate: `cd packages/agentic-workflow-schema && npm run gate:verification` (exit 0: 470/470 tests, projections drift-free, package content PASS, docs 23/23, p95 17.33 ms ≤ 100 ms) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P17 · Attempts: 1 · Review-checkpoint trigger recorded: **layer unchanged** (docs → domain at P17, so the layer-boundary trigger fires on *opening* P17 — the docs layer closes here); accumulation since the last reviewed marker is small (5 files); no sensitivity surface (no auth/secrets/CI/destructive migration). Whole-unit mode records it and continues; the mandatory end review covers the frozen final candidate.

## P17 — 2026-08-27
- Done: both public entries — and the canonical/digest helpers behind them — now capture the submitted document **once** into a frozen own-property snapshot (`captureVerificationInput` in `src/verification-contract.ts`), and the byte budget, the structural walk, every cross-rule and the DTO are built from that snapshot only; the 14-case hostile-getter suite `test/verification-hostile-input.test.mjs` is green (it was red on the exact F97 breaches: blessed `timeoutMs: 600001`, blessed ids `["lint","lint"]`, blessed stages `["fast","fast"]` against a summed `full` row).
- Remains: P18–P21 (F99 preflight refusal work, F100 legacy canonicalizer compatibility, F106 ledger provenance, P21 requalify + close-out).
- Gotchas: (1) **The capture must copy with `Object.defineProperty`, not assignment.** `JSON.parse` yields an own `__proto__` data key that plain assignment routes to the inherited setter, silently dropping the very key P7's `unknown-field` refusal exists to catch — the gate caught this on the first run. (2) The capture deliberately refuses nothing: a non-plain object is copied **by reference** and an unsupported leaf (function/symbol/bigint/`undefined`/non-finite) is copied **as submitted**, so the structural walk still owns every refusal and AC1's prototype-pollution tests keep their codes. (3) Two disclosed tightenings: a throwing accessor now aborts **before** structural work (one `invalid-type` row instead of possibly two), and a non-enumerable own key is no longer observable (outside the documented JSON input domain). (4) A test that arms `/commands` **and** `/commands/0/*` must resolve holders against the pristine document first, or the harness itself becomes the noisy reader. (5) P16's deferred SHA is now bound: F107/F110 read `P16 = 147090e`.
- Files: `packages/agentic-workflow-schema/src/verification-contract.ts`, `packages/agentic-workflow-schema/src/index.ts`, `packages/agentic-workflow-schema/test/verification-hostile-input.test.mjs`, `docs/features/26-staged-verification-contracts/{TASKS,progress,decisions,testing,known-issues,review-findings}.md`
- Next: P18 — Bound verification preflight refusal work

## Unit-loop receipt — P17
- Commit: c42104c (bound by the P18 fold) · Gate: `cd packages/agentic-workflow-schema && npm run gate:verification` (exit 0: 484/484 tests, projections drift-free, package content PASS, docs 23/23, p95 20.42 ms ≤ 100 ms) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P18 · Attempts: 2 · Review-checkpoint trigger recorded: **sensitivity-adjacent + accumulation** — the change is a security fix on the public validation surface (150 source lines across 2 files, 484/484 green); layer unchanged from P16's docs → domain (the layer-boundary trigger fired on opening P17 and is recorded here). Whole-unit mode records it and continues; the mandatory end review must read the capture path especially hard: it is the single place where a hostile document stops being hostile.

## P18 — 2026-08-27
- Done: refusal work on both public entries is bounded by the declared D14 limits instead of by the submitted payload. `captureVerificationInput` now takes the byte budget and accumulates the document's canonical size while it copies, aborting on the first unit past the budget, so the byte measure, the structural walk and the DTO all run on at most ~the budget's worth of data and the full `canonicalJSONValue` serialization is never reached for an illegal document. The exact UTF-8 measure stays as the fallback the capture cannot replace — `measureExact` is false for non-ASCII or unmeasurable leaves — so a multibyte document that crosses the budget in bytes but not in UTF-16 units is still refused by exactly one root `limit-exceeded` row. Measured (min of 3, `test/verification-preflight.test.mjs`, red-first against `c42104c`): 200k-command plan 2,590 → 16.9 ms, 10k plan 114 → 14.8 ms, 200k-row receipt 2,134 → 25.5 ms, 200k-arg plan 150 → 12.5 ms; AC10 re-cited at p95 30.70 ms ≤ 100 ms. F99 and F111 folded; P17 = `c42104c` bound.
- Remains: P19–P21 (F100 legacy canonicalizer compatibility, F106 ledger fold-provenance recovery, P21 requalify + close-out).
- Gotchas: (1) The UTF-16 unit count is a *sound* over-budget test only because a UTF-8 encoding is never shorter than its UTF-16 length — the two measures are not interchangeable, and dropping the exact byte pass for `measureExact: false` would silently accept over-budget multibyte documents. (2) Charging is per leaf: an unsupported leaf (non-finite number, function/symbol/bigint, non-plain object) clears `applicable` and the capture stops measuring, so the structural walk still owns that refusal exactly as in F92/F97 parity and the caller falls back to the exact measure. (3) An accessor below the abort point is never read, so the budget row outranks the `invalid-type` row that accessor would have earned — that is the fold, and the "refusal stops at the budget" case pins it. (4) `canonicalizeWithinContract` now reaches the budget refusal *before* `projectStructure`, so an out-of-contract document whose normalized projection would have fitted is refused where it used to serialize; the F91 precondition ("inputs must first pass their validators") already excludes such an input and no pinned case depends on the old order. (5) A phase cannot name its own SHA: F99/F111 say "folded in P18" and P19 must bind the real P18 short SHA (the F106/F107 rule).
- Files: `packages/agentic-workflow-schema/src/verification-contract.ts`, `packages/agentic-workflow-schema/src/index.ts`, `packages/agentic-workflow-schema/test/verification-preflight.test.mjs`, `docs/features/26-staged-verification-contracts/{TASKS,progress,review-findings}.md`
- Next: P19 — Restore legacy canonicalizer compatibility

## Unit-loop receipt — P18
- Commit: pending (bound by the P19 fold) · Gate: `cd packages/agentic-workflow-schema && npm run gate:verification` (exit 0: 492/492 tests, projections drift-free, package content PASS, docs 23/23, p95 30.70 ms ≤ 100 ms) · Acceptance blob: 2e8058860b2c805cc30507053f15f91e2f273249
- Next: P19 · Attempts: 3 · Review-checkpoint trigger recorded: **sensitivity-adjacent + accumulation** — the change touches the hostile-input boundary of the public validation surface (2 source files, the capture that decides what a digest commits to); layer unchanged (domain). Whole-unit mode records it and continues; the mandatory end review must read the byte-accounting abort path especially hard: an unsound abort would refuse a legal document, and a missing fallback would accept an illegal one.
