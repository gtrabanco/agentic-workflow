# 69 — review-conformance

> One-line: ship the two 2026-09-29 owner decisions as contracts and wording —
> the **dismantle-the-claim** review charter across `review-change` /
> `product-audit`, and the **advisory prior-decisions contradiction sweep** in
> the lane's plan step. No machinery, no new authority.

## Objective

Turn two recorded owner decisions (issue #270, `docs/LOGS.md` 2026-09-29) into
the written contracts the workflow already runs on:

1. **Review charter** — a review's primary job is to try to **dismantle the
   claim** that what works, works — and works well (programmatically,
   engineering-wise, decision-wise, and against user expectation). Bugs, security
   issues and guard skips **inside the current feature's scope are
   `review-change`'s own job**; expectations are **asked about, not inferred**;
   the repo-wide open-ended sweep belongs to `product-audit`.
2. **Prior-decisions contradiction sweep** — before a plan is accepted, sweep its
   claims against what was already decided in writing and cite the contradicted
   decision as evidence. Advisory and escalating only: a hit routes, a miss never
   blocks a clean plan.

## Why

Reviews today hunt arbitrary bugs instead of attacking the delivery claim, and
open-ended review agents have a measurably low signal-to-noise ratio (CR-Bench,
<https://arxiv.org/abs/2603.11078>) — exactly why that hunt belongs in
`product-audit`, where it can be scoped and budgeted. Separately, nothing sweeps
a new plan against decisions already recorded in the repository (feature
`decisions.md`, architectural invariants, the Normalized Repository State,
`AGENTS.md`, SPEC `## Design status`), so a plan can silently contradict an
accepted decision and only a reader notices later. Both gaps are wording and
contract gaps — the machinery to route the result already exists
(`resolve-repository-state`, `NEEDS-DECISION`).

## User outcome

A reviewer (human or model) reading `review-change` sees a charter that tells it
to attack the unit's own claim and to treat in-scope bugs and security holes as
its job, not as out-of-scope findings; a non-technical user's product is asked
about in their terms instead of guessed at. A reader of `product-audit` sees that
it owns the repo-wide bug/security/broken-version sweep. A planner following the
lane's plan step fills one fixed table — `claim | prior decision | source path |
relation` — for every claim that touches a recorded decision, and an unchecked
claim with no matching decision still plans straight through with nothing
blocking it.

## Acceptance criteria

1. **Charter lands in `review-change`.** `skills/review-change/SKILL.md` states,
   in the skill's own wording: (a) the review's primary job is to attempt to
   dismantle the claim "what works, works — and works well"; (b) bugs, security
   issues and guard skips inside the current feature's scope belong to
   `review-change` — a feature is not complete while it has them; (c) expectations
   are **asked about, not inferred**, in non-technical terms for non-technical
   users; (d) repo-wide pure bug hunting, security research and broken-version
   investigation route to `product-audit`. Verified by four greps over the file,
   one per clause, all ≥1 hit.
2. **`product-audit` names its ownership.** Both the frontmatter `description:`
   and the body of `skills/product-audit/SKILL.md` state that this skill owns the
   repo-wide pure bug hunting, security research and broken-version investigation
   (scoped and budgeted there), as distinct from `review-change`'s
   change-scoped review. Verified by two greps (frontmatter + body).
3. **The sweep is a checklist item with a fixed evidence shape.**
   `skills/unit-lane/references/PLAN.md` carries the prior-decisions
   contradiction sweep as a checklist item whose evidence row shape is exactly
   `claim | prior decision | source path | relation`, naming the candidate sources
   (`decisions.md` per feature/fix folder, architectural invariants, the Normalized
   Repository State via `discover-repository-state`/`resolve-repository-state`,
   `AGENTS.md`, SPEC `## Design status`) and stating the advisory contract: a hit
   routes to `resolve-repository-state` or a `NEEDS-DECISION`, a miss never blocks
   a clean plan, and the sweep grants no gate authority. Verified by three greps
   (table header · candidate sources · advisory/routing wording).
4. **Both branches demonstrated on this repository.** A recorded demonstration:
   (a) a plan claim that contradicts a decision actually recorded in this repo
   yields one filled sweep row whose `prior decision` cites that decision's real
   path; (b) an equivalent clean claim yields zero rows and no block. Verified by
   the two runs and their outputs pasted into the Evidence section.
5. **Gates green.** `bun scripts/check-skill-context.mjs` exits 0 (context
   budgets PASS — any ceiling re-based carries a declared reason in
   `docs/workflow/SKILL_CONTEXT_BUDGETS.json`), and `node --test scripts/*.test.mjs`
   exits 0, including `normative-drift` (the fixed `→ Next:` blocks still render)
   and the CHANGELOG/authoring discipline tests.
6. **Version discipline.** Every `skills/<name>/SKILL.md` edited by this unit
   carries a bumped `version:` and a scoped `CHANGELOG.md` row, produced through
   `bump-skill`. Verified by `node scripts/check-changelog-row.mjs <skill> <version>`
   printing `1` for each touched skill.
7. **Golden-fixture / context re-checks.** `node --test scripts/golden-fixture.test.mjs`
   exits 0, and every touched **executor-path** skill has a dated run-log row in
   `docs/workflow/GOLDEN_FIXTURE.md` whose Result cell matches the enforced
   grammar (`exact <n>/<n> · invented none\|<k> · shape ok\|<fail-code>`) —
   post-cutoff rows only (pre-cutoff are grandfathered).
   A manual weak-model run not executable in this session is recorded with
   `NOT RUN — <explicit reason>` in the narrative column; the Result cell
   still matches the grammar.
   A silent skip fails this AC.

## Non-goals

- **No judging machinery.** JEV/System-One evaluation of contradictions stays
  parked; candidate retrieval stays deterministic keyword/FTS matching — the
  hybrid index is #192's.
- **No new script, gate, verdict or schema.** The sweep routes and escalates; it
  never blocks, never issues a verdict of its own, and adds no authority. The
  schema package is not touched.
- **No repo-wide bug hunt in this unit.** That is `product-audit`'s job,
  performed there under its own budget.
- **No routing/behavior change** to `execute-phase`, `audit-pr`, `triage-issue`,
  `workflow-status`, `fold-findings`, the review pack axes, or
  `pre-execution-review`'s ledgers — and `review-change`'s fixed report/receipt
  blocks keep their exact shape (AC5's `normative-drift` + root suite enforce it).
- **No npm package bump or release.** This is a skill-only change and
  `publish-pi-package.yml`'s paths filter does not fire on `skills/` (pre-existing
  publish model, recorded under Known pre-existing issues).
- **No `.es.md` sibling and no language-switcher link** (repo-wide rule).
- Findings discovered while implementing route out of this unit; they never widen
  its scope.

## Future cost

| Rule | Binds |
|---|---|
| `review-change` and `product-audit` must keep stating the charter split (change-scoped dismantle vs. repo-wide sweep) | anyone rewording either skill's scope/relationship sections — a rewording that drops one side silently reverts this decision |
| The plan step's sweep table shape stays exactly `claim \| prior decision \| source path \| relation` | anyone editing `skills/unit-lane/references/PLAN.md`; changing the shape is a contract change, not a wording tweak |
| The sweep stays advisory — it routes, it never blocks, it issues no verdict | anyone tempted to promote a keyword miss into a gate; that promotion is a new decision with its own issue |
| A wording growth past a context ceiling ships with a declared ceiling re-basis + reason in `SKILL_CONTEXT_BUDGETS.json` | the next author touching `product-audit`/`review-change` (both sat near their ceilings at unit start) |
| Touched executor-path skills owe a golden-fixture run-log row per edit | whoever edits `review-change`, `product-audit`, or `unit-lane` next |

## Applicable tests

- `node --test scripts/*.test.mjs` (root suite: `normative-drift`,
  `check-skill-context`, `check-changelog-row`, `golden-fixture`,
  `unit-route`, `turn-contract-grammar`, …)
- `bun scripts/check-skill-context.mjs` (context budgets + reference reachability)
- `node --test scripts/golden-fixture.test.mjs` (golden fixture, deterministic half)

The root suite and the context-budget gate are this unit's verification surface;
the `tests` triage step therefore runs rather than being skipped.

## Known pre-existing issues

- `skills/product-audit/SKILL.md` measured `2799` estimate against the default
  `mainEstimateMax` of `2800` (1 unit of headroom) — **affects** this unit: any
  wording added to that file needs a declared `mainEstimateMax` re-basis with a
  reason in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`.
- `skills/review-change/references/REVIEW_PROCESS.md` measured `2799` of its
  `3079` ceiling — **does-not-affect** unless this unit grows that file (avoid;
  charter wording belongs in `SKILL.md`, which had ~470 estimate of headroom).
- `publish-pi-package.yml` paths filter is `packages/pi-agentic-workflow/**`, so
  a merge that only touches `skills/` never republishes the npm package —
  **does-not-affect** this unit (no release step; skill-only changes ship from
  the repo, and `npx skills add` reads `skills/` directly).
- `docs/workflow/GOLDEN_FIXTURE.md`'s own "When to run" list is current, but
  `AGENTS.md`'s smoke-test paragraph still names retired skills
  (`plan-feature`, `plan-feature-scaffold`, `plan-feature-from-issue`,
  `design-feature`) — **does-not-affect** this unit (docs drift found in
  research; route to `audit-docs`, never fixed inside this unit).
- `pre-execution-review`'s LEDGERS/POLICY references sit near their declared
  ceilings — **does-not-affect** (this unit does not touch that skill; the sweep
  lives in the lane's plan step per the issue's "or" placement).
- Issue #270 lists SPEC `## Design status` among the candidate sources, but only
  pre-61 units still carry that heading (units 61+ no longer emit it) —
  **does-not-affect** this unit (the sweep names it as a legacy marker, so a
  candidate retrieval over an older SPEC still resolves).
- Baseline gate state before this unit's first edit: root suite 578/0 and
  `check-skill-context` PASS, both recorded as R5/R6 — **does-not-affect** (a red
  baseline would have to be recorded here first; it is green).
- **`scripts/golden-fixture.test.mjs` F1 assertion was a time bomb — affects this
  unit.** The fold that made the committed-log check "append-safe" (c32525ca)
  replaced `checked === 0` ("no committed row is dated on/after the 2026-09-18
  cutoff **yet**") with `checked === 1` for the appended copy — still assuming
  zero committed post-cutoff rows. AC7 requires this unit to log a 2026-09-29
  row, which made `checked === 2` and failed the suite (577/578). **Fixed here
  with a recorded justification**, not silenced: the assertion now compares
  `result.checked` with `runLogGrammar(DOC).checked + 1`, which is byte-equivalent
  to the old constant while the log holds zero post-cutoff rows (the state the
  constant was written for) and remains the exact "the appended row is checked,
  not skipped" property as rows accumulate — if the appended row were skipped,
  `result.checked` would equal `committed.checked` and the assertion would fail.
  The repo root carries no `.agentic-workflow/path-policy.json`, so `scripts/**`
  is not under the shipped test-freeze policy here; the justification lives in
  this row because the unit doc is this lane's single record.

## Tasks

- P1 — `review-change`: add a `## Review charter` section after `## Scope` with
  the four clauses — dismantle the claim · in-scope defects are this review's job
  (plus other features' requirements) · ask-don't-infer on the expectation
  surface · repo-wide hunting routes to `product-audit`. (validator: AC1's four
  greps, ≥1 hit each)
- P2 — `product-audit`: add the ownership claim to the frontmatter
  `description:` and one `## When to use` bullet. (validator: AC2's two greps)
- P3 — `unit-lane` plan step: add the prior-decisions contradiction sweep —
  fixed `claim | prior decision | source path | relation` table, candidate source
  list, two-value relation, advisory routing — plus its checklist boxes and
  forbidden lines. (validator: AC3's three greps)
- P4 — Context budgets: re-base every ceiling the wording grew, each with a
  declared reason in `docs/workflow/SKILL_CONTEXT_BUDGETS.json`. (validator:
  `bun scripts/check-skill-context.mjs` exit 0 and the new reason line present)
- P5 — Versioning: run `bump-skill` for each touched `SKILL.md` (version +
  `CHANGELOG.md` row + README/SKILLS table sync). (validator:
  `node scripts/check-changelog-row.mjs <skill> <version>` prints `1` per touched
  skill)
- P6 — Verification: the full gate plus the whole AC grep set, re-running the
  AC4 demonstration. (validator: `node --test scripts/*.test.mjs` exit 0,
  `bun scripts/check-skill-context.mjs` exit 0, every AC grep at its expected
  count)

AC→task map: AC1→P1, AC2→P2, AC3→P3, AC4→plan step now (rows 4a/4b) and re-run
at P6, AC5→P4+P6, AC6→P5, AC7→P6 plus the catalog's `docs` step, which owns the
`GOLDEN_FIXTURE.md` run-log rows (docs tasks are deliberately not cut here).
Ordered smallest-first; P6 is the verification tail.

## Evidence

One row per acceptance criterion: what was run, exit status/digest, observed output (≤2 lines), verified-by.

> Evidence is verified, not claimed — a reviewer re-runs it.

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| R1 | `grep -c dismantle skills/review-change/SKILL.md skills/product-audit/SKILL.md` | 0 · 0 | charter wording is absent from both skills — nothing to overwrite, all of AC1/AC2 is new text | main agent |
| R2 | `ls docs/features/*/decisions.md \| wc -l` · `ls docs/fix/*/decisions.md \| wc -l` | 0 | 33 · 2 — the sweep's primary candidate source exists at unit scale | main agent |
| R3 | `grep -rln '## Design status' docs/features/*/SPEC.md` | 0 | 35 SPECs carry the marker, every one from units ≤ 60; units 61+ no longer emit it → legacy candidate source | main agent |
| R4 | `grep -rn 'bug hunt\|security research\|broken-version\|prior decision\|contradiction sweep' skills/` | 0 | one unrelated `RECOMMENDED_SKILLS` row; neither the repo-wide ownership claim nor the sweep exists yet | main agent |
| R5 | `bun scripts/check-skill-context.mjs` | 0 | PASS, 28 skills — main-est `product-audit` 2799/2800, `review-change` 2327/2800, `unit-lane` 1880/2800; desc-est 71 / 80 / 50 of 120 | main agent |
| R6 | `node --test scripts/*.test.mjs` (baseline, before any edit) | 0 | 578 pass / 0 fail — fresh worktree needed `packages/agentic-workflow-schema` built first (setup, not a code change) | main agent |
| D1 | design closure — entities/roles/expectation surface reviewed against AC1–AC7 (entities: `review-change`, `product-audit`, `unit-lane` plan step, `SKILL_CONTEXT_BUDGETS.json`, `CHANGELOG.md`, `GOLDEN_FIXTURE.md` run log; roles: planner, reviewer, auditor, maintainer, CI gates) | recorded | charter → new `## Review charter` in `review-change/SKILL.md`; ownership → `product-audit` frontmatter description + `## When to use`; sweep → `skills/unit-lane/references/PLAN.md` alone (`pre-execution-review` untouched — single-owner rule) | main agent |
| 4a | claim **“keep the bilingual `.es.md` siblings and add a language-switcher link in this unit's docs”** → `grep -rn "\.es\.md\|language-switcher" AGENTS.md docs/features/*/decisions.md docs/fix/*/decisions.md docs/workflow/WORKFLOW_INVARIANTS.md docs/workflow/REPOSITORY_STATE.md` | 0 | 17 candidate lines across 8 source files (re-counted at review); the contradicting decision is `AGENTS.md:52-56` (+ `docs/features/40-versioned-skills-releases/decisions.md:36`, frozen NRS fact `docs/workflow/REPOSITORY_STATE.md:32` F011) → one row, verdict `contradicts`, routed to `resolve-repository-state` | main agent |
| 4b | claim **“add an advisory prior-decisions sweep checklist to the lane's plan step”** → same retrieval command over the same sources | 1 (no matches) | zero candidates → zero sweep rows → the plan proceeds with no block and no gate | main agent |
| P1 | AC1's four greps over `skills/review-change/SKILL.md` (`dismantle` · `guard skip` · `Ask, don't infer` · `product-audit.*where the sweep`) + `bun scripts/diff-guard.mjs --base main --unit 69` | 2 · 1 · 1 · 1 · guard 0 | all four charter clauses present; `DIFF-GUARD PASS — 69` (+338/−4, 6 files) | main agent |
| P2 | AC2's two greps over `skills/product-audit/SKILL.md` (`repo-wide bug hunt` at line 13 = inside frontmatter, which ends at 17 · `owns the repo-wide sweep` at line 42) + diff guard | 1 · 1 · guard 0 | ownership stated in both the description and the body; `DIFF-GUARD PASS — 69` (+341/−4, 6 files) | main agent |
| P3 | AC3's greps over `skills/unit-lane/references/PLAN.md` (table header `claim \| prior decision \| source path \| relation` 1 · decisions.md 3 · Advisory only 1 + routing 2 + never blocks 2, all re-measured at HEAD after the F8+F9 folds) + diff guard + context gate | 1 · 3 · 1/2/2 · guard 0 · context 0 | sweep section, fixed table and advisory contract present; budgets PASS | main agent |
| P4 | `bun scripts/check-skill-context.mjs` with the re-based ceiling | 0 | `PASS context budgets: 28 skills` — `product-audit` `mainEstimateMax` 2800 → 3192, declared reason `feature 69 / issue #270` (2799 → 2901 measured) | main agent |
| P4b | `node scripts/check-skill-context.mjs --routes` (first run at the tests step was **red**: the charter grew the four `review-change` route loads) → re-based the four route ceilings, then re-run | 1 → 0 | route failures `19509 < 19960`, `17691 < 18142` ×2, `18207 < 18658` (+ the line ceilings) → `PASS route budgets: 14 routes`, each ceiling now `ceil(measured x 1.10)` with the declared `feature 69 / issue #270` source | main agent |
| P5 | `node scripts/check-changelog-row.mjs review-change 3.9.0` · `… product-audit 3.4.0` · `… unit-lane 1.2.0` + bump-skill's 7 authoring-lint rules | 1 · 1 · 1 · lint reported | one scoped CHANGELOG row per skill; lint rules 2–7 pass for all three, rule 1 is a **pre-existing** warning for `review-change` (its closing block is printed from `references/PERSIST_AND_DECIDE.md` step 14, not from `SKILL.md`) | main agent |
| P5-guard | `bun scripts/diff-guard.mjs --base main --unit 69` after the bump surfaces landed | 1 (**BREACH**) | `Lines: 370 > 400 · Files: 9 > 8` — exception recorded below; nothing deleted to fit | main agent |
| T1 | `node --test scripts/*.test.mjs` (full root suite, after every edit) | 0 | 578 pass / 0 fail — same count as the R6 baseline, no test added or removed | main agent |
| T2 | `bun scripts/check-skill-context.mjs` · `node scripts/check-skill-context.mjs --routes` | 0 · 0 | `PASS context budgets: 28 skills` · `PASS route budgets: 14 routes` | main agent |
| T3 | `node --test scripts/golden-fixture.test.mjs` | 0 | 12 pass / 0 fail (deterministic half) | main agent |
| T4 | AC grep set: AC1 `2 / 1 / 1 / 1` (`dismantle`, `guard skip`, `Ask, don`, `repository\* belong to`) · AC2 `1 / 1` · AC3 `1 / 3 / 1 / 1` · AC6 `1 / 1 / 1` | 0 | every clause present at its expected count; AC4 re-run unchanged (8 source files hit, decisive `AGENTS.md:56`; clean claim exit 1) | main agent |
| 1 | four greps over `skills/review-change/SKILL.md`: `grep -c dismantle` · `guard skip` · `Ask, don` · `repository\* belong to` | 2 · 1 · 1 · 1 | all four clauses live in the new `## Review charter — dismantle the claim` (skill 3.9.0) | main agent |
| 2 | `awk 'NR<=17' skills/product-audit/SKILL.md \| grep -c "repo-wide bug hunt"` · `grep -c "owns the repo-wide sweep" skills/product-audit/SKILL.md` | 1 · 1 | line 13 (frontmatter ends at 17) · line 42 (`## When to use` bullet), skill 3.4.0 | main agent |
| 3 | `grep -c` over `skills/unit-lane/references/PLAN.md`: fixed table header `claim \| prior decision \| source path \| relation` · `decisions.md` · `Advisory only` · `creates no gate authority\|adds no authority` | 1 · 3 · 1 · 1 | the sweep section carries the fixed shape, the five candidate sources and the advisory contract | main agent |
| 4 | runs **4a** + **4b** above — the same deterministic retrieval over the declared sources, once with a contradicting claim and once with a clean one | 0 · 1 | contradicting claim → one row citing `AGENTS.md:52-56`; clean claim → zero rows, no block, no gate | main agent |
| 5 | `node --test scripts/*.test.mjs` · `bun scripts/check-skill-context.mjs` · `node scripts/check-skill-context.mjs --routes` | 0 · 0 · 0 | 578/0 · `PASS context budgets: 28 skills` · `PASS route budgets: 14 routes` — every grown ceiling re-based with a declared reason | main agent |
| 6 | `node scripts/check-changelog-row.mjs review-change 3.9.0` · `… product-audit 3.4.0` · `… unit-lane 1.2.0` | 1 · 1 · 1 | one scoped CHANGELOG row per skill; `version:` bumped in each frontmatter by `bump-skill` | main agent |
| 7 | `node --test scripts/golden-fixture.test.mjs` (executable half) + the manual weak-model run recorded in `docs/workflow/GOLDEN_FIXTURE.md` | 0 | 12 pass / 0 fail; GOLDEN_FIXTURE.md carries one dated `exact 7/7 · invented none · shape ok` row for `review-change` 3.9.0 · `product-audit` 3.4.0 · `unit-lane` 1.2.0 (2026-09-29), plus a `NOT RUN` row for the audit-evidence provenance fixture of `product-audit` 3.4.0 | main agent |
| M2a | run-log row's Result cell rewritten to the closed grammar (`exact 7/7 · invented none · shape ok`) → `node --test scripts/golden-fixture.test.mjs` | 0 | 12 pass / 0 fail — the row's own Result cell, not the row, was what broke `RESULT_GRAMMAR` | main agent |
| M2b | F1 assertion made append-safe (`result.checked === runLogGrammar(DOC).checked + 1`, justification in Known pre-existing issues) → `node --test scripts/*.test.mjs` | 0 | 578 pass / 0 fail (577/578 immediately before the fix; 578/0 at the R6 baseline) | main agent |
| M2-verify | `bun scripts/check-skill-context.mjs` · `node scripts/check-skill-context.mjs --routes` · `git status --porcelain` | 0 · 0 · empty | `PASS context budgets: 28 skills` · `PASS route budgets: 14 routes` · clean tree | main agent |
| CLOSE | final gate: `node --test scripts/*.test.mjs` · `bun scripts/check-skill-context.mjs` · `node scripts/check-skill-context.mjs --routes` · `bun scripts/diff-guard.mjs --base main --unit 69` | 0 · 0 · 0 · 1 (BREACH, excepted) | 578/0 · PASS 28 skills · PASS 14 routes · `Lines: 564 > 400 · Files: 11 > 8` (exception block) → fold F8–F11 re-measured `Lines: 652 > 400 · Files: 12 > 8` on base `10869fdc` | main agent |

### Review pack axes (step: review)

| Axis | Run? | How / why not |
|---|---|---|
| `review-verify` (run the gate, confirm real behavior) | yes | the context-clean reviewer re-ran every evidence row and the full gate (exit codes in its report) |
| `review-code` (correctness, consistency, duplication, simplification) | yes | charter/ownership/sweep wording cross-checked against `pre-execution-review`'s single-owner rule, the fixed report blocks, and the Non-goals; no duplicated rule found |
| `review-security` / `review-perf` / `review-a11y` / `review-design` / `review-seo` | n/a | wording-only change: no code, no runtime path, no asset, no UI or public web surface |
| `review-brand` | n/a | no end-user-facing copy changed — skills are agent-facing documentation |
| `review-debt` | n/a | nothing debt-shaped in the classified table (no fix-now debt item, no TRIGGER) |

### Review verdict (step: review, cycle 1)

```text
REVIEW-VERDICT: FAIL
- Findings: 1 material, 3 report-notes
- Evidence reproduced: no — AC1–AC7 all reproduced green, but the P5-guard
  exception block's numbers were stale/internally inconsistent (it claimed
  “breach is file count only” and `+355/−9`; the live re-run reads
  `Lines: 435 > 400 · Files: 9 > 8` and the committed P5 stat is `+361/−9`)
- AC integrity: unchanged from triage — `## Acceptance criteria` sha256
  `2c593412e5e845d1a72f3ae6ab1626ae270f6049e1fd7662b9318a14f63d84f7`,
  identical to the creation commit `dfdf9851`
```

Material finding (review cycle 1) — **M1**: the diff-guard exception overstated
compliance (both dimensions breach, and one stat in it was wrong). Fixed in this
same step by rewriting the block above with the reviewer's re-measured numbers.
Report-notes: **N1** AC7's run-log rows were not yet written (docs step pending,
row 7's “see the docs-step entry below” dangled); **N2** row 4a said 18 candidate
lines where the re-run yields 17 (fixed above); **N3** the exception's
“P1–P4 passed at 6 files (+338 → +344)” was a dirty-tree snapshot, not the
committed states (corrected above). Reviewer also confirmed scope clean: no test
changed, no commit on `main`, empty `git status`, 10 conventional subjects,
English docs, no `.es.md` sibling, no package bump, no new script/gate/authority.

### Review verdict (step: review, cycle 2 — delta)

```text
REVIEW-VERDICT: FAIL
- Findings: 1 material, 2 report-notes
- Evidence reproduced: partial — the delta checks reproduced (row 4a = 17 lines,
  AC7 run-log row present, AC sha256 unchanged, both budget gates green), but the
  gate re-reddened after the docs step: root suite 575/578 and
  `scripts/golden-fixture.test.mjs` 9/12
- AC integrity: unchanged from triage — sha256 `2c593412e5e845d1a72f3ae6ab1626ae270f6049e1fd7662b9318a14f63d84f7`
```

Material finding **M2**: the run-log row the docs step appended (report-note
N1's fix) used Result ` PASS `, which violates the closed post-cutoff grammar
`exact <n>/<n> · invented none|<k> · shape ok|<fail-code>` — three AC3(c) tests
turned red, re-breaking AC5/AC7. Fixed by rewriting only that Result cell to
`exact 7/7 · invented none · shape ok` (row **M2a**), which then exposed the
time-bomb in the test's own F1 assertion (a literal `checked === 1` written when
the log held no post-cutoff row, so any real row dated ≥ 2026-09-18 failed it) —
fixed with the recorded justification in Known pre-existing issues (row
**M2b**). Report-notes: **N4** the exception block's single "live measurement"
lagged the tree (now restated as labeled per-run snapshots), **N5** its
dirty-tree list omitted P1's run (now all three: 342/6, 345/6, 348/6).

**Loop position:** the durable ledger `review-findings.md` carries the
`REVIEW-RAN` marks (count them with
`grep -c "^| REVIEW-RAN |" docs/features/69-review-conformance/review-findings.md`;
these marks are the authoritative cycle count, not any prose figure written
against them). The earlier, pre-ledger review-step verdict blocks above
(cycle 1 and cycle 2) ran before the fold ledger was established. Under
`REVIEW_PROCESS.md`'s two-cycle cap the count from the ledger is finite —
any additional review needs their explicit instruction → closing block below.

```text
DIFF-GUARD EXCEPTION — 69 (both dimensions)
- The guard's "Lines" is insertions + deletions and it grows with every
  Evidence/Progress append, so no single figure stays "the" measurement. The
  output is recorded verbatim wherever it was run:
    · P5-guard (commit 45f6bb45):  Lines 370 > 400 · Files 9 > 8  (+361/−9)
    · review cycle 1:              Lines 435 > 400 · Files 9 > 8  (+414/−21)
    · review cycle 2:              Lines 487 > 400 · Files 10 > 8 (+466/−21)
    · at this exception's rewrite: Lines 522 > 400 · Files 13 > 8
      (`git diff --shortstat main` = 11 files, +498/−22; the gap is the guard
      counting staged + unstaged sides separately)
    · final gate (closing):       Lines 564 > 400 · Files 11 > 8
      — entries grow after their own run; fold F8–F11 re-measured `Lines: 652 > 400 · Files: 12 > 8` on base `10869fdc` (the PR merge-base). The
      numbers above are snapshots of the diff-guard measurement at the time
      they were recorded (they are not persistent — every subsequent Evidence/
      Progress append grows the diff, and the base commit itself moves when
      `main` advances); to reproduce at any head, re-run
      `bun scripts/diff-guard.mjs --base <sha> --unit 69` on a clean tree
      (the guard counts staged + unstaged changes, so a dirty tree adds
      working-tree bytes to the count). At the merge-base `10869fdc` the final
      diff is `Lines: 675 > 400 · Files: 12 > 8`; at a later main tip `354c59ed`
      it is `Lines: 2178 > 400 · Files: 32 > 8` (both measured at HEAD's index
      with a clean tree).
- File count is the dimension the exception exists for: one PR per unit, and
  every file is required — the unit doc + roadmap row (lane artifacts),
  `skills/review-change/SKILL.md` + `skills/product-audit/SKILL.md` +
  `skills/unit-lane/{SKILL.md,references/PLAN.md}` (AC1–AC3 + AC6),
  `docs/workflow/SKILL_CONTEXT_BUDGETS.json` (AC5), `CHANGELOG.md` +
  `README.md` (AC6 via bump-skill), `docs/workflow/GOLDEN_FIXTURE.md` (AC7),
  `docs/features/69-review-conformance/review-findings.md` (the fold ledger —
  `review-change`'s own append), `scripts/golden-fixture.test.mjs` (cycle-2
  M2b — one assertion, justification in Known pre-existing issues). No honest split exists: splitting the PR separates an AC from its evidence.
- Committed-state history (reviewer re-measured): P1 `6b3bf390` 3 files/289 ·
  P2 `32bfba0a` 5/310 · P3 `74efa5d9` 6/351 · P5 `45f6bb45` 9/370 — the guard
  passed at 6 files through P3 (its point-in-time dirty-tree runs read 342/6,
  345/6, 348/6 for P1/P2/P3, because the three skill edits were authored before
  the first phase commit and shared one working tree).
- Line growth is unit-doc content (Evidence rows, progress entries, this block)
  — the anti-gaming rule forbids deleting it to fit the budget.
- Anti-gaming check: no comment, blank line, doc or test was deleted to shrink
  the diff at any point. The only test file touched in this unit is
  `scripts/golden-fixture.test.mjs`'s F1 assertion, changed to make it
  append-safe (it was failing) with the recorded justification above — no
  assertion was relaxed to hide a failure, and the rest of the suite is
  byte-untouched (`git diff main --stat -- 'scripts/*.test.*'` = that one file).
- Disposition: exception recorded for BOTH dimensions with the real numbers;
  the guard still runs and is reported (P5-guard row, cycle 1/2 review rows)
  instead of being hidden or forced down.
```

**Research uncertainties stated (not guessed):** (a) whether a fleet model weak
enough for the golden-fixture manual run is reachable in this session — AC7
allows an explicit `NOT RUN — <reason>` row, decided at the tests step; (b) the
issue's "`pre-execution-review` **or** the lane's plan step" placement — resolved
at the design step by the single-owner rule (one file owns the sweep); (c) npm
publish for skill-only changes — settled as a recorded pre-existing issue, not a
unit obligation.

## Triaged steps

```text
TRIAGE — 69 (feature)
Steps: research, design, plan, implement, tests, evidence, review, docs
Skipped: release: small scope
Budget: strong
```

(`bun scripts/unit-route.mjs --triage 69`, exit 0 — this block is the
authoritative step list; the model never re-derives, reorders or invents steps.)

## Progress log

2026-09-29 15:21 — unit doc created from `docs/features/_TEMPLATE/SPEC.md` for issue #270; roadmap row 69 registered as `defined` → working tree — next: triage (`bun scripts/unit-route.mjs --triage 69`)

2026-09-29 15:32 — triage ran (block above pasted verbatim); root suite baseline green (`node --test scripts/*.test.mjs` 578/0 after building `packages/agentic-workflow-schema/dist`, a fresh-worktree setup step) → working tree — next: research step

2026-09-29 15:48 — research step done (rows R1–R6): no charter/sweep wording exists in either skill; 35 decisions.md sources; `## Design status` legacy-only; measured ceilings recorded; placement question and fleet-model question stated as uncertainties → working tree — next: design step

2026-09-29 16:05 — design step done (row D1): the three wording homes fixed — a `## Review charter` section in `review-change` (after `## Scope`, before `## Step 0`, inside its 473-estimate headroom), the ownership claim in `product-audit`'s frontmatter `description:` + `## When to use` bullet (its file sat 1 estimate unit under the ceiling, so the growth ships with a declared `mainEstimateMax` re-basis), and the sweep as a section of `skills/unit-lane/references/PLAN.md` carrying the fixed `claim | prior decision | source path | verdict` table with a two-value verdict vocabulary (`contradicts` → routes to `resolve-repository-state`/`NEEDS-DECISION`, `compatible` → no action); no second copy in `pre-execution-review`, whose own single-owner guardrail forbids restating a shared rule → working tree — next: plan step

2026-09-29 16:22 — plan step done: tasks P1–P6 cut with validators, smallest first, P6 = verification (AC→task map above); the sweep demonstration ran both ways (rows 4a/4b — the contradicting claim cites `AGENTS.md:52-56`, the clean claim returns zero candidates and nothing blocks) → working tree — next: implement (P1)

2026-09-29 16:41 — P1 done: `## Review charter — dismantle the claim` added to `skills/review-change/SKILL.md` after `## Scope`, four clauses (dismantle · in-scope defects are the review's job · ask-don't-infer at expectation level · repo-wide hunting → `product-audit`); AC1 greps 2/1/1/1, diff guard PASS → evidence: P1 row above — next: P2

2026-09-29 16:47 — P2 done: frontmatter `description:` and a new `## When to use` bullet in `skills/product-audit/SKILL.md` state the repo-wide bug-hunt / security-research / broken-version ownership (line 13 inside frontmatter · line 42 body); diff guard PASS → evidence: P2 row above — next: P3

2026-09-29 16:55 — P3 done: `## Prior-decisions contradiction sweep` added to `skills/unit-lane/references/PLAN.md` (fixed `claim | prior decision | source path | verdict` table with a two-value verdict, five candidate sources, advisory-only routing to `resolve-repository-state`/`NEEDS-DECISION`) plus two checklist boxes and two forbidden lines; greps 1/4/1+3+2, diff guard PASS, budgets PASS → evidence: P3 row above — next: P5 (bump-skill for the three touched skills)

2026-09-29 17:02 — P4 done: `product-audit`'s `mainEstimateMax` re-based 2800 → 3192 with the declared `feature 69 / issue #270` reason (measured 2799 → 2901), context gate green — committed with P2 so no red commit exists → evidence: P4 row above — next: P5

2026-09-29 17:14 — P5 done via `bump-skill` (explicitly named skills; its discovery reads `git diff` of `SKILL.md`, and this unit's commits were per-phase): `review-change` 3.8.0 → 3.9.0, `product-audit` 3.3.0 → 3.4.0, `unit-lane` 1.1.0 → 1.2.0 (minor each — a new section/contract statement), one scoped `CHANGELOG.md` row per skill, README skills-table cells for the two user-facing rows updated; authoring lint reported (rule 1 warning on `review-change` is pre-existing) → evidence: P5 row above — next: tests step

2026-09-29 17:22 — diff guard re-run after P5 → **BREACH** (`Files 9 > 8`, lines 370/400 fine); exception recorded in the Evidence section above with the measured numbers, the per-file justification and the anti-gaming check — no re-triage changes the guard's fixed 8-file default, and no file can be honestly dropped → working tree — next: tests step

2026-09-29 17:40 — P4b: the tests step caught what P4's `--routes` had not been run for — the charter grew `review-change`'s loaded route (default routes 16082 → 16492 est / 1172 → 1198 lines), so the four route ceilings (`adversarial`, `default-backend`, `default-web`, `synthesize`) were re-based to `ceil(measured x 1.10)` with the declared `feature 69 / issue #270` reason; `--routes` now `PASS route budgets: 14 routes` → evidence: P4b row above — next: tests step (T rows)

2026-09-29 17:52 — tests step done (rows T1–T4): full root suite 578/0, context + route budgets PASS, golden-fixture suite 12/12, the whole AC grep set at its expected counts and the AC4 demonstration re-run unchanged → evidence: T rows above — next: evidence step

2026-09-29 18:05 — evidence step done: one row per AC now exists (1–7, with AC4 evidenced by its two branch runs 4a/4b plus the consolidated row 4), every row from an actual run, every command reproducible → evidence: rows 1–7 above — next: review step

2026-09-29 18:34 — review step (cycle 1) done by a context-clean reviewer that did not write the change: **REVIEW-VERDICT: FAIL** (1 material, 3 report-notes; AC1–AC7 reproduced green, AC-section sha256 unchanged from the creation commit). M1 (stale/inconsistent diff-guard exception) fixed in the same step — the block now carries the reviewer's re-measured numbers for both dimensions and the committed-state history; N2 (row 4a count 18 → 17) fixed; N3 (dirty-tree history claim) folded into the block; N1 (AC7 run-log rows) goes to the docs step → evidence: review verdict block above — next: docs step (N1), then a delta re-review

2026-09-29 18:52 — docs step done: one dated `PASS` run-log row appended to `docs/workflow/GOLDEN_FIXTURE.md` for `review-change` 3.9.0 · `product-audit` 3.4.0 · `unit-lane` 1.2.0 (live `nan/qwen3.6` run, three quoted-section scenarios, all seven answer lines exact — closes report-note N1), roadmap row 69 flipped `defined` → `in-progress`, AC7 row updated → evidence: row 7 above — next: delta re-review of M1/N2/N3, then close the unit

2026-09-29 19:26 — cycle-2 delta review returned **REVIEW-VERDICT: FAIL** (1 material, 2 report-notes): my own run-log Result cell ` PASS ` violated the closed grammar and re-reddened the gate (575/578 · golden-fixture 9/12). Fixed both findings — Result cell → `exact 7/7 · invented none · shape ok`, and the F1 assertion's literal `checked === 1` → `committed.checked + 1` with the recorded justification (it failed for ANY row dated ≥ 2026-09-18, i.e. any future log entry) — then re-ran the whole gate: 578/0, `PASS context budgets: 28 skills`, `PASS route budgets: 14 routes`, clean tree → evidence: rows M2a, M2b, M2-verify — next: closing (a third review pass is the user's call under the two-cycle cap)

2026-09-29 19:44 — unit closed locally: all nine triaged steps executed; final gate 578/0, `PASS context budgets: 28 skills`, `PASS route budgets: 14 routes`, diff-guard BREACH excepted on both dimensions (`Lines 564 > 400 · Files 11 > 8`, exception block); review verdict on record = cycle 2 `FAIL` with its findings fixed and gate-verified (rows M2a/M2b/M2-verify), AC-section sha256 unchanged since creation → working tree — next: operator authorizes `/review-change`, then push + `Closes #270` PR → `/audit-pr`

## Next

All nine triaged steps ran (research · design · plan · implement · tests ·
evidence · review · docs; `release` skipped by the catalog for small scope) and
the final gate is green: **578/0**, both budget gates PASS, diff-guard BREACH
recorded with a full exception.

What is deliberately **not** done here, and why:

1. **A further review pass.** The verdict on record is cycle 2's `FAIL` with
   F8–F11 folded and DEC-1 ratified in the same batch (rows M2a/M2b/M2-verify
   plus the `## Amendments` row); the two-cycle cap is counted from the
   ledger's `REVIEW-RAN` marks (not from prose that hard-codes a number) —
   the operator's call on the next pass, and the next command is never
   a step this unit takes alone.
2. **Push + PR.** The catalog skipped the `release` step, and a unit whose review
   verdict is `FAIL` must not be presented as merge-ready; the branch
   `270-review-conformance` is local. After a passing pass: push it, open the
   single PR against `main` with `Closes #270`, then `/audit-pr`.
3. **npm re-bundle.** Skill-only changes do not republish the pi package
   (paths filter + version gate); if the npm channel must carry the charter
   immediately, bump `packages/pi-agentic-workflow/package.json` (patch) — a
   deliberate owner decision, never a silent side effect.
4. **Report-note (proposal, not a finding):** `docs/workflow/REVIEW_AND_CLASSIFY.md`
   does not mention the new charter; route to `/audit-docs` if that docs pass is
   wanted.

## Amendments

- **2026-09-29 — acceptance amendment, approved by the operator in this session
  (issue #270 / feature 69).** (a) **AC7** is re-cut to the enforced closed
  run-log grammar (the pattern AC7 itself quotes), because the frozen wording
  asked for a Result cell the gate rejects — the defect F1 found. (b) **AC3**'s
  evidence-row shape cell is amended from `verdict` to `relation`, matching the
  shipped `skills/unit-lane/references/PLAN.md:40` (F3's fix for the overloaded
  noun); every claim surface that stated the old cell — User outcome, AC3,
  Future cost, task P3, ROADMAP row 69 and the CHANGELOG `unit-lane` 1.2.0 row —
  is amended with it, while the two dated progress-log entries keep `verdict` as
  it stood when they were written. Nothing else in `## Acceptance criteria`
  changes, and this row supersedes the `2c593412…` digest recorded in the two
  review-verdict blocks above.

## Acceptance receipt v1

- Manifest: legacy `SPEC.md` — the `## Acceptance criteria` section, hashed from
  the `## Acceptance criteria` heading through the `## Non-goals` heading
  inclusive (sha256, the method the review-verdict blocks above used)
- Blob: `be4fab35353c5fad0ec310cecafe7c089b21afafb4d291c7f258ac12d031cba1` · Status: frozen · Verified: 2026-09-29
- Supersedes: `2c593412e5e845d1a72f3ae6ab1626ae270f6049e1fd7662b9318a14f63d84f7`

## References

- Closes #270 — <https://github.com/gtrabanco/agentic-workflow/issues/270>
- Roadmap row: `docs/features/ROADMAP.md` row 69 (`in-progress`)
- Branch: `270-review-conformance` (local until a passing review — see `## Next`)
- Owner decision record: `docs/LOGS.md` (2026-09-29 — charter restatement,
  Idea 3 contradiction sweep, JEV parked)
- Candidate decision sources for the sweep: `docs/features/<NN>-<slug>/decisions.md`,
  `docs/workflow/WORKFLOW_INVARIANTS.md`, `docs/workflow/REPOSITORY_STATE.md`,
  `AGENTS.md`, SPEC `## Design status`
- Evidence for the low signal-to-noise claim: <https://arxiv.org/abs/2603.11078>
