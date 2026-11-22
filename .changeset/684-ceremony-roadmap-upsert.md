---
"@gtrabanco/agentic-workflow": patch
---

fix(ceremony): the roadmap row-upsert hands the writer a path, not the document

`ceremony roadmap row-upsert` read the roadmap into a local and passed that
string to the writer as the table it had to splice — while the writer takes the
file's *path* and opens it. Both arms therefore died before writing a byte: the
fix arm in `fixRowUpsert` and the feature arm in `rowUpsert`, each surfacing as a
`WriterError` opening a filename made of the whole roadmap (node reports
`ENAMETOOLONG`, bun `ENOENT`). Every fix unit that wanted to settle its `## Fixes`
row through the owner had no route but a hand edit — the defect that left row 680
`pending` after its PR opened.

The arm now passes `roadmapPath()` to both writers, drops the local read, and
drops the `next`/`written` pair that wrote the writer's receipt back to disk: a
receipt carries no `text` field, so that second write was the next crash waiting
behind the first. `upserted` reports the writer's own post-state verdict rather
than a blind `true`.

The regression case settles a fix row and a feature row end to end — the row, the
receipt, and the assertion that exactly one line of the document moved — and
fails at the previous head, where it used to accept `exit 0 || exit 1` and so
could never see the crash.
