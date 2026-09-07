## Process

1. **Build the queue.** Take every `folded: no` fix-now row, or the explicit ID
   subset, in severity/id order. `replan-in-unit` rows emit `REPLAN`; they stay
   on the same SPEC/branch/PR and never become issues. **Empty batch:** an
   empty queue (zero findings taken) prints a REPAIR-RECEIPT with batch class `none`
   and nothing folded — a receipt only, no flips, no commits.
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
   **Failed gate:** if the group's gate is red, do not fold the group — the
   receipt records the observed gate exit codes and nothing is folded for it;
   never silence the receipt and never commit red.
7. **Batch classification.** The batch class derives from the taken queue's
   frozen rows only, and the fold never reclassifies:

   | Condition over the taken batch | Batch class | Fold behavior |
   |---|---|---|
   | ≥ 1 row with frozen class `replan-in-unit` or `decision-required` | `frozen (replan present)` | **freeze-batch** — nothing folds, no `folded: yes` flips, no commits; the receipt records the REPLAN-ROUTE and every retained (unfolded) row id; the loop stops and routes to planning |
   | all taken rows foldable, none replan-class | `all-repair-in-place` | fold as today (group → fix → gate → commit → flip) |
   | empty queue (zero findings taken) | `none` | receipt only |

   The batch-class vocabulary references only `review-implementation`'s closed
   class set (`CLASSIFY.md`); the receipt invents no parallel vocabulary.

   The emitted branch follows the closing-block decision inputs in the skill:
   a freeze-batch always selects `REPLAN-ROUTE`; otherwise the docs-only
   file-set test (E-D3) and the frozen-severity-`high` override (E-D2) select
   `RE-REVIEW-OPTIONAL` vs `RE-REVIEW-REQUIRED (delta)`.
8. **Disputes.** Non-reproducible/already-fixed/wrong findings become
   `DISPUTED <evidence → user decision>`; never edit classification or create an
   issue.
9. **Replan.** If the smallest correct group exceeds a reviewable correction,
   emit `REPLAN` with proposed phases appended to the same unit. After user
   confirmation, `/execute-phase <unit>` completes them and ticks the rows.
