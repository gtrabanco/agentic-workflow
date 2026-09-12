# Testing — 37-phase-lint-script

Artifact revision: `37-plan-6`.

## Test layers

- **Integration (primary):** `scripts/phase-lint.test.mjs` — embedded corpus of
  Markdown plan fixtures; asserts verdict lines, reason codes, exit codes,
  per-phase fingerprints, the whole-plan sha256 line, and byte-identical
  determinism. No network, no external fixtures directory. The corpus pins the
  box-2 test-file mapping (F7 fold): a test-only `hardening` phase passes on
  its test files, a source target in `hardening` still BLOCKs, and a test file
  beside its implementation keeps the prefix-table mapping.
- **Runtime parity:** the same corpus runs under bun and node
  (`bun scripts/phase-lint.mjs` / `node scripts/phase-lint.mjs`); AC7 pins the
  node fallback with exit 0 on a valid plan.
- **Skill-surface regression (existing suites, unchanged):**
  `bun scripts/check-skill-context.mjs`, `npx skills add . --list`,
  `npm run bundle:skills` parity, `node --test scripts/ledger-ownership.test.mjs`,
  `node --test scripts/normative-drift.test.mjs` — the last one recomputes each
  skill's newest CHANGELOG row against its frontmatter version, so P1/P4 must
  drive their version surface through `bump-skill` (CHANGELOG ×2 + README
  tables) or this gate goes red at P5.

**Merge-sync state (2026-09-12, `37-plan-6`):** `main` (feature 38) is merged
into this branch and the whole route set is green —
`node scripts/check-skill-context.mjs --routes` → `PASS route budgets: 22 routes`
and `node scripts/check-skill-context.mjs` → `PASS context budgets: 39 skills` —
through the re-basis #3 recorded in `CHANGELOG.md` + `CHANGELOG.es.md`. P6's
gate re-run must reproduce both; the previously disclosed pre-existing red is
closed (see `known-issues.md`).

## Command rule

bun first (`bun scripts/phase-lint.mjs <plan.md>`), node fallback with the same
argv; shebang `#!/usr/bin/env node`; both runtimes must pass.

## Lint target (this unit)

The lint target for this unit is `TASKS.md` (the file carrying the phase tasks):
`bun scripts/phase-lint.mjs docs/features/37-phase-lint-script/TASKS.md` must
exit 0 and reproduce the six fingerprints recorded in SPEC §Phase-lint
(P1 `docs:3`, P2 `config/infra:6`, P3 `config/infra:3`, P4 `docs:7`,
P5 `config/infra:2`, P6 `hardening:8`). Verified in P2 (whole-plan sha256
`b0127303708f2b471731a51a383180548c209b926251b0e79422958414f583c5`), then
re-derived at the `37-plan-5` F7 re-cut (unchanged by the `37-plan-6` repair
batch) — the new sha256 and the linter run
are recorded in decisions.md. M/L
`SPEC.md` `### Phases` sections carry no checkboxes, so a SPEC run answers
`:0:` task counts — see `known-issues.md`.
