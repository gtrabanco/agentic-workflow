# Acceptance manifest v1 — fix-159-review-fold-loop-bounds

Status: frozen

| ID | Required outcome | Validator |
|---|---|---|
| AC1 | The four loop bounds are pinned to their owning skill text (materiality end-to-end, state-as-precondition, folded-row re-verification, two-cycle cap, materiality bar ×8, validator stability, claim discipline, forge-verified status words, class→resolver map ×2). | `node scripts/review-loop-discipline.test.mjs` → exit 0, PASS line |
| AC2 | No existing contract regressed (normative surfaces, ledgers, sensor, envelope, drift gates all still hold). | `node --test scripts/*.test.mjs` → 0 failing (174 tests) |
| AC3 | Context budgets hold after the new sections, including the re-based route ceilings. | `node scripts/check-skill-context.mjs` → PASS; `--routes` → PASS 23 routes |
| AC4 | The Pi package mirror is byte-identical and its suite is green at 0.3.0. | `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` → 0 failing; `cd packages/pi-agentic-workflow && bun run test` → 0 failing (134) |
| AC5 | The schema package is untouched and green. | `cd packages/agentic-workflow-schema && bun run test` → 0 failing (680) |
| AC6 | Skills CLI still discovers every skill. | `npx skills add . --list` → exit 0 |
| AC7 | Documentation surfaces synced in the same change (EN+ES changelogs, MIGRATION EN+ES, README EN+ES, pi package 0.3.0 row). | manual: grep `159` in CHANGELOG.md, CHANGELOG.es.md, MIGRATION.md, MIGRATION.es.md; README cells name the two-cycle cap and the BLOCKED precondition |

## Quality floor

- No validator was loosened to manufacture PASS; route ceilings were re-based
  upward per the manifest policy (`ceil(measured × 1.10)`, growth source named
  in the commit and changelog row — fix #159's new contract text).
- The red-first proof: `scripts/review-loop-discipline.test.mjs` failed on the
  unmodified skills before any contract edit (verified before implementation).
