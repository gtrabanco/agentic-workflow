### Mode B — One loop iteration: `/ship-roadmap --continue [--fullauto]`

Every iteration is stateless-by-reconstruction — no memory is assumed between
turns:

1. **RECOVER.** Read `SHIP_DECISIONS.md` (missing → `SHIP: STOPPED — no run
   policy; run /ship-roadmap first`) and `.ship-run.log` (missing on this
   machine → recreate empty; policy lives in the committed record). **Verify
   the substrate landed:** `SHIP_DECISIONS.md` must exist on the default
   branch — an open `docs/ship-founding` PR means the substrate isn't merged
   yet → `SHIP: BLOCKED` with "merge the founding PR" as the unblock map.
   Read ROADMAP.md; query the forge for open/merged PRs on `feat/*`, `fix/*`,
   `docs/ship-founding` and `docs/ship-report` heads; check git state.
   Reconcile: a feature flips to `done` when its **PR opens** (built, not merged
   — see the PR stage), so a `done` row with an open PR is awaiting a human merge
   (default mode), not finished shipping. A **merged** PR needs no status change
   (already `done`) — it means *shipped*, and **unblocks its dependents** + counts
   toward `SHIP: COMPLETE`. The done-flip rides the PR-bound commit, never a lone
   commit on the default branch. A dirty feature branch from a crashed phase
   is handed to the next phase subagent to finish or restart (counts against
   the red-gate retry cap). Uncommitted changes on the default branch confined
   to `docs/features/<NN-slug>/` + ROADMAP.md that match an in-flight roadmap
   row are the loop's own planning output — resume that feature; the
   dirty-default stop fires only for changes matching no roadmap unit.
2. **STOP-CHECK.** Evaluate the stop conditions (below). Terminal → write or
   refresh the final report, open the report PR, print the `SHIP:` banner +
   status table, end the turn.
3. **SELECT one unit.** Priority order, first match wins:
   1. **Urgency labels first (feature 15, injection-safe).** Read
      `workflow-status`'s `detail.urgent` (labels-only, presence-only —
      never derived from issue text; see `skills/triage-issue/SKILL.md`, the
      sole owner of the `urgent`/`fix-next` vocabulary):
      - Any open issue labeled **`fix-next`** → its fix jumps to the head of
        the queue exactly like a blocking fix below (`plan-fix` →
        `execute-phase --fix`), **no interrupt** of the in-flight unit — it
        waits for the current stage to finish this iteration, then is
        SELECTed next.
      - Any open issue labeled **`urgent`** → run the canonical pause-vs-finish
        rubric in `docs/workflow/ORCHESTRATION.md` **by reference, never
        forked here** — feed it the issue content plus `detail.urgent
        .interruptibility` for the current in-flight unit.
        `INTERRUPT_NOW` → park the in-flight unit (WIP commit + `progress.md`
        note, same as any voluntary park) and SELECT the urgent issue's fix as
        this iteration's unit instead. `FINISH_FIRST` → this iteration
        proceeds normally (steps below); the urgent fix is queued head-of-line
        for the **next** iteration, same as `fix-next`.
      - No `urgent`/`fix-next` issues in `detail.urgent` → fall through to the
        normal priority order below.
   2. **Blocking fixes first.** A fix-index entry classified fix-now whose
      subject blocks the next startable feature (same module, a dependency's
      defect, or a red gate cause) → its fix is the selected unit
      (`plan-fix` → `execute-phase --fix` through the normal stages). Fixes
      that block nothing wait for the report's triage batch.
   3. An in-progress feature's next pending stage.
   4. The next feature at status `idea` **or** `planned` whose depends-on rows
      are all **merged** (forge state, not merely `done` — a `done` dep with
      an open PR isn't on the default branch yet, so a dependent cut from it
      would lack its code). A `defined`-but-not-`planned` row is treated the
      same as `idea` here — its design exists but its planning artifacts
      don't, so it still needs a scaffold pass before PLAN.
      **Verify the closure transitively:** a dep row marked merged whose own
      dependencies aren't merged means the roadmap's statuses are inconsistent
      → `SHIP: STOPPED` (substrate invariant broken), never build on top of it.
      → `idea`/`defined`: DESIGN first (see ADVANCE). `planned`: → REVIEW-SPEC/
         REVIEW-PLAN if its receipt for that stage is missing or stale, else PLAN/EXECUTE
      directly.
   5. **Issue sweep — features exhausted, run NOT over.** Every roadmap feature
      is `done` **and merged** but the sweep hasn't completed → the run
      continues with issues; finishing the features is not finishing the run:
      1. **INVENTORY (once per run, its own iteration).** Enumerate (a) every
         open forge issue and fix-index entry; (b) every *documented residue*
         the run itself generated — each feature's `known-issues.md`, the
         trade-offs in `decisions.md`, and every review report's
         proposals/trade-offs. Residue without an existing issue remains a
         deduplicated **proposal** in the report; the run never creates backlog
         to make inventory look complete. Log existing issue numbers and
         proposal sources separately.
      2. **TRIAGE (compose `triage-issue` in-turn, equal tier).** Classify
         each existing inventoried issue against the CURRENT codebase. fix-now → it
         becomes a selectable unit; postpone / wontfix / promote-to-feature →
         the dated verdict is recorded on the issue and carried into the
         report (promotions and untracked residue become report proposals,
         never in-run scope or automatically-created issues).
      3. **SHIP the fix-now issues** one unit at a time through the normal
         stages (`plan-fix` → REVIEW-PLAN → EXECUTE (`--fix`) → PR → REVIEW → AUDIT), same
         budget caps, floors, and merge policy as features.
   6. Nothing startable → `SHIP: BLOCKED` with the **unblock map** ("merging
      #12 unblocks 05 and 07") and the resume command.

   `execute-phase`'s own dependency gate stays active inside every subagent —
   it's the belt to this braces. **The autopilot never passes `--force`:** a
   gate stop inside a subagent parks the feature with the unmet chain recorded;
   forcing through unmet dependencies is a human-only decision, made outside
   the loop.
