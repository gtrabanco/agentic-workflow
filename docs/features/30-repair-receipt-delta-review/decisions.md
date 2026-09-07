# Decisions — 30-repair-receipt-delta-review

Product-half decisions recorded by `design-feature` (append-only; newest last).

## 2026-09-07 — Roadmap numbering collision fixed (pre-design correction)

- **What**: the roadmap carried two rows numbered `30` (`repair-receipt-delta-review`
  and `bilingual-sibling-drift-check`). The second row was renumbered to `34` (the
  next free slot after 33). No dependency column referenced the second row's old
  number, so no other text needed to change.
- **Why**: feature numbers are unique ids; two rows sharing `30` made
  `design-feature 30` ambiguous and every other NN reference unreliable.
- **Authority**: user instruction (2026-09-07, this session). Roadmap row edits are
  in `design-feature`'s writer scope (`design-feature:idea-or-defined-row`).

## 2026-09-07 — D30-1: batch classification uses the impact rule, not the artifact type

- **What**: each folded finding is classified by "does the fix require new
  planning decisions, or invalidate an assumption of the plan?" — **repair-in-place**
  (locally decidable; scope, design, acceptance criteria stay valid) versus
  **replan** (invalidates a plan assumption; needs decisions the plan never made).
  Not "docs vs code": a docs fix that completes ill-defined scope is replan-class.
- **Rationale**: grounded in external evidence (rows E-11…E-14 in the SPEC's
  evidence rows): ISO/IEC 14764 classifies changes by intent relative to
  requirements (a scope-completing "doc fix" is perfective — definition, not
  repair); Reason's latent-vs-active failures — a finding born of a plan gap is a
  latent condition a code patch does not remove; Boehm & Basili — 40–50% of effort
  is avoidable rework and late discovery costs ~100×, so the review→fold loop must
  converge on locally decidable findings and hand non-decidable ones back to
  planning. Vocabulary stays single-owner: `review-implementation`'s closed class
  set (`fix-now` / `replan-in-unit` / `decision-required` / `proposal` / `ignore`).
- **Authority**: user accepted the rule (2026-09-07, this session) after two
  research rounds; the first "docs-only vs behavioral" framing was rejected
  because a docs fix can be replan-class (scope gap) and a code fix can be
  repair-in-place (missing insert function).

## 2026-09-07 — D30-2: freeze-batch on any replan-class finding

- **What**: when the repair batch contains at least one replan-class finding,
  `fold-findings` folds **nothing** from that batch: no `folded: yes` flips, no
  commits. The REPAIR-RECEIPT records the replan route plus every retained
  (unfolded) row id; the loop stops and routes to planning. After replanning,
  triage re-evaluates the retained rows.
- **Rationale**: avoid folding work a replan may discard; keep traceability (the
  receipt names what was held and why). User selected "freeze the batch" over
  "fold what is foldable, then stop" (2026-09-07).

## 2026-09-07 — D30-3: the REPAIR-RECEIPT is a printed fixed output block, not a new ledger

- **What**: the receipt is a fixed, greppable block in `fold-findings`' closing
  output (same contract style as the existing per-finding table + tally). No new
  ledger row type, no schema-package change, no `LEDGERS.md` ownership row.
- **Rationale**: durable state already lives where it belongs — `folded: yes` flags
  and `REOPENED` annotations in `review-findings.md` (ownership map:
  `fold-findings:folded-flag`), per-finding verifications in `finding-mark@1` rows,
  per-state review runs in `review-mark@1` rows. A second persisted copy of the
  same facts would fork the truth class map that `scripts/ledger-ownership.test.mjs`
  enforces. Feature 32 (review-consistency-pack) owns the ledger-prose
  reconciliations that remain.

## 2026-09-07 — D30-4: delta mode is the default re-review; skipping requires an all-repair-in-place batch

- **What**: post-fold re-review defaults to delta mode. The receipt branches:
  `RE-REVIEW-REQUIRED (delta)` for behavioral/high-severity batches;
  `RE-REVIEW-OPTIONAL`/`RE-REVIEW-SKIPPED` only when **every** row in the batch is
  repair-in-place and report-note materiality (docs-only, no behavioral surface).
  The consumer (orchestrator or human) decides on OPTIONAL/SKIPPED; with no
  decision the default is to re-review.
- **Rationale**: IEEE 1028's review economics (fix-in-review costs 1–2 orders of
  magnitude less than in test) argues for cheap, frequent re-verification —
  delta mode makes re-review cheap so it is never skipped to save tokens. The
  conservatively-skewed default protects unattended runs: skipping review is a
  deliberate act, never a silent one.

## 2026-09-07 — D30-5: escalation triggers to a full pass are concrete and checkable

- **What**: delta mode escalates to a full re-review when either trigger holds:
  1. **Width**: any changed file lies outside the union of the `file:line`
     locations cited by the folded findings of the batch (root-cause widening).
  2. **Size**: the fold diff exceeds **200 changed lines** in total or touches
     **more than 15 files** (fold-diff shortstat is already a receipt field).
  The escalation must state which trigger fired and the observed numbers.
- **Rationale**: "large diff / shared surfaces" existed only as roadmap prose with
  no definition (verified: no match for "shared surface" anywhere in `skills/` or
  `docs/workflow/`). Numbers are set so a weak executor can check them without
  judgement; width is the senior-dev signal that the repair changed more than the
  findings justified, so the delta scope is no longer trustworthy.
- **Authority**: user accepted the impact-rule framing with the escalation
  triggers left to concrete definition (2026-09-07); numbers chosen by the
  product author as a first calibration — a review may revise them with evidence.

## 2026-09-07 — D30-6: the two-cycle cap counts delta cycles; the third cycle stays user-only

- **What**: delta re-reviews are review→fold cycles; the cap keeps its existing
  counting source (`review-mark@1` marks + forge receipts), unit-level and
  family-agnostic. `LOOP CAP REACHED` and the user-only third cycle are unchanged
  (AD-008 semantics preserved: convergence is evidence-bound, never
  cycle-count-bound; a unit that needs a third cycle has a planning defect).
- **Rationale**: cheap cycles that stayed free would reintroduce
  cycle-count-bound approval through the back door. Feature 31 owns the
  planning-side mirror of this cap.

## 2026-09-07 — D30-7: reproducer handoff — the reviewer's reproducer is materialized, never re-derived

- **What**: `finding-mark@1`'s `recheck` cell (method + reproducer, written by
  `review-change` at verification time) is what `FOLD_POLICY` consumes: the fold
  adds/updates the check that reproduces the finding and runs it as the regression
  evidence. The fold runner never invents or re-derives the reproducer; if the
  recheck cell cannot be materialized as a runnable check, the finding is `BLOCKED`
  with the missing input named.
- **Rationale**: the verification the reviewer already performed is the cheapest
  correct regression test; re-deriving it invites a weaker test that passes
  without the fix.

## 2026-09-07 — Normalized Repository State contradiction recorded (not resolved here)

- **What**: the frozen NRS (`docs/workflow/REPOSITORY_STATE.md`, snapshot
  `2026-08-30-first-pass-convergence`) states F006 ("the only open implementation
  issues are #146 and #149") and F007 ("Roadmap rows 01-27 are done; feature 28
  planned from #146; feature 29 planned from #149"). Current evidence contradicts
  this: #146 closed through merged PR #155, #149 closed through merged PR #175
  (merged 2026-09-06, verified on the forge), roadmap rows 28–29 are `done` and
  rows 30–34 exist as `idea`.
- **Resolution path**: only `resolve-repository-state` may replace frozen facts;
  this design does not consume the stale lifecycle facts (it uses the roadmap and
  direct forge evidence instead) and records the contradiction for the resolver.
- **Owner**: `resolve-repository-state` (next session touching repository
  normalization).

## 2026-09-07 — Traceability

- Closes issue #170 (verified open on the forge, 2026-09-07: "Review-loop
  efficiency: repair receipt, conditional re-review with delta mode, reproducer
  handoff"). The eventual PR will carry `Closes #170`.
- Depends on feature 29 (`bounded-implementation-discovery`), merged through
  PR #175 on 2026-09-06 — hard dependency satisfied at design time.
- Features 32 and 33 declare dependencies on this feature; this design must not
  pre-empt their scope (severity conversion table, LEDGERS prose fixes,
  turn-contract single-owner migration).

---

# Engineering-half decisions (2026-09-07)

Recorded by `plan-feature` / `plan-feature-scaffold` when cutting the
Engineering half (owner: `plan-feature:engineering-decisions`); append-only,
newest last. Product decisions above are untouched.

## E-D1: empty-batch and failed-gate receipt states

- **What**: an empty batch (zero findings taken) prints the receipt with batch
  class `none` (`Repaired: none`, `Gate: n/a`, `Fold diff: none`) and branch
  `RE-REVIEW-OPTIONAL`; the safe default (no decision) routes to re-review,
  which is harmless on an unchanged head. A turn whose gate is red prints the
  receipt with the observed nonzero exit codes and nothing folded; the fold
  keeps repairing that group per `FOLD_PROCESS` step 4 and only reports the
  receipt at the turn's end.
- **Why**: IS-1 requires the receipt "including an empty or frozen one" and
  expectation 11 requires it on a failed gate, but the SPEC's two class states
  (`all-repair-in-place`, `frozen (replan present)`) leave the empty case
  without a value. `none` is the minimal third value; no new branch is added.
- **Authority**: engineering interpretation of IS-1 + expectation 1/11; frozen
  for `review-plan` to confirm.

## E-D2: SKIPPED records a prior consumer decision; the fold emits OPTIONAL

- **What**: `fold-findings` emits `RE-REVIEW-OPTIONAL` on every
  all-repair-in-place docs-only batch; `RE-REVIEW-SKIPPED` is printed only by a
  turn that carries an explicit prior consumer decision (user or orchestrator
  instruction recorded in the turn) to skip the re-review. With no decision the
  closing block always recommends `/review-change` (delta mode).
- **Why**: the receipt is printed at emission, before any consumer reads it, so
  a value that records a decision must reflect a decision that already exists;
  otherwise SKIPPED would silently do what D30-4 forbids (skip without a
  decision).
- **Authority**: engineering interpretation of IS-3 + D30-4.

## E-D3: docs-only vs behavioral is judged on the fold diff's file set

- **What**: a batch is **docs-only** when every file changed by the fold diff
  is a Markdown/documentation file (`*.md`, `docs/**`, skill reference `.md`);
  otherwise it is behavioral. Any folded row with frozen severity `high`
  forces `RE-REVIEW-REQUIRED (delta)` even when the diff is docs-only. The
  frozen fields (severity, class, axis) are never edited to reach a branch.
- **Why**: IS-3 branches on "behavioral or high-severity" vs "report-note
  materiality (docs-only)", and the fold queue only persists `med`/`high` rows
  (low rows are report-only and never reach the ledger), so the decidable,
  frozen-field-faithful test is the diff's file set plus the severity check.
- **Authority**: engineering interpretation of IS-3 + the persisted-row
  materiality rule (`review-change` PERSIST_AND_DECIDE); frozen for
  `review-plan` to confirm.

## E-D4: fold-diff definition and escalation computation

- **What**: the receipt's `Fold diff` shortstat and the escalation inputs come
  from a real `git diff <pre-batch HEAD>..<batch HEAD>` over the commits this
  turn's batch produced (per `FOLD_PROCESS` step 5; an empty batch diffs
  nothing). Width trigger: any changed file outside the union of the batch's
  cited files, or any changed line in a cited file more than 50 lines from
  every cited line in that file (changed-line starts read from
  `git diff --unified=0` hunk headers). Size trigger: added+deleted > 200
  lines or changed files > 15 (`git diff --numstat`).
- **Why**: the receipt must be evidence, not estimates (expectation 8); a
  single deterministic diff range makes the ±50 window and the 200/15 numbers
  mechanically checkable by a weak executor.
- **Authority**: engineering concretization of IS-6/D30-5.

## E-D5: AC-10's `packages/` clause guards audit-pr + the schema package

- **What**: AC-10's validator is written as "no file under
  `packages/agentic-workflow-schema/` or `skills/audit-pr/` changed" plus the
  two untouched-surface suites. The Pi mirror's bundled copies
  (`packages/pi-agentic-workflow`) ARE re-bundled this feature through
  `bundle:skills`, per the SPEC's integration-closure row.
- **Why**: AC-10's literal "no file under `packages/`" contradicts the
  integration row ("bundled copies of the three skills re-synced"); the intent
  (audit-pr + schema untouched) is preserved and the mirror re-bundle follows
  feature 29's established practice.
- **Authority**: engineering interpretation; **flagged in known-issues.md #1
  for `review-plan` to confirm or amend.**

## E-D6: freeze-batch trigger set

- **What**: freeze-batch triggers when the taken batch contains at least one
  frozen row with class `replan-in-unit` or `decision-required` (the SPEC's
  replan-class definition). `fix-now` rows never freeze; `ignore`/`proposal`
  rows are never in the fold queue. An explicit-ID scope that includes a
  replan-class row freezes that batch the same way.
- **Why**: IS-2/D30-1 name `replan-in-unit` / `decision-required` as
  replan-class; mapping them to the freeze trigger keeps the classification
  single-owner (`CLASSIFY.md`'s closed set) and the receipt never invents a
  parallel vocabulary (AC-02).
- **Authority**: engineering concretization of IS-2 + IS-4.
