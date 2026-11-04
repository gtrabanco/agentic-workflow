# Docs step

## Purpose

Docs-only units (changelog, template, migration) and the docs step for code
units. Updates documentation surfaces per project conventions.

## Inputs

- The unit's objective and tasks
- The project's documentation conventions from the agent guide
- Template/ directory layout

## Fixed output contract

Update the unit doc's **`## Log`** and any project docs:

- Changelog updated per project conventions
- Template files updated if the unit changes a template
- Documentation map updated if new artifacts were created
- Every README that describes a surface this unit changed now describes the
  shipped state — the root `README.md` for workflow-facing changes, the touched
  `packages/<pkg>/README.md` for a package's own surface — and the prose it
  superseded is deleted rather than left beside the new text
- Each doc change committed with a conventional commit message

## Checklist (pass only if)

- [ ] All docs the unit demands are updated
- [ ] Every README naming what this unit ships matches the tree: no claim the
      change disproves survives — a retired command, a stale count, a
      "none yet" beside shipped work — verified with
      `rg -n '<the retired claim>' README.md packages/*/README.md` returning
      nothing
- [ ] Superseded documentation is deleted in this change, and its replacement
      is named in the `## Log` entry
- [ ] Changelog/templates follow the project's declared conventions
- [ ] Documentation map references resolve (no broken links)
- [ ] Changes committed on the correct branch with no unpushed changes
- [ ] `## Log` entry records the commit sha and what was documented

## Forbidden

- Do not change code in the docs step — only doc surfaces
- Do not add docs the unit's scope does not demand
- Do not skip the docs step for a code unit when the catalog demands it
- Do not rewrite the unit doc's recorded `## Log` evidence lines or its
  `## Findings` rows here — the carrier is append-only