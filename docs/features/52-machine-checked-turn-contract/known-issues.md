# Known issues — 52-machine-checked-turn-contract

## Disclosed limitations (plan stage)

- **`scripts/` suites are not wired into a CI job.** The SPEC's
  integration-closure row says the grammar conformance test is "run by the
  node-compat CI job"; today the node-compat jobs
  (`.github/workflows/publish-pi-package.yml`, `publish-schema.yml`) run
  only the packages' own suites (`bun run test:node`), and no job runs
  `scripts/` tests (PE-012). The row's substance is met by the test's
  node-first invocation — AC8's validator is `node --test
  scripts/turn-contract-grammar.test.mjs`, which is exactly the
  node-compat guarantee (the test passes under plain node, no bun
  required). Registering `scripts/` suites into CI is distribution/tooling
  territory (#198 per-skill package layout owns script distribution;
  a CI-owned unit owns the workflow wiring) and is deliberately not
  smuggled into this unit's scope. Destined for triage with #198.
- **Box2 phase-lint clause is engine-only.** D-52-4's "with the script
  present, box2 additionally requires phase-lint green" cannot be honored
  by the scaffold shim: AC12 forbids any node/bun/npm/npx token in the
  shim, so it cannot invoke `scripts/phase-lint.mjs` even when the target
  project has one. The shim therefore checks frozen-acceptance presence
  only (the standing D-52-4 degradation); the crate engine implements the
  full clause in this repository. Recorded as ED-52-3; no AC is narrowed —
  AC2–AC5 pin the engine, AC12 pins the shim.
- **Receipt staleness is out of scope by design.** The receipt is one
  stdout line (D-52-3); nothing persisted means nothing can go stale
  on disk, but a pasted receipt in a transcript describes the moment it
  was printed. Rules for persisted/verifiable compliance evidence remain
  #172/#35 territory, unchanged by this feature.

## Execution-discovered limitations (P2)

- **Resolved (2026-09-16): the AC2/AC7 validator form.** The original
  validators froze directory mode (`node --test packages/agentic-workflow/test/`),
  which Node ≥ 22 rejects and only Node ≤ 20 accepts; planning evidence
  PE-005 was false (finding `PLAN52-F9`). With the owner's approval the
  manifest was amended to `bun test packages/agentic-workflow/test/`
  (bun-first) with a Node-24 glob fallback
  `node --test packages/agentic-workflow/test/*.test.mjs` (SPEC §Amendments;
  decisions.md ED-52-8). No assertion, test file, or expected outcome was
  narrowed.
