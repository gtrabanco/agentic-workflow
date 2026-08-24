# architecture-notes — 26-staged-verification-contracts

## Layers

- All additions live in `packages/agentic-workflow-schema/src/index.ts`
  (single-file package precedent) + two NEW schema JSON files at package root.
- Pure data contracts + pure functions: no I/O, no subprocess, no shell, no
  Git, no forge, no provider.
- No new layer/port/adapter; the caller owns command execution (explicitly
  out of scope).

## Schema impact

- `verification-plan.schema.json`, `verification-receipt.schema.json`: new,
  `additionalProperties: false` everywhere, mirrored 1:1 with the TS types
  (AD-007). The JSON Schemas mirror the structural validators; plan-bound
  rules (id existence, order, stage subset, fail-fast attribution, verdict
  consistency) are TS-only because they require the plan input.
- The five existing schema files untouched; export surface additive only.

## Binding impact

- Receipts bind content three ways: `planDigest` (canonical digest of the
  declared plan), `candidateSnapshotDigest` + `acceptanceFingerprint`
  (feature 25 / #138 values), plus the stage/verdict record. The freshness
  predicate compares all three plus the incompleteness dimensions (D1).
- Feature 25's receipts are strengthened on the verification side without
  any contract change there; Envelope v2's high-level verification state is
  untouched (compatibility requirement).

## Preflight

- Stage 1: NRS consumed (frozen ledger) · arch: deferred.
- Stage 2 (final, after the engineering plan was cut): NRS consumed ·
  invariant classification: `n/a` — no project invariants declared at HEAD
  (`docs/architecture/ARCHITECTURAL_INVARIANTS.md` absent; the `template/`
  copy is a scaffold for target projects, not a declaration for this repo).
- AD-002 bilingual same-change · AD-004 one PR vs main · AD-007 strict
  contracts — all preserved.
