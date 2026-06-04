---
name: execute-phase
user-invocable: true
argument-hint: <NN> <phase> | <NN> (single-pass) | --fix
model: sonnet
description: >
  Implement one phase of a feature (default), a small feature end-to-end in a
  single pass (SPEC-only, no planning artifacts), or a fix (--fix). Enforces
  branch safety, issue policy, the project's verification gate, and per-phase doc
  discipline. Triggers: "execute phase P1 of NN", "implement the NN feature",
  "build NN from its spec", "execute-phase NN P2", "execute-phase --fix".
---

# Execute Phase

Three modes:

- **feature phase** (default) — implement one phase of `docs/features/<NN>-<slug>/` using its `TASKS.md`.
- **single-pass** — a small feature with only a `SPEC.md` (no planning artifacts): implement it end-to-end in one pass.
- **`--fix`** — implement a fix from `docs/fix/<n>-<topic>/`.

## Hard rules

- **Never work on `main`.** Run `git branch --show-current` before any edit/commit; if `main`, create the working branch first. (Applies to the assistant only; the user may use `main`.)
- Implement only the requested scope — one phase (feature mode) or the whole SPEC (single-pass/fix). Never bundle phases unless asked.
- Stop after the gate passes; keep commits small and reviewable.
- Feature mode: update `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md` each phase (and `decisions.md` if architecture moved).

## Forbidden

Overengineering · premature abstractions · refactoring unrelated code · unjustified dependencies · building future features early.

## Branch

| Mode | Format |
|------|--------|
| feature / single-pass | `feat/<NN>-<slug>` |
| `--fix` | `fix/<issue-number>-<topic>` |

Read the SPEC's `Branch` field; create with `git switch -c <name>`. If absent/ambiguous, ask. Never commit, amend, or force-push on `main`.

## Issue policy

- **`--fix`:** every fix needs a GitHub issue; create with `gh issue create --template fix.yml` if missing, populating the body from the SPEC. Use the returned number for branch and folder.
- **feature:** if it came from an issue, include `Closes #<n>` in the PR body. Don't create issues for features that didn't originate from one.
- All issues, specs, code, commits, and PRs in English; translate the source first if needed.

## Workflows

**Feature phase (default)** — `docs/features/<NN>-<slug>/`

1. Verify branch (create if on `main`).
2. Read `SPEC.md` + `TASKS.md` for the requested phase.
3. Implement only that phase (see *Implementation guidance*).
4. Run the gate (type-check, tests, build).
5. Update the per-phase docs.
6. Commit (conventional; one per phase). Stop for review.

**Single-pass** — small feature with only a `SPEC.md`, no planning artifacts:

1. Verify branch.
2. Read `SPEC.md` (+ `DECISIONS.md` if present) and the docs its documentation map points to.
3. If the SPEC is ambiguous on scope / edge cases / UI, ask first — one question at a time, nothing it already answers.
4. Implement end-to-end (see *Implementation guidance*).
5. Run the gate; write `CHECKLIST.md` (below).
6. Commit. Stop for review.

**`--fix`** — `docs/fix/<n>-<topic>/`, template `docs/fix/_TEMPLATE/SPEC.md`, index `docs/fix/README.md`:

1. Ensure the issue exists (`gh issue create` if missing).
2. **If `docs/fix/<n>-<topic>/SPEC.md` already exists (e.g. from `draft-fix-spec`), use it — do not re-draft.** Otherwise copy the template, fill every section, and register the entry in `docs/fix/README.md`.
3. Verify branch (`fix/<n>-<topic>`).
4. Implement the fix (no planning artifacts; the SPEC is enough).
5. Run the gate.
6. Open the PR with `Closes #<n>`.
7. After merge: remove the `docs/fix/README.md` entry.

If the SPEC declares `Depends on:` other fixes, verify they're merged first; block if not.

## Implementation guidance (single-pass & per-phase)

Map each change to the project's layers per its architecture doc; build inner layers first, outer last:

1. **Persistence/schema** (if any) — update where defined, generate migrations with the project's tooling, never hand-edit generated output.
2. **Core/domain** — no outer-layer imports; use the project's value objects/rules.
3. **Orchestration/use-case** — inject dependencies, idempotent if re-callable, typed errors.
4. **Adapters** — implement the project's ports; never leak raw external errors inward.
5. **Controller/endpoint** — map errors to responses; webhooks: verify signature, enqueue, return fast.
6. **UI** (if any) — follow the design-system/i18n/accessibility docs; no hardcoded strings.
7. **Tests** — light mocks of the project's interfaces; test orchestration, not adapters.

## Completion checklist (single-pass)

Write `docs/features/<NN>-<slug>/CHECKLIST.md`: schema migration applied (if any) · core layer has no outer imports · orchestration idempotent + typed errors · adapters implement ports · tests pass · type-check/lint green · UI strings localized (if UI) · domain value-object rules respected · user-facing limitations disclosed · new deps pinned. Note any decisions not captured in the SPEC.
