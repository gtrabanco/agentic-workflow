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
- [ ] Future sweep: every `## Future` row resolved with the user (planned —
      registered on explicit request only —, kept deferred, or discarded, dated)
- [ ] Branch follows the project's Workflow conventions
- [ ] Commit messages follow conventional format (`type(scope): description`)
- [ ] PR body includes the Evidence section as verification record
- [ ] Index row settled via the crate's writer — feature: re-emit the row with
      `agentic-workflow roadmap docs/features/ROADMAP.md rowUpsert
      '{"nn":"<NN>","slug":"<slug>","status":"done · [#<pr>](<pr-url>)"}'`,
      every other cell as it is; fix: the `docs/fix/README.md` status cell — that
      index has no `NN` column, so `rowUpsert` (the roadmap's writer) does not
      apply to it. `bun scripts/roadmap-settle.mjs` exits 0 afterwards (issue
      #316: the settle is code, never prose)
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