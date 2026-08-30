# architecture-notes — 29-bounded-implementation-discovery

## Position and authority

```text
current SPEC/Plan receipts + phase planning evidence + clean current source
  -> implementation discovery (read-only)
     -> READY -> exact preparation continuity -> first implementation write
     -> REPLAN -> plan owner -> review-plan -> remap
     -> NEEDS-DESIGN -> human design -> review-spec -> plan/review -> remap
     -> BLOCKED -> obtain named evidence -> remap
```

Mapping cannot mutate or approve Product/Plan authority. Candidate review,
verification, and audit still run after implementation.

Mapping is delta validation over a Plan that already evidenced architecture,
affected topology, obligations, phase cuts, and validators. A missing material
Plan argument returns REPLAN; the mapper does not defer planning into execution.

## Source continuity

- Pre-map HEAD identifies tracked source authority.
- Dirty tracked/untracked paths outside current reviewed planning artifacts
  block mapping.
- Every cited path/symbol/test carries exact current evidence and participates
  in the evidence-manifest digest.
- READY may be followed only by unchanged HEAD or one direct descendant whose
  entire diff is the reviewed planning allowlist.
- First implementation write consumes the map. Any prior drift or later
  interrupted partial write requires a fresh map.

This is deliberately not a public wire schema. Feature-28 receipts provide
authority binding; the text map is the portable semantic handoff; AWL may keep
opaque durable evidence and consumption state.

## Context boundary

- Mapper receives frozen phase authority and repository discovery tools, not
  the authoring conversation or a request to reach READY.
- Writer receives the compact map and phase authority, not raw exploration
  history; the map carries confirmed phase-relevant planning-evidence ids.
- Semantic/memory adapters locate evidence; repository bytes/Git/tests decide.
- Same-model fresh context is useful but is not presented as model diversity.
- Candidate review inherits feature 28's first-findings batch and exact
  `CONVERGENCE-ANOMALY` second-cycle diagnosis; a loop count never grants PASS.

## Distribution and preflight

- Canonical root skill tree remains source; feature-27 Pi bundle script rebuilds
  packaged copies and parity tests them.
- NRS consumed: `2026-08-30-pre-execution-planning`.
- Architectural invariants: `n/a: no project invariants declared`.
- Preserves AD-002 bilingual human docs, AD-004 one implementation PR against
  `main`, AD-007 package authority, and feature-28 review boundaries.
