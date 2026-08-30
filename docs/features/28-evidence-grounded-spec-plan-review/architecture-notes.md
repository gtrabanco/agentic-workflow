# architecture-notes — 28-evidence-grounded-spec-plan-review

## Authority flow

```text
human product authority
  -> design-feature + evidence grounding
  -> deterministic SPEC readiness (cannot approve)
  -> review-spec (read-only)
  -> plan-feature | plan-fix + evidence grounding
  -> deterministic Plan readiness (cannot approve)
  -> review-plan (read-only)
  -> feature 29 implementation discovery
  -> execute/verify
  -> review-change/fold only source-local findings
  -> audit-pr (sole MERGE-READY authority)
```

Product or Plan root-cause findings travel backward to their owner. They never
become permission for an executor or reviewer to amend authority.

The first review produces one complete unioned findings set, repaired as one
root-caused owner batch before one re-review. A second correction cycle emits a
convergence diagnosis and routes to Product, Plan, source, environment, or
runtime ownership; no retry/cycle budget owns correctness.

## Contract layers

- `packages/agentic-workflow-schema/src/` owns strict DTO normalization,
  canonical definitions, selectors, semantic validators, digests, freshness,
  bounds, diagnostics, test vectors, intents, profiles, evidence vocabulary,
  and transition decisions.
- Generated package-root JSON Schemas are non-authoritative structural
  projections from that definition.
- Skills own human-readable evidence questions, artifact review semantics,
  findings/obligation formats, and handoff language.
- Feature 27's Pi bundle script remains the sole writer of packaged skill
  copies; canonical root changes are rebuilt and byte-parity tested.
- AWL/other runtimes own persistence, authoring-event sequencing, identity
  enforcement, fresh sessions, model routes, retries, budgets, recovery, and
  terminal acknowledgement.

## Snapshot lineage

```text
Product bytes/context/source + artifactRevisionId
  -> SPEC snapshot digest
     -> SPEC review receipt
     -> Plan bytes/context/source + new artifactRevisionId + parent SPEC digest
        -> Plan snapshot digest
           -> Plan review receipt
```

An Engineering-half edit does not erase Product lineage because the SPEC stage
hashes the fixed Product projection. A Product edit creates a new parent digest
and invalidates all descendants. A Plan-only edit creates a new Plan digest.
Any authoring event rotates `artifactRevisionId`, including mutate/revert.

## Ledger ownership

- `planning-findings.md` is stage-aware review/repair evidence.
- `planning-evidence.md` (M/L) or the Engineering SPEC section (XS/S) is the
  compact source-backed argument for plan decisions and phase cuts. It is Plan
  authority; raw exploration history is not.
- The obligation ledger is the completeness map and is frozen with the Plan.
- `review-findings.md` remains candidate-code review evidence.
- `ACCEPTANCE.md` remains the anti-weakening validation authority.
- Git/SPEC/decisions remain authoritative; memory is advisory.

## Preflight

- NRS consumed: `2026-08-30-pre-execution-planning`.
- Architectural invariants: `n/a: no project invariants declared`.
- Preserves AD-002 bilingual human docs, AD-004 one implementation PR against
  `main`, and AD-007 strict package contract authority.
- Satisfied implementation prerequisite: feature 27 / PR #150 is merged and
  its Pi bundle/parity commands are available; revalidate them before P1.
