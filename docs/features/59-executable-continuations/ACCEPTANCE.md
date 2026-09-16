# Acceptance manifest v1 — 59-executable-continuations

Status: frozen

Frozen 2026-09-16 by `plan-feature-scaffold` from the SPEC's acceptance criteria
AC1…AC12. One stable ID per SPEC criterion; validators copied from the criteria.
The manifest is the implementation/review finish line, not a second
specification; the executor may strengthen coverage but never move it.

| ID | Required outcome | Validator |
|---|---|---|
| AC-01 | Schema suite green: an Envelope without `next.continuation` validates (backward compat); a valid `next.continuation` validates; invalid shapes (missing `argv`, empty `convergence`, non-string-array `argv`, non-object precondition) fail closed with typed errors; published test vectors for the canonical object | `cd packages/agentic-workflow-schema && bun run test` (node fallback: `npm test`) → exit 0 with the continuation, backward-compat, fail-closed, and vector pins green |
| AC-02 | Emission/refusal suite green: a non-terminal fixture unit yields `next.continuation` with well-formed argv; an uncheckable precondition or a rendering failure yields NO continuation field plus a refusal code from the closed vocabulary; offline gh state yields the refusal, never a guessed command | `node --test scripts/workflow-status-sensor.test.mjs` → exit 0 with the emission/refusal/offline pins green |
| AC-03 | Per-class discipline suite green: for each of the 3 classes (status refresh · planning-gate re-run · review-receipt refresh) a fixture repo proves the emitted command parses (argv well-formed), preconditions are checkable at emit time, and executing it exactly as emitted advances the named `convergence` field | `node --test scripts/continuation-discipline.test.mjs` → exit 0 (3 classes × parse/precondition/convergence) |
| AC-04 | Evidence-token digest test green: the token's hash equals the referenced receipt/report digest; a mismatched digest fails verification (receiver-side check, nothing persisted) | `cd packages/agentic-workflow-schema && bun run test` → exit 0 including the digest-equality and mismatch-fails cases; receiver-side case green in `node --test scripts/continuation-discipline.test.mjs` |
| AC-05 | Rendering-derivation test green: `rendering` is derivable from `argv` per platform family; `argv` is never altered by rendering; a forced divergence fails the test | `node --test scripts/continuation-discipline.test.mjs` → exit 0 including the derivation, argv-immutability, and divergence-fails cases |
| AC-06 | Normative drift gate green with the new normative-surfaces row (refusal vocabulary: grammar `schema-export:CONTINUATION_REFUSALS`, machine `continuation-refusal-type`, must-name `yes`) and the `hand-off-fields@1` row (`next \| continuation`) present in `TURN_CONTRACT.md`/`CLAUDE.md` | `node --test scripts/normative-drift.test.mjs` → exit 0; `grep -c 'continuation-refusal-type' CLAUDE.md` ≥ 1; `grep -c 'next | continuation' skills/orchestration-envelope/references/TURN_CONTRACT.md` ≥ 1 |
| AC-07 | Additive-minor release evidence: schema package version prints the next minor (4.2.0; ≥ current major.minor+0.1, no major bump); read-verified: `CHANGELOG.md` carries the row and the schema package's policy docs state the additive guarantee | `node -p "require('./packages/agentic-workflow-schema/package.json').version"` prints 4.2.0; read-verified: CHANGELOG row + additive-guarantee sentence quoted in the phase handoff |
| AC-08 | `INTERVIEW.md` §3 carries the bounded form protocol — one form-turn over the ≤ 6 fixed slots, each with a recommended default, ≤ 2 ambiguity follow-up turns; the vagueness rubric, the mandatory-question rule, and "ask nothing the docs or instruction already answer" are restated unchanged; the superseded one-question-per-turn rule is gone (no forked second protocol) | read-verified: §3 text quoted in the phase handoff AND `grep -c 'One question per turn' skills/design-feature/references/INTERVIEW.md` → 0 |
| AC-09 | `design-feature/SKILL.md` step 3 and the progressive-loading table describe the form protocol (batch turn + ≤ 2 follow-ups) and keep the upsert/review modes untouched | read-verified: both sections quoted in the phase handoff; upsert/review mode text unchanged in the PR diff |
| AC-10 | The quote rule is stated at the consuming surfaces — `skills/workflow-status/SKILL.md`, `skills/workflow-status/references/PRE_EXECUTION.md`, `skills/review-spec/references/OUTPUT.md`, `skills/review-plan/references/OUTPUT.md`, `skills/review-change/references/PERSIST_AND_DECIDE.md` say "quote the emitted `next.continuation` (`rendering` for display), never author exact tokens"; `FEATURE_WORKFLOW.md` carries exactly one pointer; prose `→ Next:` blocks remain for humans | read-verified: per-file quote sentences quoted in the phase handoff; `grep -c 'next.continuation' docs/workflow/FEATURE_WORKFLOW.md` → 1 |
| AC-11 | Golden-fixture expectations updated — `docs/workflow/GOLDEN_FIXTURE.md` pass criteria include the form-turn shape (read-verified for the manual protocol part); the run-log table unchanged | read-verified: form-turn boxes present in the fixed pass criteria; run-log table untouched in the PR diff |
| AC-12 | `bun scripts/check-skill-context.mjs` passes (budgets re-based for the touched skills) and `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` passes (mirror re-bundled byte-identically, same PR) | `node scripts/check-skill-context.mjs` → exit 0 with touched entries re-based; `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test` → exit 0 |

## Quality floor

- Do not remove, skip, loosen, or rewrite a validator to manufacture PASS.
- Do not modify this manifest during execution without a user-approved SPEC amendment.
- Passing declared checks is necessary, not sufficient; final independent review
  and named manual checks remain required.

## Commands

- `cd packages/agentic-workflow-schema && bun run test`
- `node --test scripts/workflow-status-sensor.test.mjs`
- `node --test scripts/continuation-discipline.test.mjs`
- `node --test scripts/normative-drift.test.mjs`
- `node scripts/check-skill-context.mjs`
- `cd packages/pi-agentic-workflow && npm run bundle:skills && npm test`
- `node -p "require('./packages/agentic-workflow-schema/package.json').version"`
