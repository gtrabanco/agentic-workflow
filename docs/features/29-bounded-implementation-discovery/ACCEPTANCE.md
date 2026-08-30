# Acceptance manifest v1 — 29-bounded-implementation-discovery

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | Internal discovery answers the seven fixed questions and emits every fixed map field with complete ordered phase-obligation coverage and exactly `READY | REPLAN | NEEDS-DESIGN | BLOCKED` | `node --test scripts/implementation-discovery.test.mjs` -> exit 0 (map/verdict fixtures) |
| AC2 | Inline/fresh routing depends on evidence completeness, uncertainty, topology, and risk; no file/search/read count determines route or success | `node --test scripts/implementation-discovery.test.mjs` -> exit 0 (one-file, many-file, inline, fresh fixtures) |
| AC3 | Mapping is read-only and precedes every repository write; only allowlisted reviewed planning setup may follow READY, and exact continuity is revalidated before first source/test edit | `node --test scripts/implementation-discovery.test.mjs` -> exit 0 (ordering and preparation-continuity fixtures) |
| AC4 | READY cannot coexist with an uncovered obligation, material contradiction, or relevant unknown; Engineering drift returns REPLAN, Product/authority gaps NEEDS-DESIGN, unavailable required evidence BLOCKED | `node --test scripts/implementation-discovery.test.mjs` -> exit 0 (route matrix) |
| AC5 | Every READY records the cheapest relevant observed read-only falsification probe; failed/unavailable high-risk probes never become confident evidence | `node --test scripts/implementation-discovery.test.mjs` -> exit 0 (probe matrix) |
| AC6 | Semantic navigation and direct repository fallback satisfy the same evidence contract; writer handoff is compact and excludes raw exploration history without dropping claims/unknowns | `node --test scripts/implementation-discovery.test.mjs` -> exit 0 (adapter/handoff fixtures) |
| AC7 | SPEC/Plan/receipt/phase/source/cited-content drift, unexpected setup path, consumed map, interrupted partial write, causal revert, and repeated no-new-evidence read all invalidate/stop old READY | `node --test scripts/implementation-discovery.test.mjs` -> exit 0 (freshness, consumption, recovery, no-progress matrix) |
| AC8 | Mandatory scenario matrix covers localized, broad same-layer, cross-layer, reusable-helper, affected-consumer, contradicted Plan, stale, unavailable, repeated-read, and compatibility-invariant cases | `node --test scripts/implementation-discovery.test.mjs` -> exit 0 (named scenario inventory complete) |
| AC9 | Mapping creates no forge issue, committed map, planning unit, schema, source edit, or test edit; no current-unit obligation is exported automatically | `node --test scripts/implementation-discovery.test.mjs` -> exit 0 (side-effect spy and repository-diff fixtures) |
| AC10 | Canary records first-correct-edit, replan, post-review repair, diff/rework, latency, token, and issue-spill observations without an unsupported savings claim | read-verified: completed canary table uses observed values or `not yet measured` and separates inference from evidence |
| AC11 | Feature-28/package and existing execution/review/audit regressions pass; canonical/Pi bundle parity and Pi tests pass; skill versions/changelogs, context budgets, installability, EN/ES docs/migration, and golden fixture are current | root/package/Pi suites; `node scripts/check-skill-context.mjs`; `npx skills add . --list`; dated golden PASS |
| AC12 | Exact candidate independently reviews with no unresolved fix-now finding and preserves design, Plan review, TDD, verification, candidate review, and `audit-pr` authority | read-verified: current exact-head review receipt and authority diff |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review and named manual checks remain required.

## Commands

- `node --test scripts/implementation-discovery.test.mjs`
- `node --test scripts/bounded-delivery-loops.test.mjs scripts/audit-pr-receipt.test.mjs`
- `cd packages/agentic-workflow-schema && npm test`
- `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test`
- `node scripts/check-skill-context.mjs`
- `npx skills add . --list`
