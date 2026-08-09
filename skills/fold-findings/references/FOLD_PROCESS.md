## Process

1. **Build the queue.** Take every `folded: no` fix-now row, or the explicit ID
   subset, in severity/id order. `replan-in-unit` rows emit `REPLAN`; they stay
   on the same SPEC/branch/PR and never become issues.
2. **Form the fewest atomic correction groups.** Findings may share one group
   only when all boxes pass:

   - one root cause or one homogeneous mechanical correction owns them;
   - one validator set proves every member fixed;
   - they can ship and roll back together without partial correctness;
   - no member needs a separate product/architecture decision or stronger
     release sequence;
   - the combined diff remains reviewable and inside the current unit.

   Shared files are neither required nor sufficient. A cross-file auth repair
   may group; two unrelated nits in one file may not. Record each group's IDs,
   shared cause, validators, and rollback boundary before editing.
3. **Repair one group at a time.** Diagnose the shared cause, implement the
   smallest complete correction, and add/update regression coverage for every
   behavioral member. Use the strongest tier required by the most subtle member.
4. **Verify.** Run the group's validators plus the normal project gate. Red →
   continue repairing only this group. Same failure with no diff twice →
   `BLOCKED NO-PROGRESS`; never commit red or weaken a check.
5. **Persist atomically.** Flip every group row `folded: no → yes`; stage the
   group diff + ledger; commit:

   ```text
   fix(<scope>): fold <F1+F2+…> — <shared correction>
   ```

   If the PR is open, push immediately. Emit one `FOLDED <same-sha>` line per
   member so no finding disappears inside the batch.
6. **Continue groups.** A blocked/disputed group does not prevent independent
   groups from folding. Leave its rows `no` and emit individual outcomes.
7. **Disputes.** Non-reproducible/already-fixed/wrong findings become
   `DISPUTED <evidence → user decision>`; never edit classification or create an
   issue.
8. **Replan.** If the smallest correct group exceeds a reviewable correction,
   emit `REPLAN` with proposed phases appended to the same unit. After user
   confirmation, `/execute-phase <unit>` completes them and ticks the rows.
