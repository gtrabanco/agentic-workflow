# Acceptance manifest v1 — fix-179-declared-ledger-delta-receipts

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | A pinned plan receipt whose subsequent bound deltas are exactly declared ledger-state amendments (tick flips, obligation `status` cells) verifies `current:false` with `structural.reasonCode: "declared-delta"`, a non-empty `declaredDelta.amendments[]` naming commit+path, exit 4 — never `stale-source-revision` | `node --test scripts/pre-execution-sensor.test.mjs` → fail 0 (declared cases (a)/(f)) |
| AC2 | Fail-closed preserved: a content hunk, an undeclared flip, an uncommitted flip, a moved bound context, or any out-of-class delta still answers `stale-source-revision`/`stale-artifact-content`/`stale-context` and blocks; proven red-first at pre-fix bytes | same suite → fail 0 (fail-closed cases (b)–(e)); red-first run at pre-fix bytes pasted in the unit's `progress.md` (read-verified) |
| AC3 | A `verify`-axis finding with defect = process-expected receipt staleness + docs/progress claim inaccuracy classifies `fix-now` with the `fold-findings` route; only a cited content delta in reviewed planning material routes to plan re-review — pinned by the discipline test | `node --test scripts/review-loop-discipline.test.mjs` → fail 0 with the new CLASSIFY pins |
| AC4 | No weakening: mutate-and-revert protection, verdict exclusivity, the two-cycle cap, and the third-cycle user escape are unchanged — every existing pin stays green | `node --test scripts/review-loop-discipline.test.mjs scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs scripts/ledger-ownership.test.mjs scripts/bounded-delivery-loops.test.mjs` → fail 0 |
| AC5 | The sensor's reason vocabulary change is published by the schema package (4.2.0, `declared-delta` after `stale-source-revision`) and mirrored in the README EN+ES in the same PR | `cd packages/agentic-workflow-schema && bun run test` → fail 0 (docs test derives the README table); `grep -c declared-delta packages/agentic-workflow-schema/README.md packages/agentic-workflow-schema/README.es.md` → ≥ 1 each |
| AC6 | `audit-pr`'s lineage gate treats `declared-delta` as a declared, non-blocking warning (MERGE-READY reachable); the BLOCKED enumeration is unchanged and excludes `declared-delta` | `grep -n "declared-delta" skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md skills/audit-pr/SKILL.md` → non-blocking wording present; `node --test scripts/audit-pr-receipt.test.mjs` → fail 0 |
| AC7 | Fail-closed consumers untouched: `execute-phase`'s pre-execution gate and `workflow-status` 6a gain no declared-delta treatment | `grep -rc "declared-delta" skills/execute-phase/references/ skills/workflow-status/` → 0 total hits |
| AC8 | Context budgets green after the reference growth (trim first, then a declared re-basis naming `fix/179`) | `node scripts/check-skill-context.mjs --routes` → exit 0 |
| AC9 | Mirror + release hygiene: the pi mirror is byte-identical to `skills/`; touched skills bumped minor with EN+ES changelog rows; pi package re-bundled and green | `npm run bundle:skills` + `npm test` in `packages/pi-agentic-workflow` → fail 0; `grep -c "179\|4.2.0\|0.7.0" CHANGELOG.md CHANGELOG.es.md` → ≥ 1 each |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `node --test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs`
- `node --test scripts/review-loop-discipline.test.mjs scripts/audit-pr-receipt.test.mjs scripts/ledger-ownership.test.mjs scripts/bounded-delivery-loops.test.mjs`
- `cd packages/agentic-workflow-schema && bun run test`
- `npm test` in `packages/pi-agentic-workflow`
- `node scripts/check-skill-context.mjs --routes`
- `npx skills add . --list`
