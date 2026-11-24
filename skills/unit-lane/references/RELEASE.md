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

- [ ] PR created against the project's **default branch** (the `Branch` field's base, `main` in this repository) with `Closes #N` from the References section — one PR per unit, the rule the guide owns (`AGENTS.md` § Working rules)
- [ ] Future sweep: every `## Future` row resolved with the user (planned —
      registered on explicit request only —, kept deferred, or discarded, dated)
- [ ] Branch follows the project's Workflow conventions
- [ ] Commit messages follow conventional format (`type(scope): description`)
- [ ] PR body includes the Evidence section as verification record
- [ ] Index row settled via the crate's writer — feature: re-emit the row with
      `runner roadmap docs/ROADMAP.md rowUpsert
      '{"nn":"<NN>","slug":"<slug>","status":"done · [#<pr>](<pr-url>)"}'`,
      every other cell as it is; fix: write the row with
      `runner roadmap docs/ROADMAP.md fixrow
      '{"issue":"<N>","url":"<issue-url>","topic":"<slug>","status":"done · [#<pr>](<pr-url>)"}'`
      — the `## Fixes` writer keys the row by the issue number in its
      `[#N](url)` cell (issue #498: a Fixes row is never a hand edit). `runner roadmap-settle` exits 0 afterwards (issue
      #316: the settle is code, never prose)
- [ ] `git status --porcelain` is empty

## Allowed

- PR body references the unit's Evidence rows
- PR closes absorbed issues via `Closes #N`
- Roadmap annotation (folded → <NN>, superseded, re-scoped)

## Forbidden

- Never stack PRs — one PR per unit of work, against the project's **default branch** (owner: `AGENTS.md` § Working rules, including its one exception: an owner-ordered inline correction batch lands straight on the default branch with no branch or PR, and never on an agent's own initiative)
- Never work on the default branch directly
- Never close the unit without an opened PR
- Never alter the unit doc's Evidence or Progress after this step