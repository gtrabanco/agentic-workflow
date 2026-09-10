# Known issues — 37-phase-lint-script

## Disclosed limitations (execute-phase)

- **Lint target for M/L units is `TASKS.md`, not `SPEC.md`.** The frozen grammar
  reads tasks from the phase body, and M/L `SPEC.md` `### Phases` sections are the
  high-level ledger with no checkboxes (the shape of `docs/features/28`, `29` and
  `30`). Linting a SPEC yields `PASS (8/8)` with a `:0:` task count — boxes 3–7 are
  then vacuous. Consumers must pass the file that carries the task list
  (`TASKS.md`, or an XS/S SPEC with checkbox phases).
- **The linter is strict and planning-time.** It reports what the frozen rules
  say; plans written before the rules were mechanized can BLOCK on a legacy shape
  (a hardening task whose first path token belongs to another layer; a
  housekeeping task with no backticked command in its `Done-when:`). The remedy is
  a re-cut at planning time, never a relaxed rule — `phase-contract` stays the
  sole rule owner.
- **Pre-existing repo defect** (not this unit's): `node --test
  scripts/check-skill-context.test.mjs` fails at HEAD and at `f46cf450` because
  `node scripts/check-skill-context.mjs --routes --json` exits 1 (route-budget
  report) while the test expects 0. Disclosed for P5; not fixed here (different
  layer, no owning obligation in this feature).

## Deferred items

Deferred items linked to/destined for issues; never inline scope changes.

- `--json` / machine-readable output mode: deferred to feature 38/42 (SPEC
  Deferred decisions row 2; PD2). No issue opened — tracked by roadmap rows.
- Rule-4 heuristics (`→` chains, enumerated cases, created-file counting) are
  deterministic approximations of "one deliverable"; the corpus pins their
  exact behavior. If a real plan is misjudged, the fix is a corpus-pinned
  refinement of the heuristic, never a plan rewrite by the linter.
