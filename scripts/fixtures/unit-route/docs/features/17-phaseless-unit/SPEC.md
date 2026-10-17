---
type: feature
scope: standard
---

# 17 — phaseless-unit

> One-line: unit with a Tasks section that carries no `P<n> —` bullet.

## Objective

A unit whose Tasks section is prose-only — no phase bullets at all.

## Why

This tests the fail-closed path in `firstUnfinishedPhase`: the router must
never emit a bare whole-unit command when no phase is parseable.

## Acceptance criteria

n/a

## Non-goals

Filling in the Tasks section.

## Future

none

## Future cost

none

## Applicable tests

n/a — no tests step for this unit

## Known pre-existing issues

none

## Tasks

This unit was planned with prose-only tasks — no `P<n> —` bullets exist.
The router must reject this at the execute route with a hard fail, not
fall back to a bare whole-unit command.

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |

## Progress log

## Next

## References

none