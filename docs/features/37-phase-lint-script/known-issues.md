# Known issues — 37-phase-lint-script

## Disclosed limitations (execute-phase)

- **Lint target for M/L units is `TASKS.md`, not `SPEC.md`.** The frozen grammar
  reads tasks from the phase body, and M/L `SPEC.md` `### Phases` sections are the
  high-level ledger with no checkboxes (the shape of `docs/features/28`, `29` and
  `30`). Linting such a SPEC now BLOCKs box-3 (the ≥ 1-task minimum,
  `phase-contract` v1.0.3) instead of passing vacuously — the intended
  fail-closed answer. Consumers must pass the file that carries the task list
  (`TASKS.md`, or an XS/S SPEC with checkbox phases).
- **The linter is strict and planning-time.** It reports what the frozen rules
  say; plans written before the rules were mechanized can BLOCK on a legacy shape
  (a hardening task whose first path token belongs to another layer; a
  housekeeping task with no backticked command in its `Done-when:`; a phase with
  zero tasks). The remedy is a re-cut at planning time, never a relaxed rule —
  `phase-contract` stays the sole rule owner.
- **Pre-existing repo defect** (not this unit's): `node --test
  scripts/check-skill-context.test.mjs` fails at HEAD and at `f46cf450` for two
  independent reasons owned elsewhere — the stale over-budget fixture and the
  route-budget red are tracked by fix #200
  (`docs/fix/200-over-budget-fixture-stale-guard/SPEC.md` §Goal, which declares
  the route red out of its scope) and by issue #176 (slim the routes that
  overshoot their budgets). Disclosed for P5; not repaired here.

## Deferred items

Deferred items linked to/destined for issues; never inline scope changes.

- `--json` / machine-readable output mode: deferred to feature 38/42 (SPEC
  Deferred decisions row 2; PD2). No issue opened — tracked by roadmap rows.
- Rule-4 heuristics (`→` chains, enumerated cases, created-file counting) are
  deterministic approximations of "one deliverable"; the corpus pins their
  exact behavior. If a real plan is misjudged, the fix is a corpus-pinned
  refinement of the heuristic, never a plan rewrite by the linter.
