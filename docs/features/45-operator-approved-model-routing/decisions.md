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
