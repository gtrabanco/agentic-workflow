# fix/100-stale-fix-index-rows

## Goal

Drop the 21 stale rows from `docs/fix/README.md`'s Active table that point to
already-merged PRs, restoring the table's own stated invariant ("Entry is
removed from this table on merge") so `workflow-status` step 4 stops reading
a stale ground truth for outstanding fix work.

## Issue

`#100` — GitHub issue. The PR closes it via `Closes #100` in the body.

## Branch

`fix/100-stale-fix-index-rows`

## Depends on

— (independent)

## Root cause

The row-drop cleanup step (last performed in PR #46, which correctly dropped
rows for #33/#35/#39/#40 after they merged) was not repeated after any of the
21 fix PRs that merged since — no mechanism enforces it happening
automatically, so the "Active" table only ever grew.

## Detected in

`/product-audit` run on 2026-07-19 (Workflow discipline / Process & docs
dimension). Confirmed by cross-referencing every row in
`docs/fix/README.md`'s Active table (lines 15-37, 21 rows) against
`gh pr view <n> --json state` for #48, #50, #53, #55, #58, #68, #69, #70,
#75, #83, #84, #85, #88, #90, #91, #92, #94, #95, #96, #98, #99 — all
`MERGED` (re-verified during this SPEC's drafting).

## Scope

### In scope

- Remove the 21 rows from `docs/fix/README.md`'s Active table whose linked
  PR is `MERGED` (folders on disk under `docs/fix/` are retained, per the
  table's own stated convention — only rows are dropped).

### Out of scope

- Changing the table's stated convention ("Entry is removed from this table
  on merge") — the issue's own acceptance criteria says this fix cleans up
  the backlog, it does not change the rule.
- `docs/features/ROADMAP.md`'s stale 2026-07-05 merge-order note — tracked
  separately in `docs/fix/101-stale-roadmap-merge-order-note/`.
- Adding automation/enforcement so this doesn't recur — no such mechanism is
  requested by the issue; noting it here only as a pointer, not scope.

## Acceptance

- [x] `docs/fix/README.md`'s Active table contains zero rows whose linked PR
      state is `MERGED` (verified via `gh pr view <n> --json state` for
      every remaining row after the edit — only the new #100 pending row
      remains).
- [x] The 21 folders on disk under `docs/fix/` for the removed rows are
      untouched (not deleted) — verified with `ls docs/fix/`.
- [x] The table's "Entry is removed from this table on merge" convention
      text is unchanged.

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

### P1 — Drop stale merged rows

Layer: `docs`. Done-when:
`grep -c '| \`' docs/fix/README.md` → returns `0` (all rows removed from the
Active table; header/legend rows untouched).

- [x] Remove the 21 stale rows from `docs/fix/README.md`'s Active table
      (folders on disk untouched) — evidence: `docs/fix/README.md:15-17`

### P2 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #100`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #100` and push

## Testing

Docs-only change; no test layer applies. Verification is the `grep`
done-when above plus a visual diff review confirming only Active-table rows
were removed.

## Rollback

Single `git revert` of the PR commit — the removed rows are recoverable from
git history at any time. No data-side cleanup (documentation-only).

## Status

`in-progress`

## Cross-issue notes

None found blocking, blocked-by, overlapping, or absorbable via
`gh issue list --state open` / `gh pr list --state open` at drafting time,
other than sibling fix #101 (different file, different defect class — kept
separate per the shared-root-cause checklist).

## Effort

XS (1 commit, ≤ 1h) — mechanical row removal in one Markdown table, no code.

## Decisions made during drafting

- Kept the table's stated convention text unchanged, per the issue's own
  acceptance criteria (cleanup only, not a rule change).
- Did not merge with #101 into one unit: different files
  (`docs/fix/README.md` vs `docs/features/ROADMAP.md`) and different defect
  classes (stale merged-PR rows vs. a stale one-time merge-order note) —
  fails the shared-root-cause checklist's first box.
