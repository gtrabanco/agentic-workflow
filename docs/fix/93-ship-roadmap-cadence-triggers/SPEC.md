# fix/93-ship-roadmap-cadence-triggers

> Fix specification. The SPEC alone is the source of truth, and its
> `## Phases` section is the execution ledger.

## Goal

`ship-roadmap`'s autopilot REVIEW stage hard-codes its L/sensitive-feature
review floor as "a checkpoint every 2 phases" — the exact phase-counter
mechanism `#77` replaced in `execute-phase`'s interactive checkpoint because a
fixed count re-miscalibrates once #64's atomicity lint (merged, PR #75)
shrank phase size by ~3×. `#77` deliberately left this file untouched (out of
its stated scope), so the identical defect survives in the one place that
still hard-codes it. It cannot wait for a regular feature cycle because
`ship-roadmap` is the unattended autopilot path — its review floor is already
firing on stale math on every atomic-plan run today.

## Issue

`#93` — GitHub issue. Required. The PR must close it via `Closes #93` in the
body.

## Branch

`fix/93-ship-roadmap-cadence-triggers`

## Depends on

`#77` (`fix/77-review-checkpoint-cadence-triggers`, PR
[#92](https://github.com/gtrabanco/agentic-workflow/pull/92), **merged into
`main`** 2026-07-18) — provides the three named trigger definitions
(`skills/execute-phase/SKILL.md` "Review checkpoint triggers") this fix
cross-references rather than restates. **Met** — verified against `main`
post-merge: `main`'s `execute-phase/SKILL.md` "Review checkpoint triggers"
section names the same three triggers (layer boundary / accumulation /
sensitivity) this fix's cross-reference assumed; the cross-reference
resolves and matches in substance, no further edit needed.

## Root cause

`skills/ship-roadmap/SKILL.md` L345 (the REVIEW-stage bullet of the autopilot
recipe) reads "L or sensitive-flagged features get a checkpoint every 2
phases." This sentence was never updated when `#77` moved `execute-phase`'s
own interactive checkpoint from a phase counter to three named triggers
(layer boundary / accumulation / sensitivity). The autopilot's *policy* of
keeping a hard, non-skippable review floor for L/sensitive work is
deliberate and stays (an unattended loop has no human to exercise skip
judgment) — but the *mechanism* the floor counts on (a raw phase tally) is
the same miscalibrating mechanism #77 replaced everywhere else.

## Detected in

`review-change` pass on PR #92 (fix #77, `review-checkpoint-cadence-triggers`),
2026-07-18 — a context-clean finding adjacent to but outside that fix's
declared scope, filed as its own issue per the review's routing.

## Scope

### In scope

- `skills/ship-roadmap/SKILL.md` — the REVIEW-stage bullet (L345 region):
  replace "a checkpoint every 2 phases" with a cross-reference to
  `execute-phase`'s three named triggers (layer boundary, accumulation,
  sensitivity), keeping the L/sensitive-only scope, the `--adversarial 2`
  hard floor, and the existing "must never be aligned with `review-change`'s
  own interactive auto-recommend" boundary sentence unchanged in meaning.
- Version bump + `CHANGELOG.md` + `CHANGELOG.es.md` rows (via `bump-skill`).
  `ship-roadmap` carries `version: 2.2.1` (verified at drafting), so this is
  required, not conditional.

### Out of scope

- **`execute-phase`'s own trigger definitions** — owned by `#77`
  (`skills/execute-phase/SKILL.md` "Review checkpoint triggers"); this fix
  only cross-references them, never restates or edits them.
- **The `--adversarial 2` hard-floor policy itself, or the "unattended, no
  human skip judgment" rationale** — both stay exactly as documented; this
  fix touches only the cadence *mechanism* the floor is measured against.
- **`review-change`'s own interactive auto-recommend cadence for
  L/sensitive** — untouched; the existing boundary sentence keeping the two
  policies deliberately unaligned is preserved verbatim in meaning.
- **Any bilingual reference doc restating `ship-roadmap`'s cadence** — a
  `docs/workflow/*.md` / README grep found no such restatement outside
  `skills/ship-roadmap/SKILL.md` itself (verified at drafting: see
  Decisions below); if one surfaces during implementation, file it as a
  separate fix rather than expanding this one.

## Acceptance

- [ ] **AC1 — counter removed.** `grep -c "every 2 phases"
  skills/ship-roadmap/SKILL.md` → `0`.
- [ ] **AC2 — trigger cross-reference present.** The REVIEW-stage bullet
  names the same three triggers `execute-phase` uses (layer boundary /
  accumulation / sensitivity) and cross-references `#77` rather than
  restating the trigger definitions inline. Verifiable:
  `grep -n "layer boundary\|accumulation\|sensitivity" skills/ship-roadmap/SKILL.md`
  returns the rewritten bullet.
- [ ] **AC3 — policy preserved.** The `--adversarial 2` hard floor for
  L/sensitive features and the "must never be aligned with `review-change`'s
  own interactive auto-recommend" boundary sentence are present, unchanged in
  meaning. Verifiable: `git diff main -- skills/ship-roadmap/SKILL.md` shows
  no change to either sentence outside the cadence-mechanism clause itself.
- [ ] **AC4 — no scope bleed.** `git diff main --stat` for this branch
  touches only `skills/ship-roadmap/SKILL.md` + version/CHANGELOG files. No
  other file changed.
- [ ] **AC5 — version + changelog.** `skills/ship-roadmap/SKILL.md` carries
  `version: 2.2.1` (verified at drafting), so `bump-skill` is run and
  `CHANGELOG.md` + `CHANGELOG.es.md` gain rows — mandatory, not conditional.

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation**
and ticks tasks here.

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

### P1 — Trigger-based cadence cross-reference in `ship-roadmap`

Layer: `docs`. Target: `skills/ship-roadmap/SKILL.md`. Done-when:
`grep -c "every 2 phases" skills/ship-roadmap/SKILL.md` → `0` **and**
`grep -n "layer boundary" skills/ship-roadmap/SKILL.md` → returns the
rewritten REVIEW-stage bullet.

- [x] Rewrite the REVIEW-stage bullet's cadence clause ("L or
      sensitive-flagged features get a checkpoint every 2 phases") to fire on
      `execute-phase`'s three named triggers (layer boundary, accumulation,
      sensitivity), cross-referencing `#77`'s trigger definitions instead of
      restating them, while keeping the L/sensitive-only scope, the
      `--adversarial 2` hard floor, and the "must never be aligned with
      `review-change`'s own interactive auto-recommend" boundary sentence
      unchanged in meaning. — `skills/ship-roadmap/SKILL.md` REVIEW-stage
      bullet (L345 region).

### P2 — Hardening & PR

- [x] Re-run the project's full verification gate (commands + exit codes pasted)
      — `npx skills add . --list` → exit 0.
- [x] Pending-docs check: `git status --porcelain -- docs/` → empty
- [x] Set the fix-index row status to `done` and commit the flip
- [x] `git push`
- [x] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #93` —
      https://github.com/gtrabanco/agentic-workflow/pull/94
- [x] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [x] Commit `docs: link PR #93` and push

## Testing

Documentation/skill-contract change — no runtime code. Verification is the
project's "green": `npx skills add . --list` discovers every skill (exit 0);
`grep` invariants in the Acceptance section (0 "every 2 phases" hits in
`skills/ship-roadmap/SKILL.md`; the three trigger names present; the
`--adversarial 2` floor and the boundary sentence intact via `git diff
main`). No unit-test layer exists in this repo.

## Rollback

`git revert` the PR merge commit (single commit) — restores the
every-2-phases wording in `skills/ship-roadmap/SKILL.md`. No data-side
cleanup: purely Markdown skill-contract prose, no schema, cache, or
persisted state involved.

## Status

`done` (built, PR open — merge state lives in the forge)

---

## Impact

- **Layers touched:** `docs` only — a single skill contract
  (`ship-roadmap`). No application layer; this repo ships no runtime code.
- **Modules / files:** `skills/ship-roadmap/SKILL.md` + `CHANGELOG.md` /
  `.es.md` (`bump-skill` applies — mandatory, per `version: 2.2.1`).
- **Blast radius:** dev-only autopilot behavior — changes *when* the
  unattended L/sensitive review floor fires, not *whether* it fires or how
  strict it is. No user-facing runtime effect, no data path.
- **Detection lead time:** immediate — the next `ship-roadmap` run on an
  L/sensitive feature surfaces the new cadence wording in its REVIEW-stage
  behavior.

## Rules that must never be violated

- **Stack/architecture agnostic** — no product/stack/framework references
  leak into the skill; the trigger cross-reference stays generic.
- **Checklists over heuristics; fixed output formats** — the cross-reference
  to `execute-phase`'s triggers must not turn a binary condition into a
  judgment call for `ship-roadmap`'s own unattended loop.
- **Hand off, don't compose across a model/effort boundary** —
  `ship-roadmap` already composes `review-change` in-turn at equal tier per
  its own contract; this fix does not change that composition, only the
  cadence at which the L/sensitive floor forces `--adversarial 2`.
- **The `--adversarial 2` hard floor and the deliberate non-alignment with
  `review-change`'s own advisory cadence stay untouched** — `#93` owns only
  the counting mechanism, not the policy.

## Operational risks

- **Scheduled-job / queue / cache / schema / external-adapter:** n/a — no
  runtime, no persisted state, no adapters.
- **Cross-skill coupling:** `ship-roadmap` reads `execute-phase`'s trigger
  definitions by cross-reference, not by import or shared state — no
  coordination hazard. If `#77`'s trigger definitions change shape later,
  this cross-reference (not a restatement) means `ship-roadmap` stays
  correct without a second edit.
- **Eventual consistency:** n/a — the cadence check runs synchronously
  within a single autopilot pass.

## Security risks

- **auth / secrets / PII / webhooks / rate-limits:** n/a to the change
  itself (no code, no credentials). The fix strengthens nothing new here —
  it only recalibrates when the existing L/sensitive review floor fires.

## Compliance touchpoints

n/a — no domain/compliance rules are involved; this is an internal
developer-workflow doc change.

## Affected docs

- `skills/ship-roadmap/SKILL.md` — REVIEW-stage cadence bullet (this fix's
  sole target).
- `CHANGELOG.md` + `.es.md` — version row (`ship-roadmap` carries
  `version: 2.2.1`, so `bump-skill` applies — mandatory).
- `docs/fix/README.md` — this fix's index entry (added at draft; flipped
  `done` at close-out).

## Cross-issue notes

- **#77 — review-checkpoint-cadence-triggers** — prerequisite, **merged**
  (PR #92, into `main` 2026-07-18). Provides the trigger definitions this
  fix cross-references; wording verified to match post-merge.
- No other open issues or PRs reference `ship-roadmap`'s cadence wording as
  of 2026-07-18 (`gh issue list --state open`, `gh pr list --state open`
  checked at drafting).

## Effort

**XS** — single-bullet edit in one file, ≤ 1h. No design decisions remain;
the trigger model is already specified by `#77`.

## Decisions made during drafting

- **Started with unmet dependency, user-forced 2026-07-18.** The `Depends
  on:` gate (#77, PR [#92](https://github.com/gtrabanco/agentic-workflow/pull/92))
  was still open at implementation time. The user explicitly chose to force
  through rather than wait, so P1 was implemented against the trigger
  definitions on the `fix/77-review-checkpoint-cadence-triggers` branch tip
  (verified identical in substance to what `#92` will land on `main`) instead
  of blocking. If `#92` lands with different trigger wording before this PR
  merges, re-verify the cross-reference still matches.
- **Cross-reference, not restate.** The rewritten bullet points at
  `execute-phase`'s trigger definitions rather than copying the three
  trigger descriptions into `ship-roadmap` verbatim, so a future re-tune of
  the thresholds (recorded as re-questionable in `#77`'s SPEC) only requires
  editing one place. *Implementer may re-question* if `ship-roadmap`'s
  Portability section conventions call for a self-contained restatement
  instead.
- **No other file touched.** `main` still shows the pre-#77 wording
  everywhere (PR #92 not yet merged), so a plain grep against `main` is
  misleading here. Checked instead against the `fix/77-…` branch tip — i.e.
  what `main` will look like once #92 merges (`git show
  fix/77-review-checkpoint-cadence-triggers:<path> | grep -ciE "every 2
  phases"` per file): `execute-phase`, `review-change`, both `SKILLS.md`,
  both `FEATURE_WORKFLOW.md`, both `PORTABLE_PROMPT.md`, both
  `MIGRATION.md`, both `README.md` all return `0`; only
  `skills/ship-roadmap/SKILL.md` still returns `1`. Frozen-history hits
  (`docs/design/REDESIGN.md`, completed `docs/features/*` specs/checklists,
  `CHANGELOG*.md`) are out of scope by the same rule `#77` used. If
  implementation finds a live restatement this scan missed, expand the
  in-scope list rather than silently dropping it.
