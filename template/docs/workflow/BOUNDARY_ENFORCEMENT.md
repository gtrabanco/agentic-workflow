# Boundary enforcement record

> **Written by the materialization round, never by hand.** `/init-workspace`
> creates this file from the template and `runner materialize apply`
> maintains it: one row per boundary the charter declares, recording which route
> the team chose for a `prose-only` answer and what that route produced. The
> column contract is `materialization@1` in the runner crate's README — this file
> is the record, never a second definition of its shape.

The charter answers *is this boundary enforced by a machine, or by prose only?*
(`## Project charter` → `Architectural boundaries`). A `prose-only` answer is
honest and it is the state the mapping note calls out: a boundary kept in a
reviewer's memory is not a boundary. This record is where that answer stops being
silent — every prose-only entry ends with one of three outcomes:

| Outcome | What it means | `artifact` carries |
|---|---|---|
| `scaffold` | the project's own rule file landed in this repository, and the charter answer was re-recorded as `machine: <mechanism>` | the rule file's path |
| `issue` | the team wants to build the rule itself, so the item was filed on the project's forge | the forge reference (`#<n>` or the issue URL) |
| `declined` | the team answered no; the decision is recorded with its reason instead of becoming silent debt | `—` |

A `declined` row is a decision, not a defect: the materialization check reports
it and moves on. A prose-only boundary with **no** row is the defect — that is
what `materialize check` fails on, and what an audit reports as a typed finding.

## The record

The first fenced line stamps the columns the file was written for. Keep one row
per boundary, in the charter's order. A row is rewritten in place when the
boundary's outcome changes; the writer never appends a history column, and the
day of the change is what `recorded` holds.

```text
boundary-enforcement@1
```

| boundary | enforcement | outcome | artifact | recorded |
|---|---|---|---|---|
| `<boundary>` | `machine: <mechanism>` \| `prose-only` | `scaffold` \| `issue` \| `declined` | `<path or forge reference, or —>` | `<YYYY-MM-DD>` |

Example rows (delete before shipping; a placeholder cell is an audit finding):

| boundary | enforcement | outcome | artifact | recorded |
|---|---|---|---|---|
| `domain` | `prose-only` | `scaffold` | `tools/boundary-rules/domain.json` | 2026-01-20 |
| `billing` | `prose-only` | `issue` | `#412` | 2026-01-20 |
