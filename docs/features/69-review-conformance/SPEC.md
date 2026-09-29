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
verdict` — for every claim that touches a recorded decision, and an unchecked
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
   `claim | prior decision | source path | verdict`, naming the candidate sources
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
   `docs/workflow/GOLDEN_FIXTURE.md` recording `PASS` or `NOT RUN — <explicit
   reason>` for its fixture (the audit-evidence provenance fixture for
   `product-audit`). A silent skip fails this AC.

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
| The plan step's sweep table shape stays exactly `claim \| prior decision \| source path \| verdict` | anyone editing `skills/unit-lane/references/PLAN.md`; changing the shape is a contract change, not a wording tweak |
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

## Tasks

- P1 — `review-change`: add a `## Review charter` section after `## Scope` with
  the four clauses — dismantle the claim · in-scope defects are this review's job
  (plus other features' requirements) · ask-don't-infer on the expectation
  surface · repo-wide hunting routes to `product-audit`. (validator: AC1's four
  greps, ≥1 hit each)
- P2 — `product-audit`: add the ownership claim to the frontmatter
  `description:` and one `## When to use` bullet. (validator: AC2's two greps)
- P3 — `unit-lane` plan step: add the prior-decisions contradiction sweep —
  fixed `claim | prior decision | source path | verdict` table, candidate source
  list, two-value verdict, advisory routing — plus its checklist boxes and
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
| 4a | claim **“keep the bilingual `.es.md` siblings and add a language-switcher link in this unit's docs”** → `grep -rn "\.es\.md\|language-switcher" AGENTS.md docs/features/*/decisions.md docs/fix/*/decisions.md docs/workflow/WORKFLOW_INVARIANTS.md docs/workflow/REPOSITORY_STATE.md` | 0 | 18 candidate lines; the contradicting decision is `AGENTS.md:52-56` (+ `docs/features/40-versioned-skills-releases/decisions.md:36`, frozen NRS fact `docs/workflow/REPOSITORY_STATE.md:32` F011) → one row, verdict `contradicts`, routed to `resolve-repository-state` | main agent |
| 4b | claim **“add an advisory prior-decisions sweep checklist to the lane's plan step”** → same retrieval command over the same sources | 1 (no matches) | zero candidates → zero sweep rows → the plan proceeds with no block and no gate | main agent |
| P1 | AC1's four greps over `skills/review-change/SKILL.md` (`dismantle` · `guard skip` · `Ask, don't infer` · `product-audit, where the sweep`) + `bun scripts/diff-guard.mjs --base main --unit 69` | 2 · 1 · 1 · 1 · guard 0 | all four charter clauses present; `DIFF-GUARD PASS — 69` (+338/−4, 6 files) | main agent |
| P2 | AC2's two greps over `skills/product-audit/SKILL.md` (`repo-wide bug hunt` at line 13 = inside frontmatter, which ends at 17 · `owns the repo-wide sweep` at line 42) + diff guard | 1 · 1 · guard 0 | ownership stated in both the description and the body; `DIFF-GUARD PASS — 69` (+341/−4, 6 files) | main agent |

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

## Next

`/unit-lane 69-review-conformance` — continue with the next triaged step.

## References

- Closes #270 — <https://github.com/gtrabanco/agentic-workflow/issues/270>
- Roadmap row: `docs/features/ROADMAP.md` row 69
- Owner decision record: `docs/LOGS.md` (2026-09-29 — charter restatement,
  Idea 3 contradiction sweep, JEV parked)
- Candidate decision sources for the sweep: `docs/features/<NN>-<slug>/decisions.md`,
  `docs/workflow/WORKFLOW_INVARIANTS.md`, `docs/workflow/REPOSITORY_STATE.md`,
  `AGENTS.md`, SPEC `## Design status`
- Evidence for the low signal-to-noise claim: <https://arxiv.org/abs/2603.11078>
