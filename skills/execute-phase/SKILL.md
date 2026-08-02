---
name: execute-phase
user-invocable: true
version: 2.13.0
argument-hint: <NN> [P<k>] | --fix <n> [P<k>] | [--force]
allowed-tools: [Bash, Read, Edit, Write, MultiEdit]
author: "Gabriel Trabanco <gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Implement exactly one planned feature or fix phase with pre-edit gates,
  verified commit discipline, and final PR close-out. Use --fix for fix SPECs;
  --force is user-only. Triggers: "execute-phase", "implement phase", "build
  feature from spec", "execute fix".
---

# Execute Phase

Three modes:

- **feature phase** (default) — implement one phase of `docs/features/<NN>-<slug>/` using its `TASKS.md`.
- **single-pass unit** — a small feature (SPEC `Size: XS/S`; only a `SPEC.md`, no planning artifacts): execute its SPEC's `## Phases` **one phase per invocation**; a SPEC without `## Phases` runs end-to-end in one pass (legacy fallback — see *Workflows*).
- **`--fix`** — implement a fix from `docs/fix/<n>-<topic>/`: same phased consumption and legacy fallback.

## Turn contract — every invocation, verify before ending the turn

```
✓ 1. Branch verified FIRST: `git branch --show-current` was RUN and its output
     pasted. Output = the default branch → `git switch -c <branch>` was RUN
     before any edit. NEVER work on main/master.
✓ 2. Phase-lint pre-flight guard RUN against the target phase (after the
     dependency/own-status gates, before any edit) — its 8 boxes were checked,
     not assumed. Any FAIL without `--force` → STOP with the fixed block; no
     edit happens on a non-atomic phase.
✓ 3. Architectural-invariant gate RUN before any edit: every applicable project
     rule was classified with cited repository evidence. `violates`,
     `introduces`, or `changes` → STOP for an explicit architectural decision;
     no edit turns the result into a phase task. An absent invariant document is
     recorded as `n/a: no project invariants declared` and remains compatible.
✓ 4. The gate was RUN (not assumed): commands + exit codes pasted.
✓ 5. `git add <files>` and `git commit -m "<type>(<scope>): <summary>"` were
     EXECUTED and the resulting sha is pasted. Describing a commit you did not
     run counts as NOT committed.
✓ 6. Unit finished (single-pass, --fix, or final phase)? Then `git push` and
     `gh pr create` were EXECUTED and **the PR URL is printed in the chat**
     (not every agent shows open PRs — the link in the chat is the contract).
     The PR body is NEVER empty: what it does, why, evidence, and
     `Closes #<n>` when issue-born. The body is passed with `--body-file`
     (real Markdown, NO `\`-escaped backticks — see Issue policy). AND the roadmap row (or fix-index entry)
     was updated to `done · [#<pr>](<pr-url>)` in a follow-up
     `docs: link PR #<n>` commit, pushed to the same branch. A `done` row
     without its PR link is an UNFINISHED unit. Unit not finished? Then
     NOTHING was pushed.
✓ 7. Clean-tree check LAST: `git status --porcelain` was RUN and its output
     pasted immediately before ending the turn. Any tracked modification —
     CODE OR DOCS (`docs/**` counts; doc updates left uncommitted are the #1
     close-out failure) — was committed before the turn ended. AND if the
     branch has an open PR: `git status -sb` shows the branch is NOT ahead of
     its remote (every commit pushed). A dirty tree or an unpushed commit on a
     PR-backed branch = the turn is NOT done.
✓ 8. Artifact language: explicit user instruction > the project's declared
     docs language > English. The CONVERSATION language never decides — a
     Spanish prompt still produces English commits/PRs/issues unless one of
     the first two says otherwise.
✓ 9. Descope guard applied to every issue created this turn (see *Descope
     guard* under *Issue policy*): each classified discovered vs. descope; any
     descope has a user-approved, dated `## Amendments` entry in the governing
     SPEC created BEFORE the issue, and the issue links it. No issue created
     this turn is the first record of a descope. No issues created this turn?
     Box passes trivially — state so.
✓ 10. Every out-of-scope finding discovered during implementation was classified
     with the Opportunistic finding policy, recorded in `decisions.md`, and
     handled only by its recorded decision. No finding? State `none`.
✓ 11. The closing `→ Next:` block is printed as the ABSOLUTE last output.
```

**Push policy — two regimes, by whether the PR exists yet.** Before the PR:
push happens exactly once, at the PR step — never mid-phase, never unasked,
never to the default branch. **After the PR exists:** every subsequent commit
on that branch (folded review findings, audit-blocker fixes, doc updates, the
`docs: link PR` commit) is pushed **immediately after committing** — an open
PR must always show the branch's latest state; CI and the merge gate judge
the remote, not your working copy. If, about to end the turn, any box is
unchecked: STOP and complete it now — a turn that ends with work implemented
but uncommitted, committed but unpushed (PR open), or committed but missing
its PR (finished units), is a FAILED turn, not a done one.

## Hard rules

- Honor the project's **Workflow conventions** (branch/PR, gate-before-commit, docs-language). Run `git branch --show-current` before any edit/commit; if `main`, create the working branch first (assistant only; the user may use `main`).
- **Phases are `P1, P2, …`.** The `<phase>` argument and every reference in `PLAN.md`/`TASKS.md`/`progress.md`/commits is `P1, P2, …` ("phase N") — **never** `S1`/`S2`/"Step N". If a plan you're handed uses `S1`-style labels, normalize it to `P1, …` before executing and note it in `decisions.md`.
- Implement only the requested scope — one phase (feature mode) or the whole SPEC (single-pass/fix). Never bundle phases unless asked.
- Stop after the gate passes; keep commits small and reviewable.
- Feature mode: update `TASKS.md`, `progress.md`, `testing.md`, `known-issues.md` each phase (and `decisions.md` if architecture moved).
- **When reality contradicts the plan** (a task is impossible, an assumption is wrong, a better path appears): update `TASKS.md`/`PLAN.md` and record why in `decisions.md` — never silently diverge from the written plan.
- **Dependency gate before any work** — see the section below. No edit, no branch, no commit happens for a unit whose dependency closure isn't merged, unless the user passed `--force`.
- **Phase-lint pre-flight guard before any edit** — see the section below, right after the dependency/own-status gates. No edit happens for a phase that fails the canonical 8-box phase-lint, unless the user passed `--force`.

## Context budget (hard rule — small models re-pay full context every turn)

- **File cap: read at most 10 files in full per phase**, beyond the unit's
  own docs (`SPEC.md`, the phase's `TASKS.md` section, `progress.md`).
  Targeted reads (≤ 50 lines of a named range) and grep/glob results do NOT
  count against the cap. About to exceed it → STOP reading; record what you
  know and what's still unverified in the phase's `Gotchas:` line, then
  proceed on what targeted reads can confirm, or report the blocker — never
  sweep the codebase.
- **Summarize, don't hold.** The moment a file yields the fact you needed,
  write the fact (with its `file:line`) into your working notes / the
  progress entry and work from the note. Never re-read a file already
  summarized; never quote whole files into the conversation.
- **Step 0 minimum set (fixed).** Discovery reads exactly: the agent guide's
  Workflow conventions + the architecture doc section covering the phase's
  declared `Layer:` + the optional invariant document when the documentation
  map declares one. Nothing else by default; every additional doc counts
  against the file cap.

## Phase handoff record (`progress.md` — fixed schema)

Every phase ends by APPENDING one entry to the unit's `progress.md`. Feature
mode: the file `plan-feature-scaffold` created. Phased XS/S single-pass and
`--fix` units: create `progress.md` beside the SPEC on P1 (the SPEC's
checkboxes stay the task ledger; this file is the **handoff channel**).
Fixed schema — all five lines present, `none` is a valid value, free prose
is not:

```
## P<k> — <YYYY-MM-DD>
- Done: <the phase's delivered tasks, one line>
- Remains: <in-unit work still open, or none>
- Gotchas: <surprises, workarounds, or decisions the NEXT phase must know, or none>
- Files: <paths touched>
- Next: P<k+1> — <its title> | unit finished
```

The entry rides the phase commit (no sha in the entry — the commit that
carries it IS the phase's sha; `git log` resolves it). The next phase
starts in a **fresh conversation** and reads ONLY `SPEC.md`, its own phase's
`TASKS.md` section (or SPEC `## Phases`), and `progress.md` — this file IS
the handoff; never rely on session memory from a previous phase.


## Progressive loading — mandatory route before acting

This entrypoint carries only the universal turn contract and handoff schema.
Load route detail from the links below **before** the step that needs it. Read
only the listed files; every resource is one hop from this file.

1. Every invocation: read [preflight gates](references/PREFLIGHT.md), run them,
   and stop on any contracted blocker before editing. This mandatory route owns
   the `docs/workflow/REPOSITORY_STATE.md` and Architectural invariants gates.
2. Before implementation: read [execution contract](references/EXECUTION_CONTRACT.md)
   plus [mode workflows](references/WORKFLOWS.md). Select feature, phased XS/S,
   legacy single-pass, or fix from the target artifacts; do not load another mode.
3. Only when creating a forge body, discovering out-of-scope work, or considering
   an issue: read [issue and finding policy](references/ISSUE_POLICY.md).
4. For implementation guidance and review/finish routing: read
   [closeout](references/CLOSEOUT.md). On a folded review/audit finding also read
   [folding](references/FOLDING.md).
5. Only for `/loop`, an external driver, manual batching, or a missing vendor
   feature: read [batch and portability](references/BATCH_AND_PORTABILITY.md).

The fixed blocks in a selected resource are normative: copy them exactly.
Missing/unreadable required resource → STOP; never reconstruct it from memory.

## Portability

The core contract is vendor-neutral. When the platform lacks slash commands,
per-skill tiers, or a loop primitive, read
[batch and portability](references/BATCH_AND_PORTABILITY.md) and use its explicit
fallback; never skip the underlying workflow step.

## Relationship to other skills

- Planned by `plan-feature` (features) or `plan-fix` (fixes); executes their SPEC.
- **Hands off** to `review-change` — recommended at a trigger-based checkpoint
  (layer boundary, accumulation, or sensitivity; skippable), **mandatory** when
  finishing a unit — it runs at its own model/effort, not composed in this
  skill's turn. `fix-now` findings fold back here; non-fix-now routes through
  `triage-issue`.
- A finished unit (single-pass, `--fix`, or final phase) **always opens its PR and
  flips to `done`**; `audit-pr` then gates the merge (it blocks on pending docs or a
  prematurely-dropped issue entry).
- **Every invocation ends by printing the next step.**

## Done when

- The requested scope is implemented (one phase, or the whole SPEC for
  single-pass/`--fix`), the project's gate is green, per-phase docs are updated, and
  the work is committed on the correct branch — nothing bundled beyond the requested
  scope.
- **The tree is clean and the remote current:** `git status --porcelain` is empty
  (docs included) and, when the branch has an open PR, nothing is left unpushed.
- **A finished unit additionally:** is flipped to `done`, has its PR opened (never
  branch-only) with **the PR URL printed in the chat**, and prints the mandatory
  `/review-change` hand-off as the next step.
