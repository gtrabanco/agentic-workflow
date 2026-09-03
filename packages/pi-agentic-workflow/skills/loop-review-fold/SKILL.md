---
name: loop-review-fold
user-invocable: true
version: 4.0.0
argument-hint: <NN> | --fix <issue-number>
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Run the simple review-change/fold-findings loop for an open feature or fix
  unit. Inspect persisted review evidence first so a previous review resumes
  with fold-findings instead of reviewing the same candidate again. Unresolved
  findings go to triage-issue with an immediate-fix instruction; oversized
  findings become a user-confirmed plan-feature or plan-fix replan with new
  phases. Triggers: "loop-review-fold", "review and fold this PR", "run the
  review fold loop".
---

# Review / Fold Loop

Run one small state loop over the current feature or fix unit:

```text
review-change ── findings ──▶ fold-findings ── changed HEAD ──▶ review-change
       ▲                              │
       └──────── current PASS ◀───────┘
                                      └─ unresolved ─▶ triage-issue
```

This skill is a router, not a third review or repair implementation. It reads
the durable evidence left by `review-change` and `fold-findings`, chooses the
next action, and stops when a user decision or manual phase execution is
required. Never merge, create an unrelated issue, or silently discard a
finding.

## Turn contract

```text
✓ The feature/fix unit, branch, PR, current HEAD, acceptance, and finding ledger were checked
✓ The first action was selected from persisted evidence: PASS, review-change, or fold-findings
✓ review-change ran only when no current review result required fold-findings first
✓ A successful fold was followed by review-change on the new HEAD
✓ Every unresolved finding is named and routed to triage-issue --prioritize-now
✓ An oversized finding routes to plan-feature or plan-fix, new P<n> phases, and manual user execution
✓ No merge, unrelated issue, acceptance weakening, or silent finding drop occurred
✓ The fixed result and the closing → Next: block are the final output
```

Any unchecked box means the turn is not done.

## When to use

Use after `execute-phase` opens the unit PR, or when the user asks to review and
fold an open feature or fix. The argument identifies the unit:

- `/loop-review-fold <NN>` for a feature unit.
- `/loop-review-fold --fix <issue-number>` for a fix unit.

Do not use this entrypoint to edit this skill, inspect its implementation as the
requested deliverable, or invent a target when the unit argument is missing.

## Step 0 — Discover the project (always first)

Read the target project's agent guide and documentation map. Then verify the
target unit, current branch, open PR, remote HEAD, frozen acceptance artifact,
the latest `review-change` result/receipt, and the unit's `review-findings.md`.
Use repository and forge commands required by the project's own conventions.
Narration, an old chat result, or a clean worktree alone is not evidence.

If the target, PR, acceptance, or ledger cannot be verified, stop with
`BLOCKED` and name the exact missing input and recovery command. Do not create
replacement artifacts in this router.

## Process

Apply this first-match table exactly:

| Persisted state on the current HEAD | First action |
|---|---|
| Exact current `REVIEW-PASS`, matching acceptance, and no open finding rows | `PASS`; do not run either skill |
| A review result exists for this HEAD and it leaves any `folded: no` row | `fold-findings` on the complete open queue |
| No usable current review result and no open queue | `review-change` on the current HEAD |

Then continue as follows:

1. Run the selected skill in its own fresh context and follow that skill's
   contract literally. This loop does not copy its internal checklist.
2. If `review-change` returns `REVIEW-PASS`, verify its exact-HEAD receipt and
   zero open rows, then return `PASS`.
3. If `review-change` returns findings, run `fold-findings` for every open
   `fix-now` row. Do not start another review before that queue is processed.
4. If `fold-findings` changes and pushes the candidate, run `review-change` on
   that new HEAD. Never review an unchanged HEAD a second time.
4a. Before step 5, split the open queue by **owning stage** (the `route` cell each
    `review-change` finding carries: `product | plan | source | environment |
    runtime`). Only `source`, `environment` and `runtime` rows may be folded or
    triaged here. A `plan`-owned row stops the loop with `BLOCKED` and hands off to
    `/plan-feature <unit>` (fix: `/plan-fix <n>`) for one root-caused re-cut, then
    `/review-plan <unit>`; a `product`-owned row goes to `/design-feature <unit>`
    then `/review-spec <unit>`. Folding repairs the candidate; it cannot repair the
    authority that describes it, so never fold a row whose artifact of record is a
    planning document, and never send one to `triage-issue` to make it disappear.
4b. On entering a **second** local review→fold cycle for the same finding family,
    diagnose before editing again: emit the `CONVERGENCE-ANOMALY` report defined by
    `pre-execution-review` (repeated vs new ids, snapshot digest and
    `artifactRevisionId` move, what was missed, owning stage, why the prior
    repair failed, route to owner) and continue from the owner it names. A third
    blind edit is not a repair attempt, and no cycle count here is ever hidden.
4c. **Cycle bound (unit-level, family-agnostic).** This loop runs at most **two**
    review→fold cycles for a unit, counted from the unit's ledger marks and
    receipts — new finding families do not reset the count. A third cycle never
    starts here: stop with `TRIAGE-REQUIRED`, name every open finding ID, and
    hand the convergence diagnosis to `/triage-issue --prioritize-now` (which
    routes replans) or to the user. A unit that needs a third cycle has a
    planning or root-cause defect, not a review deficit — more blind rounds
    only manufacture findings.

5. If any finding remains unresolved (`DISPUTED`, `BLOCKED`, `REPLAN`, or an
   open row left after folding), stop the loop and hand every such ID to:

   ```text
   /triage-issue --prioritize-now <unit-or-fix> F1 F2 ...
   ```

   Tell `triage-issue` to try to resolve every named finding immediately. It
   may route a small correction back to the current unit, but it must not hide,
   downgrade, or postpone a review finding merely to finish the loop.
6. When the smallest correct correction is too large for the current fold,
   `triage-issue` must choose a replan route: re-run `/plan-feature <slug>` for
   a feature or `/plan-fix <issue-number>` for a fix, append explicit new
   `P<n>` phases to the unit's SPEC, and stop. The loop then asks the user to
   execute those phases manually with `/execute-phase <unit> P<n>` (or the
   fix equivalent) before invoking this loop again.

Do not use a hidden retry count. The loop ends at the first `PASS`, blocked
prerequisite, unresolved finding, or required manual replan. A later user
invocation starts from the newly persisted state. The loop files nothing: an
unresolved finding never becomes a forge issue from here, and deferring one out of
the unit requires the user to amend the governing SPEC first.

## Fixed output contract

Return exactly:

```text
REVIEW-FOLD LOOP — PASS | TRIAGE-REQUIRED | BLOCKED
Unit: <unit> · PR: <url> · HEAD: <sha>
First action: PASS | review-change | fold-findings
Review: <PASS | FAIL | not-run> · Fold: <changed | unchanged | not-run>
Owned elsewhere: <plan → /plan-feature + /review-plan | product → /design-feature
  + /review-spec | none>
Unresolved: <F1 + F2 + … | none>
Evidence: <one concise line explaining the selected action and result>

→ Next: <one concrete command or user action> — <why>
  · <alternative when applicable>
```

Use `TRIAGE-REQUIRED` whenever a finding needs `triage-issue`, a replan, or a
user decision. Replace every placeholder, list each actual finding ID exactly
once joined with ` + `, and never emit a literal ellipsis.

## Guardrails

Allowed: read target evidence, invoke `review-change`, invoke `fold-findings`,
and route unresolved findings to `triage-issue`.

Forbidden: implementing a fix in this router, editing review classifications,
marking findings folded, creating unrelated issues, weakening acceptance or
checks, merging, or claiming that a user has implemented newly planned phases.
Also forbidden: folding a `plan`- or `product`-owned finding, re-editing on a
second local cycle before the convergence diagnosis is reported, entering a
third review→fold cycle for the same unit, and treating an
absent pre-execution PASS as foldable debt.

## Relationship to other skills

`execute-phase` hands off here after a unit PR opens. `review-change` owns
read-only classification and the SHA-bound pass receipt. `fold-findings` owns
the actual correction and ledger tick. `triage-issue --prioritize-now` owns the
decision for unresolved findings and routes oversized work to `plan-feature` or
`plan-fix`; the user then executes the appended phases manually.

## Portability (agents other than Claude Code)

If fresh contexts or subagents are unavailable, invoke each delegated skill in
a new conversation and re-read the persisted HEAD, receipt, and ledger before
continuing. If the host has no slash-command menu, open each named `SKILL.md`
and follow it literally. Never claim a clean review after the same context
implemented the correction.

## Done when

The current HEAD has a verified `REVIEW-PASS` and no open findings, or every
remaining finding has a concrete triage/replan hand-off and the user has been
told to implement the new phases manually.

→ Next: print the matching terminal route from the fixed output contract — never send a non-PASS result to audit-pr
  · PASS → /audit-pr — consume the current exact-HEAD REVIEW-PASS
  · TRIAGE-REQUIRED → /triage-issue --prioritize-now <unit> F<k> — resolve every actual unresolved finding, then plan/execute new phases manually
  · BLOCKED → the exact recovery command — supply the missing target, PR, acceptance, or ledger input before re-running the loop
