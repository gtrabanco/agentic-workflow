# TASKS — 31-planning-review-materiality

Per-phase implementation checklist. Each phase is atomic, declares one layer, and
must satisfy its Done-when command before the phase commit. Artifact revision of
this plan set: **`31-plan-6`** (the repair batch for `plan-review-31-4`'s five
plan-class rows P31-07…P31-11, on top of the `31-plan-5` re-derivation that binds
the current Product receipt `spec-review-31-11` after the owner-commissioned
Product patches `31-spec-9`/`31-spec-10`, the `31-plan-4` repair batch for
`plan-review-31-3`, findings P31-01…P31-05, and the `31-plan-3` re-cut for the
D-31-6 code carrier; the `31-plan-1/2` set is superseded, never repaired). Tests
are written red-first where a test is the deliverable and fixed in code, never
weakened. One version bump per skill per PR (E-D31-1 in `decisions.md`).

## P1 — Schema finding-record materiality

Layer: config/infra · Done-when: `(cd packages/agentic-workflow-schema && bun run test && bun run check:pre-execution-schemas)` → exit 0 with the materiality, `reproducer`-bound and back-compatibility vectors green, zero projection drift, and the bumped version's two pins and published-limits walk green. The package's `CHANGELOG.md` row rides this bump (E-D31-26; the package suite's changelog-of-record check binds the row to the shipped version), so no `normative-drift` window exists to declare.

- [x] Add the bounded `reproducer` field to `FINDING_SPEC.fields` in `packages/agentic-workflow-schema/src/pre-execution-contract.ts` — optional `string`, `minLength: 1`, `maxLength: PRE_EXECUTION_LIMITS.reproducerChars`, `nulFree: true` — plus the matching optional member on the `PreExecutionReviewFindingV1` interface.
- [x] Add `reproducerChars: 1024` to `PRE_EXECUTION_LIMITS` in `packages/agentic-workflow-schema/src/pre-execution-contract.ts` so the bound is published rather than spelled in the field.
- [x] Rewrite the severity prose in `packages/agentic-workflow-schema/src/pre-execution-contract.ts` — the `PRE_EXECUTION_FINDING_SEVERITIES` comment and the `severity` field description state material = `medium`+, `low` = persisted report-note, `info` = immaterial — so `grep -rn "the only immaterial" packages/agentic-workflow-schema/src/` exits non-zero and the two fragments `material = `medium`` and `report-note` exist.
- [x] Change `const material = finding.severity !== "info"` in `packages/agentic-workflow-schema/src/pre-execution.ts` to the `medium`+ membership test and restate the doc comment above `validatePreExecutionReceiptAgainstSnapshot` (a PASS may coexist with open/unverified `low` rows; it is refused while any open/unverified `medium`+ row exists).
- [x] Add the receipt vectors to `packages/agentic-workflow-schema/test/pre-execution-receipt.test.mjs`: a PASS with an open/unverified `low` row validates; the same PASS with an open/unverified `medium` row is refused with `verdict-mismatch`; a receipt whose findings carry no `reproducer` still validates while a `reproducer` beyond `reproducerChars` is refused.
- [x] Regenerate the two pre-execution Draft-07 projections with the package's own generator run from the package root (`bun scripts/generate-pre-execution-schemas.mjs`; the `--check` form is the drift gate) so the committed projections carry `reproducer` and keep their `$comment` runtime-rule disclosure.
- [x] Bump the package to 4.3.0 in `packages/agentic-workflow-schema/package.json` (additive minor; every enum value, the receipt contract id and the freshness vocabulary keep their spelling), move the two version pins the bump reddens in the same commit — `test/release-contract.test.mjs` (`assert.equal(pkg.version, "4.2.0")`) and `test/verification-gates.test.mjs` (`assert.equal(manifest.version, "4.2.0")`) — and add the 4.3.0 row to `CHANGELOG.md` (E-D31-26: the package suite's changelog-of-record check binds the row to the shipped version).
- [x] Add the `reproducerChars 1024` entry to the `### Published limits` block of `packages/agentic-workflow-schema/README.md`, so the `test/pre-execution-docs.test.mjs` walk over `PRE_EXECUTION_LIMITS` finds the new key and its value inside the section.
- [x] Run the package suite and the projection drift check green: `(cd packages/agentic-workflow-schema && bun run test && bun run check:pre-execution-schemas)` → exit 0.

## P2 — Transition-decider cap refusal

Layer: config/infra · Done-when: `(cd packages/agentic-workflow-schema && bun run test) && bun test scripts/workflow-status-pre-execution.test.mjs` → exit 0 with the cap vectors and the emission case green.

- [x] Add the optional `reviewLoopCycles` input to `WorkflowDecisionInput` in `packages/agentic-workflow-schema/src/index.ts` as `{ spec?: number; plan?: number }`, documented as the consecutive-unconverged count derived from the unit's persisted stage receipts.
- [x] Add `stop-review-loop-cap` to `WORKFLOW_DECISION_STOP_CODES` in `packages/agentic-workflow-schema/src/index.ts` — the only added value; every existing sense, stop and invoke code keeps its spelling.
- [x] Implement the refusal in `decideWorkflowAction` (`packages/agentic-workflow-schema/src/index.ts`): a `review-spec`/`review-plan` proposal whose stage count reaches two returns `kind: "stop"`, `intent: "ask-human"`, `reasonCode: "stop-review-loop-cap"`, with the human route (`design-feature`) named in `detail`.
- [x] Add the vector suite `packages/agentic-workflow-schema/test/workflow-decision-review-loop-cap.test.mjs` proving three behaviours: two consecutive unconverged cycles refuse a third `review-spec`/`review-plan` invocation; a PASS reset leaves the next cycle allowed; a `needs-design` outcome routes to `design-feature`.
- [x] Pin the counting rule in the same vector suite: the count is the consecutive FAIL-verdict receipts for a stage since its last PASS-verdict receipt, and every other transition-table row keeps its behaviour.
- [x] Add the shared pure helper `deriveReviewLoopCycles(receipts)` to `scripts/pre-execution-contract.mjs`, applying the E3 rule to the rows `parseReceipts` already returns (consecutive FAIL verdicts per stage since that stage's last PASS; no receipt for a stage reads `0`).
- [x] Project the derived count in `scripts/workflow-status.mjs` into the envelope's existing free-form `detail` bag as `detail.review_loop_cycles = { spec, plan }`, recomputed on every run, and keep `decideWorkflowAction` absent from the script (feature 38 A:12).
- [x] Extend `scripts/workflow-status-pre-execution.test.mjs` with the cap-refusal emission case and run the suite green.

## P3 — Snapshot wording-only route

Layer: config/infra · Done-when: `bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs scripts/review-loop-discipline.test.mjs` → exit 0 with the wording-only vectors and the re-aimed code-carrier pins green.

- [ ] Add `parseWordingOnlyDeterminations(text)` to `scripts/pre-execution-contract.mjs` — one parser for the `## Wording-only determination v1 — <stage>` block's `Determination`, `Acceptance fingerprint` and `Intent and authority unchanged` lines, read from the unit's unbound `progress.md` (the home E5 names) and shared by the CLI and the sensor.
- [ ] Add the wording-only branch to `attributeFreshness` in `scripts/pre-execution-snapshot.mjs`, placed **after the `stale-context` check and before the `stale-source-revision` check**, fed by a `wordingOnly` input object (never by file reads, so the function stays pure): with bound artifact bytes moved and zero changed context authorities, a matching determination — recorded revision equal to the snapshot's current `artifactRevisionId`, recorded acceptance fingerprint equal to the manifest's — answers fresh with the determination id named in `detail`.
- [ ] Enforce the rotation in `scripts/pre-execution-snapshot.mjs`: a movement without a matching determination answers fresh nowhere — it falls through unchanged to the existing precedence (for moved bound bytes, `stale-source-revision`) — and a determination whose recorded revision differs from the snapshot's current one is likewise no match, so a later material movement after an exempted one is refused.
- [ ] Read the acceptance fingerprint in the verify path of `scripts/pre-execution-snapshot.mjs` by fingerprinting the unit's acceptance manifest (`git hash-object docs/features/31-planning-review-materiality/ACCEPTANCE.md` is the form the CLI runs) and fail closed when the manifest is absent, so the route is unavailable without a frozen manifest.
- [ ] Extend `scripts/pre-execution-attribution.test.mjs` with the wording-only vectors for all three outcomes — fresh with the recorded determination, the fall-through on material movement, and the fall-through when the determination is missing — and pass no `wordingOnly` on its parity vectors so the dimension-by-dimension agreement with the schema comparator is unchanged.
- [ ] Extend `scripts/pre-execution-sensor.test.mjs` with the wording-only vectors and the `wording-only` anchor the acceptance criterion greps.
- [ ] Re-aim the planning-side pins in `scripts/review-loop-discipline.test.mjs` at the code carriers — the pin block reads the schema package's `medium`+ predicate, the CLI's verify report, the decider's refusal, the `detail.review_loop_cycles` projection in `scripts/workflow-status.mjs`, and that same script's absence of `decideWorkflowAction` (feature 38 A:12) — while every existing assertion keeps its strength.

## P4 — Skill-reference prose shrink

Layer: docs · Done-when: `bun scripts/check-skill-context.mjs && bun test scripts/normative-drift.test.mjs && grep -n "third cycle never" skills/pre-execution-review/references/POLICY.md` → exit 0 with the four skill minor bumps landed, the release tables recomputed against the frontmatter, and the AC7 removal greps clean. This phase closes the `normative-drift` window P1 opened by landing the schema package's 4.3.0 row (P31-04).

- [ ] Rewrite `skills/pre-execution-review/references/LEDGERS.md` §3: drop "`info` is the only immaterial one"; state material = `medium`+, the `low` report-note persistence contract (persisted, visible, non-blocking, resolved by the stage author without a re-review), the anti-deflation carry-over, and the restated PASS-coexistence sentence.
- [ ] Rewrite the findings-assembly paragraph in `skills/review-spec/references/CHECKS.md` and `skills/review-plan/references/CHECKS.md`: replace "Material = anything above `info`" with material = `medium`+ plus the report-note sentence and the anti-deflation sentence, keeping each closed severity vocabulary list byte-identical and the pinned sentence byte-identical — `scripts/pre-execution-quality.test.mjs` matches its two-line pairing (the line ending `carry an open`, then the line starting `unverified material row`) verbatim, so neither the words nor the break point moves (AC10).
- [ ] Rewrite §3 of `skills/pre-execution-review/references/POLICY.md`: preserve the default batch consequence — one re-review of the freshly rotated snapshot after the batch — while deleting the exact phrase AC7's re-review removal grep over `skills/pre-execution-review/references/POLICY.md` names (that grep must exit non-zero at the PR head), remove the every-batch re-review mandate sentence, and add the wording-only exemption with the determination record's block shape and the non-skippable revision rotation.
- [ ] Rewrite §4 of `skills/pre-execution-review/references/POLICY.md`: remove the three unbounded-cycle sentences, keep the `CONVERGENCE-ANOMALY` block byte-identical, and author the remainder — the hard two-cycle cap, the `third cycle never` starts without explicit user instruction rule, and the unconverged end in `needs-design` where the stage sanctions it plus the decider's `stop-review-loop-cap` refusal and `design-feature` route at the plan stage.
- [ ] Extend the loop text in `skills/review-spec/references/OUTPUT.md` and `skills/review-plan/references/OUTPUT.md`: remove the re-review-for-every-batch sentences from both verdict tables and both closing hand-off blocks, add the cap mirror, and keep every receipt-literal line and verdict block byte-identical.
- [ ] Rewrite §4 of `skills/design-feature/references/REPAIR.md`: remove both unbounded-cycle sentences and add the cap mirror, preserving the §4 heading and the anomaly-first ordering.
- [ ] Run the repository's `bump-skill` procedure for the four touched skills (`skills/pre-execution-review/SKILL.md`, `skills/review-spec/SKILL.md`, `skills/review-plan/SKILL.md`, `skills/design-feature/SKILL.md`) — minor bumps, one row per skill in `CHANGELOG.md` and accurate README skill cells.
- [ ] Append the Jin & Chen bibliography entry under a bottom `## References` section of `README.md` (created there if absent, deduped against other features' entries). The schema package's 4.3.0 companion-table row already landed with the bump in P1 (E-D31-26).

## P5 — Hardening & PR

Layer: hardening · Done-when: `bun test scripts/review-loop-discipline.test.mjs` → exit 0 at the terminal HEAD with the whole ladder green, parity green and the PR URL printed.

- [ ] Run the full acceptance ladder at the terminal HEAD and record every exit line — the root suites (`bun test scripts/pre-execution-sensor.test.mjs scripts/pre-execution-attribution.test.mjs scripts/review-loop-discipline.test.mjs scripts/ledger-ownership.test.mjs scripts/pre-execution-quality.test.mjs scripts/ledger-provenance.test.mjs scripts/normative-drift.test.mjs scripts/workflow-status-pre-execution.test.mjs`), the schema package gate (`bun run gate:pre-execution` from the package root) and the budget gate (`bun scripts/check-skill-context.mjs`) → exit 0 across the ladder.
- [ ] Run the plan-layer linter over the unit's plan (`bun scripts/phase-lint.mjs docs/features/31-planning-review-materiality/PLAN.md`) → exit 0 with a PASS verdict and all five fingerprints, pasted verbatim into the phase entry.
- [ ] Re-bundle the Pi mirror after the last skill edit (`bun run bundle:skills` from the Pi package root) and run the package suite (`bun run test` from the same root) → exit 0 with the mirror byte-identical to the canonical skill tree.
- [ ] Record the three read-verified walks in the phase entry — the additive-release vocabulary diff, the PR-diff scope against the three declared groups, and the no-weakening discipline-suite diff.
- [ ] Verify the frozen acceptance manifest (`git hash-object docs/features/31-planning-review-materiality/ACCEPTANCE.md`) still equals the receipt blob and append the acceptance receipt to the unit progress ledger.
- [ ] Confirm every phase fingerprint recorded in `PLAN.md` still matches the committed phase shapes and that each read-verified obligation row carries its evidence entry (manual).
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push
