# fix/<issue-number>-<topic>

> Fix specification. Copy this folder to `docs/fix/<issue-number>-<topic>/`, fill
> every section, and register the entry in `docs/fix/README.md`. Lighter than a
> feature spec — no planning artifacts. The SPEC alone is the source of truth.

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

## Rollback

How to revert safely, and any data-side cleanup needed.

## Effort

T-shirt size (XS / S / M / L) with a one-line justification.
