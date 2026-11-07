# Sources — 78-unit-cycle

Plan claim sources. Written by the plan step's investigate/orient stages.

<!-- sources:start -->
> Shape migrated 2026-11-07 to `DESIGN.md` § Provenance: the `provenance` column is a
> mechanical classification of each row's own first cited source (repository /
> version-pinned doc / owner answer / model memory). No claim, source or certainty
> was changed, and no new evidence is asserted — re-derive any cell from the row.

| id | claim | source | provenance | certainty |
|---|---|---|---|---|
| CLAIM-001 | Feature 22 defined `loop-review-fold` with budget 2 cycles, no-progress (= same HEAD+findings), and closed terminal states (DONE/BLOCKED/NEEDS-DECISION/NO-PROGRESS/BUDGET-EXHAUSTED) | `docs/features/22-bounded-delivery-loops/decisions.md:3-4` | repository | confirmed |
| CLAIM-002 | Feature 61's absorption replaced the fixed pipeline with triage-driven lanes; the machine-loop contract was lost — only prose remained | `docs/features/61-adaptive-unit-lane/SPEC.md` | repository | confirmed |
| CLAIM-003 | The loop must live in root scripts (`scripts/unit-cycle.mjs`), self-hosting first, reusing existing sensing primitives | `docs/features/78-unit-cycle/decisions.md:D2` | repository | confirmed |
| CLAIM-004 | The loop is built under D3 (no lane ceremony): tests red-first, then the module, then the live run; no `execute-phase` hand-offs | `docs/features/78-unit-cycle/decisions.md:D3` | repository | confirmed |
| CLAIM-005 | Sensing primitive `needs-input.mjs` exists and exports `BLOCK_ID`, `LEDGER_HEADER`, `needsInput`, `openRows`, `routeOfRow` | `scripts/needs-input.mjs:43,63` | repository | confirmed |
| CLAIM-006 | Sensing primitive `review-receipt.mjs` exists and exports `render`, `verify`, `emit` commands with SHA-bound receipt | `scripts/review-receipt.mjs` | repository | confirmed |
| CLAIM-007 | Sensing primitive `audit-pr-gate.mjs` exists with 13 gates, `mergeReadyBody`, and `audit-pr:merge-ready` marker | `scripts/audit-pr-gate.mjs` | repository | confirmed |
| CLAIM-008 | Sensing primitive `unit-doc-phases.mjs` exists and exports `parseUnitDocPhases`, `recordedPhases` | `scripts/unit-route.mjs:431,521` | repository | confirmed |
| CLAIM-009 | `unit-route.mjs` exports `resolveUnit`, `sectionBody`, `recordedPhases`, `openRows`, `routeOfRow`, `triage` for additive reuse | `scripts/unit-route.mjs:139,161,221,373,417,521` | repository | confirmed |
| CLAIM-010 | No skill-wording change in this unit: `unit-lane`/`execute-phase` prose is untouched | `docs/features/78-unit-cycle/SPEC.md#Non-goals` | repository | confirmed |
| CLAIM-011 | No new schema/envelope surface or triage catalog change in this unit | `docs/features/78-unit-cycle/SPEC.md#Non-goals` | repository | confirmed |
| CLAIM-012 | No auto-merge: `audit-pr`'s merge-ready comment is the terminal signal; merge stays operator/CI-owned | `docs/features/78-unit-cycle/SPEC.md#Non-goals` | repository | confirmed |
| CLAIM-013 | The `planned → in-progress` roadmap transition has no performing skill (execute-phase reads status but never writes it) | `docs/features/78-unit-cycle/SPEC.md#Known pre-existing issues` | repository | confirmed |

<!-- sources:end -->