---
name: execute-phase
user-invocable: true
version: 1.2.0
argument-hint: <NN> <phase> | <NN> (single-pass) | --fix
model: sonnet
effort: medium
allowed-tools: [Bash, Read, Edit, Write, MultiEdit]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
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
- **single-pass** — a small feature (SPEC `Size: XS/S`; only a `SPEC.md`, no planning artifacts): implement it end-to-end in one pass.
- **`--fix`** — implement a fix from `docs/fix/<n>-<topic>/`.

## Hard rules

- Honor the project's **Workflow conventions** (branch/PR, gate-before-commit, docs-language). Run `git branch --show-current` before any edit/commit; if `main`, create the working branch first (assistant only; the user may use `main`).
- Implement only the requested scope — one phase (feature mode) or the whole SPEC (single-pass/fix). Never bundle phases unless asked.
- Stop after the gate passes; keep commits small and reviewable.
- Feature mode: update `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md` each phase (and `decisions.md` if architecture moved).
- **When reality contradicts the plan** (a task is impossible, an assumption is wrong, a better path appears): update `TASKS.md`/`PLAN.md` and record why in `decisions.md` — never silently diverge from the written plan.

## Forbidden

Overengineering · premature abstractions · refactoring unrelated code · unjustified dependencies · building future features early.

## Branch

| Mode | Format |
|------|--------|
| feature / single-pass | `feat/<NN>-<slug>` |
| `--fix` | `fix/<issue-number>-<topic>` |

Read the SPEC's `Branch` field; create with `git switch -c <name>`. If absent/ambiguous, ask. Never commit, amend, or force-push on `main`.

## Issue policy

Forge operations use the project's declared forge CLI (Workflow conventions —
examples use `gh`; translate if the project declares another forge).

- **`--fix`:** every fix needs a tracked issue; create with `gh issue create --template fix.yml` if missing, populating the body from the SPEC. Use the returned number for branch and folder.
- **feature:** if it came from an issue, include `Closes #<n>` in the PR body. Don't create issues for features that didn't originate from one.
- All issues, specs, code, commits, and PRs in English; translate the source first if needed.

## Workflows

**Feature phase (default)** — `docs/features/<NN>-<slug>/`

1. Verify branch (create if on `main`). **P1 only:** if the planning artifacts
   (`docs/features/<NN>-<slug>/`) are still uncommitted, commit them first on the
   feature branch — `git add docs/features/<NN>-<slug> && git commit -m "docs(<NN>-<slug>): planning artifacts"` —
   so planning history stays separate from implementation.
2. Read `progress.md` first (the running log — what prior phases did and left
   open), then `SPEC.md` + `TASKS.md` for the requested phase. **Same-session
   shortcut:** if you executed the previous phase in this session and the
   planning docs haven't changed, don't re-read them — only the new phase's
   `TASKS.md` section.
3. Implement only that phase (see *Implementation guidance*).
4. Run the gate (type-check, tests, build). **If red:** fix within the phase's
   scope and re-run — never commit red. If the failure can't be fixed within
   this phase's scope, record it in `known-issues.md`, leave the work
   uncommitted, and stop with a clear report.
5. Update the per-phase docs.
6. Stage and commit: `git add <changed files>` then `git commit -m "<type>(<scope>): <summary>"` — one commit per phase, conventional format. Run this; don't just describe what should be committed.
7. **Review checkpoint** — every 2 phases (and before the PR), **stop and hand off** to `/review-change` (see below) before the next phase. Don't run it in this skill's turn.

**Single-pass** — small feature with only a `SPEC.md`, no planning artifacts:

1. Verify branch.
2. Read `SPEC.md` (+ `DECISIONS.md` if present) and the docs its documentation map points to.
3. If the SPEC is ambiguous on scope / edge cases / UI, ask first — one question at a time, nothing it already answers.
4. Implement end-to-end (see *Implementation guidance*).
5. Run the gate; write `CHECKLIST.md` (below).
6. Stage and commit: `git add <changed files>` then `git commit -m "<type>(<scope>): <summary>"`. Stop for review.

**`--fix`** — `docs/fix/<n>-<topic>/`, template `docs/fix/_TEMPLATE/SPEC.md`, index `docs/fix/README.md`:

1. Ensure the issue exists (`gh issue create` if missing).
2. **If `docs/fix/<n>-<topic>/SPEC.md` already exists (e.g. from `plan-fix`), use it — do not re-draft.** Otherwise copy the template, fill every section, and register the entry in `docs/fix/README.md`.
3. Verify branch (`fix/<n>-<topic>`).
4. Implement the fix (no planning artifacts; the SPEC is enough).
5. Run the gate.
6. Stage and commit: `git add <changed files>` then `git commit -m "fix(<scope>): <summary>"`. Then open the PR: `gh pr create --base main --title "fix(<scope>): <summary>" --body "Closes #<n>"`. Run both commands.
7. After merge: remove the `docs/fix/README.md` entry.

If the SPEC declares `Depends on:` other fixes, verify they're merged first; block if not.

## Implementation guidance (single-pass & per-phase)

**Tests first where they pay.** For core/domain and orchestration phases, write
the phase's acceptance/integration tests first (red), then implement to green —
the SPEC's dev scenarios are the test list, so its failure modes get exercised,
not just documented. UI and adapter glue may test after implementation.

Map each change to the project's layers per its architecture doc; build inner layers first, outer last:

1. **Persistence/schema** (if any) — update where defined, generate migrations with the project's tooling, never hand-edit generated output.
2. **Core/domain** — no outer-layer imports; use the project's value objects/rules.
3. **Orchestration/use-case** — inject dependencies, idempotent if re-callable, typed errors.
4. **Adapters** — implement the project's ports; never leak raw external errors inward.
5. **Controller/endpoint** — map errors to responses; webhooks: verify signature, enqueue, return fast.
6. **UI** (if any) — follow the design-system/i18n/accessibility docs; no hardcoded strings.
7. **Tests** — whatever wasn't written first (see above): light mocks of the project's interfaces; test orchestration, not adapters.

## Completion checklist (single-pass)

Write `docs/features/<NN>-<slug>/CHECKLIST.md`: schema migration applied (if any) · core layer has no outer imports · orchestration idempotent + typed errors · adapters implement ports · tests pass · type-check/lint green · UI strings localized (if UI) · domain value-object rules respected · user-facing limitations disclosed · new deps pinned. Note any decisions not captured in the SPEC.

## Review checkpoint cadence (feature mode)

Keep the review on a cadence without mis-powering it. After every **2 completed
phases** — and always once more **before opening the PR**, so the final phase is
never unreviewed — **stop and hand off to `review-change`** instead of running it
in this skill's turn.

**Why hand off, not compose:** a skill's model and effort are fixed at the start of
its turn, so invoking `review-change` from here would run it at execute-phase's
`sonnet`/`medium` rather than its own `opus`/`high` — under-powering the review.
Handing off lets the user run `/review-change` in a fresh turn at its proper
model/effort. (This is the general rule: suggest the next skill across a
model/effort boundary, don't compose it.)

At the checkpoint, print the hand-off:

```
Phase <N> done and committed. Review checkpoint (every 2 phases).
→ Run /review-change now — it reviews the branch at its own model/effort.
  · clean    → continue with: execute-phase <NN> <next phase>
  · findings → fold fix-now into the branch; postpone → triage-issue; then re-review.
```

This never auto-merges and never skips the per-phase stop: still one phase at a
time, human in the loop, gate enforced each phase. Single-pass and `--fix` modes
are reviewed once at the end the same way — hand off to `/review-change` — as they
have no intermediate phases.

## Batch execution with `/loop`

To run all phases without manual re-invocation, use Claude Code's self-paced
`/loop` with a goal rather than a direct command (the skill requires a phase
argument, so `/loop /execute-phase NN` alone won't advance automatically):

```
/loop implement all phases of feature NN one by one using /execute-phase,
commit each phase, and stop when TASKS.md shows all phases checked
```

The loop reads `TASKS.md` to pick the next uncompleted phase, implements it,
and terminates naturally when nothing remains — no explicit stop condition
needed. **Review-change checkpoints are skipped in this mode; run
`/review-change` once at the end** before opening the PR.

Use this when the SPEC is solid and you want to review the whole branch at once
rather than after every two phases. For incremental, phase-by-phase review,
stick to the default (manual re-invocation + checkpoint hand-offs).

## Relationship to other skills

- Planned by `plan-feature` (features) or `plan-fix` (fixes); executes their SPEC.
- **Hands off** to `review-change` at the review checkpoint (every 2 phases / before
  the PR) — it runs at its own model/effort, not composed in this skill's turn.
  `fix-now` findings fold back here; `postpone` routes to `triage-issue`.
- The completed branch is gated by `audit-pr` before merge.

## Done when

- The requested scope is implemented (one phase, or the whole SPEC for
  single-pass/`--fix`), the project's gate is green, per-phase docs are updated,
  and the work is committed on the correct branch — stopped for review, nothing
  bundled beyond the requested scope.
