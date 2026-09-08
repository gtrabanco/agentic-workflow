# Acceptance manifest v1 — fix-200-over-budget-fixture-stale-guard

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The fail-closed over-budget guard is exercised again: the full context-checker suite passes, including the `"over-budget reference"` fixture whose checker run must exit non-zero | `bun scripts/check-skill-context.test.mjs` → exit 0, final stdout line matches `PASS context checker:` |
| AC2 | The fixture body is sized from the manifest at runtime — no stale size constant; the over-budget case reads `docs/workflow/SKILL_CONTEXT_BUDGETS.json` and derives the effective `review-change` reference ceiling the same way the checker merges it | read-verified: `grep -n "repeat(10_000)" scripts/check-skill-context.test.mjs` → no match; the fixture's over-budget setup reads the manifest path |
| AC3 | The checker itself stays untouched and green (budgets still pass with the shipped manifest) | `bun scripts/check-skill-context.mjs --budgets` → exit 0, stdout contains `PASS context budgets` |
| AC4 | The suite also passes on the node fallback (runtime convention: bun first, node guaranteed) | `node scripts/check-skill-context.test.mjs` → exit 0 |
| AC5 | The fix is registered in the fix index as `pending` before any phase runs | read-verified: `grep -n "#200" docs/fix/README.md` → exactly 1 match in the Active table |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- The over-budget fixture's assertion (`assert.notEqual(result.status, 0)` with
  regex `/estimate .* >|lines .* > /`) is immutable: only the fixture *input*
  may be resized, never the expectation.

## Commands

- `bun scripts/check-skill-context.test.mjs`
- `node scripts/check-skill-context.test.mjs`
- `bun scripts/check-skill-context.mjs --budgets`
