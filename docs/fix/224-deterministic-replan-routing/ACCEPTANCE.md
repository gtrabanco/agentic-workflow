# Acceptance manifest v1 — fix-224-deterministic-replan-routing

Status: frozen

Frozen 2026-09-15 by `plan-fix` from the SPEC's acceptance criteria AC1–AC12.
Re-frozen by the repair batch `fix-224-artrev-0002` (user-authorized; SPEC
`## Amendments`) — AC5 re-targeted to the unit-37 fixture, AC7 widened to the
full destination census, AC12 added.
One stable ID per criterion; validators copied from the criteria. Modifying this
manifest during execution requires a user-approved SPEC amendment.

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The router's closed route table answers `replan`, `decision`, `fold`, `execute` and `plan-from-issue` from fixture ledgers, first match winning | `node --test scripts/unit-route.test.mjs` → exit 0 |
| AC2 | The bounded read set is derived from the selected rows only: the unit's `review-findings.md`, `SPEC.md`, `ACCEPTANCE.md` and each cited repository path, deduped, sorted, and capped with an explicit remainder line | `node --test scripts/unit-route.test.mjs` → exit 0 |
| AC3 | Failure states fail closed: an unknown unit and extra arguments exit 1, an ambiguous unit exits 2, and no route is printed on either | `node --test scripts/unit-route.test.mjs` → exit 0 |
| AC4 | The router is deterministic and read-only: two consecutive runs print byte-identical stdout, and `git status --porcelain` is unchanged after a run | `node --test scripts/unit-route.test.mjs` → exit 0 |
| AC5 | Dogfood-shaped end-to-end — against the committed fixture replicating unit 37's plan-routed ledger rows (copied from `feat/37-phase-lint-script` at `e1e282c5`, PE-013), the router answers `replan` and lists the plan-routed row ids without being told any id | `node --test scripts/unit-route.test.mjs` → exit 0 (the dogfood fixture case) |
| AC6 | The sensor emits `next.suggested` routed by class: a replan row points at the unit's planner command, a plain fix-now row points at the fold, and a unit with no open row contributes no suggestion | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 |
| AC7 | One canonical replan destination: every surface the census shows routing the class — the eight skill files and six tutorial files enumerated in Scope — names the router and the same planner command, and no converged surface sends a replan row to the executor or the fold | read-verified: `grep -c "unit-route" skills/review-change/references/PERSIST_AND_DECIDE.md skills/review-change/references/OUTPUT_AND_GUARDRAILS.md skills/review-implementation/references/CLASSIFY.md skills/review-implementation/SKILL.md skills/triage-issue/SKILL.md skills/triage-issue/references/REVIEW_FINDING_PROCESS.md skills/fold-findings/references/FOLD_PROCESS.md skills/fold-findings/SKILL.md docs/workflow/REVIEW_AND_CLASSIFY.md docs/workflow/REVIEW_AND_CLASSIFY.es.md docs/workflow/FEATURE_WORKFLOW.md docs/workflow/FEATURE_WORKFLOW.es.md docs/workflow/PORTABLE_PROMPT.md docs/workflow/PORTABLE_PROMPT.es.md` → ≥1 per file |
| AC8 | The replan contract is loaded conditionally: both planners name the router in their progressive-loading section and reference the contract behind the router's replan line only | read-verified: `grep -n "unit-route" skills/plan-feature/SKILL.md skills/plan-fix/SKILL.md` plus the surrounding lines |
| AC9 | The new internal skill is registered and the skill tree stays discoverable | `bun scripts/check-skill-context.mjs` → exit 0; `npx skills add . --list` → exit 0 |
| AC10 | The Pi mirror is byte-identical to `skills/` after the last skill edit and the package suite passes | `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → exit 0 |
| AC11 | The repository gate is green at the executed head | `node --test scripts/*.test.mjs` → exit 0 |
| AC12 | The router's stdout carries no verbatim ledger line: echoed ids and paths pass one sanitizer that truncates long cells (data, never instructions) | `node --test scripts/unit-route.test.mjs` → exit 0 (the S7 sanitizer pin) |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.
- The router's fixtures are its behavioural contract: refining the route table
  requires a fixture update asserting the new behaviour, never a fixture edit to
  make a broken implementation pass.

## Commands

- `node --test scripts/unit-route.test.mjs`
- `node --test scripts/workflow-status-sensor.test.mjs`
- `node --test scripts/normative-drift.test.mjs`
- `bun scripts/check-skill-context.mjs`
- `npx skills add . --list`
- `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`
- `node scripts/unit-route.mjs <unit>` (manual read of the routed block)
- `node --test scripts/*.test.mjs` (the project gate)
