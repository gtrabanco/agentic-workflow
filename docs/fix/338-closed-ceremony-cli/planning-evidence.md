# Planning Evidence — fix/338-closed-ceremony-cli

> One row per Engineering claim the change rests on. `authority-kind`: `known` | `assumption` | `unknown` | `spec`. `freshness`: `current` | `stale` | `not-applicable`. Every row below was sampled at the cut head (2026-11-24).

## Ledger

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | `unit-route.mjs` exposes `--triage <unit> [--json]` and `<unit|issue> [--json]`, so ceremony's `unit triage`/`unit route` can delegate instead of re-deriving routing | `scripts/unit-route.mjs:781-785` ("usage: node scripts/unit-route.mjs --triage <unit> [--json]"); sampled by running `node scripts/unit-route.mjs` at the cut head | current | O5 |
| PE-002 | known | `phase-lint.mjs` accepts the unit-doc Tasks grammar by file path (bullets `- P<n> — <task> (validator: …)`), so `plan lint <slug>` can delegate with the unit doc's SPEC.md | `scripts/phase-lint.mjs` header: "unit-doc grammar — `P<n> — <task> (validator: …)` bullets inside the unit doc's `## Tasks` section"; sampled: `node scripts/phase-lint.mjs docs/fix/340-deletion-reuse-obligations/SPEC.md` prints `P6 Phase-lint: PASS (6/6)` | current | O5 |
| PE-003 | known | The root suite discovers only top-level `scripts/*.test.mjs`, so the ceremony suites must be named `scripts/ceremony*.test.mjs` (not under `scripts/ceremony/`) to be gated | `scripts/run-root-suite.mjs:40-44` (`readdirSync(...).filter(name.endsWith(".test.mjs"))`) | current | O2–O6, O14 |
| PE-004 | known | The legacy 258 side ledger carries exactly 23 `REVIEW-RAN` marks — the R1 reproducer's expected value | `grep -c REVIEW-RAN docs/fix/258-harden-needs-input-contracts/review-findings.md` → 23, sampled at the cut head | current | O9 |
| PE-005 | known | Unit-doc templates exist for both types, so `unit create` can copy a fixed structure without inventing one | `docs/fix/_TEMPLATE/SPEC.md`, `docs/features/_TEMPLATE/SPEC.md` both present at the cut head | current | O5 |
| PE-006 | known | The repo's deterministic scripts are dependency-free (`node:` imports, `#!/usr/bin/env node` shebang, bun-first manual invocation), so the CLI follows the same runtime convention with no manifest change | `scripts/diff-guard.mjs`, `scripts/needs-input.mjs` headers; AGENTS.md "Runtime convention" | current | O2–O6 |
| PE-007 | spec | The migrated findings carrier is the unit doc's `## Findings` six-column table (`findings-table@1`) and the marks carrier is the `## Log` `log-kind@1` lines; legacy units keep `review-findings.md` and are read, never rewritten | `skills/pre-execution-review/references/LEDGERS.md` §"One findings carrier per unit, one read path" | current | O4, O12 |
| PE-008 | assumption | A `- [x] P<n>` tick prefix on a Tasks bullet is a valid completion mark for `plan execute` / `docs check-tasks-ticks` on re-cut unit docs: current unit docs use plain `- P<n> —` bullets and phase-lint's plan grammar is the one that mentions checkboxes, so the tick is this CLI's own closed convention, pinned by its suite | owner: this unit (P6); basis: `scripts/phase-lint.mjs` grammar note + `docs/fix/340-.../SPEC.md` Tasks section (plain bullets) | current | O5, O8 |

## Verification

- All `known` rows were sampled at the cut head (commands in the `source` cell).
- PE-008 is the only `assumption`; its owner resolves it in P6 by pinning the
  tick convention in `scripts/ceremony-unit-plan.test.mjs`. No `unknown` rows.
