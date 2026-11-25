---
name: review-a11y
user-invocable: false
version: 5.0.0-canary.20261125.1
author: "Gabriel Trabanco <1969593+gtrabanco@users.noreply.github.com>"
license: MIT
description: >
  Internal accessibility review pass of the agentic-workflow review pack —
  composed in-turn by review-change and product-audit; not a menu entry.
  Checks the changed user-facing surface for accessibility: semantics,
  keyboard, focus, contrast, and ARIA correctness — applies only to
  user-facing surfaces. Findings only; never edits code.
---

# Review Accessibility (internal)

Review-pack pass: follow this file inline as the routed step — findings only,
never edits, never refactors (identity and guardrails owned by
`skills/review-implementation/references/FINDER_CONTRACT.md` §Pass identity).

## Scope

Owned by `skills/review-implementation/references/FINDER_CONTRACT.md` (§Scope):
read it before the checklist and apply it as written, stating the scope at the
top of the returned table. Missing reference → STOP.

## Checklist

The tally is `skills/review-implementation/references/FINDER_CONTRACT.md`
§Checklist discipline's contract: `evaluated` equals this list's item count, and
`pass + findings + n/a` equals it — a count above the item count is fabricated.

✓ Semantic elements over generic ones (button not clickable div; headings in order; landmarks present)
✓ Every input has an associated label; every image an alt (empty alt only when decorative)
✓ Full keyboard operability of the changed surface (tab order, Enter/Space activation, Escape to dismiss)
✓ Focus management on dynamic changes (modals trap + restore focus; route changes move focus)
✓ Contrast of changed text/UI meets the project's declared level (default WCAG AA) — cite computed values where checkable
✓ ARIA used correctly and only when semantics can't do it (wrong ARIA is a `WARNING` finding)
✓ No information conveyed by color alone
✓ Motion/animation respects reduced-motion preferences (n/a if no motion added)
✓ Error messages programmatically associated with their fields

## Materiality bar

Owned by `skills/review-implementation/references/FINDER_CONTRACT.md`
(§Materiality bar): read it before the checklist and apply it as written — cite the rule it violates beside the evidence; never pad the table.
Missing reference → STOP.

## Return exactly

`Sev` and `Impact` are the two published closed sets (`BLOCKER | CRITICAL |
WARNING | SUGGESTION` and `blocking | docs-only | report-only`); their meanings
are owned by `review-implementation` (`CLASSIFY.md` §Severity ladder) — assign a
token, never a prose grade.

```
REVIEW ACCESSIBILITY — scope: <scope>

| # | Finding | Sev | Impact | Evidence | Suggested fix |
|---|---------|-----|--------|----------|---------------|
| 1 | <what>  | BLOCKER|CRITICAL|WARNING|SUGGESTION | blocking|docs-only|report-only | <file:line> | <smallest action> |

Checklist: <n> evaluated, <n> pass, <n> findings, <n> n/a (<which + why>)
Summary: <1-2 sentences>
Decision: PASS | FAIL
```

FAIL if any `BLOCKER`, `CRITICAL` or `WARNING` finding is open; PASS otherwise.
`SUGGESTION` findings never block — they route to the caller's triage step.

## Done when

- Every checklist item was evaluated with evidence (file:line or command output)
  or explicitly marked n/a with the reason.
- The fixed-format block above is returned — nothing more, nothing less — and
  no code was changed.
