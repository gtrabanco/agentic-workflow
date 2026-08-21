# Issue #134 acceptance reconciliation

The original issue body describes the pre-3.0 design in which every user-facing
skill emits a duplicated `## Machine envelope` section. That requirement is
superseded for this fix by the package-owned boundary described in
`SPEC.md` and `ACCEPTANCE.md`:

- `workflow-status` remains the strict Envelope v2 sensor producer.
- Driven worker skills return compact SkillOutcome v1 through the named package
  profiles and `renderOutputInstruction(skill)`.
- `parseTurn` accepts strict contracts, three named legacy repairs, and only the
  fixed native verdict formats; arbitrary prose and unrecoverable values fail.
- `WorkflowSnapshot` is compiled from caller-supplied documents and repository
  facts, preserving provenance, unknowns, and contradictions.
- `ship-roadmap` remains a native-banner conductor and is not a worker profile.

This reconciliation keeps the issue's original root-cause example as regression
coverage while replacing the duplicated inline-envelope acceptance criteria.
