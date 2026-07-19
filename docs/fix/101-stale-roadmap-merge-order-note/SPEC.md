# fix/101-stale-roadmap-merge-order-note

## Goal

Remove the dead "Merge order & shared-file coupling (2026-07-05)" note from
`docs/features/ROADMAP.md` — a one-time sequencing instruction for PRs #8,
#9, #10 (all merged long ago) that now has zero forward-looking value and is
read on every `workflow-status`/`design-feature` invocation.

## Issue

`#101` — GitHub issue. The PR closes it via `Closes #101` in the body.

## Branch

`fix/101-stale-roadmap-merge-order-note`

## Depends on

— (independent)

## Root cause

The note was added as a one-time sequencing instruction for the initial
three-feature merge window (2026-07-05, features 01-03 sharing overlapping
files). It was never cleaned up once the window closed — no mechanism
enforces removing a one-time note after its triggering PRs merge.

## Detected in

`/product-audit` run on 2026-07-19 (Roadmap coherence dimension). Confirmed
via `gh pr view 8/9/10 --json state,mergedAt` — all three `MERGED` on
2026-07-05, closing the file-coupling window the note existed to protect.

## Scope

### In scope

- Remove the "Merge order & shared-file coupling (2026-07-05)" note
  (`docs/features/ROADMAP.md` lines 29-39) in its entirety.

### Out of scope

- `docs/fix/README.md`'s 21 stale merged-PR rows — tracked separately in
  `docs/fix/100-stale-fix-index-rows/`.
- Any other content in `docs/features/ROADMAP.md` (the Features table, the
  status legend, etc.) — untouched.

## Acceptance

- [x] `docs/features/ROADMAP.md` no longer contains the
      "Merge order & shared-file coupling (2026-07-05)" note.
- [x] The Features table (rows 01-17) and Status legend are byte-for-byte
      unchanged aside from the removed note.
- [x] The note remains recoverable from git history (no `--amend`/force-push
      involved in this fix).

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**
and ticks tasks here.

### Phase-lint (authoritative copy — keep in sync with `docs/features/_TEMPLATE/SPEC.md` `### Phases`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.

- [ ] Title names ONE deliverable — FAIL if it joins nouns with `+`, `,`,
      `&`, `and`/`y`, or `/`.
- [ ] One declared layer — each phase declares exactly one of the fixed enum
      `schema/db | domain | api | ui | config/infra | docs | hardening |
      close-out`; FAIL if any task's target file belongs to another. Tests
      for the phase's own layer belong to the phase; a test-only phase
      declares `hardening`.
- [ ] ≤ 8 tasks (close-out phase: ≤ 10, only the literal close-out chain).
- [ ] One checkbox = one deliverable — FAIL if a task contains a `→` chain
      of implementation steps, enumerates > 3 cases/scenarios, or creates
      > 1 file of distinct concerns.
- [ ] Zero decision words — FAIL on `Decide`, `choose`, `OR` between
      alternatives, `If … then <change scope>`.
- [ ] No conditional scope mutation — a task may not move work between
      phases at runtime.
- [ ] No external/manual gates inside implementation phases —
      human/out-of-repo verifications live in the hardening/close-out phase,
      marked `manual`.
- [ ] Machine-checkable done-when — every phase ends with one verifiable
      invariant (a command + expected outcome).

### P1 — Remove the stale merge-order note

Layer: `docs`. Done-when:
`grep -c 'Merge order & shared-file coupling' docs/features/ROADMAP.md` →
returns `0`.

- [x] Delete the "Merge order & shared-file coupling (2026-07-05)" blockquote
      from `docs/features/ROADMAP.md` (Features table and Status legend
      untouched) — evidence: `grep -c 'Merge order & shared-file coupling'
      docs/features/ROADMAP.md` → `0`

### P2 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #101`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #101` and push

## Testing

Docs-only change; no test layer applies. Verification is the `grep`
done-when above plus a visual diff review confirming only the note block was
removed.

## Rollback

Single `git revert` of the PR commit — the note is recoverable from git
history at any time. No data-side cleanup (documentation-only).

## Status

`in-progress`

## Cross-issue notes

None found blocking, blocked-by, overlapping, or absorbable via
`gh issue list --state open` / `gh pr list --state open` at drafting time,
other than sibling fix #100 (different file, different defect class — kept
separate per the shared-root-cause checklist).

## Effort

XS (1 commit, ≤ 1h) — mechanical deletion of one dead blockquote.

## Decisions made during drafting

- Chose **delete** over **relocate** (the issue's acceptance criteria leaves
  this to the maintainer). The note is a one-time, closed-window instruction
  with zero remaining audience; git history and `git log -p` on this file
  already preserve it verbatim, so relocating it into `CHANGELOG.md` or
  `docs/workflow/MIGRATION.md` would only duplicate that history without
  adding value. If the user disagrees, this is trivially reverted /
  redirected before merge.
- Did not merge with #100 into one unit: different files
  (`docs/features/ROADMAP.md` vs `docs/fix/README.md`) and different defect
  classes (a stale one-time merge-order note vs. stale merged-PR rows) —
  fails the shared-root-cause checklist's first box.
