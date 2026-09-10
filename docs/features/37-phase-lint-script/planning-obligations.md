# Planning obligations — 37-phase-lint-script

One row per normative behaviour, applicable invariant, affected use case, and
required failure state (ledger contract: `pre-execution-review/references/LEDGERS.md` §2).
Artifact revision: `37-plan-2`.

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | SPEC AC1 | A valid plan yields `Phase-lint: PASS (8/8)` per phase + final `PASS` verdict + fingerprint line, exit 0 | P1 | corpus valid fixture | execute-phase | `bun scripts/phase-lint.mjs <corpus-valid-plan.md>` | test output in TASKS.md tick | planned |
| O2 | SPEC AC2 | An invalid plan reports each failing rule (`<rule-id>: <finding>`), the per-phase `Phase-lint: BLOCKED — box <n>` line, final `BLOCKED: <reason-code>`, exit 1 | P1 | corpus invalid fixture | execute-phase | `bun scripts/phase-lint.mjs <corpus-invalid-plan.md>` | test output in TASKS.md tick | planned |
| O3 | SPEC AC3 | Fail-closed edges: no argument / missing file → `missing-plan`; zero phase headings → `no-phases`; unreadable or grammar-ambiguous file → `unparseable`; all exit 1 | P1 | edge reason-code fixtures | execute-phase | `bun scripts/phase-lint.mjs` (no arg / edge fixtures) | test output in TASKS.md tick | planned |
| O4 | SPEC AC4 | Determinism: two consecutive runs on the same input produce byte-identical stdout | P1 / P4 | determinism pair | execute-phase | `diff <(cmd) <(cmd)` → empty | test assertion in phase-lint.test.mjs | planned |
| O5 | SPEC AC5 | Corpus of test plans (valid, invalid, ambiguous) maps to expected verdict + reason code under `node --test scripts/phase-lint.test.mjs` | P1 | corpus test suite | execute-phase | `node --test scripts/phase-lint.test.mjs` | suite exit 0 | planned |
| O6 | SPEC AC6 | No network calls in the linter | P1 / P4 | grep guard | execute-phase | `grep -nE "fetch\(|require\(['\"](http|https)" scripts/phase-lint.mjs` → empty | gate output in TASKS.md tick | planned |
| O7 | SPEC AC7 | Node fallback parity: `node scripts/phase-lint.mjs <valid-plan>` → exit 0 | P1 | node fallback run | execute-phase | `node scripts/phase-lint.mjs <corpus-valid-plan.md>` | exit 0 recorded | planned |
| O8 | SPEC AC8 | The three consumer skills reference and run the script; `phase-contract` unchanged (sole rule owner); context budgets + skills CLI discovery pass; pi mirror re-bundled | P3 | skill slim edits | execute-phase | greps + `bun scripts/check-skill-context.mjs` + `npx skills add . --list` + `npm run bundle:skills` | command outputs in TASKS.md tick | planned |
| O9 | SPEC AC9 | No change to `packages/agentic-workflow-schema` (no new vocabulary) | P1 / P4 | untouched-schema check | execute-phase | `git diff --name-only main...HEAD -- packages/agentic-workflow-schema` → empty | diff output in TASKS.md tick | planned |
| O10 | SPEC AC10; vehicle rule (PE-005) | Producer crate + tmp convention exist: `packages/agentic-workflow/` with `package.json`, and `.agentic-workflow/tmp/` | P2 | crate + tmp creation | execute-phase | `test -d packages/agentic-workflow && test -f packages/agentic-workflow/package.json && test -d .agentic-workflow/tmp` | command exit 0 in TASKS.md tick | planned |
| O11 | Roadmap conventions | Roadmap row 37 reads `planned` after scaffold, re-read and confirmed | — (scaffold) | roadmap write | plan-feature-scaffold | re-read of `docs/features/ROADMAP.md` row 37 | row text `planned` | verified |
| O12 | SPEC §Architecture impact | `skills/phase-contract/SKILL.md` is not modified by this feature (sole rule owner) | P3 | untouched-rule-owner check | execute-phase | `git diff --name-only main...HEAD -- skills/phase-contract` → empty | diff output in TASKS.md tick | planned |
