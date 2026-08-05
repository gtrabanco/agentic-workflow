## Verdict format

```
PR #<N> — <title>
URL: <full PR URL — always printed; the user works across several projects
     and not every agent shows a CI monitor or PR list>
Base: <default> ← Head: <branch> @ <head SHA>   CI: <green|failing|pending>

VERDICT: MERGE-READY | BLOCKED (<count> blockers)

Blockers (ranked):
  1. [<gate>] <what's wrong> — evidence: <file:line | check | criterion>
     → fix: <smallest action to clear it> (<route>)
  ...

Warnings (non-blocking — never change the verdict):
  - design-debt: closure absent, SPEC predates the rule (dated <YYYY-MM-DD>)

Non-blocking nits:
  - <minor item> — <pointer>

Before merge, a human should still verify:
  - <manual-verification item from the review-change receipt>

→ Next:
  Print the ONE verdict bullet that matches, THEN — if a closure warning fired —
  also print the closure bullet (a warning never blocks, so it co-occurs with a
  MERGE-READY verdict; the two lines print together, never one instead of the other):
  · MERGE-READY, standalone/manual audit → you merge: <full PR URL>, then
    /plan-feature --next (the next roadmap unit) or pick an issue with /triage-issue
  · MERGE-READY inside active ship-roadmap --fullauto → return this SHA-bound
    verdict to the conductor; it runs the transient merge wrapper
  · BLOCKED → clear the top blocker (routed above), then re-run /audit-pr
  · Receipt absent/stale blocker → /review-change (re-review at the head), then
    re-run /audit-pr — never re-review from this audit
  · Closure warning (in addition to the verdict above) or a closure blocker →
    /design-feature <slug> — fills the missing closure rows (upsert, destroys
    nothing) before further work on this feature is planned; re-run /audit-pr after
  · Scope-bleed blocker → record the missing `## Amendments` entry (user-approved,
    dated, linking the issue) in the governing SPEC, or re-classify the issue as
    genuinely discovered work via /triage-issue; re-run /audit-pr after
```

If MERGE-READY, omit the blocker list and state it plainly: nothing blocks merge.
The `→ Next:` block is always printed — on MERGE-READY it repeats the **full PR
URL** (merge it yourself, or the merged link) and points the user at the next
concrete unit so a finished feature never dead-ends at the merge.

Example (generic — substitute your project's numbers and gates):

```
PR #142 — Add CSV export to the reports view
Base: main ← Head: feat/14-csv-export   CI: green

VERDICT: BLOCKED (2 blockers)

Blockers (ranked):
  1. [Tests] Export handler has no test — acceptance criterion "export
     round-trips the rows" is unverified
     → fix: add an integration test for the handler (fold into the current phase)
  2. [Traceability] PR body is missing `Closes #131` for issue-born work
     → fix: add `Closes #131` to the PR body (execute-phase)

Non-blocking nits:
  - Help text wording diverges from the other commands — docs/USAGE.md

Before merge, a human should still verify:
  - The exported file opens cleanly in a spreadsheet app (visual)
```
