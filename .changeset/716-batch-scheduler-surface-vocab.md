---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/agentic-workflow-schema": minor
"batch-scheduler": minor
"init-workspace": minor
"triage-issue": minor
---

fix(batch-scheduler): the lane vocabulary is the project's, not this repository's tree (issue #716)

`surfaceKey` and `surfaceKeyFor` carried `skills/<name>`, `packages/<name>`,
`scripts`, `docs`, `template` and `.github` inline, so every project that is not
this monorepo degraded each issue to `surface-unknown`, opened one `general`
lane, emitted a `blind-spot` and lost every parallelism the sensor exists for.
`--infer-surfaces` — triage's only source for the `## Surfaces` block — re-parsed
the body through the same closed list, so its contract ("written from the
emitter, never hand-typed") was unfulfillable on a foreign tree.

The vocabulary now has one owner (`src/batch-scheduler/vocabulary.mjs`) and three
layers, in order:

- the **shipped roots**, always recognized, so no existing declaration and no
  section of this repository changes lane;
- the project's **declared roots** — the new base config section
  `batchScheduler.surfaces`, one project-relative directory per entry, written by
  `runner config set` and offered by `init-workspace`; a declaration is
  authoritative, so a directory it omits resolves to nothing instead of quietly
  opening a lane;
- the project's **own tree**, discovered only while nothing is declared (its
  top-level directories and their children, hidden directories and
  `node_modules` never lanes), which is what keeps a foreign tree schedulable
  before anyone configures it.

An empty list means *undeclared*, never "no lanes". A config the resolver refuses
degrades by name (`unavailable-surface-vocabulary-<cause>`) and leaves the
shipped roots alone. `--infer-surfaces` reads the same resolver and names the
`config set` line once on stderr when discovery answered; stdout stays the paste
block. The tree-root lane rule stops naming two folders: a key that is a strict
prefix of another row's key joins it, whatever the vocabulary.

No envelope change: no field, no `surface` enum, no `batch-plan@5`, no state-file
version bump — the vocabulary is data the producer reads.
