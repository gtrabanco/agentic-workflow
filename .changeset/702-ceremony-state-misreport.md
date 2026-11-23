---
"@gtrabanco/agentic-workflow": patch
"@gtrabanco/agentic-workflow-schema": patch
---

fix(702): the ceremony-state writers and the merge verdict stop misreporting

`ceremony findings` splices the carrier's table inside its section instead of
rebuilding the section, so the report-only prose `findings-table@1` keeps beside
the table survives every write; a fold appends the `F` line under the id it
closed and `append` accepts `--id`, so identity is kept and ids never jump from a
prose mention; the two carrier grammars have one owner, and a carrier parsed in
the other shape, a superseded six-column table, or a unit carrying both the doc
table and a legacy side ledger is a typed defect instead of a silent read.

`audit-pr-gate evaluate` reports each gate's own outcome and reason: a gate the
checkout could not evaluate is `unevaluatable` (`not-evaluated`, or the caller's
own reason) rather than a content failure nobody observed, a judged missing or
stale gate receipt is a `fail` naming its freshness status, and `unevaluatable`
joins the published gate-check-status family the schema package owns.
