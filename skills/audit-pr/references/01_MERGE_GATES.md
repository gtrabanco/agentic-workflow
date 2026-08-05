## Merge-readiness contract

Check each gate; cite evidence (file:line, criterion, check name, issue number).
A gate that can't be confirmed is a **blocker**, not a pass — never assume green.

| Gate | What it means | Blocker when |
|---|---|---|
| **Acceptance coverage** | The receipt's acceptance-coverage field accounts for every SPEC acceptance criterion (review-change verified the mapping). This gate confirms the receipt *names* the criteria — it never remaps diff hunks to criteria itself. | The receipt omits a criterion the SPEC lists, or its coverage field is absent/generic. |
| **All phases complete** | Feature: every phase in `PLAN.md`/`TASKS.md` is done and logged in `progress.md`. Fix: the SPEC is fully implemented. | Any unchecked task or unimplemented phase without an explicit, tracked deferral. |
| **Scope integrity (creep)** | The PR implements the SPEC and no more; out-of-scope work was split out. | Undocumented scope creep, or in-scope work missing. |
| **Docs updated** | Every "Affected docs" criterion is satisfied; per-phase docs (`progress`/`testing`/`known-issues`/`decisions`) reflect reality; the doc map still resolves. **Never merge with documentation still pending.** | A doc the map or SPEC requires is stale, missing, pending, or contradicts the code. |
| **Traceability** | `Closes #N` is in the PR body when the work is issue-born (from `plan-feature-from-issue` or `plan-fix`); the roadmap/fix-index entry matches, is **still present** (removed only *after* merge, never before), and carries the linked PR reference (`done · [#<pr>](<pr-url>)`). | Issue-born work without `Closes #N`; a roadmap/index entry out of sync; the entry dropped before merge; or a `done` row without its PR link. |
| **Verification gate / CI** | The project's gate passes — type-check, tests, build — and `statusCheckRollup` is green at the current head. | Any required check failing, pending, or absent where the project requires one. |
| **Mergeability** | Branch is off the default base, independently mergeable (no conflicts), not stacked on another PR, not draft. | Wrong base, conflicts, stacked dependency, or still draft. |
| **Review receipt** | A current `REVIEW-PASS` receipt is posted on the PR: the newest comment carrying `<!-- review-change:pass sha=<40-hex> contract=v1 -->` whose `sha` equals the PR's current head SHA. Its scope/axes, acceptance coverage, invariant result, and manual checks are the review evidence this audit consumes. | Receipt absent, or its marker `sha` predates the current head (any later commit voids it). The blocker routes to `/review-change`; never re-review the diff from here (AC 13). |
| **Closure integrity** | The governing **feature** SPEC's capability closure was taken and recorded — `design-feature` was actually run, not bypassed. Fix-governed PRs: `n/a` (no closure block by design). | A present `Capability closure` block has a blank row, or a resolved non-`n/a` row with no matching acceptance criterion. |
| **Scope integrity (descope)** | An issue born during this unit that maps to an unmet SPEC acceptance criterion or phase task has a matching, user-approved, dated `## Amendments` entry — descoped scope was recorded, not silently exported. Detection is two-path: a slug/issue-number text match, **or** an issue linked from an `## Amendments` row (`#89`) — either is sufficient to enumerate the issue, so a descoped issue with a generic title/body is not invisible to the gate. | An issue born since branch divergence that references this unit (by either detection path) maps to an unmet criterion/task with no matching `## Amendments` entry, or an `## Amendments` row that is undated, unapproved, or unlinked to an issue. |
| **Architectural invariants** | The **receipt** records the invariant result review-change took against the optional project invariant document; this gate confirms that result is explicit (`pass | blocker | n-a`) and does not reclassify it (AC 13). No document → `n/a: no project invariants declared`, not a blocker. | The receipt's invariant result is absent/ambiguous, or a recorded `blocker`/`violates`/`introduces`/`changes` lacks the cited decision the review surfaced. |

> The review evidence is the receipt, never a re-review: verify the newest
> `review-change:pass` marker's `sha` against the PR's head (Step 1). A current
> receipt passes this gate regardless of its axes' content — the audit consumes,
> it does not re-litigate. A missing or stale receipt is a blocker routed to
> `/review-change`.
