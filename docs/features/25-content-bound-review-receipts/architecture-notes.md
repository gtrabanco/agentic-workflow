# architecture-notes — 25-content-bound-review-receipts

## Layers

- All additions live in `packages/agentic-workflow-schema/src/index.ts`
  (single-file package precedent) + two NEW schema JSON files at package root.
- Pure data contracts + pure functions: no I/O, no Git, no forge, no provider.
- No new layer/port/adapter; producers (consumers of the package) own capture.

## Schema impact

- `candidate-snapshot.schema.json`, `review-receipt.schema.json`: new,
  `additionalProperties: false` everywhere, mirrored 1:1 with TS types
  (AD-007).
- Existing three schema files untouched; export surface additive only.

## Binding impact

- Receipts bind content via `candidateSnapshotDigest` (canonical snapshot
  digest) + the five compared dimensions (D1); acceptance boundary binds via
  ordered `{id, blobSha256}` fingerprint inputs (D2).
- Feature 24's D5 attestation chain is strengthened without contract change.

## Preflight

- NRS consumed (frozen ledger); invariant classification n/a — no project
  invariants declared at HEAD.
- AD-002 bilingual same-change · AD-004 one PR vs main · AD-007 strict
  contracts — all preserved.
