## Feature mode workflow

**Atomic feature phase** — `docs/features/<NN>-<slug>/`. An explicit `P<n>`
runs this once; whole-unit mode calls it once per remaining phase.

1. Verify branch (create if on `main`). **P1 only:** if the planning artifacts
   (`docs/features/<NN>-<slug>/`) are still uncommitted, commit them first on the
   feature branch — `git add docs/features/<NN>-<slug> && git commit -m "docs(<NN>-<slug>): planning artifacts"` —
   so planning history stays separate from implementation.
2. Read `progress.md` first (the phase handoff record — fixed schema above;
   the last entry's `Remains:`/`Gotchas:` lines are the previous phase's
   message to you), then `SPEC.md` + the requested phase's `TASKS.md`
   section. That is the whole handoff — never rely on session memory from a
   previous phase, and honor the *Context budget* for everything beyond
   these files.
3. Implement only that phase (see *Implementation guidance*).
4. Run the gate (type-check, tests, build). **If red:** fix within the phase's
   scope and re-run — never commit red. If the failure can't be fixed within
   this phase's scope, record it in `known-issues.md`, leave the work
   uncommitted, and stop with a clear report.
5. Update the per-phase docs.
6. Stage and commit: `git add <changed files>` then `git commit -m "<type>(<scope>): <summary>"` — one commit per phase, conventional format. Run this; don't just describe what should be committed.
7. **Explicit-phase mode only:** check the review checkpoint triggers and make
   the existing non-blocking recommendation when one fires. Whole-unit mode
   records the trigger in its phase receipt and continues; it never interrupts
   for an intermediate review. The end review stays mandatory.

**Resuming an interrupted phase (stated contract — any agent must honor it).**
If, on entry, the unit branch already carries dirty files or commits belonging
to the requested phase (a prior run died mid-turn — e.g. the driver process
restarted), do **not** restart the phase from scratch: reconcile against
`TASKS.md` first — verify each ticked task's evidence actually exists (code
path / test present), untick any tick without evidence, then continue from the
first unticked task. Idempotent re-entry is the contract `workflow-status`'s
crash-recovery verdict `RESUMABLE` relies on. If the ledger contradicts the
commits in a way that has no unique next task, stop and report instead of
guessing (that is its `AMBIGUOUS` verdict — a human decides).
