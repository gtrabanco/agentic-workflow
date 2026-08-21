# Verification receipt — fix-134-machine-contract

Date: 2026-08-21

## Automated checks

| Check | Result |
|---|---|
| `cd packages/agentic-workflow-schema && npm test` | PASS — 36 tests, 0 failures. |
| `cd packages/agentic-workflow-schema && npm pack --dry-run` | PASS — 9 publish files; all three schemas and both README files included. |
| `npx skills add . --list` | PASS — 33 discoverable skills; the internal orchestration contract is not exposed. |
| `node scripts/check-skill-context.mjs` | PASS — 35 skills within context budget. |
| `node scripts/check-skill-context.mjs --routes` | PASS — 18 route budgets. |
| `node --test scripts/*.test.mjs` | PASS — 49 tests, 0 failures. |
| `git diff --check` | PASS — no whitespace errors. |

## Local throughput check

Synthetic in-memory run on the package public API after warm-up:

| Operation | Iterations | Time | Throughput |
|---|---:|---:|---:|
| `parseTurn` (SkillOutcome v1) | 500,000 | 565.78 ms | 883,730 ops/s |
| `compileWorkflowSnapshot` (four representative documents) | 100,000 | 296.06 ms | 337,774 ops/s |

The snapshot compiler validates its generated v1 result before returning it.
The validation cost is retained because returning an invalid snapshot would
violate the public contract. The snapshot path retains validation and explicit
unknown/provenance recording; both paths remain far below a driver or model
round-trip.
