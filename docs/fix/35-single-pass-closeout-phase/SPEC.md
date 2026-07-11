# fix/35-single-pass-closeout-phase

## Goal

Stop single-pass units (fixes and XS/S features) from losing their close-out
chain (commit → status flip → push → PR → link commit → second push) when
executed by models below the Claude reference tier. Planning always emits
**at least 2 phases** — `P1..Pn` implementation plus a final
`P(n+1) — Hardening & PR` phase whose only job is the close-out — so the
chain runs in a fresh turn with no "main work" to eclipse it. It cannot wait:
every weak-model run of `execute-phase --fix` or a single-pass feature risks
an orphaned branch, a missing PR, or a hand-merge to `main` that breaks
`Closes #N` traceability — the operator has already been forced into both.

## Issue

`#35` — the PR closes it via `Closes #35`.

## Branch

`fix/35-single-pass-closeout-phase`

## Depends on

None.

## Root cause

The single-pass design puts the entire close-out chain at the tail of the
implementation turn:

- `skills/execute-phase/SKILL.md` — Workflows "Single-pass" step 7 and
  "`--fix`" step 7 both say "Mark done + open the PR — always (**this is the
  last step**)" of the same turn that implemented the code.
- `skills/plan-fix/SKILL.md` — emits a SPEC with no phases at all (the fix
  template `docs/fix/_TEMPLATE/SPEC.md` states "no Phase 0 planning
  artifacts. The SPEC alone is the source of truth").
- `skills/plan-feature-scaffold/SKILL.md` — Process step 4: "XS/S → the SPEC
  is the only planning artifact … hand off to `execute-phase <NN>`
  (single-pass). Don't generate ceremony the feature doesn't need."

The design assumed the executor honors turn-contract boxes 3–5
(`skills/execute-phase/SKILL.md` "Turn contract"). Frontier models do; weaker
tiers repeatedly truncate the chain once the implementation "feels done" —
the exact failure class `docs/workflow/GOLDEN_FIXTURE.md` exists to catch.
M/L features don't fail this way at unit end because the scaffold already
emits a dedicated final hardening phase whose `TASKS.md` checklist ends with
the literal close-out tasks (`skills/plan-feature-scaffold/SKILL.md`,
Process step 4, `TASKS.md` bullet).

## Detected in

Recurring operator reports across real `execute-phase --fix` and single-pass
feature runs with non-Claude models (2026-07); analyzed in the 2026-07-11
session. Issue #35.

## Scope

### In scope

**Skills (all bumps minor — no flag or invocation change):**

- `skills/plan-fix/SKILL.md` (`2.0.0 → 2.1.0`): the algorithm gains a
  "Phases" step — every fix SPEC carries a `## Phases` section with
  checkbox task lists: `P1..Pn` implementation (minimum 1; cut by the same
  cheap-executability checklist as `plan-feature-scaffold`) plus a final
  `P(n+1) — Hardening & PR` phase pre-filled with the **literal close-out
  tasks** (identical fixed wording to the M/L `TASKS.md` final-phase tasks:
  gate re-run, pending-docs check, status flip, push, `gh pr create
  --body-file` + PRINT THE PR URL, `done · [#<pr>](<pr-url>)` row update,
  `docs: link PR #<n>` commit, push). Hand-off block updated to
  `/execute-phase --fix` → executes `P1`.
- `skills/plan-feature-scaffold/SKILL.md` (`1.7.0 → 1.8.0`): XS/S stays
  SPEC-only (no PLAN/TASKS ceremony), but the SPEC's `### Phases` section
  must list ≥ 2 phases — `P1` implementation, `P2 — Hardening & PR` with the
  same literal close-out tasks. Completion report line changes from
  `Phases: … | single-pass` to always reporting the phase count.
- `skills/execute-phase/SKILL.md` (`2.0.0 → 2.1.0`): the `--fix` and
  single-pass workflows become **phased when the SPEC carries `## Phases`**:
  one phase per invocation (`execute-phase --fix <n> [P<k>]` /
  `execute-phase <NN> [P<k>]`; `P<k>` omitted → the first unticked phase in
  the SPEC — deterministic, no judgement), ticking the SPEC's phase checklist
  as the ledger (same reconcile-on-re-entry contract as `TASKS.md`). The
  close-out chain moves into the final phase's tasks. **Fallback:** a SPEC
  without `## Phases` (drafted before this change) runs the legacy
  single-pass flow unchanged — that fallback is what keeps the bump minor.
  Reword the two "this is the last step" step-7 blocks so the close-out is
  the final *phase's* content, not the implementation turn's tail; the turn
  contract (boxes 1–7) is unchanged.

**Templates (repo + exportable scaffold — kept in sync, same PR):**

- `docs/fix/_TEMPLATE/SPEC.md` and `template/docs/fix/_TEMPLATE/SPEC.md`:
  add the `## Phases` section with `P(n+1) — Hardening & PR` pre-written
  (checkboxes, literal close-out tasks) and drop the "no planning artifacts"
  phrasing that contradicts it.
- `docs/features/_TEMPLATE/SPEC.md` and
  `template/docs/features/_TEMPLATE/SPEC.md`: the `### Phases` section gains
  the XS/S rule (≥ 2 phases, last = `Hardening & PR`) and scopes the
  sentence "Opening the PR is the final *step* of the last phase, not a
  phase of its own" to M/L only.

**Workflow docs (wording sync, same PR):**

- `docs/workflow/FEATURE_WORKFLOW.md` (lines ~104, ~142, ~235, ~263),
  `docs/workflow/ISSUE_WORKFLOW.md` (~56), `docs/workflow/SKILLS.md` (~30),
  `docs/workflow/PORTABLE_PROMPT.md` (~73, ~83, ~98): replace
  "single-pass" hand-off wording with the phased shape
  (`execute-phase <NN> P1`, ≥ 2 phases, fallback noted once).
- `docs/workflow/GOLDEN_FIXTURE.md`: the toy SPEC's `### Phases` block
  (currently "**Single-pass (size XS)**.") becomes the new 2-phase shape so
  the fixture exercises exactly what this fix ships.

**Changelog:** `CHANGELOG.md` + `CHANGELOG.es.md` rows for the three skill
bumps (via `bump-skill`, which also refreshes the README tables if any
frontmatter `description` changed).

### Out of scope

- Removing or renaming the `--fix` shorthand (explicitly kept; a rename is a
  major bump and a migration note — not this change).
- Any M/L flow change (`PLAN.md`/`TASKS.md` shape, hardening-phase rule) —
  already correct; this change copies its close-out task wording, not the
  other way around.
- `ship-roadmap`'s driver loop (`skills/ship-roadmap/SKILL.md:312,319,401`
  reference the single-pass mode): it delegates to `execute-phase`'s
  SKILL.md, so the fallback keeps it working unchanged. Retiring its
  "single-pass" wording rides the next `ship-roadmap` touch — if drift shows
  up in practice, file it via `triage-issue`.
- `review-change:47` ("every unit (feature, single-pass, or fix)") — still
  accurate under the fallback; no edit.
- The machine envelope / orchestration contract — phase numbering already
  flows through `phase.current/total`; nothing changes shape.
- Post-merge removal of the fix-33 row from `docs/fix/README.md` (separate
  close-out, tracked in the session hand-off — not this SPEC).

## Impact

- **Layers touched:** skill wording + doc templates only — no code, no
  schema, no published package.
- **Modules/files:** the three SKILL.md files, four SPEC templates
  (repo + `template/`), five workflow docs, two changelogs (paths above).
- **Blast radius:** dev-only, but process-wide — every future fix and XS/S
  feature planned after this merges executes in ≥ 2 turns instead of 1.
  Frontier-model users pay one extra turn per small unit; weak-model users
  gain the close-out guarantee.
- **Detection lead time:** immediate on next use — a `plan-fix` SPEC missing
  `## Phases`, or an `execute-phase --fix` run that opens no PR, is visible
  in the very next unit shipped.

## Rules that must never be violated

- Phases are labelled `P1, P2, …` and called *phases* — never `S1`/"Steps"
  (CLAUDE.md "Phases are `P1, P2, …`").
- Fixed output contracts stay fixed: the close-out tasks are quoted
  **literally** in both planners and both templates — identical wording, so
  a weak model pattern-matches instead of paraphrasing (CLAUDE.md
  "Checklists over heuristics").
- `execute-phase`'s turn contract boxes 1–7 are untouched — this change adds
  a phase boundary, it never relaxes a box.
- Minor bumps only: no flag rename, no invocation break, legacy SPECs keep
  executing (CLAUDE.md "Version every change").
- PR bodies/issue bodies via `--body-file`, never inline escaping.
- All artifacts in English.

## Operational risks

- **In-flight units:** a fix or XS feature SPEC drafted before this change
  and executed after it has no `## Phases` → the fallback runs it legacy
  single-pass; no stranded state. Verify the fallback sentence exists in
  `execute-phase` (acceptance grep below).
- **Resume/crash-recovery:** phased single-pass units now rely on the SPEC's
  phase checklist as the re-entry ledger — the same reconcile contract
  `workflow-status`'s `RESUMABLE` verdict already assumes for `TASKS.md`;
  the executor wording must name the SPEC checklist explicitly for these
  units.
- **`ship-roadmap` autopilot:** spawns `execute-phase` per phase; with
  phased fixes its per-phase loop naturally covers `P(n+1)`. Risk is its own
  stale "single-pass" wording (out of scope, tracked above), not behavior.

## Security risks

n/a — documentation and skill wording only; no auth, secrets, PII, webhooks,
or rate-limit surface.

## Compliance touchpoints

n/a.

## Affected docs

Each is an acceptance criterion below:

- `docs/fix/_TEMPLATE/SPEC.md` + `template/docs/fix/_TEMPLATE/SPEC.md` —
  `## Phases` section added.
- `docs/features/_TEMPLATE/SPEC.md` +
  `template/docs/features/_TEMPLATE/SPEC.md` — XS/S phase rule added.
- `docs/workflow/FEATURE_WORKFLOW.md`, `ISSUE_WORKFLOW.md`, `SKILLS.md`,
  `PORTABLE_PROMPT.md`, `GOLDEN_FIXTURE.md` — single-pass wording replaced.
- `CHANGELOG.md` + `CHANGELOG.es.md` — three skill rows.

## Observability

No production surface. The health signal is process-level: every fix/XS SPEC
merged after this change contains `## Phases` (grep-able), and every unit's
branch history shows the close-out commits (`docs: link PR #<n>`) landing in
the final phase's turn. Degradation mode: a planner emitting a phase-less
SPEC again — caught by the acceptance grep re-run or the next
`GOLDEN_FIXTURE` pass.

## Cross-issue notes

`gh issue list --state open` / `gh pr list --state open` (2026-07-11): both
empty — no open issue or PR blocks, is blocked by, overlaps, or can absorb
this fix. Issue #35 is the only tracker.

## Effort

**M** — multi-file wording change across 3 skills + 9 docs with a mandatory
weak-model fixture run; ≤ 1 day, more than one commit.

## Phases

> This SPEC ships the rule it is written under — it dogfoods the ≥ 2-phase
> shape.

### P1 — Planners & executor: emit and consume phased single-pass SPECs

- [ ] `skills/plan-fix/SKILL.md`: add the "Phases" algorithm step + the
      `## Phases` SPEC section (literal close-out tasks in `P(n+1)`); update
      the Hand-off block; frontmatter `2.1.0` (via `bump-skill` in P2 if
      preferred — version lands before the PR either way).
- [ ] `skills/plan-feature-scaffold/SKILL.md`: XS/S ≥ 2-phase rule; update
      the fixed completion report line.
- [ ] `skills/execute-phase/SKILL.md`: phased `--fix`/single-pass consumption
      (`[P<k>]` optional arg → first unticked phase), SPEC checklist as
      ledger, legacy fallback sentence, reword both "this is the last step"
      blocks.
- [ ] All four SPEC templates (repo + `template/`) updated.
- [ ] Gate: `npx skills add . --list` exit 0.
- [ ] Commit (conventional, one per coherent chunk is fine).

### P2 — Hardening & PR

- [ ] Re-run the full gate: `npx skills add . --list` exit 0.
- [ ] Acceptance greps below all pass (run each, paste output).
- [ ] Workflow docs synced (`FEATURE_WORKFLOW`, `ISSUE_WORKFLOW`, `SKILLS`,
      `PORTABLE_PROMPT`, `GOLDEN_FIXTURE` fixture SPEC).
- [ ] `bump-skill` run: versions + CHANGELOG EN/ES rows + README tables.
- [ ] GOLDEN_FIXTURE procedure run with the weakest fleet model over
      `execute-phase` (and `plan-fix` if runnable); row appended to the run
      log. If no weak model is available this session, record the pending
      run in the PR body as the human's manual-verification item.
- [ ] Pending-docs check: `git status --porcelain` shows no uncommitted
      `docs/**`.
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat. Body includes `Closes #35`.
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`.
- [ ] Commit `docs: link PR #35` and push.

## Acceptance

- `grep -n "## Phases" docs/fix/_TEMPLATE/SPEC.md template/docs/fix/_TEMPLATE/SPEC.md`
  → both hit; the section's final phase is `Hardening & PR` with the literal
  close-out tasks (PR URL print, `done · [#<pr>](<pr-url>)`, `docs: link PR`).
- `grep -n "Hardening & PR" skills/plan-fix/SKILL.md skills/plan-feature-scaffold/SKILL.md skills/execute-phase/SKILL.md`
  → all three hit.
- `grep -n "without .## Phases.\|no .## Phases.\|legacy single-pass" skills/execute-phase/SKILL.md`
  → the fallback (phase-less SPEC → legacy single-pass) is stated explicitly.
- `grep -rn "this is the last step" skills/execute-phase/SKILL.md` → no hits
  (both blocks reworded to the final-phase shape).
- `grep -n "Single-pass (size XS)" docs/workflow/GOLDEN_FIXTURE.md` → no
  hits (fixture SPEC carries the 2-phase shape).
- `grep -rn "single-pass" docs/workflow/FEATURE_WORKFLOW.md docs/workflow/ISSUE_WORKFLOW.md docs/workflow/SKILLS.md docs/workflow/PORTABLE_PROMPT.md`
  → remaining mentions (if any) describe only the legacy fallback, never the
  default path (read-verified).
- Frontmatter versions: `plan-fix 2.1.0`, `plan-feature-scaffold 1.8.0`,
  `execute-phase 2.1.0`; CHANGELOG EN/ES rows present for all three.
- Gate green: `npx skills add . --list` exit 0.
- GOLDEN_FIXTURE run-log row appended for this change (or the pending run is
  named in the PR body as manual verification).

## Testing

Docs-level: the acceptance greps + the repo gate (`npx skills add . --list`)
+ the manual GOLDEN_FIXTURE pass with the weakest fleet model
(`docs/workflow/GOLDEN_FIXTURE.md` — `execute-phase` is executor-path, the
run is mandatory per CLAUDE.md "Smoke-test wording changes"). No unit tests —
no code changes.

## Rollback

Revert the PR (single revert commit); skill wording and templates return to
single-pass. No data or package cleanup. Fix/feature SPECs drafted while the
change was live keep their `## Phases` sections — after revert,
`execute-phase` treats them as SPEC prose and runs legacy single-pass, so
they remain executable; nothing is stranded.

## Decisions made during drafting

- **Phases live in the SPEC, not in `TASKS.md`** — fixes and XS/S features
  stay single-artifact ("the SPEC alone is the source of truth"); the
  `## Phases` checkboxes double as the execution ledger for idempotent
  resume. Re-questionable if ticking the SPEC feels wrong in practice.
- **`P<k>` argument optional; default = first unticked phase** — requiring
  the argument would change the invocation habit (`execute-phase --fix <n>`
  keeps working) and the default is deterministic (no judgement), so the
  minor-bump claim holds.
- **Minimum is exactly 2 phases for XS fixes/features** (`P1` impl +
  `P2 — Hardening & PR`), not 3 — hardening and close-out merge into one
  final phase for single-pass units; only M/L keeps them as
  hardening-phase-plus-final-tasks.
- **`ship-roadmap` wording left stale on purpose** (fallback keeps it
  correct behaviorally) — smallest change set; tracked in Out of scope.
- **Issue labeled `bug` only** — the repo has no `needs-triage` label
  (creation attempt failed); not worth creating one inside a fix.
