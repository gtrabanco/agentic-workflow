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

The owner-ordered extension widens the `## Fixes` row writer to the table it is
handed instead of one literal shape: the `## Fixes` section, its header words,
its column count and the column carrying the issue key are read from the
document, and the splice, the refusal and the receipt's verdict all read that
same resolution. A project whose table keys the issue in any column — the
reported `Folder | Topic | Status | Depends on | Issue`, or a bare numeric cell
instead of a link — now settles its row through the writer instead of being
refused as a missing table and settling it by hand. What it cannot resolve still
fails closed, but the refusal now names the constraint: no issue-keyed column,
two of them, a separator whose width disagrees with the header, or a section
with no header row. This repository's own four-column table is emitted
byte-for-byte as before.

The correction batch after the owner's external verify widens the cell parse
the shape layer rests on: a markdown-escaped pipe (`\|`) inside a cell is
content, not a column, so a row this repository's own roadmap carries
(`Folder \| Topic \| …`) answers `ok` on a good write and a key column sitting
after such a cell still finds its row — never a duplicate. The ceremony's
`row-upsert` also stops swallowing the flag the chosen arm cannot honour:
`--depends-on` on a fix unit and `--issue` on a feature unit are refused
`unknown-flag` before any byte moves, while each arm's own flags stay
honoured.
