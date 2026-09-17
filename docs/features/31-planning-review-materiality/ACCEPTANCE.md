# Acceptance manifest v1 — 31-planning-review-materiality

Status: frozen

Frozen 2026-09-17 by `plan-feature-scaffold` from the SPEC's acceptance
criteria AC1…AC13 (AC14 was added by the `31-plan-2` repair batch below).
One stable ID per SPEC criterion; validators copied from
the criteria. Modifying this manifest during execution requires a
user-approved SPEC amendment.

Re-frozen 2026-09-17 by the repair batch `31-plan-2` (user-authorized; SPEC
`## Amendments`) — AC12's validator re-pointed to the package-root bundler
command (F01), AC8's scope walk widened to the declared derived-surface set
(F03), AC1–AC4/AC6/AC7/AC9/AC11 anchored to the planning pin table, and AC14
added (the pin table's presence, discrimination leg and row floor, F02).

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The planning materiality line moved in the findings-ledger semantics: `grep -n "only immaterial" skills/pre-execution-review/references/LEDGERS.md` exits non-zero, and `grep -niE "report-note" skills/pre-execution-review/references/LEDGERS.md` exits zero with the rule that a `low` finding is persisted, visible, non-blocking, and never a re-review trigger by itself | the two greps at the PR head + `bun test scripts/review-loop-discipline.test.mjs` exit 0 with the report-note row of the planning pin table green (AC14) |
| AC2 | Both stage CHECKS files state material = `medium`+: `grep -n "anything above \`info\`" skills/review-spec/references/CHECKS.md skills/review-plan/references/CHECKS.md` exits non-zero, and both files state material = `medium`+ (`grep -n "medium"` hits the new materiality sentence in each) | the greps at the PR head + discipline suite exit 0 with both CHECKS rows of the planning pin table green (AC14) |
| AC3 | The anti-deflation rule appears in the planning-side surfaces: `grep -rn "medium\` minimum" skills/pre-execution-review/references/ skills/review-spec/ skills/review-plan/` exits zero, and the matched text includes that deflating a real defect to dodge a review is itself a review defect | the grep at the PR head with the deflation sentence in the matched lines |
| AC4 | The hard two-cycle cap is in POLICY §4: `grep -n "third cycle never" skills/pre-execution-review/references/POLICY.md` exits zero; the §4 text ends an unconverged loop in `NEEDS-DESIGN` absent explicit user instruction (read-verified); the `CONVERGENCE-ANOMALY` block text is unchanged (read-verified against the §4 diff hunk) | the grep at the PR head + read-verified §4 hunk walk recorded in the P4 phase entry + the cap row of the planning pin table green (AC14) |
| AC5 | The `REPAIR.md` §4 mirror: `grep -n "More cycles stay allowed" skills/design-feature/references/REPAIR.md` exits non-zero, and `grep -n "third cycle never" skills/design-feature/references/REPAIR.md` exits zero | both greps at the PR head |
| AC6 | The wording-only route skips the full snapshot re-review: POLICY §3 states the route, records the determination in the unit's evidence, and rotates `artifactRevisionId` (read-verified, command-anchored by `grep -n "Wording-only" skills/pre-execution-review/references/POLICY.md`) | the anchor grep + read-verified §3 hunk walk recorded in the P4 phase entry + discipline suite exit 0 with the wording-only row of the planning pin table green (AC14) |
| AC7 | The verdict-side loop text mirrors the cap: `grep -n "third cycle never" skills/review-spec/references/OUTPUT.md skills/review-plan/references/OUTPUT.md` exits zero | the grep at the PR head |
| AC8 | Diff scope: at the PR head, `git diff main --stat` lists only the In-scope surfaces **plus the declared derived-surface set** — the Pi mirror under `packages/pi-agentic-workflow/skills/**`, the four edited `SKILL.md` `version:` lines, the README skill-table cells, and `CHANGELOG.md` — and nothing else; `git diff main -- skills/pre-execution-review/references/POLICY.md` produces hunks scoped to §3 and §4 (read-verified: §1, §2, §5–§8 byte-identical to `main`) | read-verified hunk + file-list walk (each derived path recorded against the declared set) recorded in the P4 phase entry |
| AC9 | The discipline suite passes at the PR head and no existing assertion is weakened: `bun test scripts/review-loop-discipline.test.mjs` passes, and `git diff main -- scripts/review-loop-discipline.test.mjs` removes no existing assertion (additions or equal-strength rewrites only) | suite exit 0 (the planning pin table's floor + discrimination legs green, AC14) + read-verified no-weakening diff walk recorded in the P4 phase entry |
| AC10 | Untouched schema package: `git diff main --stat -- packages/agentic-workflow-schema` is empty, and `cd packages/agentic-workflow-schema && bun run test` passes | empty diff listing + suite exit 0 |
| AC11 | Health gates: `bun test scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs scripts/normative-drift.test.mjs && bun scripts/check-skill-context.mjs` is green at the PR head (the machine-pinned LEDGERS blocks survive the edit) | the compound command exits 0; the pin table's presence and discrimination legs (AC14) are part of this head-level green |
| AC12 | Pi mirror parity: the mirror was re-bundled **from the package that owns the script** — `cd packages/pi-agentic-workflow && bun run bundle:skills` (there is no root `package.json`; the bare root form exits non-zero) — after the last `skills/` edit, and `cd packages/pi-agentic-workflow && bun run test` passes | bundle run from the package root + package suite exit 0 |
| AC13 | Bibliography + versions: `grep -n "2603.00539" README.md` exits zero at the PR head (References append), and each edited skill's `version:` is bumped with a CHANGELOG row (read-verified against the bump-skill diff) | the grep at the PR head + read-verified bump diff walk recorded in the P4 phase entry |
| AC14 | The planning-side pins are mechanically present and discriminating at the PR head: the discipline suite declares `PLANNING_PIN_TABLE` with the row floor `PLANNING_PIN_FLOOR = 9` and executes the discrimination leg `assertDiscriminating(`, and the suite passes — so an absent, empty, truncated, or trivially-true pin set cannot satisfy AC1–AC4, AC6, AC7, AC9 or AC11 | `grep -q "PLANNING_PIN_TABLE" scripts/review-loop-discipline.test.mjs && grep -q "assertDiscriminating(" scripts/review-loop-discipline.test.mjs && grep -q "PLANNING_PIN_FLOOR = 9" scripts/review-loop-discipline.test.mjs && bun test scripts/review-loop-discipline.test.mjs` → exit 0 |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- The loop-discipline pins are updated to the new contract, never weakened: every existing assertion keeps its phrase or gains a strictly stronger assertion (AC9's no-weakening walk is the enforcement).

## Commands

- `bun test scripts/review-loop-discipline.test.mjs`
- `bun test scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs scripts/normative-drift.test.mjs scripts/pre-execution-sensor.test.mjs`
- `bun scripts/check-skill-context.mjs`
- `cd packages/pi-agentic-workflow && bun run bundle:skills && bun run test`
- `cd packages/agentic-workflow-schema && bun run test`
- `grep -q "PLANNING_PIN_TABLE" scripts/review-loop-discipline.test.mjs && grep -q "assertDiscriminating(" scripts/review-loop-discipline.test.mjs && grep -q "PLANNING_PIN_FLOOR = 9" scripts/review-loop-discipline.test.mjs` (AC14)
- `grep -n "only immaterial" skills/pre-execution-review/references/LEDGERS.md` (expect non-zero)
- `grep -niE "report-note" skills/pre-execution-review/references/LEDGERS.md`
- `grep -n "third cycle never" skills/pre-execution-review/references/POLICY.md skills/review-spec/references/OUTPUT.md skills/review-plan/references/OUTPUT.md skills/design-feature/references/REPAIR.md`
- `grep -n "2603.00539" README.md`
