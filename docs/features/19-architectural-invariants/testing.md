# 19 — architectural-invariants · testing

## Contract checks

- P1 template and workflow-document checks pass.
- P2 through P4 run the commands in `TASKS.md`.
- `npx skills add . --list` must discover every shipped skill.

## Integration and failure checks

- An absent invariant document records `n/a` and does not block a compatible repository.
- A declared invariant violation, introduction, or change stops for an explicit architectural decision.
- Frozen NRS facts are consumed when present; contradictory source evidence routes to `resolve-repository-state`.
- Repository inspection remains the authoritative implementation evidence.
