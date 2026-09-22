# Release step

## Purpose

Close the unit: branch hygiene, PR creation, and forge reconciliation.

## Inputs

- The unit's completed SPEC.md (all sections current)
- The unit's Evidence section
- The project's Workflow conventions (branch/PR)

## Fixed output contract

Write into the unit doc's **References** section:

```
## References
- Closes #<N>
- PR: <url>
- Branch: <branch-name>
- Commit: <sha>
```

## Checklist (pass only if)

- [ ] PR created on `main` with `Closes #N` from the References section
- [ ] Branch follows the project's Workflow conventions
- [ ] Commit messages follow conventional format (`type(scope): description`)
- [ ] PR body includes the Evidence section as verification record
- [ ] Roadmap row updated to `done` (or `merged` per conventions)
- [ ] `git status --porcelain` is empty

## Allowed

- PR body references the unit's Evidence rows
- PR closes absorbed issues via `Closes #N`
- Roadmap annotation (folded → <NN>, superseded, re-scoped)

## Forbidden

- Never stack PRs — one PR per unit of work, always against `main`
- Never work on `main` directly
- Never close the unit without an opened PR
- Never alter the unit doc's Evidence or Progress after this step