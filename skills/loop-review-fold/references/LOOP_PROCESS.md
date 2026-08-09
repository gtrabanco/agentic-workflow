## Review/fold process

1. **Resolve ground truth.** Verify unit docs, branch, open PR, remote-current
   clean tree, PR HEAD, acceptance manifest/receipt, and open ledger rows. Fetch
   forge state; narration is never authority.
2. **Reuse before spending.** If the newest valid `review-change:pass` marker
   matches PR HEAD, acceptance matches, and no open fix-now rows exist, return
   `PASS` without invoking a reviewer.
3. **Initialize receipts.** Set `seen_heads = []`, `cycles = 0`, and normalize
   open findings as sorted `id:file:axis:severity:route` strings. These values
   may be reconstructed from PR comments + ledger after interruption; do not
   commit loop state and invalidate the candidate.
4. **Review immutable HEAD.** If HEAD is already in `seen_heads`, return
   `NO-PROGRESS`. Add it, then invoke `review-change` in a fresh context,
   forwarding `--adversarial N` when present. The conductor receives only its
   fixed report/table/decision, not reviewer raw context.
5. **Route review decision.** `REVIEW-PASS` → verify its exact-SHA receipt and
   zero open rows, then `PASS`. `NEEDS-DECISION` → terminal. `REVIEW-FAIL` →
   continue only when `cycles < max`.
6. **Fold the queue.** Snapshot `before_head` and normalized findings. Invoke
   `fold-findings` on the full unfolded queue in a fresh writer context. It
   forms compatible atomic batches and pushes every commit.
7. **Route fold outcomes.** Any `DISPUTED`/`REPLAN` → `NEEDS-DECISION`; any
   `BLOCKED` with no folded groups → `BLOCKED`. Mixed folded + blocked groups
   increment the cycle, but terminal `BLOCKED` reports what remains rather than
   hiding it.
8. **Prove progress.** Refetch remote HEAD and ledger. No new commit, or same
   normalized open findings with no relevant diff → `NO-PROGRESS`. Otherwise
   increment `cycles` and return to step 4 on the new immutable HEAD.
9. **Budget.** A review after the final allowed fold always runs. If it still
   returns `REVIEW-FAIL`, return `BUDGET-EXHAUSTED` with remaining IDs and the
   last compact evidence. Never silently add a cycle.

At no point run a merge command or create an issue. Independent proposals stay
in the review report for explicit user batch triage.
