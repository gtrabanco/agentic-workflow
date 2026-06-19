# fix/<issue-number>-<topic>

> Fix specification. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. Lighter than a feature spec — no
> Phase 0 planning artifacts. The SPEC alone is the source of truth.

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

## Testing

What test confirms the fix, at what layer (unit / integration /
architecture). Prefer integration over heavy mocking.

## Rollback

How to revert safely if the fix misbehaves in production. State the
single command or PR-revert flow, plus any data-side cleanup.

## Status

`pending` · `in-progress` · `done` (built, PR open — merge state lives in the forge)

(Removed from `docs/fix/README.md` only **after** the PR merges.)
