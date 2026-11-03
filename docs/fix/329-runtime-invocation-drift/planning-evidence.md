# fix/329-runtime-invocation-drift — planning evidence

> Planning evidence ledger for unit `329-runtime-invocation-drift` (M). Row shape
> owned by `skills/pre-execution-review/references/LEDGERS.md`; this file is the
> M/L home the unit doc's `### Planning evidence` section names. Frozen at cut;
> only `freshness` may be re-sampled by an evidence run.

| id | authority-kind | claim | source | freshness | affected-decision-or-obligation |
|---|---|---|---|---|---|
| PE-001 | known | The drift class grew between triage and now: 19 `usage: node` lines live outside test files, in 14 scripts, not the 10 the 2026-10-28 triage counted | `rg -n 'usage: node' scripts/*.mjs` → 21 lines; the two inside `unit-route.test.mjs` and `ledger-ownership.test.mjs` are test fixtures, leaving 19 | current | O3, P3, E1 |
| PE-002 | known | The `pre-execution-quality` guard fires on every run because all four retired skills are absent | `ls skills/evidence-grounding skills/review-spec skills/design-feature skills/plan-feature` → exit 2, all four missing; guard at `scripts/pre-execution-quality.test.mjs:47-51` | current | O8, P5, E2 |
| PE-003 | known | `bun test` reports the guarded file green with zero tests and zero skips — the false green `S8` names | `bun test scripts/pre-execution-quality.test.mjs` → exit 0, output `SKIP pre-execution-quality: deleted skills … absent`, no `pass`/`skip` row | current | O8, P5, E3 |
| PE-004 | known | A registered `node:test` skip is reported by both runners and stays green, so the guard can be visible without turning the suite red | probe in `/tmp`: `node --test t.test.mjs` → `skipped 1`, exit 0; `bun test t.test.mjs` → `1 skip`, `0 fail`, exit 0 | current | O8, D4 |
| PE-005 | known | `setup-env.mjs` and `update-tools.mjs` are declared node-run by unit 331, and `setup-env` provisions bun — it cannot print a bun usage string on a machine without bun | `docs/fix/331-authoring-setup/SPEC.md` S6 + AC8; `scripts/setup-env.mjs:11,58,598`; the bun MISS row at `:322` says node is the runtime fallback | current | O3, D1 |
| PE-006 | known | The node literal is taught in five skill spots; one legitimate spot declares the fallback on its own line | `rg -n 'node\s+scripts/' -U skills` → 9 matches in 6 files; only `skills/execute-phase/references/PREFLIGHT.md:157-158` declares `node fallback` on the adjacent line | current | O3, P3, E4 |
| PE-007 | known | The repo guide has headroom for the normative line | `bun scripts/check-skill-context.mjs --documents` → AGENTS.md 357 lines / 6,255 est against ceilings 393 / 6,881 | current | O1, O13, E7 |
| PE-008 | known | Both executor skills have headroom for one turn-contract box each | `bun scripts/check-skill-context.mjs` → unit-lane 3,792 est / 292 lines (ceilings 4,135 / 319); execute-phase 4,479 / 350 (ceilings 4,693 / 369) | current | O2, O13, E6 |
| PE-009 | known | The suite exception is real, not stylistic: the root suite cannot run under bun | `bun scripts/run-root-suite.mjs scripts/needs-input.test.mjs` → exit 1, `error: Cannot use afterAll() outside of the test runner` | current | O10, S10 |
| PE-010 | known | One test pins the old usage literal, so the sweep must move it in the same change | `scripts/unit-route.test.mjs:235` asserts `^usage: node scripts/unit-route\.mjs` | current | O3, O11, P3 |
| PE-011 | known | The scaffold has no runtime section; its `## Workflow conventions` block is the only agent-guide home the skills read first | `rg -n '^## ' template/AGENTS.md` → `## Workflow conventions (the skills read this)` at line 64; no runtime/tooling heading | current | O1, P4 |
| PE-012 | known | The availability half already exists as a read-only check, so the box cites it instead of re-implementing it | `scripts/setup-env.mjs:594-598` parses `--check`; `:11` documents `node scripts/setup-env.mjs --check` as verify-only | current | O7, S7 |
| PE-013 | unknown | Whether every agent host that runs these skills has `rg` on PATH. Not sampled host-by-host; the line and the gate therefore treat `grep` as a legitimate fallback rather than a violation | owner: the operator (`S4` keeps an unavailable preferred tool legitimate) | not-applicable | O4, D3 |
| PE-014 | known | The root suite discovers any `scripts/*.test.mjs`, so the new sibling suite needs no registration | `scripts/run-root-suite.mjs:41-45` (`readdirSync(...).filter(name => name.endsWith('.test.mjs'))`) | current | O9, P6 |
