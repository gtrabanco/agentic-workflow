## Merge-readiness contract

Check each gate; cite evidence (file:line, criterion, check name, issue number).
A gate that can't be confirmed is a **blocker**, not a pass — never assume green.

| Gate | What it means | Blocker when |
|---|---|---|
| **Acceptance criteria** | Every SPEC acceptance criterion is satisfied, each mapped to concrete evidence (code, test, or doc). | Any criterion unmet, unverifiable, or silently dropped. |
| **All phases complete** | Feature: every phase in `PLAN.md`/`TASKS.md` is done and logged in `progress.md`. Fix: the SPEC is fully implemented. | Any unchecked task or unimplemented phase without an explicit, tracked deferral. |
| **Scope integrity (creep)** | The PR implements the SPEC and no more; out-of-scope work was split out. | Undocumented scope creep, or in-scope work missing. |
| **Docs updated** | Every "Affected docs" criterion is satisfied; per-phase docs (`progress`/`testing`/`known-issues`/`decisions`) reflect reality; the doc map still resolves. **Never merge with documentation still pending.** | A doc the map or SPEC requires is stale, missing, pending, or contradicts the code. |
| **Traceability** | `Closes #N` is in the PR body when the work is issue-born (from `plan-feature-from-issue` or `plan-fix`); the roadmap/fix-index entry matches, is **still present** (removed only *after* merge, never before), and carries the linked PR reference (`done · [#<pr>](<pr-url>)`). | Issue-born work without `Closes #N`; a roadmap/index entry out of sync; the entry dropped before merge; or a `done` row without its PR link. |
| **Tests** | New behavior is covered at the right layer (prefer integration); acceptance criteria map to tests; no regression-risk tests left red. | New behavior untested, or tests assert nothing meaningful. |
| **Verification gate / CI** | The project's gate passes — type-check, tests, build — and `statusCheckRollup` is green. | Any required check failing, pending, or absent where the project requires one. |
| **Mergeability** | Branch is off the default base, independently mergeable (no conflicts), not stacked on another PR, not draft. | Wrong base, conflicts, stacked dependency, or still draft. |
| **Review axes clean** | The applicable `review-change` axes are clean **or** every remaining finding is *consciously deferred* to a tracked issue with a trigger. | A `fix-now` finding still open, or a deferral with no issue/trigger behind it. |
| **Closure integrity** | The governing **feature** SPEC's capability closure was taken and recorded — `design-feature` was actually run, not bypassed. Fix-governed PRs: `n/a` (no closure block by design). | A present `Capability closure` block has a blank row, or a resolved non-`n/a` row with no matching acceptance criterion. |
| **Scope integrity (descope)** | An issue born during this unit that maps to an unmet SPEC acceptance criterion or phase task has a matching, user-approved, dated `## Amendments` entry — descoped scope was recorded, not silently exported. Detection is two-path: a slug/issue-number text match, **or** an issue linked from an `## Amendments` row (`#89`) — either is sufficient to enumerate the issue, so a descoped issue with a generic title/body is not invisible to the gate. | An issue born since branch divergence that references this unit (by either detection path) maps to an unmet criterion/task with no matching `## Amendments` entry, or an `## Amendments` row that is undated, unapproved, or unlinked to an issue. |
| **Architectural invariants** | Every applicable rule in the optional project invariant document is evidenced as preserved, or has an explicit architectural decision recorded through the project-declared authority. No document is `n/a`, not a blocker. | A rule is violated, introduced, or changed without cited repository evidence and an explicit recorded architectural decision; a SPEC, implementation, or passing test is offered as approval. |

> Run `review-change` for the axis check if it hasn't been run on the final state,
> or read its latest report. Don't re-litigate findings already classified — verify
> each open one is either resolved or has a real, tracked home.
