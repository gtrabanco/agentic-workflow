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
- **Pre-existing repo defect, closed by the feature-38 sync** (was not this
  unit's): `node --test scripts/check-skill-context.test.mjs` failed at the
  unit's HEAD (`f46cf450`) for two independent reasons owned elsewhere — the
  stale over-budget fixture (fix #200, `3872fa1a` on `main`) and the repo-wide
  route-budget red (issue #176; fix #200's SPEC declares that half out of its
  scope). The merge with feature 38 brings both: main's feature-38 re-basis plus
  this branch's re-basis #3 (`CHANGELOG.md` 2026-09-12) put the live route set
  green (`PASS route budgets: 22 routes`, `PASS context budgets: 39 skills`) and
  the fixture is green on `main`. Repaired by the sync — no check was weakened
  and no ceiling was raised without a named growth source.
- **A separate unit's planning tree rode into this PR at the close-out (P7
  note; re-cut by the cycle-6 fold F46).** The shared worktree carries
  `docs/fix/214-model-selection-over-24-options/` — a separate unit's planning
  tree, registered `pending` in `docs/fix/README.md`. The post-close-out tip
  commit `585cd583` committed that tree into PR #212 together with the
  `README.md` registration row, so it is neither this unit's work nor a
  reviewed artifact, yet it *is* present in this PR's diff. Resolved by the
  owner (2026-09-14, decisions.md ED12): the tree stays — the fix/214 unit
  continues in its own worktree and its planning docs ride PR #212 as
  disclosed, unreviewed. Every path this unit authored is committed and
  clean — the literal check `git status --porcelain` reports no unit-owned path.
- **The exec-order and triage-report artifacts left the committed tree
  (owner ruling ED13, 2026-09-14).**
  `docs/features/ROADMAP_EXECUTION_ORDER.md` and
  `docs/workflow/TRIAGE_REREPORT_2026-09-13.md` are ruled temporary
  artifacts, not repo docs: both now live locally only, in the gitignored
  `tmp/` folder. Their committed pointers (SPEC.md:71, SPEC.md:302 E10,
  planning-evidence.md:20 PE-007) are stale-by-ruling and remain owned by
  open finding F88's plan re-cut; the ROADMAP.md row-31 pointer was removed
  in the same ruling commit.

## Deferred items

Deferred items linked to/destined for issues; never inline scope changes.

- `--json` / machine-readable output mode: **closed at the `37-plan-6`
  merge-readiness fold (ED8.4a).** Feature 38 shipped (PR #213) and its sensor
  reads `progress.md` receipts, git and the forge — never the linter's stdout —
  so no machine consumer exists and v1 adds no machine surface. SPEC `Deferred
  decisions` row 2 stays frozen inside the SPEC-REVIEW-37-1 binding; the
  closure is recorded plan-side (decision above, PE-011).
- Re-homing feature 38's producer under the crate: feature 38 merged first
  (PR #213) and landed `scripts/workflow-status.mjs` while
  `packages/agentic-workflow` did not exist yet. The vehicle rule stays
  truthful only if that producer moves into the crate in a later unit;
  **recorded follow-up, explicitly not this feature's scope (ED8.4c, PE-011)**
  — destined for its own issue/unit.
- Rule-4 heuristics (`→` chains, enumerated cases, created-file counting) are
  deterministic approximations of "one deliverable"; the corpus pins their
  exact behavior. If a real plan is misjudged, the fix is a corpus-pinned
  refinement of the heuristic, never a plan rewrite by the linter.
