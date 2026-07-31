# 18 — normalized-repository-state · testing

## Contract checks

- `npx skills add . --list` discovers every skill.
- `grep -rq "REPOSITORY_STATE.md" template docs/workflow skills` verifies wiring.
- Each phase runs its task checks from `TASKS.md`.

Result: `npx skills add . --list` passed on 2026-07-31 and discovered 30 skills.

Golden fixture result: `qwen3:8b` passed tool-calling smoke on 2026-07-31
(`get_time`, parseable `{}` arguments) and passed a live text-reasoning run for
the Normalized Repository State conflict scenario across `design-feature`,
`plan-feature`, `execute-phase`, `review-change`, and `audit-pr`.

## Integration and failure checks

- Golden fixtures confirm a missing fact creates evidence, not an overwrite.
- Contradictory evidence creates a contradiction and resolver route.
- Documentation stays separate from implementation evidence.
- A new discovery snapshot supersedes stale state without replacing source truth.
