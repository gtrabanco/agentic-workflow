# PLAN — 25-content-bound-review-receipts

Phases only (`P1…P5`). Detail lives in `SPEC.md` (Design) and `TASKS.md`.
Last implementation phase hardens; close-out tasks end P5.

## P1 — Deliver the CandidateSnapshot v1 contract
Layer: schema · red-first suite, types, strict validator (structural /
path-byte / id-size rules), `candidate-snapshot.schema.json` + parity,
exports.

## P2 — Deliver the ReviewReceipt v1 contract
Layer: schema · red-first suite, kinds/severities/finding shapes, receipt
types, strict validator, `review-receipt.schema.json` + parity, exports,
coexistence check with P1 surface.

## P3 — Implement the canonical content-binding core
Layer: schema · `canonicalize` (D4), `digestCandidateSnapshot`,
`computeAcceptanceFingerprint` (D2), freshness predicate (D1 codes), published
`CANONICAL_VECTORS` + agreement tests, bilingual README sections, release
`3.3.0`.

## P4 — Cover the edge-condition matrix
Layer: hardening · >32 paths, >4 MiB, binary, rename/copy/type-changed, base
advancement, candidate mutation, acceptance/policy mutation, full revert,
symlink/submodule modes, empty-diff rule.

## P5 — Hardening & PR
Layer: close-out · full gate re-run, pending-docs check, roadmap flip to
`done`, push, open PR with `Closes #138`, link PR in roadmap, commit + push.
