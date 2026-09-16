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

Written by `design-feature` (2026-09-16). Complete: `## Design status` below
reads `designed`.

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
4. Quote-not-author adoption for the v1 classes' owning surfaces
   (`workflow-status` skill + the gate-re-run and review-receipt-refresh
   routes): skills quote `rendering`/argv from the envelope instead of
   authoring prose; humans keep rendered prose → AC9, AC10.
5. Per-class discipline tests (3 fixture repos): command parses (argv
   well-formed), preconditions checkable at emit time, executing it advances
   the named `convergence` field → AC3, AC4, AC5.
6. Bounded form protocol in `design-feature` (`INTERVIEW.md` §3 rewrite +
   `SKILL.md` step-3/progressive-loading text): one form-turn ≤ 6 fixed slots
   with one-word defaults, ≤ 2 ambiguity follow-ups; rubric, mandatory-question
   rule, ask-nothing-docs-answer, upsert/review modes unchanged → AC8.
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

### Capability closure

Three fixed checklists. This is a docs-and-scripts repository: "UI entry
point" means the surface an agent, driver, or human touches (command, envelope
field, doc section); "API" means the invocation/configuration surface; roles
and the capability inventory are the derived ones recorded below and in
`decisions.md`.

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

**3. Role matrix** — derived roles (recorded in `decisions.md`):
`executor-agent`, `authoring-agent`, `review-agent`, `driver` (orchestrator),
`human-owner`. Every role decided for every capability:

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
  — `workflow-status` skill text and the gate-re-run/review-receipt-refresh
  routes say "quote the emitted `next.continuation` (`rendering` for display),
  never author exact tokens"; `FEATURE_WORKFLOW.md` carries exactly one
  pointer; prose `→ Next:` blocks remain for humans.
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
- [x] `#### Out of scope / non-goals` has ≥ 1 concrete bullet — 10 bullets.
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
boxes all tick, readiness preflight `READY-FOR-REVIEW` (see closing block).
Awaiting independent review by `review-spec`.

---

## Engineering half

<!-- TODO: plan-feature → -->
<!-- This section is written by `plan-feature` after an independent Product review. -->
<!-- Not yet started. -->

- `### Technical goals`
- `### Architecture impact`
- `### Design`
- `### Planning evidence`
- `### Obligations`
- `### Decisions to confirm`
- `### Testing requirements`
- `### Dev scenarios`
- `### Phases`
- `### Deploy & rollback`
- `### Open questions / risks`
- `### Deliverables`
- `### Post-merge next feature`

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

## Artifacts that still need to be created by plan-feature

- `docs/features/59-executable-continuations/PLAN.md` — phased plan
- `docs/features/59-executable-continuations/TASKS.md` — task breakdown
- `docs/features/59-executable-continuations/ACCEPTANCE.md` — frozen acceptance
  manifest
- `docs/features/59-executable-continuations/planning-evidence.md` —
  engineering claims
- `docs/features/59-executable-continuations/planning-obligations.md` —
  obligations ledger

## Artifacts already created by this design-feature session

- `docs/features/59-executable-continuations/SPEC.md` — this file (Product
  half)
- `docs/features/59-executable-continuations/decisions.md` — product decisions
  D-59-1…D-59-10 + grounding evidence rows + superseded-consolidation record
- `docs/features/ROADMAP.md` — row 59 `idea → defined`; rows 48/56 folded → 59;
  row 55 restored; dependency re-pointings reconciled
