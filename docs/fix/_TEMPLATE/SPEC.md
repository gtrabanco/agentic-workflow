# fix/<issue-number>-<topic>

> Fix specification. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. Lighter than a feature spec — no
> separate planning artifacts: the SPEC alone is the source of truth,
> and its `## Phases` section is the execution ledger.

## Goal

One paragraph: what this fix repairs and why it cannot wait for a
regular feature cycle.

## Issue

`#<n>` — GitHub issue. Required. The PR must close it via
`Closes #<n>` in the body.

## Branch

`fix/<issue-number>-<topic>`

## Depends on

Other fixes (by folder name) that must merge first. Empty if
independent.

## Root cause

What broke, where, and why. Reference the commit, feature, or
decision where the defect was introduced if known.

## Detected in

When and how the defect surfaced — review finding, incident, failing
test, customer report, etc.

## Scope

### In scope

The exact change set.

### Out of scope

Adjacent issues this fix deliberately does NOT touch. Link to their
own fix folder or feature where each belongs.

## Acceptance

Objective, verifiable conditions for "done".

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**
and ticks tasks here. **Always ≥ 2 phases**: `P1..Pn` implement the fix
(each task independently checkable, no judgement); the final phase is
always `Hardening & PR` — keep its pre-written tasks **literally**, never
paraphrase or merge them into an implementation phase.

### P1 — <implementation>

- [ ] <task — independently checkable, mapped to evidence>

### P2 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #<n>`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push

## Testing

What test confirms the fix, at what layer (unit / integration /
architecture). Prefer integration over heavy mocking.

## Rollback

How to revert safely if the fix misbehaves in production. State the
single command or PR-revert flow, plus any data-side cleanup.

## Status

`pending` · `in-progress` · `done` (built, PR open — merge state lives in the forge)

(Removed from `docs/fix/README.md` only **after** the PR merges.)
