---
type: feature
scope: standard
---

# 24 — migrated-open

> One-line: a re-cut unit whose OPEN row lives in `## Findings` — the router
> must read the doc, not a `review-findings.md` beside it.

## Specs

**S1 — the request.**
> Make the toy CLI's `export` command refuse an empty path.

## Impact

- **Consumes:** the toy CLI's argument parser.
- **Consumed by:** the CLI's error output.
- **Stops being true:** an empty path silently writes `./`.

## Non-goals

- No new flag.

## Future

none

## Future cost

none

## Applicable tests

n/a — no tests step for this unit

## Known pre-existing issues

none

## Tasks

- P1 — refuse an empty path (validator: `true` exits 0)
  (Implements: S1)
  Relevant files: src/toy.txt

## Findings

OPEN rows only.

| id | S# / file:line | axis | severity | class | route |
|---|---|---|---|---|---|
| F7 | S1 · `src/toy.txt:12` | code | med | source | fold into P1 |

## Log

- **L1** — 2026-10-04, the request, verbatim (`S1`): Make the toy CLI's `export`
  command refuse an empty path.

## Next

Fold F7 into P1.

## References

none
