---
"@gtrabanco/agentic-workflow": minor
"@gtrabanco/pi-agentic-workflow": patch
---

feat(writer): shared writer driver — collision-safe writes for shared documents

The runtime half of issue #498: `src/writer/driver.mjs` gives the repository's
shared documents one write path — key-based splice (the applier declares its
byte ranges, every other byte is carried through), optional CAS refusing with a
named `stale-read` when the file moved since the read, typed receipts, atomic
staging writes, and the closed `WRITER_REFUSAL_REASONS` vocabulary.

- `runWriterConformance(writer, { root })` (`src/writer/conformance.mjs`) is the
  shared suite every writer-driver instance passes before it ships; a driver
  that rewrites foreign bytes, drops lines, or accepts a stale read fails it.
- `src/writer/merges.mjs` ships the pure merge semantics the file-class git
  drivers run: `unionTableRows` (row union by key, per table block; same-row
  differing edits surface as a real conflict) and `structuralJsonMerge`
  (recursive union by key, differing leaves conflict).
- The roadmap writers are re-based on the driver: `rowUpsert`/`annotate` write a
  one-line splice (receipts unchanged), both accept the revision they read as
  `expected`, and `fixRowUpsert` adds the missing `## Fixes` row writer keyed by
  the issue number in its `[#N](url)` cell.
- The CLI gains `roadmap read` (the CAS loop's read half), `roadmap fixrow`, and
  `--expect` on `rowUpsert`/`annotate`/`fixrow` (the `expected` JSON field also
  works on `rowUpsert`/`fixrow`) — a table that
  moved since the read refuses with `EDIT REFUSAL — stale-read …` naming both
  revisions.
- `budgets` rebases the route keys its checker actually reads: a route carrying
  `routeEstimateMax`/`routeLinesMax` rebases with those keys, and a write of
  the dead scalar pair against such a route refuses loudly instead of
  answering `ok` with a silent no-op (triage finding 2); the legacy scalar
  shape still works.

The pi package's half: `skills/unit-lane/references/RELEASE.md` stops telling
the release step that a `## Fixes` row cannot be written ("no `NN` column, so
`rowUpsert` does not apply") — the settle checklist names `roadmap fixrow` as
the writer instead; a Fixes row is never a hand edit.
