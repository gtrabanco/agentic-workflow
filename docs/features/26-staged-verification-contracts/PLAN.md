# PLAN — 26-staged-verification-contracts

Phases only (`P1…P21`). Detail lives in `SPEC.md` (Design) and `TASKS.md`.
P1–P6 are historical completed phases; the user-approved 2026-08-26 replan added
P7–P15 (executed). The user-ordered 2026-08-27 corrective replan adds P16–P21;
P21 is the final close-out after the review-mandated corrections. Execute
P16→P20 back-to-back, then P21.

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

## P16 — Correct published docs hygiene

Layer: docs · ledger F107/F109/F110 fold here: six fold-commit annotations, honest
roadmap state (`in-progress · [#145]`, re-flipped by P21) and the bilingual
source-checkout qualifier for the bench sentence, docs-suite pinned.

## P17 — Snapshot verification input at validation entry

Layer: domain · F97 root cause: single frozen own-property capture at both public
entries; validation and DTO construction read only the snapshot. Red-first
hostile-getter suite (flip-at-every-read across all plan/receipt fields),
diagnostic redaction parity, p95 benchmark parity.

## P18 — Bound verification preflight refusal work

Layer: domain · F99 root cause: raw cardinality refusal before capture, then an
early-exit bounded serializer for the byte budget; entry sequence is raw
cardinality → capture → bounded measure → full walk. 200k-command refusal drops
from ~2.2 s to the ≤50 ms bound.

## P19 — Restore legacy canonicalizer compatibility

Layer: domain · F100: golden 3.3.0 vectors captured from the merge base; the
F80 total-leaf guard is scoped to the feature-26 verification canonicalizers and
the legacy `canonicalize*`/`digest*` exports regain byte-identical 3.3.0 output,
making the ship record's "additive release" claim true without weakening any
verification-surface refusal.

## P20 — Recover ledger fold provenance

Layer: docs · F106: scripted `git log -S` recovery over the 62 token-less rows;
every provable fold gets its commit annotation, unprovable rows re-open honestly.

## P21 — Requalify the corrected candidate

Layer: close-out · full gate + frozen-manifest AC1–AC10 re-verification, ONE
`--adversarial 3` review over the corrected candidate, bounded fold pass for its
fix-now rows, PR body refresh at the terminal head (F108), loop to PASS, roadmap
back to `done`.
