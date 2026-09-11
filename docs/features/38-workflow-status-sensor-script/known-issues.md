# known-issues — 38-workflow-status-sensor-script

## Tracked boundaries

- **B-01 — scripts/ distribution gap (E-38-7):** The pi package's `bundle:skills` copies skill trees only; root `scripts/workflow-status.mjs` does not travel with installed skills. In-repo dogfooding is unaffected (the script lives at `scripts/` in the repo); an installed copy of the skill (e.g. via `npx skills add`) cannot find the script. This boundary is tracked in `docs/features/44-per-skill-package-layout` (issue #198) — a future feature that ships scripts inside their skill folder. Until then, the workflow-status skill's documented path assumes the user is running in the repo root where `scripts/` exists.

- **B-02 — ENVELOPE_CORE.md slimming loses command-level detail:** The slimmed ENVELOPE_CORE.md removes the step-by-step envelope assembly prose. A reader who needs to understand how the envelope is built must read the script source or the `envelope.schema.json` in the schema package. This is intentional — the script is now the single source of truth. The slimming keeps the state mapping (`CLEAN` → `OK`, `RESUMABLE` → `CONTINUE`, `AMBIGUOUS` → `NEEDS_INPUT`) and the tier map in ENVELOPE_CORE.md so the skill's interpretation layer has the information it needs.

- **B-04 — pre-existing `check-skill-context` route-ceiling failures (repo-wide, not feature 38):** `node scripts/check-skill-context.mjs --routes` exits 1 on 15 route ceilings (`execute-phase:*`, `review-change:*`) that sit above their declared `measured × 1.10` bound. The condition is present on `main` (verified at `main` 84b7f0e9 and at this branch's HEAD) and none of those routes is touched by feature 38 — the growth predates this unit. A:14's check (`node scripts/check-skill-context.mjs` → exit 0) therefore cannot pass until those ceilings get the tool's own prescribed declared re-basis ("raise it at a declared re-basis and name the growth source"); P3 owns that re-basis together with the `workflow-status` entry, recorded in `decisions.md`.

- **B-03 — Discipline test pin re-targeting breadth:** Four root suites pin sensor prose. The re-targeting moves the assertion from "prose X exists in SENSOR_CORE.md" to "behavior X exists in the script." The script-behavior form is strictly stronger (it asserts actual runtime behavior, not text-presence), but the test infrastructure must be updated in the same change as the slimming (P3), and all four suites must exit 0 after the change. Any missed pin (a still-valid prose reference in a test that wasn't updated) would cause a suite failure.

## Open during execution

None. All product and engineering decisions are resolved.