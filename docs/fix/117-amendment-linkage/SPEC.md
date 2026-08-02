# fix/117-amendment-linkage

> Fix specification. Copy this folder to
> `docs/fix/<issue-number>-<topic>/`, fill every section, register the
> entry in `docs/fix/README.md`. Lighter than a feature spec — no
> separate planning artifacts: the SPEC alone is the source of truth,
> and its `## Phases` section is the execution ledger.

## Goal

Close issue #117, which was created solely to provide a real issue reference
for a SPEC amendment row. The amendment linkage is already committed in PR #116
(commit `366f539`); this fix completes the administrative loop by closing the
referencing issue itself.

## Issue

`#117` — tracked issue in the project's forge. The PR must close it via
`Closes #117` in the body.

## Branch

`fix/117-amendment-linkage`

## Depends on

None. PR #116 (where the linkage was committed) is already merged into `main`.

## Root cause

The user-approved descope of P8 adversarial review was recorded as an
amendment row in `docs/features/20-runtime-guardrails-progressive-skills/SPEC.md`
(line 284). Per the governing audit-pr BLOCKED verdict (finding F50, scope
integrity/descope blocker), every amendment row must link a real existing issue.
Issue #117 was created to provide that link; the linkage was committed in PR #116
(commit `366f539`). The remaining gap: issue #117 itself was never closed.

## Detected in

`/audit-pr` on head `249775a` returned a BLOCKED verdict with F50 as the scope
integrity/descope blocker. The fix (commit `366f539`) added the `#117` linkage;
the issue remained open.

## Scope

### In scope

- Close GitHub issue #117 via `gh issue close 117`.

### Out of scope

- Modifying the feature SPEC amendment row — it already references `#117` and is
  correct as-is (PR #116, commit `366f539`).
- Re-running `/audit-pr` — this is a manual verification step, not a fix action;
  the linkage is already present and the blocker is resolved by closing #117.
- Any other feature/fix work — this is a single-issue administrative closure.

## Acceptance

### Spec-lint (mechanical — presence checks only)

- [ ] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing).
- [ ] `### Out of scope` has ≥ 1 concrete bullet.
- [ ] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified`.
- [ ] Every phase passes the 8-box Phase-lint below.

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

### P1 — Close issue #117

Layer: close-out. Done-when: `gh issue view 117 --json state` → `"state": "CLOSED"`.

- [x] `gh issue close 117` — closes the issue that served as the amendment
      linkage reference for the user-approved P8 descope.

### P2 — Hardening & PR

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip
- [x] `git push`
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #117`
- [x] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #117` and push

## Testing

`read-verified`: Issue state transition from `OPEN` to `CLOSED` via `gh issue view 117 --json state`.

## Rollback

`gh issue reopen 117` — reopens the issue. No data-side cleanup needed.

## Status

`done`

(Removed from `docs/fix/README.md` only **after** the PR merges.)

## Impact

- **Layers touched:** Issue tracker only (GitHub). No code, no docs, no config.
- **Modules/files:** `docs/fix/117-amendment-linkage/SPEC.md` (this file),
  `docs/fix/README.md` (index entry).
- **Blast radius:** None. Closing an issue has no operational impact.
- **Detection lead time:** Immediate — issue state changes are visible in the
  forge as soon as the PR merges.

## Rules that must never be violated

- **One PR per unit of work, always against `main`.** (CLAUDE.md, Working rules)
- **Docs language is English.** (CLAUDE.md, Working rules)
- **Never push, never open the PR** from `plan-fix` — that is `execute-phase --fix`.
  (plan-fix skill, Hard rules)

## Operational risks

None. This fix touches only the GitHub issue tracker.

## Security risks

None. No auth, secrets, PII, webhooks, or rate-limit concerns.

## Compliance touchpoints

n/a — no domain or compliance rules apply to closing a documentation linkage issue.

## Affected docs

- `docs/fix/README.md` — add index entry with status `pending`, referencing `#117`.
- `docs/fix/README.md` — after PR merge, update row status to `done · [#<pr>]`.

## Observability

n/a — no runtime component. The observable is the issue state in the forge:
`gh issue view 117 --json state` must show `"CLOSED"`.

## Cross-issue notes

- **PR #116** (merged) — introduced the descope and the `#117` linkage. This fix
  resolves the remaining gap (issue still open).
- **`/audit-pr` BLOCKED verdict (F50)** — the scope integrity/descope blocker is
  resolved by the `#117` linkage already present in the SPEC amendment row (line 284).
  Closing #117 completes the chain.

## Effort

XS — one `gh issue close` command, one commit, one PR. ≤ 1 hour.

## Decisions made during drafting

- Single-issue scope: #117 is the only issue passed as input and the only one
  that needs action. No multi-issue analysis needed.
- No re-run of `/audit-pr` in the phases: the linkage is already committed in
  PR #116; closing #117 is the actual fix. A re-run would be manual verification,
  not a fix action.
- The amendment row in the feature SPEC is already correct — no edit needed.
  The only action is closing the referencing issue.
