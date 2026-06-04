---
name: execute-phase
user-invocable: true
description: Implements one phase of a feature (default) or a fix (--fix mode). Enforces branch safety, issue policy, and the project's per-phase update discipline.
---

# Execute Phase

Default mode: implement one phase of a feature from `docs/features/`.
Alt mode `--fix`: implement a single-shot fix from `docs/fix/`.

## Hard rules

- **NEVER work on `main`.** Before any edit/commit run
  `git branch --show-current`. If the result is `main`, create the
  working branch first (see *Branch creation*). The user retains the
  right to work on `main` themselves; this rule applies to the
  assistant only.
- Implement only the requested phase. Never bundle multiple phases
  unless explicitly asked.
- Stop after verification passes; keep commits small and reviewable.
- Update on each phase (feature mode): `TASKS.md`, `progress.md`,
  `testing.md`, `known-issues.md`, and `decisions.md` only if
  architecture changes.

## Forbidden

- Overengineering
- Premature abstractions
- Refactoring unrelated code
- Adding dependencies without justification
- Implementing future features early

## Branch naming

| Mode | Format | Example |
|------|--------|---------|
| feature (default) | `feat/<NN>-<slug>` | `feat/09-pricing-ui` |
| `--fix` | `fix/<issue-number>-<topic>` | `fix/142-applypatch-stub` |

## Branch creation

1. Read the `Branch` field from the SPEC.
2. If present, create silently: `git switch -c <name>`.
3. If absent or ambiguous, ask the user for the branch name, then create.
4. Never commit to `main`. Never amend on `main`. Never force-push to `main`.

## Issue policy

GitHub issue + PR templates live in `.github/ISSUE_TEMPLATE/` and
`.github/PULL_REQUEST_TEMPLATE.md`. Their fields mirror the SPEC
sections so issues and SPECs stay aligned.

- **`--fix` mode** — every fix requires a GitHub issue. If the user
  has not created one, run:

  ```sh
  gh issue create \
    --template fix.yml \
    --title "fix: <topic>" \
    --body-file <path-to-rendered-body>
  ```

  Populate the body from the SPEC's `Root cause`, `Detected in`,
  `Goal`, and `Acceptance` sections. Use the returned issue number
  for the branch (`fix/<n>-<topic>`) and folder
  (`docs/fix/<n>-<topic>/`).

- **Feature mode** — if the feature came from an issue, include
  `Closes #<n>` in the PR body so the issue closes on merge. Do not
  create issues for features that did not originate from one.

- **All issues, specs, code, commits and PR descriptions are written
  in English**, regardless of the language used to request the work.
  Translate before drafting the SPEC if the source issue is in
  another language.

---

## Mode: feature (default)

Path: `docs/features/<NN>-<slug>/`

Workflow:

1. Verify branch — create if on `main`.
2. Read `SPEC.md` and `TASKS.md` for the requested phase.
3. Implement only that phase.
4. Run the project's verification gate (type-check, tests, build).
5. Update `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md`
   (and `decisions.md` if architecture moved).
6. Commit (conventional commit format, one commit per phase).
7. Stop and wait for review.

## Mode: `--fix`

Path: `docs/fix/<issue-number>-<topic>/`
Template: `docs/fix/_TEMPLATE/SPEC.md`
Index: `docs/fix/README.md` (active only)

Workflow:

1. Ensure a GitHub issue exists; create via `gh issue create` if missing.
2. Copy the template to `docs/fix/<issue-number>-<topic>/SPEC.md` and
   fill every section. Register the entry in `docs/fix/README.md`.
3. Verify branch — create `fix/<issue-number>-<topic>` if on `main`.
4. Implement the fix (no Phase 0 planning artifacts; SPEC is enough).
5. Run the project's verification gate (type-check, tests, build).
6. Open the PR with `Closes #<n>` in the body.
7. After merge: remove the entry from `docs/fix/README.md`.

If the SPEC declares `Depends on:` other fixes, verify those are merged
before starting. Block if not.
