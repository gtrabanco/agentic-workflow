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
   | ≥ 1 row with frozen class `replan-in-unit` or `decision-required` | `frozen (replan present)` | **freeze-batch** — nothing folds, no `folded: yes` flips, no commits; the receipt records the REPLAN-ROUTE and every retained (unfolded) row id; the loop stops; the consumer is the conclusion printed by `node scripts/unit-route.mjs <unit>` (discovery step the fold already ran), where `<unit>` is the bare folder number or the full slug (both resolve): on `route: replan` the planner command the router printed — `/unit-lane <slug>` (feature) or `/unit-lane --fix <n>` (fix) — the lane appends the phases and its `review` step gates, then `/execute-phase` on this unit; on `route: decision` stop and surface the decision to the user, never a planner |
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
   run `node scripts/unit-route.mjs <unit>` — its `route: replan` line prints the
   planner command (`/unit-lane <slug>` for a feature, `/unit-lane --fix <n>` for
   a fix) that appends the proposed
   phases to the unit's SPEC. The `<unit>` argument accepts the bare folder number
   or the full slug (both resolve). After the user confirms and the lane's
   `review` step passes, `/execute-phase <unit>` completes them and ticks
   the rows. When the router concludes `route: decision` instead — a
   `decision-required` row with no replan row — stop and surface the decision to
   the user; no planner runs until the user decides.

The closing-block `· ` sub-bullets are exactly one physical line — never
hard-wrapped across several lines, never joined into one prose line.

## REPAIR-RECEIPT — fixed printed block (verbatim copy)

Printed after the per-finding table and tally, as part of the ABSOLUTE-last
output together with the branching `→ Next:` block. Six fields, always
present:

```text
## REPAIR-RECEIPT
- Repaired: <F-ids with (VF-<n>) refs, joined ` + `, or `none`>
- Refuted/open: <F-ids joined ` + `, or `none`>
- Gate: <command> → exit <n> at head <40-hex sha> · n/a when nothing was folded
- Batch class: <all-repair-in-place | frozen (replan present) | none>
- Fold diff: <shortstat from a real `git diff` run> · none when nothing was folded
- Branch: <RE-REVIEW-REQUIRED (delta) | RE-REVIEW-OPTIONAL | RE-REVIEW-SKIPPED | REPLAN-ROUTE>
```
