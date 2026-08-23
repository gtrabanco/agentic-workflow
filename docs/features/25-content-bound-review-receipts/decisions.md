# decisions — 25-content-bound-review-receipts

## Decisions

- **D1 — Freshness reason codes (closed set):** `stale-base-tree |
  stale-candidate-tree | stale-manifest | stale-acceptance-fingerprint |
  stale-review-policy`. Maps 1:1 to the issue's stale dimensions. Locked by
  tests.
- **D2 — Acceptance fingerprint inputs:** ordered `{id, blobSha256}` entries;
  lowercase SHA-256 over their canonical serialization (mirrors this repo's
  blob-bound ACCEPTANCE practice).
- **D3 — Finding severity vocabulary:** `info|low|medium|high|critical`
  (matches feature 17's ledger usage; issue left values open).
- **D4 — Canonical form:** UTF-8 JSON, declaration-order keys, nulls
  preserved, byte-ordered `changedPaths`, findings byte-ordered by id,
  lowercase-hex SHA-256 digests. Locked by published vectors.
- **D5 — Identity opacity:** receipt id / reviewer / sessionId /
  policyVersion are opaque non-empty strings; no provider-specific names.
- **D6 — Sizing:** M, five single-layer phases, no split trigger fired.
- **D7 — Traceability:** PR carries `Closes #138`.

## Open questions

none — all residual mechanical gaps are resolved above; changing any decision
later is a reviewed, versioned package change (v1 contracts are frozen).
