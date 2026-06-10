---
name: audit-pr
user-invocable: true
version: 1.0.3
argument-hint: <pr-number> (optional — defaults to the current branch's PR)
model: opus
effort: high
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  PR-level merge gate. Audits the WHOLE pull request (not just the diff) against a
  merge-readiness contract: SPEC acceptance criteria met, all phases complete, docs
  updated per the doc map, Closes #N present when issue-born, tests added at the
  right layer, CI green, branch off the default branch and independently mergeable,
  and the review-change axes clean (or consciously deferred to tracked issues).
  Verdict: merge-ready, or a ranked list of blockers — never merges, never edits.
  Triggers: "is this PR ready to merge", "audit the PR", "merge gate for #N",
  "can this ship", "pre-merge review", "audit-pr".
---

# Audit PR

The manager's **"can this ship?"** gate. A read-first audit over the *entire* PR —
its SPEC, all phases, docs, tests, CI, and review axes — that returns a single
verdict: **merge-ready** or a ranked list of **blockers**. **Findings only — never
merges, never edits, never refactors.** The human decides and merges.

## When to use

- After the work is "done" and before merging — the final gate once `review-change`
  is clean and all phases are committed.
- When you want one defensible answer to "is this PR actually ready?" rather than
  trusting that every loose end was tied off.

`review-change` reviews the *diff* for quality; `audit-pr` audits the *PR as a unit
of delivery* — that everything the SPEC promised is present, traceable, and green.

## Scope

The whole pull request: the branch vs. the default base, **plus** its SPEC and
planning artifacts, the roadmap entry, the doc map, the PR body, issue links, and
CI. Default target is the current branch's PR; accept a PR number to target another.

## Step 0 — Discover the project & the PR (always first)

1. **Project contract.** Per the agent guide's **Workflow conventions** +
   **documentation map**, then read what THIS skill needs: the roadmap, the
   feature/fix templates, and the project's verification gate (type-check / tests
   / build / CI).
2. **The PR.** Identify it and read it in full (forge CLI per the project's
   Workflow conventions — examples use `gh`):
   ```sh
   gh pr view <N> --json number,title,body,baseRefName,headRefName,isDraft,mergeable,mergeStateStatus,files,commits,statusCheckRollup,closingIssuesReferences
   ```
   If no PR number is given, resolve the current branch's PR
   (`gh pr view --json ...`). If none exists yet, audit the branch vs. the default
   base and say "no PR open yet" — the contract still applies.
3. **The SPEC.** Locate the governing SPEC — `docs/features/<NN>-<slug>/` (feature)
   or `docs/fix/<n>-<topic>/` (fix) — and its planning artifacts (`PLAN.md`,
   `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md`, `decisions.md`) when
   present. The SPEC is the source of truth for what "done" means.

## Merge-readiness contract

Check each gate; cite evidence (file:line, criterion, check name, issue number).
A gate that can't be confirmed is a **blocker**, not a pass — never assume green.

| Gate | What it means | Blocker when |
|---|---|---|
| **Acceptance criteria** | Every SPEC acceptance criterion is satisfied, each mapped to concrete evidence (code, test, or doc). | Any criterion unmet, unverifiable, or silently dropped. |
| **All phases complete** | Feature: every phase in `PLAN.md`/`TASKS.md` is done and logged in `progress.md`. Fix: the SPEC is fully implemented. | Any unchecked task or unimplemented phase without an explicit, tracked deferral. |
| **Scope integrity** | The PR implements the SPEC and no more; out-of-scope work was split out. | Undocumented scope creep, or in-scope work missing. |
| **Docs updated** | Every "Affected docs" criterion is satisfied; per-phase docs (`progress`/`testing`/`known-issues`/`decisions`) reflect reality; the doc map still resolves. | A doc the map or SPEC requires is stale, missing, or contradicts the code. |
| **Traceability** | `Closes #N` is in the PR body when the work is issue-born (from `plan-feature-from-issue` or `plan-fix`); the roadmap/fix-index entry matches. | Issue-born work without `Closes #N`, or a roadmap/index entry out of sync. |
| **Tests** | New behavior is covered at the right layer (prefer integration); acceptance criteria map to tests; no regression-risk tests left red. | New behavior untested, or tests assert nothing meaningful. |
| **Verification gate / CI** | The project's gate passes — type-check, tests, build — and `statusCheckRollup` is green. | Any required check failing, pending, or absent where the project requires one. |
| **Mergeability** | Branch is off the default base, independently mergeable (no conflicts), not stacked on another PR, not draft. | Wrong base, conflicts, stacked dependency, or still draft. |
| **Review axes clean** | The applicable `review-change` axes are clean **or** every remaining finding is *consciously deferred* to a tracked issue with a trigger. | A `fix-now` finding still open, or a deferral with no issue/trigger behind it. |

> Run `review-change` for the axis check if it hasn't been run on the final state,
> or read its latest report. Don't re-litigate findings already classified — verify
> each open one is either resolved or has a real, tracked home.

## Process

1. **Gather** — Step 0: project contract, PR, SPEC + artifacts, CI status.
2. **Walk the contract** — evaluate every gate above against evidence. For each,
   record pass / blocker / n-a with the specific artifact or check that proves it.
3. **Confirm deferrals are real** — for anything postponed (an unchecked task, a
   review finding, a known issue), verify a tracked issue + trigger exists. A
   deferral with no destination is a blocker, not a pass.
4. **Decide** — one verdict:
   - **MERGE-READY** — every applicable gate passes; list the few things the human
     should still eyeball (the manual-verification items `review-change` surfaced).
   - **BLOCKED** — one or more gates fail; output the ranked blocker list.
5. **Report** — the verdict block below. Findings only; never merge or edit.

## Verdict format

```
PR #<N> — <title>
Base: <default> ← Head: <branch>   CI: <green|failing|pending>

VERDICT: MERGE-READY | BLOCKED (<count> blockers)

Blockers (ranked):
  1. [<gate>] <what's wrong> — evidence: <file:line | check | criterion>
     → fix: <smallest action to clear it> (<route>)
  ...

Non-blocking nits:
  - <minor item> — <pointer>

Before merge, a human should still verify:
  - <manual-verification item from review-change>
```

If MERGE-READY, omit the blocker list and state it plainly: nothing blocks merge.

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

## Routing (blockers, by kind)

- **Incomplete in-scope work** → fold into this branch via `execute-phase`
  (the relevant phase or `--fix`); re-run `audit-pr` after.
- **Out-of-scope defect surfaced** → `plan-fix` (new fix entry), not this PR.
- **Deferred finding lacking a home** → `triage-issue` to file + classify it.
- **Stale/missing docs** → update per the doc map (often a quick `execute-phase`
  doc commit), then re-audit.
- **Red CI / failing gate** → report the failing check; the dev fixes on-branch.

## Guardrails

- **Read-first verdict only. Never merge, push, edit, or refactor.** The human ships.
- Never report MERGE-READY on an unconfirmed gate — absence of evidence is a blocker.
- Don't re-run the full review from scratch; compose `review-change` and verify its
  open findings are resolved or tracked.
- Honor the project's **Workflow conventions** (gate, docs-language, evidence —
  every blocker cites file:line/check/criterion/issue — track-don't-inline:
  out-of-scope problems become issues/fix entries, never silent additions here).

## Relationship to other skills

```
execute-phase (all phases done) ─▶ review-change (axes clean) ─▶ audit-pr ─▶ merge
                                                                    │
                          blockers ─┬─ in-scope  ▶ execute-phase ──┘ (re-audit)
                                    ├─ out-of-scope ▶ plan-fix
                                    └─ deferral     ▶ triage-issue
```

- Consumes `review-change` (axis cleanliness) and the artifacts of `plan-feature` /
  `plan-fix` / `execute-phase` (SPEC, phases, docs, `Closes #N`).
- `audit-docs` is the cross-document coherence check; `audit-pr` is per-PR merge
  readiness; `product-audit` is the periodic, product-wide full sweep.

## Done when

- Every applicable gate has a pass / blocker / n-a verdict backed by cited evidence.
- A single top-line verdict (**MERGE-READY** or **BLOCKED** with ranked blockers) is
  reported, each blocker routed, with the human's manual-verification list explicit.
- Nothing was merged, edited, or refactored.
