### Folding review / audit findings (a first-class mini-cycle)

**`/fold-findings` is the standalone skill for this cycle** — it carries the
full frozen-classification rule and forbidden list (no known-issues dump, no
severity downgrade, no test loosening, no suppression-as-fix) as a fixed,
independently-invocable contract; prefer it as a fresh hand-off (its own
turn, its own model/effort) whenever one is available. The checklist below is
the in-context / portability fallback for folding inline within this skill's
own turn (e.g. no slash-command menu, or an agent that folds without leaving
its current context).

When `review-change` findings (fix-now) or `audit-pr` blockers are folded back
into a unit branch that already has an open PR, the fold is complete **only**
when every step below ran — fixing the code and stopping is the classic way
findings end up "solved" locally but absent from the merged PR:

```
✓ Fixes implemented (scope: only the routed findings — nothing extra)
✓ Gate RUN and green (exit codes pasted)
✓ Never edit an existing test's expectation to match behaviour — a setup
  repair keeps assertions at least as strong and never touches expectations
✓ Evidence rows updated where the finding touched them (the finding's row
  in the unit doc's Evidence ledger flipped `folded: no → yes` — the one and
  only state transition, `ledger-ownership@1` / `fold-findings:folded-flag`
  is the sole writer)
✓ Progress log advanced with a dated entry noting the fold
✓ `git add` + `git commit` RUN (sha pasted) — e.g.
  `fix(<scope>): fold review findings — <summary>`
✓ `git push` RUN (PR is open → every commit pushes immediately)
✓ `git status --porcelain` RUN → empty; `git status -sb` → not ahead of remote
```

Then hand back to the gate that sent you (`/review-change` re-review, or
`/audit-pr` re-audit). Never report findings as resolved while any box is
unchecked — an unpushed fix does not exist for CI, the reviewer, or the merge.

## Closing recommendation (printed after step or unit complete)

```
✓ Step executed, Evidence rows updated, Progress log advanced
✓ Gate green (or red-gate repaired within --max-attempts)
✓ Unit doc committed clean

→ Next: /unit-lane <NN-slug> — the conductor continues
  · all steps done → /review-change (mandatory end review)
  · REVIEW-FAIL → /fold-findings, then re-run /review-change
  · merge gate after REVIEW-PASS → /audit-pr
```

No auto-merge. Explicit `P<k>` stops after one step; omitted-step mode gates
and commits every remaining step before the same final review.