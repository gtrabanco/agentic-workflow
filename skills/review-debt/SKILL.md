---
name: review-debt
user-invocable: false
version: 5.0.0-canary.20261128.1
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal tech-debt transform pass of the agentic-workflow review pack —
  composed in-turn by review-change and product-audit; not a menu entry.
  Transforms the synthesized findings table into explicit debt items, each with
  a re-trigger condition; it does not rescan the diff. Findings only; never
  edits code.
---

# Review Tech Debt (internal)

Review-pack pass: follow this file inline as the routed step — findings only,
never edits, never refactors (identity and guardrails owned by
`skills/review-implementation/references/FINDER_CONTRACT.md` §Pass identity).

## Scope

Owned by `skills/review-implementation/references/FINDER_CONTRACT.md`
(§Transform discipline): the caller's synthesized findings table is this pass's
scope. Read the section before the transform — it owns the no-rescan rule and the
ownership decision the table already carries — and state the scope, the change
the table was synthesized over, at the top of the returned table.
Missing reference → STOP.

## Transform

The `Rows:` tally is `skills/review-implementation/references/FINDER_CONTRACT.md`
§Checklist discipline's contract applied to the table it was handed: every transform item below is evaluated, and each debt row is transformed or marked `n/a` with the reason it does not apply.

Turn the table's tech-debt-shaped rows (TODO/FIXME/HACK, duplication, stale or
orphaned abstractions, dead code, complexity hotspots, missing tests,
workarounds pinned to upstream fixes) into explicit, payable debt items:

✓ Restate each debt-shaped finding at `file:line` with what it defers
✓ Attribute it to the axis already recorded in the table — never re-litigate ownership
✓ Confirm every debt item carries a TRIGGER: the condition under which it must be
  paid (e.g. "3rd consumer appears", ">100k rows") — a debt item without a
  trigger is itself a finding. Scheduled deletions carry their trigger as the
  removal condition (S8: review-debt items become *scheduled deletions* whose
  TRIGGER names the removal — executable by a fold batch, not archival prose).
✓ Verify no current-unit debt was mislabeled non-blocking: current-unit work
  cannot be `postpone`/`tradeoff`/`wontfix` — a table showing one is flagged back
  to the classifier, never reclassified here
✓ Honor the dead-code exception: staged/planned code cross-checked against the
  roadmap/SPEC/TASKS is not dead code — mark *verify* when unsure, never assert
✓ **Deletion route.** A debt item that proposes removal of a surface carries
  `route: fix-now (delete)`, not `route: fix-now (repair)`. The TRIGGER
  specifies what proves the surface is safe to remove (e.g. "no consumer in
  grep <scope> returns >0").

## Return exactly

`Sev` and `Impact` are the two published closed sets (`BLOCKER | CRITICAL |
WARNING | SUGGESTION` and `blocking | docs-only | report-only`); their meanings
are owned by `review-implementation` (`CLASSIFY.md` §Severity ladder) — assign a
token, never a prose grade.

```
REVIEW TECH DEBT — scope: <scope>

| # | Finding | Sev | Impact | Evidence | Suggested fix |
|---|---------|-----|--------|----------|---------------|
| 1 | <what>  | BLOCKER|CRITICAL|WARNING|SUGGESTION | blocking|docs-only|report-only | <file:line> | <trigger + smallest action> |

Rows: <n> transformed, <n> with trigger, <n> findings, <n> n/a (<which + why>)
Summary: <1-2 sentences>
Decision: PASS | FAIL
```

For this pass, the Suggested fix column carries the TRIGGER — the condition
under which the debt must be paid — alongside the smallest action.

FAIL if any `BLOCKER`, `CRITICAL` or `WARNING` finding is open; PASS otherwise.
`SUGGESTION` findings never block — they surface in the caller's report as debt notes.

## Done when

- Every debt-shaped row of the synthesized table was transformed with evidence
  (`file:line`) or explicitly marked n/a with the reason.
- Every debt item carries a trigger; no current-unit debt was mislabeled.
- The fixed-format block above is returned — nothing more, nothing less — and
  no code was changed.
