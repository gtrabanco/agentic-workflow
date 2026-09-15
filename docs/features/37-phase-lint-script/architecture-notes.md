# Architecture notes — 37-phase-lint-script

Artifact revision: `37-plan-7`.

## Layer placement

- `scripts/phase-lint.mjs` + `scripts/phase-lint.test.mjs` → `config/infra`
  (repo tooling layer; bun-first runtime, node fallback, `#!/usr/bin/env node`
  shebang).
- Consumer skill edits (`plan-feature-scaffold`, `plan-fix`, `execute-phase`)
  → `docs` layer (skill prose); `phase-contract` stays the sole rule owner and
  is amended **twice**: by P1 (owner-sanctioned rule-1 `Hardening & PR`
  exception, v1.0.1 → 1.0.2 — ED6) and by the cycle-1 review fold F5
  (user-approved rule-3 ≥ 1-task minimum, v1.0.2 → 1.0.3, commit `8a35face`);
  no other phase of this feature re-edits it (O12).
- `packages/agentic-workflow` crate + `.agentic-workflow/tmp/` → `config/infra`
  (vehicle rule, declined 43 → producer family).

## Boundaries

- Read-only: the linter never writes files; plans are inputs only.
- No schema-package change (`packages/agentic-workflow-schema` untouched; AC9).
- No external dependencies, no network, no AI.
- The pi mirror (`packages/pi-agentic-workflow`) is re-bundled only via
  `npm run bundle:skills` because three SKILL.md files change.

## Binding impact

- Downstream: features 40 and 42 depend on this feature. Feature 38 landed
  first (PR #213, `e0c18284`) and put its producer at
  `scripts/workflow-status.mjs` — outside the crate this feature creates; the
  crate obligation is unchanged and the producer's re-homing is a recorded
  follow-up (PE-011). `decideWorkflowAction()` and the envelope remain
  consumer-side (out of scope).
