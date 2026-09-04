# Issue workflow (end-to-end)

> 🇪🇸 [Versión en español](ISSUE_WORKFLOW.es.md)

What happens to an issue from the moment it lands to a defensible, recorded
decision. The hub skill is `triage-issue`; the spokes route to fix, feature, or
deferral. Several issues can be triaged in one batch (`triage-issue 12 14 17`) —
independent verdicts, one summary table. Compatible fix-now issues may then be
planned as one atomic delivery unit instead of one branch and PR per issue.

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
- A **"When to fix"** / **trigger** clause — often signal-based ("revisit at the
  pagination milestone", "when a 3rd consumer appears").
- **"Acceptance (when triggered)"** — what done looks like *if* it fires.

Honor that contract instead of acting on reflex.

## Stage 2 — Verify the trigger against the CURRENT code

This is the step that separates evidence from vibes. Actually check:

- Count real consumers (`grep`) — is the "third consumer" truly here yet?
- Check a threshold — article/row count, p95 latency, bundle size.
- Reproduce a reported defect, or confirm it's already fixed.

Cite the evidence (paths, counts, line refs) in the decision.

> Illustrative examples:
> - A perf issue (an unbounded query on a hot path) — classified `postpone` at
>   filing; brought forward and fixed once judged a safe, cacheable lookup.
> - A duplicated helper across two modules — trigger is "a 3rd consumer";
>   verified only 2 exist → stayed deferred with a **dated re-confirmation**
>   comment, nothing implemented.

## Stage 3 — Classify and route

| Verdict | When | Route |
|---|---|---|
| **fix-now** | Defect, or the trigger is met | `plan-fix` → `execute-phase --fix`; add to fix index |
| **fix-in-unit** | The issue already belongs to a unit that is currently open (a scope-membership check runs before classification) | Resolve on that unit's own branch: fold into its ledger/phase (`/execute-phase <NN> P<k>` or `/fold-findings`), an incremental replan (`design-feature`/`plan-feature`/a SPEC `## Amendments` entry), or a scope-bleed restore — never a new standalone unit, never `/plan-fix` |
| **promote-to-feature** | It's really new capability | `plan-feature <N>` (the router takes the issue → scoped, **sized** SPEC; small `XS/S` features go SPEC-only with ≥ 2 phases in the SPEC → `execute-phase <NN>`) |
| **postpone** | Valid but trigger unmet | Leave open; post dated re-confirmation comment; **don't implement inline** |
| **wontfix** | Obsolete or explicitly bounded | Propose closing with rationale |

If the call hinges on product/risk judgment rather than evidence, present the
verdict + options and let the user decide before acting.

## Stage 4 — The fix path (when fix-now)

**Open-unit note.** A `fix-in-unit` verdict skips this fix path entirely — the
issue resolves on the **already-open** unit's own branch (fold into its
ledger/phase, or an incremental replan), never through a new `fix/<N>-<topic>`
branch. Everything below applies only to a genuine `fix-now` (no open unit
claims the issue).

`plan-fix` accepts one or more issues. It groups the set when all boxes pass:
one user-visible capability outcome or one homogeneous mechanical rule, one
verification plan, compatible release/rollback, no isolation conflict, and an
aggregate size no larger than M. Shared root cause, files, and severity are not
requirements. If the full set fails, it returns the fewest maximal compatible
groups rather than defaulting to one PR per issue.

For each group it drafts `docs/fix/<N>-<topic>/SPEC.md` plus frozen
`ACCEPTANCE.md`, surfaces blockers/risks, registers every member in the fix
index, and commits on one fix branch. Then `execute-phase --fix <N>`:

1. Verifies every referenced issue and the frozen acceptance manifest; it does
   not create unrelated issues for findings.
2. Verifies/creates branch `fix/<N>-<topic>` (never `main`).
3. Implements every remaining phase in the unit, using a fresh worker context
   and bounded repair attempts per phase.
4. Runs the gate (type-check, tests, build).
5. **Marks the fix `done` and opens the PR with `Closes #N` (always — never
   branch-only).** `done` means built, not merged.
6. Runs the mandatory manual review→fold path: `/fold-findings`, then re-run
   `/review-change` on the changed HEAD (it resumes with the prior fold queue when
   `review-change` already ran). Unresolved findings go to
   `/triage-issue --prioritize-now`; oversized work is replanned into new
   phases and the user resumes `/execute-phase` manually. Then `/audit-pr`
   acts as the merge gate (never merge with pending docs).
7. **Only after merge:** removes the entry from `docs/fix/README.md` — never before
   (don't drop issue tracking early).

## Stage 5 — Report and keep docs coherent

Whatever the verdict:

- Post the decision as a **dated issue comment** with the evidence you checked.
- **Label application is part of the verdict, not a separate confirmation.**
  A **fix-now + high-severity** verdict applies the matching urgency label
  (`urgent` / `fix-next`); a **postpone** / **promote** / **wontfix** verdict
  applies the matching disposition label (`postponed` / `promoted` /
  `wontfix`). Both are owned solely by `triage-issue`, both are fully
  determined by the evidence-based verdict just reached — never a parse of
  issue text — so applying either needs no separate confirmation.
- If it became an active fix → it's in the fix index; if it merged/closed →
  remove the stale index row.
- Any **other** GitHub state mutation (closing, unrelated labels) still needs
  confirmation when ambiguous.

A periodic `audit-docs` run catches fix-index rows whose issue already
closed, deferred issues that quietly became actionable, and similar drift.

## Worked example

```
/triage-issue  60
   → reads "trigger = 3rd consumer of the shared helper"
   → grep: only 2 modules import it  → trigger UNMET
   → verdict: postpone
   → gh issue comment 60  (dated re-confirmation, no code)
```
