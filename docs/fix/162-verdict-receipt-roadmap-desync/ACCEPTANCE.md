# Acceptance manifest v1 — fix-162-verdict-receipt-roadmap-desync

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | A review verdict is mechanically bound to a persisted receipt: the reviewer self-check contract exists in POLICY §8, SNAPSHOT.md, and both reviewers' OUTPUT.md persist sections + turn-contract boxes, with the exit-3/fresh emit conditions named | `grep -c "verify --stage" skills/pre-execution-review/references/POLICY.md skills/pre-execution-review/references/SNAPSHOT.md skills/review-spec/references/OUTPUT.md skills/review-plan/references/OUTPUT.md` → each file ≥ 1; `grep -c "exit 3" skills/review-spec/references/OUTPUT.md skills/review-plan/references/OUTPUT.md` → each ≥ 1 |
| AC2 | A roadmap `done` row never satisfies or suppresses a gate: POLICY §5 carries the rule, ROUTING step 4 routes to the merge gate instead of "nothing", SENSOR_CORE 6a senses done-but-unmerged units | `grep -c "→ Next: nothing" skills/plan-feature/references/ROUTING.md` → 0; `grep -c "roadmap rows are labels" skills/pre-execution-review/references/POLICY.md` ≥ 1; `grep -c "done.*open.*unmerged\|unmerged" skills/workflow-status/references/SENSOR_CORE.md` ≥ 1 |
| AC3 | `NEEDS-DESIGN` is emitted only by `review-spec` | `grep -rni "needs-design" skills/review-plan/` → 0 lines; `grep -c "NEEDS-DESIGN" skills/review-spec/references/OUTPUT.md` ≥ 1 |
| AC4 | The convergence/loop guards gate blind re-reviews of unchanged state and never block a verdict-response repair | `grep -c "blind re-reviews" skills/pre-execution-review/references/POLICY.md skills/design-feature/references/REPAIR.md` → each ≥ 1; `grep -c "verdict response" skills/review-change/references/PERSIST_AND_DECIDE.md` ≥ 1 |
| AC5 | Schema publishes the `impossible-timeline` freshness code (after `stale-policy`), the 5-minute skew constant, and the pure predicate; package suite green | `grep -c "impossible-timeline" packages/agentic-workflow-schema/src/pre-execution.ts` ≥ 1; `grep -c "PRE_EXECUTION_RECEIPT_TIMELINE_SKEW_MS" packages/agentic-workflow-schema/src/pre-execution.ts` ≥ 1; `cd packages/agentic-workflow-schema && bun run test` → fail 0 |
| AC6 | The sensor refuses a back-dated receipt under its own reason code and stays fail-open for legacy/unresolvable receipts | `node --test scripts/pre-execution-timeline.test.mjs` → exit 0 (back-dated → `impossible-timeline`; honest → `current: true`; legacy + within-skew + unresolvable → unflagged) |
| AC7 | The sensor's timeline dimension composes with the comparator's documented precedence; no unpublished code can be printed | `node --test scripts/pre-execution-attribution.test.mjs scripts/pre-execution-sensor.test.mjs` → exit 0 |
| AC8 | Root suites and context budgets are green (the two touched route ceilings restored) | `node --test scripts/*.test.mjs` → 0 fail; `node scripts/check-skill-context.mjs --routes` → exit 0 |
| AC9 | Both package suites pass on the re-bundled tree | `cd packages/agentic-workflow-schema && bun run test` → fail 0; `cd packages/pi-agentic-workflow && bun run test` → fail 0 (includes the `skills/` mirror parity test) |
| AC10 | Version/changelog hygiene: schema 4.1.0, pi package bump, every touched skill's `version:` bump, both CHANGELOG tables updated same-PR | `grep -c "4\.1\.0" CHANGELOG.md CHANGELOG.es.md` → each ≥ 1; read-verified: every touched skill's frontmatter `version:` appears in both CHANGELOG tables (diff the touched-skills list against the changelog rows) |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- The schema code must ship in the same PR as the sensor that consumes it (the sensor refuses unpublished codes).
- Tests are added red-first; existing tests are never edited to pass.

## Commands

- `node --test scripts/*.test.mjs` (repository gate; route budgets included)
- `cd packages/agentic-workflow-schema && bun run test`
- `cd packages/pi-agentic-workflow && bun run test`
- `node scripts/check-skill-context.mjs --routes`
- `node scripts/pre-execution-snapshot.mjs contract` (prints the published freshness vocabulary incl. `impossible-timeline`)
