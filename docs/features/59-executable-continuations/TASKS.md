# TASKS — 59-executable-continuations

Per-phase checklists mirroring `PLAN.md` (fingerprints recorded there). The
frozen finish line is `ACCEPTANCE.md`; obligations ledger is
`planning-obligations.md`. Command-checkable acceptance is expressed as the
command; judgment-only checks are labelled `read-verified`.

## P1 — Envelope continuation schema

Layer: config/infra · fingerprint `P1:config/infra:7:envelope-continuation-schema`
· Phase-lint: PASS (8/8)

- [x] Extend the `EnvelopeNext` interface in `packages/agentic-workflow-schema/src/index.ts` with the optional `continuation` object — required `argv` (string array), required `convergence` (string), required `preconditions` (object array), optional `rendering` (string), optional `evidence` (object) — and extend the `next` block of `packages/agentic-workflow-schema/envelope.schema.json` with the same optional property so schema-validated envelopes accept it — evidence: `src/continuation.ts` (`EnvelopeContinuation`), `src/index.ts` (`EnvelopeNext.continuation` + `rejectUnexpectedEnvelopeKeys` allow-list), `envelope.schema.json` (`next.properties.continuation`)
- [x] Export the closed refusal vocabulary const `CONTINUATION_REFUSALS` (the four codes frozen in the SPEC: `precondition-uncheckable`, `rendering-failed`, `no-decision-available`, `sensor-degraded`) plus its typed refusal type from `packages/agentic-workflow-schema/src/index.ts` — evidence: `src/continuation.ts` (`CONTINUATION_REFUSALS`, `ContinuationRefusalCode`), re-exported from `src/index.ts`; pinned by `test/continuation.test.mjs` "CONTINUATION_REFUSALS is the frozen four-code closed vocabulary"
- [x] Implement the pure emitter API in `packages/agentic-workflow-schema/src/index.ts` — input is the already-resolved command string plus the unit context; the emitter parses argv, evaluates each precondition, derives the rendering, and returns the continuation object with a typed refusal on every failure path; it fabricates nothing and persists nothing — evidence: `src/continuation.ts` (`emitContinuation`); pinned by the emitter cases in `test/continuation.test.mjs`
- [x] Add the canonical continuation vectors under `packages/agentic-workflow-schema/src/` following the frozen `PRE_EXECUTION_CANONICAL_VECTORS` pattern, plus the package-suite cases: an envelope without the field validates, a valid object validates, and the fail-closed cases (missing `argv`, empty `convergence`, non-string-array `argv`, non-object precondition) refuse with typed errors — evidence: `src/continuation-vectors.ts` + `test/fixtures/continuation-vectors.mjs`; cases "the published continuation vectors reproduce from the literal fixtures", "an envelope without next.continuation stays valid (additive minor)", "an envelope with a valid next.continuation validates under both entry points", and the ten fail-closed shape cases
- [x] Add the evidence-token digest cases to the package suite using the shipped `sha256HexSync` helpers from `packages/agentic-workflow-schema/src/sha256.ts` — the token hash equals the referenced artifact digest, a mismatched digest fails the receiver check, nothing is persisted — evidence: `verifyContinuationEvidence` in `src/continuation.ts`; cases "the evidence token's hash equals the referenced artifact digest" and "the receiver check fails on a mismatched digest and persists nothing"
- [x] Bump the package to 4.2.0 in `packages/agentic-workflow-schema/package.json` (additive minor, no major), record the row in the repo `CHANGELOG.md`, and state the additive guarantee (envelopes without the field stay valid) in the package README — evidence: `package.json` version 4.2.0, `CHANGELOG.md` 4.2.0 row with the additive-guarantee sentence, `README.md` §"Additive guarantee — `next.continuation`" (E-59-7 records the two release-test version pins updated with the bump)
- [x] Run the package suite green: `bun run test` in the package directory → exit 0 — evidence: `cd packages/agentic-workflow-schema && bun run test` exit 0, 707 pass / 0 fail

Done-when: `bun run test` in the schema package → exit 0 with the backward-compat, valid-object, fail-closed, vector, and digest pins green.

## P2 — Sensor continuation emission

Layer: config/infra · fingerprint `P2:config/infra:8:sensor-continuation-emission`
· Phase-lint: PASS (8/8)

- [x] Wire the schema emitter into the next assembly in `scripts/workflow-status.mjs` — for non-terminal states the resolved command string is parsed into `next.continuation` (argv, rendering, preconditions, evidence, convergence) at the `resolveNext()`/attach points (`:961-1004`, `:1192`) — evidence: `resolveNext()` now tags its branch, `buildContinuation()` calls the runtime's `emitContinuation`; `scripts/workflow-status-sensor.test.mjs` "59: a non-terminal fixture unit emits a well-formed continuation"
- [x] Implement the four fail-closed refusal paths in `scripts/workflow-status.mjs` — an uncheckable precondition, a rendering failure, no available decision, and a degraded sensor each suppress the `continuation` field entirely and emit only the mapped refusal code in `detail` — evidence: `buildContinuation()` refusal branches; sensor pins "uncheckable precondition", "empty state", "unknown class", "offline forge"
- [x] Implement the offline path in `scripts/workflow-status.mjs` — forge state unavailable at emit time maps to the `sensor-degraded` refusal, never a guessed command, keeping the sensor's degrade-not-fail exit contract — evidence: `forge.available === false` → `sensor-degraded`; sensor pin "59: offline forge state refuses with sensor-degraded" (exit 0)
- [x] Bind the evidence token in `scripts/workflow-status.mjs` — the token carries the referenced receipt digest computed through the schema package's sha256 helpers; the receiver re-derives it and a mismatch fails verification — evidence: `evidence = { artifact: <unitDir>/progress.md, digest: schema.sha256HexSync(progressText) }`; discipline suite `assertPreconditionsCheckable` re-derives with `verifyContinuationEvidence`
- [x] Extend `scripts/workflow-status-sensor.test.mjs` with the emission pins — a non-terminal fixture yields well-formed argv; each refusal fixture yields no `continuation` key plus a closed-vocabulary code; the offline fixture yields the refusal; the empty-state fixture (roadmap with no startable unit) yields no `continuation` field and exit 0, and the concurrent-emit fixture (two consecutive runs on the same tree) yields byte-identical envelopes with no continuation store (D-59-9) — evidence: the six `59:` cases in `scripts/workflow-status-sensor.test.mjs`
- [x] Create `scripts/continuation-discipline.test.mjs` — one git fixture repo per class (status refresh, planning-gate re-run, review-receipt refresh) proving the emitted command parses, its preconditions are checkable at emit time, and executing it exactly as emitted advances the named `convergence` field — evidence: the three `class …` cases in `scripts/continuation-discipline.test.mjs`
- [x] Pin the rendering-derivation cases in `scripts/continuation-discipline.test.mjs` — rendering derivable from argv per platform family, argv never altered by rendering, a forced divergence fails the suite — evidence: the two rendering cases in `scripts/continuation-discipline.test.mjs`
- [x] Run both suites green: `node --test scripts/workflow-status-sensor.test.mjs scripts/continuation-discipline.test.mjs` → exit 0 — evidence: exit 0, 67 pass / 0 fail; full root suite `node --test scripts/*.test.mjs` 435 pass / 0 fail

Done-when: `node --test scripts/workflow-status-sensor.test.mjs scripts/continuation-discipline.test.mjs` → exit 0 with the emission, refusal, offline, empty-state, concurrent-emit idempotence, digest, per-class discipline, and rendering pins green.

## P3 — Quote-surface adoption

Layer: docs · fingerprint `P3:docs:7:quote-surface-adoption` · Phase-lint: PASS (8/8)

- [x] State the quote rule in `skills/workflow-status/SKILL.md` at the next-command echo — quote the emitted `next.continuation` (rendering for display), never author exact tokens; the human-facing rendered `→ Next:` block stays — evidence: the Done-when bullet quoted in the P3 handoff
- [x] Re-point the stale-receipt re-run route in `skills/workflow-status/references/PRE_EXECUTION.md` — the `stale` label row and its re-run sentence quote the emitted planning-gate re-run continuation instead of authoring the command prose — evidence: both sentences quoted in the P3 handoff
- [x] Re-point the three receipt-persistence surfaces — `skills/review-spec/references/OUTPUT.md`, `skills/review-plan/references/OUTPUT.md`, `skills/review-change/references/PERSIST_AND_DECIDE.md` quote the emitted review-receipt-refresh continuation instead of authoring exact tokens — evidence: each sentence quoted in the P3 handoff
- [x] Add exactly one quote-rule pointer to `docs/workflow/FEATURE_WORKFLOW.md` hand-off section — prose `→ Next:` blocks remain for humans — evidence: pointer quoted in the P3 handoff; `grep -c 'next.continuation'` → 1
- [x] Add the refusal-vocabulary row to the `normative-surfaces@1` table in `CLAUDE.md` (grammar `schema-export:CONTINUATION_REFUSALS`, machine `continuation-refusal-type`, must-name `yes`) and declare the `schema-export:` grammar extractor for the drift gate in `scripts/normative-drift.test.mjs` as one atomic deliverable — evidence: `CLAUDE.md` row + the `schema-export:` branch in `buildSurfaceModel`; drift gate green (17 pass)
- [x] Extend the `hand-off-fields@1` block in `skills/orchestration-envelope/references/TURN_CONTRACT.md` with the `next | continuation` row — **landed in P2 (E-59-10)** because P2's envelope key cannot land without it (the drift gate reads the contract as the key's ordering surface); evidence: `TURN_CONTRACT.md` row + P2 commit `ee1008ab`
- [x] Run the drift gate green: `node --test scripts/normative-drift.test.mjs` → exit 0 — evidence: exit 0, 17 pass / 0 fail

Done-when: `node --test scripts/normative-drift.test.mjs` → exit 0 with the refusal-vocabulary row and the hand-off-fields row resolved by the gate.

## P4 — Batched design interview

Layer: docs · fingerprint `P4:docs:7:batched-design-interview` · Phase-lint: PASS (8/8)

- [x] Rewrite `skills/design-feature/references/INTERVIEW.md` §3 with the bounded form protocol — one compact form-turn over the six fixed rubric slots, each carrying a recommended default the user accepts with one word, with at most 2 follow-up turns for genuine ambiguity — evidence: the §3 text quoted in the P4 handoff
- [x] Delete the superseded one-question-per-turn rule from `skills/design-feature/references/INTERVIEW.md` — no second live protocol remains beside the form-turn — evidence: `grep -c 'One question per turn'` → 0
- [x] Restate the unchanged interview semantics in `skills/design-feature/references/INTERVIEW.md` — the vagueness rubric (six fixed slots), the mandatory-question rule, and the ask-nothing-the-docs-answer rule carry over verbatim, as do the deferred-decision and `NEEDS_INPUT` escalation behaviors — evidence: the six slots, mandatory-question rule, and escalation paragraph carried verbatim in §3
- [x] Update `skills/design-feature/SKILL.md` step 3 and the progressive-loading table to describe the form protocol (batch turn + ≤ 2 follow-ups) with the upsert mode and review mode text untouched — evidence: hard-stop paragraph + progressive-loading row quoted in the P4 handoff; upsert/review rows untouched
- [x] Update the golden-fixture expectations in `docs/workflow/GOLDEN_FIXTURE.md` — the fixed pass criteria gain the form-turn shape boxes per the file's own add-don't-replace rule; the run-log table stays unchanged — evidence: the new "Form-turn shape (`design-feature`) — add-don't-replace" subsection; run-log table untouched
- [x] Re-base the touched skills' budget entries in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` via the tool's own declared re-basis (`ceil(measured × 1.10)`, growth source named in `policy.declared`) — evidence: `design-feature:product` 16731→16914/1154→1163 and `design-feature:repair` 27188→27371/1829→1837, `sources` + `policy.declared` updated (the `design-feature` skill entry stayed under its 3400 ceiling)
- [x] Run the budget gate green: `node scripts/check-skill-context.mjs` → exit 0 — evidence: exit 0, PASS context budgets: 40 skills; `--routes` PASS 22 routes; full root suite 435 pass / 0 fail

Done-when: `node scripts/check-skill-context.mjs` → exit 0 after the declared re-basis with the form-protocol text landed in both design-feature files.

## P5 — Hardening & PR

Layer: hardening · fingerprint `P5:hardening:8:hardening-pr` · Phase-lint: PASS (8/8)

- [x] Run the full verification ladder — root suites (`node --test scripts/continuation-discipline.test.mjs scripts/workflow-status-sensor.test.mjs scripts/normative-drift.test.mjs`), the schema package suite (`bun run test` in the package directory), the budget gate (`node scripts/check-skill-context.mjs`) → exit 0 across the ladder — evidence: 84/84 root, 707/707 schema, budgets PASS; whole root suite 435/435
- [x] Re-bundle the Pi mirror from the final skill tree via the package's own bundle script and run the parity suite (`npm run bundle:skills` then `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`) → exit 0 — evidence: 39 skills / 125 files bundled; parity 7/7; full pi suite 214/214
- [x] Verify the additive-release evidence — `node -p "require('./packages/agentic-workflow-schema/package.json').version"` prints 4.2.0, and the CHANGELOG row plus the additive-guarantee sentence are present (read-verified) — evidence: version `4.2.0`; `CHANGELOG.md` 4.2.0 row; `packages/agentic-workflow-schema/README.md` additive-guarantee section
- [x] Verify the frozen acceptance manifest blob is unchanged and record the acceptance receipt (`git hash-object docs/features/59-executable-continuations/ACCEPTANCE.md`) in the unit's progress log — evidence: blob `d046f0b537da92251c6d81893e816bbc0de1a252`, unchanged since freeze; receipt recorded in `progress.md`
- [x] Confirm every phase fingerprint above still matches the plan's committed phase shapes and that every read-verified row has its evidence recorded (manual) — evidence: `phase-lint` verdict PASS (8/8 × 5), whole-set fingerprint `1a3bf148…` unchanged; each read-verified row quoted in its phase handoff
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push

Done-when: `node --test scripts/continuation-discipline.test.mjs` → exit 0 with the whole ladder green, parity green, and the PR URL printed.
