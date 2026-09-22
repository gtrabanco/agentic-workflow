## Descope guard (run before creating any issue during this unit)

A cheap way to look finished is to quietly convert unfinished unit scope into a
follow-up issue — the unit reads as done, the scope silently moved to the
backlog. Before creating **any** issue while executing this unit, classify it
with the fixed **descope test**:

- **Descope** — the issue's content overlaps an acceptance criterion, a step
  task, or an obligation row that is **not fully delivered** in this unit. A
  `planning-obligations.md` row (or the unit doc's embedded `### Obligations`
  table) is scope of the unit exactly like a criterion: moving one to "later"
  is a descope, needs the same dated user amendment, and flips the row to
  `deferred` only as part of that amendment (`pre-execution-review` owns the
  lifecycle).
- **Discovered work** — everything else (genuinely new, outside the unit's
  promises) — record it as a proposal; only explicit user triage may file it.

**On a descope → STOP before creating the issue.** An issue may never be the
first record of a descope. The descope must first be recorded as an explicit,
**user-approved, dated** entry in the unit doc's `## References` section (not
the unit doc's `## Future cost` section, which captures future scope additions
from the triage catalog, not step descopes):

1. Get explicit user approval for the descope **first** (ask; never
   self-authorize moving a criterion out of scope — the entry must
   never be written before approval is in hand).
2. **Only then** move the criterion/task out of the active `## Acceptance`
   (or `## Tasks` section), and record it in the unit doc's
   `## References` section (create the section if absent) with this
   canonical row format:
   ```
   - <YYYY-MM-DD> — descoped: "<criterion/task>" — approved by user — follow-up: #<n>
   ```
3. **Only when the user explicitly requests backlog creation**, create the
   follow-up issue and **link the amendment** in its
   body. Immediately after, edit the `## References` row to replace the
   `#<n>` placeholder with the real issue number, and commit that edit — a
   row still reading the literal `#<n>` placeholder is unlinked and fails
   `audit-pr`'s symmetric check.

`audit-pr`'s scope-bleed gate, `product-audit`'s recurrence signal and
`audit-pr`'s obligation-closure check all key off this same `## References` log
— it is the single authoritative record of every descope, defined once here.
Nothing else in the pre-execution route creates an issue: a missing or failed
`PLAN-REVIEW-PASS` is closed by `/review-plan`, never by a tracker item.