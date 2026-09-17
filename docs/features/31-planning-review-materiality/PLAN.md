# PLAN — 31-planning-review-materiality

Five implementation phases: the schema finding-record materiality carrier → the
transition-decider cap refusal → the snapshot CLI's wording-only route → the
skill-reference prose shrink and release records → the hardening close-out. The
cut follows the Product half's carrier ruling (D-31-6) and its Size section ("M —
code carrier, no split trigger: well under 5 phases"), so it stays inside the
bound the reviewed Product half records. Every phase declares one layer, holds
zero open design decisions, and ends in a locally runnable, machine-checkable
done-when. Artifact revision of this plan set: **`31-plan-3`** — the re-cut
`plan-feature` owes after the Product carrier amendment (`31-spec-3`) and the
Product half's own `## Design status` ("`plan-feature` re-cuts the plan set
(`31-plan-1/2` superseded, never repaired) only on a current `SPEC-REVIEW-PASS`
receipt"). The superseded set `31-plan-1`/`31-plan-2` is not repaired: its
carrier was prose recitation plus a `PLANNING_PIN_TABLE` row floor, which the
code carrier replaces.

Plan provenance:

- Parent Product snapshot: `e15374a3863aedd968a9600b5bec280f4648874d82a069b72b2abfa4fb30a507`
  (`spec-review-31-9`), verified fresh against the bytes on disk at this
  scaffold's Product-review gate (`pre-execution-snapshot.mjs verify --stage
  spec` → `current: true`, `structural.fresh: true`).
- Parent Product receipt: `spec-review-31-9` (14/14 checks, zero findings).
- Superseded plan-stage finding rows R31-01/R31-02/R31-03: resolved by this
  re-cut (`planning-findings.md`; artifact revision `31-plan-3`).
- Frozen acceptance-manifest blob at this revision (`git hash-object`):
  `3d7e7c9ee92314261e5529815c76b373e8ca2745` (the `31-plan-2` blob was
  `d85e217acad1322d3caf4968715ef5d00e9189c0`; the re-cut re-froze the manifest
  because the carrier moved every AC1–AC9/AC11/AC13/AC14 validator).

## P1 — Schema finding-record materiality

Layer: config/infra

The schema package's finding record becomes the carrier of the materiality
floor: the record gains the bounded `reproducer`, and the runtime predicate that
decides whether a PASS may coexist with a row becomes `medium`+. The severity
vocabulary, the receipt contract id and the freshness codes keep every value.

- [ ] Add the bounded `reproducer` field to the finding-record spec in `packages/agentic-workflow-schema/src/pre-execution-contract.ts` — an optional `string` entry in `FINDING_SPEC.fields` with `minLength: 1`, `maxLength` from a new `PRE_EXECUTION_LIMITS.reproducerChars` limit and `nulFree: true`, plus the matching optional member on the `PreExecutionReviewFindingV1` interface.
- [ ] Rewrite the severity prose in `packages/agentic-workflow-schema/src/pre-execution-contract.ts` — the `PRE_EXECUTION_FINDING_SEVERITIES` comment and the `severity` field description state material = `medium`+, that `low` is a persisted report-note, and that `info` is immaterial, so no "only immaterial" phrasing survives anywhere in the package sources.
- [ ] Change the materiality predicate in `packages/agentic-workflow-schema/src/pre-execution.ts` to the `medium`+ line and restate the doc comment above `validatePreExecutionReceiptAgainstSnapshot` — a PASS may coexist with open/unverified `low` rows and is refused while any open/unverified `medium`+ row exists.
- [ ] Add the receipt vectors to `packages/agentic-workflow-schema/test/pre-execution-receipt.test.mjs`: a PASS carrying an open/unverified `low` row validates; the same PASS with an open/unverified `medium` row is refused with `verdict-mismatch`; a receipt whose findings carry no `reproducer` still validates, while a `reproducer` beyond the declared bound is refused.
- [ ] Regenerate the two pre-execution Draft-07 projections with the package's own generator run from the package root (`bun scripts/generate-pre-execution-schemas.mjs` writes them, and the `--check` form is the drift gate) so the committed projections carry `reproducer` and their `$comment` runtime-rule disclosure stays in sync.
- [ ] Bump the schema package to 4.3.0 in `packages/agentic-workflow-schema/package.json` — an additive minor: every enum value, the receipt contract id and the freshness vocabulary stay byte-identical.
- [ ] Run the package suite green: `cd packages/agentic-workflow-schema && bun run test` → exit 0.

Done-when: `cd packages/agentic-workflow-schema && bun run test && bun run check:pre-execution-schemas` → exit 0 with the materiality, `reproducer`-bound and back-compatibility vectors green and zero projection drift.

Phase-lint: PASS (8/8) · fingerprint `P1:config/infra:7:schema-finding-record-materiality`

## P2 — Transition-decider cap refusal

Layer: config/infra

The orchestrator's pure transition decider refuses to advance past the planning
loop's hard cap: after two consecutive unconverged review→repair→re-review
cycles, an invocation of `review-spec`/`review-plan` stops with a named reason
code and the human route, and a PASS resets the count. The count is derived from
the persisted receipts on every run — no new store, no counter write.

- [ ] Add the optional derived cycle input to the decider's input type in `packages/agentic-workflow-schema/src/index.ts` — `WorkflowDecisionInput.reviewLoopCycles` as `{ spec?: number; plan?: number }`, documented as the consecutive-unconverged count the unit's stage receipts already carry.
- [ ] Add the cap-refusal stop code to `packages/agentic-workflow-schema/src/index.ts` — `WORKFLOW_DECISION_STOP_CODES` gains `stop-review-loop-cap` while every existing code value keeps its spelling.
- [ ] Implement the refusal in `packages/agentic-workflow-schema/src/index.ts` inside `decideWorkflowAction` — a `review-spec`/`review-plan` proposal whose stage count reaches two returns `kind: "stop"` with `intent: "ask-human"`, `reasonCode: "stop-review-loop-cap"` and the human route (`design-feature`) named in `detail`.
- [ ] Add the cap vector suite `packages/agentic-workflow-schema/test/workflow-decision-review-loop-cap.test.mjs` proving three behaviours: two consecutive unconverged cycles refuse a third `review-spec`/`review-plan` invocation; a PASS reset leaves the next cycle allowed; a `needs-design` outcome routes to `design-feature`.
- [ ] Derive the per-stage consecutive-unconverged count in `scripts/workflow-status.mjs` from the receipts `scripts/pre-execution-contract.mjs` already parses, and pass it into the decider input.
- [ ] Extend `scripts/workflow-status-pre-execution.test.mjs` with the cap-refusal emission case and run the sensor suite green.

Done-when: `cd packages/agentic-workflow-schema && bun run test` → exit 0 with the cap vectors green, and `bun test scripts/workflow-status-pre-execution.test.mjs` → exit 0.

Phase-lint: PASS (8/8) · fingerprint `P2:config/infra:6:transition-decider-cap-refusal`

## P3 — Snapshot wording-only route

Layer: config/infra

The snapshot verifier distinguishes a recorded wording-only movement from
material movement inside the closed freshness vocabulary: the author records the
determination in the unit's evidence home, rotates the artifact revision, and
`verify` answers current while the acceptance fingerprint and the bound
authorities are unmoved. Nothing else moves: no new freshness code, no new CLI
flag, and the exit codes stay 0/1/3/4.

- [ ] Add the determination parser `parseWordingOnlyDeterminations` to `scripts/pre-execution-contract.mjs` — it reads the `## Wording-only determination v1 — <stage>` block's `Determination`, `Acceptance fingerprint` and `Intent and authority unchanged` lines from a unit's evidence home.
- [ ] Add the wording-only branch to `attributeFreshness` in `scripts/pre-execution-snapshot.mjs` — with bound artifact bytes moved, a matching determination (same artifact revision, same acceptance fingerprint, zero changed context authorities) answers fresh with the determination id named in `detail`.
- [ ] Enforce the rotation in `scripts/pre-execution-snapshot.mjs` — a rotated revision with no matching determination keeps `stale-artifact-revision`, and a determination whose recorded revision differs from the snapshot's current one is refused.
- [ ] Read the acceptance fingerprint in the verify path of `scripts/pre-execution-snapshot.mjs` by fingerprinting the unit's acceptance manifest (`git hash-object docs/features/31-planning-review-materiality/ACCEPTANCE.md` is the form the CLI runs for its own unit) and fail closed when the manifest is absent, so the wording-only route is unavailable without a frozen manifest.
- [ ] Extend `scripts/pre-execution-attribution.test.mjs` with the wording-only vectors for all three outcomes — fresh with the recorded determination, `stale-artifact-content` on material movement, and the refusal when the determination is missing.
- [ ] Extend `scripts/pre-execution-sensor.test.mjs` with the wording-only vectors and the `wording-only` anchor the acceptance criterion greps.
- [ ] Re-aim the planning-side pins in `scripts/review-loop-discipline.test.mjs` at the code carriers — the pin block reads the schema package's `medium`+ predicate, the CLI's verify report and the decider's refusal, and every existing assertion keeps its strength.

Done-when: `bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs scripts/review-loop-discipline.test.mjs` → exit 0 with the wording-only vectors and the re-aimed code-carrier pins green.

Phase-lint: PASS (8/8) · fingerprint `P3:config/infra:7:snapshot-wording-only-route`

## P4 — Skill-reference prose shrink

Layer: docs

The prose surfaces lose exactly the sentences the machine now owns and gain the
remainder that is not computable. The release records ride the same change, not a
second deliverable: the repository's *Version every change* rule binds a skill
edit to its bump, its `CHANGELOG.md` row and its README cell, and the schema
package's 4.3.0 row lands with the bibliography append here.

- [ ] Rewrite the materiality semantics in `skills/pre-execution-review/references/LEDGERS.md` §3: replace the "`info` is the only immaterial one" sentence with the planning materiality line (material = `medium`+; `low` is a persisted, visible, non-blocking report-note that the stage author resolves without a re-review), the report-note persistence contract, the anti-deflation carry-over, and the restated PASS-coexistence sentence.
- [ ] Rewrite the findings-assembly paragraph in `skills/review-spec/references/CHECKS.md` and `skills/review-plan/references/CHECKS.md`: replace "Material = anything above `info`" with material = `medium`+ plus the report-note sentence and the anti-deflation sentence, keeping each closed severity vocabulary list byte-identical.
- [ ] Rewrite §3 of `skills/pre-execution-review/references/POLICY.md`: keep the single re-review of the resulting snapshot as the default batch consequence, remove the every-batch re-review mandate sentence, and add the wording-only exemption with the determination record's block shape and the non-skippable revision rotation.
- [ ] Rewrite §4 of `skills/pre-execution-review/references/POLICY.md`: remove the three unbounded-cycle sentences, keep the `CONVERGENCE-ANOMALY` block byte-identical, and author the remainder — the hard two-cycle cap, the `third cycle never` starts without explicit user instruction rule, and the unconverged end in `needs-design` where the stage sanctions it and in the decider's `stop-review-loop-cap` refusal plus `design-feature` route at the plan stage.
- [ ] Extend the loop text in `skills/review-spec/references/OUTPUT.md` and `skills/review-plan/references/OUTPUT.md`: remove the re-review-for-every-batch sentences from both verdict tables and both closing hand-off blocks, add the cap mirror, and keep every receipt-literal line and verdict block byte-identical.
- [ ] Rewrite §4 of `skills/design-feature/references/REPAIR.md`: remove both unbounded-cycle sentences and add the cap mirror, preserving the §4 heading and the anomaly-first ordering.
- [ ] Run the repository's `bump-skill` procedure for the four touched skills (`skills/pre-execution-review/SKILL.md`, `skills/review-spec/SKILL.md`, `skills/review-plan/SKILL.md`, `skills/design-feature/SKILL.md`) — minor bumps, so `CHANGELOG.md` gains one row per skill and the README skill cells stay accurate.
- [ ] Add the schema package's 4.3.0 row to the `CHANGELOG.md` companion-package table and append the Jin & Chen bibliography entry under a bottom `## References` section of `README.md`.

Done-when: `bun scripts/check-skill-context.mjs && grep -n "third cycle never" skills/pre-execution-review/references/POLICY.md` → exit 0 with the four skill minor bumps landed and the AC7 removal greps clean.

Phase-lint: PASS (8/8) · fingerprint `P4:docs:8:skill-reference-prose-shrink`

## P5 — Hardening & PR

Layer: hardening

Qualify the whole unit against the frozen finish line, re-bundle the Pi mirror,
walk the read-verified criteria, and close out.

- [ ] Run the full acceptance ladder at the terminal HEAD and record every exit line — the root suites (`bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs scripts/normative-drift.test.mjs scripts/workflow-status-pre-execution.test.mjs`), the schema package gate (`bun run gate:pre-execution` from the package root) and the budget gate (`bun scripts/check-skill-context.mjs`) → exit 0 across the ladder.
- [ ] Run the plan-layer linter over the unit's plan (`bun scripts/phase-lint.mjs docs/features/31-planning-review-materiality/PLAN.md`) → exit 0 with a PASS verdict and all five phase fingerprints, pasted verbatim into the phase entry (AC6).
- [ ] Re-bundle the Pi mirror after the last skill edit (`bun run bundle:skills` from the Pi package root) and run the package suite (`bun run test` from the same root) → exit 0 with the mirror byte-identical to the canonical skill tree.
- [ ] Record the three read-verified walks in the phase entry — AC9's additive-release vocabulary diff, AC13's PR-diff scope against the three declared groups, and AC8's no-weakening discipline-suite diff.
- [ ] Verify the frozen acceptance manifest (`git hash-object docs/features/31-planning-review-materiality/ACCEPTANCE.md`) still equals the receipt blob and append the acceptance receipt to the unit progress ledger.
- [ ] Confirm every phase fingerprint recorded in this plan still matches the committed phase shapes and that each read-verified obligation row carries its evidence entry (manual).
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push

Done-when: `bun test scripts/review-loop-discipline.test.mjs` → exit 0 at the terminal HEAD with the whole ladder green, parity green and the PR URL printed.

Phase-lint: PASS (8/8) · fingerprint `P5:hardening:9:hardening-pr`

## Phase order

The order is the carrier's own dependency order, and it matches the SPEC's
`Depends on:` closure (the unit's hard dependency 29 is merged; no phase builds a
later phase's deliverable early):

- P1 lands the schema predicate the other carriers reference, so P2's vectors and
  P3's pins read a settled contract.
- P2's decider refusal needs nothing from P3; both read the P1 predicate.
- P3's wording-only branch and the re-aimed pins read the P1/P2 carriers, and the
  pins assert the CLI's verify report — so P3 follows both.
- P4 owns the docs layer and runs after the code carriers exist, so the prose it
  writes describes shipped behavior rather than a promise.
- P5 hardens and closes out: the full ladder, the Pi re-bundle, the read-verified
  walks and the PR.

## Obligation mapping

One row per acceptance criterion AC1…AC14 plus O15 for the AD-008 compatibility
invariant, each with exactly one phase and one task, frozen in
`planning-obligations.md`. Closure in one line: P1 owns AC1/AC2/AC3, P2 owns
AC5, P3 owns AC4/AC8, P4 owns AC7/AC12/AC14, P5 owns AC6/AC9/AC10/AC11/AC13, and
O15 (the invariant) is owned by P2's cap refusal.
