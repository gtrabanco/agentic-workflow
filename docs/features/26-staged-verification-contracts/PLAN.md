# PLAN — 26-staged-verification-contracts

Phases only (`P1…P6`). Detail lives in `SPEC.md` (Design) and `TASKS.md`.
Last implementation phase hardens; close-out tasks end P6.

## P1 — Deliver the VerificationPlan v1 contract
Layer: schema · red-first suite, types + constants, strict validator
(structural / executable-args / working-directory / timeout rules),
`verification-plan.schema.json` + parity, exports.

## P2 — Deliver the VerificationReceipt v1 contract
Layer: schema · red-first suite, status/verdict/stage vocabularies,
`EvidenceReferenceV1` + result shapes, strict validator (digests,
timestamps, exit/signal matrix, evidence bounds, skip rules),
`verification-receipt.schema.json` + parity, exports, coexistence check
with P1 surface.

## P3 — Implement the staged verification semantic core
Layer: schema · `validateVerificationReceiptAgainstPlan` (binding +
stage-coverage + fail-fast attribution + verdict consistency),
`deriveVerificationVerdict` (D2 precedence), canonical digest surface ×2
contracts, freshness predicate with D1 codes, published
`VERIFICATION_CANONICAL_VECTORS` + agreement tests, bilingual README
sections, release `3.4.0`.

## P4 — Cover the mandated verification scenario matrix
Layer: hardening · fast success/fail-fast, full success/fail-fast,
timeout, infrastructure error, skipped with/without reason, missing
results, full coverage gap, vacuous-fast pin, stale candidate/acceptance/
plan, path traversal, duplicate ids — end-to-end through validate →
canonicalize → digest → compare.

## P5 — Hardening & PR
Layer: close-out · full gate re-run, pending-docs check, roadmap flip to
`done`, push, open PR with `Closes #139`, link PR in roadmap, commit + push.

## P6 — Staged-verification contract correction
Layer: schema · post-review replan-in-unit (2026-08-24 amendment): distinct
reachable freshness outcomes (F31), independent canonical vectors (F32),
pre-validate-then-hash + residual no-throw order (F33/F40), frozen exports
(F36), compile-safe EN/ES README examples (F35), regenerated lockfile (F37),
fresh progress/ledger (F38/F39) — execution ledger in `TASKS.md`/`progress.md`.
