# Acceptance manifest v1 — 37-phase-lint-script

Status: frozen

Frozen 2026-09-09 by `plan-feature-scaffold` from the SPEC's acceptance
criteria AC1–AC10. Re-frozen 2026-09-10 (revision `37-plan-3`) per the
user-approved F5 resolution — AC8's third grep target corrected to
`skills/execute-phase/SKILL.md`. One stable ID per SPEC criterion; validators
copied from the criteria. Modifying this manifest during execution requires a
user-approved SPEC amendment.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | A valid plan → exit 0; stdout is one fixed text block with `Phase-lint: PASS (8/8)` per phase, a per-phase fingerprint, a final `PASS` verdict line, and a `fingerprint: <sha256>` line | `bun scripts/phase-lint.mjs <corpus-valid-plan.md>` → exit 0 |
| AC2 | An invalid plan → exit 1; stdout reports each failing rule (`<rule-id>: <finding>`), the per-phase `Phase-lint: BLOCKED — box <n>: <reason>` line, and the final `BLOCKED: <reason-code>` verdict | `bun scripts/phase-lint.mjs <corpus-invalid-plan.md>` → exit 1 |
| AC3 | Fail-closed edges: no argument → exit 1 + `BLOCKED: missing-plan`; plan with no phases → exit 1 + `BLOCKED: no-phases`; unreadable/unparsable file → exit 1 + `BLOCKED: unparseable` | `bun scripts/phase-lint.mjs` (no arg / edge corpus fixtures) → exit 1 with each reason code |
| AC4 | Determinism: two consecutive runs on the same input produce byte-identical stdout | `diff <(bun scripts/phase-lint.mjs <f>) <(bun scripts/phase-lint.mjs <f>)` → empty |
| AC5 | Corpus of test plans (valid, invalid, ambiguous) maps to its expected verdict + reason code | `node --test scripts/phase-lint.test.mjs` → exit 0 |
| AC6 | No network calls in the linter | `grep -nE "fetch\(|require\(['\"](http|https)" scripts/phase-lint.mjs` → empty |
| AC7 | Node fallback parity | `node scripts/phase-lint.mjs <corpus-valid-plan.md>` → exit 0 |
| AC8 | The three consumer skills reference the script; `phase-contract` amended once in P1 (rule-owner exception) and never re-edited afterward; context budgets + CLI discovery pass; pi mirror re-bundled | `grep -n "phase-lint.mjs" skills/plan-feature-scaffold/SKILL.md skills/plan-fix/SKILL.md skills/execute-phase/SKILL.md` → matches in all three; `bun scripts/check-skill-context.mjs` → exit 0; `npx skills add . --list` → exit 0; `npm run bundle:skills` re-run |
| AC9 | No schema vocabulary change | `git diff --name-only main...HEAD -- packages/agentic-workflow-schema` → empty |
| AC10 | Vehicle-rule artifacts present (crate + tmp convention) | `test -d packages/agentic-workflow && test -f packages/agentic-workflow/package.json && test -d .agentic-workflow/tmp` → exit 0 |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- The corpus fixtures are the behavioral contract: refining a rule heuristic
  requires a corpus update asserting the new behavior, never a fixture edit to
  make a broken implementation pass.

## Commands

- `bun scripts/phase-lint.mjs <plan.md>` (fallback `node scripts/phase-lint.mjs <plan.md>`)
- `node --test scripts/phase-lint.test.mjs`
- `bun scripts/check-skill-context.mjs`
- `npx skills add . --list`
- `npm run bundle:skills`
