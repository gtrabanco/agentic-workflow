## Descope guard (run before creating any issue during this unit)

A cheap way to look finished is to quietly convert unfinished SPEC scope into a
follow-up issue — the unit reads as done, the scope silently moved to the
backlog. Before creating **any** issue while executing this unit, classify it
with the fixed **descope test**:

- **Descope** — the issue's content overlaps a SPEC acceptance criterion or a
  phase task that is **not fully delivered** in this unit.
- **Discovered work** — everything else (genuinely new, outside the SPEC's
  promises) — record it as a proposal; only explicit user triage may file it.

**On a descope → STOP before creating the issue.** An issue may never be the
first record of a descope. The descope must first be recorded as an explicit,
**user-approved, dated SPEC amendment**:

1. Get explicit user approval for the descope **first** (ask; never
   self-authorize moving a criterion out of scope — the amendment row must
   never be written before approval is in hand).
2. **Only then** move the criterion/task out of the active `## Acceptance` (or
   `## Phases` ledger), and log it in the governing SPEC's `## Amendments`
   section (create the section if absent) with this canonical row format:
   ```
   - <YYYY-MM-DD> — descoped: "<criterion/task>" — approved by user — follow-up: #<n>
   ```
3. **Only when the user explicitly requests backlog creation**, create the
   follow-up issue and **link the amendment** in its
   body. Immediately after, edit the `## Amendments` row to replace the
   `#<n>` placeholder with the real issue number, and commit that edit — a
   row still reading the literal `#<n>` placeholder is unlinked and fails
   `audit-pr`'s symmetric check.

`audit-pr`'s scope-bleed gate and `product-audit`'s recurrence signal both key
off this same `## Amendments` log — it is the single authoritative record of
every descope, defined once here.
