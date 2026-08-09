# Acceptance manifest v1 — 22-bounded-delivery-loops

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | planners emit and executor preserves `ACCEPTANCE.md` | contract fixtures + read verification |
| AC2 | omitted phase runs all remaining; explicit phase runs one | routing fixtures |
| AC3 | unit loop is gate-driven, compact, resumable, and skips intermediate review | routing + no-progress fixtures |
| AC4 | issue groups use outcome/verifier/rollback compatibility | grouping fixtures |
| AC5 | discoveries create proposals, not issues | forbidden-command grep fixture |
| AC6 | review/fold loop is context-clean and bounded | terminal-state fixtures |
| AC7 | fold batching preserves every finding receipt | ledger fixture |
| AC8 | repository validation remains green | documented commands |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `node scripts/bounded-delivery-loops.test.mjs`
- `node scripts/check-skill-context.test.mjs`
- `node scripts/check-skill-context.mjs`
- `node scripts/check-skill-context.mjs --routes`
- `node scripts/dependency-gate.test.mjs`
- `node scripts/review-receipt.test.mjs`
- `node scripts/audit-pr-receipt.test.mjs`
- `npx skills add . --list`
- `git diff --check`
