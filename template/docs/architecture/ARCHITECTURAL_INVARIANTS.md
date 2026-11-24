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
- Enforcement: <machine: <mechanism> | prose-only>
- Evidence: <paths, tests, commands, or diagrams that establish the rule>
- Change authority: <decision record or named approval path>
```

The `Enforcement` bullet is the one a reader (and `runner materialize
check`) can decide: `machine: <mechanism>` names the lint rule, dependency
analysis or CI job that fails a violation, and `prose-only` is the honest
admission that nothing does. A section without the bullet is reported as a typed
finding, not as a stylistic gap — an invariant whose enforcement lives in a
reviewer's memory is an invariant that will be broken.

## Invariants

Add project-specific entries here. Do not infer or accept a new or changed rule
from a feature SPEC, implementation, or passing test alone.
