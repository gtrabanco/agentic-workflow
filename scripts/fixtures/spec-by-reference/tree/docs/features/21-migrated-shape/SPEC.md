---
type: feature
scope: standard
---

# 21 — migrated-shape

> One-line: the re-cut shape — `## Specs` quoting the owner, `## Tasks` linked
> to their `S#`, `## Findings` for OPEN rows, append-only `## Log`.

## Specs

**S1 — the request.**
> Add a `notes` command to the toy CLI that lists the stored notes.

**S2 — the empty case.**
> Running it with no notes prints `no notes` and exits 0.

## Impact

- **Consumes:** the toy CLI's note store.
- **Consumed by:** nothing yet.
- **Stops being true:** notes are write-only.
- **Ask before touching:** the note store's own schema.

## Non-goals

- No export format.

## Future

none

## Future cost

none

## Applicable tests

n/a — no tests step for this unit

## Known pre-existing issues

none

## Tasks

- P1 — implement `notes` (validator: `true` exits 0)
  (Implements: S1, S2)
  Relevant files: src/toy.txt
- P2 — document `notes` (validator: `true` exits 0)
  (Implements: S1)
  Relevant files: docs/notes.md

## Findings

OPEN rows only.

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-10-01, the request, verbatim (`S1`): Add a `notes` command to
  the toy CLI that lists the stored notes.
- **E1** — 2026-10-01, `true` · exit 0 · no output.
- **P1** — 2026-10-01, `notes` implemented · `0123456`.

## Next

P2.

## References

none
