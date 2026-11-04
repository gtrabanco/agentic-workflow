# Docs step

## Purpose

Docs-only units (changelog, template, migration) and the docs step for code
units. Updates documentation surfaces per project conventions, and renders the
project's declared documentation format from what the repository already owns.

## Inputs

- The unit's objective and tasks
- The project's documentation conventions from the agent guide
- The `Docs site` block — `format`, `content-dir`, `build`, `map` — when the
  project declared one
- Template/ directory layout

## The documentation task is explicit, never implied

Every unit that ships code carries one task in its `## Tasks` list that names
**what was documented** and **in which declared output format**:

```
P<n> — Document what this unit shipped in <format>: <the artifacts it touched>
```

- **What was documented** is a surface, not a verb: the README section, the
  template block, the feature page, the unit doc's `## Impact`.
- **The declared format** is the project's `format` slot (`markdown`, `md`,
  `mdx`, `starlight`, `docusaurus`, `html`, `latex`, `tex`). With no
  declaration the task names `markdown` **and** the degradation the generator
  reported — never a silent default.
- A unit that ships no code (a chore, a docs-only unit) records `n/a: <reason>`
  instead; an absent task on a code unit is an incomplete docs step, not a
  style preference.

The declared format is a **projection**, never an authored surface (feature 65:
Markdown is the single source of truth). Render it, never hand-write it:

```text
bun scripts/docs-generate.mjs            # write the projection
bun scripts/docs-generate.mjs --check    # the drift receipt: exit 0, or the drift
bun scripts/docs-generate.mjs --dry-run  # the plan, writes nothing
```

The run is deterministic: two consecutive runs are byte-identical, so
`--check` exiting non-zero means a source moved and the projection did not.
The generator runs where the project's tree carries the workflow's scripts; a
tree that ships only the skills does not have the command yet, so the docs step
records that the projection is pending the generator's arrival in the project —
never a hand-written stand-in for a generated page.

## Fixed output contract

Update the unit doc's **`## Log`** and any project docs:

- The explicit documentation task above, with its artifacts and format named
- Changelog updated per project conventions
- Template files updated if the unit changes a template
- Documentation map updated if new artifacts were created
- Every README that describes a surface this unit changed now describes the
  shipped state — the root `README.md` for workflow-facing changes, the touched
  `packages/<pkg>/README.md` for a package's own surface — and the prose it
  superseded is deleted rather than left beside the new text
- The generated projection regenerated (`bun scripts/docs-generate.mjs`), and
  `--check` exiting 0 recorded in the `## Log`
- Each doc change committed with a conventional commit message

## Checklist (pass only if)

- [ ] The `## Tasks` list carries the documentation task, naming what was
      documented and the declared output format — or an evidenced `n/a` for a
      unit that ships no code
- [ ] Every README naming what this unit ships matches the tree: no claim the
      change disproves survives — a retired command, a stale count, a
      "none yet" beside shipped work — verified with
      `rg -n '<the retired claim>' README.md packages/*/README.md` returning
      nothing
- [ ] Superseded documentation is deleted in this change, and its replacement
      is named in the `## Log` entry
- [ ] The generated projection is fresh: `bun scripts/docs-generate.mjs --check`
      exits 0, and no generated file was hand-edited
- [ ] Changelog/templates follow the project's declared conventions
- [ ] Documentation map references resolve (no broken links)
- [ ] Changes committed on the correct branch with no unpushed changes
- [ ] `## Log` entry records the commit sha and what was documented

## Forbidden

- Do not change code in the docs step — only doc surfaces (running the
  generator rewrites its own projection directory, never a source)
- Do not add docs the unit's scope does not demand
- Do not skip the docs step for a code unit when the catalog demands it
- Do not hand-edit a generated file: the next run overwrites it and `--check`
  reports it as drift
- Do not rewrite the unit doc's recorded `## Log` evidence lines or its
  `## Findings` rows here — the carrier is append-only
