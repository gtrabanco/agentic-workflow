---
type: feature
scope: standard
---

# 23 — migrated-broken

> One-line: a re-cut unit with four defects the linter must refuse — a task
> linked to no `S#`, a task linked to a missing `S#`, a `## Log` line whose kind
> token is not in the closed vocabulary, and an `S#` with no verbatim quote.

## Specs

**S1 — the request.**
> Add a `count` command that prints how many records are stored.

**S2 — a spec with no quote.**
This requirement was summarized instead of quoted, which the linter refuses.

## Impact

- **Consumes:** the toy CLI's record list.
- **Consumed by:** nothing.

## Non-goals

- No filtering.

## Future

none

## Future cost

none

## Applicable tests

n/a — no tests step for this unit

## Known pre-existing issues

none

## Tasks

- P1 — implement `count` (validator: `true` exits 0)
  (Implements: S1)
  Relevant files: src/toy.txt
- P2 — link a phase to a requirement that does not exist (validator: `true` exits 0)
  (Implements: S9)
  Relevant files: src/toy.txt
- P3 — a phase that links no requirement at all (validator: `true` exits 0)
  Relevant files: src/toy.txt

## Findings

OPEN rows only; none here.

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-10-03, the request, verbatim (`S1`): Add a `count` command that
  prints how many records are stored.
- **X1** — 2026-10-03, a log line whose kind token is outside the closed
  vocabulary.

## Next

Repair the phase links.

## References

none
