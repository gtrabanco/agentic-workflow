# Architectural invariants

> Optional. Keep this document only when your project has long-lived
> architectural constraints that autonomous changes must preserve.

Architectural invariants are repository constraints, not coding standards,
feature requirements, or implementation details. They change only through the
explicit architectural-decision path named by the project.

## How to use this document

One invariant per section. Make each rule independently checkable and cite
evidence from the repository. A missing document means no project invariants
are declared; workflow skills must remain compatible with that state.

```markdown
## AI-001 — <short rule>

- Rule: <property that must remain true>
- Rationale: <why it protects the repository>
- Applies to: <modules, public contracts, or change types>
- Evidence: <paths, tests, commands, or diagrams that establish the rule>
- Change authority: <decision record or named approval path>
```

## Invariants

Add project-specific entries here. Do not infer or accept a new or changed rule
from a feature SPEC, implementation, or passing test alone.
