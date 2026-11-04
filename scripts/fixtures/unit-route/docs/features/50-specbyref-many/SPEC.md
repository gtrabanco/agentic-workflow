# 50 — specbyref-many

> A spec-by-reference feature unit with ≥3 S# requirements, no frontmatter.
> Tests that scope fallback reads ## Specs, deriving scope:standard.

## Specs

**S1 — the request.**
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

- P1 — implement notes command (validator: `true` exits 0)
  (Implements: S1)
  Relevant files: src/toy.txt
- P2 — handle empty case (validator: `true` exits 0)
  (Implements: S2)
  Relevant files: src/toy.txt
- P3 — handle non-empty case (validator: `true` exits 0)
  (Implements: S3)
  Relevant files: src/toy.txt

## Log

- 2026-11-04 10:00 — P1 implemented → abcdef1234567890

## Next

Run P2

## References

none