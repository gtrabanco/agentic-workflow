# PLAN — 31-planning-review-materiality

Five implementation phases: the schema finding-record materiality carrier → the
transition-decider cap refusal → the snapshot CLI's wording-only route → the
skill-reference prose shrink and release records → the hardening close-out. The
cut follows the Product half's carrier ruling (D-31-6) and its Size section ("M —
code carrier, no split trigger: well under 5 phases"), so it stays inside the
bound the reviewed Product half records. Every phase declares one layer, holds
zero open design decisions, and ends in a locally runnable, machine-checkable
done-when. Artifact revision of this plan set: **`31-plan-5`** — the re-derivation
that binds the current Product receipt `spec-review-31-11` after the
owner-commissioned Product patches `31-spec-9`/`31-spec-10`, on top of the
`31-plan-4` repair batch for `plan-review-31-3` (P31-01…P31-05) and the `31-plan-3`
re-cut the D-31-6 carrier ruling owed (`31-plan-1/2` superseded, never repaired).
The superseded sets are not repaired: `31-plan-1/2`'s carrier was prose recitation
plus a `PLANNING_PIN_TABLE` row floor, which the code carrier replaces;
`31-plan-3`'s wording-only identity check and sensor wiring did not survive
contact with the machine contract; and `31-plan-4`'s provenance paragraph and
`E-D31-18` prose are re-cut here, never preserved.

Plan provenance:

- Parent Product snapshot: `dd09372a28b2d2e824a53d2d28951e7ff24d1d43e9f873f250fc426faf757a2e`
  (`spec-review-31-11`), verified fresh against the bytes on disk at this
  re-derivation's Product-review gate (`pre-execution-snapshot.mjs verify --stage
  spec` → `current: true`, `structural.fresh: true`).
- Parent Product receipt: `spec-review-31-11` (14/14 checks, zero findings;
  `spec-product-v1` digest `e9ce9abfa9f931356adcbcda1e8efe308ffc4809b6b3afcbe2e28ff88ef07e02`,
  46362 bytes).
- Superseded plan-stage finding rows R31-01/R31-02/R31-03: resolved by the
  `31-plan-3` re-cut; F01/F02/F03 by `31-plan-2` (`planning-findings.md`).
- Plan-stage finding rows P31-01…P31-05 (`plan-review-31-3`, medium/medium/high/
  low/low): resolved in place by the `31-plan-4` repair batch; **P31-06**
  (`plan-review-31-3`, medium, `class: product`) resolved by this re-derivation
  once the Product patches `31-spec-9`/`31-spec-10` enumerated the code carriers it
  named (`planning-findings.md`).
- Frozen acceptance-manifest blob at this revision (`git hash-object`):
  `849af5ae7bccc7bc815d60d8ca2a9e0400161df9` (the `31-plan-4` blob was
  `650c7c8b21fdd6b7e2ec7b6c2c91672732201166`, the `31-plan-3` blob
  `3d7e7c9ee92314261e5529815c76b373e8ca2745`, the `31-plan-2` blob
  `d85e217acad1322d3caf4968715ef5d00e9189c0`; each re-cut re-froze the manifest
  because the moved parent changes the recorded lineage).

## P1 — Schema finding-record materiality

Layer: config/infra

The schema package's finding record becomes the carrier of the materiality
floor: the record gains the bounded `reproducer`, and the runtime predicate that
decides whether a PASS may coexist with a row becomes `medium`+. The severity
vocabulary, the receipt contract id and the freshness codes keep every value. The
package's own release record is owned by P4 with the other release records: the
canonical phase contract forbids a `config/infra` phase from carrying a `docs`
target (`scripts/phase-lint.mjs` `layerForTarget`), so the schema bump and its
`CHANGELOG.md` row cannot share a phase — the repo's `normative-drift` gate is
**expected red between this phase and P4**, this window is declared in
`known-issues.md`, and the enforcement points are P4's done-when (which closes it)
and AC10 at the PR head (P31-04).

- [ ] Add the bounded `reproducer` field to the finding-record spec in `packages/agentic-workflow-schema/src/pre-execution-contract.ts` — an optional `string` entry in `FINDING_SPEC.fields` with `minLength: 1`, `maxLength` from a new `PRE_EXECUTION_LIMITS.reproducerChars` limit and `nulFree: true`, plus the matching optional member on the `PreExecutionReviewFindingV1` interface.
- [ ] Rewrite the severity prose in `packages/agentic-workflow-schema/src/pre-execution-contract.ts` — the `PRE_EXECUTION_FINDING_SEVERITIES` comment and the `severity` field description state material = `medium`+, that `low` is a persisted report-note, and that `info` is immaterial, so no "only immaterial" phrasing survives anywhere in the package sources.
- [ ] Change the materiality predicate in `packages/agentic-workflow-schema/src/pre-execution.ts` to the `medium`+ line and restate the doc comment above `validatePreExecutionReceiptAgainstSnapshot` — a PASS may coexist with open/unverified `low` rows and is refused while any open/unverified `medium`+ row exists.
- [ ] Add the receipt vectors to `packages/agentic-workflow-schema/test/pre-execution-receipt.test.mjs`: a PASS carrying an open/unverified `low` row validates; the same PASS with an open/unverified `medium` row is refused with `verdict-mismatch`; a receipt whose findings carry no `reproducer` still validates, while a `reproducer` beyond the declared bound is refused.
- [ ] Regenerate the two pre-execution Draft-07 projections with the package's own generator run from the package root (`bun scripts/generate-pre-execution-schemas.mjs` writes them, and the `--check` form is the drift gate) so the committed projections carry `reproducer` and their `$comment` runtime-rule disclosure stays in sync.
- [ ] Bump the schema package to 4.3.0 in `packages/agentic-workflow-schema/package.json` — an additive minor: every enum value, the receipt contract id and the freshness vocabulary stay byte-identical.
- [ ] Run the package suite and the projection drift check green: `(cd packages/agentic-workflow-schema && bun run test && bun run check:pre-execution-schemas)` → exit 0.

Done-when: `(cd packages/agentic-workflow-schema && bun run test && bun run check:pre-execution-schemas)` → exit 0 with the materiality, `reproducer`-bound and back-compatibility vectors green and zero projection drift.

Phase-lint: PASS (8/8) · fingerprint `P1:config/infra:7:schema-finding-record-materiality`

## P2 — Transition-decider cap refusal

Layer: config/infra

The orchestrator's pure transition decider refuses to advance past the planning
loop's hard cap: after two consecutive unconverged review→repair→re-review
cycles, an invocation of `review-spec`/`review-plan` stops with a named reason
code and the human route, and a PASS resets the count. The count is derived from
the persisted receipts on every run through one shared pure helper — no new
store, no counter write — and reaches the consumer-side decider through the
sensor's envelope rather than by referencing the decider from the sensor
(feature 38 A:12).

- [ ] Add the optional derived cycle input to the decider's input type in `packages/agentic-workflow-schema/src/index.ts` — `WorkflowDecisionInput.reviewLoopCycles` as `{ spec?: number; plan?: number }`, documented as the consecutive-unconverged count the unit's stage receipts already carry.
- [ ] Add the cap-refusal stop code to `packages/agentic-workflow-schema/src/index.ts` — `WORKFLOW_DECISION_STOP_CODES` gains `stop-review-loop-cap` while every existing code value keeps its spelling.
- [ ] Implement the refusal in `packages/agentic-workflow-schema/src/index.ts` inside `decideWorkflowAction` — a `review-spec`/`review-plan` proposal whose stage count reaches two returns `kind: "stop"` with `intent: "ask-human"`, `reasonCode: "stop-review-loop-cap"` and the human route (`design-feature`) named in `detail`.
- [ ] Add the cap vector suite `packages/agentic-workflow-schema/test/workflow-decision-review-loop-cap.test.mjs` proving three behaviours: two consecutive unconverged cycles refuse a third `review-spec`/`review-plan` invocation; a PASS reset leaves the next cycle allowed; a `needs-design` outcome routes to `design-feature`.
- [ ] Pin the counting rule in the same vector suite: the count is the consecutive FAIL-verdict receipts for a stage since its last PASS-verdict receipt, and every other transition-table row keeps its behaviour.
- [ ] Add the shared pure helper `deriveReviewLoopCycles(receipts)` to `scripts/pre-execution-contract.mjs` — it applies the E3 rule to the rows `parseReceipts` already returns (consecutive FAIL verdicts per stage since that stage's last PASS; no receipt for a stage reads `0`), so the CLI, the sensor and the vectors cannot drift.
- [ ] Project the derived count in `scripts/workflow-status.mjs` into the envelope's existing free-form `detail` bag as `detail.review_loop_cycles = { spec, plan }`, recomputed on every run, and keep `decideWorkflowAction` absent from that script (feature 38 A:12, whose pinned assertion lives in the discipline suite — P3).
- [ ] Extend `scripts/workflow-status-pre-execution.test.mjs` with the cap-refusal emission case and run the suite green.

Done-when: `(cd packages/agentic-workflow-schema && bun run test) && bun test scripts/workflow-status-pre-execution.test.mjs` → exit 0 with the cap vectors and the emission/A:12 pins green.

Phase-lint: PASS (8/8) · fingerprint `P2:config/infra:8:transition-decider-cap-refusal`

## P3 — Snapshot wording-only route

Layer: config/infra

The snapshot verifier distinguishes a recorded wording-only movement from
material movement inside the closed freshness vocabulary: the author records the
determination in the unit's unbound `progress.md`, rotates the artifact revision,
and `verify` answers current while the acceptance fingerprint and the bound
authorities are unmoved. The branch sits before `stale-source-revision` (a moved
bound byte always rotates the revision), stays pure, and leaves every other
answer unchanged. No new freshness code, no new CLI flag, and the exit codes stay
0/1/3/4.

- [ ] Add the determination parser `parseWordingOnlyDeterminations` to `scripts/pre-execution-contract.mjs` — it reads the `## Wording-only determination v1 — <stage>` block's `Determination`, `Acceptance fingerprint` and `Intent and authority unchanged` lines from the unit's `progress.md`, the unbound record home E5 names (writing it into a bound artifact would rotate the revision it records).
- [ ] Add the wording-only branch to `attributeFreshness` in `scripts/pre-execution-snapshot.mjs`, placed **after the `stale-context` check and before the `stale-source-revision` check**, and fed by a `wordingOnly` input object rather than by file reads so the function stays pure: with bound artifact bytes moved and zero changed contexts, a matching determination (recorded revision equal to the snapshot's current `artifactRevisionId`, recorded acceptance fingerprint equal to the manifest's) answers fresh with the determination id named in `detail`.
- [ ] Enforce the rotation in `scripts/pre-execution-snapshot.mjs`: a movement without a matching determination answers fresh nowhere and **falls through unchanged** to the existing precedence (for moved bound bytes, `stale-source-revision`); a determination whose recorded revision differs from the snapshot's current one is likewise no match; a later material movement after an exempted one is refused because the recorded revision no longer matches (P31-01/P31-02).
- [ ] Read the acceptance fingerprint in the verify path of `scripts/pre-execution-snapshot.mjs` by fingerprinting the unit's acceptance manifest (`git hash-object docs/features/31-planning-review-materiality/ACCEPTANCE.md` is the form the CLI runs for its own unit) and fail closed when the manifest is absent, so the wording-only route is unavailable without a frozen manifest.
- [ ] Extend `scripts/pre-execution-attribution.test.mjs` with the wording-only vectors for all three outcomes — fresh with the recorded determination, the fall-through for material movement, and the fall-through when the determination is missing — and keep its dimension-by-dimension agreement with the schema comparator by passing no `wordingOnly` on those parity vectors.
- [ ] Extend `scripts/pre-execution-sensor.test.mjs` with the wording-only vectors and the `wording-only` anchor the acceptance criterion greps.
- [ ] Re-aim the planning-side pins in `scripts/review-loop-discipline.test.mjs` at the code carriers — the pin block reads the schema package's `medium`+ predicate, the CLI's verify report, the decider's refusal, the `detail.review_loop_cycles` projection in `scripts/workflow-status.mjs`, and that same script's continuing absence of `decideWorkflowAction` (feature 38 A:12) — and every existing assertion keeps its strength.

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
- [ ] Append the Jin & Chen bibliography entry under a bottom `## References` section of `README.md`. The schema package's 4.3.0 companion-table row lands in this phase with the other release records — it cannot live in P1, because `CHANGELOG.md` is a `docs` target and the phase contract forbids a `docs` target in the `config/infra` P1 — so the `normative-drift` window declared in `known-issues.md` closes at P4 (P31-04).

Done-when: `bun scripts/check-skill-context.mjs && bun test scripts/normative-drift.test.mjs && grep -n "third cycle never" skills/pre-execution-review/references/POLICY.md` → exit 0 with the four skill minor bumps landed, the release tables recomputed against the frontmatter, and the AC7 removal greps clean.

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
