## Ledger-append mechanism (`fix-in-unit` → fold-into-ledger sub-route)

When the *fold into the unit's ledger* sub-route (step 3 above) applies,
append one row to the open unit's `review-findings.md` — the same fold ledger
`review-change` and `audit-pr` write to, in their **fixed 7-column schema,
never redefined here**:

```
| id | file:line | axis | severity | class | route | folded |
```

The appended row: `folded` starts `no` (this skill never sets `folded: yes` —
that transition belongs solely to `/fold-findings`), and the `route` cell
carries a **provenance marker** identifying this row was born from a triage
verdict, not a review/audit pass: `triage #<n> <YYYY-MM-DD>` (the issue number
and today's date), e.g. `route: fold into phase — triage #86 2026-07-18`. The
marker sits **inside the existing `route` cell** — no new column, so
`fold-findings`, `workflow-status`, and the npm schema mirror all keep reading
the same 7 columns unchanged.

This is **not** a silent reclassification: the row's `severity`/`class`/`route`
are set once, here, by the disposition-owning skill's own dated, evidence-
grounded verdict — exactly the frozen-classification guarantee
`fold-findings` already enforces on rows `review-change`/`audit-pr` write.
`fold-findings` then processes the row like any other `folded: no` row in its
next run — one queue, no separate lane.

**`Closes #<n>` on the unit's own PR.** A `fix-in-unit` verdict never opens a
new PR: the issue closes via the **open unit's** existing PR — its body gains
a `Closes #<n>` line for this issue (or, if the unit's PR isn't open yet,
whoever opens it later adds the line then). State this explicitly in the
verdict's `Action taken:` field.

