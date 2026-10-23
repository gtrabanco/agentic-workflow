## Ledger-append mechanism (`fix-in-unit` → fold-into-ledger sub-route)

When the *fold into the unit's ledger* sub-route (step 3 above) applies,
append one row to the open unit's findings carrier — probe the unit doc first: a
migrated unit (#308) carries its OPEN rows in `SPEC.md ## Findings` and never gains
a side file, a legacy unit keeps `review-findings.md`. It is the same fold ledger
`review-change` and `audit-pr` write to, in the **carrier's own fixed schema, never
redefined here** — the legacy 7-column row:

```
| id | file:line | axis | severity | class | route | folded |
```

and the migrated 6-column `findings-table@1` row (`id`, `S# / file:line`, `axis`,
`severity`, `class` = the owner that repairs it, `route` = the disposition), whose
rows are open by definition: closing one deletes the row and appends a `## Log` `F`
line. Writing a 7-column row, or a `folded` flip, into a migrated unit's table is a
carrier violation, not a formatting slip.

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
