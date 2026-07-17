# fix/64-phase-atomicity-lint

## Goal

Phase atomicity is a judgment heuristic today, so it is only half-respected:
an audit of two real consumer repos found ~17% of substantive phases
NOT-ATOMIC and ~30% BORDERLINE — exactly the phases weak executors get lost
in. This fix turns the existing "one layer/concern, no open decisions" prose
into a **fixed, mechanical phase lint** with binary boxes, applies it at
**plan time** (the emitters `plan-feature-scaffold` + `plan-fix`) and at
**execute time** (a pre-flight guard in `execute-phase`), and quotes it in the
SPEC templates weak planners copy verbatim. It cannot wait for a feature cycle
because every plan drafted meanwhile keeps shipping non-atomic phases — the
same ambiguous-contract defect class as #63, unenforced.

## Issue

`#64` — GitHub issue. The PR must close it via `Closes #64` in the body.

## Branch

`fix/64-phase-atomicity-lint`

## Depends on

None. Independent — touches only skill bodies, SPEC templates, and the
registration docs.

## Root cause

`plan-feature-scaffold/SKILL.md:84-90` (the per-phase cheap-executability
checklist) and its split rule at `plan-feature-scaffold/SKILL.md:75-83`
already state "one layer/concern" and "zero open design decisions", and
`plan-fix/SKILL.md:72` repeats them — but they are **judgment heuristics**
with no mechanical failure mode. "One concern" has no binary test, so a strong
planner half-respects it, a weak one drowns, and nothing ever re-checks an
emitted plan. `execute-phase` (the consumer) has **no** atomicity pre-flight
at all — it will faithfully attempt whatever phase it is handed. Same defect
class as #63 (ambiguous contract → frontier model compensates, weak model
fails): the contract must become checklist-shaped, per CLAUDE.md "Checklists
over heuristics; fixed output formats".

## Detected in

Issue #64 — an audit of two repos using the workflow (gtrabanco/webs: 6
features / 30 substantive phases; gtrabanco/sosfelinosbasti: 7 features / 34
phases). Both independently scored ~53% ATOMIC / ~30% BORDERLINE / ~17%
NOT-ATOMIC, with six named worst-offender phases and six recurring
anti-patterns (`+`-titles, mega-checkboxes, in-phase decisions, layer
smuggling, >12-box close-outs, external gates between code boxes).

## Scope

### In scope

1. **A canonical phase-lint block** — a fixed, judgment-free 8-box checklist
   authored **once** as the authoritative copy in
   `docs/fix/_TEMPLATE/SPEC.md` `## Phases`, and quoted verbatim in
   `docs/features/_TEMPLATE/SPEC.md` `### Phases`. The 8 boxes, from the issue:
   - ✓ Title names ONE deliverable — FAIL if it joins nouns with
     `+`, `,`, `&`, `and`/`y`, or `/`.
   - ✓ One declared layer — each phase declares exactly one of the fixed enum
     `schema/db | domain | api | ui | config/infra | docs | hardening |
     close-out`; FAIL if any task's target file belongs to another. Tests for
     the phase's own layer belong to the phase; a test-only phase declares
     `hardening`.
   - ✓ ≤ 8 tasks (close-out phase: ≤ 10, only the literal close-out chain).
   - ✓ One checkbox = one deliverable — FAIL if a task contains a `→` chain of
     implementation steps, enumerates > 3 cases/scenarios, or creates > 1 file
     of distinct concerns.
   - ✓ Zero decision words — FAIL on `Decide`, `choose`, `OR` between
     alternatives, `If … then <change scope>`.
   - ✓ No conditional scope mutation — a task may not move work between phases
     at runtime.
   - ✓ No external/manual gates inside implementation phases — human/out-of-repo
     verifications live in the hardening/close-out phase, marked `manual`.
   - ✓ Machine-checkable done-when — every phase ends with one verifiable
     invariant (a command + expected outcome).
2. **Emit-time enforcement** — `plan-feature-scaffold/SKILL.md` and
   `plan-fix/SKILL.md` quote the lint and, on any FAIL, re-cut or split the
   phase before emitting (feeding the existing mandatory-split /
   `Depends on:`-chaining infrastructure — no new mechanism).
3. **Execute-time pre-flight guard** — `execute-phase/SKILL.md` runs the lint
   against the target phase **before touching code**; on FAIL it STOPS, prints
   the failed boxes in a fixed block, and recommends re-cutting
   (`/plan-feature <NN>` or `/plan-fix`). `--force` overrides (already an
   execute-phase escape hatch), recorded in `decisions.md`/`progress.md` — never
   silent, never "do its best" on a non-atomic phase.
4. **Registration** — version bumps + `CHANGELOG.md`/`CHANGELOG.es.md` +
   `README.md`/`README.es.md` skill-table sync via `bump-skill`.

### Out of scope

- **Issue #66 (scope-bleed guardrail)** — descope-via-issue detection in
  `execute-phase`/`audit-pr`/`workflow-status`. Related theme (phases/features
  cut too big), different mechanism (issue↔SPEC cross-check). Stays in its own
  issue; this fix only supplies the atomicity/split rules #66's point 3 feeds
  into.
- **Auto-splitting or re-writing existing non-atomic plans** in the consumer
  repos — the lint governs newly-emitted and about-to-execute phases; back-
  filling historical plans is not this fix's job.
- **A standalone `lint-phases` skill** — the lint is embedded inline in the
  three skills + two templates (weak models don't chase references); a separate
  skill would reintroduce the reference-indirection this fix avoids. Revisit
  only if a fourth consumer appears.

## Acceptance

Objective, verifiable conditions for "done":

- [ ] `docs/fix/_TEMPLATE/SPEC.md` `## Phases` contains the canonical 8-box
      phase-lint block (all 8 boxes present, verbatim wording per In-scope §1).
- [ ] `docs/features/_TEMPLATE/SPEC.md` `### Phases` quotes the same 8-box
      block, with a marker pointing to the fix template as the authoritative
      copy (grep both files → the 8 box labels match).
- [ ] `plan-feature-scaffold/SKILL.md` states the emit-time lint and the
      on-FAIL re-cut/split behavior, referencing the canonical block.
- [ ] `plan-fix/SKILL.md` Algorithm step 12 (Phases) + step 13 (Self-review)
      require the lint to pass before emitting the phase list.
- [ ] `execute-phase/SKILL.md` has a pre-flight phase-lint guard that STOPS on
      FAIL with a fixed output block, recommends re-cutting, and documents the
      `--force` override + its `decisions.md` log.
- [ ] Every edited `SKILL.md` has its `version:` bumped (minor — new
      backward-compatible capability) and a row in `CHANGELOG.md` +
      `CHANGELOG.es.md`; `README.md` + `README.es.md` skill tables reflect the
      new versions. (via `bump-skill`)
- [ ] `npx skills add . --list` still discovers every skill (no YAML breakage).
- [ ] GOLDEN_FIXTURE smoke test run on the reworded executor-path skills
      (`plan-feature-scaffold`, `plan-fix`, `execute-phase`) with the weakest
      fleet model — the lint block renders and the pre-flight STOP triggers on a
      deliberately non-atomic fixture phase.

## Affected docs

- `docs/fix/_TEMPLATE/SPEC.md` — `## Phases` (authoritative lint block). Also an
  acceptance criterion above.
- `docs/features/_TEMPLATE/SPEC.md` — `### Phases` (quoted lint block). Also an
  acceptance criterion.
- `CHANGELOG.md` / `CHANGELOG.es.md`, `README.md` / `README.es.md` — via
  `bump-skill` (bilingual pairs kept in sync in the same change).
- No `docs/workflow/*.md` prose is edited (keeps the fix tight and avoids a
  separate bilingual-sync obligation); if a reviewer wants the skill-reference
  tutorial to mention the lint, that is a follow-up doc issue, not this fix.

## Impact

- **Layers touched:** none in a running application — this repo ships skills +
  docs, not code. "Layer" here = artifact class: skill bodies
  (`skills/plan-feature-scaffold`, `skills/plan-fix`, `skills/execute-phase`)
  and SPEC templates (`docs/fix/_TEMPLATE`, `docs/features/_TEMPLATE`).
- **Modules and files:** `skills/plan-feature-scaffold/SKILL.md`,
  `skills/plan-fix/SKILL.md`, `skills/execute-phase/SKILL.md`,
  `docs/fix/_TEMPLATE/SPEC.md`, `docs/features/_TEMPLATE/SPEC.md`, plus the four
  registration docs.
- **Blast radius:** dev-facing only — changes how future plans are cut and how
  phases pre-flight. No runtime, no data. Worst case of a wording slip: a valid
  phase is wrongly blocked (loud, `--force`-recoverable) or a non-atomic phase
  slips through (status quo — no regression).
- **Detection lead time:** immediate — a broken YAML frontmatter fails
  `npx skills add . --list`; a mis-worded lint surfaces on the next plan/execute
  run and in the GOLDEN_FIXTURE smoke test.

## Rules that must never be violated

- **Stack/architecture agnostic** (CLAUDE.md): the layer enum and lint wording
  stay generic — no product/stack/framework names leak into the skills or
  shared docs.
- **Checklists over heuristics; fixed output formats** (CLAUDE.md): the lint is
  a binary checklist, every box independently checkable, n/a stated explicitly;
  the execute-phase STOP is a fixed output block.
- **Hand off, don't compose across a model/effort boundary** (CLAUDE.md): the
  execute-phase guard recommends `/plan-feature`/`/plan-fix` (a hand-off), never
  invokes them in-turn.
- **Phases are `P1, P2, …`** and the final phase is the literal `Hardening & PR`
  close-out — the lint must not contradict the existing close-out contract.
- **Version every change** (CLAUDE.md): every edited SKILL.md gets a
  `version:` bump + changelog rows via `bump-skill`.
- **Docs-language / bilingual sync**: skills + SPEC templates are English-only
  process artifacts (exempt); `CHANGELOG`/`README` bilingual pairs are synced in
  the same change.

## Operational risks

None — no scheduled jobs, queues, caches, schemas, or external adapters. The
only "runtime" is an agent reading a skill body.

## Security risks

None — no auth, secrets, PII, webhooks, or rate-limited surfaces are touched.
The lint's `--force` override is a pre-existing, logged escape hatch, not a new
bypass.

## Compliance touchpoints

n/a — no domain/compliance rules apply to skill/template wording.

## Observability

Not a production service. "The fix is live and healthy" is confirmed by:
`npx skills add . --list` listing every skill; the 8 box labels grepping in
both templates; and the GOLDEN_FIXTURE smoke test showing the pre-flight STOP
fire on a non-atomic fixture phase. A silent degradation (lint wording drifts
between the copies) surfaces as a mismatch on the next template↔skill grep — the
in-scope §1 "authoritative copy + marker" pattern is what bounds that drift.

## Cross-issue notes

- **#66 (scope-bleed guardrail)** — parallel, not absorbable. Overlaps on theme
  ("phases/features cut too big") and its point 3 explicitly feeds "#64's
  atomicity/split rules", but its change set (issue↔SPEC-acceptance cross-check
  in `execute-phase`/`audit-pr`/`workflow-status`) is disjoint from this fix's
  (the phase lint). Neither blocks the other. Decision: keep #66 separate; this
  fix ships the atomicity primitive #66 references.
- No other open issues or PRs (only #64 and #66 are open; no open PRs).

## Effort

**M** — multi-commit, ≤ 1 day. Five artifacts get a shared block of wording
plus registration; the work is mechanical text insertion of one authored
checklist, but spans three skills + two templates + four registration docs and
requires a smoke test, so it is not a single-commit XS/S.

## Decisions made during drafting

- **Lint lives inline, duplicated, with one authoritative copy.** The canonical
  block is authored in `docs/fix/_TEMPLATE/SPEC.md` `## Phases`; the feature
  template and the three skills quote it verbatim, each carrying a "keep in sync
  with docs/fix/_TEMPLATE/SPEC.md" marker. Rationale: weak models copy templates
  and follow skill bodies literally but do not chase cross-references — the same
  reasoning the repo already uses for the literal close-out tasks
  (`plan-feature-scaffold/SKILL.md:100-108`). The sync burden is accepted and
  bounded by the authoritative-copy marker; the implementer may re-question if a
  lighter single-source mechanism is found that weak models still honor.
- **Version bump = minor** for all three skills: the lint is a new
  backward-compatible capability (existing plans/SPECs still execute; only new
  emissions and pre-flights gain the check). `bump-skill` owns the exact
  numbers.
- **GOLDEN_FIXTURE smoke test sits in the Hardening & PR phase** as a leading
  `manual` task, ahead of the literal close-out chain — it is the effective
  verification gate for a skills-only repo (no application build).

## Phases

Execution ledger — `execute-phase --fix` runs **one phase per invocation** and
ticks tasks here. Each implementation phase declares exactly one layer, ≤ 8
tasks, one deliverable per checkbox, zero decision words. The final phase is
the literal `Hardening & PR` close-out.

### P1 — Phase-lint block in the SPEC templates

Layer: `docs`. Done-when: `grep -c` of the 8 box labels returns 8 in both
template files.

- [x] Author the canonical 8-box phase-lint block in
      `docs/fix/_TEMPLATE/SPEC.md` `## Phases` (verbatim wording per In-scope
      §1; marked as the authoritative copy).
- [x] Quote the same 8-box block in `docs/features/_TEMPLATE/SPEC.md`
      `### Phases`, with a marker pointing to the fix template as authoritative.
- [x] Verify: `grep` the 8 box labels in both files → all 8 present in each.

### P2 — Emit-time lint in the planner skills

Layer: `docs`. Done-when: both emitter skills name the lint and the on-FAIL
re-cut/split behavior; `grep` finds the lint reference in each.

- [ ] In `plan-feature-scaffold/SKILL.md`, add the emit-time lint to the
      per-phase checklist (§ "Scale the artifacts"): phases pass only if the
      8 boxes tick; on FAIL re-cut or split via the existing mandatory-split
      rule. Reference the canonical block.
- [ ] In `plan-fix/SKILL.md`, require the lint in Algorithm step 12 (Phases)
      and add a self-review line in step 13 that the emitted `## Phases` passes
      all 8 boxes.
- [ ] Verify: `grep` the lint reference in both skill bodies.

### P3 — Pre-flight lint guard in execute-phase

Layer: `docs`. Done-when: `execute-phase/SKILL.md` has the pre-flight guard
section with its fixed STOP block and `--force` log rule.

- [ ] Add a pre-flight phase-lint guard to `execute-phase/SKILL.md` (before any
      edit, after the dependency/own-status gates): run the 8-box lint on the
      target phase; on FAIL STOP with a fixed output block listing the failed
      boxes and recommending re-cut (`/plan-feature <NN>` or `/plan-fix`).
- [ ] Document the `--force` override: skips the STOP, never the check; logged
      in `decisions.md`/`progress.md`.
- [ ] Add the guard to the Turn contract / Hard rules so a weak model runs it.
- [ ] Verify: `grep` the guard block + `--force` log rule in the skill body.

### P4 — Registration via bump-skill

Layer: `docs`. Done-when: `npx skills add . --list` lists every skill and the
new versions appear in both READMEs.

- [ ] Run `bump-skill` for the three edited skills: bump each `version:` (minor)
      and add rows to `CHANGELOG.md` + `CHANGELOG.es.md`.
- [ ] Confirm `bump-skill` updated the skill-version tables in `README.md` +
      `README.es.md`.
- [ ] Verify: `npx skills add . --list` discovers every skill (no YAML breakage).

### P5 — Hardening & PR

- [ ] GOLDEN_FIXTURE smoke test (`manual`): run the procedure in
      `docs/workflow/GOLDEN_FIXTURE.md` against the reworded executor-path
      skills with the weakest fleet model — confirm the lint block renders and
      the pre-flight STOP fires on a deliberately non-atomic fixture phase.
- [ ] Re-run the project's full verification gate (commands + exit codes pasted)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #64`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #64` and push

## Testing

No application test suite exists (skills/docs repo). Verification is:
- `npx skills add . --list` — every skill still discovered (YAML well-formed).
- Grep-based structural checks (P1–P3 verify tasks) — the lint block and guard
  are present and labels match across template↔skill copies.
- GOLDEN_FIXTURE manual smoke test (P5) — the weakest fleet model renders the
  lint and STOPS on a non-atomic fixture phase. This is the integration-level
  check: it exercises the actual weak-model failure mode the fix targets, not a
  mock of it.

## Rollback

`git revert <merge-commit>` (or revert the PR from the forge). No data-side
cleanup — the change is skill/template wording only; nothing persists outside
git. Plans drafted while the fix was live remain valid (the lint is additive);
reverting simply removes the enforcement, restoring the prior heuristic
behavior. Nothing is lost.

## Status

`pending`
