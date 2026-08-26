# testing — 26-staged-verification-contracts

## Layers

- **Authoritative package validation** (`node --test`) — exactly two public
  runtime entries: plan validation and plan-bound receipt validation.
- **Generated structural projections** — deterministic generation/check plus
  Draft-07 fixtures for every expressible structural rule; projections never
  claim semantic PASS.
- **Semantic core** — verdict, fail-fast sequencing, canonical digests,
  freshness reachability and current-content binding.
- **Boundary matrix** — every D14 limit at the boundary and one unit beyond,
  payload-byte budgets, inherited properties and diagnostic truncation.
- **Performance** — warm 128-command plan+receipt validation+digest p95 ≤100 ms.
- **Package qualification** — frozen npm/Bun installs, projection drift,
  package content, docs parity and the aggregate verification gate.
- Red-first remains mandatory for the P7–P12 schema phases; tests fail before
  implementation.

## Commands

- `cd packages/agentic-workflow-schema && npm ci`
- `cd packages/agentic-workflow-schema && bun install --frozen-lockfile`
- `cd packages/agentic-workflow-schema && npm run gate:verification`
- `cd packages/agentic-workflow-schema && npm test`
- `cd packages/agentic-workflow-schema && npm run test:verification-docs`
- `cd packages/agentic-workflow-schema && npm run check:verification-schemas`
- `cd packages/agentic-workflow-schema && npm run check:verification-package`
- `cd packages/agentic-workflow-schema && npm run bench:verification -- --commands 128`
- `node scripts/check-skill-context.mjs`
- `npx skills add . --list`

## Fixtures

- Canonical vectors + expected digests: `VERIFICATION_CANONICAL_VECTORS` and
  deterministic test fixtures validated through the authoritative entries.
- Projection fixtures cover every Draft-07-expressible accepted/rejected shape;
  generator drift is a separate gate, not an independent semantic validator.
- Boundary fixtures cover 128/129 commands/results, 64/65 args, every string/
  byte/timeout threshold, aggregate stage budgets and 50/51 diagnostics.
- Diagnostic fixtures prove code vocabulary, RFC 6901 paths, the truncation
  flag and that no submitted value is echoed.
- Docs fixtures extract every README example, compile it and assert EN/ES
  semantic parity through `test:verification-docs`.
- Prototype/inherited-field fixtures prove only normalized own-property data is
  accepted and digest-bound.
- Regression: every pre-existing suite stays green; the five prior schema files
  remain diff-clean.

read-verified: README EN/ES authority, limits and examples are semantically
synchronized; final independent review evaluates ACCEPTANCE v2 exact bytes.
