# fix/82-phase-lint-heading-wrap

> Fix specification. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. Lighter than a feature spec — no
> separate planning artifacts: the SPEC alone is the source of truth,
> and its `## Phases` section is the execution ledger.

## Goal

The `Phase-lint` sub-section heading — added by fix #64 (PR #75) to both SPEC
templates — wraps onto a second physical line in the source Markdown. Under
CommonMark an ATX heading (`#`…`####`) is exactly one physical line, so the
wrapped continuation renders as a **separate, stray paragraph** directly beneath
the heading. This fix joins each heading onto one physical line so it renders as
a single heading. It is folded into a normal touch of the template files (the
`postpone` verdict's natural trigger — "the next substantive touch of either
template file") rather than deferred indefinitely, because the templates are the
copy every SPEC inherits, so the mis-render is visible in every downstream copy.

## Issue

`#82` — GitHub issue. Required. The PR must close it via `Closes #82` in the
body.

## Branch

`fix/82-phase-lint-heading-wrap`

## Depends on

Empty — independent.

## Root cause

Fix #64 (PR #75, `docs/fix/64-phase-atomicity-lint/`) introduced the mechanical
8-box phase-lint checklist and its section heading into both SPEC templates. The
heading text plus its parenthetical cross-reference was authored across two
physical source lines:

- `docs/fix/_TEMPLATE/SPEC.md:61-62`:
  ```
  ### Phase-lint (authoritative copy — keep in sync with
  `docs/features/_TEMPLATE/SPEC.md` `### Phases`)
  ```
- `docs/features/_TEMPLATE/SPEC.md:199-200`:
  ```
  #### Phase-lint (quoted — authoritative copy is
  `docs/fix/_TEMPLATE/SPEC.md` `## Phases` "Phase-lint"; keep in sync)
  ```

CommonMark's ATX-heading rule: only the first physical line is the heading; the
second line becomes an orphaned paragraph. The 8 checklist boxes themselves
render correctly — the defect is confined to the heading's own line.

## Detected in

`/review-change` on `fix/64-phase-atomicity-lint` (PR #75), finding **B**, then
triaged via `/triage-issue` on 2026-07-17 (verdict: `postpone`, `postponed`
label applied — real but low-severity/cosmetic, deferred to the next template
touch). Now planned to fold into that touch.

## Scope

### In scope

Join each of the two wrapped `Phase-lint` headings onto a single physical line,
byte-for-byte identical except for the removed line break and the single space
that joins the two halves:

- `docs/fix/_TEMPLATE/SPEC.md` — the `### Phase-lint (…)` heading.
- `docs/features/_TEMPLATE/SPEC.md` — the `#### Phase-lint (…)` heading.

No other characters change; the parenthetical wording, backticks, and
cross-reference paths stay exactly as authored.

### Out of scope

- The 8 phase-lint checklist boxes' wording or semantics — unaffected, render
  correctly; not touched.
- Any other wrapped heading elsewhere in the repo — if one exists it is a
  separate defect; file its own `docs/fix/` entry.
- Existing already-drafted SPECs under `docs/fix/<n>-*/` and
  `docs/features/<n>-*/` that copied the pre-fix template — they are historical
  artifacts, not re-generated; not touched.

## Acceptance

- [x] `docs/fix/_TEMPLATE/SPEC.md` — the `### Phase-lint` heading and its full
      parenthetical are on one physical line ending in `)`; no orphan paragraph
      line remains beneath it.
- [x] `docs/features/_TEMPLATE/SPEC.md` — the `#### Phase-lint` heading and its
      full parenthetical are on one physical line ending in `)`; no orphan
      paragraph line remains beneath it.
- [x] The cross-reference text inside each parenthetical is unchanged (same
      paths, backticks, and "keep in sync" wording).
- [x] The 8 phase-lint checklist boxes below each heading are byte-for-byte
      unchanged.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**
and ticks tasks here. **Always ≥ 2 phases**: `P1..Pn` implement the fix
(each task independently checkable, no judgement); the final phase is
always `Hardening & PR` — keep its pre-written tasks **literally**, never
paraphrase or merge them into an implementation phase.

### Phase-lint (authoritative copy — keep in sync with `docs/features/_TEMPLATE/SPEC.md` `### Phases`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.

- [x] Title names ONE deliverable — the join of two wrapped headings, one
      deliverable (single-line headings).
- [x] One declared layer — `docs`.
- [x] ≤ 8 tasks — 2 tasks.
- [x] One checkbox = one deliverable — each task edits one heading in one file,
      no `→` chain, no > 3 cases, one file.
- [x] Zero decision words — no `Decide`/`choose`/`OR`/conditional.
- [x] No conditional scope mutation — none.
- [x] No external/manual gates inside implementation phases — none; verification
      is a local grep, run in the hardening phase.
- [x] Machine-checkable done-when — grep invariant stated below.

### P1 — Join the wrapped Phase-lint headings

Layer: `docs`. Done-when:
`grep -nE '^#{3,4} Phase-lint \(.*\)$' docs/fix/_TEMPLATE/SPEC.md docs/features/_TEMPLATE/SPEC.md`
→ prints exactly 2 lines (one per file, each ending in `)`) AND
`` `grep -nE '^`docs/(features|fix)/_TEMPLATE/SPEC.md` ' docs/fix/_TEMPLATE/SPEC.md docs/features/_TEMPLATE/SPEC.md` ``
→ prints nothing (no orphan continuation line remains).

- [x] `docs/fix/_TEMPLATE/SPEC.md`: join the `### Phase-lint (authoritative copy
      — keep in sync with` line and its `` `docs/features/_TEMPLATE/SPEC.md`
      `### Phases`) `` continuation into one physical line, single space between
      the two halves.
- [x] `docs/features/_TEMPLATE/SPEC.md`: join the `#### Phase-lint (quoted —
      authoritative copy is` line and its `` `docs/fix/_TEMPLATE/SPEC.md`
      `## Phases` "Phase-lint"; keep in sync) `` continuation into one physical
      line, single space between the two halves.

### P2 — Hardening & PR

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip
- [x] `git push`
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #82`
- [x] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #82` and push

## Testing

No automated test — this repo has no application build. Verification is the P1
done-when grep invariant plus a visual confirmation that each heading renders as
a single heading in a CommonMark previewer (Markdown well-formedness is part of
the repo's "green" definition in `CLAUDE.md` › Verification). At the
architecture level: the two `_TEMPLATE/SPEC.md` files are the source every SPEC
copies from, so the single grep covers every future downstream copy.

## Rollback

`git revert <merge-commit>` (or revert the PR from the forge). No data-side
cleanup — documentation-only change, no schema, cache, or runtime state. Nothing
is lost on revert; the pre-fix wrapped-heading source is restored verbatim.

## Impact

- **Layers touched**: docs only (`docs/fix/_TEMPLATE/`, `docs/features/_TEMPLATE/`).
  No skill, schema, or code layer.
- **Modules and files**: `docs/fix/_TEMPLATE/SPEC.md` (line 61-62),
  `docs/features/_TEMPLATE/SPEC.md` (line 199-200).
- **Blast radius**: dev-only, cosmetic. Mis-rendered heading in a template every
  SPEC copies from; no lint semantics, box wording, or cross-copy sync marker is
  affected.
- **Detection lead time**: silent (cosmetic) — surfaced only by a human reading
  the rendered template; caught here by `/review-change` + `/triage-issue`.

## Rules that must never be violated

- **Docs language is English** (`CLAUDE.md` › Working rules) — headings stay
  English; only the physical line break changes.
- **SPEC templates are EN-only, no ES sibling** (`CLAUDE.md` › Working rules,
  scope exception) — neither template has a `.es.md` sibling; no bilingual sync
  is triggered.
- **Stack/architecture agnostic** (`CLAUDE.md` › Working rules) — no product,
  stack, or framework reference introduced.
- **The two Phase-lint copies stay in sync** (each heading's own parenthetical
  says so) — this fix changes only whitespace, so the copies remain in sync.

## Operational risks

None — no scheduled job, queue, cache, schema, or external adapter. Pure text
edit to two Markdown files.

## Security risks

None — no auth, secrets, PII, webhooks, or rate-limits involved.

## Compliance touchpoints

n/a — documentation whitespace change; no domain/compliance rule applies.

## Affected docs

- `docs/fix/_TEMPLATE/SPEC.md` — the `### Phase-lint` heading (this is itself the
  edited file; the edit is the doc update). Acceptance criterion above covers it.
- `docs/features/_TEMPLATE/SPEC.md` — the `#### Phase-lint` heading (same).
- `docs/fix/README.md` — the fix-index row for this fix (added by `plan-fix`,
  flipped to `done` in the Hardening phase).

## Observability

n/a — no runtime surface. "Live and healthy" = the merged template renders the
heading as a single heading; confirmed by the P1 grep invariant, not by a prod
log/metric/alert.

## Cross-issue notes

- No other open issue or PR touches these template files (open set at planning
  time: only #82; no open PRs). Nothing blocks, is blocked by, or absorbs this
  fix.
- Fix #64 (PR #75, merged) is the origin of the defect but is closed — this fix
  amends its artifact, it does not depend on it.

## Effort

**XS** — one commit, ≤ 1h. Two single-line whitespace joins in two Markdown
files, no code, no test, no build.

## Decisions made during drafting

- Chose to fold this into a planned unit now (rather than wait for an unrelated
  template edit) because the `postpone` verdict's stated trigger is "the next
  substantive touch of either template file", and the user invoked `/plan-fix 82`
  — treating that as the decision to take the touch now. Re-questionable: if the
  implementer prefers, this can still ride along with a larger template edit
  instead of its own PR.
- Kept each parenthetical's exact wording (including the `### Phases` /
  `## Phases` cross-reference labels as originally authored) — the fix is a line
  join only, not a wording correction. If the cross-reference labels are
  themselves wrong, that is a separate defect for its own issue.

## Status

`done`
