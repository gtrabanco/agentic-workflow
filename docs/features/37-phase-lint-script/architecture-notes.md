# Architecture notes — 37-phase-lint-script

Artifact revision: `37-plan-3`.

## Layer placement

- `scripts/phase-lint.mjs` + `scripts/phase-lint.test.mjs` → `config/infra`
  (repo tooling layer; bun-first runtime, node fallback, `#!/usr/bin/env node`
  shebang).
- Consumer skill edits (`plan-feature-scaffold`, `plan-fix`, `execute-phase`)
  → `docs` layer (skill prose); `phase-contract` stays the sole rule owner and
  is amended exactly once (P1, owner-sanctioned rule-1 `Hardening & PR`
  exception, v1.0.1 → 1.0.2 — ED6), never re-edited by other phases.
- `packages/agentic-workflow` crate + `.agentic-workflow/tmp/` → `config/infra`
  (vehicle rule, declined 43 → producer family).

## Boundaries

- Read-only: the linter never writes files; plans are inputs only.
- No schema-package change (`packages/agentic-workflow-schema` untouched; AC9).
- No external dependencies, no network, no AI.
- The pi mirror (`packages/pi-agentic-workflow`) is re-bundled only via
  `npm run bundle:skills` because three SKILL.md files change.

## Binding impact

- Downstream: features 40 and 42 depend on this feature; 38 lands its producer
  as a subcommand of the crate created here. `decideWorkflowAction()` and the
  envelope remain consumer-side (out of scope).
