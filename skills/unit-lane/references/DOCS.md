# Docs step

## Purpose

Docs-only units (changelog, template, migration) and the docs step for code
units. Updates documentation surfaces per project conventions.

## Inputs

- The unit's objective and tasks
- The project's documentation conventions from the agent guide
- Template/ directory layout

## Fixed output contract

Update the unit doc's **Progress log** and any project docs:

- Changelog updated per project conventions
- Template files updated if the unit changes a template
- Documentation map updated if new artifacts were created
- Each doc change committed with a conventional commit message

## Checklist (pass only if)

- [ ] All docs the unit demands are updated
- [ ] Changelog/templates follow the project's declared conventions
- [ ] Documentation map references resolve (no broken links)
- [ ] Changes committed on the correct branch with no unpushed changes
- [ ] Progress log entry records the commit sha and what was documented

## Forbidden

- Do not change code in the docs step — only doc surfaces
- Do not add docs the unit's scope does not demand
- Do not skip the docs step for a code unit when the catalog demands it
- Do not change the unit doc's Evidence or Progress sections here