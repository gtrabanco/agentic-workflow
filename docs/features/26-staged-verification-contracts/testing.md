# testing — 26-staged-verification-contracts

## Layers

- **Package unit tests** (`node --test`, `test/*.test.mjs`) — the only layer:
  plan validator, receipt validators (structural + plan-bound), verdict
  derivation, canonical digest core, freshness predicate, scenario matrix.
  The contracts are pure; execution is the consumer's concern (out of scope).
- Red-first rule (project working rules): each contract's suite file lands
  before its validator completes and fails red until then.

## Commands

- `cd packages/agentic-workflow-schema && npm test` — compiles strict TS
  (`tsc` + `tsconfig.test.json`) then runs the full suite. Exit 0 required.
- `npm pack --dry-run` — artifact set must list both new schema files.

## Fixtures

- Canonical vectors + expected digests: exported
  `VERIFICATION_CANONICAL_VECTORS` + `test/fixtures/`.
- Fixtures are constructed deterministically in-test; no multi-MiB blobs are
  needed (evidence references carry digests, not content).
- Regression: every pre-existing suite (machine-contract, capabilities,
  release-contract, index, workflow-decision*, candidate-snapshot,
  review-receipt, canonical-core, edge-matrix) stays green.

read-verified: schema↔validator parity is asserted on a shared fixture set in
both P1 and P2 parity tests.
