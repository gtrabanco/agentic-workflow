# testing — 25-content-bound-review-receipts

## Layers

- **Package unit tests** (`node --test`, `test/*.test.mjs`) — the only layer:
  validators, canonical core, freshness predicate, edge matrix. The contracts
  are pure; integration is the consumer's concern (out of scope).
- Red-first rule (project working rules): each contract's suite file lands
  before its validator completes and fails red until then.

## Commands

- `cd packages/agentic-workflow-schema && npm test` — compiles strict TS
  (`tsc` + `tsconfig.test.json`) then runs the full suite. Exit 0 required.
- `npm pack --dry-run` — artifact set must list both new schema files.

## Fixtures

- Canonical vectors + expected digests: exported `CANONICAL_VECTORS` +
  `test/fixtures/`.
- Oversized (>4 MiB) and path-count (>32) fixtures are generated
  deterministically at test time — no multi-MiB blobs committed.
- Regression: every pre-existing suite (machine-contract, capabilities,
  release-contract, index, workflow-decision*) stays green.

read-verified: schema↔validator parity is asserted on a shared fixture set in
both P1 and P2 parity tests.
