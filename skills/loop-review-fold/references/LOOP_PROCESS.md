## Review/fold process

1. **Resolve ground truth.** Verify unit docs, branch, open PR, remote-current
   clean tree, PR HEAD, acceptance manifest/receipt, and open ledger rows. Fetch
   forge state; narration is never authority.
2. **Select the first action.** Apply this order exactly:
   - current exact-SHA `review-change:pass` marker + matching acceptance + zero
     open `fix-now` rows → return `PASS` without invoking either skill;
   - no clean current pass receipt (exact SHA, matching acceptance, and zero
     open rows) + any `class: fix-now`, `folded: no` row → invoke
     `fold-findings` first on the complete queue; this is the resume path after
     a failed/interrupted review and must not spend a new review first;
   - no clean current pass receipt + no open fix-now rows → invoke
     `review-change` first on the immutable HEAD.
   A stale or ambiguous pass receipt never suppresses review/fold. The ledger
   queue is a pending correction signal, not evidence that the review passed.
   Retain the selected `first_action` only in the turn state and include it in
   the terminal `Evidence` line; never commit loop state.
3. **Initialize receipts.** Set `seen_heads = []`, `cycles = 0`, and normalize
   open findings as sorted `id:file:axis:severity:route` strings. These values
   may be reconstructed from PR comments + ledger after interruption; do not
   commit loop state and invalidate the candidate.
4. **Review immutable HEAD.** When the selector chooses review, or after a fold
   produces a new HEAD, if HEAD is already in `seen_heads`, return
   `NO-PROGRESS`. Otherwise add it, then invoke `review-change` in a fresh
   context, forwarding `--adversarial N` when present. The conductor receives
   only its fixed report/table/decision, not reviewer raw context.
5. **Route review decision.** `REVIEW-PASS` → verify its exact-SHA receipt and
   zero open rows, then `PASS`. `NEEDS-DECISION` → terminal. `REVIEW-FAIL` →
   continue only when `cycles < max`, by folding its persisted queue.
6. **Fold the queue.** For the selector's fold-first path or after
   `REVIEW-FAIL`, snapshot `before_head` and normalized findings. Invoke
   `fold-findings` on the full unfolded queue in a fresh writer context. It
   forms compatible atomic batches and pushes every commit.
7. **Route fold outcomes.** Any `DISPUTED`/`REPLAN` → `NEEDS-DECISION`; any
   `BLOCKED` with no folded groups → `BLOCKED`. Mixed folded + blocked groups
   increment the cycle, but terminal `BLOCKED` reports what remains rather than
   hiding it.
8. **Prove progress.** Refetch remote HEAD and ledger. No new commit, or same
   normalized open findings with no relevant diff → `NO-PROGRESS`. Otherwise
   increment `cycles` and return to step 4 on the new immutable HEAD. A
   successful fold always reviews the changed HEAD before another fold.
9. **Budget.** A review after the final allowed fold always runs. If it still
   returns `REVIEW-FAIL`, return `BUDGET-EXHAUSTED` with remaining IDs and the
   last compact evidence. Never silently add a cycle.

At no point run a merge command or create an issue. Independent proposals stay
in the review report for explicit user batch triage.
