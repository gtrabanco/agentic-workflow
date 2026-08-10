## Loop policy and terminal states

### Invariants

- Candidate identity is remote PR HEAD + frozen acceptance blob.
- Reviewer contexts are fresh, read-only, and receive only the immutable diff,
  acceptance manifest, applicable reviewer contracts, and project rules.
- Folder contexts may write but never reclassify, weaken acceptance/tests, or
  create backlog.
- A valid current-HEAD `REVIEW-PASS` receipt is authoritative: return PASS
  without reopening review for identical bytes.
- Default correction budget is two; budget counts mutating fold passes.
- Same HEAD may never enter review twice in one run. Same normalized open
  finding set after a fold with no new commit is NO-PROGRESS.

Counters are mechanical: reusing a current receipt adds `0` reviews and `0`
cycles; invoking `review-change` adds one review; a fold adds one cycle only
after it produces and pushes a relevant new HEAD. A no-commit/no-op fold stops
`NO-PROGRESS` without incrementing the cycle. Replace every output placeholder;
blank IDs, counters, states, evidence, arrays, or strings are invalid.

### Terminal states

- `PASS` — current exact-SHA receipt exists; acceptance blob matches; zero open
  fix-now rows.
- `NEEDS-DECISION` — review/fold requires product, architecture, manifest
  amendment, dispute resolution, or replan confirmation.
- `BLOCKED` — required command/input/environment/PR state is unavailable.
- `NO-PROGRESS` — HEAD did not change after a correction attempt, or the same
  failing evidence repeated with no diff.
- `BUDGET-EXHAUSTED` — the post-final-fold review still fails after the declared
  correction budget.

`REVIEW-FAIL` is an intermediate state only while a correction cycle remains.

### First-match transition table

| Observed state | Return |
|---|---|
| current exact-SHA pass receipt + matching acceptance + zero open rows | `PASS` (reviews 0, cycles 0) |
| review/fold needs a product, architecture, manifest, dispute, or replan choice | `NEEDS-DECISION` |
| fold produces no new HEAD, or repeats the same findings without relevant diff | `NO-PROGRESS` (do not increment cycle) |
| required command/input/environment is unavailable | `BLOCKED` |
| review fails after the final allowed fold | `BUDGET-EXHAUSTED` |
| review fails and a correction cycle remains | intermediate `REVIEW-FAIL`; fold, then continue |
| current review passes with zero open rows | `PASS` |

Never return generic `FAIL`; it is not a terminal state.

### Fixed terminal output

```text
LOOP REVIEW FOLD — <PASS|NEEDS-DECISION|BLOCKED|NO-PROGRESS|BUDGET-EXHAUSTED>
Unit: <unit> · PR: <url> · HEAD: <sha>
Acceptance: <blob> (<match|mismatch>)
Reviews: <n> · Correction cycles: <used>/<max>
Open findings: <F1 + F2 + …|none> · Receipt: <current sha|none>
Evidence: <one concise line>

→ Next: <terminal mapping; repeat every affected finding ID once, joined with ` + `>
  · PASS → /audit-pr — delivery/merge gate
  · NEEDS-DECISION (<F1> + <F2> + …) → resolve all named decisions, then re-run /loop-review-fold <unit>
  · BLOCKED (<F1> + <F2> + …) → supply/fix all named prerequisites, then re-run the same command
  · NO-PROGRESS (<F1> + <F2> + …) → inspect all repeated findings; use an explicit stronger-model fold or decide
  · BUDGET-EXHAUSTED (<F1> + <F2> + …) → inspect all remaining findings; raise the budget only with a concrete correction hypothesis
```

Print only the matching recommended line first; retain the other applicable
alternatives as sub-bullets. Replace placeholders with every actual finding ID
before printing; never print a literal placeholder or ellipsis. Never recommend
audit on a non-PASS state.
