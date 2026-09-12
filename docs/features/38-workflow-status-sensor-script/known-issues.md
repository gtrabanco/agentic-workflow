# known-issues — 38-workflow-status-sensor-script

## Tracked boundaries

- **B-01 — scripts/ distribution gap (E-38-7):** The pi package's `bundle:skills` copies skill trees only; root `scripts/workflow-status.mjs` does not travel with installed skills. In-repo dogfooding is unaffected (the script lives at `scripts/` in the repo); an installed copy of the skill (e.g. via `npx skills add`) cannot find the script. This boundary is tracked in `docs/features/44-per-skill-package-layout` (issue #198) — a future feature that ships scripts inside their skill folder. Until then, the workflow-status skill's documented path assumes the user is running in the repo root where `scripts/` exists.

- **B-02 — ENVELOPE_CORE.md slimming loses command-level detail:** The slimmed ENVELOPE_CORE.md removes the step-by-step envelope assembly prose. A reader who needs to understand how the envelope is built must read the script source or the `envelope.schema.json` in the schema package. This is intentional — the script is now the single source of truth. The slimming keeps the state mapping (`CLEAN` → `OK`, `RESUMABLE` → `CONTINUE`, `AMBIGUOUS` → `NEEDS_INPUT`) and the tier map in ENVELOPE_CORE.md so the skill's interpretation layer has the information it needs.

- **B-04 — pre-existing `check-skill-context` route-ceiling failures (repo-wide, not feature 38):** `node scripts/check-skill-context.mjs --routes` exits 1 on 15 route ceilings (`execute-phase:*`, `review-change:*`) that sit above their declared `measured × 1.10` bound. The condition is present on `main` (verified at `main` 84b7f0e9 and at this branch's HEAD) and none of those routes is touched by feature 38 — the growth predates this unit. A:14's check (`node scripts/check-skill-context.mjs` → exit 0) therefore cannot pass until those ceilings get the tool's own prescribed declared re-basis ("raise it at a declared re-basis and name the growth source"); P3 owns that re-basis together with the `workflow-status` entry, recorded in `decisions.md`.

- **B-04 — `check-skill-context` route-ceiling failures (repo-wide) — RESOLVED 2026-09-11 in P3.** At P1/P2 this was red on `main` and on this branch: 15 route ceilings (`execute-phase:*`, `review-change:*`, plus a one-point `plan-feature:issue`) sat below the tool's own `measured × 1.10` bound, predating feature 38 (growth from features 29/30/31). P3 applied the tool's prescribed **declared re-basis** — every over-ceiling route raised to `ceil(measured × 1.10)` with the growth source named in `SKILL_CONTEXT_BUDGETS.json`'s `policy.declared` — and added the measured `workflow-status` entry. `node scripts/check-skill-context.mjs` now exits 0 (39 skills / 22 routes); A:14 is satisfiable.

- **B-04 history (pre-resolution).** The 15 failing ceilings and their measurements are recorded in the P1/P2 run: `execute-phase:{descope,feature,final-pr,fix,finding,legacy,small}` and `review-change:{adversarial,default-backend,default-web,synthesize}`.

- **B-03 — Discipline test pin re-targeting breadth:** Four root suites pin sensor prose. The re-targeting moves the assertion from "prose X exists in SENSOR_CORE.md" to "behavior X exists in the script." The script-behavior form is strictly stronger (it asserts actual runtime behavior, not text-presence), but the test infrastructure must be updated in the same change as the slimming (P3), and all four suites must exit 0 after the change. Any missed pin (a still-valid prose reference in a test that wasn't updated) would cause a suite failure.

## Open during execution

None. All product and engineering decisions are resolved.
## P4 close-out (2026-09-11)

No remaining blockers. B-01 stays a recorded boundary (tracked → feature 44 /
#198); B-02/B-03 are intended consequences of the slimming; B-04 was resolved in
P3 by the declared budget re-basis.

## P5 close-out (2026-09-12)

No new blockers. The read-path fold batch closed F20, F27–F35. One boundary is
recorded rather than fixed: `PRE_EXECUTION_MAX_SENSES = 16` caps pre-execution
verifier spawns, so a repository with more than 16 in-flight unit/stage senses
reports the over-cap rows as `missing` with a `pre-execution sense cap (16)
reached` reason and a `workflow_observations` line. That is a deliberate
degradation under the declared failure contract (bounded, never a hang), not a
correctness claim — a bigger cap is a one-constant change if a real repository
ever needs it. No other boundary opened.
