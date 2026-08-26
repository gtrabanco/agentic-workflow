# PLAN — 26-staged-verification-contracts

Phases only (`P1…P15`). Detail lives in `SPEC.md` (Design) and `TASKS.md`.
P1–P6 are historical completed phases. The user-approved 2026-08-26 replan
adds P7–P15; P15 is the final close-out after all implementation layers.

## P1 — Deliver the VerificationPlan v1 contract
Layer: schema · historical plan contract, validator, schema and exports.

## P2 — Deliver the VerificationReceipt v1 contract
Layer: schema · historical receipt contract, validator, schema and exports.

## P3 — Implement the staged verification semantic core
Layer: schema · historical binding, verdict, canonical digest, freshness,
vectors, README and package-release work.

## P4 — Cover the mandated verification scenario matrix
Layer: hardening · historical fast/full, failure, skip, stale, path and duplicate
scenarios.

## P5 — Hardening & PR
Layer: close-out · historical full-gate run, roadmap flip, push, PR #145 and
roadmap link.

## P6 — Staged-verification contract correction
Layer: schema · historical post-review corrections for F31–F62.

## P7 — Unify validation authority
Layer: schema · one canonical internal contract definition, exactly two public
validation entries, normalized own-property DTOs and deterministic generated
structural projections.

## P8 — Repair freshness classification
Layer: schema · red-first stale/incomplete matrices, disjoint precedence and
reachable stable freshness outcomes.

## P9 — Repair verification semantics
Layer: schema · complete fail-fast enforcement, negative stage coverage,
readonly vectors and authoritative determinism evidence.

## P10 — Bound verification shapes
Layer: schema · command/result/argument cardinalities and identifier/command
string limits projected wherever Draft-07 can express them.

## P11 — Bound verification payloads
Layer: schema · canonical byte budgets, existing skip/evidence bounds and one
closed, bounded, redacted diagnostic result contract.

## P12 — Bound verification time
Layer: schema · per-command fast/full timeout ceilings and aggregate fast/full
stage budgets, with projection/runtime boundaries made explicit.

## P13 — Build package qualification tooling
Layer: config/infra · synchronized npm/Bun dependency metadata plus deterministic
schema, docs, package-content, benchmark and aggregate gate scripts.

## P14 — Document the verification contract
Layer: docs · synchronized EN/ES authority and limits reference, content-bound
consumer examples, structural-projection warning and deferred AWL adoption note.

## P15 — Requalify the delivery candidate
Layer: close-out · frozen installs, aggregate package/repository gates,
replacement-acceptance evidence, ledger/progress close-out, PR-body refresh and
publication of the exact candidate for fresh independent review.
