## Small/phased mode workflow

**Phased single-pass units — the default for small (XS/S) feature SPECs.**
Every XS/S feature SPEC drafted since `plan-feature-scaffold` 1.8.0 carries a
`## Phases` section (**≥ 2 phases**; the final one is always
`Hardening & PR`). When the SPEC has it, run **one phase per invocation**:
`execute-phase <NN> [P<k>]` — `P<k>` omitted → the **first phase with an
unticked task** (deterministic; no judgement). The SPEC's checkboxes are the
execution ledger (there is no `TASKS.md`): tick each task with evidence.

**Resuming an interrupted phase (stated contract — any agent must honor it).**
If, on entry, the unit branch already carries dirty files or commits belonging
to the requested phase (a prior run died mid-turn — e.g. the driver process
restarted), do **not** restart the phase from scratch: reconcile against the
SPEC's checkboxes first — verify each ticked task's evidence actually exists
(code path / test present), untick any tick without evidence, then continue
from the first unticked task. Idempotent re-entry is the contract
`workflow-status`'s crash-recovery verdict `RESUMABLE` relies on. If the ledger
contradicts the commits in a way that has no unique next task, stop and report
instead of guessing (that is its `AMBIGUOUS` verdict — a human decides).

Each phase appends its handoff entry to a `progress.md` beside the SPEC
(created on P1 — see *Phase handoff record*). An implementation phase runs the
per-phase steps below but **STOPs after the phase commit — no push, no PR**
(the per-phase stop and the turn contract's box 5 "unit not finished" rule).
The final `Hardening & PR` phase runs the close-out — the mode's "Mark done +
open the PR" step — **in its own invocation**: its pre-written tasks ARE the
close-out chain; execute them literally, in order.

Per-phase steps (implementation phases only):

1. Verify branch.
2. Read `SPEC.md` (+ `DECISIONS.md` if present) and the docs its documentation map points to.
3. If the SPEC is ambiguous on scope / edge cases / UI, ask first — one question at a time, nothing it already answers.
4. Implement end-to-end (see *Implementation guidance*).
5. Run the gate; write `CHECKLIST.md` (below).
6. Stage and commit: `git add <changed files>` then `git commit -m "<type>(<scope>): <summary>"`. **STOP** — no push, no PR until the final phase.

A SPEC **without** `## Phases` (drafted before those versions) runs the
**legacy single-pass flow** unchanged, end-to-end in one pass — see
[legacy workflow](WORKFLOWS_LEGACY.md).
