# Acceptance manifest v1 — fix-244-freeze-batch-planner-consumer

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The freeze-batch `→ Next:` consumer is the router's conclusion: `skills/fold-findings/SKILL.md` (freeze-batch prose, fenced REPLAN sub-bullet, decision-table cell) and `skills/fold-findings/references/FOLD_PROCESS.md` (batch-classification cell, step 9) name `/plan-fix <n>` and `/plan-feature <slug>` as the recommendation and describe `node scripts/unit-route.mjs <unit>` as the already-run discovery step, never the recommendation. | `node --test scripts/normative-drift.test.mjs` → exit 0 (`#244` pin) and `grep -c "/plan-feature <slug>" skills/fold-findings/SKILL.md skills/fold-findings/references/FOLD_PROCESS.md` → ≥ 1 per file |
| AC2 | The `<unit>` argument format is documented in both skill files as the bare folder number or the full slug. | `grep -c "bare folder number or the full slug" skills/fold-findings/SKILL.md skills/fold-findings/references/FOLD_PROCESS.md` → 1 per file |
| AC3 | The closing-block contract states each `·` sub-bullet is exactly one physical line in both skill files, and the fixed `→ Next:` block carries no wrapped sub-bullet. | `grep -c "exactly one physical line" skills/fold-findings/SKILL.md skills/fold-findings/references/FOLD_PROCESS.md` → 1 per file; `node --test scripts/normative-drift.test.mjs` → exit 0 (block-shape assertion) |
| AC4 | A `#244` pin test in `scripts/normative-drift.test.mjs` guards the freeze-batch hand-off — a hard-wrapped sub-bullet, a host command as the consumer, or a removed planner command fails CI — and it was observed red against the unfixed bytes before the skill edits. | `node --test scripts/normative-drift.test.mjs` → exit 0; `read-verified`: the red run recorded in the unit `progress.md` (P1 task 2) |
| AC5 | The project verification gate is green and the bundled pi mirror is byte-identical to `skills/`. | `bun scripts/check-skill-context.mjs` → exit 0; `node --test scripts/*.test.mjs` → exit 0; `cd packages/pi-agentic-workflow && bun run test` → exit 0 |
| AC6 | `fold-findings` is bumped to 1.5.1 with a `CHANGELOG.md` skill-table row, and the pi package is bumped to 0.11.2 with a re-bundle row, in the same PR. | `grep -c "version: 1.5.1" skills/fold-findings/SKILL.md` → 1; `bun scripts/check-changelog-row.mjs fold-findings 1.5.1` → prints 1, exit 0; `grep -c "^| 0.11.2 |" CHANGELOG.md` → 1 |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Do not edit the `#244` pin test to pass; the skill bytes change, never the test.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `node --test scripts/normative-drift.test.mjs`
- `node --test scripts/*.test.mjs`
- `bun scripts/check-skill-context.mjs`
- `cd packages/pi-agentic-workflow && bun run test`
