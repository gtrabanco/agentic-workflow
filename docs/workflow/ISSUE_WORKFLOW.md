# Issue workflow — through the lane (end-to-end)

What happens to an issue from the moment it lands to a defensible, recorded
decision. The hub skill is `triage-issue`; the spokes route to the lane (unit
doc → catalog steps → review → release) or to deferral. Several issues can be
triaged in one batch (`triage-issue 12 14 17`) — independent verdicts, one
summary table.

> Forge commands below use `gh` (GitHub) — the canonical example. The project's
> **Workflow conventions** declare its forge; on GitLab/Gitea run the declared
> CLI's equivalent.

## Stage 0 — Read the issue and the project

`triage-issue` reads the agent guide + documentation map, the fix index
(`docs/fix/README.md`) and fix SPEC template, the roadmap, and then the issue
itself in full (body, labels, comments):

```sh
gh issue view <N> --json number,title,body,labels,state,comments
```

## Stage 1 — Parse the issue's own contract

Well-formed issues in this repo carry their own decision criteria:

- **Severity** (e.g. low/perf, low/maintainability).
- A **"When to fix"** / **trigger** clause — often signal-based.
- **"Acceptance (when triggered)"** — what done looks like *if* it fires.

Honor that contract instead of acting on reflex.

## Stage 2 — Verify the trigger against the CURRENT code

This is the step that separates evidence from vibes. Actually check:

- Count real consumers (`grep`) — is the "third consumer" truly here yet?
- Check a threshold — article/row count, p95 latency, bundle size.
- Reproduce a reported defect, or confirm it's already fixed.

Cite the evidence (paths, counts, line refs) in the decision.

## Stage 3 — Classify and route

| Verdict | When | Route |
|---|---|---|
| **fix-now** | Defect, or the trigger is met | Lane fix mode → `execute-phase --fix`; add to fix index |
| **fix-in-unit** | The issue already belongs to a unit that is currently open | Resolve on that unit's own branch via the lane's catalog steps |
| **promote-to-feature** | It's really new capability | Lane feature mode → triage → catalog steps |
| **postpone** | Valid but trigger unmet | Leave open; post dated re-confirmation comment |
| **wontfix** | Obsolete or explicitly bounded | Propose closing with rationale |

If the call hinges on product/risk judgment rather than evidence, present the
verdict + options and let the user decide before acting.

## Stage 4 — The fix path (when fix-now)

**Open-unit note.** A `fix-in-unit` verdict skips this fix path entirely — the
issue resolves on the **already-open** unit's own branch, never through a new
`fix/<N>-<topic>` branch. Everything below applies only to a genuine `fix-now`.

`triage-issue` accepts one or more issues and routes them through the lane:

1. Groups compatible issues (one capability outcome or homogeneous mechanical rule).
2. For each group, creates the unit doc under `docs/fix/<N>-<topic>/SPEC.md`.
3. Runs triage on the unit doc.
4. The lane executes the triage-decided steps (implement, evidence, review).
5. Marks the fix `done` and opens the PR with `Closes #N`.
6. Runs the mandatory manual review→fold path: `/fold-findings`, then re-run
   `/review-change`. Unresolved findings go to `/triage-issue --prioritize-now`.
7. Then `/audit-pr` acts as the merge gate.
8. **Only after merge:** removes the entry from `docs/fix/README.md`.

## Stage 5 — Report and keep docs coherent

Whatever the verdict:

- Post the decision as a **dated issue comment** with the evidence you checked.
- **Label application is part of the verdict, not a separate confirmation.**
  A **fix-now + high-severity** verdict applies `urgent` / `fix-next`; a
  **postpone** / **promote** / **wontfix** verdict applies the matching
  disposition label (`postponed` / `promoted` / `wontfix`). Both are owned
  solely by `triage-issue`.
- If it became an active fix → it's in the fix index; if it merged/closed →
  remove the stale index row.
- Any **other** GitHub state mutation still needs confirmation when ambiguous.

A periodic `audit-docs` run catches fix-index rows whose issue already closed,
deferred issues that quietly became actionable, and similar drift.

## Worked example

```
/triage-issue  60
   → reads "trigger = 3rd consumer of the shared helper"
   → grep: only 2 modules import it  → trigger UNMET
   → verdict: postpone
   → gh issue comment 60  (dated re-confirmation, no code)
```