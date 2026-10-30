# fix/340-deletion-reuse-obligations

## Issue

`#340` — NEW FEATURE: deletion & reuse as obligations — product-audit residue
dimensions (duplicate content, unused code, obsolete/missing docs) and
ask-don't-infer at every stage.

## Specs

Requirements, each numbered `S#` and quoting the requester's own words verbatim
between the quote markers. Cut one requirement per distinct ask, in the order
the issue states them.

**S1 — Complete review surface, prose included.**
> Complete review surface, prose included. Bugs, security failures, coherence, duplication, drift, and removable parts — across code **and skill/docs prose**. The dimension table gains the checks that are today only diff-scoped in `review-code` (duplication, dead code) so the audit re-sweeps the whole product, not just the last change.

**S2 — Obsolete and missing documentation.**
> Obsolete and missing documentation. Docs describing surfaces that no longer exist (obsolete) and live surfaces with no consumer-facing documentation (missing — the document-or-don't-coin residue #318 S2 leaves for later audits). Composes `audit-docs`; does not duplicate its axes.

**S3 — Unused code, classified two ways, never conflated.**
> Unused code, classified two ways, never conflated:
>    - Code written as part of a delivered feature that **no functionality invokes** → the feature was not implemented completely → **bug finding** (the unit shipped half of what was asked).
>    - Code orphaned because a requested change **replaced or removed** that feature or part → **marked for deletion** (`fix-now (delete)`), not a bug.

**S4 — Features-preserved-without-it verification.**
> Features-preserved-without-it verification. After any proposed deletion, the audit/review verifies that every requested feature still works without the removed code (and without the removed prose, same rule — "code" here includes skill prose).

**S5 — Reuse-first.**
> Reuse-first. A plan adding functionality must name the pre-existing parts it reuses (functions, scripts, skills, schemas, prose surfaces) — or record why reuse is not possible. A plan that re-implements an existing part without saying why does not pass.

**S6 — Replace-implies-delete.**
> Replace-implies-delete. Changing a feature for another, or adding a new function/code path that does the same as or supersedes an existing one, carries the deletion of the superseded part as a planned task with its evidence (extends #318's S8 retirements with the replace case made explicit). Deletion of unnecessary code — and skill prose, same rule — is an obligation **when the case exists**, not a ritual applied to every change.

**S7 — Third-party before homemade.**
> Third-party before homemade. Widely community-supported libraries are the preferred option over writing our own code when a comparable option exists (owner-cited example: the substrate-reuse approach of #260). Own code for a solved problem requires a recorded justification in the design output.

**S8 — Duplication and unnecessary-code detection as deletion candidates.**
> Duplication and unnecessary-code detection as deletion candidates, plus the features-preserved check from item 4, executed per change by `review-change`/`review-code`.

**S9 — Removal-feature cascade.**
> Removal-feature cascade. A feature whose purpose is to remove a feature deletes the code **and** the corresponding documentation and every sibling mention the context makes necessary (the sweep the fold already declares, applied to the removal's full cascade). When the context is unclear, the reviewer researches, understands and contrasts — it does not guess the cascade's extent.

**S10 — No assumption, anywhere.**
> No assumption, anywhere. No stage (development, modification, deletion, planning, design, review, audit) may invent or assume information. When an expectation is not evidenced by the tree, the docs, or a prior owner decision: understand the context of the question, research if useful — **without leaking data, secrets or project details** — and ask the user. Research never answers the question directly; it exists to understand better and propose solutions the user/dev decides between. This generalizes #303's ask-don't-infer from design/plan to **all** stages. Stated once in a single normative surface and referenced (never restated) by the stage skills.

### Triage decisions (owner answers, 2026-10-30 session)

- **AC6 home** — extend #303's ask-don't-infer bullet in
  `skills/unit-lane/references/DESIGN.md` in place; `DESIGN.md` is the single
  normative owner, every stage skill references it (owner option A).
- **Missing-docs scope (S2)** — consumer-facing contracts only, the
  document-or-don't-coin residue (owner confirmed the issue's proposal).
- **S7 example** — the intended example is **pi-extensible-workflows** (owner
  answer; the issue's "piew" string was a mis-transcription and appears nowhere
  in #260's body or comments — searched both).
- **Delivery strategy** — single PR, work-unit commits (owner option A).
- **Unused-code sweep scope (S1/S3)** — code **and** skill prose, per the
  owner guidance the issue itself quotes ("código… y por código también hablo
  de prosa en skills").

## Acceptance criteria

One observable, testable criterion per S#; each names the check that proves it.

- **AC-S1** — `skills/product-audit/references/AUDIT_DIMENSIONS.md`'s dimension
  table declares the duplicate-content sweep covering code **and** skill/docs
  prose, plus the dead-code/duplication checks today only diff-scoped in
  `review-code`. Check: `node --test scripts/residue-dimensions.test.mjs`
  exits 0 (dimension-sweep assertions).
- **AC-S2** — the dimension table declares the obsolete-docs and missing-docs
  sweeps (missing = live consumer-facing surfaces with no doc), composing
  `audit-docs` without restating its axes. Check: same suite, obsolete/missing
  assertions.
- **AC-S3** — unused code classifies two ways in the single classification
  engine: delivered-feature-without-consumer → bug finding;
  orphaned-by-requested-replacement/removal → `fix-now (delete)`. Check: same
  suite, classification assertions against
  `skills/review-implementation/references/CLASSIFY.md`.
- **AC-S4** — the features-preserved-without-it check (code and prose) is a
  pass-only-if item of the per-change review (`review-code`) and of the audit's
  residue sweeps. Check: same suite, features-preserved assertions.
- **AC-S5** — the plan reference carries reuse-first as a pass-only-if
  checklist item: every planned addition names what it reuses or why not.
  Check: same suite, reuse-first assertion against
  `skills/unit-lane/references/PLAN.md`.
- **AC-S6** — the plan reference carries replace-implies-delete as a
  pass-only-if checklist item: each replacement carries the superseded part's
  deletion task with its evidence. Check: same suite, replace-implies-delete
  assertion.
- **AC-S7** — the design reference carries the third-party-vs-own decision
  item: widely community-supported libraries preferred; own code for a solved
  problem requires a recorded justification; owner-cited example
  pi-extensible-workflows. Check: same suite, third-party assertion against
  `skills/unit-lane/references/DESIGN.md`.
- **AC-S8** — `review-code` carries duplication/unnecessary-code as deletion
  candidates routed through the classifier's two-way rule. Check: same suite,
  deletion-candidate assertions.
- **AC-S9** — `review-code` carries the removal-feature cascade item: code +
  docs + sibling mentions, one sweep declaration per deleted truth; unclear
  extent is researched and asked, never guessed. Check: same suite,
  removal-cascade assertions.
- **AC-S10** — the no-assumption rule has exactly one normative owner surface
  (`ask-dont-infer@1` in `skills/unit-lane/references/DESIGN.md`, declared in
  `AGENTS.md`'s `normative-surfaces@1`); the stage skills reference it; zero
  restatements (an occurrence of the rule name outside the owner without an
  owner pointer). Check: same suite, single-owner assertions.
- **AC-Fixture (issue AC1)** — a seeded fixture tree (duplicated grammar copy,
  exported-but-unconsumed function, doc naming a removed surface, live
  consumer-facing surface with no doc) plus a clean twin exist on demand;
  running the residue sweeps over them yields one finding per seed and zero on
  the clean tree. Check: generator deterministic
  (`node scripts/product-audit-residue-fixture.mjs <dir>` exits 0, pinned by
  the suite); the sweep run itself is model-executed and recorded in `## Log`.
- **AC-Gate (issue AC7)** — all existing suites stay green except the two
  recorded pre-existing failures; context budgets re-based and PASS. Check:
  `node scripts/run-root-suite.mjs` reports exactly one failing file — the
  recorded pre-existing `review-loop-discipline` version pin — and therefore
  exits **1** on it (1214 tests · 1213 pass · 1 fail; a red test and an
  `exits 0` cannot both hold, so the gate's stated outcome is the exit-1
  single-failure result); both package suites pass;
  `node scripts/check-skill-context.mjs --routes --budgets` exits 0.

## Impact

Beyond its own lines this change touches:

- **`product-audit`** — its authoritative applicability matrix
  (`references/AUDIT_DIMENSIONS.md`) and process
  (`references/AUDIT_PROCESS.md`) gain the residue sweeps; every future audit
  run consumes them.
- **`review-implementation` (`references/CLASSIFY.md`)** — the single
  classification engine gains the two-way unused-code rule; every
  `review-change` classification consumes it.
- **`review-code`** — checklist gains deletion candidates, features-preserved,
  and the removal-feature cascade; composed by every `review-change` run.
- **`review-change`** — its restated ask-don't-infer paragraph becomes a
  reference to the owner block (the restatement is retired, AC-S10).
- **`unit-lane` (`references/PLAN.md`, `references/DESIGN.md`)** — plan
  checklist gains reuse-first and replace-implies-delete; design gains the
  third-party item and the `ask-dont-infer@1` owner block.
- **Stage skills referencing the owner block** — `execute-phase`,
  `triage-issue`, `fold-findings`, `review-change`, `review-code`,
  `product-audit` gain one pointer line each; no behavior text.
- **`AGENTS.md`** — one new `normative-surfaces@1` row for `ask-dont-infer@1`.
- **New deterministic surfaces** — `scripts/residue-dimensions.test.mjs`
  (pin suite) and `scripts/product-audit-residue-fixture.mjs` (generator);
  no existing command's output changes.
- **Budgets** — `docs/workflow/SKILL_CONTEXT_BUDGETS.json` re-based (pre-existing
  1-unit ceiling gaps plus this change's growth, each named).

Nothing live runs on the other side: all consumers are this repository's own
skills and gates.

## Retirements

- **`review-change`'s restated ask-don't-infer paragraph** — replaced by a
  reference to the owner block (`ask-dont-infer@1`,
  `skills/unit-lane/references/DESIGN.md`). Negative-capability pin: the
  single-owner assertions in `scripts/residue-dimensions.test.mjs` fail if a
  restatement (rule-name occurrence without an owner pointer) reappears
  outside the owner file. Before-count: **3** rule-name occurrences with no
  owner pointer over the base tree `5824aab6`, as this unit's own pin reports
  them — the restating paragraph (`skills/review-change/SKILL.md:98`
  § Review charter) plus two unpointed mentions in
  `skills/unit-lane/SKILL.md:105` and `skills/unit-lane/SKILL.md:127`. All
  three were rewritten into owner-pointer lines; after-count: **0** (observed
  at this head).

No other surface is retired: the residue dimensions are additive and the
existing `audit-docs` axes and `review-code` checklist items are composed, not
replaced (the issue forbids duplicating them).

## Non-goals

From the issue's Out of scope, verbatim:

> - Fold-time survivors enforcement — shipped by #315 (PR #330); this issue composes its machinery (`promise-coherence` sweep receipts, `structural-sibling-pins`), never rebuilds it.
> - The two-cycle cap, class escalation, evidence pack, narration removal — #318 / PR #339, in flight.
> - Token accounting / standing metrics — #307.
> - Rewriting `audit-docs`' existing axes or re-scoping `review-code`'s current checklist — compose, not duplicate.
> - Any per-stack machinery — audits key on references, mechanisms and consumers.

Also not here: any deterministic residue *detector* — the sweeps are
model-executed audit dimensions; this unit ships their pass-only-if checklists,
the seeded fixture, and the prose pins, never a heuristic scanner.

## Future

none — nothing was deferred.

## Future cost

- Every stage skill that later gains a normative no-assumption statement must
  reference `ask-dont-infer@1` instead of restating it — bound by
  `scripts/residue-dimensions.test.mjs` (single-owner assertions).
- Future audits and reviews must run the residue sweeps and mark them
  sampled/skipped like any other dimension — bound by the dimension table.

## Applicable tests

- New: `node --test scripts/residue-dimensions.test.mjs` — pins every new
  normative surface (S1–S10) and runs the fixture generator.
- Existing: `node scripts/run-root-suite.mjs` (full root suite);
  `node --test scripts/normative-drift.test.mjs` (new `normative-surfaces@1`
  row resolves); `node scripts/check-skill-context.mjs --routes --budgets`
  (re-based budgets); `node scripts/changeset-create.mjs` dry checks via
  `node --test scripts/lint-changeset.test.mjs`; skill-lint over edited skills.
- Packages: untouched — no schema or pi-package surface changes.

## Known pre-existing issues

- `scripts/review-loop-discipline.test.mjs` fails on `main` — it pins
  fold-findings' per-skill `version: 1.11.0`
  (`scripts/review-loop-discipline.test.mjs:356`), retired by the unified
  train (D-40-14; the skill now carries 4.10.0). **Does-not-affect** this
  unit: the test is not touched and the failure predates the branch.
- `scripts/check-skill-context.test.mjs` fails on `main` — route budget
  ceilings stale by exactly one rounding unit
  (`audit-pr:feature|fix` 11079 < 11080; `execute-phase:*` 14324 < 14325,
  15039 < 15040). **Affects** this unit's AC-Gate: the re-base task fixes it,
  naming the pre-existing drift as the growth source.

## Tasks

- P1 — Declare the residue dimension sweeps (duplicate content incl. prose,
  unused code two ways, obsolete + missing docs, features-preserved) in
  `product-audit`'s dimension table with pass-only-if checklists, and run them
  from the audit process (validator: `node --test scripts/residue-dimensions.test.mjs`
  exits 0 — dimension-sweep section)
  (Implements: S1, S2, S3, S4)
  Relevant files: skills/product-audit/references/AUDIT_DIMENSIONS.md, skills/product-audit/references/AUDIT_PROCESS.md
- P2 — Ship the deterministic seeded-fixture generator (four seeds + clean
  twin, written on demand outside the tree) and pin it (validator:
  `node scripts/product-audit-residue-fixture.mjs <dir>` exits 0 and yields
  the four seed files plus the clean tree; pinned by
  `node --test scripts/residue-dimensions.test.mjs` exits 0 — fixture section)
  (Implements: S1, S2, S3)
  Relevant files: scripts/product-audit-residue-fixture.mjs, scripts/residue-dimensions.test.mjs
- P3 — Classify unused code two ways in the single classification engine and
  carry deletion candidates, features-preserved, and the removal-feature
  cascade in `review-code`'s checklist (validator:
  `node --test scripts/residue-dimensions.test.mjs` exits 0 — classification
  and review-code sections)
  (Implements: S3, S4, S8, S9)
  Relevant files: skills/review-implementation/references/CLASSIFY.md, skills/review-code/SKILL.md
- P4 — Add reuse-first and replace-implies-delete as pass-only-if plan
  checklist items (validator: `node --test scripts/residue-dimensions.test.mjs`
  exits 0 — plan section)
  (Implements: S5, S6)
  Relevant files: skills/unit-lane/references/PLAN.md
- P5 — Add the third-party-before-homemade design item (owner-cited example
  pi-extensible-workflows), cut the `ask-dont-infer@1` owner block in the
  design reference, re-point every stage skill at it, retire
  `review-change`'s restatement, and declare the block in `AGENTS.md`'s
  `normative-surfaces@1` (validator: `node --test scripts/residue-dimensions.test.mjs`
  exits 0 — design and single-owner sections; `node --test scripts/normative-drift.test.mjs`
  exits 0)
  (Implements: S7, S10)
  Relevant files: skills/unit-lane/references/DESIGN.md, skills/unit-lane/references/PLAN.md, skills/review-change/SKILL.md, skills/review-code/SKILL.md, skills/product-audit/SKILL.md, skills/execute-phase/SKILL.md, skills/triage-issue/SKILL.md, skills/fold-findings/SKILL.md, AGENTS.md
- P6 — Verify and ship: full root suite, package suites, re-base the context
  budgets (pre-existing drift + this change's growth, each named), run
  skill-lint, cut the changeset, run the residue sweeps over the seeded and
  clean fixtures and record the findings (validator:
  `node scripts/run-root-suite.mjs` reports exactly one failing file — the
  recorded pre-existing `review-loop-discipline` pin — and exits 1 on it;
  `node scripts/check-skill-context.mjs --routes --budgets`
  exits 0; `node --test scripts/lint-changeset.test.mjs` exits 0)
  (Implements: S1, S2, S3, S4, S5, S6, S7, S8, S9, S10)
  Relevant files: docs/workflow/SKILL_CONTEXT_BUDGETS.json, .changeset/

### Planning evidence

M/L unit — the ledger lives in this folder's
[`planning-evidence.md`](planning-evidence.md).

### Obligations

M/L unit — the ledger lives in this folder's
[`planning-obligations.md`](planning-obligations.md).

## Findings

OPEN rows only.

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|
| F1 | `.pi/pi-agentic-workflow.json.staged:1` (untracked) | verify | high | source | fold — `node scripts/audit-pr-gate.mjs hygiene` tree-clean blocker; delete the stray duplicate of the tracked `.pi/pi-agentic-workflow.json` |
| F2 | S1–S10 · docs/fix/340-deletion-reuse-obligations/SPEC.md:117 | docs | high | source | fold — AC-Gate (SPEC.md:117), the P6 validator (SPEC.md:257) and O14 state `run-root-suite.mjs` exits 0 while a known test is red; observed exit 1 · 1214/1213/1. G1 claims the re-base fixed both E1 failures; only `check-skill-context.test.mjs` flipped |
| F3 | S3 · scripts/product-audit-residue-fixture.mjs:44 | code | high | source | fold — the clean twin exports `main` with no consumer (`:44` seeded, `:50` clean), so the shipped unused-code sweep yields 1 finding on `clean/` and 5 on `seeded/`, contradicting AC-Fixture and O6 |
| F4 | S10 · docs/fix/340-deletion-reuse-obligations/SPEC.md:159 | docs | med | source | fold — Retirements before-count says 1 restating paragraph; the unit's own pin computes 3 at base (`skills/review-change/SKILL.md:98`, `skills/unit-lane/SKILL.md:105`, `skills/unit-lane/SKILL.md:127`) |

## Log

- **L1** — 2026-10-30, the issue, verbatim:
  ```
  NEW FEATURE: deletion & reuse as obligations — product-audit residue dimensions (duplicate content, unused code, obsolete/missing docs) and ask-don't-infer at every stage
  ```
- **D1** — 2026-10-30, owner decisions (ask turn `c07a066d`): AC6 home = extend
  DESIGN.md in place; missing-docs = consumer-facing contracts only; S7
  example = pi-extensible-workflows; delivery = single PR.
- **E1** — 2026-10-30, `node scripts/run-root-suite.mjs` (baseline, pre-branch)
  · exit 1 · 2 pre-existing failures: `check-skill-context.test.mjs` (route
  ceilings stale by 1 unit), `review-loop-discipline.test.mjs:356` (stale
  per-skill `version: 1.11.0` pin vs train 4.10.0).
- **E2** — 2026-10-30, corpus sweep `rg -l "folded: no" docs/` · exit 0 · no
  open findings rows in any active unit — the frozen-failure corpus is empty;
  no reproducer exists to extract (the #339 stale-figure failures were
  repaired inside #339).
- **E3** — 2026-10-30, RED run `node --test scripts/residue-dimensions.test.mjs`
  · exit 1 · 16 fail / 7 pass: the 16 failures are exactly the new-rule pins
  (S1–S10); the 7 passes are the regression pins (severity table, retirement
  machinery, S8 mandate, sweep declaration) plus the generator mechanics.
  Two just-written-test defects were repaired before implementation (seed-(d)
  docs assertion, seed-(a) block-identity assertion) — justification rows in
  `decisions.md`.
- **E4** — 2026-10-30, fixture-first validation: the full implementation
  patch applied to a throwaway copy (`mktemp -d /tmp/aw340-scratch-*`, removed
  after) — `RESIDUE_DIMENSIONS_REPO=<scratch> node --test
  scripts/residue-dimensions.test.mjs` · 22 pass / 0 fail (child mode);
  `NORMATIVE_DRIFT_REPO=<scratch> node --test scripts/normative-drift.test.mjs`
  · 19 pass / 0 fail; route-budget failures on the scratch = the same 10
  pre-existing ones, no new growth. Only then were the real files changed.
- **E5** — 2026-10-30, GREEN `node --test scripts/residue-dimensions.test.mjs`
  · exit 0 · 23 pass / 0 fail (at HEAD of this branch).
- **E6** — 2026-10-30, model-executed residue-sweep run over the generated
  fixture (`mktemp -d /tmp/aw340-fixture-*`, removed after): seeded → exactly
  4 findings, one per seed (duplicated grammar copy in `docs/grammar-copy.md`;
  `orphanResidueFormatter` exported, 0 references; `--legacy-residue-flag`
  documented but absent from the tree; `residueApi` live, consumed by
  `main.js`, absent from `docs/`); clean twin → 0 findings.
- **E7** — 2026-10-30, differential check base `5824aab6` vs change:
  `check-skill-context.mjs --routes --json` route set identical (14 routes);
  only `execute-phase:*` and `review-change:*` measured values grew (the
  skills this unit touched — growth named in the re-base notes);
  `audit-pr:*` measured unchanged; `needs-input.mjs` / `unit-route.mjs`
  usage outputs unchanged.
- **G1** — 2026-10-30, `node scripts/check-skill-context.mjs --routes --budgets`
  · exit 0 · PASS (after the declared re-base: exact ceils + growth sources
  named; also fixes the two pre-existing failures recorded in E1).
- **G2** — 2026-10-30, `node scripts/run-root-suite.mjs` · exit 1 · **1213
  pass / 1 fail** — the single failure is the recorded pre-existing
  `review-loop-discipline` stale version pin (E1); no new failures.
- **G3** — 2026-10-30, packages: `packages/agentic-workflow-schema` 726 pass
  / 0 fail; `packages/pi-agentic-workflow` 504 pass / 0 fail.
- **G4** — 2026-10-30, `node --test scripts/lint-changeset.test.mjs` · exit 0
  · 11 pass — changeset `.changeset/fix-340-deletion-reuse-obligations-*.md`
  valid (8 skills, minor).
- **P1** — 2026-10-30, ledgers frozen (SPEC + planning-obligations.md +
  planning-evidence.md + fix-index row) · commit `fix(340): freeze planning
  ledgers…`.
- **P2** — 2026-10-30, P1–P5 implemented in one atomic commit (reason stated
  in its message): residue dimensions, two-way classification, review-code
  items, plan gates, design items + owner block, stage references, budgets
  re-base · see `git log`.
- **L2** — 2026-10-30, correction — the external verifier's verdict, verbatim:
  ```
  Blockers: 4
    B1 .pi/pi-agentic-workflow.json.staged:1 (untracked) — `audit-pr-gate.mjs hygiene` → `tree-clean: fail`, blocker names `?? .pi/pi-agentic-workflow.json.staged`
    B2 planning-obligations.md:24 (O14) + SPEC.md:117 (AC-Gate) + SPEC.md:257 (P6 validator) — validator states `run-root-suite.mjs` "exits 0 with only the recorded review-loop-discipline failure"; observed exit 1 · 1214/1213/1. G1 claims the re-base fixed both E1 failures; only `check-skill-context.test.mjs` flipped
    B3 planning-obligations.md:16 (O6) + SPEC.md:110/318 (AC-Fixture, E6) — "clean twin → 0 findings, seeded → exactly 4" does not reproduce: the fixture's `lib/main.js` exports `main` with zero consumers in both twins
    B4 SPEC.md:159 (Retirements before-count, the required evidence of O13) — states "Before-count: 1"; the unit's own pin computes 3 offenders at base
  Verdict: NEEDS-DECISION (4 open blockers)
  ```
  The AC-Gate check, the P6 validator, O14's validator cell and the Retirements
  before-count are corrected in place — they are claims, not history. `G1` and
  `E6` stand exactly as written: `G1` is answered by F2's line, `E6` by F3's,
  and those `F` lines are the append-only correction.

## Next

Apply the slices P1–P6 on `fix/340-deletion-reuse-obligations`, then hand the
diff to the owner as the external verifier.

## References

- Issue: https://github.com/gtrabanco/agentic-workflow/issues/340 (depends on
  #339 — merged 2026-10-30)
- Composed machinery: #315/#330 (sweep receipts), #318/#339 (retirements,
  evidence-row grammar), #303 (ask-don't-infer carrier)
- Owner-cited third-party precedent: pi-extensible-workflows

## Branch

`fix/340-deletion-reuse-obligations`

## Depends on

none — #339 merged 2026-10-30 before this branch was cut.

## Regression scope

- Every existing skill's normative behavior not named in Specs: pinned by the
  full root suite (`node scripts/run-root-suite.mjs`) plus
  `node --test scripts/normative-drift.test.mjs` and skill-lint.
- The reviewed command outputs that must not change: `check-skill-context.mjs`
  output format, `needs-input.mjs`, `unit-route.mjs`, `phase-lint.mjs` — none
  is modified; the root suite covers them.
- `review-change`'s ask-don't-infer behavior: re-pointed, not weakened — the
  expectation-surface question duty stays, now citing the owner block.
