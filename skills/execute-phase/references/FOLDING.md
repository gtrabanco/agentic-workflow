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
✓ Fixes implemented — the batch is the routed findings **plus everything that
  depends on them**: callers of what changes, consumers of what it delivers, and
  every mention that stops being true (a comment, a prose claim, a declared
  validator, a manifest narration). Nothing beyond that
✓ Sweep declaration EMITTED when the change is token- or claim-shaped — the
  fixed line below appended to this fold's `## Log` entry (a legacy unit's
  `## Progress log`). One line per stale form swept, no prose around it, no
  judgment call: a published vocabulary token, a claim kind, a phrase a
  surface asserted, a reader/echo pattern. It is the survivors rule with a
  receipt the gate can re-run:

  ```
  swept: /<pattern>/<flags> → expected <n> in <glob>
  ```

  The field shapes and the bounds the gate enforces on them are stated once, in
  the `sweep-declaration@1` block at the foot of this file — a declaration
  outside those bounds is **refused, not run**, and the failed claim names which
  bound tripped. Name the literal stale form, never a program. A fold that
  changes a token/claim-shaped surface and emits no declaration is a `workflow`
  finding at review.
✓ `bun scripts/promise-coherence.mjs` RUN → `verdict PASS` (the repaired claims
  reproduce at the head; every declared sweep re-runs to its expected count and
  an over-bound pattern is refused by name; a skipped line is read, never
  assumed, and a document whose tally says nothing was machine-checked is not a
  verified green)
✓ Gate RUN and green (exit codes pasted)
✓ Never edit an existing test's expectation to match behaviour — a setup
  repair keeps assertions at least as strong and never touches expectations
✓ Evidence rows updated where the finding touched them, in the unit's own findings
  carrier: a legacy row flipped `folded: no → yes`; a migrated unit's row leaves
  `## Findings` and its fold is a `## Log` `F` line naming the fold commit — that
  carrier has no `folded` column to flip (#308). Either close is the one and only
  state transition, and `ledger-ownership@1` / `fold-findings:folded-flag` is the
  sole writer of it
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
  · REVIEW-FAIL → /fold-findings repairs them; a fresh /review-change follows the fold
  · merge gate after REVIEW-PASS → /audit-pr
```

No auto-merge. Explicit `P<k>` stops after one step; omitted-step mode gates
and commits every remaining step before the same final review.
## Gate-run marks (gate-ran@1)

Every verification gate this cycle runs records a `GATE-RAN` mark at the head it
actually ran — a row in the legacy `review-findings.md`, a `## Log` `G` line for a
re-cut unit (#308):
`GATE-RAN | HEAD <40-hex sha> | <cmds> | exit <code>`. A green run is recorded;
a red run is also recorded (exit code ≠ 0 is evidence, not silence). Any skill
may consume a green mark only at the identical HEAD — a changed head re-runs
the gate. The recorders are `execute-phase:gate-ran-marks` and
`review-change:review-gate-ran-marks` (the shape and ownership live in
`pre-execution-review`'s `LEDGERS.md`, §gate-ran@1).

## Finishing the unit — the last step is always an open PR

When the final triaged step closes: mark the unit done, push the branch, and
open the PR with `gh pr create` (per the project's Workflow conventions) —
regardless of the review still to come. The PR body carries the unit doc's
verification record (its `## Evidence` rows, or a re-cut unit's `## Log` `E`/`G`
lines) and closes the unit's tracked issues via `Closes #N`.

## The sweep declaration grammar

The one statement of the fields the checklist box names. `scripts/promise-coherence.mjs`
parses the line and re-runs it; `AGENTS.md`'s `normative-surfaces@1` inventory
declares this block as the grammar's owner, and the schema package's
`SWEEP_CLAIM_KINDS` const cites it as its home.

```text
sweep-declaration@1
# literal: swept: /<pattern>/<flags> → expected <n> in <glob>
field | shape | bound the gate enforces
pattern | /<the stale form as a JS regex body>/ | at most 200 characters; a group that is quantified while its own body is quantified is refused before it is compiled — one such pattern cost 83 s on a 29-character line, and the gate runs the body once per line of the whole `<glob>` corpus
flags | <a-z, empty allowed> | `g` and `y` are stripped: the gate counts matching lines and carries no lastIndex
expected | <n> | the survivor count outside the exempt surfaces — normally 0; non-zero only where `<glob>` names the surfaces that legitimately keep the form (the ledger's own quote of the finding, log lines, fixtures)
glob | <repo-relative scope> | the finding's cited surface plus its inventory-declared siblings, never a repo-wide sweep
```

Outside a bound the claim fails closed naming which one tripped: a refused
declaration is a red fold gate, not a warning, and the fold names the literal
stale form instead.
