# The `nimio` disposition

A review produces findings the change does not need to repair. Today those are
forced through the same fold loop as a real defect: they take a row, a round and
a re-review, and nothing records why they were skipped. `nimio` is the
disposition that ends that: **it records, and it opens no round.**

## The floor

A finding is `nimio` when it is below the materiality floor, which is the
machine condition `scripts/correction-budget.mjs` reads — never a judgement made
while folding:

- its severity band is `below-floor` (the `SUGGESTION` end of the ladder — the
  ladder's tokens and their meanings are owned by
  [`CLASSIFY.md`](../../review-implementation/references/CLASSIFY.md) §Severity
  ladder), **or**
- its `impact` is `report-only` (the pre-existing advisory, a proposal, taste),
  whatever its severity.

Both cells are frozen when the row is persisted. Re-reading them to widen the
floor is a reclassification, which `fold-findings` never does.

## What it does

1. Writes one dated note in the unit's `known-issues.md`, in that ledger's own
   shape (`| # | Item | Why deferred | Re-trigger |`): the finding id, what it
   is, why it is below the floor, and **the condition that would make it
   material** — a date and a re-trigger, never "later".
2. Leaves the finding row in its carrier as resolved-by-disposition, quoting the
   note in the row's resolution evidence.
3. Replies `NIMIO <note-path>` for the finding. That is its per-finding output
   line; it is not `FOLDED`, not `DISPUTED`, not `BLOCKED`.

## What it never does

- Never becomes a `fix-now` row, and never earns a correction round: the budget
  prints the row as `nimio` and excludes it from `findings`.
- Never opens a follow-up issue. A note is not a backlog entry; the re-trigger
  condition is what brings it back, through triage, if it ever fires.
- Never substitutes for a real repair. A `BLOCKER` or `CRITICAL` row is above
  the floor by definition, so the disposition cannot be applied to it.

## The machine surface

```text
bun scripts/correction-budget.mjs --unit <unit-dir> [--rounds-spent <n>]
```

prints `nimio | <n>` and one line per note to write:

```text
nimio — F3 · docs/c.md · record known-issues.md (2026-11-09)
```

The count of a unit's `nimio` rows is subtracted before the budget is computed,
so a batch of below-floor findings cannot spend the round a real correction
needs.
