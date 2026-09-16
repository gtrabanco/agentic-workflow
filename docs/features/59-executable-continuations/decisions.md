# Decisions — 59-executable-continuations

Product-half decisions recorded by `design-feature` (append-only; newest last).

## Superseded consolidation (recorded, never silently dropped)

- **2026-09-16 — Owner ruling superseded an uncommitted concurrent draft.** While
  this design turn ran, a second, uncommitted design attempt for feature 59
  appeared in the working tree (slug `executable-continuations-fixture`, scope
  #215 + #230 — the continuation object plus the executable golden fixture,
  absorbing rows 48 and 55; a 390-line SPEC stamped `designed` + decisions
  D-59-1…D-59-12, roadmap rows 48/55 folded, row 59 left at `idea`). The owner
  ruled (conflict question, 2026-09-16) that the authoritative consolidation is
  **#215 + #231 (rows 48 + 56), slug `executable-continuations`**. Consequences
  applied here: row 55 restored to `idea`; row 56 folded → 59; the prior folder
  replaced by this one. Substantive content of the superseded draft is carried
  over where aligned (see D-59-3/D-59-7/D-59-8 provenance notes); its #230 half
  (executable fixture, committed toy-SPEC file, ~100-word protocol shrink) is
  **out of scope for 59** — row 55 owns it again as a separate `idea`. The
  superseded bytes were never committed (untracked working-tree state), so the
  record here is their durable trace.

## Evidence rows (grounding, 2026-09-16)

One row per material claim, fixed column order
(`claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence`):

| claim-or-obligation | authority-kind | source-and-location | observed-revision | freshness | status | owner-or-next-evidence |
|---|---|---|---|---|---|---|
| Continuation problem + object shape (`{ argv, rendering?, preconditions, evidence?, convergence }`), deterministic-side emission, emit-time fail-closed validation, 3 discipline classes, anti-goals, additive minor | forge | https://github.com/gtrabanco/agentic-workflow/issues/215 (fetched 2026-09-16) | issue body @ 2026-09-16 | current | proven | — |
| Interview batching problem + bounded form protocol (one form-turn ≤ 6 fixed slots with one-word defaults, ≤ 2 ambiguity follow-ups, rubric unchanged, golden-fixture expectations updated, minor bump) | forge | https://github.com/gtrabanco/agentic-workflow/issues/231 (fetched 2026-09-16) | issue body @ 2026-09-16 | current | proven | — |
| Authoritative consolidation: 59 = rows 48 + 56 (issues #215 + #231), slug `executable-continuations`; on-disk #230 pairing superseded; size delegated; consumers/refusals/classes/non-goals defaults accepted; tracking issue + folding approved | user | this design interview 2026-09-16 (identity confirm · relation answer "56 & 48 together" · batched form-turn 6/6 · conflict ruling confirm_56_48) | design turn | not-applicable | decision | — |
| Envelope v2 today has prose-only `next` (`recommended`/`alternatives`/`tier`/`suggested`); no `continuation` field exists | repository | `packages/agentic-workflow-schema/src/index.ts:159-167` (`EnvelopeNext`), `:425-432` (validator) | main @ design turn | current | proven | — |
| The sensor emits Envelope v2 `next` fields — the quote/echo source exists | repository | `scripts/workflow-status.mjs:922`, `:1125-1137` | main @ design turn | current | proven | — |
| The deterministic next-action decision exists (`decideWorkflowAction()` + `WORKFLOW_TRANSITION_TABLE`) — the emitter projects it, never re-decides | repository | `packages/agentic-workflow-schema/src/index.ts:780`, `:1042` | main @ design turn | current | proven | — |
| Hand-off grammar is versioned (`hand-off-transitions@1` / `hand-off-fields@1`) — `next` field additions extend a machine-checked surface | repository | `skills/orchestration-envelope/references/TURN_CONTRACT.md` | main @ design turn | current | proven | — |
| `INTERVIEW.md` fixes one-question-per-turn — the rule #231 replaces; the six fixed slots + mandatory-question rule stay | repository | `skills/design-feature/references/INTERVIEW.md` §3 | installed release @ design turn | current | proven | — |
| The golden fixture procedure covers `design-feature` — the expectations-update point for the batching half | repository | `docs/workflow/GOLDEN_FIXTURE.md` §When to run | main @ design turn | current | proven | — |
| argv-array execution semantics: programs receive argv arrays; a shell-string rendering is a derived view, not execution truth (grounds argv-authoritative, rendering cosmetic) | document | https://man7.org/linux/man-pages/man2/execve.2.html (fetched 2026-09-16) | page @ 2026-09-16 | current | proven | — |
| Machine-callable tool surfaces declare JSON-Schema inputs and validated structured results; structured content is producer-generated data, distinct from model-generated tokens (grounds deterministic-side emission + receiver-side validation) | document | https://modelcontextprotocol.io/specification/2025-06-18/server/tools (fetched 2026-09-16) | spec 2025-06-18 @ 2026-09-16 | current | proven | — |
| Digest helpers for the evidence token already exist in the schema package (content-bound receipt digests, feature 25, are merged) | repository | `packages/agentic-workflow-schema/src/sha256.ts` | main @ design turn | current | proven | — |
| `docs/CAPABILITIES.md` is the unfilled template → integration closure walks a derived inventory | repository | `docs/CAPABILITIES.md` (template rows only) | main @ design turn | current | proven | — |
| No architectural-invariants document exists (the workflow-level contract is `WORKFLOW_INVARIANTS.md`; the project doc is optional) | ledger | `REPOSITORY_STATE.md` F010 | snapshot 2026-08-30 | current | proven | — |
| English-only interim for committed artifacts | ledger | `REPOSITORY_STATE.md` F011 / AD-002 | snapshot 2026-08-30 | current | proven | — |
| Release freeze: no majors until #176 merges — additive minor only | repository | `CLAUDE.md` "Version every change"; roadmap row 40 note | main @ design turn | current | proven | — |

Research gate: two external sources fetched (execve(2) man page, MCP Tools spec —
rows above; `nan_web_search` was unavailable, so both were fetched directly via
curl). Offline / unanswered material question: none.

## Decision log

## 2026-09-16 — D-59-1: One unit consolidating rows 48 + 56 (issues #215 + #231)

- **What**: Feature 59 is a single delivery unit covering both the continuation
  object (#215) and the design-feature interview batching (#231); roadmap rows
  48 and 56 are folded → 59 (kept, numbers never reused).
- **Why**: Owner instruction — "59 supposed to be 56 & 48 together", confirmed
  twice (relation answer + conflict ruling over the concurrent draft).
- **Authority**: user instruction (2026-09-16, design interview).

## 2026-09-16 — D-59-2: Size `M`, 4 phases, no split

- **What**: `M` — full artifact set; P1 schema, P2 emission + quote surfaces,
  P3 interview batching, P4 hardening & PR.
- **Why**: User delegated sizing ("estimate which size is good to fit in the
  requirements"). Two capabilities, one concern per phase, ≤ 5 phases, zero
  unresolved product decisions — no split trigger fires.
- **Authority**: user delegation (2026-09-16, interview).

## 2026-09-16 — D-59-3: Consumers are machines; humans keep rendered prose; no new roles

- **What**: Continuation consumers are external drivers, the pi package's future
  orchestration command (row 58), and the awl substrate. Human slash-command
  users keep a readable, rendered `→ Next:` (now a pointer to the emitted
  command). No new roles/ACL — n/a (docs-and-scripts repo, no auth surface).
- **Why**: Interview default accepted (Q1); #215's consumer rationale
  ("deterministic re-entry without re-reading skill prose").
- **Authority**: user instruction (interview Q1 default) + issue #215.

## 2026-09-16 — D-59-4: Typed refusal is terminal at the driver layer; skills keep prose when nothing is emitted

- **What**: A refusal code is the turn's answer for a driver — no prose
  fallback, no guessed command. When the sensor emits no continuation, skills
  author prose exactly as today. Emitting an uncheckable suggestion stays
  forbidden.
- **Why**: Interview default accepted (Q2); #215's field lesson ("recovery
  suggestions that could never be submitted produce indefinite loops").
- **Authority**: user instruction (interview Q2 default) + issue #215.

## 2026-09-16 — D-59-5: v1 class set is the 3 #215 classes; closed

- **What**: Continuation classes in v1: status refresh · planning-gate re-run ·
  review-receipt refresh. Adding classes is a SPEC change, not an agent or
  code-level extension.
- **Why**: Interview default accepted (Q3); keeps the discipline-test matrix
  proportionate (3 fixture repos, not N).
- **Authority**: user instruction (interview Q3 default) + issue #215.

## 2026-09-16 — D-59-6: Non-goals adopted from both issues

- **What**: No model-emitted exact tokens (the deterministic decider emits; the
  model only quotes); no new command verbs; no verdict-rule changes; no AWL
  runner adoption (stays row 58 / future consumer); interview semantics
  unchanged beyond the ask protocol (six slots, mandatory-question rule,
  upsert/review modes untouched); no majors (release freeze).
- **Why**: Interview default accepted (Q4); union of #215 anti-goals and #231
  non-goals.
- **Authority**: user instruction (interview Q4 default) + issues #215/#231.

## 2026-09-16 — D-59-7: argv authoritative; rendering derived, display-only, test-pinned

- **What**: `argv` is the command of record; `rendering` may be regenerated per
  platform family without changing the command; a rendering/argv divergence is
  a test failure, never a correctness surface.
- **Why**: #215 scope item 1 ("argv is authoritative; rendering is derived,
  display-only, test-pinned"); grounded in exec-argv semantics (execve(2)
  evidence row — programs receive argv arrays, not shell strings).
- **Authority**: issue #215 + external evidence. (Aligned with the superseded
  draft's D-59-5 determinism stance; that draft's `convergence`-unused-in-v1
  position is NOT adopted — see D-59-8.)

## 2026-09-16 — D-59-8: `convergence` names a state field that must measurably advance; discipline tests enforce it

- **What**: Every emitted continuation carries `convergence` naming the envelope
  state field expected to advance after execution; the per-class discipline
  tests execute the continuation in a fixture repo and assert the field moved.
- **Why**: #215 scope item 4 ("executing it advances the `convergence` field");
  folded row 49's execution semantics. The superseded draft's "included but not
  used in v1" (its D-59-9) is explicitly rejected by this decision — an
  unasserted convergence field would reintroduce the dead-end-loop class #215
  exists to close.
- **Authority**: issue #215 + issue #216 (folded row 49) semantics.

## 2026-09-16 — D-59-9: Evidence token = digest-equality, receiver-verifiable, nothing persisted

- **What**: `evidence` is a self-describing token whose hash equals the
  referenced receipt/report digest; receivers verify by recomputing the digest
  (schema package `sha256.ts` helpers); continuations are stateless projections
  — no continuation store.
- **Why**: #215 scope item 1; feature 25's content-bound receipt digests are
  merged and reusable.
- **Authority**: issue #215 + repository evidence (`sha256.ts`).

## 2026-09-16 — D-59-10: The continuation rides `next.continuation`; one hand-off surface

- **What**: The object lives at `next.continuation` on Envelope v2 (not a
  top-level field): it IS the machine form of `next.recommended`, so the
  hand-off grammar (`hand-off-fields@1`) gains one field row and skills/drivers
  keep a single hand-off surface.
- **Why**: #215 titles the object a "machine-checkable next-command"; the
  canonical turn contract owns hand-off fields; a second, parallel hand-off
  channel would fork the grammar.
- **Authority**: issue #215 + `TURN_CONTRACT.md` hand-off-fields ownership.

## Open offer (upsert-safe, needs user confirmation)

- Seed `docs/CAPABILITIES.md` from the template with the derived inventory and
  roles used by this SPEC's integration/role closures (same derived set as
  feature 52's design turn). Not done now — the file is a maintained substrate
  and the skill requires user confirmation to seed it.
