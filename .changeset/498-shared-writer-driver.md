---
"@gtrabanco/agentic-workflow": minor
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
  `--expect` on `annotate` / `expected` on `rowUpsert`/`fixrow` — a table that
  moved since the read refuses with `EDIT REFUSAL — stale-read …` naming both
  revisions.
