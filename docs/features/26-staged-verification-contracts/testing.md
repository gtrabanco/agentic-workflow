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
  deterministic test fixtures validated through the authoritative entries. The
  payloads live once in `test/fixtures/verification-vectors.mjs`; expected
  digests are computed independently through `node:crypto`, and
  `test/fixtures/verification-vector-readonly.ts` proves the vector entries are
  readonly in the public type through the `tsc` pass of `npm test`.
- Fail-fast semantics: `test/verification-semantics.test.mjs` pins the trigger
  definition (earliest non-passed row of a `stopOnFailure` command), the
  sequencing rejection of any later row that is not `skipped`, the
  attribution-to-trigger rule, and the two cases that must stay representable
  (`skipReason: null` after the trigger; a later command with no row).
- Projection fixtures cover every Draft-07-expressible accepted/rejected shape;
  generator drift is a separate gate, not an independent semantic validator.
- Freshness reachability matrix: `test/verification-freshness.test.mjs` — every
  D1 code from a one-dimension mutation of the fresh baseline, the fixed
  stale/incomplete precedence, stale-masks-incomplete disjointness, and the
  `{fresh: true}` outcome including the D9 vacuous-fast case.
- Boundary fixtures cover 128/129 commands/results, 64/65 args, every string/
  byte/timeout threshold, aggregate stage budgets and 50/51 diagnostics — the
  shape half is `test/verification-bounds.test.mjs`, which also asserts every
  Draft-07-expressible bound is present in the regenerated projections and that
  the public `VERIFICATION_LIMITS` object is the single source of the numbers.
- Time-bound fixtures: `test/verification-timeouts.test.mjs` — the 10/15 min and
  60/120 min D14 pairs (exact ceiling accepted, 1 ms over refused), stage-scoped
  ceilings, per-stage isolation, first-crossing `budget-exceeded` pointers,
  propagation through the receipt authority, and Ajv/validator parity on the
  projected conditional ceiling. Capacity fixtures size their `timeoutMs` for the
  128-command fast-stage budget (`floor(fastStageTimeoutMs / commands)`), which is
  a fixture-satisfiability requirement of AC10, not a loosened assertion.
- Payload/diagnostic fixtures: `test/verification-payload.test.mjs` — canonical
  byte budgets (exact-planBytes accepted, one over refused by the budget alone and
  outranking the shape ceilings; maximum-capacity receipt proven inside its
  budget), the 50-row diagnostic ceiling with `truncated`, RFC 6901 paths,
  value redaction, the skip-reason/evidence-reference boundary pairs, and an
  emitter for every published code except `budget-exceeded` (P12). Shared
  assertions live in `test/fixtures/verification-diagnostics.mjs`, which every
  feature-26 suite now uses instead of matching message prose.
- Qualification tooling: `test/verification-gates.test.mjs` pins the AC7/AC9/AC10
  command registration, the rebuild-before-check ordering, the 100 ms ceiling with no
  CLI override, the 128-command default, F70's absence of Node typings, and npm/Bun
  lock agreement with the manifest.
- Documentation fixtures: `test/verification-docs.test.mjs` (23 cases, driven by
  `npm run test:verification-docs`, and included in `npm test`) asserts AC6's six
  claims in both languages, one exact `VERIFICATION_LIMITS` number per table row,
  the aggregate budgets and the 100 ms p95 statement, the projection/generator/
  drift-command boundary, the D16 shape plus the whole 16-code vocabulary, all six
  freshness codes, that no example calls an unexported symbol, EN/ES example-code
  equality, and that the extracted feature-26 example typechecks against the
  published types **and runs** to its `Delivery verified` conclusion. Since P16 it also refuses
  any prose mention of a source-checkout-only command (`check:verification-schemas`,
  `check:verification-package`, `bench:verification`, `test:verification-docs`,
  `gate:verification`) that lacks the boundary qualifier in its own paragraph (F110), and keeps
  both CHANGELOGs' case count equal to the suite's real size (F90).
- Prototype/inherited-field fixtures prove only normalized own-property data is
  accepted and digest-bound.
- Regression: every pre-existing suite stays green; the five prior schema files
  remain diff-clean.

read-verified: README EN/ES authority, limits and examples are semantically
synchronized; final independent review evaluates ACCEPTANCE v2 exact bytes.
