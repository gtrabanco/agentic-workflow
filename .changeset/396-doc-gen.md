---
"@gtrabanco/pi-agentic-workflow": minor
"unit-lane": minor
"init-workspace": minor
---

feat(docs): a forced documentation task and a deterministic docs generator

A unit that ships code can no longer close its docs step with "all docs the unit
demands are updated": the step carries an explicit task naming **what** was
documented and **in which declared output format**, with a `--check` receipt.

`scripts/docs-generate.mjs` renders the repository's own artifacts — unit docs,
roadmap rows and the shipped code surface — into the format the project declared
in its `Docs site` block (`markdown`/`md`, `mdx`/`starlight`/`docusaurus`,
`html`, `latex`/`tex`). No declaration degrades to markdown and says so; a
declared value the generator cannot honor refuses instead of silently
downgrading. `--check` names every missing, stale and orphaned page and exits 1,
which is the drift signal a verification gate calls; a page whose source is gone
is deleted, so the generated tree never accumulates a retired surface.

`init-workspace` asks for the format, writes the block for a new project and
offers it additively, with consent, to an existing one.
