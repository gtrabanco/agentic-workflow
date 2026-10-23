# Sources — 78-unit-cycle

Plan claim sources. Written by the plan step's investigate/orient stages.

<!-- sources:start -->
| id | claim | source | certainty |
|---|---|---|---|
| CLAIM-001 | Feature 22 defined `loop-review-fold` with budget 2 cycles, no-progress (= same HEAD+findings), and closed terminal states (DONE/BLOCKED/NEEDS-DECISION/NO-PROGRESS/BUDGET-EXHAUSTED) | `docs/features/22-bounded-delivery-loops/decisions.md:3-4` | confirmed |
| CLAIM-002 | Feature 61's absorption replaced the fixed pipeline with triage-driven lanes; the machine-loop contract was lost — only prose remained | `docs/features/61-adaptive-unit-lane/SPEC.md` | confirmed |
| CLAIM-003 | The loop must live in root scripts (`scripts/unit-cycle.mjs`), self-hosting first, reusing existing sensing primitives | `docs/features/78-unit-cycle/decisions.md:D2` | confirmed |
| CLAIM-004 | The loop is built under D3 (no lane ceremony): tests red-first, then the module, then the live run; no `execute-phase` hand-offs | `docs/features/78-unit-cycle/decisions.md:D3` | confirmed |
| CLAIM-005 | Sensing primitive `needs-input.mjs` exists and exports `BLOCK_ID`, `LEDGER_HEADER`, `needsInput`, `openRows`, `routeOfRow` | `scripts/needs-input.mjs:43,63` | confirmed |
| CLAIM-006 | Sensing primitive `review-receipt.mjs` exists and exports `render`, `verify`, `emit` commands with SHA-bound receipt | `scripts/review-receipt.mjs` | confirmed |
| CLAIM-007 | Sensing primitive `audit-pr-gate.mjs` exists with 13 gates, `mergeReadyBody`, and `audit-pr:merge-ready` marker | `scripts/audit-pr-gate.mjs` | confirmed |
| CLAIM-008 | Sensing primitive `unit-doc-phases.mjs` exists and exports `parseUnitDocPhases`, `recordedPhases` | `scripts/unit-route.mjs:431,521` | confirmed |
| CLAIM-009 | `unit-route.mjs` exports `resolveUnit`, `sectionBody`, `recordedPhases`, `openRows`, `routeOfRow`, `triage` for additive reuse | `scripts/unit-route.mjs:139,161,221,373,417,521` | confirmed |
| CLAIM-010 | No skill-wording change in this unit: `unit-lane`/`execute-phase` prose is untouched | `docs/features/78-unit-cycle/SPEC.md#Non-goals` | confirmed |
| CLAIM-011 | No new schema/envelope surface or triage catalog change in this unit | `docs/features/78-unit-cycle/SPEC.md#Non-goals` | confirmed |
| CLAIM-012 | No auto-merge: `audit-pr`'s merge-ready comment is the terminal signal; merge stays operator/CI-owned | `docs/features/78-unit-cycle/SPEC.md#Non-goals` | confirmed |
| CLAIM-013 | The `planned → in-progress` roadmap transition has no performing skill (execute-phase reads status but never writes it) | `docs/features/78-unit-cycle/SPEC.md#Known pre-existing issues` | confirmed |

<!-- sources:end -->