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
into a branch that already has an open PR, the fold is complete **only** when
every step below ran — fixing the code and stopping is the classic way findings
end up "solved" locally but absent from the merged PR:

```
✓ Fixes implemented (scope: only the routed findings — nothing extra)
✓ Gate RUN and green (exit codes pasted)
✓ Per-phase / unit docs updated where the finding touched them
  (known-issues.md entry resolved? progress.md notes the fold)
✓ Each folded finding's row in the unit's `review-findings.md` ledger (if one
  exists — the ledger is optional; a unit with no fix-now findings has none)
  flipped `folded: no → yes` — the one and only ledger state transition, owned
  solely by this fold cycle
✓ `git add` + `git commit` RUN (sha pasted) — e.g.
  `fix(<scope>): fold review findings — <summary>`
✓ `git push` RUN (PR is open → every commit pushes immediately)
✓ `git status --porcelain` RUN → empty; `git status -sb` → not ahead of remote
```

Then hand back to the gate that sent you (`/review-change` re-review, or
`/audit-pr` re-audit). Never report findings as resolved while any box is
unchecked — an unpushed fix does not exist for CI, the reviewer, or the merge.

Final-phase / single-pass / fix hand-off:

```
<unit> implemented, gate green, marked done.
PR opened: <FULL PR URL — always printed here; not every agent shows open PRs>
Roadmap/fix-index row: done · #<n> (linked and pushed)
→ Next: /review-change (mandatory final review)
  · clean    → /audit-pr (merge gate) → human merges
  · findings → fold fix-now into this PR; non-fix-now → /triage-issue; re-review
  · docs site declared (documentation map has a `Docs site` block) →
    /generate-docs <unit> — document what this unit changed; the generated
    pages ride this same PR (commit + push them before the merge gate)
```

The `/generate-docs` line appears **only** when the project's documentation
map declares a `Docs site` block — never suggest it otherwise (a project
without a docs site has nowhere to publish).

This never auto-merges and never skips the per-phase stop: one phase at a time,
human in the loop, gate enforced each phase, every unit reviewed before merge.

### Marking done (status semantics)

A unit flips to **`done` when its last step runs — opening the PR — even though it
isn't merged yet.** `done` means *built and PR-open*; merge state lives in the forge
(the open/merged PR), not in the status. **A `done` row always carries its PR
reference** — `done · [#<pr>](<pr-url>)` — added right after `gh pr create`
returns the URL (follow-up `docs: link PR #<n>` commit on the same branch);
`done` without a PR link is the tell-tale of an unfinished close-out. The flip is a doc change, so it rides the
PR-bound commit (never a lone commit on the default branch). **Never merge with docs
still pending, and never drop the issue / fix-index entry before merge** — those are
`audit-pr`'s gates, not removed at done-time.

**One phase = one session.** Never execute two phases in one conversation on a
non-frontier model — models degrade over long horizons; a fresh session per
phase preserves the cheap-execution guarantee. The `/loop` batch shape below
already clears and re-invokes per phase; this rule is *why* it does — an
external orchestrator or a by-hand loop must honor it the same way (see
*Portability*, "No `/loop`").

