# Workflow architectural invariants

> 🇪🇸 [Versión en español](WORKFLOW_INVARIANTS.es.md)

Architectural invariants are long-lived repository constraints. They protect the
boundaries that must remain true while features, fixes, specifications, and
implementation details evolve. They are constraints, not recommendations.

## Scope and boundaries

This workflow document defines the evaluation contract; it does not prescribe a
technology, architecture pattern, domain model, or a project's actual rules.
Projects may define their own rules in
`docs/architecture/ARCHITECTURAL_INVARIANTS.md` (or declare an equivalent path
in their documentation map).

Keep these concerns separate:

| Concern | Owner | May change it |
|---|---|---|
| Feature specification | Feature product and engineering halves | Feature design/planning process |
| Repository architecture | Architecture docs and project invariants | Explicit architectural decision |
| Workflow architecture | This repository's workflow contract | Explicit workflow decision and review |

A specification can constrain one feature, but it cannot silently relax a
repository invariant. Architecture evolution is not implementation evolution.

## Project invariant document

The optional project document lists stable rules with enough evidence for an
agent to check them. Use one entry per rule:

```markdown
## AI-001 — <short rule>

- Rule: <property that must remain true>
- Rationale: <why it protects the repository>
- Applies to: <modules, public contracts, or change types>
- Evidence: <paths, tests, commands, or diagrams that establish the rule>
- Change authority: <decision record or named approval path>
```

Good rules describe ownership, dependency direction, layer isolation, public
contract compatibility, extension boundaries, or repository organisation. Do
not use this document for style preferences, a feature backlog, a technology
choice without a stable boundary, or an implementation checklist.

## Evaluation protocol

Before proposing, planning, implementing, reviewing, or auditing an
architectural change:

1. Discover the declared invariant document from the project documentation map.
   If it is absent, record `n/a: no project invariants declared` and continue;
   existing repositories remain compatible.
2. When a frozen `docs/workflow/REPOSITORY_STATE.md` exists, consume its
   evidence-backed facts and accepted decisions first. Inspect the repository
   directly only for an absent fact. The repository remains the source of truth;
   contradictory evidence is routed to `resolve-repository-state`.
3. For every applicable invariant, classify the proposed change as exactly one
   of: `preserves`, `violates`, `introduces`, or `changes`.
4. Cite the invariant ID and repository evidence. Never infer a rule from an
   implementation preference or a feature SPEC.
5. A `violates`, `introduces`, or `changes` result stops the normal feature/fix
   path. Require an explicit architectural decision that records the rule,
   rationale, affected boundaries, compatibility impact, and verification plan.
   A skill may report the required decision; it may not create or accept it
   silently.
6. Once a decision exists, update the invariant document through the declared
   authority, then resume the appropriate design, planning, or execution path.

## Workflow responsibilities

| Workflow role | Required behaviour |
|---|---|
| `design-feature` and `plan-feature-from-issue` | Classify whether the proposed capability preserves or needs an architectural decision before marking product design complete. |
| `plan-feature` and `plan-feature-scaffold` | Record applicable invariants and the evidence/decision in the engineering half; do not turn a violation into a phase task. |
| `execute-phase` | Verify that the phase preserves recorded invariants before edits; stop on a violation or a needed architectural decision. |
| `review-change` | Authoritative for final diff quality, SPEC completeness, current-unit classification (fix-now / replan-in-unit / decision-required / proposal), and invariant preservation. Reports findings; posts exact-SHA REVIEW-PASS receipt on clean table. Never emits MERGE-READY. |
| `audit-pr` | Consumes current review-change REVIEW-PASS receipt (absent/stale → BLOCKED, never re-reviews diff). Owns delivery gates only (phases/docs/CI/mergeability/traceability/closure + receipt invariants result). Emits MERGE-READY or evidenced BLOCKED; never edits/merges. |

## Evidence and compatibility

Invariant evaluation is evidence-based. Tests, architecture checks, public API
contracts, dependency analysis, and cited repository paths are valid evidence;
documentation alone is not proof of implementation. Normalized repository state
is an optional shared evidence source, not a prerequisite and never a
replacement for inspecting the repository.

An invariant document may be introduced or changed only through the project's
explicit architectural-decision process. This prevents an implementation, its
tests, or its SPEC from becoming retroactive justification for drift.
