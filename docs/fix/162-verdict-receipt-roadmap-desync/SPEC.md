# fix/162-verdict-receipt-roadmap-desync

> Fix specification. Lighter than a feature spec — no separate planning
> artifacts: the SPEC and sibling `ACCEPTANCE.md` are the source of truth, and
> its `## Phases` section is the execution ledger.

## Goal

Make the persisted state machine the **only arbiter** of workflow truth, closing
the desync field-reported in #162: (a) a review verdict whose receipt was never
persisted is invisible to every consumer — so the reviewer must now mechanically
prove, in the same turn, that the receipt landed where the sensor reads it;
(b) a roadmap `done` row (built + PR open, merge pending) never satisfies or
suppresses a pre-execution/verification gate — gates read receipts, roadmap rows
are labels; (c) `NEEDS-DESIGN` is emitted only by `review-spec`, and the
convergence/loop guards gate blind re-reviews of unchanged state, never a repair
made in response to a verdict. Added scope absorbed per owner instruction: a
receipt whose **own recorded timeline** is physically impossible
(finish predating its recorded source revision's commit date beyond a published
skew) is mechanically refused under its own freshness code `impossible-timeline`,
never read charitably.

## Issue

[#162](https://github.com/gtrabanco/agentic-workflow/issues/162) — tracked issue
in the project's forge. The PR must close it via `Closes #162` in the body.

## Branch

`fix/162-verdict-receipt-roadmap-desync`

## Depends on

None open. #159 (review-fold-loop-bounds, merged PR #160) is a textual
prerequisite — this fix amends the scope of the cap/convergence texts it landed;
#161 (merged PR #163) contributed `finding-mark@1`, the pattern the receipt
self-check extends to verdicts.

## Root cause

One root cause, three symptoms plus one added scope: **the state of truth is
scattered across prose, receipts, marks, and the roadmap, and every skill does
its own ad-hoc read of it.**

1. **Write-then-report is prose.** `skills/pre-execution-review/references/POLICY.md`
   §8 states "the verdict and its mark are one act", and both reviewers'
   turn-contract boxes say "receipt appended before the report was printed" —
   but nothing makes the reviewer *mechanically incapable* of ending its turn
   without writing the receipt. Every consumer (`execute-phase`'s pre-execution
   gate, `audit-pr`'s lineage gate, `workflow-status` 6a) reads receipts via the
   sensor, so a chat-only PASS **does not exist**: the sensor answers
   `missing-receipt-snapshot`, `review-change`/`audit-pr` route back to replanning,
   and the field cycle begins.
2. **Roadmap labels are read as gate answers.** The status legend
   (`docs/features/ROADMAP.md` § Status legend) defines `done` correctly
   ("built and its PR open; merge state lives in the forge"), but consumers read
   it as "nothing pending": `skills/plan-feature/references/ROUTING.md` step 4
   prints `→ Next: nothing — <NN>-<slug> already shipped (roadmap status done)`;
   `skills/workflow-status/references/SENSOR_CORE.md` step 6a senses
   pre-execution receipts only for `defined`/`planned`/`in-progress` units — a
   `done`-but-unmerged unit's stale/missing plan receipt is never sensed.
   `POLICY.md` §5 forbids a verdict *from* a roadmap status but never states the
   complement: a roadmap status never **suppresses** a gate. The dead end: the
   user who responds to a blocker is told "already shipped".
3. **Verdict vocabulary is emitted loosely and the guards fire at the author.**
   `skills/review-plan/references/OUTPUT.md` carries a second `NEEDS-DESIGN`
   verdict block (review-spec is the product-authority arbiter), so two stages
   can emit it; meanwhile the #159 cap/convergence texts (`review-change`'s
   "bounded at two cycles", POLICY §4's anomaly, `design-feature`'s REPAIR.md §4)
   were read at the *author* responding to a verdict — the skill answers "loop
   defect" and "already complete" on a unit whose `progress.md` carries an open
   FAIL/NEEDS-DESIGN receipt: a dead end with no exit.
4. **Added scope — the receipt's own timeline is never checked.**
   `scripts/pre-execution-snapshot.mjs` `receipts()` parses `Source revision`
   but no `Started/finished:` line, and `attributeFreshness` has no timeline
   dimension, so a back-dated receipt (field case: finish `2026-09-04T13:02Z`
   claimed against a source revision committed ~20 h later, unit 31
   `agentic-workflow-loop`) whose snapshot digest was computed with the canonical
   builder verifies honestly — the forgery is exposed only by its own timeline.

## Detected in

Field report 2026-09-03 (live session, issue #162 body): `/review-change`
routed to replanning ("plan not reviewed"); `/review-plan` on a different model
agreed the plan was fine but wrote no receipt and reported the unit "done" while
unmerged; `/audit-pr` blocked reading a stale parent as "needs redesign";
`/design-feature` answered "loop defect" and "already complete". The timeline
case was found 2026-09-05 in the same state family (back-dated unit-31 receipt)
and absorbed here by owner instruction (#162 comment 2026-09-05).

## Scope

### In scope

The exact change set, file by file:

- **(a) Receipt self-check — write-then-report becomes mechanical** (P3):
  - `skills/pre-execution-review/references/POLICY.md` §8 — the receipt
    self-check rule: the reviewer runs the sensor's `verify` for its own stage
    in the same act as persisting the receipt, before the verdict block is
    printed, and pastes the sensor's answer beside it; emit conditions per
    receipt form (below); a chat-only verdict is `missing-receipt-snapshot`
    for every consumer.
  - `skills/pre-execution-review/references/SNAPSHOT.md` — "the reviewer is
    consumer zero" note in the re-verify section.
  - `skills/review-spec/references/OUTPUT.md` + `skills/review-plan/references/OUTPUT.md`
    — persist-first paragraph + turn-contract box upgraded to a RUN box.
- **(b) `done` never suppresses a gate** (P4): POLICY §5 bullet;
  `skills/plan-feature/references/ROUTING.md` step-4 block reroute;
  `skills/workflow-status/references/SENSOR_CORE.md` step 6a senses
  `done`-with-open-PR (unmerged) units.
- **(c) Verdict ownership + guard scope** (P5): `skills/review-plan/`
  (OUTPUT.md + SKILL.md) loses `NEEDS-DESIGN` entirely — product-intent gaps
  become `PLAN-REVIEW-FAIL` with `class: product`; POLICY §4 sentence;
  `skills/design-feature/references/REPAIR.md` §4 clause;
  `skills/review-change/references/PERSIST_AND_DECIDE.md` cap-scope clause;
  `skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md` lineage gate names
  `impossible-timeline`. The machine grammar follows the prose:
  `packages/agentic-workflow-schema/src/pre-execution-contract.ts` —
  `VERDICTS_BY_STAGE.plan` drops `needs-design` (its `pre-execution-receipt.test.mjs`
  pins flip red-first; P1 task, O11/AC11 — Decision 11), so the persisted state
  machine stops validating as well-formed exactly the emission (c) forbids.
- **(d) Added scope — `impossible-timeline` receipt guard** (P1 schema, P2
  sensor): one additive freshness code, comparator-precedence slot, published
  skew constant + pure predicate, `receipts()` timeline parsing,
  `attributeFreshness` dimension + `verify` committer-date fetch, tests-first
  in both suites, SNAPSHOT.md contract note.
- Hygiene (P5/P6): version bumps (schema 4.0.1 → 4.1.0 minor; pi package patch
  after re-bundle; minor bumps on every touched skill), CHANGELOG.md +
  CHANGELOG.es.md rows same-PR, `npm run bundle:skills` Pi-mirror re-bundle
  after the last `skills/**` edit, route-budget trim/declared re-basis for the
  routes this unit grows.

### Out of scope

- #170's REPAIR-RECEIPT, conditional re-review routing, and delta re-review
  mode (code-side loop efficiency — parallel issue, not absorbed).
- #171's planning-side materiality floor (`low` → report-note), hard two-cycle
  cap behavior, and wording-only re-review route — parallel issue with file
  overlap; it rebases on this fix (see Cross-issue notes).
- #172's consistency sweep (one fold-flag owner, severity conversion table,
  blocking gate, gate-run receipt) — parallel issue; this fix's one-clause edits
  to `PERSIST_AND_DECIDE.md` and `audit-pr/02` stay minimal so it rebases cheaply.
- #173's turn-contract single-owner migration — its bespoke-contract list
  excludes `review-spec`/`review-plan` (their boxes are skill-specific
  additions inside references), so no conflict and no absorption.
- The broader SKILL context-route slimming (#176) — this unit restores the
  routes it grows by trim and raises the pre-existing shared-component ceilings
  via the declared re-basis (see Decisions 7 and 12); the slim-vs-raise policy
  question (refactor the skills or raise ceilings) stays #176's.
- Any change to the receipt schema (`PreExecutionReviewReceiptV1`), the flat
  verdict enum (`PRE_EXECUTION_VERDICTS` — `needs-design` stays, emitted by
  `review-spec`), the snapshot contract, or any historical artifact/receipt
  (rewriting one is forgery — POLICY §6). The one deliberate exception is the
  per-stage map: `VERDICTS_BY_STAGE.plan` drops `needs-design` (P1, O11/AC11 —
  Decision 11) so the machine contract stops sanctioning what (c) forbids.

### Planning evidence

The fix's own authority, without a Product half: reproduction, root cause with
code evidence, regression scope, rollback path, and the affected invariant or
use case — one compact row each.

| id | claim-or-obligation | authority-kind | source-and-location | observed-revision | affected-decision-or-obligation | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|---|---|
| PE-001 | Reproduction: the field desync cycle (verdict without receipt invisible to consumers; `done` read as "nothing pending"; NEEDS-DESIGN loop with no exit) | forge | [#162](https://github.com/gtrabanco/agentic-workflow/issues/162) (fetched 2026-09-05) | b18fb612 | O1, O2, O3, O4 | current | proven | — |
| PE-002 | Root cause (a): write-then-report is prose — no mechanical step proves the receipt landed before the verdict is printed; every consumer reads receipts, not chat | repository | `skills/pre-execution-review/references/POLICY.md` §8; `skills/review-spec/references/OUTPUT.md` + `skills/review-plan/references/OUTPUT.md` turn-contract boxes | b18fb612 | O1 | current | proven | — |
| PE-003 | Root cause (b): ROUTING step 4 answers `→ Next: nothing — already shipped`; the sensor senses receipts only at `defined`/`planned`/`in-progress`; POLICY §5 forbids a verdict from a roadmap status but never states "a status never suppresses a gate" | repository | `skills/plan-feature/references/ROUTING.md` (Redirect gate, step 4); `skills/workflow-status/references/SENSOR_CORE.md` step 6a; `skills/pre-execution-review/references/POLICY.md` §5 | b18fb612 | O2 | current | proven | — |
| PE-004 | Root cause (c): review-plan carries a second `NEEDS-DESIGN` verdict block (receipt template, verdict set, routes table, closing blocks, SKILL.md lines 12/84/102/106); the guard texts (POLICY §4, REPAIR §4, review-change cap) lack the verdict-response exception | repository | `skills/review-plan/references/OUTPUT.md`; `skills/review-plan/SKILL.md`; `skills/pre-execution-review/references/POLICY.md` §4; `skills/design-feature/references/REPAIR.md` §4; `skills/review-change/references/PERSIST_AND_DECIDE.md` step 14 | b18fb612 | O3, O4 | current | proven | — |
| PE-005 | Added scope: `receipts()` parses no `Started/finished:` line and `attributeFreshness` has no timeline dimension — a receipt's internal timeline is never checked | repository | `scripts/pre-execution-snapshot.mjs` (`receipts()`, `attributeFreshness`) | b18fb612 | O6 | current | proven | — |
| PE-006 | Field case: a back-dated `PLAN-REVIEW-PASS` receipt (unit 31, `agentic-workflow-loop`) verified honestly against the canonical builder; only its recorded timeline (finish ~20 h before its source revision's commit date) exposed it | forge | [#162](https://github.com/gtrabanco/agentic-workflow/issues/162) "Added scope" section | b18fb612 | O6 | current | proven | — |
| PE-007 | Regression scope: freshness-code consumers (`execute-phase/references/PRE_EXECUTION_GATE.md`, `audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md`, `workflow-status` 6a) route on `current`/`structural.reasonCode` generically, so the additive code needs no consumer change; only `audit-pr`'s lineage text enumerates dimensions ("Stale, missing or wrong-stage") and gains the one word | repository | those three files | b18fb612 | O8 | current | proven | — |
| PE-008 | Baseline at `b18fb612` (clean tree): root suite red on `scripts/check-skill-context.test.mjs`; `node scripts/check-skill-context.mjs --routes` reports **five** exceeded routes — `review-plan:default` and `review-spec:default` (grown by this unit), plus pre-existing red on `design-feature:repair`, `plan-feature:scaffold`, `plan-fix:issue` (the latter two share the `pre-execution-review` reference this unit grows); schema package 679/679; pi package 140/140; skills budgets PASS (39 skills) | repository | re-run at `b18fb612` (git worktree) and at HEAD by review rp-fix162-20260906-001; planner's original run this session at `b18fb612` | b18fb612 | O9 | current | proven | the two grown routes return green by trim; the three pre-existing ceilings rise via the budgets file's declared re-basis naming `fix/162` — the unit grows the shared `pre-execution-review` reference component of those routes (Decision 12); the slim-vs-raise policy question is #176's and does not block this gate |
| PE-009 | Rollback: one PR revert; the schema member is additive; no data cleanup; legacy receipts and consumers are untouched by the revert | derived | rule: revert `fix/162-…` PR; inputs are PE-002–PE-005 | b18fb612 | O10 | current | proven | — |
| PE-010 | Skew constant = 5 minutes (`300_000 ms`), published from the schema package so the sensor cannot drift from the contract | derived | rule: the skew must absorb cross-machine clock drift but stay ≪ the field case's ~20 h contradiction; 5 min satisfies both | b18fb612 | O6 | current | proven | — |
| PE-011 | Removing review-plan's `NEEDS-DESIGN` keeps the `pre-execution-verdict` machine vocabulary covered: `review-spec/references/OUTPUT.md` still declares it (`must-name` surface) | repository | `CLAUDE.md` § Normative surfaces (`review-spec-verdicts`, `review-plan-verdicts` rows) | b18fb612 | O3 | current | proven | — |
| PE-012 | The pure comparator cannot evaluate the timeline (no git access: "Pure, deterministic, and total"); the schema publishes the code, the documented slot, the skew, and the pure predicate; the git-backed sensor evaluates the slot and the parity test documents the composition | repository | `packages/agentic-workflow-schema/src/pre-execution.ts` comparator docstring; `scripts/pre-execution-attribution.test.mjs` | b18fb612 | O5, O7 | current | proven | — |
| PE-013 | The machine verdict-stage map still sanctions plan-stage `needs-design`: `VERDICTS_BY_STAGE.plan` includes it (`packages/agentic-workflow-schema/src/pre-execution-contract.ts:127-131`, `plan:` row `:130`), the `verdict-stage-matrix` projection rule validates such receipts well-formed (`:608-618`), and the schema suite pins it behaviorally only — matrix rows `:88-:97` (`:90` spec-stage keeps its `true`, `:95` plan-stage flips to invalid); no suite asserts `VERDICTS_BY_STAGE` directly (`grep -rn "VERDICTS_BY_STAGE" packages/agentic-workflow-schema/test/ scripts/` → only `scripts/normative-drift.test.mjs`, which parses the map from src — adaptive), so P1 adds the explicit deepEqual pin red-first (the map is not re-exported from `src/index.ts`; the task re-exports it, additive). No historical plan-stage `needs-design` receipt exists in the repository (`grep -rh "Verdict:" docs/fix/*/progress.md docs/features/*/progress.md \| grep -c "needs-design"` → 0 — receipt-discriminating; the plain `grep -rn "Verdict: needs-design" docs/` self-quotes this unit's own artifacts, PF-3) — narrowing the map invalidates no persisted receipt; the flat `PRE_EXECUTION_VERDICTS` and the `spec` stage keep the token | repository | file reads + greps run by review rp-fix162-20260906-001; re-run at HEAD (`bc78bde4`) by repair ar-162-3 — line numbers re-verified against the pre-fix bytes (flat assert `:45-:48`, matrix `:88-:97`, `plan:` row `:130`) | bc78bde4 | O11 | current | proven | — |

### Obligations

| obligation-id | Authority source | Affected use case or invariant | Phase | Task | Implementation owner | Validator | Required evidence | Status |
|---|---|---|---|---|---|---|---|---|
| O1 | AC1 — a verdict is mechanically bound to a persisted receipt | Reviewer turns (both stages); write-then-report invariant | P3 | Reviewer receipt self-check | `execute-phase --fix 162` | `grep -c "verify --stage" <the four files>` → ≥1 each; both OUTPUT.md boxes name the exit-3/fresh emit condition (AC1 command) | grep output pasted in `progress.md` | planned |
| O2 | AC2 — a roadmap `done` row never suppresses a gate | Gates read receipts; rows are labels | P4 | Roadmap-label gate independence | `execute-phase --fix 162` | ROUTING `→ Next: nothing` count = 0 + POLICY/SENSOR_CORE greps (AC2 command) | grep output in `progress.md` | planned |
| O3 | AC3 — `NEEDS-DESIGN` only from `review-spec` | Single verdict arbiter per the persisted state machine | P5 | Arbitration ownership contract | `execute-phase --fix 162` | `grep -rni "needs-design" skills/review-plan/` → 0; review-spec retains ≥1 (AC3 command) | grep output in `progress.md` | planned |
| O4 | AC4 — guards gate blind re-reviews of unchanged state, never a verdict-response repair | No cap converts a verdict into a dead end | P5 | Arbitration ownership contract | `execute-phase --fix 162` | POLICY §4 + REPAIR §4 + PERSIST_AND_DECIDE carry the clause (AC4 command) | grep output in `progress.md` | planned |
| O5 | AC5 — `impossible-timeline` freshness code, skew constant, pure predicate, documented precedence slot | Receipt integrity (anti-forgery) | P1 | Impossible-timeline freshness code | `execute-phase --fix 162` | `cd packages/agentic-workflow-schema && bun run test` → fail 0; `grep -c "impossible-timeline" src/pre-execution.ts` ≥ 1 | suite tail in `progress.md` | planned |
| O6 | AC6 — the sensor refuses a back-dated receipt under its own reason code | Receipt integrity (anti-forgery); the PE-006 field case is the regression | P2 | Sensor timeline verification | `execute-phase --fix 162` | `node --test scripts/pre-execution-timeline.test.mjs` → pass | suite tail in `progress.md` | planned |
| O7 | AC7 — the sensor-only dimension composes with the comparator's documented precedence | Sensor cannot drift from the contract it prints | P2 | Sensor timeline verification | `execute-phase --fix 162` | `node --test scripts/pre-execution-attribution.test.mjs scripts/pre-execution-sensor.test.mjs` → pass | suite tail in `progress.md` | planned |
| O8 | PE-007 — `audit-pr`'s lineage gate names the new dimension | Merge-gate honesty for the new dimension | P5 | Arbitration ownership contract | `execute-phase --fix 162` | `grep -c "impossible-timeline" skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md` ≥ 1 | grep output in `progress.md` | planned |
| O9 | PE-008 — the routes this unit grows return green by trim; the pre-existing shared-component ceilings rise via the declared re-basis (Decision 12) | Context budgets stay enforced | P5 | Arbitration ownership contract | `execute-phase --fix 162` | `node scripts/check-skill-context.mjs --routes` → exit 0 | tail in `progress.md` | planned |
| O10 | AC8–AC10 — versions, changelogs (EN+ES same-PR), Pi-mirror re-bundle, packages green | Release hygiene invariants (`CLAUDE.md`) | P5 + P6 | Arbitration ownership contract + Hardening & PR | `execute-phase --fix 162` | AC8–AC10 commands (AC10's changelog greps are anchored to the schema package's own Companion-table row — red at the pre-fix bytes); `cd packages/pi-agentic-workflow && bun run test` → fail 0 | tails in `progress.md` | planned |
| O11 | AC11 — the machine verdict-stage map no longer sanctions `needs-design` at the plan stage (the flat `PRE_EXECUTION_VERDICTS` keeps it — `review-spec` still emits) | Single verdict arbiter: the persisted state machine stops accepting what (c) forbids (PF-2, Decision 11) | P1 | Impossible-timeline freshness code | `execute-phase --fix 162` | `cd packages/agentic-workflow-schema && bun run test` → fail 0 (with the flipped plan-stage matrix pin `:95` and the new explicit `VERDICTS_BY_STAGE.plan` deepEqual pin, both red-first in `test/pre-execution-receipt.test.mjs`); `grep -cF 'plan: ["plan-review-pass", "plan-review-fail"]' packages/agentic-workflow-schema/src/pre-execution-contract.ts` ≥ 1 | suite tail + grep output in `progress.md` | planned |

## Rules that must never be violated

- **Stack-agnostic.** No stack, framework, runtime, or product references
  enter the skills or shared docs (`CLAUDE.md` § Working rules).
- **One PR per unit, against `main`; never push/open from planning.** The
  `Hardening & PR` phase pushes and opens it, and nothing else.
- **Conventional commits** (`fix(162): …`, `docs(fix): …`).
- **Bilingual sync in the same PR.** Every touched English doc with an ES
  sibling (`CHANGELOG.md` ↔ `CHANGELOG.es.md`) is updated in the same commit —
  `SKILL.md`, SPECs, and commits stay English-only (no sibling exists).
- **Version every change, same-PR.** Schema minor bump for the additive code;
  pi package bump after `bundle:skills`; each touched skill's `version:` bump
  with changelog rows.
- **Tests are immutable; the fix never edits a test to pass** — new pins are
  added red-first; only this fix's own new test files are written by it.
- **Never edit `ACCEPTANCE.md` during execution** without a user-approved SPEC
  amendment; never write or "sync" a `PreExecutionReviewReceipt` outside a
  reviewer turn (`design-feature` guardrail).
- **Receipts stay reviewer-owned; the sensor never grants a verdict** — the
  self-check proves a mark landed, it never issues one (`SNAPSHOT.md`).
- **Fail-open on missing evidence, never invented.** The timeline check answers
  `impossible-timeline` only from the receipt's own recorded lines plus git
  evidence; a legacy receipt without a parsable timeline is unflagged, and an
  unresolvable revision is unflagged.
- **The roadmap row is deliberately unbound** in snapshots (RS-note in
  `SNAPSHOT.md`): (b) changes how labels are *read*, never what a snapshot binds.
- **The `gate-rejection-vocabulary@1` block and the receipt templates' fixed
  fields are versioned grammar** — edits stay outside those blocks; the plan
  receipt's `Verdict:` line vocabulary change (dropping `needs-design`) is the
  reviewed, versioned change this fix makes deliberately — mirrored in the
  machine grammar by the `VERDICTS_BY_STAGE.plan` narrowing (O11, Decision 11).

## Operational risks

- None operational (no jobs, queues, cache, or schema migration). The schema
  code must merge with the sensor in the **same PR** — the sensor throws on an
  unpublished code (`attributeFreshness`'s vocabulary guard), so P1 lands before
  P2 and the PR ships both. CI clock drift across machines is absorbed by the
  published skew constant (PE-010).
- Five routes exceed their ceilings at the baseline (`PE-008`): the two this
  unit grows return green by trim, the three pre-existing rise via the declared
  re-basis (Decision 12); P5's trim-or-declared-re-basis task is sequenced after
  the last `skills/**` edit so the check measures the final bytes. The
  verdict-stage map narrowing ships in the same schema package version as the
  additive freshness code — one bump, one changelog row pair.

## Security risks

- None (no auth, secrets, PII, webhooks, or limits touched). The added guard is
  itself an integrity control: it makes a forged receipt self-refuting, and it
  fails open on absent evidence rather than inventing a reason code.

## Compliance touchpoints

n/a — no domain or compliance rules apply to this repository.

## Affected docs

- `docs/fix/README.md` — the fix-index row (registered `pending` at plan commit;
  flipped `done` at the close-out phase) — covered by the phase chain, validated
  by the template's hardening tasks.
- `docs/workflow/SKILL_CONTEXT_BUDGETS.json` — declared re-basis (growth source
  named) when trimming does not restore the two touched routes — obligation O9.
- `CHANGELOG.md` + `CHANGELOG.es.md` — version rows, same-PR — obligation O10.

## Observability

- The sensor's `verify` JSON is the log line: `structural.reasonCode:
  "impossible-timeline"` names a refused receipt; exit 4 stays the non-current
  exit for every consumer (`execute-phase`, `audit-pr`, `workflow-status`).
- Silent failure is caught by the new suites: `scripts/pre-execution-timeline.test.mjs`
  (guard present) and the extended parity test (sensor ↔ contract agreement).

## Cross-issue notes

| Issue/PR | State | Relation | Decision |
|---|---|---|---|
| #161 (merged PR #163) | closed | related — same direction ("the persisted state decides, not prose"); contributed `finding-mark@1` | no dependency; pattern reused |
| #159 (merged PR #160) | merged | prerequisite — owns the cap/convergence texts this fix scopes | prerequisite satisfied; this fix amends their scope, never deletes the cap |
| #170 | open | parallel — code-side loop efficiency (REPAIR-RECEIPT, delta re-review) | not absorbed; P5's cap-scope clause is compatible with its "the cap counts only reviews that actually run" |
| #171 | open | parallel with file overlap — planning-side materiality + hard cap | this fix lands first (it re-homes `NEEDS-DESIGN` and scopes the guards); #171 rebases — its "third cycle ends in NEEDS-DESIGN" reads the re-homed emitter (`review-spec`) and keeps the verdict-response exception |
| #172 | open | parallel with file overlap (LEDGERS, PERSIST_AND_DECIDE, audit-pr, workflow-status) | not absorbed; one-clause edits rebase cleanly |
| #173 | open | parallel — turn-contract single-owner migration | its bespoke list excludes `review-spec`/`review-plan`; the skill-specific boxes edited here are the sanctioned addition surface |
| #176 | open | related — route-budget policy: slim the skills or raise ceilings (the refactor decision) | this fix restores the routes it grows by trim and raises the pre-existing shared-component ceilings via the declared re-basis (Decision 12); the slim-vs-raise policy question stays #176's |

## Acceptance

Objective, verifiable conditions for "done". Each criterion is a runnable
command where possible, or labelled `read-verified` — never unlabelled prose.
Full manifest with validators: `ACCEPTANCE.md` (frozen beside this SPEC).

### Spec-lint (mechanical — presence checks only)

Run by `plan-fix` before committing the draft; fail-closed, no quality
judgement. Any FAIL → fix the SPEC before the commit.

- [x] No template placeholders left (`grep -nE '<(topic|n|task|command|expected)'`
      over the filled sections returns nothing — the `### P1` scaffold lines
      are replaced, not kept).
- [x] `### Out of scope` has ≥ 1 concrete bullet — never empty.
- [x] Every `## Acceptance` criterion is a runnable command OR labelled
      `read-verified`.
- [x] Every phase passes the 8-box Phase-lint below (already mandatory,
      owned by `skills/phase-contract/SKILL.md`).
- [x] `### Planning evidence` has a `current` row for the reproduction, the root
      cause, the regression scope, and the rollback path — none blank, none
      `n/a`.
- [x] `### Obligations` has one row per normative behaviour, applicable invariant,
      affected use case, and required failure state, each with a phase and a
      validator; no `deferred` row and none exported to a follow-up issue.

## Phases

Execution ledger — `execute-phase --fix 162` runs **all remaining phases by
default** and ticks tasks here; an explicit `P<n>` runs exactly one phase.
**Always ≥ 2 phases**: `P1..P5` implement the fix (each task independently
checkable, no judgement); the final phase is always `Hardening & PR` — its
pre-written tasks are kept literally, never paraphrased or merged into an
implementation phase. Order is load-bearing: the schema (P1) lands before the
sensor (P2) because the sensor imports the published vocabulary and refuses
unpublished codes.

### Phase-lint (owned by `skills/phase-contract/SKILL.md`)

Every implementation phase below must pass all 8 boxes before it is emitted
(planner skills) or executed (`execute-phase` pre-flight). Fail-closed: any
unticked box blocks emission/execution until the phase is re-cut or split.

### P1 — Impossible-timeline freshness code

Layer: `domain`. Done-when: `cd packages/agentic-workflow-schema && bun run test`
→ exit 0, fail 0.
Phase-lint: PASS (8/8) · fingerprint `P1:domain:6:impossible-timeline-freshness-code`

- [x] Red-first `packages/agentic-workflow-schema/test/pre-execution-timeline.test.mjs`: pins `impossible-timeline` membership in `PRE_EXECUTION_FRESHNESS_CODES`, `PRE_EXECUTION_RECEIPT_TIMELINE_SKEW_MS === 300_000`, and the predicate's two primary answers — a back-dated finish (earlier than commit − skew) → `true`, an honest finish (later than commit) → `false`
- [x] Extend the same test file red-first with the fail-open answers: a finish within the skew before the commit date → `false`, and missing or unparsable stamps → `null` (the predicate never throws)
- [x] `packages/agentic-workflow-schema/src/pre-execution.ts`: add `"impossible-timeline"` to `PRE_EXECUTION_FRESHNESS_CODES` directly after `"stale-policy"`; export `PRE_EXECUTION_RECEIPT_TIMELINE_SKEW_MS` and the pure `isImpossibleReceiptTimeline({ finishedAt, sourceCommitDate, skewMs })` (returns `boolean | null`); re-export both from `src/index.ts`; `comparePreExecutionReceiptToSnapshot`'s docstring precedence gains the slot as item 4 (list renumbered 1–10) annotated "evaluated by git-backed callers at this slot; the pure comparator leaves it un-evaluated (fail-open)"
- [x] `packages/agentic-workflow-schema/src/pre-execution-contract.ts`: drop `"needs-design"` from `VERDICTS_BY_STAGE.plan` (it stays in the `spec` row and in the flat `PRE_EXECUTION_VERDICTS`); re-export `VERDICTS_BY_STAGE` from `src/index.ts` (additive — already exported from the canonical definition, not yet public; the suite imports `../dist/index.js`); red-first pin updates in `test/pre-execution-receipt.test.mjs` — add a new explicit `assert.deepEqual([...VERDICTS_BY_STAGE.plan], ["plan-review-pass", "plan-review-fail"])` pin (the durable list pin the suite lacks — no suite asserts the map directly, PF-3) and flip the matrix case (`:95`, `["plan", "needs-design", true]` → invalid); the flat `PRE_EXECUTION_VERDICTS` deepEqual (`:45-:48`) stays untouched (PE-011's must-name surface); the `verdict-stage-matrix` rule reads the map, no rule edit; `normative-drift` reads the map from src (adaptive); `bun run build` regenerates `dist/` (O11/AC11, Decision 11, PE-013)
- [x] Update any suite pin that enumerates the closed freshness list red-first (`test/pre-execution-lineage.test.mjs`, `test/pre-execution-docs.test.mjs`, `scripts/pre-execution-quality.test.mjs`) so the whole vocabulary stays pinned
- [x] Schema package version 4.0.1 → 4.1.0 in `package.json` + one row each in the `CHANGELOG.md` and `CHANGELOG.es.md` "Companion npm packages" tables; `bun run build` then `bun run test` → fail 0

### P2 — Sensor timeline verification

Layer: `config/infra`. Done-when: `node --test scripts/pre-execution-timeline.test.mjs scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs`
→ exit 0.
Phase-lint: PASS (8/8) · fingerprint `P2:config/infra:5:sensor-timeline-verification`

- [x] Red-first `scripts/pre-execution-timeline.test.mjs` (throwaway git repository, black-box over the CLI like `pre-execution-sensor.test.mjs`): a back-dated receipt (finish before its recorded revision's commit date by more than the skew) answers `impossible-timeline` at its own recorded revision with nothing moved (proving it is not mis-attributed staleness), and an honest receipt answers `current: true`
- [x] Extend the same test file red-first with the fail-open cases: a legacy receipt without a `Started/finished:` line is unflagged, a finish within the skew before the commit date is unflagged, and a recorded source revision git cannot resolve is unflagged
- [x] `scripts/pre-execution-snapshot.mjs` `receipts()` parses the `Started/finished:` line into `startedAt`/`finishedAt` (split on `/`; unparsable values stay `null`)
- [x] `scripts/pre-execution-snapshot.mjs` `attributeFreshness` gains the `sourceCommitDate` parameter and evaluates the `impossible-timeline` slot (after the `stale-policy` check, before the drift dimensions) via the schema predicate, naming both timestamps in the detail; `main()`'s verify path fetches the recorded revision's committer date with `git show -s --format=%cI` and passes it, treating empty output as unresolvable (fail-open); the file header docstring names the new dimension
- [x] `scripts/pre-execution-attribution.test.mjs`: extend the parity table with the timeline case — the sensor's git-backed dimension fires at its documented slot where the pure comparator (which cannot see commit dates) answers `fresh` or a stale dimension, so the composition is documented, not invented

### P3 — Reviewer receipt self-check

Layer: `docs`. Done-when: the AC1 grep set returns ≥1 hit in each of the four
contract files and both OUTPUT.md turn-contract boxes name the emit conditions.
Phase-lint: PASS (8/8) · fingerprint `P3:docs:4:reviewer-receipt-self-check`

- [x] `skills/pre-execution-review/references/POLICY.md` §8: the receipt self-check rule — the reviewer runs the sensor's `verify` for its own stage in the same act as persisting the receipt, before the verdict block is printed, and pastes the sensor's answer beside the verdict block; a digest-bound receipt requires `structural.fresh: true` (and, for a PASS verdict, `current: true`); exit 3 (`missing-receipt-snapshot`) or a digest-bound `structural.fresh: false` means the mark did not land → fix the write and re-run, the verdict is not emit-able; a `Snapshot: refused` receipt's `missing-receipt-snapshot` answer is its sanctioned form; a verdict block printed without the pasted self-check output is a contract defect, and every consumer reads a chat-only verdict as `missing-receipt-snapshot`
- [x] `skills/pre-execution-review/references/SNAPSHOT.md`: "the reviewer is consumer zero" note in the re-verify section (cite POLICY §8; the recipe owner stays this file)
- [x] `skills/review-spec/references/OUTPUT.md`: the persist-first section gains the self-check step, and the "Receipt appended to the unit's progress.md before the report was printed" turn-contract box becomes the RUN box (verify RUN in-turn, JSON pasted, exit-3/fresh emit condition)
- [x] `skills/review-plan/references/OUTPUT.md`: the same two edits (feature plan runs name `--parent`; fix units omit it)

### P4 — Roadmap-label gate independence

Layer: `docs`. Done-when: `grep -c "→ Next: nothing" skills/plan-feature/references/ROUTING.md`
→ 0, and the AC2 greps return ≥1 hit each.
Phase-lint: PASS (8/8) · fingerprint `P4:docs:3:roadmap-label-gate-independence`

- [x] `skills/pre-execution-review/references/POLICY.md` §5: a new bullet — no gate answer is read from a roadmap row's status; `done` means built + PR open with the human merge pending (`docs/features/ROADMAP.md` § Status legend; `docs/fix/README.md` § Status legend), so it never satisfies or suppresses a pre-execution/verification gate, never retires the obligation to re-derive a receipt, and never lets a reviewer or consumer report a unit closed while its PR is unmerged — gates read receipts, roadmap rows are labels
- [x] `skills/plan-feature/references/ROUTING.md` step 4: the `done` STOP keeps forbidding a replan and replaces `→ Next: nothing — <NN>-<slug> already shipped (roadmap status done)` with a block that routes to the merge gate — `→ Next: /audit-pr <PR> — done means built + PR open, merge pending (a lifecycle label, never a gate verdict)`, with two sub-bullets: the row's PR is merged → nothing pending, pick the next unit (`/plan-feature --next`); no PR is open → the row is mislabeled or execution stopped (`/execute-phase <NN>`, never a replan)
- [x] `skills/workflow-status/references/SENSOR_CORE.md` step 6a: the receipt-sensing set gains `done` rows whose linked PR is open (unmerged — merge state lives in the forge), so a stale or missing receipt on a done-but-unmerged unit surfaces as a gate blocker instead of reading as merge-ready; merged units stay excluded (the merge itself closes their gates)

### P5 — Arbitration ownership contract

Layer: `docs`. Done-when: the AC3/AC4/O8/O9 commands pass.
Phase-lint: PASS (8/8) · fingerprint `P5:docs:8:arbitration-ownership-contract`

- [x] `skills/review-plan/references/OUTPUT.md`: delete the `NEEDS-DESIGN` verdict block; the receipt template's `Verdict:` line becomes `<plan-review-pass|plan-review-fail>`; the closed-set prose gains "a gap that requires inventing product intent is `PLAN-REVIEW-FAIL` with `class: product` — `NEEDS-DESIGN` is not a verdict at this stage: only `review-spec` may emit it"; the routes table loses its `NEEDS-DESIGN` row (the `class: product` row already routes it); the closing blocks drop the `NEEDS-DESIGN` branch
- [x] `skills/review-plan/SKILL.md`: the four `NEEDS-DESIGN` mentions (frontmatter description line 12, routing row line 84, closed-set prose lines 102/106) updated to the two-verdict set with the `class: product` route
- [x] `skills/pre-execution-review/references/POLICY.md` §4: one sentence — the guards gate **blind re-reviews** (an identical snapshot with the identical question) and never a repair performed in response to a persisted verdict: a repair turn whose input is a FAIL/NEEDS-DESIGN receipt produces a new snapshot by design, so no cycle cap or anomaly rule may block or end it — the anomaly is printed and routed, never a stop, and no cap converts a verdict into a dead end
- [x] `skills/design-feature/references/REPAIR.md` §4: a repair answering a persisted verdict is never a loop defect (cite POLICY §4); no "already complete" answer exists for a unit whose `progress.md` carries an open FAIL/NEEDS-DESIGN receipt — the repair routes through this skill by definition
- [x] `skills/review-change/references/PERSIST_AND_DECIDE.md`: one clause scoping the two-cycle cap to the review→fold loop on source findings (a planning repair routed by a `class: plan`/`product` finding is a verdict response under POLICY §4, never a loop-defect stop)
- [x] `skills/audit-pr/references/02_CLOSURE_AND_SCOPE_GATES.md`: the lineage gate's blocker enumeration becomes "Stale, missing, wrong-stage **or impossible-timeline** lineage → BLOCKED"
- [x] Version bumps: minor for every touched skill (`pre-execution-review`, `review-spec`, `review-plan` via bump-skill — it edits SKILL.md; the reference-only skills `plan-feature`, `workflow-status`, `design-feature`, `review-change`, `audit-pr` bumped manually), each with a row in `CHANGELOG.md` + `CHANGELOG.es.md`; `npm run bundle:skills` in `packages/pi-agentic-workflow` after the last `skills/**` edit of this unit + pi package version bump with its own changelog rows
- [x] Budgets: run `node scripts/check-skill-context.mjs --routes`; for each exceeded route first trim redundant added text, then raise the remaining exceedance via the declared re-basis in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` naming the growth pathway this unit actually grows — the shared `pre-execution-review` reference — as `fix/162` (five routes exceed at the baseline: the two grown routes return green by trim; the three pre-existing ceilings rise by the same declared re-basis, Decision 12; the slim-vs-raise policy stays #176) — until the command exits 0

### P6 — Hardening & PR

- [ ] Re-run the project's full verification gate (commands + exit codes pasted): `node --test scripts/*.test.mjs` → 0 fail (route budgets green after P5's re-basis); `cd packages/agentic-workflow-schema && bun run test` → fail 0; `cd packages/pi-agentic-workflow && bun run test` → fail 0 (includes the `skills/` mirror parity test)
- [ ] Pending-docs check: `git status --porcelain -- docs/` → empty
- [ ] Set the fix-index row status to `done` and commit the flip
- [ ] `git push`
- [ ] Open the PR (`gh pr create --body-file <path>` — body written as a
      Markdown file, real backticks, never inline `--body`/heredoc) and
      PRINT THE PR URL in the chat; the body includes `Closes #162`
- [ ] Update the fix-index row to `done · [#<pr>](<pr-url>)`
- [ ] Commit `docs: link PR #<n>` and push

## Testing

- Unit/contract: `packages/agentic-workflow-schema/test/pre-execution-timeline.test.mjs`
  (pure predicate + vocabulary + skew, red-first).
- Integration (black-box CLI over throwaway repositories):
  `scripts/pre-execution-timeline.test.mjs` — back-dated flagged at its own
  recorded revision, honest `current: true`, legacy fail-open, skew boundary,
  unresolvable revision fail-open.
- Architecture/parity: `scripts/pre-execution-attribution.test.mjs` extended —
  the sensor's timeline dimension composes with
  `comparePreExecutionReceiptToSnapshot`'s documented precedence.
- Verdict-stage map: `packages/agentic-workflow-schema/test/pre-execution-receipt.test.mjs`
  red-first — a new explicit `VERDICTS_BY_STAGE.plan` deepEqual pin (the durable
  list pin, red until the map drops the member) and the matrix case (`:95`)
  flips to invalid; the flat `PRE_EXECUTION_VERDICTS` deepEqual (`:45-:48`) and
  `pre-execution-docs.test.mjs` / `pre-execution-quality.test.mjs` stay
  untouched (the flat enum and the `spec` stage keep the token).
- Docs-side criteria are `read-verified` greps (they pin contract text, not
  behavior); the machine surfaces stay validated by `normative-drift`,
  `pre-execution-quality`, `ledger-ownership`, and the budgets check.

## Rollback

Revert the unit's PR (`gh pr revert <N>` — or `git revert -m 1 <merge-sha>`
after a merge). The freshness member is additive and the verdict-stage
narrowing invalidates no persisted receipt (PE-013), so no persisted state,
receipt, ledger row, or roadmap row is rewritten; a revert restores the 4.0.1
vocabulary and the permissive plan-stage map. Legacy receipts and all consumers
keep working unchanged (the sensor's timeline check fails open). Data cleanup:
none. Lost: nothing — the fix introduces no data format; the sensor simply
stops checking timelines and the review contract returns to prose-enforced
write-then-report.

## Status

`pending` · `in-progress` · `done` (built, PR open — merge state lives in the forge)

(Removed from `docs/fix/README.md` only **after** the PR merges.)

## Decisions made during drafting

1. **Self-check output is pasted in chat, not persisted inside the receipt
   block.** The receipt block is the canonical mark with fixed fields; a
   non-contract line inside it would drift the receipt template the sensor
   parses. The turn-contract box (the checklist surface this repo executes on)
   makes the RUN mandatory in-turn, and consumers stay protected by the sensor:
   a chat-only PASS is `missing-receipt-snapshot` to them, exactly as today.
2. **`impossible-timeline` slot: after `stale-policy`, before `stale-context`.**
   The check reads the receipt's own recorded lines (`Started/finished`,
   `Source revision`) — receipt-internal assertions precede the drift
   dimensions; `stale-policy` stays first inside that group because the policy
   version gates the whole contract family. The vocabulary member is inserted
   directly after `"stale-policy"` to mirror the documented slot.
3. **The pure comparator does not gain the check.** It is pure and has no git
   access; the schema publishes the code, the documented precedence slot, the
   skew constant, and the pure predicate; the git-backed sensor evaluates the
   slot, and the parity test documents that composition (PE-012). Receipts
   already record both lines — no template change is needed.
4. **review-plan loses `NEEDS-DESIGN` entirely; product-intent gaps are
   `PLAN-REVIEW-FAIL` with `class: product`.** The existing routes table already
   routes that class (`design-feature` → `review-spec` → the plan re-derives via
   `stale-parent`), so nothing new is invented; the schema verdict enum is
   unchanged (`review-spec` still emits `needs-design`, keeping the
   `must-name` surface coverage — PE-011).
5. **Ledgers are embedded in this SPEC** (the fix template's own sections; the
   fix/157 and fix/161 precedent), although the M size would point at separate
   files per `LEDGERS.md` — the plan-fix-vs-LEDGERS size wording drift stays a
   review-plan proposal note, not a silent choice.
6. **Skew = 5 minutes**, published as `PRE_EXECUTION_RECEIPT_TIMELINE_SKEW_MS`
   from the schema package so the sensor cannot drift from the contract
   (PE-010). The field case's ~20 h contradiction is three orders of magnitude
   beyond it.
7. **The route-budget red is resolved in-unit by trim + declared re-basis**
   (O9): five routes exceed at `b18fb612` (PE-008, re-run at the bound revision
   by review rp-fix162-20260906-001) — the two this unit grows return green by
   trim, and the three pre-existing (`design-feature:repair`,
   `plan-feature:scaffold`, `plan-fix:issue`) rise via the budgets file's own
   sanctioned declared re-basis naming `fix/162`, because this unit grows the
   shared `pre-execution-review` reference that is a component of those routes
   (Decision 12); leaving any of them red fails this unit's own gate.
8. **`SENSOR_CORE.md` 6a extension is limited to `done`-with-open-PR
   (unmerged) units** — a merged unit's gates are closed by the merge itself;
   sensing receipts for merged units would report solved drift forever.
9. **No web research pass.** Every bounded question (ROWS.md Q1–Q5) was
   answered from repository evidence (issue body + the files cited in
   PE-002–PE-005, PE-007, PE-011, PE-012); nothing was re-fetched from the web.
10. **Reference trace performed by symbol/reference search, not memory:** the
    affected surfaces were located by grep across `skills/`, `scripts/`, and
    `packages/agentic-workflow-schema/src/` (`write-then-report`, `NEEDS-DESIGN`,
    `stale-parent`, `PRE_EXECUTION_FRESHNESS_CODES`, `done`/roadmap readers);
    the blast radius in PE-007 is derived from those searches, not from memory.
11. **`VERDICTS_BY_STAGE.plan` drops `needs-design` — the machine map is
    aligned with the prose re-homing, not left permissive** (repair ar-162-2,
    review finding PF-2). The fix's thesis is that the persisted state machine
    is the only arbiter; leaving the stage map sanctioning plan-stage
    `needs-design` would keep machine-valid exactly the emission (c) forbids —
    the same prose-vs-machine gap (a) exists to close. The flat
    `PRE_EXECUTION_VERDICTS` keeps the token (`review-spec` still emits —
    PE-011), and no persisted plan-stage `needs-design` receipt exists in this
    repository (PE-013), so the narrowing invalidates nothing historical.
    Schema minor bump retained (4.1.0): the map's consumers are the internal
    `verdict-stage-matrix` rule and the drift model, both updated or adaptive
    in-unit (PE-013).
12. **Route-budget baseline corrected; the pre-existing ceiling policy routes
    to #176 (owner instruction, repair ar-162-2).** The draft's PE-008 claimed
    two exceeded routes; the true baseline at `b18fb612` is five (review
    finding PF-1, re-run at the bound revision). The factual half is repaired
    (PE-008 re-cited, O9/P5-task-8 reworded); the policy half — whether the
    skills are slimmed or refactored, and where ceilings should sit long-term —
    is #176's and does not block this unit's gate: the declared re-basis names
    `fix/162` because the unit grows the shared `pre-execution-review`
    reference component of the affected routes.

## Effort

M — one day of executor work, multi-commit (6 phases), one PR. Above S because
of the schema + sensor code with tests-first discipline and the eight skill
surfaces; below L because each phase is small, additive, and independently
gateable, and no Product half exists to re-derive.
