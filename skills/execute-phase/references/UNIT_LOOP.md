## Whole-unit execution loop

This route runs only when the user omitted `P<n>`. One user invocation advances
every remaining planned phase; phase boundaries still own scope, gates,
documentation, and commits.

### Dispatch

- `execute-phase <NN>` → all remaining feature phases.
- `execute-phase --fix <n>` → all remaining fix phases.
- An explicit `P<n>` never loads this route and executes exactly one phase.
- Default `--max-attempts 3` limits repair attempts for the same unchanged gate
  failure inside one phase. A positive user value overrides it.

### Queue

Read the unit ledger once and select unfinished phases in ascending order. A
phase is unfinished when any task is unticked or its evidence/commit is absent.
Reconcile ticks against repository evidence before selection; contradictory
state with no unique next phase returns `AMBIGUOUS` and stops.

Materialize the queue before work as explicit phase IDs (`P2, P3, P4`), never
an empty array, ellipsis, or template placeholder. Every terminal report names
the phases actually attempted/completed.

The final `Hardening & PR`/close-out phase remains last. Never run it while an
earlier phase is unfinished.

### Loop — one transaction per phase

For each queued phase:

1. Recompute the frozen `ACCEPTANCE.md` blob and compare it with the acceptance
   receipt. Mismatch/missing → `ACCEPTANCE GATE BLOCKED`; no edits.
2. Run phase-lint, architectural-invariant, dependency/own-status fast paths,
   and the selected mode workflow for this phase. A fail-closed gate ends the
   whole invocation with its existing fixed block.
3. Prefer a fresh worker context when the host supports subagents/headless
   workers; give it only `ACCEPTANCE.md`, `SPEC.md`, this phase's tasks, the last
   `progress.md` receipt, and the selected workflow contracts. The conductor
   keeps receipts, never raw source context. Without that primitive, execute
   inline and apply the same input cap.
4. Implement the phase, run its exact validators and normal project gate, update
   unit docs, and commit. Never commit red and never weaken a validator.
5. On a red gate, feed back only the failing command, exit status, failing test
   names, and smallest relevant output. Repair the same phase and retry. Same
   failure with no diff twice, or `--max-attempts` exhausted, stops:

   ```text
   UNIT LOOP — <unit> BLOCKED at <P<n>>
   Reason: <NO-PROGRESS|ATTEMPT-BUDGET> · Attempts: <n>
   Last validator: <command> → <exit/status + compact failure>
   Preserved: no red commit; acceptance blob <sha> unchanged

   → Next: inspect the named blocker, then re-run /execute-phase <unit>
     · architecture/product decision required → resolve it before resuming
     · continue atomically → /execute-phase <unit> <P<n>>
   ```

6. Before the commit append a compact cycle receipt to `progress.md`:

   ```text
   ## Unit-loop receipt — <P<n>>
   - Commit: pending · Gate: <command> (exit 0) · Acceptance blob: <sha>
   - Next: <P<n+1>|close-out|none> · Attempts: <n>
   ```

   Commit it with the phase, then replace `pending` with the resulting SHA in
   the next phase's reconciliation note (never amend an already-published
   commit only to self-reference it). Reduce working state to the receipt.
7. Do **not** stop for intermediate review checkpoint triggers. Record any
   trigger in the receipt for final risk selection; the mandatory independent
   end review covers the frozen final candidate once.

### Terminal

When the last implementation phase is green, run the existing close-out phase:
mark done, push, open/link the PR, and leave the branch remote-current. Then:

```text
UNIT LOOP — <unit> COMPLETE
Phases: <n> · Commits: <sha list> · Acceptance: <blob> · Gate: PASS
PR: <url>

→ Next: /loop-review-fold <unit> — select the persisted review/fold route, then triage or replan unresolved findings
  · manual path → /review-change, then /fold-findings and re-review as required
  · merge gate after REVIEW-PASS → /audit-pr
```
