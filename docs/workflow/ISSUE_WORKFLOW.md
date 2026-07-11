# Issue workflow (end-to-end)

What happens to an issue from the moment it lands to a defensible, recorded
decision. The hub skill is `triage-issue`; the spokes route to fix, feature, or
deferral. Several issues can be triaged in one batch (`triage-issue 12 14 17`) —
independent verdicts, one summary table; any resulting fix still gets its own
branch and PR.

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
| **promote-to-feature** | It's really new capability | `plan-feature <N>` (the router takes the issue → scoped, **sized** SPEC; small `XS/S` features go SPEC-only with ≥ 2 phases in the SPEC → `execute-phase <NN>`) |
| **postpone** | Valid but trigger unmet | Leave open; post dated re-confirmation comment; **don't implement inline** |
| **wontfix** | Obsolete or explicitly bounded | Propose closing with rationale |

If the call hinges on product/risk judgment rather than evidence, present the
verdict + options and let the user decide before acting.

## Stage 4 — The fix path (when fix-now)

`plan-fix` (senior-architect persona) drafts
`docs/fix/<N>-<topic>/SPEC.md` from the issue, scopes it tightly, surfaces
blockers/risks, registers it in `docs/fix/README.md`, and commits on a fix
branch — then **stops for review**. Then `execute-phase --fix`:

1. Ensures the GitHub issue exists (creates via `gh issue create` if missing).
2. Verifies/creates branch `fix/<N>-<topic>` (never `main`).
3. Implements the fix (the SPEC is the only planning artifact — no phases).
4. Runs the gate (type-check, tests, build).
5. **Marks the fix `done` and opens the PR with `Closes #N` (always — never
   branch-only).** `done` means built, not merged.
6. **Mandatory `/review-change`** (non-fix-now findings → `triage-issue`), then
   `/audit-pr` as the merge gate (never merge with pending docs).
7. **Only after merge:** removes the entry from `docs/fix/README.md` — never before
   (don't drop issue tracking early).

## Stage 5 — Report and keep docs coherent

Whatever the verdict:

- Post the decision as a **dated issue comment** with the evidence you checked.
- If it became an active fix → it's in the fix index; if it merged/closed →
  remove the stale index row.
- Never change GitHub state (labels, close) without confirmation when ambiguous.

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
