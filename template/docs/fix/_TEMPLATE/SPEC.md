# fix/<issue-number>-<topic>

> Fix specification. Copy this folder to `docs/fix/<issue-number>-<topic>/`, fill
> every section, and register the entry in `docs/fix/README.md`. Lighter than a
> feature spec — no separate planning artifacts: the SPEC alone is the source of
> truth, and its `## Phases` section is the execution ledger.

## Goal

One paragraph: what this fix repairs and why it cannot wait for a regular feature
cycle.

## Issue

`#<n>` — tracked issue. Required. The PR must close it.

## Branch

`fix/<issue-number>-<topic>`

## Root cause

What actually causes the defect, with evidence (file paths, line refs).

## Scope

### In scope

The smallest change set that closes the issue.

### Out of scope

Adjacent problems found during analysis — each with a one-line pointer to where
it should be filed instead.

## Impact

- Modules/files touched (paths).
- Blast radius: what breaks if the fix is wrong.
- Detection lead time: how fast production would surface a failure.

## Rules that must never be violated

Project invariants the fix must preserve (from `CLAUDE.md` hard rules and the
architecture doc).

## Risks

Operational, security, and compliance touchpoints. State "n/a" explicitly where
none apply — that forces a deliberate check.

## Acceptance criteria

Objective checkboxes, each independently verifiable. Map each to a test layer.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here. **Always ≥ 2 phases**: `P1..Pn` implement the fix (each task
independently checkable, no judgement); the final phase is always
`Hardening & PR` — keep its pre-written tasks **literally**, never paraphrase
or merge them into an implementation phase.

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

## Rollback

How to revert safely, and any data-side cleanup needed.

## Effort

T-shirt size (XS / S / M / L) with a one-line justification.
