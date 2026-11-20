# The repository-state contract

The owner of the snapshot's shape and of its freshness rule. Both repository-state
skills cite this file — `discover-repository-state` writes the first snapshot
through it, `resolve-repository-state` is the only writer that replaces a frozen
fact or an accepted decision — and `runner repository-state` implements it.

The snapshot stays a frozen, reviewable representation of observed truth; the
repository remains the source of truth. What this contract adds is the one thing
the old snapshot could not answer: **does it still cover the tree it claims to
describe?**

## Why a date, and why a decision's date

`docs/workflow/REPOSITORY_STATE.md` froze two English-only statements as current
("interim… feature 57 restores them per release") and the owner reversed that
decision on 2026-10-27. Nothing in the artifact was wrong when it was written;
what was missing was any way to notice that a later decision had overtaken it —
so the architectural protocol kept ordering every session to consume the stale
row *before* inspecting the tree.

A snapshot is therefore judged twice, both computed:

- **contradiction** — an accepted decision dated **after** the snapshot's
  `covers-through` means the artifact no longer covers the tree it describes. The
  verdict is `stale` and the superseding decision is named. A snapshot is never
  consumed as current while it is stale.
- **expiry** — a `covers-through` past the declared TTL is `stale` with its
  measured age, because a tree moves faster than a snapshot is re-frozen.

## The block

```text
repository-state@1
field | where | contract
covers-through | the snapshot's field table | the last date the facts and decisions were verified against the tree, as YYYY-MM-DD — required, and never inferred from "created at"
decided | every accepted-decision row | the date the owner recorded that decision, as YYYY-MM-DD — required, and the freshness comparison's only input
superseded-by | a fact row whose status is stale | the decision id that superseded it; a stale fact without this record is refused, never guessed
status | every repository-fact row | exactly one of frozen, stale — stale means reported and no longer authoritative
verdict | the reader's receipt | exactly one of fresh, stale — fresh only when no decision is dated after covers-through and the snapshot is inside its TTL
re-freeze | a unit that reverses or supersedes an accepted decision | the recorded close step: resolve-repository-state writes the next snapshot, covers-through moves, and the superseding decision becomes a row
```

## How it is read

`runner repository-state [<snapshot>] [--ttl-days <n>] [--json]` prints
one deterministic block and exits `0` when the verdict is `fresh`, `1` when it is
`stale` or the document is refused, and `2` on a usage error.

The reader is read-only: it reports a stale snapshot and never repairs it.
Repairing is `resolve-repository-state`'s alone — the same rule the snapshot's
own header states.

## The protocol order it serves

`docs/workflow/WORKFLOW_INVARIANTS.md` § Evaluation protocol, step 2, is the
consumer: the snapshot is consumed **after** its freshness is checked, and a
contradiction is routed to the recorded re-freeze instead of being taken as
current truth. A unit that supersedes an accepted decision re-freezes the
snapshot as its own recorded close step — the snapshot's `covers-through` moves
with that unit, never with an unrelated one.
