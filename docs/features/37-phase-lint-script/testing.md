# Testing — 37-phase-lint-script

Artifact revision: `37-plan-3`.

## Test layers

- **Integration (primary):** `scripts/phase-lint.test.mjs` — embedded corpus of
  Markdown plan fixtures; asserts verdict lines, reason codes, exit codes,
  per-phase fingerprints, the whole-plan sha256 line, and byte-identical
  determinism. No network, no external fixtures directory.
- **Runtime parity:** the same corpus runs under bun and node
  (`bun scripts/phase-lint.mjs` / `node scripts/phase-lint.mjs`); AC7 pins the
  node fallback with exit 0 on a valid plan.
- **Skill-surface regression (existing suites, unchanged):**
  `bun scripts/check-skill-context.mjs`, `npx skills add . --list`,
  `npm run bundle:skills` parity, `node --test scripts/ledger-ownership.test.mjs`,
  `node --test scripts/normative-drift.test.mjs`.

## Command rule

bun first (`bun scripts/phase-lint.mjs <plan.md>`), node fallback with the same
argv; shebang `#!/usr/bin/env node`; both runtimes must pass.
