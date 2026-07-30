# 18 — normalized-repository-state · testing

## Contract checks

- `npx skills add . --list` discovers every skill.
- `grep -rq "REPOSITORY_STATE.md" template docs/workflow skills` verifies wiring.
- Each phase runs its task checks from `TASKS.md`.

## Integration and failure checks

- Golden fixtures confirm a missing fact creates evidence, not an overwrite.
- Contradictory evidence creates a contradiction and resolver route.
- Documentation stays separate from implementation evidence.
- A new discovery snapshot supersedes stale state without replacing source truth.
