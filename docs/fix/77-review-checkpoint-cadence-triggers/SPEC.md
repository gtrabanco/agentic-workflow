# fix/77-review-checkpoint-cadence-triggers

> Fix specification. The SPEC alone is the source of truth, and its
> `## Phases` section is the execution ledger.

## Goal

`execute-phase` recommends a `review-change` checkpoint **every 2 phases**
(skippable) plus the mandatory terminal review. That fixed interval was
calibrated against pre-#64 fat phases (~5–7 per feature → 2–3 checkpoints).
#64's atomicity lint (merged, PR #75) turns the same feature into ~12–18 atomic
phases → 6–9 checkpoints, each needing a context-clean conversation —
unsustainable overhead and low-value review (checking every pair of atomic
phases reviews code mid-movement inside a single layer). This fix replaces the
phase-counter with three mechanical, independently-checkable triggers keyed on
*what accumulated*, not *how many phases passed*: **layer boundary**,
**accumulation**, **sensitivity**. Checkpoints stay single-reviewer and
skippable; the mandatory terminal `review-change` and its adversarial hook are
untouched. It cannot wait for a regular feature cycle because it becomes a live
workflow-cost regression the moment atomic plans (post-#64) are executed — the
issue's re-triage (2026-07-18) fired `fix-now` on exactly that trigger.

## Issue

`#77` — GitHub issue. Required. The PR must close it via `Closes #77` in the
body.

## Branch

`fix/77-review-checkpoint-cadence-triggers`

## Depends on

`#64` — phase-atomicity lint (the layer declaration is trigger 1's input).
**Met:** merged via [#75](https://github.com/gtrabanco/agentic-workflow/pull/75)
(2026-07-17); the layer enum
`schema/db | domain | api | ui | config/infra | docs | hardening | close-out`
is a live field in both SPEC templates
(`docs/fix/_TEMPLATE/SPEC.md` L70–71, `docs/features/_TEMPLATE/SPEC.md`
`### Phases`) and quoted by the emitters. No unmet dependency remains.

## Root cause

The checkpoint cadence in `skills/execute-phase/SKILL.md` is a hardcoded phase
counter — "every 2 phases" (L348, L466–471, L490–495, L586, L626–628). A phase
counter measures elapsed phases, not accumulated reviewable change, so it
re-miscalibrates whenever phase *size* changes. #64 shrank phase size by ~3×,
so the constant now fires ~3× too often. Replacing `2` with a larger constant
would just re-miscalibrate on the next phase-size change — the trigger must key
on what accumulated (a completed layer, a diff threshold, a sensitive surface),
not on a count.

## Detected in

Issue #77, agreed in a design discussion (2026-07-17); postponed at triage
(2026-07-17, trigger = #64 merged); re-triaged `fix-now` (2026-07-18) once #64
merged and the layer enum became a real field in emitted plans.

## Scope

### In scope

`skills/execute-phase/SKILL.md` (source of the cadence) and every doc that
restates the "every 2 phases" cadence as current behavior:

- `skills/execute-phase/SKILL.md` — replace the phase-counter with the three
  named triggers; add the last-reviewed-SHA recording spec.
- `skills/review-change/SKILL.md` — the two cadence cross-references (L55–56,
  L500–501) restated to the trigger model. The adversarial section (L368–378)
  is **not** touched.
- `docs/workflow/SKILLS.md` + `docs/workflow/SKILLS.es.md` — the execute-phase
  row cadence clause.
- `docs/workflow/FEATURE_WORKFLOW.md` + `.es.md` — the cadence mentions
  (L172–173, L217, L274 and ES siblings).
- `docs/workflow/PORTABLE_PROMPT.md` + `.es.md` — the "every 2 phases" clause
  (L103 / ES L109).
- `docs/workflow/MIGRATION.md` + `.es.md` — the execute-phase kept-skill note
  (L345 / ES L394).
- `README.md` + `README.es.md` — the execute-phase skills-table cell (L115 /
  ES L119) and the flow-diagram line (L459 / ES L484).
- Version bumps + `CHANGELOG.md` + `CHANGELOG.es.md` rows (via `bump-skill`).

### Out of scope

- **Envelope exposure of the new trigger signals** (`workflow-status` +
  npm schema package) → already tracked in
  [#79](https://github.com/gtrabanco/agentic-workflow/issues/79) (postponed).
  This fix does not touch `skills/workflow-status/SKILL.md` or
  `packages/agentic-workflow-schema/`.
- **The mandatory terminal `review-change` and its adversarial hook**
  (`review-change` L368–378) — untouched by contract (acceptance below).
- **Historical artifacts** that *record* the old cadence as past decisions —
  `docs/design/REDESIGN.md`, `docs/LOGS.md`, completed feature/fix folders
  under `docs/features/*` and `docs/fix/*` (e.g. `05-…`, `11-…`,
  `03-orchestrator-crash-recovery`, `35-…`) — are not rewritten; they are
  frozen history, not current-behavior statements.

## Acceptance

Each criterion is objective and checkable. Grouped by the issue's own acceptance
list.

- [ ] **AC1 — trigger replacement.** The every-2-phases rule is removed from
  `skills/execute-phase/SKILL.md` (`grep -c "every 2 phases"` → `0`,
  `grep -c "2 phases unreviewed"` → `0`) and replaced by the three named
  triggers, each a checkable condition. Verifiable at unit/architecture layer
  (grep). Trigger 2 carries **concrete numeric thresholds and the exact
  command** (`git diff --stat <baseline>..HEAD`).
- [ ] **AC2 — SHA recording specified.** The skill states where the
  last-reviewed SHA lives (`progress.md` header line `Last reviewed: <sha>`),
  who writes it, and what happens when it is absent (fall back to
  `git merge-base <default-branch> HEAD`; the first checkpoint of a unit must
  not crash on a missing marker). Verifiable: `grep -n "Last reviewed"` and
  `grep -n "merge-base"` return the spec.
- [ ] **AC3 — terminal review + adversarial hook untouched.** The mandatory
  end-of-unit `review-change` and its adversarial recommendation
  (`skills/review-change/SKILL.md` L368–378, "Cadence — once per unit") are
  byte-for-byte unchanged; the `#77` boundary note there still reads that `#77`
  owns the general every-N-phases interval. Verifiable:
  `git diff main -- skills/review-change/SKILL.md` shows **no** change inside
  the "Adversarial … Cadence — once per unit" block. Cross-ref to the
  adversarial issue (#76 / the adversarial section) is present.
- [ ] **AC4 — cadence docs updated (bilingual).** Every doc that restated the
  cadence is updated in this same change, EN and ES siblings together:
  `docs/workflow/SKILLS.md` + `.es.md`, `docs/workflow/FEATURE_WORKFLOW.md` +
  `.es.md`, `docs/workflow/PORTABLE_PROMPT.md` + `.es.md`,
  `docs/workflow/MIGRATION.md` + `.es.md`, `README.md` + `README.es.md`.
  Verifiable: `grep -rn "every 2 phases\|cada 2 fases\|cada dos fases"` over
  those ten files → `0` current-behavior hits.
- [ ] **AC5 — GOLDEN_FIXTURE smoke.** `execute-phase` is executor-path: the
  GOLDEN_FIXTURE manual procedure is run against the new trigger wording with
  the weakest fleet model; a dated run-log row is appended to
  `docs/workflow/GOLDEN_FIXTURE.md` + `.es.md`. Manual — lives in the close-out
  phase.
- [ ] **AC6 — version + changelog.** `bump-skill` run; `execute-phase` and
  `review-change` `version:` bumped; `CHANGELOG.md` + `CHANGELOG.es.md` rows
  added; README skills/model tables consistent. Verifiable: `bump-skill`'s own
  checks + `grep` for the new version rows.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here. All implementation phases are the `docs` layer (this fix is
entirely Markdown skill-contract and reference prose); the final phase is the
`close-out` layer.

### Phase-lint (authoritative copy — keep in sync with
`docs/features/_TEMPLATE/SPEC.md` `### Phases`)

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

### P1 — Trigger-based checkpoint cadence in `execute-phase`

Layer: `docs`. Target: `skills/execute-phase/SKILL.md`. Done-when:
`grep -c "every 2 phases" skills/execute-phase/SKILL.md` → `0` **and**
`grep -n "Layer boundary" skills/execute-phase/SKILL.md` → returns the trigger
block.

- [x] Add a `### Review checkpoint triggers` block defining the three named,
      independently-checkable triggers: **(1) Layer boundary** — the NEXT
      phase's declared `Layer:` differs from the just-finished phase's →
      recommend a checkpoint; **(2) Accumulation** — the unreviewed diff since
      the marker exceeds the fixed threshold (**> 400 changed lines
      (insertions + deletions) OR > 8 changed files**), measured by
      `git diff --stat <baseline>..HEAD`; **(3) Sensitivity** — the just-closed
      phase touches auth, payments, destructive migrations, secrets, or CI
      config → recommend an immediate checkpoint. — `skills/execute-phase/SKILL.md`
      "Review checkpoint triggers" block.
- [x] Add the **last-reviewed-SHA recording spec** in the same block: home =
      `progress.md` header line `Last reviewed: <sha>`; sole writer =
      `execute-phase` (stamped at the checkpoint fold-back, or at the next
      phase's entry after a clean checkpoint); absent marker → baseline =
      `git merge-base <default-branch> HEAD`, never crash on the first
      checkpoint of a unit. — same block, "Last reviewed" + "merge-base"
      sentences.
- [x] Add a one-line boundary note: trigger 3 recommends a **single-reviewer**
      checkpoint on closing a sensitive phase and does **not** change
      `review-change`'s once-per-unit adversarial cadence (cross-ref the
      adversarial section). — same block, boundary sentence.
- [x] Rewrite step 7 of the feature-phase workflow (L348) so the checkpoint is
      recommended **when a trigger fires (naming which one)**, not on the phase
      counter; keep "recommended, not blocking" and the mandatory-end-review
      sentence. — `skills/execute-phase/SKILL.md` feature-phase step 7.
- [x] Rewrite the **Cadence** paragraph (L466–471) to the trigger model,
      keeping the "never optional … end review" sentence verbatim in meaning. —
      "Cadence." paragraph under *Review checkpoint & finishing a unit*.
- [x] Rewrite the checkpoint hand-off block (L490–495) so its `→ Next:` line
      names the firing trigger (e.g. "layer boundary reached", "accumulation
      threshold", "sensitive phase") instead of "2 phases unreviewed". —
      "Checkpoint hand-off" fenced block.
- [x] Update the batch-execution note (L586) and the relationship-to-other-skills
      bullet (L500-equivalent, L626–628) from "per-2-phase / every 2 phases"
      to "trigger-based checkpoints". — `skills/execute-phase/SKILL.md`
      *Batch execution* + *Relationship to other skills*.

### P2 — Align `review-change` cadence cross-references

Layer: `docs`. Target: `skills/review-change/SKILL.md`. Done-when:
`grep -c "every 2 phases" skills/review-change/SKILL.md` → `0` **and**
`git diff main -- skills/review-change/SKILL.md` shows no change between the
"Cadence — once per unit" and "Boundary with `#77`" lines (adversarial block
intact).

- [x] Restate L55–56 ("recommends a hand-off every 2 phases — an optional
      checkpoint") to the trigger model (layer boundary / accumulation /
      sensitivity; see `execute-phase`), keeping it optional and skippable. —
      `skills/review-change/SKILL.md` "When to use" bullet.
- [x] Restate L500–501 ("recommends it every 2 phases (optional checkpoint)")
      to "recommends it at its trigger-based checkpoints (optional)"; leave the
      "mandatory end review" clause unchanged. — `skills/review-change/SKILL.md`
      "Relationship / Done when" bullet.

### P3 — Propagate the trigger cadence to reference docs (EN + ES)

Layer: `docs`. Target: the five bilingual doc-pairs that restate the cadence.
Done-when:
`grep -rn "every 2 phases\|cada 2 fases\|cada dos fases" docs/workflow/SKILLS.md docs/workflow/SKILLS.es.md docs/workflow/FEATURE_WORKFLOW.md docs/workflow/FEATURE_WORKFLOW.es.md docs/workflow/PORTABLE_PROMPT.md docs/workflow/PORTABLE_PROMPT.es.md docs/workflow/MIGRATION.md docs/workflow/MIGRATION.es.md README.md README.es.md`
→ `0` current-behavior hits.

- [x] `docs/workflow/SKILLS.md` L58 + `docs/workflow/SKILLS.es.md` L60 —
      execute-phase row cadence clause → trigger model (EN + ES together). —
      both files.
- [x] `docs/workflow/FEATURE_WORKFLOW.md` (L172–173, L217, L274) +
      `.es.md` (L195, L246, L311) — cadence mentions → trigger model
      (EN + ES together). — both files.
- [x] `docs/workflow/PORTABLE_PROMPT.md` L103 + `.es.md` L109 — "every 2
      phases" clause → trigger model (EN + ES together). — both files.
- [x] `docs/workflow/MIGRATION.md` L345 + `.es.md` L394 — execute-phase
      kept-skill note → "at review checkpoints" (drop the stale interval;
      EN + ES together). — both files.
- [x] `README.md` (L115 cell, L459 flow line) + `README.es.md` (L119 cell,
      L484 flow line) — execute-phase description + flow diagram → trigger
      model (EN + ES together). — both files.

### P4 — Version bump (bump-skill)

Layer: `docs`. Target: skill frontmatter + `CHANGELOG.md` / `.es.md` + README
tables, via `bump-skill`. Done-when: `bump-skill`'s own consistency checks pass
and `grep -n` finds the new `execute-phase`/`review-change` version rows in both
CHANGELOGs.

- [x] Run `bump-skill` for `execute-phase` (minor — cadence contract change,
      backward-compatible) and `review-change` (patch — cross-ref wording);
      it bumps `version:`, writes `CHANGELOG.md` + `CHANGELOG.es.md` rows, and
      refreshes the README skills/model tables. — bump-skill output:
      execute-phase 2.5.2→2.6.0 (minor), review-change 2.4.0→2.4.1 (patch);
      model/effort tiers unchanged (no `model-routing.yml` edit needed).
- [x] Verify the READMEs' skills-table cells for both skills match the new
      cadence wording (no residual "every 2 phases"). — already updated in P3
      (`README.md:115`, `README.es.md:119`); confirmed via `grep -c "every 2
      phases" README.md README.es.md` → `0`.

### P5 — Hardening & PR

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
      — `npx skills add . --list` → exit 0, every skill discovered including the
      bumped `execute-phase`/`review-change`; code-fence balance on every
      touched file. Also caught two residual hyphenated "every-2-phases"/"after
      every two phases" references in `skills/execute-phase/SKILL.md` (L517,
      L629) that P1's space-form grep missed — fixed to the trigger-model
      wording; broad `grep -rniE` sweep across all touched files now `0`
      current-behavior hits (CHANGELOG hits are frozen history + this fix's own
      "what changed" rows, correctly untouched).
- [x] GOLDEN_FIXTURE smoke (`manual`): run `docs/workflow/GOLDEN_FIXTURE.md`
      with the weakest fleet model against the new trigger wording; confirm no
      misread; append a dated run-log row to `docs/workflow/GOLDEN_FIXTURE.md`
      + `.es.md`. — PASS: two live Claude Haiku 4.5 runs (layer-boundary-fires
      scenario, no-trigger-fires scenario) both reproduced the fixed
      "Checkpoint hand-off" block exactly, correct trigger naming/reasoning,
      correct omission logic, zero invented steps.
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty (after this
      phase's commit).
- [x] Set the fix-index row status to `done` and commit the flip
- [x] `git push`
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #77`
- [x] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #77` and push

## Testing

Documentation/skill-contract change — no runtime code. Verification is the
project's "green": `npx skills add . --list` discovers every skill (exit 0);
`grep` invariants in the Acceptance section (0 current-behavior "every 2 phases"
hits across the source skill and the ten reference docs; the three trigger
names present; the SHA-recording spec present; the adversarial block
byte-unchanged via `git diff main`). Executor-path smoke: GOLDEN_FIXTURE run on
the weakest fleet model against the new trigger wording (close-out phase). No
unit-test layer exists in this repo.

## Rollback

`git revert` the PR merge commit (single squash/merge commit) — restores the
every-2-phases cadence wording across all touched files. No data-side cleanup:
the change is purely Markdown skill/doc prose; no schema, cache, or persisted
state is involved. In-flight units executing under the trigger cadence simply
revert to the phase counter on their next `execute-phase` invocation (the
`Last reviewed:` marker in any live `progress.md` becomes inert and is ignored).

## Status

`done`

---

## Impact

- **Layers touched:** `docs` only — skill contracts (`execute-phase`,
  `review-change`) and reference prose (workflow docs, README, CHANGELOG). No
  application layer; this repo ships no runtime code.
- **Modules / files:** `skills/execute-phase/SKILL.md`,
  `skills/review-change/SKILL.md`, `docs/workflow/{SKILLS,FEATURE_WORKFLOW,PORTABLE_PROMPT,MIGRATION}.md`
  + `.es.md`, `README.md` + `README.es.md`, `CHANGELOG.md` + `.es.md`,
  `docs/workflow/GOLDEN_FIXTURE.md` + `.es.md`, `docs/fix/README.md`.
- **Blast radius:** dev-only workflow behavior — changes *when* an optional
  checkpoint is recommended. No user-facing runtime effect, no data path. Worst
  case of a mis-specified trigger: an over- or under-recommended checkpoint,
  which the user can always skip (the terminal mandatory review still covers
  everything).
- **Detection lead time:** immediate — the first `execute-phase` run on an
  atomic plan surfaces the new hand-off wording; GOLDEN_FIXTURE catches
  weak-model misreads before merge.

## Rules that must never be violated

- **Docs language is English** for skills/SPEC/commits/PRs; human-readable docs
  (`README`, `CHANGELOG`, `docs/workflow/*.md`) carry EN + ES siblings updated
  in the **same** change (CLAUDE.md bilingual-sync hard rule).
- **Stack/architecture agnostic** — no product/stack/framework references leak
  into skills or shared docs; the trigger definitions stay generic (a
  sensitive-surface *list*, not a stack-specific path glob).
- **Checklists over heuristics; fixed output formats** — the three triggers are
  binary, independently-checkable conditions (a weak model must not have to
  judge); trigger 2 carries an exact command + numeric thresholds.
- **Phases are `P1, P2, …`**, never `S1`/"Step N".
- **Hand off, don't compose across a model/effort boundary** — `execute-phase`
  keeps *recommending* `review-change` (hand-off), never composing it.
- **The mandatory terminal review and its adversarial hook stay untouched** —
  `#77` owns only the general every-N-phases interval (the boundary note in
  `review-change` L375–378).

## Operational risks

- **Scheduled-job / queue / cache / schema / external-adapter:** n/a — no
  runtime, no persisted state, no adapters.
- **Cross-skill coupling:** the `Last reviewed:` marker is written and read by
  `execute-phase` alone (single writer) — no coordination hazard across the
  `review-change` hand-off boundary. The autopilot (`ship-roadmap`) skips
  intermediate checkpoints entirely, so the marker is inert there.
- **Eventual consistency:** if a user skips a recommended checkpoint, the
  unreviewed diff keeps accumulating until the next review advances the marker —
  intended (the accumulation trigger keeps re-firing), not a hazard.

## Security risks

- **auth / secrets / PII / webhooks / rate-limits:** n/a to the change itself
  (no code, no credentials). Note: trigger 3 *names* sensitive surfaces (auth,
  payments, destructive migrations, secrets, CI config) as the checkpoint
  condition — it strengthens review coverage on those surfaces, it does not
  touch them.

## Compliance touchpoints

n/a — no domain/compliance rules (data retention, regional, consumer-protection)
are involved; this is an internal developer-workflow doc change.

## Affected docs

Each is an acceptance criterion above (AC4/AC5/AC6):

- `docs/workflow/SKILLS.md` + `.es.md` — execute-phase row cadence clause.
- `docs/workflow/FEATURE_WORKFLOW.md` + `.es.md` — cadence mentions.
- `docs/workflow/PORTABLE_PROMPT.md` + `.es.md` — "every 2 phases" clause.
- `docs/workflow/MIGRATION.md` + `.es.md` — execute-phase kept-skill note.
- `README.md` + `README.es.md` — execute-phase cell + flow line.
- `CHANGELOG.md` + `.es.md` — version rows (via `bump-skill`).
- `docs/workflow/GOLDEN_FIXTURE.md` + `.es.md` — dated smoke run-log row.
- `docs/fix/README.md` — this fix's index entry (added at draft; flipped `done`
  at close-out).

## Observability

n/a for prod (no runtime). The workflow-level "is it live and healthy" signal is
the `execute-phase` closing block itself: a checkpoint hand-off that names the
firing trigger confirms the new cadence is in effect; the absence of any
"every 2 phases" string across the source skill and reference docs (grep) is the
mechanical health check. Envelope-level exposure of the trigger signals is
deferred to #79.

## Cross-issue notes

- **#64 — phase-atomicity lint** — prerequisite, **merged** (PR #75). Provides
  trigger 1's `Layer:` input. Satisfied.
- **#79 — workflow-status exposes new review/closure/scope-bleed signals**
  (postponed) — *parallel / absorbable-later*. When it lands it may surface
  the trigger-fired signal in the envelope; this fix deliberately leaves the
  envelope + npm schema package untouched so #79 owns that surface. No block
  either direction.
- **#76 — adversarial weak-fleet usability** (done, PR #91) — *adjacent, no
  overlap*. It owns the adversarial once-per-unit cadence and the sensitive-
  phase adversarial exception; the explicit boundary note it added
  (`review-change` L375–378) reserves the general every-N-phases interval for
  `#77`. This fix stays on its side of that line.
- No open PRs. Remaining open issues (#89, #82, #74, #73, #72, #71) are
  unrelated (audit-pr scope-bleed, template rendering, bump-skill gating,
  table ordering, fold-findings registration).

## Effort

**S** — single-commit-per-phase, ≤ 4h. Mechanical prose edits across a source
skill + ten reference docs + a version bump; no design decisions remain (the
three triggers are specified in the issue), the only judgment already made is
the numeric threshold for trigger 2 (see *Decisions made during drafting*).

## Decisions made during drafting

- **SHA-recording home = `progress.md` header line `Last reviewed: <sha>`,
  writer = `execute-phase` (sole writer).** The every-2-phases cadence is a
  feature-mode concept (single-pass/`--fix` have no intermediate checkpoints),
  and feature mode always has a `progress.md` — so it is the natural, always-
  present home, over the optional `review-findings.md` ledger the issue also
  floated. Keeping `execute-phase` the sole writer avoids a cross-skill write
  dependency across the `review-change` hand-off. Absent marker → baseline
  `git merge-base <default-branch> HEAD`. *Implementer may re-question* (e.g.
  have `review-change` stamp the marker directly).
- **Trigger 2 numeric thresholds = > 400 changed lines (insertions +
  deletions) OR > 8 changed files, via `git diff --stat <baseline>..HEAD`.**
  Generic, stack-agnostic defaults that a weak model can read straight off the
  `git diff --stat` summary line; large enough that a run of small same-layer
  phases must genuinely accumulate before firing, small enough to catch a long
  single-layer run the layer-boundary trigger would miss. *Implementer may
  re-question the exact numbers* — they are recorded in the skill so a future
  re-tune edits one place.
- **Trigger 3's sensitive-surface list = auth, payments, destructive
  migrations, secrets, CI config** — reused verbatim from `review-change`'s
  existing sensitive-phase list (L372–374) so the two stay consistent; trigger
  3 recommends a single-reviewer checkpoint, distinct from that section's
  adversarial early-pass.
- **MIGRATION note softened to "at review checkpoints"** rather than restating
  a new interval — it is a skill-rename mapping note, not a cadence spec, so it
  should not carry the interval at all.
