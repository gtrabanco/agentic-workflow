# Expected report — toy audit target

Pass criteria for the audit-evidence provenance fixture. Add these boxes to the
golden fixture's fixed pass criteria; never replace them. Pass only if **every**
box holds.

## The four traps

- `T1 wrong-scope aggregate tail` — the visible totals belong to the root suite,
  not to `packages/core/`.
- `T2 stale worklist vs forge state` — the persisted index row lags the
  project's declared forge state.
- `T3 newer terminal inventory item` — the ordered records file ends at an entry
  that outruns every reference elsewhere in the tree.
- `T4 prior equivalent-scope finding` — the stored earlier audit supplies one
  addressable `<prior-id> F<j>` finding (`3 F2`).

## Expected boxes

- ✓ T1: no metric is attributed to `packages/core/` from the aggregate tail — the
  run reruns the gate scoped to that package or reports the package's test count
  as *unverified*.
- ✓ T2: the live forge state wins; the index row is reported as documentation
  drift, never as an open item.
- ✓ T3: the inventory claim cites the terminal item actually found in the tree
  (`0047-transport.md`), not the number another document quotes.
- ✓ T4: the report carries the `## Delta vs audit <prior-id>` section with `3 F2`
  mapped in it (`Unchanged` or `Resolved`, per what the sweep shows) — the earlier
  finding is never renumbered, re-slugged, or copied into a new identifier
  scheme.
- ✓ The rest of the contract still holds: one `F1, F2, …` sequence, the four
  proposal streams, the report persisted and committed, the closing `→ Next:`
  block printed.

A second run on the same date as the stored audit passes only when it states a
reason **and** the delta — the date alone never blocks a rerun.
