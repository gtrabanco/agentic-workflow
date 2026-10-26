---
type: feature
scope: standard
---

# 20 — legacy-shape

> One-line: the current 14-section shape, unmigrated — it must route and lint
> exactly as it does today.

## Objective

Prove the migration era is additive: a unit doc that never migrated keeps
routing and linting green.

## Why

Closed units are never migrated, and open units migrate at their next touch —
so the legacy shape outlives this change and cannot regress.

## User outcome

A legacy unit still answers a route and a verdict without an edit.

## Acceptance criteria

1. `unit-route --triage 20-legacy-shape` prints its block.
2. The Tasks bullets lint as `PASS (6/6)`.

## Impact

Nothing outside this fixture.

## Non-goals

No section re-cut.

## Future

none

## Future cost

none

## Applicable tests

n/a — no tests step for this unit

## Known pre-existing issues

none

## Tasks

- P1 — the first legacy phase (validator: `true` exits 0)
  Relevant files: scripts/fixtures/spec-by-reference/tree/docs/features/20-legacy-shape/SPEC.md
- P2 — the second legacy phase (validator: `true` exits 0)
  Relevant files: scripts/fixtures/spec-by-reference/tree/docs/features/20-legacy-shape/SPEC.md

## Evidence

| AC | What was run | Exit / digest | Output (≤2 lines) | Verified-by |
|---|---|---|---|---|
| 1 | `node scripts/unit-route.mjs --triage 20-legacy-shape` | exit 0 | the triage block | fixture |

## Progress log

- 2026-09-01 10:00 — P1 done → 0123456789abcdef0123456789abcdef01234567 — next: P2

## Next

P2.

## References

none
