# Decisions — fix/676-journal-errata-path

Dated decisions this unit rests on. Appended-only: a later correction is a new
dated row, never an edit of the row it corrects. Every row declares its scope
(`decision-scope@1`, owner: `skills/unit-lane/references/DESIGN.md`); a
`cross-unit` row would name the owner doc it was promoted to — none here, because
the rule lives in the published grammar the change edits
(`journal-fragment-grammar@1` + `journal-write-grammar@1` in the crate README,
declared as normative surfaces by the guide).

## Decisions

| id | decision | why | scope |
|---|---|---|---|
| D1 | The errata path is **(a) supersedes semantic + (b) documented recipe, composed**; **(c) lifecycle state is rejected**. The link is one `Supersedes` cell in the correcting entry's block, and `journal write --supersedes <fragment>` is its only producer. | `S5` lets the unit decide among the candidates, `S6` requires a byte/name marker to publish its vocabulary and be read by the lint, `S7` requires the refusal text, the skill's checklist and the package grammar to carry the convention. (c) via the name would change the identity grammar every consumer parses; (c) via the stale bytes contradicts `S9`'s "published fragment bytes are never rewritten" and `log-immutability`'s aggregator-only consumption. | unit-only |
| D2 | A slot is **one entry plus the corrections that declare it** — any chain length, read newest-first, each fragment naming the one immediately older than it and the oldest naming nothing. A duplicate, a skipped predecessor and an oldest fragment claiming a correction are all refused, naming every file. | `S11` requires the stale entry to be "visibly superseded/linked machine-checkably" and the aggregator to integrate the correction once; a chain (not a pair) is what a correction that itself goes stale needs. The aggregator's newest-wins consume (#675 D1) already lands the newest once, so no receipt shape moves. | unit-only |
| D3 | The marker's closed set publishes in the schema package (`JOURNAL_ERRATA_MARKERS` in `src/journal.ts`) and is declared by the guide's `journal-errata-marker` inventory row. The cell is **not** a `journal-entry@1` field, so `JOURNAL_ENTRY_VERSION`, the core field set and `journal-entry.schema.json` do not move. | `S6` + `S9`'s "closed vocabularies stay resident": three consumers (writer, carrier lint, aggregator) read the spelling, so one owner imports it; a canonical-entry field would bump the published type for a block-rendering concern and the open `metadata` map already exists for consumer fields. | unit-only |
| D4 | The errata path is **carrier-scoped**: `--supersedes` names a fragment still in the carrier. An entry already aggregated into `docs/LOGS.md` is corrected by a new append — the journal's own rule — and the writer's normal path already allows it. | `S9`/`S10`: nothing published is rewritten and no migration exists. The live incident's stale entry was still a pending fragment, which is the failure class this unit removes. | unit-only |
| D5 | The slot fragments the writer reads are ordered by the **aggregator's comparator** (timestamp descending, then branch, then name), not by directory order. | A correction names the slot's head, and "newest" must mean the same thing to the writer, the lint and the aggregator, or a correction could name a fragment the aggregator does not consider the entry. | unit-only |
| D6 | `S12`'s "the writer unchanged" reads as **the refusal path unchanged**: a plain second same-slot write still exits 2 and writes no byte, and `log-immutability` still refuses a hand edit or delete. | `S6` itself names `journal write --supersedes <fragment>` as the sanctioned write, so the issue contemplates a writer flag; the sentence's subject is what the *unwritten* paths must keep doing, which the corpus pins. Read the other way it would forbid the candidate `S5` explicitly allows. | unit-only |

## Assumptions

Cheap defaults taken instead of asking, dated and correctable:

- **A1 — 2026-11-21** — the marker's spelling is `Supersedes` (title case, the
  block's cell convention) and the CLI flag is `--supersedes`. Source: the
  grammar's own cell labels (`Commits`, `Files`, `Summary`, `Decisions`, `Next`)
  and the flag style of the existing writer (`--session`, `--content`). Effect:
  the schema constant's only value today; a second marker is a schema-const +
  block-cell + grammar-row change in one PR.
- **A2 — 2026-11-21** — a correction is a **narrative** entry only. Source: a
  mechanical fragment's bytes are `log render`'s exactly (`journal-fragment-
  grammar@1`), so it cannot carry a new cell without changing the mechanical
  entry's frozen bytes. Effect: `--supersedes` refuses `--kind mechanical` by
  name; a false mechanical fact is corrected by the next mechanical entry the
  hook writes, or by the session's narrative correction of the unit's story.
