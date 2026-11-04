# 54 — specbyref-emphasis

> A spec-by-reference feature unit with ≥3 S# requirements, one of them carrying
> emphasis inside its title, and no frontmatter. The published grammar reads the
> title to the bold close, so all three count.

## Specs

**S1 — the *notes* command.**
> Add a notes command.

**S2 — the empty case.**
> Running it with no notes prints "no notes".

**S3 — the non-empty case.**
> Running it with notes prints them.

## Impact

none

## Non-goals

- No persistence layer

## Future

none

## Future cost

none

## Applicable tests

n/a — no tests step for this unit

## Known pre-existing issues

none

## Findings

none

## Tasks

- P1 — implement the notes command (validator: `true` exits 0)
  (Implements: S1)
  Relevant files: src/toy.txt

## Log

## Next

Run P1

## References

none
