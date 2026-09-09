# 45 — Decisions

> Product and engineering decisions for feature 45.

## AD-45-001 — Fallback default when model unavailable

- **Decision**: inherit (orchestrator's model)
- **Rationale**: safest path — the operator explicitly approved the orchestrator's model for the command; using it preserves correctness.
- **Date**: 2026-09-08

## AD-45-002 — Config granularity: per-skill

- **Decision**: per-skill, not per-pass
- **Rationale**: adversarial reviews spawn N parallel passes of the same skill — they share one chain, and the orchestrator distributes models round-robin from that chain. Per-pass would require the operator to enumerate every pass name.
- **Date**: 2026-09-08

## AD-45-003 — Global fallback location: extends `default`

- **Decision**: `default` accepts an array (extends existing shape)
- **Rationale**: avoids a new top-level key; `default` already represents the global fallback for commands.
- **Date**: 2026-09-08

## AD-45-004 — `auto` inclusion

- **Decision**: included in the model vocabulary, documented as operator-delegated
- **Rationale**: the operator explicitly wrote `"auto"` — it's a conscious choice to delegate, not a gap.
- **Date**: 2026-09-08

## AD-45-005 — Adversarial model distribution

- **Decision**: round-robin from the per-skill chain; wraps when N > chain.length
- **Rationale**: simple, deterministic, no new configuration needed.
- **Date**: 2026-09-08

## AD-45-006 — Unavailable-model and chain-exhaustion semantics (repair, SF-45-004)

- **Decision**: an ordered chain is tried in the operator's order and the first
  usable model wins (spawn-time, consuming skill's contract); a chain exhausted,
  empty, or absent degrades the pass **inline at the orchestrator's model** with
  the degrade stated in the report — never exit non-zero, never a spontaneous
  unapproved spawn. `resolve-passes` is an offline producer: it applies
  schema-level resolution only and exits non-zero only for config the strict
  validator rejects; `default: []` behaves as an absent default. Operationalizes
  AD-45-001 and issue #201's fail-closed rule (Mechanics 1 and 3).
- **Rationale**: the reviewed AC4/expectation 4 ("empty/exhausted chain exits
  non-zero") contradicted the recorded fallback decision AD-45-001; a
  deterministic offline producer cannot sample runtime availability, so
  availability judgement belongs to the consuming skill at spawn-time.
- **Date**: 2026-09-09

## Repair batch — 2026-09-09 (SF-45-001…SF-45-011)

- **Mechanical, intent-preserving (REPAIR class 1)** — SF-45-001 (dependency
  pointers corrected: feature 196 → feature 43/issue #196, feature 154 → issue
  #154), SF-45-002 (roadmap row 45 → `defined`, deps `43`), SF-45-005 (AC12
  tested an actually-unknown root key; `passes` is a known key of this feature),
  SF-45-006 (producer home = feature 43's `aw resolve-passes` with `.mjs`
  fallback, per issue #196; `packages/agentic-workflow` references removed),
  SF-45-008 (AC1/AC3 made objective; AC6 labelled `read-verified`), SF-45-009
  (tooling row attributes pi config validation to
  `packages/pi-agentic-workflow/src/config/schema.ts`), SF-45-010 (placeholder
  grep re-run bounded to the Product half as the box states), SF-45-011
  (Engineering half restored to template state — plan-feature writes it after a
  review PASS). Reviewed product intent unchanged in all of these.
- **Closure completion (REPAIR class 2, evidence acquired)** — SF-45-003
  (`docs/CAPABILITIES.md` exists unseeded: its 13 subsystem rows walked one-by-one
  plus 6 derived project subsystems; seeding the file offered to the user,
  init-workspace's job), SF-45-004 (semantics clarified as AD-45-006 above; AC4
  and expectation row 4 aligned to the recorded intent), SF-45-007 (AC13 added
  observing in-scope item 7 — GOLDEN_FIXTURE.md pass-routing smoke test).
- **Evidence**: issues #196, #201, #154 fetched 2026-09-09 (SPEC `### Evidence`
  rows frozen); roadmap rows and `packages/` inspected at HEAD.
