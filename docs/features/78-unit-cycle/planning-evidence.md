# Planning Evidence — 78-unit-cycle

Evidence for each Engineering claim in the SPEC's Engineering half.

<!-- sources:start -->
| id | claim | status | source |
|---|---|---|---|
| PE-001 | The control core (`decide()`, prompt builder, doc-sensing helpers, runner) is offline-testable pure code | verified | `scripts/unit-cycle.test.mjs` — 34 pass / 0 fail; `node --test scripts/*.test.mjs` — 809 pass / 0 fail |
| PE-002 | The whole cycle is one command: `node scripts/unit-cycle.mjs <unit>` drives design→plan→phases→tests→evidence→docs→release→review→fold→audit to `done` | verified | live run 5 on unit 67: `tests → review → fold → review → audit` → exit 0 `done` (PR #313, marker at `9b2816af`) |
| PE-003 | Terminal states are a closed set with distinct exit codes: 0 `done` · 2 `needs-input` · 3 `budget-exhausted` · 4 `no-progress` · 5 `failed` · 1 usage | verified | live runs observed: exit 0 `done`, exit 2 `needs-input` (run 3), exit 5 `failed` (runs 1-2); `budget-exhausted`/`no-progress` pinned offline in tests |
| PE-004 | The fold budget is configurable and enforced: `--max-cycles N` (default 2, env `UNIT_CYCLE_MAX_CYCLES`), counted per fold act, stops with exit 3 | verified | `scripts/unit-cycle.test.mjs` case for fold budget; spec claims enforcement in code |
| PE-005 | `--dry-run` senses and decides without side effects: prints state, next action, spawns nothing | verified | `node scripts/unit-cycle.mjs 67-serena-provisioning --dry-run` before commit — tree dirty → `next: stop — failed (dirty-tree)` with zero acts spawned |
| PE-006 | Reuses existing sensing primitives (needs-input, review-receipt, audit-pr-gate, unit-doc-phases, unit-route) without creating new ones | confirmed | `scripts/needs-input.mjs`, `scripts/review-receipt.mjs`, `scripts/audit-pr-gate.mjs`, `scripts/unit-route.mjs` all exist and export the referenced functions |
| PE-007 | No skill-wording change: `unit-lane`/`execute-phase` prose untouched in this unit | confirmed | SPEC Non-goals explicitly states this; no SKILL.md changes in PR #314 |
| PE-008 | No new schema/envelope surface; no change to the triage catalog | confirmed | PR #314 diff contains no schema package changes; `envelope.schema.json` unchanged |

<!-- sources:end -->