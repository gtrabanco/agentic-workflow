# TASKS — 59-executable-continuations

Per-phase checklists mirroring `PLAN.md` (fingerprints recorded there). The
frozen finish line is `ACCEPTANCE.md`; obligations ledger is
`planning-obligations.md`. Command-checkable acceptance is expressed as the
command; judgment-only checks are labelled `read-verified`.

## P1 — Envelope continuation schema

Layer: config/infra · fingerprint `P1:config/infra:7:envelope-continuation-schema`
· Phase-lint: PASS (8/8)

- [ ] Extend the `EnvelopeNext` interface in `packages/agentic-workflow-schema/src/index.ts` with the optional `continuation` object — required `argv` (string array), required `convergence` (string), required `preconditions` (object array), optional `rendering` (string), optional `evidence` (object) — and extend the `next` block of `packages/agentic-workflow-schema/envelope.schema.json` with the same optional property so schema-validated envelopes accept it
- [ ] Export the closed refusal vocabulary const `CONTINUATION_REFUSALS` (the four codes frozen in the SPEC: `precondition-uncheckable`, `rendering-failed`, `no-decision-available`, `sensor-degraded`) plus its typed refusal type from `packages/agentic-workflow-schema/src/index.ts`
- [ ] Implement the pure emitter API in `packages/agentic-workflow-schema/src/index.ts` — input is the already-resolved command string plus the unit context; the emitter parses argv, evaluates each precondition, derives the rendering, and returns the continuation object with a typed refusal on every failure path; it fabricates nothing and persists nothing
- [ ] Add the canonical continuation vectors under `packages/agentic-workflow-schema/src/` following the frozen `PRE_EXECUTION_CANONICAL_VECTORS` pattern, plus the package-suite cases: an envelope without the field validates, a valid object validates, and the fail-closed cases (missing `argv`, empty `convergence`, non-string-array `argv`, non-object precondition) refuse with typed errors
- [ ] Add the evidence-token digest cases to the package suite using the shipped `sha256HexSync` helpers from `packages/agentic-workflow-schema/src/sha256.ts` — the token hash equals the referenced artifact digest, a mismatched digest fails the receiver check, nothing is persisted
- [ ] Bump the package to 4.2.0 in `packages/agentic-workflow-schema/package.json` (additive minor, no major), record the row in the repo `CHANGELOG.md`, and state the additive guarantee (envelopes without the field stay valid) in the package README
- [ ] Run the package suite green: `bun run test` in the package directory → exit 0

Done-when: `bun run test` in the schema package → exit 0 with the backward-compat, valid-object, fail-closed, vector, and digest pins green.

## P2 — Sensor continuation emission

Layer: config/infra · fingerprint `P2:config/infra:8:sensor-continuation-emission`
· Phase-lint: PASS (8/8)

- [ ] Wire the schema emitter into the next assembly in `scripts/workflow-status.mjs` — for non-terminal states the resolved command string is parsed into `next.continuation` (argv, rendering, preconditions, evidence, convergence) at the `resolveNext()`/attach points (`:961-1004`, `:1192`)
- [ ] Implement the four fail-closed refusal paths in `scripts/workflow-status.mjs` — an uncheckable precondition, a rendering failure, no available decision, and a degraded sensor each suppress the `continuation` field entirely and emit only the mapped refusal code in `detail`
- [ ] Implement the offline path in `scripts/workflow-status.mjs` — forge state unavailable at emit time maps to the `sensor-degraded` refusal, never a guessed command, keeping the sensor's degrade-not-fail exit contract
- [ ] Bind the evidence token in `scripts/workflow-status.mjs` — the token carries the referenced receipt digest computed through the schema package's sha256 helpers; the receiver re-derives it and a mismatch fails verification
- [ ] Extend `scripts/workflow-status-sensor.test.mjs` with the emission pins — a non-terminal fixture yields well-formed argv; each refusal fixture yields no `continuation` key plus a closed-vocabulary code; the offline fixture yields the refusal
- [ ] Create `scripts/continuation-discipline.test.mjs` — one git fixture repo per class (status refresh, planning-gate re-run, review-receipt refresh) proving the emitted command parses, its preconditions are checkable at emit time, and executing it exactly as emitted advances the named `convergence` field
- [ ] Pin the rendering-derivation cases in `scripts/continuation-discipline.test.mjs` — rendering derivable from argv per platform family, argv never altered by rendering, a forced divergence fails the suite
- [ ] Run both suites green: `node --test scripts/workflow-status-sensor.test.mjs scripts/continuation-discipline.test.mjs` → exit 0

Done-when: `node --test scripts/workflow-status-sensor.test.mjs scripts/continuation-discipline.test.mjs` → exit 0 with the emission, refusal, offline, digest, per-class discipline, and rendering pins green.

## P3 — Quote-surface adoption

Layer: docs · fingerprint `P3:docs:7:quote-surface-adoption` · Phase-lint: PASS (8/8)

- [ ] State the quote rule in `skills/workflow-status/SKILL.md` at the next-command echo — quote the emitted `next.continuation` (rendering for display), never author exact tokens; the human-facing rendered `→ Next:` block stays
- [ ] Re-point the stale-receipt re-run route in `skills/workflow-status/references/PRE_EXECUTION.md` — the `stale` label row and its re-run sentence quote the emitted planning-gate re-run continuation instead of authoring the command prose
- [ ] Re-point the three receipt-persistence surfaces — `skills/review-spec/references/OUTPUT.md`, `skills/review-plan/references/OUTPUT.md`, `skills/review-change/references/PERSIST_AND_DECIDE.md` quote the emitted review-receipt-refresh continuation instead of authoring exact tokens
- [ ] Add exactly one quote-rule pointer to `docs/workflow/FEATURE_WORKFLOW.md` hand-off section — prose `→ Next:` blocks remain for humans
- [ ] Add the refusal-vocabulary row to the `normative-surfaces@1` table in `CLAUDE.md` (grammar `schema-export:CONTINUATION_REFUSALS`, machine `continuation-refusal-type`, must-name `yes`) and declare the `schema-export:` grammar extractor for the drift gate in `scripts/normative-drift.test.mjs` as one atomic deliverable
- [ ] Extend the `hand-off-fields@1` block in `skills/orchestration-envelope/references/TURN_CONTRACT.md` with the `next | continuation` row
- [ ] Run the drift gate green: `node --test scripts/normative-drift.test.mjs` → exit 0

Done-when: `node --test scripts/normative-drift.test.mjs` → exit 0 with the refusal-vocabulary row and the hand-off-fields row resolved by the gate.

## P4 — Batched design interview

Layer: docs · fingerprint `P4:docs:7:batched-design-interview` · Phase-lint: PASS (8/8)

- [ ] Rewrite `skills/design-feature/references/INTERVIEW.md` §3 with the bounded form protocol — one compact form-turn over the six fixed rubric slots, each carrying a recommended default the user accepts with one word, with at most 2 follow-up turns for genuine ambiguity
- [ ] Delete the superseded one-question-per-turn rule from `skills/design-feature/references/INTERVIEW.md` — no second live protocol remains beside the form-turn
- [ ] Restate the unchanged interview semantics in `skills/design-feature/references/INTERVIEW.md` — the vagueness rubric (six fixed slots), the mandatory-question rule, and the ask-nothing-the-docs-answer rule carry over verbatim, as do the deferred-decision and `NEEDS_INPUT` escalation behaviors
- [ ] Update `skills/design-feature/SKILL.md` step 3 and the progressive-loading table to describe the form protocol (batch turn + ≤ 2 follow-ups) with the upsert mode and review mode text untouched
- [ ] Update the golden-fixture expectations in `docs/workflow/GOLDEN_FIXTURE.md` — the fixed pass criteria gain the form-turn shape boxes per the file's own add-don't-replace rule; the run-log table stays unchanged
- [ ] Re-base the touched skills' budget entries in `docs/workflow/SKILL_CONTEXT_BUDGETS.json` via the tool's own declared re-basis (`ceil(measured × 1.10)`, growth source named in `policy.declared`)
- [ ] Run the budget gate green: `node scripts/check-skill-context.mjs` → exit 0

Done-when: `node scripts/check-skill-context.mjs` → exit 0 after the declared re-basis with the form-protocol text landed in both design-feature files.

## P5 — Hardening & PR

Layer: hardening · fingerprint `P5:hardening:8:hardening-pr` · Phase-lint: PASS (8/8)

- [ ] Run the full verification ladder — root suites (`node --test scripts/continuation-discipline.test.mjs scripts/workflow-status-sensor.test.mjs scripts/normative-drift.test.mjs`), the schema package suite (`bun run test` in the package directory), the budget gate (`node scripts/check-skill-context.mjs`) → exit 0 across the ladder
- [ ] Re-bundle the Pi mirror from the final skill tree via the package's own bundle script and run the parity suite (`npm run bundle:skills` then `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`) → exit 0
- [ ] Verify the additive-release evidence — `node -p "require('./packages/agentic-workflow-schema/package.json').version"` prints 4.2.0, and the CHANGELOG row plus the additive-guarantee sentence are present (read-verified)
- [ ] Verify the frozen acceptance manifest blob is unchanged and record the acceptance receipt (`git hash-object docs/features/59-executable-continuations/ACCEPTANCE.md`) in the unit's progress log
- [ ] Confirm every phase fingerprint above still matches the plan's committed phase shapes and that every read-verified row has its evidence recorded (manual)
- [ ] open the PR (`gh pr create --body-file <path>` — body written as a Markdown file, real backticks, never inline `--body`/heredoc that leaves `\`-escaped backticks) and PRINT THE PR URL in the chat
- [ ] update the roadmap row to `done · [#<pr>](<pr-url>)`
- [ ] commit `docs: link PR #<n>` and push

Done-when: `node --test scripts/continuation-discipline.test.mjs` → exit 0 with the whole ladder green, parity green, and the PR URL printed.
