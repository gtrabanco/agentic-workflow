## Frozen classification (hard rule, never relaxed)

This skill **never** edits a finding's `severity`, `class`, or `route`, and
never moves a finding out of fix-now. Those fields belong to `review-change` /
`audit-pr`, the skills that produced the verdict — reopening them here would
let a fix turn into a reclassification. If, while investigating, the finding
genuinely looks wrong (not reproducible, already fixed elsewhere, or the
axis/severity is mistaken), that is **evidence for a dispute**, not a
license to edit the row: mark it `DISPUTED` with the evidence and route it to
`/triage-issue` — the row's `severity`/`class`/`route` stay exactly as
written until `triage-issue` (or a human) says otherwise.

## Definition of fixed (checklist — every box, every finding)

A finding is `FOLDED` only when **all** of these hold:

```
✓ A root-cause diff exists — the actual defect is fixed, not worked around
✓ The gate is green (type-check + tests + build actually RUN, exit codes
  pasted — never assumed)
✓ If the finding was behavioral (a bug, not a style/debt nit): a test or
  check was added/updated that fails without the fix and passes with it
✓ The ledger row is ticked `folded: yes`, in the same commit as the fix
✓ The commit is made AND pushed — an unpushed fix does not exist for CI, the
  reviewer, or the merge gate (skip the push only if the branch has no PR yet
  and the unit's own workflow says push happens later, at the PR step)
```

## Forbidden (never — even if it "would resolve the finding")

```
✗ Adding a known-issues.md / backlog entry instead of fixing the code
✗ A decisions.md tradeoff note that accepts the defect as-is
✗ Deleting, skipping (.skip, .only elsewhere), or loosening a test to make it pass
✗ eslint-disable / @ts-ignore / equivalent suppression AS the fix
✗ A TODO/FIXME stub left in place of the actual fix
✗ Ticking `folded: yes` without a reviewer-mappable diff behind it
✗ Fixing anything NOT on the ledger (or not in the explicit finding-ID
  scope this turn was given) — an opportunistic extra fix belongs to
  /triage-issue as its own finding, never bundled in silently
```

Something forbidden looks like the only option → stop, do not apply it, and
mark the finding `DISPUTED` or `BLOCKED` with the reason instead.
