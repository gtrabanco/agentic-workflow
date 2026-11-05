# 55 — specbyref-fenced-example

> A spec-by-reference feature unit with one real S# requirement and a fenced
> quote of the grammar that carries three more. A fenced block is quoted text,
> not requirements, so this unit is trivial.

## Specs

**S1 — the request.**
> Add a command.

The grammar the machine reads, quoted from the template:

```text
spec-requirement@1
requirement | **S1 — a.** | one requirement
requirement | **S2 — b.** | another requirement
requirement | **S3 — c.** | a third requirement
```

## Impact

none

## Non-goals

- Nothing else

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

- P1 — implement the command (validator: `true` exits 0)
  (Implements: S1)
  Relevant files: src/toy.txt

## Log

## Next

Run P1

## References

none
