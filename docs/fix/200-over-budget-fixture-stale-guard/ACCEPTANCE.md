# Acceptance manifest v1 — fix-200-over-budget-fixture-stale-guard

Status: frozen

Cycle-2 repair (receipt `rp-fix200-20260908-001`): AC1/AC4 re-scoped to the
reachable fixture pin — the suite carries a pre-existing, out-of-scope
route-budget red (`test.mjs:112`), so a full-suite exit 0 was unreachable
inside this unit's declared scope.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The fail-closed over-budget guard is exercised again: the `"over-budget reference"` fixture's checker run exits non-zero against a manifest-derived oversized body — observable as the fixture red being **gone**: the suite output contains no `over-budget reference should fail closed` line (any remaining failure at this revision is the pre-existing, out-of-scope route red at `test.mjs:112`, never the fixture) | `bun scripts/check-skill-context.test.mjs 2>&1 \| grep -cF "over-budget reference should fail closed"` → `0`; the pasted suite tail shows the remaining failure (if present at execution time) at the route red, not the fixture |
| AC2 | The fixture body is sized from the manifest at runtime — no stale size constant; the over-budget case reads `docs/workflow/SKILL_CONTEXT_BUDGETS.json` and derives the effective `review-change` reference ceiling the same way the checker merges it | read-verified: `grep -n "repeat(10_000)" scripts/check-skill-context.test.mjs` → no match; the fixture's over-budget setup reads the manifest path |
| AC3 | The checker itself stays untouched and green (budgets still pass with the shipped manifest; the bare declared gate is green too) | `bun scripts/check-skill-context.mjs --budgets` → exit 0, stdout contains `PASS context budgets` |
| AC4 | The suite behaves identically on the node fallback (runtime convention: bun first, node guaranteed) | `node scripts/check-skill-context.test.mjs 2>&1 \| grep -cF "over-budget reference should fail closed"` → `0` |
| AC5 | The fix is registered in the fix index while the branch is open (`in-progress`, flipped from the draft's `pending` by the cycle-2 repair commit) | read-verified: `grep -n "#200" docs/fix/README.md` → exactly 1 match in the Active table, status `in-progress` |
| AC6 | The route-budget red is recorded as a separate out-of-scope unit with a named owner and both disposition paths (declared re-basis vs route trim) — never grown into this unit | read-verified: the SPEC's `Out of scope` + `Cross-issue notes` cite `test.mjs:112`, PE-009/PE-010, and #176/D2 |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- The over-budget fixture's assertion (`assert.notEqual(result.status, 0)` with
  regex `/estimate .* >|lines .* > /`) is immutable: only the fixture *input*
  may be resized, never the expectation.
- The suite is expected to remain red at the pre-existing route red
  (`test.mjs:112`) at this revision: manufacturing green by touching the route
  assertions, the routes manifest, or skipping assertions is forbidden — the
  route red belongs to its own unit (SPEC PE-010).

## Commands

- `bun scripts/check-skill-context.test.mjs 2>&1 | grep -cF "over-budget reference should fail closed"` → `0`
- `node scripts/check-skill-context.test.mjs 2>&1 | grep -cF "over-budget reference should fail closed"` → `0`
- `bun scripts/check-skill-context.mjs --budgets`
