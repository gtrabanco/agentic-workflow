---
type: feature
scope: standard
---

# 22 — migrated-done

> One-line: a re-cut unit whose every phase is recorded in `## Log` — the router
> must read the log, never a `## Progress log` section.

## Specs

**S1 — the request.**
> Rename the toy CLI's `list` command to `ls`.

## Impact

- **Consumes:** the toy CLI's command table.
- **Consumed by:** the toy CLI's help output.
- **Stops being true:** `list` is the command's name.
- **Ask before touching:** the CLI's public docs.

## Non-goals

- No alias for the old name.

## Future

none

## Future cost

none

## Applicable tests

n/a — no tests step for this unit

## Known pre-existing issues

none

## Tasks

- P1 — rename the command (validator: `true` exits 0)
  (Implements: S1)
  Relevant files: src/toy.txt
- P2 — update the help output (validator: `true` exits 0)
  (Implements: S1)
  Relevant files: docs/cli.md

## Findings

OPEN rows only; none here.

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|

## Log

- **L1** — 2026-10-02, the request, verbatim (`S1`): Rename the toy CLI's
  `list` command to `ls`.
- **P1** — 2026-10-02, command renamed · `0765432`.
- **P2** — 2026-10-02, help output updated · `0765432`.

## Next

The unit's work is done; the merge gate is next.

## References

none
