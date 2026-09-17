# Acceptance manifest v1 — 31-planning-review-materiality

Status: frozen

Frozen 2026-09-17 by `plan-feature-scaffold` at artifact revision **`31-plan-3`**,
from the SPEC's acceptance criteria AC1…AC14 as the Product half carries them
(reviewed by `spec-review-31-9` @ snapshot
`e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507`). This
re-freeze replaces the `31-plan-2` manifest wholesale: the carrier those
validators described (prose recitation plus a `PLANNING_PIN_TABLE` row floor) is
superseded by the code carrier D-31-6 names, so the validators now anchor to the
schema package, the snapshot CLI, the decider and the discipline suite. One
stable ID per SPEC criterion; validators copied from the criteria. Modifying
this manifest during execution requires a user-approved SPEC amendment.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The machine materiality predicate is `medium`+: `grep -n 'severity !== "info"' packages/agentic-workflow-schema/src/pre-execution.ts` exits non-zero, and the package suite passes with vectors proving that a PASS receipt carrying an open/unverified `low` row validates while the same receipt with an open/unverified `medium` row is refused (`verdict-mismatch`) | the grep at the PR head (expect non-zero) + `cd packages/agentic-workflow-schema && bun run test` exit 0 with both readiness vectors green (vector walk `read-verified`) |
| AC2 | The schema's own prose matches the predicate: `grep -rn "the only immaterial" packages/agentic-workflow-schema/src/` exits non-zero, and the finding-record severity description states the new line through two fragments only the rewrite can carry — `grep -nE 'material = .medium' packages/agentic-workflow-schema/src/pre-execution-contract.ts` exits zero and `grep -n "report-note" packages/agentic-workflow-schema/src/pre-execution-contract.ts` exits zero | both greps at the PR head (the first two expect non-zero and zero respectively) with the rewritten description read (`read-verified`) |
| AC3 | The finding record carries the bounded `reproducer`: `grep -n "reproducer" packages/agentic-workflow-schema/src/pre-execution-contract.ts` exits zero; the bound is declared on the field entry (`grep -A8 'key: "reproducer"' packages/agentic-workflow-schema/src/pre-execution-contract.ts \| grep -c "maxLength"` returns ≥ 1); a suite vector exercises the field (`grep -rln "reproducer" packages/agentic-workflow-schema/test/` exits zero) with back-compatibility (a receipt whose findings carry no `reproducer` still validates) and the bound (a `reproducer` longer than the declared `maxLength` is refused); the receipt contract id is unchanged (`grep -c "agentic-workflow/pre-execution-review-receipt@1" packages/agentic-workflow-schema/src/pre-execution-contract.ts` ≥ 1) | the four anchors at the PR head + `cd packages/agentic-workflow-schema && bun run test` exit 0 with the bound and back-compatibility vectors green |
| AC4 | The wording-only route is machine-recorded: `bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` passes with `wording-only` vectors for both outcomes (`grep -rn "wording-only" scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs` exits zero) — revision rotated plus determination recorded with no material movement keeps verify current without a new review receipt; material byte movement yields `stale-artifact-content` (exit 4); a rotation without the recorded determination is refused | the suite exit 0 + the grep at the PR head + the vector semantics walked at the PR head (`read-verified`) |
| AC5 | The orchestrator refuses to advance past the cap: `cd packages/agentic-workflow-schema && bun run test` passes with a transition-decider refusal vector named for this rule (`grep -rln "review-loop-cap" packages/agentic-workflow-schema/test/` exits zero) proving that after two consecutive unconverged review→repair→re-review cycles an invocation of `review-spec`/`review-plan` is refused (stop, human route named), that a PASS resets the count, and that `needs-design` routes to `design-feature` | the package suite exit 0 + the `review-loop-cap` grep at the PR head |
| AC6 | The plan layer is lint-governed: `bun scripts/phase-lint.mjs docs/features/31-planning-review-materiality/PLAN.md` exits 0 with PASS verdicts at the PR head, and the re-cut plan's loop phases verify through run-and-paste `pre-execution-snapshot.mjs verify` exit codes (machine done-whens, not prose recitation) (`read-verified` against the re-cut plan) | the linter's stdout block pasted verbatim in the hardening phase entry + the verify exit codes recorded there |
| AC7 | Prose shrinks to the non-computable remainder — every declared removal grep exits non-zero: `grep -rn "More cycles stay allowed" skills/`; `grep -n "no cycle cap converts" skills/design-feature/references/REPAIR.md`; `grep -n "no cap converts a verdict into a" skills/pre-execution-review/references/POLICY.md`; `grep -n "no cycle cap or anomaly rule" skills/pre-execution-review/references/POLICY.md`; `grep -n "cycle is allowed when correctness needs it" skills/pre-execution-review/references/POLICY.md`; `grep -n "re-review of the resulting snapshot" skills/pre-execution-review/references/POLICY.md`; `grep -rn "Material = anything above" skills/review-spec/references/CHECKS.md skills/review-plan/references/CHECKS.md`; `grep -rnE "re-review of the new snapshot\|re-reviews the new" skills/review-spec/references/OUTPUT.md skills/review-plan/references/OUTPUT.md`; `grep -n "only immaterial" skills/pre-execution-review/references/LEDGERS.md` — and the kept remainder stays: `grep -n "third cycle never" skills/pre-execution-review/references/POLICY.md` exits zero, `grep -niE "report-note" skills/pre-execution-review/references/LEDGERS.md` exits zero, `grep -rn "medium\` minimum" skills/pre-execution-review/references/ skills/review-spec/ skills/review-plan/` exits zero, and the `CONVERGENCE-ANOMALY` block plus the receipt-literal lines are byte-unchanged | the nine removal greps (expect non-zero), the three kept greps (expect zero), and the byte-unchanged block plus receipt literals walked against the diff hunks at the PR head (`read-verified`) |
| AC8 | The discipline pins keep the machine rule honest: `bun test scripts/review-loop-discipline.test.mjs` passes at the PR head, the suite reads the code carriers (`grep -n "packages/agentic-workflow-schema" scripts/review-loop-discipline.test.mjs` exits zero), and `git diff main -- scripts/review-loop-discipline.test.mjs` removes no existing assertion | the suite exit 0 + the grep at the PR head + the no-weakening diff walk recorded (`read-verified`) |
| AC9 | Additive schema release: `cd packages/agentic-workflow-schema && bun run gate:pre-execution` passes at the PR head (suite, projection drift checks, package check and docs test); the package version is bumped (minor) with a CHANGELOG row; the schema diffs remove no enum value and no contract id | the gate exit 0 + the `read-verified` vocabulary-diff walk at the PR head |
| AC10 | The repo gate pack is green: `bun test scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs scripts/normative-drift.test.mjs scripts/workflow-status-pre-execution.test.mjs && bun scripts/check-skill-context.mjs` exits 0 at the PR head (budgets updated for the shrink if it moves sizes) | the compound command exit 0 at the PR head |
| AC11 | Mirror parity: `cd packages/pi-agentic-workflow && bun run bundle:skills && bun run test` passes (the bundler script lives in the package; this repository has no root `package.json`) | the bundle run from the package root + the package suite exit 0 |
| AC12 | `grep -n "2603.00539" README.md` exits zero at the PR head (References append, in the implementation PR — never before) | the grep exit 0 at the PR head |
| AC13 | At the PR head, every path in `git diff main --name-only` belongs to one of the three declared groups (code carriers; prose-shrink plus derived surfaces; workflow-mutated records) and no path outside them — mechanical anchor: `git diff main --name-only -- . ':(exclude)docs/features/31-planning-review-materiality' ':(exclude)docs/features/ROADMAP.md' ':(exclude)docs/LOGS.md'` lists only paths of the first two groups | the anchored diff listing at the PR head + the per-path attribution recorded (`read-verified`) |
| AC14 | The four touched skills are bumped and their release surfaces move in the same PR — `git diff main -- skills/pre-execution-review/SKILL.md skills/review-spec/SKILL.md skills/review-plan/SKILL.md skills/design-feature/SKILL.md \| grep -cE '^[+-]version: '` returns ≥ 8, each old→new pair is a semver-minor increment (no major), `CHANGELOG.md` gains one per-skill row per bumped skill (the AC10 `normative-drift` version-tables check recomputes those tables against the frontmatter `version:` lines), and the README skill cells for the four touched skills are accurate post-shrink | the bump-hunk count and the CHANGELOG/README walk at the PR head (`read-verified`) |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- The loop-discipline pins are re-aimed at the code carriers, never weakened: every existing assertion keeps its phrase or gains a strictly stronger assertion (AC8's no-weakening walk is the enforcement).
- No vocabulary value is removed anywhere: the severities, the five verdicts, the ten freshness codes and the transition table's rows keep their values; the two named additions are the finding record's `reproducer` field and the `stop-review-loop-cap` stop code.

## Commands

- `cd packages/agentic-workflow-schema && bun run test`
- `cd packages/agentic-workflow-schema && bun run gate:pre-execution`
- `bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs`
- `bun test scripts/review-loop-discipline.test.mjs`
- `bun test scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs scripts/normative-drift.test.mjs scripts/workflow-status-pre-execution.test.mjs`
- `bun scripts/check-skill-context.mjs`
- `bun scripts/phase-lint.mjs docs/features/31-planning-review-materiality/PLAN.md`
- `cd packages/pi-agentic-workflow && bun run bundle:skills && bun run test`
- `grep -n 'severity !== "info"' packages/agentic-workflow-schema/src/pre-execution.ts` (expect non-zero)
- `grep -rn "the only immaterial" packages/agentic-workflow-schema/src/` (expect non-zero)
- `grep -rln "review-loop-cap" packages/agentic-workflow-schema/test/`
- `grep -rn "wording-only" scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs`
- `grep -n "third cycle never" skills/pre-execution-review/references/POLICY.md`
- `grep -n "2603.00539" README.md`
