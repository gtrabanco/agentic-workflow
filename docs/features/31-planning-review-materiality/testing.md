# testing — 31-planning-review-materiality

## Validation ladder

| Layer | Required evidence | Command or check |
|---|---|---|
| Report-note semantics (ledger surface) | `LEDGERS.md` §3 states material = `medium`+, the `low` report-note rule, and the anti-deflation carry-over; the old "`info` is the only immaterial one" sentence is gone | `grep -n "only immaterial" skills/pre-execution-review/references/LEDGERS.md` non-zero; `grep -niE "report-note" skills/pre-execution-review/references/LEDGERS.md` zero; the report-note row of the planning pin table |
| Materiality restatement (verdict checklists) | both CHECKS files carry the `medium`+ line + anti-deflation; severity vocabulary list unchanged | greps per AC2/AC3 + both CHECKS rows of the planning pin table |
| Cap + wording-only (policy surface) | POLICY §4 hard cap with counting basis + `NEEDS-DESIGN` end; `CONVERGENCE-ANOMALY` block byte-identical; POLICY §3 wording-only route with determination + rotation | the cap/wording-only rows of the planning pin table; AC4/AC6 read-verified hunk walks in P4 |
| Pin existence + discrimination (F02) | the planning pins exist, are non-empty, and every pin rejects the sentence it supersedes — a no-op suite no longer satisfies the criteria that depend on them | `grep -q "PLANNING_PIN_TABLE" scripts/review-loop-discipline.test.mjs`; `grep -q "assertDiscriminating(" scripts/review-loop-discipline.test.mjs`; `grep -q "PLANNING_PIN_FLOOR = 9" scripts/review-loop-discipline.test.mjs`; `bun test scripts/review-loop-discipline.test.mjs` → exit 0 (AC14) |
| Verdict mirrors (OUTPUT ×2, REPAIR) | both OUTPUT files + `REPAIR.md` §4 carry the cap line; receipt-literal lines and verdict grammar untouched | AC5/AC7 greps + `bun test scripts/normative-drift.test.mjs` |
| Ledger truth classes | no new ledger row type, writer, or owner; the rule moves text only | `bun test scripts/ledger-ownership.test.mjs scripts/ledger-provenance.test.mjs scripts/pre-execution-quality.test.mjs scripts/pre-execution-sensor.test.mjs` |
| Context/installability | the four bumped skills stay within budgets; skills CLI discovery intact | `bun scripts/check-skill-context.mjs`; `npx skills add . --list` |
| Untouched surfaces | schema package byte-untouched; no tutorial (`docs/workflow/`) edit | `git diff --name-only main...HEAD -- packages/agentic-workflow-schema docs/workflow` empty; schema `bun run test` |
| Pi distribution | canonical bundle parity + package behavior | `cd packages/pi-agentic-workflow && bun run bundle:skills && bun run test` (the bundler script lives in the package; no root `package.json`) |

## Mandatory scenario inventory

Scenario coverage per the SPEC's `### Dev scenarios` table; each row names the
phase + validator that exercises it:

| Scenario | Exercised in | Validator |
|---|---|---|
| `loop:report-note-pass` — a review PASS coexists with open `low` report-note rows (no repair batch, no re-review) | P1 | report-note row of the planning pin table (PASS-coexistence wording in `LEDGERS.md` §3); live precedent: this unit's own two open `info` rows |
| `loop:deflation-guard` — a real defect mislabeled `low` re-classifies at `medium` minimum and blocks | P1 | anti-deflation row of the planning pin table + AC3 grep |
| `loop:closed-vocabulary` — a severity outside `info\|low\|medium\|high\|critical` is never introduced | P1 | unchanged severity list in both CHECKS files (grep) + AC10 schema diff empty |
| `loop:role-violation` — an author turn filing findings against its own artifact, or a script writing ledger rows, stays denied | P4 | `bun test scripts/ledger-ownership.test.mjs` (unchanged ownership block) |
| `loop:cap-hit` — the second cycle prints `CONVERGENCE-ANOMALY` before any further edit; a third cycle is refused without explicit user instruction; an unconverged loop ends in `NEEDS-DESIGN` | P2 | cap rows of the planning pin table + AC4 read-verified hunk walk |
| `loop:wording-only-skip` — a recorded cosmetic repair batch skips the re-review, leaves the determination row + rotated revision behind | P3 | wording-only row of the planning pin table + AC6 read-verified hunk walk |
| `loop:dup-finding` — the same finding re-reported in a later cycle keeps its stable id and gains a second resolution row | P4 | unchanged `finding-id` stability text in `LEDGERS.md` §3 (read-verified in the AC8 hunk walk: §3 outside the edited hunks) |
| `loop:pin-vacuous` — a planning pin that is absent, empty, truncated, or trivially true leaves the discipline suite green | P1, P2, P3, then P4 at the PR head | the pin table's row floor (`PLANNING_PIN_FLOOR` 4 → 8 → 9) + the discrimination leg + the AC14 validator |
| outage/dependency failure — n/a: no runtime dependency exists; every validator is a local command over repository bytes |

## Runtime convention

bun first (`bun test …`, `bun scripts/…`); the same commands under
`node --test …` / `node scripts/…` are the guaranteed fallback (CI node-compat
job). The discipline suite must pass under both runtimes.
