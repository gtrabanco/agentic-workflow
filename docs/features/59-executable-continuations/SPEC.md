# 59 — executable-continuations

> Feature specification consolidating issues
> [#215](https://github.com/gtrabanco/agentic-workflow/issues/215)
> (binary-validated-continuations) and
> [#231](https://github.com/gtrabanco/agentic-workflow/issues/231)
> (design-interview-batching) — one unit per owner consolidation (D-59-1).
> One SPEC, two halves: this file's Product half is authored by
> `design-feature`; the Engineering half is authored by `plan-feature` after an
> independent Product review.

## Goal

Two capabilities, one unit, one theme — stop re-paying turn overhead for prose
a machine can emit or batch:

1. **Machine-executable hand-offs (#215).** Envelope v2 gains an optional,
   schema-validated `continuation` object at `next.continuation`
   (`{ argv, rendering?, preconditions, evidence?, convergence }`). The
   deterministic side (sensor + schema runtime) emits it for non-terminal
   states; skills *quote* the emitted command instead of authoring next-step
   prose; emission is fail-closed — a continuation that cannot be checked or
   rendered becomes a typed refusal, never a fabricated suggestion. `argv` is
   the command of record; `rendering` is display-only.
2. **Batched design interview (#231).** `design-feature`'s fixed
   one-question-per-turn interview rule is replaced by a bounded form protocol:
   one compact form-turn over the six fixed rubric slots, each carrying a
   recommended default accept-with-one-word, with at most 2 follow-up turns for
   genuine ambiguity. What must be closed does not change — only how the asks
   are batched.

Both attack the same measured waste (narration/turns, not checks): dead-end
recovery prose that burns or loops turns (#215), and per-question full-turn
overhead in design (#231).

## Branch

`feat/59-executable-continuations-fixture`

(The working worktree was created with a `-fixture` suffix on the branch name;
the feature slug is `executable-continuations`. The branch name is kept —
renaming would break the worktree mapping.)

## Size

`M` — two capabilities across the schema package, the sensor script, three
consuming skill surfaces, and the design-interview skill; full artifact set,
planned as 4 phases (P1 schema → P2 emission + quote surfaces → P3 interview
batching → P4 hardening & PR). No split trigger fires: ≤ 5 phases, one concern
per phase, zero unresolved product decisions after the interview (D-59-2).

## Dependencies

No hard dependencies:

- **24 `workflow-transition-decider`**: MERGED (PR #143). `decideWorkflowAction()`
  + `WORKFLOW_TRANSITION_TABLE` exist — the emitter projects this decision, it
  never re-decides.
- **25 `content-bound-review-receipts`**: MERGED (PR #144). Digest helpers
  (`packages/agentic-workflow-schema/src/sha256.ts`) back the `evidence`
  token's receiver-verifiable hash.
- **37 `phase-lint-script`** + **38 `workflow-status-sensor-script`**: MERGED
  (PRs #212, #213). The sensor emits Envelope v2 with `next` fields — the
  emission and quote source exists.

Soft dependencies:

- **46 `design-implementation-research`** (#206, `idea`): same skill file
  (`design-feature`), disjoint sections (research gate vs interview protocol);
  either land order composes.
- **31 `planning-review-materiality`** (#171, `idea`): touches `design-feature`'s
  REPAIR reference only — disjoint from the interview protocol.
- **58 `remove-ship-roadmap`** (#233, `idea`): future consumer of continuations
  ("invoke next continuation"); this feature satisfies that dependency early,
  not the reverse.
- **35 `scoped-receipt-verifier`** (#182, `idea`): shares the digest family; no
  surface overlap blocking this unit.

---

## Product half

Written by `design-feature` (2026-09-16); revised same day by the spec-review
repair batch (findings F1–F3, mechanical class — see `decisions.md`). Complete:
`## Design status` below reads `designed`.

### Context

Every skill turn ends with a hand-authored `→ Next:` prose block. The sensor
(`scripts/workflow-status.mjs`, feature 38) and the transition decider
(feature 24) already compute the next action deterministically, but nothing
validates that the prose command is runnable, matches the computed decision, or
has checkable preconditions — recovery advice that cannot be executed silently
burns a turn, and in the worst case loops (#215's problem statement). The
prose `next` fields are the only hand-off surface today
(`packages/agentic-workflow-schema/src/index.ts:159-167`).

On the design side, `design-feature/references/INTERVIEW.md` fixes
"One question per turn, never batched". The audit that produced #231 measured
that narration/turns — not checks — are the token sink: every interview turn
re-pays the loaded skill context + contract overhead, and this very feature's
interview demonstrated the fix live (two form-turns replaced ~8 prose turns).

The substrate is in place: versioned hand-off grammar
(`hand-off-transitions@1`/`hand-off-fields@1` in `TURN_CONTRACT.md`), digest
helpers from feature 25, and a sensor that already emits class-routed
`next.suggested` entries (`scripts/workflow-status.mjs:759`). What is missing
is the executable object itself, its fail-closed emission rules, the
per-class discipline proof, and the batched interview protocol.

### Business goals

- Cut wasted turns: drivers re-enter deterministically without re-reading
  skill prose; dead-end advice becomes impossible to emit.
- Cut design-stage cost: the interview collapses from N turns to 1 (+ ≤ 2
  ambiguity follow-ups).
- Keep the human surface readable: people still see rendered, quoted commands —
  they never parse argv.

### Scope

#### In scope

1. `next.continuation` object in the schema package — optional field, additive
   minor release, schema validator + vectors, backward compatible (envelopes
   without it stay valid) → AC1, AC7.
2. Typed refusal with a closed ≤ 4-code vocabulary, exported by the schema
   package and pinned in `CLAUDE.md`'s normative-surfaces table; emitted
   instead of a continuation when preconditions cannot be checked or rendering
   fails → AC2, AC6.
3. Sensor emission (`scripts/workflow-status.mjs` + schema runtime): computes
   the class-routed continuation from the existing decision table for
   non-terminal states → AC2, AC3.
4. Quote-not-author adoption for the v1 classes' owning surfaces, pinned to
   concrete files: status refresh → the `workflow-status` skill text
   (`skills/workflow-status/SKILL.md`); planning-gate re-run → the
   stale-receipt re-run route
   (`skills/workflow-status/references/PRE_EXECUTION.md`, the `stale` label
   row and its re-run sentence); review-receipt refresh → the
   receipt-persistence surfaces (`skills/review-spec/references/OUTPUT.md`,
   `skills/review-plan/references/OUTPUT.md`,
   `skills/review-change/references/PERSIST_AND_DECIDE.md`). Skills quote
   `rendering`/argv from the envelope instead of authoring prose; humans keep
   rendered prose → AC10.
5. Per-class discipline tests (3 fixture repos): command parses (argv
   well-formed), preconditions checkable at emit time, executing it advances
   the named `convergence` field → AC3, AC4, AC5.
6. Bounded form protocol in `design-feature` (`INTERVIEW.md` §3 rewrite +
   `SKILL.md` step-3/progressive-loading text): one form-turn ≤ 6 fixed slots
   with one-word defaults, ≤ 2 ambiguity follow-ups; rubric, mandatory-question
   rule, ask-nothing-docs-answer, upsert/review modes unchanged → AC8, AC9.
7. Golden-fixture expectations updated for the form protocol; context budgets
   re-checked; Pi mirror re-bundled byte-identically in the same PR → AC11,
   AC12.

#### Out of scope / non-goals

- **Model-emitted exact tokens** — the deterministic decider emits; the model
  only quotes (#215 anti-goal; D-59-6).
- **New command verbs** — continuations reuse existing skill invocations only
  (#215 anti-goal).
- **Verdict-rule changes** — no review/PASS semantics change (#215 anti-goal).
- **AWL runner adoption** — stays row 58 / future consumer work (#215).
- **Additional continuation classes** beyond the 3 v1 classes — closed set;
  extension is a SPEC change (D-59-5).
- **Interview semantics changes** — the six slots, the mandatory-question rule,
  "ask nothing the docs already answer", and the upsert/review modes are
  unchanged; only the ask protocol is batched (#231 non-goals).
- **Removal of prose `→ Next:` blocks for humans** — prose stays as the
  rendered pointer; only its authorship becomes a quote (D-59-3).
- **A persisted continuation store** — continuations are stateless projections,
  never stored; a new turn emits a fresh envelope (D-59-9).
- **Majors** — additive minor only (release freeze until #176; D-59-6).
- **The executable golden fixture (#230)** — stays row 55's scope after the
  owner's consolidation ruling; not part of 59 (see decisions.md, superseded
  consolidation).
- **A token-savings measurement protocol** for either capability — the measured
  waste is grounded at design time (research-gate evidence rows) and enforced by
  the discipline tests; the protocol itself was deliberately dropped with no
  owner, the same disposition as #226's audit (Expectation-sweep row 15).

### Capability closure

Three fixed checklists. This is a docs-and-scripts repository: "UI entry
point" means the surface an agent, driver, or human touches (command, envelope
field, doc section); "API" means the invocation/configuration surface; roles
and the capability inventory are the derived ones recorded in this section —
the role matrix below is the unit's only role list (`decisions.md` carries the
open offer to seed `docs/CAPABILITIES.md` from it, not a separate role list).

**1. Entity closure** — entities this feature introduces or touches:

**E1 — `next.continuation` object** (schema package, Envelope v2 optional field)

- Create — emitted only by the deterministic side (schema runtime API consumed
  by the sensor) for non-terminal states · API: `next.continuation` on
  Envelope v2, validator + vectors · test: AC1
- Read/list — drivers/skills read the field from the sensor envelope; humans
  read `rendering` · entry point: `workflow-status` output · test: AC2, AC10
- Update — n/a: immutable projection; a new turn emits a fresh envelope
  (staleness by construction)
- Delete — n/a: the field is optional; omission IS the absence semantics
  (never `null`, never defaulted — D-59-8 provenance in decisions.md)
- State transitions — n/a: stateless projection of the decision table

**E2 — typed refusal** (closed vocabulary, ≤ 4 codes)

- Create — emitted where a continuation cannot be checked or rendered · API:
  closed vocabulary exported by the schema package; normative-surfaces row in
  `CLAUDE.md` · test: AC2, AC6
- Read/list — read by drivers (terminal-for-turn) and by skills (keep prose) ·
  entry point: the envelope JSON + `workflow-status` output · test: AC2, AC10
- Update — n/a: closed vocabulary; extension is a SPEC change (D-59-5)
- Delete — n/a: no retirement path in scope
- State transitions — n/a: single-shot emission

**E3 — sensor emission path** (`scripts/workflow-status.mjs` + schema runtime)

- Create — computes the class-routed continuation from the existing decision
  table · API: envelope JSON gains `next.continuation` or a refusal · test:
  AC2, AC3
- Read/list — `workflow-status` skill, drivers, and the pi package's future
  command consume it · test: AC10
- Update — behavior changes ride this SPEC's review cycle; the script's own
  conventions govern versioning · test: AC3
- Delete — n/a: not in scope
- State transitions — n/a: the sensor stays read-only (existing invariant)

**E4 — bounded interview protocol** (`INTERVIEW.md` §3 + `design-feature`
`SKILL.md` step 3 / progressive-loading text)

- Create — the form-turn: one compact question set over the six fixed slots,
  each with a recommended default; ambiguity follow-ups capped at 2 turns ·
  API: skill text (the protocol agents follow) · test: AC8
- Read/list — loaded by every `design-feature` turn and exercised by the
  golden-fixture procedure · test: AC8, AC11
- Update — minor bumps via the repo's skill rules (`bump-skill`); Pi mirror
  re-bundled in the same PR · test: AC12
- Delete — the one-question-per-turn rule is replaced, not kept alongside (a
  second live protocol would fork the contract); the superseded text's intent
  (slot closure) is preserved verbatim in the rubric · test: AC8
- State transitions — n/a: static text

**2. Integration closure** — `docs/CAPABILITIES.md` is the unfilled template
in this repository (no live inventory), so the inventory is **derived** per
the skill from `CLAUDE.md`'s layout/verification/normative-surface sections
plus the codebase (recorded; seeding the real file is offered in
`decisions.md`). One row per subsystem:

- Skills distribution surface (`skills/`, skills CLI, context budgets) —
  `INTERVIEW.md` + `design-feature` + `workflow-status` skill text changes;
  budgets re-checked · test: AC12
- Schema package — `next.continuation` field, validator, refusal vocabulary,
  vectors; additive minor release · test: AC1, AC7
- Pi package mirror — the skills tree changes re-bundled byte-identically in
  the same PR · test: AC12
- Producer crate — n/a: no new standalone producer; emission rides the
  existing sensor script + schema runtime API (D-59-2 phase plan)
- Template scaffold — n/a: no `template/` file changes (skills ride the
  distribution surface, not the scaffold)
- Repo verification gate — discipline + emission tests registered under
  `scripts/` and run by the node-compat CI job · test: AC3
- Normative-surfaces tables (`CLAUDE.md`) — refusal-vocabulary row added
  (grammar `schema-export:CONTINUATION_REFUSALS`, machine
  `continuation-refusal-type`, must-name `yes`) and the `hand-off-fields@1`
  block gains `next | continuation` · test: AC6
- Workflow docs — `FEATURE_WORKFLOW.md` hand-off section gains one pointer to
  the quote rule · test: AC10
- Roadmap/features state machine — row 59 transitions `idea → defined` in this
  design turn; rows 48/56 folded → 59; later transitions belong to
  scaffold/execute skills · n/a at execution: not a runtime surface
- Forge/git — n/a: no forge interaction in the product surface (the sensor
  stays read-only; drivers using continuations act through existing commands)
- Sensor — the emission target; `next` fields confirmed as the quote source ·
  test: AC2, AC3

**3. Role matrix** — derived roles (recorded here, in this matrix — the
unit's only role list): `executor-agent`, `authoring-agent`, `review-agent`,
`driver` (orchestrator), `human-owner`. Every role decided for every
capability:

For EACH capability:

- **C1 — execute an emitted continuation as-is (argv)**: executor-agent
  allowed · authoring-agent allowed · review-agent allowed · driver allowed ·
  human-owner allowed
- **C2 — author exact continuation tokens (model-emitted)**: executor-agent
  **denied** · authoring-agent **denied** · review-agent **denied** · driver
  **denied** · human-owner **denied** (the deterministic side is the single
  emitter — #215's core anti-goal)
- **C3 — extend the class set / refusal vocabulary / object shape**:
  executor-agent **denied** · authoring-agent **denied** · review-agent
  **denied** · driver **denied** · human-owner allowed (SPEC-owned change,
  D-59-5)
- **C4 — run the batched interview / answer its form**: executor-agent
  **denied** (not a design surface) · authoring-agent allowed (runs
  `design-feature`) · review-agent **denied** (reviews, does not design) ·
  driver **denied** (relays and senses; does not interview) · human-owner
  allowed (answers with one word or Custom)
- **C5 — prose hand-off when no continuation is present**: executor-agent
  allowed · authoring-agent allowed · review-agent allowed · driver
  **denied** (a refusal is terminal — D-59-4) · human-owner allowed

### Expectation sweep

The implicit-knowledge gate for "machine-executable hand-offs + batched
interview" — domain conventions enumerated and resolved:

| # | Expectation | Resolution | Pointer |
|---|---|---|---|
| 1 | `argv` is authoritative; `rendering` may be regenerated per platform without changing the command | in-scope | AC5 |
| 2 | A `rendering`/argv divergence is a test failure, never a correctness surface | in-scope | AC5 |
| 3 | Offline / uncheckable precondition / rendering failure → typed refusal, never a fabricated command | in-scope | AC2 |
| 4 | An unknown continuation class → refusal, not a guessed emission | in-scope | AC2 (D-59-5) |
| 5 | The evidence token is receiver-verifiable by digest equality; nothing is persisted | in-scope | AC4 |
| 6 | Executing a continuation advances the named `convergence` field | in-scope | AC3 |
| 7 | Drivers never fall back to authoring prose from a refusal | in-scope | AC2 (D-59-4) |
| 8 | Human slash-command users still see a rendered, readable `→ Next:` | in-scope | AC10 |
| 9 | Envelopes without `next.continuation` stay valid — additive, old consumers unaffected | in-scope | AC1 |
| 10 | The class set and refusal vocabulary are closed; extension is a SPEC change | in-scope | AC6 (D-59-5) |
| 11 | The interview still closes the same six slots — batching changes the ask protocol only | in-scope | AC8 |
| 12 | Defaults accept with one word; genuine ambiguity gets ≤ 2 follow-up turns | in-scope | AC8 |
| 13 | No new command verbs — continuations reuse existing skill invocations | in-scope | AC3 (D-59-6) |
| 14 | Continuations are stateless projections — no continuation store exists | out-of-scope | Out-of-scope bullet (D-59-9) |
| 15 | A token-savings measurement protocol for both capabilities | out-of-scope | Out-of-scope bullet (no owner; deliberately dropped, same disposition as #226's audit) |

### Acceptance criteria

Each criterion is a runnable command (exact invocation; fixture repos are
throwaway git repos built by the suites) or labelled `read-verified`.

- **AC1 (command)**: schema suite green — `cd packages/agentic-workflow-schema
  && bun run test` (node fallback: `npm test`); covers, at minimum: an Envelope
  without `next.continuation` validates (backward compat); a valid
  `next.continuation` validates; invalid shapes (missing `argv`, empty
  `convergence`, non-string-array `argv`, non-object precondition) fail closed
  with typed errors; published test vectors for the canonical object.
- **AC2 (command)**: emission/refusal suite green —
  `node --test scripts/workflow-status-sensor.test.mjs`; covers: a non-terminal
  fixture unit yields `next.continuation` with well-formed argv; an
  uncheckable precondition or a rendering failure yields NO continuation field
  plus a refusal code from the closed vocabulary; offline gh state yields the
  refusal, never a guessed command.
- **AC3 (command)**: per-class discipline suite green —
  `node --test scripts/continuation-discipline.test.mjs`; for each of the 3
  classes (status refresh · planning-gate re-run · review-receipt refresh) a
  fixture repo proves: the emitted command parses (argv well-formed),
  preconditions are checkable, and executing it exactly as emitted advances
  the named `convergence` field.
- **AC4 (command)**: evidence-token digest test green —
  `cd packages/agentic-workflow-schema && bun run test` case: the token's hash
  equals the referenced receipt/report digest; a mismatched digest fails
  verification (receiver-side check, nothing persisted).
- **AC5 (command)**: rendering-derivation test green —
  `node --test scripts/continuation-discipline.test.mjs` cases: `rendering`
  is derivable from `argv` per platform family; `argv` is never altered by
  rendering; a forced divergence fails the test.
- **AC6 (command)**: `node --test scripts/normative-drift.test.mjs` passes
  with the new normative-surfaces row (refusal vocabulary) and the
  `hand-off-fields@1` row (`next | continuation`) present in
  `TURN_CONTRACT.md`/`CLAUDE.md`.
- **AC7 (command)**: additive-minor release evidence —
  `node -p "require('./packages/agentic-workflow-schema/package.json').version"`
  prints the next minor (≥ current major.minor+0.1, no major bump);
  **read-verified**: `CHANGELOG.md` carries the row and the schema package's
  policy docs state the additive guarantee.
- **AC8 (read-verified)**: `INTERVIEW.md` §3 carries the bounded form protocol
  — one form-turn over the ≤ 6 fixed slots, each with a recommended default,
  ≤ 2 ambiguity follow-up turns; the vagueness rubric, the mandatory-question
  rule, and "ask nothing the docs or instruction already answer" are restated
  unchanged; the superseded one-question-per-turn rule is gone (no forked
  second protocol).
- **AC9 (read-verified)**: `design-feature/SKILL.md` step 3 and the
  progressive-loading table describe the form protocol (batch turn + ≤ 2
  follow-ups) and keep the upsert/review modes untouched.
- **AC10 (read-verified)**: the quote rule is stated at the consuming surfaces
  — the `workflow-status` skill text (`skills/workflow-status/SKILL.md`), the
  stale-receipt re-run route
  (`skills/workflow-status/references/PRE_EXECUTION.md`), and the
  receipt-persistence surfaces (`skills/review-spec/references/OUTPUT.md`,
  `skills/review-plan/references/OUTPUT.md`,
  `skills/review-change/references/PERSIST_AND_DECIDE.md`) say "quote the
  emitted `next.continuation` (`rendering` for display), never author exact
  tokens"; `FEATURE_WORKFLOW.md` carries exactly one pointer; prose
  `→ Next:` blocks remain for humans.
- **AC11 (command)**: golden-fixture expectations updated —
  `docs/workflow/GOLDEN_FIXTURE.md` pass criteria include the form-turn shape
  (read-verified for the manual protocol part); the run-log table unchanged.
- **AC12 (command)**: `bun scripts/check-skill-context.mjs` passes (budgets
  re-based for the touched skills) and
  `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs`
  passes (mirror re-bundled byte-identically, same PR).

Refusal vocabulary (closed; ≤ 4 codes, extended only through a SPEC change —
D-59-5): `precondition-uncheckable` · `rendering-failed` ·
`no-decision-available` · `sensor-degraded`. The canonical declaration is the
schema package's exported const; the `CLAUDE.md` normative-surfaces row pins
the surface (grammar `schema-export:CONTINUATION_REFUSALS`, machine
`continuation-refusal-type`, must-name `yes`).

### Tooling

- `gh` CLI — read-only forge checks where the sensor needs PR state for
  precondition evaluation (stubbed in tests).
- bun-else-node runtime — repo convention, node-compat CI.
- No skill or MCP dependencies beyond the repository's own skills; no new MCP
  integrations.

### Product decisions

Recorded in full (with authority and rationale) in
`docs/features/59-executable-continuations/decisions.md`; one-line summary:

- **D-59-1** one unit consolidating rows 48 + 56 (issues #215 + #231); both
  rows folded → 59, kept, numbers never reused — owner instruction.
- **D-59-2** size `M`, 4 phases, no split — user delegated sizing.
- **D-59-3** consumers are machines (drivers, pi package's future command, awl
  substrate); humans keep rendered prose; no new roles/ACL (n/a).
- **D-59-4** typed refusal is terminal at the driver layer; skills keep prose
  when nothing is emitted.
- **D-59-5** v1 class set = the 3 #215 classes; closed; extension via SPEC
  change.
- **D-59-6** non-goals adopted from both issues (no model-emitted tokens, no
  new verbs, no verdict changes, no AWL adoption, interview semantics
  unchanged beyond the ask protocol, no majors).
- **D-59-7** argv authoritative; rendering derived, display-only, test-pinned
  (execve(2) evidence).
- **D-59-8** `convergence` names a state field that must measurably advance;
  discipline tests enforce it (the superseded draft's "unused in v1" stance
  rejected).
- **D-59-9** evidence token = digest-equality, receiver-verifiable, nothing
  persisted (feature 25 helpers).
- **D-59-10** the object rides `next.continuation` — one hand-off surface;
  `hand-off-fields@1` gains the field row.

### Deferred decisions

none

| Decision | Why deferred | Decide by (trigger or phase) |
|---|---|---|

### Spec-lint (mechanical — presence checks only)

Product boxes:

- [x] No template placeholders left in the product half —
      `grep -nE '<(where|surface|name|reason|list|role|subsystem|expectation|criterion)'`
      over the Product half returns nothing (closure rows instantiated; the
      refusal codes and object keys are literals, not placeholders).
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet — 11 bullets.
- [x] Every Capability closure row is filled or `n/a: <reason>` — zero blank
      rows (E1–E4 × CRUD/transitions; 11 inventory subsystems; 5 roles × 5
      capabilities).
- [x] Integration closure has one row per subsystem of the derived inventory
      (recorded above; `docs/CAPABILITIES.md` absent as a live file) — zero
      subsystems skipped.
- [x] Every capability's role matrix lists EVERY role with an explicit
      `allowed`/`denied` — 5 roles × 5 capabilities, none unlisted.
- [x] `### Expectation sweep` has 15 resolved rows (≥ 10 for M); every row
      resolves to exactly one of `in-scope`, `out-of-scope`, or `deferred`
      with a pointer — zero unresolved rows.
- [x] Every `#### In scope` bullet maps to ≥ 1 acceptance criterion —
      explicit AC pointers on each bullet.
- [x] Every acceptance criterion is a runnable command OR labelled
      `read-verified` — AC1–AC7, AC11, AC12 commands; AC8–AC10 labelled.
- [x] `### Deferred decisions` exists and reads `none`.

## Design status

`designed` — capability closure complete (zero blank rows), product spec-lint
boxes all tick after the F1–F3 repair batch (mechanical, intent-preserving —
see `decisions.md`), readiness preflight `READY-FOR-REVIEW` (see closing
block). Awaiting independent re-review by `review-spec`.

---

## Engineering half

Written by `plan-feature` / `plan-feature-scaffold` after the Product-review
gate passed (receipt SPEC-REVIEW-59-2, snapshot `2e2d00d6…ebc7f0e`). Product
bytes are untouched; the artifact revision of this plan set is `59-plan-1`.

### Technical goals

- One deterministic emitter, many quoters: the schema package owns a pure,
  fail-closed continuation emitter; the sensor is its only caller; skill text
  quotes what was emitted. No model authors exact command tokens (C2).
- The Envelope v2 contract grows additively: `next.continuation` is optional,
  envelopes without it stay byte-valid, and the release is a minor (4.1.2 →
  4.2.0) under the repo's majors freeze (D-59-6).
- Failure is typed, never fabricated: four closed refusal codes replace every
  dead-end advice path; a refusal is terminal at the driver layer (D-59-4).
- The design interview pays one form-turn (+ ≤ 2 ambiguity follow-ups) instead
  of one turn per question, with the rubric semantics unchanged (D-59-1, #231).

### Architecture impact

Two layers are touched; both are outer layers, so no layering rule is stressed:

- **config/infra** — `packages/agentic-workflow-schema/src/index.ts:159-167`
  (`EnvelopeNext` gains the optional `continuation` member),
  `packages/agentic-workflow-schema/envelope.schema.json:161-182` (the JSON
  Schema projection gains the same optional property — required, because `next`
  sets `additionalProperties: false`), and `scripts/workflow-status.mjs:961-1004`
  + `:1192` (emission hook at `resolveNext()`/attach; `next.suggested` router at
  `:759` stays). The sensor's read-only invariant holds: emission only adds
  fields to the envelope it already prints (O15; feature 38's read-only greps
  keep passing).
- **docs** — the five quote surfaces (PE-011), one FEATURE_WORKFLOW pointer,
  `CLAUDE.md`'s `normative-surfaces@1` (:311-335) + the `hand-off-fields@1`
  block (`skills/orchestration-envelope/references/TURN_CONTRACT.md:47-54`),
  `INTERVIEW.md` §3 + `design-feature/SKILL.md` step 3 / progressive loading,
  and the golden-fixture pass criteria.

The existing single-emitter boundary is preserved and extended: feature 38's
frozen pin keeps `decideWorkflowAction()` out of the sensor (PE-005), so the
emitter consumes the sensor's own `resolveNext()` output — it projects, never
re-decides (PE-004).

Preflight (planning-preflight contract):

```text
Preflight: Stage 1 — NRS consumed · arch: deferred
Preflight: NRS consumed · invariant classification: n/a (no project invariants declared — REPOSITORY_STATE.md F010)
```

### Design

**Continuation object (frozen shape).**
`next.continuation: { argv: string[]; rendering?: string; preconditions: Array<{ id: string; check: string; satisfied: boolean }>; evidence?: { artifact: string; digest: string }; convergence: string }`
— all members required unless shown optional; omission of the whole field is
the absence semantics (never `null`, never defaulted — D-59-8 provenance).

- `argv` is the command of record, parsed from the resolved `next.recommended`
  slash-command string by whitespace splitting (quoted args stay single
  tokens). `rendering` is display-only, derived per platform family; v1 emits
  the POSIX-shell rendering (join with spaces, shell-quote members containing
  whitespace or quotes). argv is never altered by rendering (AC5, D-59-7).
- `preconditions` carry the emitter's at-emit evaluation; a precondition the
  emitter cannot evaluate is the `precondition-uncheckable` refusal, not a
  guess (AC2, AC3).
- `evidence` is receiver-verifiable by digest equality: `digest` is the
  lowercase SHA-256 of the referenced snapshot/report (computed with the
  package's `sha256HexSync` helpers, feature 25); the receiver re-derives it
  and a mismatch fails verification. Nothing is persisted (D-59-9).
- `convergence` names the envelope/state field that must measurably advance
  when the command is executed exactly as emitted (D-59-8).

**Emitter API.** `emitContinuation(input)` exported by the schema package:
pure, deterministic, fail-closed — returns `{ ok: true, continuation }` or
`{ ok: false, refusal: ContinuationRefusalCode }`. Input is the already-resolved
command string plus the unit context; the emitter never re-derives the decision
(PE-004, PE-005). The sensor calls it at the `resolveNext()`/attach points and:

- on `ok` — attaches `next.continuation`;
- on refusal — attaches **no** `continuation` field and records the code at
  `detail.continuation_refusal` (`detail` is schema-unconstrained, PE-003 —
  no schema change needed for refusals).

**Refusal vocabulary (closed, ≤ 4, D-59-5).** `precondition-uncheckable ·
rendering-failed · no-decision-available · sensor-degraded` — exported as
`CONTINUATION_REFUSALS` and pinned by the `normative-surfaces@1` row
(grammar `schema-export:CONTINUATION_REFUSALS`, machine
`continuation-refusal-type`, must-name `yes`).

**v1 class table (closed; D-59-5).**

| Class | Owning quote surface (AC10) | argv (shape) | convergence field |
|---|---|---|---|
| status refresh | `skills/workflow-status/SKILL.md` (next-command echo) | `[/workflow-status]` | `next.recommended` — the refreshed envelope recomputes it against the advanced tree |
| planning-gate re-run | `skills/workflow-status/references/PRE_EXECUTION.md:44,52` (`stale` row + re-run sentence) | `[/review-spec <unit>]` or `[/review-plan <NN>]` per stage | `detail.pre_execution.<stage>.label` — stale → current |
| review-receipt refresh | `skills/review-spec/references/OUTPUT.md:3`, `skills/review-plan/references/OUTPUT.md:3`, `skills/review-change/references/PERSIST_AND_DECIDE.md:3` | `[/review-spec <unit>]` / `[/review-plan <NN>]` per stage | `detail.pre_execution.<stage>.label` — missing/stale → current |

**Normative additions.** `hand-off-fields@1` gains `next | continuation`
(machine `envelope-field:next`, must-name `yes` — the drift gate's machine→text
closed set covers the new field); the drift gate gains a `schema-export:`
grammar resolver that reads the exported const from committed source (PE-010).

**Interview protocol (AC8/AC9).** §3's ask protocol becomes: one form-turn
covering the six fixed rubric slots, each slot carrying a recommended default
the user accepts with one word; at most 2 follow-up turns for genuine
ambiguity. The vagueness rubric, mandatory-question rule, ask-nothing rule,
deferral rows, and `NEEDS_INPUT` escalation carry over verbatim; the
one-question-per-turn rule is deleted outright (no second live protocol).
`SKILL.md` step 3 and the progressive-loading hard stop describe the same
protocol; the upsert and review modes are untouched.

### Planning evidence

See `planning-evidence.md` (M/L — the Plan-stage table is frozen there; 20 rows,
PE-001…PE-020, all `current` + `proven`/`derived`).

### Obligations

See `planning-obligations.md` (M/L — O1…O17, one row per acceptance criterion
plus the read-only, vocabulary-closure, and refusal-terminality invariants;
every row `planned` at freeze).

### Decisions to confirm

Frozen as engineering decisions in `decisions.md` (E-59-1…E-59-6); none is open:

- **E-59-1** — the product sketch's "P2 emission + quote surfaces" is cut into
  P2 (config/infra) + P3 (docs) by the one-layer-per-phase rule (derivation
  PE-020); the plan stays inside the ≤ 5-phase bound the Product half records.
  Product bytes untouched.
- **E-59-2** — the emitter lives in the schema package and consumes the sensor's
  resolved command; `decideWorkflowAction()` stays out of the sensor (PE-005).
- **E-59-3** — refusal codes surface at `detail.continuation_refusal`; the
  `continuation` field is absent on every refusal path.
- **E-59-4** — `evidence` binds a recomputed snapshot/report digest
  (receiver-verifiable, nothing persisted).
- **E-59-5** — v1 rendering = POSIX-shell derivation; per-family derivation is
  what AC5's test pins.
- **E-59-6** — convergence field names per class (table above); the discipline
  suite advances the tree between emit and re-run to make the advance
  measurable.

### Testing requirements

Test layers (repo convention — integration over mocks; throwaway git fixture
repos per `scripts/workflow-status-sensor.test.mjs:87-123`):

- **Schema package suite** (`bun run test` in the package) — backward compat,
  valid object, four fail-closed shapes, canonical vectors, evidence-digest
equality + mismatch, refusal-vocabulary export (AC1, AC4, AC7).
- **Sensor suite** (`node --test scripts/workflow-status-sensor.test.mjs`) —
  emission on non-terminal fixtures, refusal paths, offline degradation (AC2).
- **Discipline suite** (`node --test scripts/continuation-discipline.test.mjs`,
  new) — 3 classes × parse/precondition-checkable/convergence-advances, plus
  rendering derivation + forced divergence (AC3, AC5).
- **Normative + budget gates** — `node --test scripts/normative-drift.test.mjs`
  (AC6), `node scripts/check-skill-context.mjs` (AC12).
- **Mirror parity** — `npm run bundle:skills` +
  `node --test packages/pi-agentic-workflow/test/skill-parity.test.mjs` (AC12).
- **Read-verified rows** — AC8, AC9, AC10, AC11 (manual-protocol part) checked
  by the phase handoff quoting the landed text.

### Dev scenarios

| Scenario | Reproduces | Mechanism it drives |
|---|---|---|
| `continuation:empty-state` | Terminal/empty roadmap state — nothing to emit | fixture repo with no startable unit; envelope carries no `continuation` field, exit 0 (P2 pins) |
| `continuation:invalid-shape` | Malformed continuation input at the validator | package-suite fail-closed cases (missing argv, empty convergence, non-string-array argv, non-object precondition) → typed refusal, never a printed envelope (P1 pins) |
| `continuation:offline-forge` | Forge unavailable during precondition evaluation | `gh` shim failing fast in the fixture → `sensor-degraded` refusal at `detail.continuation_refusal`, no `continuation` key, exit 0 (P2 pins) |
| `continuation:concurrent-emit` | Two consecutive sensor runs on the same tree | stateless projection — byte-identical envelopes (idempotence pins), no continuation store exists (P2/D-59-9) |
| `interview:ambiguity-cap` | Genuine ambiguity persists past the follow-up budget | form-turn fixture run: 2 follow-up turns then the rubric's own `NEEDS_INPUT` escalation — no third ask (P4 text; exercised by the golden-fixture procedure, AC11) |
| `interview:defaults-accept` | User accepts every recommended default in one word | form-turn completes in one turn; six slots resolved; spec-lint product boxes still tickable (P4 text + AC8) |

Category walk: empty/zero state → `continuation:empty-state`; invalid or
oversized input → `continuation:invalid-shape`; permission denied / wrong role →
n/a: the sensor is read-only and role-free (NRS F-layer; no ACL surface in
scope — C1–C5 are doc-level denials, not runtime checks); dependency outage or
timeout → `continuation:offline-forge` (forge) and the existing git/hint
degradation codes; concurrent/duplicate action → `continuation:concurrent-emit`;
limit or threshold hit → `interview:ambiguity-cap` (the protocol's own 2-turn
threshold).

### Phases

Five phases, one layer each, zero open decisions; detailed checklists in
`TASKS.md`, phase-lint output in the scaffold report. P1 commits the planning
artifacts with its first change.

- **P1 — Envelope continuation schema** (config/infra): optional
  `next.continuation` in the TS interface + JSON Schema, closed refusal const,
  pure emitter API, canonical vectors, digest cases, 4.2.0 additive minor.
  Done-when: `bun run test` (schema package) → exit 0.
- **P2 — Sensor continuation emission** (config/infra): emitter wired at the
  `resolveNext()`/attach points, four fail-closed refusal paths, evidence-token
  binding, emission/refusal pins, per-class discipline suite + rendering pins.
  Done-when: `node --test scripts/workflow-status-sensor.test.mjs
  scripts/continuation-discipline.test.mjs` → exit 0.
- **P3 — Quote-surface adoption** (docs): quote rule at the five pinned
  surfaces, one FEATURE_WORKFLOW pointer, `normative-surfaces@1` row +
  `hand-off-fields@1` row + drift extractor. Done-when:
  `node --test scripts/normative-drift.test.mjs` → exit 0.
- **P4 — Batched design interview** (docs): INTERVIEW.md §3 form protocol
  (superseded rule deleted), SKILL.md step 3 + progressive loading, golden-
  fixture boxes, budgets re-based. Done-when:
  `node scripts/check-skill-context.mjs` → exit 0.
- **P5 — Hardening & PR** (hardening): full ladder, mirror re-bundle + parity,
  release evidence, acceptance blob receipt, close-out tasks (PR open, roadmap
  `done`, link commit). Done-when: discipline suite → exit 0 with the whole
  ladder green and the PR URL printed.

### Deploy & rollback

n/a — docs-and-scripts repository; shipping is the PR merge. Rollback is the
standard revert; the additive minor means a pre-4.2.0 consumer never sees the
field (backward compat is an AC1 pin, not a migration).

### Open questions / risks

None open. Risks with owners:

- The drift gate's `schema-export:` resolver is new gate machinery — owner P3;
  risk contained by extending the existing extractor set (PE-010) and the AC6
  gate run.
- Budget re-basis may grow ceilings for text-heavy skills — owner P4; the
  tool's own declared re-basis convention is the prescribed mechanism (PE-014;
  feature 38 precedent B-04).
- `resolveNext()` line numbers may drift by P2 — owner execute-phase; PE-006
  names the re-verify step before editing.

### Deliverables

- Schema package: `next.continuation` (TS + JSON Schema),
  `CONTINUATION_REFUSALS` + typed refusal, `emitContinuation`, vectors, suite
  cases, 4.2.0 + CHANGELOG row + additive-guarantee sentence.
- Sensor: emission + refusal paths + evidence binding in
  `scripts/workflow-status.mjs`; `scripts/continuation-discipline.test.mjs`;
  extended `scripts/workflow-status-sensor.test.mjs`.
- Skill text: quote rule at the five pinned surfaces + FEATURE_WORKFLOW
  pointer; `INTERVIEW.md` §3 + `design-feature/SKILL.md` form protocol.
- Normative: `CLAUDE.md` refusal row; `TURN_CONTRACT.md` `next | continuation`
  row; drift-gate `schema-export:` resolver; golden-fixture boxes; re-based
  budgets; re-bundled Pi mirror.

### Post-merge next feature

Feature 52 (`machine-checked-turn-contract`, #226) composes with the emitted
continuations; feature 58 (`remove-ship-roadmap`, #233) is the future consumer
this unit's `next.continuation` satisfies early. See `docs/features/ROADMAP.md`.

---

## Amendments

- 2026-09-16 — Owner-approved consolidation: roadmap rows 48
  (`binary-validated-continuations`, #215) and 56 (`design-interview-batching`,
  #231) are absorbed into this feature (design interview; user: "59 supposed to
  be 56 & 48 together"). A concurrent, uncommitted draft pairing 59 with #230
  (executable golden fixture, row 55) was superseded by owner ruling; row 55
  restored to `idea`. Rows kept, numbers never reused. Tracking issue:
  [#237](https://github.com/gtrabanco/agentic-workflow/issues/237) — created in
  this turn after this section was written; #215/#231 closed as absorbed into
  it; the eventual PR closes #237.

---

## Artifacts created by plan-feature (2026-09-16, `59-plan-1`)

- `docs/features/59-executable-continuations/PLAN.md` — 5-phase plan (P1 schema ·
  P2 sensor emission + discipline · P3 quote surfaces · P4 batched interview ·
  P5 hardening & PR) — phase-lint PASS 8/8 all phases
- `docs/features/59-executable-continuations/TASKS.md` — per-phase task checklists
- `docs/features/59-executable-continuations/ACCEPTANCE.md` — frozen acceptance
  manifest (AC-01…AC-12)
- `docs/features/59-executable-continuations/planning-evidence.md` — PE-001…PE-020
- `docs/features/59-executable-continuations/planning-obligations.md` — O1…O17
- `docs/features/59-executable-continuations/testing.md` — validation ladder
- `docs/features/59-executable-continuations/known-issues.md` — tracked boundaries
- `docs/features/59-executable-continuations/architecture-notes.md` — layer impact
- `decisions.md` — engineering decisions E-59-1…E-59-6 appended (product
  decisions D-59-1…D-59-10 untouched)

## Artifacts already created by this design-feature session

- `docs/features/59-executable-continuations/SPEC.md` — this file (Product
  half)
- `docs/features/59-executable-continuations/decisions.md` — product decisions
  D-59-1…D-59-10 + grounding evidence rows + superseded-consolidation record
- `docs/features/ROADMAP.md` — row 59 `idea → defined`; rows 48/56 folded → 59;
  row 55 restored; dependency re-pointings reconciled
